# Kế hoạch triển khai Publisher Hub

> **Trạng thái triển khai ngày 2026-11-17:** Phase 0–5 đã hoàn thành trong marketplace frontend. Permission đọc Publisher `OWN` đã được cập nhật theo xác nhận của backend owner; vẫn cần smoke test E2E bằng access token Publisher trên môi trường tích hợp. Workflow tab là **read-only**; không gọi API lưu draft và không cho chỉnh sửa node.

## 1. Mục tiêu

Xây dựng Publisher Hub thành khu vực làm việc riêng cho publisher, có sidebar điều hướng và tab đầu tiên **Projects & Drafts**. Trong tab này, publisher có thể:

- xem danh sách project và draft hiện tại của từng project;
- xem preview workflow graph của draft;
- mở draft thành một workspace/tab có URL riêng;
- chọn từng node để xem metadata, `config` và `bindings` trong panel Detail read-only;
- dùng **Run** hoặc **Open in A2MaTeX Studio** để mở đúng cloud project trong ứng dụng desktop.

Mọi chỉnh sửa workflow/node chỉ thực hiện trong A2MaTeX Studio, không thực hiện trên Publisher Hub.

Kế hoạch này chỉ chốt chức năng chi tiết cho **Projects & Drafts**. Các mục sidebar khác được dựng route/layout và trạng thái “Coming soon”; nghiệp vụ của chúng cần đặc tả riêng.

---

## 2. Đánh giá độc lập yêu cầu ban đầu

### 2.1. Các giả định đang có trong yêu cầu

1. JSON trong project draft đủ để render và cấu hình mọi node.
2. Có thể tái sử dụng trực tiếp workflow editor từ `a2matex-studio` trong marketplace frontend.
3. Một project draft có thể được chuyển thành một hoặc nhiều “workflow tab”.
4. Website đã có cách mở A2MaTeX Studio và truyền `projectId`/hành động cần thực hiện.
5. Nút **Run** có thể chạy workflow hoặc ít nhất mở Studio tại đúng workflow.
6. Mockup là đặc tả đầy đủ cho layout, trạng thái lỗi và responsive.
7. Publisher đang có permission `OWN` để đọc các API Project/Project Draft.
8. API danh sách project hỗ trợ search/sort ở server.

### 2.2. Kết quả kiểm tra code hiện tại

- Marketplace đã có `PublisherHub`, `ProjectSidebar`, `ProjectItem`, API `GET /projects` và `GET /projects/:projectId/draft`.
- `ProjectItem` đang gọi draft riêng cho từng project khi expand và đang hiển thị release mock. Cách này dễ tạo N request và dữ liệu release giả không nên đi tiếp vào production.
- `PublisherHub` hiện chỉ có hai pane: danh sách project và `ProductForm`; chưa có sidebar điều hướng cấp Hub, route con hay workflow canvas.
- Marketplace chưa cài `@xyflow/react` và `zod`, chưa có test runner/component test.
- Studio dùng `@xyflow/react`, schema version 1 và Node Catalog. Publisher Hub chỉ tham chiếu phần decode/render/detail, không port command layer chỉnh sửa.
- API dùng prefix `/api/v1` và yêu cầu Bearer token, trừ endpoint compile hiện đang public.
- Quyền thực tế hiện tại không phù hợp với Publisher Hub:

  | API | Permission hiện tại | Điều kiện nghiệp vụ | Kết quả thực tế |
  | --- | --- | --- | --- |
  | `POST /projects` | Admin | PublisherAccount ACTIVE | Không ai dùng được; Admin không có PublisherAccount |
  | `GET /projects` | Admin, scope `null` | Không thêm điều kiện | Admin xem toàn bộ |
  | `GET /projects/:id` | Admin, scope `null` | Project tồn tại | Admin xem toàn bộ |
  | `PUT /projects/:id` | Admin, scope `null` | Project ACTIVE | Admin sửa được mọi project |
  | `PUT /projects/:id/archive` | Admin, scope `null` | Project tồn tại | Admin archive được mọi project |
  | `GET /projects/:id/draft` | Admin, scope `null` | Project tồn tại | Admin đọc được mọi draft |
  | `PUT /projects/:id/draft` | Admin nhưng service yêu cầu `OWN` | PublisherAccount ACTIVE, project ACTIVE | Không ai dùng được |
  | `POST /projects/:id/draft/compile` | Public | Project/draft chưa soft-delete | Ai biết UUID cũng gọi được |

- Database hiện có 7 protected permission liên quan `/projects`, tất cả chỉ gán cho `ADMIN` với scope `null`; `PUBLISHER` chưa được gán các permission này.
- Draft hiện tại có dạng chính:
  ```text
  draft
  ├── version
  ├── editorGraph
  │   ├── schemaVersion: 1
  │   ├── entryNodeId
  │   ├── nodes[]
  │   └── edges[]
  ├── inputSchema
  ├── runtimeIr
  └── validationSummary
  ```
