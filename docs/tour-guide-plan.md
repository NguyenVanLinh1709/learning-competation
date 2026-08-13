# Plan: Tour Guide cho từng game mode

## 1. Mục tiêu & quyết định thiết kế đã chốt

- **Kiểu hiển thị**: spotlight — làm tối màn hình, khoét lỗ sáng quanh đúng control đang nói tới (nút, ô chọn...), kèm tooltip mũi tên trỏ vào. Không dùng slide carousel.
- **Phạm vi**: theo từng **game mode**, không phải chỉ Home. Cụ thể là 10 Setup screen (5 subject × Battle/Solo):
  `SetupScreen` (math_battle), `SoloSetupScreen` (math_solo), `VocabSetupScreen` (vocab_battle), `VocabSoloSetupScreen` (vocab_solo), `ColorBattleSetupScreen` (color_battle), `ColorSetupScreen` (color_solo), `MemoryBattleSetupScreen` (memory_battle), `MemorySetupScreen` (memory_solo), `FlagBattleSetupScreen` (flag_battle), `FlagSoloSetupScreen` (flag_solo).
- **Trigger**: tự động chạy **lần đầu tiên** user vào 1 Setup screen (mỗi screen có flag "đã xem" riêng, lưu AsyncStorage — không hiện lại ở lần sau).
- **Replay**: thêm 1 icon nhỏ 🧭 ở góc trên-phải mỗi Setup screen (cạnh nút "i" `InfoButton` có sẵn), bấm vào là xem lại tour của đúng mode đó bất cứ lúc nào.
- **Ngoài phạm vi**: Home screen, Game/Result screens (2 màn hình chia đôi, nửa trên xoay 180° — không phù hợp để đặt tour). Có thể mở rộng sau nếu cần (xem mục 10).
- **Không thêm dependency mới** — tự build spotlight bằng kỹ thuật "4 khối che" (4 `View` bao quanh vùng sáng), dùng `measureInWindow` (API đã dùng trong `HomeScreen.tsx` cho dropdown ngôn ngữ — nhưng chỉ API là có sẵn; timing đo qua `onLayout` + `requestAnimationFrame` mà `useTourTarget` cần là pattern mới, chưa có tiền lệ trong repo, cần test kỹ).
- **Tương tác trong lúc tour mở** *(đã chốt)*: user vẫn bấm được trực tiếp vào control thật đang spotlight (vd chọn độ khó ngay trong tour); vẫn phải bấm "Next" thủ công để qua bước, không auto-advance khi control thay đổi giá trị.
- **Overlay KHÔNG dùng RN `Modal`** *(đã chốt, xem lý do ở §2)*.

## 2. Kiến trúc tổng quan

**Quan trọng — vì sao không dùng RN `Modal`:** `Modal` render trên 1 native window/layer riêng (iOS: `UIViewController` được present; Android: `Dialog`/`Window` riêng). Về mặt nền tảng, chạm vào vùng trong suốt của một `Modal` KHÔNG truyền được xuống view ở screen bên dưới — kể cả khi vùng đó không có view nào che. Vì đã chốt "cho tương tác trực tiếp với control thật trong lúc tour mở" (xem §1), `TourOverlay` phải là 1 `View` absolute-position render ngay trong cây component của từng Setup screen (anh em với `ScrollView`, `zIndex`/`elevation` cao) — cùng 1 view hierarchy với control thật, nên vùng "lỗ sáng" không có view che sẽ tự nhiên cho chạm xuyên xuống đúng control bên dưới, không cần logic pass-through thủ công nào.

Hệ quả kéo theo:
- Không có `Modal.onRequestClose` cho nút back Android → dùng `BackHandler.addEventListener('hardwareBackPress', ...)` trong `TourOverlay`, trả về `true` (chặn back mặc định) và gọi `skip()` khi có tour đang active.
- Không có hành vi "bấm backdrop để đóng" miễn phí từ `Modal` → phải tự implement: bấm vào vùng scrim (4 khối che, ngoài lỗ sáng) → `skip()` (đã chốt, nhất quán với `HowToPlayModal`/`ConfirmModal` hiện có trong app).
- `zIndex`/`elevation`: các khối scrim cần `elevation` (Android) + `zIndex` (iOS/cả hai) đủ cao để nằm trên `ScrollView`, nhưng bản thân vùng lỗ sáng không được có view nào ở layer overlay, kể cả trong suốt.

