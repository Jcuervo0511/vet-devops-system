data "aws_ami" "amazon_linux" {
    most_recent = true
    owners = [ "amazon" ]

    filter {
      name = "name"
      values = [ "al2023-ami-*-x86_64" ]
    }

    filter {
      name = "virtualization-type"
      values = [ "hvm" ]
    }
}

resource "aws_instance" "app" {
    ami = data.aws_ami.amazon_linux.id
    instance_type = var.instance_type
    subnet_id = var.subnet_id
    vpc_security_group_ids = [ var.security_group_id ]
    key_name = var.key_name
    iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

    user_data = <<-EOF
        #!/bin/bash
        dnf update -y
        dnf install -y docker
        systemctl start docker
        systemctl enable docker
        usermod -aG docker ec2-user
    EOF

    tags = { Name = "${var.project_name}-ec2"}
}

resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecr_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}
