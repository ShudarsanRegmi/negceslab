# Azure Staging Infrastructure Variables

variable "location" {
  type        = string
  default     = "East US"
  description = "Azure datacenter region for staging environment"
}

variable "resource_group_name" {
  type        = string
  default     = "rg-negceslab-staging"
  description = "Name of the Azure Resource Group"
}

variable "vm_size" {
  type        = string
  default     = "Standard_B2s"
  description = "Azure VM Size (2 vCPUs, 4GB RAM)"
}

variable "admin_username" {
  type        = string
  default     = "negces-staging"
  description = "Admin username for the Azure Ubuntu VM"
}

variable "ssh_public_key_path" {
  type        = string
  default     = "~/.ssh/id_rsa.pub"
  description = "Path to local SSH public key for VM authentication"
}
