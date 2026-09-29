# OUTPUT — Login & Register Pages

> Ghi lại quá trình xây dựng trang Login và Register cho A2MaTeX Marketplace Frontend.

---

## 1. Phân tích yêu cầu

Từ ảnh thiết kế được cung cấp, xác định các thành phần cần xây dựng:

| Yếu tố | Mô tả |
|---|---|
| Nền trang | Dark full-bleed (`#0d0f1a`) |
| Card trung tâm | Bo góc, viền mờ, shadow sâu |
| Avatar icon | Box teal gradient bo góc 14px |
| Input field | Dark fill, teal focus ring, icon trái, toggle mật khẩu |
| Button chính | Gradient teal, full width |
| Social buttons | Secondary style, GitHub + Google |
| Checkbox TOS | Custom styled, teal khi checked |
| Navigation | Chuyển qua lại giữa `/login` và `/register` |

---

## 2. Kiểm tra codebase hiện tại

**Trạng thái ban đầu:**
- `Button.jsx` — file rỗng
- `Input.jsx` — file rỗng
- `LoginPage.jsx` — stub `<div>LoginPage</div>`
- `authApi.js`, `authStore.js` — rỗng
- `router.jsx` — có route `/login`, chưa có `/register`
- CSS framework: **không có Tailwind**, dùng thuần CSS + CSS Modules
- Dependencies: React 19, react-router-dom v7, zustand, axios

---

## 3. Các file được tạo / chỉnh sửa

### 3.1 `src/components/common/Button.jsx` + `Button.module.css`

**Mục đích:** Component tái sử dụng cho mọi nút bấm trong app.

**Props:**

| Prop | Type | Default | Mô tả |
|---|---|---|---|
| `variant` | `primary \| secondary \| ghost` | `primary` | Kiểu nút |
| `size` | `sm \| md \| lg` | `md` | Kích thước |
| `fullWidth` | `boolean` | `false` | Chiếm toàn bộ chiều ngang |
| `loading` | `boolean` | `false` | Hiện spinner, disable nút |
| `disabled` | `boolean` | `false` | Vô hiệu hoá nút |
| `leftIcon` | `ReactNode` | — | Icon bên trái label |
| `rightIcon` | `ReactNode` | — | Icon bên phải label |
| `type` | `string` | `button` | HTML button type |

**Variants:**
- `primary` — gradient teal `#00e5cc → #00c9b1`, chữ đen
- `secondary` — nền `#1e2130`, viền `#2e3448`, chữ sáng
- `ghost` — transparent, chỉ có viền

**Tính năng bổ sung:**
- Spinner CSS animation khi `loading=true`
- `transform: scale(0.98)` khi active
- `focus-visible` outline teal cho accessibility

---

### 3.2 `src/components/common/Input.jsx` + `Input.module.css`

**Mục đích:** Component input tái sử dụng với đầy đủ trạng thái.

**Props:**

| Prop | Type | Mô tả |
|---|---|---|
| `label` | `string` | Label uppercase phía trên |
| `hint` | `string` | Text gợi ý hiện top-right của label |
| `leftIcon` | `ReactNode` | Icon bên trong, bên trái input |
| `rightIcon` | `ReactNode` | Icon bên trong, bên phải (nếu không phải password) |
| `error` | `string` | Thông báo lỗi bên dưới field |
| `size` | `sm \| md \| lg` | Kích thước |
| `fullWidth` | `boolean` | Mặc định `true` |
| `type` | `string` | Khi `password`: tự thêm nút toggle show/hide |

**Tính năng:**
- `type="password"` tự sinh nút toggle Eye/EyeClosed (inline SVG, không cần thư viện icon)
- Teal focus ring `box-shadow: 0 0 0 3px rgba(0,229,204,0.12)`
- Error state: viền đỏ + `aria-invalid` + `role="alert"` cho accessibility
- `useId()` để tự sinh id liên kết label ↔ input

---

