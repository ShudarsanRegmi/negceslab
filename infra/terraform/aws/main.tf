terraform {
  required_version = ">= 1.3.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# 1. Security Group (Open ports 22, 80, 443)
resource "aws_security_group" "staging_sg" {
  name        = "negceslab-staging-sg"
  description = "Security Group for NegcesLab Staging Server"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 2. Key Pair (Creates SSH key automatically in AWS from local public key)
resource "aws_key_pair" "staging_key" {
  key_name   = var.key_name
  public_key = file(var.ssh_public_key_path)
}

# 3. Get latest Ubuntu 24.04 LTS AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  owners = ["099720109477"] # Canonical
}

# 4. EC2 Instance
resource "aws_instance" "staging_ec2" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.staging_key.key_name
  vpc_security_group_ids = [aws_security_group.staging_sg.id]

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  user_data = <<-EOF
              #!/bin/bash
              useradd -m -s /bin/bash negces-staging
              echo "negces-staging ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/negces-staging
              chmod 0440 /etc/sudoers.d/negces-staging
              mkdir -p /home/negces-staging/.ssh
              cp /home/ubuntu/.ssh/authorized_keys /home/negces-staging/.ssh/authorized_keys
              chown -R negces-staging:negces-staging /home/negces-staging/.ssh
              chmod 700 /home/negces-staging/.ssh
              chmod 600 /home/negces-staging/.ssh/authorized_keys
              EOF

  tags = {
    Name = "negceslab-staging"
  }
}

output "public_ip_address" {
  value       = aws_instance.staging_ec2.public_ip
  description = "Public IP Address of AWS EC2 Staging Instance"
}