- Node detail không thể đặt label/format đầy đủ chỉ từ `editorGraph`. Cần `GET /node-catalog?runtimeVersion=...` để biết schema, targeting mode, port và metadata node. Node Catalog hiện **chưa có cờ `secret`**, nên chưa thể nhận diện field nhạy cảm một cách đáng tin cậy.
- Backend đã có các endpoint cần thiết cho phần lớn MVP:
  | Mục đích | Endpoint |
  | --- | --- |
  | Danh sách project | `GET /projects` |
  | Đọc draft | `GET /projects/:projectId/draft` |
  | Lưu toàn bộ draft | `PUT /projects/:projectId/draft` |
  | Node definitions | `GET /node-catalog?runtimeVersion=...` |
  | Validate graph | `POST /workflow-validation` |
  | Compile draft đã lưu | `POST /projects/:projectId/draft/compile` |
- Studio hiện **chưa có custom protocol/deep-link** để website mở app tại một cloud project. Đây là thay đổi liên-repository, không thể hoàn thành chỉ trong `marketplace-fe`.
- Backend chưa có API “run workflow từ web”. Runtime cần app desktop/device context.
- `GET /projects` chỉ hỗ trợ `page`, `limit`, `status`; chưa có search/sort server-side.
- Archived draft vẫn đọc được, nên viewer xử lý ACTIVE và ARCHIVED giống nhau về khả năng xem.
- Contract save/compile vẫn được ghi lại ở mục 6 để tham chiếu, nhưng **không được gọi bởi workflow viewer MVP**.

### 2.3. Điểm cần điều chỉnh so với cách hiểu ban đầu

1. **Phải sửa quyền đọc trước frontend.** Nếu chỉ triển khai UI, publisher sẽ nhận 403 khi list/read project. MVP cần gán `GET /projects`, `GET /projects/:id` và `GET /projects/:id/draft` cho role `PUBLISHER` với scope `OWN`, đồng thời test publisher không đọc project của account khác.
2. **Viewer không cần compile.** Không gọi endpoint compile public từ Publisher Hub chỉ để hiển thị graph; `editorGraph` đã đủ cho canvas. Việc endpoint compile đang public vẫn là rủi ro backend độc lập cần xử lý.
3. **Không nên copy nguyên workflow editor của Studio.** Studio là TypeScript + Electron + Tailwind, còn marketplace hiện là JavaScript + CSS Modules. Copy nguyên khối sẽ kéo theo store, host API và domain phụ thuộc Electron. Nên tái sử dụng contract/thuật toán, rồi tạo web adapter mỏng.
4. **Không nên hiểu Run là tự động thực thi ngay.** Workflow Android cần device, capability và permission. Phương án an toàn là mở Studio tại project/workflow và đưa người dùng tới bước Run; Studio vẫn yêu cầu xác nhận trước khi thực thi.
5. **Không nên gọi mỗi draft trong từng row một cách phân tán.** Draft phải được fetch theo selection hoặc qua query cache có giới hạn concurrency.
6. **Workflow dùng route riêng nhưng được mở trong browser tab mới theo yêu cầu sản phẩm.** Chỉ CTA **Open workflow tab** được gọi `window.open()` trực tiếp từ user gesture để tránh popup blocker; canvas preview không điều hướng. Route riêng vẫn hỗ trợ reload, back/forward và bookmark trong tab workflow.
7. **Search hiện chỉ có thể chạy trên page đã tải.** Nếu sản phẩm cần search toàn bộ project, backend phải bổ sung query `search` và quy tắc sort; không nên tạo cảm giác frontend đang search toàn bộ khi thực tế chỉ lọc 10 item mặc định.
8. **Cần chốt chính sách thông số nhạy cảm.** Node Catalog hiện chưa mô tả field `secret`, vì vậy selective masking bằng frontend chưa khả thi. Khuyến nghị bổ sung metadata/redaction ở contract backend; trong mọi trường hợp viewer không log, analytics hoặc cung cấp copy-all cho config/bindings.

### 2.4. So sánh phương án

| Nội dung | Cách hiểu ban đầu | Phương án đề xuất |
| --- | --- | --- |
| Render graph | Parse JSON và render trực tiếp | Validate schema, normalize Node Catalog, sau đó map sang React Flow |
| Tái sử dụng Studio | Copy component | Chia sẻ contract/fixture; port adapter và form schema cần thiết |
| Mở workflow | Click canvas hoặc CTA | Chỉ CTA mở nested route trong browser tab mới |
| Node detail | Form có thể chỉnh sửa | Panel read-only; chỉnh sửa bằng Open in Studio |
| Run | Chạy ngay từ web | Deep-link Studio, mở đúng project và màn hình Run, người dùng xác nhận |
| Project list | Mỗi row tự fetch | Fetch khi chọn/prefetch có cache; không giữ release mock |
| Authorization | Giả định publisher đã dùng được API | Sửa permission `PUBLISHER + OWN` và test isolation trước |
| Search | Gửi query search lên API | MVP lọc page hiện tại hoặc bổ sung backend search trước |
| Compile | Gọi để dựng canvas | Không gọi trong viewer; render trực tiếp từ `editorGraph` |

