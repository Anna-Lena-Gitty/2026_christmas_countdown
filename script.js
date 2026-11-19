(() => {
  "use strict";

  // ---------- Einstellungen ----------
  const START = Date.UTC(2026, 10, 19);   // 19.11.2026 (Monat 0-basiert)
  const ZIEL  = Date.UTC(2026, 11, 24);   // 24.12.2026 Heiligabend
  const TAG   = 86400000;
  const GESAMT = (ZIEL - START) / TAG;    // 35 Tage
  const SCHNEE_MIN = 8;                   // Flocken am ersten Tag
  const SCHNEE_VORABEND = 78;             // Flocken am 23.12.
  const SCHNEE_HEILIGABEND = 90;          // Flocken am 24.12.

  const SPRUECHE = window.SPRUECHE || [];
  const weniger = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Datum (lokale Zeit des Geräts) ----------
  // Zum Testen: ?datum=2026-12-24 an die Adresse anhängen.
  function heute() {
    const p = new URLSearchParams(location.search).get("datum");
    if (p && /^\d{4}-\d{2}-\d{2}$/.test(p)) {
      const [y, m, d] = p.split("-").map(Number);
      return Date.UTC(y, m - 1, d);
    }
    const n = new Date();
    return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
  }

  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // ---------- Anzeige ----------
  let letzterTag = null;

  function anzeigen() {
    const t = heute();
    if (t === letzterTag) return;
    letzterTag = t;

    const rest = Math.max(0, Math.round((ZIEL - t) / TAG));
    const vergangen = clamp(Math.round((t - START) / TAG), 0, GESAMT);
    const fortschritt = vergangen / GESAMT;
    const heiligabend = t === ZIEL;
    const vorbei = t > ZIEL;

    // Zahl + Texte
    const zahl = $("zahl");
    zahl.classList.toggle("lang", heiligabend || vorbei);
    if (heiligabend) {
      $("vorzeile").textContent = "Endlich!";
      zahl.textContent = "Heute ist Heiligabend!";
      $("unterzeile").textContent = "Frohe Weihnachten 🎄";
    } else if (vorbei) {
      $("vorzeile").textContent = "Hach …";
      zahl.textContent = "Frohe Weihnachten!";
      $("unterzeile").textContent = "Bis zum nächsten Advent 💖";
    } else {
      $("vorzeile").textContent = rest === 1 ? "Nur noch" : "Nur noch";
      zahl.textContent = String(rest);
      $("unterzeile").textContent = rest === 1 ? "Tag bis Heiligabend" : "Tage bis Heiligabend";
    }

    // Laufband
    let band;
    if (heiligabend || vorbei) {
      band = "✨ Frohe Weihnachten! ✨ Schöne Feiertage euch allen 🎄 Genießt die Zeit mit euren Liebsten ❤️";
    } else {
      const tageText = rest === 1 ? "Noch 1 Tag" : `Noch ${rest} Tage`;
      band = `✨ Frohe Weihnachten! ✨ ${tageText} bis Heiligabend 🎄 Heute schon ein Plätzchen gegessen? 🍪`;
    }
    $("laufband-text").textContent = band;
    $("laufband-text-2").textContent = band;

    // Ladebalken
    const prozent = Math.round(fortschritt * 100);
    $("lade-fuellung").style.width = Math.max(prozent, 3) + "%";
    $("lade-prozent").innerHTML = prozent + "&nbsp;%";
    $("lade-balken").setAttribute("aria-valuenow", String(prozent));
    $("lade-label").textContent = prozent >= 100 ? "Weihnachten ist geladen!" : "Weihnachten wird geladen …";

    // Brief
    const datumText = new Date(t).toLocaleDateString("de-DE", {
      weekday: "long", day: "numeric", month: "long", timeZone: "UTC"
    });
    $("brief-datum").textContent = datumText;
    const s = SPRUECHE[clamp(vergangen, 0, SPRUECHE.length - 1)];
    if (s) {
      const p = $("spruch");
      p.textContent = s.text;
      p.style.animation = "none"; void p.offsetWidth; p.style.animation = "";
      const q = $("spruch-quelle");
      q.hidden = !s.quelle;
      q.textContent = s.quelle ? "– " + s.quelle : "";
    }

    // Schnee
    let ziel;
    if (heiligabend || vorbei) ziel = SCHNEE_HEILIGABEND;
    else ziel = SCHNEE_MIN + (SCHNEE_VORABEND - SCHNEE_MIN) * (vergangen / (GESAMT - 1));
    if (weniger) ziel *= 0.4;
    schnee.setAnzahl(Math.round(ziel));

    if (heiligabend && !weniger) konfetti();
  }

  // ---------- Schnee (❄, ✦ und Pixel-Herzen) ----------
  const schnee = (() => {
    const c = $("schnee");
    const ctx = c.getContext("2d");
    let w = 0, h = 0, dpr = 1;
    let flocken = [];
    let soll = 0;

    const HERZ = [
      ".XX.XX.",
      "XXXXXXX",
      "XXXXXXX",
      ".XXXXX.",
      "..XXX..",
      "...X..."
    ];
    const FARBEN_FLOCKE = ["#8fc3f0", "#b7a6f0", "#9fdcc4", "#ffffff"];
    const FARBEN_STERN = ["#f4c95d", "#ffb3d9", "#ffd36b"];
    const FARBEN_HERZ = ["#ff5fa8", "#e5484d", "#ff8fc7"];
    const pick = (a) => a[Math.floor(Math.random() * a.length)];

    function groesse() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function neu(irgendwo) {
      const r = Math.random();
      const art = r < 0.45 ? "flocke" : r < 0.78 ? "stern" : "herz";
      const size = art === "herz" ? 10 + Math.random() * 8 : 12 + Math.random() * 12;
      return {
        art, size,
        x: Math.random() * w,
        y: irgendwo ? Math.random() * h : -30,
        v: (0.35 + Math.random() * 0.75) * (weniger ? 0.5 : 1),
        phase: Math.random() * Math.PI * 2,
        drift: 0.3 + Math.random() * 0.7,
        alpha: 0.55 + Math.random() * 0.35,
        dreh: Math.random() * Math.PI,
        farbe: art === "flocke" ? pick(FARBEN_FLOCKE) : art === "stern" ? pick(FARBEN_STERN) : pick(FARBEN_HERZ)
      };
    }

    function zeichne(f) {
      ctx.globalAlpha = f.alpha;
      if (f.art === "herz") {
        const px = Math.max(2, Math.round(f.size / 7));
        ctx.fillStyle = f.farbe;
        for (let yy = 0; yy < HERZ.length; yy++)
          for (let xx = 0; xx < 7; xx++)
            if (HERZ[yy][xx] === "X") ctx.fillRect(Math.round(f.x + xx * px), Math.round(f.y + yy * px), px, px);
        return;
      }
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.dreh);
      ctx.font = `${f.size}px system-ui, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(255,255,255,.9)"; ctx.shadowBlur = 4;
      ctx.fillStyle = f.farbe;
      // Variation Selector (U+FE0E) erzwingt die Text- statt Emoji-Darstellung
      ctx.fillText(f.art === "flocke" ? "❄︎" : "✦", 0, 0);
      ctx.restore();
    }

    let zuletzt = performance.now();
    function schritt(jetzt) {
      const dt = Math.min(3, (jetzt - zuletzt) / 16.67);
      zuletzt = jetzt;
      ctx.clearRect(0, 0, w, h);
      while (flocken.length < soll && Math.random() < 0.3) flocken.push(neu(false));
      for (let i = flocken.length - 1; i >= 0; i--) {
        const f = flocken[i];
        f.phase += 0.01 * dt;
        f.y += f.v * dt;
        f.x += Math.sin(f.phase) * f.drift * 0.4 * dt;
        f.dreh += 0.004 * dt;
        if (f.y > h + 30) {
          if (flocken.length > soll) { flocken.splice(i, 1); continue; }
          Object.assign(f, neu(false));
        }
        zeichne(f);
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(schritt);
    }

    groesse();
    window.addEventListener("resize", groesse);
    requestAnimationFrame(schritt);

    return {
      setAnzahl(n) {
        const erster = soll === 0;
        soll = n;
        if (erster) while (flocken.length < n) flocken.push(neu(true));
      }
    };
  })();

  // ---------- Konfetti an Heiligabend ----------
  function konfetti() {
    const c = $("konfetti");
    const ctx = c.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    c.width = w * dpr; c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const farben = ["#ff8fc7", "#e5484d", "#2f8f6b", "#a8e6cf", "#f4c95d", "#ffffff"];
    const teile = Array.from({ length: 160 }, () => ({
      x: Math.random() * w, y: -20 - Math.random() * h * 0.6,
      vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3,
      r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
      bw: 6 + Math.random() * 6, bh: 4 + Math.random() * 4,
      farbe: farben[Math.floor(Math.random() * farben.length)]
    }));
    const ende = performance.now() + 7000;
    (function lauf(jetzt) {
      ctx.clearRect(0, 0, w, h);
      if (jetzt > ende) return;
      for (const p of teile) {
        p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.farbe; ctx.fillRect(-p.bw / 2, -p.bh / 2, p.bw, p.bh);
        ctx.restore();
      }
      requestAnimationFrame(lauf);
    })(performance.now());
  }

  // ---------- Start + Tageswechsel um Mitternacht ----------
  anzeigen();
  setInterval(anzeigen, 60 * 1000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) anzeigen(); });
})();