```
tourStore (Zustand, in-memory)
 ├─ targets: Record<fullId, {x,y,width,height}>   ← đổ vào từ useTourTarget qua onLayout
 ├─ activeTour: string | null                       ← vd 'math_battle'
 ├─ steps: TourStepId[]                             ← danh sách bước ĐÃ RESOLVE (không phải lookup nội bộ, xem ghi chú dưới)
 ├─ stepIndex: number
 └─ actions: registerTarget, startTour(tourId, steps), updateSteps(steps), next, prev, skip, end
     (prev dùng cho nút Back trong tooltip — xem §7)

**Vì sao `steps` được truyền vào chứ không phải store tự tra `screenTours[activeTour]`:** với 8/10 screen, step list tĩnh nên tra nội bộ cũng được — nhưng Memory battle/solo cần branch theo `mode`, và `mode` là **local `useState` trong chính Setup screen component** (`MemoryBattleSetupScreen.tsx:64`, `MemorySetupScreen.tsx:62` — xác nhận trực tiếp trong code, không phải Zustand store), nên `tourStore` (ở ngoài cây component) không có cách nào tự đọc được `mode`. Do đó thiết kế thống nhất cho cả 10 screen: **màn hình tự resolve step list của chính nó** (gọi `screenTours[tourId]` cho 8 screen thường, hoặc `screenTours[tourId](mode)` cho 2 screen Memory) rồi gọi `startTour(tourId, steps)` lúc bắt đầu; với riêng Memory, thêm 1 `useEffect(() => { if (activeTour === TOUR_ID) updateSteps(screenTours[TOUR_ID](mode)) }, [mode])` để đồng bộ lại mỗi khi user đổi mode giữa chừng tour (xem §5, §8). `tourStore` chỉ thao tác trên mảng `steps` đã resolve, không tự import `screenTours.ts`.

tourSeen.ts (AsyncStorage, mirror utils/lastSetup.ts)
 └─ isTourSeen(tourId) / markTourSeen(tourId)   key: mb_tour_seen_<tourId>

useTourTarget(fullId: string) → { ref, onLayout }
 └─ gắn trực tiếp lên control có sẵn (LinearGradient/View/TouchableOpacity),
    không bọc thêm wrapper component (ngoại lệ: PlayerNames, xem §3)

TourOverlay.tsx (render 1 lần / screen, absolute View — KHÔNG phải Modal)
 └─ đọc activeTour + stepIndex + targets[currentStep.id] từ store,
    vẽ scrim (rgba(0,0,0,0.72), giữ đậm hơn overlay 0.55 dùng chung chỗ khác trong app —
    có chủ đích, để tương phản spotlight rõ hơn dialog thường) + khung sáng + tooltip
    (title/body/progress dots/Back/Skip/Next hoặc Got it ở bước cuối).
    Nhận thêm 1 ScrollView ref từ screen cha để tự scrollTo khi target nằm ngoài viewport (xem §8).
    Bấm scrim → skip(). BackHandler (Android) → skip().

TourButton.tsx
 └─ icon 🧭 32×32, style giống hệt InfoButton, onPress = beginTour() (hàm cục bộ của screen,
    resolve steps rồi gọi startTour(tourId, steps) — xem §6)
    (nếu HowToPlayModal đang mở, tự đóng nó trước khi mở tour, tránh 2 overlay chồng nhau)
```

Mỗi `fullId` được namespace theo screen để tránh đụng nhau khi 2 screen có control cùng loại, vd `math_battle:difficulty` vs `math_solo:difficulty`.

## 3. File mới cần tạo

