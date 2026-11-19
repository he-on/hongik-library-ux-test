# Firebase Authentication + Firestore 연동 (홍익대 중앙도서관 UX 실험)

## 현재 상태
- `original/` 및 `improved/`에 찜하기 버튼과 내 서재/로그인 링크 연결 (별도 작업 브랜치)
- `account/`에 이메일 회원가입, 로그인, 로그아웃 및 내 서재 화면 준비
- 기존 검색 JS, 실시간 검색 API, GTM/분석 코드 변경 없음
- **Firebase 프로젝트 설정과 실기기 검증은 아직 하지 않음**. 설정 전에는 정상 로그인/찜이 작동하지 않음.
- 두 버전은 **동일한 Firebase Auth 계정을 사용**하되, Firestore에서 `variant`로 찜 목록을 나눔. 기존/개선 UX 실험 데이터의 간섭을 방지함.
- 이 작업 브랜치를 검토하고 설정 완료 후에 `main`에 병합하면 GitHub Pages에 반영됨.

## Firebase Console 관리자 설정 (1회)
1. https://console.firebase.google.com/ 에서 새 프로젝트 생성 (예: `hongik-library-ux-test`). Google Analytics 연동은 이미 GTM/GA4를 쓰므로 이 Firebase 프로젝트에서는 필수가 아님.
2. 프로젝트 개요 > 앱 추가 > 웹(</>) > 앱 등록. **Firebase Hosting은 설정하지 않음** (기존 GitHub Pages 사용).
3. 웹 앱 설정 `firebaseConfig`에서 `apiKey`, `authDomain`, `projectId`, `appId` 확인.
4. 이 저장소의 `shared/firebase-config.js`에 네 값을 입력. 해당 파일에는 서비스 계정 비공개 키/관리자 인증서/비밀번호 등을 넣지 말 것. Firebase **웹 앱 설정값**은 브라우저 측 공개 정보이며 실제 데이터 접근은 보안 규칙으로 제한함.
5. Build > Authentication > Sign-in method > Email/Password 활성화.
6. Authentication > Settings > Authorized domains에 `he-on.github.io` 추가. (만약 목록에 이미 있다면 추가 불필요. 프로토콜과 경로 없이 호스트명만.)
7. Build > Firestore Database > Create database > Standard edition > 적절한 지역 선택 > Production mode 권장. Firestore > Rules에서 저장소 `firestore.rules` 내용 전체를 붙여넣고 **Publish**.
8. 이 작업 브랜치가 Pull Request로 준비되어 있다면, 설정 검토 후 메인에 병합하여 GitHub Pages 배포.

## 확인 경로
- 기존 UI: https://he-on.github.io/hongik-library-ux-test/original/
- 개선 UI: https://he-on.github.io/hongik-library-ux-test/improved/
- 회원가입 / 내 서재: https://he-on.github.io/hongik-library-ux-test/account/?ui=original

## 검증 체크리스트
1. PC에서 이메일 회원가입, 로그인, 로그아웃 테스트.
2. 기존 UI에서 도서 검색 → `♡ 찜하기` 클릭 → 내 서재 목록 표시.
3. **같은 이메일로 스마트폰 로그인** → 같은 기존 UI 찜 목록 조회.
4. 스마트폰에서 찜 해제 → PC 새로고침(또는 자동 동기화) 후 사라지는지 확인.
5. 다른 테스트 계정 생성 후 이전 계정의 찜 목록이 보이지 않는지 확인.
6. 개선 UI에서도 찜하기 및 내 서재 화면 확인. 기존 UI 찜 목록과 혼합되지 않는지 확인.
7. 로그인 전에는 책의 찜하기를 누르면 로그인 화면으로 이동하는지 확인.
8. GA4/GTM 및 뷰저블 이벤트·검색 흐름이 기존과 동일한지 확인.

## Firestore 구조
```text
users/{firebaseAuthUid}/bookmarks/{sha256(variant + title + author)}
  title: string
  author: string
  sourceUrl: string
  variant: 'original' | 'improved'
  savedAt: timestamp
```

이 프로젝트는 시연용 서비스이며 **실제 홍익대학교 도서관 계정과 연동하지 않음**.
비밀번호는 Firestore에 직접 저장하지 않고 Firebase Authentication에 맡김.

## 참고 공식 문서
- https://firebase.google.com/docs/web/alt-setup
- https://firebase.google.com/docs/auth/web/password-auth
- https://firebase.google.com/docs/firestore/security/get-started
