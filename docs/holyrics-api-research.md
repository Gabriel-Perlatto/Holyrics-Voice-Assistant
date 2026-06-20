# Pesquisa oficial da API do Holyrics

Pesquisa realizada em 20 de junho de 2026.

## Resumo executivo

O Holyrics oferece uma API HTTP oficial chamada **API Server**, disponível no
próprio programa em `Arquivo > Configurações > API Server`.

Conclusões principais:

- existe API HTTP local e também uma ponte oficial pela internet;
- o transporte documentado é HTTP com requisições `POST` e JSON;
- a API exige token com permissões;
- existe autenticação local por nonce e hash SHA-256;
- há ações oficiais para apresentar versículos, escolher versão bíblica,
  apresentar músicas, controlar slides e manipular playlists;
- não foi encontrado protocolo WebSocket de entrada para controlar o
  Holyrics;
- não há ação pública documentada para listar livros, capítulos, números de
  versículos ou o texto bíblico;
- não há endpoint anônimo dedicado de health check;
- o Plugin Holyrics, o aplicativo móvel, MIDI, scripts e API Item são
  mecanismos diferentes e não devem ser confundidos com o API Server.

A documentação do API Server consultada corresponde ao commit
`1b5dcf5521d9cd2d91af6abc3c0b6c58127b43f3`, identificado como `v2.28.1` e
publicado em 15 de abril de 2026.

## Fontes oficiais

