# Interpretador de comandos

## Escopo das Phases 8, 8.5 e 9.6

O `CommandModule` transforma texto em comandos estruturados de forma local,
determinística e sem dependência de internet.

O parser e o normalizador não:

- executam comandos;
- chamam o Holyrics;
- alteram a passagem exibida;
- alteram o `BibleModule`;
- acessam a interface do pregador;
- usam IA generativa, LLM ou NLP externo.

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
CommandIntentGuardService
        ↓
COMMAND_IDENTIFIED
        ↓ execute
BibleNavigationService
```

Somente transcrições finais são interpretadas. Transcrições parciais continuam
disponíveis como diagnóstico, mas não geram comandos.

Na Phase 8.5, o texto final passa primeiro pelo `NumberNormalizerService`. O
serviço devolve somente texto e não conhece intents, comandos estruturados,
BibleModule ou Holyrics.

Na Phase 9.6, o parser também consegue extrair uma referência válida de uma
frase completa. A extração apenas identifica o comando; o
`CommandIntentGuardService` decide se a intenção permite navegar.

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
  "command": {
    "type": "BIBLE_REFERENCE",
    "book": "joao",
    "chapter": 3,
    "verse": 16
  },
  "confidence": 1,
  "intentDecision": "execute",
  "intentReason": "explicit_action"
}
```

O comando interno continua usando `BIBLE_REFERENCE`. Referência somente de
livro:

```json
{
  "type": "BIBLE_REFERENCE",
  "book": "genesis",
  "chapter": null,
  "verse": null
}
```

Referência de capítulo:

```json
{
  "type": "BIBLE_REFERENCE",
  "book": "joao",
  "chapter": 3,
  "verse": 1
}
```

```json
{ "type": "NEXT_VERSE" }
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

Comandos relativos diretos são reconhecidos integralmente. Em frases maiores,
somente expressões relativas específicas, como `versículo anterior`, são
extraídas para que o guard possa bloqueá-las. Expressões comuns como
`o próximo irmão` e `a próxima pessoa` permanecem `UNKNOWN`.

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

O `POST` representa o mesmo fluxo de uma transcrição final. Ele só navega
quando o guard retorna `execute`.

O status contém a última transcrição original e
`lastNormalizedTranscription`. A tela `/settings` mostra ambos separadamente.

## Guard de intenção

O guard recebe a transcrição original, a normalizada e o comando identificado.
Ele retorna:

```json
{
  "decision": "execute",
  "reason": "explicit_action"
}
```

Decisões:

- `execute`: encaminha ao `BibleNavigationService`;
- `ignore`: emite somente `COMMAND_IDENTIFIED`.

Motivos:

- `explicit_action`;
- `casual_reference`;
- `relative_reference_context`;
- `unknown_or_unsafe`.

No modo `conservative`, referências bíblicas exigem uma expressão de ação
determinística, como `vamos para`, `abra em`, `mostre`, `coloque`, `projete`,
`vamos ler` ou `agora em`.

No modo `fast`, uma referência direta como `Apocalipse 12 13` também executa.
Frases claramente casuais continuam bloqueadas nos dois modos.

Exemplos executados:

```text
agora vamos para Apocalipse 12 13
abra em João 3 16
mostre Salmos 23 1
próximo versículo
```

Exemplos ignorados:

```text
Apocalipse 12 13                 # modo conservador
como vimos em Apocalipse 12 13
segundo Apocalipse 12 13
no próximo versículo veremos
o próximo irmão pode vir
```

`voiceCommandMode` é persistido nas configurações locais. O valor padrão é
`conservative`; o outro valor aceito é `fast`.

## Números suportados

- cardinais de zero a cento e cinquenta;
- `um`/`uma` e `dois`/`duas`;
- dezenas e composições com `e`;
- `cem`, `cento` e composições até `cento e cinquenta`;
- ordinais de primeiro/primeira até décimo/décima.

Livros numerados são normalizados no texto, mas continuam sendo resolvidos
pelos aliases existentes do BibleModule. Nenhuma lista bíblica foi duplicada.

## Evento

`COMMAND_IDENTIFIED` transmite `command`, `confidence`, `intentDecision` e
`intentReason`. O payload não inclui a transcrição, áudio, configurações,
token ou dados de conexão do Holyrics.

Somente decisões `execute` seguem para o `BibleNavigationService`. Uma decisão
`ignore` não emite `BIBLE_CHANGED` e não aciona o Holyrics.
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
- o guard é determinístico e não compreende contexto livre como uma IA;
- novas formas de pedir uma passagem precisam ser adicionadas explicitamente.
