#!/bin/bash
# Auto-generated deployment script with your actual credentials
# This will create secrets.yml and deploy JobKai to AKS

set -e

cd /home/abid/Downloads/tsyp-JobKai/ansible

echo "🚀 JobKai Kubernetes Deployment"
echo "========================================"
echo ""

# Check if Ansible is installed
if ! command -v ansible-playbook &> /dev/null; then
    echo "❌ Ansible not found. Installing..."
    sudo apt update && sudo apt install -y ansible python3-pip
fi

# Install required collections and libraries
echo "📦 Installing Ansible collections..."
ansible-galaxy collection install kubernetes.core community.general --force

# Check if kubernetes library is available
if python3 -c "import kubernetes" 2>/dev/null; then
    echo "✅ Kubernetes Python library already installed"
else
    echo "⚠️  Kubernetes Python library not found. Installing via apt..."
    sudo apt install -y python3-kubernetes
fi

echo "✅ Prerequisites installed"
echo ""

# Get ACR credentials
echo "🔐 Fetching ACR credentials..."
ACR_USERNAME=$(az acr credential show --name jobkairegistry --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name jobkairegistry --query passwords[0].value -o tsv)
ACR_AUTH=$(echo -n "$ACR_USERNAME:$ACR_PASSWORD" | base64 -w 0)

echo "✅ ACR credentials retrieved"
echo ""

# Create secrets.yml with actual values
echo "📝 Creating secrets.yml..."

cat > vars/secrets.yml <<'EOF'
---
# ACR Docker Registry Credentials
acr_docker_config_json: |
  {
    "auths": {
      "jobkairegistry.azurecr.io": {
        "username": "ACR_USERNAME_PLACEHOLDER",
        "password": "ACR_PASSWORD_PLACEHOLDER",
        "auth": "ACR_AUTH_PLACEHOLDER"
      }
    }
  }

# API Keys - Replace with your actual keys or use environment variables
groq_api_key: "${GROQ_API_KEY:-your_groq_api_key_here}"
findwork_api_key: "${FINDWORK_API_KEY:-your_findwork_api_key_here}"
google_api_key: "${GOOGLE_API_KEY:-your_google_api_key_here}"
vapi_public_key: "${VITE_VAPI_PUBLIC_KEY:-your_vapi_public_key_here}"

# Firebase Configuration - Replace with your actual Firebase config
firebase_api_key: "${VITE_PUBLIC_FIREBASE_API_KEY:-your_firebase_api_key_here}"
firebase_auth_domain: "${VITE_PUBLIC_FIREBASE_AUTH_DOMAIN:-your-project.firebaseapp.com}"
firebase_project_id: "${VITE_PUBLIC_FIREBASE_PROJECT_ID:-your-project-id}"
firebase_storage_bucket: "${VITE_PUBLIC_FIREBASE_STORAGE_BUCKET:-your-project.firebasestorage.app}"
firebase_messaging_sender_id: "${VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:-your_sender_id}"
firebase_app_id: "${VITE_PUBLIC_FIREBASE_APP_ID:-1:123456789012:web:xxxxxxxxxxxx}"
firebase_measurement_id: "${VITE_MEASUREMENT_ID:-}"

# API Gateway URL (internal cluster communication)
api_gateway_url: "http://api-gateway.jobkai.svc.cluster.local:8000"

# Optional: Set to true to deploy ingress
deploy_ingress: false
EOF

# Replace ACR placeholders with actual values
sed -i "s|ACR_USERNAME_PLACEHOLDER|$ACR_USERNAME|g" vars/secrets.yml
sed -i "s|ACR_PASSWORD_PLACEHOLDER|$ACR_PASSWORD|g" vars/secrets.yml
sed -i "s|ACR_AUTH_PLACEHOLDER|$ACR_AUTH|g" vars/secrets.yml

echo "✅ secrets.yml created with your credentials"
echo ""

# Ask if user wants to encrypt
read -p "🔒 Do you want to encrypt secrets.yml with ansible-vault? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ansible-vault encrypt vars/secrets.yml
    VAULT_FLAG="--ask-vault-pass"
else
    VAULT_FLAG=""
fi

echo ""
echo "🚀 Starting deployment to Kubernetes..."
echo ""
echo "This will:"
echo "  1. Create 'jobkai' namespace"
echo "  2. Create secrets and config maps"
echo "  3. Deploy all 6 microservices"
echo "  4. Create LoadBalancer for frontend"
echo ""
read -p "Continue with deployment? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Run deployment
    if [ -n "$VAULT_FLAG" ]; then
        ansible-playbook -i inventory.ini deploy-jobkai.yml $VAULT_FLAG
    else
        ansible-playbook -i inventory.ini deploy-jobkai.yml
    fi
    
    echo ""
    echo "=========================================="
    echo "✅ Deployment initiated!"
    echo "=========================================="
    echo ""
    echo "⏳ Waiting for pods to be ready (this may take 5-10 minutes)..."
    echo ""
    
    # Wait for pods to be ready
    kubectl wait --for=condition=ready pod -l app=api-gateway -n jobkai --timeout=600s 2>/dev/null || true
    
    echo ""
    echo "📊 Current deployment status:"
    kubectl get pods -n jobkai
    echo ""
    echo "🌐 Getting frontend LoadBalancer IP (this may take a few minutes)..."
    echo ""
    
    # Wait for LoadBalancer IP
    for i in {1..30}; do
        FRONTEND_IP=$(kubectl get svc frontend -n jobkai -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
        if [ -n "$FRONTEND_IP" ]; then
            echo ""
            echo "=========================================="
            echo "✅ DEPLOYMENT COMPLETE!"
            echo "=========================================="
            echo ""
            echo "🎉 Frontend URL: http://$FRONTEND_IP"
            echo ""
            echo "📋 Useful commands:"
            echo "   View all resources: kubectl get all -n jobkai"
            echo "   View logs: kubectl logs -n jobkai -l app=api-gateway -f"
            echo "   View frontend logs: kubectl logs -n jobkai -l app=frontend -f"
            echo ""
            break
        fi
        echo -n "."
        sleep 10
    done
    
    if [ -z "$FRONTEND_IP" ]; then
        echo ""
        echo "⏳ LoadBalancer IP not yet assigned. Check status with:"
        echo "   kubectl get svc frontend -n jobkai -w"
    fi
else
    echo "❌ Deployment cancelled"
    exit 0
fi

