# المساهمة

<p align="center">
  <a href="README.ar.md">مقدمة</a> ·
  <a href="QUICKSTART.ar.md">البداية السريعة</a> ·
  <a href="CONTRIBUTING.ar.md">المساهمة</a> ·
  <a href="CONTRIBUTORS.ar.md">المساهمون</a> ·
  <a href="FAQ.ar.md">الأسئلة الشائعة</a>
</p>

---

## طرق المساهمة

الإصدارات (Issues) موصى بها للإبلاغ عن الأخطاء وطلب الإذن وتقديم الاقتراحات. أرفق إصداري العميل والنواة، والتهيئة المستخدمة، ونتيجة التوجيه المتوقعة — واحذف رموز الاشتراك وبيانات اعتماد العُقد.

## أوامر التطوير

واجهة Config Builder الأمامية ومُجمّع القوالب المشترك موجودان في `config-builder/`:

```sh
npm --prefix config-builder ci
npm --prefix config-builder run build
npm --prefix config-builder test
npm --prefix config-builder run service:dev
```

تعمل الخدمة المحلية على العنوان `http://localhost:8788/config-builder/`.

## بنية المستودع

| المسار | الغرض |
| :--- | :--- |
| `resources/template/` | قالب التهيئة الأساسي |
| `resources/rules/` | بيانات القواعد، مصنّفة حسب المصدر (adguard / aethersailor / download) |
| `config-builder/` | واجهة Config Builder الأمامية، والمُجمّع المشترك، وخدمة الاشتراك |
| `scripts/rules/` | سكربتات جلب القواعد ومزامنتها (تحديثات مؤجلة) |
| `scripts/endpoints/` | نقاط النهاية القديمة `/merge` و`/sub` |
| `docs/i18n/` | وثائق الويكي متعددة اللغات |

## إضافة تطبيق أو منطقة

عدّل الدليل الثابت [catalog.json](../../config-builder/shared/catalog.json). بعد إعادة البناء، سيتم تحديث دليل الصفحة وقالب الخلفية وفقًا لذلك. راجع [خريطة التنفيذ](../../config-builder/docs/IMPLEMENTATION.md) لمعرفة مسار البيانات الكامل.

## تحديث القواعد

تعمل سكربتات القواعد وفق مبدأ التحديث المؤجل: تتحقق طلبات ETag / Last-Modified الشرطية من المحتوى ولا تجلب الجسم إلا عند تغيّره. يتولى سيرا عمل منفصلان في GitHub Actions مهمة قواعد سطح المكتب من AdGuard ومهمة مزامنة قواعد Aethersailor على التوالي. راجع [دليل النشر](../../config-builder/docs/DEPLOYMENT.md).

## الوثائق

الوثائق متعددة اللغات موجودة في `docs/i18n/`. تحتوي كل لغة على خمسة فصول: README وQUICKSTART وCONTRIBUTING وCONTRIBUTORS وFAQ. لإضافة لغة، انسخ مجموعة كاملة وأعد تسمية الملفات برمز اللغة:

```text
README.<language-code>.md
QUICKSTART.<language-code>.md
CONTRIBUTING.<language-code>.md
CONTRIBUTORS.<language-code>.md
FAQ.<language-code>.md
```

تتبع رموز اللغات معيار BCP 47، مثل `zh-CN` و`en` و`pt-BR`.
