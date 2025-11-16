# JobKai Kubernetes Deployment with Ansible

This directory contains Ansible playbooks and Kubernetes manifests to deploy the JobKai platform to a Kubernetes cluster.

## 📋 Prerequisites

### Required Tools
- **Ansible** >= 2.12
- **kubectl** configured with cluster access
- **Python** >= 3.8
- **Kubernetes Cluster** (AKS, EKS, GKE, or on-premise)

### Install Ansible and Dependencies

```bash
# Install Ansible
sudo apt update
sudo apt install ansible python3-pip -y

# Install Ansible Kubernetes collection
ansible-galaxy collection install -r ansible/requirements.yml

# Install Python Kubernetes library
pip3 install kubernetes
```

### Verify kubectl access
```bash
kubectl cluster-info
kubectl get nodes
```

## 🚀 Quick Start

### 1. Prepare Secrets

Copy the example secrets file and fill in your actual values:

```bash
cd ansible
cp vars/secrets.yml.example vars/secrets.yml
```

Edit `vars/secrets.yml` with your actual credentials:
- Azure Container Registry credentials
- API keys (Groq, Findwork, Google, Vapi)
- Firebase configuration
- API Gateway URL

### 2. Encrypt Secrets (Recommended)

```bash
# Encrypt the secrets file
ansible-vault encrypt vars/secrets.yml

# You'll be prompted to create a vault password
```

### 3. Get ACR Docker Config JSON

Generate the Docker config JSON for Azure Container Registry:

```bash
# Login to ACR
az acr login --name jobkairegistry

# Get the credentials
ACR_USERNAME=$(az acr credential show --name jobkairegistry --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name jobkairegistry --query passwords[0].value -o tsv)

# Generate base64 encoded auth
echo -n "$ACR_USERNAME:$ACR_PASSWORD" | base64

# Create the Docker config JSON
cat <<EOF
{
  "auths": {
    "jobkairegistry.azurecr.io": {
      "username": "$ACR_USERNAME",
      "password": "$ACR_PASSWORD",
      "auth": "$(echo -n "$ACR_USERNAME:$ACR_PASSWORD" | base64)"
    }
  }
}
EOF
```

Add this JSON to your `vars/secrets.yml` file as `acr_docker_config_json`.

### 4. Deploy to Kubernetes

```bash
cd ansible

# If secrets are encrypted
ansible-playbook -i inventory.ini deploy-jobkai.yml --ask-vault-pass

# If secrets are not encrypted
ansible-playbook -i inventory.ini deploy-jobkai.yml
```

### 5. Verify Deployment

```bash
# Check all resources
kubectl get all -n jobkai

# Check pods status
kubectl get pods -n jobkai

# Check services
kubectl get svc -n jobkai

# Get frontend LoadBalancer IP
kubectl get svc frontend -n jobkai
```

## 📦 Available Playbooks

### deploy-jobkai.yml
Main deployment playbook that deploys the entire JobKai platform.

```bash
ansible-playbook -i inventory.ini deploy-jobkai.yml --ask-vault-pass
```

### update-images.yml
Update container images for running services (triggers rolling update).

```bash
# Update all services
ansible-playbook -i inventory.ini update-images.yml --ask-vault-pass -e "service=all"

# Update specific service
ansible-playbook -i inventory.ini update-images.yml --ask-vault-pass -e "service=api-gateway"
```

Available services:
- `api-gateway`
- `frontend`
- `footprint-service`
- `resume-reviewer-service`
- `job-matcher-service`
- `ai-interviewer-service`

### teardown.yml
Remove the entire JobKai deployment from Kubernetes.

```bash
ansible-playbook -i inventory.ini teardown.yml
```

## 🔧 Kubernetes Manifests

Located in `../k8s/` directory:

- `namespace.yaml` - Creates jobkai namespace
- `secrets.yaml` - Template for secrets (managed by Ansible)
- `configmap.yaml` - Application configuration
- `api-gateway.yaml` - API Gateway deployment and service
- `frontend.yaml` - Frontend deployment and LoadBalancer service
- `footprint.yaml` - Footprint service deployment
- `resume-reviewer.yaml` - Resume reviewer deployment
- `job-matcher.yaml` - Job matcher deployment
- `ai-interviewer.yaml` - AI interviewer deployment
- `ingress.yaml` - Ingress configuration (optional)

## 🌐 Accessing the Application

### Via LoadBalancer (Default)

