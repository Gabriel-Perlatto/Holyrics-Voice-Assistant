# Holyrics Voice Assistant

Aplicação web local e offline-first para facilitar o controle do Holyrics em
igrejas. O projeto está em desenvolvimento incremental conforme o
[`ROADMAP.md`](ROADMAP.md).

## Estado atual

As **Phases 0, 1 e 2** estão concluídas. Esta versão contém:

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
- persistência SQLite de host/porta do Holyrics, idioma, microfone e caminho
  do modelo Vosk;
- validações básicas e feedback de salvamento.

Esta fase não inclui conexão real com Holyrics, acesso ao microfone,
carregamento do Vosk, reconhecimento de voz, WebSocket ou funcionalidades de
fases futuras.

## Requisitos

- Node.js 20 ou superior;
- npm 10 ou superior.

## Instalação

```bash
npm install
```

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
    "language": "pt-BR",
    "microphone": "Microfone USB",
    "voskModelPath": "/opt/modelos/vosk-pt"
  }'
```

Campos opcionais podem ser enviados como `null` ou texto vazio. Nesta fase,
salvar os dados não testa o Holyrics, não acessa o microfone e não carrega o
modelo Vosk.

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
- persistência após fechar e reabrir o SQLite.

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