| File | Nội dung |
|---|---|
| `src/store/tourStore.ts` | State runtime: `targets`, `activeTour`, `steps`, `stepIndex` + actions `registerTarget/startTour(tourId, steps)/updateSteps(steps)/next/prev/skip/end`. `skip`/bước cuối gọi `markTourSeen`. Store **không** tự tra `screenTours` — nhận `steps` đã resolve từ screen gọi vào (xem §2 để biết lý do: `mode` của Memory là local state, store không đọc được). `updateSteps` phải tự clamp `stepIndex` nếu vượt quá độ dài `steps` mới (xem §8 "Đổi mode giữa chừng tour"). |
| `src/utils/tourSeen.ts` | `isTourSeen(id)`, `markTourSeen(id)` — AsyncStorage, prefix `mb_tour_seen_`, mirror `lastSetup.ts`. |
| `src/hooks/useTourTarget.ts` | Hook trả `{ ref, onLayout }`; `onLayout` gọi `requestAnimationFrame` rồi `ref.current.measureInWindow(...)` → `registerTarget`. **Lưu ý**: đây là pattern mới (rAF-driven auto-registration), không phải tái dùng nguyên xi cách `HomeScreen.tsx` gọi `measureInWindow` on-demand trong press handler — cần test kỹ trên thiết bị thật, đặc biệt sau khi nội dung phía trên thay đổi chiều cao (vd Memory: `isColor` bật/tắt 1 hay 2 slider). |
| `src/components/TourOverlay.tsx` | Spotlight + tooltip render bằng `View` absolute (**không phải `Modal`** — xem lý do kỹ thuật ở §2). Scrim `rgba(0,0,0,0.72)` cố định (không theo theme, chủ đích đậm hơn overlay 0.55 dùng chỗ khác). Card tooltip dùng `isDark ? '#1E1E2E' : '#FFFFFF'` + `C.border` (đồng bộ `HowToPlayModal`). Viền sáng quanh target: `borderColor: C.p1Primary`. Tooltip tự chọn đặt trên/dưới target tùy vị trí, clamp trong màn hình. Progress = dots (giữ nguyên; lý do là số bước ít (5-7) nên dots đủ rõ — **không phải** vì thiếu cơ chế interpolation, `translations.ts` thực ra đã hỗ trợ qua pattern hàm như `wins: (name) => ...`, chỉ là không cần dùng ở đây). Nút: Back (ẩn ở bước đầu) / Skip / Next (đổi thành "Got it" ở bước cuối). Nhận `scrollViewRef` từ screen cha để tự scroll tới target khi cần (xem §8). Bấm scrim → `skip()`. `BackHandler` (Android) → `skip()` khi có tour active. |
| `src/components/TourButton.tsx` | Icon 🧭, style/kích thước y hệt `InfoButton`. `onPress`: nếu `HowToPlayModal` đang mở thì đóng trước, rồi `startTour(tourId)`. |
| `src/content/tourStepLibrary.ts` | Định nghĩa nội dung (titleKey/bodyKey) cho từng *loại* control, dùng chung giữa nhiều screen. Thêm 1 entry mới `memoryMode` cho bước mode-selector (xem §4, §5). |
| `src/content/screenTours.ts` | Map `tourId → danh sách stepKey theo đúng thứ tự hiển thị` cho từng 1 trong 10 screen. Với `memory_battle`/`memory_solo`, danh sách bước là 1 **hàm của `mode` hiện tại** (`flash \| color`), không phải mảng tĩnh — xem §5. |

**File có sẵn cần sửa** (ngoài 10 Setup screen ở §6):

| File | Thay đổi |
|---|---|
| `src/components/PlayerNames.tsx` | Convert sang `React.forwardRef<View, Props>`, thêm prop `onLayout?: (e: LayoutChangeEvent) => void` truyền xuống `View` gốc — để `useTourTarget` gắn được thẳng lên component này ở 5 screen dùng nó (Math/Vocab/Color/Memory/Flag battle), giữ đúng nguyên tắc "không thêm wrapper". |
| `src/screens/MemoryBattleSetupScreen.tsx`, `MemorySetupScreen.tsx` | Thay 3 chuỗi hardcode tiếng Anh (`"MODE"`, `"Memory Flash"`, `"Color Memory"`) bằng key i18n mới (xem §7) — cần thiết vì bước tour mới trỏ thẳng vào control này, và tiện dọn luôn nợ kỹ thuật i18n có sẵn. |

## 4. Thư viện bước dùng chung

