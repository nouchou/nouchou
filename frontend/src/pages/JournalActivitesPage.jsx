import { useState, useEffect, useCallback } from 'react';
import { Activity, Filter, User, Clock, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import api from '../utils/api';
import { useUsers } from '../hooks/useData';

const ACTION_LABELS = {
  connexion:               { label: 'Connexion',              color: 'var(--ok)' },
  deconnexion:             { label: 'Déconnexion',            color: 'var(--muted)' },
  creation_cyclopousse:    { label: 'Création dossier',       color: 'var(--amber)' },
  modification_cyclopousse:{ label: 'Modification dossier',   color: 'var(--info)' },
  suppression_cyclopousse: { label: 'Suppression dossier',    color: 'var(--err)' },
  ajout_cotisation:        { label: 'Ajout cotisation',       color: 'var(--ok)' },
  modification_cotisation: { label: 'Modif. cotisation',      color: 'var(--info)' },
  suppression_cotisation:  { label: 'Suppression cotisation', color: 'var(--err)' },
  creation_utilisateur:    { label: 'Création utilisateur',   color: 'var(--amber)' },
  modification_utilisateur:{ label: 'Modif. utilisateur',     color: 'var(--info)' },
  suppression_utilisateur: { label: 'Suppression utilisateur',color: 'var(--err)' },
  generation_qr:           { label: 'QR Code généré',         color: 'var(--soft)' },
  consultation:            { label: 'Consultation',           color: 'var(--muted)' },
};

function ActionBadge({ action }) {
  const info = ACTION_LABELS[action] || { label: action, color: 'var(--muted)' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '.15rem .5rem',
      borderRadius: 4,
      fontSize: '.7rem',
      fontWeight: 500,
      background: `${info.color}18`,
      color: info.color,
      border: `1px solid ${info.color}30`,
      whiteSpace: 'nowrap',
    }}>
      {info.label}
    </span>
  );
}

