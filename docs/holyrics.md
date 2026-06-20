# Integração com Holyrics

## Estado implementado — Phase 5.5

O `HolyricsModule` usa o API Server HTTP oficial do Holyrics para autenticar,
consultar versão, verificar permissões e obter informações do servidor.

Não são usados `GET /`, endpoints especulativos ou protocolos internos do
aplicativo móvel.

Ainda não estão implementados:

- apresentação real de passagens com `ShowVerse`;
- consulta de versões instaladas com `GetBibleVersionsV2`;
- controles de músicas, playlists ou louvor;
- polling contínuo;
- WebSocket;
- API remota pela internet.

Os fallbacks bíblicos e o comportamento local da tela do pregador permanecem
inalterados.

## Configuração no Holyrics

No computador que executa o Holyrics:

1. acesse `Arquivo > Configurações > API Server`;
2. ative o acesso pela rede local;
3. confirme a porta, normalmente `8091`;
4. abra `Gerenciar permissões`;
5. crie um token;
6. conceda:
   - `GetTokenInfo`;
   - `CheckPermissions`;
   - `GetVersion`;
   - `GetAPIServerInfo`.

Depois, em `/settings`, informe host/IP, porta e token, salve e clique em
“Validar API Holyrics”.

A Phase 5.5 exige Holyrics `2.26.0` ou superior porque
`GetAPIServerInfo` foi disponibilizado nessa versão.

## Estratégia de autenticação

Foi adotado o método oficial mais simples:

```text
POST http://<host>:<porta>/api/<ação>?token=<token>
Content-Type: application/json
```

O corpo é sempre JSON. O provider possui timeout de três segundos e interpreta
o envelope oficial `{ status, data, error }`.

O método alternativo oficial baseado em `Auth`, nonce, `sid`, `rid` e
`dtoken` SHA-256 não foi implementado nesta fase. Ele reduz a exposição do
token na rede local sem TLS e é recomendado para uma evolução posterior.

## Persistência e proteção do token

O token é armazenado no SQLite local junto das demais configurações.

Regras aplicadas:

- o endpoint `GET /api/settings` nunca retorna o token;
- a resposta informa apenas `holyricsApiTokenConfigured`;
- deixar o campo vazio preserva o token existente;
- marcar “Remover o token salvo” grava `null`;
- o token não aparece em logs nem nas respostas do `HolyricsModule`;
- toda chamada externa continua encapsulada no `HolyricsModule`.

O banco não é criptografado. O arquivo `data/settings.sqlite` deve permanecer
restrito ao usuário do sistema operacional que executa a aplicação.

## Endpoints locais

### Teste completo

```http
POST /api/holyrics/test-connection
```

Executa:

1. `GetTokenInfo`;
2. validação da versão mínima;
3. `CheckPermissions`;
4. `GetVersion`;
5. `GetAPIServerInfo`.

Retorna conexão, autenticação, versão, plataforma, permissões disponíveis,
informações do API Server e latência.

### Validar autenticação

```http
POST /api/holyrics/authentication/validate
```

Usa somente `GetTokenInfo`.

### Obter informações

```http
POST /api/holyrics/info
```

Usa `GetTokenInfo`, `GetVersion` e `GetAPIServerInfo`.

### Verificar permissões

```http
POST /api/holyrics/permissions/check
Content-Type: application/json
```

```json
{
  "actions": ["ShowVerse", "GetBibleVersionsV2"]
}
```

Usa `CheckPermissions`. Essa consulta apenas verifica permissões; não executa
as ações informadas.

## Mapeamento de erros

- `400`: host, porta ou token ausente; entrada inválida;
- `401`: token inválido;
- `403`: permissão insuficiente;
- `409`: versão do Holyrics incompatível;
- `502`: resposta inválida do API Server;
- `503`: conexão recusada, host ausente, timeout ou indisponibilidade.

## Tela de configurações

A tela `/settings`:

- salva ou remove o token;
- não recarrega o valor secreto no navegador;
- exibe conexão e autenticação separadamente;
- mostra versão do Holyrics;
- mostra as permissões disponíveis;
- apresenta erros retornados pelo backend.

Não existe polling. A validação ocorre somente quando o usuário aciona o
botão.

## Testes

Os testes usam mocks e não dependem de Holyrics real. Cobrem:

- requisição `POST` oficial autenticada;
- token inválido;
- permissão insuficiente;
- conexão recusada;
- timeout;
- versão incompatível;
- persistência, preservação e remoção do token;
- não exposição do token pela resposta pública de configurações.

Consulte também [`holyrics-api-research.md`](holyrics-api-research.md).
