output "endpoint" {
    value = aws_db_instance.postgres.endpoint
    description = "Endpoint de conexion al RDS"
}

output "db_name" {
    value = aws_db_instance.postgres.db_name
    description = "Nombre de la base de datos"
}