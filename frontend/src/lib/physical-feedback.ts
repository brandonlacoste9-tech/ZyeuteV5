/**
 * 📱 PHYSICAL FEEDBACK MODULE
 * Orchestres les haptiques (vibrations) et les effets visuels (strobe)
 * pour une immersion "Souveraine" dans Zyeuté.
 */

export const PhysicalFeedback = {
  /**
   * Vibration "Leather & Gold"
   * Un impact lourd suivi d'un frisson luxueux.
   */
  vibrateSovereign: () => {
    if ("vibrate" in navigator) {
      // 100ms impact, 50ms pause, 200ms frisson
      navigator.vibrate([100, 50, 200]);
    }
  },

  /**
   * Vibration "Momentum Boost"
   * Une accélération de vibrations crescendo.
   */
  vibrateMomentum: () => {
    if ("vibrate" in navigator) {
      navigator.vibrate([50, 30, 100, 30, 200]);
    }
  },

  /**
   * Strobe Momentum (Visuel)
   * Fait clignoter l'overlay ou les bords de l'écran en or.
   * Utilise l'API Screen Wake Lock (si possible) et le DOM.
   */
  triggerStrobe: (durationMs: number = 2000) => {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.zIndex = "9999";
    overlay.style.pointerEvents = "none";
    overlay.style.background =
      "radial-gradient(circle, rgba(255,215,0,0.4) 0%, rgba(0,0,0,0) 70%)";
    overlay.id = "momentum-strobe";

    document.body.appendChild(overlay);

    let isGold = true;
    const interval = setInterval(() => {
      overlay.style.opacity = isGold ? "1" : "0";
      isGold = !isGold;
    }, 100); // 10Hz strobe

    setTimeout(() => {
      clearInterval(interval);
      overlay.remove();
    }, durationMs);
  },

  /**
   * Flashlight Strobe (Hardware)
   * Note: Limité par le support navigateur (ImageCapture API).
   * Fonctionne mieux sur Chrome Android.
   */
  triggerFlashlight: async (durationMs: number = 2000) => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevice = devices.find((d) => d.kind === "videoinput");
      if (!videoDevice) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      const track = stream.getVideoTracks()[0];

      // @ts-ignore - ImageCapture non standard partout
      const imageCapture = new (window as any).ImageCapture(track);
      const photoCapabilities = await imageCapture.getPhotoCapabilities();

      if (photoCapabilities.fillLightMode.includes("flash")) {
        let flashOn = true;
        const interval = setInterval(async () => {
          await track.applyConstraints({
            // @ts-ignore
            advanced: [{ torch: flashOn }],
          });
          flashOn = !flashOn;
        }, 150);

        setTimeout(() => {
          clearInterval(interval);
          track.stop();
        }, durationMs);
      } else {
        track.stop();
      }
    } catch (err) {
      console.warn("[PhysicalFeedback] Flashlight non supporté ou refusé.");
    }
  },
};
