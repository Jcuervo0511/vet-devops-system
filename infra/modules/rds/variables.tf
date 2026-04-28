variable "project_name" {
    type = string
    description = "Prefijo para nombrar los recursos"
}

variable "db_username" {
    type = string
    description = "Usuario administrador de la base de datos"
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "Password de la base de datos"
}

variable "subnet_ids" {
  type        = list(string)
  description = "IDs de las subnets donde vivirá el RDS"
}

variable "security_group_id" {
  type        = string
  description = "ID del security group del RDS"
}

variable "instance_class" {
  type        = string
  default     = "db.t3.micro"
  description = "Tamaño de la instancia RDS"
}