```ts
// src/content/tourStepLibrary.ts
export const STEP_LIBRARY = {
  playerNames:  { titleKey: 'tourPlayerNamesTitle', bodyKey: 'tourPlayerNamesBody' },
  difficulty:   { titleKey: 'tourDifficultyTitle',  bodyKey: 'tourDifficultyBody' },
  operation:    { titleKey: 'tourOperationTitle',   bodyKey: 'tourOperationBody' },   // Math only
  vocabMode:    { titleKey: 'tourVocabModeTitle',   bodyKey: 'tourVocabModeBody' },   // Vocab only
  memoryMode:   { titleKey: 'tourMemoryModeTitle',  bodyKey: 'tourMemoryModeBody' },  // Memory only — mode selector (Flash/Color)
  memoryGrid:   { titleKey: 'tourMemoryGridTitle',  bodyKey: 'tourMemoryGridBody' },  // Memory only — grid-size slider, cả 2 mode
  memorySteps:  { titleKey: 'tourMemoryStepsTitle', bodyKey: 'tourMemoryStepsBody' }, // Memory only — steps slider, chỉ Flash mode
  memoryReveal: { titleKey: 'tourMemoryRevealTitle',bodyKey: 'tourMemoryRevealBody' },// Memory only — time-limit row khi relabel cho Color mode (KHÔNG phải control riêng, cùng target key `timeLimit`, chỉ đổi nội dung tooltip — xem §5)
  questions:    { titleKey: 'tourQuestionsTitle',   bodyKey: 'tourQuestionsBody' },
  timeLimit:    { titleKey: 'tourTimeLimitTitle',   bodyKey: 'tourTimeLimitBody' },
  startBtn:     { titleKey: 'tourStartTitle',       bodyKey: 'tourStartBody' },
} as const;
```

Cần ~11 title + 11 body key (không phải 60+), vì nội dung tái dùng giữa các screen.

## 5. Mapping 10 screen → các bước (theo thứ tự hiển thị trên UI)

`tourId` tái dùng đúng hằng số `LAST_SETUP_KEY` đã có sẵn trong từng file Setup, để nhất quán với convention hiện tại của repo.

| tourId | Screen | Các bước |
|---|---|---|
| `math_battle` | `SetupScreen.tsx` | playerNames → difficulty → operation → questions → timeLimit → startBtn |
| `math_solo` | `SoloSetupScreen.tsx` | difficulty → operation → questions → timeLimit → startBtn |
| `vocab_battle` | `VocabSetupScreen.tsx` | playerNames → vocabMode → difficulty → questions → timeLimit → startBtn |
| `vocab_solo` | `VocabSoloSetupScreen.tsx` | vocabMode → difficulty → questions → timeLimit → startBtn |
| `color_battle` | `ColorBattleSetupScreen.tsx` | playerNames → difficulty → questions → timeLimit → startBtn |
| `color_solo` | `ColorSetupScreen.tsx` | difficulty → questions → timeLimit → startBtn |
| `memory_battle` | `MemoryBattleSetupScreen.tsx` | playerNames → memoryMode → **[flash: memoryGrid → memorySteps]** / **[color: memoryGrid]** → questions → timeLimit(reveal nếu color) → startBtn |
| `memory_solo` | `MemorySetupScreen.tsx` | memoryMode → **[flash: memoryGrid → memorySteps]** / **[color: memoryGrid]** → questions → timeLimit(reveal nếu color) → startBtn |
| `flag_battle` | `FlagBattleSetupScreen.tsx` | playerNames → difficulty → questions → timeLimit → startBtn |
| `flag_solo` | `FlagSoloSetupScreen.tsx` | difficulty → questions → timeLimit → startBtn |

**Chi tiết branching Memory** (đã chốt — xem thêm §8 "Đổi mode giữa chừng tour"):
- Bước `memoryMode` luôn hiện đầu tiên (sau `playerNames` ở battle), spotlight đúng `styles.modeRow`.
- `screenTours.ts` định nghĩa 2 tourId này bằng 1 **hàm** `(mode: 'flash' | 'color') => stepKey[]` thay vì mảng cố định:
  - `flash`: `memoryGrid → memorySteps → questions → timeLimit → startBtn` (target `timeLimit` dùng nội dung tooltip `timeLimit` bình thường).
  - `color`: `memoryGrid → questions → timeLimit → startBtn` (target vẫn là `fullId` `...:timeLimit` — **cùng 1 target đo layout**, nhưng khi `isColor` thì tooltip đọc nội dung `memoryReveal` thay vì `timeLimit`, vì UI đã tự relabel row này thành "thời gian ghi nhớ" — không phải 2 control khác nhau).
