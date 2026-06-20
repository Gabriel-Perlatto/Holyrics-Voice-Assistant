# CONTEXT.md

# Project

Nome temporário: **Holyrics Voice Assistant**

Projeto Open Source para automatizar e facilitar o controle do Holyrics em igrejas, especialmente durante pregações, cultos e momentos de louvor.

O objetivo principal é reduzir ou eliminar a necessidade de um operador humano dedicado ao telão, permitindo que pregadores e equipes controlem o Holyrics por meio de voz, celular, tablet ou computador na rede local.

O projeto deve funcionar de forma local e offline-first, sem depender de internet para operação normal.

---

# Main Objective

O sistema deve atuar como uma camada de automação sobre o Holyrics.

O Holyrics continua sendo a ferramenta principal para projeção, Bíblia, louvores, apresentações e mídia.

Este projeto não deve substituir o Holyrics.

Este projeto deve controlar o Holyrics usando sua API sempre que possível.

A ideia central é:

1. Capturar comandos ou ações do usuário.
2. Interpretar a intenção.
3. Enviar o comando correto para o Holyrics.
4. Manter a interface local sincronizada com o estado atual.

---

# Product Vision

O projeto deve ajudar igrejas pequenas, médias e voluntários que nem sempre têm uma equipe técnica disponível.

O sistema deve ser simples o suficiente para ser configurado uma vez e usado durante os cultos com o mínimo possível de intervenção.

Casos principais:

- Pregador quer abrir uma passagem bíblica rapidamente.
- Pregador quer avançar para o próximo versículo.
- Pregador quer trocar a versão bíblica usada.
- Pregador quer usar um painel manual quando a voz falhar.
- Equipe de louvor quer controlar ou acompanhar a sequência de músicas.
- Técnico ou voluntário quer configurar microfone, Holyrics e reconhecimento de voz.
- Celulares da igreja devem acessar o sistema facilmente por QR Code.

---

# Open Source Requirements

Este projeto é Open Source.

Todo código deve priorizar:

- clareza
- simplicidade
- documentação
- facilidade para novos contribuidores
- baixo acoplamento
- facilidade de instalação

Sempre que uma funcionalidade relevante for criada, atualizar também:

- documentação
- exemplos
- instruções de instalação
- instruções de uso
- decisões arquiteturais, se necessário

Nenhuma regra importante deve existir apenas no código.

Toda decisão relevante deve estar documentada.

O projeto deve ser amigável para voluntários que desejem contribuir.

---

# Language Strategy

Idioma principal inicial:

- Português do Brasil (`pt-BR`)

O projeto deve ser preparado para múltiplos idiomas.

Idiomas futuros podem incluir:

- Inglês
- Espanhol
- Francês
- outros idiomas adicionados por contribuidores

Não hardcodar textos de interface ou comandos diretamente na regra de negócio.

Textos, aliases, nomes bíblicos, comandos e sinônimos devem ser organizados em arquivos de idioma quando possível.

Exemplo:

- `pt-BR`
- `en-US`
- `es-ES`

A primeira implementação funcional deve focar em `pt-BR`.

---

# Offline First

O sistema deve funcionar sem internet.

A operação normal deve depender apenas de:

- computador local executando o sistema
- rede local ou Wi-Fi da igreja
- Holyrics acessível na rede local
- modelo local de reconhecimento de voz, quando usado

Internet pode ser útil para:

- baixar modelos
- instalar dependências
- consultar documentação
- atualizar o sistema

Mas internet não deve ser obrigatória durante o culto.

---

# Local Network Usage

O sistema deve expor uma aplicação web local acessível pela rede da igreja.

Ao iniciar o servidor, o terminal deve exibir:

- endereço local da aplicação
- QR Code apontando para esse endereço

Exemplo:

```txt
Servidor iniciado em:

http://192.168.0.50:3000

Aponte a câmera do celular para o QR Code abaixo para acessar.
```

O objetivo é permitir que celulares, tablets e notebooks acessem o sistema sem configuração complexa.

A aplicação deve funcionar bem em dispositivos móveis.

---

# Main Interface / Local Hub

A tela inicial da aplicação deve ser um hub local simples.

Ela deve conter as principais áreas do sistema:

- Pregador
- Louvor
- Configurações

A tela inicial não deve assumir que existe um operador dedicado.

O sistema deve ser pensado para funcionar com o mínimo possível de intervenção humana.

O usuário acessa o QR Code, abre o sistema e escolhe qual área deseja usar.

---

# Main Routes

Rotas sugeridas:

```txt
/                → Hub inicial
/preacher        → Tela do pregador
/worship         → Tela da equipe de louvor
/settings        → Tela de configurações
```

Rotas internas podem ser adicionadas conforme necessidade.

---

# Settings Interface

A tela de Configurações substitui a antiga ideia de uma tela principal de operador.

Ela pode ser usada por um técnico, operador eventual, voluntário ou responsável pela mídia.

Responsabilidades:

- configurar IP/host do Holyrics
- configurar porta/API do Holyrics
- testar conexão com Holyrics
- selecionar microfone
- selecionar modelo de reconhecimento de voz
- selecionar idioma principal do sistema
- iniciar/parar captura de áudio
- visualizar transcrição em tempo real
- visualizar logs básicos
- verificar status dos serviços locais
- persistir configurações

Configurações devem ser salvas localmente.

Ao reiniciar o sistema, ele deve restaurar as últimas configurações usadas.

Se Holyrics, microfone e modelo de voz estiverem configurados corretamente, o sistema pode iniciar a captura automaticamente.

A tela de Configurações não deve ser necessária durante o culto em condições normais.

---

# Preacher Interface

Interface usada pelo pregador.

Deve ser otimizada para celular e tablet.

Objetivo:

Permitir que o pregador controle passagens bíblicas rapidamente, tanto por voz quanto por toques na tela.

A interface deve ser simples, direta e sem excesso de informação.

---

# Preacher Interface - Bible Navigation

O pregador deve conseguir selecionar uma passagem em até 3 etapas:

1. Livro
2. Capítulo
3. Versículo

Fluxo:

```txt
Livros
→ Capítulos
→ Versículos
```

Ao selecionar um livro, o painel de livros desaparece e aparece o painel de capítulos.

Ao selecionar um capítulo, o painel de capítulos desaparece e aparece o painel de versículos.

No topo da interface deve aparecer o estado atual:

- livro selecionado
- capítulo selecionado
- versículo selecionado
- versão bíblica selecionada

Navegação superior:

- botão para voltar para Livros
- botão para voltar para Capítulos, quando aplicável

Exemplo:

```txt
[← Livros] [← Capítulos]

João 3:16
Versão: NVI
```

A navegação manual deve evitar scrolls longos sempre que possível.

A prioridade é acesso rápido durante a pregação.

---

# Preacher Interface - Bible Version

A versão bíblica deve ser uma opção do pregador.

Ela não deve ser tratada apenas como uma configuração técnica global.

Motivo:

Cada pregador pode preferir uma tradução diferente.

Exemplos:

- ACF
- ARC
- NVI
- NAA
- outras versões disponíveis no Holyrics

A versão atualmente selecionada deve ficar visível na tela do pregador.

Sempre que uma passagem for enviada ao Holyrics, a versão selecionada pelo pregador deve ser respeitada.

A escolha da versão bíblica deve ser persistida por dispositivo ou por sessão quando possível.

Exemplo:

Se o pregador selecionou `NVI`, então comandos como:

```txt
João 3:16
próximo versículo
Romanos 8
```

devem usar a versão `NVI`, salvo se o pregador trocar manualmente.

---

# Preacher Interface - Favorite Bible Version

O pregador pode ter uma versão bíblica favorita.

Ao abrir novamente a tela do pregador no mesmo dispositivo, o sistema deve tentar restaurar a última versão usada.

Essa preferência pode ser salva localmente no navegador do dispositivo.

Não exigir login para isso na primeira versão.

---

# Voice Recognition

O sistema deve suportar reconhecimento de voz local.

Primeiro provider planejado:

- Vosk

Mas a arquitetura não deve ser acoplada ao Vosk.

Deve existir uma abstração de Speech Provider.

Exemplos de providers futuros:

- Vosk
- Whisper.cpp
- Faster Whisper
- outros motores locais ou remotos

