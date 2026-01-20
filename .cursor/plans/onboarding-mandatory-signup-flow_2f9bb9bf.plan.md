---
name: onboarding-mandatory-signup-flow
overview: 구글/카카오/일반 회원가입 시 모두 사주 기반 온보딩을 필수 단계로 만들고, 온보딩에서 확정한 생년월일/사주 정보가 마이페이지와 DB에 일관되게 반영되도록 프론트 중심으로 흐름을 재설계한다.
todos: []
---

### 온보딩 필수 회원가입/로그인 플로우 개편 계획

#### 1. 요구사항 정리

- **소셜/일반 공통 규칙**
  - **구글 첫 로그인**, **카카오 첫 로그인**, **일반 회원가입 후 첫 로그인** 모두 **사주 온보딩 페이지를 반드시 거쳐야 최종 가입 완료**로 간주.
  - 온보딩에서 **생년월일(birthDate), 생년월일시(birthTime, 선택), 성별(gender), 달력 유형(calendarType), 닉네임**을 확정 입력.
  - 온보딩 완료 시 백엔드의 `POST /api/v1/user/onboarding`이 호출되고, 계산된 사주(`saju_element`, 띠 등)가 `users` 테이블 및 관련 컬럼에 저장.
- **온보딩 이탈/뒤로가기 UX**
  - 온보딩 도중 **브라우저 뒤로가기, 새로고침, 다른 페이지 이동**을 해도 에러 없이 동작해야 함.
  - 다만 온보딩을 끝내지 않은 상태에서는 **서비스의 메인 기능(대시보드 이하)**로 진입하지 못하고, 로그인 시마다 다시 `/onboarding`으로 유도.
  - 사용자는 언제든 온보딩을 **처음부터 다시 진행**할 수 있어야 하며, 중간에 저장되지 않은 값 때문에 오류가 나면 안 됨.
- **마이페이지/DB 연동**
  - 온보딩에서 확정한 정보는 **`/api/v1/user/me` 응답에 포함**되어야 하고, 프론트의 **마이페이지 `/mypage`**에서 조회·표시 가능해야 함.
  - `users.birth_date`, `birth_time`, `gender`, `calendar_type`, `saju_element`, `zodiac_sign` 등 스펙 상 컬럼과 정합되어야 함.

#### 2. 현재 구조/스펙 요약 (문서 기준)

- **백엔드 스펙 (`FULL_SPECIFICATION`, `BACKEND_DEVELOPMENT_PLAN`)**
  - `users` 테이블에 이미 `birth_date`, `birth_time`, `gender`, `calendar_type`, `saju_element`, `zodiac_sign`, `is_public`, `is_ranking_joined` 컬럼 설계.
  - `POST /api/v1/user/onboarding`: 정밀 사주 계산(4주, 한국천문연구원 API 연동)을 수행하고 사용자에 사주/기본 정보를 저장하는 온보딩 엔드포인트.
  - OAuth 응답에서 `isNewUser` 플래그를 내려주며, **소셜 신규 로그인 시 프론트가 `/onboarding`으로 리다이렉트**하는 것이 문서에 이미 명시되어 있음.
- **프론트 스펙 (`FRONTEND_DEVELOPMENT_PLAN`) & 구현 상태**
  - 라우트: `/login`, `/signup`, `/oauth/callback`, `/onboarding` 모두 존재.
  - 문서 기준 **최초 로그인 라우팅 규칙**: `AuthResponse.isNewUser === true` 이면 `/onboarding`으로 리다이렉트(구글/카카오 공통).
  - `/onboarding` 페이지는 이미 `nickname/birthDate/birthTime/gender/calendarType`을 입력받고 `userApi.submitOnboarding`으로 `POST /api/v1/user/onboarding` 호출.
  - `/oauth/callback`은 쿼리의 `accessToken/refreshToken/isNewUser`를 저장 후 `checkAuth` → `isNewUser`면 `/onboarding`, 아니면 `/`으로 라우팅.
  - `login` 페이지의 Kakao/Google SDK 로그인도 `loginWithKakao/loginWithGoogle` 호출 결과의 `isNewUser`에 따라 `/onboarding` 또는 `/`으로 분기.
  - 일반 `/signup`은 현재 성공 시 `/login`으로 안내만 하며, 온보딩과의 연결은 없음.

