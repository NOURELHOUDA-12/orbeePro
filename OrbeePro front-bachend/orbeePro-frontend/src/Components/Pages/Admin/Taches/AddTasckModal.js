import React, { useEffect, useState } from "react";
import { X, Search } from "lucide-react";
import { API_URL } from "../../../../constants";
import { spaceService } from "../../../../services/EspaceServices";
import taskService from "../../../../services/taskService";
import Alert from "@mui/material/Alert";

const initialState = {
  staffId: "",
  taskType: "",
  espaceId: "",
  sousEspaceId: "",
  startTime: "",
  isRecurring: false,
  recurringType: "par semaine", // Valeur par défaut
  recurringDays: [],
  recurringDayOfMonth: 1,
  recurringMonthOfYear: 1,
  recurringStartDate: "",
  recurringEndDate: "",
  notes: "",
  date: new Date().toISOString().split("T")[0],
};

const AddTaskModal = ({ isOpen, onClose, task }) => {
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [formData, setFormData] = useState(initialState);
  const [espaces, setEspaces] = useState([]);
  const [sousEspaces, setSousEspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Synchronisation pour MODIFICATION ou AJOUT
  useEffect(() => {
    if (isOpen) {
      if (task) {
        setFormData({
          ...initialState,
          ...task,
          date: task.date
            ? new Date(task.date).toLocaleDateString("en-CA")
            : initialState.date,
        });
        // On cherche l'employé dans la liste pour l'afficher
        if (staffList.length > 0) {
          const staff = staffList.find(
            (s) => String(s.id) === String(task.staffId),
          );
          if (staff) setSelectedStaff(staff);
        }
      } else {
        setFormData(initialState);
        setSelectedStaff(null);
      }
    }
  }, [task, isOpen, staffList]);

  // 2. Chargement des données (Staff & Espaces)
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          const staffRes = await fetch(`${API_URL}/staff`);
          const staffData = await staffRes.json();
          if (staffData.success) setStaffList(staffData.data);

          const spaceData = await spaceService.getHierarchy();
          setEspaces(spaceData.espaces || []);
          setSousEspaces(spaceData.sousEspaces || []);
        } catch (error) {
          console.error("Erreur de chargement:", error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [isOpen]);




  if (!isOpen) return null;

  // Filtrage des sous-espaces
  const sousEspacesFiltres =
    formData.espaceId && sousEspaces.length > 0
      ? sousEspaces.filter(
          (se) => String(se.espaceParentId) === String(formData.espaceId),
        )
      : [];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectStaff = (staffMember) => {
    setSelectedStaff(staffMember);
    setFormData((prev) => ({ ...prev, staffId: staffMember.id }));
    setSearchQuery("");
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      const result = task?.id
        ? await taskService.update(task.id, formData)
        : await taskService.create(formData);

      if (result.success) {
        onClose();
      } else {
        alert("Erreur: " + result.message);
      }
    } catch (err) {
      console.error("Erreur lors de la soumission", err);
    }
  };


  const getInitials = (name) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "?";

  return (
    <div className="task-modal-overlay">
      <div className="task-modal">
        <div className="task-modal-header">
          <h2 className="task-modal-title">
            {task ? "Modifier la mission" : "Nouvelle Mission"}
          </h2>
          <button onClick={onClose} className="task-modal-close">
            <X size={24} />
          </button>
        </div>

        <div className="task-modal-body">


       {/* SÉLECTION EMPLOYÉ */}
          <div className="task-form-group">
            <label className="task-form-label">Employé</label>
            {selectedStaff ? (
              <div
                className="task-staff-item"
                style={{ border: "2px solid #667eea", borderRadius: "12px" }}
              >
                <div className="task-staff-avatar-placeholder-small">
                  {getInitials(selectedStaff.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="task-staff-name">{selectedStaff.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "#718096" }}>
                    {selectedStaff.position}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedStaff(null);
                    setFormData((p) => ({ ...p, staffId: "" }));
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#e53e3e",
                    cursor: "pointer",
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <>
                <div className="task-search-container">
                  <Search size={20} className="task-search-icon" />
                  <input
                    type="text"
                    className="task-search-input"
                    placeholder="Chercher un employé..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {searchQuery && (
                  <div className="task-staff-list">
                    {staffList
                      .filter((s) =>
                        s.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()),
                      )
                      .map((s) => (
                        <div
                          key={s.id}
                          className="task-staff-item"
                          onClick={() => handleSelectStaff(s)}
                        >
                          <div className="task-staff-avatar-placeholder-small">
                            {getInitials(s.name)}
                          </div>
                          <div className="task-staff-name">{s.name}</div>
                        </div>
                      ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="task-form-grid">
            <div className="task-form-group">
              <label className="task-form-label">Type de mission</label>
              <select
                name="taskType"
                className="task-form-select"
                value={formData.taskType}
                onChange={handleChange}
              >
                <option value="Nettoyage">Nettoyage</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Sécurité">Sécurité</option>
                <option value="Technique">Technique</option>
                <option value="Blanchisserie">Blanchisserie</option>
                <option value="Réception">Réception</option>
                <option value="Cuisine">Cuisine</option>
                <option value="Sécurité">Sécurité</option>
                <option value="Technique">Technique</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div className="task-form-group">
              <label className="task-form-label">Espace</label>
              <select
                name="espaceId"
                className="task-form-select"
                value={formData.espaceId}
                onChange={handleChange}
              >
                <option value="">Choisir...</option>
                {espaces.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formData.espaceId && sousEspacesFiltres.length > 0 && (
            <div className="task-form-group">
              <label className="task-form-label">Sous-espace (optionnel)</label>
              <select
                name="sousEspaceId"
                className="task-form-select"
                value={formData.sousEspaceId}
                onChange={handleChange}
              >
                <option value="">Sélectionner un sous-espace</option>
                {sousEspacesFiltres.map((se) => (
                  <option key={se.id} value={se.id}>
                    {se.nom || `Zone ${se.numero}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="task-form-grid">
            <div className="task-form-group">
              <label className="task-form-label">Heure</label>
              <input
                type="time"
                name="startTime"
                className="task-form-input"
                value={formData.startTime}
                onChange={handleChange}
              />
            </div>
            <div className="task-form-group">
              <label className="task-form-label">Date</label>
              <input
                type="date"
                name="date"
                className="task-form-input"
                value={formData.date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="task-form-group">
            <label className="task-checkbox-container">
              <input
                type="checkbox"
                name="isRecurring"
                checked={formData.isRecurring}
                onChange={handleChange}
              />
              <span className="task-checkbox-label">Tâche récurrente</span>
            </label>

            {formData.isRecurring && (
              <div
                style={{
                  animation: "fadeIn 0.3s ease",
                  background: "#f8fafc",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  marginTop: "1rem",
                }}>


                {/* Type de récurrence */}
                <div className="task-form-group">
                  <label className="task-form-label">Type de récurrence</label>
                  <select
                    name="recurringType"
                    value={formData.recurringType}
                    onChange={handleChange}
                    className="task-form-select"
                  >
                    <option value="daily">📅 Chaque jour</option>
                    <option value="par semaine">
                      📆 Chaque semaine (jours personnalisés)
                    </option>
                    <option value="monthly">
                      🗓️ Chaque mois (jour spécifique)
                    </option>
                    <option value="first_day_month">
                      📍 Premier jour du mois
                    </option>
                    <option value="last_day_month">
                      📍 Dernier jour du mois
                    </option>
                    <option value="yearly">🎂 Une fois par an</option>
                    <option value="between_dates">📊 Entre deux dates</option>
                  </select>
                </div>

                {/* Récurrence hebdomadaire - Sélection des jours */}
                {formData.recurringType === "par semaine" && (
                  <div className="task-form-group">
                    <label className="task-form-label">
                      Jours de la semaine
                    </label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: "0.5rem",
                      }}
                    >
                      {[
                        "lundi",
                        "mardi",
                        "mercredi",
                        "jeudi",
                        "vendredi",
                        "samedi",
                        "dimanche",
                      ].map((day) => {
                        const isSelected =
                          formData.recurringDays?.includes(day);
                        return (
                          <div
                            key={day}
                            onClick={() => {
                              const days = formData.recurringDays || [];
                              const newDays = isSelected
                                ? days.filter((d) => d !== day)
                                : [...days, day];
                              setFormData((prev) => ({
                                ...prev,
                                recurringDays: newDays,
                              }));
                            }}
                            style={{
                              padding: "0.5rem",
                              border: "2px solid",
                              borderColor: isSelected ? "#667eea" : "#e2e8f0",
                              borderRadius: "8px",
                              textAlign: "center",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                              background: isSelected
                                ? "rgba(102, 126, 234, 0.1)"
                                : "white",
                              color: isSelected ? "#667eea" : "#718096",
                              fontWeight: isSelected ? "bold" : "normal",
                            }}
                          >
                            {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Récurrence mensuelle / Annuelle */}
                {(formData.recurringType === "monthly" ||
                  formData.recurringType === "yearly") && (
                  <div className="task-form-group">
                    <label className="task-form-label">
                      Jour du mois (1-31)
                    </label>
                    <input
                      type="number"
                      name="recurringDayOfMonth"
                      min="1"
                      max="31"
                      value={formData.recurringDayOfMonth}
                      onChange={handleChange}
                      className="task-form-input"
                    />
                  </div>
                )}

                {/* Dates spécifiques pour "Entre deux dates" */}
                {formData.recurringType === "between_dates" && (
                  <div className="task-form-grid">
                    <div className="task-form-group">
                      <label className="task-form-label">Début</label>
                      <input
                        type="date"
                        name="recurringStartDate"
                        value={formData.recurringStartDate}
                        onChange={handleChange}
                        className="task-form-input"
                      />
                    </div>
                    <div className="task-form-group">
                      <label className="task-form-label">Fin</label>
                      <input
                        type="date"
                        name="recurringEndDate"
                        value={formData.recurringEndDate}
                        onChange={handleChange}
                        className="task-form-input"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="task-form-group">
            <label className="task-form-label">Notes / Instructions</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="task-form-textarea"
              placeholder="Détails de la mission..."
            />
          </div>
        </div>

        <div className="task-modal-footer">
          <button onClick={onClose} className="task-button task-button-cancel">
            Annuler
          </button>
          <button
            className="task-button task-button-submit"
            onClick={handleSubmit}
          >
            {task ? "Enregistrer les modifications" : "Créer la tâche"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;
