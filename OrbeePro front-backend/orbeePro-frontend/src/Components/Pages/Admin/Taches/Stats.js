import React from "react";

const Stats = ({ tasks = [], activeFilter, onFilterClick = () => {} }) => {
  
  const stats = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  const getCardStyle = (type) => ({
    cursor: "pointer",
    border: activeFilter === type ? "2px solid #667eea" : "2px solid transparent",
    backgroundColor: activeFilter === type ? "#f8faff" : "white",
    transform: activeFilter === type ? "scale(1.02)" : "scale(1)",
    transition: "all 0.2s ease-in-out",
  });

  
  return (
    <div className="task-stats">
      <div className="task-stat-card" style={getCardStyle("all")} onClick={() => onFilterClick("all")}>


        <div className="task-stat-value">{stats.all}</div>
        <div className="task-stat-label">Total</div>
      </div>

      <div className="task-stat-card" style={getCardStyle("pending")} onClick={() => onFilterClick("pending")}>
        <div className="task-stat-value" style={{ color: "#f59e0b" }}>{stats.pending}</div>
        <div className="task-stat-label">En attente</div>
      </div>

      <div className="task-stat-card" style={getCardStyle("in-progress")} onClick={() => onFilterClick("in-progress")}>
        <div className="task-stat-value" style={{ color: "#3b82f6" }}>{stats["in-progress"]}</div>
        <div className="task-stat-label">En cours</div>
      </div>

      <div className="task-stat-card" style={getCardStyle("completed")} onClick={() => onFilterClick("completed")}>
        <div className="task-stat-value" style={{ color: "#10b981" }}>{stats.completed}</div>
        <div className="task-stat-label">Terminées</div>
      </div>
    </div>
  );
};

export default Stats;