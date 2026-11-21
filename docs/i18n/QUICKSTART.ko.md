<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Yggdrasil 프로젝트 로고" />
</p>

<h1 align="center">빠른 시작</h1>

<p align="center">
  <a href="README.ko.md">소개</a> ·
  <a href="QUICKSTART.ko.md">빠른 시작</a> ·
  <a href="CONTRIBUTING.ko.md">기여 가이드</a> ·
  <a href="CONTRIBUTORS.ko.md">기여자</a> ·
  <a href="FAQ.ko.md">자주 묻는 질문</a>
</p>

---

## 시작하기 전에

이 프로젝트는 **All Rights Reserved** 라이선스를 사용합니다. 프로젝트 원본 자료를 사용, 운영, 수정, 재배포, 공개 배포하거나 상업적으로 이용하기 전에 해당 권리자의 사전 서면 허가를 받아야 합니다. 자세한 내용은 [LICENSE](../../LICENSE)를 참조하세요.

## 권장 방식: Config Builder

[Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/)를 열고 다음 5단계를 따르세요.

1. **구독 출처.** 제공자(공항) 이름과 YAML, Base64 또는 일반 노드 링크 구독을 입력합니다. 노드와 제공자가 보고한 트래픽 정보가 파싱됩니다.
2. **지역 노드.** 구독에 실제로 존재하는 지역만 표시됩니다. 유지할 노드 범위를 선택합니다.
3. **노드 전략.** 필요한 자동 전략만 유지합니다. 기본 아웃바운드는 수동 선택입니다.
4. **APP 분류.** 모든 애플리케이션이 기본적으로 활성화되어 프록시를 통과합니다. 필요에 따라 앱별로 유지한 지역, Direct 또는 Reject를 지정합니다.
5. **최종 확인.** 설정을 미리 보고, `name-ratatoskr.yaml`을 다운로드하거나 영구 구독 링크를 생성합니다.

구독은 YAML, Base64 및 일반 노드 링크를 허용합니다. 트래픽 정보는 제공자의 `Subscription-Userinfo`에서 가져옵니다. 선택 사항인 지연 검사는 측정 서버에서 노드로의 TCP 연결 설정 시간을 측정하며, ICMP ping이나 전체 프록시 지연이 아닙니다.

## 수동 방식: 템플릿 직접 사용

1. [ratatoskr-template.yaml](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml)을 다운로드합니다.
2. 구독 노드로 자신만의 `proxy-providers` / `proxies`를 로컬에서 관리합니다.
3. 클라이언트가 참조하는 GeoSite / GeoIP 데이터를 갖추고 있는지 확인합니다.
4. Mihomo 호환 클라이언트로 가져온 뒤, 애플리케이션이나 지역별로 아웃바운드를 선택하고 지연 테스트를 다시 실행합니다.

## 포트

| 설정 | HTTP | SOCKS5 |
| :--- | :--- | :--- |
| 수동 템플릿 | `7890` | `7891` |
| Config Builder 생성 파일 | `7890` | `7890` |

Config Builder는 혼합 포트를 사용하며 사용자 지정을 지원합니다. 개인 구독 URL, 노드 자격 증명, 액세스 토큰은 로컬 또는 비공개 워크플로에서 관리하세요.

## 배포

Config Builder와 구독 서비스는 Cloudflare Pages에 함께 배포됩니다. 자세한 내용은 [배포 가이드](../../config-builder/docs/DEPLOYMENT.md)와 [구현 개요](../../config-builder/docs/IMPLEMENTATION.md)를 참조하세요.

---

<p align="center"><sub>Yggdrasil × Ratatoskr · 설정 도구와 핵심 템플릿이 함께 동작합니다.</sub></p>
