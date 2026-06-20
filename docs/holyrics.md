# Integração com Holyrics

## Escopo atual

A Phase 3 implementa somente o teste de conectividade com o endereço
configurado para o Holyrics.

Não estão implementados:

- comandos de controle;
- recursos bíblicos;
- recursos de louvor;
- consulta de apresentações;
- sincronização de estado;
- descoberta automática do Holyrics.

## Configuração

O `HolyricsModule` lê `holyricsHost` e `holyricsPort` por meio do
`SettingsService`. Esses valores devem ser salvos previamente na página
`/settings` ou em `PUT /api/settings`.

## Endpoint local

```http
POST /api/holyrics/test-connection
```

O endpoint não recebe corpo. Respostas:

- `200`: o endereço configurado respondeu via HTTP;
- `400`: host ou porta ainda não foram configurados;
- `503`: host indisponível, porta recusada, timeout ou outra falha de rede.

## Requisição enviada ao endereço configurado

O provider executa:

```http
GET http://<host>:<porta>/
Accept: */*
```

Características:

- timeout de três segundos;
- redirecionamentos não são seguidos;
- nenhum comando é enviado;
- qualquer status HTTP é considerado uma resposta de conectividade.

## Limitação conhecida

Não foi identificado um endpoint público oficial e não destrutivo de saúde
que permita validar a identidade do Holyrics. Por isso, o teste atual confirma
que existe um servidor HTTP respondendo no host e porta configurados, mas não
prova que esse servidor é o Holyrics.

Endpoints reais de Bíblia, louvor ou controle devem ser pesquisados,
documentados e implementados apenas nas fases correspondentes.

## Testes

Os testes unitários usam mocks do provider HTTP e não dependem de uma
instalação real do Holyrics. Eles cobrem:

- resposta HTTP bem-sucedida;
- conexão recusada;
- host não encontrado;
- configuração ausente;
- uso do host e porta persistidos;
- tradução de falhas para respostas compreensíveis.
