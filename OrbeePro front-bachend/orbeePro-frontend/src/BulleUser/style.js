export const styles = {
  container: {
    position: 'relative', // Crucial pour le positionnement absolu du menu
  },
  profileTrigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '4px 10px',
    borderRadius: '14px',
    background: '#FFFFFF',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    userSelect: 'none',
  },
  avatarImg: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    objectFit: 'cover',
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginRight: '5px'
  },
  userName: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#1A1A1A',
  },
  userRole: {
    fontSize: '10px',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  arrow: {
    fontSize: '18px',
    color: '#9CA3AF',
    transition: 'transform 0.3s ease'
  },
  dropdownMenu: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    right: 0,
    width: '200px',
    background: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    border: '1px solid #F3F4F6',
    overflow: 'hidden',
    zIndex: 1000,
    padding: '8px',
    animation: 'slideUp 0.2s ease'
  },
  menuHeader: {
    padding: '10px 12px',
  },
  emailLabel: {
    fontSize: '10px',
    color: '#9CA3AF',
    margin: 0,
  },
  userEmail: {
    fontSize: '12px',
    color: '#374151',
    fontWeight: '600',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  divider: {
    height: '1px',
    background: '#F3F4F6',
    margin: '4px 0'
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '10px 12px',
    border: 'none',
    background: 'transparent',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#4B5563',
    textAlign: 'left',
    transition: 'background 0.2s',
    '&:hover': {
      background: '#F9FAFB'
    }
  },
  menuIcon: {
    fontSize: '18px'
  }
};



