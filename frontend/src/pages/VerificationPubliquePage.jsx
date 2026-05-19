import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, Bike, Calendar, MapPin, CreditCard, Clock, Shield } from 'lucide-react';
import axios from 'axios';

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : null;
const fmtMGA = (v) => new Intl.NumberFormat('fr-MG').format(v) + ' MGA';

function CotisCell({ c }) {
  const cls = c.statut === 'payé' ? 'cotis-paye'
    : c.statut === 'en_retard' ? 'cotis-retard'
    : c.statut === 'exonéré' ? 'cotis-paye'
    : 'cotis-attente';
  return (
    <div className={`cotis-cell ${cls}`} title={`${MOIS[c.mois-1]} ${c.annee} — ${c.statut}`}>
      <span>{MOIS[c.mois - 1]}</span>
      <span style={{ fontSize: '.55rem', opacity: .8 }}>{c.annee}</span>
    </div>
  );
}

export default function VerificationPubliquePage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`/api/public/verifier/${token}`)
      .then(({ data: r }) => setData(r.data))
      .catch((err) => setError(err.response?.data?.message || 'QR Code invalide ou expiré'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="qr-page">
      <div className="qr-topbar">
        <div style={{ width: 28, height: 28, background: 'var(--amber)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bike size={16} color="#0d1117" />
        </div>
        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '.9rem' }}>Cyclo-Pousse Morondava</span>
      </div>
      <div className="qr-body" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <div style={{ color: 'var(--muted)', textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--amber)',
            borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p>Vérification en cours...</p>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="qr-page">
      <div className="qr-topbar">
        <div style={{ width: 28, height: 28, background: 'var(--amber)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bike size={16} color="#0d1117" />
        </div>
        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '.9rem' }}>Cyclo-Pousse Morondava</span>
      </div>
      <div className="qr-body">
        <div className="qr-status-err">
          <XCircle size={48} color="var(--err)" style={{ margin: '0 auto 1rem', display: 'block' }} />
          <h2 style={{ fontSize: '1.25rem', marginBottom: '.5rem', color: 'var(--err)' }}>
            QR Code invalide
          </h2>
          <p style={{ fontSize: '.875rem', color: 'var(--soft)' }}>{error}</p>
        </div>
        <div style={{ textAlign: 'center', fontSize: '.8rem', color: 'var(--muted)' }}>
          <Shield size={14} style={{ display: 'inline', marginRight: 4 }} />
          Système de vérification officiel — Mairie de Morondava
        </div>
      </div>
    </div>
  );

  const aJour = data.estAJour;
  const enRetard = data.nbCotisationsEnRetard > 0;
  const moisCourantOk = data.cotisationMoisCourant?.statut === 'payé';
  const moisCourantRetard = data.cotisationMoisCourant?.statut === 'en_retard';
  const moisCourantAttente = data.cotisationMoisCourant?.statut === 'en_attente';
  const actif = data.statut === 'actif';

  return (
    <div className="qr-page">
      {/* Topbar */}
      <div className="qr-topbar">
        <div style={{ width: 28, height: 28, background: 'var(--amber)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bike size={16} color="#0d1117" />
        </div>
        <div>
          <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '.875rem' }}>Cyclo-Pousse Morondava</div>
          <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>Vérification officielle</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '.75rem', color: 'var(--muted)' }}>
          {new Date().toLocaleString('fr-FR')}
        </div>
      </div>

      <div className="qr-body animate-in">
        {/* ── Statut global ── */}
        <div className={
          !actif ? 'qr-status-err'
          : aJour ? 'qr-status-ok'
          : enRetard ? 'qr-status-err'
          : 'qr-status-warn'
        }>
          {!actif ? (
            <>
              <XCircle size={52} color="var(--err)" style={{ display: 'block', margin: '0 auto .75rem' }} />
              <h2 style={{ fontSize: '1.375rem', color: 'var(--err)', marginBottom: '.375rem' }}>
                Dossier {data.statut}
              </h2>
              <p style={{ fontSize: '.875rem', color: 'var(--soft)' }}>
                Ce cyclo-pousse n'est pas en règle (statut: {data.statut})
              </p>
            </>
          ) : aJour ? (
            <>
              <CheckCircle size={52} color="var(--ok)" style={{ display: 'block', margin: '0 auto .75rem' }} />
              <h2 style={{ fontSize: '1.375rem', color: 'var(--ok)', marginBottom: '.375rem' }}>
                À jour — En règle
              </h2>
              <p style={{ fontSize: '.875rem', color: 'var(--soft)' }}>
                Toutes les cotisations sont payées et le dossier est actif
              </p>
            </>
          ) : enRetard ? (
            <>
              <XCircle size={52} color="var(--err)" style={{ display: 'block', margin: '0 auto .75rem' }} />
              <h2 style={{ fontSize: '1.375rem', color: 'var(--err)', marginBottom: '.375rem' }}>
                {data.nbCotisationsEnRetard} cotisation(s) en retard
              </h2>
              <p style={{ fontSize: '.875rem', color: 'var(--soft)' }}>
                Ce conducteur a des cotisations impayées
              </p>
            </>
          ) : (
            <>
              <AlertTriangle size={52} color="var(--warn)" style={{ display: 'block', margin: '0 auto .75rem' }} />
              <h2 style={{ fontSize: '1.375rem', color: 'var(--warn)', marginBottom: '.375rem' }}>
                Cotisation en attente
              </h2>
              <p style={{ fontSize: '.875rem', color: 'var(--soft)' }}>
                Le paiement du mois courant n'a pas encore été confirmé
              </p>
            </>
          )}
        </div>

        {/* ── Mois courant ── */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.625rem', marginBottom: '.875rem' }}>
            <Calendar size={16} color="var(--amber)" />
            <h3 style={{ fontSize: '.875rem' }}>
              Cotisation — {MOIS[new Date().getMonth()]} {new Date().getFullYear()}
            </h3>
          </div>
          {data.cotisationMoisCourant ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem' }}>
              <div>
                <span className={`badge ${moisCourantOk ? 'b-paye' : moisCourantRetard ? 'b-retard' : 'b-en_attente'}`}
                  style={{ fontSize: '.8rem', padding: '.3rem .625rem' }}>
                  {moisCourantOk && <CheckCircle size={12} />}
                  {moisCourantRetard && <XCircle size={12} />}
                  {moisCourantAttente && <Clock size={12} />}
                  {data.cotisationMoisCourant.statut}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--snow)' }}>
                  {fmtMGA(data.cotisationMoisCourant.montant)}
                </div>
                {data.cotisationMoisCourant.datePaiement && (
                  <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>
                    Payé le {fmtDate(data.cotisationMoisCourant.datePaiement)}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '.875rem', color: 'var(--muted)' }}>
              Aucun paiement enregistré ce mois
            </div>
          )}
        </div>

        {/* ── Infos conducteur ── */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.625rem', marginBottom: '.875rem' }}>
            <Bike size={16} color="var(--amber)" />
            <h3 style={{ fontSize: '.875rem' }}>Informations du conducteur</h3>
          </div>
          <div className="info-row">
            <span className="info-key">Conducteur</span>
            <span className="info-val" style={{ fontWeight: 600 }}>
              {data.conducteur?.prenom} {data.conducteur?.nom}
            </span>
          </div>
          <div className="info-row">
            <span className="info-key">NIF</span>
            <span className="info-val" style={{ fontFamily: 'monospace', color: 'var(--amber)' }}>{data.nif}</span>
          </div>
          <div className="info-row">
            <span className="info-key">N° STAT</span>
            <span className="info-val" style={{ fontFamily: 'monospace' }}>{data.numeroStat}</span>
          </div>
          <div className="info-row">
            <span className="info-key"><MapPin size={12} style={{ display: 'inline', marginRight: 3 }} />Zone</span>
            <span className="info-val">{data.zone}</span>
          </div>
          {data.conducteur?.quartier && (
            <div className="info-row">
              <span className="info-key">Quartier</span>
              <span className="info-val">{data.conducteur.quartier}</span>
            </div>
          )}
          <div className="info-row">
            <span className="info-key">Immatriculation</span>
            <span className="info-val" style={{ fontFamily: 'monospace' }}>
              {data.vehicule?.numeroImmatriculation || '—'}
            </span>
          </div>
          <div className="info-row">
            <span className="info-key">Couleur véhicule</span>
            <span className="info-val">{data.vehicule?.couleur || '—'}</span>
          </div>
          <div className="info-row" style={{ borderBottom: 'none' }}>
            <span className="info-key">Enregistré depuis</span>
            <span className="info-val">{fmtDate(data.enregistreDepuis)}</span>
          </div>
        </div>

        {/* ── Grille cotisations 12 derniers mois ── */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.625rem', marginBottom: '.875rem' }}>
            <CreditCard size={16} color="var(--amber)" />
            <h3 style={{ fontSize: '.875rem' }}>12 dernières cotisations</h3>
          </div>
          <div className="cotis-grid">
            {data.dernieres12Cotisations.map((c) => (
              <CotisCell key={`${c.annee}-${c.mois}`} c={c} />
            ))}
            {data.dernieres12Cotisations.length === 0 && (
              <div style={{ gridColumn: 'span 6', textAlign: 'center', color: 'var(--muted)', fontSize: '.8rem', padding: '.75rem' }}>
                Aucune cotisation enregistrée
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '.5rem', marginTop: '.875rem', flexWrap: 'wrap' }}>
            {[['cotis-paye','Payé'],['cotis-retard','En retard'],['cotis-attente','En attente']].map(([cls, lbl]) => (
              <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: '.25rem', fontSize: '.7rem', color: 'var(--soft)' }}>
                <div className={`cotis-cell ${cls}`} style={{ width: 14, height: 14, borderRadius: 3, fontSize: 0 }} />
                {lbl}
              </div>
            ))}
          </div>
        </div>

        {/* ── Récapitulatif ── */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontFamily: 'Syne', fontWeight: 800, color: 'var(--ok)' }}>
                {fmtMGA(data.totalCotisationsPaye)}
              </div>
              <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>Total cotisations payées</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontFamily: 'Syne', fontWeight: 800,
                color: data.nbCotisationsEnRetard > 0 ? 'var(--err)' : 'var(--ok)' }}>
                {data.nbCotisationsEnRetard}
              </div>
              <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>Cotisation(s) en retard</div>
            </div>
          </div>
        </div>

        {/* Footer officiel */}
        <div style={{ textAlign: 'center', fontSize: '.75rem', color: 'var(--muted)', padding: '1rem 0 2rem',
          borderTop: '1px solid var(--border)', marginTop: '.5rem' }}>
          <Shield size={14} style={{ display: 'inline', marginRight: 5 }} />
          Document de vérification officiel — Mairie de Morondava
          <br />
          <span style={{ fontSize: '.7rem', opacity: .7 }}>
            Ce document ne constitue pas un titre de paiement. Vérification effectuée le {new Date().toLocaleString('fr-FR')}
          </span>
        </div>
      </div>
    </div>
  );
}