- `mode` là local `useState` trong chính 2 file screen này (không phải Zustand store) — nên chính 2 Setup screen tự gọi `updateSteps(screenTours[TOUR_ID](mode))` mỗi khi `mode` đổi (xem cơ chế `steps` truyền-vào ở §2), để `tourStore` luôn có đúng danh sách bước hiện hành mà không cần biết gì về `mode`.

## 6. Thay đổi trên mỗi Setup screen (lặp lại cho cả 10 file)

1. Gắn `useTourTarget('<tourId>:<stepKey>')` (spread `ref` + `onLayout`) lên đúng `View`/section bao control tương ứng (PlayerNames — qua `forwardRef` mới, xem §3, difficulty row, operation row, vocabMode row, memory controls, questions row, time-limit row, nút Start).
2. Thêm `TourButton` cạnh `InfoButton` trong `topRow` (gọi hàm cục bộ `beginTour()` gộp resolve-steps + `startTour`, xem bước 3):
   ```tsx
   <View style={styles.topRightIcons}>
     <TourButton onPress={beginTour} />
     <InfoButton onPress={() => setHowToOpen(true)} />
   </View>
   ```
   (`topRightIcons: { flexDirection: 'row', gap: 8 }`, thay cho `InfoButton` đứng lẻ.)
3. Thêm hàm resolve-steps cục bộ + trigger lần-đầu (không cần đợi animation — các Setup screen không có entrance animation như Home). Ở 8 screen thường, `screenTours[TOUR_ID]` là mảng tĩnh; riêng 2 screen Memory, gọi `screenTours[TOUR_ID](mode)` (xem §2, §5):
   ```ts
   const beginTour = () => useTourStore.getState().startTour(TOUR_ID, screenTours[TOUR_ID] /* hoặc screenTours[TOUR_ID](mode) cho Memory */);

   useEffect(() => {
     isTourSeen(TOUR_ID).then((seen) => {
       if (!seen) setTimeout(beginTour, 250);
     });
   }, []);

   // Chỉ 2 screen Memory: đồng bộ lại steps nếu user đổi mode giữa chừng tour (xem §5, §8)
   useEffect(() => {
     if (useTourStore.getState().activeTour === TOUR_ID) {
       useTourStore.getState().updateSteps(screenTours[TOUR_ID](mode));
     }
   }, [mode]);
   ```
4. Thêm `scrollViewRef = useRef<ScrollView>(null)` gắn lên `ScrollView` chính, truyền xuống `<TourOverlay scrollViewRef={scrollViewRef} ... />` để overlay tự scroll tới target khi cần (xem §8).
5. Render `<TourOverlay />` **là sibling của `KeyboardAvoidingView`, KHÔNG lồng bên trong nó** — cùng cấp với `HowToPlayModal` hiện có (vd trong `SetupScreen.tsx`, cả hai đều là con trực tiếp của `LinearGradient` gốc, đứng sau `</KeyboardAvoidingView>`). Lý do: `KeyboardAvoidingView` tự thêm padding/resize khi bàn phím bật, nếu `TourOverlay` nằm bên trong nó thì `position:absolute, top:0,...` sẽ tính theo box đã bị nén thay vì toàn bộ màn hình thật, làm lệch spotlight khỏi toạ độ `measureInWindow` (vốn là toạ độ tuyệt đối theo window, không đổi theo padding của cha). Dùng `position: 'absolute', top: 0, left: 0, right: 0, bottom: 0` + `elevation`/`zIndex` cao, **không phải** `<Modal>` (xem §2).

Cả `InfoButton`/`HowToPlayModal` (mô tả luật chơi bằng chữ) và `TourButton`/tour mới (chỉ trực tiếp vào từng control) được giữ song song vì phục vụ 2 mục đích khác nhau, không thay thế nhau.

