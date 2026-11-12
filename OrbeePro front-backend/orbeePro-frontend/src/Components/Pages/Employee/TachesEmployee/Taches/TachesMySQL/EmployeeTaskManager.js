import React, { useState, useEffect, useCallback } from "react";
import EmployeeStats from "./EmployeeStats";
import EmployeeListeTasks from "./EmployeeListeTasks";
import { taskService } from "../../../../../../services/taskService.js";
import { useAuth } from "../../../../../../context/Auth";
import {
  Loader,
  WifiOff,
  AlertCircle,
  Calendar as CalendarIcon,
} from "lucide-react";
import styles from "../../../../Admin/Taches/styleTaches";
import TaskHeader from "./TaskHeader";
import { Printer } from "lucide-react";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";

const EmployeeTaskManager = () => {
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [viewMode, setViewMode] = useState("compact");
  const [showModal, setShowModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [allTasks, setAllTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [currentFilter, setCurrentFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

    const tableColumn = [
      "Date",
      "Employé",
      "Mission",
      "Lieu",
      "Heure",
      "Statut",
    ];
    const tableRows = filteredTasks.map((t) => [
      t.date,
      t.staffNom || "Non assigné",
      t.taskType,
      t.espaceNom,
      t.startTime || "--:--",
      t.status === "completed" ? "Terminé" : "En cours",
    ]);

    // ✅ UTILISATION DE LA FONCTION autoTable(doc, options)

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: "grid",
      headStyles: { fillColor: [102, 126, 234] },
      styles: { fontSize: 8 },
    });

    doc.save(`Planning_${selectedDate}_${searchQuery || "global"}.pdf`);
  };

  const loadEmployeeTasks = useCallback(async () => {
    if (!currentUser?.id) return;

    setLoading(true);
    try {
      const data = await taskService.getAll();
      if (data.success) {
        // Filtrer pour ne garder que les tâches assignées à cet employé
        const myTasks = data.tasks.filter((t) => t.staffId === currentUser.id);
        setAllTasks(myTasks);
        applyFilter(myTasks, currentFilter);
      }
    } catch (err) {
      console.error("Erreur MySQL:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, currentFilter]);

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
        const taskDateFormatted = new Date(t.date).toLocaleDateString("en-CA");

        
        return taskDateFormatted === selectedDate;
      });

      
    } else if (timeFilter === "semaine") {
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

  useEffect(() => {
    if (currentUser) loadEmployeeTasks();
  }, [currentUser, loadEmployeeTasks]);

  const applyFilter = (tasks, filter) => {
    if (filter === "all") {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter((t) => t.status === filter));
    }
  };

  // j'ai ajouter cette fonction pour que je puisse mettre à jour la liste des tâches après une action (comme terminer ou reprendre une tâche) sans devoir recharger toute la page. Elle met à jour localement le statut de la tâche dans le state, puis recharge les tâches depuis la base pour s'assurer que tout est à jour.

  const handleLocalTaskUpdate = (taskId, newStatus) => {
    setAllTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task,
      ),
    );
    loadEmployeeTasks();
  };

  if (!currentUser) {
    return (
      <div className="task-manager-container">
        <style>{styles}</style>
        <div className="task-manager-header">
          <div className="task-empty">
            <AlertCircle size={48} color="#dc2626" />
            <div className="task-empty-title">Accès non autorisé</div>
            <p>Veuillez vous connecter pour voir votre planning.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="task-manager-container">
      <style>{styles}</style>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Banner Offline */}
        {!isOnline && (
          <div
            className="urgent-task-banner"
            style={{
              background: "#718096",
              color: "white",
              padding: "10px",
              borderRadius: "12px",
              marginBottom: "10px",
              display: "flex",
              gap: "10px",
            }}
          >
            <WifiOff size={20} /> Mode hors-ligne
          </div>
        )}

        <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
          <TaskHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            viewMode={viewMode}
            setViewMode={setViewMode}
            setShowModal={setShowModal}
            handlePrintPDF={handlePrintPDF}
            showDatePicker={showDatePicker}
            setShowDatePicker={setShowDatePicker}
          />

          <EmployeeStats
            tasks={allTasks}
            activeFilter={currentFilter}
            onFilterClick={(f) => {
              setCurrentFilter(f);
              applyFilter(allTasks, f);
            }}
          />

          <main style={{ marginTop: "2rem" }}>
            {loading ? (
              <div className="task-loading">
                <Loader className="animate-spin" />
                <p>Mise à jour de la base de données...</p>
              </div>
            ) : (
              <EmployeeListeTasks
                tasks={filteredTasks}
                onActionSuccess={handleLocalTaskUpdate}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default EmployeeTaskManager;
