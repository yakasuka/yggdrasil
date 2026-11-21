<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="สัญลักษณ์โปรเจกต์ Yggdrasil" />
</p>

<h1 align="center">Yggdrasil</h1>

<p align="center">
  เครื่องมือกำหนดค่าและสมัครสมาชิก Mihomo · สร้างขึ้นบนแม่แบบ Ratatoskr
</p>

<p align="center">
  <a href="https://wiki.metacubex.one/"><img src="https://img.shields.io/badge/Core-Mihomo-3282B8?style=flat-square" alt="คอร์: Mihomo" /></a>
  <a href="https://github.com/yakasuka/yggdrasil/releases/latest"><img src="https://img.shields.io/badge/Release-v1.0.0-537A5A?style=flat-square" alt="เวอร์ชันล่าสุด" /></a>
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/License-Permission_Required-C4A25A?style=flat-square" alt="ต้องได้รับอนุญาต" /></a>
</p>

<p align="center">
  <a href="README.th.md">บทนำ</a> ·
  <a href="QUICKSTART.th.md">เริ่มต้นอย่างรวดเร็ว</a> ·
  <a href="CONTRIBUTING.th.md">การมีส่วนร่วม</a> ·
  <a href="CONTRIBUTORS.th.md">ผู้มีส่วนร่วม</a> ·
  <a href="FAQ.th.md">คำถามที่พบบ่อย</a>
</p>

---

## Language

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja-JP.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [हिन्दी](README.hi.md) · [Nederlands](README.nl.md) · [Italiano](README.it.md)

---

## Yggdrasil คืออะไร?

**Yggdrasil คือชุดแอปพลิเคชันและเครื่องมือ ส่วน Ratatoskr คือการกำหนดค่าหลักของมัน** Yggdrasil มี Config Builder, การแยกวิเคราะห์แม่แบบ, การสร้าง YAML และการส่งมอบการสมัครสมาชิก Ratatoskr กำหนดกฎการกำหนดเส้นทาง, แคตตาล็อกภูมิภาค, ตัวกรองโหนด และกลุ่ม proxy

Config Builder อ่านแคตตาล็อกและกฎจากแม่แบบ Ratatoskr แล้วรวมโหนดและกลยุทธ์ขาออกที่ผู้ใช้เลือกเข้าด้วยกันเป็น YAML ส่วนบุคคล ดังนั้นแม่แบบจึงทำหน้าที่ทั้งเป็นพื้นฐานการกำหนดค่าที่พร้อมใช้งานและเป็นแหล่งข้อมูลร่วมสำหรับแคตตาล็อกและ builder

```text
Subscription / node file → Config Builder → Ratatoskr template → Personal Mihomo YAML
```

**Yggdrasil จัดระเบียบ สร้าง และส่งมอบ ส่วน Ratatoskr คือการกำหนดค่าที่ถึงมือผู้ใช้**

## ฟีเจอร์หลัก

- **การบล็อกโฆษณาระดับเดสก์ท็อป.** รวมการสมัครสมาชิกกฎเดสก์ท็อป AdGuard Windows ที่มีโดเมนถูกบล็อกประมาณ 316,000 รายการ ติดตามต้นทางอย่างเป็นทางการและอัปเดตแบบ lazy เฉพาะเมื่อมีการเปลี่ยนแปลง
- **การกำหนดเส้นทางน้ำหนักเบาด้วย Geo.** GeoSite และ GeoIP เป็นตัวเก็บข้อมูลจัดหมวดหมู่ การกำหนดค่าหลักมีขนาดประมาณ 28 KB และมีความชัดเจนในการกำหนดเส้นทาง
- **กลยุทธ์ขาออกห้ารูปแบบ.** การเลือกด้วยตนเอง, URL-test, failover, การกระจายโหลดแบบ consistent-hashing และการกระจายโหลดการดาวน์โหลดแบบ round-robin
- **แคตตาล็อกแอปและภูมิภาค.** กลุ่ม proxy สำหรับ ChatGPT, Claude, Telegram, Spotify, Steam และอื่นๆ กลุ่มภูมิภาคสำหรับฮ่องกง, ไต้หวัน, ญี่ปุ่น, เกาหลี, สิงคโปร์ และสหรัฐอเมริกา พร้อมไอคอนเฉพาะ
- **การส่งมอบอัตโนมัติ.** เนื้อหากฎจะถูกดาวน์โหลดเฉพาะเมื่อมีการเปลี่ยนแปลงเท่านั้น — ใช้ทรัพยากรต่ำและผลลัพธ์ที่แน่นอน การเปิดตัวแต่ละครั้งมีลิงก์ดาวน์โหลดคงที่และค่า checksum SHA-256

## เลือกการกำหนดค่า

ดาวน์โหลดการกำหนดค่าหลักจาก [Releases](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml) หรือใช้ [ratatoskr-template.yaml](../../resources/template/ratatoskr-template.yaml) ในที่เก็บโค้ด

| ความต้องการ | จุดเข้า |
| :--- | :--- |
| การกำหนดค่าหลักใช้งานประจำวัน | ลิงก์ Release คงที่ / แม่แบบในที่เก็บ |
| สร้างการกำหนดค่าส่วนบุคคลแบบภาพ | [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) |
| เอกสารฉบับเต็ม | [เริ่มต้นอย่างรวดเร็ว](QUICKSTART.th.md) |

## ใบอนุญาตและข้อเสนอแนะ

**All Rights Reserved · ต้องได้รับอนุญาตเป็นลายลักษณ์อักษรล่วงหน้า** การใช้งาน, การดำเนินการ, การแก้ไข, การแจกจ่ายซ้ำ, การติดตั้งให้สาธารณะ และการใช้งานเชิงพาณิชย์ของเนื้อหาต้นฉบับต้องได้รับอนุญาตเป็นลายลักษณ์อักษรล่วงหน้าจากเจ้าของสิทธิ์ รวมถึงการใช้งานส่วนบุคคลและไม่เชิงพาณิชย์ ดูข้อกำหนดฉบับเต็มได้ที่ [LICENSE](../../LICENSE) เนื้อหาของบุคคลที่สามอยู่ภายใต้ใบอนุญาตของตนเอง

รายงานปัญหาหรือขออนุญาตผ่าน [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues) เมื่อส่งรายงาน กรุณาลบโทเค็นการสมัครสมาชิกและข้อมูลรับรองโหนดออกด้วย

---

<p align="center"><sub>Yggdrasil × Ratatoskr · เครื่องมือกำหนดค่าและแม่แบบคอร์ทำงานร่วมกัน</sub></p>
