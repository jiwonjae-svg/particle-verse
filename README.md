# ParticleVerse - 3D 파티클 시각화 웹앱

인터랙티브 3D 파티클 시각화 경험 - 손동작으로 파티클을 조작하세요!

## 🚀 주요 기능

- **다양한 소스 지원**: 이미지, 텍스트, 3D 모델을 파티클로 변환
- **손 인식 조작**: 웹캠을 통해 손동작으로 파티클 조작
- **다양한 이펙트**: 파도, 나선, 폭발, 소용돌이 등 8가지 이펙트
- **실시간 커스터마이징**: 파티클 크기, 색상, 속도 등 세밀한 조정
- **GPU 최적화**: WebGL 셰이더 기반 고성능 렌더링
- **보안 강화**: 20가지 이상의 웹 보안 취약점 대응

## 📋 기술 스택

- **Framework**: Next.js 14 (App Router)
- **3D Engine**: Three.js + React Three Fiber
- **Hand Tracking**: MediaPipe Hands
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Deployment**: Vercel

## 🛠️ 로컬 개발 환경 설정

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/particle-verse.git
cd particle-verse
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 4. 빌드

```bash
npm run build
```

## 🌐 Vercel 배포 가이드

### 방법 1: Vercel CLI 사용 (권장)

#### 1. Vercel CLI 설치

```bash
npm install -g vercel
```

#### 2. Vercel 로그인

```bash
vercel login
```

브라우저에서 Vercel 계정으로 인증합니다.

#### 3. 프로젝트 배포

```bash
# 프로젝트 디렉토리에서 실행
vercel
```

처음 실행 시 다음 질문에 답합니다:
- **Set up and deploy?**: `Y`
- **Which scope?**: 본인 계정 선택
- **Link to existing project?**: `N` (새 프로젝트)
- **What's your project's name?**: `particle-verse` (또는 원하는 이름)
- **In which directory is your code located?**: `./` (현재 디렉토리)

#### 4. 프로덕션 배포

```bash
vercel --prod
```

### 방법 2: GitHub 연동 자동 배포

#### 1. GitHub 저장소 생성 및 푸시

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/particle-verse.git
git push -u origin main
```

#### 2. Vercel 웹사이트에서 설정

1. [vercel.com](https://vercel.com)에 로그인
2. **"Add New..."** → **"Project"** 클릭
3. **"Import Git Repository"** 에서 GitHub 저장소 선택
4. **Framework Preset**: `Next.js` 자동 감지됨
5. **Root Directory**: `/` (기본값)
6. **Build Command**: `npm run build` (기본값)
7. **Output Directory**: `.next` (기본값)
8. **"Deploy"** 클릭

#### 3. 자동 배포 설정

- `main` 브랜치에 푸시할 때마다 자동 배포
- PR 생성 시 미리보기 배포 자동 생성

### 환경 변수 설정 (선택사항)

Vercel 대시보드 → 프로젝트 → Settings → Environment Variables에서:

```
# 예시 (필요한 경우)
NEXT_PUBLIC_API_URL=https://api.example.com
```

## 📁 프로젝트 구조

```
particle-verse/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css         # 전역 스타일
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   └── page.tsx            # 메인 페이지
│   ├── components/
│   │   ├── hand/               # 손 인식 컴포넌트
│   │   │   └── HandTracker.tsx
│   │   ├── three/              # 3D 관련 컴포넌트
│   │   │   ├── ParticleSystem.tsx
│   │   │   └── Scene.tsx
│   │   └── ui/                 # UI 컴포넌트
│   │       ├── LoadingScreen.tsx
│   │       ├── UIOverlay.tsx
│   │       └── panels/
│   │           ├── EffectsPanel.tsx
│   │           ├── HandPanel.tsx
│   │           ├── ParticlePanel.tsx
│   │           ├── SourcePanel.tsx
│   │           └── VisualPanel.tsx
│   ├── shaders/                # GLSL 셰이더
│   │   └── particleShaders.ts
│   ├── store/                  # 상태 관리
│   │   └── useAppStore.ts
│   └── utils/                  # 유틸리티
│       ├── particleGenerator.ts
│       └── security.ts
├── public/                     # 정적 파일
├── next.config.js              # Next.js 설정
├── tailwind.config.js          # Tailwind 설정
├── tsconfig.json               # TypeScript 설정
├── vercel.json                 # Vercel 배포 설정
└── package.json
```

## 🎮 사용 방법

### 소스 설정
1. 좌측 패널에서 **"소스"** 탭 선택
2. 소스 타입 선택:
   - **기본**: 구형 파티클 분포
   - **단일 이미지**: 이미지를 파티클로 변환
   - **큐브맵**: 6장의 이미지로 큐브맵 생성
   - **텍스트**: 텍스트를 3D 파티클로 변환
   - **3D 모델**: GLTF/GLB 파일 로드

### 이펙트 적용
1. **"이펙트"** 탭에서 원하는 효과 선택
2. 이펙트 강도 조절

### 파티클 설정
- 파티클 수, 크기, 불투명도 조절
- 애니메이션 속도 및 터뷸런스 설정

### 시각 설정
- 컬러 모드 변경 (원본, 그라데이션, 무지개 등)
- 블룸 효과 강도 조절

### 손 조작
1. **"손 조작"** 탭에서 손 추적 활성화
2. 웹캠 권한 허용
3. 제스처로 파티클 조작:
   - ✋ **손 펴기**: 파티클 밀어내기
   - ✊ **주먹 쥐기**: 파티클 당기기
   - 🤏 **핀치**: 파티클 모으기

### 마우스/터치 조작
- **드래그**: 카메라 회전
- **스크롤**: 줌 인/아웃
- **우클릭 드래그**: 카메라 이동

## 🔒 보안 기능

이 앱은 다음 보안 위협에 대응합니다:

| 구분 | 취약점 | 대응 방법 |
|------|--------|----------|
| XSS | 스크립트 삽입 | HTML 이스케이프, CSP 헤더 |
| CSRF | 요청 위조 | SameSite 쿠키, CSRF 토큰 |
| Clickjacking | 클릭 하이재킹 | X-Frame-Options: DENY |
| 파일 업로드 | 악성 파일 | MIME 타입/매직넘버 검증 |
| Open Redirect | 리다이렉트 공격 | URL 화이트리스트 |
| Rate Limiting | 브루트포스 | 요청 횟수 제한 |
| Input Validation | 주입 공격 | 입력 정제 |

## ⚡ 성능 최적화

- **GPU 셰이더**: 모든 파티클 계산을 GPU에서 처리
- **동적 LOD**: 화면 거리에 따른 파티클 크기 조절
- **적응형 DPR**: 성능에 따른 해상도 자동 조절
- **코드 스플리팅**: 동적 임포트로 초기 로딩 최적화
- **메모이제이션**: useMemo/useCallback으로 재렌더링 최소화

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포할 수 있습니다.

## 🙏 감사의 글

- [Three.js](https://threejs.org/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [MediaPipe](https://mediapipe.dev/)
- [Vercel](https://vercel.com/)