Na primeira versão, o foco deve ser reconhecimento local offline.

---

# Speech Provider Abstraction

Criar uma camada abstrata para reconhecimento de voz.

A lógica de negócio não deve depender diretamente do Vosk.

Exemplo conceitual:

```txt
SpeechProvider
├── VoskSpeechProvider
├── WhisperCppSpeechProvider
└── FutureSpeechProvider
```

Responsabilidades do provider:

- iniciar captura
- parar captura
- retornar texto transcrito
- emitir eventos de transcrição parcial, se suportado
- emitir eventos de transcrição final
- informar erros

---

# Voice Command Interpretation

O sistema deve interpretar texto transcrito e transformar em intenção.

Exemplos de intenções:

- abrir passagem bíblica
- avançar versículo
- voltar versículo
- trocar versão bíblica
- abrir livro
- abrir capítulo
- abrir louvor
- avançar slide
- voltar slide
- parar apresentação

A interpretação deve considerar contexto.

Exemplo:

Se o pregador disse:

```txt
João capítulo 3 versículo 16
```

e depois disse:

```txt
próximo
```

O sistema deve entender que o próximo é provavelmente João 3:17.

Mas se o pregador disse:

```txt
o próximo irmão pode vir aqui
```

O sistema não deve avançar o versículo.

A lógica deve evitar comandos falsos positivos.

Comandos críticos devem ser confirmados por contexto sempre que possível.

---

# Bible Command Examples - pt-BR

O sistema deve reconhecer variações comuns de fala em português brasileiro.

Exemplos:

```txt
João 3:16
João capítulo 3 versículo 16
Evangelho de João capítulo 3 versículo 16
Salmo 23
Salmos 23
Romanos capítulo 8
Primeira Coríntios 13
Segundo Timóteo 4
Gênesis 1
Apocalipse 21
```

Também deve reconhecer comandos de navegação:

```txt
próximo
próximo versículo
versículo seguinte
voltar
versículo anterior
anterior
```

A lógica deve distinguir esses comandos de frases naturais.

---

# Bible Book Aliases

Nomes, abreviações e variações de livros bíblicos devem ficar em arquivos de idioma.

Exemplo para `pt-BR`:

```txt
Gênesis
Genesis
Gn

João
Evangelho de João
Jo

1 Coríntios
Primeira Coríntios
Primeiro Coríntios
I Coríntios

2 Timóteo
Segunda Timóteo
Segundo Timóteo
II Timóteo
```

Não hardcodar aliases dentro da lógica principal.

---

# Bible Context

O sistema deve manter contexto bíblico atual.

Contexto mínimo:

- livro atual
- capítulo atual
- versículo atual
- versão bíblica atual

Esse contexto deve ser usado para comandos como:

```txt
próximo
anterior
capítulo 4
versículo 12
```

Exemplo:

Contexto atual:

```txt
João 3:16 - NVI
```

Comando:

```txt
próximo versículo
```

Resultado esperado:

```txt
João 3:17 - NVI
```

---

# Bible Content Source

O Holyrics deve ser a fonte preferencial para conteúdo bíblico.

O sistema deve obter versões bíblicas, livros, capítulos e versículos através da API do Holyrics sempre que possível.

Se algum fallback local for criado futuramente, ele deve ser tratado como Content Provider separado, sem substituir o Holyrics como integração principal.

---

# Content Provider Abstraction

O sistema deve ter uma abstração para fontes de conteúdo.

Exemplo:

```txt
ContentProvider
├── BibleContentProvider
├── SongContentProvider
├── PresentationContentProvider
└── FutureContentProvider
```

A lógica de interface e comandos não deve depender diretamente de uma única fonte.

---

# Holyrics Integration

O Holyrics é a integração principal.

O sistema deve controlar o Holyrics através de sua API.

Responsabilidades da integração:

- testar conexão
- listar versões bíblicas, se disponível
- enviar passagem bíblica para exibição
- controlar próximo/anterior quando aplicável
- listar músicas/louvores, se disponível
- controlar apresentação de louvores, se disponível
- consultar estado atual, se disponível

Não inventar funcionalidades que o Holyrics já faz bem.

Sempre reutilizar a API do Holyrics quando possível.

