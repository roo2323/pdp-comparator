# PDP Comparator - Chrome Extension

LGE PDP(Product Detail Page) 개편 프로젝트의 **AS-IS(JSP) / TO-BE(Next.js)** 페이지를 한 화면에서 비교 검증하는 Chrome 익스텐션입니다.

## 주요 기능

- **한 화면 비교** — AS-IS / TO-BE PDP를 좌우 분할로 동시 노출
- **모바일 모드** — User-Agent + Client Hints 강제 변환으로 모바일 페이지 렌더링
- **DOM 비교** — CSS 셀렉터 기반 데이터 추출 및 항목별 비교 (일시불/구독 자동 전환)
- **성능 비교** — Web Vitals(TTFB, FCP, LCP, CLS), 리소스 크기, DOM 복잡도 자동 측정
- **API 응답 캡처** — TO-BE fetch 인터셉트로 API 응답 자동 캡처
- **URL 자동 생성** — 모델 ID 입력 시 purchase-type API로 AS-IS/TO-BE URL 자동 설정
- **스크롤 동기화** — 양쪽 iframe 동시 스크롤
- **분할선 드래그** — 좌우 비율 자유 조정

## 설치 방법

### 1. 레포 클론
```bash
git clone git@github.com:roo2323/pdp-comparator.git
```

### 2. Chrome 익스텐션 로드
1. Chrome 주소창에 `chrome://extensions` 입력
2. 우측 상단 **개발자 모드** 토글 ON
3. **압축해제된 확장 프로그램을 로드합니다** 클릭
4. 클론한 `pdp-comparator` 폴더 선택

### 3. 사용
1. Chrome 우측 상단 익스텐션 아이콘 클릭 → **비교 화면 열기**
2. 모델 ID 입력 (예: `MD10521846`)
3. 일시불/구독 선택
4. **비교 로드** 클릭

> **참고**: URL 자동 생성을 위해 로컬 PDP API 서버(`localhost:18093`)가 실행 중이어야 합니다.

## 사용법

### DOM 비교
- 페이지 로드 후 비교 패널 → **DOM 비교** 탭 → **DOM 비교 실행** 클릭
- 일시불/구독에 따라 비교 항목이 자동 전환됨
- **셀렉터 설정** 탭에서 CSS 셀렉터 커스텀 가능

### 성능 비교
- 페이지 로드 완료 후 **성능** 탭에 자동 측정 결과 표시
- 더 좋은 쪽에 초록 테두리 표시

### 모바일/데스크톱 전환
- 상단 **모바일** 토글로 전환 (기본: 모바일 ON)
- User-Agent + Sec-CH-UA-Mobile + navigator.userAgentData 모두 변환

## 파일 구조

```
pdp-comparator/
├── manifest.json          # Manifest V3 설정
├── rules.json             # X-Frame-Options/CSP 헤더 제거 규칙
├── background.js          # 서비스 워커 (모바일 UA, API 캐시)
├── content.js             # iframe 내부 주입 (스크롤, DOM 추출, 성능 측정)
├── mobile-override.js     # navigator.userAgent 오버라이드 (CSP 우회용)
├── compare.html           # 메인 비교 UI
├── compare.js             # 비교 로직 (셀렉터, 성능, URL 생성)
├── popup.html             # 익스텐션 팝업
├── popup.js               # 팝업 로직
└── README.md
```

## 셀렉터 커스텀 가이드

### 셀렉터 구조
```json
{
  "key": "항목명",
  "asis": "AS-IS CSS 셀렉터",
  "tobe": "TO-BE CSS 셀렉터",
  "all": false,
  "textFilter": ""
}
```

### 옵션
| 필드 | 설명 |
|------|------|
| `all: true` | querySelectorAll 사용, 모든 매칭 요소 텍스트를 `\|`로 결합 |
| `textFilter: "정규식"` | querySelectorAll 후 텍스트 매칭으로 특정 요소 찾기 |

### TO-BE 셀렉터 주의사항
TO-BE는 **CSS Modules**를 사용하여 클래스명이 빌드 시 해시됩니다.
```
원본: .product_name → 빌드 후: .PdpMoProductName_product_name_a1b2c3
```
따라서 `[class*='product_name']` 형태의 부분 매칭 셀렉터를 사용합니다.

## 기여 방법

1. 브랜치 생성: `git checkout -b feature/add-selectors`
2. 셀렉터 추가/수정: `compare.js`의 `DS_PURCHASE` 또는 `DS_SUBSCRIPTION` 배열
3. 테스트 후 PR 생성

### 셀렉터 추가 예시
```js
// DS_PURCHASE 또는 DS_SUBSCRIPTION 배열에 추가
{key:"새 항목", asis:".as-is-selector", tobe:"[class*='to_be_class']"},
```

## 기술 스택

- Chrome Extension Manifest V3
- declarativeNetRequest (헤더 제어)
- PerformanceObserver (Web Vitals 측정)
- postMessage (iframe 간 통신)
