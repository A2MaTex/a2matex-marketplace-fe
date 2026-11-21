# Kế hoạch triển khai Marketplace Public API trên Frontend

> **Nguồn:** `src/features/publisher/pages/marketplace_public_api.md`, cập nhật 2026-11-19.  
> **Phạm vi repo:** `a2matex-marketplace-fe`.  
> **Routes mục tiêu:** `/`, `/products/:productId`, `/publishers/:username`.  
> **Trạng thái:** Phase 4 đã triển khai local ngày 2026-11-20; Phase 5 QA/rollout còn lại.

## 1. Kết luận và hướng triển khai

Marketplace hiện tại mới là UI mock. Việc ghép API không nên chỉ thay `MOCK_PRODUCTS` bằng một request vì model, hành vi và nhiều control hiện có không khớp hợp đồng backend.

Hướng triển khai đề xuất:

1. Tạo data boundary riêng cho public API: public HTTP client, API adapters, contract parsers, error mapper, price/image utilities.
2. Chuyển trang Marketplace sang state URL-driven với `page` và `q`, phân trang và tìm kiếm server-side.
3. Thay Product Card mock bằng dữ liệu list thật, ảnh public theo variant và giá VND dạng chuỗi BigInt.
4. Thay Product Detail mock bằng detail API, gallery, release requirements, usage instructions và toàn bộ offers.
5. Thêm trang public Publisher theo `publisher.username`.
6. Không giữ các chức năng giả chưa có API như review, rating, download count, cart, promo code hoặc checkout.

```text
Public API
  ├─ GET /marketplace/products
  │    └─ Marketplace list + search + pagination
  ├─ GET /marketplace/products/:productId
  │    └─ Product detail + media + offers
  ├─ GET /marketplace/publishers/:username
  │    └─ Public publisher profile
  └─ GET /statics/images/:staticId?variant=...
       └─ Direct browser image URL
```

Không thêm React Query hoặc state library mới ở phase đầu. Các hooks `useState`/`useEffect` có cancellation đang được dùng trong Publisher Hub và đủ cho scope này. Chỉ cân nhắc thư viện cache sau khi đo được nhu cầu thực tế.

## 2. Các giả định cần kiểm chứng

| Giả định | Đánh giá độc lập | Quyết định trong kế hoạch |
| --- | --- | --- |
| Chỉ cần đổi `/products` thành `/marketplace/products` | Sai | Current UI model dùng `title`, `author`, USD, rating và badge; API dùng `name`, `publisher`, VND string, release và media. Cần parser + mapping UI mới. |
| Có thể giữ sort “Most Popular” và “Alphabet A-Z” | Không có API hỗ trợ | Loại bỏ/ẩn sort mock. Chỉ hiển thị thứ tự mặc định “Newest releases” cho tới khi backend có query contract. |
| Có thể filter Monthly/Lifetime/Free | Không có query hỗ trợ và public eligibility bắt buộc có SUBSCRIPTION | Loại bỏ filter license khỏi request/UI MVP; không gửi query lạ vì API trả 422. |
| Search hiện tại tìm cả author | Sai theo contract | Sửa placeholder/copy: API chỉ tìm theo tên và mô tả. |
| Giá có thể đổi sang `Number` để format | Sai, có thể mất chính xác | Validate chuỗi thập phân và format trực tiếp bằng `BigInt`; không dùng `parseInt`, `Number` hoặc phép tính floating point. |
| Có thể dùng `useStaticImage` hiện tại | Không tối ưu cho public image | Dùng URL trực tiếp để browser tận dụng `immutable` cache và `ETag`; không fetch blob rồi tạo object URL. |
| Detail có rating/review/downloads | Không có trong contract | Xóa khỏi production UI hoặc đặt ngoài scope; không giữ số mock cạnh dữ liệu thật. |
| Có thể mua hàng từ offers | Chưa có checkout/purchase endpoint | Phase này chỉ hiển thị và chọn offer. CTA mua hàng phải ẩn/disabled rõ ràng cho tới khi có contract mua hàng. |
| `description` và `usageInstructions` là HTML | Chưa được tài liệu public xác nhận | Khóa format ở Phase 0. Nếu là HTML thì sanitize bằng DOMPurify; nếu là plain text thì render text, không dùng `dangerouslySetInnerHTML`. |
| Nên hiển thị email Publisher | API có field nhưng không đồng nghĩa phải public trên UI | Mặc định không hiển thị để giảm scraping; chỉ bật sau quyết định sản phẩm rõ ràng. |
| Staging list rỗng là lỗi tích hợp | Sai theo tài liệu | Render empty state hợp lệ; không fallback về mock data. |
| Dùng `slug` làm route detail | API detail nhận `productId`, không nhận slug | Giữ `/products/:productId`; slug chỉ dùng cho copy/SEO khi có chiến lược route riêng. |

