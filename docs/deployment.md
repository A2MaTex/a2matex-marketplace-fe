# Triển khai a2matex-marketplace-fe

Trang chạy tại **https://a2matex.com**, trên một VM Google Cloud **riêng**, độc lập
hoàn toàn với backend. Dựng ngày 2026-10-23.

## Kiến trúc

FE là SPA tĩnh: `npm run build` ra thư mục `dist/` gồm HTML, JS, CSS. Không có runtime,
không có cơ sở dữ liệu, không có migration. Vì vậy cách triển khai khác hẳn `a2matex-be`:

|                | a2matex-be                        | a2matex-marketplace-fe          |
| -------------- | --------------------------------- | ------------------------------- |
| Đóng gói       | Docker image, đẩy lên GHCR        | không, artifact là `dist/`      |
| Trên máy đích  | Docker Compose, 4 container       | Caddy cài thẳng bằng `apt`      |
| Mỗi lần deploy | pull image, migrate, thay container | rsync file tĩnh, không restart |
| Máy            | `a2matex-vps`, e2-small           | `a2matex-fe`, e2-micro          |

```
GitHub Actions (push vào main)            VM a2matex-fe  (34.126.95.145)
  npm ci → build → rsync  ───────────►  /var/www/fe
    (VITE_API_BASE_URL)                        │
                                               ▼
                                     caddy ──► a2matex.com     (file_server)
                                           └─► www.a2matex.com (301 về apex)

  Trình duyệt ──► https://api.a2matex.com/api/v1 ──► VM a2matex-vps (backend)
```

FE và BE **không nói chuyện với nhau ở tầng máy chủ**. Trình duyệt gọi thẳng API từ
domain riêng của nó. Hai VM không cần biết nhau tồn tại.

## Biến môi trường — điểm dễ sai nhất

Vite thay thế mọi biến `VITE_*` **ngay lúc build**, không đọc lúc chạy. Nên:

- Không có file `.env` nào trên VM cả. Đặt biến ở đó không có tác dụng gì.
- Mỗi môi trường cần một bản build riêng.
- Giá trị nằm trong file JS công khai → **không bao giờ đặt secret vào biến `VITE_*`**.
  Vì vậy `VITE_API_BASE_URL` khai ở GitHub **Variables**, không phải Secrets.

Thiếu biến thì `src/lib/axios.js` rơi về `http://localhost:8080/api/v1` mà **build vẫn
thành công**. Workflow có bước `Check build config` chặn trường hợp này.

## A. Thiết lập lần đầu (đã làm xong, ghi lại để dựng lại khi cần)

### A1. VM trên Google Cloud

```bash
export REGION=asia-southeast1 ZONE=asia-southeast1-b
export VM=a2matex-fe IP_NAME=a2matex-fe-ip
gcloud config set project a2matex-prod

gcloud compute addresses create "$IP_NAME" --region="$REGION"

gcloud compute instances create "$VM" \
  --zone="$ZONE" \
  --machine-type=e2-micro \
  --image-family=ubuntu-2404-lts-amd64 --image-project=ubuntu-os-cloud \
  --boot-disk-size=10GB --boot-disk-type=pd-balanced \
  --address="$IP_NAME" \
  --tags=a2matex-web \
  --metadata=enable-oslogin=FALSE
```

Tag `a2matex-web` dùng lại firewall rule `a2matex-allow-web` đã tạo từ hồi dựng backend
(rule là cấp mạng VPC, không gắn vào máy nào), nên **không phải tạo rule mới**.

`enable-oslogin=FALSE` bắt buộc, nếu không khóa SSH nạp qua metadata sẽ bị bỏ qua.

### A2. User `deploy`

Khóa sinh trên máy cá nhân, **không sinh trong Cloud Shell** (máy tạm, `$HOME` bị xoá sau
120 ngày không dùng). Khóa riêng cho FE, không dùng lại khóa của backend:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/a2matex-fe-deploy -N "" -C "github-actions-a2matex-fe"

