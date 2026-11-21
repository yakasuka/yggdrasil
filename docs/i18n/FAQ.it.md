# Domande frequenti

<p align="center">
  <a href="README.it.md">Introduzione</a> ·
  <a href="QUICKSTART.it.md">Avvio rapido</a> ·
  <a href="CONTRIBUTING.it.md">Contribuire</a> ·
  <a href="CONTRIBUTORS.it.md">Collaboratori</a> ·
  <a href="FAQ.it.md">Domande frequenti</a>
</p>

---

## Perché la configurazione è così piccola ma copre molti servizi?

Ratatoskr fa riferimento a categorie di dati Geo; i dati concreti di domini e IP risiedono nel database. La configurazione conserva solo i riferimenti alle categorie, l'ordine di corrispondenza e l'orchestrazione degli outbound. Il database Geo deve comunque essere caricato e aggiornato dal client.

## Un solo YAML può essere usato in tutti i client?

La configurazione è pensata per Mihomo. Il client deve supportare la sintassi rilevante e includere le categorie Geo referenziate. DNS, TUN e altre funzionalità di cattura della rete dipendono dal template scelto e dall'ambiente del dispositivo.

## La manutenzione richiede di riscrivere ogni volta l'intera configurazione?

Categorie Geo, fonti di regole supplementari, sottoscrizioni dei nodi e strategie outbound vengono mantenute separatamente. Aggiorna i dati tramite il meccanismo del client e modifica le regole o i proxy group pertinenti solo quando necessario; i nomi delle categorie e i riferimenti devono rimanere validi.

## Come vengono aggiornate le regole di blocco degli annunci?

GitHub Actions verifica quotidianamente l'upstream ufficiale di AdGuard e recupera gli aggiornamenti solo quando il contenuto cambia, seguendo un approccio di aggiornamento pigro a basso consumo di risorse.

## Qual è il rapporto tra il Config Builder e la configurazione principale?

Il Config Builder (l'applicazione Yggdrasil) legge le definizioni di applicazioni, regioni e strategie nel template Ratatoskr e assembla una configurazione personale in base alle tue scelte sul sito. Uno organizza e genera; l'altro definisce il routing e le strategie dei nodi effettivi.

## L'uso è gratuito? Serve un'autorizzazione?

Il progetto usa una licenza **All Rights Reserved**. L'uso, l'esecuzione, la modifica, la ridistribuzione, la distribuzione pubblica e l'uso commerciale dei materiali originali richiedono l'autorizzazione scritta preventiva del titolare dei diritti; sono inclusi l'uso personale e non commerciale. Vedi [LICENSE](../../LICENSE). Richiedi l'autorizzazione tramite [GitHub Issues](https://github.com/yakasuka/yggdrasil/issues).