After deployment, get the frontend LoadBalancer IP:

```bash
kubectl get svc frontend -n jobkai -o wide
```

Access the application at: `http://<EXTERNAL-IP>`

### Via Ingress (Optional)

If you want to use Ingress with a custom domain:

1. Install NGINX Ingress Controller:
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml
```

2. Update domains in `k8s/ingress.yaml`:
```yaml
- host: jobkai.yourdomain.com  # Frontend
- host: api.jobkai.yourdomain.com  # API Gateway
```

3. Deploy with ingress enabled:
```bash
ansible-playbook -i inventory.ini deploy-jobkai.yml --ask-vault-pass -e "deploy_ingress=true"
```

4. Point your DNS records to the Ingress LoadBalancer IP:
```bash
kubectl get svc -n ingress-nginx
```

## 🔍 Monitoring and Debugging

### View Logs

```bash
# API Gateway logs
kubectl logs -n jobkai -l app=api-gateway -f

# Frontend logs
kubectl logs -n jobkai -l app=frontend -f

# Specific service logs
kubectl logs -n jobkai -l app=resume-reviewer-service -f
```

### Check Pod Status

```bash
# Get detailed pod information
kubectl describe pod <pod-name> -n jobkai

# Check events
kubectl get events -n jobkai --sort-by='.lastTimestamp'
```

### Port Forward for Testing

```bash
# Forward API Gateway to localhost
kubectl port-forward -n jobkai svc/api-gateway 8000:8000

# Forward Frontend to localhost
kubectl port-forward -n jobkai svc/frontend 3000:80
```

## 🔐 Security Best Practices

1. **Always encrypt secrets:**
   ```bash
   ansible-vault encrypt vars/secrets.yml
   ```

2. **Use RBAC** for fine-grained access control

3. **Enable Network Policies** to restrict pod communication

4. **Use TLS/HTTPS** with cert-manager for production:
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
   ```

5. **Regularly update images** and scan for vulnerabilities

## 📊 Resource Requirements

Minimum cluster requirements:
- **Nodes**: 2-3 nodes
- **CPU**: 4-6 cores total
- **Memory**: 8-12 GB RAM total
- **Storage**: 20 GB

Per service resource limits (configured in manifests):
- API Gateway: 512Mi RAM, 500m CPU
- Frontend: 256Mi RAM, 200m CPU
- Backend Services: 512Mi-1Gi RAM, 500m-1000m CPU

## 🔄 Update Workflow

When you push new images to ACR:

```bash
# 1. Tag and push new image
docker tag tsyp-jobkai-api-gateway jobkairegistry.azurecr.io/api-gateway:v1.1.0
docker push jobkairegistry.azurecr.io/api-gateway:v1.1.0

# 2. Update the :latest tag
docker tag tsyp-jobkai-api-gateway jobkairegistry.azurecr.io/api-gateway:latest
docker push jobkairegistry.azurecr.io/api-gateway:latest

# 3. Trigger rolling update via Ansible
ansible-playbook -i inventory.ini update-images.yml --ask-vault-pass -e "service=api-gateway"

# Or manually
kubectl rollout restart deployment/api-gateway -n jobkai
```

## 🆘 Troubleshooting

### Pods not starting

```bash
# Check pod events
kubectl describe pod <pod-name> -n jobkai

# Common issues:
# - ImagePullBackOff: Check ACR credentials
# - CrashLoopBackOff: Check logs for application errors
# - Pending: Check resource availability
```

### Cannot pull images from ACR

```bash
# Verify secret exists
kubectl get secret acr-secret -n jobkai

# Recreate secret if needed
kubectl delete secret acr-secret -n jobkai
ansible-playbook -i inventory.ini deploy-jobkai.yml --ask-vault-pass --tags secrets
```

### Services not accessible

```bash
# Check service endpoints
kubectl get endpoints -n jobkai

# Check if pods are ready
kubectl get pods -n jobkai

# Test internal connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -n jobkai -- wget -O- http://api-gateway:8000/health
```

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Ansible Kubernetes Collection](https://docs.ansible.com/ansible/latest/collections/kubernetes/core/)
- [Azure Container Registry](https://docs.microsoft.com/en-us/azure/container-registry/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)

## 🤝 Support

For issues or questions:
1. Check the logs: `kubectl logs -n jobkai <pod-name>`
2. Review events: `kubectl get events -n jobkai`
3. Verify configuration: `kubectl get cm,secret -n jobkai`
