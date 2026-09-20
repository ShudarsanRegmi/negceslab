variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region for staging EC2 instance"
}

variable "instance_type" {
  type        = string
  default     = "t3.medium"
  description = "AWS EC2 instance type (2 vCPUs, 4GB RAM)"
}

variable "key_name" {
  type        = string
  default     = "negceslab-staging-key"
  description = "AWS SSH Key Pair Name"
}
