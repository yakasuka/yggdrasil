# योगदान

<p align="center">
  <a href="README.hi.md">परिचय</a> ·
  <a href="QUICKSTART.hi.md">त्वरित शुरुआत</a> ·
  <a href="CONTRIBUTING.hi.md">योगदान</a> ·
  <a href="CONTRIBUTORS.hi.md">योगदानकर्ता</a> ·
  <a href="FAQ.hi.md">सामान्य प्रश्न</a>
</p>

---

## योगदान के तरीके

बग रिपोर्ट, अनुमति अनुरोध और सुझावों के लिए Issues का स्वागत है। क्लाइंट और कोर संस्करण, उपयोग किया गया कॉन्फ़िगरेशन और अपेक्षित रूटिंग परिणाम शामिल करें — और सदस्यता टोकन व नोड क्रेडेंशियल हटा दें।

## डेवलपमेंट कमांड

Config Builder फ्रंट एंड और साझा टेम्पलेट कंपाइलर `config-builder/` में हैं:

```sh
npm --prefix config-builder ci
npm --prefix config-builder run build
npm --prefix config-builder test
npm --prefix config-builder run service:dev
```

स्थानीय सेवा `http://localhost:8788/config-builder/` पर चलती है।

## रिपॉज़िटरी संरचना

| पथ | उद्देश्य |
| :--- | :--- |
| `resources/template/` | मुख्य कॉन्फ़िगरेशन टेम्पलेट |
| `resources/rules/` | स्रोत के अनुसार समूहीकृत नियम डेटा (adguard / aethersailor / download) |
| `config-builder/` | Config Builder फ्रंट एंड, साझा कंपाइलर, सदस्यता सेवा |
| `scripts/rules/` | नियम प्राप्ति और सिंक स्क्रिप्ट (लेज़ी अपडेट) |
| `scripts/endpoints/` | पुराने `/merge` और `/sub` एंडपॉइंट |
| `docs/i18n/` | बहुभाषी विकी दस्तावेज़ीकरण |

## ऐप या क्षेत्र जोड़ना

[catalog.json](../../config-builder/shared/catalog.json) पर स्थिर कैटलॉग संपादित करें। रीबिल्ड के बाद पेज कैटलॉग और बैकएंड टेम्पलेट तदनुसार अपडेट होते हैं। पूरे डेटा फ़्लो के लिए [implementation map](../../config-builder/docs/IMPLEMENTATION.md) देखें।

## नियम अपडेट

नियम स्क्रिप्ट लेज़ी-अपडेट सिद्धांत का पालन करती हैं: ETag / Last-Modified सशर्त जाँच केवल तब बॉडी प्राप्त करती है जब सामग्री बदलती है। दो GitHub Actions वर्कफ़्लो क्रमशः AdGuard डेस्कटॉप नियम और Aethersailor नियम सिंक संभालते हैं। [deployment guide](../../config-builder/docs/DEPLOYMENT.md) देखें।

## दस्तावेज़ीकरण

बहुभाषी दस्तावेज़ `docs/i18n/` में हैं। प्रत्येक भाषा में पाँच अध्याय हैं: README, QUICKSTART, CONTRIBUTING, CONTRIBUTORS और FAQ। नई भाषा जोड़ने के लिए पूरा सेट कॉपी करें और भाषा कोड से नाम बदलें:

```text
README.<language-code>.md
QUICKSTART.<language-code>.md
CONTRIBUTING.<language-code>.md
CONTRIBUTORS.<language-code>.md
FAQ.<language-code>.md
```

भाषा कोड BCP 47 का पालन करते हैं, जैसे `zh-CN`, `en`, `pt-BR`।
