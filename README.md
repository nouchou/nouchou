# 🚲 Cyclo-Pousse Morondava — Application MERN

Application de gestion municipale des cyclo-pousses pour la **Ville de Morondava**.

## ✨ Fonctionnalités

### Espace admin (agents municipaux)
- **CRUD complet** : créer, modifier, supprimer les dossiers conducteurs
- Gestion des **NIF**, **N° STAT**, **Carte d'identité nationale (CIN)**
- Suivi des **cotisations** par mois/année (ajout, modification, suppression)
- Statuts : `actif`, `suspendu`, `radié`, `en_attente_validation`
- Zones de circulation spécifiques à Morondava
- Tableau de bord avec statistiques et graphiques
- **Gestion des utilisateurs** (admin uniquement) : créer / modifier / supprimer les agents
- **Génération de QR codes** téléchargeables pour chaque conducteur

### Espace public (sans connexion — QR code)
- Page de vérification accessible via QR code scanné
- Affiche si le conducteur **est à jour** ou **en retard** sur ses cotisations
- Grille visuelle des 12 derniers mois de cotisations
- Aucune donnée sensible exposée (pas de téléphone, pas d'adresse)

---

## 🚀 Démarrage rapide

### Option A — Docker (recommandé)
```bash
cd cyclopousse-morondava
docker compose up -d

# Injecter les données de démo
cd backend && npm install
node scripts/seed.js

# → http://localhost:3000
```

### Option B — Développement local
```bash
# Terminal 1 — Backend
cd backend
npm install
cp .env.example .env      # Éditer MONGO_URI et secrets JWT
npm run dev               # → http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev               # → http://localhost:3000

# Seed (base vide)
cd backend && node scripts/seed.js
```

---

## 🔑 Comptes de démonstration (après seed)

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| `admin@morondava.mg` | `Admin@2024!` | Administrateur |
| `gestionnaire@morondava.mg` | `Gestionnaire@2024!` | Gestionnaire |

---

## 📱 Page de vérification publique (QR Code)

Accès sans connexion :
```
http://localhost:3000/verifier/<tokenQR>
```

Pour obtenir le token d'un conducteur :
1. Aller sur sa fiche → onglet **QR Code**
2. Télécharger ou afficher le QR
3. Scanner → redirige vers la page publique

---

## 📡 API Endpoints

### Public (sans authentification)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/public/verifier/:tokenQR` | Vérification publique par QR |
| GET | `/api/health` | Santé du serveur |

### Auth
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/me` | Profil courant |
| POST | `/api/auth/refresh` | Rafraîchir token |

### Cyclo-pousses (authentifié)
| Méthode | Route | Rôle requis |
|---------|-------|-------------|
| GET | `/api/cyclopousse` | Tous |
| GET | `/api/cyclopousse/stats` | Tous |
| GET | `/api/cyclopousse/:id` | Tous |
| GET | `/api/cyclopousse/:id/qrcode` | Tous |
| POST | `/api/cyclopousse` | Gestionnaire+ |
| PUT | `/api/cyclopousse/:id` | Gestionnaire+ |
| DELETE | `/api/cyclopousse/:id` | Admin |
| POST | `/api/cyclopousse/:id/cotisations` | Gestionnaire+ |
| PUT | `/api/cyclopousse/:id/cotisations/:cid` | Gestionnaire+ |
| DELETE | `/api/cyclopousse/:id/cotisations/:cid` | Admin |

### Utilisateurs (admin uniquement)
| Méthode | Route |
|---------|-------|
| GET | `/api/users` |
| POST | `/api/users` |
| PUT | `/api/users/:id` |
| DELETE | `/api/users/:id` |

---

## 🔐 Rôles

| Action | Gestionnaire | Admin |
|--------|-------------|-------|
| Voir les dossiers | ✅ | ✅ |
| Créer / Modifier | ✅ | ✅ |
| Supprimer dossier | ❌ | ✅ |
| Gérer cotisations | ✅ | ✅ |
| Supprimer cotisation | ❌ | ✅ |
| Gérer utilisateurs | ❌ | ✅ |

---

## 🏗️ Déploiement GCP

Vous pouvez déployer cette application sur Google Cloud Platform via deux méthodes : **Cloud Run** (recommandé pour sa simplicité et son coût) ou **GKE** (pour une orchestration avancée).

### Option A — Cloud Run (Recommandé)

Mettez à disposition l'application de manière "Serverless" très facilement :

1. Assurez-vous d'avoir `gcloud` installé et configuré (`gcloud auth login`).
2. Configurez votre projet :
   ```bash
   gcloud config set project VOTRE_PROJECT_ID
   ```
3. Déploiement du **Backend** :
   ```bash
   cd backend
   gcloud run deploy cyclopousse-api \
      --source . \
      --region europe-west9 \
      --allow-unauthenticated \
      --set-env-vars="MONGO_URI=votre_mongo_uri,JWT_SECRET=super_secret,NODE_ENV=production"
   ```
   *(Notez l'URL fournie par Cloud Run à la fin du déploiement, vous en aurez besoin pour le frontend)*.
   
4. Déploiement du **Frontend** :
   Dans `frontend/.env.production` assurez-vous d'avoir `VITE_API_URL=URL_DE_VOTRE_CLOUD_RUN_API`.
   ```bash
   cd frontend
   gcloud run deploy cyclopousse-web \
      --source . \
      --region europe-west9 \
      --allow-unauthenticated
   ```

### Option B — Google Kubernetes Engine (GKE)

Voir le sous-projet `../cyclopousse-deploy/` (si disponible dans votre environnement) pour le déploiement Kubernetes complet.

```bash
cd ../cyclopousse-deploy
export PROJECT_ID="votre-project-gcp"
# Initialiser le cluster et déployer via Terraform/Make
make all
```
Ou manuellement avec Kubernetes :
```bash
gcloud container clusters create cyclopousse-cluster --num-nodes=2 --zone=europe-west9-a
kubectl apply -f k8s/
```


#commende pour lancer le projet dans le minikube
#Terminal 1 — Démarrer le cluster :
export DOCKER_API_VERSION=1.41
minikube start
#Terminal 2 — Vérifier que tout est Running :
kubectl get pods -n cyclopousse
#Si tous les pods sont Running 1/1 → ouvrez directement le navigateur :
minikube service frontend-service -n cyclopousse

#Mot de passe utilisateur
✔ Utilisateurs créés:
   admin@morondava.mg          / Admin@2024!
   gestionnaire@morondava.mg   / Gestionnaire@2024!


