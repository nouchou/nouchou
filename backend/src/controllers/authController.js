const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logActivite = require('../utils/logActivite');

const genToken   = (id) => jwt.sign({ id }, process.env.JWT_SECRET,         { expiresIn: process.env.JWT_EXPIRE        || '7d' });
const genRefresh = (id) => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET,  { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' });

exports.login = async (req, res, next) => {
  try {
    const { email, motDePasse } = req.body;
    if (!email || !motDePasse) return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    const user = await User.findOne({ email: email.toLowerCase() }).select('+motDePasse');
    if (!user || !user.actif) return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    const ok = await user.comparePassword(motDePasse);
    if (!ok) {
      await logActivite({ userId: user._id, action: 'connexion', description: `Tentative échouée: ${email}`, cible: { type: 'systeme' }, req, resultat: 'erreur' });
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }
    user.derniereConnexion = new Date();
    await user.save({ validateBeforeSave: false });
    await logActivite({ userId: user._id, action: 'connexion', description: `Connexion réussie — ${user.prenom} ${user.nom} (${user.role})`, cible: { type: 'systeme' }, req });
    const token = genToken(user._id);
    const refreshToken = genRefresh(user._id);
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 30 * 24 * 3600 * 1000 });
    res.json({ success: true, token, user });
  } catch (err) { next(err); }
};

exports.refresh = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ success: false, message: 'Refresh token manquant' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.actif) return res.status(401).json({ success: false, message: 'Utilisateur invalide' });
    res.json({ success: true, token: genToken(user._id) });
  } catch {
    res.status(401).json({ success: false, message: 'Refresh token invalide' });
  }
};

exports.me = (req, res) => res.json({ success: true, user: req.user });

exports.logout = async (req, res) => {
  await logActivite({ userId: req.user._id, action: 'deconnexion', description: `Déconnexion — ${req.user.prenom} ${req.user.nom}`, cible: { type: 'systeme' }, req });
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Déconnecté' });
};
