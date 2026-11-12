class Staff {
  constructor(data = {}) {

    // On définit les attributs par défaut pour éviter les erreurs "undefined"

    this.id = data.id || null;

    this.name = data.name || "";
    this.email = data.email || "";
    this.password = data.password || ""; 
    this.role = data.role || "menage";
    this.tel = data.tel || "";
    this.specialite = data.specialite || null;
    this.profileImageUrl = data.profileImageUrl || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.isActive = data.isActive !== undefined ? data.isActive : true;


    
              
  }

  // Exemple d'une méthode utile : valider si le staff est complet

  isValid() {
    return this.name.length > 0 && this.email.includes('@') && this.role !== "";
  }

  // Prépare les données pour l'envoi à l'API (nettoyage)

  toJSON() {
    return {
      name: this.name.trim(),
      email: this.email.toLowerCase().trim(),
      password: this.password,
      role: this.role,
      tel: this.tel,
      specialite: this.role === 'maintenance' ? this.specialite : null,
      profileImageUrl: this.profileImageUrl
    };
  }
}

export default Staff;