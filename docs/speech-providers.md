# Speech providers e modelos locais

## Escopo atual

A Phase 7 implementa reconhecimento local de fala com Vosk. O sistema captura
áudio no computador do servidor, entrega PCM ao provider e publica texto
parcial ou final.

Não existe interpretação de comandos, intenção, referência bíblica, controle
do Holyrics ou lógica de louvor nesta fase.

## Estrutura de diretórios

O local oficial para modelos mantidos junto à instalação é:

```text
models/
├── pt-BR/
│   └── vosk-model-small-pt-0.3/
├── en-US/
│   └── nome-do-modelo/
└── README.md
```

Os diretórios de idioma usam códigos BCP 47 (`pt-BR`, `en-US`). O diretório do
modelo preserva preferencialmente o nome publicado pelo fornecedor, facilitando
identificar sua origem e versão.

## Como instalar um modelo

Não existe download ou cópia automática.

1. Obtenha o diretório completo do modelo por uma fonte confiável ou pelo
   projeto legado.
2. Copie-o manualmente para o diretório do idioma. Para o artefato legado
   citado no planejamento, o caminho recomendado é
   `models/pt-BR/vosk-model-small-pt-0.3`.
3. Abra `/settings`.
4. Informe o caminho relativo, por exemplo
   `models/pt-BR/vosk-model-small-pt-0.3`, e salve.
5. Confirme o status “Diretório encontrado”.

Também é possível reutilizar o modelo sem copiá-lo. Nesse caso, informe seu
caminho absoluto na tela. Caminhos relativos são resolvidos a partir da raiz
do projeto.

O SettingsModule confirma que o caminho é um diretório. Ao inicializar o
Speech Provider, a estrutura interna também é validada antes de carregar o
modelo.

## Modelos conhecidos

| Idioma | Modelo | Estado neste projeto |
| --- | --- | --- |
| `pt-BR` | `vosk-model-small-pt-0.3` | Carregamento real e ciclo de captura validados em 20 de junho de 2026 |
| `en-US` | Nenhum definido | Diretório reservado para suporte futuro |

O teste real confirmou inicialização, captura e parada. Não houve teste de fala
controlada nesta execução; portanto, precisão e qualidade da transcrição ainda
dependem de validação manual com o microfone da instalação.

## Adição de idiomas

Para preparar outro idioma:

1. crie `models/<código-BCP-47>/`;
2. adicione um `.gitkeep` caso o diretório vazio deva existir no repositório;
3. coloque o modelo manualmente dentro dele;
4. configure o caminho em `/settings`;
5. documente o modelo efetivamente validado quando houver um provider capaz de
   carregá-lo.

Os arquivos de modelo são ignorados pelo Git independentemente do idioma.

## Provider implementado

`VoskSpeechProvider` implementa o contrato `SpeechProvider`:

- `initialize()` valida microfone e modelo e carrega o Vosk;
- `start()` inicia captura e transcrição;
- `stop()` encerra a captura, mantendo o modelo carregado;
- `getStatus()` retorna estado seguro para a interface;
- `dispose()` libera captura, reconhecedor e modelo.

Toda chamada ao pacote `vosk` está isolada no provider e no loader associado.
O `SpeechService` recebe somente transcrições genéricas.

O modelo legado é reconhecido pela presença de:

```text
final.mdl
HCLr.fst
Gr.fst
mfcc.conf
```

Também é aceita a estrutura Vosk atual com:

```text
am/final.mdl
conf/mfcc.conf
graph/HCLG.fst
```

## Captura de áudio

O backend usa `ffmpeg` para produzir PCM `s16le`, mono, a 16 kHz:

- Linux: PulseAudio/PipeWire (`-f pulse`);
- Windows: DirectShow (`-f dshow`);
- macOS: AVFoundation (`-f avfoundation`).

No Linux, `pactl` lista as fontes reais e ignora fontes de monitor de saída. O
valor salvo em `microphone` deve ser o ID retornado por
`GET /api/speech/microphones`. Se o dispositivo desaparecer, o encerramento do
processo de captura gera `SYSTEM_ERROR` e `SPEECH_STOPPED`.

`ffmpeg` e, no Linux, `pactl` são pré-requisitos do sistema operacional.

## Instalação do binding Vosk

O binding Node oficial `vosk@0.3.39` usa `ffi-napi`, uma dependência nativa
antiga. Ele é uma dependência opcional para que problemas do binding não
derrubem o restante da aplicação.

Instalação recomendada:

```bash
npm install
npm run install:vosk
```

O segundo comando usa os binários N-API distribuídos pelo pacote e evita uma
recompilação incompatível em algumas combinações recentes de Node, npm e
caminhos com espaços.

Se o binding não estiver disponível, o endpoint retorna erro claro
`VOSK_UNAVAILABLE`; o NestJS, as interfaces manuais e os demais módulos
continuam funcionando.

## Endpoints

```text
GET  /api/speech/status
GET  /api/speech/microphones
POST /api/speech/initialize
POST /api/speech/start
POST /api/speech/stop
```

## Eventos

- `SPEECH_STARTED`;
- `SPEECH_STOPPED`;
- `TRANSCRIPTION_RECEIVED`;
- `SYSTEM_ERROR` com origem `speech`.

Não são emitidos eventos de comando.

## Providers futuros

O provider de fala e o modelo são conceitos independentes:

- o provider adapta uma tecnologia de reconhecimento;
- o modelo é um recurso local selecionado por caminho e idioma;
- a regra de negócio deve depender da futura interface `SpeechProvider`, e não
  diretamente do Vosk;
- validar, carregar e descarregar modelos pertence ao Speech Module;
- o SettingsModule continuará responsável apenas por persistir preferências e
  descrever a disponibilidade do caminho.

Um futuro provider deve receber sua configuração explicitamente, validar a
compatibilidade do conteúdo e produzir transcrições sem acessar controllers,
elementos do frontend, BibleModule ou HolyricsModule.

## Git e distribuição

Modelos costumam ser grandes e podem possuir licenças próprias. Por isso,
`models/**/*` é ignorado, com exceção de `README.md`, diretórios e arquivos
`.gitkeep`. Um colaborador deve instalar o modelo localmente e verificar a
licença do artefato utilizado. Modelos não devem ser forçados para o histórico
do projeto.
