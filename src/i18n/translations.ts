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
  play: string;
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
  convertOp: string;
  fractionOp: string;
  sequenceOp: string;
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

  // Vocab solo
  vocabSoloSetup: string;
  vocabSoloTagline: string;
  startVocabPractice: string;
  vocabSoloComplete: string;

  // Color perception
  subjectColor: string;
  subjectColorDesc: string;
  colorSetup: string;
  colorTagline: string;
  colorFindDifferent: string;
  colorTapNumber: string;
  startColorPractice: string;
  colorSoloComplete: string;
  colorBattleSetup: string;
  startColorBattle: string;

  // Memory Flash
  subjectMemory: string;
  subjectMemoryDesc: string;
  memorySetup: string;
  memoryTagline: string;
  memoryWatch: string;
  memoryRepeat: string;
  memoryStepsHint: string;
  startMemoryPractice: string;
  memorySoloComplete: string;
  memoryBattleSetup: string;
  startMemoryBattle: string;

  // Leaderboard
  leaderboardBtn: string;
  leaderboardTitle: string;
  lbPlayer: string;
  lbPlayers: string;
  lbAll: string;
  lbEmpty: string;
  lbUnconfigured: string;
  lbError: string;

  // Feedback
  feedbackBtn: string;
  feedbackTitle: string;
  feedbackSubtitle: string;
  feedbackTypeGeneral: string;
  feedbackTypeBug: string;
  feedbackPlaceholder: string;
  feedbackSend: string;
  feedbackSent: string;
  feedbackSentDesc: string;
  feedbackSendAnother: string;
  feedbackError: string;
  feedbackAddImage: string;
  feedbackImagePickTitle: string;
  feedbackImageCamera: string;
  feedbackImageGallery: string;
  feedbackImageCancel: string;

  // Profile
  profileBtn: string;
  profileTitle: string;
  profileSubtitle: string;
  profileNameLabel: string;
  profileNamePlaceholder: string;
  profileCountryLabel: string;
  profileSelectCountry: string;
  profileSearchCountry: string;
  profileAvatarHint: string;
  profileSave: string;
  profileSaving: string;
  profileNoCountry: string;
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
  play: 'PLAY',
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
  convertOp: 'Convert',
  fractionOp: 'Fraction',
  sequenceOp: 'Sequence',
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

  vocabSoloSetup: 'Vocab Practice',
  vocabSoloTagline: 'PRACTICE ALONE · BUILD YOUR VOCAB',
  startVocabPractice: '📖  START VOCAB PRACTICE',
  vocabSoloComplete: 'Vocab Practice Complete!',

  subjectColor: 'Color Sense',
  subjectColorDesc: 'Find the different shade · Train your vision',
  colorSetup: 'Color Practice',
  colorTagline: 'SPOT THE ODD ONE OUT',
  colorFindDifferent: 'Which tile is different?',
  colorTapNumber: 'Tap the number of the odd tile',
  startColorPractice: '🎨  START COLOR PRACTICE',
  colorSoloComplete: 'Color Practice Complete!',
  colorBattleSetup: 'Color Battle Setup',
  startColorBattle: '🎨  START COLOR BATTLE',

  subjectMemory: 'Memory Flash',
  subjectMemoryDesc: 'Watch & repeat the lights · No reading needed',
  memorySetup: 'Memory Practice',
  memoryTagline: 'WATCH, REMEMBER, REPEAT',
  memoryWatch: 'Watch! 👀',
  memoryRepeat: 'Your turn!',
  memoryStepsHint: 'steps',
  startMemoryPractice: '🧠  START MEMORY PRACTICE',
  memorySoloComplete: 'Memory Practice Complete!',
  memoryBattleSetup: 'Memory Battle Setup',
  startMemoryBattle: '🧠  START MEMORY BATTLE',

  leaderboardBtn: 'Leaderboard',
  leaderboardTitle: 'Leaderboard',
  lbPlayer: 'player',
  lbPlayers: 'players',
  lbAll: 'All',
  lbEmpty: 'No scores yet.\nPlay a solo game to get on the board!',
  lbUnconfigured: 'Leaderboard not set up yet.\nAdd your Supabase keys in app.json.',
  lbError: 'Could not load the leaderboard.',

  feedbackBtn: '💬 Feedback',
  feedbackTitle: 'Send Feedback',
  feedbackSubtitle: 'Help us improve Learning Battle — report a bug or share an idea.',
  feedbackTypeGeneral: 'Suggestion',
  feedbackTypeBug: 'Bug Report',
  feedbackPlaceholder: 'Describe your feedback or bug in detail…',
  feedbackSend: '📨  SEND',
  feedbackSent: 'Thank you!',
  feedbackSentDesc: 'Your message has been sent. We read every piece of feedback.',
  feedbackSendAnother: 'Send Another',
  feedbackError: 'Failed to send. Check your connection and try again.',
  feedbackAddImage: '📎 Attach Image',
  feedbackImagePickTitle: 'Attach Image',
  feedbackImageCamera: 'Take Photo',
  feedbackImageGallery: 'Choose from Library',
  feedbackImageCancel: 'Cancel',

  profileBtn: 'Profile',
  profileTitle: 'My Profile',
  profileSubtitle: 'Your player card for solo mode & the leaderboard',
  profileNameLabel: 'Display Name',
  profileNamePlaceholder: 'Your name',
  profileCountryLabel: 'Country',
  profileSelectCountry: 'Select country',
  profileSearchCountry: 'Search…',
  profileAvatarHint: 'Tap to change photo',
  profileSave: 'Save Profile',
  profileSaving: 'Saving…',
  profileNoCountry: 'Not set',
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
  play: 'CHƠI',
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
  convertOp: 'Đổi đơn vị',
  fractionOp: 'Phân số',
  sequenceOp: 'Dãy số',
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

  vocabSoloSetup: 'Luyện từ vựng',
  vocabSoloTagline: 'LUYỆN TẬP · MỞ RỘNG VỐN TỪ',
  startVocabPractice: '📖  BẮT ĐẦU LUYỆN TỪ VỰNG',
  vocabSoloComplete: 'Hoàn thành luyện từ vựng!',

  subjectColor: 'Cảm nhận màu sắc',
  subjectColorDesc: 'Tìm màu khác biệt · Rèn thị giác',
  colorSetup: 'Luyện màu sắc',
  colorTagline: 'TÌM MÀU KHÁC BIỆT',
  colorFindDifferent: 'Ô nào khác màu?',
  colorTapNumber: 'Chọn số của ô khác biệt',
  startColorPractice: '🎨  BẮT ĐẦU LUYỆN MÀU SẮC',
  colorSoloComplete: 'Hoàn thành luyện màu sắc!',
  colorBattleSetup: 'Thiết lập đấu màu sắc',
  startColorBattle: '🎨  BẮT ĐẦU ĐẤU MÀU SẮC',

  subjectMemory: 'Trí nhớ ánh sáng',
  subjectMemoryDesc: 'Xem & lặp lại ánh sáng · Không cần biết chữ',
  memorySetup: 'Luyện trí nhớ',
  memoryTagline: 'XEM, GHI NHỚ, LẶP LẠI',
  memoryWatch: 'Nhìn nhé! 👀',
  memoryRepeat: 'Lượt của bạn!',
  memoryStepsHint: 'bước',
  startMemoryPractice: '🧠  BẮT ĐẦU LUYỆN TRÍ NHỚ',
  memorySoloComplete: 'Hoàn thành luyện trí nhớ!',
  memoryBattleSetup: 'Thiết lập đấu trí nhớ',
  startMemoryBattle: '🧠  BẮT ĐẦU ĐẤU TRÍ NHỚ',

  leaderboardBtn: 'Bảng xếp hạng',
  leaderboardTitle: 'Bảng xếp hạng',
  lbPlayer: 'người chơi',
  lbPlayers: 'người chơi',
  lbAll: 'Tất cả',
  lbEmpty: 'Chưa có điểm nào.\nChơi chế độ một người để ghi danh!',
  lbUnconfigured: 'Bảng xếp hạng chưa được thiết lập.\nThêm khóa Supabase trong app.json.',
  lbError: 'Không tải được bảng xếp hạng.',

  feedbackBtn: '💬 Góp ý',
  feedbackTitle: 'Gửi phản hồi',
  feedbackSubtitle: 'Giúp chúng tôi cải thiện Learning Battle — báo lỗi hoặc chia sẻ ý tưởng.',
  feedbackTypeGeneral: 'Góp ý',
  feedbackTypeBug: 'Báo lỗi',
  feedbackPlaceholder: 'Mô tả phản hồi hoặc lỗi của bạn…',
  feedbackSend: '📨  GỬI',
  feedbackSent: 'Cảm ơn bạn!',
  feedbackSentDesc: 'Tin nhắn của bạn đã được gửi. Chúng tôi đọc mọi phản hồi.',
  feedbackSendAnother: 'Gửi thêm',
  feedbackError: 'Gửi thất bại. Kiểm tra kết nối và thử lại.',
  feedbackAddImage: '📎 Đính kèm ảnh',
  feedbackImagePickTitle: 'Đính kèm ảnh',
  feedbackImageCamera: 'Chụp ảnh',
  feedbackImageGallery: 'Chọn từ thư viện',
  feedbackImageCancel: 'Hủy',

  profileBtn: 'Hồ sơ',
  profileTitle: 'Hồ sơ của tôi',
  profileSubtitle: 'Thẻ người chơi cho chế độ đơn & bảng xếp hạng',
  profileNameLabel: 'Tên hiển thị',
  profileNamePlaceholder: 'Tên của bạn',
  profileCountryLabel: 'Quốc gia',
  profileSelectCountry: 'Chọn quốc gia',
  profileSearchCountry: 'Tìm kiếm…',
  profileAvatarHint: 'Chạm để đổi ảnh',
  profileSave: 'Lưu hồ sơ',
  profileSaving: 'Đang lưu…',
  profileNoCountry: 'Chưa đặt',
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
  play: '开始',
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
  convertOp: '单位换算',
  fractionOp: '分数',
  sequenceOp: '数列',
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

  vocabSoloSetup: '词汇练习',
  vocabSoloTagline: '独自练习 · 积累词汇',
  startVocabPractice: '📖  开始词汇练习',
  vocabSoloComplete: '词汇练习完成！',

  subjectColor: '色彩感知',
  subjectColorDesc: '找出不同的色调 · 训练视觉',
  colorSetup: '色彩练习',
  colorTagline: '找出异色格',
  colorFindDifferent: '哪个格子颜色不同？',
  colorTapNumber: '点击不同格子的数字',
  startColorPractice: '🎨  开始色彩练习',
  colorSoloComplete: '色彩练习完成！',
  colorBattleSetup: '色彩对战设置',
  startColorBattle: '🎨  开始色彩对战',

  subjectMemory: '记忆闪光',
  subjectMemoryDesc: '观看并重复亮灯顺序 · 无需识字',
  memorySetup: '记忆练习',
  memoryTagline: '观看、记住、重复',
  memoryWatch: '看好！👀',
  memoryRepeat: '该你了！',
  memoryStepsHint: '步',
  startMemoryPractice: '🧠  开始记忆练习',
  memorySoloComplete: '记忆练习完成！',
  memoryBattleSetup: '记忆对战设置',
  startMemoryBattle: '🧠  开始记忆对战',

  leaderboardBtn: '排行榜',
  leaderboardTitle: '排行榜',
  lbPlayer: '位玩家',
  lbPlayers: '位玩家',
  lbAll: '全部',
  lbEmpty: '还没有成绩。\n玩单人模式来登榜吧！',
  lbUnconfigured: '排行榜尚未配置。\n请在 app.json 中添加 Supabase 密钥。',
  lbError: '无法加载排行榜。',

  feedbackBtn: '💬 反馈',
  feedbackTitle: '发送反馈',
  feedbackSubtitle: '帮助我们改进 Learning Battle — 报告错误或分享想法。',
  feedbackTypeGeneral: '建议',
  feedbackTypeBug: '报告错误',
  feedbackPlaceholder: '详细描述您的反馈或错误…',
  feedbackSend: '📨  发送',
  feedbackSent: '谢谢！',
  feedbackSentDesc: '您的消息已发送。我们会阅读每一条反馈。',
  feedbackSendAnother: '再发一条',
  feedbackError: '发送失败。请检查网络连接后重试。',
  feedbackAddImage: '📎 附加图片',
  feedbackImagePickTitle: '附加图片',
  feedbackImageCamera: '拍照',
  feedbackImageGallery: '从相册选择',
  feedbackImageCancel: '取消',

  profileBtn: '个人资料',
  profileTitle: '我的资料',
  profileSubtitle: '用于单人模式和排行榜的玩家卡片',
  profileNameLabel: '显示名称',
  profileNamePlaceholder: '你的名字',
  profileCountryLabel: '国家/地区',
  profileSelectCountry: '选择国家/地区',
  profileSearchCountry: '搜索…',
  profileAvatarHint: '点击更换照片',
  profileSave: '保存资料',
  profileSaving: '保存中…',
  profileNoCountry: '未设置',
};

export const TRANSLATIONS: Record<LangCode, Translations> = { en, vi, zh };