echo "deploy:$(cat ~/.ssh/a2matex-fe-deploy.pub)" > /tmp/fe-ssh-keys
gcloud compute instances add-metadata "$VM" --zone="$ZONE" \
  --metadata-from-file ssh-keys=/tmp/fe-ssh-keys
rm /tmp/fe-ssh-keys
```

Từ đó **mọi lệnh trên máy chạy bằng user `deploy` qua khóa này**. Đừng dùng
`gcloud compute ssh`: nó tạo user Linux khác theo tài khoản Google của bạn, và bước
`chown /var/www/fe` bên dưới sẽ gán nhầm chủ, làm CI rsync không ghi được.

### A3. Caddy và tường lửa

```bash
ssh -i ~/.ssh/a2matex-fe-deploy deploy@<IP>

sudo apt update
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl rsync
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy

sudo mkdir -p /var/www/fe
sudo chown -R deploy:deploy /var/www/fe
sudo chmod 755 /var/www/fe
```

Tường lửa — **`allow OpenSSH` phải chạy trước `enable`**, bật ufw mà chưa mở SSH là tự
khoá mình ra ngoài, phải vào serial console mới cứu được:

```bash
sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
sudo ufw --force enable
```

Unit systemd của gói Caddy **không có `Restart=`**, nghĩa là Caddy chết thì site nằm luôn
tới khi có người dựng dậy. Backend không gặp chuyện này vì container có
`restart: unless-stopped`. Thêm drop-in cho ngang bằng:

```bash
sudo mkdir -p /etc/systemd/system/caddy.service.d
sudo tee /etc/systemd/system/caddy.service.d/restart.conf > /dev/null <<EOF
[Service]
Restart=on-failure
RestartSec=5s
EOF
sudo systemctl daemon-reload
```

### A4. DNS

Hai bản ghi A tại zonedns.vn, cùng trỏ về IP tĩnh của VM. Trang đó đăng nhập bằng **chính
tên miền `a2matex.com` làm username**, không phải email.

| Tên   | Loại | Giá trị          | TTL |
| ----- | ---- | ---------------- | --- |
| `@`   | A    | `34.126.95.145`  | 300 |
| `www` | A    | `34.126.95.145`  | 300 |

Không đụng `api` và `db` — hai bản ghi đó phục vụ backend và Cloud SQL.

**Xác nhận đủ bốn nameserver trước khi áp Caddyfile.** zonedns.vn đồng bộ lệch nhau vài
phút giữa `ns1` và `ns3`, mà Let's Encrypt giới hạn số lần xin chứng chỉ hỏng mỗi giờ:

```bash
for ns in ns1 ns2 ns3 ns4; do echo -n "$ns: "; dig +short A a2matex.com @$ns.zonedns.vn; done
```

### A5. Caddyfile

Bản chuẩn nằm ở [`deploy/Caddyfile`](../deploy/Caddyfile) trong repo này. Đưa lên máy:

```bash
ssh -i ~/.ssh/a2matex-fe-deploy deploy@<IP> 'sudo tee /etc/caddy/Caddyfile > /dev/null' < deploy/Caddyfile
ssh -i ~/.ssh/a2matex-fe-deploy deploy@<IP> 'sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy'
```

Caddy tự xin chứng chỉ Let's Encrypt lúc reload, mất khoảng 20 giây. Gia hạn tự động qua
HTTP-01 trên cổng 80 — **đừng đóng cổng 80**, kể cả khi thấy mọi thứ đã chạy HTTPS.

### A6. Secrets và variables trên GitHub

Repo FE > Settings > Secrets and variables > Actions.

| Loại         | Tên                  | Giá trị                               |
| ------------ | -------------------- | ------------------------------------- |
| Secret       | `VPS_HOST`           | `34.126.95.145`                       |
| Secret       | `VPS_USER`           | `deploy`                              |
| Secret       | `VPS_SSH_KEY`        | toàn bộ `~/.ssh/a2matex-fe-deploy`    |
| **Variable** | `VITE_API_BASE_URL`  | `https://api.a2matex.com/api/v1`      |

