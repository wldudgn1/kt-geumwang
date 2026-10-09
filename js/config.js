/* =========================================================
 * 매장 기본 정보 — 여기만 고치면 사이트 전체에 반영됩니다.
 * ========================================================= */
window.SITE_CONFIG = {
  storeName: 'KT 금왕점',
  storeNameEn: 'KT Geumwang Store',
  phone: '0507-1342-5666',
  address: '충북 음성군 금왕읍 무극로 280',
  addressEn: '280 Mugeuk-ro, Geumwang-eup, Eumseong-gun, Chungcheongbuk-do',
  landmarks: '금왕 올리브영 옆 · 더벤티 맞은편 · 배스킨라빈스 맞은편',
  landmarksEn: 'Next to Olive Young · across from The Venti & Baskin Robbins',

  hoursWeekday: '09:00 – 20:00',
  hoursWeekend: '09:30 – 19:30',

  // 구매 후 문제가 있을 때 교환·환불 가능한 기간(일). 무상 A/S는 없음
  refundDays: 7,

  // 상단 언어 바에 보일 언어 순서 (ko 한국어, en 영어, zh 중국어, uz 우즈베크어, vi 베트남어, ru 러시아어, si 싱할라어-스리랑카, km 크메르어-캄보디아, th 태국어)
  languages: ['ko', 'en', 'zh', 'uz', 'vi', 'ru', 'si', 'km'],

  // 상품 DB (Supabase) — 비워두면 js/products.js 를 사용
  supabaseUrl: 'https://jrirneyyoytpwoxqwzxq.supabase.co',
  supabaseKey: 'sb_publishable_YDMez94Sbq0_zRrSZXOYtw_eOlNhHuu',
  // 관리자 로그인 아이디 → 계정 이메일 (홈페이지 맨 아래 '관리자'에서 아이디로 로그인)
  loginIds: { master: 'kt-geumwang-master@example.com' },

  naverPlace: 'https://naver.me/Ffe12tKe',
  // 카카오톡 채널 1:1 채팅 링크 (예: 'https://pf.kakao.com/_xxxxx/chat'). 비워두면 카톡 버튼이 숨겨집니다.
  kakao: 'https://pf.kakao.com/_pwAGxb/chat',

  lat: 36.9926698,
  lng: 127.5927517,

  rating: 4.99,
  reviewCount: 486,
};
