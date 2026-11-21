<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Yggdrasil प्रोजेक्ट लोगो" />
</p>

<h1 align="center">Yggdrasil</h1>

<p align="center">
  Mihomo कॉन्फ़िगरेशन और सदस्यता टूल · Ratatoskr टेम्पलेट पर आधारित
</p>

<p align="center">
  <a href="https://wiki.metacubex.one/"><img src="https://img.shields.io/badge/Core-Mihomo-3282B8?style=flat-square" alt="कोर: Mihomo" /></a>
  <a href="https://github.com/yakasuka/yggdrasil/releases/latest"><img src="https://img.shields.io/badge/Release-v1.0.0-537A5A?style=flat-square" alt="नवीनतम रिलीज़" /></a>
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/License-Permission_Required-C4A25A?style=flat-square" alt="अनुमति आवश्यक" /></a>
</p>

<p align="center">
  <a href="README.hi.md">परिचय</a> ·
  <a href="QUICKSTART.hi.md">त्वरित शुरुआत</a> ·
  <a href="CONTRIBUTING.hi.md">योगदान</a> ·
  <a href="CONTRIBUTORS.hi.md">योगदानकर्ता</a> ·
  <a href="FAQ.hi.md">सामान्य प्रश्न</a>
</p>

---

## Language

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja-JP.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [हिन्दी](README.hi.md) · [Nederlands](README.nl.md) · [Italiano](README.it.md)

---

## यह क्या है

**Yggdrasil ऐप्लिकेशन और टूलिंग है; Ratatoskr इसका मुख्य कॉन्फ़िगरेशन है।** Yggdrasil कॉन्फ़िग बिल्डर, टेम्पलेट पार्सिंग, YAML जेनरेशन और सदस्यता डिलीवरी प्रदान करता है। Ratatoskr रूटिंग नियम, क्षेत्र कैटलॉग, नोड फ़िल्टर और प्रॉक्सी ग्रुप परिभाषित करता है।

बिल्डर Ratatoskr टेम्पलेट से कैटलॉग और नियम पढ़ता है, चुने गए नोड्स और आउटबाउंड रणनीतियों को एक व्यक्तिगत YAML में जोड़ता है। इस प्रकार टेम्पलेट तैयार कॉन्फ़िगरेशन आधार और कैटलॉग व बिल्डर दोनों के लिए साझा डेटा स्रोत के रूप में काम करता है।

```text
Subscription / node file → Config Builder → Ratatoskr template → Personal Mihomo YAML
```

**Yggdrasil व्यवस्थित करता है, बनाता है और पहुँचाता है; Ratatoskr वह कॉन्फ़िगरेशन है जो उपयोगकर्ता तक पहुँचता है।**

## मुख्य विशेषताएँ

- **डेस्कटॉप-स्तर का विज्ञापन ब्लॉकिंग।** AdGuard Windows डेस्कटॉप नियम सदस्यता शामिल है, जिसमें लगभग 316,000 ब्लॉक किए गए डोमेन हैं; यह आधिकारिक अपस्ट्रीम का पालन करता है और सामग्री बदलने पर ही अपडेट होता है।
- **Geo-आधारित हल्का रूटिंग।** GeoSite और GeoIP वर्गीकरण डेटा रखते हैं; मुख्य कॉन्फ़िगरेशन लगभग 28 KB है और इसका रूटिंग उद्देश्य स्पष्ट है।
- **पाँच आउटबाउंड रणनीतियाँ।** मैनुअल चयन, URL-test, failover, consistent-hashing लोड बैलेंसिंग, और round-robin डाउनलोड बैलेंसिंग।
- **ऐप और क्षेत्र कैटलॉग।** ChatGPT, Claude, Telegram, Spotify, Steam आदि के लिए प्रॉक्सी ग्रुप; हांगकांग, ताइवान, जापान, कोरिया, सिंगापुर और अमेरिका के लिए क्षेत्र ग्रुप, साथ ही विशेष आइकन।
- **स्वचालित डिलीवरी।** नियम बॉडी केवल तब प्राप्त की जाती है जब सामग्री बदलती है — कम संसाधन उपयोग और निश्चित आउटपुट। रिलीज़ में स्थिर डाउनलोड लिंक और SHA-256 चेकसम मिलता है।

## कॉन्फ़िगरेशन चुनें

मुख्य कॉन्फ़िगरेशन [Releases](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml) से डाउनलोड करें या रिपॉज़िटरी में [ratatoskr-template.yaml](../../resources/template/ratatoskr-template.yaml) का उपयोग करें।

| आवश्यकता | प्रवेश बिंदु |
| :--- | :--- |
| रोज़मर्रा का मुख्य कॉन्फ़िगरेशन | रिलीज़ का स्थिर लिंक / रिपॉज़िटरी टेम्पलेट |
| दृश्य रूप से व्यक्तिगत कॉन्फ़िगरेशन बनाएँ | [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) |
| पूरा दस्तावेज़ीकरण | [त्वरित शुरुआत](QUICKSTART.hi.md) |

## लाइसेंस और फ़ीडबैक

**All Rights Reserved · पहले लिखित अनुमति आवश्यक।** मूल सामग्री का उपयोग, संचालन, संशोधन, पुनर्वितरण, सार्वजनिक तैनाती और वाणिज्यिक उपयोग के लिए अधिकार धारक की पूर्व लिखित अनुमति आवश्यक है; व्यक्तिगत और गैर-वाणिज्यिक उपयोग भी शामिल है। पूरा विवरण [LICENSE](../../LICENSE) में देखें। तृतीय-पक्ष सामग्री अपने लाइसेंस के अंतर्गत रहती है।

[GitHub Issues](https://github.com/yakasuka/yggdrasil/issues) के माध्यम से समस्याएँ बताएँ या अनुमति मांगें। रिपोर्ट में सदस्यता टोकन और नोड क्रेडेंशियल हटा दें।

---

<p align="center"><sub>Yggdrasil × Ratatoskr · कॉन्फ़िगरेशन टूल और कोर टेम्पलेट साथ मिलकर काम करते हैं।</sub></p>
