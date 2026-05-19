import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Plus, Trash2, Check, AlertTriangle, Clock, Loader, Bike, QrCode, Download, X } from 'lucide-react';
import { useCycloPousse } from '../hooks/useData';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const BADGE_CLASS = { actif:'b-actif', suspendu:'b-suspendu', radié:'b-radie', en_attente_validation:'b-attente' };
const STATUT_LABELS = { actif:'Actif', suspendu:'Suspendu', radié:'Radié', en_attente_validation:'En attente' };
const fmt = (d) => d ? format(new Date(d), 'd MMM yyyy', { locale: fr }) : '—';
const fmtMGA = (v) => v ? new Intl.NumberFormat('fr-MG').format(v) + ' MGA' : '—';

function InfoRow({ label, value, mono }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="info-row">
      <span className="info-key">{label}</span>
      <span className="info-val" style={{ fontFamily: mono ? 'monospace' : undefined }}>{value}</span>
    </div>
  );
}

function CotisationModal({ cycloId, existing, onClose, onSuccess }) {
  const [form, setForm] = useState(existing ? {
    annee: existing.annee, mois: existing.mois, montant: existing.montant,
    statut: existing.statut, modePaiement: existing.modePaiement || 'espèces',
    referencePaiement: existing.referencePaiement || '', remarques: existing.remarques || '',
    dateEcheance: existing.dateEcheance?.split('T')[0] || '',
  } : {
    annee: new Date().getFullYear(), mois: new Date().getMonth() + 1,
    montant: 5000, statut: 'payé', modePaiement: 'espèces',
    referencePaiement: '', remarques: '',
    dateEcheance: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5).toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        annee: +form.annee, mois: +form.mois, montant: +form.montant,
        datePaiement: form.statut === 'payé' ? new Date().toISOString() : undefined,
      };
      if (existing) {
        await api.put(`/cyclopousse/${cycloId}/cotisations/${existing._id}`, payload);
        toast.success('Cotisation mise à jour');
      } else {
        await api.post(`/cyclopousse/${cycloId}/cotisations`, payload);
        toast.success('Cotisation enregistrée');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-hdr">
          <h3>{existing ? 'Modifier la cotisation' : 'Nouvelle cotisation'}</h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><X size={14} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="fg2">
              <div className="form-group">
                <label className="label">Année <span className="req">*</span></label>
                <input className="input" type="number" min="2000" max="2099"
                  value={form.annee} onChange={e => setForm({...form, annee: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="label">Mois <span className="req">*</span></label>
                <select className="select" value={form.mois} onChange={e => setForm({...form, mois: e.target.value})}>
                  {MOIS.map((m, i) => <option key={i} value={i+1}>{m} — {i+1}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Montant (MGA) <span className="req">*</span></label>
                <input className="input" type="number" min="0" value={form.montant}
                  onChange={e => setForm({...form, montant: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="label">Date d'échéance <span className="req">*</span></label>
                <input className="input" type="date" value={form.dateEcheance}
                  onChange={e => setForm({...form, dateEcheance: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="label">Statut</label>
                <select className="select" value={form.statut} onChange={e => setForm({...form, statut: e.target.value})}>
                  <option value="payé">Payé</option>
                  <option value="en_attente">En attente</option>
                  <option value="en_retard">En retard</option>
                  <option value="exonéré">Exonéré</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Mode de paiement</label>
                <select className="select" value={form.modePaiement} onChange={e => setForm({...form, modePaiement: e.target.value})}>
                  <option value="espèces">Espèces</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="virement">Virement</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="label">Référence / N° reçu</label>
                <input className="input" placeholder="REC-2024-001" value={form.referencePaiement}
                  onChange={e => setForm({...form, referencePaiement: e.target.value})} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="label">Remarques</label>
                <textarea className="textarea" rows={2} value={form.remarques}
                  onChange={e => setForm({...form, remarques: e.target.value})} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader size={13} className="spin" /> : <Check size={13} />}
              {saving ? 'Sauvegarde...' : 'Confirmer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CycloPousseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, refetch } = useCycloPousse(id);
  const [tab, setTab] = useState('apercu');
  const [cotisModal, setCotisModal] = useState(false);
  const [editCotis, setEditCotis] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);

  const canEdit = user?.role === 'admin' || user?.role === 'gestionnaire';

  const loadQR = async () => {
    if (qrData) return;
    setLoadingQr(true);
    try {
      const { data: r } = await api.get(`/cyclopousse/${id}/qrcode`);
      setQrData(r.data);
    } catch { toast.error('Erreur QR'); }
    finally { setLoadingQr(false); }
  };

  const handleDeleteCotis = async (cid) => {
    if (!window.confirm('Supprimer cette cotisation ?')) return;
    try {
      await api.delete(`/cyclopousse/${id}/cotisations/${cid}`);
      toast.success('Cotisation supprimée');
      refetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <Loader size={26} className="spin" color="var(--amber)" />
    </div>
  );
  if (!data) return null;

  const cotisTriees = [...(data.cotisations || [])].sort((a, b) => b.annee - a.annee || b.mois - a.mois);

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="page-hdr">
        <div style={{ display: 'flex', alignItems: 'center', gap: '.875rem', flex: 1, minWidth: 0 }}>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate('/cyclopousses')}>
            <ArrowLeft size={15} />
          </button>
          <div style={{ width: 42, height: 42, borderRadius: 'var(--r-lg)', background: 'var(--amber-bg)',
            border: '1px solid rgba(240,165,0,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bike size={18} color="var(--amber)" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: '1.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {data.conducteur?.prenom} {data.conducteur?.nom}
            </h1>
            <div style={{ display: 'flex', gap: '.375rem', alignItems: 'center', marginTop: '.2rem', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '.75rem', color: 'var(--amber)',
                background: 'var(--amber-bg)', padding: '2px 7px', borderRadius: 4 }}>
                NIF: {data.nif}
              </span>
              <span className={`badge ${BADGE_CLASS[data.statut] || ''}`}>
                {STATUT_LABELS[data.statut]}
              </span>
              {data.cotisationsEnRetard > 0 && (
                <span className="badge b-retard">
                  <AlertTriangle size={10} /> {data.cotisationsEnRetard} retard{data.cotisationsEnRetard > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { setTab('qr'); loadQR(); }}>
            <QrCode size={13} /> QR Code
          </button>
          {canEdit && (
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/cyclopousses/${id}/modifier`)}>
              <Edit size={13} /> Modifier
            </button>
          )}
        </div>
      </div>

      <div className="tabs">
        {[['apercu','Aperçu'],['cin','CIN'],['vehicule','Véhicule'],
          ['cotisations',`Cotisations (${cotisTriees.length})`],['qr','QR Code']].map(([k,l]) => (
          <button key={k} className={`tab${tab===k?' active':''}`}
            onClick={() => { setTab(k); if (k==='qr') loadQR(); }}>{l}</button>
        ))}
      </div>

      {/* ── Aperçu ── */}
      {tab === 'apercu' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.875rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '.75rem', color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.875rem' }}>Identification</h3>
            <InfoRow label="NIF" value={data.nif} mono />
            <InfoRow label="N° STAT" value={data.numeroStat} mono />
            <InfoRow label="Zone" value={data.zone} />
            <InfoRow label="Cotisation mensuelle" value={fmtMGA(data.montantCotisationMensuelle)} />
            <InfoRow label="Délai paiement" value={`${data.delaiPaiementJours} jours`} />
            <InfoRow label="Enregistré le" value={fmt(data.createdAt)} />
            {data.notes && (
              <div style={{ marginTop: '.75rem', padding: '.625rem .75rem', background: 'var(--ink-3)',
                borderRadius: 'var(--r)', fontSize: '.8rem', color: 'var(--soft)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--pale)', display: 'block', marginBottom: '.25rem' }}>Notes</strong>
                {data.notes}
              </div>
            )}
          </div>
          <div className="card">
            <h3 style={{ fontSize: '.75rem', color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.875rem' }}>Conducteur</h3>
            <InfoRow label="Nom complet" value={`${data.conducteur?.prenom} ${data.conducteur?.nom}`} />
            <InfoRow label="Date de naissance" value={fmt(data.conducteur?.dateNaissance)} />
            <InfoRow label="Lieu de naissance" value={data.conducteur?.lieuNaissance} />
            <InfoRow label="Quartier" value={data.conducteur?.quartier} />
            <InfoRow label="Téléphone" value={data.conducteur?.telephone} />
            <InfoRow label="Adresse" value={data.conducteur?.adresse} />
          </div>
        </div>
      )}

      {/* ── CIN ── */}
      {tab === 'cin' && (
        <div className="card" style={{ maxWidth: 480 }}>
          <h3 style={{ fontSize: '.75rem', color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.875rem' }}>Carte d'identité nationale</h3>
          <InfoRow label="Numéro CIN" value={data.carteIdentiteNationale?.numero} mono />
          <InfoRow label="Lieu de délivrance" value={data.carteIdentiteNationale?.lieuDelivrance} />
          <InfoRow label="Date de délivrance" value={fmt(data.carteIdentiteNationale?.dateDelivrance)} />
          <InfoRow label="Date d'expiration" value={fmt(data.carteIdentiteNationale?.dateExpiration)} />
        </div>
      )}

      {/* ── Véhicule ── */}
      {tab === 'vehicule' && (
        <div className="card" style={{ maxWidth: 480 }}>
          <h3 style={{ fontSize: '.75rem', color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.875rem' }}>Véhicule</h3>
          <InfoRow label="N° immatriculation" value={data.vehicule?.numeroImmatriculation} mono />
          <InfoRow label="N° de série" value={data.vehicule?.numeroSerie} mono />
          <InfoRow label="Couleur" value={data.vehicule?.couleur} />
          <InfoRow label="Année" value={data.vehicule?.annee} />
          <InfoRow label="État" value={data.vehicule?.etat} />
        </div>
      )}

      {/* ── Cotisations ── */}
      {tab === 'cotisations' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '.875rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
            <h3>Historique des cotisations</h3>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={() => { setEditCotis(null); setCotisModal(true); }}>
                <Plus size={13} /> Ajouter
              </button>
            )}
          </div>
          {cotisTriees.length === 0 ? (
            <div className="empty"><Clock size={32} /><p>Aucune cotisation enregistrée</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Période</th><th>Statut</th><th>Montant</th>
                  <th>Paiement</th><th>Échéance</th><th>Mode</th><th>Réf.</th>
                  {canEdit && <th style={{ width: 70 }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {cotisTriees.map((c) => (
                  <tr key={c._id}>
                    <td style={{ fontWeight: 500, color: 'var(--snow)' }}>{MOIS[c.mois-1]} {c.annee}</td>
                    <td>
                      <span className={`badge b-${c.statut === 'payé' ? 'paye' : c.statut === 'en_retard' ? 'retard' : c.statut === 'exonéré' ? 'exonere' : 'en_attente'}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        {c.statut === 'payé' && <Check size={10} />}
                        {c.statut === 'en_retard' && <AlertTriangle size={10} />}
                        {c.statut}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '.875rem' }}>
                      {fmtMGA(c.montant)}
                    </td>
                    <td style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
                      {c.datePaiement ? format(new Date(c.datePaiement), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td style={{ fontSize: '.8rem', color: c.statut === 'en_retard' ? 'var(--err)' : 'var(--muted)' }}>
                      {c.dateEcheance ? format(new Date(c.dateEcheance), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td style={{ fontSize: '.8rem' }}>{c.modePaiement || '—'}</td>
                    <td style={{ fontSize: '.75rem', fontFamily: 'monospace', color: 'var(--muted)' }}>
                      {c.referencePaiement || '—'}
                    </td>
                    {canEdit && (
                      <td>
                        <div style={{ display: 'flex', gap: '.2rem' }}>
                          <button className="btn btn-ghost btn-sm btn-icon" title="Modifier"
                            onClick={() => { setEditCotis(c); setCotisModal(true); }}>
                            <Edit size={12} />
                          </button>
                          {user?.role === 'admin' && (
                            <button className="btn btn-ghost btn-sm btn-icon" title="Supprimer"
                              style={{ color: 'var(--err)' }} onClick={() => handleDeleteCotis(c._id)}>
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── QR Code ── */}
      {tab === 'qr' && (
        <div className="card" style={{ maxWidth: 400, textAlign: 'center' }}>
          <h3 style={{ marginBottom: '.5rem' }}>QR Code de vérification publique</h3>
          <p style={{ fontSize: '.8rem', marginBottom: '1.25rem' }}>
            Permettez aux agents et au public de vérifier le statut des cotisations sans connexion
          </p>
          {loadingQr && <div style={{ padding: '2rem', color: 'var(--muted)' }}><Loader size={22} className="spin" color="var(--amber)" /></div>}
          {qrData && (
            <>
              <img src={qrData.qrDataURL} alt="QR" style={{ width: 220, height: 220, borderRadius: 12,
                border: '1px solid var(--border)', margin: '0 auto .875rem' }} />
              <div style={{ fontSize: '.75rem', color: 'var(--muted)', wordBreak: 'break-all',
                background: 'var(--ink-3)', borderRadius: 'var(--r)', padding: '.5rem .75rem', marginBottom: '.875rem' }}>
                {qrData.url}
              </div>
              <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center' }}>
                <button className="btn btn-primary btn-sm" onClick={() => {
                  const a = document.createElement('a');
                  a.href = qrData.qrDataURL;
                  a.download = `qr-${data.nif}.png`;
                  a.click();
                }}>
                  <Download size={13} /> Télécharger PNG
                </button>
                <a href={`/verifier/${data.tokenQR}`} target="_blank" rel="noreferrer"
                  className="btn btn-secondary btn-sm">
                  Tester la page publique ↗
                </a>
              </div>
            </>
          )}
        </div>
      )}

      {cotisModal && (
        <CotisationModal
          cycloId={id}
          existing={editCotis}
          onClose={() => { setCotisModal(false); setEditCotis(null); }}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
