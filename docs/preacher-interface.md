# Interface do pregador

## Escopo da Phase 5

A rota `/preacher` permite selecionar manualmente:

1. livro;
2. capítulo;
3. versículo.

A interface não contém texto bíblico, comandos de voz, WebSocket ou
sincronização entre dispositivos.

## Navegação

O frontend consome exclusivamente endpoints HTTP do `BibleModule`:

```txt
GET /api/bible/versions
GET /api/bible/books
GET /api/bible/books/:book/chapters
GET /api/bible/books/:book/chapters/:chapter/verses
POST /api/bible/selection
```

O frontend não importa dados internos do backend.

Para evitar listas contínuas como fluxo principal, a grade usa paginação:

- 12 livros;
- 20 capítulos;
- 24 versículos por página.

Os botões “Livros” e “Capítulos” retornam às etapas anteriores.

## Versão favorita

A versão escolhida é salva no navegador com a chave:

```txt
holyrics-voice-assistant.preacher.version
```

Ao abrir a página, a preferência é restaurada se ainda existir entre as
versões retornadas pela API. Caso contrário, a tela usa a versão atual
informada pelo backend.

Essa preferência é por navegador/dispositivo e não exige login.

## Seleção da passagem

Ao tocar em um versículo, o frontend envia:

```json
{
  "versionId": "nvi",
  "bookId": "joao",
  "chapter": 3,
  "verse": 16
}
```

O backend valida todos os campos e atualiza o contexto bíblico em memória.

## Limitação do Holyrics

Não existe endpoint oficial confirmado no projeto para apresentar remotamente
uma passagem. Portanto, o backend retorna:

```json
{
  "accepted": true,
  "delivery": "local-only",
  "deliveredToHolyrics": false
}
```

A interface mostra essa limitação de forma explícita. Nenhum sucesso de
projeção é simulado.
