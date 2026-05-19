require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cyclopousse_morondava';

// Schémas simplifiés pour le seed
const userSchema = new mongoose.Schema({
  nom: String, prenom: String, email: String,
  motDePasse: String, role: String, actif: Boolean,
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

const cycloPousseSchema = new mongoose.Schema({
  tokenQR: { type: String, default: () => uuidv4() },
  nif: String, numeroStat: String, statut: String, zone: String,
  conducteur: Object, carteIdentiteNationale: Object,
  vehicule: Object, cotisations: Array,
  delaiPaiementJours: Number, montantCotisationMensuelle: Number,
  notes: String,
}, { timestamps: true });
const CycloPousse = mongoose.model('CycloPousse', cycloPousseSchema);

const ZONES = [
  'Centre-ville Morondava', 'Betania', 'Nosy Kely',
  'Befasy', 'Dabara', 'Ambia',
];
const NOMS = ['RAKOTO', 'RASOAMAHATODY', 'RANDRIANASOLO', 'RAKOTONDRABE',
  'ANDRIANTSOA', 'RAZAFIMAHATRATRA', 'RAKOTOBE', 'RAMAROSON',
  'ANDRIAMAHEFA', 'RANDRIANA'];
const PRENOMS = ['Jean', 'Marie', 'Pierre', 'Haja', 'Zo', 'Tiana', 'Fara', 'Lova', 'Solo', 'Niry'];
const QUARTIERS = ['Ankiembe', 'Tanambao', 'Anketa', 'Ambalapaiso', 'Soanafindra'];
const MOIS_LABELS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✔ Connecté à MongoDB:', MONGO_URI);

  await User.deleteMany({});
  await CycloPousse.deleteMany({});
  console.log('✔ Base nettoyée');

  // ── Utilisateurs ─────────────────────────────────────────────
  const salt = await bcrypt.genSalt(12);
  const adminHash = await bcrypt.hash('Admin@2024!', salt);
  const gestHash  = await bcrypt.hash('Gestionnaire@2024!', salt);

  await User.create([
    {
      nom: 'ADMINISTRATEUR', prenom: 'Système',
      email: 'admin@morondava.mg',
      motDePasse: adminHash, role: 'admin', actif: true,
    },
    {
      nom: 'RASOA', prenom: 'Hérimanitra',
      email: 'gestionnaire@morondava.mg',
      motDePasse: gestHash, role: 'gestionnaire', actif: true,
    },
  ]);
  console.log('✔ Utilisateurs créés:');
  console.log('   admin@morondava.mg          / Admin@2024!');
  console.log('   gestionnaire@morondava.mg   / Gestionnaire@2024!');

  // ── Cyclo-pousses ─────────────────────────────────────────────
  const docs = [];
  const annee = 2024;
  const moisCourant = new Date().getMonth() + 1;

  for (let i = 1; i <= 30; i++) {
    const nom    = rand(NOMS);
    const prenom = rand(PRENOMS);
    const zone   = rand(ZONES);
    const statutsDossier = ['actif','actif','actif','actif','suspendu','en_attente_validation'];
    const statut = rand(statutsDossier);

    // Générer les cotisations des 12 derniers mois
    const cotisations = [];
    for (let m = 1; m <= moisCourant; m++) {
      const isPaid   = Math.random() > 0.25;
      const echeance = new Date(annee, m, 5); // le 5 du mois suivant
      cotisations.push({
        _id: new mongoose.Types.ObjectId(),
        annee,
        mois: m,
        montant: 5000 + randInt(0, 2000),
        dateEcheance: echeance,
        datePaiement: isPaid ? new Date(annee, m - 1, randInt(1, 28)) : undefined,
        statut: isPaid ? 'payé' : (echeance < new Date() ? 'en_retard' : 'en_attente'),
        modePaiement: isPaid ? rand(['espèces', 'mobile_money']) : undefined,
        referencePaiement: isPaid ? `REC-${annee}${String(m).padStart(2,'0')}-${String(i).padStart(3,'0')}` : undefined,
      });
    }

    docs.push({
      nif: `MRD${String(annee)}${String(i).padStart(5, '0')}`,
      numeroStat: `6120111${annee}0${String(i).padStart(4, '0')}`,
      statut,
      zone,
      delaiPaiementJours: 30,
      montantCotisationMensuelle: 5000,
      conducteur: {
        nom, prenom,
        telephone: `03${randInt(2,4)}${String(randInt(1000000, 9999999))}`,
        adresse: `Lot ${randInt(1,999)} ${rand(QUARTIERS)}, Morondava`,
        quartier: rand(QUARTIERS),
        dateNaissance: new Date(1970 + randInt(0,30), randInt(0,11), randInt(1,28)),
        lieuNaissance: rand(['Morondava', 'Mahabo', 'Belo-sur-Tsiribihina', 'Antananarivo']),
      },
      carteIdentiteNationale: {
        numero: `${String(randInt(100,999))} ${String(randInt(100,999))} ${String(randInt(100,999))} ${String(randInt(100,999))}`,
        lieuDelivrance: 'Commissariat de Morondava',
        dateDelivrance: new Date(2015, randInt(0,11), randInt(1,28)),
        dateExpiration: new Date(2025, randInt(0,11), randInt(1,28)),
      },
      vehicule: {
        numeroImmatriculation: `${String(i).padStart(3,'0')}-MRD`,
        couleur: rand(['Vert/Jaune', 'Bleu/Blanc', 'Rouge/Blanc', 'Jaune/Noir', 'Blanc/Vert']),
        annee: 2010 + randInt(0, 13),
        etat: rand(['bon','bon','moyen','mauvais']),
      },
      cotisations,
      notes: i % 5 === 0 ? 'Dossier à vérifier' : undefined,
    });
  }

  await CycloPousse.insertMany(docs);
  console.log(`✔ ${docs.length} cyclo-pousses créés pour Morondava`);

  // Afficher un résumé des statuts cotisations
  let totalPayes = 0, totalRetard = 0;
  docs.forEach(d => d.cotisations.forEach(c => {
    if (c.statut === 'payé') totalPayes++;
    if (c.statut === 'en_retard') totalRetard++;
  }));
  console.log(`   → ${totalPayes} cotisations payées, ${totalRetard} en retard`);

  await mongoose.disconnect();
  console.log('\n✅ Seed terminé !');
  console.log('→ Lancez le backend: npm run dev');
  console.log('→ Accédez à: http://localhost:3000');
}

seed().catch(err => { console.error('Erreur seed:', err.message); process.exit(1); });
