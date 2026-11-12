import React, { useState, useEffect } from 'react';

const DynamicLogo = ({ 
  imageSrc = '/images/logoBlanc.png', 
  videoSrc = '/images/orbeepro.mp4',
  logoText = 'OrbeePro',
  size = 'large',
  imageDisplayDuration = 120000, // 2 minutes (en millisecondes)
  videoDisplayDuration = 30000,  // 30 secondes pour la vidéo
}) => {
  const [showVideo, setShowVideo] = useState(false);

  // Tailles augmentées comme demandé
 const sizes = {
    small: { width: '40px', maxHeight: '100px', fontSize: '18px' },
    medium: { width: '55px', maxHeight: '130px', fontSize: '26px' },
    large: { width: '70px', maxHeight: '170px', fontSize: '20px' } // Vos valeurs
  };
  const currentSize = sizes[size] || sizes.medium;

  useEffect(() => {
    const duration = showVideo ? videoDisplayDuration : imageDisplayDuration;

    const timer = setTimeout(() => {
      setShowVideo(!showVideo); // Alterne entre image et vidéo
    }, duration);

    return () => clearTimeout(timer); // Nettoyage du timer
  }, [showVideo, imageDisplayDuration, videoDisplayDuration]);

  return (
    <div style={styles.logoContainer}>
      <div style={{ ...styles.logoMedia, width: currentSize.width, height: currentSize.width }}>
        {showVideo ? (
          <video
            src={videoSrc}
            autoPlay
            muted
            playsInline
            style={styles.video}
            onEnded={() => setShowVideo(false)} // Retour au logo à la fin de la vidéo
          />
        ) : (
          <img src={imageSrc} alt="Logo" style={styles.image} />
        )}
      </div>
      <span style={{ ...styles.logoText, fontSize: currentSize.fontSize }}>
        {logoText}
      </span>
    </div>
  );
};

const styles = {
  logoContainer: { display: 'flex', alignItems: 'center', gap: '15px', padding: '10px' },
  logoMedia: { 
    borderRadius: '12px', 
    overflow: 'hidden', 
    background: '#333',
    border: '2px solid #F59E0B' 
  },
  video: { width: '100%', height: '100%', objectFit: 'cover' },
  image: { width: '100%', height: '100%', objectFit: 'contain' },
  logoText: { 
    fontWeight: '800', 
    color: '#FFFFFF', 
    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  }
};

export default DynamicLogo;