Se a API do Holyrics não permitir alguma função, documentar claramente a limitação.

---

# Worship Interface

Interface usada pela equipe de louvor.

A tela de louvor deve ser separada da tela do pregador.

Objetivo:

Ajudar a equipe de louvor a controlar ou acompanhar músicas e sequência de louvores no Holyrics.

Responsabilidades iniciais:

- visualizar lista/sequência de louvores
- visualizar música atual
- visualizar próxima música
- avançar manualmente quando necessário
- voltar manualmente quando necessário
- permitir seleção rápida de louvor, se a API permitir
- exibir informações relevantes para a equipe

Reconhecimento automático de canto não é requisito obrigatório da primeira versão.

---

# Worship Auto Advance

Reconhecimento automático de canto ou avanço automático por letra cantada é uma funcionalidade futura.

Não implementar como requisito obrigatório do MVP.

Motivos:

- canto é mais difícil de reconhecer do que fala
- há variações de ritmo
- a igreja pode repetir partes
- a equipe pode improvisar
- reconhecimento de música pode gerar muitos falsos positivos

Na primeira versão, priorizar controle manual simples, confiável e rápido.

Funcionalidades futuras podem incluir:

- detecção de trecho cantado
- acompanhamento por tempo da música
- sequência com temporização
- integração com áudio da mesa
- modo ensaio

---

# UI Principles

A interface deve ser simples.

Prioridades:

1. Botões grandes
2. Pouco texto
3. Alto contraste
4. Uso fácil em celular
5. Poucas etapas
6. Evitar scrolls longos
7. Evitar menus complexos durante o culto
8. Funcionar bem em tablets e celulares antigos

Durante o culto, velocidade é mais importante que estética complexa.

---

# Device Roles

O sistema pode ser acessado por diferentes dispositivos ao mesmo tempo.

Exemplos:

- celular do pregador na rota `/preacher`
- tablet da equipe de louvor na rota `/worship`
- notebook do técnico na rota `/settings`

O sistema deve permitir múltiplos clientes conectados na rede local.

Quando possível, os clientes devem receber atualizações em tempo real.

---

# Real Time Communication

Quando necessário, usar comunicação em tempo real entre servidor e interfaces.

Possibilidades:

- WebSocket
- Server-Sent Events
- polling simples, se for suficiente

Eventos úteis:

- transcrição recebida
- comando interpretado
- passagem atual alterada
- versão bíblica alterada
- status do Holyrics alterado
- música atual alterada
- erro de conexão
- captura iniciada/parada

---

# Persistence

Configurações técnicas devem ser persistidas localmente.

Exemplos:

- host/IP do Holyrics
- porta/API do Holyrics
- microfone selecionado
- modelo de voz selecionado
- idioma principal do sistema
- captura automática ligada/desligada

Preferências do pregador podem ser persistidas localmente no dispositivo.

Exemplos:

- última versão bíblica usada
- preferências visuais futuras

Persistência inicial pode ser simples.

Evitar banco complexo se não for necessário no MVP.

---

# Suggested Technical Direction

O projeto pode usar uma arquitetura web local.

Sugestão possível:

- backend local em Node.js/NestJS
- frontend web responsivo
- comunicação via HTTP/WebSocket
- integração com Holyrics via API local
- processo local para reconhecimento de voz

Essa sugestão não é obrigatória se houver decisão técnica melhor.

Mas qualquer stack escolhida deve respeitar:

- offline-first
- fácil instalação
- open source
- baixo acoplamento
- boa documentação
- facilidade para voluntários contribuírem

---

# Module Boundaries

Separar responsabilidades.

Sugestão conceitual:

```txt
App
├── Holyrics Integration
├── Speech Recognition
├── Command Interpreter
├── Bible Context
├── Worship Control
├── Local Settings
├── Web UI
└── Realtime Events
```

Cada módulo deve ter responsabilidade clara.

Evitar misturar lógica de transcrição, interpretação, UI e API do Holyrics no mesmo arquivo.

---

# Error Handling

Erros devem ser tratados com mensagens claras.

Exemplos:

- Holyrics não encontrado
- API do Holyrics indisponível
- microfone não encontrado
- modelo de voz não configurado
- modelo de voz inválido
- comando não reconhecido
- passagem bíblica não encontrada
- versão bíblica indisponível
- dispositivo sem permissão de áudio

