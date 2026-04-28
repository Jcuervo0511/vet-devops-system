output "vpc_id" {
    value = aws_vpc.main.id
    description = "ID de la VPC"
}

output "public_subnets_ids" {
    value = [aws_subnet.public_a.id, aws_subnet.public_b.id]
    description = "IDs de las subnets publicas"
}

output "ec2_sg_id" {
  value       = aws_security_group.ec2.id
  description = "ID del security group del EC2"
}

output "rds_sg_id" {
  value       = aws_security_group.rds.id
  description = "ID del security group del RDS"
}