import { useEffect, useRef } from "react";

export function useIncidentAlert(incidents) {
  const prevIds   = useRef(new Set());
  const audioRef  = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio("/alert.mp3");
    audioRef.current.volume = 0.7;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!incidents.length) return;

    const activeIds = incidents
      .filter(i => i.status === "active")
      .map(i => i.id);

    const newOnes = activeIds.filter(id => !prevIds.current.has(id));

    if (newOnes.length > 0 && prevIds.current.size > 0) {
      // Play sound
      audioRef.current?.play().catch(() => {});

      // Browser notification
      newOnes.forEach(id => {
        const inc = incidents.find(i => i.id === id);
        if (!inc) return;

        if (Notification.permission === "granted") {
          new Notification(`🚨 ${inc.type} Emergency`, {
            body: `Room ${inc.room} · ${inc.severity} · ${inc.briefing?.slice(0, 80)}`,
            icon: "/vite.svg",
            badge: "/vite.svg",
          });
        }
      });
    }

    prevIds.current = new Set(activeIds);
  }, [incidents]);
}