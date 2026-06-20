# Motor de navegação bíblica

## Escopo da Phase 9

O `BibleNavigationService` aplica comandos estruturados ao contexto bíblico
local. Ele não acessa o Holyrics, não controla apresentações e não persiste
estado em banco.

```text
TRANSCRIPTION_RECEIVED
        ↓
NumberNormalizerService
        ↓
CommandService
        ↓
COMMAND_IDENTIFIED
        ↓
BibleNavigationService
        ↓
BIBLE_CHANGED
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
duplicado.

## Evento

```json
{
  "book": {
    "id": "joao",
    "name": "João"
  },
  "chapter": 3,
  "verse": 16,
  "version": "nvi",
  "source": "local-fallback",
  "delivery": "local-only",
  "deliveredToHolyrics": false
}
```

O payload declara explicitamente que nenhuma entrega ao Holyrics ocorreu.

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
- não existe controle do Holyrics;
- não existem funcionalidades de louvor.