---

## 3. Phạm vi

### 3.1. MVP

- Backend permission đọc cho Publisher `OWN` và project isolation tests là điều kiện mở khóa.
- Publisher Hub shell và sidebar.
- Projects & Drafts page.
- Project pagination, filter status, search trong page hiện tại; search/sort toàn bộ chỉ bật sau khi backend hỗ trợ.
- Draft metadata và canvas preview read-only.
- Workflow workspace có URL riêng.
- Select node và hiển thị panel Detail read-only dựa trên Node Catalog.
- Không có copy-all; chỉ triển khai selective masking/copy sau khi contract có metadata nhạy cảm rõ ràng.
- Nút Open Studio/Run dùng deep-link, có fallback khi app chưa cài.
- Responsive tối thiểu cho desktop/tablet; màn hình nhỏ hiển thị thông báo nên dùng desktop thay vì ép canvas quá hẹp.

### 3.2. Không thuộc MVP

- Chỉnh sửa hoặc lưu `config`, `bindings`, metadata hay vị trí node trên Publisher Hub.
- Thêm/xóa node, nối/xóa edge, duplicate node, auto-layout và multi-user collaboration.
- Chạy workflow trực tiếp trong browser.
- Releases thật, submission, payment, analytics và product publishing mới.
- Upload/resolve asset nhị phân trong node config.
- Android Inspector trên web.

Nếu sau MVP cần full graph editing, nên trích domain command/schema thành package dùng chung trước khi mở rộng.

---

## 4. Thiết kế trải nghiệm

### 4.1. Layout Publisher Hub

```text
App Header
└── Publisher Hub
    ├── Hub Sidebar
    │   ├── Projects & Drafts       (MVP, mặc định)
    │   ├── Products & Offers       (route placeholder)
    │   ├── Submissions & Scans     (route placeholder)
    │   ├── Release Versions        (route placeholder)
    │   ├── Payment Config          (route placeholder)
    │   └── Summary & Statistics    (route placeholder)
    └── Route Outlet
        ├── Project Directory pane
        └── Project Detail / Workflow Workspace
```

Sidebar cấp Hub và Project Directory là hai thành phần khác nhau. `ProjectSidebar` hiện tại nên đổi vai trò/tên thành `ProjectDirectoryPane` để tránh nhầm.

### 4.2. Route đề xuất

```text
/publisher/publisher-hub
  -> redirect /publisher/publisher-hub/projects

/publisher/publisher-hub/projects
/publisher/publisher-hub/projects/:projectId
/publisher/publisher-hub/projects/:projectId/draft
/publisher/publisher-hub/projects/:projectId/draft/workflows/:workflowKey

/publisher/publisher-hub/products
/publisher/publisher-hub/submissions
/publisher/publisher-hub/releases
/publisher/publisher-hub/payment
/publisher/publisher-hub/statistics
```

Với draft format hiện tại, `workflowKey` mặc định là `main`. Decoder vẫn nên đọc được legacy bundle có `workflows`/`entryWorkflow`; mỗi workflow trong bundle sẽ thành một internal tab. JSON sai hoặc schema version chưa hỗ trợ phải hiển thị lỗi có hướng dẫn mở bằng Studio mới hơn, không tự đoán/mutate payload.

### 4.3. Luồng Projects & Drafts

1. Vào `/projects`, tải page đầu tiên bằng `page=1&limit=10`; filter server chỉ nhận `ACTIVE|ARCHIVED`.
2. Chọn project, URL chuyển sang `/projects/:projectId/draft` và tải draft.
3. Detail pane hiển thị project metadata, `projectStatus`, draft version, `savedAt` và canvas preview read-only. `draft: null` là empty state hợp lệ, không phải lỗi.
4. Canvas preview không có hành vi điều hướng; chỉ nút **Open workflow tab** mở route workflow trong browser tab mới.
5. Workspace hiển thị canvas lớn; click node mở Node Detail drawer bên phải.
6. Drawer dùng Node Catalog để đặt label/format nhưng tất cả control là text/read-only, không có Save/Apply/Delete/Duplicate.
7. Hiển thị metadata (`id`, type, name, status), `config`, `bindings`, error policy và validation issue có sẵn trong draft.
8. Unknown/unsupported field hiển thị JSON read-only. Nếu catalog/backend bổ sung metadata `secret`, field đó phải được mask và không cho copy.
9. Project ACTIVE và ARCHIVED đều xem được; không có mutation trong cả hai trạng thái.
10. Nút **Edit in Studio** trong drawer mở đúng cloud project/node nếu deep-link hỗ trợ node id.
11. Nút **Fullscreen** gọi Fullscreen API cho toàn bộ workspace (canvas và drawer); `Esc` thoát chế độ toàn màn hình. Đây là browser fullscreen theo user gesture, không mô phỏng phím F11 bằng script.