### 3.3 `src/features/auth/pages/AuthPage.module.css`

File CSS dùng chung cho cả LoginPage và RegisterPage.

**Bao gồm:**
- `.page` — full-viewport dark background, flex center
- `.card` — max-width 460px, border, shadow, border-radius 16px
- `.avatarWrap` — icon box teal gradient
- `.title`, `.subtitle` — typography
- `.form` — flex column, gap 16px
- `.serverError` — banner lỗi đỏ
- `.checkboxRow`, `.checkbox` — custom checkbox teal animated
- `.divider` — "hoặc" divider với line hai bên
- `.socialRow` — flex row 2 nút social
- `.switchText`, `.switchLink` — footer chuyển trang
- `.rememberLabel` — "ghi nhớ đăng nhập" (Login)
- `.forgotLink` — "Quên mật khẩu?" (Login)
- `.labelRow`, `.passwordLabel` — label row riêng cho password field trong Login

---

### 3.4 `src/features/auth/pages/RegisterPage.jsx`

**Route:** `/register`

**Fields:**
1. Tên người dùng (Username) — hint: `A-Z, 0-9, _`
2. Địa chỉ Email — hint: `Kích hoạt & Thông báo`
3. Mật khẩu — hint: `Tối thiểu 8 ký tự`, toggle show/hide
4. Xác nhận mật khẩu — hint: `Nhập lại khớp nhau`, toggle show/hide

**Validation (client-side):**
- Username: bắt buộc, regex `^[a-zA-Z0-9_]{3,20}$`
- Email: bắt buộc, format email cơ bản
- Password: bắt buộc, tối thiểu 8 ký tự
- Confirm password: bắt buộc, phải khớp password
- Checkbox TOS: bắt buộc tích

**Sau submit thành công:** điều hướng về `/login`

---

### 3.5 `src/features/auth/pages/LoginPage.jsx`

**Route:** `/login`

**Fields:**
1. Tên người dùng (Username)
2. Mật khẩu — toggle show/hide + link "Quên mật khẩu?"

**Extras:**
- Checkbox "Ghi nhớ đăng nhập trên thiết bị này"
- Social buttons: Google (trái) + GitHub (phải)

**Validation:** username và password bắt buộc

**Sau submit thành công:** điều hướng về `/`

---

### 3.6 `src/app/router.jsx`

Thêm route mới:

```js
{
  path: "/register",
  element: <RegisterPage />,
}
```

---

### 3.7 `src/index.css`

Sửa `#root` từ width cố định 1126px + border sang full-width để trang auth hiển thị full-bleed:

```css
/* Trước */
#root {
  width: 1126px;
  border-inline: 1px solid var(--border);
  text-align: center;
}

/* Sau */
#root {
  width: 100%;
  max-width: 100%;
  text-align: left;
}
```

---

## 4. Cấu trúc file sau khi hoàn thành

```
src/
├── components/
│   └── common/
│       ├── Button.jsx              ← Custom button (mới)
│       ├── Button.module.css       ← Styles button (mới)
│       ├── Input.jsx               ← Custom input (mới)
│       └── Input.module.css        ← Styles input (mới)
├── features/
│   └── auth/
│       └── pages/
│           ├── AuthPage.module.css ← Shared auth styles (mới)
│           ├── LoginPage.jsx       ← Cập nhật từ stub
│           └── RegisterPage.jsx    ← Tạo mới
└── app/
    └── router.jsx                  ← Thêm /register route
```

---

## 5. Lưu ý & bước tiếp theo

- `authApi.js` — cần implement `login()` và `register()` gọi API thật
- `authStore.js` (Zustand) — cần lưu `accessToken`, `user`, xử lý logout
- Social auth (GitHub/Google) — hiện là placeholder, cần OAuth flow
- Password reset — route `/forgot-password` chưa có
- Route guard — cần `PrivateRoute` wrapper để bảo vệ các trang yêu cầu đăng nhập
