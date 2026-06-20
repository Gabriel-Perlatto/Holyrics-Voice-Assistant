# Eventos em tempo real

## Escopo da Phase 6

O sistema usa Socket.IO somente entre o NestJS e os navegadores conectados à
aplicação local.

O WebSocket:

- não se conecta diretamente ao Holyrics;
- não contém regras de negócio;
- não executa comandos;
- não implementa polling;
- não envia token, host, porta ou configurações completas;
- não depende de internet.

Namespace:

```text
/realtime
```

O cliente reutilizável está em `public/js/websocket.js`.

## Envelope

Todo evento usa:

```json
{
  "type": "BIBLE_CHANGED",
  "payload": {},
  "occurredAt": "2026-06-20T00:00:00.000Z"
}
```

O tipo também é usado como nome do evento Socket.IO.

## Eventos emitidos

### SETTINGS_UPDATED

Emitido pelo `SettingsService` após persistência bem-sucedida.

```json
{
  "holyricsConfigured": true,
  "holyricsApiTokenConfigured": true,
  "language": "pt-BR",
  "microphoneConfigured": false,
  "voskModelConfigured": false,
  "updatedAt": "2026-06-20T00:00:00.000Z"
}
```

O token e os valores de host, porta, microfone e caminho do modelo não são
transmitidos.

### BIBLE_CHANGED

Emitido pelo `BibleService` após uma seleção válida.

```json
{
  "book": {
    "id": "joao",
    "name": "João"
  },
  "chapter": 3,
  "verse": 16,
  "version": "nvi",
  "source": "local-fallback",
  "delivery": "local-only",
  "deliveredToHolyrics": false
}
```

### HOLYRICS_CONNECTED

Emitido após teste de conexão ou autenticação bem-sucedido.

```json
{
  "connected": true,
  "authenticated": true,
  "version": "2.28.1",
  "checkedAt": "2026-06-20T00:00:00.000Z"
}
```

### HOLYRICS_DISCONNECTED

Emitido quando o teste de conexão ou autenticação falha.

```json
{
  "connected": false,
  "authenticated": false,
  "reason": "O API Server do Holyrics está indisponível.",
  "checkedAt": "2026-06-20T00:00:00.000Z"
}
```

### SYSTEM_ERROR

Estrutura disponível através de `RealtimeService.emitSystemError()`:

```json
{
  "source": "system",
  "message": "Descrição segura do erro."
}
```

## Eventos reservados

Os tipos abaixo existem, mas não são disparados na Phase 6:

- `TRANSCRIPTION_RECEIVED`;
- `COMMAND_IDENTIFIED`;
- `COMMAND_EXECUTED`;
- `SPEECH_STARTED`;
- `SPEECH_STOPPED`;
- `SONG_CHANGED`.

Nenhuma funcionalidade de voz, comando ou louvor foi criada.

## Frontend

`/settings` exibe o estado da conexão, o último evento recebido e reflete
eventos de configurações e conexão Holyrics.

`/preacher` exibe o estado da conexão e atualiza versão, livro, capítulo e
versículo ao receber `BIBLE_CHANGED`, mantendo o fluxo manual HTTP existente.

## Limitações

- eventos não são persistidos;
- clientes conectados depois da emissão não recebem histórico;
- não há autenticação de usuários;
- não há sincronização em nuvem;
- mudanças feitas diretamente no Holyrics não geram eventos, pois não existe
  polling contínuo nem push oficial integrado nesta fase.
