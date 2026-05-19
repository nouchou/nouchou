const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// ── Cotisation ────────────────────────────────────────────────
const cotisationSchema = new mongoose.Schema(
  {
    annee: { type: Number, required: true },
    mois: { type: Number, required: true, min: 1, max: 12 },
    montant: { type: Number, required: true, min: 0 },
    datePaiement: { type: Date },
    dateEcheance: { type: Date, required: true },
    statut: {
      type: String,
      enum: ['payé', 'en_attente', 'en_retard', 'exonéré'],
      default: 'en_attente',
    },
    modePaiement: {
      type: String,
      enum: ['espèces', 'mobile_money', 'virement', 'autre'],
    },
    referencePaiement: { type: String, trim: true },
    remarques: { type: String, trim: true },
    enregistrePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ── CycloPousse ───────────────────────────────────────────────
const cycloPousseSchema = new mongoose.Schema(
  {
    // Token unique pour le QR code — URL publique de vérification
    tokenQR: {
      type: String,
      unique: true,
      default: () => uuidv4(),
      index: true,
    },

    // Identification officielle
    nif: {
      type: String,
      required: [true, 'Le NIF est obligatoire'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    numeroStat: {
      type: String,
      required: [true, 'Le numéro STAT est obligatoire'],
      unique: true,
      trim: true,
      uppercase: true,
    },

    // CIN
    carteIdentiteNationale: {
      numero: {
        type: String,
        required: [true, 'Le numéro CIN est obligatoire'],
        unique: true,
        trim: true,
        uppercase: true,
      },
      dateDelivrance: Date,
      lieuDelivrance: { type: String, trim: true },
      dateExpiration: Date,
    },

    // Propriétaire / Conducteur
    conducteur: {
      nom: { type: String, required: true, trim: true, uppercase: true },
      prenom: { type: String, required: true, trim: true },
      dateNaissance: Date,
      lieuNaissance: { type: String, trim: true },
      adresse: { type: String, trim: true },
      quartier: { type: String, trim: true },
      telephone: { type: String, trim: true },
      photo: { type: String }, // URL / chemin photo
    },

    // Véhicule
    vehicule: {
      numeroImmatriculation: { type: String, trim: true, uppercase: true },
      couleur: { type: String, trim: true },
      annee: Number,
      etat: {
        type: String,
        enum: ['bon', 'moyen', 'mauvais', 'hors_service'],
        default: 'bon',
      },
      numeroSerie: { type: String, trim: true },
    },

    // Zone de circulation à Morondava
    zone: {
      type: String,
      enum: [
        'Centre-ville Morondava',
        'Betania',
        'Nosy Kely',
        'Befasy',
        'Mahabo (route)',
        'Belo-sur-Tsiribihina (route)',
        'Dabara',
        'Ambia',
        'Autre zone',
      ],
      default: 'Centre-ville Morondava',
    },

    // Statut administratif
    statut: {
      type: String,
      enum: ['actif', 'suspendu', 'radié', 'en_attente_validation'],
      default: 'en_attente_validation',
    },

    // Délai de paiement cotisation (jours)
    delaiPaiementJours: { type: Number, default: 30 },

    // Montant cotisation mensuelle standard
    montantCotisationMensuelle: { type: Number, default: 5000 },

    // Cotisations
    cotisations: [cotisationSchema],

    // Métadonnées
    creePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    modifiePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtuals ──────────────────────────────────────────────────
cycloPousseSchema.virtual('nomComplet').get(function () {
  return `${this.conducteur.prenom} ${this.conducteur.nom}`;
});

// Statut global des cotisations pour la vue publique
cycloPousseSchema.virtual('statutCotisation').get(function () {
  const moisCourant = new Date().getMonth() + 1;
  const anneeCourante = new Date().getFullYear();
  const derniere = this.cotisations.find(
    (c) => c.annee === anneeCourante && c.mois === moisCourant
  );
  if (!derniere) return 'inconnu';
  return derniere.statut;
});

cycloPousseSchema.virtual('cotisationsEnRetard').get(function () {
  const now = new Date();
  return this.cotisations.filter(
    (c) => c.statut === 'en_attente' && new Date(c.dateEcheance) < now
  ).length;
});

cycloPousseSchema.virtual('dernieresCotisations').get(function () {
  return [...this.cotisations]
    .sort((a, b) => b.annee - a.annee || b.mois - a.mois)
    .slice(0, 12);
});

// Mettre à jour statut en retard automatiquement
cycloPousseSchema.pre('save', function (next) {
  const now = new Date();
  this.cotisations.forEach((c) => {
    if (c.statut === 'en_attente' && new Date(c.dateEcheance) < now) {
      c.statut = 'en_retard';
    }
  });
  next();
});

// Index recherche
cycloPousseSchema.index({ tokenQR: 1 });
cycloPousseSchema.index({ statut: 1, zone: 1 });
cycloPousseSchema.index({ createdAt: -1 });
cycloPousseSchema.index(
  { nif: 'text', numeroStat: 'text', 'conducteur.nom': 'text', 'conducteur.prenom': 'text' },
  { name: 'search_index' }
);

module.exports = mongoose.model('CycloPousse', cycloPousseSchema);
