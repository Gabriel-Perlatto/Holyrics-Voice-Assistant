# Holyrics Voice Assistant

Aplicação web local e offline-first para facilitar o controle do Holyrics em
igrejas. O projeto está em desenvolvimento incremental conforme o
[`ROADMAP.md`](ROADMAP.md).

## Estado atual

As **Phases 0 a 8** estão concluídas. Esta versão contém:

- aplicação principal em NestJS;
- frontend estático servido pelo próprio NestJS;
- hub inicial;
- páginas base de Pregador, Louvor e Configurações;
- CSS e JavaScript base;
- Logger padrão do NestJS;
- detecção do endereço IPv4 local;
- URL e QR Code de acesso exibidos no terminal;
- endpoint de status do sistema;
- status básico exibido na página de Configurações;
- formulário para configurações locais;
- persistência SQLite de host, porta e token do Holyrics, idioma, microfone e
  caminho do modelo Vosk;
- validações básicas e feedback de salvamento;
- autenticação real no API Server oficial do Holyrics;
- consulta da versão, informações do servidor e permissões do token;
- feedback claro para configuração ausente, host indisponível, porta recusada
  e timeout;
- Bible Module com provider de conteúdo substituível;
- metadados locais dos 66 livros, capítulos e números de versículos;
- aliases de livros em `pt-BR`;
- contexto bíblico inicial e identificadores locais de versão;
- interface mobile-first do pregador;
- navegação em grade por livro, capítulo e versículo;
- versão favorita persistida por dispositivo;
- registro local da passagem selecionada no backend;
- Realtime Module com Socket.IO local;
- sincronização de configurações, passagem bíblica e estado testado do
  Holyrics;
- status em tempo real nas telas de Configurações e Pregador;
- convenção local de modelos por idioma em `models/`;
- validação de existência do diretório de modelo configurado;
- status válido/inválido do caminho na tela de Configurações;
- Speech Module desacoplado por `SpeechProvider`;
- carregamento local de modelos Vosk;
- enumeração e captura do microfone local;
- transcrição parcial e final em tempo real;
- controles de início/parada e status em `/settings`;
- Command Module com parser determinístico em `pt-BR`;
- referências bíblicas estruturadas reutilizando aliases existentes;
- comandos de próximo/anterior versículo e capítulo;
- evento `COMMAND_IDENTIFIED`;
- diagnóstico de transcrição e comando em `/settings`.

Esta fase não inclui apresentação real da passagem no Holyrics, texto bíblico,
louvor, execução de comandos, navegação bíblica automática, controle do
Holyrics por voz, IA generativa ou funcionalidades de fases futuras.

## Requisitos

- Node.js 20 ou superior;
- npm 10 ou superior;
- `ffmpeg`;
- PulseAudio/PipeWire e `pactl` no Linux.

## Instalação

```bash
npm install
npm run install:vosk
```

O binding Vosk é opcional porque usa uma dependência nativa antiga. O segundo
comando instala os binários N-API sem recompilá-los. Sem ele, as interfaces
manuais continuam funcionando e o Speech Module informa que o Vosk está
indisponível.

## Execução

Desenvolvimento:

```bash
npm run start:dev
```

Execução normal:

```bash
npm start
```

Build de produção:

```bash
npm run build
npm run start:prod
```

Por padrão, acesse:

```text
http://localhost:3000
```

Ao iniciar, o terminal também apresenta o endereço da rede local e um QR Code.
Celulares e tablets conectados à mesma rede podem apontar a câmera para esse
QR Code e abrir o hub.

Se o acesso por outro dispositivo falhar, verifique se:

- os dois dispositivos estão na mesma rede;
- o firewall permite conexões de entrada na porta utilizada;
- a rede Wi-Fi não possui isolamento entre clientes.

Para usar outra porta:

```bash
PORT=4000 npm start
```

## Rotas

- `/` — hub inicial;
- `/preacher` — página base do pregador;
- `/worship` — página base da equipe de louvor;
- `/settings` — página base de configurações.