#### 3. 데이터/도메인 레벨 설계 (온보딩 완료 상태 정의)

- **온보딩 완료 여부 판단 기준(백엔드/프론트 공통 개념)**
  - 별도 `hasCompletedOnboarding` 플래그를 추가하지 않고, 다음 중 하나로 "온보딩 완료"를 간주:
    - `users.birth_date`와 `users.saju_element`가 **모두 null이 아님** → 사주 계산과 저장이 완료된 상태.
  - 프론트에서는 `/api/v1/user/me` 응답에 노출된 `birthDate`, `sajuElement`(또는 동급 필드)를 기준으로 **온보딩 완료 여부를 유추**.
- **DB 저장 책임 분리**
  - `/api/v1/auth/signup` / `/api/v1/auth/oauth/*`는 **계정 생성 + 최소 프로필(이메일, 닉네임, provider 등)**까지만 책임.
  - `/api/v1/user/onboarding`은 **사주 입력 + 정밀 계산 + `users` 사주/생년월일 관련 컬럼 업데이트**만 책임.
  - 이 분리를 유지하면서도, 프론트 플로우 상에서는 두 단계를 연속된 하나의 "회원가입 경험"으로 묶어 설계.

#### 4. 프론트 플로우 재설계 – 케이스별 시나리오

##### 4.1 공통 상태 관리 전략

- **`auth-store` 확장**
  - `user` 객체 타입에 온보딩 관련 필드(예: `birthDate`, `birthTime`, `gender`, `calendarType`, `sajuElement`, `zodiacSign`)를 반영.
  - 파생 상태 `hasCompletedOnboarding: boolean`을 `user` 기반으로 계산:
    - 예: `!!user?.birthDate && !!user?.sajuElement`.
- **`AuthGuard`/레이아웃 수준 보호**
  - (main) 레이아웃 전체를 감싸는 `AuthGuard`에서 다음 규칙 적용:
    - 인증 O & `hasCompletedOnboarding === false`이면 **항상 `/onboarding`으로 리다이렉트**.
    - `/onboarding` 진입 자체는 허용 (온보딩 도중 반복 리다이렉트 방지 위해 경로 체크).
    - 인증 X면 로그인/회원가입/소셜 로그인만 허용.

###### 플로우 다이어그램 (요약)

```mermaid
flowchart TD
    loginPage[Login/Signup] -->|email+pw signup| emailSignup[POST /api/v1/auth/signup]
    emailSignup --> emailSignupOK{성공?}
    emailSignupOK -->|예| autoLogin[POST /api/v1/auth/login]
    autoLogin --> loginResp[AuthResponse]

    loginPage -->|email login| emailLogin[POST /api/v1/auth/login]
    emailLogin --> loginResp

    loginPage -->|Kakao/Google SDK| socialSDK[authApi.kakaoLogin/googleLogin]
    socialSDK --> socialResp[AuthResponse]

    backendOAuth[Backend Redirect /oauth2/authorization/*] --> oauthCallback[/oauth/callback/]
    oauthCallback --> cbResp[Query accessToken, isNewUser]

    loginResp --> checkAuth[auth-store.checkAuth()]
    socialResp --> checkAuth
    cbResp --> checkAuth

    checkAuth --> hasOnboard{hasCompletedOnboarding?}
    hasOnboard -->|예| goMain[/ (대시보드 등 메인)]
    hasOnboard -->|아니오| goOnboarding[/onboarding]

    onboardingPage[/onboarding] -->|POST /api/v1/user/onboarding 성공| refreshMe[auth-store.fetchProfile]
    refreshMe --> doneHasOnboard[hasCompletedOnboarding=true]
    doneHasOnboard --> goMain
```

##### 4.2 일반 회원가입 (`/signup`) 플로우 변경

- **현재**: `/signup`에서 `auth-store.signup` 호출 → 성공 메시지 → 1.5초 후 `/login`으로 이동.
- **변경 목표**: 회원가입 성공 시 바로 로그인+온보딩으로 연결.
- **구체적 계획**
  - `auth-store.signup`의 반환값 또는 내부 상태를 활용해 **성공 시점에 동일 이메일/비밀번호로 `authApi.login`을 추가 호출**.
  - 로그인 성공 후:
    - 토큰 저장(`localStorage`) 및 `checkAuth()` 수행.
    - `hasCompletedOnboarding === false`인 것이 정상 상태이므로, **바로 `/onboarding`으로 `router.push`**.
  - `/signup` UI 메시지도 "회원가입 성공! 온보딩으로 이동합니다..."처럼 변경.
