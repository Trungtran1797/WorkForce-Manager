# Hướng dẫn Deploy WorkForce Manager lên VPS (gửi link demo cho khách)

Hướng dẫn này giúp bạn đưa toàn bộ ứng dụng (Frontend + Backend + SQL Server) lên 1 VPS bằng Docker, để gửi cho khách hàng 1 đường link demo dạng `http://<IP-VPS>/`.

---

## 1. Thuê VPS

Cấu hình cần đặt: **Ubuntu 22.04 LTS, 2 vCPU, 4GB RAM, 50GB SSD** (SQL Server cần tối thiểu 2GB RAM, chọn 4GB cho thoải mái).

### 1a. DigitalOcean / Vultr (dùng ngay - khuyến nghị cho demo hôm nay)

Cả 2 chỉ cần đăng ký bằng thẻ Visa/Mastercard, không cần duyệt tài khoản, tạo máy xong là dùng được ngay.

**DigitalOcean** (digitalocean.com):

1. Đăng ký tài khoản, thêm phương thức thanh toán (thẻ quốc tế).
2. Bấm **Create → Droplets**.
3. **Image**: Ubuntu 22.04 (LTS) x64.
4. **Plan**: Basic → Regular SSD → chọn gói **$24/mo (2 vCPU / 4GB RAM / 80GB SSD)** (có thể chọn gói thấp hơn 2GB RAM để thử nghiệm nhưng SQL Server sẽ chạy chậm/dễ out-of-memory).
5. **Datacenter region**: chọn **Singapore** (gần Việt Nam nhất, latency thấp).
6. **Authentication**: chọn **SSH Key** (khuyến nghị - paste public key của bạn) hoặc **Password**.
7. Đặt hostname (vd. `workforce-demo`) → **Create Droplet**.
8. Đợi khoảng 1 phút, Droplet sẽ hiển thị **địa chỉ IP public** (vd. `159.x.x.x`).
9. Firewall: vào tab **Networking → Firewalls** (hoặc dùng `ufw` trực tiếp trên VPS ở bước 5 của hướng dẫn này) - mở port `22`, `80`, `443`.

**Vultr** (vultr.com) - tương tự:

1. **Deploy New Server → Cloud Compute (Shared CPU)**.
2. **Location**: Singapore.
3. **Image**: Ubuntu 22.04 LTS.
4. **Plan**: chọn gói **4GB RAM / 2 vCPU / 80GB SSD** (~$24/mo, có thể có gói rẻ hơn theo khuyến mãi).
5. Thêm SSH key (Settings → SSH Keys) trước khi deploy để chọn ở bước tạo server.
6. **Deploy Now** → đợi vài phút tới khi server ở trạng thái **Running**, lấy **IP address**.

Sau khi tạo xong (cả 2 provider), bạn sẽ có:

- Địa chỉ IP public (vd. `159.x.x.x`)
- SSH key hoặc mật khẩu root để đăng nhập

> Lưu ý: Cả DigitalOcean và Vultr tính phí theo giờ/tháng dùng - nếu chỉ cần demo ngắn hạn, sau khi xong việc nhớ **Destroy/Delete** droplet/server để không bị tính phí tiếp.

### 1b. FPT Cloud (chuyển sang sau khi tài khoản được kích hoạt)

Khi tài khoản FPT Cloud đã được Sales kích hoạt, làm theo các bước trên **FPT Cloud Console** (fptcloud.com):

1. Vào **Compute → Instances** (hoặc "Máy chủ ảo") → **Create / Tạo mới**.
2. Chọn **Image**: Ubuntu 22.04 LTS.
3. Chọn **Flavor / Gói cấu hình**: tối thiểu 2 vCPU / 4GB RAM / 50GB SSD.
4. Chọn/tạo **Network** và gắn thêm **Floating IP (Public IP)** - đây sẽ là IP public dùng để truy cập từ internet (vd. `123.45.67.89`).
5. Tạo **Security Group / Firewall rule** cho phép các port:
   - `22/tcp` (SSH)
   - `80/tcp` (HTTP - ứng dụng demo)
   - `443/tcp` (HTTPS - nếu sau này gắn domain + SSL)
6. Chọn phương thức đăng nhập: tạo **SSH Key Pair** (khuyến nghị) hoặc đặt mật khẩu root.
7. Bấm **Create/Launch**, đợi vài phút tới khi instance ở trạng thái **Running**.

