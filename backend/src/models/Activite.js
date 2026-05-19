const mongoose = require('mongoose');

const activiteSchema = new mongoose.Schema(
  {
    utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      required: true,
      enum: [
        'connexion', 'deconnexion',
        'creation_cyclopousse', 'modification_cyclopousse', 'suppression_cyclopousse',
        'ajout_cotisation', 'modification_cotisation', 'suppression_cotisation',
        'creation_utilisateur', 'modification_utilisateur', 'suppression_utilisateur',
        'generation_qr', 'consultation',
      ],
    },
    description: { type: String, trim: true },
    cible: {
      type: { type: String, enum: ['cyclopousse', 'utilisateur', 'cotisation', 'systeme'] },
      id: { type: String },
      label: { type: String }, // NIF ou nom pour affichage rapide
    },
    ip: { type: String },
    userAgent: { type: String },
    resultat: { type: String, enum: ['succès', 'erreur'], default: 'succès' },
  },
  { timestamps: true }
);

activiteSchema.index({ utilisateur: 1, createdAt: -1 });
activiteSchema.index({ createdAt: -1 });
activiteSchema.index({ action: 1 });

module.exports = mongoose.model('Activite', activiteSchema);
