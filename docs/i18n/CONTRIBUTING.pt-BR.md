# Contribuindo

<p align="center">
  <a href="README.pt-BR.md">Introdução</a> ·
  <a href="QUICKSTART.pt-BR.md">Início rápido</a> ·
  <a href="CONTRIBUTING.pt-BR.md">Contribuindo</a> ·
  <a href="CONTRIBUTORS.pt-BR.md">Colaboradores</a> ·
  <a href="FAQ.pt-BR.md">Perguntas frequentes</a>
</p>

---

## Formas de contribuir

Issues são bem-vindos para relatar bugs, solicitar permissões e enviar sugestões. Inclua as versões do seu cliente e do núcleo, a configuração em uso e o resultado de roteamento esperado — e remova tokens de assinatura e credenciais de nodes.

## Comandos de desenvolvimento

O frontend do Config Builder e o compilador de templates compartilhado estão em `config-builder/`:

```sh
npm --prefix config-builder ci
npm --prefix config-builder run build
npm --prefix config-builder test
npm --prefix config-builder run service:dev
```

O serviço local é executado em `http://localhost:8788/config-builder/`.

## Estrutura do repositório

| Caminho | Função |
| :--- | :--- |
| `resources/template/` | Template de configuração central |
| `resources/rules/` | Dados de regras, agrupados por fonte (adguard / aethersailor / download) |
| `config-builder/` | Frontend do Config Builder, compilador compartilhado e serviço de assinatura |
| `scripts/rules/` | Scripts de busca e sincronização de regras (atualizações tardias) |
| `scripts/endpoints/` | Endpoints legados `/merge` e `/sub` |
| `docs/i18n/` | Documentação wiki multilíngue |

## Adicionar um aplicativo ou região

Edite o catálogo estático em [catalog.json](../../config-builder/shared/catalog.json). Após uma nova compilação, o catálogo da página e o template do backend são atualizados. Consulte o [mapa de implementação](../../config-builder/docs/IMPLEMENTATION.md) para ver o fluxo de dados completo.

## Atualização de regras

Os scripts de regras seguem um princípio de atualização tardia: sondas condicionais ETag / Last-Modified buscam o corpo apenas quando o conteúdo muda. Dois fluxos de trabalho do GitHub Actions tratam respectivamente das regras de desktop do AdGuard e da sincronização de regras do Aethersailor. Consulte o [guia de implantação](../../config-builder/docs/DEPLOYMENT.md).

## Documentação

A documentação multilíngue fica em `docs/i18n/`. Cada idioma contém cinco capítulos: README, QUICKSTART, CONTRIBUTING, CONTRIBUTORS e FAQ. Para adicionar um idioma, copie um conjunto completo e renomeie com o código do idioma:

```text
README.<language-code>.md
QUICKSTART.<language-code>.md
CONTRIBUTING.<language-code>.md
CONTRIBUTORS.<language-code>.md
FAQ.<language-code>.md
```

Os códigos de idioma seguem a norma BCP 47, p. ex. `zh-CN`, `en`, `pt-BR`.
