<p align="center">
  <img src="../../assets/favicon.png" width="104" alt="Logo del progetto Yggdrasil" />
</p>

<h1 align="center">Avvio rapido</h1>

<p align="center">
  <a href="README.it.md">Introduzione</a> ·
  <a href="QUICKSTART.it.md">Avvio rapido</a> ·
  <a href="CONTRIBUTING.it.md">Contribuire</a> ·
  <a href="CONTRIBUTORS.it.md">Collaboratori</a> ·
  <a href="FAQ.it.md">Domande frequenti</a>
</p>

---

## Prima di iniziare

Il progetto utilizza una licenza **All Rights Reserved**. Ottieni un'autorizzazione scritta preventiva dal titolare dei diritti prima di usare, eseguire, modificare, ridistribuire, distribuire pubblicamente o usare commercialmente i materiali originali del progetto. Vedi [LICENSE](../../LICENSE).

## Consigliato: Config Builder

Apri il [Config Builder](https://yakasuka.github.io/yggdrasil/config-builder/) e segui cinque passaggi:

1. **Sorgente della sottoscrizione.** Inserisci il nome del provider e una sottoscrizione YAML, Base64 o con link ai nodi comuni. I nodi e le informazioni sul traffico segnalate dal provider vengono analizzati.
2. **Nodi per regione.** Vengono mostrate solo le regioni effettivamente presenti nella sottoscrizione; scegli quali nodi mantenere.
3. **Strategie per i nodi.** Mantieni le strategie automatiche necessarie; l'outbound predefinito è la selezione manuale.
4. **Routing delle applicazioni.** Tutte le applicazioni sono abilitate e instradate tramite proxy per impostazione predefinita. Assegna se necessario una regione mantenuta, Direct o Reject per ogni applicazione.
5. **Conferma finale.** Anteprima della configurazione, scarica `name-ratatoskr.yaml` oppure genera un link di sottoscrizione persistente.

Le sottoscrizioni accettano YAML, Base64 e link ai nodi comuni. I dati sul traffico provengono dall'`Subscription-Userinfo` del provider. I controlli di latenza opzionali misurano il tempo di stabilimento della connessione TCP — non ICMP ping né la latenza completa del proxy.

## Manuale: usare direttamente il template

1. Scarica [ratatoskr-template.yaml](https://github.com/yakasuka/yggdrasil/releases/latest/download/ratatoskr-template.yaml).
2. Mantieni i tuoi `proxy-providers` / `proxies` con i nodi della sottoscrizione.
3. Assicurati che il client disponga dei dati GeoSite / GeoIP referenziati.
4. Importa in un client compatibile con Mihomo, scegli un outbound per applicazione o regione ed esegui di nuovo i test di latenza.

## Porte

| Configurazione | HTTP | SOCKS5 |
| :--- | :--- | :--- |
| Template manuale | `7890` | `7891` |
| Output del Config Builder | `7890` | `7890` |

Il Config Builder usa una porta mista e consente la personalizzazione. Mantieni URL di sottoscrizione personali, credenziali dei nodi e token di accesso in un flusso di lavoro locale o privato.

## Distribuzione

Il Config Builder e il servizio di sottoscrizione vengono distribuiti insieme su Cloudflare Pages. Vedi la [guida alla distribuzione](../../config-builder/docs/DEPLOYMENT.md) e la [mappa di implementazione](../../config-builder/docs/IMPLEMENTATION.md).

---

<p align="center"><sub>Yggdrasil × Ratatoskr · strumento di configurazione e template principale che lavorano insieme.</sub></p>
