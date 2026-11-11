import React, { useState, useEffect, useMemo } from "react";
import "./StaffPage.css";
import EditStaffModal from "./EditStaffModal";
import AddStaffModal from "./AddStaffModal";
import { Edit, Delete, Phone, Email, Person } from "@mui/icons-material";
import { API_URL ,BASE_URL} from "../../../../constants.js";
import staffService from "../../../../services/staffService.js";

const StaffPage = () => {
      
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [viewMode, setViewMode] = useState("grid");

const fetchStaff = async () => {
  setLoading(true);
  try {

    const data = await staffService.getAgents(); 
    
    if (data && data.success) {
      setStaffList(data.data);
      
      console.log("📊 Données reçues:", data);
      if (data.data.length > 0) {
        console.log("🖼️ Image URL:", data.data[0].profileImageUrl);
      }
    } else {
      setError("Impossible de charger la liste du personnel.");
    }
  } catch (err) {
    setError("Erreur de connexion au serveur.");
    console.error("Erreur fetchStaff:", err);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchStaff();
  }, []);



  // Ajouter un membre

const handleAdd = async (newStaff) => {
  setError('');
  setSuccess('');

  try {
    const data = await staffService.AddStaff(newStaff);

    if (data.success) {
      setSuccess(data.message);
      setIsAddModalOpen(false);
      fetchStaff();
    } else {
      setError(data.message);
    }
  } catch (err) {
    setError(err.message || "Une erreur est survenue lors de la communication.");
  }
};


const handleUpdate = async (staffData) => {
  try {
    
    const data = await staffService.updateAgent(staffData.id, staffData);

    if (data.success) {
      setSuccess("Agent mis à jour avec succès !");
      setIsEditModalOpen(false);
      
      
      fetchStaff(); 
      
      // Optionnel : Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(data.message || "Erreur lors de la mise à jour.");
    }
  } catch (err) {
    setError("Le serveur ne répond pas.");
    console.error("Update Error:", err);
  }
};

  // Supprimer un membre
  const handleDelete = async (staffId, staffName) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${staffName} ?`)) {
      try {
        const response = await fetch(`${API_URL}/staff/${staffId}`, {
          method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
          setSuccess(data.message);
          fetchStaff();
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError("Erreur lors de la suppression.");
      }
    }
  };

  const openEditModal = (staff) => {
    setSelectedStaff(staff);
    setIsEditModalOpen(true);
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
    const roleLabels =
     {
      admin: "Administrateur",
      "chef-maintenance": "Chef Maintenance",
      maintenance: "Maintenance",
      menage: "Ménage",
      receptionniste: "Réceptionniste",
    };
    return roleLabels[role] || role;
  };

  const filteredStaff = useMemo(
    () =>
      staffList.filter(
        (staff) =>
          (staff.nom || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (staff.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (staff.role || "").toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [staffList, searchTerm]
  );

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const currentItems = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const nextPage = () =>
    setCurrentPage((current) => Math.min(current + 1, totalPages));
  const prevPage = () => setCurrentPage((current) => Math.max(current - 1, 1));

  if (loading)
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Chargement du personnel...</p>
      </div>
    );

  return (
    <div className="staff-page-modern">
      <div className="page-header">
        <div className="header-content">
        
          <p className="header-subtitle">
            {filteredStaff.length} membre{filteredStaff.length > 1 ? "s" : ""} du personnel
          </p>
        </div>
        <button
          className="add-btn-modern"
          onClick={() => setIsAddModalOpen(true)}
        >
          <span className="btn-icon">+</span>
          Ajouter un membre
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
          <button className="alert-close" onClick={() => setError("")}>×</button>
        </div>
      )}
 

 
      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          {success}
          <button className="alert-close" onClick={() => setSuccess("")}>×</button>
        </div>
      )}

      <div className="controls-bar">
        <div className="search-container">
          <input
            type="text"
            placeholder="Rechercher par nom, email ou rôle..."
            className="search-input-modern"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
          >
            ▦ Grille
          </button>
          <button
            className={`toggle-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
          >
            ☰ Tableau
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="staff-grid">
          {currentItems.map((staff) => (
            <div key={staff.id} className="staff-card">
              <div className="card-header">
                <div className="profile-image-container">
  
  
   
   
       {staff.profileImageUrl ? (
    <img
      src={`${BASE_URL}${staff.profileImageUrl}`}  
      alt={staff.name}
      className="profile-image"
      onError={(e) => {
        e.target.onerror = null;
        e.target.src =
          "https://ui-avatars.com/api/?name=" +
          encodeURIComponent(staff.name) +
          "&size=150&background=95a5a6&color=fff";
      }}
    />
  ) : (
    <div className="profile-placeholder">
      <Person style={{ fontSize: 60, color: "#95a5a6" }} />
    </div>
  )}
</div>

                <div className="card-actions">
                  <button
                    className="icon-btn edit-btn"
                    onClick={() => openEditModal(staff)}
                    title="Modifier" >

                    <Edit fontSize="small" />
                  </button>
                  <button
                    className="icon-btn delete-btn"
                    onClick={() => handleDelete(staff.id, staff.name)}
                    title="Supprimer"
                  >
                    <Delete fontSize="small" />
                  </button>
                </div>
              </div>
              <div className="card-body">
                <h3 className="staff-name">{staff.name}</h3>
                <span className={`role-badge ${getRoleBadgeClass(staff.role)}`}>
                  {getRoleLabel(staff.role)}
                </span>
                {staff.specialite && (
                  <p className="staff-specialite">
                    Spécialité: {staff.specialite}
                  </p>
                )}
                <div className="staff-info">
                  <div className="info-item">
                    <Email fontSize="small" style={{ color: "#3498db" }} />
                    <span>{staff.email}</span>
                  </div>
                  {staff.tel && (
                    <div className="info-item">
                      <Phone fontSize="small" style={{ color: "#2ecc71" }} />
                      <span>{staff.tel}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-container">
          <table className="staff-table">
            <thead>
              <tr>
                <th>Membre</th>
                <th>Rôle</th>
                <th>Spécialité</th>
                <th>Contact</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((staff) => (
                <tr key={staff.id}>
                  <td>
                    <div className="member-cell">
                      {staff.profileImageUrl ? (
                        <img
  src={`${BASE_URL}${staff.profileImageUrl}`}
                            alt={staff.name}
                          className="table-profile-image"
                        />
                      ) : (
                        <div className="table-profile-placeholder">
                          <Person fontSize="small" />
                        </div>
                      )}
                      <div className="member-info">
                        <p className="member-name">{staff.name}</p>
                        <p className="member-email">{staff.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${getRoleBadgeClass(staff.role)}`}>
                      {getRoleLabel(staff.role)}
                    </span>
                  </td>
                  <td>{staff.specialite || "-"}</td>
                  <td>
                    {staff.tel ? (
                      <div className="contact-cell">
                        <Phone fontSize="small" style={{ color: "#2ecc71" }} />
                        <span>{staff.tel}</span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="actions-col">
                    <button
                      className="icon-btn edit-btn"
                      onClick={() => openEditModal(staff)}
                    >
                      <Edit fontSize="small" />
                    </button>
                    <button
                      className="icon-btn delete-btn"
                      onClick={() => handleDelete(staff.id, staff.nom)}
                    >
                      <Delete fontSize="small" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination-modern">
          <button
            className="pagination-btn"
            onClick={prevPage}
            disabled={currentPage === 1}
          >
            ← Précédent
          </button>
          <div className="pagination-info">
            Page <strong>{currentPage}</strong> sur <strong>{totalPages}</strong>
          </div>
          <button
            className="pagination-btn"
            onClick={nextPage}
            disabled={currentPage === totalPages}
          >
            Suivant →
          </button>
        </div>
      )}

      {isAddModalOpen && (
        <AddStaffModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAdd}
        />
      )}
      {isEditModalOpen && (
        <EditStaffModal
          staff={selectedStaff}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleUpdate}
        />
      )}
   

   
    </div>
  );
};

export default StaffPage;