> Lưu ý: tên menu trên FPT Cloud Console có thể thay đổi theo phiên bản giao diện - nếu không thấy đúng tên mục, tìm theo từ khóa "Instance"/"Máy chủ ảo", "Floating IP"/"IP public", "Security Group"/"Tường lửa".

**Di chuyển sang FPT Cloud sau này**: lặp lại bước 1b để tạo VPS mới, sau đó thực hiện lại bước 2-5 của hướng dẫn này trên VPS mới (clone code, cấu hình `.env`, `docker compose up -d --build`), rồi cập nhật link demo gửi khách (mục 6) sang IP mới. Nếu có domain, chỉ cần đổi DNS record sang IP mới mà không cần đổi link.

---

## 2. Kết nối SSH và cài Docker

```bash
ssh root@<IP-VPS>

# Cập nhật hệ thống
apt update && apt upgrade -y

# Cài Docker + Docker Compose plugin
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin

# Kiểm tra
docker --version
docker compose version
```

---

## 3. Đưa code lên VPS

Cách đơn giản nhất là dùng Git (nếu code đã push lên GitHub/GitLab):

```bash
git clone <URL-repo-cua-ban>.git workforce-manager
cd workforce-manager
```

Nếu chưa có remote Git, có thể nén thư mục project trên máy local rồi `scp` lên VPS:

```bash
# Chạy trên máy local (PowerShell)
scp -r "d:\OneDrive\08- QL NhanSu" root@<IP-VPS>:/root/workforce-manager
```

---

## 4. Cấu hình môi trường production

Trong thư mục project trên VPS:

```bash
cp .env.example .env
nano .env
```

Điền các giá trị:

| Biến | Ý nghĩa | Ví dụ |
|---|---|---|
| `SA_PASSWORD` | Mật khẩu SQL Server `sa` (≥8 ký tự, có hoa/thường/số/ký tự đặc biệt) | `Wf2026@SqlStrong!` |
| `JWT_SECRET` | Chuỗi bí mật ký JWT, ≥32 ký tự | random string |
| `PUBLIC_URL` | URL khách sẽ truy cập | `http://123.45.67.89` |
| `ENABLE_SWAGGER` | `true` để khách xem/test API tại `/swagger` | `true` |
| `SEED_ENABLED` | `true` để tự tạo dữ liệu demo (phòng ban, dự án mẫu, 3 tài khoản) lần đầu chạy | `true` |

> **Lưu ý**: `.env` chứa thông tin nhạy cảm, **không commit lên Git** (đã có trong `.gitignore`).

---

## 5. Build & chạy

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Lần đầu chạy sẽ mất vài phút để build image + SQL Server khởi tạo + migration/seed dữ liệu. Theo dõi log:

```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

Khi thấy log không còn lỗi và backend đã sẵn sàng (Serilog in ra request log), mở port 80 trên firewall:

```bash
ufw allow 80/tcp
ufw allow OpenSSH
ufw enable
```

---

## 6. Gửi link demo cho khách

- **Ứng dụng**: `http://<IP-VPS>/`
- **API docs (Swagger)**: `http://<IP-VPS>/swagger`

**Tài khoản demo** (nếu `SEED_ENABLED=true`):

| Vai trò | Tài khoản | Mật khẩu |
|---|---|---|
| Super Admin | `admin` | `Admin@123` |
| Manager | `manager` | `Manager@123` |
| Employee | `employee` | `Employee@123` |

---

## 7. Quản lý sau khi deploy

```bash
# Xem trạng thái container
docker compose -f docker-compose.prod.yml ps

# Xem log
docker compose -f docker-compose.prod.yml logs -f

# Dừng toàn bộ
docker compose -f docker-compose.prod.yml down

# Cập nhật code mới rồi rebuild
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Dữ liệu SQL Server và file đính kèm dự án được lưu trong Docker volume (`mssql-data`, `uploads-data`) — **không** bị mất khi `down`/`up` lại hoặc rebuild. Chỉ mất khi chạy `docker compose down -v`.

---

## 8. (Tuỳ chọn) Gắn domain + HTTPS

Nếu có domain riêng (vd. `demo.saigonspices.com.vn`):

1. Trỏ DNS record `A` của domain về IP VPS.
2. Cập nhật `PUBLIC_URL=https://demo.saigonspices.com.vn` trong `.env`.
3. Cài Nginx + Certbot trên host (ngoài Docker) hoặc dùng thêm container `nginx-proxy` + `acme-companion` để tự cấp SSL Let's Encrypt và proxy vào container `frontend` (cổng 80).

Phần này có thể bổ sung riêng khi bạn đã có domain.
