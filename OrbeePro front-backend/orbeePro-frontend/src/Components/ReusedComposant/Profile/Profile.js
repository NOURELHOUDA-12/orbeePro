import React, { useState, useEffect } from "react";
import { Edit, Delete, Phone, Email, Person, Lock, ArrowBack, Save, Cancel } from "@mui/icons-material";
import { API_URL, BASE_URL } from "../../../constants.js";
import staffService from "../../../services/staffService.js";
import "./Profile.css";

const UserProfilePage = ({ staff, onBack }) => {
  const [activeTab, setActiveTab] = useState("info");
  const [editData, setEditData] = useState({ ...staff });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    setEditData({ ...staff });
  }, [staff]);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 4000);
  };

  const getRoleBadgeClass = (role) => {
    const roleMap = {
      admin: "badge-admin",
      "chef-maintenance": "badge-chef",
      maintenance: "badge-maintenance",
      menage: "badge-menage",
      receptionniste: "badge-reception",
    };
    return roleMap[role] || "badge-default";
  };

  const getRoleLabel = (role) => {
    const roleLabels = {
      admin: "Administrateur",
      "chef-maintenance": "Chef Maintenance",
      maintenance: "Maintenance",
      menage: "Ménage",
      receptionniste: "Réceptionniste",
    };
    return roleLabels[role] || role;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(editData).forEach(([key, val]) => {
        if (val !== null && val !== undefined) formData.append(key, val);
      });
      if (imageFile) formData.append("profileImage", imageFile);

      const data = await staffService.updateAgent(staff.id, formData);
      if (data.success) {
        showSuccess("Profil mis à jour avec succès !");
        setActiveTab("info");
        setImageFile(null);
      } else {
        showError(data.message || "Erreur lors de la mise à jour.");
      }
    } catch (err) {
      showError("Le serveur ne répond pas.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      showError("Veuillez remplir tous les champs.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      showError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/staff/${staff.id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await response.json();
      if (data.success) {
        showSuccess("Mot de passe mis à jour !");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        showError(data.message || "Erreur lors du changement de mot de passe.");
      }
    } catch {
      showError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${staff.name} ?`)) {
      try {
        const response = await fetch(`${API_URL}/staff/${staff.id}`, { method: "DELETE" });
        const data = await response.json();
        if (data.success) {
          onBack();
        } else {
          showError(data.message);
        }
      } catch {
        showError("Erreur lors de la suppression.");
      }
    }
  };

  const avatarSrc = previewImage
    ? previewImage
    : staff.profileImageUrl
    ? `${BASE_URL}${staff.profileImageUrl}`
    : null;

  const initials = (staff.name || "??")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const tabs = [
    { key: "info", label: "Informations" },
    { key: "edit", label: "Modifier" },
    { key: "activity", label: "Activité" },
    { key: "security", label: "Sécurité" },
  ];

  return (
    <div className="profile-page">
      {/* Back button */}
      <button className="back-btn" onClick={onBack}>
        <ArrowBack fontSize="small" />
        Retour au personnel
      </button>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          <span>⚠️</span> {error}
          <button onClick={() => setError("")}>×</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <span>✓</span> {success}
          <button onClick={() => setSuccess("")}>×</button>
        </div>
      )}

      {/* Header Card */}
      <div className="profile-header-card">
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={staff.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.name)}&size=150&background=185fa5&color=fff`;
                }}
              />
            ) : (
              <span className="avatar-initials">{initials}</span>
            )}
            <label className="avatar-edit-btn" title="Changer la photo">
              <input type="file" accept="image/*" onChange={handleImageChange} hidden />
              <Edit style={{ fontSize: 14 }} />
            </label>
          </div>
        </div>

        

        <div className="profile-header-info">
          <h1 className="profile-name">{staff.name}</h1>
          <p className="profile-sub">{getRoleLabel(staff.role)} · ID #{staff.id}</p>
          <div className="profile-badges">
            <span className={`role-badge ${getRoleBadgeClass(staff.role)}`}>
              {getRoleLabel(staff.role)}
            </span>
            <span className="role-badge badge-active">Actif</span>
          </div>
        </div>

        <div className="profile-header-actions">
          <button className="icon-btn edit-btn" onClick={() => setActiveTab("edit")} title="Modifier">
            <Edit fontSize="small" />
          </button>
          <button className="icon-btn delete-btn" onClick={handleDelete} title="Supprimer">
            <Delete fontSize="small" />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-num blue">142</span>
          <span className="stat-label">Réservations traitées</span>
        </div>
        <div className="stat-card">
          <span className="stat-num green">98%</span>
          <span className="stat-label">Taux de présence</span>
        </div>
        <div className="stat-card">
          <span className="stat-num amber">2 ans</span>
          <span className="stat-label">Ancienneté</span>
        </div>
      </div>

      {/* Tabs Card */}
      <div className="profile-tabs-card">
        <div className="tab-bar">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`tab-btn ${activeTab === t.key ? "active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Informations ── */}
        {activeTab === "info" && (
          <div className="tab-content">
            <div className="info-grid">
              <div className="info-field">
                <span className="info-label">Nom complet</span>
                <span className="info-value">
                  <Person style={{ fontSize: 16, color: "#888" }} />
                  {staff.name}
                </span>
              </div>
              <div className="info-field">
                <span className="info-label">Email</span>
                <span className="info-value">
                  <Email style={{ fontSize: 16, color: "#378ADD" }} />
                  {staff.email}
                </span>
              </div>
              <div className="info-field">
                <span className="info-label">Téléphone</span>
                <span className="info-value">
                  <Phone style={{ fontSize: 16, color: "#1D9E75" }} />
                  {staff.tel || "—"}
                </span>
              </div>
              <div className="info-field">
                <span className="info-label">Rôle</span>
                <span className="info-value">{getRoleLabel(staff.role)}</span>
              </div>
              <div className="info-field">
                <span className="info-label">Spécialité</span>
                <span className="info-value">{staff.specialite || "—"}</span>
              </div>
              <div className="info-field">
                <span className="info-label">Statut</span>
                <span className="info-value">
                  <span className="dot-active" /> Actif
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Modifier ── */}
        {activeTab === "edit" && (
          <div className="tab-content">
            <div className="edit-grid">
              <div className="form-field">
                <label>Nom complet</label>
                <input
                  value={editData.name || ""}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  placeholder="Nom complet"
                />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input
                  type="email"
                  value={editData.email || ""}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  placeholder="Email"
                />
              </div>
              <div className="form-field">
                <label>Téléphone</label>
                <input
                  value={editData.tel || ""}
                  onChange={(e) => setEditData({ ...editData, tel: e.target.value })}
                  placeholder="+216 XX XXX XXX"
                />
              </div>
              <div className="form-field">
                <label>Spécialité</label>
                <input
                  value={editData.specialite || ""}
                  onChange={(e) => setEditData({ ...editData, specialite: e.target.value })}
                  placeholder="Spécialité"
                />
              </div>
              <div className="form-field">
                <label>Rôle</label>
                <select
                  value={editData.role || ""}
                  onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                >
                  <option value="receptionniste">Réceptionniste</option>
                  <option value="admin">Administrateur</option>
                  <option value="chef-maintenance">Chef Maintenance</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="menage">Ménage</option>
                </select>
              </div>
              <div className="form-field">
                <label>Photo de profil</label>
                <div className="file-upload-row">
                  {previewImage && (
                    <img src={previewImage} alt="preview" className="image-preview" />
                  )}
                  <label className="file-upload-btn">
                    Choisir une image
                    <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                  </label>
                  {previewImage && (
                    <button
                      className="file-clear-btn"
                      onClick={() => { setPreviewImage(null); setImageFile(null); }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-cancel" onClick={() => setActiveTab("info")}>
                <Cancel fontSize="small" /> Annuler
              </button>
              <button className="btn-save" onClick={handleUpdate} disabled={loading}>
                <Save fontSize="small" />
                {loading ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        )}

        {/* ── Tab: Activité ── */}
        {activeTab === "activity" && (
          <div className="tab-content">
            <div className="activity-list">
              {[
                { color: "#1D9E75", text: "Connexion depuis Tunis, TN", time: "Aujourd'hui à 08:42" },
                { color: "#378ADD", text: "Réservation #1042 traitée — Chambre 204", time: "Hier à 14:18" },
                { color: "#378ADD", text: "Check-in effectué — M. Ben Salah", time: "Hier à 11:05" },
                { color: "#BA7517", text: "Profil mis à jour", time: "12 avr. à 09:30" },
                { color: "#1D9E75", text: "Connexion depuis Tunis, TN", time: "12 avr. à 07:55" },
                { color: "#E24B4A", text: "Tentative de connexion échouée", time: "10 avr. à 22:10" },
              ].map((item, i) => (
                <div key={i} className="activity-item">
                  <span className="activity-dot" style={{ background: item.color }} />
                  <div className="activity-body">
                    <p className="activity-text">{item.text}</p>
                    <p className="activity-time">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Sécurité ── */}
        {activeTab === "security" && (
          <div className="tab-content">
            <div className="security-section">
              <div className="security-icon-wrap">
                <Lock style={{ fontSize: 32, color: "#185FA5" }} />
              </div>
              <h3 className="security-title">Changer le mot de passe</h3>
            </div>
            <div className="edit-grid single-col">
              <div className="form-field">
                <label>Mot de passe actuel</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Nouveau mot de passe</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
              </div>
            </div>
            <div className="security-hint">
              Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.
            </div>
            <div className="form-actions">
              <button className="btn-save" onClick={handlePasswordChange} disabled={loading}>
                <Lock fontSize="small" />
                {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

};


export default UserProfilePage;