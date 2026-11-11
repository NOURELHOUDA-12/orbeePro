import React from "react";
import "./reclamationModal.css"; 

// Mapping des agents par catégorie
const agentsParCategorie = {
  "Climatisation": "Ali",
  "Plomberie": "Mona",
  "Électricité": "Karim",
  "Autre": "Sami",
};

// Mapping couleur badges statut
const statusColors = {
  pending: "#fff3cd",
  "in-progress": "#d1ecf1",
  completed: "#d4edda",
};

// Mapping couleur badges urgence
const urgencyColors = {
  low: "#27ae60",
  medium: "#f39c12",
  high: "#e74c3c",
};

const ReclamationCard = ({ reclamation }) => {
  const agent = agentsParCategorie[reclamation.categorie] || "Non assigné";

  return (
    <div className="reclamation-card">
      <div className="reclamation-header">
        <h3>Chambre {reclamation.roomNumber}</h3>
        <span
          className="reclamation-status"
          style={{
            backgroundColor: statusColors[reclamation.status],
            color: "#000",
          }}
        >
          {reclamation.status === "pending"
            ? "En attente"
            : reclamation.status === "in-progress"
            ? "En cours"
            : "Terminé"}
        </span>
      </div>

      <p><strong>Problème :</strong> {reclamation.problem}</p>
      <p><strong>Catégorie :</strong> {reclamation.categorie}</p>
      <p><strong>Agent assigné :</strong> {agent}</p>
      <p><strong>Créé par :</strong> {reclamation.createdBy?.name}</p>
      <p><strong>Date :</strong> {new Date(reclamation.createdAt).toLocaleString()}</p>
      <p>
        <strong>Urgence :</strong>{" "}
        <span
          style={{
            backgroundColor: urgencyColors[reclamation.urgency],
            color: "#fff",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "0.8rem",
          }}
        >
          {reclamation.urgency}
        </span>
      </p>

      {reclamation.photos && reclamation.photos.length > 0 && (
        <div className="reclamation-photos">
          {reclamation.photos.map((photo, index) => (
            <img
              key={index}
              src={photo}
              alt={`Photo ${index + 1}`}
              style={{ width: "100px", height: "100px", marginRight: "0.5rem", borderRadius: "8px", objectFit: "cover" }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const AdminReclamations = ({ reclamations }) => {
  return (
    <div className="admin-reclamations">
      {reclamations.length === 0 ? (
        <p>Aucune réclamation pour le moment.</p>
      ) : (
        reclamations.map((rec, idx) => <ReclamationCard key={idx} reclamation={rec} />)
      )}
    </div>
  );
};




export default AdminReclamations;
