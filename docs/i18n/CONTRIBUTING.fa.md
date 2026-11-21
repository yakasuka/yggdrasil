# مشارکت

<p align="center">
  <a href="README.fa.md">معرفی</a> ·
  <a href="QUICKSTART.fa.md">شروع سریع</a> ·
  <a href="CONTRIBUTING.fa.md">مشارکت</a> ·
  <a href="CONTRIBUTORS.fa.md">مشارکت کنندگان</a> ·
  <a href="FAQ.fa.md">سوالات متداول</a>
</p>

---

## روش های مشارکت

از طریق Issues برای گزارش اشکال، درخواست اجازه یا ارائهٔ پیشنهادها خوش آمدید. هنگام ثبت مشکل، نسخهٔ کلاینت و هسته، پیکربندی مورد استفاده و نتیجهٔ مورد انتظار مسیریابی را ذکر کنید — و توکن های اشتراک و اعتبارنامه های نود را حذف نمایید.

## دستورات توسعه

رابط کاربری Config Builder و کامپایلر الگوی مشترک در `config-builder/` قرار دارند:

```sh
npm --prefix config-builder ci
npm --prefix config-builder run build
npm --prefix config-builder test
npm --prefix config-builder run service:dev
```

سرویس محلی در آدرس `http://localhost:8788/config-builder/` اجرا می شود.

## ساختار مخزن

| مسیر | وظیفه |
| :--- | :--- |
| `resources/template/` | الگوی پیکربندی هسته |
| `resources/rules/` | داده های قوانین، گروه بندی شده بر اساس منبع (adguard / aethersailor / download) |
| `config-builder/` | رابط Config Builder، کامپایلر مشترک، سرویس اشتراک |
| `scripts/rules/` | اسکریپت های واکشی و همگام سازی قوانین (به روزرسانی تنبل) |
| `scripts/endpoints/` | رابط های قدیمی `/merge` و `/sub` |
| `docs/i18n/` | مستندات ویکی چندزبانه |

## اضافه کردن یک برنامه یا منطقه

فهرست ایستا [catalog.json](../../config-builder/shared/catalog.json) را ویرایش کنید. پس از بازسازی، فهرست صفحه و الگوی باطنی به طور متناظر به روز می شوند. جریان کامل داده را در [نقشهٔ پیاده سازی](../../config-builder/docs/IMPLEMENTATION.md) ببینید.

## به روزرسانی قوانین

اسکریپت های قوانین از اصل به روزرسانی تنبل پیروی می کنند: کاوش های شرطی ETag / Last-Modified تنها زمانی بدنه را واکشی می کنند که محتوا تغییر کرده باشد. دو گردش کاری GitHub Actions به ترتیب قوانین دسکتاپ AdGuard و همگام سازی قوانین Aethersailor را مدیریت می کنند. [راهنمای استقرار](../../config-builder/docs/DEPLOYMENT.md) را ببینید.

## مستندات

مستندات چندزبانه در `docs/i18n/` قرار دارند. هر زبان دارای پنج فصل است: README، QUICKSTART، CONTRIBUTING، CONTRIBUTORS و FAQ. برای اضافه کردن زبانی جدید، یک مجموعهٔ کامل را کپی کرده و مطابق زیر با کد زبان تغییر نام دهید:

```text
README.<language-code>.md
QUICKSTART.<language-code>.md
CONTRIBUTING.<language-code>.md
CONTRIBUTORS.<language-code>.md
FAQ.<language-code>.md
```

کدهای زبان از استاندارد BCP 47 پیروی می کنند، مانند `zh-CN`، `en`، `pt-BR`.
