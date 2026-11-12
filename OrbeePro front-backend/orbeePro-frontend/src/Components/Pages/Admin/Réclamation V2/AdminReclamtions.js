import React, { useState, useEffect } from "react";

import {
  FilterList,
  History,
  Assignment,
  CheckCircle,
  Warning,
  AccessTime,
  TrendingUp,
  Search,
  Close,
  Person,
  Room,
  CalendarToday,
  Photo,
  ChevronLeft,
  ChevronRight,
  FirstPage,
  LastPage,
} from "@mui/icons-material";
import ReclamationModal from "./ReclamationModal";
import reclamationService from "../../../../services/ReclamationService";
import styles from "./stylesAdminRec";
import { StaffService } from "../../../../services/staffService";
import { BASE_URL } from "../../../../constants";

const AdminReclamations = () => {



  const [reclamations, setReclamations] = useState([]);
  const [currentView, setCurrentView] = useState("all");
  const [selectedReclamation, setSelectedReclamation] = useState(null);
  const [showReclamationModal, setShowReclamationModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const[agents, setAgents]=useState([]);

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  // Filtres
  const [filters, setFilters] = useState({
    agent: "",
    Espace: "",
    status: "",
    urgency: "",
    searchTerm: "",
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    enRetard: 0,
    terminees: 0,
    enCours: 0,
  });

const loadAgents = async () => {
    try {
        const result = await StaffService.getAgents();
        if (result.success) {
            setAgents(result.data);
        }
    } catch (error) {
        console.error("Erreur chargement agents:", error);
    }
};




const MesReclamations = async () => {
    setLoading(true);
    try {
      const result = await reclamationService.getAll();


      if (result && result.success && Array.isArray(result.data)) {

        // ✅ Formatage indispensable avant le SET
        const formatted = result.data.map((rec) => ({
          ...rec,
          // On harmonise les noms des champs Backend (MySQL) -> Frontend (React)
          espaceNumber: rec.espaceNumber || rec.roomNumber,
          problem: rec.description || rec.problem,
          categorie: rec.service || rec.categorie,
          createdAt: rec.createdAt ? new Date(rec.createdAt) : new Date(),
          updatedAt: rec.updatedAt ? new Date(rec.updatedAt) : new Date(),
        }));

        setReclamations(formatted);
        calculateStats(formatted); // On lance le calcul avec les données formatées
      } else {
        setReclamations([]);
      }
    } catch (error) {
      console.error("Erreur:", error);
      setReclamations([]);
    } finally {
      setLoading(false);
    }
  };

 useEffect(() => {
    loadAgents();  
MesReclamations();
}, []);


  // Calculer les statistiques
  const calculateStats = (data) => {
    if (!data || !Array.isArray(data)) return; // 🛡️ Sécurité

    const now = new Date();
    const stats = {
      total: data.length,
      enRetard: 0,
      terminees: data.filter(
        (r) => r.status === "résolu" || r.status === "clôturé",
      ).length,
      enCours: data.filter(
        (r) => r.status === "assigné" || r.status === "en cours",
      ).length,
    };

    // Calculer les réclamations en retard
    data.forEach((rec) => {
      if (
        rec.status !== "résolu" &&
        rec.status !== "clôturé" &&
        rec.createdAt
      ) {
        const delaiHeures = getDelaiByUrgency(rec.urgency);
        const tempsEcoule = (now - rec.createdAt) / (1000 * 60 * 60);
        if (tempsEcoule > delaiHeures) {
          stats.enRetard++;
        }
      }
    });

    setStats(stats);
  };

  // Obtenir le délai selon l'urgence
  const getDelaiByUrgency = (urgency) => {
    const delais = {
      tres_urgent: 0,
      urgent: 4,
      moyen: 24,
      bas: 48,
      high: 4,
      medium: 24,
      low: 48,
    };
    return delais[urgency] || 24;
  };

  // Vérifier si une réclamation est en retard
  const isEnRetard = (reclamation) => {
    if (reclamation.status === "résolu" || reclamation.status === "clôturé")
      return false;
    if (!reclamation.createdAt) return false;

    const now = new Date();
    const delaiHeures = getDelaiByUrgency(reclamation.urgency);
    const tempsEcoule = (now - reclamation.createdAt) / (1000 * 60 * 60);

    return tempsEcoule > delaiHeures;
  };

  // Filtrer les réclamations
  // ✅ On s'assure que reclamations est toujours traité comme un tableau
  const filteredReclamations = (
    Array.isArray(reclamations) ? reclamations : []
  ).filter((rec) => {
    // 🛡️ Sécurité supplémentaire pour chaque propriété
    const room = rec.espaceNumber || rec.roomNumber || "";
    const problem = rec.problem || rec.description || "";
    const categorie = rec.service || rec.categorie || "";

    if (filters.agent && rec.agentAssigne?.id !== filters.agent) return false;
    if (filters.room && !room.includes(filters.room)) return false;
    if (filters.status && rec.status !== filters.status) return false;
    if (filters.urgency && rec.urgency !== filters.urgency) return false;

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      return (
        room.toLowerCase().includes(term) ||
        problem.toLowerCase().includes(term) ||
        categorie.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Calculer la pagination
  useEffect(() => {
    const total = filteredReclamations.length;
    const pages = Math.ceil(total / itemsPerPage);
    setTotalPages(pages);

    if (currentPage > pages && pages > 0) {
      setCurrentPage(1);
    }
  }, [filteredReclamations, itemsPerPage, currentPage]);

  // Obtenir les réclamations pour la page actuelle
  const getCurrentPageReclamations = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredReclamations.slice(startIndex, endIndex);
  };

  // Changer de page
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  // Calculer les statistiques par agent
  const getAgentStats = (agentUid) => {
    const agentRecs = reclamations.filter(
      (r) => r.agentAssigne?.uid === agentUid,
    );
    const total = agentRecs.length;
    const terminees = agentRecs.filter(
      (r) => r.status === "résolu" || r.status === "clôturé",
    ).length;
    const enRetard = agentRecs.filter((r) => isEnRetard(r)).length;
    const tauxReussite = total > 0 ? Math.round((terminees / total) * 100) : 0;

    return { total, terminees, enRetard, tauxReussite };
  };

 
  // Formater la durée écoulée
  const formatDuree = (date) => {
    if (!date) return "N/A";
    const now = new Date();
    const diff = now - date;
    const heures = Math.floor(diff / (1000 * 60 * 60));
    const jours = Math.floor(heures / 24);

    if (jours > 0) return `${jours}j ${heures % 24}h`;
    return `${heures}h`;
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      tres_urgent: "#DC2626",
      urgent: "#EA580C",
      moyen: "#CA8A04",
      bas: "#2563EB",
      high: "#DC2626",
      medium: "#CA8A04",
      low: "#2563EB",
    };
    return colors[urgency] || "#6B7280";
  };

  const getStatusColor = (status) => {
    const colors = {
      "en attente": "#9CA3AF",
      assigné: "#3B82F6",
      "en cours": "#F59E0B",
      résolu: "#10B981",
      clôturé: "#6B7280",
    };
    return colors[status] || "#9CA3AF";
  };

  const getUrgencyLabel = (urgency) => {
    const labels = {
      tres_urgent: "Très Urgent",
      urgent: "Urgent",
      moyen: "Moyen",
      bas: "Bas",
      high: "Urgent",
      medium: "Moyen",
      low: "Bas",
    };
    return labels[urgency] || urgency;
  };



  // Changer le statut d'une réclamation
  const handleStatusChange = async () => {
   
  };

  const handleAssignAgent = async (reclamationId, agentId) => {
    // 1. On ne fait rien si l'ID de l'agent est vide (option par défaut du select)
    if (!agentId) return;

    try {
        setLoading(true);

        // 2. Appel au service (on l'avait préparé ensemble plus haut)
        const result = await reclamationService.assignAgent(reclamationId, agentId);

        if (result.success) {
            // 3. Mise à jour de la réclamation sélectionnée dans la modale
            // On récupère le nom de l'agent dans la liste locale des agents pour l'affichage
            const selectedAgent = agents.find(a => a.id === parseInt(agentId));
            
            setSelectedReclamation(prev => ({
                ...prev,
                agentId: agentId,
                agentName: selectedAgent ? selectedAgent.nom : 'Assigné',
                status: 'assigné'
            }));

            // 4. Rafraîchir la liste principale pour mettre à jour le tableau
            await MesReclamations(); 

            alert("✅ L'agent a été assigné avec succès !");
        } else {
            alert("❌ Erreur : " + result.message);
        }
    } catch (error) {
        console.error("Erreur lors de l'assignation:", error);
        alert("Une erreur réseau est survenue.");
    } finally {
        setLoading(false);
    }
};

const handleStatClick = (view) => {
    // Si on reclique sur la vue active, on réinitialise (optionnel)
    if (filters.status === view) {
        setFilters({ ...filters, status: '' });
    } else {
        // On applique le filtre de statut correspondant à la carte
        setFilters({
            ...filters,
            status: view,
            searchTerm: '' // On vide la recherche textuelle pour éviter les conflits
        });
    }
    setCurrentPage(1); // On revient à la première page
};

  return (
    <>
      <style>{styles}</style>
      <div className="reclamations-container">
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>



          {/* Navigation Tabs */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <div className="view-toggle">
              <button
                className={`view-button ${currentView === "all" ? "active" : ""}`}
                onClick={() => {
                  setCurrentView("all");
                  setCurrentPage(1);
                }}
              >
                <Assignment
                  style={{
                    verticalAlign: "middle",
                    marginRight: "8px",
                    fontSize: "18px",
                  }}
                />
                Toutes les Réclamations
              </button>
              <button
                className={`view-button ${currentView === "history" ? "active" : ""}`}
                onClick={() => {
                  setCurrentView("history");
                  setCurrentPage(1);
                }}
              >
                <History
                  style={{
                    verticalAlign: "middle",
                    marginRight: "8px",
                    fontSize: "18px",
                  }}
                />
                Historique par Agent
              </button>
            </div>

            <button
              className="add-button"
              onClick={() => setShowReclamationModal(true)}
            >
              <Assignment style={{ fontSize: "20px" }} />
              Nouvelle réclamation
            </button>
          </div>
        {/* Stats Cards */}
<div className="stats-grid">
    <div 
        className={`stat-card ${filters.status === '' ? 'active-filter' : ''}`}
        onClick={() => handleStatClick('')}
        style={{ cursor: 'pointer' }}
    >
        <div className="stat-value">{stats.total}</div>
        <div className="stat-label">Total Réclamations</div>
    </div>

    {/* Carte EN RETARD (Ici, c'est spécial, on filtre par logique de retard) */}
    <div 
        className="stat-card"
        onClick={() => setFilters({ ...filters, status: 'en_retard' })} // Logique personnalisée
        style={{ cursor: 'pointer', borderLeft: filters.status === 'en_retard' ? '4px solid #DC2626' : 'none' }}
    >
        <div className="stat-value" style={{ color: '#DC2626' }}>{stats.enRetard}</div>
        <div className="stat-label">En Retard</div>
    </div>

    {/* Carte TERMINÉES */}
    <div 
        className={`stat-card ${filters.status === 'résolu' ? 'active-filter' : ''}`}
        onClick={() => handleStatClick('résolu')}
        style={{ cursor: 'pointer' }}
    >
        <div className="stat-value" style={{ color: '#10B981' }}>{stats.terminees}</div>
        <div className="stat-label">Terminées</div>
    </div>

    {/* Carte EN COURS */}
    <div 
        className={`stat-card ${filters.status === 'en cours' ? 'active-filter' : ''}`}
        onClick={() => handleStatClick('en cours')}
        style={{ cursor: 'pointer' }}
    >
        <div className="stat-value" style={{ color: '#F59E0B' }}>{stats.enCours}</div>
        <div className="stat-label">En Cours</div>
    </div>
</div>

          {/* Vue Toutes les Réclamations */}
          {currentView === "all" && (
            <>
              {/* Filtres */}
              <div className="filters-container">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <FilterList
                    style={{ marginRight: "8px", color: "#667eea" }}
                  />
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.125rem",
                      fontWeight: "600",
                      color: "#2d3748",
                    }}
                  >
                    Filtres
                  </h3>
                </div>

                <div className="filters-grid">
                  {/* Recherche */}
                  <div className="filter-group">
                    <label className="filter-label">Recherche</label>
                    <div className="search-container">
                      <Search className="search-icon" />
                      <input
                        type="text"
                        placeholder="Espace, problème..."
                        value={filters.searchTerm}
                        onChange={(e) => {
                          setFilters({
                            ...filters,
                            searchTerm: e.target.value,
                          });
                          setCurrentPage(1);
                        }}
                        className="search-input"
                      />
                    </div>
                  </div>

                  {/* Statut */}
                  <div className="filter-group">
                    <label className="filter-label">Statut</label>
                    <select
                      value={filters.status}
                      onChange={(e) => {
                        setFilters({ ...filters, status: e.target.value });
                        setCurrentPage(1);
                      }}
                      className="filter-select"
                    >
                      <option value="">Tous les statuts</option>
                      <option value="en attente">En attente</option>
                      <option value="assigné">Assigné</option>
                      <option value="en cours">En cours</option>
                      <option value="résolu">Résolu</option>
                      <option value="clôturé">Clôturé</option>
                    </select>
                  </div>

                  {/* Urgence */}
                  <div className="filter-group">
                    <label className="filter-label">Urgence</label>
                    <select
                      value={filters.urgency}
                      onChange={(e) => {
                        setFilters({ ...filters, urgency: e.target.value });
                        setCurrentPage(1);
                      }}
                      className="filter-select"
                    >
                      <option value="">Toutes</option>
                      <option value="tres_urgent">Très Urgent</option>
                      <option value="urgent">Urgent</option>
                      <option value="moyen">Moyen</option>
                      <option value="bas">Bas</option>
                    </select>
                  </div>
                </div>

                {/* Bouton Reset */}
                {(filters.agent ||
                  filters.room ||
                  filters.status ||
                  filters.urgency ||
                  filters.searchTerm) && (
                  <button
                    className="reset-button"
                    onClick={() => {
                      setFilters({
                        agent: "",
                        room: "",
                        status: "",
                        urgency: "",
                        searchTerm: "",
                      });
                      setCurrentPage(1);
                    }}
                  >
                    <Close style={{ fontSize: "18px" }} />
                    Réinitialiser les filtres
                  </button>
                )}
              </div>

              {/* Informations de pagination */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                  padding: "0 0.5rem",
                }}
              >
                <div className="pagination-info">
                  Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredReclamations.length,
                  )}{" "}
                  sur {filteredReclamations.length} réclamations
                </div>
                <div className="pagination-info">
                  Page {currentPage} sur {totalPages}
                </div>
              </div>

              {/* Liste des réclamations */}
              <div className="table-container">
                <div style={{ overflowX: "auto" }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Espace</th>
                        <th>Problème</th>
                        <th>Catégorie</th>
                        <th>Agent</th>
                        <th>Urgence</th>
                        <th>Statut</th>
                        <th>Temps écoulé</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getCurrentPageReclamations().map((rec) => (
                        <tr
                          key={rec.id}
                          style={{
                            background: isEnRetard(rec)
                              ? "#FEE2E2"
                              : "transparent",
                          }}
                        >
                          <td style={{ fontWeight: "600", color: "#1a202c" }}>
                            <Room
                              style={{
                                verticalAlign: "middle",
                                marginRight: "8px",
                                color: "#718096",
                              }}
                            />
                            {rec.espaceNumber}
                          </td>
                          {/* <td style={{ color: "#4a5568", maxWidth: "200px" }}>
                            {rec.problem.length > 50
                              ? rec.problem.substring(0, 50) + "..."
                              : rec.problem}
                          </td> */}

                          
                          <td style={{ color: "#4a5568", maxWidth: "200px" }}>
  {(rec.problem || "").length > 50
    ? rec.problem.slice(0, 50) + "..."
    : rec.problem || "—"}
</td>
                          <td>
                            <span
                              style={{
                                background: "#EEF2FF",
                                color: "#667eea",
                                padding: "0.5rem 1rem",
                                borderRadius: "8px",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                display: "inline-block",
                              }}
                            >
                              {rec.categorie}
                            </span>
                          </td>
                          <td style={{ color: "#4a5568" }}>
                            {rec.agentAssigne ? (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <Person style={{ color: "#718096" }} />
                                {rec.agentAssigne.nom}
                              </div>
                            ) : (
                              <span
                                style={{
                                  color: "#a0aec0",
                                  fontStyle: "italic",
                                }}
                              >
                                Non assigné
                              </span>
                            )}
                          </td>
                          <td>
                            <div
                              className="urgency-badge"
                              style={{
                                background: getUrgencyColor(rec.urgency) + "20",
                                color: getUrgencyColor(rec.urgency),
                              }}
                            >
                              <div
                                style={{
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  background: getUrgencyColor(rec.urgency),
                                }}
                              ></div>
                              {getUrgencyLabel(rec.urgency)}
                            </div>
                          </td>

                          <td>
                            <select
                              value={rec.status}
                              onChange={(e) =>
                                handleStatusChange(rec.id, e.target.value)
                              }
                              className="status-select"
                              style={{
                                borderColor: getStatusColor(rec.status),
                                color: getStatusColor(rec.status),
                              }}
                            >
                              <option value="en attente">En attente</option>
                              <option value="assigné">Assigné</option>
                              <option value="en cours">En cours</option>
                              <option value="résolu">Résolu</option>
                              <option value="clôturé">Clôturé</option>
                            </select>
                          </td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              {isEnRetard(rec) && (
                                <Warning style={{ color: "#DC2626" }} />
                              )}
                              <AccessTime style={{ color: "#718096" }} />
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  fontWeight: "600",
                                  color: isEnRetard(rec)
                                    ? "#DC2626"
                                    : "#4a5568",
                                }}
                              >
                                {formatDuree(rec.createdAt)}
                              </span>
                            </div>
                          </td>
                          <td>
                            <button
                              className="details-button"
                              onClick={() => setSelectedReclamation(rec)}
                            >
                              Détails
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredReclamations.length === 0 && (
                  <div className="empty-state">
                    <Assignment
                      style={{
                        fontSize: "64px",
                        marginBottom: "1rem",
                        color: "#a0aec0",
                      }}
                    />
                    <div className="empty-title">
                      Aucune réclamation trouvée
                    </div>
                    <p style={{ margin: 0, color: "#718096" }}>
                      Essayez de modifier vos filtres ou créez une nouvelle
                      réclamation
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination avec Items par page */}
              {filteredReclamations.length > 0 && (
                <div className="pagination">
                  {/* Informations de pagination */}
                  <div className="pagination-info">
                    Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredReclamations.length,
                    )}{" "}
                    sur {filteredReclamations.length} réclamations
                  </div>

                  {/* Boutons de navigation */}
                  <div className="pagination-buttons">
                    <button
                      className="page-button"
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                      style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                    >
                      <FirstPage />
                    </button>
                    <button
                      className="page-button"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                    >
                      <ChevronLeft />
                      Précédent
                    </button>

                    {/* Numéros de page */}
                    {getPageNumbers().map((page) => (
                      <button
                        key={page}
                        className={`page-button ${currentPage === page ? "active" : ""}`}
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    {totalPages >
                      getPageNumbers()[getPageNumbers().length - 1] && (
                      <span
                        style={{ padding: "0.5rem 0.25rem", color: "#718096" }}
                      >
                        ...
                      </span>
                    )}

                    <button
                      className="page-button"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                    >
                      Suivant
                      <ChevronRight />
                    </button>
                    <button
                      className="page-button"
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                      style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                    >
                      <LastPage />
                    </button>
                  </div>

                  {/* Items par page - DÉPLACÉ ICI */}
                  <div className="items-per-page">
                    <span
                      className="pagination-info"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      Items par page:
                    </span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="items-select"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Vue Historique par Agent */}
          {currentView === "history" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {agents.map((agent) => {
                const agentStats = getAgentStats(agent.uid);
                if (agentStats.total === 0) return null;

                return (
                  <div key={agent.id} className="agent-card">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        marginBottom: "1.25rem",
                        flexWrap: "wrap",
                        gap: "1rem",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            fontSize: "1.25rem",
                            fontWeight: "700",
                            color: "#1a202c",
                            marginBottom: "0.25rem",
                          }}
                        >
                          <Person
                            style={{
                              verticalAlign: "middle",
                              marginRight: "0.5rem",
                            }}
                          />
                          {agent.name}
                        </h3>
                        <p
                          style={{
                            color: "#718096",
                            fontSize: "0.875rem",
                            margin: 0,
                          }}
                        >
                          {agent.specialite || agent.role}
                        </p>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "1rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            textAlign: "center",
                            padding: "0.75rem 1.25rem",
                            background: "#EEF2FF",
                            borderRadius: "12px",
                            minWidth: "80px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "1.5rem",
                              fontWeight: "700",
                              color: "#667eea",
                            }}
                          >
                            {agentStats.total}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#718096",
                              marginTop: "0.25rem",
                            }}
                          >
                            Total
                          </div>
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            padding: "0.75rem 1.25rem",
                            background: "#D1FAE5",
                            borderRadius: "12px",
                            minWidth: "80px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "1.5rem",
                              fontWeight: "700",
                              color: "#10B981",
                            }}
                          >
                            {agentStats.terminees}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#718096",
                              marginTop: "0.25rem",
                            }}
                          >
                            Terminées
                          </div>
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            padding: "0.75rem 1.25rem",
                            background: "#FEE2E2",
                            borderRadius: "12px",
                            minWidth: "80px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "1.5rem",
                              fontWeight: "700",
                              color: "#DC2626",
                            }}
                          >
                            {agentStats.enRetard}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#718096",
                              marginTop: "0.25rem",
                            }}
                          >
                            En retard
                          </div>
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            padding: "0.75rem 1.25rem",
                            background: "#FEF3C7",
                            borderRadius: "12px",
                            minWidth: "80px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "1.5rem",
                              fontWeight: "700",
                              color: "#D97706",
                            }}
                          >
                            {agentStats.tauxReussite}%
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#718096",
                              marginTop: "0.25rem",
                            }}
                          >
                            Taux réussite
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div
                      style={{
                        background: "#f7fafc",
                        height: "8px",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${agentStats.tauxReussite}%`,
                          height: "100%",
                          background:
                            agentStats.tauxReussite >= 80
                              ? "#10B981"
                              : agentStats.tauxReussite >= 50
                                ? "#F59E0B"
                                : "#DC2626",
                          transition: "width 0.3s",
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}

              {agents.filter((agent) => getAgentStats(agent.uid).total > 0)
                .length === 0 && (
                <div className="empty-state">
                  <History
                    style={{
                      fontSize: "64px",
                      marginBottom: "1rem",
                      color: "#a0aec0",
                    }}
                  />
                  <div className="empty-title">Aucun historique disponible</div>
                  <p style={{ margin: 0, color: "#718096" }}>
                    Aucun agent n'a encore traité de réclamations
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Modal Détails Réclamation */}
          {selectedReclamation && (
            <div
              className="modal-overlay"
              onClick={() => setSelectedReclamation(null)}
            >
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                {/* Header Modal */}
                <div className="modal-header"  style={{ margin: 0, color: "#edcb22" }}>
                  <h3 className="modal-title"  style={{color:'red'}}>Détails de la Réclamation</h3>
                  <button
                    className="modal-close"
                    onClick={() => setSelectedReclamation(null)}
                  >
                    <Close />
                  </button>
                </div>

                {/* Contenu Modal */}
                <div className="modal-body">
                  {/* Alertes en retard */}
                  {isEnRetard(selectedReclamation) && (
                    <div
                      style={{
                        background: "#FEE2E2",
                        border: "2px solid #DC2626",
                        borderRadius: "12px",
                        padding: "1rem",
                        marginBottom: "1.5rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <Warning style={{ color: "#DC2626" }} />
                      <div>
                        <div
                          style={{
                            fontWeight: "700",
                            color: "#DC2626",
                            fontSize: "0.875rem",
                          }}
                        >
                          ⚠️ Réclamation en retard !
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#991B1B",
                            marginTop: "0.25rem",
                          }}
                        >
                          Délai dépassé de{" "}
                          {formatDuree(selectedReclamation.createdAt)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Informations principales */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.25rem",
                    }}
                  >
                    {/* Chambre */}
                    <div>
                      <div className="filter-label">Espace</div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <Room style={{ color: "#667eea" }} />
                        <span
                          style={{
                            fontSize: "1.5rem",
                            fontWeight: "700",
                            color: "#1a202c",
                          }}
                        >
                          Espace {selectedReclamation.espaceNumber}
                        </span>
                      </div>
                    </div>

                    {/* Catégorie et Urgence */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1rem",
                      }}
                    >
                      <div>
                        <div className="filter-label">Catégorie</div>
                        <div
                          style={{
                            background: "#EEF2FF",
                            color: "#667eea",
                            padding: "0.5rem 1rem",
                            borderRadius: "8px",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            display: "inline-block",
                          }}
                        >
                          {selectedReclamation.categorie}
                        </div>
                      </div>
                      <div>
                        <div className="filter-label">Urgence</div>
                        <div
                          style={{
                            background:
                              getUrgencyColor(selectedReclamation.urgency) +
                              "20",
                            color: getUrgencyColor(selectedReclamation.urgency),
                            padding: "0.5rem 1rem",
                            borderRadius: "8px",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: getUrgencyColor(
                                selectedReclamation.urgency,
                              ),
                            }}
                          ></div>
                          {getUrgencyLabel(selectedReclamation.urgency)}
                        </div>
                      </div>
                    </div>

                    {/* Problème */}
                    <div>
                      <div className="filter-label">
                        Description du problème
                      </div>
                      <div
                        style={{
                          background: "#f7fafc",
                          padding: "1rem",
                          borderRadius: "8px",
                          fontSize: "0.875rem",
                          color: "#4a5568",
                          lineHeight: "1.5",
                        }}
                      >
                        {selectedReclamation.problem}
                      </div>
                    </div>

                    {/* Photo si disponible */}
                    {selectedReclamation.photoURL && (
                      <div>
                        <div
                          className="filter-label"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <Photo /> Photo du problème
                        </div>
                        <img
                          src={`${BASE_URL}/uploads/reclamations/${selectedReclamation.photoURL}`}
                          alt="Problème"
                          style={{
                            width: "100%",
                            maxHeight: "300px", // Augmenté pour mieux voir
                            objectFit: "contain",
                            borderRadius: "12px",
                            border: "2px solid #e2e8f0",
                            cursor: "zoom-in",
                          }}
                          onClick={() =>
                            window.open(
                              `${BASE_URL}/uploads/reclamations/${selectedReclamation.photoURL}`,
                              "_blank",
                            )
                          }
                        />
                      </div>
                    )}


                    <div>
                      <div className="filter-label">Agent assigné</div>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                        }} >


                        <select
                          value={selectedReclamation.agentId || ""}
                          onChange={(e) =>
                            handleAssignAgent(
                              selectedReclamation.id,
                              e.target.value,
                            )
                          }
                          className="filter-select"
                          style={{ flex: 1 }}
                        >
                          <option value="">-- Choisir un agent --</option>
                          {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.nom}
                               {/* ({agent.specialite}) */}
                            </option>
                          ))}
                        </select>

                        {selectedReclamation.agentName && (
                          <div
                            className="agent-badge"
                            style={{
                              background: "#F0FDF4",
                              padding: "5px 10px",
                              borderRadius: "20px",
                              fontSize: "12px",
                            }}
      >
                            Actuel: {selectedReclamation.agentName}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Statut */}
                    <div>
                      <div className="filter-label">Statut actuel</div>
                      <select
                        value={selectedReclamation.status}
                        onChange={(e) => {
                          handleStatusChange(
                            selectedReclamation.id,
                            e.target.value,
                          );
                          setSelectedReclamation({
                            ...selectedReclamation,
                            status: e.target.value,
                          });
                        }}
                        className="filter-select"
                        style={{
                          borderColor: getStatusColor(
                            selectedReclamation.status,
                          ),
                          color: getStatusColor(selectedReclamation.status),
                          fontWeight: "700",
                        }}
                      >
                        <option value="en attente">⏳ En attente</option>
                        <option value="assigné">📋 Assigné</option>
                        <option value="en cours">🔄 En cours</option>
                        <option value="résolu">✅ Résolu</option>
                        <option value="clôturé">🔒 Clôturé</option>
                      </select>
                    </div>

                    {/* Informations temporelles */}
                    <div
                      style={{
                        background: "#f7fafc",
                        padding: "1rem",
                        borderRadius: "8px",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1rem",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#718096",
                            marginBottom: "0.25rem",
                          }}
                        >
                          <CalendarToday
                            style={{
                              fontSize: "14px",
                              verticalAlign: "middle",
                              marginRight: "0.25rem",
                            }}
                          />
                          Créée le
                        </div>
                        <div
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: "#1a202c",
                          }}
                        >
                          {selectedReclamation.createdAt?.toLocaleString(
                            "fr-FR",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#718096",
                            marginBottom: "0.25rem",
                          }}
                        >
                          <AccessTime
                            style={{
                              fontSize: "14px",
                              verticalAlign: "middle",
                              marginRight: "0.25rem",
                            }}
                          />
                          Temps écoulé
                        </div>
                        <div
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: isEnRetard(selectedReclamation)
                              ? "#DC2626"
                              : "#1a202c",
                          }}
                        >
                          {formatDuree(selectedReclamation.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Créée par */}
                    <div>
                      <div className="filter-label">Signalée par</div>
                      <div
                        style={{
                          background: "#EEF2FF",
                          padding: "0.75rem 1rem",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <Person style={{ color: "#667eea" }} />
                        <span
                          style={{
                            fontWeight: "600",
                            color: "#1a202c",
                            fontSize: "0.875rem",
                          }}
                        >
                          {selectedReclamation.creatorName ||
                            "Utilisateur inconnu"}
                        </span>
                        
                      </div>
                    </div>
                  </div>

                  {/* Bouton fermer */}
                  <button
                    onClick={() => setSelectedReclamation(null)}
                    style={{
                      width: "100%",
                      marginTop: "1.5rem",
                      padding: "0.875rem",
                      background: "#f7fafc",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: "#4a5568",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#e2e8f0")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#f7fafc")
                    }
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}



          <ReclamationModal
            showAddModal={showReclamationModal}
            onClose={() => setShowReclamationModal(false)}
            onSubmit={(formData) => {
              setShowReclamationModal(false);
            }}
          />
        </div>
      </div>
    </>
  );
};

export default AdminReclamations;