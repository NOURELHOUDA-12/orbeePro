import React, { useState, useEffect, useMemo, useCallback } from "react";
import api from "../../../../services/api"; 
import { 
  AlertCircle, CheckCircle, Clock, Plus, Search, Loader, 
  List, Grid, Calendar as CalendarIcon, Play, RefreshCw, 
  PauseCircle, ChevronDown, User, MapPin 
} from "lucide-react";
import styles from "./reclamation.module.css";
import axiosService from '../../../../services/reclamationServiceAxios';


import ReclamationListView from "./ReclamationListView";
import ReclamationGridView from "./ReclamationGridView";
import ReclamationCalendarView from "./ReclamationCalendarView";
import ReclamationModal from "../../Admin/Réclamation V2/ReclamationModal";
import PauseReclamationModal from "./PauseReclamationModal";

const ReclamationEmployee = () => {

  const [user, setUser] = useState(null);
  const [reclamations, setReclamations] = useState([]);
  const [history, setHistory] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --- ÉTATS UI ---
  const [filter, setFilter] = useState("pending"); 
  const [viewMode, setViewMode] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // --- ÉTATS MODALE DE PAUSE ---
  const [selectedTask, setSelectedTask] = useState(null);
  const [showPauseModal, setShowPauseModal] = useState(false);

// ReclamationEmployee.js

// Effet pour faire disparaître les alertes automatiquement
useEffect(() => {
  if (error || success) {
    const timer = setTimeout(() => {
      setError("");
      setSuccess("");
    }, 5000); // 5000ms = 5 secondes

    return () => clearTimeout(timer); 
  }
}, [error, success]);


  // 1. Initialisation de l'utilisateur (Session)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser({
          id: parsed.id,
          name: `${parsed.prenom} ${parsed.nom}`,
          role: localStorage.getItem("userRole"),
        });
      } catch (e) { 
        setError("Session invalide. Veuillez vous reconnecter."); 
      }
    } else {
      setLoading(false);
    }
  }, []);

  // 2. Chargement des données (Lieux + Réclamations)
  const loadData = useCallback(async () => {
    if (!user?.role) return;
    setLoading(true);
    try {
      // On récupère les données selon le rôle (ex: 'menager')
      const [dataRes, locRes] = await Promise.all([
        axiosService.getEmployeeDataByRole("menager"),
        api.get('/locations') 
      ]);

      if (dataRes.success) {
        setReclamations(dataRes.data.active || []);
        setHistory(dataRes.data.history || []);
      }
      if (locRes.data) setLocations(locRes.data);
    } catch (err) {
      setError("Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => { loadData(); }, [loadData]);

  // 3. Formattage du nom du lieu
  const getLocationNameById = useCallback((id) => {
    if (!id) return "N/A";
    const loc = locations.find(l => l.id === id);
    return loc ? `${loc.espaceNumber}` : `Zone ${id}`;
  }, [locations]);

  // 4. Gestion des changements de statut (Commencer, Terminer, Reprendre)
  const handleUpdateStatus = async (task, newStatus, pauseReason = null) => {
    try {
      const result = await axiosService.updateReclamationStatus(
        task.id, 
        newStatus, 
        user.id,
        pauseReason
      );

      if (result.success) {
        setSuccess(`Mise à jour réussie : ${newStatus}`);
        loadData(); // Rafraîchissement global
      }
    } catch (err) {
      setError("Échec de la mise à jour du statut.");
    }
  };

  // 5. Fonctions spécifiques à la Pause
  const handleOpenPauseModal = (task) => {
    setSelectedTask(task);
    setShowPauseModal(true);
  };


const handleSubmitPause = async (task, reasonFromModal) => {
    try {
        const result = await axiosService.updateReclamationStatus(
            task.id, 
            'paused', 
            user.id, 
            reasonFromModal // C'est ici que 'la reason' arrive du fils vers le parent
        );

        if (result.success) {
            setSuccess("Réclamation mise en pause avec succès");
            loadData(); 
        }


        
    } catch (err) {
        setError("Erreur lors de la mise en pause");
    }
};



  // 6. Calcul des statistiques (Gamification)
  const stats = useMemo(() => ({
    pending: reclamations.filter(r => r.status === 'en attente' || r.status === 'pending').length,
    inProgress: reclamations.filter(r => ['en cours', 'assigné', 'in-progress'].includes(r.status)).length,
    done: history.length
  }), [reclamations, history]);

  // 7. Filtrage pour l'affichage
  const itemsToShow = useMemo(() => {
    const base = filter === "pending" ? reclamations : history;
    if (!searchTerm) return base;
    const term = searchTerm.toLowerCase();
    return base.filter(item => 
      (item.description || item.problem)?.toLowerCase().includes(term) ||
      getLocationNameById(item.locationId).toLowerCase().includes(term)
    );
  }, [filter, reclamations, history, searchTerm, getLocationNameById]);

  if (loading && !reclamations.length) {
    return (
      <div className={styles.loading}>
        <Loader className={styles.spin} size={40} />
        <p>Chargement de votre espace de travail...</p>
      </div>
    );
  }

  const commonProps = {
    filter,
    getLocationNameById,
    handleUpdateStatus,
    handleOpenPauseModal
  };

  return (
    <div className={styles.container}>
      {/* HEADER SECTION */}
      <div className={styles.managerHeader}>
        <div>
          <h1 className={styles.managerTitle}>Espace {user?.role || 'Employé'}</h1>
          <p className={styles.managerSubtitle}>Bonjour, {user?.name}. Suivez vos interventions.</p>
        </div>
        <button className={styles.primaryButton} onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} /> Nouvelle Réclamation
        </button>
      </div>

      {/* STATS PANEL */}
      <div className={styles.gamificationPanel}>
        <StatCard icon={<AlertCircle />} value={stats.pending} label="À traiter" color="#ef4444" />
        <StatCard icon={<Clock />} value={stats.inProgress} label="En cours" color="#3b82f6" />
        <StatCard icon={<CheckCircle />} value={stats.done} label="Terminées" color="#10b981" />
      </div>

      {/* TOOLBAR (Recherche + Filtres + Vues) */}
      <div className={styles.searchFiltersToolbar}>
        <div className={styles.searchContainer}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Rechercher une tâche ou un lieu..." 
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.viewToggle}>
          <button 
            className={`${styles.viewButton} ${filter === "pending" ? styles.viewButtonActive : ""}`} 
            onClick={() => setFilter("pending")}
          >
            Actives
          </button>
          <button 
            className={`${styles.viewButton} ${filter === "completed" ? styles.viewButtonActive : ""}`} 
            onClick={() => setFilter("completed")}
          >
            Historique
          </button>
        </div>

        <div className={styles.viewModeToggle}>
          <button onClick={() => setViewMode("list")} className={viewMode === "list" ? styles.viewModeButtonActive : styles.viewModeButton}><List size={20}/></button>
          <button onClick={() => setViewMode("grid")} className={viewMode === "grid" ? styles.viewModeButtonActive : styles.viewModeButton}><Grid size={20}/></button>
          <button onClick={() => setViewMode("calendar")} className={viewMode === "calendar" ? styles.viewModeButtonActive : styles.viewModeButton}><CalendarIcon size={20}/></button>
        </div>
      </div>

      {/* NOTIFICATIONS FLASH */}
      {success && <div className={styles.successBanner}><CheckCircle size={18}/> {success}</div>}
      {error && <div className={styles.urgentBanner}><AlertCircle size={18}/> {error}</div>}

      {/* CONTENT AREA */}
      <div className={styles.reclamationListContainer}>
        {itemsToShow.length === 0 ? (
          <div className={styles.reclamationEmpty}>
            <div className={styles.emptyIcon}>📂</div>
            <h3>Aucune réclamation trouvée</h3>
            <p>Modifiez vos filtres ou lancez une nouvelle recherche.</p>
          </div>
        ) : (
          <>
            {viewMode === "list" && <ReclamationListView items={itemsToShow} {...commonProps} />}
            {viewMode === "grid" && <ReclamationGridView items={itemsToShow} {...commonProps} />}
            {viewMode === "calendar" && <ReclamationCalendarView items={itemsToShow} {...commonProps} />}
          </>
        )}
      </div>

      {/* MODALES */}
      <ReclamationModal 
        showAddModal={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSubmit={loadData} 
      />

      <PauseReclamationModal 
        isOpen={showPauseModal}
        onClose={() => setShowPauseModal(false)}
        onSubmit={handleSubmitPause}
        task={selectedTask}
      />
    </div>
  );
};

// Composant Interne pour les cartes de stats
const StatCard = ({ icon, value, label, color }) => (
  <div className={styles.gamificationCard}>
    <div className={styles.gamificationCardIcon} style={{backgroundColor: `${color}15`, color}}>{icon}</div>
    <div className={styles.gamificationCardContent}>
      <div className={styles.gamificationCardValue}>{value}</div>
      <div className={styles.gamificationCardLabel}>{label}</div>
    </div>
  </div>
);

export default ReclamationEmployee;