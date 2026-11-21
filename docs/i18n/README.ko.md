<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Yggdrasil 프로젝트 로고" />
</p>

<h1 align="center">Yggdrasil</h1>

<p align="center">
  Mihomo 설정 및 구독 도구 · Ratatoskr 템플릿 기반
</p>

<p align="center">
  <a href="https://wiki.metacubex.one/"><img src="https://img.shields.io/badge/Core-Mihomo-3282B8?style=flat-square" alt="코어: Mihomo" /></a>
  <a href="https://github.com/yakasuka/yggdrasil/releases/latest"><img src="https://img.shields.io/badge/Release-v1.0.0-537A5A?style=flat-square" alt="최신 릴리스" /></a>
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/License-Permission_Required-C4A25A?style=flat-square" alt="사전 허가 필요" /></a>
</p>

<p align="center">
  <a href="README.ko.md">소개</a> ·
  <a href="QUICKSTART.ko.md">빠른 시작</a> ·
  <a href="CONTRIBUTING.ko.md">기여 가이드</a> ·
  <a href="CONTRIBUTORS.ko.md">기여자</a> ·
  <a href="FAQ.ko.md">자주 묻는 질문</a>
</p>

---

## Language

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja-JP.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [हिन्दी](README.hi.md) · [Nederlands](README.nl.md) · [Italiano](README.it.md)

---

## 프로젝트 소개

**Yggdrasil은 애플리케이션이자 도구 모음이며, Ratatoskr는 그 핵심 설정입니다.** Yggdrasil은 설정 빌더, 템플릿 파싱, YAML 생성, 구독 전달을 제공합니다. Ratatoskr는 라우팅 규칙, 지역 카탈로그, 노드 필터, 프록시 그룹을 정의합니다.

설정 빌더는 Ratatoskr 템플릿에서 카탈로그와 규칙을 읽어, 선택한 노드와 아웃바운드 전략을 결합해 개인용 YAML을 만듭니다. 따라서 템플릿은 바로 사용할 수 있는 설정 기반인 동시에 카탈로그와 빌더가 공유하는 데이터 소스 역할을 합니다.

```text
Subscription / node file → Config Builder → Ratatoskr template → Personal Mihomo YAML
```

**Yggdrasil은 구성하고 생성하며 전달합니다. Ratatoskr는 사용자에게 전달되는 설정 그 자체입니다.**

## 주요 기능

- **데스크톱 수준의 광고 차단.** AdGuard Windows 데스크톱 규칙 구독을 내장하여 약 316,000개의 차단 도메인을 포함하며, 공식 업스트림을 따라가며 변경 시 지연 로딩으로 업데이트합니다.
- **Geo 기반 경량 라우팅.** GeoSite / GeoIP가 분류 데이터를 담당하고, 메인 설정은 약 28 KB로 라우팅 의도가 명확하게 읽힙니다.
- **5가지 아웃바운드 전략.** 수동 선택, URL-test, 페일오버, 일관성 해시 부하 분산, 라운드 로빈 다운로드 분산.
- **애플리케이션 및 지역 카탈로그.** ChatGPT, Claude, Telegram, Spotify, Steam 등의 앱 프록시 그룹과 홍콩 / 대만 / 일본 / 한국 / 싱가포르 / 미국 등의 지역 그룹에 전용 아이콘을 제공합니다.
- **자동 전달.** 규칙 본문은 내용이 변경될 때만 가져오므로 리소스 사용량이 적고 출력이 결정적입니다. Release에서는 고정 다운로드 링크와 SHA-256 체크섬을 제공합니다.

## 설정 선택

메인 설정은 [Release에서 다운로드](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml)하거나 저장소의 [ratatoskr-template.yaml](../../resources/template/ratatoskr-template.yaml)을 직접 사용하세요.

| 필요 사항 | 진입점 |
| :--- | :--- |
| 일상용 메인 설정 | Release 고정 링크 / 저장소 템플릿 |
| 시각적으로 개인 설정 생성 | [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) |
| 전체 문서 | [빠른 시작](QUICKSTART.ko.md) |

## 라이선스 및 피드백

**All Rights Reserved · 사전 서면 허가가 필요합니다.** 원본 자료의 사용, 운영, 수정, 재배포, 공개 배포 및 상업적 사용은 권리자의 사전 서면 허가가 필요하며, 개인 및 비상업적 사용도 포함됩니다. 전체 약관은 [LICENSE](../../LICENSE)를 참조하세요. 서드파티 자료에는 각각의 라이선스가 적용됩니다.

문제 보고나 허가 신청은 [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues)를 통해 해 주세요. 보고 시 구독 토큰과 노드 자격 증명은 제거해 주세요.

---

<p align="center"><sub>Yggdrasil × Ratatoskr · 설정 도구와 핵심 템플릿이 함께 동작합니다.</sub></p>
