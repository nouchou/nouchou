const Activite = require('../models/Activite');

/**
 * Enregistrer une activité utilisateur
 * @param {Object} opts
 * @param {string} opts.userId
 * @param {string} opts.action  - voir enum dans le modèle
 * @param {string} opts.description
 * @param {Object} [opts.cible] - { type, id, label }
 * @param {Object} [opts.req]   - Express request (pour IP/UA)
 * @param {string} [opts.resultat]
 */
async function logActivite({ userId, action, description, cible, req, resultat = 'succès' }) {
  try {
    await Activite.create({
      utilisateur: userId,
      action,
      description,
      cible,
      ip: req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') : '',
      userAgent: req ? req.headers['user-agent'] || '' : '',
      resultat,
    });
  } catch (err) {
    // Ne jamais bloquer la requête principale à cause du log
    console.error('Erreur log activité:', err.message);
  }
}

module.exports = logActivite;
