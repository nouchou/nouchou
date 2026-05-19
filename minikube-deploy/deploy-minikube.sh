#!/bin/bash
# ================================================================
# DÉPLOIEMENT MINIKUBE — Cyclo-Pousse Morondava
# Fonctionne sur: Linux, macOS, Windows (Git Bash)
# ================================================================
set -e

# Couleurs pour la lisibilité
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERREUR]${NC} $1"; exit 1; }

# ── CHEMIN RACINE DU PROJET ─────────────────────────────────────
# Adapter si vous lancez le script depuis ailleurs
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
K8S_DIR="${PROJECT_ROOT}/minikube-deploy/k8s"

echo ""
echo "================================================================"
echo "   🚲  Cyclo-Pousse Morondava — Déploiement Minikube"
echo "================================================================"
echo "Racine projet : ${PROJECT_ROOT}"
echo ""

# ================================================================
# ÉTAPE 1 — Vérifier les prérequis
# ================================================================
info "ÉTAPE 1 — Vérification des prérequis..."

command -v minikube >/dev/null 2>&1 || error "minikube non installé. Voir: https://minikube.sigs.k8s.io/docs/start/"
command -v kubectl  >/dev/null 2>&1 || error "kubectl non installé. Voir: https://kubernetes.io/docs/tasks/tools/"
command -v docker   >/dev/null 2>&1 || error "Docker non installé. Voir: https://docs.docker.com/get-docker/"

success "minikube, kubectl et docker sont disponibles"

# ================================================================
# ÉTAPE 2 — Démarrer minikube
# ================================================================
info "ÉTAPE 2 — Démarrage de minikube..."

MINIKUBE_STATUS=$(minikube status --format='{{.Host}}' 2>/dev/null || echo "Stopped")

if [ "$MINIKUBE_STATUS" = "Running" ]; then
  success "minikube est déjà en cours d'exécution"
else
  info "Démarrage du cluster minikube (e2-medium = 2 CPU, 4Go RAM)..."
  minikube start \
    --cpus=2 \
    --memory=4096 \
    --disk-size=20g \
    --driver=docker \
    --kubernetes-version=stable
  success "minikube démarré"
fi

# ================================================================
# ÉTAPE 3 — Activer les addons nécessaires
# ================================================================
info "ÉTAPE 3 — Activation des addons minikube..."

minikube addons enable ingress        --profile minikube 2>/dev/null || true
minikube addons enable metrics-server --profile minikube 2>/dev/null || true
minikube addons enable storage-provisioner --profile minikube 2>/dev/null || true

success "Addons activés: ingress, metrics-server, storage-provisioner"

# ================================================================
# ÉTAPE 4 — Pointer Docker vers le daemon minikube
# ================================================================
info "ÉTAPE 4 — Configuration du daemon Docker de minikube..."
echo ""
warn "IMPORTANT: Exécutez cette commande dans votre terminal avant de continuer:"
echo ""
echo '   eval $(minikube docker-env)'
echo ""
read -p "Avez-vous exécuté eval \$(minikube docker-env) ? (o/N) " CONFIRM
if [[ ! "$CONFIRM" =~ ^[oOyY]$ ]]; then
  warn "Veuillez d'abord exécuter: eval \$(minikube docker-env)"
  warn "Puis relancez ce script."
  exit 0
fi

# ================================================================
# ÉTAPE 5 — Build des images Docker DANS minikube
# ================================================================
info "ÉTAPE 5 — Build des images Docker..."

# Backend
info "Building cyclopousse-backend..."
docker build \
  -f "${PROJECT_ROOT}/minikube-deploy/Dockerfile.backend" \
  -t cyclopousse-backend:latest \
  "${PROJECT_ROOT}/backend/"
success "Image backend buildée"

# Copier nginx.conf dans frontend avant le build
cp "${PROJECT_ROOT}/minikube-deploy/nginx.conf" "${PROJECT_ROOT}/frontend/"

# Frontend
info "Building cyclopousse-frontend..."
docker build \
  -f "${PROJECT_ROOT}/minikube-deploy/Dockerfile.frontend" \
  -t cyclopousse-frontend:latest \
  "${PROJECT_ROOT}/frontend/"
success "Image frontend buildée"

# Vérifier que les images sont bien dans minikube
info "Images disponibles dans minikube:"
docker images | grep cyclopousse

# ================================================================
# ÉTAPE 6 — Déploiement Kubernetes
# ================================================================
info "ÉTAPE 6 — Déploiement sur Kubernetes..."

# Namespace
kubectl apply -f "${K8S_DIR}/namespace.yaml"
success "Namespace 'cyclopousse' créé"

# MongoDB
kubectl apply -f "${K8S_DIR}/mongodb/mongodb.yaml"
info "Attente démarrage MongoDB (peut prendre 30-60s)..."
kubectl rollout status statefulset/mongodb -n cyclopousse --timeout=180s
success "MongoDB prêt"

# Secrets
kubectl apply -f "${K8S_DIR}/backend/secret.yaml"
success "Secrets appliqués"

# Backend
kubectl apply -f "${K8S_DIR}/backend/backend.yaml"
info "Attente démarrage Backend..."
kubectl rollout status deployment/backend -n cyclopousse --timeout=120s
success "Backend prêt"

# Frontend + Ingress
kubectl apply -f "${K8S_DIR}/frontend/frontend.yaml"
kubectl rollout status deployment/frontend -n cyclopousse --timeout=120s
success "Frontend prêt"

# ================================================================
# ÉTAPE 7 — Configurer /etc/hosts pour cyclopousse.local
# ================================================================
info "ÉTAPE 7 — Configuration du host local..."

MINIKUBE_IP=$(minikube ip)
echo ""
warn "Ajoutez cette ligne à votre fichier /etc/hosts (sudo requis):"
echo ""
echo "   ${MINIKUBE_IP}   cyclopousse.local"
echo ""
echo "Commande Linux/Mac:"
echo "   echo '${MINIKUBE_IP} cyclopousse.local' | sudo tee -a /etc/hosts"
echo ""
echo "Commande Windows (PowerShell admin):"
echo "   Add-Content C:\Windows\System32\drivers\etc\hosts '${MINIKUBE_IP} cyclopousse.local'"
echo ""

# ================================================================
# ÉTAPE 8 — Résumé et URLs d'accès
# ================================================================
echo ""
echo "================================================================"
success "DÉPLOIEMENT TERMINÉ !"
echo "================================================================"
echo ""
kubectl get all -n cyclopousse
echo ""
echo "📌 IP Minikube : ${MINIKUBE_IP}"
echo ""
echo "🌐 Accès à l'application (après /etc/hosts configuré) :"
echo "   http://cyclopousse.local"
echo "   http://cyclopousse.local/api/health"
echo ""
echo "🔧 Accès direct sans Ingress :"
echo "   minikube service frontend-service -n cyclopousse"
echo ""
echo "📊 Autoscaler HPA :"
echo "   kubectl get hpa -n cyclopousse"
echo ""
echo "📋 Voir les logs :"
echo "   kubectl logs -n cyclopousse deployment/backend -f"
echo "   kubectl logs -n cyclopousse deployment/frontend -f"
echo ""
echo "🌱 Seed la base de données (première fois) :"
echo "   kubectl exec -n cyclopousse deployment/backend -- node scripts/seed.js"
echo "================================================================"