## 7. i18n

Thêm vào `Translations` type + điền cho `en`/`vi`/`zh` trong `src/i18n/translations.ts`:
- `tourBack`, `tourSkip`, `tourNext`, `tourGotIt` (nút điều hướng, dùng chung mọi tour — `tourBack` mới thêm để khớp action `prev` đã có trong `tourStore`)
- 11 cặp title/body tương ứng `STEP_LIBRARY` (§4): `tourPlayerNamesTitle/Body`, `tourDifficultyTitle/Body`, `tourOperationTitle/Body`, `tourVocabModeTitle/Body`, `tourMemoryModeTitle/Body` *(mới)*, `tourMemoryGridTitle/Body`, `tourMemoryRevealTitle/Body`, `tourMemoryStepsTitle/Body`, `tourQuestionsTitle/Body`, `tourTimeLimitTitle/Body`, `tourStartTitle/Body`
- 3 key i18n hoá nợ kỹ thuật có sẵn ở Memory Setup (2 screen, cả battle/solo dùng chung key): `memoryModeLabel` ("MODE"), `memoryModeFlash` ("Memory Flash"), `memoryModeColor` ("Color Memory") — thay cho chuỗi hardcode tiếng Anh hiện tại ở `MemoryBattleSetupScreen.tsx`/`MemorySetupScreen.tsx`.

## 8. Edge case cần xử lý

- **Đo vị trí quá sớm**: `onLayout` dùng `requestAnimationFrame` trước khi `measureInWindow` để đảm bảo layout đã ổn định.
- **Target chưa đo được** (chưa mount / id sai): `TourOverlay` không render tooltip cho tới khi có rect trong `targets`; nếu quá ~1s không đo được thì tự động bỏ qua sang bước kế để tour không bị "treo".
- **Target đo được nhưng nằm ngoài viewport (đã cuộn)**: khác với case trên — control vẫn trả toạ độ hợp lệ qua `measureInWindow`, chỉ là toạ độ đó nằm ngoài màn hình hiện tại, nên cơ chế timeout-skip ở trên không bắt được case này. `TourOverlay` phải **tự scroll `scrollViewRef`** tới vị trí target mỗi khi `stepIndex` đổi (tính offset dựa trên rect đã đo trừ đi vị trí hiện tại của `ScrollView`), trước khi vẽ spotlight/tooltip. Cần đặc biệt chú ý các screen có nhiều bước dồn (Memory: mode + 1-2 slider + questions + timeLimit; Math/Vocab: nhiều row) trên màn hình nhỏ.
- **Namespace theo screen**: mỗi `fullId` có prefix `tourId:` nên dữ liệu đo của screen này không lẫn sang screen khác dù tên step trùng (`difficulty` ở nhiều screen).
- **Tương tác với control thật trong lúc tour mở**: đã chốt — cho phép (xem §1, §2). Vì `TourOverlay` không phải `Modal`, vùng lỗ sáng tự nhiên cho chạm xuyên xuống control thật (cùng view hierarchy), không cần logic riêng.
- **Bấm vào vùng scrim (ngoài lỗ sáng)**: `skip()` — nhất quán với hành vi bấm backdrop đóng `HowToPlayModal`/`ConfirmModal` hiện có.
- **Back gesture / nút back Android khi tour đang mở**: vì không còn `Modal.onRequestClose` (đã bỏ `Modal`, xem §2), dùng `BackHandler.addEventListener('hardwareBackPress', ...)` trong `TourOverlay`, trả `true` + gọi `skip()` khi có tour active; nhớ `removeEventListener` khi tour kết thúc/unmount.
- **Đổi mode giữa chừng tour (Memory battle/solo)**: nếu user bấm đổi Flash ↔ Color trong lúc đang ở bước `memoryMode` (hoặc bất kỳ bước nào sau đó, vì control thật vẫn bấm được), `useEffect([mode])` ở chính Setup screen gọi `updateSteps(screenTours[TOUR_ID](mode))` (xem §2, §5, §6) để đẩy danh sách bước mới vào store. `updateSteps` trong `tourStore` cần tự clamp `stepIndex` về vị trí hợp lý (vd giữ nguyên số bước đã đi qua kể từ `memoryMode`, hoặc đơn giản là quay về ngay-sau-`memoryMode` nếu index hiện tại vượt quá số bước của nhánh mới) để tránh trỏ vào step key không tồn tại ở nhánh mới.
- **Bàn phím mở (KeyboardAvoidingView)**: đây **là kịch bản thật sự có thể xảy ra**, không chỉ lý thuyết — vì đã chốt cho tương tác trực tiếp (§1), và bước `playerNames` (5/10 screen) spotlight thẳng vào 1 `TextInput`, user hoàn toàn có thể bấm gõ tên ngay trong lúc tour đang mở, làm bàn phím bật lên giữa chừng. Nhờ `TourOverlay` nằm ngoài `KeyboardAvoidingView` (mục 5 ở trên), overlay không bị co giãn theo padding bàn phím; đồng thời `ScrollView` bên trong `KeyboardAvoidingView` sẽ tự relayout khi bàn phím bật, khiến `onLayout` của target đang focus refire → `useTourTarget` đo lại toạ độ mới → `targets` trong store cập nhật → tooltip tự vẽ lại đúng vị trí ở lần render kế tiếp, không cần logic đặc biệt nào thêm.
- **Tablet / nhiều kích thước màn hình**: vì đo bằng `measureInWindow` thực tế thay vì toạ độ cứng, tour tự đúng trên mọi kích thước, không cần logic riêng.
- **Dark/Light theme**: card tooltip và viền spotlight đọc từ `useTheme()`, scrim nền tối giữ cố định cho cả 2 theme (giống chuẩn UX phổ biến); opacity 0.72 (đậm hơn 0.55 dùng chỗ khác trong app) là chủ đích, không phải nhầm lẫn.

