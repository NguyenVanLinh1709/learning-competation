export type LangCode = 'en' | 'vi' | 'zh';

export interface Translations {
  // Meta
  langName: string;
  langFlag: string;

  // Home
  appTagline: string;
  selectSubject: string;
  subjectMath: string;
  subjectMathDesc: string;
  subjectScience: string;
  subjectScienceDesc: string;
  subjectGeo: string;
  subjectGeoDesc: string;
  play: string;
  soon: string;
  homeFooter: string;
  language: string;

  // Home mode selection
  battle: string;
  solo: string;

  // Solo setup
  soloSetup: string;
  soloTagline: string;
  yourName: string;
  timeLimitLabel: string;
  unlimited: string;
  startPractice: string;

  // Solo result
  soloComplete: string;
  playAgain: string;
  totalTimeStat: string;

  // Setup
  battleSetup: string;
  back: string;
  player1Tag: string;
  player2Tag: string;
  enterName: string;
  vs: string;
  difficultyLabel: string;
  easy: string;
  medium: string;
  hard: string;
  operationLabel: string;
  mixedOp: string;
  questionsLabel: string;
  startBattle: string;

  // Quit dialog
  quitTitle: string;
  quitMessage: string;
  quitAction: string;
  cancelAction: string;

  // Countdown
  getReady: string;

  // Result
  wins: (name: string) => string;
  draw: string;
  points: string;
  correctStat: string;
  wrongStat: string;
  avgTimeStat: string;
  rematch: string;
  backHome: string;

  // Vocab subject
  subjectVocab: string;
  subjectVocabDesc: string;

  // Vocab setup
  vocabSetup: string;
  vocabDifficultyLabel: string;
  vocabEasy: string;
  vocabEasyDesc: string;
  vocabMedium: string;
  vocabMediumDesc: string;
  vocabHard: string;
  vocabHardDesc: string;
  vocabExpert: string;
  vocabExpertDesc: string;
  startVocabBattle: string;
}

const en: Translations = {
  langName: 'English',
  langFlag: '🇺🇸',

  appTagline: 'FAST MATH · 2 PLAYERS · 1 PHONE',
  selectSubject: 'SELECT SUBJECT',
  subjectMath: 'Mathematics',
  subjectMathDesc: 'Addition · Subtraction · Multiplication · Division',
  subjectScience: 'Science',
  subjectScienceDesc: 'Physics · Chemistry · Biology',
  subjectGeo: 'Geography',
  subjectGeoDesc: 'Capitals · Flags · Countries',
  play: 'PLAY',
  soon: 'SOON',
  homeFooter: 'Turn the phone between players',
  language: 'LANGUAGE',

  battle: 'BATTLE',
  solo: 'SOLO',

  soloSetup: 'Solo Practice',
  soloTagline: 'PRACTICE ALONE · BEAT YOUR BEST',
  yourName: 'YOUR NAME',
  timeLimitLabel: 'TIME PER QUESTION',
  unlimited: '∞',
  startPractice: '🎯  START PRACTICE',

  soloComplete: 'Practice Complete!',
  playAgain: '🔄  PLAY AGAIN',
  totalTimeStat: '⏱ Total Time',

  battleSetup: 'Battle Setup',
  back: '‹ Back',
  player1Tag: 'PLAYER 1 — BOTTOM',
  player2Tag: 'PLAYER 2 — TOP',
  enterName: 'Enter name…',
  vs: 'VS',
  difficultyLabel: 'DIFFICULTY',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  operationLabel: 'OPERATION',
  mixedOp: 'Mix',
  questionsLabel: 'QUESTIONS',
  startBattle: '⚔️  START BATTLE',

  quitTitle: 'Quit Match',
  quitMessage: 'Are you sure you want to quit?',
  quitAction: 'Quit',
  cancelAction: 'Cancel',

  getReady: 'Get ready…',

  wins: (name) => `${name} WINS!`,
  draw: 'DRAW!',
  points: 'POINTS',
  correctStat: '✅ Correct',
  wrongStat: '❌ Wrong',
  avgTimeStat: '⚡ Avg Time',
  rematch: '🔄  REMATCH',
  backHome: '← Back to Home',

  subjectVocab: 'English Vocab',
  subjectVocabDesc: 'Animals · Fruits · Colors · More',

  vocabSetup: 'Vocab Battle Setup',
  vocabDifficultyLabel: 'DIFFICULTY',
  vocabEasy: 'Easy',
  vocabEasyDesc: 'Animals · Fruits · Colors · School',
  vocabMedium: 'Medium',
  vocabMediumDesc: 'Actions · Family · Body · Food',
  vocabHard: 'Hard',
  vocabHardDesc: 'Places · Transport · Weather · Verbs',
  vocabExpert: 'Expert',
  vocabExpertDesc: 'All + Adjectives',
  startVocabBattle: '📖  START VOCAB BATTLE',
};

