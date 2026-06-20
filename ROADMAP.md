# ROADMAP.md

# Purpose

Este documento define a ordem de desenvolvimento do projeto.

O objetivo é evitar que o projeto implemente funcionalidades avançadas antes de ter um MVP simples, confiável e utilizável em igrejas reais.

Sempre seguir este roadmap junto com:

- `CONTEXT.md`
- `ARCHITECTURE.md`

Se uma nova funcionalidade for adicionada ao plano, atualizar este arquivo.

---

# Guiding Principle

O projeto deve evoluir em etapas pequenas.

Cada etapa deve gerar algo utilizável, testável ou documentado.

Prioridade máxima:

1. Rodar localmente.
2. Conectar com Holyrics.
3. Permitir controle manual confiável.
4. Adicionar reconhecimento de voz.
5. Melhorar experiência.
6. Só depois adicionar automações avançadas.

---

# MVP Goal

Criar uma primeira versão funcional que permita:

- iniciar um servidor local
- acessar a interface por QR Code
- configurar conexão com Holyrics
- abrir a tela do pregador
- escolher versão bíblica
- escolher livro, capítulo e versículo manualmente
- enviar a passagem ao Holyrics
- configurar microfone e modelo Vosk
- transcrever áudio localmente
- interpretar comandos bíblicos básicos em `pt-BR`
- avançar e voltar versículos
- acessar uma tela simples de louvor
- persistir configurações locais

---

# Phase 0 - Project Foundation

Objetivo:

Criar a base técnica do projeto.

Status: **Concluída em 19 de junho de 2026.**

Tarefas:

- [x] criar projeto NestJS
- [x] configurar estrutura definida em `ARCHITECTURE.md`
- [x] configurar `src/app`
- [x] configurar `src/modules`
- [x] configurar `src/shared`
- [x] configurar pasta `public`
- [x] servir arquivos estáticos pelo NestJS
- [x] criar página inicial `/`
- [x] criar páginas:
  - [x] `/preacher`
  - [x] `/worship`
  - [x] `/settings`

- [x] criar CSS base
- [x] criar JS base
- [x] configurar Logger padrão
- [x] criar README inicial

Critérios de aceite:

- [x] aplicação inicia localmente
- [x] hub inicial abre no navegador
- [x] links para Pregador, Louvor e Configurações funcionam
- [x] estrutura de pastas segue `ARCHITECTURE.md`

Fora de escopo nesta fase:

- integração real com Holyrics
- reconhecimento de voz
- banco de dados complexo
- autenticação

---

# Phase 1 - Local Network and QR Code

Objetivo:

Facilitar acesso por celulares e tablets na rede local.

Status: **Concluída em 20 de junho de 2026.**

Tarefas:

- [x] detectar IP local da máquina
- [x] exibir URL local no terminal
- [x] gerar QR Code no terminal
- [x] criar endpoint de status do sistema
- [x] exibir status básico na tela de Configurações

Critérios de aceite:

- [x] ao iniciar o sistema, o terminal mostra a URL local
- [x] ao iniciar o sistema, o terminal mostra QR Code
- [x] celular na mesma rede consegue acessar a aplicação
- [x] tela inicial funciona em celular

Fora de escopo nesta fase:

- descoberta automática de Holyrics
- empacotamento para instalação

---

# Phase 2 - Settings MVP

Objetivo:

Criar configurações locais persistentes.

Status: **Concluída em 20 de junho de 2026.**

Tarefas:

- [x] criar Settings Module
- [x] definir modelo de configuração local
- [x] configurar persistência em SQLite
- [x] criar tela de Configurações
- [x] salvar host/IP do Holyrics
- [x] salvar porta/API do Holyrics
- [x] salvar idioma principal
- [x] salvar microfone selecionado, se disponível
- [x] salvar caminho/modelo Vosk, se disponível
- [x] criar endpoint para ler configurações
- [x] criar endpoint para atualizar configurações

Critérios de aceite:

- [x] usuário consegue salvar configurações
- [x] configurações persistem após reiniciar aplicação
- [x] tela de Configurações mostra valores atuais
- [x] configuração não depende de internet

Fora de escopo nesta fase:

- login
- permissões
- múltiplos perfis de usuário

---

# Phase 3 - Holyrics Integration MVP

Objetivo:

Criar integração inicial com a API do Holyrics.

Status: **Concluída em 20 de junho de 2026.**

Tarefas:

- [x] criar Holyrics Module
- [x] criar Holyrics Service
- [x] criar DTOs necessários
- [x] criar interface para provider Holyrics
- [x] implementar teste de conexão
- [x] criar endpoint para testar conexão com Holyrics
- [x] exibir resultado do teste na tela de Configurações
- [x] documentar endpoints usados da API do Holyrics
- [x] criar mocks para testes

Critérios de aceite:

- [x] sistema consegue testar conexão com Holyrics
- [x] erro de conexão é exibido claramente
- [x] nenhum outro módulo chama Holyrics diretamente
- [x] testes não dependem de Holyrics real

Fora de escopo nesta fase:

- controle completo de todas as funções do Holyrics
- louvor avançado
- automação por voz

---

# Phase 4 - Bible Data and Version Support

Objetivo:

Preparar suporte bíblico e versões bíblicas.

Tarefas:

- criar Bible Module
- criar estrutura para livros, capítulos e versículos
- criar suporte a aliases de livros em `pt-BR`
- criar estrutura para versão bíblica atual
- carregar versões bíblicas disponíveis pelo Holyrics, se a API permitir
- criar fallback documentado se a API não permitir listar versões
- criar endpoint para listar versões bíblicas
- criar endpoint para listar livros
- criar endpoint para listar capítulos de um livro
- criar endpoint para listar versículos de um capítulo

Critérios de aceite:

- tela do pregador consegue obter versões bíblicas
- tela do pregador consegue navegar por livro, capítulo e versículo
- aliases ficam fora da lógica principal
- versão bíblica atual é respeitada

Fora de escopo nesta fase:

- reconhecimento de voz
- comandos inteligentes
- múltiplos idiomas além de `pt-BR`

---

# Phase 5 - Preacher Interface MVP

Objetivo:

Criar a primeira tela realmente útil para o pregador.

Tarefas:

- criar interface mobile-first para `/preacher`
- criar painel de livros
- criar painel de capítulos
- criar painel de versículos
- criar navegação de volta para livros/capítulos
- mostrar livro/capítulo/versículo atual no topo
- mostrar versão bíblica atual no topo
- permitir trocar versão bíblica
- persistir versão bíblica favorita no navegador
- enviar passagem selecionada ao backend
- backend envia passagem ao Holyrics

Critérios de aceite:

- pregador chega em qualquer versículo com até 3 seleções principais
- versão bíblica escolhida é visível
- versão bíblica escolhida é usada ao enviar ao Holyrics
- passagem manual aparece no Holyrics
- interface é utilizável em celular

Fora de escopo nesta fase:

- comandos de voz
- login
- personalização visual avançada

---

# Phase 6 - Realtime Events MVP

Objetivo:

Sincronizar interfaces em tempo real.

Tarefas:

- criar Realtime Module
- configurar WebSocket
- criar eventos principais
- emitir evento quando passagem bíblica mudar
- emitir evento quando conexão Holyrics mudar
- emitir evento quando captura de áudio iniciar/parar
- criar JS cliente para WebSocket
- exibir status em tempo real nas interfaces

Eventos mínimos:

- `HOLYRICS_CONNECTED`
- `HOLYRICS_DISCONNECTED`
- `BIBLE_CHANGED`
- `TRANSCRIPTION_RECEIVED`
- `COMMAND_IDENTIFIED`
- `COMMAND_EXECUTED`
- `SPEECH_STARTED`
- `SPEECH_STOPPED`
- `SYSTEM_ERROR`

Critérios de aceite:

- múltiplos dispositivos recebem atualizações
- tela de Configurações mostra status em tempo real
- tela do Pregador reflete mudanças relevantes
- WebSocket não contém lógica de negócio

Fora de escopo nesta fase:

- sincronização com nuvem
- usuários autenticados

---

# Phase 7 - Speech Recognition MVP

Objetivo:

Adicionar reconhecimento de voz local com Vosk.

Tarefas:

- criar Speech Module
- criar interface `SpeechProvider`
- implementar `VoskSpeechProvider`
- permitir selecionar modelo Vosk
- permitir iniciar captura
- permitir parar captura
- emitir transcrições parciais, se disponível
- emitir transcrições finais
- exibir transcrição na tela de Configurações
- salvar estado de captura automática

Critérios de aceite:

- sistema transcreve áudio localmente
- sistema funciona sem internet
- Vosk fica atrás de uma interface
- backend não fica acoplado diretamente ao Vosk
- erros de microfone/modelo são exibidos claramente

Fora de escopo nesta fase:

- Whisper
- IA generativa
- reconhecimento automático de canto

---

# Phase 8 - Command Interpreter MVP

Objetivo:

Transformar texto transcrito em comandos úteis.

Tarefas:

- criar Command Module
- criar estrutura de intents
- criar parser básico para referências bíblicas em `pt-BR`
- interpretar livro, capítulo e versículo
- interpretar comandos:
  - próximo
  - próximo versículo
  - versículo seguinte
  - anterior
  - voltar
  - versículo anterior

- manter contexto bíblico atual
- evitar falsos positivos simples
- integrar comandos com Bible Module
- integrar comandos com Holyrics Module
- emitir eventos de comando identificado/executado

Critérios de aceite:

- comando “João 3:16” abre João 3:16
- comando “próximo versículo” avança para João 3:17 quando o contexto atual é João 3:16
- frase “o próximo irmão” não deve avançar versículo
- comandos usam a versão bíblica selecionada
- comandos são testáveis sem Holyrics real

