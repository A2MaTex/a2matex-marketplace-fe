# Audit và kế hoạch hoàn thiện luồng Product → Marketplace

> Ngày đối chiếu: 2026-11-20 (Asia/Bangkok)
> Phạm vi: `a2matex-marketplace-fe` hiện tại, đối chiếu trực tiếp với `../a2matex-be` và tài liệu luồng được cung cấp.
> Trạng thái: frontend Phase 1, Phase 2 và Phase 4 đã triển khai và kiểm thử; các giới hạn live E2E/backend được ghi rõ bên dưới.

## 1. Kết luận ngắn

Luồng nghiệp vụ đúng ở thời điểm audit là:

```text
Project
  → ProjectDraft hiện hành
  → Product DRAFT
  → Submission + WorkflowRevision bất biến
  → Automated Scan
  → Admin Review
  → ProductRelease BUILDING
  → ProductRelease PUBLISHED
  → Publisher chọn currentRelease
  → Publisher cấu hình Subscription Offer hợp lệ
  → Publisher ACTIVATE Product
  → Product xuất hiện trên Marketplace
```

Tài liệu đính kèm đúng ở điểm cốt lõi: Project không được release trực tiếp; `APPROVED`, `PUBLISHED`, `currentReleaseId` và `ACTIVE` là bốn trạng thái/gate khác nhau. Code thật của publication transaction chỉ gọi `markPublished`; nó không cập nhật `Product.currentReleaseId` và không chuyển Product sang `ACTIVE`.

Tuy nhiên, full flow hiện **chưa hoàn tất trên frontend**. Hai blocker chính là:

1. Publisher chưa có API adapter/UI để ghi Offers, dù backend đã có `PUT /products/:productId/offers`.
2. Admin Review Queue mới là placeholder, nên không thể review/approve bằng UI.

Ngoài ra, frontend đang cho Archive sai trạng thái (`DRAFT` thay vì `ACTIVE`), chưa có `REACTIVATE`, và có một số contract/comment/test chưa đồng bộ. Vì vậy không nên kết luận hệ thống đã production-ready chỉ vì build, unit test và browser mock đều chạy.

## 2. Các giả định cần kiểm tra, không được mặc định là đúng

| Giả định | Kết quả kiểm tra | Kết luận |
|---|---|---|
| Approve đưa Product lên Marketplace | Approve chỉ lưu review rồi publish build request sau commit. | Sai. |
| Release `PUBLISHED` tự chọn current và tự activate Product | Publication transaction thực tế chỉ `markPublished`. Hai comment trong build service nói ngược với code. | Sai; code là nguồn hành vi hiện tại, comment phải sửa. |
| Frontend đã có full flow vì đã có Product, Submission và Release page | Offers không có write path; Admin Review Queue là placeholder. | Sai. |
| “Full flow test” có thể xác nhận chỉ bằng frontend mock | Mock không thực thi DB lock/transaction, Kafka consumer, R2 upload, scan/review authorization hoặc permission seed. | Sai; mock chỉ xác nhận UI/contract orchestration. |
| Mọi field bắt buộc trên Product create cũng bắt buộc để submit | Frontend bắt `usageInstructions`; backend và Submission snapshot cho phép null. | Chưa thống nhất; cần product decision, không nên tự coi frontend hoặc backend là đúng tuyệt đối. |
| Scanner đã kiểm tra đúng artifact sẽ chạy trên device | Scanner hiện mới chạy rule groups 1, 2 và 6; chưa validate Runtime IR v1, frozen Node Definition consistency và MVP policy restrictions. | Sai; đây là release-risk cần xử lý hoặc chấp nhận minh bạch. |
| Build failure detail chỉ Admin thấy | Backend list schema/repository vẫn đưa `buildFailureCode` vào mọi release summary; frontend chỉ bỏ field khi parse. | Sai ở wire contract; cần harden backend. |

