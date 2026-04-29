# Infraestructura Vet DevOps - Terraform

Infraestructura en AWS creada con Terraform de forma modular.

## Servicios creados

| Módulo | Servicio AWS | Descripción |
|---|---|---|
| `modules/networking` | VPC + Security Groups | Red virtual, subnets públicas y reglas de firewall |
| `modules/ec2` | EC2 | Servidor Amazon Linux 2023 con Docker |
| `modules/rds` | RDS PostgreSQL 16 | Base de datos administrada |
| `modules/ecr` | ECR | Repositorio privado de imágenes Docker |

## Requisitos previos

- [Terraform](https://developer.hashicorp.com/terraform/downloads) >= 1.5
- [AWS CLI](https://aws.amazon.com/cli/) configurado con credenciales
- Key pair creado en AWS EC2

## Configurar credenciales AWS

```bash
aws configure
```

## Despliegue

### 1. Inicializar Terraform

```bash
cd infra/environments/dev
terraform init
```

### 2. Crear archivo de variables

Crear `terraform.tfvars` en `infra/environments/dev/`:

```hcl
aws_region   = "us-east-2"
project_name = "vet-devops"
db_username  = "postgres"
db_password  = "TuPassword"
key_name     = "vet-key"
```

### 3. Ver el plan

```bash
terraform plan
```

### 4. Aplicar la infraestructura

```bash
terraform apply
```

Al terminar muestra los outputs:
- `ec2_public_ip` — IP del servidor
- `rds_endpoint` — endpoint de la base de datos
- `ecr_url` — URL del repositorio de imágenes

## Conectarse al EC2 por SSH

```bash
ssh -i ~/.ssh/vet-key.pem ec2-user@<ec2_public_ip>
```

## Ejecutar scripts de base de datos

Desde tu máquina local, copia los scripts al EC2:

```bash
scp -i ~/.ssh/vet-key.pem infra/scripts/*.sql ec2-user@<ec2_public_ip>:/home/ec2-user/
```

Conéctate al EC2 y ejecuta cada script:

```bash
# 1. Crear tablas
PGPASSWORD=TuPassword psql -h <rds_endpoint> -U postgres -d postgres -f /home/ec2-user/01_create_tables.sql

# 2. Insertar datos y visualizar
PGPASSWORD=TuPassword psql -h <rds_endpoint> -U postgres -d postgres -f /home/ec2-user/02_insert_data.sql

# 3. Drop completo
PGPASSWORD=TuPassword psql -h <rds_endpoint> -U postgres -d postgres -f /home/ec2-user/03_drop_db.sql
```

## Eliminar la infraestructura

```bash
terraform destroy
```

Confirmar con `yes` cuando lo solicite.
