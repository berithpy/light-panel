import React, { useState, useEffect } from 'react';

const OVERLAY_Z_INDEX = 999;

const OrientationOverlay: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
    };
  }, []);

  if (!isPortrait || dismissed) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: OVERLAY_Z_INDEX,
      fontSize: '24px',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 aria-live="assertive">Rotate your phone for a better user experience</h1>
      <button
        onClick={() => setDismissed(true)}
        style={{
          width: '280px',
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: 'white',
          color: 'black',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Dismiss
      </button>
    </div>
  );
};

export default OrientationOverlay;