- [API Server — documentação oficial](https://github.com/holyrics/API-Server)
- [API Server — README em português](https://github.com/holyrics/API-Server/blob/main/README.md)
- [Lista oficial de recursos](https://holyrics.com.br/tips/features.html)
- [Aplicativo oficial Holyrics](https://holyrics.com.br/app.html)
- [Perguntas frequentes](https://holyrics.com.br/tips/faq.html)
- [API Item](https://holyrics.com.br/tips/api_item.html)
- [Holyrics Script](https://holyrics.com.br/tips/holyrics_script.html)
- [JSLib oficial](https://github.com/holyrics/jslib)
- [Holyrics Actions](https://github.com/holyrics/jslib/blob/main/doc/pt/HolyricsActions.md)
- [MIDI](https://holyrics.com.br/tips/midi.html)
- [Plugin Holyrics](https://github.com/holyrics/HolyricsPlugin)
- [Apresentação rápida de versículos](https://holyrics.com.br/tips/quick_verse_presentation.html)

## Contrato HTTP oficial

### Rede local

Formato:

```text
POST http://<IP>:<PORT>/api/<ACTION>?token=<TOKEN>
Content-Type: application/json
```

Corpo:

```json
{}
```

Resposta de sucesso:

```json
{
  "status": "ok",
  "data": {}
}
```

Resposta de erro:

```json
{
  "status": "error",
  "error": "invalid token"
}
```

O token é criado nas configurações do API Server. É possível criar múltiplos
tokens e limitar as permissões de cada um.

### Autenticação por hash

Como a rede local usa HTTP sem TLS, a documentação oferece um fluxo que evita
enviar o token em toda requisição:

1. chamar a ação `Auth` sem credenciais para receber `sid` e `nonce`;
2. calcular `SHA-256(nonce + ":" + rid + ":" + token + ":" + data)`;
3. enviar `sid`, `rid` e o hash em `dtoken`;
4. usar um `rid` positivo e sempre crescente após a autenticação.

O token ainda é necessário localmente para calcular o hash. O mecanismo reduz
a exposição na rede, mas não fornece confidencialidade para o corpo da
requisição.

### Internet

A documentação também publica:

```text
POST https://api.holyrics.com.br/send/<ACTION>
POST https://api.holyrics.com.br/request/<ACTION>
```

Essas chamadas usam os headers `api_key` e `token`.

- `send` apenas confirma o encaminhamento ao computador;
- `request` aguarda e encapsula a resposta do Holyrics;
- erros documentados incluem dispositivo desconectado e timeout.

Esse caminho depende de internet e não deve ser o padrão deste projeto
offline-first.

## Ações confirmadas para Bíblia

| Ação | Versão mínima | Uso confirmado |
| --- | --- | --- |
| `ShowVerse` | 2.19.0 | Inicia apresentação de um ou vários versículos |
| `GetBibleVersionsV2` | 2.23.0 | Lista versões instaladas e atalhos |
| `GetBibleSettings` | 2.21.0 | Lê versões carregadas e demais configurações bíblicas |
| `SetBibleSettings` | 2.21.0 | Troca versões carregadas e configurações bíblicas |
| `SelectVerse` | 2.21.0 | Seleciona referência na janela da Bíblia, sem afirmar apresentação |
| `ActionNext` | 2.19.0 | Avança a apresentação atual |
| `ActionPrevious` | 2.19.0 | Volta a apresentação atual |
| `GetCurrentPresentation` | 2.19.0 | Consulta o item e o slide atual |
| `CloseCurrentPresentation` | 2.19.0 | Encerra a apresentação atual |
| `RunActions` | 2.27.0 | Executa ações internas publicadas, inclusive ações da interface bíblica |

`GetBibleVersions` existe desde 2.21.0, mas está marcado como obsoleto. A
integração futura deve usar `GetBibleVersionsV2`.

### Apresentar passagem

`ShowVerse` aceita:

- `id` no formato `LLCCCVVV`;
- `ids` com até 100 versículos;
- `references`, por exemplo `João 3:16` ou `Gn 1:1-3 Sl 23.1`;
- `version`, por nome ou abreviação, desde 2.21.0;
- `quick_presentation`, desde 2.24.0;
- quantidade de versículos e modo de apresentação, desde 2.28.0.

Exemplo oficial adaptado apenas para host, porta e token:

```http
POST /api/ShowVerse?token=<TOKEN>
Content-Type: application/json
```

```json
{
  "references": "João 3:16",
  "version": "pt_acf"
}
```

### Trocar versão

Há três caminhos oficiais, com semânticas diferentes:

- informar `version` em `ShowVerse` para a passagem apresentada;
- usar `SetBibleSettings` para alterar `tab_version_1`, `tab_version_2` ou
  `tab_version_3`;
- em Holyrics 2.27.0 ou superior, usar `RunActions` com
  `interface_bible_change_version`.

Para o fluxo do pregador, enviar `version` junto com `ShowVerse` é a opção mais
local e previsível. Alterar `BibleSettings` modifica estado global da
interface do Holyrics.

### Navegar versículos

Depois de iniciar uma apresentação bíblica, `ActionNext` e `ActionPrevious`
controlam os slides atuais. Para escolher diretamente outra referência,
`ShowVerse` inicia a apresentação e `SelectVerse` apenas seleciona a
referência na janela da Bíblia.

`GetCurrentPresentation` retorna tipo, item, número do slide e total de
slides, mas a própria documentação informa que `include_slides` não está
disponível para apresentações de versículos.

## Dados bíblicos disponíveis

### Confirmado

`GetBibleVersionsV2` retorna as versões realmente disponíveis na instalação,
incluindo:

- identificador da versão;
- nome;
- idioma e código ISO;
- atalhos configurados pelo usuário.

### Não confirmado

Não existe ação pública documentada para:

- listar livros;
- listar capítulos de um livro;
- listar números de versículos de um capítulo;
- obter o texto de um versículo;
- pesquisar texto bíblico pela API.

O README define tipos chamados `Bible Book List`, `Bible Book Info` e
`Verse Reference`, mas nenhuma ação da lista pública retorna esses tipos.
Eles não constituem endpoints e não devem ser tratados como contrato externo.

Consequência: o fallback local de topologia bíblica continua necessário para
a navegação da interface, enquanto as versões podem futuramente vir de
`GetBibleVersionsV2`. O texto bíblico continua fora do projeto.

## Ações confirmadas para músicas e louvor

| Ação | Versão mínima | Uso confirmado |
| --- | --- | --- |
| `GetSongs` | 2.21.0 | Lista músicas do repertório |
| `GetSong` / `GetLyrics` | 2.19.0 | Obtém uma música por ID |
| `SearchSong` / `SearchLyrics` | 2.19.0 | Pesquisa título, artista, nota ou letra |
| `ShowSong` / `ShowLyrics` | 2.19.0 | Inicia apresentação de uma música |
| `GetSongPlaylist` | 2.19.0 | Lista a playlist de músicas |
| `AddSongsToPlaylist` | 2.19.0 | Adiciona músicas à playlist |
| `RemoveFromSongPlaylist` | 2.19.0 | Remove músicas da playlist |
| `GetMediaPlaylist` | 2.19.0 | Lista itens da playlist de mídia |
| `MediaPlaylistAction` | 2.19.0 | Executa um item da playlist de mídia |
| `ShowNextSongPlaylist` | 2.22.0 | Executa a próxima música da playlist |
| `ShowPreviousSongPlaylist` | 2.22.0 | Executa a música anterior da playlist |
| `ActionNext` / `ActionPrevious` | 2.19.0 | Navega slides da apresentação |
| `ActionGoToIndex` | 2.19.0 | Vai para um slide por índice |
| `ActionGoToSlideDescription` | 2.19.0 | Vai para verso, coro ou outra descrição |
| `CloseCurrentPresentation` | 2.19.0 | Encerra a apresentação |

Também há ações documentadas para player de mídia, favoritos, agendas,
histórico, grupos de músicas e playlists salvas.

Algumas mutações administrativas, como criar, editar ou apagar itens, alterar
grupos e selecionar agenda, exigem assinatura Holyrics Plan e permissões
avançadas. As ações básicas de consulta e apresentação acima não estão
marcadas com essa exigência na documentação consultada.

## Status e health check

Não foi encontrado endpoint anônimo chamado `health`, `ping` ou equivalente.

Ações úteis:

- `GetTokenInfo` (2.25.0): confirma token, versão e permissões;
- `CheckPermissions` (2.25.0): valida as ações concedidas;
- `GetVersion` (2.22.0): identifica versão e plataforma do Holyrics;
- `GetAPIServerInfo` (2.26.0): informa ativação local/remota, porta e IPs.

Recomendação futura:

1. usar `Auth` e o fluxo de hash;
2. chamar `GetTokenInfo` para readiness autenticado;
3. validar as permissões mínimas com `CheckPermissions`;
4. usar `GetVersion` para registrar capacidade por versão.

O probe legado `GET /` foi substituído na Phase 5.5 por chamadas autenticadas
a `GetTokenInfo`, `CheckPermissions`, `GetVersion` e `GetAPIServerInfo`.

## Outros mecanismos oficiais

### Aplicativo móvel

O app oficial controla músicas, versículos, mídias e player na rede local. A
FAQ menciona descoberta automática, QR Code, diagnóstico `PING` e endereço de
webservice.

O protocolo usado pelo app não está publicado como API para terceiros.
Portanto, ele confirma a capacidade do produto, mas não deve ser
reverse-engineered nem usado como contrato deste projeto.

### Plugin Holyrics

O plugin habilita um servidor HTTP para expor o conteúdo de projeção ou stage
view a navegadores e softwares de transmissão. É necessário iniciar o servidor
do plugin e lidar com firewall e isolamento da rede.

Esse servidor é para visualização de saída. Não foi documentado como API de
controle e não substitui o API Server.

### Holyrics Script e JSLib

Scripts JavaScript são executados dentro do Holyrics. A JSLib oficial expõe
ações internas e permite criar rotas customizadas no API Server.

Rotas customizadas aumentam acoplamento operacional e exigem instalação e
manutenção de script no computador do Holyrics. Devem ser último recurso; as
ações padrão cobrem os controles necessários atualmente conhecidos.

### API Item

API Item faz o Holyrics enviar HTTP, MIDI ou comandos para outros sistemas,
além de executar scripts internos. É um mecanismo de saída e automação.

Pode ser útil futuramente para notificar o NestJS sobre gatilhos do Holyrics,
mas não é uma API de entrada para controlar o programa.

### MIDI

MIDI é um mecanismo oficial de entrada que associa notas e eventos a ações do
Holyrics. É adequado para instrumentos, controladores e automação de playback,
mas exige configuração MIDI e oferece um contrato menos expressivo que o API
Server para este projeto.

### WebSocket

Não foi encontrado servidor WebSocket oficial de entrada do Holyrics. A
documentação cita WebSocket ao configurar o Holyrics como cliente de outros
sistemas, como OBS Studio. Isso não significa que o Holyrics exponha uma API
WebSocket.

## Endpoints e hipóteses descartados

- `GET /` como health check oficial: não documentado e não identifica o
  Holyrics;
- links HTTP do Plugin como API de controle: documentados apenas para saída e
  stage view;
- protocolo do aplicativo móvel: oficial para o app, mas não publicado para
  terceiros;
- API Item como API de entrada: direção inversa, do Holyrics para outros
  sistemas;
- WebSocket do OBS como WebSocket do Holyrics: o Holyrics atua como cliente;
- tipos `Bible Book List` e `Verse Reference` como endpoints: não há ações
  públicas associadas;
- endpoints especulativos para livros, capítulos ou texto bíblico: não
  documentados.

## Limitações e riscos

- a API local não oferece TLS;
- token em query string pode aparecer em logs, histórico ou ferramentas de
  diagnóstico;
- o token é armazenado localmente em SQLite sem criptografia;
- ações variam por versão do Holyrics;
- cada token depende de permissões configuradas manualmente;
- não há push oficial documentado para mudanças de estado;
- `GetCurrentPresentation` não retorna slides de apresentações bíblicas;
- listagem estrutural e texto bíblico não são expostos;
- alterar `BibleSettings` afeta estado global do Holyrics;
- a API remota depende de internet e do dispositivo conectado;
- rotas JavaScript customizadas ampliam manutenção e risco de divergência.

## Recomendações arquiteturais

### Integração HTTP implementada na Phase 5.5

Foi criado dentro do `HolyricsModule`:

- cliente do API Server substituindo o probe legado;
- DTO comum `{ status, data, error }`;
- validação de permissões com `CheckPermissions`;
- erros distintos para indisponibilidade, autenticação, permissão, versão
  incompatível e timeout;
- sanitização de logs para segredos.

Não expor detalhes do contrato do Holyrics ao `BibleModule`, frontend ou
futuro `CommandModule`.

Nesta fase foi adotado o token direto, por ser a opção oficial mais simples.
O fluxo com nonce, `sid`, `rid` e `dtoken` permanece recomendado para evolução
posterior.

### Futura Phase 6

A Phase 6 deve manter WebSocket somente entre o NestJS e os navegadores.

Para refletir estado do Holyrics:

- conexão: polling moderado de uma ação autenticada, preferencialmente
  `GetTokenInfo`;
- apresentação: polling de `GetCurrentPresentation` quando necessário;
- mudanças iniciadas pelo próprio projeto: emitir eventos internos após a
  confirmação da chamada HTTP;
- mudanças externas no Holyrics: avaliar posteriormente gatilhos/API Item
  enviando HTTP ao NestJS, sem criar um WebSocket fictício.

Essa pesquisa não inicia nem altera o escopo funcional da Phase 6.

## Dúvidas restantes

- comportamento exato de CORS para chamadas de navegador;
- limites de taxa e concorrência do servidor local;
- duração e expiração de sessões `Auth`;
- persistência do `rid` em reconexões;
- códigos HTTP usados além do envelope JSON;
- configuração padrão de bind e interfaces de rede;
- compatibilidade real das ações em instalações anteriores a 2.25.0;
- disponibilidade das ações básicas em cada modalidade do Holyrics Plan.

Essas dúvidas devem ser validadas em uma instalação real, usando um ambiente
de teste e um token com permissões mínimas, antes da implementação produtiva.
