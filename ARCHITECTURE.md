# ARCHITECTURE.md

# Purpose

Este documento define a arquitetura técnica oficial do projeto.

Todo código deve seguir esta estrutura.

Antes de criar novos módulos, serviços ou funcionalidades, verificar este documento.

Se uma alteração arquitetural relevante for necessária, atualizar este documento.

---

# Architecture Overview

O sistema é uma aplicação local executada através do NestJS.

O NestJS é responsável por:

- API HTTP
- WebSocket
- Servir interface web
- Integração com Holyrics
- Reconhecimento de voz
- Persistência local
- Orquestração dos módulos

O sistema deve funcionar sem internet.

Todo acesso externo deve ser opcional.

---

# High Level Flow

Fluxo principal de voz:

```txt
Microfone
↓
Speech Provider
↓
Command Interpreter
↓
Holyrics Module
↓
Holyrics API
```

Fluxo manual:

```txt
Interface Web
↓
HTTP/WebSocket
↓
Command Interpreter
↓
Holyrics Module
↓
Holyrics API
```

Toda ação deve passar pelo Command Interpreter.

Interfaces não devem chamar diretamente a API do Holyrics.

---

# Directory Structure

Estrutura oficial:

```txt
src/
├── app/
├── modules/
├── shared/
└── main.ts

public/
├── pages/
├── js/
├── css/
└── assets/
```

Não criar estruturas paralelas sem necessidade.

---

# src/app

Responsável pela inicialização da aplicação.

Exemplos:

```txt
src/app/
├── app.module.ts
├── app.controller.ts
├── app.service.ts
```

Responsabilidades:

- bootstrap da aplicação
- configuração global
- providers globais
- middlewares globais
- filtros globais
- interceptors globais

Não colocar regras de negócio aqui.

---

# src/modules

Contém toda a lógica de negócio.

Cada domínio deve possuir seu próprio módulo.

Estrutura sugerida:

```txt
src/modules/
├── holyrics/
├── speech/
├── commands/
├── bible/
├── worship/
├── settings/
├── realtime/
└── system/
```

Cada módulo deve possuir responsabilidade única.

---

# Holyrics Module

Responsável exclusivamente pela comunicação com o Holyrics.

Exemplos:

```txt
src/modules/holyrics/
├── controllers/
├── services/
├── dto/
├── interfaces/
└── providers/
```

Responsabilidades:

- testar conexão
- enviar comandos
- obter informações disponíveis
- encapsular chamadas da API

Nenhum outro módulo deve chamar a API do Holyrics diretamente.

---

# Speech Module

Responsável pelo reconhecimento de voz.

Responsabilidades:

- iniciar captura
- parar captura
- gerenciar providers
- emitir transcrições

Não interpretar comandos.

Apenas transformar áudio em texto.

---

# Command Module

Cérebro principal da aplicação.

Responsabilidades:

- interpretar textos
- interpretar ações da interface
- determinar intenção
- decidir ação final

Exemplos:

```txt
João 3:16
próximo versículo
Romanos capítulo 8
```

O módulo deve converter entradas em comandos internos.

---

# Bible Module

Responsável por regras bíblicas.

Responsabilidades:

- contexto atual
- livros
- capítulos
- versículos
- aliases
- versões bíblicas

Não acessar Holyrics diretamente.

Quando precisar de conteúdo externo, utilizar abstrações definidas pela arquitetura.

---

# Worship Module

Responsável pelas funcionalidades relacionadas a louvor.

Responsabilidades:

- sequência de músicas
- estado atual
- navegação
- sincronização com Holyrics

Não implementar reconhecimento automático de canto no MVP.

---

# Settings Module

Responsável por configurações locais.

Responsabilidades:

- leitura de configurações
- gravação de configurações
- validações
- configurações padrão

Exemplos:

- IP do Holyrics
- porta
- microfone
- idioma
- modelo de voz

Implementação atual:

```txt
src/modules/settings/
├── controllers/
├── dto/
├── interfaces/
├── providers/
├── repositories/
├── services/
└── settings.module.ts
```

Responsabilidades por camada:

- controller: expor leitura e atualização via HTTP;
- service: aplicar normalização e validações;
- repository: criar a tabela SQLite, inserir defaults e acessar os dados;
- provider: definir o caminho local do arquivo de dados.

Existe uma única configuração global nesta fase. O modelo contém:

- `holyricsHost`;
- `holyricsPort`;
- `language`;
- `microphone`;
- `voskModelPath`;
- `updatedAt`.

Os campos de microfone e modelo Vosk são apenas valores opcionais persistidos.
O Settings Module não acessa dispositivos, não carrega modelos e não testa
conexão com o Holyrics.

Endpoints:

```txt
GET /api/settings
PUT /api/settings
```

O `PUT` substitui o conjunto completo de configurações e retorna o estado
persistido. Validações inválidas utilizam `BadRequestException` do NestJS.

---

# Realtime Module

Responsável por comunicação em tempo real.

Tecnologia padrão:

```txt
WebSocket
```

Responsabilidades:

- broadcast de eventos
- sincronização de clientes
- atualização em tempo real

---

# System Module

Responsável por funcionalidades internas do sistema.

