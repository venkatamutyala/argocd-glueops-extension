#!/bin/bash
set -e

echo "🚀 Installing ArgoCD with GlueOps Extension using Helm Chart"
echo ""

# Check prerequisites
if ! command -v helm &> /dev/null; then
    echo "❌ helm not found. Please install Helm v3.x."
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl."
    exit 1
fi

# Add Helm repository
echo "📦 Adding ArgoCD Helm repository..."
helm repo add argo https://argoproj.github.io/argo-helm 2>/dev/null || true
helm repo update

# Download extension
echo "📥 Downloading extension from GitHub release..."
EXTENSION_VERSION="${EXTENSION_VERSION:-v1.0.0}"
curl -L -o extension.tar.gz https://github.com/venkatamutyala/argocd-glueops-extension/releases/download/${EXTENSION_VERSION}/extension.tar.gz

if [ ! -f extension.tar.gz ] || [ ! -s extension.tar.gz ]; then
    echo "❌ Failed to download extension.tar.gz"
    exit 1
fi

# Create namespace
echo "📦 Creating namespace..."
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

# Create extension ConfigMap
echo "📦 Creating extension ConfigMap..."
kubectl create configmap extension-tar \
  --from-file=extension.tar.gz=extension.tar.gz \
  -n argocd \
  --dry-run=client -o yaml | kubectl apply -f -

# Install ArgoCD with Helm
echo "📦 Installing ArgoCD with Helm chart..."
if [ ! -f helm-values.yaml ]; then
    echo "❌ helm-values.yaml not found. Please ensure it exists in the current directory."
    exit 1
fi

helm upgrade --install argocd argo/argo-cd \
  -f helm-values.yaml \
  -n argocd \
  --wait \
  --timeout 10m

# Wait for ArgoCD to be ready
echo "⏳ Waiting for ArgoCD server to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s

# Verify extension installation
echo ""
echo "✅ Verifying extension installation..."
if kubectl exec -n argocd $(kubectl get pods -n argocd -l app.kubernetes.io/name=argocd-server -o jsonpath='{.items[0].metadata.name}') \
  -- ls -lh /tmp/extensions/resources/app-links-extension/extension.js 2>/dev/null; then
    echo "✅ Extension installed successfully!"
else
    echo "❌ Extension not found. Check logs:"
    echo "   kubectl logs -n argocd <argocd-server-pod> -c argocd-extension-installer"
    exit 1
fi

# Get admin password
echo ""
echo "📋 ArgoCD Admin Credentials:"
echo "   Username: admin"
echo "   Password: $(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)"
echo ""

echo "✅ Installation complete!"
echo ""
echo "Access ArgoCD:"
echo "  kubectl port-forward -n argocd svc/argocd-server 8080:443"
echo "  Then open https://localhost:8080"
echo ""

