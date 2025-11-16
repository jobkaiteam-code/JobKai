#!/bin/bash
# Quick deployment script for JobKai on Kubernetes
# Usage: ./quick-deploy.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 JobKai Kubernetes Deployment"
echo "========================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Ansible
if ! command -v ansible-playbook &> /dev/null; then
    echo "❌ Ansible is not installed. Installing..."
    sudo apt update && sudo apt install -y ansible python3-pip
fi
echo "✅ Ansible found"

# Check kubectl
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install it first."
    exit 1
fi
echo "✅ kubectl found"

# Check cluster connectivity
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster. Please configure kubectl."
    exit 1
fi
echo "✅ Connected to Kubernetes cluster"

# Check if secrets file exists
if [ ! -f "vars/secrets.yml" ]; then
    echo "❌ Secrets file not found. Creating from example..."
    cp vars/secrets.yml.example vars/secrets.yml
    echo ""
    echo "⚠️  Please edit 'ansible/vars/secrets.yml' with your actual credentials."
    echo "   Then optionally encrypt it with: ansible-vault encrypt vars/secrets.yml"
    echo ""
    read -p "Press Enter after updating secrets.yml to continue, or Ctrl+C to exit..."
fi

# Install Ansible collections
echo ""
echo "📦 Installing Ansible collections..."
ansible-galaxy collection install -r requirements.yml

# Install Python Kubernetes library
echo ""
echo "📦 Installing Python Kubernetes library..."
pip3 install kubernetes --quiet

# Run deployment
echo ""
echo "🚀 Starting deployment..."
echo ""

if ansible-vault view vars/secrets.yml &> /dev/null; then
    # File is encrypted
    echo "🔐 Secrets file is encrypted. You'll be prompted for the vault password."
    ansible-playbook -i inventory.ini deploy-jobkai.yml --ask-vault-pass
else
    # File is not encrypted
    echo "⚠️  Secrets file is not encrypted (not recommended for production)"
    ansible-playbook -i inventory.ini deploy-jobkai.yml
fi

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "📊 Check deployment status:"
echo "   kubectl get all -n jobkai"
echo ""
echo "🌐 Get frontend URL:"
echo "   kubectl get svc frontend -n jobkai"
echo ""
echo "📝 View logs:"
echo "   kubectl logs -n jobkai -l app=api-gateway -f"
echo ""