### 4.4. Hành vi Run/Open Studio

- **Open in Studio:** mở cloud project tương ứng.
- **Run:** mở cloud project, chọn entry workflow và focus Run panel. Không tự bấm chạy.
- Deep-link đề xuất:
  ```text
  a2matex-studio://cloud-project/<project-uuid>?workflow=<encoded-key>&action=open
  a2matex-studio://cloud-project/<project-uuid>?workflow=<encoded-key>&action=run
  ```
- Deep-link chỉ truyền UUID/workflow key, tuyệt đối không đưa access token vào URL.
- Website thử mở protocol; sau một khoảng ngắn hiển thị fallback **Download Studio** và **Copy project ID**. Browser không có API đáng tin cậy để xác nhận app đã mở, nên UI không được báo “Opened successfully” một cách chắc chắn.

---

## 5. Kiến trúc frontend đề xuất

### 5.1. Cấu trúc file

```text
src/features/publisher/
├── routers/
│   └── publisherRoute.jsx
├── components/
│   └── PublisherHubLayout/
│       ├── PublisherHubLayout.jsx
│       ├── PublisherHubSidebar.jsx
│       └── PublisherHubLayout.module.css
├── pages/publisher-hub/
│   ├── projects/
│   │   ├── ProjectsDraftsPage.jsx
│   │   ├── ProjectDirectoryPane.jsx
│   │   ├── ProjectDraftOverview.jsx
│   │   └── hooks/
│   │       ├── usePublisherProjects.js
│   │       └── useProjectDraft.js
│   ├── workflow/
│   │   ├── WorkflowWorkspace.jsx
│   │   ├── WorkflowCanvas.jsx
│   │   ├── WorkflowNode.jsx
│   │   ├── NodeDetailDrawer.jsx
│   │   ├── hooks/useNodeCatalog.js
│   │   ├── model/workflowSchema.js
│   │   ├── model/draftDecoder.js
│   │   ├── model/reactFlowAdapter.js
│   │   └── store/useWorkflowViewerStore.js
│   └── placeholders/
│       └── PublisherSectionPlaceholder.jsx
└── api/
    ├── projectDraftApi.js
    ├── nodeCatalogApi.js
    └── workflowApi.js
```

Có thể di chuyển dần code hiện tại để tránh big-bang rewrite. Không xóa `ProductForm`; chuyển nó sang route Products & Offers khi nghiệp vụ route đó được chốt.

### 5.2. Dependencies

- `@xyflow/react`: canvas, node, edge, controls, minimap.
- `zod`: validate draft schema và Node Catalog tại boundary.
- Test stack đề xuất: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `msw`.

Marketplace đã có Zustand; dùng một store scoped theo workspace chỉ cho selection/drawer state là phù hợp. Draft từ server giữ read-only trong data hook/cache, không tạo working graph.

### 5.3. State model

```text
viewerDraft
├── version
├── contentHash
├── savedAt
├── editorGraph
├── inputSchema
├── runtimeIr
└── validationSummary

viewerState
├── workflow(s)
├── selectedWorkflowKey
├── selectedNodeId
├── detailDrawerOpen
└── loadStatus: idle | loading | ready | error
```

Quy tắc:

- Giữ response draft ở trạng thái bất biến; không mutate `editorGraph` khi map sang React Flow.
- Store chỉ giữ selection/UI state, không tạo working copy hoặc dirty state.
- Canvas không phát command thay đổi node/edge/position.
- Đổi project/workflow đóng drawer và hủy request cũ bằng `AbortController` hoặc request token.
- Không ghi `config`, `bindings`, secret hay toàn bộ draft vào console/analytics.
- `projectStatus = ARCHIVED` vẫn đọc được; chỉ hiển thị badge archived.

### 5.4. Decoder và React Flow adapter

Tham chiếu logic từ Studio, không import qua đường dẫn `../a2matex-studio`:

- `application/project/cloud-project-document.ts` cho flat graph và legacy bundle;
- `domain/project/workflow-document-schema.ts` và `workflow-persistence.ts` cho schema/migration;
- `presentation/features/workflow-editor/react-flow-adapter.ts` cho mapping node/edge;
- `NodeConfigurationInspector.tsx` và node configuration draft domain cho form config;
- `to-workflow-node-catalog.ts` cho normalize catalog.

