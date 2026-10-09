# KT 금왕점 · 중고폰 판매 사이트

- 홈페이지: https://wldudgn1.github.io/kt-geumwang/
- GitHub 저장소: https://github.com/wldudgn1/kt-geumwang (main 에 push 하면 1~2분 뒤 사이트에 반영)

## 폰 올리는 방법 (홈페이지 하나로)
1. 홈페이지 맨 아래 "관리자" 누르기 (또는 주소 끝에 #admin)
2. 아이디 master + 비밀번호로 로그인 → 위에 빨간 "관리자 모드" 막대가 생김
3. "＋ 새 폰 등록" → 사진 찍기 → 정보 입력 → 저장하면 바로 올라감
4. 각 폰 아래 판매중/예약중/판매완료 버튼, "✎ 수정" 버튼으로 관리

## 파일 구성
- `index.html` — 홈페이지 (상단 언어 바: 한국어·English·中文·O'zbekcha·Tiếng Việt·Русский·සිංහල·ខ្មែរ)
- `js/config.js` — 매장 정보, 무상 A/S·반품 기간, 카카오톡 링크, 언어 목록, Supabase 연결, 로그인 아이디
- `js/app.js` — 홈페이지 동작 (상품 목록, 상세, 매장 사진 크게 보기)
- `js/admin.js` — 홈페이지 안의 관리자 모드 (로그인, 등록·수정, 사진 업로드)
- `js/i18n.js`, `js/i18n-extra.js`, `js/i18n-policy.js` — 언어별 문구
- `js/products.js` — DB 연결이 없을 때만 쓰는 예시 상품
- `images/store/` — 매장 사진, `images/og.jpg` — 카톡 링크 미리보기 이미지
- `admin.html` — 예전 관리자 주소 (홈페이지 #admin 으로 자동 이동)

## 데이터베이스 (Supabase)
- 프로젝트: kt-geumwang-usedphone (서울)
- 구조와 권한: `supabase/schema.sql`
- 관리자 추가: Supabase SQL Editor 에서
  `insert into public.used_admins (email) values ('이메일');`
  그리고 Authentication → Users 에서 같은 이메일로 사용자 만들기

## 카톡 미리보기 이미지 다시 만들기
1. `og/og-card.html` 수정
2. 아래 명령으로 그림 만들기 → `og/og.png` 를 JPG 로 바꿔 `images/og.jpg` 로 저장

   ```
   "C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --hide-scrollbars --window-size=1200,630 --virtual-time-budget=6000 --screenshot=og/og.png og/og-card.html
   ```
3. `index.html` 의 og:image 주소 끝 `?v=` 숫자를 1 올리기 (카톡이 예전 그림을 기억하지 않게)