function fmtDateHeure(dateStr) {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    heure: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

export default function JournalActivitesPage() {
  const { data: users } = useUsers();

  const [activites, setActivites]   = useState([]);
  const [total, setTotal]           = useState(0);
  const [pages, setPages]           = useState(1);
  const [loading, setLoading]       = useState(true);
  const [resume, setResume]         = useState(null);

  // Filtres
  const [page, setPage]             = useState(1);
  const [userId, setUserId]         = useState('');
  const [action, setAction]         = useState('');
  const [dateDebut, setDateDebut]   = useState('');
  const [dateFin, setDateFin]       = useState('');

  const fetchActivites = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30 };
      if (userId)    params.userId    = userId;
      if (action)    params.action    = action;
      if (dateDebut) params.dateDebut = dateDebut;
      if (dateFin)   params.dateFin   = dateFin;

      const { data: res } = await api.get('/activites', { params });
      setActivites(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch {
      setActivites([]);
    } finally {
      setLoading(false);
    }
  }, [page, userId, action, dateDebut, dateFin]);

  const fetchResume = useCallback(async () => {
    try {
      const { data: res } = await api.get('/activites/resume');
      setResume(res.data);
    } catch {}
  }, []);

  useEffect(() => { fetchActivites(); }, [fetchActivites]);
  useEffect(() => { fetchResume(); }, [fetchResume]);

  const resetFiltres = () => {
    setUserId(''); setAction(''); setDateDebut(''); setDateFin(''); setPage(1);
  };

  return (
    <div className="animate-in">
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Journal des activités</h1>
          <p>Toutes les actions effectuées par les agents — {total} entrée{total > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* ── Résumé 7 jours ── */}
      {resume && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '.75rem', marginBottom: '1.25rem' }}>
          <div className="stat-card c-amber">
            <div className="stat-label">Activités (24h)</div>
            <div className="stat-val">{resume.par24h}</div>
            <div className="stat-sub">actions enregistrées</div>
          </div>
          <div className="stat-card c-info">
            <div className="stat-label">Activités (7 jours)</div>
            <div className="stat-val">{resume.par7j}</div>
            <div className="stat-sub">sur la semaine</div>
          </div>
          {resume.parUtilisateur?.slice(0, 3).map((u) => (
            <div className="stat-card" key={u._id}>
              <div className="stat-label">Agent le + actif</div>
              <div style={{ fontWeight: 600, color: 'var(--snow)', fontSize: '.9rem', marginTop: '.25rem' }}>
                {u.user?.prenom} {u.user?.nom}
              </div>
              <div className="stat-sub">{u.count} actions (7j)</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filtres ── */}
      <div className="card card-sm" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '.625rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.375rem', color: 'var(--muted)', fontSize: '.8125rem' }}>
            <Filter size={13} /> Filtres :
          </div>

          <select className="select" style={{ flex: '0 0 180px' }} value={userId}
            onChange={(e) => { setUserId(e.target.value); setPage(1); }}>
            <option value="">Tous les agents</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>{u.prenom} {u.nom}</option>
            ))}
          </select>

          <select className="select" style={{ flex: '0 0 180px' }} value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}>
            <option value="">Toutes les actions</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <input className="input" type="date" style={{ flex: '0 0 140px' }} value={dateDebut}
            onChange={(e) => { setDateDebut(e.target.value); setPage(1); }}
            placeholder="Date début" />
          <span style={{ color: 'var(--muted)', fontSize: '.8rem' }}>→</span>
          <input className="input" type="date" style={{ flex: '0 0 140px' }} value={dateFin}
            onChange={(e) => { setDateFin(e.target.value); setPage(1); }}
            placeholder="Date fin" />

          {(userId || action || dateDebut || dateFin) && (
            <button className="btn btn-ghost btn-sm" onClick={resetFiltres}>
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* ── Tableau activités ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 90 }}>Date</th>
                <th style={{ width: 70 }}>Heure</th>
                <th>Agent</th>
                <th>Rôle</th>
                <th>Action</th>
                <th>Description</th>
                <th style={{ width: 70 }}>Résultat</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 13, width: '80%' }} /></td>
                    ))}
                  </tr>
                ))
              ) : activites.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty">
                    <Activity size={32} />
                    <p>Aucune activité enregistrée pour ces filtres</p>
                  </div>
                </td></tr>
              ) : (
                activites.map((act) => {
                  const { date, heure } = fmtDateHeure(act.createdAt);
                  return (
                    <tr key={act._id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '.8rem', color: 'var(--pale)', whiteSpace: 'nowrap' }}>
                        {date}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '.8rem', color: 'var(--amber)', whiteSpace: 'nowrap' }}>
                        {heure}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.375rem' }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%',
                            background: 'var(--amber-bg)', border: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '.6rem', fontWeight: 700, color: 'var(--amber)', flexShrink: 0,
                          }}>
                            {act.utilisateur?.prenom?.[0]}{act.utilisateur?.nom?.[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, color: 'var(--snow)', fontSize: '.875rem', whiteSpace: 'nowrap' }}>
                              {act.utilisateur?.prenom} {act.utilisateur?.nom}
                            </div>
                            <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>
                              {act.utilisateur?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '.75rem', color: act.utilisateur?.role === 'admin' ? 'var(--amber)' : 'var(--info)', textTransform: 'capitalize' }}>
                          {act.utilisateur?.role || '—'}
                        </span>
                      </td>
                      <td>
                        <ActionBadge action={act.action} />
                      </td>
                      <td style={{ fontSize: '.8rem', color: 'var(--pale)', maxWidth: 320 }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={act.description}>
                          {act.description || '—'}
                        </span>
                        {act.cible?.label && (
                          <span style={{ fontSize: '.7rem', fontFamily: 'monospace', color: 'var(--muted)' }}>
                            {act.cible.label}
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{
                          fontSize: '.7rem', fontWeight: 600,
                          color: act.resultat === 'succès' ? 'var(--ok)' : 'var(--err)',
                        }}>
                          {act.resultat === 'succès' ? '✓' : '✗'} {act.resultat}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && total > 0 && (
          <div style={{ padding: '.875rem 1.25rem', borderTop: '1px solid var(--border)' }}>
            <div className="pagi">
              <span style={{ fontSize: '.8125rem', color: 'var(--soft)' }}>
                Page {page}/{pages} — {total} activité{total > 1 ? 's' : ''}
              </span>
              <div className="pagi-btns">
                <button className="pbtn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                <button className="pbtn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft size={13} />
                </button>
                {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                  const p = Math.max(1, Math.min(pages - 4, page - 2)) + i;
                  return <button key={p} className={`pbtn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>;
                })}
                <button className="pbtn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight size={13} />
                </button>
                <button className="pbtn" disabled={page === pages} onClick={() => setPage(pages)}>»</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