- **온보딩 미완료 시 처리**
  - 사용자가 온보딩 도중 뒤로가기를 누르거나 창을 닫아도, 계정은 이미 생성되어 있으나 `hasCompletedOnboarding === false` 상태.
  - 이후 `/login`에서 같은 계정으로 로그인하면, 위 공통 로직에 따라 자동으로 `/onboarding`으로 재유도.

##### 4.3 카카오/구글 첫 로그인 플로우 정리

- **Frontend-Driven (SDK) 흐름 (`loginWithKakao`, `loginWithGoogle`)**
  - 백엔드 응답 DTO가 이미 `isNewUser: boolean`을 포함하도록 스펙에 정의되어 있음.
  - `loginWithKakao`/`loginWithGoogle` 내부에서:
    - 토큰 저장 + `checkAuth()`로 `/api/v1/user/me` 호출.
    - `isNewUser === true` 이거나 `hasCompletedOnboarding === false`이면 `/onboarding`으로 이동.
    - 그 외에는 `/`로 이동.
  - 현재 구현도 `isNewUser` 기준 redirect를 수행하므로, 추가로 `hasCompletedOnboarding` 체크만 추가해 **백엔드 플래그와 DB 상태 불일치 시에도 안전하게 온보딩으로 유도**.
- **Backend-Driven (Redirect + `/oauth/callback`) 흐름**
  - 백엔드가 `/oauth/callback?accessToken=...&refreshToken=...&isNewUser=true` 형태로 프론트에 리다이렉트.
  - `oauth/callback/page.tsx`는 이미 토큰을 저장하고 `checkAuth()` 수행 후 `isNewUser`에 따라 `/onboarding` 또는 `/`로 라우팅.
  - 여기에 **`checkAuth()` 이후의 `user` 정보 기반으로 `hasCompletedOnboarding`도 함께 검사**하도록 보강:
    - `isNewUser === true || !hasCompletedOnboarding` 이면 `/onboarding`.
    - 그 외에는 `/`.

##### 4.4 온보딩 페이지 UX/네비게이션 규칙

- **온보딩 진입 전제**
  - 항상 **인증된 상태**여야만 `/onboarding`이 의미 있게 동작 (`Authorization` 헤더 필요).
  - `AuthGuard`와 `/oauth/callback`/`loginWith*`에서 모두 로그인 후에만 `/onboarding`으로 보내도록 유지.
- **뒤로가기/이탈 시 동작**
  - 온보딩 도중 사용자가 **브라우저 뒤로가기** → `/login` 또는 이전 페이지로 갈 수 있음.
  - 이 경우에도 계정은 유지되지만 여전히 `hasCompletedOnboarding === false`이므로, 다음 로그인 시 자동으로 `/onboarding`으로 재유입.
  - 별도의 "회원가입 실패" 토스트를 띄우지 않고, UX 측면에서 **"아직 초기 설정이 끝나지 않았습니다"** 정도의 안내를 온보딩 페이지 상단에 넣는 것을 권장.
- **폼 검증/에러 핸들링**
  - 이미 구현된 필수 필드 검증(`nickname`, `birthDate`, `gender`, `investmentStyle`)을 유지.
  - 백엔드 오류(`400`, `500`) 발생 시 현재처럼 에러 메시지를 상단 박스로 표시.
  - 온보딩 성공 시:
    - `userApi.submitOnboarding` 응답에서 사주 정보(`saju`)를 받으면 결과 화면에 표시.
    - 동시에 `auth-store`의 `fetchProfile` 또는 `checkAuth`를 다시 호출하여 `user` 상태를 최신 프로필로 교체.
    - 최종 버튼 클릭 시 `/`로 이동.

#### 5. 마이페이지/유저 정보 연동 계획

##### 5.1 `/api/v1/user/me` 타입/스토어 정합성

