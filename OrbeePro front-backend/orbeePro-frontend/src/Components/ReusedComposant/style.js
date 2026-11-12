export const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 100%)",
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    position: "relative",
  },

  // OVERLAY MOBILE
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    zIndex: 999,
    display: "none",
    "@media (max-width: 768px)": {
      display: "block",
    },
  },

  // SIDEBAR
  sidebar: {
    width: "260px", // Légèrement plus large pour accueillir le logo plus grand
    background: "#1A1A1A",
    borderRight: "1px solid #2A2A2A",
    padding: "24px 12px",
    display: "flex",
    flexDirection: "column",
    position: "sticky",
    top: 0,
    height: "100vh",
    overflowY: "auto",
    zIndex: 1000,
    transition: "transform 0.3s ease",
  },

  // Close button mobile
  closeBtn: {
    display: "none",
    position: "absolute",
    top: "20px",
    right: "20px",
    background: "transparent",
    border: "none",
    color: "#9CA3AF",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "8px",
    transition: "all 0.2s ease",
  },

  // Menu burger mobile
  menuBtn: {
    display: "none",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    padding: "8px",
    cursor: "pointer",
    color: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    marginBottom: "28px",
    paddingBottom: "20px",
    borderBottom: "1px solid rgba(245, 158, 11, 0.15)",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "none",
    background: "transparent",
    color: "#9CA3AF",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    textAlign: "left",
    width: "100%",
  },
  navItemActive: {
    background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    color: "#FFFFFF",
    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)",
  },
  navIcon: {
    display: "flex",
    alignItems: "center",
    fontSize: "20px",
  },
  navLabel: {
    flex: 1,
  },

  // MAIN
  main: {
    flex: 1,
    padding: "32px",
    overflowY: "auto",
    minWidth: 0,
  },

  // HEADER
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
  searchBox: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: "14px",
    color: "#9CA3AF",
    fontSize: "20px",
    pointerEvents: "none",
  },
  searchInput: {
    padding: "10px 16px 10px 44px",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    fontSize: "14px",
    outline: "none",
    width: "220px",
    transition: "all 0.2s ease",
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
    color: "#1A1A1A",
    transition: "all 0.2s ease",
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
  userAvatar: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "6px 12px 6px 6px",
    borderRadius: "12px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    cursor: "pointer",
  },
  avatarImg: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    objectFit: "cover",
  },
  userName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1A1A1A",
  },

  // OUTLET CONTAINER
  outletContainer: {
    width: "100%",
    minHeight: "calc(100vh - 150px)",
  },
};


export default styles;