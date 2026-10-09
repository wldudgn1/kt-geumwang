# KT 에이플러스 금왕점 · 중고폰 판매 사이트

## 파일 구성
- `index.html` — 홈페이지 (6개 언어: 한국어·English·Tiếng Việt·ภาษาไทย·Русский·中文)
- `admin.html` — 상품 관리 페이지 (폰 추가/수정/판매완료 처리 → products.js 다운로드)
- `js/config.js` — 매장 정보 (전화, 주소, 영업시간, 카카오톡 링크, 교환·환불 기간)
- `js/products.js` — 판매 상품 목록
- `js/i18n.js` — 언어별 문구
- `images/` — 상품 사진 넣는 폴더

## 폰 올리는 방법
1. 사진을 `images/` 폴더에 저장 (예: `gw-009-1.jpg`)
2. `admin.html` 열기 → 양식 작성 → "목록에 추가"
3. "products.js 다운로드" → 받은 파일로 `js/products.js` 교체
4. 호스팅에 다시 업로드

## 무료로 인터넷에 올리기 (예: Netlify)
1. https://app.netlify.com/drop 접속
2. 이 `kt` 폴더를 통째로 끌어다 놓기 → 주소 생성
3. 원하면 도메인(예: ktgeumwang.com) 연결
