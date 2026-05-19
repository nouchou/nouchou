import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bike, Eye, EyeOff, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, pwd);
      toast.success('Bienvenue !');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--ink)', padding: '1rem',
      backgroundImage: 'radial-gradient(ellipse at 60% 20%, rgba(240,165,0,.06) 0%, transparent 60%)',
    }}>
      {/* Grid décoratif */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '48px 48px', opacity: .2, pointerEvents: 'none',
      }} />

      <div className="animate-in" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, background: 'var(--amber)', borderRadius: 'var(--r-xl)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
          }}>
            <Bike size={28} color="#0d1117" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.625rem', marginBottom: '.25rem' }}>Cyclo-Pousse</h1>
          <p style={{ color: 'var(--muted)', fontSize: '.875rem' }}>
            Mairie de Morondava — Gestion des licences
          </p>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.125rem', marginBottom: '.25rem' }}>Connexion agent</h2>
          <p style={{ fontSize: '.8125rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>
            Accès réservé au personnel municipal
          </p>

          {error && (
            <div className="alert alert-err" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Adresse e-mail</label>
              <input className="input" type="email" placeholder="agent@morondava.mg"
                value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>

            <div className="form-group">
              <label className="label">Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: '.625rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', marginTop: '.5rem' }}>
              {loading && <Loader size={14} className="spin" />}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '.75rem', color: 'var(--muted)', marginTop: '1.25rem' }}>
          Système sécurisé — Mairie de Morondava
        </p>
      </div>
    </div>
  );
}
