# Perguntas frequentes

<p align="center">
  <a href="README.pt-BR.md">Introdução</a> ·
  <a href="QUICKSTART.pt-BR.md">Início rápido</a> ·
  <a href="CONTRIBUTING.pt-BR.md">Contribuindo</a> ·
  <a href="CONTRIBUTORS.pt-BR.md">Colaboradores</a> ·
  <a href="FAQ.pt-BR.md">Perguntas frequentes</a>
</p>

---

## Por que a configuração é tão pequena e ainda cobre muitos serviços?

O Ratatoskr referencia categorias de dados Geo; os dados concretos de domínios e IP ficam no banco de dados. A configuração mantém apenas as referências de categoria, a ordem de correspondência e a orquestração de saídas. O banco de dados Geo ainda precisa ser carregado e atualizado pelo cliente.

## Um mesmo YAML pode ser usado em todos os clientes?

A configuração é voltada para Mihomo. O cliente deve oferecer suporte à sintaxe correspondente e incluir as categorias Geo referenciadas. Recursos de captura de rede como DNS, TUN e outros dependem do template escolhido e do ambiente do dispositivo.

## A manutenção exige reescrever toda a configuração toda vez?

Categorias Geo, fontes de regras suplementares, assinaturas de nodes e estratégias de saída são mantidas separadamente. Atualize os dados pelo mecanismo do cliente e ajuste as regras ou grupos proxy correspondentes apenas quando necessário; os nomes de categoria e as referências devem permanecer válidos.

## Como as regras de bloqueio de anúncios são atualizadas?

O GitHub Actions verifica diariamente o upstream oficial do AdGuard e busca atualizações apenas quando o conteúdo muda, seguindo uma abordagem de atualização tardia e baixo consumo de recursos.

## Qual é a relação entre o Config Builder e a configuração principal?

O Config Builder (a aplicação Yggdrasil) lê as definições de aplicativos, regiões e estratégias do template Ratatoskr e monta uma configuração pessoal a partir das suas seleções na página. Um organiza e gera; o outro define o roteamento real e as estratégias de nodes.

## É gratuito? É necessária permissão?

O projeto usa uma licença **All Rights Reserved**. O uso, a execução, a modificação, a redistribuição, a implantação pública e o uso comercial dos materiais originais exigem permissão por escrito prévia do titular dos direitos; isso inclui o uso pessoal e não comercial. Consulte os termos completos em [LICENSE](../../LICENSE). Solicite permissão pelo [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues).
