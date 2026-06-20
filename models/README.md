# Modelos de reconhecimento de voz

Esta pasta é o local convencional para modelos locais de reconhecimento de
voz. Os modelos não fazem parte do repositório e devem ser instalados
manualmente.

Use diretórios de idioma no padrão BCP 47:

```text
models/
├── pt-BR/
│   └── vosk-model-small-pt-0.3/
├── en-US/
│   └── nome-do-modelo/
└── README.md
```

Para reutilizar um modelo existente:

1. copie ou mova manualmente o diretório completo do modelo para o idioma
   correspondente; ou
2. mantenha o modelo em outro local e configure seu caminho absoluto em
   `/settings`.

Exemplo recomendado para português:

```text
models/pt-BR/vosk-model-small-pt-0.3
```

Configure esse caminho na tela de Configurações. Caminhos relativos são
resolvidos a partir da raiz do projeto; caminhos absolutos também são aceitos.
Nesta fase, o sistema verifica apenas se o caminho existe e é um diretório. O
conteúdo não é carregado nem validado pelo Vosk.

Todo conteúdo abaixo de `models/` é ignorado pelo Git, exceto este README e
arquivos `.gitkeep`. Não force a inclusão de modelos, arquivos compactados ou
artefatos derivados no repositório.
