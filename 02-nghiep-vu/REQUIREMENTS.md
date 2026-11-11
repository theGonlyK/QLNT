# Yêu cầu và quy tắc nghiệp vụ

Trạng thái chung: `Dự thảo` — tổng hợp từ trao đổi với người dùng ngày 2026-11-06. Mức ưu tiên P1/P2/P3 theo thứ tự giai đoạn đề xuất ở cuối tài liệu.

## Tầm nhìn

> **Lưu ý:** Xem chi tiết ma trận phân rã và tiêu chí nghiệm thu kiểm tra được cho giai đoạn P1 tại [MA_TRAN_TRUY_VET_P1.md](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/02-nghiep-vu/MA_TRAN_TRUY_VET_P1.md).

Ứng dụng quản lý nhà trọ **mang lại cảm giác như đang chơi game hơn là đang quản lý thật**. Đích trải nghiệm là thế giới nhà trọ 3D camera isometric cố định; các giai đoạn đầu có thể dùng hình khối và sprite 2D trong cảnh 3D để xây dựng dần. Mỗi khách trọ là một avatar. Người thuê tìm trọ bằng cách đi dạo trong thế giới game. Thị trường đầu tiên là nhà trọ cho sinh viên và người đi làm tại Hà Nội.

## Nguyên tắc bắt buộc

| ID | Nguyên tắc | Nguồn | Trạng thái |
|---|---|---|---|
| NT-01 | **Hai lớp:** lớp game (hình ảnh, hiệu ứng, đồ vật, NPC) và lớp dữ liệu thật (khách trọ, phòng, hợp đồng, hóa đơn, thanh toán). Hành động game **không bao giờ** thay đổi dữ liệu thật. | Người dùng | Đã đồng ý |
| NT-02 | **Game phản ánh dữ liệu thật:** khi dữ liệu thật thay đổi, game tự diễn hoạt ảnh tương ứng. Ví dụ: khách chuyển khoản qua QR → avatar tự đi đóng tiền → chủ nhà nhận thông báo. Áp dụng tương tự cho các nghiệp vụ khác. | Người dùng | Đã đồng ý |
| NT-03 | Thay đổi dữ liệu thật chỉ qua thao tác có xác nhận rõ, có hoàn tác hoặc nhật ký. | Đề xuất BA | Đã đồng ý (cùng NT-01) |
| NT-04 | Đập phá chỉ áp dụng cho **đồ vật**, trong khung cảnh của chính người dùng; không tác động được avatar người thật. Avatar có thể đứng ngoài vùng tương tác như đang "hóng chuyện". | Người dùng | Đã đồng ý |
| NT-05 | Không chấm điểm hay hiển thị cảm xúc tiêu cực gắn với cá nhân khách trọ; trạng thái avatar gắn với sự việc (sự cố, nhắc lịch, thanh toán). | Đề xuất BA | Đã đồng ý (2026-11-07) |
| NT-06 | Bản đồ công khai chỉ hiển thị phòng trống và thông tin liên hệ chủ trọ đăng; không lộ dữ liệu khách đang ở. | Đề xuất BA | Đã đồng ý (2026-11-07) |
| NT-07 | **Bảo mật và riêng tư phòng đang thuê đối với Sale:** Sale trọ chỉ được tham quan khuôn viên ngoài và các phòng còn trống; tuyệt đối không thể vào hoặc xem thông tin riêng tư của các phòng đang có khách thuê. | Người dùng | Đã chốt (2026-11-06) |
| NT-08 | **Quy ước màu cảnh báo trạng thái:** Chấm than đỏ gắn với sự cố hỏng hóc thiết bị/phòng; chấm than vàng gắn với nhắc nhở kỳ đóng tiền trọ và hạn nhiệm vụ. | Người dùng | Đã chốt (2026-11-06) |

## Yêu cầu

