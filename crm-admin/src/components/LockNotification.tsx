import React from "react";

interface LockNotificationProps {
  lockedBy: string;
  resourceType?: 'property' | 'user';
  onClose?: () => void;
}

const LockNotification: React.FC<LockNotificationProps> = ({ 
  lockedBy, 
  resourceType = 'property',
  onClose 
}) => {
  const getMessage = () => {
    switch(resourceType) {
      case 'user':
        return `Ten użytkownik jest aktualnie edytowany przez <b>${lockedBy}</b>.<br/>Edycja zablokowana do czasu zwolnienia.`;
      case 'property':
      default:
        return `Ta nieruchomość jest aktualnie edytowana przez <b>${lockedBy}</b>.<br/>Edycja zablokowana do czasu zwolnienia.`;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 24,
      right: 24,
      zIndex: 1000,
      background: 'linear-gradient(90deg, #f87171 0%, #fbbf24 100%)',
      color: '#1e293b',
      borderRadius: '1rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.13)',
      padding: '1.1rem 2.2rem 1.1rem 1.5rem',
      fontWeight: 600,
      fontSize: '1.05rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1.1rem',
      border: '2px solid #f87171',
      minWidth: 320
    }}>
      <span style={{fontSize: '1.25em', marginRight: 8}}>🔒</span>
      <span dangerouslySetInnerHTML={{ __html: getMessage() }} />
      {onClose && (
        <button onClick={onClose} style={{
          marginLeft: 'auto',
          background: 'none',
          border: 'none',
          color: '#1e293b',
          fontWeight: 700,
          fontSize: '1.2em',
          cursor: 'pointer',
          padding: 0
        }} title="Zamknij powiadomienie">×</button>
      )}
    </div>
  );
};

export default LockNotification;