## 3. Bằng chứng từ implementation hiện tại

### 3.1 Backend phù hợp với luồng trong tài liệu

- Product gắn duy nhất với một Project qua unique constraint `Product.projectId` trong `../a2matex-be/prisma/schema.prisma`.
- Submission lock Product, tạo WorkflowRevision từ đúng Draft version, đóng băng snapshot rồi publish scan request sau commit.
- WorkflowRevision từ chối Project archived, Draft version cũ, Runtime IR null/không phải object và content hash sai.
- Review `APPROVE` chỉ hợp lệ khi Submission sẵn sàng và scan `PASSED`; build request được publish sau commit.
- Release selection là endpoint riêng `PUT /products/:productId/releases/current`.
- Offer replacement là endpoint riêng `PUT /products/:productId/offers` và là full replacement.
- `ACTIVATE` kiểm tra lại current Release và Subscription Offer trong cùng Product lock trước khi đổi `DRAFT → ACTIVE`.
- Marketplace lấy presentation từ approved Submission/current Release, còn Offers là live data.

### 3.2 Comment backend đang sai so với code

Trong `product-release-build.service.ts`, comment của Step 9 nói publication “atomically sets” current pointer và `DRAFT → ACTIVE`. Nhưng implementation từ `runPublicationTransaction()` tới cuối transaction chỉ:

1. lock/recheck Product và ProductRelease;
2. kiểm tra Static/package/key material;
3. gọi `markPublished(...)`;
4. trả outcome `published`.

Không có write nào vào Product trong transaction này. Cần sửa comment và thêm regression test để tránh một lần refactor sau vô tình dựa vào mô tả sai.

### 3.3 Frontend đã có

- Project/Draft list, detail, draft version và Runtime IR preflight.
- Product list/detail/create/edit/media, filter `ALL` mặc định.
- Submission create với validation, `Idempotency-Key` intent được giữ trong session, preflight và retry-safe behavior.
- Submission list/detail/filter/polling và deep-link sang Release.
- Release list/detail/polling, chọn current Release, activation readiness và gọi `ACTIVATE`.
- Marketplace public list/detail đọc Product ACTIVE đủ điều kiện từ public API.

### 3.4 Frontend còn thiếu hoặc sai

| ID | Mức độ | Vấn đề | Bằng chứng | Ảnh hưởng |
|---|---|---|---|---|
| FLOW-01 | High | Không có Offer write API/UI | `pages/api/product/api.js` không có `replaceOffers`; Product editor chỉ có Basic information và Media. | Product mới không thể đạt activation readiness bằng UI. |
| FLOW-02 | High | Admin Review Queue là placeholder | `src/features/admin/pages/review-queue/page/ReviewQueue.jsx` chỉ render `ReviewQueue`. | Không thể `APPROVE`, `REQUEST_CHANGES`, `REJECT` bằng UI. |
| FLOW-03 | High | Archive permission sai | `canArchiveProduct(status) => status === "DRAFT"`; backend chỉ cho `ACTIVE → ARCHIVED`. | DRAFT hiện nút luôn bị backend từ chối; ACTIVE lại không có nút hợp lệ. |
| FLOW-04 | Medium | Thiếu Publisher `REACTIVATE` | Backend hỗ trợ `ARCHIVED → ACTIVE` sau khi recheck readiness; frontend không có action. | Publisher không thể relist Product archived bằng UI. |
| FLOW-05 | Medium | Activation CTA trùng và copy đã cũ | Product editor có nút Activate bị disable với tooltip “waiting for Publisher submission API”; Release page đã có activation thật. | Gây hiểu sai trạng thái và nơi thực hiện action. |
| FLOW-06 | Medium | `usageInstructions` bị bắt buộc chỉ ở frontend | `PRODUCT_REQUIRED_FIELDS` gồm `usageInstructions`; backend cho nullable/optional và Submission không dùng nó để xét completeness. | UI từ chối request backend hợp lệ; contract drift. |
| FLOW-07 | Medium | Build failure code lộ trong release list wire response | Backend `ProductReleaseSummaryOutput` bắt buộc `buildFailureCode`, repo map field cho mọi caller. | Publisher nhận internal failure data dù frontend bỏ field. |
| FLOW-08 | High | Scanner chưa validate Runtime IR thực thi | Backend comment và code xác nhận chỉ rule groups 1, 2, 6 đang chạy. | Runtime IR malformed có thể vẫn `PASSED` và được approve/build. |
| FLOW-09 | Medium | Thiếu automated test cho flow frontend | `npm test` hiện chỉ chạy 4 test của draft decoder. | Product/Offer/Submission/Release regressions không được chặn. |
| FLOW-10 | Low | Còn dead legacy Publisher Hub có mock releases/license tiers | `PublisherHub.jsx` không nằm trong route hiện tại và import path đã cũ; `ProjectItem.jsx` vẫn có `MOCK_RELEASES`. | Tăng nhầm lẫn khi bảo trì; full lint còn bắt lỗi ở code dead. |

