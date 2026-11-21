# Участие в разработке

<p align="center">
  <a href="README.ru.md">Введение</a> ·
  <a href="QUICKSTART.ru.md">Быстрый старт</a> ·
  <a href="CONTRIBUTING.ru.md">Участие в разработке</a> ·
  <a href="CONTRIBUTORS.ru.md">Участники</a> ·
  <a href="FAQ.ru.md">Частые вопросы</a>
</p>

---

## Способы внести вклад

Issues приветствуются для сообщений об ошибках, запросов разрешения и предложений. Укажите версии клиента и ядра, используемую конфигурацию и ожидаемый результат маршрутизации — и удалите токены подписок и учётные данные узлов.

## Команды разработки

Фронтенд Config Builder и общий компилятор шаблонов находятся в `config-builder/`:

```sh
npm --prefix config-builder ci
npm --prefix config-builder run build
npm --prefix config-builder test
npm --prefix config-builder run service:dev
```

Локальный сервер запускается по адресу `http://localhost:8788/config-builder/`.

## Структура репозитория

| Путь | Назначение |
| :--- | :--- |
| `resources/template/` | Основной шаблон конфигурации |
| `resources/rules/` | Данные правил, сгруппированные по источникам (adguard / aethersailor / download) |
| `config-builder/` | Фронтенд Config Builder, общий компилятор и сервис подписок |
| `scripts/rules/` | Скрипты получения и синхронизации правил (отложенные обновления) |
| `scripts/endpoints/` | Устаревшие эндпоинты `/merge` и `/sub` |
| `docs/i18n/` | Многоязычная документация wiki |

## Добавление приложения или региона

Отредактируйте статический каталог [catalog.json](../../config-builder/shared/catalog.json). После пересборки каталог страницы и шаблон бэкенда обновятся соответствующим образом. Полный поток данных описан в [карте реализации](../../config-builder/docs/IMPLEMENTATION.md).

## Обновление правил

Скрипты правил работают по принципу отложенного обновления: условные запросы ETag / Last-Modified загружают тело только при изменении содержимого. Два рабочих процесса GitHub Actions обрабатывают соответственно правила AdGuard для desktop и синхронизацию правил Aethersailor. См. [руководство по развёртыванию](../../config-builder/docs/DEPLOYMENT.md).

## Документация

Многоязычная документация находится в `docs/i18n/`. Каждый язык содержит пять глав: README, QUICKSTART, CONTRIBUTING, CONTRIBUTORS и FAQ. Чтобы добавить язык, скопируйте полный набор и переименуйте файлы с кодом языка:

```text
README.<language-code>.md
QUICKSTART.<language-code>.md
CONTRIBUTING.<language-code>.md
CONTRIBUTORS.<language-code>.md
FAQ.<language-code>.md
```

Коды языков соответствуют стандарту BCP 47, например `zh-CN`, `en`, `pt-BR`.
