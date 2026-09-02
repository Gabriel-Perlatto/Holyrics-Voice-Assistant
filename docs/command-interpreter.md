# Interpretador de comandos

## Escopo das Phases 8, 8.5, 9.6, 9.8, 9.9, 9.10, 9.11, 9.12 e 9.13

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
BookNameCorrectionService
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
`TranscriptionCorrectionService`, antes do parser. Na Phase 9.11, o
`BookNameCorrectionService` roda logo depois, também antes do parser.

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

## Correção de nomes de livros (Phase 9.11)

O `BookNameCorrectionService` estende a mesma ideia da correção de
transcrição para nomes de livros bíblicos (ex.: "apocaliste" → "apocalipse").
O vocabulário vem exclusivamente de `book.id` — o identificador estável que o
`PtBrCommandParser` já aceita como alias válido para todo livro — dividido
em palavras e sem o prefixo numérico dos livros numerados. Nenhuma lista
bíblica é duplicada.

Esse serviço é deliberadamente mais conservador que o de palavras-chave, por
dois motivos:

1. **Livros parecidos**: uma correção errada entre livros (ex.: "Atos" e
   "Amós") troca o texto que vai para a tela — um erro mais visível e mais
   caro do que simplesmente não reconhecer o comando. Por isso a distância
   aceita é menor (1 para palavras de até 5 letras, 2 para maiores) e uma
   palavra igualmente próxima de dois livros nunca é corrigida.
2. **Colisão com palavras comuns**: nomes curtos de livros ficam a poucas
   edições de palavras comuns do português — em testes, "vamos" ficou a uma
   edição de "Amós", e "perdão" de "Pedro". Corrigir "vamos" romperia a
   própria frase de gatilho. Por isso a correção só é tentada quando a
   palavra é **seguida por um número** — como uma referência bíblica real
   quase sempre aparece ("apocaliste 12 13", "2 petro 1"). Uma palavra comum
   no meio de uma frase qualquer nunca é seguida de um número, então nunca é
   candidata.

```text
vamos para apocaliste 12 13   →  vamos para apocalipse 12 13
vamos para 2 petro 1          →  vamos para 2 pedro 1
o amor de Deus é grande       →  inalterado (não há número depois de "amor")
```

Limitação residual documentada: se uma palavra comum vier, por coincidência,
imediatamente antes de um número falado por outro motivo, a correção ainda
pode ocorrer. Essa é uma troca deliberada — o risco remanescente é bem menor
do que tentar corrigir qualquer palavra em qualquer posição da frase.

