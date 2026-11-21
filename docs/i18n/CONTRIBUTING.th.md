# การมีส่วนร่วม

<p align="center">
  <a href="README.th.md">บทนำ</a> ·
  <a href="QUICKSTART.th.md">เริ่มต้นอย่างรวดเร็ว</a> ·
  <a href="CONTRIBUTING.th.md">การมีส่วนร่วม</a> ·
  <a href="CONTRIBUTORS.th.md">ผู้มีส่วนร่วม</a> ·
  <a href="FAQ.th.md">คำถามที่พบบ่อย</a>
</p>

---

## ช่องทางการมีส่วนร่วม

ยินดีรับการรายงานปัญหา, การขออนุญาต หรือข้อเสนอแนะผ่าน Issues เมื่อรายงานปัญหา กรุณาระบุเวอร์ชันของไคลเอนต์และคอร์, การกำหนดค่าที่ใช้ และผลลัพธ์การกำหนดเส้นทางที่คาดหวัง — พร้อมลบโทเค็นการสมัครสมาชิกและข้อมูลรับรองโหนดออกด้วย

## คำสั่งสำหรับการพัฒนา

ส่วนหน้าของ Config Builder และคอมไพเลอร์แม่แบบที่ใช้ร่วมกันอยู่ใน `config-builder/`:

```sh
npm --prefix config-builder ci
npm --prefix config-builder run build
npm --prefix config-builder test
npm --prefix config-builder run service:dev
```

บริการภายในเครื่องทำงานที่ `http://localhost:8788/config-builder/`

## โครงสร้างที่เก็บโค้ด

| พาธ | หน้าที่ |
| :--- | :--- |
| `resources/template/` | แม่แบบการกำหนดค่าหลัก |
| `resources/rules/` | ข้อมูลกฎ จัดกลุ่มตามแหล่งที่มา (adguard / aethersailor / download) |
| `config-builder/` | ส่วนหน้า Config Builder, คอมไพเลอร์ที่ใช้ร่วมกัน, บริการสมัครสมาชิก |
| `scripts/rules/` | สคริปต์ดาวน์โหลดและซิงก์กฎ (อัปเดตแบบ lazy) |
| `scripts/endpoints/` | จุดเชื่อมต่อเก่า `/merge` และ `/sub` |
| `docs/i18n/` | เอกสาร wiki หลายภาษา |

## เพิ่มแอปหรือภูมิภาค

แก้ไขแคตตาล็อกแบบคงที่ที่ [catalog.json](../../config-builder/shared/catalog.json) หลังสร้างใหม่แล้ว แคตตาล็อกในหน้าเว็บและแม่แบบฝั่งหลังบ้านจะอัปเดตตามกัน ดูไหลของข้อมูลทั้งหมดได้ที่ [แผนภาพการทำงาน](../../config-builder/docs/IMPLEMENTATION.md)

## การอัปเดตกฎ

สคริปต์กฎทำงานตามหลักการอัปเดตแบบ lazy: การตรวจสอบเงื่อนไข ETag / Last-Modified จะดาวน์โหลดเนื้อหาเฉพาะเมื่อมีการเปลี่ยนแปลงเท่านั้น มีสองเวิร์กโฟลว์ GitHub Actions ที่จัดการกฎเดสก์ท็อป AdGuard และการซิงก์กฎ Aethersailor ตามลำดับ ดู [คู่มือการติดตั้งใช้งาน](../../config-builder/docs/DEPLOYMENT.md)

## เอกสาร

เอกสารหลายภาษาอยู่ใน `docs/i18n/` แต่ละภาษามีห้าบท ได้แก่ README, QUICKSTART, CONTRIBUTING, CONTRIBUTORS และ FAQ เมื่อเพิ่มภาษาใหม่ ให้คัดลอกชุดหนึ่งทั้งชุดแล้วเปลี่ยนชื่อตามรหัสภาษาดังนี้:

```text
README.<language-code>.md
QUICKSTART.<language-code>.md
CONTRIBUTING.<language-code>.md
CONTRIBUTORS.<language-code>.md
FAQ.<language-code>.md
```

รหัสภาษาเป็นไปตามมาตรฐาน BCP 47 เช่น `zh-CN`, `en`, `pt-BR`
