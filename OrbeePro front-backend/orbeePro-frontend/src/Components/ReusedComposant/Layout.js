import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Notifications,
  Dashboard as DashboardIcon,
  People,
  Message,
  BarChart,
  CalendarToday,
  AccountBalance,
  School,
  EmojiEvents,
  TrendingUp,
  Menu as MenuIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import UserProfile from "../../BulleUser/BulleUser.js";
import DynamicLogo from "./AdminLayout/DynamicLogo.js"; 
// import { User2Icon } from "lucide-react";
import Header from "./Hearder/Header.js"
import MENU_CONFIG from './Routes.js'
import styles from'./style.js'


const CoachProDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState({ name: "", profileImage: "", role: "" });

  // 1. On récupère le rôle pour charger le bon menu
  const userRole = localStorage.getItem("userRole") || "client"; 
  const menuItems = MENU_CONFIG[userRole] || [];

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          name: `${parsedUser.prenom} ${parsedUser.nom}`,
          profileImage: parsedUser.profileImage,
          role: userRole,
          email: parsedUser.email,
        });
      } catch (e) {
        console.error("Erreur de parsing", e);
      }


    }
  }, [userRole]);



  const handleLogoClick = () => {
    const defaultPages = {
      admin: "/DashboardAdmin",
      maintenance: "/agent_maintenance",
      menage: "/TacheEmployee",
      client: "/EspaceClient"
    };
    navigate(defaultPages[userRole] || "/");
  };

 const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Fonction pour gérer la navigation
  const handleNavigation = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  // Vérifier si un item est actif
  const isActive = (path) => {
    if (path === "/dashboard") {
      return (
        location.pathname === "/dashboard" ||
        location.pathname === "/dashboard/"
      );
    }
    return location.pathname.startsWith(path);
  };

  return (
   <div style={styles.container}>
      {/* Overlay pour mobile */}
      {sidebarOpen && (
        <div style={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        style={{
          ...styles.sidebar,
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          ...(window.innerWidth > 768 ? { transform: "translateX(0)" } : {}),
        }}
      >
        {/* Close button pour mobile */}
        <button style={styles.closeBtn} onClick={() => setSidebarOpen(false)}>
          <CloseIcon />
        </button>

        {/* Logo Dynamique avec Alternance Automatique */}
        <div style={styles.logo}>
          <DynamicLogo
            imageSrc="/images/logoBlanc.png"
            videoSrc="/images/orbeepro.mp4"
            logoText="OrbeePro"
            size="large" // Taille plus grande : large ou xlarge
            imageDisplayDuration={8000} // Image affichée pendant 8 secondes
            videoDisplayDuration={12000} // Vidéo affichée pendant 12 secondes
            startWithImage={true} // Commence avec l'image
            autoSwitch={true} // Active l'alternance automatique
            onLogoClick={handleLogoClick}
          />
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              style={{
                ...styles.navItem,
                ...(isActive(item.path) ? styles.navItemActive : {}),
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={styles.navLabel}>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>


<Header user={user} toggleSidebar={setSidebarOpen}  onLogout={handleLogout} />

        {/* Outlet pour afficher les composants enfants */}
        <div style={styles.outletContainer}>
          <Outlet />
        </div>
      </main>
    </div>





  )
}
  export default CoachProDashboard; 