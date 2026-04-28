variable "project_name" {
    type = string
    description = "Prefijo para nombrar todos los recursos"
}

variable "aws_region" {
    type = string
    description = "Region de AWS donde se despliega la red"
}

variable "vpc_cidr" {
    type = string
    default = "10.0.0.0/16"
    description = "Rango de IPs de la VPC"
}