# CURRENT_STATE.md

## Projeto

Holyrics Voice Assistant

## Status Geral

Fase atual: 9.7 (Command Intent NLP e conexão Holyrics Web)

## Fases concluídas

- Phase 0 — Foundation
- Phase 1 — Local Network and QR Code
- Phase 2 — Settings MVP
- Phase 3 — Holyrics Integration MVP
- Phase 4 — Bible Data and Version Support
- Phase 5 — Preacher Interface MVP
- Phase 5.5 — Holyrics Authentication & Real API Integration
- Phase 6 — Realtime Events MVP
- Phase 6.5 — Speech Infrastructure Preparation
- Phase 7 — Speech Recognition MVP
- Phase 8 — Command Interpreter MVP
- Phase 8.5 — Portuguese Number Normalization
- Phase 9 — Bible Navigation Engine MVP
- Phase 9.5 — Holyrics Bible Projection Integration
- Phase 9.6 — Command Intent Guard
- Phase 9.7 — Command Intent NLP e conexão Holyrics Web

## Módulos existentes

- SystemModule
- SettingsModule
- HolyricsModule
- BibleModule
- RealtimeModule
- SpeechModule
- CommandModule

## Funcionalidades prontas

- QR Code de acesso local
- Configurações persistidas em SQLite
- Integração autenticada com API do Holyrics
- Bible Module com fallback local
- Interface do Pregador
- WebSocket entre NestJS e navegadores
- Eventos em tempo real
- Estrutura de modelos de voz
- Validação de caminho do modelo
- Reconhecimento de voz local com Vosk
- Parser determinístico de comandos bíblicos em `pt-BR`
- Referências bíblicas estruturadas com aliases existentes
- Comandos de próximo/anterior versículo e capítulo
- Evento `COMMAND_IDENTIFIED`
- Diagnóstico somente leitura em `/settings`
- Normalização local de números em português de zero a cento e cinquenta
- Ordinais comuns nas formas masculina e feminina
- Referências faladas com números por extenso
- Referências parciais por livro isolado
- Livro e capítulo assumem versículo 1 no comando estruturado
- Tela do pregador com nomes completos dos livros
- Transição visual clara de capítulos para versículos
- Terminal identifica explicitamente o link do menu usado pelo QR Code
- Diagnóstico separado de transcrição original e normalizada
- Navegação bíblica real em memória a partir de comandos identificados
- Transições automáticas entre versículos, capítulos e livros
- Contexto bíblico compartilhado com versão, livro, capítulo e versículo
- Evento `BIBLE_CHANGED` após navegação por comando
- Tela do pregador sincronizada automaticamente com a navegação
- Diagnóstico de referência atual e último comando aplicado
- Projeção de seleções manuais e por voz via ação oficial `ShowVerse`
- Versão bíblica enviada junto da referência ao Holyrics
- Fallback local quando Holyrics não está configurado
- Falhas externas preservam a navegação e emitem erro seguro
- Diagnóstico do último envio ao Holyrics
- Guard de intenção antes da navegação por voz
- Modo conservador padrão e modo rápido configurável
- Referências casuais bloqueadas sem `BIBLE_CHANGED` ou envio ao Holyrics
- Diagnóstico da decisão e do motivo do último comando
- Classificação de intenção com NLP.js local, treinado no startup a partir de
  exemplos versionados por idioma (`src/modules/command/nlp/`)
- Reconhecimento de frases de ação além das expressões fixas anteriores
  (`vamos parar`, `acompanhe comigo em`, entre outras variações treinadas)
- Conexão com o Holyrics em dois modos: `local` (host/porta/token) e `web`
  (API key + token, via `https://api.holyrics.com.br/request/<ação>`)
- Persistência e proteção da API key web, sem exposição em `GET /api/settings`
  ou logs

## Limitações atuais

- Sem emissão de `COMMAND_EXECUTED`
- Sem polling contínuo do Holyrics
- Sem módulo de louvor
- Números acima de cento e cinquenta não são normalizados
- Ordinais compostos não são normalizados
- O guard depende do NLP.js treinado com exemplos versionados; frases fora
  desses exemplos ainda não são compreendidas como uma IA generativa faria
- O modo web do Holyrics depende de internet e não é o padrão do projeto

## Modelo disponível

Modelo Vosk português já configurado localmente.

## Pendência de publicação

As Phases 9.6 e 9.7 estão commitadas localmente mas ainda não foram enviadas
ao remoto `origin` (GitHub). Duas commits aguardam `git push`.

## Próxima fase

Phase 10 — System Hardening

A Phase 10 ainda não foi iniciada. Funcionalidades de louvor permanecem
adiadas.
