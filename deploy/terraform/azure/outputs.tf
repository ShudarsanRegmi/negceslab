output "public_ip_address" {
  value       = azurerm_public_ip.public_ip.ip_address
  description = "Public IP Address of the provisioned Azure Staging VM"
}

output "ssh_connect_command" {
  value       = "ssh ${var.admin_username}@${azurerm_public_ip.public_ip.ip_address}"
  description = "SSH Command to connect to the Staging server"
}
