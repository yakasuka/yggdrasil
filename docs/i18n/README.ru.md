<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Логотип проекта Yggdrasil" />
</p>

<h1 align="center">Yggdrasil</h1>

<p align="center">
  Инструменты конфигурации и подписок для Mihomo · Основанные на шаблоне Ratatoskr
</p>

<p align="center">
  <a href="https://wiki.metacubex.one/"><img src="https://img.shields.io/badge/Core-Mihomo-3282B8?style=flat-square" alt="Ядро: Mihomo" /></a>
  <a href="https://github.com/yakasuka/yggdrasil/releases/latest"><img src="https://img.shields.io/badge/Release-v1.0.0-537A5A?style=flat-square" alt="Последняя версия" /></a>
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/License-Permission_Required-C4A25A?style=flat-square" alt="Требуется разрешение" /></a>
</p>

<p align="center">
  <a href="README.ru.md">Введение</a> ·
  <a href="QUICKSTART.ru.md">Быстрый старт</a> ·
  <a href="CONTRIBUTING.ru.md">Участие в разработке</a> ·
  <a href="CONTRIBUTORS.ru.md">Участники</a> ·
  <a href="FAQ.ru.md">Частые вопросы</a>
</p>

---

## Language

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja-JP.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [हिन्दी](README.hi.md) · [Nederlands](README.nl.md) · [Italiano](README.it.md)

---

## Что это такое

**Yggdrasil — это приложение и набор инструментов; Ratatoskr — его основная конфигурация.** Yggdrasil предоставляет Config Builder, разбор шаблонов, генерацию YAML и доставку подписок. Ratatoskr определяет правила маршрутизации, каталог регионов, фильтры узлов и группы прокси.

Config Builder считывает каталог и правила из шаблона Ratatoskr и объединяет выбранные узлы и стратегии выхода в личный YAML. Таким образом шаблон служит и готовой основой конфигурации, и общим источником данных для каталога и генератора.

```text
Subscription / node file → Config Builder → Ratatoskr template → Personal Mihomo YAML
```

**Yggdrasil организует, генерирует и доставляет; Ratatoskr — это конфигурация, которая доходит до пользователя.**

## Ключевые особенности

- **Блокировка рекламы на уровне десктопа.** Включена подписка правил AdGuard для Windows desktop с примерно 316 000 заблокированных доменов; за официальным upstream следят отложенные обновления только при изменениях.
- **Лёгкая маршрутизация на основе Geo.** GeoSite и GeoIP содержат данные классификации; основной конфигурационный файл занимает около 28 КБ, а намерения маршрутизации остаются ясными и читаемыми.
- **Пять стратегий выхода.** Ручной выбор, URL-test, failover, балансировка нагрузки на основе согласованного хеширования и циклическая балансировка загрузок (round-robin).
- **Каталог приложений и регионов.** Группы прокси для ChatGPT, Claude, Telegram, Spotify, Steam и других; региональные группы для Гонконга, Тайваня, Японии, Кореи, Сингапура и США с отдельными иконками.
- **Автоматическая доставка.** Тела правил загружаются только при изменении содержимого — низкое потребление ресурсов и детерминированный результат. Релизы предоставляют фиксированную ссылку на скачивание и контрольную сумму SHA-256.

## Выбор конфигурации

Скачайте основную конфигурацию из [Releases](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml) или используйте [ratatoskr-template.yaml](../../resources/template/ratatoskr-template.yaml) в репозитории.

| Потребность | Точка входа |
| :--- | :--- |
| Основная конфигурация на каждый день | Фиксированная ссылка Release / шаблон из репозитория |
| Визуальная генерация личной конфигурации | [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) |
| Полная документация | [Быстрый старт](QUICKSTART.ru.md) |

## Лицензия и обратная связь

**Все права защищены · Требуется предварительное письменное разрешение.** Использование, запуск, изменение, повторное распространение, публичное развёртывание и коммерческое использование оригинальных материалов требуют предварительного письменного разрешения правообладателя; это относится и к личным, и к некоммерческим целям. Полные условия — в [LICENSE](../../LICENSE). Сторонние материалы остаются под своей лицензией.

Сообщайте о проблемах или запрашивайте разрешение через [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues). Удаляйте токены подписок и учётные данные узлов из своих сообщений.

---

<p align="center"><sub>Yggdrasil × Ratatoskr · инструмент конфигурации и основной шаблон работают вместе.</sub></p>
