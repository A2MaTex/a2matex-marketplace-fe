# Hướng dẫn sử dụng API nạp tiền (Top-up qua Sepay)

Tài liệu mô tả cách gọi và vận hành các API nạp tiền vào số dư ví (`Profile.balance`).

## 1. Luồng tổng quan

```
FE/App                     Backend                       Sepay              Ngân hàng
  │                           │                            │                    │
  ├─ POST /topups ───────────►│  tạo TopUpTransaction       │                    │
  │                           │  status = PENDING           │                    │
  │◄── referenceCode + STK ───┤                             │                    │
  │                                                         │                    │
  ├─ người dùng chuyển khoản, nội dung = referenceCode ────────────────────────►│
  │                                                         │◄── biến động số dư ┤
  │                           │◄── POST /topups/sepay/webhook                    │
  │                           │  khớp mã → CREDITED + cộng balance               │
  │                                                         │                    │
  ├─ GET /profiles/me ───────►│  đọc balance mới                                 │
```

Nếu webhook không tới (lỗi mạng, Sepay chậm), job `topup-reconcile` chạy định kỳ sẽ gọi
API danh sách giao dịch của Sepay và xử lý lại đúng logic đó (mục 7).


Luồng UI của FE:
- User vào trang profile -> click button "Top Up / Add Funds" -> 1 popup hiện lên với form để điền thông tin "amount": bigint -> nhập xong, click Submit -> FE gọi api POST /topups 
- Be xử lý và trả response gồm 
  {
    "referenceCode": "A2M7F3K9",      // mã tham chiếu duy nhất của yêu cầu này
    "amount": 500000,                  // đúng bằng amount đã gửi lên
    "bankAccountNumber": "0123456789",
    "bankName": "Vietcombank",
    "accountHolderName": "CONG TY A2MATEX",
    "transferContent": "A2M7F3K9"      // nội dung chuyển khoản — hiển thị cho user copy
  }

- FE dùng QR code của VietQR với cú pháp như sau để thả thẳng vào <img /> 
https://vietqr.app/img?acc=bankAccountNumber&bank=bankName&amount=amount&des=transferContent&template=compact&showinfo=true&holder=accountHolderName

ví dụ: https://vietqr.app/img?acc=0833803102&bank=VPBank&amount=400000&holder=SY+THI+QUYNH+NGA&template=compact&showinfo=true

- người dùng tiến hành quét mã. BE sẽ không bắn socket khi thành công, do đó, FE sẽ gọi api GET /profiles/me để xem số dư. cách 10s gọi 1 lần, nếu thấy sự khác biệt về balance thì đóng pop up mã QR và hiển thị thông báo dạng: "Đã nạp thành công 20.000 VND vào tài khoản" và ngừng gọi lại api GET /profiles/me.

- pop up code vào thư mục features/profiles/components/top-up

- lưu ý: khi đã gọi api POST /topups đến be thành công và tạo qr thì disable nút Submit để user không thay đổi amount nữa


## 2. `POST /topups` — Tạo yêu cầu nạp tiền

**Request body**:

```jsonc
{
  "amount": 500000 // số nguyên > 0, bắt buộc. Object là .strict() — field lạ sẽ bị từ chối
}
```

**Response `201`**:

```jsonc
{
  "data": {
    "referenceCode": "A2M7F3K9",      // mã tham chiếu duy nhất của yêu cầu này
    "amount": 500000,                  // đúng bằng amount đã gửi lên
    "bankAccountNumber": "0123456789",
    "bankName": "Vietcombank",
    "accountHolderName": "CONG TY A2MATEX",
    "transferContent": "A2M7F3K9"      // nội dung chuyển khoản — hiển thị cho user copy
  },
  "statusCode": 201
}
```

**Lỗi**:

| Status | Khi nào | Body |
| --- | --- | --- |
| `401` | thiếu/sai access token | `Error.MissingAccessToken` / `Error.InvalidAccessToken` |
| `403` | role của user chưa có permission record cho `POST /topups` → chạy `npm run seed:permissions` | mặc định `Forbidden` |
| `422` | `amount` không hợp lệ (≤ 0, không phải số nguyên, thiếu, hoặc có field lạ) | mảng issue của Zod |
| `503` | thiếu cấu hình `SEPAY_BANK_ACCOUNT_NUMBER` / `SEPAY_BANK_NAME` / `SEPAY_BANK_ACCOUNT_HOLDER` | `Error.SepayBankTransferNotConfigured` |

Body `422` (`CustomZodValidationPipe`, `path` đã được join bằng dấu chấm):

```jsonc
{
  "message": [
    { "code": "too_small", "path": "amount", "message": "Too small: expected number to be >0" }
  ],
  "error": "Unprocessable Entity",
  "statusCode": 422
}
```

**Lưu ý**: không có giới hạn min/max số tiền ở tầng API (v1). Mã tham chiếu dài 8 ký tự,
bảng chữ `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (đã bỏ I, O, 0, 1 để tránh nhầm khi gõ tay).

---

## 3. `GET /profiles/me` — Xem số dư

Không có API lịch sử nạp tiền trong v1. Số dư đọc qua endpoint profile có sẵn:

```bash
curl -s http://localhost:9999/api/v1/profiles/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

```jsonc
{
  "data": {
    "id": "...",
    "fullName": "...",
    "balance": 500000, // BigInt trong DB, serialize ra number trong response
    "roles": [...]
  },
  "statusCode": 200
}
```

FE sau khi hiển thị thông tin chuyển khoản nên poll endpoint này (hoặc cho user bấm "Tôi
đã chuyển khoản") để phát hiện tiền đã về — hệ thống không push notification trong v1.

---

## 4. Quy tắc khớp giao dịch cần nắm (quan trọng)

Những hành vi dưới đây là thực tế của code hiện tại, FE và bộ phận hỗ trợ cần biết:

1. **Chỉ khớp theo mã tham chiếu, KHÔNG đối chiếu số tiền.** Nếu user tạo yêu cầu 500.000
   nhưng chuyển 300.000 với đúng nội dung, hệ thống cộng **300.000** và đóng yêu cầu ở
   trạng thái `CREDITED`. `amount` trong yêu cầu chỉ mang tính hiển thị.
2. **Nội dung chuyển khoản có thể kèm chữ khác.** Ngân hàng thường chèn thêm text; miễn mã
   8 ký tự xuất hiện như một cụm trong `content` là khớp được. Rủi ro là khi mã bị dính
   liền ký tự chữ/số khác không có dấu cách — lúc đó regex cắt sai và không khớp.
3. **Chuyển khoản lần hai với mã đã dùng không cộng tiền.** Mã đã `CREDITED` không còn
   `PENDING`, nên giao dịch mới rơi vào `UNMATCHED` — phải xử lý tay, không tự cộng.
4. **Yêu cầu `PENDING` không hết hạn.** Không có job dọn dẹp; mã cũ vẫn khớp được sau
   nhiều ngày.
5. **Giao dịch `UNMATCHED` không có API tra cứu.** Phải query DB / Prisma Studio, cột
   `rawContent` + `receivedAmount` + `providerTransactionId` là manh mối để hoàn tiền hoặc
   cộng tay.

### Trạng thái `TopUpTransaction`

| Status | Ý nghĩa | `userId` | `creditedAt` |
| --- | --- | --- | --- |
| `PENDING` | đã tạo yêu cầu, chờ tiền về | có | `null` |
| `CREDITED` | đã nhận tiền và cộng vào `balance` | có | có |
| `UNMATCHED` | tiền về nhưng không khớp yêu cầu nào | `null` | `null` |