Mapping chính:

- node position: `node.editor -> ReactFlow.position`;
- node id/type/name/disabled giữ nguyên;
- edge: `sourceNodeId -> source`, `targetNodeId -> target`;
- `sourcePort` quyết định source handle và màu success/error;
- target handle mặc định `in`;
- unknown node type vẫn render fallback node, nhưng disable config và báo Node Catalog không tương thích;
- canvas preview dùng `nodesDraggable={false}`, `nodesConnectable={false}`, `elementsSelectable={false}`;
- workspace MVP cho phép select/pan/zoom; chưa cho sửa topology.

### 5.5. Node Detail read-only

1. Tải Node Catalog theo runtime version.
2. Normalize `configSchema`, `inputSchema`, targeting và output ports theo cùng quy tắc Studio.
3. Hiển thị header: display name, node type, node id, description, disabled/error policy và issue count.
4. Hiển thị `config` theo schema dưới dạng label/value; enum hiển thị label nếu có nhưng giữ raw value trong tooltip khi phù hợp.
5. Hiển thị `bindings` theo từng input; phân biệt literal/expression/reference bằng badge, không chuyển đổi dữ liệu.
6. String dài, object, array và Android selector hiển thị bằng JSON/code viewer read-only có wrap/collapse.
7. Catalog hiện chưa có `secret`; MVP không được suy đoán bảo mật chỉ bằng tên field. Nếu backend bổ sung metadata/redaction trước khi release, field secret luôn mask và không có reveal/copy.
8. Unknown node/catalog unavailable vẫn hiển thị raw JSON read-only và CTA **Open in Studio**.
9. Drawer không render `<input>`, `<select>` hoặc control có thể thay đổi giá trị; không có Save, Apply, Delete hay Duplicate.

Acceptance đúng là: mọi node đều click được và xem được thông tin an toàn; mọi thay đổi phải mở A2MaTeX Studio.

---

## 6. API dùng cho viewer và contract tham chiếu

### 6.1. Tiền điều kiện authorization

Trước khi nối viewer UI, backend phải:

1. gán permission `GET /projects`, `GET /projects/:id`, `GET /projects/:id/draft` cho role `PUBLISHER`;
2. dùng scope `OWN` để publisher chỉ list/read project thuộc PublisherAccount của mình;
3. giữ Admin access tách biệt với publisher ownership;
4. bổ sung migration/seed idempotent và test permission matrix cho các route đọc;
5. xử lý rủi ro compile public độc lập; viewer không gọi endpoint này.

Frontend phải xử lý 403 rõ ràng, nhưng không dùng UI để che lỗi phân quyền backend.

### 6.2. API client cần bổ sung

```js
getProjects({ page, limit, status })
getProject(projectId)
getProjectDraft(projectId)
getNodeCatalog({ runtimeVersion, etag })
```

Không gửi `search`/`sort` lên `GET /projects` cho tới khi backend bổ sung contract. Node Catalog nên cache theo `runtimeVersion + ETag`; xử lý `304 Not Modified`. Runtime version chưa có trong project/draft flat hiện tại, nên MVP dùng biến cấu hình có tên rõ ràng, ví dụ `VITE_A2MATEX_RUNTIME_VERSION=0.1.0`. Về lâu dài backend/project manifest phải là nguồn sự thật.

### 6.3. Contract Project

Viewer MVP chỉ dùng `GET /projects` và `GET /projects/:projectId`. Các endpoint tạo/cập nhật/archive bên dưới được giữ làm tài liệu tham chiếu, không được gọi từ workflow tab.

Tất cả endpoint trong mục này dùng `Authorization: Bearer <access-token>`.

#### Tạo project

`POST /api/v1/projects`

```json
{
  "name": "My Automation Project",
  "description": "Optional description"
}
```

- `name`: bắt buộc, trim, 1–255 ký tự;
- `description`: tùy chọn, `string | null`, tối đa 4.000 ký tự;
- không chấp nhận field thừa;
- tên unique không phân biệt hoa thường trong cùng PublisherAccount;
- yêu cầu PublisherAccount ACTIVE;
- thành công trả HTTP 201 và `data.id`.

Các lỗi cần map: `Error.PublisherNotActivated`, `Error.PublisherBlocked`, `Error.ProjectArchived` (trùng tên project archived) và 422.

#### Danh sách project

`GET /api/v1/projects?page=1&limit=10&status=ACTIVE`

| Query | Mặc định | Hợp lệ |
| --- | --- | --- |
| `page` | `1` | số nguyên dương |
| `limit` | `10` | số nguyên dương |
| `status` | không lọc | `ACTIVE`, `ARCHIVED` |

