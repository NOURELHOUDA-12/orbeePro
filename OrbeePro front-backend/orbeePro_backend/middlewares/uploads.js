const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {

    let folder = 'uploads/photos'; 

    if (file.fieldname === 'staff') {
      folder = 'uploads/staff';
    } else if (file.fieldname === 'photos') { 
      folder = 'uploads/materiels';
    } else if (file.fieldname === 'facture') { 
      folder = 'uploads/factures';
    
     
    } else if (file.fieldname === 'sorties-rapides') { 
      folder = 'uploads/sorties-rapides';
    }
    else if (file.fieldname === 'reclamations') { 
      folder = 'uploads/reclamations';
    }
    cb(null, folder);
  },

  filename: (req, file, cb) => {
  
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});

// Filtre pour n'accepter que les images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {

    cb(new Error('Erreur : Seules les images (jpg, png, webp) sont autorisées !'), false);
  }
};

module.exports = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite à 5 Mo par fichier
  fileFilter: fileFilter
});










// const multer = require('multer');
// const path = require('path');





// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     let folder = 'uploads/reclamations/'; 

//     if (file.fieldname === 'profileImages') {
//       folder = 'uploads/profileImages';
//     }
    
//     cb(null, folder);

//   },

  
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });

// const upload = multer({ storage: storage });

// // Filtre pour n'accepter que les images
// const fileFilter = (req, file, cb) => {
//     const allowedTypes = /jpeg|jpg|png|webp/;
//     const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = allowedTypes.test(file.mimetype);

//     if (extname && mimetype) {
//         return cb(null, true);
//     } else {
//         cb(new Error('Erreur : Seules les images (jpg, png, webp) sont autorisées !'));
//     }
// };

// module.exports = multer({ 
//     storage: storage,
//     limits: { fileSize: 5 * 1024 * 1024 }, // Limite à 5 Mo
//     fileFilter: fileFilter
// });


