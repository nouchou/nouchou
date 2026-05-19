import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Bike, CreditCard, Users, Settings, LogOut, ShieldCheck, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navConfig = [
  { to: '/', icon: LayoutDashboard, label: 'Tableau de bord', section: 'menu' },
  { to: '/cyclopousses', icon: Bike, label: 'Cyclo-pousses', section: 'menu' },
  { to: '/cotisations', icon: CreditCard, label: 'Cotisations', section: 'menu' },
  { to: '/utilisateurs', icon: Users, label: 'Utilisateurs', section: 'admin', role: 'admin' },
  { to: '/journal', icon: Activity, label: 'Journal activités', section: 'admin', role: 'admin' },
  { to: '/parametres', icon: Settings, label: 'Paramètres', section: 'systeme', role: 'admin' },
];

const sectionLabels = { menu: 'Navigation', admin: 'Administration', systeme: 'Système' };

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Déconnecté');
    navigate('/login');
  };

  const items = navConfig.filter((i) => !i.role || i.role === user?.role);
  const sections = [...new Set(items.map((i) => i.section))];

  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <div className="sb-logo-icon">
          <Bike size={18} color="#0d1117" strokeWidth={2.5} />
        </div>
        <div>
          <div className="sb-logo-name">Cyclo-Pousse</div>
          <div className="sb-logo-city">Ville de Morondava</div>
        </div>
      </div>

      <nav className="sb-nav">
        {sections.map((sec) => (
          <div className="sb-section" key={sec}>
            <div className="sb-section-label">{sectionLabels[sec]}</div>
            {items.filter((i) => i.section === sec).map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sb-footer">
        <div className="sb-user">
          <div className="sb-avatar">{user?.prenom?.[0]}{user?.nom?.[0]}</div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '.8rem', fontWeight: 500, color: 'var(--pale)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.prenom} {user?.nom}
            </div>
            <div style={{ fontSize: '.7rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <ShieldCheck size={10} /> {user?.role}
            </div>
          </div>
        </div>
        <button className="nav-link" onClick={handleLogout} style={{ color: 'var(--err)' }}>
          <LogOut size={14} /> Déconnexion
        </button>
      </div>
    </aside>
  );
}
