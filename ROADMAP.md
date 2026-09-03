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

# Phase 9.5 - Holyrics Bible Projection Integration

Objetivo:

Projetar no Holyrics as passagens selecionadas manualmente ou pela navegação
por voz, mantendo fallback local.

Status: **Concluída em 20 de junho de 2026.**

Tarefas:

- [x] encapsular projeção no HolyricsModule
- [x] usar somente a ação oficial `ShowVerse`
- [x] enviar `references` e `version` no mesmo payload
- [x] integrar seleção manual
- [x] integrar navegação interna por comando
- [x] manter fallback local quando Holyrics não está configurado
- [x] preservar navegação local em timeout, token inválido ou permissão ausente
- [x] emitir `SYSTEM_ERROR` seguro em falhas
- [x] informar resultado em `BIBLE_CHANGED`
- [x] não expor token em payloads ou diagnóstico
- [x] atualizar `/settings` e `/preacher`
- [x] não implementar polling
- [x] não alterar SpeechModule ou VoskSpeechProvider
- [x] não implementar louvor

Critérios de aceite:

- [x] seleção manual tenta `ShowVerse`
- [x] navegação por voz tenta `ShowVerse`
- [x] ausência de configuração resulta em `local-only`
- [x] falha externa resulta em `failed`
- [x] sucesso resulta em `holyrics`
- [x] navegação local nunca é desfeita por falha externa
- [x] testes usam mocks sem Holyrics real
- [x] testes passam
- [x] build passa

Fora de escopo:

- `SelectVerse`, pois não afirma apresentação
- alteração global com `SetBibleSettings`
- polling ou leitura contínua da apresentação
- nuvem e API remota do Holyrics
- login
- funcionalidades de louvor
- Phase 10

---

# Phase 9.6 - Command Intent Guard

Objetivo:

Impedir que referências bíblicas mencionadas casualmente sejam tratadas como
ordens de navegação ou projeção.

Status: **Concluída em 20 de junho de 2026.**

Tarefas:

- [x] criar `CommandIntentGuardService`
- [x] aplicar o guard somente ao fluxo originado de voz/transcrição
- [x] extrair referências de frases completas de forma determinística
- [x] exigir ação explícita no modo conservador
- [x] permitir referência direta no modo rápido
- [x] bloquear contextos claramente casuais nos dois modos
- [x] aceitar comandos relativos somente como frases diretas
- [x] persistir `voiceCommandMode` em SQLite
- [x] usar `conservative` como padrão e em migrações
- [x] incluir decisão e motivo em `COMMAND_IDENTIFIED`
- [x] não chamar navegação ou Holyrics quando ignorado
- [x] preservar integralmente a seleção manual
- [x] atualizar diagnóstico em `/settings`
- [x] manter `COMMAND_EXECUTED` sem emissão

Critérios de aceite:

- [x] “vamos para Apocalipse 12 13” executa
- [x] “como vimos em Apocalipse 12 13” é ignorado
- [x] referência direta é ignorada no modo conservador
- [x] referência direta executa no modo rápido
- [x] contexto casual permanece bloqueado no modo rápido
- [x] “o próximo irmão” e “a próxima pessoa” não navegam
- [x] seleção manual não passa pelo guard
- [x] comandos ignorados não emitem `BIBLE_CHANGED`
- [x] comandos ignorados não acionam `ShowVerse`
- [x] testes passam
- [x] build passa

Fora de escopo:

- IA, LLM ou NLP externo
- aprendizagem de novas expressões
- alteração do reconhecimento de voz
- alteração da autenticação Holyrics
- funcionalidades de louvor
- Phase 10

Nota de 1 de setembro de 2026: os modos `conservative` e `fast` introduzidos
nesta fase foram removidos na Phase 9.13. O comportamento do antigo modo
`fast` passou a ser o único e sempre ativo.

---

# Phase 9.7 - Command Intent NLP e Conexão Holyrics Web

Objetivo:

Substituir as expressões fixas do guard por um classificador de intenção
NLP.js local e adicionar o modo de conexão web oficial do Holyrics como
alternativa ao modo local.

Status: **Concluída em 29 de junho de 2026.**

Tarefas:

- [x] criar `CommandIntentClassifierService`
- [x] treinar NLP.js local em memória a partir de exemplos versionados
- [x] criar perfil de treinamento `pt-BR` em `src/modules/command/nlp/`
- [x] classificar intenção em navegação explícita, referência casual,
  contexto relativo casual e referência direta sem ação
- [x] manter `CommandIntentGuardService` como responsável pela decisão final
- [x] preservar o comportamento dos modos `conservative` e `fast`
- [x] reconhecer variações faladas de frases de ação (`vamos parar`,
  `acompanhe comigo em`, entre outras)
- [x] adicionar `holyricsConnectionMode` (`local` ou `web`) ao Settings Module
- [x] adicionar `holyricsApiKey` persistido e protegido como o token
- [x] implementar o modo `web` no provider HTTP do Holyrics
  (`https://api.holyrics.com.br/request/<ação>`)
- [x] manter o modo `local` como padrão do projeto
- [x] atualizar `/settings` com o seletor de tipo de conexão
- [x] atualizar diagnóstico e payloads realtime sem expor API key ou token
- [x] atualizar `docs/command-interpreter.md`, `docs/holyrics.md`,
  `docs/bible-navigation.md`, `docs/realtime.md` e `README.md`

Critérios de aceite:

- [x] frases de treinamento executam a navegação esperada
- [x] frases casuais continuam bloqueadas nos dois modos
- [x] modo `web` autentica sem host/porta local
- [x] modo `local` continua funcionando sem API key
- [x] API key nunca é retornada por `GET /api/settings`
- [x] testes passam
- [x] build passa

Fora de escopo:

- IA generativa ou LLM externo
- fluxo `Auth` com nonce/hash do Holyrics
- polling contínuo
- funcionalidades de louvor
- Phase 10

Nota de 1 de setembro de 2026: o classificador NLP.js desta fase foi
substituído na Phase 9.8 por regras determinísticas, após testes reais
mostrarem que o conjunto de treinamento crescia por tentativa e erro sem
generalizar de forma confiável.

---

# Phase 9.8 - Sinais de Intenção Determinísticos e Correção de Transcrição

Objetivo:

Substituir o classificador NLP.js por regras explícitas e auditáveis, e
corrigir erros comuns de transcrição do Vosk em palavras-chave do domínio
(como "capítulo"), identificados em testes reais com pregadores.

Status: **Concluída em 1 de setembro de 2026.**

Tarefas:

- [x] criar `CommandIntentSignalsService` com regras determinísticas:
  marcadores de citação casual, verbos/expressões de ação restritos ao trecho
  antes da referência, e negação
- [x] remover `CommandIntentClassifierService`, a pasta `nlp/` de exemplos de
  treinamento e a dependência `node-nlp`
- [x] tratar livros que começam com "2" no nome como exceção ao marcador de
  citação `segundo`/`2`
- [x] criar `TranscriptionCorrectionService` com mapa de confusões conhecidas
  (`capeta` → `capitulo`) e distância de edição como reforço para desvios
  pequenos
- [x] inserir a correção de transcrição entre o `NumberNormalizerService` e o
  `PtBrCommandParser`
- [x] manter o comportamento já validado dos modos `conservative` e `fast`
- [x] atualizar `docs/command-interpreter.md`

Critérios de aceite:

- [x] "capítulo" transcrito como "capeta" continua resolvendo a referência
  corretamente
- [x] frases de ação continuam executando quando o verbo vem antes da
  referência
- [x] a mesma palavra depois da referência (uso narrativo) não é tratada como
  comando
- [x] frases casuais continuam bloqueadas nos dois modos
- [x] referências a livros numerados (2 Pedro, 2 João, 2 Samuel...) não são
  tratadas como citação casual
- [x] testes passam
- [x] build passa

Fora de escopo:

- gatilho de ativação (wake word) dedicado
- repetição da mesma referência como confirmação implícita
- fuzzy matching de nomes de livros
- IA generativa, LLM ou modelo treinado
- Phase 10

---

# Phase 9.9 - Repetição como Confirmação

Objetivo:

