import React from "react";
import { useLocation } from "react-router-dom";
import { Search, Notifications, Menu as MenuIcon } from "@mui/icons-material";
import ICON_User from "../../../BulleUser/BulleUser.js";

const Header = ({ user, toggleSidebar, onLogout }) => {
  const location = useLocation();

  // 1. Mapping des titres en fonction du chemin (path)
  const getTitle = () => {
    const path = location.pathname;
    if (path.includes("DashboardAdmin")) return "Tableau de bord Administrateur";
    if (path.includes("reclamations")) return " Gestion des Réclamations";
    if (path.includes("TachesAdmin")) return "Gestion des Tâches";
    if (path.includes("personnel")) return "Gestion du Personnel";
    if (path.includes("espaces")) return "Gestion des Espaces";
    if (path.includes("GestionFournisseurs")) return " Gestion des Fournisseurs";
    if (path.includes("Devis")) return "Gestion des Devis";
    if (path.includes("ChatAdmin")) return "Messagerie";
    if (path.includes("Email")) return "Paramètres Email";

     if (path.includes("Chat")) return "Chat";

// Partie employee
    if (path.includes("TacheEmployee")) return "Mes Tâches";
    if (path.includes("ReclamationEmployee")) return "Mes Réclamations";
    if (path.includes("ProfilePage")) return "Mon Profile";
    if (path.includes("CommandeEmployee")) return "Commandes";
    if (path.includes("Chat11")) return "ma boite des Messages";
    if (path.includes("DevisSQL")) return "Gestion des Devis";



    return "OrbeePro"; // Titre par défaut
  };

  return (
    <header style={styles.header}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Menu burger pour mobile */}
        <button style={styles.menuBtn} onClick={() => toggleSidebar(true)}>
          <MenuIcon />
        </button>

        <div>
          <p style={styles.greeting}>Bonjour, {user.name || user.nom} 👋</p>
          <h1 style={styles.title}>{getTitle()}</h1>
        </div>
      </div>

      <div style={styles.headerRight}>
        <div style={styles.searchBox}>
          <Search style={styles.searchIcon} />
          <input type="text" placeholder="Search..." style={styles.searchInput} />
        </div>
        
        <button style={styles.notifBtn}>
          <Notifications />
          <span style={styles.notifBadge}>3</span>
        </button>

        {/* Inclusion de UserProfile */}
        <ICON_User user={user} onLogout={onLogout} />
      </div>
    </header>
  );
};

// Récupère les styles spécifiques du header que tu avais dans ton fichier principal
const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    flexWrap: "wrap",
    gap: "16px",
  },
  greeting: {
    fontSize: "14px",
    color: "#6B7280",
    margin: "0 0 6px 0",
    fontWeight: "500",
  },
  title: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#1A1A1A",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  searchBox: { position: "relative", display: "flex", alignItems: "center" },
  searchIcon: { position: "absolute", left: "14px", color: "#9CA3AF", fontSize: "20px" },
  searchInput: {
    padding: "10px 16px 10px 44px",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    width: "220px",
    outline: "none",
  },
  notifBtn: {
    position: "relative",
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadge: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "#F59E0B",
    color: "#FFFFFF",
    fontSize: "10px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  menuBtn: {
    display: "none", // Sera géré par les media queries dans le parent ou ici
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    padding: "8px",
    cursor: "pointer",
  },
};

export default Header;