### 2.1. Quyết định cần chốt trước khi code UI cuối

- `description` và `usageInstructions` là plain text, Markdown hay sanitized HTML.
- Checkout/subscription activation có nằm trong sprint khác không; endpoint và permission tương ứng là gì.
- Email Publisher có được phép hiển thị công khai không.
- Có cần SEO metadata/server rendering không; Vite SPA hiện tại chỉ đổi `document.title` phía client.
- Có cần giữ quick tags hay thay bằng query examples. Nếu giữ, click tag chỉ được set `q`, không gửi filter khác.

## 3. Audit code hiện tại

| Khu vực | Hiện trạng | Thay đổi bắt buộc |
| --- | --- | --- |
| `marketplace/apis/product` | Gọi `/products`, chỉ có list, không có search/signal/parser | Chuyển sang `/marketplace/products`; thêm list/detail và chỉ serialize param hợp lệ. |
| `Marketplace.jsx` | Chỉ ghép Hero/Search/Grid, không giữ server state | Điều phối query URL, page, loading/error/empty và refetch. |
| `SearchBar.jsx` | Local state, filter license và quick tags mock | Dùng query thật; trim; không gửi `q` rỗng; giới hạn 100 ký tự; bỏ filter không được hỗ trợ. |
| `ProductGrid.jsx` | Bảy sản phẩm mock, sort client giả, featured card giả | Nhận page data thật; bỏ featured/sort mock; thêm skeleton, error, empty và pagination. |
| `ProductCard.jsx` | Props USD/rating/review/cart | Map public product; ảnh ICON/COVER; publisher link; VND; release version; bỏ review/cart mock. |
| `ProductDetailPage.jsx` | Toàn bộ dữ liệu mock | Fetch theo `productId`; render media, detail, offers, loading/error/404. |
| `LicenseTier.jsx` | Ba tier hard-code USD | Nhận `offers`; label theo `type`/`durationDays`; giữ `priceAmount` dạng string. |
| `PricingPanel.jsx` | Annual/USD/tax/promo/credits hard-code | Chỉ tóm tắt offer đang chọn; không promo/tax/credit conversion khi API không cung cấp. |
| `ReviewSection.jsx` | Rating và review mock có form submit giả | Không render trong public detail MVP; chờ review API riêng. |
| Static API | Có blob fetch hook cho authenticated editor | Thêm public URL builder theo `staticId` + variant; không thay luồng upload/editor. |
| Routing | Có list và detail, chưa có Publisher | Thêm `/publishers/:username`. |
| `src/lib/axios.js` | Tự gắn token và refresh 401 | Tạo public client không gắn Authorization/refresh; dùng chung base URL/timeout. |
| `usePagination.js`, `useDebounce.js` | File rỗng | Hoặc implement có test, hoặc không dùng; không giữ abstraction rỗng chỉ để “đủ kiến trúc”. |

## 4. Kiến trúc frontend đề xuất

Giữ phạm vi trong feature Marketplace, tránh trộn public API với API quản lý Product của Publisher.

