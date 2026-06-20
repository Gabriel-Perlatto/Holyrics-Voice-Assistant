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

Status: **Concluída em 20 de junho de 2026.**

Tarefas:

- [x] criar Bible Module
- [x] criar estrutura para livros, capítulos e versículos
- [x] criar suporte a aliases de livros em `pt-BR`
- [x] criar estrutura para versão bíblica atual
- [x] avaliar carregamento de versões pelo Holyrics; na Phase 4, sem contrato
  confirmado, foi mantido fallback local
- [x] criar fallback documentado para a implementação da fase
- [x] criar endpoint para listar versões bíblicas
- [x] criar endpoint para listar livros
- [x] criar endpoint para listar capítulos de um livro
- [x] criar endpoint para listar versículos de um capítulo

Critérios de aceite:

- [x] tela do pregador consegue obter versões bíblicas
- [x] tela do pregador consegue navegar por livro, capítulo e versículo
- [x] aliases ficam fora da lógica principal
- [x] versão bíblica atual é respeitada

Fora de escopo nesta fase:

- reconhecimento de voz
- comandos inteligentes
- múltiplos idiomas além de `pt-BR`

---

# Phase 5 - Preacher Interface MVP

Objetivo:

Criar a primeira tela realmente útil para o pregador.

Status: **Concluída em 20 de junho de 2026.**

Tarefas:

- [x] criar interface mobile-first para `/preacher`
- [x] criar painel de livros
- [x] criar painel de capítulos
- [x] criar painel de versículos
- [x] criar navegação de volta para livros/capítulos
- [x] mostrar livro/capítulo/versículo atual no topo
- [x] mostrar versão bíblica atual no topo
- [x] permitir trocar versão bíblica
- [x] persistir versão bíblica favorita no navegador
- [x] enviar passagem selecionada ao backend
- [x] preparar envio da passagem ao Holyrics com fallback local documentado;
  a pesquisa posterior confirmou a ação oficial `ShowVerse`, ainda não
  implementada

Critérios de aceite:

- [x] pregador chega em qualquer versículo com até 3 seleções principais
- [x] versão bíblica escolhida é visível
- [x] versão bíblica escolhida é enviada junto com a passagem ao backend
- [x] passagem manual é registrada localmente com retorno explícito de que
  ainda não foi apresentada no Holyrics
- [x] interface é utilizável em celular

Fora de escopo nesta fase:

- comandos de voz
- login
- personalização visual avançada

---

# Research Checkpoint - Official Holyrics API

Status: **Concluído em 20 de junho de 2026.**

- [x] confirmar o API Server HTTP oficial
- [x] documentar autenticação, permissões e transporte
- [x] confirmar ações de Bíblia, músicas, playlists e apresentação
- [x] confirmar `ShowVerse` e `GetBibleVersionsV2`
- [x] confirmar ausência de ações públicas para livros, capítulos e texto
  bíblico
- [x] distinguir API Server, Plugin, app móvel, API Item, scripts e MIDI
- [x] registrar limitações e riscos arquiteturais

Documentação: `docs/holyrics-api-research.md`.

Este checkpoint é exclusivamente documental. Nenhuma integração real ou
funcionalidade de fase futura foi iniciada.

---

# Phase 5.5 - Holyrics Authentication & Real API Integration

Objetivo:

Preparar a infraestrutura autenticada do API Server oficial antes dos eventos
em tempo real.

Status: **Concluída em 20 de junho de 2026.**

Tarefas:

- [x] persistir token da API Holyrics no Settings Module
- [x] não expor o token nas respostas da API local
- [x] atualizar `/settings` para salvar, substituir e remover o token
- [x] substituir o probe `GET /` por ações oficiais autenticadas
- [x] criar provider genérico para `POST /api/{action}`
- [x] implementar `GetTokenInfo`
- [x] implementar `CheckPermissions`
- [x] implementar `GetVersion`
- [x] implementar `GetAPIServerInfo`
- [x] mapear token ausente, token inválido e permissão insuficiente
- [x] mapear indisponibilidade, timeout e versão incompatível
- [x] exibir conexão, autenticação, versão e permissões em `/settings`
- [x] manter fallbacks bíblicos e comportamento local existentes
- [x] criar testes com mocks sem depender de Holyrics real

Critérios de aceite:

- [x] token persiste após reiniciar
- [x] autenticação pode ser validada
- [x] teste de conexão usa somente endpoints oficiais
- [x] tela de Configurações mostra status real retornado pela API
- [x] fallbacks continuam funcionando quando a integração falha
- [x] testes passam
- [x] build passa

Fora de escopo nesta fase:

- `ShowVerse`
- `GetBibleVersionsV2`
- WebSocket
- polling contínuo
- reconhecimento de voz
- Vosk
- Command Module
- funcionalidades de louvor

---

# Phase 6 - Realtime Events MVP

Objetivo:

Sincronizar interfaces em tempo real.

Status: **Concluída em 20 de junho de 2026.**

Nota arquitetural: o WebSocket desta fase pertence ao NestJS e sincroniza os
navegadores. A API oficial do Holyrics pesquisada não documenta WebSocket de
entrada. Os eventos Holyrics são consequência dos testes HTTP explícitos já
executados pelo `HolyricsModule`; não existe polling contínuo.

Tarefas:

- [x] criar Realtime Module
- [x] configurar WebSocket com Socket.IO
- [x] criar gateway sem regra de negócio
- [x] criar serviço interno de emissão
- [x] criar enum e payloads tipados
- [x] emitir evento quando passagem bíblica mudar
- [x] emitir evento quando configurações forem salvas
- [x] emitir evento quando teste/autenticação Holyrics funcionar ou falhar
- [x] criar JS cliente reutilizável para WebSocket
- [x] exibir status em tempo real em `/settings`
- [x] exibir status e refletir passagem em `/preacher`
- [x] garantir payloads sem token e dados sensíveis

Eventos implementados e emitidos:

- `HOLYRICS_CONNECTED`
- `HOLYRICS_DISCONNECTED`
- `BIBLE_CHANGED`
- `SETTINGS_UPDATED`
- `SYSTEM_ERROR` disponível no serviço

Eventos reservados, ainda não emitidos:

- `TRANSCRIPTION_RECEIVED`
- `COMMAND_IDENTIFIED`
- `COMMAND_EXECUTED`
- `SPEECH_STARTED`
- `SPEECH_STOPPED`
- `SONG_CHANGED`

Critérios de aceite:

- [x] múltiplos dispositivos podem receber atualizações
- [x] tela de Configurações mostra status em tempo real
- [x] tela do Pregador reflete mudanças relevantes
- [x] WebSocket não contém lógica de negócio
- [x] testes passam
- [x] build passa
- [x] conexão WebSocket validada localmente

Fora de escopo nesta fase:

- sincronização com nuvem
- usuários autenticados
- polling contínuo do Holyrics
- reconhecimento de voz
- Vosk
- Command Module
- funcionalidades de louvor

---

# Phase 6.5 - Speech Infrastructure Preparation

Objetivo:

Preparar a organização local de modelos e a configuração necessária para a
futura implementação de reconhecimento de voz.

Status: **Concluída em 20 de junho de 2026.**

Tarefas:

- [x] criar a convenção `models/<idioma-BCP-47>/<modelo>`
- [x] reservar diretórios `models/pt-BR` e `models/en-US`
- [x] documentar instalação manual e reutilização de modelos externos
- [x] impedir versionamento de artefatos de modelo
- [x] manter o caminho do modelo persistido no Settings Module
- [x] validar formato básico do caminho
- [x] verificar se o caminho existe e representa um diretório
- [x] expor status seguro do caminho em `GET/PUT /api/settings`
- [x] exibir caminho e status em `/settings`
- [x] testar diretório existente, inexistente e configuração ausente

Critérios de aceite:

- [x] estrutura e convenção de modelos documentadas
- [x] nenhum modelo é baixado ou versionado
- [x] nenhum modelo é carregado
- [x] nenhum microfone ou áudio é acessado
- [x] tela de Configurações informa caminho válido ou inválido
- [x] testes passam
- [x] build passa

Fora de escopo nesta fase:

- Speech Module
- `SpeechProvider`
- `VoskSpeechProvider`
- captura de microfone
- carregamento ou inspeção de conteúdo do modelo
- transcrição
- reconhecimento de voz

---

# Phase 7 - Speech Recognition MVP

Objetivo:

Adicionar reconhecimento de voz local com Vosk.

Status: **Concluída em 20 de junho de 2026.**

Tarefas:

