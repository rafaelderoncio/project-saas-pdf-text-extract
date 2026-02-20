# Infrastructure (Local Dev)

Este diretório contém a infraestrutura local do projeto via Docker Compose, incluindo:

- PostgreSQL primário + réplica (streaming replication)
- MinIO (S3 compatible) + bootstrap automático de bucket/prefixos
- RabbitMQ com Management UI + fila FIFO-like com DLQ

## Estrutura

- `deploy/docker-compose.yml`: orquestração dos serviços
- `data/primary_postgresql.conf`: config principal do Postgres
- `data/primary_pg_hba.conf`: regras de autenticação (`pg_hba`)
- `data/init-replication.sql`: criação idempotente do usuário de replicação
- `data/rabbitmq.conf`: config do RabbitMQ
- `data/enabled_plugins`: plugins habilitados no RabbitMQ
- `data/definitions.json`: objetos iniciais do RabbitMQ (exchange, queue, DLQ, policy)
- `data/scan-flow-ddl.sql`: DDL da aplicação (quando aplicável)

## Serviços e portas

- PostgreSQL primário: `localhost:5432`
- PostgreSQL réplica (read-only): `localhost:5433`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`
- RabbitMQ AMQP: `localhost:5672`
- RabbitMQ Management UI: `http://localhost:15672`

## Credenciais padrão (somente dev)

- PostgreSQL:
- `POSTGRES_DB=scanflow`
- `POSTGRES_USER=scanflow`
- `POSTGRES_PASSWORD=scanflow`

- Replicação Postgres:
- `user=replicator`
- `password=replicator`

- MinIO:
- `MINIO_ROOT_USER=minioadmin`
- `MINIO_ROOT_PASSWORD=minioadmin`

- RabbitMQ:
- `RABBITMQ_DEFAULT_USER=mscott`
- `RABBITMQ_DEFAULT_PASS=IoSo1F4nt4$71c0`

## Pré-requisitos

- Docker Engine com Compose plugin (`docker compose`)
- Portas livres: `5432`, `5433`, `5672`, `9000`, `9001`, `15672`

## Subindo tudo

Execute a partir da raiz do projeto:

```bash
docker compose -f infrastructure/deploy/docker-compose.yml up -d
```

Ver status:

```bash
docker compose -f infrastructure/deploy/docker-compose.yml ps
```

Logs de um serviço específico:

```bash
docker compose -f infrastructure/deploy/docker-compose.yml logs -f rabbitmq
docker compose -f infrastructure/deploy/docker-compose.yml logs -f postgres-primary
docker compose -f infrastructure/deploy/docker-compose.yml logs -f minio
```

## O que é inicializado automaticamente

### PostgreSQL

- `postgres-primary` sobe com `postgresql.conf` custom e `pg_hba.conf` custom.
- `postgres-replica` executa `pg_basebackup` contra o primário e inicia em modo standby.
- O script `init-replication.sql` cria a role `replicator` de forma idempotente.

Observação importante:

- Se o volume do primário já existir, o entrypoint do Postgres ignora scripts em `/docker-entrypoint-initdb.d`.
- Nessa situação, você pode precisar criar `replicator` manualmente.

### MinIO

- `minio-init` roda após `minio` ficar healthy.
- Cria bucket `files` (idempotente).
- Cria os prefixos:
- `files/proc/`
- `files/raw/`

Implementação dos prefixos:

- MinIO não possui "pasta real"; os prefixos são materializados por objetos `.keep`:
- `files/proc/.keep`
- `files/raw/.keep`

### RabbitMQ

- Carrega `definitions.json` na inicialização via `management.load_definitions`.
- Cria automaticamente:
- exchange `scanflow.events` (direct)
- exchange `scanflow.dlx` (direct)
- queue `scanflow.fifo` (quorum + single active consumer + DLQ)
- queue `scanflow.fifo.dlq` (quorum + single active consumer)
- bindings entre exchanges e filas
- policy `scanflow-fifo-policy` com `delivery-limit=5`

## Modelo FIFO + DLQ (RabbitMQ)

A fila `scanflow.fifo` usa configuração robusta para processamento ordenado e tolerante a falhas:

- `x-queue-type=quorum`
- `x-single-active-consumer=true`
- `x-dead-letter-exchange=scanflow.dlx`
- `x-dead-letter-routing-key=scanflow.fifo.dlq`
- policy com `delivery-limit=5`

Recomendação de consumo para preservar ordem:

- 1 consumidor ativo (SAC já ajuda)
- `manual ack`
- `prefetch=1`
- evitar requeue indiscriminado em erros de negócio