```text
src/
├── lib/
│   ├── apiBaseUrl.js                 # một nguồn cho VITE_API_BASE_URL
│   └── publicAxios.js                # không token, không refresh session
└── features/marketplace/
    ├── apis/
    │   ├── product/
    │   │   ├── api.js                # list/get detail
    │   │   └── url.js
    │   └── publisher/
    │       ├── api.js                # get public publisher
    │       └── url.js
    ├── model/
    │   ├── marketplaceContract.js
    │   ├── marketplaceError.js
    │   ├── marketplaceContract.test.js
    │   └── marketplaceError.test.js
    ├── utils/
    │   ├── formatVnd.js
    │   ├── formatVnd.test.js
    │   ├── marketplaceMedia.js
    │   └── marketplaceMedia.test.js
    ├── hooks/
    │   ├── useMarketplaceProducts.js
    │   ├── useMarketplaceProduct.js
    │   └── usePublicPublisher.js
    ├── components/
    │   ├── ProductGrid.jsx
    │   ├── ProductCard.jsx
    │   ├── SearchBar.jsx
    │   ├── MarketplacePagination.jsx
    │   ├── ProductMediaGallery.jsx
    │   ├── LicenseTier.jsx
    │   └── PricingPanel.jsx
    └── pages/
        ├── home/Marketplace.jsx
        ├── product-detail/ProductDetailPage.jsx
        └── publisher/PublicPublisherPage.jsx
```

Tên API public phải rõ (`marketplaceProductApi`, `publicPublisherApi`) để không nhầm với `publisherProductApi` đang dùng trong Publisher Hub.

## 5. Data layer và contract boundary

### 5.1. Base URL và public HTTP client

Tách base URL thành một module dùng chung:

```js
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:9999/api/v1";
```

Điểm cần xử lý: default hiện tại trong `src/lib/axios.js` là port `8080`, trong khi tài liệu public ghi local port `9999`. Không tự đổi âm thầm nếu các API authenticated vẫn chạy ở `8080`; cần xác nhận một trong hai:

- toàn backend dùng `9999` và sửa default chung;
- hoặc dev dùng `.env.local` bắt buộc, bỏ phụ thuộc default;
- hoặc public/authenticated API thật sự ở hai origin khác nhau và cần hai env riêng.

`publicAxios`:

- dùng cùng base URL đã chốt;
- timeout 15 giây;
- không đọc token;
- không refresh token khi 401;
- không tự retry 4xx;
- có thể retry GET khi network/5xx ở hook với giới hạn rõ ràng, nhưng MVP ưu tiên nút Retry để tránh request ẩn.

### 5.2. API adapters

```text
marketplaceProductApi.list({ page, limit, q?, signal })
marketplaceProductApi.get(productId, { signal })
publicPublisherApi.get(username, { signal })
```

Quy tắc serialize list query:

- chỉ gửi `page`, `limit`, và `q` khi `q.trim()` khác rỗng;
- không gửi `q=`;
- không spread object filter từ UI vào params vì key lạ trả 422;
- `page` là integer > 0;
- `limit` dùng constant `10` cho MVP và không vượt `100`;
- trim `q`, giới hạn 100 ký tự trước khi gửi.

### 5.3. Contract parser

Parser chạy ngay sau API boundary và fail rõ khi backend drift.

Các model cần parse:

- `MarketplaceProductSummary`;
- `MarketplaceProductDetail`;
- `MarketplacePublisher`;
- `MarketplaceMedia`;
- `MarketplaceOffer`;
- `MarketplaceRelease`;
- page envelope và detail envelope.

Validation tối thiểu:

| Field | Validation |
| --- | --- |
| ID fields | non-empty string; UUID validation cho route/request nếu cần |
| `publisher` | object, `username` và `displayName` là string |
| `currentRelease` | object; version/publishedAt/minimum versions đúng kiểu |
| `priceAmount` | string khớp `/^\d+$/`; không coerce từ number |
| `durationDays` | integer dương cho SUBSCRIPTION; `null` cho ONE_TIME |
| `media[].type` | `ICON`, `COVER`, `GALLERY` |
| `sortOrder` | integer không âm |
| nullable fields | giữ `null`, không đổi thành chuỗi rỗng |
| list pagination | integer hợp lệ cho `page`, `limit`, `totalItems`, `totalPages` |

Do public eligibility yêu cầu current release và ít nhất một SUBSCRIPTION offer, `currentRelease` và `minimumSubscriptionOffer` nên được coi là bắt buộc trong parser list. Nếu backend trả thiếu, UI báo contract error thay vì âm thầm dựng card sai.

### 5.4. Error mapper

