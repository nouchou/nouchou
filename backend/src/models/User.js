const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true },
    prenom: { type: String, required: true, trim: true },
    email: {
      type: String, required: true, unique: true,
      lowercase: true, trim: true,
    },
    motDePasse: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      // admin = tout faire | gestionnaire = CRUD cyclopousse | public = lecture seule via QR
      enum: ['admin', 'gestionnaire'],
      default: 'gestionnaire',
    },
    actif: { type: Boolean, default: true },
    derniereConnexion: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('motDePasse')) return next();
  this.motDePasse = await bcrypt.hash(this.motDePasse, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidat) {
  return bcrypt.compare(candidat, this.motDePasse);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.motDePasse;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