## 4. So sánh hướng tiếp cận

### Hướng “nối tiếp màn hình hiện có”

Ưu điểm là nhanh: thêm Offer form, thêm Review Queue rồi thử click xuyên suốt. Nhược điểm là dễ giữ lại contract drift đang có, đặc biệt lifecycle, scanner và dữ liệu Admin-only.

### Hướng đề xuất: contract-first, state-driven

1. Chốt state machine và quyền theo code/backend test.
2. Sửa các contract/security mismatch trước.
3. Implement hai blocker Offer và Admin Review.
4. Đồng bộ lifecycle UI.
5. Thêm automated test theo transition, không chỉ theo page.
6. Cuối cùng chạy live E2E với hai role và hạ tầng thật.

Hướng này hiệu quả hơn vì acceptance criterion bám vào transition quan sát được trong DB/API, không bám vào việc một button có xuất hiện hay không.

## 5. Kế hoạch update

### Phase 0 — Khóa contract và sửa sai lệch an toàn

Mục tiêu: không phát triển UI mới trên contract/comment sai.

- [ ] Sửa comment Step 9 trong `product-release-build.service.ts`: publication chỉ chuyển Release sang `PUBLISHED`.
- [ ] Thêm backend regression test khẳng định publish không đổi `Product.currentReleaseId`, không đổi Product status và không đổi Offers.
- [ ] Tách Publisher/Admin release summary hoặc làm `buildFailureCode` conditional từ query tới response schema; Publisher response không được chứa field này.
- [ ] Chốt quyết định về scanner:
  - phương án khuyến nghị: hoàn thiện Runtime IR v1 validation, frozen Node Definition consistency và MVP policy rules trước production;
  - phương án tạm thời: feature flag/không cho production activation khi scanner version còn `0.1.x`, đồng thời hiển thị rõ limitation cho Admin.
- [ ] Chốt `usageInstructions` là optional hay business-required. Khuyến nghị đồng bộ UI với backend/Submission hiện tại là optional; nếu business muốn bắt buộc thì phải đổi backend schema, docs và test cùng lúc.

Acceptance:

- Publisher release list/detail không có `buildFailureCode` trên network response.
- Test publication fail nếu current pointer hoặc Product status bị thay đổi ngoài ý muốn.
- Scanner policy có quyết định rõ ràng, không coi graph validation là Runtime IR validation.

### Phase 1 — Hoàn thiện Product Offers (blocker Publisher)

Mục tiêu: Product `DRAFT` có thể tự đạt readiness hoàn toàn bằng Publisher UI.

