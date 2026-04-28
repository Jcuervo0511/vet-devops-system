terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "networking" {
  source       = "../../modules/networking"
  project_name = var.project_name
  aws_region   = var.aws_region
}

module "ecr" {
  source          = "../../modules/ecr"
  project_name    = var.project_name
  repository_name = "devops-prod"
}

module "rds" {
  source            = "../../modules/rds"
  project_name      = var.project_name
  db_username       = var.db_username
  db_password       = var.db_password
  subnet_ids        = module.networking.public_subnet_ids
  security_group_id = module.networking.rds_sg_id
  instance_class    = "db.t3.small"
}

module "ec2" {
  source            = "../../modules/ec2"
  project_name      = var.project_name
  subnet_id         = module.networking.public_subnet_ids[0]
  security_group_id = module.networking.ec2_sg_id
  key_name          = var.key_name
  instance_type     = "t3.micro"
}

output "ec2_public_ip" { value = module.ec2.public_ip }
output "rds_endpoint"  { value = module.rds.endpoint }
output "ecr_url"       { value = module.ecr.repository_url }