| ID | Yêu cầu | Vai trò | Ưu tiên | Trạng thái xác nhận | Tiêu chí chấp nhận |
|---|---|---|---|---|---|
| R-01 | Dựng nhà trọ trong thế giới 3D camera isometric cố định: tòa nhà, tầng, phòng, chỗ để xe, lối thoát nạn; P1 có thể dùng hình khối/plane placeholder | Chủ trọ | P1 | Dự thảo | Dựng được một tòa nhà nhiều tầng trong cảnh 3D; người dùng xem và chọn được phòng bằng camera cố định |
| R-02 | "Phòng quản lý": chủ trọ ngồi một chỗ thao tác toàn bộ nghiệp vụ | Chủ trọ | P1 | Dự thảo | Mọi nghiệp vụ P1 làm được mà không rời màn hình chính |
| R-03 | Khách trọ là avatar; "thẻ nhân vật" chứa thông tin khách | Chủ trọ | P1 | Dự thảo | Thêm/sửa/xem khách qua thẻ nhân vật; chỉ chủ trọ thấy |
| R-04 | Nghiệp vụ cơ bản thể hiện bằng hoạt ảnh: nhận phòng, hợp đồng, gia hạn, trả phòng, chốt điện nước, sự cố | Chủ trọ | P1 | Dự thảo | Mỗi nghiệp vụ có hoạt ảnh và cập nhật dữ liệu thật đúng (NT-01, NT-02) |
| R-05 | **Quy trình đóng tiền trọ bản Miễn phí (thủ công):** Đến kỳ thu tiền, avatar chủ nhà tự động đi gõ cửa các phòng để thông báo; cửa phòng hiện icon chấm than vàng nhắc nhở. Khách trọ mở nhiệm vụ đóng tiền, tải lên ảnh chuyển khoản; avatar khách tự động đi đến phòng/chỗ chủ nhà để giao tiền. Chủ nhà kiểm tra và bấm **"Xác nhận đã nhận đủ tiền"** trên app để hoàn tất nhiệm vụ, tắt icon chấm than vàng ở cửa phòng. Khách hoàn thành sớm/đúng hạn được cộng điểm thưởng; quá hạn bị trừ điểm thưởng nhiệm vụ. | Chủ trọ, khách | P1 | Đã chốt (2026-11-07) | Thao tác thủ công đầy đủ luồng gõ cửa, chấm than vàng, nộp bill ảnh, diễn hoạt avatar nộp tiền, chủ nhà duyệt tiền tắt chấm than và cộng/trừ điểm thưởng đúng hạn |
| R-05b | **Quy trình đóng tiền trọ bản Trả phí (tự động):** QR thanh toán động cho từng phòng, kết nối ngân hàng/cổng thanh toán để tự động ghi nhận tiền về và đồng bộ trạng thái game. | Chủ trọ, khách | P3 | Đã chốt (2026-11-06) | Thanh toán thật tự động đối soát, kích hoạt hoạt ảnh và thông báo |
| R-06 | Nhiệm vụ hằng ngày sinh ra từ việc thật; hoàn thành nhận phần thưởng trang trí | Chủ trọ | P1 | Dự thảo | Danh sách nhiệm vụ khớp việc cần làm thực tế |
| R-07 | Chế độ xả giận: đập phá đồ vật; NPC lao công đến dọn và khôi phục nguyên trạng | Chủ trọ, khách | P1 | Đã đồng ý | Phá được đồ vật; sau khi dọn trở về đúng trạng thái ban đầu; dữ liệu thật không đổi |
| R-08 | Avatar đứng ngoài vùng tương tác "hóng chuyện" khi có đập phá | Chủ trọ, khách | P1 | Đã đồng ý | Avatar không bị tác động, có hoạt ảnh quan sát |
| R-09 | Bản đồ khu phố Hà Nội trong thế giới 3D camera cố định; người thuê đi dạo, lọc khu vực/giá, xem phòng trống | Khách | P2 | Dự thảo | Tìm và xem được phòng trống đã đăng; điều khiển camera tự do không thuộc phạm vi hiện tại |
| R-10 | Chủ trọ bật "Hiện trên bản đồ" và để thông tin liên hệ | Chủ trọ | P2 | Dự thảo | Người thuê liên hệ được chủ trọ từ ứng dụng |
| R-11 | Chuyển trọ: người thuê tìm nhà mới trong game; avatar "dọn sang" nếu chủ trọ mới dùng QLNT | Khách | P2 | Dự thảo | Luồng chuyển trọ hoàn chỉnh |
| R-12 | Xác minh chủ trọ và báo cáo tin sai | Quản trị | P2 | Dự thảo | Có quy trình xác minh, xử lý báo cáo |
| R-13 | Mô hình gói sản phẩm: Bản Miễn phí chạy độc lập/thủ công; Bản Trả phí đồng bộ đám mây, hóa đơn/đối soát tự động, tin nổi bật, đồ trang trí cao cấp | Chủ trọ | P1 (miễn phí) / P3 (trả phí) | Đã chốt (2026-11-06) | Chuyển từ miễn phí lên trả phí không phải nhập lại dữ liệu |
| R-14 | Hỗ trợ kết nối thiết bị ngoại vi (camera, báo cháy, báo động, khóa thông minh) — **tùy chọn** | Chủ trọ | P3 | Đã đồng ý là tùy chọn; giải pháp do mảng B đánh giá | Theo đánh giá kỹ thuật |
| R-15 | Có web và app mobile (mức cơ bản) | Tất cả | P1 | Đã đồng ý mục tiêu; công nghệ do mảng B đánh giá | Theo đánh giá kỹ thuật |
| R-16 | Chế độ xem dạng danh sách dự phòng cho người không quen giao diện game | Chủ trọ | P2 | Đề xuất BA | Mọi dữ liệu xem được ở dạng danh sách |
| R-17 | **Quản lý thiết bị phòng trọ:** Quản lý danh mục thiết bị mặc định và thiết bị tiện nghi bổ sung (tủ lạnh, giường, tủ quần áo, bếp...). Khách có thể sắp xếp vị trí hoặc thay đổi bề ngoài (skin) trong game nhưng các thiết bị cố định bắt buộc phải có đủ theo hợp đồng. | Chủ trọ, khách | P1 | Đã chốt (2026-11-06) | Thiết lập danh mục thiết bị từng phòng; khách tùy biến sắp xếp/giao diện; trạng thái số lượng thiết bị bảo toàn |
| R-18 | **Báo hỏng và lịch sử thiết bị:** Khách/chủ báo hỏng thiết bị, trong suốt thời gian chưa sửa chữa thiết bị luôn hiển thị icon **chấm than đỏ**. Chủ trọ cập nhật xác nhận khi sửa chữa hoặc thay thế hoàn tất. Mọi sự cố và sửa chữa được lưu lại trong lịch sử trọ của từng phòng và từng khách thuê (nếu gắn tên). | Chủ trọ, khách | P1 | Đã chốt (2026-11-06) | Hiển thị chấm than đỏ liên tục đến khi sửa xong; nhật ký lịch sử phòng/khách ghi nhận chính xác thời gian và nội dung xử lý |
| R-19 | **Minigame săn bắt sinh vật nhỏ (chuột, gián):** Sinh vật nhỏ xuất hiện ngẫu nhiên chạy trong khuôn viên hoặc phòng trọ; avatar có thể trang bị các vật dụng gia đình làm "vũ khí" (nồi, chảo, chổi, dép...) để săn bắt, tạo trải nghiệm giải trí xả stress nhẹ nhàng. | Khách, chủ trọ | P1 | Đã chốt (2026-11-06) | Diễn hoạt sinh vật chạy và avatar dùng công cụ săn bắt; không ảnh hưởng dữ liệu phòng hay đồ đạc thật |
| R-20 | **Vai trò Sale trọ:** Chủ trọ tạo tài khoản Sale trọ (hệ thống tự tạo avatar Sale tương ứng) và cấp quyền có thời hạn (muốn tiếp tục phải xin chủ nhà gia hạn). Avatar Sale chỉ được tham quan khuôn viên chung và các phòng đang trống để lấy thông tin mời chào (hình ảnh, kích thước, diện tích, thiết bị, đánh giá của khách cũ); tuyệt đối không được vào phòng đang có khách ở. Sale có thể đính kèm bài viết/bài đăng quảng bá theo từng phòng để chủ trọ theo dõi. | Chủ trọ, Sale | P2 | Đã chốt (2026-11-06) | Tạo tài khoản/avatar sale; giới hạn di chuyển chỉ ở phòng trống và khuôn viên; hiển thị gói thông tin mời chào và bài đăng liên kết |
| R-21 | **Hệ sinh thái tích điểm & Đổi quà (Gamification Economy):** Điểm thưởng tích lũy (từ đóng tiền đúng/sớm hạn, làm nhiệm vụ) được sử dụng cho: (1) Đổi quà trang trí phòng, đổi hoạt ảnh/skin thiết bị trong phòng; (2) Đổi skin/hoạt ảnh avatar nhân vật, skin vũ khí (nồi, chảo, chổi, dép...) khi đập phá xả giận hoặc săn chuột/gián; (3) Đổi phiếu khuyến mãi, voucher giảm giá tiền thuê/dịch vụ; (4) Mua sao tặng chủ nhà: Khách trọ dùng điểm mua sao tặng chủ trọ; đánh giá uy tín của chủ nhà trọ được tích lũy theo lượng sao nhận được để hiển thị xếp hạng trên bản đồ công khai. | Khách, chủ trọ | P1 (quà, skin, vũ khí, tặng sao) / P2 (voucher, sao hiển thị bản đồ) | Đã chốt (2026-11-07) | Khách dùng điểm đổi được skin/quà/sao; chủ nhà tích lũy sao uy tín từ đánh giá thật của khách |