Endpoint disponível:

- `GET /api/system/status` — estado básico e endereço local do servidor.
- `GET /api/settings` — configurações locais atuais.
- `PUT /api/settings` — valida e substitui as configurações locais.
- `POST /api/holyrics/test-connection` — valida a integração completa.
- `POST /api/holyrics/authentication/validate` — valida o token.
- `POST /api/holyrics/info` — consulta versão e API Server.
- `POST /api/holyrics/permissions/check` — verifica ações permitidas.
- `GET /api/bible/versions` — identificadores locais de versão.
- `GET /api/bible/books` — livros e aliases `pt-BR`.
- `GET /api/bible/books/:book/chapters` — capítulos e contagem de versículos.
- `GET /api/bible/books/:book/chapters/:chapter/verses` — números dos
  versículos.
- `POST /api/bible/selection` — valida e registra a passagem localmente.
- `GET /api/speech/status` — estado atual do provider e da captura.
- `GET /api/speech/microphones` — entradas de áudio locais disponíveis.
- `POST /api/speech/initialize` — valida e carrega o modelo configurado.
- `POST /api/speech/start` — inicia captura e transcrição.
- `POST /api/speech/stop` — para a captura.
- `GET /api/commands/status` — último diagnóstico e contexto interno.
- `POST /api/commands/interpret` — interpreta texto sem executar ações.

Exemplo:

```json
{
  "application": "Holyrics Voice Assistant",
  "status": "online",
  "networkAvailable": true,
  "localIp": "192.168.1.50",
  "localUrl": "http://192.168.1.50:3000",
  "port": 3000,
  "uptimeSeconds": 42,
  "timestamp": "2026-06-20T00:00:00.000Z"
}
```

Exemplo de atualização das configurações:

```bash
curl --request PUT http://localhost:3000/api/settings \
  --header "Content-Type: application/json" \
  --data '{
    "holyricsHost": "192.168.1.50",
    "holyricsPort": 8091,
    "holyricsApiToken": "token-criado-no-holyrics",
    "language": "pt-BR",
    "microphone": "default",
    "voskModelPath": "models/pt-BR/vosk-model-small-pt-0.3",
    "speechAutoStart": false
  }'
```

O token é aceito apenas para gravação e nunca é devolvido por
`GET /api/settings`. Se o campo for omitido, o valor salvo é preservado; envie
`null` para removê-lo. Salvar não testa automaticamente o Holyrics nem inicia
a captura. A resposta inclui
`voskModelPathStatus`, que verifica apenas se o caminho existe e é um
diretório.

## Modelos locais

Modelos não são baixados nem incluídos no Git. Coloque-os manualmente em um
diretório de idioma:

```text
models/
└── pt-BR/
    └── vosk-model-small-pt-0.3/
```

Depois configure `models/pt-BR/vosk-model-small-pt-0.3` em `/settings`.
Caminhos absolutos também são aceitos para reutilizar modelos instalados em
outro local. Consulte
[`docs/speech-providers.md`](docs/speech-providers.md).

Para testar por HTTP:

```bash
curl http://localhost:3000/api/speech/microphones
curl --request POST http://localhost:3000/api/speech/initialize
curl --request POST http://localhost:3000/api/speech/start
curl --request POST http://localhost:3000/api/speech/stop
```

Teste de conexão:

```bash
curl --request POST http://localhost:3000/api/holyrics/test-connection
```

O teste executa `GetTokenInfo`, `CheckPermissions`, `GetVersion` e
`GetAPIServerInfo` no API Server oficial. Veja
[`docs/holyrics.md`](docs/holyrics.md).

Verificação de permissões:

```bash
curl --request POST http://localhost:3000/api/holyrics/permissions/check \
  --header "Content-Type: application/json" \
  --data '{"actions":["ShowVerse","GetBibleVersionsV2"]}'
```

Exemplo de consulta bíblica:

```bash
curl http://localhost:3000/api/bible/versions
curl http://localhost:3000/api/bible/books
curl http://localhost:3000/api/bible/books/Jo/chapters
curl http://localhost:3000/api/bible/books/Jo/chapters/3/verses
```

Esses endpoints retornam metadados locais identificados por
`source: "local-fallback"`. Não retornam texto bíblico. Consulte
[`docs/bible-data.md`](docs/bible-data.md).

Exemplo de seleção:

```bash
curl --request POST http://localhost:3000/api/bible/selection \
  --header "Content-Type: application/json" \
  --data '{
    "versionId": "nvi",
    "bookId": "joao",
    "chapter": 3,
    "verse": 16
  }'
```

A seleção é local e retorna `deliveredToHolyrics: false`. Veja
[`docs/preacher-interface.md`](docs/preacher-interface.md).

## Dados locais

As configurações são armazenadas por padrão em:

```text
data/settings.sqlite
```

O arquivo é criado automaticamente e ignorado pelo Git. Para utilizar outro
caminho:

```bash
SETTINGS_DATABASE_PATH=/caminho/settings.sqlite npm start
```

## Testes

```bash
npm test
```

Os testes atuais cobrem:

- seleção do IPv4 local e fallback para loopback;
- geração do status básico;
- defaults e validações das configurações;
- normalização dos campos;
- persistência após fechar e reabrir o SQLite;
- persistência e não exposição do token do Holyrics;
- provider autenticado com respostas simuladas;
- token inválido, permissões insuficientes e versão incompatível;
- timeout e tradução de erros de rede sem depender de Holyrics real;
- aliases bíblicos em `pt-BR`;
- 66 livros, versões locais e topologia de capítulos/versículos;
- contexto bíblico inicial;
- validação de livros e capítulos;
- seleção validada de passagem e versão;
- persistência/restauração da versão favorita no `localStorage`;
- serviço e gateway de eventos em tempo real;
- payloads seguros de configurações, Bíblia e Holyrics;
- emissão de eventos sem depender de navegador ou Holyrics real;
- referências bíblicas, aliases e conteúdo inválido;
- comandos de navegação de versículo e capítulo;
- integração de transcrições finais com o Command Module;
- ausência de emissão de `COMMAND_EXECUTED`.

## Estrutura

```text
src/
├── app/
├── modules/
├── shared/
└── main.ts

public/
├── pages/
├── js/
├── css/
└── assets/
```

As regras e decisões do projeto estão em:

- [`CONTEXT.md`](CONTEXT.md);
- [`ARCHITECTURE.md`](ARCHITECTURE.md);
- [`ROADMAP.md`](ROADMAP.md).

## Decisão técnica da Phase 0

O frontend não possui framework ou processo de build próprio. O adaptador
Express do NestJS serve diretamente a pasta `public`, e o `AppController`
mapeia as quatro rotas públicas para seus respectivos arquivos HTML. Isso
reduz dependências e preserva uma base simples para a aplicação local.

## Decisões técnicas da Phase 1

O `SystemModule` concentra descoberta de IP e status da aplicação. A detecção
prioriza endereços IPv4 privados e usa `127.0.0.1` como fallback quando o
sistema operacional não fornece uma interface utilizável.

O servidor escuta em `0.0.0.0`, permitindo acesso pela rede local. O QR Code é
gerado somente no terminal e não depende de internet. A aplicação não realiza
descoberta de Holyrics nem armazena configurações nesta fase.

## Decisões técnicas da Phase 2

O `SettingsModule` separa controller, serviço de validação e repositório. A
persistência usa `better-sqlite3` diretamente, sem ORM, pois a fase possui uma
única tabela e uma única configuração global.

O idioma padrão é `pt-BR`. Microfone e caminho do modelo Vosk são armazenados
como textos opcionais; enumerar dispositivos e carregar o modelo pertencem às
fases futuras.

## Decisões técnicas da Phase 3 e Phase 5.5

Toda comunicação externa com o Holyrics fica dentro do `HolyricsModule`. O
serviço depende de uma interface de provider, permitindo testes com mocks e
substituição futura da implementação HTTP.