- [x] criar Speech Module
- [x] criar interface `SpeechProvider`
- [x] implementar `VoskSpeechProvider`
- [x] validar estrutura do modelo configurado
- [x] enumerar e selecionar microfone local
- [x] capturar PCM mono a 16 kHz com `ffmpeg`
- [x] permitir iniciar captura
- [x] permitir parar captura
- [x] emitir transcrições parciais, quando disponíveis
- [x] emitir transcrições finais
- [x] exibir status e transcrição na tela de Configurações
- [x] salvar estado de captura automática
- [x] emitir eventos realtime de voz e erros seguros
- [x] criar testes sem Vosk ou áudio real

Critérios de aceite:

- [x] sistema transcreve áudio localmente
- [x] pipeline local de áudio para transcrição está implementado
- [x] sistema funciona sem internet durante a operação
- [x] Vosk fica atrás de uma interface
- [x] backend não fica acoplado diretamente ao Vosk
- [x] erros de microfone/modelo são exibidos claramente
- [x] modelo legado real carrega com sucesso
- [x] captura real inicia e para no ambiente local
- [x] testes passam
- [x] build passa

Fora de escopo nesta fase:

- Whisper
- IA generativa
- reconhecimento automático de canto
- interpretação de comandos
- navegação bíblica por voz
- controle do Holyrics
- funcionalidades de louvor

---

# Phase 8 - Command Interpreter MVP

Objetivo:

Transformar texto transcrito em comandos estruturados, sem executar ações.

Status: **Concluída em 20 de junho de 2026.**

Tarefas:

- [x] criar Command Module
- [x] criar estrutura de intents
- [x] criar parser determinístico para referências bíblicas em `pt-BR`
- [x] interpretar livro, capítulo e versículo
- [x] interpretar próximo/anterior versículo
- [x] interpretar próximo/anterior capítulo
- [x] reutilizar aliases existentes do Bible Module sem duplicar listas
- [x] criar contexto interno para referência futura
- [x] evitar falsos positivos simples por correspondência integral
- [x] interpretar somente transcrições finais
- [x] emitir `COMMAND_IDENTIFIED` com payload seguro
- [x] retornar `UNKNOWN` para conteúdo não reconhecido
- [x] adicionar diagnóstico somente leitura em `/settings`
- [x] manter `COMMAND_EXECUTED` sem emissão
- [x] não integrar com Holyrics
- [x] não alterar o contexto ou a navegação do Bible Module

Critérios de aceite:

- [x] comando “João 3:16” gera referência estruturada para João 3:16
- [x] comando “próximo versículo” gera `NEXT_VERSE`
- [x] frase “o próximo irmão” gera `UNKNOWN`
- [x] nenhum comando é executado
- [x] nenhuma passagem é alterada automaticamente
- [x] comandos são testáveis sem Holyrics real
- [x] testes passam
- [x] build passa

Fora de escopo nesta fase:

- execução de comandos
- controle ou chamadas ao Holyrics
- alteração automática da passagem exibida
- integração com a interface do pregador
- interpretação avançada com IA
- LLMs e NLP externo
- suporte completo a todos os idiomas
- comandos complexos de louvor

---

# Phase 8.5 - Portuguese Number Normalization

Objetivo:

Normalizar números falados em português antes do parser de comandos, sem
interpretar ou executar ações.

Status: **Concluída em 20 de junho de 2026.**

Tarefas:

- [x] criar `NumberNormalizerService`
- [x] normalizar cardinais de zero a cento e cinquenta
- [x] normalizar formas masculina e feminina de um e dois
- [x] normalizar ordinais comuns nas formas masculina e feminina
- [x] normalizar livros numerados antes do parser
- [x] preservar aliases existentes sem duplicar listas bíblicas
- [x] integrar normalização antes do `PtBrCommandParser`
- [x] preservar o comportamento dos comandos já suportados
- [x] manter transcrição original e normalizada no diagnóstico
- [x] atualizar `/settings` com diagnóstico somente leitura
- [x] manter o payload de `COMMAND_IDENTIFIED` sem transcrição
- [x] não emitir `COMMAND_EXECUTED`
- [x] não integrar com Holyrics
- [x] não alterar Bible Module ou Preacher Interface

Critérios de aceite:

- [x] “João capítulo três versículo dezesseis” gera João 3:16
- [x] “Primeira Coríntios capítulo dois versículo quatro” gera 1 Coríntios 2:4
- [x] “João três dezesseis” gera João 3:16
- [x] livros numerados são normalizados
- [x] frases sem números são preservadas
- [x] conteúdo inválido não lança erro
- [x] nenhum comando é executado
- [x] testes passam
- [x] build passa

Fora de escopo nesta fase:

- números acima de cento e cinquenta
- ordinais compostos
- números decimais ou negativos
- IA, LLMs ou NLP externo
- APIs externas
- execução de comandos
- controle ou chamadas ao Holyrics
- alteração automática da passagem exibida
- funcionalidades de louvor

---

# Command Interpreter Correction - Partial Bible References

Objetivo:

Reconhecer referências bíblicas de livro e de livro com capítulo sem executar
ações.

Status: **Concluída em 20 de junho de 2026.**

Tarefas:

- [x] manter o tipo `BIBLE_REFERENCE`
- [x] permitir capítulo nulo para livro isolado
- [x] reconhecer livro isolado
- [x] reconhecer livro com capítulo usando versículo 1 como padrão
- [x] preservar referências completas
- [x] reutilizar aliases e normalização existentes
- [x] validar capítulos contra os metadados locais
- [x] atualizar diagnóstico para referências parciais
- [x] manter frases sem referência clara como `UNKNOWN`
- [x] não emitir `COMMAND_EXECUTED`
- [x] não alterar HolyricsModule ou Preacher Interface

Critérios de aceite:

- [x] “gênesis” gera referência de livro
- [x] “gênesis capítulo um” gera Gênesis 1:1
- [x] “joão capítulo três” e “joão três” geram João 3:1
- [x] “joão três dezesseis” continua gerando João 3:16
- [x] “primeira coríntios capítulo treze” gera 1 Coríntios 13
- [x] “salmos cento e cinquenta” gera Salmos 150
- [x] frase comum sem referência gera `UNKNOWN`
- [x] nenhum comando é executado

---

# Usability Adjustments - Command, Preacher and Local Access

Status: **Concluídos em 20 de junho de 2026.**

- [x] livro com capítulo assume versículo 1
- [x] livros usam nomes completos na seleção manual
- [x] botões touch não mantêm marca visual ao trocar para versículos
- [x] QR Code é apresentado como representação do link do menu
- [x] nenhuma execução automática foi adicionada

---

# Phase 9 - Bible Navigation Engine MVP

Objetivo:

Transformar comandos identificados em mudanças reais de navegação bíblica
local.

Status: **Concluída em 20 de junho de 2026.**

Tarefas:

- [x] criar `BibleNavigationService`
- [x] reutilizar contexto e metadados do BibleModule
- [x] aplicar referências bíblicas diretas
- [x] avançar e voltar versículos
- [x] avançar e voltar capítulos
- [x] atravessar limites entre capítulos
- [x] atravessar limites entre livros
- [x] preservar a versão bíblica atual
- [x] emitir `BIBLE_CHANGED`
- [x] sincronizar `/preacher` pelo RealtimeModule existente
- [x] adicionar diagnóstico somente leitura em `/settings`
- [x] manter estado somente em memória
- [x] não emitir `COMMAND_EXECUTED`
- [x] não chamar ou controlar Holyrics
- [x] não alterar SpeechModule ou VoskSpeechProvider

Critérios de aceite:

- [x] João 3 gera João 3:1
- [x] João 3:16 gera João 3:16
- [x] próximo/anterior navegam por versículo
- [x] capítulo seguinte/anterior navegam por capítulo
- [x] João 3:36 + próximo gera João 4:1
- [x] João 4:1 + anterior gera João 3:36
- [x] contexto inexistente não gera mudança inválida
- [x] `BIBLE_CHANGED` possui payload local seguro
- [x] tela do pregador reflete a navegação
- [x] testes passam
- [x] build passa

Fora de escopo nesta fase:

- controle ou envio de comandos ao Holyrics
- apresentação de passagem no Holyrics
- funcionalidades de louvor
- persistência do contexto em banco
- alterações no reconhecimento de voz

---

# Deferred - Worship Interface MVP

Esta fase foi adiada e não foi iniciada. Permanecem planejados para uma decisão
futura:

- Worship Module;
- interface funcional de louvor;
- controles de músicas e playlists;
- pesquisa de recursos suportados pela API;
- reconhecimento de canto.

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
