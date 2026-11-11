// QRCodePrinter.js
import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';

// Ce composant reçoit la 'valeur' (l'ID de l'espace) et un 'titre'
const QRCodePrinter = ({ valeur, titre }) => {
  // 1. Créer une 'ref' pour dire au printer ce qu'il faut imprimer
  const componentRef = useRef();

  // 2. Configurer le hook 'react-to-print'
  const handlePrint = useReactToPrint({
    content: () => componentRef.current, // Cible notre <div ref={...}>
    documentTitle: `QR Code - ${titre}`, // Nom du fichier lors de l'impression
  });

  if (!valeur) return null;

  return (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      
      {/* 3. La partie qui sera imprimée */}
      <div ref={componentRef} style={{ padding: '20px', border: '1px solid #ccc' }}>
        <h3 style={{ fontSize: '24px', margin: '0 0 16px 0' }}>{titre}</h3>
        <QRCodeCanvas
          value={valeur}
          size={256}
          level={"H"} // Correction d'erreur élevée, bien pour l'impression
          includeMargin={true}
        />
        <p style={{ marginTop: '16px', fontSize: '12px' }}>ID: {valeur}</p>
      </div>

      {/* 4. Le bouton qui déclenche l'impression */}
      <button
        onClick={handlePrint}
        style={{
          marginTop: '24px',
          padding: '12px 24px',
          background: '#4F46E5',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Imprimer le QR Code
      </button>
    </div>
  );
};

export default QRCodePrinter;