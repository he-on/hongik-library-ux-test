# 아이디만으로 시작하는 UX 시연 계정 (홍익대학교 중앙도서관)

## 설계 의도
이번 프로젝트는 **실제 회원 인증 시스템이 아님**. 이메일·비밀번호 없이 추천받은 아이디 하나로 찜 목록을 분리하고, 다른 기기에서 같은 아이디만 입력하면 동일한 목록을 볼 수 있음.

- 신규 사용자: `book-k7m42px` 같은 랜덤 추천 아이디 → [이 아이디로 시작] → 목록 생성
- 기존 사용자(다른 기기): 동일 아이디 입력 → 기존 목록 조회
- 현재 아이디는 브라우저 localStorage에 기억해 재접속 시 다시 입력할 필요 없음.
- 서로 다른 기기는 Firebase Cloud Firestore에서 같은 `profiles/{id}` 경로를 조회
- 기존 UI와 개선 UI는 `variant`로 찜 목록을 구분하여 UX 실험 간섭 최소화
- **중요:** 타인이 같은 아이디를 입력하면 동일 목록을 조회·수정할 수 있음. 본인 확인, 계정 보호, 아이디 복구 기능 없음. 실험용 도서 찜 정보만 저장하고 이름·학번·연락처·개인정보를 아이디로 사용하지 말 것.
- **별도의 백엔드 서버를 배포하지 않음.** Firebase Authentication의 익명 로그인은 백그라운드에서만 사용해 Cloud Firestore의 최소한의 접근 규칙을 만족시킴. 이것은 아이디의 소유자를 검증하는 수단이 아님.

## 현재 작업 상태
- `feature/firebase-auth-bookmarks`에서 기본 구현 (기존 배포된 `main` 수정 없음)
- 기존·개선 검색 화면에 찜하기/찜 해제 및 My Library 링크
- `account/` 아이디 추천, 아이디 입력, 동일 아이디 재접속, 찜 목록 조회/삭제
- 검색 API, GTM, 기존 분석 코드 그대로 유지
- **Firebase 프로젝트 생성·설정값 연결·실기기 확인은 아직 안 됨.** 기능이 실사용 가능한 배포 상태가 아님

## Firebase Console에서 1회 설정
1. https://console.firebase.google.com/ 접속 → 새 Firebase 프로젝트 생성.
2. 프로젝트 개요에서 Web 앱 (`</>`) 등록. **GitHub Pages 배포는 그대로 사용**.
3. 프로젝트 설정 > 내 앱 > SDK 설정의 `apiKey`, `authDomain`, `projectId`, `appId` 값을 `shared/firebase-config.js`에 입력. 서비스 계정 비밀 키를 입력하지 말 것.
4. Build → Authentication → Sign-in method → **Anonymous (익명)** 활성화. 이메일/비밀번호 방식은 필요 없음.
5. Build → Authentication → Settings → Authorized domains에서 `he-on.github.io` 추가 (이미 있다면 유지).
6. Build → Firestore Database → 데이터베이스 생성(Production mode) → Rules에 이 브랜치의 `firestore.rules` 내용 붙여넣고 Publish.
7. 설정을 확인하고 PR 병합 후 GitHub Pages 자동 배포.

## 데이터 형태
```text
profiles/{id}
  createdAt: timestamp
profiles/{id}/bookmarks/{bookHash}
  title: string
  author: string
  sourceUrl: string
  variant: "original" | "improved"
  savedAt: timestamp
```

Firestore 규칙은 다른 컬렉션을 차단하고 위 경로만 익명 Firebase 세션에 허용함. **동일 아이디 소유자라는 보장은 없고, 아는 누구나 접근 가능**.

## 기기 간 실험 체크리스트
1. PC에서 추천 아이디로 등록 후 기존 UI 도서 1권 찜하기.
2. PC에서 My Library 기존 UI 목록 확인.
3. 휴대폰에서 `/account/?ui=original` 열고 PC 아이디 직접 입력.
4. 휴대폰에서 같은 도서가 보이는지 확인.
5. 휴대폰에서 찜 해제 후 PC에서 목록이 자동 갱신되는지 확인.
6. 다른 추천 아이디로 전환하면 기존 목록이 보이지 않는지 확인.
7. 기존 UI와 개선 UI 사이에서 찜 목록이 섞이지 않는지 확인.
8. 검색 및 GA4/GTM/뷰저블 분석 이벤트가 정상 유지되는지 확인.

## 출처
- Firebase Anonymous Auth: https://firebase.google.com/docs/auth/web/anonymous-auth
- Firestore Security Rules: https://firebase.google.com/docs/firestore/security/get-started
- Firebase Web SDK CDN: https://firebase.google.com/docs/web/alt-setup

## 찜한 도서 상세정보 추가 (후속 변경)

- 마이페이지에서 자료유형, 소장 도서관, 자료 위치, 청구기호, 이용/대출 상태, 발행사항, 소장정보 원문을 **있는 값만** 표시
- 검색 API 결과에서 받은 정보를 찜한 시점의 스냅샷으로 저장하므로 실제 실시간 대출 상태와 다를 수 있음
- 도서관 서지 상세페이지 링크가 확인된 자료에는 바로가기 제공
- **기존에 찜한 자료에는 상세정보가 저장되지 않았음**. 검색 화면에서 해당 도서를 찜 해제한 뒤 다시 찜해야 상세정보가 저장됨
- 기존 계정·기존 찜 데이터는 유지됨

### 배포 전 필수: Firestore 규칙 다시 게시

1. Firebase Console → Firestore Database → Rules
2. 이 PR의 `firestore.rules` 전체로 교체 → **게시(Publish)**
3. 규칙을 게시한 다음 PR을 `main`에 병합
4. 기존 UI와 개선 UI 모두 새로 찜한 도서의 소장정보가 마이페이지에 나타나는지 확인

이전 규칙은 `details` 필드를 차단하므로, **규칙 갱신 전에 배포하면 새 찜하기가 권한 오류로 실패**함.
새 규칙은 `details` 없는 기존 찜 레코드도 그대로 허용하며, 기존 로그인/검색 흐름에 영향을 주지 않도록 설계됨.