- [x] Thêm URL/API `PUT /products/:productId/offers` với body `{ offers }`.
- [x] Tạo Offer editor từ `product.offers`; giữ `priceAmount` là decimal string, không convert qua floating point.
- [x] Hỗ trợ `SUBSCRIPTION` và `ONE_TIME` đúng rule `durationDays`; activation vẫn yêu cầu ít nhất một `SUBSCRIPTION` giá dương, duration dương.
- [x] Hiển thị rõ full-replacement semantics trước khi Save; Offer bị bỏ khỏi request sẽ bị soft-delete.
- [x] Map lỗi duplicate natural key, max count/price/duration, archived/suspended, active Product phải giữ Subscription, rate limit và transaction timeout.
- [x] Sau Save phải GET Product detail lại; không tự tạo ID hoặc merge optimistic sai với server.
- [x] Khi Active, hiển thị quota/cảnh báo “material offer changes per time window” nếu backend contract chưa trả remaining count thì ít nhất map chính xác lỗi rate limit.

Kết quả triển khai 2026-11-21:

- Product detail có License offers editor dùng đúng Offer contract hiện tại. UI không gửi các thuộc tính chỉ có trong mock như package name, badge, currency hay active switch vì backend không lưu chúng.
- Save là thao tác riêng với Product metadata vì Offer endpoint là full replacement độc lập; sau PUT luôn GET lại Product detail và dùng server IDs/state mới.
- `ONE_TIME` luôn gửi `durationDays: null`; `SUBSCRIPTION` bắt buộc giá dương và duration 1–3650 ngày. `priceAmount` được giữ nguyên dạng decimal string đến request body.
- Browser contract QA xác nhận payload full replacement gồm Offer cũ và mới, refetch sau Save, hai rich editor hoạt động, và viewport 390 px không tràn ngang. Việc persistence sau reload với database thật vẫn thuộc live E2E.

Acceptance:

- Tạo/sửa/xóa Offer trên DRAFT và reload vẫn đúng dữ liệu server.
- Không gửi number cho `priceAmount`; giá vượt `Number.MAX_SAFE_INTEGER` vẫn round-trip chính xác.
- Không thể tạo hai Offer cùng `(type, durationDays)`.
- Active Product không thể Save tập Offer không còn Subscription.
- Release readiness cập nhật ngay sau Save và có thể mở khóa Activate.

### Phase 2 — Đồng bộ Product lifecycle UI

- [x] Đổi `canArchiveProduct` thành chỉ `ACTIVE`.
- [x] Không hiển thị Archive cho `DRAFT`; DRAFT chỉ có Activate khi readiness đủ.
- [x] Thêm `REACTIVATE` cho `ARCHIVED`; trước khi gọi phải hiển thị current Release và Offer readiness mới nhất.
- [x] Giữ `SUSPENDED` read-only cho Publisher; chỉ Admin có moderation `REACTIVATE`.
- [x] Giữ đầy đủ Release readiness và thêm Activate CTA trực tiếp ở Product detail theo yêu cầu cập nhật; cả hai đều refresh Product/current Release trước mutation và dùng cùng readiness rules.
- [x] Sau mọi lifecycle mutation phải refetch Product, Releases và Marketplace eligibility thay vì chỉ đổi local badge.

Kết quả triển khai:

- Product detail dùng permission matrix DRAFT/ACTIVE/ARCHIVED/SUSPENDED; DRAFT có Activate trực tiếp kèm link sang Release readiness, ARCHIVED dẫn sang Release readiness, ACTIVE có Archive, SUSPENDED không có Publisher lifecycle action.
- Release readiness cho phép Publisher chọn release mới khi Product ARCHIVED, hiển thị version current Release và số Subscription Offer hợp lệ, rồi refresh lại cả hai nguồn trước khi gửi `ACTIVATE`/`REACTIVATE`.
- Archive, Activate và Reactivate đều đọc lại Product, Release list/detail và public Marketplace eligibility sau mutation; public 404 sau Archive được xem là trạng thái hợp lệ, không biến một mutation đã thành công thành lỗi UI.
- Thêm test permission/readiness matrix. Browser mock xác nhận đúng payload `ARCHIVE`/`REACTIVATE`, refetch orchestration và viewport 390 px không horizontal overflow.

