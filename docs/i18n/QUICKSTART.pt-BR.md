<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Logotipo do projeto Yggdrasil" />
</p>

<h1 align="center">Início rápido</h1>

<p align="center">
  <a href="README.pt-BR.md">Introdução</a> ·
  <a href="QUICKSTART.pt-BR.md">Início rápido</a> ·
  <a href="CONTRIBUTING.pt-BR.md">Contribuindo</a> ·
  <a href="CONTRIBUTORS.pt-BR.md">Colaboradores</a> ·
  <a href="FAQ.pt-BR.md">Perguntas frequentes</a>
</p>

---

## Antes de começar

O projeto usa uma licença **All Rights Reserved**. Obtenha permissão por escrito prévia do titular dos direitos correspondentes antes de usar, executar, modificar, redistribuir, implantar publicamente ou usar comercialmente os materiais originais do projeto. Consulte [LICENSE](../../LICENSE).

## Recomendado: Config Builder

Abra o [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) e siga cinco etapas:

1. **Fonte da assinatura.** Informe o nome do provedor e uma assinatura YAML, Base64 ou de links de nodes comuns; os nodes e as informações de tráfego informadas pelo provedor são analisados.
2. **Nodes por região.** Somente as regiões realmente presentes na assinatura são exibidas; escolha quais nodes manter.
3. **Estratégias de nodes.** Mantenha as estratégias automáticas necessárias; a saída padrão é a seleção manual.
4. **Roteamento de aplicativos.** Todos os aplicativos estão habilitados e passam pelo proxy por padrão. Atribua a cada aplicativo uma região mantida, Direct ou Reject conforme necessário.
5. **Confirmação final.** Visualize a configuração, baixe `name-ratatoskr.yaml` ou gere um link de assinatura persistente.

As assinaturas aceitam YAML, Base64 e links de nodes comuns. Os dados de tráfego vêm do `Subscription-Userinfo` do provedor. Verificações de atraso opcionais medem o tempo de estabelecimento da conexão TCP — não o ping ICMP nem a latência completa do proxy.

## Manual: usar o template diretamente

1. Baixe [ratatoskr-template.yaml](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml).
2. Mantenha seus próprios `proxy-providers` / `proxies` com os nodes da assinatura.
3. Certifique-se de que o cliente tenha os dados de GeoSite / GeoIP referenciados.
4. Importe em um cliente compatível com Mihomo, selecione uma saída por aplicativo ou região e execute novamente os testes de atraso.

## Portas

| Configuração | HTTP | SOCKS5 |
| :--- | :--- | :--- |
| Template manual | `7890` | `7891` |
| Saída do Config Builder | `7890` | `7890` |

O Config Builder usa uma porta mista e permite personalização. Mantenha URLs de assinatura pessoais, credenciais de nodes e tokens de acesso em um fluxo local ou privado.

## Implantação

O Config Builder e o serviço de assinatura são implantados juntos no Cloudflare Pages. Consulte o [guia de implantação](../../config-builder/docs/DEPLOYMENT.md) e o [mapa de implementação](../../config-builder/docs/IMPLEMENTATION.md).

---

<p align="center"><sub>Yggdrasil × Ratatoskr · a ferramenta de configuração e o template central.</sub></p>