## 9. Thứ tự triển khai

1. `tourStore.ts`, `tourSeen.ts`, `useTourTarget.ts` — lõi engine, làm 1 lần.
2. Convert `PlayerNames.tsx` sang `forwardRef` + `onLayout` passthrough (§3) — làm trước vì 5/10 screen phụ thuộc.
3. `TourOverlay.tsx` (absolute View, không phải Modal — bao gồm auto-scroll, `BackHandler`, scrim-tap-skip, nút Back/Skip/Next/Got it), `TourButton.tsx`.
4. `tourStepLibrary.ts`, `screenTours.ts` (bao gồm hàm branching theo `mode` cho 2 tourId Memory).
5. Thêm i18n keys (mục 7) × 3 ngôn ngữ — bao gồm 3 key i18n hoá mode-selector của Memory.
6. Sửa `MemoryBattleSetupScreen.tsx`/`MemorySetupScreen.tsx` dùng key i18n mới thay hardcode.
7. Áp vào `SetupScreen.tsx` (math_battle) làm mẫu → test kỹ trên máy thật trước khi nhân bản (đặc biệt: tương tác control thật trong tour, scrim tap, back Android, auto-scroll khi cuộn).
8. Nhân bản pattern sang 9 Setup screen còn lại theo bảng ở mục 5 — 2 screen Memory cần thêm bước `memoryMode` + logic branching.
9. `npx tsc --noEmit`.
10. Test thực tế từng mode trên Android/thiết bị thật hoặc Expo Go (**không dùng Xcode/iOS Simulator**): xoá app data hoặc gọi `markTourSeen` ngược để giả lập "lần đầu vào", kiểm tra icon 🧭 replay, dark/light theme, ít nhất 1 máy tablet nếu có, bấm back giữa tour, đổi mode Memory giữa chừng tour, bấm trực tiếp vào control thật trong lúc tour mở, cuộn màn hình nhỏ để test auto-scroll.

## 10. Mở rộng tương lai (không nằm trong scope đợt này)

- Tour riêng cho Home screen (giới thiệu 5 card môn học, đổi ngôn ngữ, theme, profile) — engine hiện tại tái dùng được gần như nguyên vẹn, chỉ cần thêm 1 `screenTours` entry mới.
- Cân nhắc gộp `InfoButton`/`HowToPlayModal` và tour lại làm một nếu sau này thấy 2 icon là dư thừa với người dùng.
