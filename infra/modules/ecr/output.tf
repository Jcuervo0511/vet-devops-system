output "repository_url" {
    value = aws_ecr_repository.app.repository_url
    description = "URL del repositorio de ECR"
}