# Contribuir

<p align="center">
  <a href="README.es.md">Introducción</a> ·
  <a href="QUICKSTART.es.md">Inicio rápido</a> ·
  <a href="CONTRIBUTING.es.md">Contribuir</a> ·
  <a href="CONTRIBUTORS.es.md">Colaboradores</a> ·
  <a href="FAQ.es.md">Preguntas frecuentes</a>
</p>

---

## Formas de contribuir

Los Issues son bienvenidos para informar de errores, solicitar permisos y enviar sugerencias. Incluye las versiones de tu cliente y del núcleo, la configuración en uso y el resultado de enrutamiento esperado, y elimina los tokens de suscripción y las credenciales de nodos.

## Comandos de desarrollo

El frontend del Config Builder y el compilador de plantillas compartido están en `config-builder/`:

```sh
npm --prefix config-builder ci
npm --prefix config-builder run build
npm --prefix config-builder test
npm --prefix config-builder run service:dev
```

El servicio local se ejecuta en `http://localhost:8788/config-builder/`.

## Estructura del repositorio

| Ruta | Función |
| :--- | :--- |
| `resources/template/` | Plantilla de configuración central |
| `resources/rules/` | Datos de reglas, agrupados por fuente (adguard / aethersailor / download) |
| `config-builder/` | Frontend del Config Builder, compilador compartido y servicio de suscripción |
| `scripts/rules/` | Scripts de obtención y sincronización de reglas (actualizaciones diferidas) |
| `scripts/endpoints/` | Endpoints heredados `/merge` y `/sub` |
| `docs/i18n/` | Documentación wiki multilingüe |

## Añadir una aplicación o región

Edita el catálogo estático en [catalog.json](../../config-builder/shared/catalog.json). Tras una nueva compilación, el catálogo de la página y la plantilla del backend se actualizan en consecuencia. Consulta el [mapa de implementación](../../config-builder/docs/IMPLEMENTATION.md) para ver el flujo de datos completo.

## Actualización de reglas

Los scripts de reglas siguen un principio de actualización diferida: las sondas condicionales ETag / Last-Modified descargan el cuerpo solo cuando cambia el contenido. Dos flujos de trabajo de GitHub Actions gestionan respectivamente las reglas de escritorio de AdGuard y la sincronización de reglas de Aethersailor. Consulta la [guía de despliegue](../../config-builder/docs/DEPLOYMENT.md).

## Documentación

La documentación multilingüe está en `docs/i18n/`. Cada idioma incluye cinco capítulos: README, QUICKSTART, CONTRIBUTING, CONTRIBUTORS y FAQ. Para añadir un idioma, copia un conjunto completo y renómbralo con el código de idioma:

```text
README.<language-code>.md
QUICKSTART.<language-code>.md
CONTRIBUTING.<language-code>.md
CONTRIBUTORS.<language-code>.md
FAQ.<language-code>.md
```

Los códigos de idioma siguen la norma BCP 47, p. ej. `zh-CN`, `en`, `pt-BR`.
