import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Loader, ChevronRight, ChevronLeft } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ZONES = ['Centre-ville Morondava','Betania','Nosy Kely','Befasy',
  'Mahabo (route)','Belo-sur-Tsiribihina (route)','Dabara','Ambia','Autre zone'];

const F = ({ label, required, error, hint, children }) => (
  <div className="form-group">
    <label className="label">{label}{required && <span className="req"> *</span>}</label>
    {children}
    {error && <div className="form-err">{error}</div>}
    {hint && <div className="form-hint">{hint}</div>}
  </div>
);

const TABS = [
  { key: 'identification', label: '1. Identification' },
  { key: 'conducteur', label: '2. Conducteur' },
  { key: 'cin', label: '3. Carte CIN' },
  { key: 'vehicule', label: '4. Véhicule' },
];

export default function CycloPousseFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [tab, setTab] = useState('identification');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { statut: 'en_attente_validation', zone: 'Centre-ville Morondava', delaiPaiementJours: 30, montantCotisationMensuelle: 5000 },
  });

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/cyclopousse/${id}`)
      .then(({ data: r }) => {
        const d = r.data;
        reset({
          nif: d.nif, numeroStat: d.numeroStat, statut: d.statut,
          zone: d.zone, delaiPaiementJours: d.delaiPaiementJours,
          montantCotisationMensuelle: d.montantCotisationMensuelle, notes: d.notes,
          'conducteur.nom': d.conducteur?.nom, 'conducteur.prenom': d.conducteur?.prenom,
          'conducteur.telephone': d.conducteur?.telephone, 'conducteur.adresse': d.conducteur?.adresse,
          'conducteur.quartier': d.conducteur?.quartier,
          'conducteur.dateNaissance': d.conducteur?.dateNaissance?.split('T')[0],
          'conducteur.lieuNaissance': d.conducteur?.lieuNaissance,
          'carteIdentiteNationale.numero': d.carteIdentiteNationale?.numero,
          'carteIdentiteNationale.lieuDelivrance': d.carteIdentiteNationale?.lieuDelivrance,
          'carteIdentiteNationale.dateDelivrance': d.carteIdentiteNationale?.dateDelivrance?.split('T')[0],
          'carteIdentiteNationale.dateExpiration': d.carteIdentiteNationale?.dateExpiration?.split('T')[0],
          'vehicule.numeroImmatriculation': d.vehicule?.numeroImmatriculation,
          'vehicule.couleur': d.vehicule?.couleur,
          'vehicule.annee': d.vehicule?.annee,
          'vehicule.etat': d.vehicule?.etat,
          'vehicule.numeroSerie': d.vehicule?.numeroSerie,
        });
      })
      .catch(() => { toast.error('Dossier introuvable'); navigate('/cyclopousses'); })
      .finally(() => setLoadingData(false));
  }, [id, isEdit, reset, navigate]);

  const onSubmit = async (form) => {
    setSaving(true);
    try {
      const payload = {
      nif: form.nif?.toUpperCase(),
      numeroStat: form.numeroStat?.toUpperCase(),
      statut: form.statut,
      zone: form.zone,
      delaiPaiementJours: +form.delaiPaiementJours,
      montantCotisationMensuelle: +form.montantCotisationMensuelle,
      notes: form.notes,
      conducteur: {
        nom: form.conducteur?.nom?.toUpperCase(),
        prenom: form.conducteur?.prenom,
        telephone: form.conducteur?.telephone,
        adresse: form.conducteur?.adresse,
        quartier: form.conducteur?.quartier,
        dateNaissance: form.conducteur?.dateNaissance || undefined,
        lieuNaissance: form.conducteur?.lieuNaissance,
      },
      carteIdentiteNationale: {
        numero: form.carteIdentiteNationale?.numero?.toUpperCase(),
        lieuDelivrance: form.carteIdentiteNationale?.lieuDelivrance,
        dateDelivrance: form.carteIdentiteNationale?.dateDelivrance || undefined,
        dateExpiration: form.carteIdentiteNationale?.dateExpiration || undefined,
      },
      vehicule: {
        numeroImmatriculation: form.vehicule?.numeroImmatriculation?.toUpperCase(),
        couleur: form.vehicule?.couleur,
        annee: form.vehicule?.annee ? +form.vehicule.annee : undefined,
        etat: form.vehicule?.etat,
        numeroSerie: form.vehicule?.numeroSerie,
      },
    };

      if (isEdit) {
        await api.put(`/cyclopousse/${id}`, payload);
        toast.success('Dossier mis à jour');
        navigate(`/cyclopousses/${id}`);
      } else {
        const { data } = await api.post('/cyclopousse', payload);
        toast.success('Dossier créé avec succès');
        navigate(`/cyclopousses/${data.data._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const tabIdx = TABS.findIndex((t) => t.key === tab);
  const isLast = tabIdx === TABS.length - 1;

  if (loadingData) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <Loader size={26} className="spin" color="var(--amber)" />
    </div>
  );

  return (
    <div className="animate-in">
      <div className="page-hdr">
        <div className="page-hdr-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '.375rem' }}>
            <ArrowLeft size={13} /> Retour
          </button>
          <h1>{isEdit ? 'Modifier le dossier' : 'Nouveau dossier cyclo-pousse'}</h1>
          <p>Morondava — {isEdit ? 'Mise à jour des informations' : 'Enregistrement d\'un conducteur'}</p>
        </div>
        <button className="btn btn-primary" onClick={handleSubmit(onSubmit)} disabled={saving}>
          {saving ? <Loader size={14} className="spin" /> : <Save size={14} />}
          {saving ? 'Sauvegarde...' : 'Enregistrer'}
        </button>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: '.25rem', marginBottom: '1.25rem' }}>
        {TABS.map((t, i) => (
          <button key={t.key}
            className={`tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
            style={{ flex: 1, justifyContent: 'center' }}>
            {t.label}
            {i < tabIdx && <span style={{ color: 'var(--ok)', marginLeft: '.25rem', fontSize: '.75rem' }}>✓</span>}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ── Identification ── */}
        {tab === 'identification' && (
          <div className="card">
            <h3 style={{ fontSize: '.8rem', color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '1rem' }}>
              Identification fiscale &amp; administrative
            </h3>
            <div className="fg2">
              <F label="Numéro NIF" required error={errors.nif?.message}
                hint="Numéro d'identification fiscale unique">
                <input className={`input${errors.nif ? ' err' : ''}`}
                  placeholder="Ex. MRD20240001"
                  {...register('nif', { required: 'NIF obligatoire' })}
                  style={{ textTransform: 'uppercase' }} />
              </F>
              <F label="Numéro STAT" required error={errors.numeroStat?.message}>
                <input className={`input${errors.numeroStat ? ' err' : ''}`}
                  placeholder="Ex. 61201112024000001"
                  {...register('numeroStat', { required: 'N° STAT obligatoire' })}
                  style={{ textTransform: 'uppercase' }} />
              </F>
              <F label="Zone de circulation à Morondava">
                <select className="select" {...register('zone')}>
                  {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
              </F>
              <F label="Statut administratif">
                <select className="select" {...register('statut')}>
                  <option value="en_attente_validation">En attente de validation</option>
                  <option value="actif">Actif</option>
                  <option value="suspendu">Suspendu</option>
                  <option value="radié">Radié</option>
                </select>
              </F>
              <F label="Délai paiement cotisation (jours)" hint="Nombre de jours avant mise en retard">
                <input className="input" type="number" min="0" max="365" {...register('delaiPaiementJours')} />
              </F>
              <F label="Montant cotisation mensuelle (MGA)">
                <input className="input" type="number" min="0" {...register('montantCotisationMensuelle')} />
              </F>
              <F label="Notes internes" >
                <textarea className="textarea" rows={2} placeholder="Observations, remarques..."
                  {...register('notes')} style={{ gridColumn: 'span 2' }} />
              </F>
            </div>
          </div>
        )}

        {/* ── Conducteur ── */}
        {tab === 'conducteur' && (
          <div className="card">
            <h3 style={{ fontSize: '.8rem', color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '1rem' }}>
              Informations du conducteur
            </h3>
            <div className="fg2">
              <F label="Nom de famille" required error={errors['conducteur.nom']?.message}>
                <input className={`input${errors['conducteur.nom'] ? ' err' : ''}`}
                  placeholder="RAKOTO"
                  {...register('conducteur.nom', { required: 'Nom obligatoire' })}
                  style={{ textTransform: 'uppercase' }} />
              </F>
              <F label="Prénom" required error={errors['conducteur.prenom']?.message}>
                <input className={`input${errors['conducteur.prenom'] ? ' err' : ''}`}
                  placeholder="Jean"
                  {...register('conducteur.prenom', { required: 'Prénom obligatoire' })} />
              </F>
              <F label="Date de naissance">
                <input className="input" type="date" {...register('conducteur.dateNaissance')} />
              </F>
              <F label="Lieu de naissance">
                <input className="input" placeholder="Ex. Morondava" {...register('conducteur.lieuNaissance')} />
              </F>
              <F label="Téléphone" hint="Format: 034 XX XXX XX">
                <input className="input" placeholder="034 12 345 67" {...register('conducteur.telephone')} />
              </F>
              <F label="Quartier (Morondava)">
                <input className="input" placeholder="Ex. Ankiembe, Tanambao..." {...register('conducteur.quartier')} />
              </F>
              <F label="Adresse complète">
                <textarea className="textarea" rows={2}
                  placeholder="Lot XX, Quartier, Morondava..."
                  {...register('conducteur.adresse')} />
              </F>
            </div>
          </div>
        )}

        {/* ── CIN ── */}
        {tab === 'cin' && (
          <div className="card">
            <h3 style={{ fontSize: '.8rem', color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '1rem' }}>
              Carte d'identité nationale
            </h3>
            <div className="fg2">
              <F label="Numéro CIN" required error={errors['carteIdentiteNationale.numero']?.message}
                hint="Ex : 101 234 567 890">
                <input className={`input${errors['carteIdentiteNationale.numero'] ? ' err' : ''}`}
                  placeholder="101 234 567 890"
                  {...register('carteIdentiteNationale.numero', { required: 'N° CIN obligatoire' })}
                  style={{ fontFamily: 'monospace', letterSpacing: '.05em' }} />
              </F>
              <F label="Lieu de délivrance">
                <input className="input" placeholder="Ex. Commissariat de Morondava"
                  {...register('carteIdentiteNationale.lieuDelivrance')} />
              </F>
              <F label="Date de délivrance">
                <input className="input" type="date" {...register('carteIdentiteNationale.dateDelivrance')} />
              </F>
              <F label="Date d'expiration">
                <input className="input" type="date" {...register('carteIdentiteNationale.dateExpiration')} />
              </F>
            </div>
          </div>
        )}

        {/* ── Véhicule ── */}
        {tab === 'vehicule' && (
          <div className="card">
            <h3 style={{ fontSize: '.8rem', color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '1rem' }}>
              Informations du véhicule
            </h3>
            <div className="fg2">
              <F label="Numéro d'immatriculation">
                <input className="input" placeholder="Ex. 001-MRD"
                  {...register('vehicule.numeroImmatriculation')}
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace' }} />
              </F>
              <F label="Numéro de série">
                <input className="input" placeholder="N° de série châssis"
                  {...register('vehicule.numeroSerie')} />
              </F>
              <F label="Couleur">
                <input className="input" placeholder="Ex. Vert/Jaune" {...register('vehicule.couleur')} />
              </F>
              <F label="Année de fabrication">
                <input className="input" type="number" min="1990" max={new Date().getFullYear()}
                  {...register('vehicule.annee')} />
              </F>
              <F label="État du véhicule">
                <select className="select" {...register('vehicule.etat')}>
                  <option value="bon">Bon état</option>
                  <option value="moyen">État moyen</option>
                  <option value="mauvais">Mauvais état</option>
                  <option value="hors_service">Hors service</option>
                </select>
              </F>
            </div>
          </div>
        )}

        {/* Navigation bas */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
          <button type="button" className="btn btn-secondary"
            disabled={tabIdx === 0}
            onClick={() => setTab(TABS[tabIdx - 1].key)}>
            <ChevronLeft size={14} /> Précédent
          </button>
          {isLast ? (
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader size={14} className="spin" /> : <Save size={14} />}
              {saving ? 'Sauvegarde...' : 'Enregistrer le dossier'}
            </button>
          ) : (
            <button type="button" className="btn btn-secondary"
              onClick={() => setTab(TABS[tabIdx + 1].key)}>
              Suivant <ChevronRight size={14} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
