import { useEffect, useState } from "react";

export function LaunchSplash({ onComplete }: { onComplete: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setLeaving(true), 1350);
    const complete = window.setTimeout(onComplete, 1750);
    return () => {
      window.clearTimeout(timeout);
      window.clearTimeout(complete);
    };
  }, [onComplete]);

  const skip = () => {
    setLeaving(true);
    window.setTimeout(onComplete, 280);
  };

  return (
    <div className={`rize-splash ${leaving ? "rize-splash-leaving" : ""}`} role="dialog" aria-label="Ouverture de RIZE">
      <div className="rize-splash-glow" />
      <div className="rize-splash-mark" aria-hidden="true">
        <img src="/icons/icon-512.png" alt="" />
      </div>
      <p className="rize-splash-kicker">Gestionnaire du basketteur</p>
      <h1>RIZE</h1>
      <p className="rize-splash-tagline">Build your next level.</p>
      <button type="button" onClick={skip} className="rize-splash-skip">Passer l’intro</button>
    </div>
  );
}