Chuẩn hóa về:

```js
{
  code,
  message,
  status,
  field,
  retryable,
}
```

Mapping tối thiểu:

| API error | UX |
| --- | --- |
| `Error.ProductNotFound` | Trang not-found chung; không suy đoán product bị khóa hay chưa publish. |
| `Error.PublicPublisherNotFound` | Publisher not found/unavailable. |
| `Error.StaticNotFound` | Ảnh fallback, không làm hỏng toàn card/detail. |
| `Invalid UUID` | “Invalid product link”; không retry tự động. |
| 422 message array | Join message có kiểm soát, map `path` về query/form; không render `[object Object]`. |
| Network/timeout | Error state có Retry. |
| 5xx | Service unavailable; Retry thủ công. |
| Contract parser error | “Unsupported response format”, log đủ context ở development. |

## 6. Price và media utilities

### 6.1. Giá VND không mất chính xác

```js
formatVnd("9007199254740993")
// dùng BigInt("9007199254740993"), không dùng Number(...)
// => "9.007.199.254.740.993 ₫" (theo locale vi-VN)
```

Utility phải:

- chỉ nhận chuỗi thập phân đã validate;
- dùng `BigInt`/`Intl.NumberFormat("vi-VN")`;
- không tính giá tháng tương đương bằng floating point;
- giữ nguyên `priceAmount` trong state và selected offer;
- hiển thị `durationDays` đúng offer đã chọn.

Label gợi ý:

- list: `Từ 100.000 ₫ / 7 ngày`;
- SUBSCRIPTION detail: `100.000 ₫ / 30 ngày`;
- ONE_TIME: `9.007.199.254.740.993 ₫ · Vĩnh viễn`.

### 6.2. URL ảnh public

```js
buildMarketplaceImageUrl(staticId, "medium")
// `${API_BASE_URL}/statics/images/${encodeURIComponent(staticId)}?variant=medium`
```

Quy tắc:

- variant bắt buộc thuộc `small | medium | large`;
- card cover: `medium`;
- product icon/publisher avatar: `small`;
- gallery thumbnail/main: `medium`;
- lightbox/download ảnh gốc: `large` chỉ khi user chủ động mở;
- `<img loading="lazy" decoding="async">` cho grid/gallery;
- `altText ?? product.name`;
- fallback khi `media` rỗng hoặc ảnh 404;
- không thêm cache-busting query vì asset immutable.

Media selection:

```text
icon   = first media type ICON by sortOrder
cover  = first media type COVER by sortOrder
gallery = GALLERY sorted by sortOrder
cardVisual = cover ?? icon ?? fallback
```

## 7. Marketplace list (`/`)

### 7.1. URL state

Nguồn state chính:

```text
/?q=reward&page=2
```

- parse URL an toàn; page sai/âm trở về 1 bằng `replace`;
- khi search mới, reset page về 1;
- back/forward phải khôi phục query và page;
- không để local SearchBar state lệch URL;
- có thể submit search thay vì request mỗi ký tự. Nếu dùng debounce, chọn 300–400 ms và abort request cũ.

### 7.2. Hook `useMarketplaceProducts`

- input `{ page, limit, q }`;
- AbortController khi query/page đổi hoặc unmount;
- giữ request mới nhất, không cho response cũ ghi đè;
- state `{ data, loading, error, refetch }`;
- data rỗng hợp lệ khác error;
- không fallback mock khi API trả `items: []`.

### 7.3. Product Grid

Thay UI mock bằng:

- loading skeleton có kích thước ổn định;
- error state + Retry;
- empty state riêng cho “chưa có product” và “không có kết quả search”;
- count từ `totalItems`, không hard-code `1420`;
- server pagination từ `page`/`totalPages`;
- aria label cho Prev/Next và disabled đúng boundary;
- không tự sort client vì sẽ làm sai pagination server.

### 7.4. Product Card mapping

| UI | API |
| --- | --- |
| title | `name` |
| description | `shortDescription` |
| publisher | `publisher.displayName || publisher.username` |
| publisher link | `/publishers/${publisher.username}` |
| version | `currentRelease.version` |
| release date | `currentRelease.publishedAt` nếu thiết kế cần |
| price | `minimumSubscriptionOffer.priceAmount` |
| price duration | `minimumSubscriptionOffer.durationDays` |
| image | COVER → ICON → fallback |