Secrets là per-repo, không dùng chung được với repo backend.

## B. Vận hành

### Deploy

Push vào `main`. Workflow build rồi rsync lên, không cần restart gì.

### Deploy tay (khi Actions hỏng)

```bash
VITE_API_BASE_URL="https://api.a2matex.com/api/v1" npm run build
rsync -az --delete -e "ssh -i ~/.ssh/a2matex-fe-deploy" \
  dist/ deploy@34.126.95.145:/var/www/fe/
```

### Quay lui

Không có kho artifact như GHCR của backend. Quay lui bằng cách build lại từ commit cũ:

```bash
git checkout <commit-cũ>
VITE_API_BASE_URL="https://api.a2matex.com/api/v1" npm run build
rsync -az --delete -e "ssh -i ~/.ssh/a2matex-fe-deploy" dist/ deploy@34.126.95.145:/var/www/fe/
git checkout main
```

Hoặc chạy lại workflow từ commit đó bằng `workflow_dispatch`.

### Xem log và trạng thái

```bash
ssh -i ~/.ssh/a2matex-fe-deploy deploy@34.126.95.145
sudo journalctl -u caddy -f
systemctl is-active caddy
sudo ufw status
```

### Đổi địa chỉ API

Sửa repository variable `VITE_API_BASE_URL` rồi chạy lại workflow. Không sửa gì trên VM —
giá trị nằm trong bundle, không nằm trong cấu hình máy.

## C. Sự cố thường gặp

| Hiện tượng                                   | Nguyên nhân thường gặp                                           | Cách kiểm                                               |
| -------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| Trang trắng, console báo gọi `localhost:8080` | Build thiếu `VITE_API_BASE_URL`                                   | Xem bước `Check build config` trong log Actions          |
| Vào route sâu bị 404                          | Mất `try_files` trong Caddyfile                                   | `curl -I https://a2matex.com/login` phải trả 200         |
| Người dùng vẫn thấy bản cũ                    | `index.html` bị cache sai                                         | `curl -I https://a2matex.com/` phải có `cache-control: no-cache` |
| Caddy không xin được chứng chỉ                | DNS chưa trỏ đủ cả 4 nameserver, hoặc cổng 80 bị chặn            | `dig`, `sudo ufw status`, `journalctl -u caddy`          |
| CI báo Permission denied lúc rsync            | Sai `VPS_SSH_KEY`, hoặc `/var/www/fe` không thuộc `deploy`        | `ls -ld /var/www/fe`                                     |
| Caddy 403 trên một file                       | `rsync -a` giữ nguyên quyền từ máy build; file quyền chặt quá     | `ls -l /var/www/fe/assets`, cần đọc được bởi user `caddy` |

## D. Chưa làm

- **Atomic release.** rsync ghi thẳng vào thư mục đang phục vụ, nên người dùng đang mở tab
  có thể 404 một chunk cũ trong lúc deploy. Khắc phục bằng symlink `current` ở thư mục cha
  (mount thư mục cha, không phải thư mục release — swap bằng `mv` gặp vấn đề inode).
- **Cổng lint trong CI.** Mã nguồn do nhóm khác giữ nên workflow không chạy lint. Hiện
  `npm run lint` fail 10 lỗi, trong đó `PermissionRolePage.jsx:215` gọi
  `setShowRevokeConfirm` chưa được khai báo — crash thật khi admin thu hồi toàn bộ quyền
  của một role.
- **Giám sát.** Không có gì báo khi site chết hoặc chứng chỉ không gia hạn được.
- **Siết CORS.** Backend đang để `CORS_ORIGIN=*`. FE dùng Bearer token trong localStorage
  chứ không dùng cookie nên vẫn chạy, nhưng nên đổi về `https://a2matex.com`.