- **백엔드 스펙 확인**
  - `UserMeResponse`에 최소한 다음 필드가 포함되도록 가정/정렬:
    - `id`, `email`, `nickname`, `birthDate`, `birthTime`, `gender`, `calendarType`, `sajuElement`, `zodiacSign`, `isPublic`, `isRankingJoined`, `avatarUrl` 등.
- **프론트 타입 정리 (`types/user.ts` 등)**
  - `User` 타입을 위 필드와 맞게 보강.
  - `userApi.getProfile`의 제네릭 타입을 `User`로 명확히 지정하여 온보딩 후에도 타입 안전하게 사용.
- **`user-store`와 마이페이지 연동**
  - `user-store`의 `fetchProfile`이 `/api/v1/user/me`를 호출해 `User`를 전역 상태로 유지하도록 정리.
  - 마이페이지 `/mypage`에서 다음 정보를 표시/편집:
    - 읽기 전용: `birthDate`, `birthTime`, `gender`, `calendarType`, `sajuElement`, `zodiacSign` (온보딩에서 확정된 기본 사주 정보 → 기본적으로 수정 불가 또는 제한된 수정만 허용).
    - 수정 가능: `nickname`, `isPublic`, `isRankingJoined`, `avatarUrl` 등.
  - 초기 진입 시 `user-store`에 유저 정보가 없으면 `fetchProfile`을 호출하고 로딩 스피너/에러 메시지를 적절히 표시.

##### 5.2 온보딩 이후 마이페이지까지의 데이터 일관성

- **온보딩 성공 → 마이페이지 반영 시나리오**
  - 온보딩 완료 직후 `auth-store` 또는 `user-store`에서 **즉시 `/api/v1/user/me`를 다시 호출**하여 최신 값을 가져온다.
  - 이 상태에서 `/mypage`로 이동하면, 이미 스토어에 최신 프로필이 있어 **추가 로딩 없이** 사주/생년월일/성별 정보가 표시.
- **후속 수정 정책**
  - 사주 관련 필드는 일반적으로 "첫 설정 이후 수정 불가"이지만, 필요 시 **마이페이지에 조건부 수정 기능**을 추가하는 것도 고려할 수 있음 (예: 잘못 입력한 생년월일 정정).
  - 이 경우에는 별도의 백엔드 정책/권한이 필요하므로, 현재 계획에서는 **최소 1차 버전으로 read-only 표시**만을 목표로 한다.

#### 6. 에러/경계 케이스 정리

- **소셜 로그인은 성공했으나 `/user/onboarding`이 실패하는 경우**
  - 에러 메시지를 온보딩 페이지에 표시하고, 사용자는 같은 페이지에서 재시도 가능.
  - 이미 인증 상태이므로, 토큰을 버리지는 않고 **온보딩만 다시 시도**하게 한다.
- **`isNewUser`와 DB 상태 불일치 시나리오**
  - 이론적으로는 드물지만, `isNewUser=false`인데 `birthDate/sajuElement`가 비어 있는 경우가 있을 수 있음.
  - 이때도 `hasCompletedOnboarding`이 false로 평가되어 `/onboarding`으로 유도되므로 안전.
- **사용자가 `/onboarding` URL을 직접 치고 들어오는 경우**
  - 인증 안 된 상태 → `AuthGuard`/라우팅에서 `/login`으로 보내기.
  - 인증 O지만 이미 온보딩 완료한 상태 → `/` 또는 직전 페이지로 리다이렉트.

#### 7. 구현 순서 (프론트 기준)

1. **유저 타입/스토어 정비**

   - `User` 타입에 온보딩/사주 관련 필드 반영.
   - `userApi.getProfile`/`user-store`에서 타입을 맞추고, `hasCompletedOnboarding` 유틸 또는 selector 구현.

2. **Auth 플로우 공통화**

   - `auth-store`의 `checkAuth`가 항상 최신 `/user/me`를 가져오도록 보장.
   - `loginWithKakao`/`loginWithGoogle`/`/oauth/callback`에서 공통으로 `hasCompletedOnboarding` 검사 후 `/onboarding` or `/` 분기.

3. **일반 `/signup` 플로우 개선**

   - 회원가입 성공 시 자동 로그인 + `/onboarding` 진입으로 변경.
   - 기존 `/login` 자동 이동 로직은 제거/조정.

