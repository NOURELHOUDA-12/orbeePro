import React from 'react'; 
import { Brush, Bell, User, LayoutDashboard, Settings } from 'lucide-react';
import {
  Dashboard as DashboardIcon,
  People,
  Message,Inventory,
  BarChart,
  CalendarToday,
  AccountBalance,
  School,
  EmojiEvents,
  TrendingUp,Business,ReportProblem
} from "@mui/icons-material";

export const MENU_CONFIG = {
  admin: [
    { id: "dashboard", label: "Dashboard", icon: <DashboardIcon />, path: "/DashboardAdmin" },
    { id: "reclamations", label: "Réclamations", icon: <People />, path: "/AdminReclamations" },
    { id: "taches", label: "Tâches", icon: <Message />, path: "/TachesAdmin" },
    { id: "personnel", label: "Personnels", icon: <BarChart />, path: "/personnel" },
    { id: "espaces", label: "Espaces", icon: <CalendarToday />, path: "/espaces" },

   
    { id: "chat", label: "Chat", icon: <School />, path: "/Chat" },
    { id: "params", label: "Email", icon: <EmojiEvents />, path: "/Email" },
    { id: "devis", label: "Devis", icon: <TrendingUp />, path: "/Devis" },
  ],
  maintenance: [
    // Utilisation de <Bell /> au lieu de Bell pour corriger l'erreur
    { id: "interv", label: "Interventions", path: "/agent_maintenance", icon: <Bell size={20} /> },
    { id: "reclam", label: "Réclamations", path: "/ReclamationEmployee", icon: <Bell size={20} /> },
    { id: "devis", label: "DEVIS SQL", icon: <TrendingUp />, path: "/Devis" },

  ],
  menage: [
     { id: "taches_2", label: "Tâches ", path: "/TacheEmployeemysql", icon: <Brush size={20} /> },

        { id: "rec", label: "Mes reclamtions", path: "/ReclamationEmployee", icon: <ReportProblem size={20} /> },
        { id: "devis", label: "Devis", icon: <TrendingUp />, path: "/Devis" },

    { id: "profile", label: "Mon Profile", path: "/ProfilePage", icon: <People size={20} /> },
    { id: "chat_emp", label: "chat", path: "/Chat", icon: <Message size={20} /> },

 


  ],
  client: [
    { id: "client_dash", label: "Mon Espace", path: "/EspaceClient", icon: <LayoutDashboard size={20} /> },
    { id: "client_profile", label: "Mon Profil", path: "/profil", icon: <User size={20} /> },
  ]
};

export default MENU_CONFIG;