A interface deve explicar o problema de forma simples para voluntários.

---

# Security

O sistema roda em rede local.

Mesmo assim, não deve expor controles sensíveis desnecessariamente.

Regras iniciais:

- não depender de autenticação complexa no MVP
- evitar exposição pública na internet
- mostrar aviso se o sistema estiver acessível fora da rede local
- não armazenar dados sensíveis
- não exigir login para uso básico

Futuramente pode existir PIN local para proteger configurações.

---

# Accessibility

O sistema deve ser utilizável por pessoas com pouca familiaridade técnica.

Priorizar:

- botões grandes
- textos simples
- feedback visual claro
- mensagens de erro compreensíveis
- bom funcionamento em celulares
- contraste adequado

---

# MVP Scope

A primeira versão funcional deve focar em:

1. Servidor local acessível via Wi-Fi.
2. QR Code no terminal apontando para o hub local.
3. Hub inicial com Pregador, Louvor e Configurações.
4. Configuração de conexão com Holyrics.
5. Teste de conexão com Holyrics.
6. Tela do pregador com seleção manual de livro, capítulo e versículo.
7. Seleção de versão bíblica na tela do pregador.
8. Envio da passagem selecionada para o Holyrics.
9. Configuração de microfone e modelo de voz.
10. Transcrição local com Vosk.
11. Interpretação básica de comandos bíblicos em `pt-BR`.
12. Comandos básicos de próximo/anterior.
13. Tela de louvor simples com controles manuais, conforme API do Holyrics permitir.
14. Persistência local das configurações.
15. Documentação básica de instalação e uso.

---

# Out of Scope for MVP

Não implementar na primeira versão:

- reconhecimento automático de canto
- IA generativa obrigatória
- dependência de internet
- login completo
- sistema multi-igreja
- dashboard na nuvem
- sincronização remota
- app mobile nativo
- controle avançado de permissões
- banco de dados complexo
- editor próprio de letras
- substituto completo do Holyrics

Esses itens podem ser considerados no futuro.

---

# Future Features

Possibilidades futuras:

- suporte a Whisper.cpp
- suporte a Faster Whisper
- suporte a múltiplos idiomaspara
- controle por smartwatch
- integração com Stream Deck
- integração MIDI
- integração OBS
- modo ensaio para louvor
- reconhecimento de canto
- temporização por música
- PIN de segurança para configurações
- perfis de dispositivo
- temas de interface
- instalação empacotada para Windows/Linux
- suporte a Raspberry Pi
- modo kiosk
- backup e exportação de configurações

---

# Development Philosophy

Prioridades do projeto:

1. Confiabilidade
2. Simplicidade
3. Offline-first
4. Integração correta com Holyrics
5. Baixo consumo de recursos
6. Facilidade para igrejas pequenas
7. Facilidade para voluntários contribuírem
8. Código compreensível
9. Documentação clara
10. Evitar complexidade prematura

Evitar dependências desnecessárias.

Evitar soluções que só funcionem com internet.

Evitar acoplamento direto a um único motor de reconhecimento de voz.

Evitar acoplamento direto a um único idioma.

Evitar transformar o projeto em um substituto do Holyrics.

---

# Instructions for AI Coding Agents

Ao trabalhar neste projeto:

1. Leia este `CONTEXT.md` antes de qualquer implementação.
2. Preserve a visão offline-first.
3. Preserve o foco em Holyrics.
4. Preserve a arquitetura baseada em providers.
5. Não hardcode comandos em português dentro da regra principal.
6. Não implemente reconhecimento automático de canto no MVP.
7. Não crie dependência obrigatória de internet.
8. Não transforme a tela de configurações em tela principal de operador.
9. A tela principal deve ser o hub local.
10. A versão bíblica deve ser opção do pregador.
11. Toda funcionalidade nova deve ser documentada.
12. Prefira código simples, testável e fácil de entender.
13. Quando houver dúvida, priorize uso real em igrejas pequenas.
14. Não implemente features grandes sem atualizar documentação.
15. Se a API do Holyrics não suportar algo, documente a limitação em vez de criar comportamento falso.