4. **온보딩 페이지와 메인 레이아웃 보호**

   - `AuthGuard`에서 인증 O & 미온보딩 → `/onboarding`, 인증 O & 온보딩 완료 → 메인 접근 허용 로직 추가.
   - `/onboarding`에서는 추가 리다이렉트 없이 폼/사주 결과에 집중.

5. **마이페이지 표시/동기화**

   - `/mypage`가 `user-store`의 `User`를 사용해 사주/생년월일/성별을 표시하도록 개선.
   - 온보딩 완료 직후 `/user/me` 재조회가 잘 동작하는지 확인.

#### 8. . 버전/문서 반영 계획 (계속)

문서 버전 관리 (계속)

FRONTEND_DEVELOPMENT_PLAN.md

5.0 스냅샷/5.1 인증 및 온보딩 섹션에 다음 내용을 명시:

일반 회원가입 /signup도 성공 직후 자동 로그인+온보딩으로 진입하도록 플로우를 고정한다.

AuthResponse.isNewUser === true 이거나 /user/me 기준 hasCompletedOnboarding === false인 경우에는 항상 /onboarding으로 우선 라우팅한다(구글/카카오/일반 공통).

온보딩에서 확정한 필드 집합을 birthDate/birthTime/gender/calendarType/sajuElement/zodiacSign으로 고정하고, 마이페이지는 이를 읽기 전용으로 표시하는 것을 1차 목표로 한다.

FULL_SPECIFICATION.md

5.1 인증 API, 5.2 사용자 API 섹션에 다음을 추가:

온보딩 완료 여부 판단 규칙: users.birth_date IS NOT NULL AND users.saju_element IS NOT NULL이면 완료로 본다는 정책을 명시(별도 hasCompletedOnboarding 컬럼 없음).

최초 로그인 라우팅 규칙:

소셜(구글/카카오) 응답 DTO의 isNewUser는 "이번 로그인에서 계정을 새로 만든 것"을 의미하고, 프론트는 이를 온보딩 진입 트리거로 사용한다.

다만, 최종적으로는 /user/me에서 온보딩 필드를 확인하여 hasCompletedOnboarding을 판단하는 것이 우선이다(isNewUser와 DB 상태가 달라져도 안전).

/api/v1/user/onboarding 응답 예시에 사주 결과 필드(sajuElement, zodiacSign 등)를 포함하고, 이 값이 /user/me·마이페이지에 그대로 반영된다는 흐름을 다이어그램으로 보완.

BACKEND_DEVELOPMENT_PLAN.md

Phase 2(User/Onboarding API) 섹션에 다음을 보강:

온보딩 완료 여부는 별도 boolean 컬럼이 아닌 birth_date + saju_element 조합으로 해석하며, 프론트도 동일한 룰을 따른다는 것을 명시.

소셜 신규 가입 시 isNewUser 플래그는 프론트 라우팅 용도이며, 서버 권한/검증은 항상 JWT+DB 기반으로 한다는 점을 강조.

변경 이력(Ver 2.7.x)에 소셜/일반 가입 온보딩 강제 및 hasCompletedOnboarding 해석 규칙을 한 줄 요약으로 추가.

변경 요약 로그 형식

각 문서의 변경 이력 테이블에 공통으로 유사한 문구를 추가:

예시:

BACKEND:

2.7.18 | 2026-01-20 | 온보딩 완료 여부를 users.birth_date + saju_element 조합으로 해석하도록 명시, 소셜/일반 신규 가입은 모두 /onboarding 진입 전까지 불완전 상태로 취급

FRONTEND:

2.7.17 | 2026-01-20 | 일반 회원가입 성공 시 자동 로그인 후 /onboarding으로 직행하도록 플로우 확정, hasCompletedOnboarding 기반 메인 라우트 보호 규칙 문서화

FULL_SPEC:

2.7.18 | 2026-01-20 | 소셜/일반 공통 온보딩 강제 플로우 및 hasCompletedOnboarding 판단 기준, /user/onboarding → /user/me → /mypage 데이터 흐름 다이어그램 추가

9. 테스트 전략 및 시나리오

9.1 플로우 단위 E2E 시나리오 (프론트 관점)