Tratar a repetição da mesma referência bíblica, pouco depois de o sistema
não ter reconhecido a ação da primeira vez, como uma confirmação implícita —
sem exigir um gatilho de voz na segunda tentativa.

Status: **Concluída em 1 de setembro de 2026.**

Tarefas:

- [x] criar `CommandRepetitionService` com janela de 8 segundos
- [x] lembrar apenas referências ignoradas por `unknown_or_unsafe`
- [x] confirmar repetição exata da mesma referência
- [x] confirmar refinamento de capítulo (versículo 1 assumido) para versículo
  específico no mesmo capítulo
- [x] esquecer a referência lembrada após qualquer execução
- [x] não confirmar por repetição decisões de `casual_reference`
- [x] adicionar o motivo `repeated_reference` a `CommandIntentReason`
- [x] atualizar `docs/command-interpreter.md`

Critérios de aceite:

- [x] referência direta ignorada, repetida em seguida sem gatilho, executa na
  segunda tentativa
- [x] uma referência diferente não é confirmada pela pendente anterior
- [x] uma citação casual da mesma referência não confirma a repetição nem é
  confirmada por ela
- [x] o estado de repetição não vaza entre instâncias de teste
- [x] testes passam
- [x] build passa

Fora de escopo:

- gatilho de ativação (wake word) dedicado
- fuzzy matching de nomes de livros
- confirmação por repetição de comandos relativos (próximo/anterior)
- IA generativa, LLM ou modelo treinado
- Phase 10

---

# Phase 9.10 - Palavra de Ativação

Objetivo:

Adicionar uma palavra de ativação configurável, dedicada e de alta
prioridade, como alternativa mais simples aos verbos de ação da Phase 9.8
para pregadores/igrejas que preferem um hábito único e mais previsível.

Status: **Concluída em 1 de setembro de 2026.**

Tarefas:

- [x] adicionar `voiceActivationWord` ao Settings Module (persistido,
  padrão `sistema`, texto vazio desativa)
- [x] expor o campo em `GET/PUT /api/settings` e no evento
  `SETTINGS_UPDATED` (não é secreto)
- [x] adicionar campo em `/settings` para configurar a palavra
- [x] reconhecer a palavra de ativação em `CommandIntentSignalsService`,
  com prioridade sobre marcadores de citação casual e sobre negação
- [x] ignorar acentuação e maiúsculas/minúsculas, exigindo a palavra inteira
- [x] manter o comportamento existente quando a palavra está desativada
- [x] atualizar `docs/command-interpreter.md` e `docs/realtime.md`

Critérios de aceite:

- [x] a palavra de ativação executa uma referência mesmo sem verbo de ação
- [x] a palavra de ativação tem prioridade sobre citação casual
- [x] uma palavra parecida, mas diferente, não é reconhecida
- [x] com o campo vazio, o comportamento volta a ser o da Phase 9.8/9.9
- [x] a palavra de ativação nunca é tratada como segredo
- [x] testado manualmente via `/settings` e `POST /api/commands/interpret`
- [x] testes passam
- [x] build passa

Fora de escopo:

- múltiplas palavras de ativação simultâneas
- detecção de wake word por áudio antes da transcrição (nível Vosk)
- fuzzy matching de nomes de livros
- IA generativa, LLM ou modelo treinado
- Phase 10

---

# Phase 9.11 - Fuzzy Matching de Nomes de Livros

Objetivo:

Corrigir pequenos desvios de transcrição em nomes de livros bíblicos (ex.:
"apocaliste" em vez de "apocalipse"), estendendo a correção de transcrição da
Phase 9.8 com as salvaguardas extras que o risco de confundir livros exige.

Status: **Concluída em 1 de setembro de 2026.**

Tarefas:

- [x] criar `BookNameCorrectionService`, com vocabulário derivado
  exclusivamente de `book.id` (sem duplicar lista bíblica)
- [x] usar distância de edição menor que a de `TranscriptionCorrectionService`
  (1 para até 5 letras, 2 para maiores)
- [x] nunca corrigir quando duas palavras do vocabulário empatam em distância
- [x] só tentar a correção quando a palavra é seguida por um número
  (capítulo/versículo), para não corrigir palavras comuns do português no
  meio de uma frase qualquer
