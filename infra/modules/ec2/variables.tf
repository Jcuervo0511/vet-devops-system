variable "project_name" {
    type = string
    description = "Prefijo para nombrar los recursos"
}

variable "subnet_id" {
    type = string
    description = "ID de la subnet donde vivirá el EC2"
}

variable "security_group_id" {
    type = string
    description = "ID del security group del EC2"
}

variable "key_name" {
    type = string
    description = "Nombre del key pair para acceso SSH"
}

variable "instance_type" {
    type = string
    default = "t2.micro"
    description = "Tipo de instancia EC2"
}