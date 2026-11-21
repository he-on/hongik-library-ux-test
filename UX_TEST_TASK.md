# 중앙도서관 Original / Improved UX 과업 평가 패널

## 참여자 진행 순서

1. 아래 두 페이지 중 하나를 열고 우측 **사용성 테스트** 패널에서 과업을 읽습니다.
   - Original: https://he-on.github.io/hongik-library-ux-test/original/
   - Improved: https://he-on.github.io/hongik-library-ux-test/improved/
2. **과업 시작**을 누르면 탐색 시간을 기록하며 패널이 접힙니다.
3. 홈페이지에서 **오늘 날짜 기준 중앙도서관을 방문할 수 있는 시간대**를 찾습니다. 찾지 못하면 해당 버튼을 선택합니다.
4. 우측 **답변 입력하기**를 열고 확인한 시간대를 직접 적은 후 **답변 제출**을 누릅니다.
5. 정보 탐색의 체감 난이도를 **1점(매우 쉬움)~5점(매우 어려움)**으로 평가하고 제출합니다.

도중에 다른 페이지로 이동해도 같은 탭/브라우저 세션에서는 상태가 유지됩니다. 두 화면의 응답은 \`variant\` 필드로 분리됩니다. 같은 브라우저에서는 익명 \`participantId\`가 유지되어 비교 분석 시 대응시킬 수 있습니다.

## 연구자가 최초 1회 해야 하는 설정

기존 GitHub Pages 배포는 자동이지만, **GitHub에 커밋한 \`firestore.rules\`는 Firebase에 자동으로 적용되지 않습니다.**

1. Firebase Console에서 **hongik-library-ux-test** 프로젝트를 선택합니다.
2. **Firestore Database → Rules**에 들어갑니다.
3. GitHub 저장소의 [firestore.rules](./firestore.rules) **전체 내용**을 붙여넣고 **게시(Publish)**합니다. 원래 사용하던 프로필·찜하기 규칙도 함께 포함되어 있습니다.
4. Firebase **Authentication → Sign-in method**에서 Anonymous(익명) 로그인이 활성화되어 있는지 확인합니다.
5. 두 사이트에서 실제로 답변과 난이도를 제출해 패널에 **「서버에 응답이 저장되었습니다」**가 뜨는지 확인합니다.
6. Firebase **Firestore Database → Data → uxTaskResponses** 컬렉션에서 두 개의 기록이 생성됐는지 확인합니다.

Firestore 규칙이 아직 게시되지 않았거나 서버 연결에 실패하면 패널에 재전송 버튼이 표시됩니다. 이 경우 기록은 해당 브라우저의 localStorage에만 임시 보관되므로 **연구자가 중앙에서 자동 수집할 수 없습니다.** 게시 후 같은 브라우저에서 재전송해야 합니다.

## 수집 항목

| 필드 | 내용 |
| --- | --- |
| participantId | 동일 브라우저 비교용 익명 식별자 |
| variant | original 또는 improved |
| taskId | library-hours-today-v1 |
| taskDate | 과업 시작일(한국 시간) |
| answer | 사용자가 직접 입력한 시간대 또는 찾지 못함 |
| difficulty | 1~5점, 점수가 높을수록 어려움 |
| elapsedSeconds | 과업 시작부터 답변 제출까지 초 단위 소요 시간 |
| startedAt / answeredAt / completedAt | 시각 정보 |
| anonymousUid | Firebase 익명 인증 식별자 |

참여자 브라우저에서 이 기록을 조회하거나 수정할 수 없도록 Firestore에 **생성만 허용**하는 규칙을 추가했습니다. 개인 정보(이름, 학번, 이메일 등)는 입력받지 않습니다.

## 비교 분석 시 유의 사항

- 입력 답변은 **자동 채점하지 않습니다.** 조사자가 해당 날짜의 실제 공개된 운영시간과 대조해 과업 성공 여부를 판정해야 합니다.
- 체감 난이도는 참가자 주관 평가이며 실제 과업 완료 시간과 별도로 분석해야 합니다.
- 패널 자체를 클릭한 행동은 GA4/뷰저블 수집 방식에 따라 전체 클릭 수에 포함될 수 있으므로, 사이트 탐색 행동과 구분해 분석하세요.
- 새 참가자가 같은 브라우저를 재사용한다면 익명 식별자가 같아질 수 있습니다. 별도 브라우저 프로필 또는 시크릿 창을 사용하면 참가자 구분에 유리합니다.
