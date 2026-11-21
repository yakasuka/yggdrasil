<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Logotipo del proyecto Yggdrasil" />
</p>

<h1 align="center">Yggdrasil</h1>

<p align="center">
  Herramientas de configuración y suscripción para Mihomo · Basadas en la plantilla Ratatoskr
</p>

<p align="center">
  <a href="https://wiki.metacubex.one/"><img src="https://img.shields.io/badge/Core-Mihomo-3282B8?style=flat-square" alt="Núcleo: Mihomo" /></a>
  <a href="https://github.com/yakasuka/yggdrasil/releases/latest"><img src="https://img.shields.io/badge/Release-v1.0.0-537A5A?style=flat-square" alt="Última versión" /></a>
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/License-Permission_Required-C4A25A?style=flat-square" alt="Se requiere permiso" /></a>
</p>

<p align="center">
  <a href="README.es.md">Introducción</a> ·
  <a href="QUICKSTART.es.md">Inicio rápido</a> ·
  <a href="CONTRIBUTING.es.md">Contribuir</a> ·
  <a href="CONTRIBUTORS.es.md">Colaboradores</a> ·
  <a href="FAQ.es.md">Preguntas frecuentes</a>
</p>

---

## Language

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja-JP.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [हिन्दी](README.hi.md) · [Nederlands](README.nl.md) · [Italiano](README.it.md)

---

## Qué es

**Yggdrasil es la aplicación y el conjunto de herramientas; Ratatoskr es su configuración central.** Yggdrasil ofrece el Config Builder, el análisis de plantillas, la generación de YAML y la entrega de suscripciones. Ratatoskr define las reglas de enrutamiento, el catálogo de regiones, los filtros de nodos y los grupos proxy.

El Config Builder lee el catálogo y las reglas de la plantilla Ratatoskr y combina los nodos y las estrategias de salida seleccionados en un YAML personal. Así, la plantilla sirve tanto como base de configuración lista para usar como fuente de datos compartida por el catálogo y el generador.

```text
Subscription / node file → Config Builder → Ratatoskr template → Personal Mihomo YAML
```

**Yggdrasil organiza, genera y entrega; Ratatoskr es la configuración que llega al usuario.**

## Características principales

- **Bloqueo de anuncios de nivel de escritorio.** Incluye la suscripción de reglas de escritorio de AdGuard para Windows, con unos 316.000 dominios bloqueados, siguiendo el upstream oficial con actualizaciones diferidas y solo cuando hay cambios.
- **Enrutamiento ligero basado en Geo.** GeoSite y GeoIP contienen los datos de clasificación; la configuración principal ocupa unos 28 KB y mantiene intenciones de enrutamiento claras y legibles.
- **Cinco estrategias de salida.** Selección manual, URL-test, failover, balanceo de carga por hash consistente y balanceo de descargas por turnos (round-robin).
- **Catálogo de aplicaciones y regiones.** Grupos proxy para ChatGPT, Claude, Telegram, Spotify, Steam y más; grupos regionales para Hong Kong, Taiwán, Japón, Corea, Singapur y EE. UU., con iconos dedicados.
- **Entrega automatizada.** Los cuerpos de las reglas se descargan solo cuando cambia el contenido: bajo consumo de recursos y salida determinista. Las Release ofrecen un enlace de descarga fijo y una suma de verificación SHA-256.

## Elegir una configuración

Descarga la configuración principal desde [Releases](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml) o usa [ratatoskr-template.yaml](../../resources/template/ratatoskr-template.yaml) en el repositorio.

| Necesidad | Punto de entrada |
| :--- | :--- |
| Configuración principal para el día a día | Enlace fijo de Release / plantilla del repositorio |
| Generar una configuración personal visualmente | [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) |
| Documentación completa | [Inicio rápido](QUICKSTART.es.md) |

## Licencia y comentarios

**Todos los derechos reservados · Se requiere permiso por escrito.** El uso, la ejecución, la modificación, la redistribución, el despliegue público y el uso comercial de los materiales originales requieren el permiso por escrito previo del titular de los derechos; esto incluye el uso personal y no comercial. Consulta los términos completos en [LICENSE](../../LICENSE). Los materiales de terceros siguen sujetos a sus propias licencias.

Informa de problemas o solicita permiso a través de [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues). Elimina los tokens de suscripción y las credenciales de nodos de tus informes.

---

<p align="center"><sub>Yggdrasil × Ratatoskr · la herramienta de configuración y la plantilla central trabajan juntas.</sub></p>
