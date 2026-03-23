import { useEffect, useRef } from "react";

function createAlertSound(audioCtx, priority) {
  const oscillator = audioCtx.createOscillator();
  const gainNode   = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  if (priority === "P1") {
    // P1 — urgent rapid beeping high pitch
    oscillator.type      = "square";
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.3);
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.4);
    oscillator.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.5);
    gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.7);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.7);

  } else if (priority === "P2") {
    // P2 — medium double beep
    oscillator.type      = "sine";
    oscillator.frequency.setValueAtTime(660, audioCtx.currentTime);
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime + 0.15);
    oscillator.frequency.setValueAtTime(660, audioCtx.currentTime + 0.35);
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime + 0.5);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.65);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.65);

  } else {
    // P3 — soft single low beep
    oscillator.type      = "sine";
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.4);
  }
}

export function useIncidentAlert(incidents) {
  const prevIds    = useRef(new Set());
  const audioCtxRef = useRef(null);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!incidents.length) return;

    const activeIncidents = incidents.filter(i => i.status === "active");
    const activeIds       = activeIncidents.map(i => i.id);
    const newOnes         = activeIds.filter(id => !prevIds.current.has(id));

    if (newOnes.length > 0 && prevIds.current.size > 0) {
      newOnes.forEach(id => {
        const inc = incidents.find(i => i.id === id);
        if (!inc) return;

        // Play priority sound
        try {
          if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
          }
          const ctx = audioCtxRef.current;
          if (ctx.state === "suspended") ctx.resume();
          createAlertSound(ctx, inc.severity);
        } catch (e) {
          console.warn("Audio play failed:", e);
        }

        // Browser notification
        if (Notification.permission === "granted") {
          const icons = { P1: "🚨", P2: "⚠️", P3: "ℹ️" };
          new Notification(`${icons[inc.severity] || "🔔"} ${inc.type} Emergency`, {
            body: `Room ${inc.room} · ${inc.severity} · ${inc.briefing?.slice(0, 80)}`,
            icon: "/vite.svg",
          });
        }
      });
    }

    prevIds.current = new Set(activeIds);
  }, [incidents]);
}