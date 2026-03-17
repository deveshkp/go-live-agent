import React, { useState, useEffect } from "react";

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    // Check if previously unlocked in this session
    const isUnlocked = sessionStorage.getItem("app_unlocked");
    if (isUnlocked === "true") {
      setLocked(false);
    }
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "golive") {
      sessionStorage.setItem("app_unlocked", "true");
      setLocked(false);
    } else {
      setError(true);
      setPassword("");
    }
  };

  if (!locked) return <>{children}</>;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black flex flex-col items-center justify-center p-4 font-mono !z-[9999]" style={{ zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="w-full max-w-sm space-y-6 p-8 border border-cyan-900/50 rounded bg-gray-900/50 backdrop-blur relative z-50">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 border-2 border-cyan-500 rounded-full mx-auto flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl text-cyan-400 font-bold tracking-wider">SYSTEM ACCESS</h2>
          <p className="text-cyan-700 text-xs uppercase tracking-widest">Restricted Environment</p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="space-y-2">
            <input
              type="password"
              placeholder="ENTER PASSCODE"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              autoFocus
              className="w-full bg-black/50 border border-cyan-800 text-cyan-100 px-4 py-3 rounded text-center placeholder:text-cyan-900 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-xs text-center font-bold tracking-widest animate-pulse">
              ACCESS DENIED
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-cyan-900/20 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 py-3 rounded uppercase font-bold tracking-widest transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            Authenticate
          </button>
        </form>
      </div>
      <div className="absolute bottom-8 text-cyan-900 text-[10px] tracking-[0.2em]">
        GO-LIVE SECURITY PROTOCOL V2.0
      </div>
    </div>
  );
}
