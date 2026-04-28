resource "aws_db_subnet_group" "main" {
    name = "${var.project_name}-db-subnet-group"
    subnet_ids = var.subnet_ids
    tags = { Name = "${var.project_name}-db-subnet-group"}
}

resource "aws_db_instance" "postgres" {
    identifier = "${var.project_name}-db"
    engine = "postgres"
    engine_version = "16"
    instance_class = var.instance_class
    allocated_storage = 20
    db_name = "postgres"
    username = var.db_username
    password = var.db_password
    db_subnet_group_name = aws_db_subnet_group.main.name
    vpc_security_group_ids = [ var.security_group_id ]
    publicly_accessible = false
    skip_final_snapshot = true
    deletion_protection = false
    tags = { Name = "${var.project_name}.rds"}
}