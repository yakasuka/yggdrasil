# 기여 가이드

<p align="center">
  <a href="README.ko.md">소개</a> ·
  <a href="QUICKSTART.ko.md">빠른 시작</a> ·
  <a href="CONTRIBUTING.ko.md">기여 가이드</a> ·
  <a href="CONTRIBUTORS.ko.md">기여자</a> ·
  <a href="FAQ.ko.md">자주 묻는 질문</a>
</p>

---

## 기여 방법

버그 보고, 허가 요청, 제안은 Issues로 환영합니다. 보고 시 클라이언트와 코어 버전, 사용 중인 설정, 기대하는 라우팅 결과를 함께 적고 구독 토큰과 노드 자격 증명은 제거해 주세요.

## 개발 명령

Config Builder 프런트엔드와 공유 템플릿 컴파일러는 `config-builder/`에 있습니다.

```sh
npm --prefix config-builder ci
npm --prefix config-builder run build
npm --prefix config-builder test
npm --prefix config-builder run service:dev
```

로컬 서비스 주소는 `http://localhost:8788/config-builder/`입니다.

## 저장소 구조

| 경로 | 역할 |
| :--- | :--- |
| `resources/template/` | 핵심 설정 템플릿 |
| `resources/rules/` | 출처별로 분류된 규칙 데이터 (adguard / aethersailor / download) |
| `config-builder/` | Config Builder 프런트엔드, 공유 컴파일러, 구독 서비스 |
| `scripts/rules/` | 규칙 가져오기 및 동기화 스크립트 (지연 업데이트) |
| `scripts/endpoints/` | 구버전 `/merge`, `/sub` 엔드포인트 |
| `docs/i18n/` | 다국어 wiki 문서 |

## 애플리케이션 또는 지역 추가

정적 카탈로그 [catalog.json](../../config-builder/shared/catalog.json)을 편집합니다. 다시 빌드하면 페이지 카탈로그와 백엔드 템플릿이 함께 갱신됩니다. 전체 데이터 흐름은 [구현 개요](../../config-builder/docs/IMPLEMENTATION.md)를 참조하세요.

## 규칙 업데이트

규칙 스크립트는 지연 업데이트 원칙에 따라 동작합니다. ETag / Last-Modified 조건부 프로브로 내용이 변경된 경우에만 본문을 가져옵니다. 두 개의 GitHub Actions 워크플로가 각각 AdGuard 데스크톱 규칙과 Aethersailor 규칙 동기화를 처리합니다. 배포 방식은 [배포 가이드](../../config-builder/docs/DEPLOYMENT.md)를 참조하세요.

## 문서

다국어 문서는 `docs/i18n/`에 있습니다. 각 언어에는 README, QUICKSTART, CONTRIBUTING, CONTRIBUTORS, FAQ 다섯 개의 장이 포함됩니다. 새 언어를 추가할 때는 한 벌을 복사한 뒤 다음과 같이 이름을 지정하세요.

```text
README.<language-code>.md
QUICKSTART.<language-code>.md
CONTRIBUTING.<language-code>.md
CONTRIBUTORS.<language-code>.md
FAQ.<language-code>.md
```

언어 코드는 BCP 47을 따릅니다. 예: `zh-CN`, `en`, `pt-BR`.
