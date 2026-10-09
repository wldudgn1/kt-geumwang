# KT 에이플러스 금왕점 · 중고폰 판매 사이트

## 파일 구성
- `index.html` — 홈페이지 (6개 언어: 한국어·English·Tiếng Việt·ภาษาไทย·Русский·中文)
- `admin.html` — 상품 관리 페이지 (폰 추가/수정/판매완료 처리 → products.js 다운로드)
- `js/config.js` — 매장 정보 (전화, 주소, 영업시간, 카카오톡 링크, 교환·환불 기간)
- `js/products.js` — 판매 상품 목록
- `js/i18n.js` — 언어별 문구
- `images/` — 상품 사진 넣는 폴더

## 폰 올리는 방법 (홈페이지 하나로)
1. 홈페이지 맨 아래 "관리자" 누르기 (또는 주소 끝에 #admin)
2. 아이디 master + 비밀번호로 로그인 → 위에 빨간 "관리자 모드" 막대가 생김
3. "＋ 새 폰 등록" → 사진 찍기 → 정보 입력 → 저장하면 바로 올라감
4. 각 폰 아래 판매중/예약중/판매완료 버튼, "✎ 수정" 버튼으로 관리

## 데이터베이스
- Supabase 프로젝트: kt-geumwang-usedphone (서울)
- 구조와 권한: supabase/schema.sql
- 직원 관리자 추가: Supabase SQL Editor 에서 insert into public.used_admins (email) values ('직원@이메일.com');

## 무료로 인터넷에 올리기 (예: Netlify)
1. https://app.netlify.com/drop 접속
2. 이 `kt` 폴더를 통째로 끌어다 놓기 → 주소 생성
3. 원하면 도메인(예: ktgeumwang.com) 연결
