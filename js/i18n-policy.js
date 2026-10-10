/* 운영방침(문제 시 {n}일 이내 교환·환불 · 3단계 검수) + 매장 사진 문구 — {n}=교환·환불 기간 */
(function () {
  const P = {
    ko: {
      'hero.stat3': "교환 · 환불",
      warranty: [
        ["{n}일 이내 교환 · 환불","구매 후 {n}일 이내에 기능 문제가 생기면 교환 또는 환불해 드립니다."],
        ["3단계 전문 검수","외관 · 기능 · 배터리를 차례로 검수하고, IMEI로 분실 · 도난 이력까지 확인한 정상 기기만 판매합니다."],
        ["개인정보 완전 초기화","이전 사용자 정보는 모두 삭제한 뒤 판매합니다."],
        ["보고 결정하세요","매장에서 실물을 직접 확인하고, 마음에 들 때만 구매하시면 됩니다."],
      ],
      'warranty.note': "* 구매 후 {n}일이 지나면 교환 · 환불이 어려워요. 단순 변심이나 고객 과실(파손 · 침수)은 교환 · 환불 대상이 아닙니다.",
      benefits: ["기존 폰 데이터 이전","보호필름 · 케이스 셋팅","{n}일 이내 문제 시 교환 · 환불","3단계 검수 완료"],
      'faq.as': ["구매 후 문제가 생기면 어떻게 하나요?","구매 후 {n}일 이내에 기능 문제가 생기면 교환 또는 환불해 드려요. {n}일이 지나면 교환 · 환불은 어려워요."],
      'modal.batteryNew': "정품 새 배터리로 교체한 폰",
      'gallery.title': '매장 둘러보기',
      'gallery.sub': '금왕 올리브영 옆, 10년째 같은 자리를 지키고 있는 KT 공식대리점입니다.',
      gallery: ["매장 정면","매장 내부","무극로 거리 쪽 모습","수상 경력 · 우리 매장의 7가지 약속"],
    },
    en: {
      'hero.stat3': "Exchange · refund",
      warranty: [
        ["{n}-day exchange or refund","If a function problem appears within {n} days of purchase, we exchange the phone or refund you."],
        ["3-step expert inspection","We check the exterior, functions and battery, and verify the IMEI (lost/stolen) before selling."],
        ["Data fully wiped","All data from the previous owner is completely erased."],
        ["See it before you buy","Check the real phone in store and buy only if you like it."],
      ],
      'warranty.note': "* After {n} days, exchanges and refunds are not possible. Change of mind and customer damage (drops, water) are not covered.",
      benefits: ["Data transfer from old phone","Screen protector & case","Exchange or refund within {n} days if there is a problem","3-step inspection passed"],
      'faq.as': ["What if there is a problem after I buy?","If a function problem appears within {n} days, we exchange or refund. After {n} days, exchanges and refunds are not possible."],
      'modal.batteryNew': "Battery replaced with a new genuine one",
      'gallery.title': 'Inside our store',
      'gallery.sub': 'An official KT store next to Olive Young in Geumwang, in the same spot for 10 years.',
      gallery: ["Storefront","Inside the store","From Mugeuk-ro street","Awards & our 7 promises"],
    },
    zh: {
      'hero.stat3': "换货·退款",
      warranty: [
        ["{n}天内换货·退款","购买后{n}天内出现功能问题，可换货或退款。"],
        ["三步专业检测","依次检测外观、功能、电池，并通过IMEI核查丢失·被盗记录。"],
        ["彻底清除数据","前用户的所有数据均已彻底删除。"],
        ["看过再买","到店看实机，满意再购买。"],
      ],
      'warranty.note': "* 购买超过{n}天不能换货·退款。个人原因及顾客过失（摔坏、进水）不在换货·退款范围内。",
      benefits: ["旧手机数据转移","贴膜·手机壳","{n}天内有问题可换货·退款","已通过三步检测"],
      'faq.as': ["买后出现问题怎么办？","购买后{n}天内出现功能问题，可换货或退款。超过{n}天则不能换货·退款。"],
      'modal.batteryNew': "已更换全新原装电池",
      'gallery.title': '门店实景',
      'gallery.sub': '位于金旺Olive Young旁，在同一位置经营10年的KT官方代理店。',
      gallery: ["门店正面","门店内部","无极路街景","获奖经历·门店7项承诺"],
    },
    uz: {
      'hero.stat3': "Almashtirish · qaytarish",
      warranty: [
        ["{n} kun ichida almashtirish yoki qaytarish","Sotib olgandan keyin {n} kun ichida nosozlik chiqsa, almashtiramiz yoki pulni qaytaramiz."],
        ["3 bosqichli tekshiruv","Tashqi ko'rinish, funksiyalar, batareya va IMEI (o'g'irlik) tarixini tekshiramiz."],
        ["Ma'lumotlar to'liq o'chirilgan","Oldingi egasining barcha ma'lumotlari butunlay o'chirilgan."],
        ["Ko'rib, keyin oling","Do'konda telefonni o'zingiz ko'ring, yoqsa sotib oling."],
      ],
      'warranty.note': "* {n} kundan keyin almashtirish va qaytarish mumkin emas. Fikrdan qaytish va xaridor aybi (sinish, suv) bunga kirmaydi.",
      benefits: ["Ma'lumotlarni ko'chirish","Plyonka va g'ilof","Muammo bo'lsa {n} kun ichida almashtirish/qaytarish","3 bosqichli tekshiruvdan o'tgan"],
      'faq.as': ["Sotib olgandan keyin muammo chiqsa-chi?","{n} kun ichida nosozlik chiqsa, almashtiramiz yoki pulni qaytaramiz. {n} kundan keyin bu mumkin emas."],
      'modal.batteryNew': "Yangi original batareya o‘rnatilgan",
      'gallery.title': "Do'konimiz",
      'gallery.sub': "Geumwang'dagi Olive Young yonida, 10 yildan beri shu joyda ishlayotgan KT rasmiy do'koni.",
      gallery: ["Do'kon old tomoni","Do'kon ichi","Mugeuk-ro ko'chasidan","Mukofotlar va 7 va'damiz"],
    },
    vi: {
      'hero.stat3': "Đổi · hoàn tiền",
      warranty: [
        ["Đổi · hoàn tiền trong {n} ngày","Trong {n} ngày sau khi mua, nếu máy có lỗi chức năng sẽ được đổi hoặc hoàn tiền."],
        ["Kiểm tra 3 bước","Kiểm tra ngoại hình, chức năng, pin và tra IMEI lịch sử mất cắp."],
        ["Xóa sạch dữ liệu","Toàn bộ dữ liệu của chủ cũ đều được xóa hoàn toàn."],
        ["Xem rồi mới mua","Xem máy thật tại cửa hàng, ưng ý mới mua."],
      ],
      'warranty.note': "* Sau {n} ngày không thể đổi trả. Đổi ý hoặc lỗi do khách (rơi vỡ, vào nước) không được đổi trả.",
      benefits: ["Chuyển dữ liệu từ máy cũ","Dán kính · ốp lưng","Đổi · hoàn tiền trong {n} ngày nếu có lỗi","Đã kiểm tra 3 bước"],
      'faq.as': ["Mua xong có lỗi thì sao?","Nếu có lỗi chức năng trong {n} ngày, chúng tôi đổi máy hoặc hoàn tiền. Sau {n} ngày thì không thể đổi trả."],
      'modal.batteryNew': "Đã thay pin chính hãng mới",
      'gallery.title': 'Hình ảnh cửa hàng',
      'gallery.sub': 'Đại lý chính thức KT cạnh Olive Young ở Geumwang, cùng một vị trí suốt 10 năm.',
      gallery: ["Mặt tiền cửa hàng","Bên trong cửa hàng","Nhìn từ phố Mugeuk-ro","Giải thưởng & 7 cam kết"],
    },
    ru: {
      'hero.stat3': "Обмен · возврат",
      warranty: [
        ["Обмен или возврат за {n} дней","Если в течение {n} дней обнаружится неисправность, обменяем телефон или вернём деньги."],
        ["3 этапа проверки","Проверяем внешний вид, функции, батарею и историю IMEI (утеря/кража)."],
        ["Полное удаление данных","Все данные прежнего владельца полностью удалены."],
        ["Посмотрите перед покупкой","Посмотрите телефон в магазине и покупайте, только если понравится."],
      ],
      'warranty.note': "* По истечении {n} дней обмен и возврат невозможны. Если вы передумали или телефон повреждён по вине покупателя (падение, вода), обмена нет.",
      benefits: ["Перенос данных","Плёнка и чехол","Обмен или возврат в течение {n} дней при неисправности","Прошёл 3 этапа проверки"],
      'faq.as': ["Что если после покупки обнаружится проблема?","Если в течение {n} дней обнаружится неисправность, обменяем или вернём деньги. После {n} дней это невозможно."],
      'modal.batteryNew': "Установлена новая оригинальная батарея",
      'gallery.title': 'Наш магазин',
      'gallery.sub': 'Официальный магазин KT рядом с Olive Young в Кымване, на этом месте уже 10 лет.',
      gallery: ["Фасад магазина","Внутри магазина","Вид с улицы Мугык-ро","Награды и 7 обещаний"],
    },
    si: {
      'hero.stat3': "හුවමාරු · ආපසු",
      warranty: [
        ["දින {n} ඇතුළත හුවමාරු හෝ ආපසු","මිලදී ගෙන දින {n} ඇතුළත දෝෂයක් ආවොත් හුවමාරු කරමු හෝ මුදල් ආපසු දෙමු."],
        ["පියවර 3ක පරීක්ෂාව","බාහිර පෙනුම, ක්‍රියාකාරිත්වය, බැටරිය සහ IMEI ඉතිහාසය පරීක්ෂා කරමු."],
        ["දත්ත සම්පූර්ණයෙන් මකා ඇත","පෙර හිමිකරුගේ සියලු දත්ත මකා ඇත."],
        ["බලා මිලදී ගන්න","වෙළඳසැලේදී දුරකථනය බලා කැමති නම් පමණක් ගන්න."],
      ],
      'warranty.note': "* දින {n}කට පසු හුවමාරු හෝ ආපසු දීම කළ නොහැක. අදහස වෙනස් වීම සහ පාරිභෝගික වරද (කැඩීම, ජලය) ඇතුළත් නොවේ.",
      benefits: ["දත්ත මාරු කිරීම","පටලය සහ කවරය","දෝෂයක් ඇත්නම් දින {n} ඇතුළත හුවමාරු/ආපසු","පියවර 3ක පරීක්ෂාව සමත්"],
      'faq.as': ["මිලදී ගත් පසු ගැටලුවක් ආවොත්?","දින {n} ඇතුළත දෝෂයක් ආවොත් හුවමාරු කරමු හෝ මුදල් ආපසු දෙමු. දින {n}කට පසු කළ නොහැක."],
      'modal.batteryNew': "නව මුල් බැටරියක් දමා ඇත",
      'gallery.title': 'අපගේ වෙළඳසැල',
      'gallery.sub': 'Geumwang හි Olive Young අසල, වසර 10ක් එකම ස්ථානයේ ඇති KT නිල වෙළඳසැල.',
      gallery: ["වෙළඳසැල ඉදිරිපස","වෙළඳසැල ඇතුළත","Mugeuk-ro වීදියෙන්","සම්මාන සහ පොරොන්දු 7"],
    },
    km: {
      'hero.stat3': "ប្តូរ · សងប្រាក់",
      warranty: [
        ["ប្តូរ ឬសងប្រាក់ក្នុង {n} ថ្ងៃ","បើមានបញ្ហាមុខងារក្នុង {n} ថ្ងៃក្រោយទិញ យើងប្តូរ ឬសងប្រាក់វិញ។"],
        ["ការពិនិត្យ 3 ជំហាន","ពិនិត្យរូបរាង មុខងារ ថ្ម និងប្រវត្តិ IMEI (បាត់/លួច)។"],
        ["លុបទិន្នន័យទាំងស្រុង","ទិន្នន័យរបស់ម្ចាស់មុនត្រូវបានលុបទាំងស្រុង។"],
        ["មើលសិនសឹមទិញ","មើលទូរស័ព្ទផ្ទាល់នៅហាង ចូលចិត្តសឹមទិញ។"],
      ],
      'warranty.note': "* ក្រោយ {n} ថ្ងៃ មិនអាចប្តូរ ឬសងប្រាក់បានទេ។ ការប្តូរចិត្ត និងកំហុសអតិថិជន (បែក ចូលទឹក) មិនរាប់បញ្ចូល។",
      benefits: ["ផ្ទេរទិន្នន័យ","កញ្ចក់ការពារ និងស្រោម","ប្តូរ/សងប្រាក់ក្នុង {n} ថ្ងៃបើមានបញ្ហា","ឆ្លងការពិនិត្យ 3 ជំហាន"],
      'faq.as': ["បើមានបញ្ហាក្រោយទិញ?","បើមានបញ្ហាមុខងារក្នុង {n} ថ្ងៃ យើងប្តូរ ឬសងប្រាក់វិញ។ ក្រោយ {n} ថ្ងៃ មិនអាចធ្វើបានទេ។"],
      'modal.batteryNew': "បានប្តូរថ្មថ្មីដើម",
      'gallery.title': 'ហាងរបស់យើង',
      'gallery.sub': 'ហាង KT ផ្លូវការនៅជាប់ Olive Young ក្នុង Geumwang នៅកន្លែងដដែល 10 ឆ្នាំមកហើយ។',
      gallery: ["មុខហាង","ខាងក្នុងហាង","មើលពីផ្លូវ Mugeuk-ro","ពានរង្វាន់ និងការសន្យា 7"],
    },
    th: {
      'hero.stat3': "เปลี่ยน · คืนเงิน",
      warranty: [
        ["เปลี่ยนหรือคืนเงินภายใน {n} วัน","ภายใน {n} วันหลังซื้อ หากเครื่องมีปัญหาการทำงาน เปลี่ยนหรือคืนเงินให้"],
        ["ตรวจ 3 ขั้นตอน","ตรวจภายนอก การทำงาน แบตเตอรี่ และประวัติ IMEI"],
        ["ลบข้อมูลหมดจด","ข้อมูลของเจ้าของเดิมถูกลบทั้งหมด"],
        ["ดูก่อนซื้อ","ดูเครื่องจริงที่ร้าน ชอบแล้วค่อยซื้อ"],
      ],
      'warranty.note': "* เกิน {n} วันไม่สามารถเปลี่ยนหรือคืนเงินได้ ไม่รวมการเปลี่ยนใจและความเสียหายจากลูกค้า (ตก ตกน้ำ)",
      benefits: ["ย้ายข้อมูล","ฟิล์มและเคส","เปลี่ยน/คืนเงินภายใน {n} วันหากมีปัญหา","ผ่านการตรวจ 3 ขั้นตอน"],
      'faq.as': ["ซื้อแล้วมีปัญหาทำอย่างไร?","หากมีปัญหาการทำงานภายใน {n} วัน เปลี่ยนหรือคืนเงินให้ เกิน {n} วันแล้วทำไม่ได้"],
      'modal.batteryNew': "เปลี่ยนแบตเตอรี่แท้ใหม่แล้ว",
      'gallery.title': 'บรรยากาศร้าน',
      'gallery.sub': 'ร้าน KT อย่างเป็นทางการข้าง Olive Young ใน Geumwang เปิดที่เดิมมา 10 ปี',
      gallery: ["หน้าร้าน","ภายในร้าน","มุมจากถนน Mugeuk-ro","รางวัลและคำมั่น 7 ข้อ"],
    },
  };
  Object.keys(P).forEach(l => { if (window.I18N[l]) Object.assign(window.I18N[l], P[l]); });
})();

