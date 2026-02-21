# Infrastructure (Local Dev)

Este diretório define a infraestrutura local do projeto via Docker Compose.

Serviços incluídos:
- PostgreSQL primário + réplica (streaming replication)
- MinIO (S3 compatible) com bootstrap de bucket/prefixos no próprio container
- RabbitMQ com Management UI e fila com DLQ

## Arquivos

- `infrastructure/deploy/docker-compose.yml`: orquestração dos serviços
- `infrastructure/data/primary_postgresql.conf`: configuração do Postgres primário
- `infrastructure/data/primary_pg_hba.conf`: regras de autenticação do Postgres
- `infrastructure/data/init-replication.sql`: criação idempotente da role `scanflowread`
- `infrastructure/data/scan-flow-ddl.sql`: DDL da aplicação
- `infrastructure/data/rabbitmq.conf`: configuração do RabbitMQ
- `infrastructure/data/enabled_plugins`: plugins habilitados do RabbitMQ
- `infrastructure/data/definitions.json`: objetos iniciais do RabbitMQ

## Portas

- Postgres primário: `localhost:5432`
- Postgres réplica (read-only): `localhost:5433`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`
- RabbitMQ AMQP: `localhost:5672`
- RabbitMQ UI: `http://localhost:15672`

## Credenciais padrão (somente dev)

PostgreSQL:
- write: `scanflowwrite / scanflowwrite` (primário)
- read/replication: `scanflowread / scanflowread` (réplica e replicação)
- database: `scanflow`

MinIO:
- `MINIO_ROOT_USER=minioadmin`
- `MINIO_ROOT_PASSWORD=minioadmin`

RabbitMQ:
- `RABBITMQ_DEFAULT_USER=rabbitmqadmin`
- `RABBITMQ_DEFAULT_PASS=rabbitmqadmin`

## Pré-requisitos

- Docker Engine + Docker Compose (`docker compose`)
- Portas livres: `5432`, `5433`, `5672`, `9000`, `9001`, `15672`

## Operação

Subir tudo:
```bash
docker compose -f infrastructure/deploy/docker-compose.yml up -d
```

Subir removendo serviços órfãos:
```bash
docker compose -f infrastructure/deploy/docker-compose.yml up -d --remove-orphans
```

Status:
```bash
docker compose -f infrastructure/deploy/docker-compose.yml ps
```

Logs:
```bash
docker compose -f infrastructure/deploy/docker-compose.yml logs -f postgres-primary
docker compose -f infrastructure/deploy/docker-compose.yml logs -f postgres-replica
docker compose -f infrastructure/deploy/docker-compose.yml logs -f minio
docker compose -f infrastructure/deploy/docker-compose.yml logs -f rabbitmq
```

Parar:
```bash
docker compose -f infrastructure/deploy/docker-compose.yml down
```

Reset total (remove volumes):
```bash
docker compose -f infrastructure/deploy/docker-compose.yml down -v
```

## Bootstrap automático

PostgreSQL:
- `postgres-primary` usa `postgresql.conf` e `pg_hba.conf` customizados.
- Scripts em `/docker-entrypoint-initdb.d` executam apenas em volume novo.
- `init-replication.sql` garante a role `scanflowread` com `REPLICATION`.
- `scan-flow-ddl.sql` cria schema/objetos da aplicação.

PostgreSQL réplica:
- `postgres-replica` aguarda o primário.
- Executa `pg_basebackup` com `scanflowread`.
- Inicia em modo standby.

MinIO:
- O serviço `minio` sobe o servidor e executa bootstrap no startup.
- Cria bucket `files` (idempotente).
- Cria objetos `.keep` para materializar prefixos:
- `files/proc/.keep`
- `files/raw/.keep`

RabbitMQ:
- Carrega `definitions.json` via `management.load_definitions`.
- Provisiona exchanges, filas, bindings e policy da fila principal + DLQ.

## Verificações rápidas

Postgres (primário):
```bash
docker compose -f infrastructure/deploy/docker-compose.yml exec -T postgres-primary psql -U scanflowwrite -d scanflow -c "select now();"
```

Postgres (réplica):
```bash
docker compose -f infrastructure/deploy/docker-compose.yml exec -T postgres-replica psql -U scanflowread -d scanflow -c "select pg_is_in_recovery();"
```

Permissão de leitura em `scanflow_files`:
```bash
docker compose -f infrastructure/deploy/docker-compose.yml exec -T postgres-replica psql -U scanflowread -d scanflow -c "select has_table_privilege('scanflowread','public.scanflow_files','SELECT');"
```

MinIO (bucket/prefixos):
```bash
docker run --rm --network deploy_default --entrypoint /bin/sh minio/mc:latest -c "mc alias set local http://minio:9000 minioadmin minioadmin >/dev/null && mc ls local/files && mc ls local/files/proc && mc ls local/files/raw"
```

RabbitMQ (filas/policies):
```bash
docker compose -f infrastructure/deploy/docker-compose.yml exec -T rabbitmq rabbitmqctl list_queues name durable arguments
docker compose -f infrastructure/deploy/docker-compose.yml exec -T rabbitmq rabbitmqctl list_policies
```

## Troubleshooting

RabbitMQ UI não abre:
- Use `http://localhost:15672` (não `https`).
- Se necessário, limpe cache/HSTS/credenciais salvas do navegador.

RabbitMQ `invalid credentials`:
- Senha contém `$`, use aspas simples no shell.
```bash
docker compose -f infrastructure/deploy/docker-compose.yml exec -T rabbitmq rabbitmqctl authenticate_user rabbitmqadmin 'rabbitmqadmin'
```

Postgres réplica falha com `no pg_hba.conf entry`:
- Verifique `infrastructure/data/primary_pg_hba.conf`.
- Confirme que o primário sobe com `-c hba_file=/etc/postgresql/pg_hba.conf`.

Erro de permissões para `scanflowread` em tabelas:
- Reaplique grants no primário:
```bash
docker compose -f infrastructure/deploy/docker-compose.yml exec -T postgres-primary psql -U scanflowwrite -d scanflow -c "GRANT USAGE ON SCHEMA public TO scanflowread; GRANT SELECT ON TABLE public.scanflow_files TO scanflowread; GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO scanflowread;"
```

`minio-init` órfão após migração para bootstrap no `minio`:
- Remova órfãos:
```bash
docker compose -f infrastructure/deploy/docker-compose.yml up -d --remove-orphans
```

## Segurança

Este ambiente é apenas para desenvolvimento local.

Antes de usar em staging/produção:
- mover segredos para variáveis seguras/cofre
- habilitar TLS real (Postgres, MinIO, RabbitMQ)
- restringir portas expostas no host
- endurecer usuários/permissões e políticas de rede
