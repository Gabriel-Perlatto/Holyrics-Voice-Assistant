# CURRENT_STATE.md

## Projeto

Holyrics Voice Assistant

## Status Geral

Fase atual: 8 (Command Interpreter MVP)

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

## Limitações atuais

- Sem controle automático do Holyrics
- Sem execução de comandos
- Sem alteração automática da passagem exibida
- Sem módulo de louvor
- Sem polling do Holyrics
- Números por extenso não são interpretados pelo parser

## Modelo disponível

Modelo Vosk português já configurado localmente.

## Próxima fase

Phase 9 — Worship Interface MVP

A Phase 9 ainda não foi iniciada.