Client phải đọc đầy đủ `items`, `totalItems`, `page`, `limit`, `totalPages`. Sau khi permission được sửa, Publisher scope `OWN` chỉ được nhận project thuộc PublisherAccount của mình. Search phía client chỉ lọc `items` của page hiện tại và phải được ghi nhãn/thiết kế phù hợp.

#### Chi tiết, cập nhật và archive

- `GET /api/v1/projects/:projectId`: UUID bắt buộc; project không tồn tại hoặc ngoài scope đều trả `404 Error.ProjectNotFound` để không làm lộ dữ liệu.
- `PUT /api/v1/projects/:projectId`: body phải có ít nhất `name` hoặc `description`; `description: null` dùng để xóa; chỉ project ACTIVE được sửa.
- `PUT /api/v1/projects/:projectId/archive`: không có body, có tính idempotent; gọi lại project đã archived vẫn thành công.

### 6.4. Contract Project Draft

#### Đọc draft

`GET /api/v1/projects/:projectId/draft`

Response luôn có `data.projectStatus`. `data.draft` có thể là object hoặc `null`; `null` là project hợp lệ chưa có draft. Draft archived vẫn đọc được và UI phải chuyển sang read-only.

Draft object gồm:

```text
id, projectId, version, editorGraph, inputSchema,
runtimeIr, validationSummary, contentHash, savedAt
```

#### Tạo/lưu draft — ngoài phạm vi viewer

`PUT /api/v1/projects/:projectId/draft`

```json
{
  "expectedVersion": 7,
  "editorGraph": {
    "schemaVersion": 1,
    "entryNodeId": "start",
    "nodes": [],
    "edges": []
  },
  "inputSchema": {
    "type": "object",
    "properties": {},
    "required": [],
    "additionalProperties": false
  },
  "runtimeIr": null,
  "validationSummary": {
    "status": "VALID",
    "errors": [],
    "warnings": []
  }
}
```

Contract tham chiếu cho Studio hoặc tính năng chỉnh sửa tương lai:

- `expectedVersion = 0` chỉ để tạo draft đầu tiên;
- `expectedVersion = N` chỉ update khi version hiện tại đúng bằng `N`;
- nội dung thay đổi thành công thường tăng version thêm 1;
- nội dung canonical giống hoàn toàn bản hiện tại trả acknowledgement hiện tại và không tăng version;
- tổng nội dung canonical tối đa 1 MiB;
- project archived trả `409 Error.ProjectArchived` và không lưu;
- response chỉ trả `id`, `version`, `contentHash`, `savedAt`; frontend phải merge acknowledgement vào state hiện tại, không thay toàn bộ draft bằng response này.

Conflict response HTTP 409 có:

```json
{
  "message": "Error.ProjectDraftVersionConflict",
  "details": {
    "currentVersion": 3
  }
}
```

Workflow viewer không gửi PUT, do đó không có dirty state, save acknowledgement hay conflict UI.

### 6.5. Compile Project Draft

`POST /api/v1/projects/:projectId/draft/compile`

- hiện không yêu cầu token; đây là rủi ro backend cần xử lý;
- không có request body;
- project/draft không tồn tại trả 404;
- graph hợp lệ và không hợp lệ đều trả HTTP 200;
- phải kiểm tra `data.success` và `data.validation.status`;
- workflow viewer không gọi endpoint này và không phụ thuộc runtime IR để render;
- khi `success = false`, `runtimeIr = null` và lỗi nằm trong `validation.errors[]` với `code`, `message`, `path`;
- compile response không đồng nghĩa artifact đã được ghi ngược vào Project Draft. Nếu sản phẩm cần persist `runtimeIr`/`validationSummary`, phải chốt thêm workflow backend để tránh một PUT thứ hai gây tăng version/conflict.

### 6.6. Error mapping của viewer

| Trường hợp | UX |
| --- | --- |
| 401 | Dùng auth refresh hiện có; nếu thất bại chuyển login |
| `403 Error.ProjectAccessDenied` | Không có quyền với project; quay về list và không tiết lộ metadata |
| `403 Error.PublisherNotActivated` | CTA hoàn tất kích hoạt PublisherAccount nếu access policy yêu cầu |
| `403 Error.PublisherBlocked` | Hiển thị hướng dẫn liên hệ hỗ trợ |
| `404 Error.ProjectNotFound` | Project không tồn tại hoặc ngoài scope; cùng một UX để tránh enumeration |
| 422 UUID/query không hợp lệ | Quay về list hoặc sửa query/route state |
| Catalog lỗi | Render fallback graph/raw detail; cho retry/Open Studio |
| Network timeout | Giữ màn hình hiện tại và cho Retry Load |
| Unsupported schema version | Read-only error state, yêu cầu Studio mới hơn |

---

## 7. Thay đổi cần thiết trong `a2matex-studio`

Đây là workstream riêng, nhưng là dependency bắt buộc để Open Studio/Run hoạt động đúng.