Acceptance:

- DRAFT: không có Archive; Activate chỉ bật khi Release/Offer hợp lệ.
- ACTIVE: có Archive; action thành công chuyển sang ARCHIVED và biến mất khỏi Marketplace.
- ARCHIVED: có Reactivate; thành công chỉ khi readiness vẫn hợp lệ.
- SUSPENDED: Publisher không có action vượt Admin decision.

### Phase 3 — Implement Admin Review Queue (blocker Admin)

- [ ] Thay placeholder bằng list `GET /submissions` theo Admin projection; có status/product/publisher filter và pagination.
- [ ] Detail hiển thị immutable Product snapshot, WorkflowRevision metadata, scan status/result/findings và review context.
- [ ] `APPROVE` chỉ bật khi `READY_FOR_REVIEW + PASSED + scanResult` và Product/Publisher còn eligible.
- [ ] `REQUEST_CHANGES`/`REJECT` bắt buộc feedback; hỗ trợ item-level `nodeId` nhưng không ép có nodeId.
- [ ] Gọi `PUT /submissions/:submissionId/review`; xử lý identical replay là success và conflicting replay là error rõ ràng.
- [ ] Hiển thị self-review forbidden, scan incomplete/failed, Product no longer eligible và build publish failure.
- [ ] Sau APPROVE, UI không nói “Live”; chuyển copy thành “Build requested” và link sang Release history/polling.

Acceptance:

- Admin có thể hoàn tất cả ba decision đúng rule.
- Publisher thấy status/feedback mới nhưng không thấy Admin-only scan evidence.
- Approve không tự hiển thị Product là Marketplace LIVE.

### Phase 4 — Automated test theo state machine

> Cập nhật 2026-11-21: frontend Offer editor đã tồn tại và browser contract test
> đã kiểm tra thao tác Save thật ở UI. Mục backend còn mở vì checkout chưa có
> isolated migrated test database nên không được gọi mock/service test là DB E2E.

Frontend unit/contract tests:

- [x] Product Offer parser/input builder giữ decimal string và full replacement.
- [x] Product lifecycle permission matrix cho DRAFT/ACTIVE/ARCHIVED/SUSPENDED.
- [x] Submission form limits, SemVer, idempotent intent restore/retry và uncertain outcome.
- [x] Release selectability/readiness, polling BUILDING và approved-without-release eventual consistency.
- [x] Publisher parsers loại Admin-only fields.

Frontend integration/browser tests:

- [x] Product DRAFT không Offer → readiness blocked.
- [x] Save Subscription Offer → Product detail refetch từ server và state `offers` mới có thể mở readiness. Browser mock xác nhận UI/request/refetch; database persistence được giữ cho live E2E.
- [x] Chọn current Release → vẫn DRAFT.
- [x] Activate → refetch thấy ACTIVE → public Marketplace list/detail có Product.
- [x] Archive → Marketplace không còn Product; Reactivate → Product xuất hiện lại.
- [x] New release PUBLISHED không tự thay current; Publisher chọn release mới thì Marketplace snapshot/version mới xuất hiện.
- [x] Desktop và mobile 390 px không horizontal overflow; keyboard/focus hoạt động trên forms/dialogs.

Backend tests:

- [x] Khôi phục Product Offer service/controller specs đã bị bỏ khỏi test suite.
- [ ] E2E DB test cho lock order/race: Offer replacement vs Activate, select-current vs disable, concurrent Submission create.
- [x] Kafka retry/idempotency test cho scan request và build request (service boundary; giữ nguyên message ID/payload qua retry/replay).
- [x] R2/Static cleanup test khi publication ineligible hoặc upload verification fail (Static/object boundary được mock, không tuyên bố là live R2 E2E).
- [x] Authorization test riêng cho Publisher owner, Admin unrestricted và self-review.

