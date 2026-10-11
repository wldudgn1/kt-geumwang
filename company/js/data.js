// 회사 홈페이지 내용은 이 파일만 고치면 됩니다.
// 값이 비어 있으면('') 화면에 "준비 중"으로 표시됩니다.
window.COMPANY = {
  name: 'KT 에이플러스',
  ceo: '',                 // 대표자명
  founded: '2013년 7월',   // 설립일 (확인 필요)
  bizNo: '',               // 사업자등록번호
  hqAddress: '',           // 본사 주소
  tel: '',                 // 대표 전화 (예: 043-000-0000)
  email: '',               // 대표 이메일
  recruitUrl: '',          // 채용 공고 링크 (알바몬·사람인 등)
  usedPhoneUrl: 'https://wldudgn1.github.io/kt-geumwang/'
};

// 매장 12곳 (사무실 포함). name/address/tel 을 채우면 카드가 자동으로 완성됩니다.
// map: 네이버 지도 링크 (없으면 주소로 자동 검색 링크 생성)
window.STORES = [
  { type: '본사', region: '', name: '', address: '', tel: '' },
  { type: '매장', region: '충북', name: 'KT 금왕점', address: '충북 음성군 금왕읍 무극로 280', tel: '', photo: 'images/storefront.jpg' },
  { type: '매장', region: '충북', name: 'KT 괴산직영점', address: '충북 괴산군 괴산읍 읍내로2길 52', tel: '' }, // 확인 필요
  { type: '매장', region: '', name: '', address: '', tel: '' },
  { type: '매장', region: '', name: '', address: '', tel: '' },
  { type: '매장', region: '', name: '', address: '', tel: '' },
  { type: '매장', region: '', name: '', address: '', tel: '' },
  { type: '매장', region: '', name: '', address: '', tel: '' },
  { type: '매장', region: '', name: '', address: '', tel: '' },
  { type: '매장', region: '', name: '', address: '', tel: '' },
  { type: '매장', region: '', name: '', address: '', tel: '' },
  { type: '매장', region: '', name: '', address: '', tel: '' }
];

// 연혁 · 수상 (대표 매장 KT 금왕점 수상 경력 게시판 기준)
window.HISTORY = [
  { year: 2025, items: [
    ['12', '전국 최우수 매장 선정 (전국 5개 매장)'],
    ['05', 'KT 유무선 가입자 5만 명 돌파'],
    ['02', '갤럭시 S25 충청권 사전판매 1위'] ] },
  { year: 2024, items: [
    ['11', '전국 SNS 마케팅 1위'],
    ['06', '전국 판매 1위 · 해외연수'],
    ['01', '2023년 전국 최우수 매장 선정'] ] },
  { year: 2023, items: [
    ['08', 'KT 충남북 매출 1위 달성'],
    ['03', 'KT 대표 표준매장 선정'] ] },
  { year: 2022, items: [
    ['12', '충북 최초 그랜드 슬램 달성'],
    ['07', '상반기 충청 판매 1위'] ] },
  { year: 2021, items: [
    ['12', '2021 최우수 매장 선정'],
    ['05', '충북 고객만족도 1위 달성'] ] },
  { year: 2020, items: [
    ['12', '2020 최우수 매장 선정'],
    ['05', 'SAMSUNG 모바일 판매 1위'],
    ['03', '충청 판매 1위 달성'] ] },
  { year: 2019, items: [
    ['11', '충북 고객만족도 1위 달성'],
    ['08', '전 직원 해외연수'],
    ['04', '충북 명장 수상'] ] },
  { year: 2018, items: [
    ['12', '500 CLUB 2회 연속 (전국 최초 2관왕)'],
    ['11', '500 CLUB 달성 (전국 1등)'],
    ['03', '300 CLUB 달성'] ] },
  { year: 2017, items: [
    ['11', '충북 KT 고객만족도 1위 달성'],
    ['09', '200 CLUB 달성 (충북 3번째 · 전국 8번째)'],
    ['05', '충북 최초 명장 수상'] ] },
  { year: 2016, items: [
    ['11', '최우수 컨설턴트 선정'],
    ['05', 'KT 금왕점 신규 OPEN'] ] }
];