/* 매장 운영 방식: 결제는 현금·계좌이체만, 전국 택배 가능 (FAQ 3·4번, "왜 우리 매장?" 5번 덮어쓰기) */
(function () {
  const S = {
    ko: {
      pay: ['결제는 어떻게 하나요?', '현금 또는 계좌이체로만 결제할 수 있어요. 카드 결제는 안 돼요.'],
      ship: ['택배로도 받을 수 있나요?', '네, 전국 어디든 택배로 보내드려요. 전화나 카톡으로 원하는 폰을 말씀해 주시면 계좌이체 확인 후 발송해요. 택배로 받아도 7일 이내 교환·환불 기준은 똑같아요.'],
      easy: ['불필요한 번거로움 제로', '직거래 약속도, 사기 걱정도 없어요. 매장에 오시거나 택배로 편하게 받으세요.'],
    },
    en: {
      pay: ['How can I pay?', 'Cash or bank transfer only. We do not accept cards.'],
      ship: ['Can you ship it?', 'Yes, we ship anywhere in Korea. Tell us which phone you want by phone or KakaoTalk, and we send it after your bank transfer is confirmed. The same 7-day exchange/refund policy applies.'],
      easy: ['Zero hassle', 'No meet-ups with strangers, no scams. Visit the store or get it delivered.'],
    },
    zh: {
      pay: ['怎么付款？', '只能现金或转账付款，不能刷卡。'],
      ship: ['可以快递吗？', '可以，全国都能快递。通过电话或KakaoTalk告诉我们想要的手机，确认转账后发货。快递购买同样适用7天内换货·退款政策。'],
      easy: ['零麻烦', '不用约陌生人见面，不怕诈骗。来店或快递都很方便。'],
    },
    uz: {
      pay: ["Qanday to'lash mumkin?", "Faqat naqd pul yoki bank o'tkazmasi. Karta qabul qilinmaydi."],
      ship: ['Pochta orqali yuborasizmi?', "Ha, Koreyaning istalgan joyiga yuboramiz. Telefon yoki KakaoTalk orqali kerakli telefonni ayting, pul o'tkazmasi tasdiqlangach jo'natamiz. 7 kunlik almashtirish va qaytarish sharti bir xil."],
      easy: ["Hech qanday ovora yo'q", "Notanishlar bilan uchrashuv va firibgarlik yo'q. Do'konga keling yoki pochta orqali oling."],
    },
    vi: {
      pay: ['Thanh toán thế nào?', 'Chỉ nhận tiền mặt hoặc chuyển khoản. Không nhận thẻ.'],
      ship: ['Có gửi hàng không?', 'Có, gửi hàng toàn Hàn Quốc. Báo máy bạn muốn qua điện thoại hoặc KakaoTalk, xác nhận chuyển khoản xong sẽ gửi ngay. Vẫn áp dụng đổi trả · hoàn tiền trong 7 ngày như mua tại cửa hàng.'],
      easy: ['Không phiền phức', 'Không hẹn gặp người lạ, không lo lừa đảo. Đến cửa hàng hoặc nhận qua bưu điện đều tiện.'],
    },
    ru: {
      pay: ['Как оплатить?', 'Только наличные или банковский перевод. Карты не принимаем.'],
      ship: ['Есть доставка?', 'Да, отправляем по всей Корее. Скажите по телефону или в KakaoTalk, какой телефон нужен, — отправим после подтверждения перевода. Условия обмена и возврата в течение 7 дней те же.'],
      easy: ['Никаких хлопот', 'Без встреч с незнакомцами и мошенников. Приходите в магазин или закажите доставку.'],
    },
    si: {
      pay: ['ගෙවන්නේ කෙසේද?', 'මුදල් හෝ බැංකු මාරු කිරීම පමණි. කාඩ්පත් භාර නොගනිමු.'],
      ship: ['තැපෑලෙන් එවනවාද?', 'ඔව්, කොරියාවේ ඕනෑම තැනකට එවමු. දුරකථනයෙන් හෝ KakaoTalk හරහා අවශ්‍ය දුරකථනය කියන්න, මුදල් මාරුව තහවුරු වූ පසු එවමු. දින 7 ඇතුළත හුවමාරු සහ ආපසු දීමේ නීතිය එලෙසමයි.'],
      easy: ['කිසිම කරදරයක් නැත', 'නාඳුනන අය හමුවීම, වංචා නැත. වෙළඳසැලට එන්න හෝ තැපෑලෙන් ලබාගන්න.'],
    },
    km: {
      pay: ['បង់ប្រាក់យ៉ាងដូចម្តេច?', 'សាច់ប្រាក់ ឬផ្ទេរតាមធនាគារប៉ុណ្ណោះ។ មិនទទួលកាតទេ។'],
      ship: ['ផ្ញើតាមប្រៃសណីយ៍បានទេ?', 'បាន យើងផ្ញើទូទាំងកូរ៉េ។ ប្រាប់ទូរស័ព្ទដែលចង់បានតាមទូរស័ព្ទ ឬ KakaoTalk ក្រោយបញ្ជាក់ការផ្ទេរប្រាក់ យើងផ្ញើភ្លាម។ លក្ខខណ្ឌប្តូរ និងសងប្រាក់ក្នុង 7 ថ្ងៃដូចគ្នា។'],
      easy: ['គ្មានការរំខាន', 'មិនចាំបាច់ជួបមនុស្សមិនស្គាល់ គ្មានការបោកប្រាស់។ មកហាង ឬទទួលតាមប្រៃសណីយ៍។'],
    },
    th: {
      pay: ['ชำระเงินอย่างไร?', 'เงินสดหรือโอนเงินเท่านั้น ไม่รับบัตร'],
      ship: ['ส่งพัสดุได้ไหม?', 'ได้ ส่งได้ทั่วเกาหลี แจ้งรุ่นที่ต้องการทางโทรศัพท์หรือ KakaoTalk ยืนยันการโอนแล้วจัดส่งทันที ใช้เงื่อนไขเปลี่ยน/คืนเงินภายใน 7 วันเหมือนกัน'],
      easy: ['ไม่ยุ่งยาก', 'ไม่ต้องนัดเจอคนแปลกหน้า ไม่กลัวโดนโกง มาที่ร้านหรือรับทางพัสดุก็ได้'],
    },
  };
  Object.keys(S).forEach(l => {
    const d = window.I18N[l]; if (!d) return;
    if (Array.isArray(d.faq)) { d.faq = d.faq.slice(); d.faq[3] = S[l].pay; d.faq[4] = S[l].ship; }
    if (Array.isArray(d.why)) { d.why = d.why.slice(); d.why[4] = S[l].easy; }
  });
})();

/* 로고 옆 "중고폰" 표시 (언어별) */
(function () {
  const U = { ko: '중고폰', en: 'Used Phones', zh: '二手手机', uz: 'B/U telefonlar', vi: 'Máy cũ', ru: 'Б/У телефоны', si: 'පාවිච්චි කළ ෆෝන්', km: 'ទូរស័ព្ទមួយទឹក', th: 'มือถือมือสอง' };
  Object.keys(U).forEach(l => { if (window.I18N[l]) window.I18N[l]['logo.used'] = U[l]; });
})();
