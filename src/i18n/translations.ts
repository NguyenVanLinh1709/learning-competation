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

  getReady: 'Get ready…',

  wins: (name) => `${name} WINS!`,
  draw: 'DRAW!',
  points: 'POINTS',
  correctStat: '✅ Correct',
  wrongStat: '❌ Wrong',
  avgTimeStat: '⚡ Avg Time',
  rematch: '🔄  REMATCH',
  backHome: '← Back to Home',
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

  getReady: 'Chuẩn bị…',

  wins: (name) => `${name} THẮNG!`,
  draw: 'HÒA!',
  points: 'ĐIỂM',
  correctStat: '✅ Đúng',
  wrongStat: '❌ Sai',
  avgTimeStat: '⚡ Thời gian TB',
  rematch: '🔄  CHƠI LẠI',
  backHome: '← Trang chủ',
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

  getReady: '准备好了吗…',

  wins: (name) => `${name} 获胜！`,
  draw: '平局！',
  points: '分',
  correctStat: '✅ 正确',
  wrongStat: '❌ 错误',
  avgTimeStat: '⚡ 平均用时',
  rematch: '🔄  再来一局',
  backHome: '← 返回主页',
};

export const TRANSLATIONS: Record<LangCode, Translations> = { en, vi, zh };
