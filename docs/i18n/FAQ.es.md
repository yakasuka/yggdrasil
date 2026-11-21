# Preguntas frecuentes

<p align="center">
  <a href="README.es.md">Introducción</a> ·
  <a href="QUICKSTART.es.md">Inicio rápido</a> ·
  <a href="CONTRIBUTING.es.md">Contribuir</a> ·
  <a href="CONTRIBUTORS.es.md">Colaboradores</a> ·
  <a href="FAQ.es.md">Preguntas frecuentes</a>
</p>

---

## ¿Por qué la configuración es tan pequeña si cubre muchos servicios?

Ratatoskr referencia categorías de datos Geo; los datos concretos de dominios e IP los contiene la base de datos. La configuración conserva solo las referencias de categoría, el orden de coincidencia y la orquestación de salidas. El cliente debe cargar y actualizar la base de datos Geo por separado.

## ¿Puedo usar un mismo YAML en todos los clientes?

La configuración está orientada a Mihomo. El cliente debe admitir la sintaxis correspondiente e incluir las categorías Geo referenciadas. Funciones de captura de red como DNS, TUN y otras dependen de la plantilla elegida y del entorno del dispositivo.

## ¿El mantenimiento requiere reescribir toda la configuración cada vez?

Las categorías Geo, las fuentes de reglas suplementarias, las suscripciones de nodos y las estrategias de salida se mantienen por separado. Actualiza los datos mediante el mecanismo del cliente y ajusta las reglas o grupos proxy correspondientes solo cuando sea necesario; los nombres de categoría y las referencias deben seguir siendo válidos.

## ¿Cómo se actualizan las reglas de bloqueo de anuncios?

GitHub Actions sondea diariamente el upstream oficial de AdGuard y descarga las actualizaciones solo cuando cambia el contenido, siguiendo un enfoque de actualización diferida y bajo consumo de recursos.

## ¿Qué relación hay entre el Config Builder y la configuración principal?

El Config Builder (la aplicación Yggdrasil) lee las definiciones de aplicaciones, regiones y estrategias de la plantilla Ratatoskr y ensambla una configuración personal a partir de tus selecciones en la web. Uno organiza y genera; el otro define el enrutamiento real y las estrategias de nodos.

## ¿Es gratuito? ¿Se necesita permiso?

El proyecto utiliza una licencia **All Rights Reserved**. El uso, la ejecución, la modificación, la redistribución, el despliegue público y el uso comercial de los materiales originales requieren permiso por escrito previo del titular de los derechos; esto incluye el uso personal y no comercial. Consulta los términos completos en [LICENSE](../../LICENSE). Solicita permiso a través de [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues).
