<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Logotipo del proyecto Yggdrasil" />
</p>

<h1 align="center">Inicio rápido</h1>

<p align="center">
  <a href="README.es.md">Introducción</a> ·
  <a href="QUICKSTART.es.md">Inicio rápido</a> ·
  <a href="CONTRIBUTING.es.md">Contribuir</a> ·
  <a href="CONTRIBUTORS.es.md">Colaboradores</a> ·
  <a href="FAQ.es.md">Preguntas frecuentes</a>
</p>

---

## Antes de empezar

El proyecto utiliza una licencia **All Rights Reserved**. Obtén el permiso por escrito previo del titular de los derechos correspondientes antes de usar, ejecutar, modificar, redistribuir, desplegar públicamente o utilizar con fines comerciales los materiales originales del proyecto. Consulta [LICENSE](../../LICENSE).

## Recomendado: Config Builder

Abre el [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) y sigue cinco pasos:

1. **Fuente de suscripción.** Introduce el nombre del proveedor y una suscripción YAML, Base64 o de enlaces de nodos comunes; se analizan los nodos y la información de tráfico informada por el proveedor.
2. **Nodos por región.** Solo se muestran las regiones realmente presentes en la suscripción; elige qué nodos conservar.
3. **Estrategias de nodos.** Conserva las estrategias automáticas que necesites; la salida predeterminada es la selección manual.
4. **Enrutamiento de aplicaciones.** Todas las aplicaciones están habilitadas y se proxyan por defecto. Asigna a cada aplicación una región conservada, Direct o Reject según sea necesario.
5. **Confirmación final.** Previsualiza la configuración, descarga `name-ratatoskr.yaml` o genera un enlace de suscripción persistente.

Las suscripciones aceptan YAML, Base64 y enlaces de nodos comunes. Los datos de tráfico provienen del `Subscription-Userinfo` del proveedor. Las comprobaciones de retardo opcionales miden el tiempo de establecimiento de la conexión TCP, no el ping ICMP ni la latencia completa del proxy.

## Manual: usar la plantilla directamente

1. Descarga [ratatoskr-template.yaml](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml).
2. Mantén tus propios `proxy-providers` / `proxies` con los nodos de la suscripción.
3. Asegúrate de que el cliente disponga de los datos de GeoSite / GeoIP referenciados.
4. Importa en un cliente compatible con Mihomo, selecciona una salida por aplicación o región y vuelve a ejecutar las pruebas de retardo.

## Puertos

| Configuración | HTTP | SOCKS5 |
| :--- | :--- | :--- |
| Plantilla manual | `7890` | `7891` |
| Salida del Config Builder | `7890` | `7890` |

El Config Builder usa un puerto mixto y permite personalizarlo. Mantén las URL de suscripción personales, las credenciales de nodos y los tokens de acceso en un flujo local o privado.

## Despliegue

El Config Builder y el servicio de suscripción se despliegan juntos en Cloudflare Pages. Consulta la [guía de despliegue](../../config-builder/docs/DEPLOYMENT.md) y el [mapa de implementación](../../config-builder/docs/IMPLEMENTATION.md).

---

<p align="center"><sub>Yggdrasil × Ratatoskr · la herramienta de configuración y la plantilla central.</sub></p>
