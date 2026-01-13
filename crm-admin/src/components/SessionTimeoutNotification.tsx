import React, { useEffect, useRef, useState } from 'react';

interface SessionTimeoutNotificationProps {
  timeoutMinutes?: number;
  warningSeconds?: number; 
  onLogout: () => void;
}

const SessionTimeoutNotification: React.FC<SessionTimeoutNotificationProps> = ({
  timeoutMinutes = 10,
  warningSeconds = 60,
  onLogout,
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(warningSeconds);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef(Date.now());

  // Reset timer on user activity
  useEffect(() => {
    const resetTimer = () => {
      lastActivityRef.current = Date.now();
      setShowWarning(false);
      setSecondsLeft(warningSeconds);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearInterval(warningTimerRef.current);
      startTimers();
    };
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    startTimers();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearInterval(warningTimerRef.current);
    };
    // eslint-disable-next-line
  }, []);

  const startTimers = () => {
    // Timer do pokazania powiadomienia
    timerRef.current = setTimeout(() => {
      setShowWarning(true);
      let seconds = warningSeconds;
      setSecondsLeft(seconds);
      warningTimerRef.current = setInterval(() => {
        seconds -= 1;
        setSecondsLeft(seconds);
        if (seconds <= 0) {
          clearInterval(warningTimerRef.current!);
          onLogout();
        }
      }, 1000);
    }, (timeoutMinutes * 60 - warningSeconds) * 1000);
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white border border-red-400 text-red-700 px-6 py-5 rounded shadow-lg max-w-sm w-full text-center animate-fade-in">
        <div className="font-bold text-lg mb-2">Brak aktywności</div>
        <div className="mb-3">Zostaniesz automatycznie wylogowany za <span className="font-semibold">{secondsLeft}</span> sekund z powodu braku aktywności.</div>
        <button
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          onClick={() => { setShowWarning(false); setSecondsLeft(warningSeconds); }}
        >
          Jestem aktywny
        </button>
      </div>
    </div>
  );
};

export default SessionTimeoutNotification;