## Giai đoạn đề xuất

- **P1 — Bản thử cảm giác game:** một tòa nhà trong cảnh 3D camera cố định, dùng hình khối đơn giản và sprite/plane 2D khi phù hợp; avatar, nghiệp vụ cơ bản, thiết bị/báo hỏng, luồng đóng tiền thủ công, điểm thưởng và minigame. Thử với 5–10 chủ trọ; ưu tiên kiểm chứng tác vụ và hiệu năng trước độ chi tiết asset.
- **P2 — Kết nối người thuê & mở rộng cảnh:** mở rộng cảnh 3D camera cố định cho bản đồ/khu vực cần thiết; thay dần placeholder bằng asset 3D ưu tiên; triển khai đăng tin, liên hệ, chuyển trọ, Sale và voucher theo phạm vi đã duyệt.
- **P3 — Trả phí và hoàn thiện 3D:** nâng chất lượng model/animation/ánh sáng có chọn lọc; đồng bộ đám mây, hóa đơn và đối soát thanh toán tự động, tin nổi bật, kết nối thiết bị ngoại vi.

## Câu hỏi cần làm rõ

| Câu hỏi | Ảnh hưởng nếu chưa rõ | Người cần quyết định | Trạng thái |
|---|---|---|---|
| Câu "...và thông báo đến chủ nhà, khi chủ nhà..." (2026-11-06) chốt: luồng thanh toán thủ công (P1) qua nhiệm vụ avatar nộp bill, chấm than vàng, chủ nhà duyệt bill, thưởng/trừ điểm; bản trả phí tự động (P3). | Luồng thanh toán R-05 | Người dùng | **Đã chốt** (2026-11-07) |
| Vai trò "sale trọ": giữ lại và phân quyền xem phòng trống có thời hạn, cấm vào phòng có khách, gắn bài đăng. | Phân quyền, phạm vi | Người dùng | **Đã chốt** (2026-11-06, đưa vào P2) |
| Thiết bị phòng trọ, cảnh báo hỏng (chấm than đỏ), lịch sử sửa chữa và minigame bắt chuột gián bằng nồi chảo chổi dép. | Nghiệp vụ thiết bị & giải trí | Người dùng | **Đã chốt** (2026-11-06, đưa vào P1) |
| Sử dụng điểm thưởng: đổi quà trang trí, skin thiết bị/avatar/vũ khí, voucher giảm giá, mua sao tặng chủ nhà tích lũy uy tín. | Gamification Economy | Người dùng | **Đã chốt** (2026-11-07) |
| Đồng ý NT-05 (không chấm điểm tiêu cực cá nhân) và NT-06 (bản đồ chỉ hiện phòng trống)? | Quyền riêng tư | Người dùng | **Đã đồng ý** (2026-11-07) |
| Một hệ thống cho nhiều chủ trọ (SaaS)? (Hướng game + bản đồ chung ngầm định là có) | Kiến trúc dữ liệu | Người dùng | **Đã xác nhận** (2026-11-07) |
| Đích đồ họa 3D camera cố định và lộ trình nâng dần asset | Kiến trúc, chi phí, hiệu năng | Người dùng / Mảng B đánh giá khả thi | **Đã chốt định hướng** (2026-11-09, xem QLNT-D008 và `TECH_PROFILE.md`); engine và ngân sách hiệu năng cần đánh giá kỹ thuật |
| Người phụ trách mảng A/B/C và đội ngũ đi kèm | Thẩm quyền, cổng duyệt | Người dùng | **Agent đề xuất, Người dùng phê duyệt** (2026-11-07) |
| Chỉ số thành công và mốc thời gian | Cổng Brief | Người dùng | Chờ xác định theo tiến độ MVP |