## Verificações rápidas

### Postgres

```bash
docker compose -f infrastructure/deploy/docker-compose.yml exec -T postgres-primary psql -U scanflow -d scanflow -c "select now();"
docker compose -f infrastructure/deploy/docker-compose.yml exec -T postgres-replica psql -U scanflow -d scanflow -c "select pg_is_in_recovery();"
```

### MinIO

```bash
docker run --rm --network deploy_default --entrypoint /bin/sh minio/mc:latest -c "mc alias set local http://minio:9000 minioadmin minioadmin >/dev/null && mc ls local/files && mc ls local/files/proc && mc ls local/files/raw"
```

### RabbitMQ

```bash
docker compose -f infrastructure/deploy/docker-compose.yml exec -T rabbitmq rabbitmqctl list_queues name durable arguments
docker compose -f infrastructure/deploy/docker-compose.yml exec -T rabbitmq rabbitmqctl list_policies
```

## Troubleshooting

### RabbitMQ UI não abre

Sintoma comum:

- erro SSL no browser (`SSL_ERROR_RX_RECORD_TOO_LONG`)

Causa:

- tentativa de `https://localhost:15672` em listener HTTP

Correção:

- usar `http://localhost:15672`
- limpar cache/HSTS/credenciais salvas do navegador para `localhost`

### RabbitMQ "invalid credentials"

Observações:

- Senhas com `$` precisam cuidado no shell.
- Ao usar linha de comando, prefira aspas simples para evitar expansão.

Exemplo:

```bash
docker compose -f infrastructure/deploy/docker-compose.yml exec -T rabbitmq rabbitmqctl authenticate_user mscott 'IoSo1F4nt4$71c0'
```

Reset de senha:

```bash
docker compose -f infrastructure/deploy/docker-compose.yml exec -T rabbitmq rabbitmqctl change_password mscott 'IoSo1F4nt4$71c0'
```

### RabbitMQ falha no boot com `failed_to_prepare_configuration`

Causa provável:

- `management.load_definitions` apontando para arquivo inexistente

Checklist:

- `infrastructure/data/rabbitmq.conf` tem `management.load_definitions=/etc/rabbitmq/definitions.json`
- `docker-compose.yml` monta `../data/definitions.json:/etc/rabbitmq/definitions.json:ro`
- arquivo `infrastructure/data/definitions.json` existe e JSON válido

### Postgres réplica falha com `no pg_hba.conf entry`

Causa provável:

- regra de replicação ausente em `pg_hba`

Verifique:

- `infrastructure/data/primary_pg_hba.conf` tem regra `host replication replicator ...`
- serviço primário inicia com `-c hba_file=/etc/postgresql/pg_hba.conf`

### Postgres: `role "replicator" does not exist`

Causa provável:

- volume antigo pulou scripts de init

Correção manual:

```bash
docker compose -f infrastructure/deploy/docker-compose.yml exec -T postgres-primary psql -U scanflow -d scanflow -c "DO \\\$$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='replicator') THEN CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'replicator'; END IF; END \\\$$;"
```

### Postgres réplica com erro de permissões no data dir

Sintoma:

- `data directory ... has invalid permissions`

Correção aplicada no compose:

- bootstrap da réplica faz `chown -R postgres:postgres` e `chmod 700` antes de subir `postgres`.

## Operação diária

Subir:

```bash
docker compose -f infrastructure/deploy/docker-compose.yml up -d
```

Parar:

```bash
docker compose -f infrastructure/deploy/docker-compose.yml down
```

Parar e remover volumes (reset total):

```bash
docker compose -f infrastructure/deploy/docker-compose.yml down -v
```

## Segurança

Este setup é para ambiente local de desenvolvimento:

- credenciais hardcoded
- portas expostas no host
- autenticação simplificada

Para staging/produção:

- mover segredos para cofre/variáveis seguras
- TLS real em RabbitMQ/MinIO/Postgres
- restringir portas externas
- hardening de usuários e permissões

## Referência rápida de arquivos de dados

- Postgres conf: `infrastructure/data/primary_postgresql.conf`
- Postgres HBA: `infrastructure/data/primary_pg_hba.conf`
- Replication SQL: `infrastructure/data/init-replication.sql`
- RabbitMQ conf: `infrastructure/data/rabbitmq.conf`
- RabbitMQ plugins: `infrastructure/data/enabled_plugins`
- RabbitMQ definitions: `infrastructure/data/definitions.json`
- DDL app: `infrastructure/data/scan-flow-ddl.sql`
