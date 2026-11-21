<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="نشانهٔ پروژهٔ Yggdrasil" />
</p>

<h1 align="center">Yggdrasil</h1>

<p align="center">
  ابزارهای پیکربندی و اشتراک Mihomo · ساخته‌شده بر پایهٔ الگوی Ratatoskr
</p>

<p align="center">
  <a href="https://wiki.metacubex.one/"><img src="https://img.shields.io/badge/Core-Mihomo-3282B8?style=flat-square" alt="هسته: Mihomo" /></a>
  <a href="https://github.com/yakasuka/yggdrasil/releases/latest"><img src="https://img.shields.io/badge/Release-v1.0.0-537A5A?style=flat-square" alt="آخرین نسخه" /></a>
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/License-Permission_Required-C4A25A?style=flat-square" alt="نیاز به اجازه" /></a>
</p>

<p align="center">
  <a href="README.fa.md">معرفی</a> ·
  <a href="QUICKSTART.fa.md">شروع سریع</a> ·
  <a href="CONTRIBUTING.fa.md">مشارکت</a> ·
  <a href="CONTRIBUTORS.fa.md">مشارکت کنندگان</a> ·
  <a href="FAQ.fa.md">سوالات متداول</a>
</p>

---

## Language

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja-JP.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [हिन्दी](README.hi.md) · [Nederlands](README.nl.md) · [Italiano](README.it.md)

---

## Yggdrasil چیست؟

**Yggdrasil مجموعهٔ برنامه و ابزارهاست؛ Ratatoskr پیکربندی اصلی آن است.** Yggdrasil ابزار ساخت پیکربندی، تجزیهٔ الگو، تولید YAML و تحویل اشتراک را فراهم می کند. Ratatoskr قوانین مسیریابی، فهرست مناطق، فیلترهای نود و گروه های پراکسی را تعریف می کند.

ابزار ساخت پیکربندی، فهرست و قوانین را از الگوی Ratatoskr می خواند و نودها و استراتژی های خروجی انتخاب شده توسط کاربر را به یک YAML شخصی ترکیب می کند. بدین ترتیب الگو هم به عنوان یک پیکربندی پایهٔ آمادهٔ استفاده عمل می کند و هم به عنوان منبع دادهٔ مشترک برای فهرست و ابزار ساخت.

```text
Subscription / node file → Config Builder → Ratatoskr template → Personal Mihomo YAML
```

**Yggdrasil سازماندهی، تولید و تحویل را بر عهده دارد؛ Ratatoskr پیکربندی است که به دست کاربر می رسد.**

## ویژگی های کلیدی

- **مسدودسازی تبلیغات در سطح دسکتاپ.** شامل اشتراک قوانین دسکتاپ AdGuard Windows با حدود ۳۱۶٬۰۰۰ دامنهٔ مسدودشده، که از上游 رسمی پیروی کرده و با به روزرسانی تنبل و تنها هنگام تغییر،واکشی می شود.
- **مسیریابی سبک مبتنی بر Geo.** GeoSite و GeoIP حامل داده های طبقه بندی هستند؛ پیکربندی اصلی حدود ۲۸ کیلوبایت است و هدف مسیریابی آن شفاف و قابل خواندن است.
- **پنج استراتژی خروجی.** انتخاب دستی، URL-test، failover، متعادل سازی بار با هش یکنواخت و متعادل سازی بار دانلود به صورت چرخشی.
- **فهرست برنامه و منطقه.** گروه های پراکسی برای ChatGPT، Claude، Telegram، Spotify، Steam و موارد دیگر؛ گروه های منطقه ای برای هنگ کنگ، تایوان، ژاپن، کره، سنگاپور و ایالات متحده، همراه با آیکون های اختصاصی.
- **تحویل خودکار.** بدنهٔ قوانین تنها زمانی واکشی می شود که محتوا تغییر کند — مصرف منبع کم و خروجی قطعی. نسخه های منتشرشده یک پیوند دانلود ثابت و جمع آوری SHA-256 ارائه می دهند.

## انتخاب یک پیکربندی

پیکربندی اصلی را از [Releases](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml) دانلود کنید یا از [ratatoskr-template.yaml](../../resources/template/ratatoskr-template.yaml) موجود در مخزن استفاده کنید.

| نیاز | نقطهٔ ورود |
| :--- | :--- |
| پیکربندی اصلی روزمره | پیوند ثابت Release / الگوی مخزن |
| تولید پیکربندی شخصی به صورت بصری | [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) |
| مستندات کامل | [شروع سریع](QUICKSTART.fa.md) |

## مجوز و بازخورد

**All Rights Reserved · نیاز به اجازهٔ کتبی قبلی.** استفاده، اجرا، اصلاح، توزیع مجدد، استقرار عمومی و استفادهٔ تجاری از مطالب اصلی مستلزم کسب اجازهٔ کتبی قبلی از صاحب حق است؛ استفادهٔ شخصی و غیرتجاری نیز شامل می شود. شرایط کامل را در [LICENSE](../../LICENSE) ببینید. مطالب Third-party تابع مجوزهای مربوط به خود هستند.

مشکلات را از طریق [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues) گزارش دهید یا درخواست اجازه کنید. لطفاً توکن های اشتراک و اعتبارنامه های نود را از گزارش ها حذف کنید.

---

<p align="center"><sub>Yggdrasil × Ratatoskr · ابزار پیکربندی و الگوی هسته در کنار یکدیگر کار می کنند.</sub></p>