Click card điều hướng `/products/:id`. Publisher link bên trong card phải chặn navigation card hoặc cấu trúc link hợp lệ, tránh nested `<a>`.

Loại bỏ khỏi production card:

- rating/review mock;
- Most Popular/featured mock;
- Add to Cart/Purchase giả;
- USD/lifetime price suy diễn;
- terminal icon mặc định khi đã có media thật (chỉ dùng làm fallback).

## 8. Product detail (`/products/:productId`)

### 8.1. Fetch và states

`useMarketplaceProduct(productId)`:

- validate UUID trước request hoặc map 422 thành invalid link;
- abort khi route đổi/unmount;
- loading skeleton;
- 404 state không nói product “suspended”, “rejected” hay “deleted” vì API cố ý không phân biệt;
- network error có Retry;
- cập nhật `document.title` sau khi load và restore khi unmount.

### 8.2. Nội dung detail

Header:

- ICON/COVER;
- `name`, `currentRelease.version`;
- `shortDescription`;
- Publisher link;
- published date;
- minimum launcher/runtime versions.

Body:

- `description`;
- `usageInstructions` nếu không null;
- gallery đầy đủ, sorted theo `sortOrder`;
- lightbox dùng large image chỉ sau interaction;
- không render field rỗng thành section trống.

Nếu content là HTML:

- sanitize bằng DOMPurify với allowlist;
- cấm `style`, `script`, `iframe`, `object`, form và event handler;
- link ngoài thêm `rel="noopener noreferrer"`;
- không tin HTML chỉ vì dữ liệu đã qua Admin review.

Nếu content là plain text:

- render với `white-space: pre-wrap`;
- không parse HTML/Markdown ngầm.

### 8.3. Offers

`LicenseTier` nhận `offers` từ detail thay vì constant.

- giữ order backend trả;
- selected offer là `offer.id`, không phải tên giả `monthly/annual`;
- SUBSCRIPTION label từ `durationDays`;
- ONE_TIME/null duration là vĩnh viễn;
- format VND bằng BigInt utility;
- mặc định chọn subscription có giá tối thiểu nếu ID khớp, nếu không chọn offer đầu tiên;
- `PricingPanel` chỉ hiển thị offer đang chọn và tổng đúng chuỗi giá;
- không tính tax/free/credits/promo khi API không có dữ liệu;
- purchase CTA không gọi action cho tới khi có checkout API.

### 8.4. Phần phải bỏ/feature-gate

- downloads badge;
- verified studio badge nếu backend không có field tương ứng;
- star rating và review count;
- `ReviewSection` và form review;
- promo code;
- tax line;
- A2MaTeX credit equivalency;
- Purchase/Cart action chưa có API.

Giữ các phần này bằng mock sẽ làm người dùng hiểu nhầm rằng đó là dữ liệu thật và hành động có hiệu lực.

## 9. Public Publisher (`/publishers/:username`)

### 9.1. Route và fetch

Thêm route dưới `AppLayout`:

```text
/publishers/:username
```

`usePublicPublisher(username)` gọi endpoint public, abort khi route đổi và map 404 riêng.

### 9.2. UI

- avatar `small`, fallback initials;
- `fullName`, `username`, `bio`;
- website và social links chỉ render khi khác null;
- allowlist protocol `https:`/`http:` trước khi dùng URL;
- link ngoài mở tab mới với `rel="noopener noreferrer"`;
- không hiển thị email mặc định cho tới khi Product xác nhận nhu cầu;
- nếu sau này hiển thị email, dùng hành động chủ động thay vì in toàn bộ trong HTML để giảm scraping.

API hiện chưa có endpoint “products by publisher”. Không dựng danh sách sản phẩm của Publisher bằng cách tải toàn Marketplace rồi filter client vì sai pagination. Trang profile MVP chỉ hiển thị thông tin Publisher và link quay về Marketplace.

## 10. Các phase triển khai

### Phase 0 — Khóa contract và UX decisions

