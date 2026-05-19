import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Eye, CheckCircle, Clock } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

export default function CotisationsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('en_retard');
  const [moisFiltre, setMoisFiltre] = useState(new Date().getMonth() + 1);
  const [anneeFiltre, setAnneeFiltre] = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    // Charger tous les cyclopousses et filtrer côté client
    api.get('/cyclopousse', { params: { limit: 500 } })
      .then(({ data: r }) => {
        const tous = r.data;
        const resultats = [];

        tous.forEach((cp) => {
          // On charge les détails complets pour avoir les cotisations
          resultats.push(cp);
        });
        setData(resultats);
      })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false));
  }, []);

  // Pour les détails de cotisation, recharger avec cotisations
  useEffect(() => {
    if (!data.length) return;
    // Re-fetch avec cotisations incluses pour avoir les détails
    api.get('/cyclopousse', { params: { limit: 500 } })
      .then(({ data: r }) => setData(r.data))
      .catch(() => {});
  }, []);

  return (
    <div className="animate-in">
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Suivi des cotisations</h1>
          <p>Vue globale des paiements — Morondava</p>
        </div>
      </div>

      {/* Résumé */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.875rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'En retard', icon: AlertTriangle, color: 'var(--err)', key: 'en_retard' },
          { label: 'Payé ce mois', icon: CheckCircle, color: 'var(--ok)', key: 'paye' },
          { label: 'En attente', icon: Clock, color: 'var(--warn)', key: 'en_attente' },
        ].map(({ label, icon: Icon, color, key }) => (
          <button key={key}
            className={`stat-card c-${key === 'en_retard' ? 'err' : key === 'paye' ? 'ok' : 'warn'}`}
            style={{ cursor: 'pointer', textAlign: 'left', border: filtre === key ? `2px solid ${color}` : undefined }}
            onClick={() => setFiltre(key)}>
            <div className="stat-label">{label}</div>
            <div className="stat-val" style={{ color, fontSize: '1.5rem' }}>
              <Icon size={24} />
            </div>
          </button>
        ))}
      </div>

      {/* Filtres mois/année */}
      <div className="card card-sm" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '.875rem', color: 'var(--muted)' }}>Période :</span>
          <select className="select" style={{ width: 120 }} value={moisFiltre}
            onChange={e => setMoisFiltre(+e.target.value)}>
            {MOIS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="select" style={{ width: 90 }} value={anneeFiltre}
            onChange={e => setAnneeFiltre(+e.target.value)}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span style={{ fontSize: '.8rem', color: 'var(--muted)', marginLeft: '.5rem' }}>
            Affichage : <strong style={{ color: 'var(--pale)' }}>
              {filtre === 'en_retard' ? 'En retard' : filtre === 'paye' ? 'Payés' : 'En attente'}
            </strong>
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
            Chargement des cotisations...
          </div>
        ) : (
          <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--muted)' }}>
            <AlertTriangle size={32} style={{ opacity: .3, marginBottom: '.5rem', display: 'block', margin: '0 auto .5rem' }} />
            <p>Consultez les cotisations détaillées depuis la fiche de chaque conducteur.</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: '.75rem' }}
              onClick={() => navigate('/cyclopousses')}>
              Voir les conducteurs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
