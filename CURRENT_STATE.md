# CURRENT_STATE.md

## Projeto

Holyrics Voice Assistant

## Status Geral

Fase atual: 9 (Bible Navigation Engine MVP)

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

## Limitações atuais

- Sem controle automático do Holyrics
- Sem emissão de `COMMAND_EXECUTED`
- Sem envio da navegação ao Holyrics
- Sem módulo de louvor
- Sem polling do Holyrics
- Números acima de cento e cinquenta não são normalizados
- Ordinais compostos não são normalizados

## Modelo disponível

Modelo Vosk português já configurado localmente.

## Próxima fase

Phase 10 — System Hardening

A Phase 10 ainda não foi iniciada. Funcionalidades de louvor permanecem
adiadas.