- [ ] Xác nhận local API port/base URL.
- [ ] Xác nhận format `description` và `usageInstructions`.
- [ ] Xác nhận email Publisher có hiển thị không.
- [ ] Chốt rằng checkout, cart và review ngoài scope hoặc cung cấp contract riêng.
- [ ] Lấy response fixtures thật cho list/detail/publisher, gồm empty list, 404 và 422 array.
- [ ] Xác nhận CORS cho header cần thiết nếu tạo public client riêng.

**Exit criteria:** không còn field UI quan trọng dựa trên mock hoặc format chưa biết.

### Phase 1 — Public data foundation

- [ ] Centralize API base URL.
- [ ] Tạo `publicAxios` không token/refresh.
- [ ] Cập nhật product URLs và adapters; thêm publisher adapter.
- [ ] Viết parser list/detail/publisher.
- [ ] Viết error mapper cho 404/422/network/contract.
- [ ] Viết `formatVnd` và image URL/media selector.
- [ ] Unit test mọi utility/contract boundary.

**Exit criteria:** fixtures tài liệu parse được; giá lớn hơn `MAX_SAFE_INTEGER` không mất chính xác; query không phát sinh key lạ hoặc `q=`.

### Phase 2 — Marketplace list

- [ ] Chuyển query/page thành URL state.
- [ ] Implement `useMarketplaceProducts` với abort/stale-response protection.
- [ ] Nối SearchBar vào `q`, bỏ license filter/sort không hỗ trợ.
- [ ] Refactor ProductGrid/ProductCard theo public model.
- [ ] Thêm direct image URL, lazy loading và fallback.
- [ ] Thêm loading/error/empty/search-empty states.
- [ ] Thêm pagination server-side.

**Exit criteria:** reload/back/forward giữ state; staging `items: []` hiện empty state; không còn product mock trong list.

### Phase 3 — Product detail và offers

- [ ] Implement detail hook và 404/invalid UUID states.
- [ ] Refactor header, content và publisher link.
- [ ] Implement media gallery variants.
- [ ] Refactor LicenseTier/PricingPanel từ `offers` thật.
- [ ] Bỏ/feature-gate review, rating, promo, downloads và purchase mock.
- [ ] Cập nhật title/accessibility/responsive states.

**Exit criteria:** deep-link detail hoạt động; mọi offer format chính xác; không có CTA giả; media rỗng không làm vỡ layout.

### Phase 4 — Publisher profile

- [x] Thêm route/component/hook.
- [x] Render nullable profile fields an toàn.
- [x] Validate external link protocols.
- [x] Avatar public image + fallback.
- [x] 404/empty/error/loading responsive states.

**Exit criteria:** link Publisher từ card/detail hoạt động và deep-link/reload ổn định.

Ghi chú triển khai 2026-11-20: trang profile không hiển thị email, chỉ render
link `http:`/`https:`, reset dữ liệu cũ khi đổi `username`, và đã kiểm tra deep-link
desktop/mobile bằng response mock theo contract. QA staging thật vẫn thuộc Phase 5.

### Phase 5 — QA và rollout

- [ ] Unit tests pass.
- [ ] Targeted ESLint + production build pass.
- [ ] Browser QA desktop/mobile cho list/detail/publisher.
- [ ] Test URL query, pagination, back/forward, abort request và Retry.
- [ ] Test actual staging empty list, không dùng mock fallback.
- [ ] Test ảnh small/medium/large và image 404 fallback.
- [ ] Test keyboard/focus/alt text/heading hierarchy.
- [ ] Kiểm tra CLS, lazy images và số request khi chuyển page/search.
- [ ] Rollout sau khi contract fixtures và content format được khóa.

## 11. Test matrix

### 11.1. Unit/contract tests

| Nhóm | Cases bắt buộc |
| --- | --- |
| List parser | valid page, empty items, media empty, invalid pagination, missing current release/minimum offer |
| Detail parser | nullable usage, all media types, multiple offers, invalid duration/type/price |
| Publisher parser | nullable social/bio/avatar, required username/fullName/email, wrong field types |
| Price | `"0"`, `"100000"`, `"9007199254740993"`, invalid decimal, leading zeros policy |
| Media | COVER preference, ICON fallback, no media, sort order, invalid variant |
| Query serializer | trim q, omit empty q, max length, page/limit boundaries, no unknown key |
| Errors | product/publisher 404, static 404, UUID 422, validation array, network timeout, parser error |

