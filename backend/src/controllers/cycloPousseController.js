const QRCode = require('qrcode');
const CycloPousse = require('../models/CycloPousse');
const logActivite = require('../utils/logActivite');

const buildFilter = ({ statut, zone, search }) => {
  const f = {};
  if (statut) f.statut = statut;
  if (zone) f.zone = zone;
  if (search && search.length >= 2) {
    f.$or = [
      { nif: new RegExp(search, 'i') },
      { numeroStat: new RegExp(search, 'i') },
      { 'conducteur.nom': new RegExp(search, 'i') },
      { 'conducteur.prenom': new RegExp(search, 'i') },
      { 'carteIdentiteNationale.numero': new RegExp(search, 'i') },
      { 'vehicule.numeroImmatriculation': new RegExp(search, 'i') },
    ];
  }
  return f;
};

// GET /api/cyclopousse — BUG FIX: pagination correcte, limit augmenté
exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, statut, zone, search, sort = 'createdAt', order = 'desc' } = req.query;
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const filter   = buildFilter({ statut, zone, search });
    const total    = await CycloPousse.countDocuments(filter);
    const pages    = Math.ceil(total / limitNum) || 1;
    const data     = await CycloPousse.find(filter)
      .select('-cotisations')
      .populate('creePar', 'nom prenom')
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();
    res.json({ success: true, total, page: pageNum, pages, limit: limitNum, data });
  } catch (err) { next(err); }
};

