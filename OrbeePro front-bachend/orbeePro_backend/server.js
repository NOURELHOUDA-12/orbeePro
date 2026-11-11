const express = require('express');
const cors = require('cors');
const path = require('path');
const PORT = process.env.PORT || 5000;

 
const authRoutes = require('./routes/authRoutes');
const imageRoutes = require('./routes/imagesRoutes');
const staffRoutes = require('./routes/staffRoutes');
const taskRoutes = require('./routes/taskRoutes');
const chatRoutes = require('./routes/chatRoutes');
const emailRoutes =require('./routes/emailRoutes')    ;
const FournisseursRoutes = require('./routes/FournisseursRoutes');
  const produitRoutes = require('./routes/produitRoutes');
const categorieRoutes = require('./routes/categorieRoutes');

const recRoutes = require('./routes/recRoutes');
const devisRoutes = require('./routes/devisRoutes');
const etablissementRoutes =require('./routes/etablissementRoute')
const spaceRoutes =require('./routes/spaceRoutes')
const activityRoutes =require('./routes/activityRoutes')
const materielRoute =require('./routes/MaterielRoute')
const inventairesRoutes =require('./routes/inventaireroutes')
const themeRoutes =require('./routes/themeRoutes')
const commandeRoutes = require('./routes/CommandeRoutes')
const rondeRoutes = require('./routes/Ronderoutes');
const veilleurPositionRoutes = require('./routes/Veilleurpositionroutes');
const parkingRoutes = require('./routes/Parkingroutes');
const  signalementRoutes = require('./Parking/routes/signalementRoutes');
const SortieRapidesRoutes=require('./Parking/routes/Sortierapideroutes')
const SuiviePresenceRoute=require('./Parking/routes/suiviPresenceRoutes')



const app = express();


// 1️⃣ CORS (doit être en premier)
app.use(cors({
  // origin: 'http://localhost:3000',
  origin:true,
  credentials: true,      
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2️⃣ Parser JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// 3️⃣ ⭐ FICHIERS STATIQUES (AVANT les routes API et AVANT le 404)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));
  
   
  
  
  
  
app.use((req, res, next) => {
  console.log(`➡️  ${req.method} ${req.url}`);
  next();
});


// 4️⃣ Routes API

app.use('/api/auth', authRoutes);
 app.use('/api/staff', staffRoutes);

app.use('/api/Fournisseurs', FournisseursRoutes);
app.use('/api/Devis', devisRoutes);


app.use('/api/images', imageRoutes);


app.use('/api/tasks', taskRoutes);
app.use('/api/reclamations', recRoutes);

app.use('/api/reclamations', recRoutes);


app.use('/api/Devis', devisRoutes);

app.use('/api/produits',     produitRoutes);
app.use('/api/Espaces', spaceRoutes);
// app.use('/api/staff', staffRoutes);
  
 app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use('/api/chat', chatRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/categories',categorieRoutes );
app.use('/api/etablissements', etablissementRoutes);
app.use('/api/logs',activityRoutes);

app.use('/api/materiels', materielRoute);
app.use('/api/inventaires', inventairesRoutes)
app.use('/api/themes', themeRoutes);
app.use('/api/commandes', commandeRoutes);

app.use('/api/rondes', rondeRoutes);
 app.use('/api/veilleur', veilleurPositionRoutes);
app.use('/api/parking/entrees', parkingRoutes);
app.use('/api/signalements', signalementRoutes);
app.use('/api/parking/sorties-rapides', SortieRapidesRoutes);
app.use('/api/suivi-presence',SuiviePresenceRoute)
// 5️⃣ Route de test
app.get('/', (req, res) => {
  res.json({ message: 'Serveur OrbeePro opérationnel ✅' });
  
});


// 6️⃣ ⭐ GESTION 404 (DOIT ÊTRE EN DERNIER)
app.use((req, res) => {
  console.log('❌ Route 404:', req.method, req.url);
  res.status(404).json({ success: false, message: 'Route non trouvée' });
});

// 7️⃣ Gestion des erreurs (tout à la fin)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur'
  });
});


// require('./Services/Inventairecron'); 

app.listen(PORT, "0.0.0.0", () => {
  console.log(`📡 API Mobile : http://192.168.1.135:${PORT}/api`);
  console.log(`📁 Images Mobile : http://192.168.1.135:${PORT}/uploads`);
    console.log(`  - http://localhost:${PORT}/uploads/general/1770321752718-794337968.png\n`);

});