1. Đăng ký custom protocol `a2matex-studio` trong Electron builder và lúc app khởi động.
2. Xử lý Windows/Linux `second-instance`.
3. Parse URL bằng allowlist:
   - scheme/host/path cố định;
   - `projectId` phải là UUID;
   - `action` chỉ `open|run`;
   - giới hạn độ dài workflow key;
   - bỏ qua mọi token/URL lạ.
4. Nếu app chưa login, lưu pending intent trong memory và tiếp tục sau login.
5. Gọi `openCloudProject(projectId)`, resolve workflow, navigate tới `MainWorkflowPage`.
6. Với `action=run`, chỉ focus Run UI; vẫn yêu cầu user xác nhận device/permission.
7. Nếu project không thuộc account hiện tại, hiển thị lỗi rõ ràng và không tự đổi account.
8. Thêm integration tests cho cold start, app đang mở, malformed URL và unauthenticated flow.

Không truyền access token từ browser sang Electron qua custom protocol.

---

## 8. Các giai đoạn triển khai

### Phase 0 — Mở quyền đọc an toàn cho Publisher ✅

- Gán permission list/detail project và read draft cho `PUBLISHER` với scope `OWN`.
- Giữ response 404 thống nhất cho project không tồn tại/ngoài scope.
- Không cấp quyền mutation chỉ để phục vụ workflow viewer.
- Theo dõi việc bảo vệ compile endpoint như một security workstream riêng; viewer không gọi compile.
- Thêm permission matrix tests cho Admin, Publisher owner, Publisher khác account và anonymous.
- Cập nhật seed/migration để môi trường hiện có nhận permission mới một cách idempotent.

**Exit criteria:** Publisher list/read project và draft của chính mình; không truy cập project account khác; workflow viewer không có mutation request.

### Phase 1 — Chốt contract và fixture ✅

- Lấy fixture draft thực tế từ backend/Studio, gồm: graph tối thiểu, branch success/error, unknown node, secret field và invalid schema.
- Chốt runtime version source.
- Chốt cách nhận diện/redact field nhạy cảm vì Node Catalog hiện chưa có `secret` metadata.
- Chốt deep-link contract giữa marketplace và Studio.
- Quyết định legacy multi-workflow bundle còn cần hỗ trợ hay chỉ read-only.

**Exit criteria:** fixture parse được ở Studio và decoder web; OpenAPI/response envelope đã xác nhận.

### Phase 2 — Hub shell và routing ✅

- Tạo `PublisherHubLayout`, sidebar và nested routes.
- Chuyển project list hiện tại vào Projects & Drafts.
- Bỏ `MOCK_RELEASES`; thêm placeholder routes cho các section còn lại.
- Đồng bộ selection với URL, không giữ selection chỉ trong local state.

**Exit criteria:** reload/deep-link/back-forward giữ đúng tab và project.

### Phase 3 — Data layer Projects & Drafts ✅

- Chuẩn hóa API client và response parsing.
- Tách fetch project list khỏi product list; Projects & Drafts không nên fail vì API product lỗi.
- Implement pagination theo `page/limit/totalPages`, status filter server-side; không gửi search/sort chưa được backend hỗ trợ.
- Fetch draft khi select; cache theo project ID; chống race khi click nhanh.
- Thêm loading, empty, error, archived và no-draft states.

**Exit criteria:** không có N draft request khi render list; stale response không đè project đang chọn; pagination/status đúng contract; publisher chỉ thấy project OWN.

### Phase 4 — Canvas preview và workflow workspace ✅

- Cài React Flow/Zod.
- Implement schema, decoder, catalog normalizer và React Flow adapter.
- Tạo preview read-only và workspace route.
- Unknown/unsupported node có fallback.

**Exit criteria:** fixture Studio render đúng node, edge, position, success/error port; invalid graph không làm crash page.

### Phase 5 — Node Detail read-only ✅

- Implement Node Detail drawer từ catalog schema và raw node data.
- Hiển thị metadata, config, bindings, error policy và validation issues ở chế độ read-only.
- Không log/copy-all dữ liệu node; áp dụng mask nếu contract backend cung cấp metadata/redaction và fallback raw JSON cho unknown node.
- Loại bỏ toàn bộ input control, Save/Apply/Delete/Duplicate và workflow command handlers.
- Thêm CTA **Edit in Studio**; không gửi PUT/POST từ drawer.

**Exit criteria:** mọi node mở được detail an toàn; không thể thay đổi graph bằng mouse/keyboard/dev UI; Network panel không có mutation request khi tương tác với canvas/drawer.

### Phase 6 — Open Studio/Run

- Marketplace tạo deep-link + fallback UI.
- Studio đăng ký/parse protocol và mở đúng cloud project.
- Run action focus đúng workflow/Run panel nhưng không auto-execute.

