// Dependency-free vocabulary generator for "English Vocab" mode.
//
// Why this shape: no free API cleanly enumerates kid-friendly word lists by
// category (Datamuse rel_*/ml= return noisy WordNet senses — "cat" pulls in
// "regurgitate"). So the English words are a CURATED seed list per category
// (correct + age-appropriate), and the APIs do what they're genuinely good at:
//
//   • MyMemory  — translate each word EN -> VI (no key, 5k chars/day anon;
//                 pass --email=you@x.com to share the 50k/day pool).  ← the tedious part
//   • Datamuse  — frequency lookup (md=f) -> auto difficulty 1..4.    (no key, 100k/day)
//
// It NEVER edits src/data/vocabularyData.ts directly. It writes a reviewable
// block to scripts/vocab-generated.ts — machine translation is imperfect for a
// kids' app, so you eyeball the Vietnamese, then paste in what you keep.
//
//   node scripts/generateVocab.js                          # all categories
//   node scripts/generateVocab.js --email=you@example.com  # bigger MyMemory quota
//   node scripts/generateVocab.js --only=animals,verbs
//
// Node 18+ (global fetch). Tested on Node 22.

const fs = require('fs');
const path = require('path');

// ─── CLI args ────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);
const EMAIL = typeof args.email === 'string' ? args.email : '';
const DELAY_MS = Number(args.delay) || 600; // politeness gap for MyMemory
const OUT = typeof args.out === 'string' ? args.out : 'scripts/vocab-generated.ts';
const ONLY = typeof args.only === 'string' ? new Set(args.only.split(',')) : null;

// ─── Curated seeds — clean, kid-friendly, mostly NOT already in the bank ─────
// (Anything already present is skipped automatically via dedup.)
const SEEDS = {
  animals: ['wolf','fox','deer','goat','donkey','camel','dolphin','whale','shark','crab','octopus','penguin','owl','eagle','parrot','peacock','kangaroo','panda','zebra','giraffe','hippo','crocodile','turtle','squirrel','bat','mouse','goose','turkey','ant','spider'],
  fruits: ['kiwi','papaya','guava','plum','apricot','fig','blackberry','blueberry','raspberry','melon','pomegranate','avocado','tangerine','lime','date','olive','jackfruit','longan','rambutan','persimmon'],
  colors: ['gray','gold','silver','beige','violet','indigo','turquoise','maroon','navy','cream','magenta','cyan'],
  school: ['classroom','teacher','student','board','chalk','marker','calculator','globe','map','dictionary','homework','exam','lesson','folder','paper','paint','brush','locker','schoolbag','grade'],
  actions: ['cook','clean','wash','open','close','push','pull','throw','catch','climb','fall','sit','stand','talk','listen','smile','cry','kick','build','fix'],
  family: ['uncle','aunt','cousin','nephew','niece','husband','wife','son','daughter','baby','twin','parent','child','relative','grandparent'],
  body: ['head','hair','eye','ear','nose','mouth','tooth','tongue','neck','shoulder','arm','elbow','finger','leg','knee','foot','toe','back','heart','stomach'],
  food: ['bread','rice','noodle','soup','egg','cheese','butter','sugar','salt','honey','cake','cookie','candy','chocolate','sandwich','pizza','burger','sausage','yogurt','jam'],
  places: ['hospital','market','park','beach','mountain','river','forest','farm','zoo','museum','library','airport','station','restaurant','hotel','bridge','island','village','city','factory'],
  transport: ['train','plane','ship','boat','bicycle','motorbike','truck','taxi','helicopter','subway','tram','scooter','van','ambulance','rocket','ferry','sled','wagon','jeep','yacht'],
  weather: ['rain','snow','wind','cloud','storm','thunder','lightning','fog','sun','rainbow','ice','frost','hail','breeze','sunny','cloudy','windy','foggy','humid','warm'],
  verbs: ['bring','buy','sell','give','take','find','lose','keep','send','meet','leave','enter','begin','finish','grow','change','choose','decide','remember','forget'],
  adjectives: ['tall','short','heavy','light','soft','hard','clean','dirty','empty','full','sharp','smooth','loud','quiet','sweet','sour','bright','dark','wet','dry'],
};
const PREFIX = {
  animals:'ani', fruits:'fru', colors:'col', school:'sch', actions:'act', family:'fam',
  body:'bod', food:'foo', places:'pla', transport:'tra', weather:'wea', verbs:'vrb', adjectives:'adj',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const titleCase = (w) => w.charAt(0).toUpperCase() + w.slice(1);

// Frequency (occurrences per million words, Datamuse md=f) -> difficulty 1..4.
function freqToDifficulty(f) {
  if (f >= 40) return 1;
  if (f >= 8) return 2;
  if (f >= 1.5) return 3;
  return 4;
}

// ─── Existing words: skip anything already in the bank ───────────────────────
function loadExistingEnglish() {
  const file = path.join(__dirname, '..', 'src', 'data', 'vocabularyData.ts');
  const set = new Set();
  try {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(/en:\s*'([^']+)'/g)) set.add(m[1].toLowerCase());
  } catch {
    /* file optional */
  }
  return set;
}

