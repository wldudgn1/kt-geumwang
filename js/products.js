/* =========================================================
 * 판매 상품 목록
 * - admin.html 에서 편하게 추가/수정 후 "products.js 다운로드"로 이 파일을 교체하세요.
 * - 직접 고칠 때 항목 설명:
 *   id          상품번호 (고객이 문의할 때 말하는 번호)
 *   brand       'apple' | 'samsung' | 'etc'
 *   model       모델명
 *   storage     용량
 *   color       색상 이름 / colorHex 사진 없을 때 그림 색상
 *   grade       외관 등급 'S' | 'A' | 'B' | 'C'
 *   battery     배터리 성능(%) — 모르면 null
 *   price       판매가(원)
 *   marketPrice 시중 평균가(원, 선택) — 넣으면 "OO원 저렴" 표시
 *   status      'sale'(판매중) | 'reserved'(예약중) | 'sold'(판매완료)
 *   images      사진 경로 배열 (예: ['images/gw-001-1.jpg']) — 비우면 그림으로 표시
 *   includes    구성품
 *   note        한 줄 설명 { ko: '...', en: '...' }
 *   date        입고일
 * ========================================================= */
window.PRODUCTS = [
  {
    id: 'GW-001', brand: 'apple', model: 'iPhone 17 Pro', storage: '256GB',
    color: 'Cosmic Orange', colorHex: '#E07A3F', grade: 'S', battery: 100,
    price: 1290000, marketPrice: 1420000, status: 'sale', images: [],
    includes: ['본체', 'C타입 케이블'],
    note: { ko: '기기변경 고객님이 맡기신 폰. 케이스 끼고 사용해 기스 없음.', en: 'Trade-in from a store customer. Used with a case — no scratches.' },
    date: '2026-10-07',
  },
  {
    id: 'GW-002', brand: 'apple', model: 'iPhone 16 Pro', storage: '256GB',
    color: 'Desert Titanium', colorHex: '#BFA48A', grade: 'A', battery: 91,
    price: 890000, marketPrice: 990000, status: 'sale', images: [],
    includes: ['본체'],
    note: { ko: '측면 미세 생활기스 외 깨끗합니다.', en: 'Very clean, only tiny marks on the frame.' },
    date: '2026-10-05',
  },
  {
    id: 'GW-003', brand: 'samsung', model: 'Galaxy S25 Ultra', storage: '256GB',
    color: 'Titanium Silverblue', colorHex: '#7E8FA6', grade: 'S', battery: 98,
    price: 820000, marketPrice: 930000, status: 'sale', images: [],
    includes: ['본체', 'S펜', 'C타입 케이블'],
    note: { ko: 'S펜 포함, 화면 잔상 없음.', en: 'S Pen included. No screen burn-in.' },
    date: '2026-10-04',
  },
  {
    id: 'GW-004', brand: 'apple', model: 'iPhone 15', storage: '128GB',
    color: 'Pink', colorHex: '#F2C9D0', grade: 'A', battery: 88,
    price: 490000, marketPrice: 560000, status: 'reserved', images: [],
    includes: ['본체'],
    note: { ko: '가성비 아이폰. 기능 모두 정상.', en: 'Great value iPhone. Everything works.' },
    date: '2026-10-02',
  },
  {
    id: 'GW-005', brand: 'samsung', model: 'Galaxy Z Flip6', storage: '256GB',
    color: 'Mint', colorHex: '#BDE3D3', grade: 'B', battery: 86,
    price: 430000, marketPrice: 520000, status: 'sale', images: [],
    includes: ['본체'],
    note: { ko: '힌지 정상, 메인화면 접힘 자국 약간.', en: 'Hinge works perfectly, light crease on the fold.' },
    date: '2026-09-30',
  },
  {
    id: 'GW-006', brand: 'samsung', model: 'Galaxy A35', storage: '128GB',
    color: 'Awesome Navy', colorHex: '#2E3A55', grade: 'A', battery: 93,
    price: 180000, marketPrice: 220000, status: 'sale', images: [],
    includes: ['본체'],
    note: { ko: '부모님폰·서브폰으로 추천.', en: 'Perfect as a second phone or for parents.' },
    date: '2026-09-28',
  },
  {
    id: 'GW-007', brand: 'apple', model: 'iPhone 13', storage: '128GB',
    color: 'Midnight', colorHex: '#23272F', grade: 'C', battery: 81,
    price: 240000, marketPrice: 300000, status: 'sale', images: [],
    includes: ['본체'],
    note: { ko: '뒷판 찍힘 있음, 기능 정상. 최저가 아이폰.', en: 'Dents on the back, fully functional. Cheapest iPhone.' },
    date: '2026-09-25',
  },
  {
    id: 'GW-008', brand: 'samsung', model: 'Galaxy S24', storage: '256GB',
    color: 'Cobalt Violet', colorHex: '#6C5B9E', grade: 'A', battery: 90,
    price: 470000, marketPrice: 540000, status: 'sold', images: [],
    includes: ['본체'],
    note: { ko: '판매 완료되었습니다.', en: 'Sold out.' },
    date: '2026-09-20',
  },
];
