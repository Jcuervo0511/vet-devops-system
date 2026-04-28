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