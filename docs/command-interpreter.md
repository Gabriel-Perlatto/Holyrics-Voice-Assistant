# Interpretador de comandos

## Escopo da Phase 8

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

```json
{
  "type": "NEXT_VERSE",
  "confidence": 1
}
```

Entradas não reconhecidas retornam `UNKNOWN` com confiança zero e não lançam
erro por conteúdo inválido.

## Sintaxe determinística

Referências aceitas possuem livro, capítulo e versículo numéricos:

```text
João 3 16
João 3:16
João capítulo 3 versículo 16
1 Co 13 4
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
versículo identificados. Esse contexto existe apenas como preparação para uma
fase futura. Ele não atualiza o contexto do `BibleModule` e não navega.

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

## Evento

`COMMAND_IDENTIFIED` transmite o comando estruturado e a confiança. O payload
não inclui a transcrição, áudio, configurações ou dados do Holyrics.

`COMMAND_EXECUTED` não é emitido na Phase 8.

## Limitações

- números por extenso não são interpretados;
- não há referência somente de livro ou somente de capítulo;
- não há intervalos de versículos;
- não há composição de múltiplos comandos;
- o contexto fica somente em memória e não é usado para navegação;
- não existe execução automática.
