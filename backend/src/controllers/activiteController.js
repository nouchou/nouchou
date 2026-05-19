const Activite = require('../models/Activite');
const logActivite = require('../utils/logActivite');

// GET /api/activites — journal complet (admin)
exports.getAll = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 30,
      userId, action, dateDebut, dateFin,
    } = req.query;
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const filter = {};
    if (userId)  filter.utilisateur = userId;
    if (action)  filter.action = action;
    if (dateDebut || dateFin) {
      filter.createdAt = {};
      if (dateDebut) filter.createdAt.$gte = new Date(dateDebut);
      if (dateFin)   filter.createdAt.$lte = new Date(new Date(dateFin).setHours(23, 59, 59, 999));
    }

    const total = await Activite.countDocuments(filter);
    const data  = await Activite.find(filter)
      .populate('utilisateur', 'nom prenom email role')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json({ success: true, total, page: pageNum, pages: Math.ceil(total / limitNum) || 1, data });
  } catch (err) { next(err); }
};

// GET /api/activites/resume — compteurs par action pour dashboard admin
exports.getResume = async (req, res, next) => {
  try {
    const now      = new Date();
    const debut24h = new Date(now.getTime() - 24 * 3600 * 1000);
    const debut7j  = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

    const [par24h, par7j, parAction, parUtilisateur] = await Promise.all([
      Activite.countDocuments({ createdAt: { $gte: debut24h } }),
      Activite.countDocuments({ createdAt: { $gte: debut7j } }),
      Activite.aggregate([
        { $match: { createdAt: { $gte: debut7j } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Activite.aggregate([
        { $match: { createdAt: { $gte: debut7j } } },
        { $group: { _id: '$utilisateur', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { count: 1, 'user.nom': 1, 'user.prenom': 1, 'user.email': 1 } },
      ]),
    ]);

    res.json({ success: true, data: { par24h, par7j, parAction, parUtilisateur } });
  } catch (err) { next(err); }
};
