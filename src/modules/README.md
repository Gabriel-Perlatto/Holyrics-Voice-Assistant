# Módulos

Esta pasta contém os módulos de domínio implementados nas fases correspondentes
do `ROADMAP.md`.

Módulos atuais:

- `system`: descoberta do IP local, URL de acesso e status básico do servidor.
- `settings`: validação e persistência SQLite das configurações locais.
- `holyrics`: teste isolado de conectividade HTTP com o endereço configurado.
- `bible`: metadados bíblicos, aliases pt-BR e contexto inicial por provider.
- `realtime`: eventos Socket.IO entre o NestJS e navegadores locais.
- `speech`: captura e transcrição local através de `SpeechProvider`.
- `command`: interpretação determinística de transcrições sem execução.

O módulo de louvor ainda não foi iniciado.