DB E2E còn mở vì database local đang thiếu migration
`20261117173000_add_product_offer` và repo chỉ có smoke E2E `GET /`; chạy migration
hoặc seed/race trên database dùng chung sẽ làm thay đổi dữ liệu ngoài phạm vi test. Mục
này cần một PostgreSQL test database cô lập, migrate từ zero và fixture Publisher /
Product / Submission / Release trước khi có thể xác nhận row-lock thực.

### Phase 5 — Live full-flow verification

Điều kiện bắt buộc:

- môi trường có PostgreSQL migration hiện tại;
- Kafka broker + scan/build consumers chạy;
- R2/S3-compatible storage và Static pipeline chạy;
- hai user riêng: Publisher và Admin reviewer;
- Publisher account/role/terms active;
- Node Catalog đồng bộ;
- Studio có thể save Draft với Runtime IR thật.

Kịch bản release đầu:

1. Studio tạo/sync Project và Draft version 1 có Runtime IR.
2. Publisher tạo Product DRAFT; xác nhận Product chưa có trên Marketplace.
3. Publisher cấu hình Subscription Offer.
4. Publisher tạo Submission với UUID `Idempotency-Key`; retry cùng key/cùng body trả cùng Submission.
5. Consumer scan chuyển `PENDING_SCAN → READY_FOR_REVIEW`; kiểm tra PASSED/FAILED/ERROR paths.
6. Admin APPROVE; xác nhận Product vẫn DRAFT và chưa có current Release.
7. Consumer tạo Release `BUILDING → PUBLISHED`; kiểm tra package R2/Static/hash, và Product vẫn DRAFT/current null.
8. Publisher chọn current Release; Product vẫn DRAFT.
9. Publisher ACTIVATE; Product thành ACTIVE và xuất hiện trên Marketplace list/detail với snapshot đã approve và live Offers.

Kịch bản update version:

1. Sửa Draft/Product metadata sau release 1; tạo Submission/release 2.
2. Release 2 PUBLISHED nhưng release 1 vẫn current và Marketplace vẫn dùng snapshot/version 1.
3. Chọn release 2 làm current; Marketplace chuyển sang snapshot/version 2.
4. Disable current release phải yêu cầu replacement hợp lệ khi Product ACTIVE.

Kịch bản lỗi bắt buộc:

- Draft version conflict; Runtime IR thiếu; Product metadata/media không hợp lệ.
- Open Submission conflict; Idempotency-Key reused với body khác.
- Scan ERROR retry; scan FAILED không được APPROVE.
- Author self-review; Product/Publisher mất eligibility trước approve/build.
- BUILD_FAILED/retry; Product archived/suspended trong lúc build.
- Select release khác Product, disabled hoặc package incomplete.
- Activate thiếu current Release hoặc thiếu Subscription Offer.
- Offer rate limit; Archive/Reactivate/Suspend permission boundaries.

## 6. Kết quả kiểm thử đã chạy trong audit này

### Static/source verification

| Check | Kết quả |
|---|---|
| Frontend `npm test` | Pass 4/4; chỉ cover draft decoder. |
| Frontend targeted ESLint cho Product/Submission/Release/routes | Pass. |
| Frontend full `npm run lint` | Fail: 23 errors, 10 warnings; phần lớn ngoài flow, có lỗi ở dead legacy `ProjectItem`. |
| Frontend `npm run build` | Pass; cảnh báo chunk chính lớn hơn 500 kB. |
| Backend `npm test` | Pass 204/204 trên 22 test files. |
| Backend `npm run build` | Pass. |

### Browser contract/UI E2E với mocked API

Đã test bằng API mock đúng shape hiện tại tại origin thực tế `https://api.a2matex.com/api/v1`:

