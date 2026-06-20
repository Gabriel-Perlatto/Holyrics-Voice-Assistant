# Dados bíblicos da Phase 4

## Objetivo

O `BibleModule` fornece metadados suficientes para consultar:

- versões de referência;
- livros;
- capítulos;
- números de versículos.

Ele não fornece texto bíblico, não apresenta passagens e não altera o
Holyrics.

## Origem atual

Todas as respostas usam:

```json
{
  "source": "local-fallback",
  "fallback": true
}
```

Isso é intencional. A documentação oficial consultada em 20 de junho de 2026
publica `GetBibleVersionsV2` para versões instaladas, mas não publica ações
para listar livros, capítulos, números de versículos ou texto bíblico.

Fontes oficiais consultadas:

- https://holyrics.com.br/
- https://holyrics.com.br/tutorial.html
- https://holyrics.com.br/tips/api_item.html
- https://holyrics.com.br/tips/quick_verse_presentation.html
- https://github.com/holyrics/API-Server

A página "API Item" documenta automações em que o Holyrics envia ações para
outros sistemas. O contrato de entrada correto é o API Server. Consulte
`docs/holyrics-api-research.md`.

## Conteúdo do fallback

O fallback local contém:

- os 66 livros do cânon protestante;
- a topologia de capítulos e contagem de versículos;
- nomes, abreviações e aliases `pt-BR`;
- identificadores locais para ACF, ARC, NAA e NVI.

Os identificadores de versão são metadados para preparar seleção futura. Eles
não incluem texto, não confirmam disponibilidade no Holyrics e retornam
`contentAvailable: false`.

## Versificação

As contagens de capítulos e versículos seguem a topologia protestante usada
pelo projeto open source `bible-tools` 0.2.4, de George Andersen, sob licença
MIT. A atribuição está em `THIRD_PARTY_NOTICES.md`.

Algumas traduções ou tradições podem numerar versículos de forma diferente.
Como o API Server não expõe essa topologia, o provider local continuará
necessário mesmo quando as versões instaladas forem consultadas no Holyrics.

## Aliases

Aliases ficam em:

```txt
src/modules/bible/data/pt-BR/books.ts
```

A resolução não está em controllers e preserva diferenças relevantes, como:

- `Jó` → Jó;
- `Jo` → João.

## Contexto inicial

O contexto inicial é:

```json
{
  "versionId": "nvi",
  "bookId": null,
  "chapter": null,
  "verse": null
}
```

Na Phase 5, o contexto pode ser atualizado por uma seleção manual validada:

```http
POST /api/bible/selection
```

O contexto continua em memória e não é persistido. A preferência de versão do
pregador é separada e fica no navegador.

## Substituição futura

Uma integração futura deve manter a topologia local e obter as versões
instaladas por `GetBibleVersionsV2`, através do `HolyricsModule`. A composição
de fontes deve permanecer atrás da interface:

```txt
BibleContentProvider
```

O `BibleService`, os aliases e os endpoints não devem depender de detalhes do
provider Holyrics.
