import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle,
  Repeat,
  Play,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  LayoutList,
  LayoutGrid,
  Search,
  User,
  MapPin,
} from "lucide-react";
import styles from "./styleTaches.js";
import AddTaskModal from "./AddTasckModal.js";
import { taskService } from "../../../../services/taskService.js";
import Stats from "./Stats.js";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Printer } from "lucide-react";
import autoTable from "jspdf-autotable";
import {BASE_URL} from '../../../../constants.js';


const Filtre =({ tasksFromParent = [], onFilterChange }) => {
  // --- ÉTATS ---
  const [allTasks, setAllTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [timeFilter, setTimeFilter] = useState("tout");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [viewMode, setViewMode] = useState("compact");
  const [currentFilter, setCurrentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState(""); 
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expandedEmployees, setExpandedEmployees] = useState(new Set());
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [taskToEdit, setTaskToEdit] = useState(null);


useEffect(() => {
  setAllTasks(tasksFromParent);
}, [tasksFromParent]);  


  // Fonction pour ouvrir en mode ÉDITION
  const handleOpenEdit = (task) => {
    setTaskToEdit(task); // On charge la tâche sélectionnée
    setShowModal(true);
  };


  // --- LOGIQUE FILTRAGE (TEMPS + STATUT + RECHERCHE) ---
  useEffect(() => {
    let tempTasks = [...allTasks];
    const dateRef = new Date(selectedDate);

    // 1. Filtre par recherche (Nom de l'employé)
    if (searchQuery.trim() !== "") {
      tempTasks = tempTasks.filter(
        (t) =>
          t.staffNom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.taskType?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

// 2. Filtre temporel

if (timeFilter === "jour") {
  tempTasks = tempTasks.filter((t) => {
    if (!t.date) return false;

    // On transforme la date de la base (objet ou string ISO) 
    // en format texte pur : "2026-02-14"
    const taskDateFormatted = new Date(t.date).toLocaleDateString('en-CA');
    
    // Debug pour voir la comparaison dans la console
    
    return taskDateFormatted === selectedDate;
  });

  
}

    else if (timeFilter === "semaine") {
      const start = new Date(dateRef);
      start.setDate(
        dateRef.getDate() - (dateRef.getDay() === 0 ? 6 : dateRef.getDay() - 1),
      );
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      tempTasks = tempTasks.filter((t) => {
        const d = new Date(t.date);
        return (
          d >= start.setHours(0, 0, 0, 0) && d <= end.setHours(23, 59, 59, 999)
        );
      });
    } else if (timeFilter === "mois") {
      tempTasks = tempTasks.filter((t) => {
        const d = new Date(t.date);
        return (
          d.getMonth() === dateRef.getMonth() &&
          d.getFullYear() === dateRef.getFullYear()
        );
      });
    }

    // 3. Filtre de statut (Stats)
    if (currentFilter !== "all") {
      tempTasks = tempTasks.filter((t) => t.status === currentFilter);
    }

    setFilteredTasks(tempTasks);
  }, [allTasks, timeFilter, selectedDate, currentFilter, searchQuery]);



  const handleDelete = async (id) => {
if (!id) {
    console.error("Erreur : l'ID est undefined !");
    return;
  }

  const confirmDelete = window.confirm("Êtes-vous sûr de vouloir supprimer cette mission ?");
  if (!confirmDelete) return;

  try {
    const result = await taskService.delete(id);
    if (result.success) {

      alert("Suppression effectuée avec succès !");
    } else {
      alert("Erreur lors de la suppression : " + result.message);
    }
  } catch (err) {
    console.error("Erreur lors de la suppression", err);
    alert("Impossible de contacter le serveur.");
  }
};


  const handlePrintPDF = () => {
  const doc = new jsPDF();
  

  
  let reportTitle = "Rapport de Missions";
  if (timeFilter === "jour") reportTitle += ` - Journée du ${selectedDate}`;
  if (searchQuery) reportTitle += ` - Staff: ${searchQuery}`;

  doc.setFontSize(18);
  doc.text(reportTitle, 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Document généré le ${new Date().toLocaleString()}`, 14, 28);

  const tableColumn = ["Date", "Employé", "Mission", "Lieu", "Heure", "Statut"];
  const tableRows = filteredTasks.map(t => [
    t.date,
    t.staffNom || "Non assigné",
    t.taskType,
    t.espaceNom,
    t.startTime || "--:--",
    t.status === 'completed' ? "Terminé" : "En cours"
  ]);

  // ✅ UTILISATION DE LA FONCTION autoTable(doc, options)
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 35,
    theme: 'grid',
    headStyles: { fillColor: [102, 126, 234] }, 
    styles: { fontSize: 8 }
  });

  doc.save(`Planning_${selectedDate}_${searchQuery || 'global'}.pdf`);
};





  // --- GROUPEMENT ---
  const groupedTasks = useMemo(() => {
    const groups = {};
    filteredTasks.forEach((task) => {
      const empId = task.staffId || "unassigned";
      if (!groups[empId]) {
        groups[empId] = {
          employee: {
            id: empId,
            name: task.staffNom,
            position: task.role,
            imageUrl: task.staffImage,
          },
          tasks: [],
        };
      }
      groups[empId].tasks.push(task);
    });
    return Object.values(groups);
  }, [filteredTasks]);

  // --- HANDLERS ---
  const toggleEmployeeExpansion = (id) => {
    const newSet = new Set(expandedEmployees);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpandedEmployees(newSet);
  };

  const getInitials = (n) =>
    n
      ? n
          .split(" ")
          .map((i) => i[0])
          .join("")
          .toUpperCase()
      : "?";

  return (
    <div className="task-manager-container">
      <style>{styles}</style>

      <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
        {/* HEADER */}
        <header
          className="task-manager-header"
          style={{ padding: "1rem 1.5rem" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "nowrap", // On force la ligne unique sur grand écran
              gap: "1rem",
            }}
          >
            {/* 1. BARRE DE RECHERCHE (Prend l'espace restant) */}
            <div
              className="task-search-container"
              style={{ flex: 1, minWidth: "200px" }}
            >
              <Search size={18} className="task-search-icon" />
              <input
                type="text"
                className="task-search-input"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            {/* 2. FILTRES DE TEMPS (Jour, Semaine...) */}
            <div className="task-view-toggle" style={{ flexShrink: 0 }}>
              {["jour", "semaine", "mois", "tout"].map((f) => (
                <button
                  key={f}
                  className={`task-view-button ${timeFilter === f ? "active" : ""}`}
                  onClick={() => setTimeFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* 3. NAVIGATION DATE (S'affiche uniquement pour "Jour") */}
            {timeFilter === "jour" && (
              <div
                style={{
                  display: "flex",
                  gap: "0.25rem",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <button
                  className="date-nav-btn"
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() - 1);
                    setSelectedDate(d.toISOString().split("T")[0]);
                  }}
                >
                  ◀
                </button>
                <button
                  className="date-display-btn"
                  style={{ minWidth: "140px" }}
                  onClick={() => setShowDatePicker(!showDatePicker)}
                >
                  <Calendar size={14} />{" "}
                  {new Date(selectedDate).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </button>
                <button
                  className="date-nav-btn"
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() + 1);
                    setSelectedDate(d.toISOString().split("T")[0]);
                  }}
                >
                  ▶
                </button>
              </div>
            )}

            {/* 4. TOGGLE VUE (Liste/Grille) */}
            <div className="task-view-toggle" style={{ flexShrink: 0 }}>
              <button
                className={`task-view-button ${viewMode === "compact" ? "active" : ""}`}
                onClick={() => setViewMode("compact")}
              >
                <LayoutList size={18} />
              </button>
              <button
                className={`task-view-button ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid size={18} />
              </button>
            </div>



            {/* 5. BOUTON ACTION */}
            <button
              onClick={() => setShowModal(true)}
              className="task-add-button"
              style={{
                flexShrink: 0,
                padding: "0.6rem 1rem",
                whiteSpace: "nowrap",
              }}
            >
              <Plus size={18} /> Taches  
            </button>

<button
  onClick={handlePrintPDF}
  className="task-add-button"
  style={{
    flexShrink: 0,
    padding: "0.6rem 1rem",
    whiteSpace: "nowrap",
    background: "linear-gradient(90deg, #f59e0b, #d97706)", 
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginRight: "8px"
  }}
>
  <span>Imprimer</span>
  <Printer size={18} />
</button>

          </div>
        </header>

        {/* STATS SECTION */}
        <Stats
          tasks={filteredTasks}
          onFilterClick={setCurrentFilter}
          activeFilter={currentFilter}
        />

        {/* LISTING SECTION */}
        <main style={{ marginTop: "2rem" }}>
          {filteredTasks.length === 0 ? (
            <div
              className="task-empty"
              style={{
                background: "white",
                borderRadius: "24px",
                padding: "5rem",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
              }}
            >
              <Search
                size={48}
                color="#cbd5e0"
                style={{ marginBottom: "1rem" }}
              />
              <div className="task-empty-title">Aucun résultat</div>
              <p>
                Aucune tâche ne correspond à votre recherche ou à vos filtres.
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    marginTop: "1.5rem",
                    background: "none",
                    border: "1px solid #667eea",
                    color: "#667eea",
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Effacer la recherche
                </button>
              )}
            </div>
          ) : timeFilter === "mois" ? (
            /* VUE MOIS - GROUPÉE PAR STAFF */
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              {
              
              groupedTasks.map((group) => (
                <div
                  key={group.employee.id}
                  className="employee-group"
                  style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}
                >
                  <div
                    className="employee-group-header"
                    onClick={() => toggleEmployeeExpansion(group.employee.id)}
                  >
                    {group.employee.imageUrl ? (
                      <img
                        src={`${BASE_URL}${group.employee.profileImage}`}
                        className="employee-group-avatar"
                        alt=""
                      />
                    ) : (
                      <div className="employee-group-avatar-placeholder">
                        {getInitials(group.employee.name)}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div className="employee-group-name">
                        {group.employee.name}
                        <span style={{ marginLeft: "10px", opacity: 0.7 }}>
                          {expandedEmployees.has(group.employee.id) ? (
                            <ChevronUp size={20} />
                          ) : (
                            <ChevronDown size={20} />
                          )
                          }


                        </span>
                      </div>
                      <div className="employee-group-position">
                        {group.employee.position || "Agent de service"}
                      </div>
                    </div>
                    <div className="employee-group-stat">
                      <div className="employee-group-stat-value">
                        {group.tasks.length}
                      </div>
                      <div className="employee-group-stat-label">Missions</div>
                    </div>
                  </div>
                  {expandedEmployees.has(group.employee.id) && (
                    <div className="employee-group-body">
                      <div className="task-grid">
                        {group.tasks.map((task) => (
                          <TaskCard key={task.id} task={task}  handleOpenEdit={handleOpenEdit}/>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* VUE JOUR / SEMAINE */
            <div
              className={
                viewMode === "grid" ? "task-grid" : "task-compact-list"
              }
            >
              {filteredTasks.map((task) =>
                viewMode === "grid" ? (
                  <TaskCard key={task.id} 
                  task={task} handleOpenEdit={handleOpenEdit}
                  handleDelete={() => handleDelete(task.id)} />
                ) : (
                  <CompactTaskItem
                    key={task.id}
                    task={task}
                    isExpanded={expandedTasks.has(task.id)}
                    onToggle={() => {
                      const newSet = new Set(expandedTasks);
                      newSet.has(task.id)
                        ? newSet.delete(task.id)
                        : newSet.add(task.id);
                      setExpandedTasks(newSet);
                    }}
                    handleOpenEdit={handleOpenEdit}
                    handleDelete={handleDelete}
                  />
                ),
              )}
            </div>
          )}
        </main>
      </div>




 
     {/* Dans le return de Filtre.js */}
<AddTaskModal 
  isOpen={showModal} 
  onClose={() => {
    setShowModal(false);
    setTaskToEdit(null); // On remet à zéro à la fermeture
    // loadTasks(); // On rafraîchit la liste
  }} 
  task={taskToEdit} // <--- On envoie la tâche à modifier ici
/>




    </div>
  );
};



// --- SOUS-COMPOSANTS ---

const TaskCard = ({ task ,handleOpenEdit}) => (



  <div className="task-card">
    <div className={`task-status-bar task-status-${task.status}`} />
    <div className="task-card-content">
      <div className="task-employee-header">
       
        {task.profileImage ? (
          <img 
    src={`${BASE_URL}${task.profileImage}`} 
    className="task-compact-avatar" 
    alt={task.staffNom} 
    onError={(e) => { e.target.style.display = 'none'; }}
   />      
        ) : (
          <div className="task-compact-avatar-placeholder">
            {task.staffNom ? task.staffNom[0].toUpperCase() : "?"}
          </div>
        )}

        <div style={{ flex: 1 }}>
          <div className="task-employee-name">
            {task.staffNom || "Non assigné"}
          </div>
          <div className="task-employee-room">
            <MapPin size={12} /> {task.espaceNom || "Espace inconnu"}
            <di></di>
            <MapPin size={12} /> {task.sousEspaceNom || "sousEspaceNom inconnu"}
          </div>
        </div>

        {task.isRecurring && (
          <div className="task-recurring-badge">
            <Repeat size={14} />
          </div>
        )}
      </div>
      <div className="task-type-badge">{task.taskType}</div>
      <div className="task-info-row">
        <Clock size={16} className="task-info-label" />
        <span className="task-info-value">{task.startTime}</span>
      </div>
      <div
        className={`task-status-badge task-status-${task.status}-badge`}
        style={{ marginTop: "1rem" }}
      >
        {task.status === "completed" ? (
          <CheckCircle size={14} />
        ) : (
          <Clock size={14} />
        )}
        <span>
          {task.status === "completed"
            ? "Terminée"
            : task.status === "in-progress"
              ? "En cours"
              : "À faire"}
        </span>
      </div>
      <div
        className="task-actions"
        style={{
          borderTop: "1px solid #f1f5f9",
          paddingTop: "1rem",
          marginTop: "1rem",
        }}
      >
        <button
          className="task-action-button task-action-edit"
          onClick={() => handleOpenEdit(task)} // <--- Déclenche l'ouverture
        >
          <Edit size={14} /> Modifier
        </button>

        <button className="task-action-button task-action-delete">
          <Trash2 size={14} />
        </button>
      </div>
      
    </div>
  </div>
);

const CompactTaskItem = ({ task, isExpanded, onToggle,handleOpenEdit ,handleDelete={handleDelete}}) => (
  <div style={{ borderBottom: "1px solid #f1f5f9" }}>
    <div className="task-compact-item" onClick={onToggle}>



     
      {task.profileImage ? (
        <img     src={`${BASE_URL}${task.profileImage}`} 

         className="task-compact-avatar" alt="" />
      ) : (
        <div className="task-compact-avatar-placeholder">
          {task.staffNom ? task.staffNom[0].toUpperCase() : "?"}
        </div>
      )}

     
      <div className="task-compact-info">
        <div className="task-compact-header">
          <span className="task-compact-name">{task.staffNom}</span>
          <span className="task-compact-type">{task.taskType}</span>
        </div>

        <div className="task-employee-room">
          <MapPin size={12} />
          espace : {task.espaceNom || "Espace inconnu"}
          <di></di>
          <MapPin size={12} /> sous espace{" "}
          {task.sousEspaceNom || "sousEspaceNom inconnu"}
        </div>

        <div className="task-compact-details">
          <div className="task-compact-detail">
            <Clock size={14} /> {task.startTime}
          </div>
          {/* <div className="task-compact-detail"><MapPin size={14} /> {task.espaceNom}</div> */}
        </div>
      </div>
      <div className={`task-compact-status ${task.status}`}>
        {task.status === "completed" ? "Terminée" : "Active"}
      </div>
      <button className="task-compact-expand">
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
    </div>
    {isExpanded && (
      <div
        className="task-expanded-content"
        style={{
          background: "#f8fafc",
          padding: "1.5rem 1.5rem 1.5rem 4.5rem",
        }}
      >
        <div className="task-expanded-notes">
          <h5
            style={{
              margin: "0 0 0.5rem 0",
              fontSize: "0.8rem",
              color: "#94a3b8",
            }}
          >
            NOTES & INSTRUCTIONS
          </h5>
          {task.notes || "Aucune consigne particulière."}
        </div>
        <div className="task-actions">
          <button
            className="task-action-button task-action-edit"
            onClick={() => handleOpenEdit(task)} // <--- Déclenche l'ouverture
          >
            <Edit size={14} /> Modifier
          </button>
          
          {" "}
          <button className="task-action-button task-action-delete"
                      onClick={() => handleDelete(task.id)} // <--- Déclenche l'ouverture

>
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      </div>
    )}
  </div>
);

export default Filtre;
