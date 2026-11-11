import React from 'react';
import { Search, Calendar, LayoutList, LayoutGrid, Plus, Printer } from "lucide-react";



const TaskHeader = ({
  searchQuery,
  setSearchQuery,
  timeFilter,
  setTimeFilter,
  selectedDate,
  setSelectedDate,
  viewMode,
  setViewMode,

  handlePrintPDF,
  showDatePicker,
  setShowDatePicker
}) => {
  return (
    <header className="task-manager-header" style={{ padding: "1rem 1.5rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "nowrap",
          gap: "1rem",
        }}
      >
        {/* 1. BARRE DE RECHERCHE */}
        <div className="task-search-container" style={{ flex: 1, minWidth: "200px" }}>
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

        {/* 2. FILTRES DE TEMPS */}
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

        {/* 3. NAVIGATION DATE */}
        {timeFilter === "jour" && (
          <div style={{ display: "flex", gap: "0.25rem", alignItems: "center", flexShrink: 0 }}>
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
          }}
        >
          <span>Imprimer</span>
          <Printer size={18} />
        </button>
      </div>
    </header>
  );
};

export default TaskHeader;