// ─── Datamuse: frequency of one exact word -> difficulty ─────────────────────
async function fetchDifficulty(word) {
  const url = `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=f&max=1`;
  try {
    const res = await fetch(url);
    if (!res.ok) return 2;
    const rows = await res.json();
    const tags = rows[0]?.tags || [];
    const fTag = tags.find((t) => t.startsWith('f:'));
    return freqToDifficulty(fTag ? parseFloat(fTag.slice(2)) : 0);
  } catch {
    return 2; // network hiccup -> sensible default, never crash the run
  }
}

// ─── MyMemory: EN -> VI ──────────────────────────────────────────────────────
async function translate(word) {
  const de = EMAIL ? `&de=${encodeURIComponent(EMAIL)}` : '';
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|vi${de}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MyMemory ${res.status}`);
  const data = await res.json();
  if (data.responseStatus !== 200 && data.responseStatus !== '200') {
    throw new Error(`MyMemory: ${data.responseDetails || data.responseStatus}`);
  }
  let vi = String(data.responseData?.translatedText || '').trim();
  if (!vi || vi.toLowerCase() === word.toLowerCase()) return null; // echoed source
  if (vi.length > 40) return null;                                  // a sentence, not a gloss
  return vi.charAt(0).toUpperCase() + vi.slice(1);
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const seenEn = loadExistingEnglish();
  const blocks = [];
  let total = 0;

  const cats = Object.keys(SEEDS).filter((c) => !ONLY || ONLY.has(c));

  for (const cat of cats) {
    console.log(`\n[${cat}] translating ${SEEDS[cat].length} words…`);
    const lines = [];
    let n = 0;

    for (const raw of SEEDS[cat]) {
      const en = raw.toLowerCase();
      if (seenEn.has(en)) { console.log(`  · ${raw} (already in bank, skip)`); continue; }

      let vi;
      try {
        vi = await translate(en);
      } catch (e) {
        console.log(`  ! ${raw}: ${e.message} — likely daily quota, stopping`);
        break; // keep what we have so far
      }
      await sleep(DELAY_MS);
      if (!vi) { console.log(`  ? ${raw}: no usable translation, skip`); continue; }

      const difficulty = await fetchDifficulty(en);
      seenEn.add(en);
      n += 1;
      const id = `g_${PREFIX[cat]}_${String(n).padStart(2, '0')}`;
      lines.push(
        `  { id: '${id}', en: '${titleCase(en)}', vi: '${vi.replace(/'/g, "\\'")}', ` +
          `category: '${cat}', difficulty: ${difficulty} },`,
      );
      console.log(`  ✓ ${titleCase(en)} → ${vi}  (d${difficulty})`);
    }

    if (lines.length) {
      blocks.push(`  // ── ${cat} (generated) ──\n${lines.join('\n')}`);
      total += lines.length;
    }
  }

  const out =
    `import type { VocabWord } from '../src/types';\n\n` +
    `// AUTO-GENERATED by scripts/generateVocab.js — REVIEW the Vietnamese\n` +
    `// (machine translation) before merging into src/data/vocabularyData.ts.\n` +
    `// Generated: ${new Date().toISOString()}\n\n` +
    `export const GENERATED_VOCAB: VocabWord[] = [\n` +
    blocks.join('\n\n') +
    `\n];\n`;

  fs.writeFileSync(path.join(__dirname, '..', OUT), out, 'utf8');
  console.log(`\n✅ ${total} words written to ${OUT}`);
  console.log(`   Review the Vietnamese, then paste the entries you keep into`);
  console.log(`   src/data/vocabularyData.ts (drop the import/export wrapper).`);
}

main().catch((e) => {
  console.error('\nFatal:', e);
  process.exit(1);
});
