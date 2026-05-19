import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, AreaChart, Area } from 'recharts';
import { Bike, TrendingUp, AlertTriangle, Banknote, Clock, RefreshCw, Calendar, ArrowUp, ArrowDown, Bell, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const COLORS_ZONE = ['#f0a500','#58a6ff','#3fb950','#f85149','#d29922','#bc8cff'];
const fmtMGA = (v) => new Intl.NumberFormat('fr-MG').format(Math.round(v)) + ' MGA';
const fmtMGAk = (v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(Math.round(v));

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--ink-2)',border:'1px solid var(--border)',borderRadius:8,padding:'.5rem .75rem',fontSize:'.8rem' }}>
      <div style={{ color:'var(--pale)',marginBottom:'.25rem',fontWeight:500 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--snow)' }}>{p.name}: {typeof p.value === 'number' ? fmtMGA(p.value) : p.value}</div>
      ))}
    </div>
  );
};

function StatCard({ label, value, sub, color, icon: Icon, trend, trendLabel }) {
  const trendPositif = trend > 0;
  return (
    <div className={`stat-card c-${color}`} style={{ position:'relative' }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'.5rem' }}>
        <div className="stat-label">{label}</div>
        {Icon && <Icon size={14} color={`var(--${color === 'amber' ? 'amber' : color === 'ok' ? 'ok' : color === 'err' ? 'err' : color === 'info' ? 'info' : 'warn'})`} />}
      </div>
      <div className="stat-val" style={{ color: color === 'amber' ? 'var(--amber)' : color === 'ok' ? 'var(--ok)' : color === 'err' ? 'var(--err)' : color === 'info' ? 'var(--info)' : 'var(--warn)' }}>
        {value ?? '—'}
      </div>
      <div style={{ display:'flex',alignItems:'center',gap:'.375rem',marginTop:'.375rem',flexWrap:'wrap' }}>
        <div className="stat-sub">{sub}</div>
        {trend !== null && trend !== undefined && (
          <span style={{ display:'inline-flex',alignItems:'center',gap:2,fontSize:'.7rem',fontWeight:600,
            color: trendPositif ? 'var(--ok)' : trend < 0 ? 'var(--err)' : 'var(--muted)' }}>
            {trendPositif ? <ArrowUp size={10} /> : trend < 0 ? <ArrowDown size={10} /> : null}
            {trend > 0 ? '+' : ''}{trend}% {trendLabel || 'vs an dernier'}
          </span>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    api.get('/cyclopousse/stats')
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStats(); }, []);

  // Préparer les données graphiques
  const recettesData = stats
    ? [...(stats.recettesMensuelles || [])].reverse().map((r) => ({
        name: `${MOIS[r._id.mois - 1]} ${r._id.annee}`,
        Recettes: r.total,
        Cotisations: r.count,
      }))
    : [];

  const inscriptionsData = stats
    ? [...(stats.inscriptionsMensuelles || [])].reverse().map((r) => ({
        name: `${MOIS[r._id.mois - 1]} ${r._id.annee}`,
        Inscriptions: r.count,
      }))
    : [];

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Bonjour' : now.getHours() < 18 ? 'Bon après-midi' : 'Bonsoir';

  if (loading) return (
    <div>
      <div className="page-hdr"><div className="page-hdr-left"><h1>Tableau de bord</h1></div></div>
      <div className="stat-grid">{[1,2,3,4,5,6].map(i => (
        <div className="stat-card" key={i}>
          <div className="skeleton" style={{ height:11,width:'55%',marginBottom:10 }} />
          <div className="skeleton" style={{ height:30,width:'40%' }} />
        </div>
      ))}</div>
    </div>
  );

  return (
    <div className="animate-in">
      {/* ── En-tête personnalisé ── */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>{greeting}, {user?.prenom} {user?.nom} 👋</h1>
          <p>
            {now.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })} —
            Mairie de Morondava
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchStats}>
          <RefreshCw size={13} /> Actualiser
        </button>
      </div>

      {/* ── Alertes prioritaires ── */}
      {stats?.alerteFinAnnee && (
        <div className="alert alert-warn" style={{ marginBottom:'1rem' }}>
          <Bell size={16} style={{ flexShrink:0 }} />
          <div>
            <strong>Rappel de fin d'année — {stats.joursRestantsAnnee} jours restants</strong>
            <span style={{ fontSize:'.8rem',opacity:.85,marginLeft:'.5rem' }}>
              Pensez à régulariser les cotisations et à préparer le bilan annuel {stats.anneeCourante}
            </span>
          </div>
        </div>
      )}

      {stats?.enRetard > 0 && (
        <div className="alert alert-err" style={{ marginBottom:'1rem' }}>
          <AlertTriangle size={16} style={{ flexShrink:0 }} />
          <div>
            <strong>{stats.enRetard} conducteur(s) en retard de cotisation</strong>
            <span style={{ fontSize:'.8rem',opacity:.85,marginLeft:'.5rem' }}>
              — paiements en souffrance à régulariser
            </span>
          </div>
          <a href="/cyclopousses" className="btn btn-sm btn-danger" style={{ marginLeft:'auto',flexShrink:0 }}>
            Voir les dossiers
          </a>
        </div>
      )}

      {stats?.enAttente > 0 && (
        <div className="alert alert-info" style={{ marginBottom:'1rem' }}>
          <Clock size={16} style={{ flexShrink:0 }} />
          <strong>{stats.enAttente} dossier(s) en attente de validation</strong>
          <a href="/cyclopousses?statut=en_attente_validation" className="btn btn-sm btn-secondary" style={{ marginLeft:'auto',flexShrink:0 }}>
            Valider
          </a>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="stat-grid" style={{ gridTemplateColumns:'repeat(auto-fit,minmax(165px,1fr))' }}>
        <StatCard
          label="Total enregistrés" value={stats?.total}
          sub={`${stats?.inscriptionsAnnee ?? 0} nouveaux en ${stats?.anneeCourante}`}
          color="amber" icon={Bike}
          trend={stats?.croissanceInscriptions}
        />
        <StatCard
          label="Dossiers actifs" value={stats?.actifs}
          sub={`${stats?.total ? Math.round((stats.actifs / stats.total) * 100) : 0}% du parc`}
          color="ok" icon={TrendingUp}
        />
        <StatCard
          label="Recettes aujourd'hui" value={fmtMGA(stats?.recettesJour || 0)}
          sub={`${stats?.recettesJourCount ?? 0} paiement(s) reçu(s)`}
          color="amber" icon={Banknote}
        />
        <StatCard
          label={`Recettes ${stats?.anneeCourante}`} value={fmtMGA(stats?.recettesAnnee || 0)}
          sub={`${stats?.recettesAnneeCount ?? 0} cotisations payées`}
          color="ok" icon={Star}
          trend={stats?.croissanceRecettes}
        />
        <StatCard
          label="En retard" value={stats?.enRetard}
          sub="Cotisations impayées" color="err" icon={AlertTriangle}
        />
        <StatCard
          label="En attente validation" value={stats?.enAttente}
          sub="Dossiers à examiner" color="info" icon={Clock}
        />
      </div>

      {/* ── Recettes année précédente vs courante ── */}
      {(stats?.recettesAnneePrecedente > 0 || stats?.recettesAnnee > 0) && (
        <div className="card" style={{ marginBottom:'1rem' }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'.75rem' }}>
            <div>
              <div style={{ fontSize:'.7rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'.25rem' }}>
                Comparaison annuelle des recettes
              </div>
              <div style={{ display:'flex',gap:'2rem',alignItems:'baseline' }}>
                <div>
                  <div style={{ fontSize:'1.75rem',fontFamily:'Syne',fontWeight:800,color:'var(--amber)' }}>
                    {fmtMGA(stats?.recettesAnnee || 0)}
                  </div>
                  <div style={{ fontSize:'.75rem',color:'var(--muted)' }}>
                    {stats?.anneeCourante} (en cours)
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:'1.125rem',fontFamily:'Syne',fontWeight:600,color:'var(--soft)' }}>
                    {fmtMGA(stats?.recettesAnneePrecedente || 0)}
                  </div>
                  <div style={{ fontSize:'.75rem',color:'var(--muted)' }}>
                    {(stats?.anneeCourante || 2024) - 1}
                  </div>
                </div>
              </div>
            </div>
            {stats?.croissanceRecettes !== null && stats?.croissanceRecettes !== undefined && (
              <div style={{ textAlign:'center',padding:'.75rem 1.25rem',background: stats.croissanceRecettes >= 0 ? 'var(--ok-bg)' : 'var(--err-bg)',
                borderRadius:'var(--r-xl)',border:`1px solid ${stats.croissanceRecettes >= 0 ? 'rgba(63,185,80,.25)' : 'rgba(248,81,73,.25)'}` }}>
                <div style={{ fontSize:'1.5rem',fontFamily:'Syne',fontWeight:800,color: stats.croissanceRecettes >= 0 ? 'var(--ok)' : 'var(--err)',display:'flex',alignItems:'center',gap:4 }}>
                  {stats.croissanceRecettes >= 0 ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
                  {Math.abs(stats.croissanceRecettes)}%
                </div>
                <div style={{ fontSize:'.75rem',color:'var(--muted)' }}>évolution annuelle</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Graphiques ── */}
      <div style={{ display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:'1rem',marginBottom:'1rem' }}>
        {/* Recettes mensuelles */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize:'.875rem' }}>Recettes — 12 derniers mois</h3>
            <Banknote size={14} color="var(--amber)" />
          </div>
          {recettesData.length ? (
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={recettesData} margin={{ top:4,right:0,bottom:0,left:0 }}>
                <defs>
                  <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f0a500" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f0a500" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill:'var(--muted)',fontSize:10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill:'var(--muted)',fontSize:10 }} tickLine={false} axisLine={false} tickFormatter={fmtMGAk} />
                <Tooltip content={<Tip />} cursor={{ stroke:'var(--border)',strokeWidth:1 }} />
                <Area type="monotone" dataKey="Recettes" stroke="#f0a500" strokeWidth={2} fill="url(#recGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="empty"><p>Aucune donnée</p></div>}
        </div>

        {/* Nouvelles inscriptions */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize:'.875rem' }}>Nouveaux enregistrements</h3>
            <Bike size={14} color="var(--info)" />
          </div>
          {inscriptionsData.length ? (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={inscriptionsData} margin={{ top:4,right:0,bottom:0,left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill:'var(--muted)',fontSize:10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill:'var(--muted)',fontSize:10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<Tip />} cursor={{ fill:'rgba(255,255,255,.03)' }} />
                <Bar dataKey="Inscriptions" fill="var(--info)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty"><p>Aucune donnée</p></div>}
        </div>
      </div>

      {/* ── Répartition zones ── */}
      {stats?.parZone?.length > 0 && (
        <div className="card" style={{ marginBottom:'1rem' }}>
          <div className="card-header">
            <h3 style={{ fontSize:'.875rem' }}>Répartition par zone — Morondava</h3>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:'.5rem' }}>
            {stats.parZone.map((z, i) => (
              <div key={z._id} style={{ display:'flex',alignItems:'center',gap:'.75rem' }}>
                <div style={{ width:110,fontSize:'.8rem',color:'var(--pale)',flexShrink:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
                  {z._id}
                </div>
                <div style={{ flex:1,height:8,background:'var(--ink-3)',borderRadius:4,overflow:'hidden' }}>
                  <div style={{
                    height:'100%',
                    width:`${Math.round((z.count / (stats.total || 1)) * 100)}%`,
                    background: COLORS_ZONE[i % COLORS_ZONE.length],
                    borderRadius:4,
                    transition:'width .6s ease',
                  }} />
                </div>
                <div style={{ width:36,textAlign:'right',fontSize:'.8rem',fontWeight:600,color:'var(--snow)',flexShrink:0 }}>
                  {z.count}
                </div>
                <div style={{ width:32,textAlign:'right',fontSize:'.7rem',color:'var(--muted)',flexShrink:0 }}>
                  {stats.total ? Math.round((z.count / stats.total) * 100) : 0}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Rappel fin d'année détaillé ── */}
      {stats?.alerteFinAnnee && (
        <div style={{ background:'linear-gradient(135deg,rgba(240,165,0,.08),rgba(240,165,0,.03))',border:'1px solid rgba(240,165,0,.25)',borderRadius:'var(--r-xl)',padding:'1.25rem',marginBottom:'1rem' }}>
          <div style={{ display:'flex',alignItems:'center',gap:'.625rem',marginBottom:'.75rem' }}>
            <Calendar size={18} color="var(--amber)" />
            <strong style={{ color:'var(--amber)',fontFamily:'Syne' }}>
              Clôture de l'année {stats.anneeCourante} — {stats.joursRestantsAnnee} jours restants
            </strong>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'.75rem',fontSize:'.8125rem',color:'var(--pale)' }}>
            <div style={{ display:'flex',gap:'.5rem',alignItems:'flex-start' }}>
              <span style={{ color:'var(--amber)',marginTop:2 }}>•</span>
              <span>Régulariser les <strong style={{ color:'var(--snow)' }}>{stats.enRetard} cotisation(s) en retard</strong> avant le 31 décembre</span>
            </div>
            <div style={{ display:'flex',gap:'.5rem',alignItems:'flex-start' }}>
              <span style={{ color:'var(--amber)',marginTop:2 }}>•</span>
              <span>Valider les <strong style={{ color:'var(--snow)' }}>{stats.enAttente} dossier(s)</strong> en attente de validation</span>
            </div>
            <div style={{ display:'flex',gap:'.5rem',alignItems:'flex-start' }}>
              <span style={{ color:'var(--amber)',marginTop:2 }}>•</span>
              <span>Total recettes {stats.anneeCourante} : <strong style={{ color:'var(--snow)' }}>{fmtMGA(stats.recettesAnnee || 0)}</strong></span>
            </div>
            <div style={{ display:'flex',gap:'.5rem',alignItems:'flex-start' }}>
              <span style={{ color:'var(--amber)',marginTop:2 }}>•</span>
              <span>Parc total : <strong style={{ color:'var(--snow)' }}>{stats.total}</strong> cyclo-pousses enregistrés</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
