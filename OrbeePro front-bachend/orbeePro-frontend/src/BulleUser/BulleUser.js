import React, { useState, useEffect, useRef } from 'react';
import { 
  Logout as LogoutIcon, 
  Settings as SettingsIcon, 
  KeyboardArrowDown as ArrowIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { BASE_URL, UPLOADS_URL } from '../constants.js';
import { useNavigate } from 'react-router-dom';
import { styles } from './style.js';

const UserProfile = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate =useNavigate()
  const dropdownRef = useRef(null);



  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }  
    
    };

                
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const profileImageUrl = user?.profileImage 
    ? `${BASE_URL}${user.profileImage}` 
    : "https://i.pravatar.cc/40?img=default";
    
    
         
  return (
    <div style={styles.container} ref={dropdownRef}>
      {/* Trigger du Dropdown */}
      <div 
        style={{...styles.profileTrigger, border: isOpen ? '1px solid #FBBF24' : '1px solid #E5E7EB'}} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <img 
          src={profileImageUrl} 
          alt={user?.name} 
          style={styles.avatarImg}
          onError={(e) => { e.target.src = "https://i.pravatar.cc/40"; }}
        />
        <div style={styles.textContainer}>
          <span style={styles.userName}>{user?.name || 'Utilisateur'}</span>
          <span style={styles.userRole}>{user?.role || 'Admin'}</span>
        </div>
        <ArrowIcon style={{...styles.arrow, transform: isOpen ? 'rotate(180deg)' : 'rotate(0)'}} />
      </div>

      {/* Menu Déroulant */}
      {isOpen && (
        <div style={styles.dropdownMenu}>
          <div style={styles.menuHeader}>
            <p style={styles.emailLabel}>Connecté en tant que</p>
            <p style={styles.userEmail}>{user?.email || 'compte@orbeepro.com'}</p>
          </div>
          
          <div style={styles.divider} />

          <button style={styles.menuItem} onClick={() => navigate('/Email')}>
            <SettingsIcon style={styles.menuIcon} />
            <span>Paramètres</span>
          </button>

          <button style={styles.menuItem} onClick={() => navigate('/Email')}>
            <PersonIcon style={styles.menuIcon} />
            <span>Mon Profil</span>
          </button>

          <div style={styles.divider} />

          <button style={{...styles.menuItem, color: '#EF4444'}} onClick={onLogout}>
            <LogoutIcon style={styles.menuIcon} />
            <span style={{fontWeight: '600'}}>Déconnexion</span>
          </button>
        </div>
      )}
    </div>
  );
};

// =================== STYLES ===================

export default UserProfile;