시나리오 A: 일반 회원가입 → 온보딩 → 대시보드

Given 사용자가 /signup 페이지에 접속한다.

When 유효한 이메일/비밀번호/닉네임을 입력하고 "가입하기"를 누른다.

Then 백엔드 /api/v1/auth/signup이 201/200으로 응답한다.

And 프론트는 같은 자격증명으로 /api/v1/auth/login을 호출해 토큰을 저장하고 checkAuth()를 실행한다.

And /user/me 응답에서 birthDate/sajuElement가 비어 있으므로 hasCompletedOnboarding === false가 된다.

And 사용자는 자동으로 /onboarding으로 이동한다.

When 온보딩 폼에 birthDate/gender/...를 채우고 제출한다.

Then /api/v1/user/onboarding이 성공하고, user-store/auth-store가 /user/me를 재조회해 사주 필드가 채워진다.

And "대시보드 입장" 버튼 클릭 시 /로 이동하고, 이후 새로고침/재로그인 시에도 /로 바로 진입된다.

시나리오 B: 카카오 SDK 로그인(신규) → 온보딩 도중 이탈 → 재로그인

Given 사용자가 /login 페이지에서 Kakao 버튼을 누른다.

When Kakao SDK가 access_token을 발급하고 authApi.kakaoLogin이 성공해 isNewUser === true를 반환한다.

Then 프론트는 토큰을 저장하고 checkAuth()를 거친 후 /onboarding으로 이동한다.

When 사용자가 프로필 일부만 입력하고 브라우저 뒤로가기나 탭 닫기를 수행한다.

Then 계정은 생성되어 있으나 /user/me 기준 hasCompletedOnboarding === false 상태로 남는다.

When 사용자가 다시 /login에서 동일 카카오 계정으로 로그인한다.

Then isNewUser가 false로 내려오더라도, /user/me 기반 hasCompletedOnboarding === false이므로 AuthGuard/플로우에서 다시 /onboarding으로 보내진다.

시나리오 C: 카카오 Backend Redirect → /oauth/callback → 온보딩 완료

Given 사용자가 /login에서 "Kakao (Redirect)" 방식을 선택해 {BACKEND}/oauth2/authorization/kakao로 이동한다.

When 인증이 성공하고 백엔드가 /oauth/callback?accessToken=...&refreshToken=...&isNewUser=true로 리다이렉트한다.

Then oauth/callback/page.tsx는 토큰을 저장하고 checkAuth()를 수행해 /user/me를 가져온다.

And isNewUser === true || !hasCompletedOnboarding 조건이 만족되어 /onboarding으로 이동한다.

When 온보딩을 완료하면 /로 입장하며, 이후 /onboarding 직접 접근 시 /로 리다이렉트된다.

시나리오 D: 온보딩 없이 메인 URL 직접 접근 시

Given 사용자가 이미 로그인은 했으나 온보딩을 끝내지 않은 상태(hasCompletedOnboarding === false)이다.

When 주소창에 /, /trade, /market 등 (main) 레이아웃 하위 경로를 직접 입력한다.

Then 레이아웃 상단의 AuthGuard가 hasCompletedOnboarding === false를 감지하고 /onboarding으로 리다이렉트한다.

And /onboarding에서만 온보딩 폼을 볼 수 있고, 나머지 페이지는 온보딩 완료 전에는 접근 불가이다.

9.2 단위 테스트/통합 테스트 포인트 (프론트)

스토어/유틸 함수

hasCompletedOnboarding(user) 유틸:

birthDate와 sajuElement가 둘 다 존재하면 true, 둘 중 하나라도 없으면 false가 되는지 테스트.

auth-store.checkAuth:

/user/me 응답 모킹으로 hasCompletedOnboarding 평가가 원하는 대로 변경되는지 확인.

라우팅/가드 로직 (React Testing Library, Jest 기준 가짜 Router)

/oauth/callback에서 isNewUser=true & user 미온보딩 → /onboarding으로 가는지.

/oauth/callback에서 isNewUser=false이지만 user 미온보딩 → /onboarding으로 가는지.

/onboarding 완료 후 / 진입 시 더 이상 /onboarding으로 튕기지 않는지.

폼/UX

온보딩 페이지에서 필수 필드 미입력 시, 기존 에러 메시지가 정상 표시되는지.