O probe inicial `GET /` foi substituído na Phase 5.5 pelo contrato oficial
`POST /api/{action}`. A implementação usa token direto, timeout de três
segundos e as ações `GetTokenInfo`, `CheckPermissions`, `GetVersion` e
`GetAPIServerInfo`.

O token fica no SQLite local, não é retornado ao navegador e não aparece nos
logs. O fluxo oficial alternativo com nonce e hash permanece documentado para
evolução futura.

## Decisões técnicas da Phase 4

O `BibleModule` depende da interface `BibleContentProvider`. O API Server
oficial fornece `GetBibleVersionsV2`, mas não publica ações para listar livros,
capítulos, contagens ou texto bíblico. Por isso, a implementação atual ainda
usa `LocalBibleContentProvider`.

O fallback contém somente metadados de navegação, sem texto bíblico e sem
novas tabelas. Todas as respostas identificam a origem local. A interface do
pregador e a alteração do contexto continuam fora desta fase.

## Decisões técnicas da Phase 5

A interface do pregador usa grades paginadas em vez de tabelas, selects ou uma
lista contínua. O JavaScript controla somente a apresentação das etapas e
consome os endpoints HTTP; validações permanecem no backend.

A versão favorita usa `localStorage`, por dispositivo. A ação oficial
`ShowVerse` foi confirmada, mas ainda não está implementada. A seleção
permanece registrada no contexto local e responde explicitamente que não foi
entregue. Consulte `docs/holyrics-api-research.md`.

## Decisões técnicas da Phase 6

O `RealtimeModule` usa Socket.IO no namespace `/realtime`. Ele é global para
garantir uma única instância do gateway. Os módulos de domínio emitem eventos
através do `RealtimeService`; o gateway apenas transmite envelopes
`{ type, payload, occurredAt }`.

O cliente reutilizável está em `public/js/websocket.js`. O WebSocket comunica
somente o NestJS com os navegadores, sem polling ou conexão direta com o
Holyrics. Consulte [`docs/realtime.md`](docs/realtime.md).

## Decisões técnicas da Phase 6.5

Os modelos ficam fora do controle de versão e são organizados por código BCP
47 em `models/`. O `SettingsModule` valida somente o texto e a existência do
diretório; caminhos inexistentes podem ser persistidos para que a interface
mostre o estado inválido até o artefato ser instalado.

Na Phase 6.5, nenhum arquivo interno era lido e nenhuma dependência de Vosk
existia. Provider, modelo e preferência persistida foram mantidos
desacoplados para permitir a implementação da Phase 7.

## Decisões técnicas da Phase 7

O `SpeechService` depende do contrato `SpeechProvider`. A implementação
`VoskSpeechProvider` concentra o binding nativo, valida o conteúdo mínimo do
modelo e recebe PCM da camada `FfmpegAudioCapture`.

A captura usa 16 kHz, mono e PCM assinado de 16 bits. No Linux, fontes
PulseAudio/PipeWire são enumeradas por `pactl`. Falhas de modelo, binding,
microfone ou processo de captura são convertidas em estado e eventos seguros,
sem derrubar a aplicação.

Transcrições são exibidas e transmitidas sem interpretação. A Phase 7 não cria
Command Module, não acessa BibleModule e não controla o Holyrics. Consulte
[`docs/speech-providers.md`](docs/speech-providers.md).

## Decisões técnicas da Phase 8

O `CommandModule` usa um parser local e determinístico. Nomes, abreviações e
aliases são lidos dos dados existentes do `BibleModule`; nenhuma lista bíblica
foi duplicada.

Somente transcrições finais são interpretadas. O resultado é emitido como
`COMMAND_IDENTIFIED` e pode ser consultado em `/settings`. O contexto interno
do módulo não altera o `BibleModule`, a tela do pregador ou o Holyrics.
`COMMAND_EXECUTED` não é emitido. Consulte
[`docs/command-interpreter.md`](docs/command-interpreter.md).