Uma referência de livro isolado, sem capítulo nem versículo, não é coberta
por este serviço, já que não há número para confirmar a posição.

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
4. Sem nenhum sinal acima, uma referência **direta** — quando a frase inteira,
   sem mais nada, já é a referência bíblica (ex.: `Apocalipse 12 13`) —
   sempre executa. Esse é o único comportamento desde a Phase 9.13 (ver
   [Remoção do modo conservador](#remoção-do-modo-conservador-phase-913));
   uma referência **embutida** numa frase maior, sem nenhum verbo de ação
   antes dela, continua sem executar de imediato — ali entra a
   [confirmação por repetição](#repetição-como-confirmação-phase-99).

Livros que começam com "2" no nome (2 Pedro, 2 João, 2 Samuel, 2 Reis,
2 Crônicas, 2 Coríntios, 2 Tessalonicenses, 2 Timóteo) são uma exceção
explícita ao marcador de citação `segundo`/`2`, para não bloquear uma
referência direta a esses livros.

Cada regra é uma lista curta e plana de expressões — ao contrário do
treinamento por exemplos da Phase 9.7, adicionar cobertura para uma frase nova
não exige repetir a combinação para cada livro da Bíblia.

Uma referência direta, como `Apocalipse 12 13` dita sozinha, sempre executa —
não é preciso nenhum verbo de ação antes dela. Frases claramente casuais
continuam bloqueadas mesmo assim.

Exemplos executados:

```text
agora vamos para Apocalipse 12 13
vamos parar Êxodo 1
acompanhe comigo em Filipenses 4
abra em João 3 16
mostre Salmos 23 1
próximo versículo
Apocalipse 12 13
```

Exemplos ignorados:

```text
como vimos em Apocalipse 12 13
segundo Apocalipse 12 13
no próximo versículo veremos
não podemos fazer isso com o próximo
o próximo irmão pode vir
```

## Repetição como confirmação (Phase 9.9)

Quando o pregador tenta navegar e o sistema não reconhece a ação — uma
referência **embutida** numa frase maior, sem nenhum verbo de ação antes
dela, ex.: "sabe aquele texto Apocalipse 12 13" —, o comportamento natural é
repetir a mesma referência. Desde a Phase 9.13, uma referência **direta**
(a frase inteira é só a referência) já executa de imediato e nunca chega a
precisar dessa confirmação. O `CommandRepetitionService` guarda a última
referência ignorada por essa razão
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

## Palavra de ativação (Phase 9.10)

Além dos verbos de ação da Phase 9.8 ("vamos para", "abra em"...), o guard
aceita uma palavra de ativação dedicada e configurável
(`voiceActivationWord`, padrão `sistema`). Quando ela aparece em qualquer
lugar da frase, a referência identificada executa imediatamente — com
prioridade sobre marcadores de citação casual e sobre negação — mesmo sem
nenhum dos verbos de ação já reconhecidos. Isso importa sobretudo para uma
referência **embutida** numa frase maior (que, sem a palavra de ativação,
dependeria de um verbo de ação ou da confirmação por repetição); uma
referência **direta** já executa de qualquer forma desde a Phase 9.13.

```text
sistema Apocalipse 12 13          # executa
sistema, como vimos em João 3 16  # executa mesmo assim: a palavra de
                                   # ativação é o sinal mais forte que existe
```

A palavra é configurável em `/settings` e persistida em
`voiceActivationWord`. Um texto vazio desativa a checagem — nesse caso, o
guard cai de volta nos verbos de ação e na confirmação por repetição. A
comparação ignora acentuação e maiúsculas/minúsculas, mas exige a palavra
inteira (`sistema` não confunde com `sistemas`).

Diferente do `CommandIntentSignalsService`, que reconhece frases inteiras
específicas, a palavra de ativação é um único termo livre, escolhido pela
igreja — não precisa ser "sistema"; pode ser qualquer palavra que o pregador
não usaria naturalmente no meio de uma pregação.

## Junção de borda entre segmentos (Phase 9.12)

Em fala contínua e sem pausas, um comando pode ficar partido entre o fim de
um segmento de transcrição e o início do próximo — seja por um corte natural
do Vosk, seja pelo corte proativo do `VoskSpeechProvider` (ver
[`docs/speech-providers.md`](speech-providers.md#corte-proativo-de-segmento-phase-912)).
Isso cobre dois casos:

```text
"vamos abrir em"           | "apocalipse 12 13"
"vamos para apocalipse"    | "capítulo 12 13"
```

No primeiro, o segmento atual sozinho já forma uma referência válida, mas
sem o verbo de ação que ficou no segmento anterior. No segundo, o segmento
atual sozinho nem forma uma referência (falta o livro). Nos dois casos, o
guard, avaliado isoladamente, retorna `unknown_or_unsafe`.

Quando isso acontece — e o segmento anterior **não** resultou em execução —,
o `CommandService` tenta de novo com as últimas até 8 palavras do segmento
anterior coladas na frente do segmento atual, refazendo toda a correção de
transcrição e o parser sobre o texto combinado. Se essa combinação resultar
em `execute`, ela é usada; caso contrário, o resultado isolado do segmento
atual prevalece.

Duas salvaguardas:

- **Um segmento já executado nunca vira isca de junção.** Se o segmento
  anterior já executou um comando, ele não é reaproveitado — combinar seu
  texto com um segmento novo poderia reconstruir e reexecutar a mesma
  referência por coincidência com palavras soltas do segmento seguinte.
- **A avaliação da junção não grava estado de repetição.** O
  `CommandIntentGuardService.decide()` aceita um parâmetro `record` para
  decisões exploratórias; a tentativa de junção usa `record: false`, e só a
  decisão final (isolada ou combinada, o que executar) é gravada de verdade.
  Isso evita que uma tentativa de junção descartada "roube" a memória de
  repetição do segmento isolado.

O diagnóstico em `/settings` sempre mostra a transcrição normalizada do
**segmento isolado**, nunca o texto combinado — a junção só afeta a decisão
de executar, não o que é exibido como última transcrição.

## Remoção do modo conservador (Phase 9.13)

As Phases 9.6 a 9.12 mantinham dois modos configuráveis
(`voiceCommandMode`): `conservative`, que bloqueava uma referência direta
sem verbo de ação, e `fast`, que a executava de imediato. Na prática, o modo
`conservative` só adicionava uma etapa extra (dizer "vamos para" antes de
toda referência) sem ganho real de segurança — frases claramente casuais já
são bloqueadas pelo `CommandIntentSignalsService` independentemente de
qualquer modo. A Phase 9.13 removeu a escolha: o comportamento do antigo
modo `fast` passou a ser o único e sempre ativo.

O que muda em relação às Phases anteriores:

- uma referência **direta** (a frase inteira é a referência, ex.:
  `Apocalipse 12 13`) sempre executa, sem precisar de nenhum verbo de ação;
- a confirmação por repetição (Phase 9.9) e a junção de borda (Phase 9.12)
  continuam existindo, mas agora só entram em jogo para uma referência
  **embutida** numa frase maior sem verbo de ação — o caso de uma referência
  direta nunca mais chega a precisar delas;
- `voiceCommandMode` foi removido de `Settings`, do DTO de atualização, do
  evento `SETTINGS_UPDATED` e do formulário em `/settings`. A coluna
  `voice_command_mode` permanece no SQLite (sem uso) para não exigir uma
  migração destrutiva; bancos existentes não perdem dados.
- `CommandIntentGuardService.decide()` não recebe mais um parâmetro de modo.

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
- a correção de transcrição (palavras-chave) e a de nomes de livros cobrem
  vocabulários fechados pequenos e conservadores — ver
  [Correção de nomes de livros](#correção-de-nomes-de-livros-phase-911);
- a junção de borda entre segmentos (Phase 9.12) olha no máximo 8 palavras
  do fim do segmento anterior, só é tentada quando o segmento isolado dá
  `unknown_or_unsafe`, e nunca reaproveita um segmento que já executou;
- desde a Phase 9.13, não há modo configurável: uma referência direta
  sempre executa. Não há mais uma opção mais "cautelosa" para quem prefira
  exigir um verbo de ação mesmo em referências ditas sozinhas;
- novas formas recorrentes de pedir ou mencionar uma passagem devem ser
  adicionadas às listas de `CommandIntentSignalsService`; novas confusões de
  transcrição devem ser adicionadas ao mapa do
  `TranscriptionCorrectionService`.
