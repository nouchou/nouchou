import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, Bike, QrCode, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ZONES = ['','Centre-ville Morondava','Betania','Nosy Kely','Befasy','Mahabo (route)','Belo-sur-Tsiribihina (route)','Dabara','Ambia','Autre zone'];
const STATUT_LABELS = { actif:'Actif', suspendu:'Suspendu', radié:'Radié', en_attente_validation:'En attente' };
const BADGE_CLASS   = { actif:'b-actif', suspendu:'b-suspendu', radié:'b-radie', en_attente_validation:'b-attente' };

// ── QR Modal — BUG FIX: useEffect au lieu de useState ──────────
function QRModal({ id, nif, onClose }) {
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {  // ← CORRECTION: useEffect, pas useState
    api.get(`/cyclopousse/${id}/qrcode`)
      .then(({ data }) => setQr(data.data))
      .catch(() => toast.error('Erreur génération QR'))
      .finally(() => setLoading(false));
  }, [id]);

  const download = () => {
    const a = document.createElement('a');
    a.href = qr.qrDataURL;
    a.download = `qr-${nif || id}.png`;
    a.click();
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:340 }}>
        <div className="modal-hdr">
          <h3>QR Code — {nif}</h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ textAlign:'center',padding:'1.5rem' }}>
          {loading ? (
            <div style={{ padding:'2rem',color:'var(--muted)' }}>
              <div style={{ width:32,height:32,border:'3px solid var(--amber)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto .75rem' }} />
              Génération du QR Code...
            </div>
          ) : qr ? (
            <>
              <img src={qr.qrDataURL} alt="QR" style={{ width:200,height:200,borderRadius:12,border:'1px solid var(--border)' }} />
              <p style={{ fontSize:'.75rem',color:'var(--muted)',marginTop:'.75rem',wordBreak:'break-all',lineHeight:1.4 }}>
                {qr.url}
              </p>
              <p style={{ fontSize:'.75rem',color:'var(--soft)',marginTop:'.375rem' }}>
                Scannez pour vérifier les cotisations (accès public)
              </p>
            </>
          ) : (
            <p style={{ color:'var(--err)' }}>Erreur de génération</p>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Fermer</button>
          {qr && (
            <button className="btn btn-primary btn-sm" onClick={download}>
              <Download size={13} /> Télécharger
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CycloPousseListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // États
  const [data, setData]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [limit]                   = useState(20); // 20 par page
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]       = useState('');
  const [statut, setStatut]       = useState('');
  const [zone, setZone]           = useState('');
  const [qrTarget, setQrTarget]   = useState(null); // { id, nif }

  // BUG FIX: fetch direct avec useEffect — plus fiable que le hook abstrait
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (statut) params.statut = statut;
      if (zone)   params.zone   = zone;
      if (search && search.length >= 2) params.search = search;

      const { data: res } = await api.get('/cyclopousse', { params });
      setData(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (err) {
      toast.error('Erreur de chargement');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statut, zone, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const resetFiltres = () => {
    setSearch(''); setSearchInput('');
    setStatut(''); setZone(''); setPage(1);
  };

  const handleDelete = useCallback(async (id, nif) => {
    if (!window.confirm(`Supprimer le dossier NIF: ${nif} ?\nCette action est irréversible.`)) return;
    try {
      await api.delete(`/cyclopousse/${id}`);
      toast.success('Dossier supprimé');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de suppression');
    }
  }, [fetchData]);

  const canEdit = user?.role === 'admin' || user?.role === 'gestionnaire';
  const debut   = (page - 1) * limit + 1;
  const fin     = Math.min(page * limit, total);

  return (
    <div className="animate-in">
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Cyclo-pousses</h1>
          <p>
            {loading ? 'Chargement...' : `${total} dossier${total !== 1 ? 's' : ''} au total — page ${page}/${pages}`}
          </p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => navigate('/cyclopousses/nouveau')}>
            <Plus size={15} /> Nouveau dossier
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="card card-sm" style={{ marginBottom:'1rem' }}>
        <div style={{ display:'flex',gap:'.625rem',flexWrap:'wrap',alignItems:'center' }}>
          <form onSubmit={handleSearch} style={{ flex:'1 1 220px',minWidth:180 }}>
            <div className="search-bar">
              <Search size={14} color="var(--muted)" />
              <input placeholder="NIF, STAT, nom, CIN, immat..." value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)} />
              {searchInput && (
                <button type="button" className="btn btn-ghost btn-sm" style={{ padding:'0 2px' }}
                  onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}>×</button>
              )}
            </div>
          </form>

          <select className="select" style={{ flex:'0 0 145px' }} value={statut}
            onChange={(e) => { setStatut(e.target.value); setPage(1); }}>
            <option value="">Tous les statuts</option>
            {Object.entries(STATUT_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>

          <select className="select" style={{ flex:'0 0 185px' }} value={zone}
            onChange={(e) => { setZone(e.target.value); setPage(1); }}>
            <option value="">Toutes les zones</option>
            {ZONES.slice(1).map((z) => <option key={z} value={z}>{z}</option>)}
          </select>

          <button className="btn btn-secondary btn-sm" type="button" onClick={handleSearch}>
            <Search size={13} /> Rechercher
          </button>

          {(search || statut || zone) && (
            <button className="btn btn-ghost btn-sm" onClick={resetFiltres}>Réinitialiser</button>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div className="card" style={{ padding:0,overflow:'hidden' }}>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>NIF</th>
                <th>Conducteur</th>
                <th>N° STAT</th>
                <th>Zone</th>
                <th>Immat.</th>
                <th>Statut</th>
                <th>Enregistré le</th>
                <th style={{ width:115 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height:13,width:j===7?85:'75%' }} /></td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty">
                    <Bike size={36} />
                    <p>
                      {search || statut || zone
                        ? 'Aucun résultat pour ces filtres — essayez de les modifier'
                        : 'Aucun cyclo-pousse enregistré'}
                    </p>
                    {(search || statut || zone) && (
                      <button className="btn btn-secondary btn-sm" style={{ marginTop:'.75rem' }} onClick={resetFiltres}>
                        Effacer les filtres
                      </button>
                    )}
                  </div>
                </td></tr>
              ) : (
                data.map((cp) => (
                  <tr key={cp._id}>
                    <td>
                      <span style={{ fontFamily:'monospace',fontSize:'.8125rem',color:'var(--amber)',letterSpacing:'.04em' }}>
                        {cp.nif}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight:500,color:'var(--snow)' }}>
                        {cp.conducteur?.prenom} {cp.conducteur?.nom}
                      </div>
                      {cp.conducteur?.telephone && (
                        <div style={{ fontSize:'.75rem',color:'var(--muted)' }}>{cp.conducteur.telephone}</div>
                      )}
                    </td>
                    <td style={{ fontFamily:'monospace',fontSize:'.8rem' }}>{cp.numeroStat}</td>
                    <td style={{ fontSize:'.8125rem' }}>{cp.zone || '—'}</td>
                    <td style={{ fontFamily:'monospace',fontSize:'.8rem' }}>
                      {cp.vehicule?.numeroImmatriculation || '—'}
                    </td>
                    <td>
                      <span className={`badge ${BADGE_CLASS[cp.statut] || ''}`}>
                        {STATUT_LABELS[cp.statut] || cp.statut}
                      </span>
                    </td>
                    <td style={{ fontSize:'.8rem',color:'var(--muted)' }}>
                      {new Date(cp.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td>
                      <div style={{ display:'flex',gap:'.2rem' }}>
                        <button className="btn btn-ghost btn-sm btn-icon" title="Voir la fiche"
                          onClick={() => navigate(`/cyclopousses/${cp._id}`)}>
                          <Eye size={13} />
                        </button>
                        <button className="btn btn-ghost btn-sm btn-icon" title="QR Code"
                          style={{ color:'var(--info)' }}
                          onClick={() => setQrTarget({ id: cp._id, nif: cp.nif })}>
                          <QrCode size={13} />
                        </button>
                        {canEdit && (
                          <button className="btn btn-ghost btn-sm btn-icon" title="Modifier"
                            onClick={() => navigate(`/cyclopousses/${cp._id}/modifier`)}>
                            <Edit size={13} />
                          </button>
                        )}
                        {user?.role === 'admin' && (
                          <button className="btn btn-ghost btn-sm btn-icon" title="Supprimer"
                            style={{ color:'var(--err)' }}
                            onClick={() => handleDelete(cp._id, cp.nif)}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination améliorée */}
        {!loading && total > 0 && (
          <div style={{ padding:'.875rem 1.25rem',borderTop:'1px solid var(--border)' }}>
            <div className="pagi">
              <span style={{ fontSize:'.8125rem',color:'var(--soft)' }}>
                {debut}–{fin} sur <strong style={{ color:'var(--pale)' }}>{total}</strong> dossiers
              </span>
              <div className="pagi-btns">
                <button className="pbtn" disabled={page === 1} onClick={() => setPage(1)} title="Première page">«</button>
                <button className="pbtn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft size={13} />
                </button>
                {/* Pages numérotées intelligentes */}
                {(() => {
                  const range = [];
                  const delta = 2;
                  for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
                    range.push(i);
                  }
                  return range.map(p => (
                    <button key={p} className={`pbtn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                  ));
                })()}
                <button className="pbtn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight size={13} />
                </button>
                <button className="pbtn" disabled={page === pages} onClick={() => setPage(pages)} title="Dernière page">»</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {qrTarget && (
        <QRModal id={qrTarget.id} nif={qrTarget.nif} onClose={() => setQrTarget(null)} />
      )}
    </div>
  );
}
