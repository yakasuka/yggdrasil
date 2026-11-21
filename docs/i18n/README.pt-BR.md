<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Logotipo do projeto Yggdrasil" />
</p>

<h1 align="center">Yggdrasil</h1>

<p align="center">
  Ferramentas de configuração e assinatura para Mihomo · Baseadas no template Ratatoskr
</p>

<p align="center">
  <a href="https://wiki.metacubex.one/"><img src="https://img.shields.io/badge/Core-Mihomo-3282B8?style=flat-square" alt="Núcleo: Mihomo" /></a>
  <a href="https://github.com/yakasuka/yggdrasil/releases/latest"><img src="https://img.shields.io/badge/Release-v1.0.0-537A5A?style=flat-square" alt="Última versão" /></a>
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/License-Permission_Required-C4A25A?style=flat-square" alt="Permissão necessária" /></a>
</p>

<p align="center">
  <a href="README.pt-BR.md">Introdução</a> ·
  <a href="QUICKSTART.pt-BR.md">Início rápido</a> ·
  <a href="CONTRIBUTING.pt-BR.md">Contribuindo</a> ·
  <a href="CONTRIBUTORS.pt-BR.md">Colaboradores</a> ·
  <a href="FAQ.pt-BR.md">Perguntas frequentes</a>
</p>

---

## Language

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja-JP.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [Русский](README.ru.md) · [العربية](README.ar.md) · [فارسی](README.fa.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [हिन्दी](README.hi.md) · [Nederlands](README.nl.md) · [Italiano](README.it.md)

---

## O que é

**Yggdrasil é a aplicação e o conjunto de ferramentas; Ratatoskr é sua configuração central.** O Yggdrasil oferece o Config Builder, a análise de templates, a geração de YAML e a entrega de assinaturas. O Ratatoskr define as regras de roteamento, o catálogo de regiões, os filtros de nodes e os grupos proxy.

O Config Builder lê o catálogo e as regras do template Ratatoskr e combina os nodes e as estratégias de saída selecionados em um YAML pessoal. Assim, o template serve tanto como base de configuração pronta para uso quanto como fonte de dados compartilhada pelo catálogo e pelo gerador.

```text
Subscription / node file → Config Builder → Ratatoskr template → Personal Mihomo YAML
```

**O Yggdrasil organiza, gera e entrega; o Ratatoskr é a configuração que chega ao usuário.**

## Recursos principais

- **Bloqueio de anúncios nível desktop.** Inclui a assinatura de regras de desktop do AdGuard para Windows, com cerca de 316.000 domínios bloqueados, seguindo o upstream oficial com atualizações tardias e apenas quando há alterações.
- **Roteamento leve baseado em Geo.** GeoSite e GeoIP contêm os dados de classificação; a configuração principal tem cerca de 28 KB e mantém intenções de roteamento claras e legíveis.
- **Cinco estratégias de saída.** Seleção manual, URL-test, failover, balanceamento de carga por hash consistente e balanceamento de download por turnos (round-robin).
- **Catálogo de aplicativos e regiões.** Grupos proxy para ChatGPT, Claude, Telegram, Spotify, Steam e mais; grupos regionais para Hong Kong, Taiwan, Japão, Coreia, Singapura e EUA, com ícones dedicados.
- **Entrega automatizada.** Os corpos das regras são buscados apenas quando o conteúdo muda: baixo consumo de recursos e saída determinística. Os Releases oferecem um link de download fixo e um soma de verificação SHA-256.

## Escolher uma configuração

Baixe a configuração principal em [Releases](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml) ou use [ratatoskr-template.yaml](../../resources/template/ratatoskr-template.yaml) no repositório.

| Necessidade | Ponto de entrada |
| :--- | :--- |
| Configuração principal do dia a dia | Link fixo do Release / template do repositório |
| Gerar uma configuração pessoal visualmente | [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) |
| Documentação completa | [Início rápido](QUICKSTART.pt-BR.md) |

## Licença e comentários

**Todos os direitos reservados · É necessária permissão por escrito.** O uso, a execução, a modificação, a redistribuição, a implantação pública e o uso comercial dos materiais originais exigem permissão por escrito prévia do titular dos direitos; isso inclui o uso pessoal e não comercial. Consulte os termos completos em [LICENSE](../../LICENSE). Materiais de terceiros continuam sujeitos às suas próprias licenças.

Relate problemas ou solicite permissão por meio do [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues). Remova tokens de assinatura e credenciais de nodes dos seus relatos.

---

<p align="center"><sub>Yggdrasil × Ratatoskr · a ferramenta de configuração e o template central trabalhando juntos.</sub></p>