- [x] validar empiricamente contra uma lista de palavras comuns em pregação,
  incluindo os verbos de ação já usados como gatilho
- [x] inserir o serviço entre `TranscriptionCorrectionService` e o parser
- [x] atualizar `docs/command-interpreter.md`

Critérios de aceite:

- [x] "apocaliste 12 13" resolve para Apocalipse 12:13
- [x] "2 petro 1" resolve para 2 Pedro 1, sem alterar o número
- [x] uma palavra ambígua entre dois livros não é corrigida
- [x] "vamos" e "amor" não são corrigidos para "Amós" em frases comuns
- [x] um nome de livro já correto, com ou sem acento, nunca é alterado
- [x] palavras curtas (< 4 letras) não são candidatas
- [x] testes passam
- [x] build passa

Fora de escopo:

- correção de referências de livro isolado, sem capítulo nem versículo
- IA generativa, LLM ou modelo treinado
- Phase 10

---

# Phase 9.12 - Corte Proativo de Segmento e Junção de Borda

Objetivo:

Corrigir dois problemas observados em teste real com pregação contínua e sem
pausas: palavras quebradas no fim de segmentos muito longos (o Vosk/Kaldi
degrada internamente), e comandos partidos entre dois segmentos de
transcrição.

Status: **Concluída em 1 de setembro de 2026.**

Tarefas:

- [x] adicionar temporizador de segmento (`MAX_SEGMENT_DURATION_MS`, 12s) ao
  `VoskSpeechProvider`
- [x] forçar `recognizer.finalResult()` proativamente quando o temporizador
  expira sem uma transcrição final natural
- [x] cancelar o temporizador a cada transcrição final natural e ao
  parar/descartar o provider
- [x] adicionar parâmetro `record` a `CommandIntentGuardService.decide()`
  para avaliações exploratórias sem gravar efeitos de repetição
- [x] tentar junção de borda no `CommandService` quando o segmento isolado
  resulta em `unknown_or_unsafe`: até 8 palavras do fim do segmento anterior
  coladas na frente do atual, reprocessadas pela correção de transcrição e
  pelo parser
- [x] nunca reaproveitar um segmento anterior que já executou como isca de
  junção
- [x] manter a transcrição normalizada exibida em `/settings` sempre como a
  do segmento isolado, nunca a combinada
- [x] atualizar `docs/speech-providers.md` e `docs/command-interpreter.md`

Critérios de aceite:

- [x] fala contínua sem pausa por mais de 12s gera um corte proativo, sem
  esperar o Vosk decidir sozinho
- [x] um corte natural cancela o temporizador pendente
- [x] gatilho no segmento anterior + referência sozinha no atual executa
- [x] livro no segmento anterior + capítulo/versículo separado no atual
  executa
- [x] dois segmentos comuns não combinam em um comando falso
- [x] um segmento já executado não é reaproveitado por um segmento seguinte
  não relacionado
- [x] a confirmação por repetição (Phase 9.9) continua funcionando quando a
  junção de borda não resolve
- [x] testes passam
- [x] build passa
- [x] testado manualmente via `/api/commands/interpret`

Fora de escopo:

- processamento de comandos em transcrições parciais (somente finais)
- junção de mais de dois segmentos
- ajuste automático da duração máxima de segmento por igreja
- IA generativa, LLM ou modelo treinado
- Phase 10

---

# Phase 9.13 - Remoção do Modo Conservador

Objetivo:

Simplificar o guard de intenção removendo a escolha entre os modos
`conservative` e `fast`: o modo `conservative` só adicionava uma etapa extra
(exigir um verbo de ação antes de toda referência direta) sem ganho real de
segurança, já que frases casuais já são bloqueadas pelo
`CommandIntentSignalsService` independentemente do modo. O comportamento do
antigo modo `fast` passa a ser o único e sempre ativo.

Status: **Concluída em 1 de setembro de 2026.**

Tarefas:

- [x] remover o parâmetro de modo de `CommandIntentGuardService.decide()`
- [x] tornar unconditional a execução de referência direta
  (`isDirectReference`)
- [x] remover `voiceCommandMode` e `VoiceCommandMode` de `Settings`,
  `PublicSettings`, `UpdateSettingsDto` e `SettingsUpdatedPayload`
