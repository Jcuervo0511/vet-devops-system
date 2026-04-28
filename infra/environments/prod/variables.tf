variable "aws_region" {
  type    = string
  default = "us-east-2"
}

variable "project_name" {
  type    = string
  default = "vet-devops-prod"
}

variable "db_username" {
  type        = string
  description = "Usuario de la base de datos"
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "Password de la base de datos"
}

variable "key_name" {
  type        = string
  description = "Nombre del key pair para SSH"
}