백엔드에서 400/500 에러 시, 온보딩 페이지가 에러 텍스트를 보여주고 스텝이 survey로 롤백되는지.

10. 구현 시 의사코드 레벨 작업 목록 정리

아래는 실제 코드 구현 전에 참고할 프론트 기준 의사코드 작업 목록입니다.

1) User 타입 및 온보딩 상태 유틸

types/user.ts:

User 인터페이스에 birthDate, birthTime, gender, calendarType, sajuElement, zodiacSign, isPublic, isRankingJoined 필드를 추가/정합.

lib/utils.ts 또는 별도 유틸:

function hasCompletedOnboarding(user?: User | null): boolean { return !!user?.birthDate && !!user?.sajuElement; }

2) auth-store 및 user-store 보강

auth-store.ts:

상태에 user: User | null 필드 유지 (이미 있다면 타입만 정합).

checkAuth:

authApi.me() 호출 후 user를 갱신.

필요하면 hasCompletedOnboarding을 selector로 노출(함수거나 getState 기반).

user-store.ts:

fetchProfile가 /api/v1/user/me를 호출해 동일 User 타입을 재사용하도록 정리.

온보딩 완료 후 fetchProfile을 재호출할 수 있는 액션을 노출.

3) /signup 플로우 변경

SignupPage:

signup(formData) 성공 시:

기존 router.push("/login") 제거.

대신:

await login({ email: formData.email, password: formData.password })

로그인 성공 후 await checkAuth() 실행.

이후 if (!hasCompletedOnboarding(user)) router.push("/onboarding"); else router.push("/");

4) 소셜 로그인 핸들러 공통화

useAuthStore 내 loginWithKakao, loginWithGoogle:

성공 시 공통 로직:

토큰 저장 → checkAuth() → const user = getState().user;

const needOnboarding = isNewUser || !hasCompletedOnboarding(user);

router.push(needOnboarding ? "/onboarding" : "/");

/oauth/callback/page.tsx:

현재 isNewUser만 보고 분기하는 부분을 위와 동일한 needOnboarding 로직으로 교체.

5) AuthGuard/레이아웃 보호

(main) 레이아웃 또는 AuthGuard 컴포넌트:

마운트 시/토큰 존재 시 checkAuth()가 이미 돌았다고 가정하고, user를 감시.

if (isAuthenticated && !hasCompletedOnboarding(user) && pathname !== "/onboarding") router.replace("/onboarding");

/onboarding에서는 가드가 추가 리다이렉트하지 않도록 예외 처리.

6) 온보딩 완료 후 동기화

/onboarding/page.tsx:

userApi.submitOnboarding 성공 시:

기존 사주 결과 UI 유지.

추가로 await userStore.fetchProfile() 또는 authStore.checkAuth()를 호출하여 프로필을 최신 상태로 갱신.

"대시보드 입장" 버튼 클릭 시 /로 이동하면, AuthGuard 입장에서는 이미 hasCompletedOnboarding === true 상태이므로 더 이상 /onboarding으로 튕기지 않는다.

7) 마이페이지 표시

/mypage/page.tsx:

상단 프로필 카드/정보 영역에:

user.birthDate, user.birthTime, user.gender, user.calendarType, user.sajuElement, user.zodiacSign을 표시(읽기 전용).

수정 가능한 항목(nickname, isPublic, isRankingJoined, avatarUrl)만 편집 가능하게 두고, 사주 관련 항목은 수정 UI를 숨기거나 "온보딩에서 설정됨" 텍스트만 출력.

  - `FULL_SPECIFICATION.md`의 5.1/5.2 인증/사용자 API 섹션에 **온보딩 완료 여부 판단 기준(예: `birth_date + saju_element`)과 최초 로그인 라우팅 규칙**을 보강.
  - `BACKEND_DEVELOPMENT_PLAN.md`에는 별도 스키마 변경이 없음을 명시하고, 온보딩 완료 여부를 별도 플래그 대신 컬럼 조합으로 해석한다는 정책을 추가.
- **변경 요약 로그**
  - 각 문서 변경 시 **변경 이력 테이블에 소셜/일반 가입 온보딩 강제, hasCompletedOnboarding 해석 규칙, `/signup