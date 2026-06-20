# Speech providers e modelos locais

## Escopo atual

A Phase 6.5 prepara somente a organização de modelos e a validação do caminho
configurado. Ela não inclui biblioteca Vosk, provider de reconhecimento,
carregamento de modelo, captura de microfone, áudio ou transcrição.

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

A validação confirma somente que o caminho existe e representa um diretório.
Ela não confirma que os arquivos formam um modelo Vosk válido.

## Modelos conhecidos

| Idioma | Modelo | Estado neste projeto |
| --- | --- | --- |
| `pt-BR` | `vosk-model-small-pt-0.3` | Artefato legado informado como funcional; ainda não carregado ou testado neste projeto |
| `en-US` | Nenhum definido | Diretório reservado para suporte futuro |

Essa distinção é intencional: afirmar compatibilidade exigirá carregar o
modelo na Phase 7, o que está fora do escopo atual.

## Adição de idiomas

Para preparar outro idioma:

1. crie `models/<código-BCP-47>/`;
2. adicione um `.gitkeep` caso o diretório vazio deva existir no repositório;
3. coloque o modelo manualmente dentro dele;
4. configure o caminho em `/settings`;
5. documente o modelo efetivamente validado quando houver um provider capaz de
   carregá-lo.

Os arquivos de modelo são ignorados pelo Git independentemente do idioma.

## Providers futuros

O provider de fala e o modelo são conceitos independentes:

- o provider adapta uma tecnologia de reconhecimento;
- o modelo é um recurso local selecionado por caminho e idioma;
- a regra de negócio deve depender da futura interface `SpeechProvider`, e não
  diretamente do Vosk;
- validar, carregar e descarregar modelos pertencerá ao Speech Module;
- o SettingsModule continuará responsável apenas por persistir preferências e
  descrever a disponibilidade do caminho.

Um futuro provider deve receber sua configuração explicitamente, validar a
compatibilidade do conteúdo e produzir eventos de transcrição sem acessar
controllers ou elementos do frontend.

## Git e distribuição

Modelos costumam ser grandes e podem possuir licenças próprias. Por isso,
`models/**/*` é ignorado, com exceção de `README.md`, diretórios e arquivos
`.gitkeep`. Um colaborador deve instalar o modelo localmente e verificar a
licença do artefato utilizado. Modelos não devem ser forçados para o histórico
do projeto.
