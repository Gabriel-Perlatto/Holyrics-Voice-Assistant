# Interpretador de comandos

## Escopo das Phases 8 e 8.5

O `CommandModule` transforma texto em comandos estruturados de forma local,
determinística e sem dependência de internet.

Ele não:

- executa comandos;
- chama o Holyrics;
- altera a passagem exibida;
- altera o `BibleModule`;
- acessa a interface do pregador;
- usa IA generativa, LLM ou NLP externo.

## Fluxo

```text
TRANSCRIPTION_RECEIVED
        ↓
NumberNormalizerService
        ↓
CommandService
        ↓
PtBrCommandParser
        ↓
StructuredCommand
        ↓
COMMAND_IDENTIFIED
```

Somente transcrições finais são interpretadas. Transcrições parciais continuam
disponíveis como diagnóstico, mas não geram comandos.

Na Phase 8.5, o texto final passa primeiro pelo `NumberNormalizerService`. O
serviço devolve somente texto e não conhece intents, comandos estruturados,
BibleModule ou Holyrics.

## Comandos suportados

- `BIBLE_REFERENCE`;
- `NEXT_VERSE`;
- `PREVIOUS_VERSE`;
- `NEXT_CHAPTER`;
- `PREVIOUS_CHAPTER`;
- `UNKNOWN`.

Exemplos:

```json
{
  "type": "BIBLE_REFERENCE",
  "book": "joao",
  "chapter": 3,
  "verse": 16,
  "confidence": 1
}
```

Referência somente de livro:

```json
{
  "type": "BIBLE_REFERENCE",
  "book": "genesis",
  "chapter": null,
  "verse": null,
  "confidence": 1
}
```

Referência de capítulo:

```json
{
  "type": "BIBLE_REFERENCE",
  "book": "joao",
  "chapter": 3,
  "verse": 1,
  "confidence": 1
}
```

```json
{
  "type": "NEXT_VERSE",
  "confidence": 1
}
```

Entradas não reconhecidas retornam `UNKNOWN` com confiança zero e não lançam
erro por conteúdo inválido.

## Sintaxe determinística

Referências aceitas podem possuir somente livro ou livro, capítulo e
versículo. Quando a entrada contém livro e capítulo sem versículo explícito,
o parser assume o versículo 1:

```text
Gênesis
Gênesis capítulo 1
João 3
João 3 16
João 3:16
João capítulo 3 versículo 16
1 Co 13 4
```

O normalizador permite também:

```text
Gênesis capítulo um
João capítulo três
João capítulo três versículo dezesseis
Primeira Coríntios capítulo dois versículo quatro
João três dezesseis
```

Essas entradas chegam ao parser como:

```text
Gênesis capítulo 1
João capítulo 3
João capítulo 3 versículo 16
1 Coríntios capítulo 2 versículo 4
João 3 16
```

Os nomes, abreviações e aliases são lidos de
`src/modules/bible/data/pt-BR/books.ts`. Nenhuma segunda lista de livros foi
criada no `CommandModule`.

Comandos de navegação são reconhecidos somente quando a transcrição normalizada
corresponde integralmente a uma expressão suportada. Isso evita casos simples
como `o próximo irmão`.

Expressões suportadas:

- próximo, próximo versículo, versículo seguinte;
- anterior, voltar, versículo anterior;
- próximo capítulo, capítulo seguinte;
- capítulo anterior.

## Contexto

O `CommandContextService` mantém em memória o último livro, capítulo e
versículo identificados. Livro isolado mantém capítulo e versículo nulos.
Livro com capítulo registra versículo 1. Esse contexto existe apenas como
preparação para uma fase futura. Ele não atualiza o contexto do `BibleModule`
e não navega.

## API de diagnóstico

```text
GET  /api/commands/status
POST /api/commands/interpret
```

O `POST` recebe:

```json
{
  "text": "João 3 16"
}
```

Os dois endpoints interpretam ou consultam estado; nenhum executa ações.

O status contém a última transcrição original e
`lastNormalizedTranscription`. A tela `/settings` mostra ambos separadamente.

## Números suportados

- cardinais de zero a cento e cinquenta;
- `um`/`uma` e `dois`/`duas`;
- dezenas e composições com `e`;
- `cem`, `cento` e composições até `cento e cinquenta`;
- ordinais de primeiro/primeira até décimo/décima.

Livros numerados são normalizados no texto, mas continuam sendo resolvidos
pelos aliases existentes do BibleModule. Nenhuma lista bíblica foi duplicada.

## Evento

`COMMAND_IDENTIFIED` transmite o comando estruturado e a confiança. O payload
não inclui a transcrição, áudio, configurações ou dados do Holyrics.

Na Phase 9, o comando identificado segue para o `BibleNavigationService`, que
pode atualizar o contexto local e emitir `BIBLE_CHANGED`.
`COMMAND_EXECUTED` não é emitido.

## Limitações

- números acima de cento e cinquenta não são normalizados;
- ordinais compostos não são normalizados;
- números negativos são preservados;
- números decimais não são tratados como uma unidade numérica;
- não há referência de capítulo sem livro;
- não há intervalos de versículos;
- não há composição de múltiplos comandos;
- o contexto fica somente em memória;
- a navegação não controla ou envia dados ao Holyrics.
