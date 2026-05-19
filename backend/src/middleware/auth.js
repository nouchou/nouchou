const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Non autorisé — connectez-vous' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.actif) {
      return res.status(401).json({ success: false, message: 'Utilisateur introuvable ou désactivé' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token invalide ou expiré' });
  }
};

exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Accès refusé pour le rôle '${req.user.role}'`,
    });
  }
  next();
};

exports.errorHandler = (err, req, res, _next) => {
  console.error(err);
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'ID invalide' });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `La valeur du champ '${field}' existe déjà`,
    });
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erreur serveur',
  });
};
