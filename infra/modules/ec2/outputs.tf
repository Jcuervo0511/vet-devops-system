output "public_ip" {
    value = aws_instance.app.public_ip
    description = "IP publica del EC2"
}

output "public_dns" {
    value = aws_instance.app.public_dns
    description = "DNS publico del EC2"
}