const User = require('../models/User');

// GET /api/users
exports.getAll = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

// GET /api/users/:id
exports.getOne = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// POST /api/users
exports.create = async (req, res, next) => {
  try {
    const { nom, prenom, email, motDePasse, role } = req.body;
    if (!nom || !prenom || !email || !motDePasse) {
      return res.status(400).json({ success: false, message: 'Tous les champs obligatoires' });
    }
    const existe = await User.findOne({ email: email.toLowerCase() });
    if (existe) return res.status(400).json({ success: false, message: 'Email déjà utilisé' });
    const user = await User.create({ nom, prenom, email, motDePasse, role });
    res.status(201).json({ success: true, data: user });
  } catch (err) { next(err); }
};

// PUT /api/users/:id
exports.update = async (req, res, next) => {
  try {
    const { nom, prenom, email, role, actif, motDePasse } = req.body;
    const user = await User.findById(req.params.id).select('+motDePasse');
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    // Empêcher de désactiver son propre compte
    if (req.params.id === req.user._id.toString() && actif === false) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas désactiver votre propre compte' });
    }
    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof actif === 'boolean') user.actif = actif;
    if (motDePasse && motDePasse.length >= 6) user.motDePasse = motDePasse;
    await user.save();
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// DELETE /api/users/:id
exports.remove = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    res.json({ success: true, message: 'Utilisateur supprimé' });
  } catch (err) { next(err); }
};
