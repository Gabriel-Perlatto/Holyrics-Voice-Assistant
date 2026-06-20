# Motor de navegação bíblica

## Escopo da Phase 9

O `BibleNavigationService` aplica comandos estruturados ao contexto bíblico
local. Na Phase 9.5, ele solicita projeção através do
`HolyricsBibleProjectionService`; não monta URLs nem conhece o contrato HTTP.
Na Phase 9.6, comandos de voz só chegam ao serviço quando o guard retorna
`execute`.

```text
TRANSCRIPTION_RECEIVED
        ↓
NumberNormalizerService
        ↓
CommandService
        ↓
CommandIntentGuardService
        ↓
COMMAND_IDENTIFIED
        ↓ execute
BibleNavigationService
        ↓
HolyricsBibleProjectionService
        ↓
BIBLE_CHANGED
```

Quando a decisão é `ignore`, o fluxo termina após `COMMAND_IDENTIFIED`:

```text
COMMAND_IDENTIFIED (ignore)
        ↓
sem BIBLE_CHANGED
sem ShowVerse
```

`COMMAND_EXECUTED` não é emitido.

## Contexto e regras

O serviço reutiliza `BibleContextService` e mantém versão, livro, capítulo e
versículo em memória.

- livro isolado inicia em 1:1;
- livro e capítulo usam versículo 1;
- próximo/anterior atravessam limites de capítulo;
- comandos de capítulo reiniciam no versículo 1;
- limites de livro seguem para o livro adjacente;
- Gênesis 1:1 e Apocalipse 22:21 são limites absolutos;
- comandos relativos sem contexto são ignorados com segurança.

Todos os limites usam `BibleContentProvider`; nenhum dado bíblico foi
duplicado. O contexto local é atualizado antes da tentativa de projeção e não
é desfeito se o Holyrics falhar.

O guard não faz parte do fluxo manual. `POST /api/bible/selection` continua
atualizando o contexto, emitindo `BIBLE_CHANGED` com `source: "manual"` e
tentando projetar normalmente.

## Evento

```json
{
  "book": "joao",
  "chapter": 3,
  "verse": 16,
  "version": "NVI",
  "source": "voice",
  "delivery": "holyrics",
  "deliveredToHolyrics": true
}
```

`source` pode ser `voice` ou `manual`. `delivery` pode ser `holyrics`,
`local-only` ou `failed`.

## Diagnóstico

`GET /api/bible/navigation/status` retorna contexto, referência formatada e
último comando aplicado. `/settings` exibe essas informações como somente
leitura.

## Interface do pregador

`/preacher` já escuta `BIBLE_CHANGED`. Ao receber o evento, carrega capítulos
e versículos pelos endpoints existentes e mostra a seleção sem exigir clique.

## Limitações

- contexto não persiste após reiniciar;
- comandos relativos precisam de contexto válido;
- limites absolutos não emitem mudanças redundantes;
- a versão local é enviada como abreviação, mas precisa existir na instalação
  do Holyrics;
- não há confirmação posterior de qual versão ficou visível;
- não existem funcionalidades de louvor;
- o guard usa regras determinísticas e pode exigir novas expressões explícitas
  conforme o vocabulário real da igreja.