- [x] remover a validação e a leitura de `voiceCommandMode` em
  `SettingsService`
- [x] remover a coluna do fluxo de leitura/escrita do
  `SettingsRepository`, mantendo a coluna `voice_command_mode` no SQLite
  (sem uso) para não exigir uma migração destrutiva
- [x] remover o seletor "Modo de comando por voz" de `/settings`
- [x] atualizar `docs/command-interpreter.md` e `docs/realtime.md`
- [x] atualizar a suíte de testes para o comportamento único

Critérios de aceite:

- [x] uma referência direta (`Apocalipse 12 13`) sempre executa, sem
  gatilho, sem depender de nenhuma configuração
- [x] a confirmação por repetição (Phase 9.9) e a junção de borda
  (Phase 9.12) continuam funcionando para referências embutidas numa frase
  maior, sem verbo de ação
- [x] frases casuais continuam bloqueadas
- [x] `GET /api/settings` não retorna mais `voiceCommandMode`
- [x] bancos SQLite existentes continuam abrindo sem erro
- [x] testado manualmente via `/settings` e `POST /api/commands/interpret`
- [x] testes passam
- [x] build passa

Fora de escopo:

- remover a coluna `voice_command_mode` do SQLite (migração destrutiva)
- fuzzy matching de nomes de livros além do já feito na Phase 9.11
- IA generativa, LLM ou modelo treinado
- Phase 10

---

# Phase 10 - System Hardening

Objetivo:

Melhorar estabilidade para uso real.

Status: **Em andamento desde 3 de setembro de 2026.**

Tarefas:

- [x] revisar tratamento de erros (auditoria completa de
  `SpeechService`, `CommandService`, `BibleNavigationService`,
  `HolyricsBibleProjectionService`, providers de voz e microfone)
- [x] melhorar mensagens para usuários não técnicas (já em boa forma desde
  fases anteriores; nenhuma mensagem técnica/stack trace encontrada exposta
  ao usuário)
- [x] adicionar logs por módulo (`CommandService`, `BibleNavigationService`
  e `SettingsService` não tinham nenhum log; agora registram decisões de
  comando, navegação aplicada/rejeitada e configurações atualizadas)
- [ ] criar página ou bloco de status do sistema (avaliado: hoje o estado
  já aparece em badges por seção — Holyrics, Speech Provider e Status do
  sistema/rede — em vez de um bloco único; decidir com o mantenedor se vale
  consolidar ou se os badges por seção já são suficientes)
- [x] validar configurações antes de iniciar captura (já existia desde a
  Phase 7: `SpeechService.initialize()` rejeita sem modelo Vosk ou
  microfone configurados)
- [x] impedir falhas silenciosas (bug real corrigido: em
  `SpeechService.handleTranscription()`, `commandService.identify(...)` era
  chamado sem `await` nem `.catch()`, arriscando uma rejeição de Promise não
  tratada sem nenhum log ou aviso ao usuário)
- [x] revisar comportamento quando Holyrics cair (`HolyricsBibleProjectionService`
  já captura toda falha, preserva a navegação local, registra aviso e emite
  `SYSTEM_ERROR` com mensagem segura — nenhuma mudança necessária)
- [x] revisar comportamento quando microfone cair (`VoskSpeechProvider`
  já valida o microfone configurado antes de iniciar e converte falhas em
  `SpeechProviderError` com mensagem clara — nenhuma mudança necessária)
- [x] revisar comportamento quando modelo Vosk estiver inválido
  (`VoskSpeechProvider.validateModel()` já distingue modelo ausente de
  estrutura inválida com mensagens específicas — nenhuma mudança necessária)

Critérios de aceite:

- [x] erros comuns são compreensíveis
- [x] sistema não quebra silenciosamente
- [x] usuário sabe o que corrigir
- [x] logs ajudam contribuidores a debugar
- [x] testes passam
- [x] build passa

Fora de escopo (por ora):

- consolidar os três blocos de status de `/settings` em um único painel
  (pendente de decisão do mantenedor, para não recriar o excesso de
  informação simplificado na Phase 9)

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
