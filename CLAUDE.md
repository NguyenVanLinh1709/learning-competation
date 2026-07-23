@AGENTS.md

# MathBattle / "Dual Minds"

A 2-player (and solo) educational mini-game app built with **Expo 54 / React Native 0.81 / React 19**. Two players share one phone — the screen is split top/bottom, and player 2's half is rotated 180° so they sit across from each other. There are five game families (Math, Vocabulary, Color perception, Memory, Flag Quiz), each with a 2-player "battle" and a solo mode.

> ⚠️ **Expo has changed.** This is Expo SDK 54 with the new architecture enabled (`newArchEnabled: true`). Read the versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any native/Expo code — do not rely on older SDK patterns.

## Run / develop

```bash
npm run android      # expo start --android
npm run ios          # expo start --ios
npm run web          # expo start --web
npm start            # expo start (QR / dev menu)
npx tsc --noEmit     # typecheck (strict mode is on)
```

There is no test suite, no linter config, and no build/CI scripts — verify changes by running the app. App entry is `index.ts` → `App.tsx`.

## Architecture

- **Navigation** — `App.tsx` defines a single `@react-navigation/native-stack` navigator (`headerShown: false`, fade animations, gestures disabled on game/result screens). All routes are listed in `RootStackParamList` in `src/types/index.ts`. Screens take **no route params** — all cross-screen state flows through Zustand stores.
- **State** — Zustand (`src/store/*.ts`). One store per game mode plus shared stores. Stores hold config + live game state and expose action methods (`setConfig`, `initGame`, `submitAnswer`, `nextQuestion`, `resetGame`, …). State is in-memory only (no persistence); `resetGame` clears it between sessions.
- **Screens** — `src/screens/`. Each game mode is a 3-screen flow: **Setup → (Countdown) → Game → Result**.
- **Components** — small reusable pieces in `src/components/` (`AnswerButton`, `PlayerPanel`, `TimerBar`, and Vocab variants).
- **Question generation** — pure functions in `src/utils/*Generator.ts` produce the question arrays. Data files live in `src/data/` (`vocabularyData.ts`, `flagData.ts`, `countries.ts`).
- **Backend** — Supabase client at `src/lib/supabase.ts`. Used for leaderboard persistence (`leaderboardStore`) and player profiles (`profileStore`, initialized in `App.tsx` via `useProfileStore.getState().init()`). Avatar utilities in `src/lib/avatar.ts`.

### Game modes (and their stores)

| Family | 2-player store | Solo store | Screens prefix |
|---|---|---|---|
| Math | `gameStore` | `soloStore` | `*`, `Solo*` |
| Vocabulary | `vocabStore` | `vocabSoloStore` | `Vocab*`, `VocabSolo*` |
| Color perception | `colorBattleStore` | `colorPerceptionStore` | `ColorBattle*`, `Color*` |
| Memory | `memoryBattleStore` | `memoryStore` | `MemoryBattle*`, `Memory*` |
| Flag Quiz | `flagBattleStore` | `flagSoloStore` | `FlagBattle*`, `FlagSolo*` |

The Math battle screens use the unprefixed names `Setup/Countdown/Game/Result`. Utility screens reachable from `HomeScreen`: `FeedbackScreen`, `LeaderboardScreen`, `ProfileScreen`.

### Math operations

The Math family's `MathOperation` union (`src/types/index.ts`) is: `addition`, `subtraction`, `multiplication`, `division`, `mixed`, `conversion`, `fraction`, `sequence`, `count`, `comparison`. All are produced by `generateQuestions()` in `src/utils/questionGenerator.ts` via per-op `build*` helpers, and selected in `SetupScreen` / `SoloSetupScreen` (the `operations` + `modes` arrays). To add one: extend the union, add a `build*` helper + a `case` in `buildExpression`, add an entry to both setup screens' `modes` array, and add its i18n label.

A `Question` always renders as `text` (prompt) + 4 `choices` with a `correctIndex`. Two ops need special rendering and use a **marker string** in `text` that the render layer swaps out:
- `count` → `text: '__count__'` plus a `countIcons` array; `PlayerPanel` / `SoloGameScreen` render the icons instead of the text.
- `comparison` → `text` is `CMP_MAX` (`'__cmp_max__'`) or `CMP_MIN` (`'__cmp_min__'`); the 4 numbers are the `choices`. Render layers call `questionPrompt(text, t)` (exported from `questionGenerator.ts`) to resolve the marker to the localized "choose largest/smallest" prompt.

### Theming

- `useTheme()` (`src/hooks/useTheme.ts`) is the single entry point. It returns `{ isDark, C, G, toggle }` where `C` = colors and `G` = gradients, selected from `src/constants/theme.ts` (`DARK_*` / `LIGHT_*`).
- Dark/light state lives in `themeStore` (defaults to dark). Toggle it via the returned `toggle`, not by touching the store directly.
- Color palettes are defined once in `theme.ts` — add new tokens to the `ThemeColors` / `ThemeGradients` interfaces and to **both** the dark and light objects.

### Internationalization

- `src/i18n/translations.ts` holds `en`, `vi`, `zh` translation objects keyed by `LangCode`. The `Translations` type is the contract — every key must exist in all three languages.
- `languageStore` holds the active `lang` plus the resolved `t` object. Read strings via `useLanguageStore(s => s.t).<key>`; switch via `setLanguage(lang)` (defaults to `en`).
- When adding UI text, add the key to the `Translations` type and fill it in for `en`, `vi`, and `zh`.

## Conventions

- **TypeScript strict** is on; keep it clean (`npx tsc --noEmit`). Shared types live in `src/types/index.ts`.
- New screen ⇒ create it in `src/screens/`, add the route to `RootStackParamList`, and register it in `App.tsx`'s `Stack.Navigator`.
- New game state ⇒ a dedicated Zustand store mirroring the existing action-method pattern; do not pass params through navigation.
- All user-facing strings go through i18n; all colors/gradients go through `useTheme()` — no hard-coded hex in screens.
- Key deps: `expo-linear-gradient` (backgrounds/buttons), `expo-haptics` (answer feedback), `expo-image-picker` (Feedback screen only), `react-native-safe-area-context`. (`@react-native-async-storage/async-storage` is installed but not yet used — game state is in-memory.)
