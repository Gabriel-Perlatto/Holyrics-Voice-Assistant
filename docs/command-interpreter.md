# Interpretador de comandos

## Escopo das Phases 8, 8.5, 9.6, 9.8 e 9.9

O `CommandModule` transforma texto em comandos estruturados de forma local,
sem dependência de internet.

O parser e o normalizador não:

- executam comandos;
- chamam o Holyrics;
- alteram a passagem exibida;
- alteram o `BibleModule`;
- acessam a interface do pregador;
- usam IA generativa, LLM ou modelo treinado.

A Phase 9.7 usou um classificador NLP.js treinado a partir de exemplos
versionados. Na prática, o conjunto de treinamento crescia a cada caso novo
sem generalizar de forma confiável, então a Phase 9.8 substituiu o
classificador por regras determinísticas explícitas (ver
[Guard de intenção](#guard-de-intenção)) e por uma correção de transcrição
baseada em vocabulário fechado (ver
[Correção de transcrição](#correção-de-transcrição)).

## Fluxo

```text
TRANSCRIPTION_RECEIVED
        ↓
NumberNormalizerService
        ↓
TranscriptionCorrectionService
        ↓
CommandService
        ↓
PtBrCommandParser
        ↓
StructuredCommand
        ↓
CommandIntentGuardService
        ↓
CommandIntentSignalsService (regras determinísticas)
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

Na Phase 9.8, o texto normalizado passa em seguida pelo
`TranscriptionCorrectionService`, antes do parser.

Na Phase 9.6, o parser também consegue extrair uma referência válida de uma
frase completa. A extração apenas identifica o comando. Na Phase 9.8, o
`CommandIntentGuardService` consulta o `CommandIntentSignalsService` para
decidir se a intenção permite navegar.

## Correção de transcrição

O `TranscriptionCorrectionService` corrige palavras do vocabulário fechado
relevante para o parser e para o guard (`capitulo`, `versiculo`, verbos de
ação como `vamos`/`abra`/`mostre`/`coloque`/`projete`, marcadores de citação
como `como`/`vimos`/`segundo`, negações `nao`/`sem`). Nomes de livros ficam de
fora de propósito, por serem muitos e mais arriscados de corrigir errado.

Duas camadas, nesta ordem:

1. **Confusões conhecidas**: um mapa explícito de palavras já observadas em
   testes reais, como `capeta` → `capitulo` (o Vosk transcreveu "capítulo"
   como "capeta" com um pregador de sotaque forte). Esse mapa deve crescer por
   observação direta — quando aparecer um novo caso, basta adicionar uma
   linha.
2. **Distância de edição genérica**: para desvios pequenos não cobertos pelo
   mapa (ex.: `versiculu` → `versiculo`), usa distância de Levenshtein com
   limiar curto (1 para palavras de até 5 letras, 2 para palavras maiores) e
   só corrige quando existe exatamente uma palavra do vocabulário mais
   próxima. Uma palavra já correta (incluindo com acento) nunca é alterada.

O serviço não conhece intents, comandos estruturados ou o BibleModule; devolve
apenas texto corrigido, como o `NumberNormalizerService`.

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
- `unknown_or_unsafe`;
- `repeated_reference` (Phase 9.9, ver [Repetição como confirmação](#repetição-como-confirmação-phase-99)).

O guard usa o `CommandIntentSignalsService`, que aplica regras determinísticas
e explícitas em vez de um modelo treinado:

1. **Marcadores de citação/menção casual** (`como vimos em`, `segundo`,
   `lá em`, `lembra de`, `faz referência a`, entre outros): presença de
   qualquer um bloqueia a execução, não importa o resto da frase.
2. **Verbos/expressões de ação** (`vamos para/pra/ao/abrir/ler`, `abra`,
   `mostre`, `coloque`, `projete`, `volta para`, `acompanhe`, `agora em`,
   entre outros): só contam quando aparecem **antes** da referência bíblica
   na frase. A mesma palavra depois da referência ("o versículo anterior
   **mostra**...") é narrativa, não comando.
3. **Negação** (`não`, `sem`): se aparecer junto com um verbo de ação antes da
   referência, a frase é tratada como casual em vez de executada (`não vamos
   abrir Romanos 8 agora`).
4. Sem nenhum sinal acima, o guard cai no comportamento por modo já existente
   desde a Phase 9.6 (ver abaixo).

Livros que começam com "2" no nome (2 Pedro, 2 João, 2 Samuel, 2 Reis,
2 Crônicas, 2 Coríntios, 2 Tessalonicenses, 2 Timóteo) são uma exceção
explícita ao marcador de citação `segundo`/`2`, para não bloquear uma
referência direta a esses livros.

Cada regra é uma lista curta e plana de expressões — ao contrário do
treinamento por exemplos da Phase 9.7, adicionar cobertura para uma frase nova
não exige repetir a combinação para cada livro da Bíblia.

No modo `conservative`, referências bíblicas diretas, como
`Apocalipse 12 13`, continuam bloqueadas quando nenhum verbo de ação é
identificado. No modo `fast`, uma referência direta como `Apocalipse 12 13`
também executa. Frases claramente casuais continuam bloqueadas nos dois
modos.

Exemplos executados:

```text
agora vamos para Apocalipse 12 13
vamos parar Êxodo 1
acompanhe comigo em Filipenses 4
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
não podemos fazer isso com o próximo
o próximo irmão pode vir
```

`voiceCommandMode` é persistido nas configurações locais. O valor padrão é
`conservative`; o outro valor aceito é `fast`.

## Repetição como confirmação (Phase 9.9)

Quando o pregador tenta navegar e o sistema não reconhece a ação (nenhum
verbo de ação identificado, ex.: apenas `Apocalipse 12 13` no modo
conservador), o comportamento natural é repetir a mesma referência. O
`CommandRepetitionService` guarda a última referência ignorada por essa razão
específica (`unknown_or_unsafe`) e, se a mesma referência — ou um refinamento
dela, como `Apocalipse 12` seguido de `Apocalipse 12 13` — for identificada de
novo em até 8 segundos, a segunda vez executa com o motivo
`repeated_reference`.

A confirmação por repetição:

- só se aplica a `BIBLE_REFERENCE`, não a comandos relativos;
- só considera a razão `unknown_or_unsafe`; uma referência bloqueada por
  `casual_reference` nunca é confirmada por repetição, mesmo que se repita;
- é esquecida assim que qualquer comando executa, ou quando uma referência
  diferente é ignorada em seguida;
- não interfere com uma citação casual dita entre as duas tentativas — a
  referência-alvo continua lembrada.

Isso não substitui um gatilho de voz nem exige um botão manual: é apenas o
reconhecimento de que, se o pregador já tentou uma vez e tenta de novo com a
mesma referência, a segunda tentativa já é a confirmação.

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
- as regras de intenção são explícitas e determinísticas: não compreendem
  frases fora dos marcadores e verbos já previstos, como uma IA faria;
- a correção de transcrição cobre um vocabulário fechado pequeno; nomes de
  livros não são corrigidos automaticamente;
- novas formas recorrentes de pedir ou mencionar uma passagem devem ser
  adicionadas às listas de `CommandIntentSignalsService`; novas confusões de
  transcrição devem ser adicionadas ao mapa do
  `TranscriptionCorrectionService`.
