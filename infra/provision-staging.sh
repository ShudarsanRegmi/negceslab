#!/usr/bin/env bash
# ==============================================================================
# NegcesLab Staging Environment Provisioning Master Script
# Usage: ./deploy/provision-staging.sh [azure|aws]
# ==============================================================================

set -e

CLOUD_PROVIDER="${1:-azure}"

echo "=========================================================="
echo "🚀 Provisioning NegcesLab Staging Environment ($CLOUD_PROVIDER)"
echo "=========================================================="

if [ "$CLOUD_PROVIDER" != "azure" ] && [ "$CLOUD_PROVIDER" != "aws" ]; then
    echo "❌ Error: Invalid cloud provider specified. Choose 'azure' or 'aws'."
    exit 1
fi

# 1. Provision Infrastructure via Terraform
echo "📦 Step 1: Running Terraform Apply for $CLOUD_PROVIDER..."
cd "deploy/terraform/$CLOUD_PROVIDER"

terraform init
terraform apply -auto-approve

# Extract Provisioned Public IP
SERVER_IP=$(terraform output -raw public_ip_address)
echo ""
echo "=========================================================="
echo "✅ Infrastructure Provisioned Successfully!"
echo "🌐 Staging Machine IP: $SERVER_IP"
echo "=========================================================="
echo ""

# 2. Run Ansible OS Configuration & Deployment
cd "../../../deploy/ansible"

echo "⚙️ Step 2: Running Ansible Playbook against $SERVER_IP..."
echo "Waiting 15 seconds for SSH to initialize on VM..."
sleep 15

ansible-playbook -i "$SERVER_IP," -u negces-staging site.yml

echo ""
echo "=========================================================="
echo "🎉 Staging Environment Fully Provisioned & Active!"
echo "🌐 Machine IP: $SERVER_IP"
echo "👉 Next Step: Point your Cloudflare A-Record to $SERVER_IP"
echo "=========================================================="
