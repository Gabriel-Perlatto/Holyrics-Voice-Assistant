# Holyrics Voice Assistant

Aplicação web local e offline-first para facilitar o controle do Holyrics em
igrejas. O projeto está em desenvolvimento incremental conforme o
[`ROADMAP.md`](ROADMAP.md).

## Estado atual

As **Phases 0 e 1** estão concluídas. Esta versão contém:

- aplicação principal em NestJS;
- frontend estático servido pelo próprio NestJS;
- hub inicial;
- páginas base de Pregador, Louvor e Configurações;
- CSS e JavaScript base;
- Logger padrão do NestJS;
- detecção do endereço IPv4 local;
- URL e QR Code de acesso exibidos no terminal;
- endpoint de status do sistema;
- status básico exibido na página de Configurações.

Esta fase não inclui integração com Holyrics, reconhecimento de voz, Vosk,
banco de dados, configurações persistentes, WebSocket ou funcionalidades de
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

## Testes

```bash
npm test
```

Os testes atuais cobrem seleção do IPv4 local, fallback para loopback,
validação da porta e geração do status básico.

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
