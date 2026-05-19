import { useState } from 'react';
import { Plus, Edit, Trash2, X, Loader, Shield, ShieldCheck } from 'lucide-react';
import { useUsers } from '../hooks/useData';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

function UserModal({ user: existing, onClose, onSuccess }) {
  const [form, setForm] = useState(existing ? {
    nom: existing.nom, prenom: existing.prenom,
    email: existing.email, role: existing.role,
    actif: existing.actif, motDePasse: '',
  } : { nom: '', prenom: '', email: '', role: 'gestionnaire', actif: true, motDePasse: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.motDePasse) delete payload.motDePasse;
      if (existing) {
        await api.put(`/users/${existing._id}`, payload);
        toast.success('Utilisateur mis à jour');
      } else {
        if (!form.motDePasse) { toast.error('Mot de passe requis'); setSaving(false); return; }
        await api.post('/users', payload);
        toast.success('Utilisateur créé');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-hdr">
          <h3>{existing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><X size={14} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="fg2">
              <div className="form-group">
                <label className="label">Nom <span className="req">*</span></label>
                <input className="input" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})}
                  required placeholder="RAKOTO" style={{ textTransform: 'uppercase' }} />
              </div>
              <div className="form-group">
                <label className="label">Prénom <span className="req">*</span></label>
                <input className="input" value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})}
                  required placeholder="Jean" />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="label">Email <span className="req">*</span></label>
                <input className="input" type="email" value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  required placeholder="agent@morondava.mg" />
              </div>
              <div className="form-group">
                <label className="label">Rôle</label>
                <select className="select" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="gestionnaire">Gestionnaire</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Statut</label>
                <select className="select" value={form.actif} onChange={e => setForm({...form, actif: e.target.value === 'true'})}>
                  <option value="true">Actif</option>
                  <option value="false">Désactivé</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="label">
                  Mot de passe {existing ? '(laisser vide = inchangé)' : <span className="req">*</span>}
                </label>
                <input className="input" type="password" value={form.motDePasse}
                  onChange={e => setForm({...form, motDePasse: e.target.value})}
                  placeholder={existing ? 'Nouveau mot de passe...' : 'Minimum 6 caractères'}
                  minLength={form.motDePasse ? 6 : undefined} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving && <Loader size={13} className="spin" />}
              {saving ? 'Sauvegarde...' : existing ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { user: me } = useAuth();
  const { data, loading, refetch } = useUsers();
  const [modal, setModal] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const handleDelete = async (id, nom) => {
    if (!window.confirm(`Supprimer l'utilisateur ${nom} ?`)) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('Utilisateur supprimé');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  return (
    <div className="animate-in">
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Gestion des utilisateurs</h1>
          <p>Agents autorisés à accéder au système</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditUser(null); setModal(true); }}>
          <Plus size={15} /> Nouvel agent
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Agent</th><th>Email</th><th>Rôle</th><th>Statut</th>
              <th>Dernière connexion</th><th style={{ width: 80 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                  <td key={j}><div className="skeleton" style={{ height: 13, width: '70%' }} /></td>
                ))}</tr>
              ))
            ) : data.length === 0 ? (
              <tr><td colSpan={6}><div className="empty"><p>Aucun utilisateur</p></div></td></tr>
            ) : data.map((u) => (
              <tr key={u._id} style={{ opacity: u.actif ? 1 : .5 }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--amber-bg)',
                      border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '.7rem', fontWeight: 700, color: 'var(--amber)', flexShrink: 0 }}>
                      {u.prenom?.[0]}{u.nom?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--snow)', fontSize: '.875rem' }}>
                        {u.prenom} {u.nom}
                        {u._id === me?._id && (
                          <span style={{ fontSize: '.7rem', color: 'var(--muted)', marginLeft: '.375rem' }}>(vous)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '.875rem' }}>{u.email}</td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '.8rem',
                    color: u.role === 'admin' ? 'var(--amber)' : 'var(--info)' }}>
                    {u.role === 'admin' ? <ShieldCheck size={13} /> : <Shield size={13} />}
                    {u.role === 'admin' ? 'Admin' : 'Gestionnaire'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${u.actif ? 'b-actif' : 'b-retard'}`}>
                    {u.actif ? 'Actif' : 'Désactivé'}
                  </span>
                </td>
                <td style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
                  {u.derniereConnexion ? new Date(u.derniereConnexion).toLocaleString('fr-FR') : '—'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '.2rem' }}>
                    <button className="btn btn-ghost btn-sm btn-icon" title="Modifier"
                      onClick={() => { setEditUser(u); setModal(true); }}>
                      <Edit size={13} />
                    </button>
                    {u._id !== me?._id && (
                      <button className="btn btn-ghost btn-sm btn-icon" title="Supprimer"
                        style={{ color: 'var(--err)' }}
                        onClick={() => handleDelete(u._id, `${u.prenom} ${u.nom}`)}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <UserModal
          user={editUser}
          onClose={() => { setModal(false); setEditUser(null); }}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