// GET /api/cyclopousse/stats — enrichi: jour, année, évolution, alertes
exports.getStats = async (req, res, next) => {
  try {
    const now             = new Date();
    const anneeCourante   = now.getFullYear();
    const anneePrecedente = anneeCourante - 1;
    const debutAnnee      = new Date(anneeCourante, 0, 1);
    const debutAnneePrev  = new Date(anneePrecedente, 0, 1);
    const finAnneePrev    = new Date(anneeCourante, 0, 1);
    const debutJour       = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const finJour         = new Date(debutJour.getTime() + 86400000);
    const finAnnee        = new Date(anneeCourante, 11, 31);
    const joursRestants   = Math.ceil((finAnnee - now) / 86400000);

    const [
      total, actifs, enAttente, suspendus, radies, parZone, enRetard,
      recettesMensuelles, recettesJourAgg, recettesAnneeAgg,
      recettesAnneePrecAgg, inscriptionsMensuelles,
      inscriptionsAnnee, inscriptionsAnneePrecedente,
    ] = await Promise.all([
      CycloPousse.countDocuments(),
      CycloPousse.countDocuments({ statut: 'actif' }),
      CycloPousse.countDocuments({ statut: 'en_attente_validation' }),
      CycloPousse.countDocuments({ statut: 'suspendu' }),
      CycloPousse.countDocuments({ statut: 'radié' }),
      CycloPousse.aggregate([{ $group: { _id: '$zone', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      CycloPousse.countDocuments({ 'cotisations.statut': 'en_retard' }),
      CycloPousse.aggregate([
        { $unwind: '$cotisations' },
        { $match: { 'cotisations.statut': 'payé' } },
        { $group: { _id: { annee: '$cotisations.annee', mois: '$cotisations.mois' }, total: { $sum: '$cotisations.montant' }, count: { $sum: 1 } } },
        { $sort: { '_id.annee': -1, '_id.mois': -1 } },
        { $limit: 12 },
      ]),
      CycloPousse.aggregate([
        { $unwind: '$cotisations' },
        { $match: { 'cotisations.statut': 'payé', 'cotisations.datePaiement': { $gte: debutJour, $lt: finJour } } },
        { $group: { _id: null, total: { $sum: '$cotisations.montant' }, count: { $sum: 1 } } },
      ]),
      CycloPousse.aggregate([
        { $unwind: '$cotisations' },
        { $match: { 'cotisations.statut': 'payé', 'cotisations.annee': anneeCourante } },
        { $group: { _id: null, total: { $sum: '$cotisations.montant' }, count: { $sum: 1 } } },
      ]),
      CycloPousse.aggregate([
        { $unwind: '$cotisations' },
        { $match: { 'cotisations.statut': 'payé', 'cotisations.annee': anneePrecedente } },
        { $group: { _id: null, total: { $sum: '$cotisations.montant' }, count: { $sum: 1 } } },
      ]),
      CycloPousse.aggregate([
        { $group: { _id: { annee: { $year: '$createdAt' }, mois: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.annee': -1, '_id.mois': -1 } },
        { $limit: 12 },
      ]),
      CycloPousse.countDocuments({ createdAt: { $gte: debutAnnee } }),
      CycloPousse.countDocuments({ createdAt: { $gte: debutAnneePrev, $lt: finAnneePrev } }),
    ]);

    const recettesAnnee    = recettesAnneeAgg[0]?.total   || 0;
    const recettesAnneePre = recettesAnneePrecAgg[0]?.total || 0;
    const croissanceRecettes = recettesAnneePre > 0
      ? Math.round(((recettesAnnee - recettesAnneePre) / recettesAnneePre) * 100) : null;
    const croissanceInscriptions = inscriptionsAnneePrecedente > 0
      ? Math.round(((inscriptionsAnnee - inscriptionsAnneePrecedente) / inscriptionsAnneePrecedente) * 100) : null;

    res.json({
      success: true,
      data: {
        total, actifs, enAttente, suspendus, radies, enRetard, parZone,
        recettesMensuelles,
        recettesJour:      recettesJourAgg[0]?.total  || 0,
        recettesJourCount: recettesJourAgg[0]?.count  || 0,
        recettesAnnee,     recettesAnneeCount: recettesAnneeAgg[0]?.count || 0,
        recettesAnneePrecedente: recettesAnneePre,
        croissanceRecettes,
        inscriptionsMensuelles,
        inscriptionsAnnee, inscriptionsAnneePrecedente,
        croissanceInscriptions,
        anneeCourante, joursRestantsAnnee: joursRestants,
        alerteFinAnnee: joursRestants <= 60,
      },
    });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const doc = await CycloPousse.findById(req.params.id)
      .populate('creePar', 'nom prenom')
      .populate('modifiePar', 'nom prenom')
      .populate('cotisations.enregistrePar', 'nom prenom');
    if (!doc) return res.status(404).json({ success: false, message: 'Cyclo-pousse introuvable' });
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};

exports.verifierPublic = async (req, res, next) => {
  try {
    const doc = await CycloPousse.findOne({ tokenQR: req.params.tokenQR })
      .select('tokenQR nif numeroStat statut zone conducteur vehicule cotisations createdAt');
    if (!doc) return res.status(404).json({ success: false, message: 'QR Code invalide' });
    const now = new Date();
    const anneeCourante = now.getFullYear();
    const moisCourant   = now.getMonth() + 1;
    const dernieres12   = [...doc.cotisations].sort((a, b) => b.annee - a.annee || b.mois - a.mois).slice(0, 12);
    const cotisationMois = doc.cotisations.find((c) => c.annee === anneeCourante && c.mois === moisCourant);
    const nbRetard = doc.cotisations.filter(
      (c) => c.statut === 'en_retard' || (c.statut === 'en_attente' && new Date(c.dateEcheance) < now)
    ).length;
    const totalPaye = doc.cotisations.filter((c) => c.statut === 'payé').reduce((a, c) => a + c.montant, 0);
    res.json({
      success: true,
      data: {
        nif: doc.nif, numeroStat: doc.numeroStat, statut: doc.statut, zone: doc.zone,
        conducteur: { nom: doc.conducteur.nom, prenom: doc.conducteur.prenom, quartier: doc.conducteur.quartier },
        vehicule: { numeroImmatriculation: doc.vehicule?.numeroImmatriculation, couleur: doc.vehicule?.couleur, etat: doc.vehicule?.etat },
        cotisationMoisCourant: cotisationMois
          ? { statut: cotisationMois.statut, montant: cotisationMois.montant, datePaiement: cotisationMois.datePaiement } : null,
        nbCotisationsEnRetard: nbRetard, totalCotisationsPaye: totalPaye,
        dernieres12Cotisations: dernieres12.map((c) => ({ annee: c.annee, mois: c.mois, statut: c.statut, montant: c.montant, datePaiement: c.datePaiement })),
        enregistreDepuis: doc.createdAt,
        estAJour: nbRetard === 0 && cotisationMois?.statut === 'payé',
      },
    });
  } catch (err) { next(err); }
};

exports.getQRCode = async (req, res, next) => {
  try {
    const doc = await CycloPousse.findById(req.params.id).select('tokenQR conducteur nif');
    if (!doc) return res.status(404).json({ success: false, message: 'Introuvable' });
    const url = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/verifier/${doc.tokenQR}`;
    const qrDataURL = await QRCode.toDataURL(url, { errorCorrectionLevel: 'H', width: 400, margin: 2, color: { dark: '#0f0f0f', light: '#ffffff' } });
    await logActivite({ userId: req.user._id, action: 'generation_qr', description: `QR généré NIF: ${doc.nif}`, cible: { type: 'cyclopousse', id: doc._id.toString(), label: doc.nif }, req });
    res.json({ success: true, data: { qrDataURL, url, tokenQR: doc.tokenQR } });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const doc = await CycloPousse.create({ ...req.body, creePar: req.user._id });
    await logActivite({ userId: req.user._id, action: 'creation_cyclopousse', description: `Création NIF: ${doc.nif} — ${doc.conducteur?.prenom} ${doc.conducteur?.nom}`, cible: { type: 'cyclopousse', id: doc._id.toString(), label: doc.nif }, req });
    res.status(201).json({ success: true, data: doc });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { cotisations, tokenQR, creePar, ...payload } = req.body;
    const doc = await CycloPousse.findByIdAndUpdate(req.params.id, { ...payload, modifiePar: req.user._id }, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Introuvable' });
    await logActivite({ userId: req.user._id, action: 'modification_cyclopousse', description: `Modification NIF: ${doc.nif}`, cible: { type: 'cyclopousse', id: doc._id.toString(), label: doc.nif }, req });
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const doc = await CycloPousse.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Introuvable' });
    await logActivite({ userId: req.user._id, action: 'suppression_cyclopousse', description: `Suppression NIF: ${doc.nif}`, cible: { type: 'cyclopousse', id: doc._id.toString(), label: doc.nif }, req });
    res.json({ success: true, message: `NIF=${doc.nif} supprimé` });
  } catch (err) { next(err); }
};

exports.addCotisation = async (req, res, next) => {
  try {
    const doc = await CycloPousse.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Introuvable' });
    const { annee, mois } = req.body;
    if (doc.cotisations.find((c) => c.annee === +annee && c.mois === +mois)) {
      return res.status(400).json({ success: false, message: `Cotisation ${mois}/${annee} déjà enregistrée` });
    }
    doc.cotisations.push({ ...req.body, enregistrePar: req.user._id });
    doc.modifiePar = req.user._id;
    await doc.save();
    const added = doc.cotisations[doc.cotisations.length - 1];
    await logActivite({ userId: req.user._id, action: 'ajout_cotisation', description: `Cotisation ${mois}/${annee} — NIF: ${doc.nif} — ${req.body.statut} — ${req.body.montant} MGA`, cible: { type: 'cotisation', id: added._id.toString(), label: doc.nif }, req });
    res.status(201).json({ success: true, data: added });
  } catch (err) { next(err); }
};

exports.updateCotisation = async (req, res, next) => {
  try {
    const doc = await CycloPousse.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Introuvable' });
    const cotis = doc.cotisations.id(req.params.cid);
    if (!cotis) return res.status(404).json({ success: false, message: 'Cotisation introuvable' });
    Object.assign(cotis, req.body, { enregistrePar: req.user._id });
    doc.modifiePar = req.user._id;
    await doc.save();
    await logActivite({ userId: req.user._id, action: 'modification_cotisation', description: `Cotisation ${cotis.mois}/${cotis.annee} modifiée — NIF: ${doc.nif}`, cible: { type: 'cotisation', id: cotis._id.toString(), label: doc.nif }, req });
    res.json({ success: true, data: cotis });
  } catch (err) { next(err); }
};

exports.deleteCotisation = async (req, res, next) => {
  try {
    const doc = await CycloPousse.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Introuvable' });
    const cotis = doc.cotisations.id(req.params.cid);
    const label = cotis ? `${cotis.mois}/${cotis.annee}` : '?';
    doc.cotisations.pull({ _id: req.params.cid });
    await doc.save();
    await logActivite({ userId: req.user._id, action: 'suppression_cotisation', description: `Cotisation ${label} supprimée — NIF: ${doc.nif}`, cible: { type: 'cotisation', id: req.params.cid, label: doc.nif }, req });
    res.json({ success: true, message: 'Cotisation supprimée' });
  } catch (err) { next(err); }
};