Exemplos:

- QR Code
- descoberta de IP local
- status do sistema
- informações da máquina

Não misturar regras de negócio aqui.

Implementação atual:

```txt
src/modules/system/
├── controllers/
├── interfaces/
├── providers/
├── services/
└── system.module.ts
```

O módulo detecta endereços IPv4 não internos e prioriza faixas privadas de
rede local (`10.0.0.0/8`, `172.16.0.0/12` e `192.168.0.0/16`). Se a leitura
das interfaces falhar ou nenhum endereço utilizável existir, utiliza
`127.0.0.1` como fallback e registra um aviso.

O endpoint `GET /api/system/status` expõe apenas informações operacionais
básicas e não persistentes: estado do servidor, IP, URL local, porta, tempo em
execução e horário da consulta.

O bootstrap escuta em `0.0.0.0` para permitir acesso por dispositivos na mesma
rede. A URL detectada e seu QR Code são exibidos no terminal. Essa exposição
deve permanecer limitada à rede local; publicação direta na internet não faz
parte da arquitetura.

---

# Shared

Código reutilizável.

Estrutura sugerida:

```txt
src/shared/
├── constants/
├── interfaces/
├── types/
├── enums/
├── helpers/
└── exceptions/
```

Não colocar lógica de domínio em shared.

---

# Frontend Structure

O frontend é servido pelo próprio NestJS.

Na Phase 0, a pasta `public` é servida diretamente pelo adaptador Express já
utilizado pelo NestJS. O `AppController` mapeia as rotas `/`, `/preacher`,
`/worship` e `/settings` para os arquivos HTML em `public/pages`.

Não há framework, template engine ou processo de build separado para o
frontend. Essa decisão mantém a fundação local simples e evita dependências
desnecessárias. Uma mudança futura deve ser justificada e documentada antes de
alterar esta estratégia.

Estrutura:

```txt
public/
├── pages/
├── js/
├── css/
└── assets/
```

---

# Pages

```txt
public/pages/
├── index.html
├── preacher.html
├── worship.html
└── settings.html
```

Responsabilidades:

index.html

- hub principal

preacher.html

- interface do pregador

worship.html

- interface do louvor

settings.html

- configurações

---

# JavaScript

```txt
public/js/
```

Organizar por funcionalidade.

Exemplo:

```txt
public/js/
├── preacher.js
├── worship.js
├── settings.js
├── websocket.js
└── api.js
```

---

# CSS

```txt
public/css/
```

Separar estilos por área quando necessário.

---

# Assets

```txt
public/assets/
```

Exemplos:

- imagens
- ícones
- logos
- fontes locais

---

# Provider Pattern

Toda integração externa deve utilizar providers.

Exemplo:

```txt
SpeechProvider
├── VoskProvider
└── FutureProvider
```

Não acoplar lógica diretamente ao Vosk.

---

# Event Driven Communication

Eventos internos devem ser utilizados quando possível.

Exemplos:

```txt
TRANSCRIPTION_RECEIVED

COMMAND_IDENTIFIED

COMMAND_EXECUTED

BIBLE_CHANGED

SONG_CHANGED

HOLYRICS_CONNECTED

HOLYRICS_DISCONNECTED
```

Evitar dependências diretas entre módulos.

---

# Persistence

Persistência oficial:

```txt
SQLite
```

Motivos:

- offline
- leve
- simples
- multiplataforma

Evitar dependências de bancos externos.

A Settings MVP utiliza `better-sqlite3` diretamente, sem ORM, porque existe
apenas uma tabela e uma configuração global. O arquivo padrão é:

```txt
data/settings.sqlite
```

O diretório é criado automaticamente. Arquivos SQLite locais não são
versionados. O caminho pode ser substituído pela variável
`SETTINGS_DATABASE_PATH`, principalmente para testes e instalações com
diretório de dados específico.

Não adicionar ORM enquanto o modelo de dados não justificar essa camada.

---

# Logging

Utilizar Logger padrão do NestJS.

Logs devem ser organizados por módulo.

Evitar console.log espalhado pelo projeto.

---

# Error Handling

Utilizar Exceptions do NestJS.

Criar exceções específicas quando necessário.

Mensagens devem ser compreensíveis para usuários não técnicos.

---

# Testing

Todo módulo novo deve possuir testes.

Tipos:

- Unit Tests
- Integration Tests quando necessário

Não depender do Holyrics real durante testes.

Utilizar mocks.

---

# Forbidden Practices

Não fazer:

- chamadas diretas ao Holyrics fora do Holyrics Module
- dependência obrigatória de internet
- lógica de negócio dentro de controllers
- lógica de negócio dentro do frontend
- dependência direta do Vosk
- acoplamento entre módulos sem interfaces claras

---

# AI Coding Agent Rules

Ao implementar funcionalidades:

1. Respeitar esta arquitetura.
2. Não criar estruturas paralelas.
3. Não ignorar os módulos definidos.
4. Utilizar providers para integrações externas.
5. Utilizar eventos para comunicação quando apropriado.
6. Manter responsabilidades separadas.
7. Atualizar documentação quando necessário.
8. Priorizar simplicidade e clareza.
