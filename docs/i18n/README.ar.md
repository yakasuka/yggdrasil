<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="شعار مشروع Yggdrasil" />
</p>

<h1 align="center">Yggdrasil</h1>

<p align="center">
  أدوات تهيئة واشتراك لـ Mihomo · مبنية حول قالب Ratatoskr
</p>

<p align="center">
  <a href="https://wiki.metacubex.one/"><img src="https://img.shields.io/badge/Core-Mihomo-3282B8?style=flat-square" alt="النواة: Mihomo" /></a>
  <a href="https://github.com/yakasuka/yggdrasil/releases/latest"><img src="https://img.shields.io/badge/Release-v1.0.0-537A5A?style=flat-square" alt="أحدث إصدار" /></a>
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/License-Permission_Required-C4A25A?style=flat-square" alt=" يتطلب إذنًا" /></a>
</p>

<p align="center">
  <a href="README.ar.md">مقدمة</a> ·
  <a href="QUICKSTART.ar.md">البداية السريعة</a> ·
  <a href="CONTRIBUTING.ar.md">المساهمة</a> ·
  <a href="CONTRIBUTORS.ar.md">المساهمون</a> ·
  <a href="FAQ.ar.md">الأسئلة الشائعة</a>
</p>

---

## Language

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja-JP.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [हिन्दी](README.hi.md) · [Nederlands](README.nl.md) · [Italiano](README.it.md)

---

## ما هو المشروع

**Yggdrasil هو التطبيق ومجموعة الأدوات؛ أما Ratatoskr فهو تهيئته الأساسية.** يوفر Yggdrasil أداة Config Builder، وتحليل القوالب، وتوليد YAML، وتسليم الاشتراكات. ويُعرّف Ratatoskr قواعد التوجيه، ودليل المناطق، ومرشحات العُقد، ومجموعات proxy.

تقرأ أداة Config Builder الدليل والقواعد من قالب Ratatoskr، وتدمج العُقد واستراتيجيات الخروج المختارة في ملف YAML شخصي. وبذلك يعمل القالب كأساس تهيئة جاهز للاستخدام وكمصدر بيانات مشترك للدليل والأداة.

```text
Subscription / node file → Config Builder → Ratatoskr template → Personal Mihomo YAML
```

**Yggdrasil ينظّم ويولّد ويسلّم؛ وRatatoskr هو التهيئة التي تصل إلى المستخدم.**

## الميزات الرئيسية

- **حجب إعلانات بمستوى سطح المكتب.** يتضمن اشتراك قواعد سطح المكتب من AdGuard لـ Windows، مع حوالي 316,000 نطاق محجوب، بمتابعة المصدر الرسمي مع تحديثات مؤجلة عند التغيّر فقط.
- **توجيه خفيف قائم على Geo.** تحمل GeoSite وGeoIP بيانات التصنيف؛ التهيئة الرئيسية بحجم حوالي 28 كيلوبايت، مع قصد توجيه واضح وقابل للقراءة.
- **خمس استراتيجيات للخروج.** الاختيار اليدوي، URL-test، failover، موازنة التحميل بتجزئة متسقة، وموازنة التنزيلات بالتناوب (round-robin).
- **دليل التطبيقات والمناطق.** مجموعات proxy لتطبيقات ChatGPT وClaude وTelegram وSpotify وSteam وغيرها؛ ومجموعات إقليمية لهونغ كونغ وتايوان واليابان وكوريا وسنغافورة والولايات المتحدة، مع أيقونات مخصصة.
- **تسليم مؤتمت.** تُجلب أجسام القواعد عند تغيّر المحتوى فقط — استهلاك منخفض للموارد ومخرجات حتمية. توفر الإصدارات رابط تنزيل ثابتًا ومجموع تحقق SHA-256.

## اختيار التهيئة

نزّل التهيئة الرئيسية من [Releases](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml) أو استخدم [ratatoskr-template.yaml](../../resources/template/ratatoskr-template.yaml) في المستودع.

| الحاجة | نقطة الدخول |
| :--- | :--- |
| التهيئة الرئيسية للاستخدام اليومي | رابط Release الثابت / قالب المستودع |
| توليد تهيئة شخصية بصريًا | [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) |
| الوثائق الكاملة | [البداية السريعة](QUICKSTART.ar.md) |

## الترخيص والملاحظات

**جميع الحقوق محفوظة · يلزم إذن كتابي مسبق.** يتطلب استخدام مواد المشروع الأصلية وتشغيلها وتعديلها وإعادة توزيعها ونشرها علنًا واستخدامها تجاريًا الحصول على إذن كتابي مسبق من صاحب الحقوق؛ ويشمل ذلك الاستخدام الشخصي وغير التجاري. راجع الشروط الكاملة في [LICENSE](../../LICENSE). تظل مواد الطرف الثالث خاضعة لتراخيصها الخاصة.

أبلغ عن المشكلات أو اطلب الإذن عبر [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues). احذف رموز الاشتراك وبيانات اعتماد العُقد من بلاغاتك.

---

<p align="center"><sub>Yggdrasil × Ratatoskr · أداة التهيئة والقالب الأساسي يعملان معًا.</sub></p>