Fora de escopo nesta fase:

- interpretação avançada com IA
- suporte completo a todos os idiomas
- comandos complexos de louvor

---

# Phase 9 - Worship Interface MVP

Objetivo:

Criar tela inicial para equipe de louvor.

Tarefas:

- criar Worship Module
- criar interface `/worship`
- testar quais recursos de louvor a API do Holyrics permite controlar
- listar louvores/sequência se a API permitir
- mostrar música atual, se a API permitir
- mostrar próxima música, se a API permitir
- criar botões de próximo/anterior
- criar botão de iniciar/selecionar louvor, se a API permitir
- documentar limitações da API

Critérios de aceite:

- tela de Louvor abre no celular/tablet
- controles manuais funcionam quando suportados pelo Holyrics
- limitações da API estão documentadas
- não existe reconhecimento automático de canto no MVP

Fora de escopo nesta fase:

- reconhecimento de canto
- detecção automática de trecho cantado
- temporização avançada

---

# Phase 10 - System Hardening

Objetivo:

Melhorar estabilidade para uso real.

Tarefas:

- revisar tratamento de erros
- melhorar mensagens para usuários não técnicos
- adicionar logs por módulo
- criar página ou bloco de status do sistema
- validar configurações antes de iniciar captura
- impedir falhas silenciosas
- revisar comportamento quando Holyrics cair
- revisar comportamento quando microfone cair
- revisar comportamento quando modelo Vosk estiver inválido

Critérios de aceite:

- erros comuns são compreensíveis
- sistema não quebra silenciosamente
- usuário sabe o que corrigir
- logs ajudam contribuidores a debugar

---

# Phase 11 - Documentation for Open Source

Objetivo:

Preparar o projeto para contribuição externa.

Tarefas:

- melhorar README
- criar guia de instalação
- criar guia de uso
- criar guia de contribuição
- criar documentação de arquitetura
- documentar configuração do Holyrics
- documentar modelos Vosk
- documentar como adicionar idioma
- documentar como adicionar provider de voz
- documentar como rodar testes

Arquivos sugeridos:

- `README.md`
- `CONTRIBUTING.md`
- `docs/installation.md`
- `docs/usage.md`
- `docs/holyrics.md`
- `docs/speech-providers.md`
- `docs/languages.md`

Critérios de aceite:

- um voluntário consegue entender o objetivo do projeto
- um desenvolvedor consegue rodar localmente
- um contribuidor entende onde alterar idioma/provider
- documentação não depende de explicação externa

---

# Phase 12 - Packaging and Distribution

Objetivo:

Facilitar instalação por igrejas.

Tarefas futuras:

- avaliar build para Windows
- avaliar build para Linux
- avaliar Docker opcional
- avaliar instalador simples
- avaliar modo portable
- documentar execução por terminal
- documentar execução como serviço local, se necessário

Critérios de aceite:

- usuário técnico consegue instalar sem clonar o projeto manualmente
- processo é documentado
- operação continua offline-first

Fora de escopo inicial:

- app mobile nativo
- dashboard em nuvem
- distribuição via loja

---

# Future Roadmap

Funcionalidades futuras, após MVP estável:

- suporte a Whisper.cpp
- suporte a Faster Whisper
- suporte a outros idiomas
- reconhecimento automático de canto
- modo ensaio para louvor
- temporização por música
- integração com OBS
- integração com Stream Deck
- integração MIDI
- controle por smartwatch
- PIN para proteger Configurações
- perfis por dispositivo
- temas visuais
- modo kiosk
- suporte a Raspberry Pi
- backup/exportação de configurações
- importação/exportação de aliases bíblicos
- sistema de plugins

---

# Explicit Non-Goals

Não são objetivos atuais:

- substituir o Holyrics
- criar uma Bíblia própria completa
- criar editor próprio de letras
- criar plataforma em nuvem
- criar sistema multi-igreja
- criar login completo
- depender de OpenAI ou IA online
- depender de internet durante cultos
- implementar reconhecimento automático de canto no MVP

---

# Instructions for AI Coding Agents

Ao implementar este projeto:

1. Siga as fases em ordem.
2. Não pule para funcionalidades futuras sem concluir o MVP.
3. Não implemente itens marcados como fora de escopo.
4. Sempre respeite `CONTEXT.md`.
5. Sempre respeite `ARCHITECTURE.md`.
6. Ao concluir uma fase, atualizar documentação relevante.
7. Criar testes para módulos de regra de negócio.
8. Usar mocks para Holyrics e providers externos.
9. Não criar dependência obrigatória de internet.
10. Não acoplar a lógica diretamente ao Vosk.
11. Não espalhar chamadas ao Holyrics fora do Holyrics Module.
12. Não colocar lógica de negócio no frontend.
13. Priorizar simplicidade e uso real em igrejas pequenas.
