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

Isso é intencional. A documentação oficial pública do Holyrics consultada em
20 de junho de 2026 demonstra recursos bíblicos no programa, mas não publica
um contrato HTTP para listar versões, livros, capítulos ou versículos.

Fontes oficiais consultadas:

- https://holyrics.com.br/
- https://holyrics.com.br/tutorial.html
- https://holyrics.com.br/tips/api_item.html
- https://holyrics.com.br/tips/quick_verse_presentation.html

A página "API Item" documenta automações em que o Holyrics envia ações para
outros sistemas. Ela não documenta uma API de leitura dos dados bíblicos.

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
Quando uma API oficial do Holyrics estiver disponível, o provider local deverá
ser substituído para que a topologia reflita a versão realmente instalada.

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

Não existem endpoints para alterar esse contexto na Phase 4. Navegação,
preferência por dispositivo e envio ao Holyrics pertencem às fases seguintes.

## Substituição futura

Uma integração futura deve implementar a interface:

```txt
BibleContentProvider
```

O `BibleService`, os aliases e os endpoints não devem depender de detalhes do
provider Holyrics.