### 11.2. Browser scenarios

1. Mở `/`, tải page 1 và hiện count thật.
2. Search hợp lệ reset page về 1 và cập nhật URL.
3. Clear search không gửi `q=`.
4. Chuyển page, reload và back/forward giữ đúng data.
5. Đổi query nhanh không để response cũ ghi đè.
6. Empty staging hiện empty state, không hiện mock.
7. Card không ảnh dùng fallback; ảnh lỗi không phá layout.
8. Detail hợp lệ hiển thị gallery/offers/release requirements.
9. Detail UUID sai và 404 có thông báo trung tính.
10. Giá vượt `MAX_SAFE_INTEGER` hiển thị đúng từng chữ số.
11. Publisher profile có nullable fields không tạo link rỗng.
12. Desktop/mobile không overflow; keyboard truy cập search, pagination, offer selector và gallery.

## 12. Acceptance criteria

- Marketplace list, detail và Publisher profile dùng public API thật, không cần đăng nhập.
- Không còn dữ liệu mock được trình bày như dữ liệu thật trong ba màn public.
- Chỉ gửi query params hợp đồng cho phép.
- Search/page là URL-driven và hỗ trợ reload/back/forward.
- Request cũ được abort hoặc không thể ghi đè state mới.
- `priceAmount` không bao giờ đi qua `Number`/`parseInt`.
- Card dùng ảnh `medium`, avatar/icon dùng `small`, `large` chỉ tải khi user mở ảnh.
- Product không ảnh, usage null, social null và list rỗng đều có UI hợp lệ.
- Product 404 không suy đoán lifecycle nội bộ.
- Không hiển thị rating, review, downloads, checkout hoặc promo giả.
- Content động được render theo format đã xác nhận và sanitize nếu là HTML.
- Unit test, targeted lint, production build và browser QA pass.

## 13. Rủi ro và cách giảm thiểu

| Rủi ro | Tác động | Giảm thiểu |
| --- | --- | --- |
| Base URL local 8080/9999 không thống nhất | Request sai môi trường | Khóa Phase 0; dùng env rõ ràng, không rải fallback ở nhiều file. |
| Content format chưa rõ | XSS hoặc hiển thị raw markup | Không implement renderer cuối trước khi xác nhận; sanitize kể cả nội dung reviewed. |
| Giá bị coerce thành number | Sai giá nghiêm trọng | Parser giữ string, formatter BigInt, test số vượt safe integer. |
| UI giữ control mock | Gửi query lạ 422 hoặc tạo hành động giả | Bỏ/disable theo contract; chỉ thêm lại khi API hỗ trợ. |
| Public request dùng authenticated axios | Preflight/session coupling không cần thiết | Public client riêng, không Authorization/refresh. |
| Filter product theo Publisher ở client | Sai vì list phân trang | Không implement product list trên Publisher profile cho tới khi có endpoint server-side. |
| Staging rỗng bị hiểu là lỗi | Team thêm mock fallback vào production | Empty state và contract test rõ ràng. |
| Ảnh gốc tải cho grid | Tốn băng thông/LCP xấu | Variant bắt buộc, lazy loading, large on demand. |
| Backend thay response | UI lỗi âm thầm | Contract parser + fixtures + contract error state. |

## 14. Thứ tự PR đề xuất

1. **PR 1 — Contract foundation:** base URL/public client, adapters, parsers, errors, price/media utilities và tests.
2. **PR 2 — Marketplace list:** URL query, search, cards, images, pagination và states.
3. **PR 3 — Product detail:** detail fetch, gallery, content, offers; loại mock unsupported.
4. **PR 4 — Publisher profile:** route/profile/social/avatar/error states.
5. **PR 5 — QA/accessibility/performance:** browser coverage, responsive fixes, request/performance audit.

Không gộp checkout hoặc review vào các PR này nếu chưa có public contract riêng; làm vậy sẽ mở rộng scope và buộc frontend tiếp tục dựa vào dữ liệu giả.