const vi: Translations = {
  langName: 'Tiếng Việt',
  langFlag: '🇻🇳',

  appTagline: 'TOÁN NHANH · 2 NGƯỜI · 1 ĐIỆN THOẠI',
  selectSubject: 'CHỌN MÔN HỌC',
  subjectMath: 'Toán học',
  subjectMathDesc: 'Cộng · Trừ · Nhân · Chia',
  subjectScience: 'Khoa học',
  subjectScienceDesc: 'Vật lý · Hóa học · Sinh học',
  subjectGeo: 'Địa lý',
  subjectGeoDesc: 'Thủ đô · Quốc kỳ · Quốc gia',
  play: 'CHƠI',
  soon: 'SẮP RA',
  homeFooter: 'Xoay điện thoại giữa hai người chơi',
  language: 'NGÔN NGỮ',

  battle: 'ĐẤU',
  solo: 'SOLO',

  soloSetup: 'Luyện tập một mình',
  soloTagline: 'LUYỆN TẬP · PHÁ KỶ LỤC BẢN THÂN',
  yourName: 'TÊN BẠN',
  timeLimitLabel: 'THỜI GIAN MỖI CÂU',
  unlimited: '∞',
  startPractice: '🎯  BẮT ĐẦU LUYỆN TẬP',

  soloComplete: 'Hoàn thành luyện tập!',
  playAgain: '🔄  CHƠI LẠI',
  totalTimeStat: '⏱ Tổng thời gian',

  battleSetup: 'Thiết lập trận đấu',
  back: '‹ Quay lại',
  player1Tag: 'NGƯỜI CHƠI 1 — DƯỚI',
  player2Tag: 'NGƯỜI CHƠI 2 — TRÊN',
  enterName: 'Nhập tên…',
  vs: 'VS',
  difficultyLabel: 'ĐỘ KHÓ',
  easy: 'Dễ',
  medium: 'Vừa',
  hard: 'Khó',
  operationLabel: 'PHÉP TÍNH',
  mixedOp: 'Hỗn hợp',
  questionsLabel: 'SỐ CÂU HỎI',
  startBattle: '⚔️  BẮT ĐẦU TRẬN',

  quitTitle: 'Thoát trận?',
  quitMessage: 'Bạn có chắc muốn thoát không?',
  quitAction: 'Thoát',
  cancelAction: 'Hủy',

  getReady: 'Chuẩn bị…',

  wins: (name) => `${name} THẮNG!`,
  draw: 'HÒA!',
  points: 'ĐIỂM',
  correctStat: '✅ Đúng',
  wrongStat: '❌ Sai',
  avgTimeStat: '⚡ Thời gian TB',
  rematch: '🔄  CHƠI LẠI',
  backHome: '← Trang chủ',

  subjectVocab: 'Từ vựng Anh',
  subjectVocabDesc: 'Động vật · Trái cây · Màu sắc · Thêm',

  vocabSetup: 'Thiết lập Từ vựng',
  vocabDifficultyLabel: 'ĐỘ KHÓ',
  vocabEasy: 'Dễ',
  vocabEasyDesc: 'Động vật · Trái cây · Màu sắc · Đồ dùng học tập',
  vocabMedium: 'Vừa',
  vocabMediumDesc: 'Hành động · Gia đình · Cơ thể · Thức ăn',
  vocabHard: 'Khó',
  vocabHardDesc: 'Địa điểm · Giao thông · Thời tiết · Động từ',
  vocabExpert: 'Chuyên gia',
  vocabExpertDesc: 'Tất cả + Tính từ',
  startVocabBattle: '📖  BẮT ĐẦU TỪ VỰNG',
};

const zh: Translations = {
  langName: '中文',
  langFlag: '🇨🇳',

  appTagline: '快速数学 · 双人对战 · 共用手机',
  selectSubject: '选择科目',
  subjectMath: '数学',
  subjectMathDesc: '加法 · 减法 · 乘法 · 除法',
  subjectScience: '科学',
  subjectScienceDesc: '物理 · 化学 · 生物',
  subjectGeo: '地理',
  subjectGeoDesc: '首都 · 国旗 · 国家',
  play: '开始',
  soon: '即将推出',
  homeFooter: '两位玩家之间翻转手机',
  language: '语言',

  battle: '对战',
  solo: '单人',

  soloSetup: '单人练习',
  soloTagline: '独自练习 · 超越自我',
  yourName: '您的名字',
  timeLimitLabel: '每题时限',
  unlimited: '∞',
  startPractice: '🎯  开始练习',

  soloComplete: '练习完成！',
  playAgain: '🔄  再来一次',
  totalTimeStat: '⏱ 总用时',

  battleSetup: '对战设置',
  back: '‹ 返回',
  player1Tag: '玩家 1 — 下方',
  player2Tag: '玩家 2 — 上方',
  enterName: '输入名字…',
  vs: 'VS',
  difficultyLabel: '难度',
  easy: '简单',
  medium: '中等',
  hard: '困难',
  operationLabel: '运算类型',
  mixedOp: '混合',
  questionsLabel: '题目数量',
  startBattle: '⚔️  开始对战',

  quitTitle: '退出比赛',
  quitMessage: '确定要退出吗？',
  quitAction: '退出',
  cancelAction: '取消',

  getReady: '准备好了吗…',

  wins: (name) => `${name} 获胜！`,
  draw: '平局！',
  points: '分',
  correctStat: '✅ 正确',
  wrongStat: '❌ 错误',
  avgTimeStat: '⚡ 平均用时',
  rematch: '🔄  再来一局',
  backHome: '← 返回主页',

  subjectVocab: '英语词汇',
  subjectVocabDesc: '动物 · 水果 · 颜色 · 更多',

  vocabSetup: '词汇对战设置',
  vocabDifficultyLabel: '难度',
  vocabEasy: '简单',
  vocabEasyDesc: '动物 · 水果 · 颜色 · 学校',
  vocabMedium: '中等',
  vocabMediumDesc: '动作 · 家庭 · 身体 · 食物',
  vocabHard: '困难',
  vocabHardDesc: '地点 · 交通 · 天气 · 动词',
  vocabExpert: '专家',
  vocabExpertDesc: '全部 + 形容词',
  startVocabBattle: '📖  开始词汇对战',
};

export const TRANSLATIONS: Record<LangCode, Translations> = { en, vi, zh };