- Project/Draft detail và compiled Runtime IR preflight.
- Product detail/list/filter; xác nhận Product page không có Offer editor và DRAFT lại có Archive.
- Submission preflight, empty-field validation, POST create và điều hướng sang detail.
- Submission APPROVED deep-link sang đúng Product Release.
- Release detail/current/readiness; gọi `PUT .../lifecycle` với `ACTIVATE` và nhận success.
- Marketplace public list và detail hiển thị Product/Release/Offer.
- Release page ở viewport 390×844 có `scrollWidth === clientWidth === 390`.
- Sau khi xóa lỗi từ lần mock sai origin và reload đúng route, không có page error mới; chỉ có Vite/React dev logs.

Artifacts tạm của browser QA nằm tại `/tmp/a2matex-publisher-flow-qa/screenshots/`, gồm Project/Draft, Submission, Release readiness, activation, Marketplace list/detail, mobile và hai blocker screenshots.

### Chưa được xác nhận

Các mục sau **không** được phép báo là pass từ browser mock:

- đăng nhập/permission thật của Publisher và Admin;
- DB transaction/row lock và migration trên môi trường deploy;
- Kafka scan/build message và retry/dead-letter;
- scanner xử lý Runtime IR thật;
- package encryption/hash/upload/download qua R2/Static;
- email review notification;
- live deployment có cùng commit/permission seed với hai checkout đã audit.

### Phase 4 verification — 2026-11-21

| Check | Kết quả |
|---|---|
| Frontend `npm test` | Pass 29/29, gồm rich-text normalization, Offer builder/error mapping, lifecycle, Product-detail activation reason, Submission intent/validation, Release polling/readiness và Publisher projection. |
| Frontend `npm run build` | Pass; còn cảnh báo chunk chính lớn hơn 500 kB. |
| Frontend targeted ESLint cho file Phase 4 | Pass. |
| Frontend full `npm run lint` | Vẫn fail baseline 23 errors, 10 warnings ở các module có sẵn; không có lỗi trong file Phase 4 mới. |
| Backend `npm test` | Pass 230/230 trên 29 test files sau khi thêm Product Offer, retry/idempotency, cleanup và authorization specs. |
| Backend `npm run build` | Pass sau `npm run prisma:generate`; generated Prisma Client trước đó cũ hơn schema Product Offer. |
| Backend `npm run lint` | Pass, còn 19 warnings có sẵn. |
| Browser contract flow | Pass các transition có UI: Product-detail Activate, Offer full-replacement PUT + refetch, rich-text editors, select-current, ARCHIVE, REACTIVATE, v2 không tự current, Marketplace v1→v2, mobile 390 px và dialog focus/Escape. |

Browser test dùng mocked HTTP contract nên chỉ chứng minh UI orchestration và request
payload. Nó không thay thế DB/Kafka/R2 E2E. Browser Chrome trong môi trường test cũng
đang ở version 148 và tool cảnh báo thấp hơn stable 158; kết quả layout/interaction vẫn
pass nhưng không được coi là browser compatibility matrix.

## 7. Thứ tự PR khuyến nghị

1. **PR 1 — Contract safety:** sửa publication comments/tests, ẩn `buildFailureCode`, chốt scanner và `usageInstructions` rule.
2. **PR 2 — Product Offers:** adapter, editor, validation/error mapping, readiness refetch.
3. **PR 3 — Lifecycle:** sửa Archive matrix, Reactivate, canonical activation CTA.
4. **PR 4 — Admin Review Queue:** list/detail/decision/feedback và authorization states.
5. **PR 5 — Automated flow tests:** frontend state-machine integration + backend concurrency/infrastructure tests.
6. **Release gate — Live E2E:** chạy hai kịch bản success và toàn bộ error matrix ở Phase 5, lưu API/DB/Kafka/R2 evidence.

Không nên gộp PR 2–4 thành một thay đổi lớn: Offer, lifecycle và review có quyền, transaction và failure modes khác nhau; tách PR giúp review contract và rollback an toàn hơn.