**Exit criteria:** cold start và warm start đều mở đúng project; app chưa cài có fallback; URL độc hại bị từ chối.

### Phase 7 — QA, accessibility và rollout

- Keyboard selection cho project/node/drawer.
- Focus return khi đóng drawer, aria labels cho canvas controls.
- Performance test với 500/2.000/5.000 nodes; với graph lớn, preview chỉ render sau click hoặc hiển thị summary để tránh khóa main thread.
- Feature flag Publisher workflow editor.
- Logging tối thiểu: draft load, catalog failure, deep-link attempt; không log node config/bindings/secret.

**Exit criteria:** lint/build/test pass; checklist security/accessibility/performance pass.

---

## 9. Chiến lược test

### Unit

- permission/access policy matrix ở backend;
- flat graph và legacy bundle decoding;
- schema version/strict field/invalid JSON;
- React Flow node/edge/port mapping;
- catalog normalization;
- config/binding detail formatting không mutate raw data;
- sensitive-data policy (khi có metadata/redaction) và unknown node fallback;
- deep-link builder chỉ nhận UUID/action allowlist.

### Component

- pagination, status filter, search-current-page, loading/error/no draft;
- click preview mở đúng route;
- click node mở đúng drawer;
- detail values/validation issues/unsupported field;
- drawer không có editable control hoặc mutation action;
- ACTIVE và ARCHIVED đều xem được.

### Integration/E2E

- Publisher owner chỉ xem project/draft của mình; publisher khác account không truy cập được;
- project -> draft -> workflow -> select node -> view detail;
- canvas drag/connect/delete và drawer edit đều không tạo mutation;
- Node Catalog unavailable;
- deep-link Studio installed/not installed;
- archived project xem được ở chế độ read-only.

Fixture contract nên được chia sẻ giữa backend, Studio và marketplace. Tốt nhất tách schema/fixture ổn định thành package `@a2matex/workflow-contract`; nếu chưa làm package ngay, ít nhất CI phải chạy cùng bộ JSON fixture để tránh drift.

---

## 10. Tiêu chí nghiệm thu MVP

- Publisher có quyền đọc `OWN` end-to-end; không thể đọc project account khác.
- Workflow viewer không gọi save, validate hoặc compile endpoint.
- Publisher Hub có sidebar và Projects & Drafts là mục mặc định.
- Danh sách chỉ hiển thị project user được phép truy cập, phân trang/filter đúng contract và không còn release mock.
- Chọn project hiển thị draft metadata và graph preview đúng JSON.
- Click preview mở workspace route/tab, reload không mất context.
- Mọi node đều select được và mở Node Detail read-only.
- Không có input, Save, Apply, Delete, Duplicate, drag node hoặc connect/disconnect edge.
- Node không hỗ trợ không làm crash, hiển thị raw JSON read-only và Open in Studio.
- Config/bindings không bị log/analytics/copy-all; selective masking chỉ được nghiệm thu khi backend cung cấp metadata/redaction đáng tin cậy.
- Archived project là read-only.
- Run/Open Studio không chứa token trong URL, mở đúng cloud project; Run không tự thực thi khi chưa xác nhận.
- Loading/error/empty/unsupported states đều có UI.
- Lint, build, unit/component tests và luồng E2E chính pass.

---

## 11. Câu hỏi cần chốt trước khi code

1. “Tab” là internal workspace tab như đề xuất, hay bắt buộc mở browser tab mới?
2. Draft production chỉ còn flat `editorGraph`, hay phải hỗ trợ legacy bundle nhiều workflow?
3. Runtime version lấy từ đâu khi project hiện không trả manifest version?
4. Backend sẽ bổ sung `secret` metadata/redaction như thế nào? Không nên dùng heuristic theo tên field như một cơ chế bảo mật.
5. Deep-link Studio có cần truyền thêm `nodeId` để **Edit in Studio** focus đúng node?
6. `Run` chỉ mở Run panel hay product yêu cầu auto-run sau khi Studio mở? Nếu auto-run, cần thêm threat model và bước xác nhận trong Studio.
7. Các tab sidebar ngoài Projects & Drafts chỉ cần shell trong đợt này hay cũng phải triển khai nghiệp vụ?
8. Product có cần search toàn bộ project không? Nếu có, backend phải bổ sung `search`/`sort`; lọc page hiện tại không tương đương.

Khuyến nghị mặc định: cấp permission đọc `PUBLISHER + OWN`; dùng internal route tab; hỗ trợ flat graph + legacy read-only; runtime version qua config tạm thời; mọi node chỉ có Detail read-only; bổ sung metadata/redaction cho dữ liệu nhạy cảm; chỉnh sửa bằng **Edit in Studio**; viewer không gọi save/validate/compile; Run chỉ focus panel; các section khác là placeholder.
