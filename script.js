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
  // Bewusst ohne Test-Parameter in der Adresse, damit niemand vorspringen kann.
  function heute() {
    const n = new Date();
    return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
  }

  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // ---------- Spruch-Archiv: nur zurück, nie vor ----------
  let heuteIdx = null;     // Index des heutigen Spruchs
  let ansichtIdx = null;   // Index des gerade angezeigten Spruchs

  const datumVon = (idx) => START + idx * TAG;
  const datumLang = (idx) => new Date(datumVon(idx)).toLocaleDateString("de-DE", {
    weekday: "long", day: "numeric", month: "long", timeZone: "UTC"
  });
  const datumKurz = (idx) => new Date(datumVon(idx)).toLocaleDateString("de-DE", {
    day: "numeric", month: "long", timeZone: "UTC"
  });

  function zeigeSpruch() {
    const idx = ansichtIdx;
    const s = SPRUECHE[idx];
    if (!s) return;
    const istHeute = idx === heuteIdx;

    $("brief-datum").textContent = datumLang(idx);
    $("brief-titel").textContent =
      istHeute ? "Dein Spruch für heute" :
      idx === heuteIdx - 1 ? "Dein Spruch von gestern" : "Ein Spruch von früher";

    const p = $("spruch");
    p.textContent = s.text;
    p.style.animation = "none"; void p.offsetWidth; p.style.animation = "";
    const q = $("spruch-quelle");
    q.hidden = !s.quelle;
    q.textContent = s.quelle ? "– " + s.quelle : "";

    $("zurueck").disabled = idx <= 0;
    $("vor").disabled = istHeute;
    $("heute").hidden = istHeute;
    $("brief").classList.toggle("brief--archiv", !istHeute);
  }

  function blaettern(richtung) {
    const neu = clamp(ansichtIdx + richtung, 0, heuteIdx);
    if (neu === ansichtIdx) return;
    ansichtIdx = neu;
    zeigeSpruch();
  }

  // ---------- Hinweis-Meldung ----------
  let toastTimer;
  function toast(text) {
    const el = $("toast");
    el.textContent = text;
    el.classList.add("sichtbar");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("sichtbar"), 3500);
  }

  // ---------- Spruch als Bild (Karte im Briefstil) ----------
  const SEITE = location.origin + location.pathname.replace(/index\.html$/, "");

  function umbrechen(ctx, text, maxBreite) {
    const woerter = text.split(" ");
    const zeilen = [];
    let zeile = "";
    for (const w of woerter) {
      const test = zeile ? zeile + " " + w : w;
      if (ctx.measureText(test).width > maxBreite && zeile) { zeilen.push(zeile); zeile = w; }
      else zeile = test;
    }
    if (zeile) zeilen.push(zeile);
    return zeilen;
  }

  function rundesRechteck(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function herz(ctx, cx, cy, g) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + g * 0.35);
    ctx.bezierCurveTo(cx - g * 0.9, cy - g * 0.25, cx - g * 0.45, cy - g * 0.9, cx, cy - g * 0.4);
    ctx.bezierCurveTo(cx + g * 0.45, cy - g * 0.9, cx + g * 0.9, cy - g * 0.25, cx, cy + g * 0.35);
    ctx.closePath();
  }

  async function spruchBild(idx) {
    const s = SPRUECHE[idx];
    try {
      await Promise.all([
        document.fonts.load('400 60px "Pacifico"'),
        document.fonts.load('800 50px "Nunito"'),
        document.fonts.load('900 50px "Rubik"')
      ]);
    } catch (e) { /* Standardschrift genügt */ }

    const W = 1080, H = 1350;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");

    // Hintergrund
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#fff8f0"); bg.addColorStop(1, "#ffd3ea");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Zuckerstangen-Rand
    const muster = document.createElement("canvas");
    muster.width = muster.height = 48;
    const m = muster.getContext("2d");
    m.fillStyle = "#fff"; m.fillRect(0, 0, 48, 48);
    m.strokeStyle = "#e5484d"; m.lineWidth = 17;
    for (let i = -48; i <= 96; i += 48) { m.beginPath(); m.moveTo(i, 48); m.lineTo(i + 48, 0); m.stroke(); }
    ctx.fillStyle = ctx.createPattern(muster, "repeat");
    const R = 36;
    ctx.fillRect(0, 0, W, R); ctx.fillRect(0, H - R, W, R);
    ctx.fillRect(0, 0, R, H); ctx.fillRect(W - R, 0, R, H);

    // Briefpapier mit Rüschen-Rahmen
    const px = 90, py = 170, pw = W - 180, ph = H - 300;
    ctx.save();
    ctx.shadowColor = "rgba(122,69,96,.3)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
    rundesRechteck(ctx, px - 22, py - 22, pw + 44, ph + 44, 22);
    ctx.fillStyle = "#ffd3ea"; ctx.fill();
    ctx.restore();
    rundesRechteck(ctx, px - 22, py - 22, pw + 44, ph + 44, 22);
    ctx.lineWidth = 5; ctx.strokeStyle = "#ff8fc7"; ctx.stroke();
    rundesRechteck(ctx, px, py, pw, ph, 10);
    ctx.fillStyle = "#fffdf8"; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = "#ff8fc7"; ctx.stroke();
    ctx.save();
    ctx.beginPath(); ctx.rect(px + 4, py + 4, pw - 8, ph - 8); ctx.clip();
    ctx.strokeStyle = "rgba(255,143,199,.22)"; ctx.lineWidth = 2;
    for (let y = py + 60; y < py + ph; y += 56) { ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px + pw, y); ctx.stroke(); }
    ctx.restore();

    // Wachssiegel mit Herz
    ctx.save();
    ctx.shadowColor = "rgba(120,20,40,.35)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 5;
    ctx.beginPath(); ctx.arc(W / 2, py, 62, 0, Math.PI * 2); ctx.fillStyle = "#e5484d"; ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(W / 2, py, 46, 0, Math.PI * 2); ctx.fillStyle = "#c8323a"; ctx.fill();
    herz(ctx, W / 2, py + 4, 44); ctx.fillStyle = "#ff8fc7"; ctx.fill();

    // Texte
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#2f8f6b";
    ctx.font = '800 38px "Nunito", sans-serif';
    ctx.fillText(datumLang(idx), W / 2, py + 130);

    ctx.fillStyle = "#e5484d";
    ctx.font = '400 70px "Pacifico", cursive';
    ctx.fillText("Spruch des Tages", W / 2, py + 235);

    // Spruch: Schriftgröße passend zur Länge
    let groesse = 60, zeilen;
    do {
      ctx.font = `800 ${groesse}px "Nunito", sans-serif`;
      zeilen = umbrechen(ctx, s.text, pw - 140);
      groesse -= 2;
    } while (zeilen.length * groesse * 1.5 > 560 && groesse > 34);
    const zh = (groesse + 2) * 1.5;
    let y = py + 330 + (560 - zeilen.length * zh) / 2 + zh * 0.7;
    ctx.fillStyle = "#4a1f33";
    for (const z of zeilen) { ctx.fillText(z, W / 2, y); y += zh; }
    if (s.quelle) {
      ctx.font = 'italic 600 32px "Nunito", sans-serif';
      ctx.fillStyle = "#7a4560";
      ctx.fillText("– " + s.quelle, W / 2, y + 10);
    }

    // Fußzeile im Brief
    const rest = Math.max(0, SPRUECHE.length - 1 - idx);
    ctx.font = '400 46px "Pacifico", cursive';
    ctx.fillStyle = "#e5484d";
    ctx.fillText(rest === 0 ? "Frohe Weihnachten!" : rest === 1 ? "Noch 1 Tag bis Heiligabend" : `Noch ${rest} Tage bis Heiligabend`, W / 2, py + ph - 70);

    // Kopf und Fuß außerhalb des Briefs
    ctx.font = '900 56px "Rubik", sans-serif';
    ctx.lineWidth = 8; ctx.strokeStyle = "#fff"; ctx.lineJoin = "round";
    ctx.strokeText("weihnachten.exe", W / 2, 110);
    ctx.fillStyle = "#ff5fa8";
    ctx.fillText("weihnachten.exe", W / 2, 110);
    ctx.font = '800 30px "Nunito", sans-serif';
    ctx.fillStyle = "#7a4560";
    ctx.fillText(SEITE.replace(/^https?:\/\//, "").replace(/\/$/, ""), W / 2, H - 70);

    return new Promise((ok) => c.toBlob(ok, "image/png"));
  }

  // ---------- Speichern ----------
  let bildUrl = null, bildDatei = null;

  async function speichern() {
    const knopf = $("speichern");
    knopf.disabled = true;
    try {
      const blob = await spruchBild(ansichtIdx);
      if (bildUrl) URL.revokeObjectURL(bildUrl);
      bildUrl = URL.createObjectURL(blob);
      const name = "weihnachtsspruch-" + datumKurz(ansichtIdx).replace(/\.?\s+/g, "-").toLowerCase() + ".png";
      bildDatei = new File([blob], name, { type: "image/png" });
      $("bild-vorschau").src = bildUrl;
      $("bild-vorschau").alt = "Spruch vom " + datumKurz(ansichtIdx) + " als Bild";
      const dl = $("bild-download");
      dl.href = bildUrl; dl.download = name;
      $("bild-teilen").hidden = !(navigator.canShare && navigator.canShare({ files: [bildDatei] }));
      const d = $("bild-dialog");
      if (d.showModal) d.showModal(); else d.setAttribute("open", "");
    } catch (e) {
      toast("Das Bild konnte leider nicht erstellt werden.");
    } finally {
      knopf.disabled = false;
    }
  }

  async function bildTeilen() {
    try {
      await navigator.share({ files: [bildDatei], title: "Spruch des Tages", text: "🎄 " + SEITE });
    } catch (e) { /* abgebrochen */ }
  }

  // ---------- Teilen ----------
  async function teilen() {
    const s = SPRUECHE[ansichtIdx];
    const text = `„${s.text}“${s.quelle ? " – " + s.quelle : ""}\n\n🎄 Der Weihnachts-Countdown:`;
    if (navigator.share) {
      try { await navigator.share({ title: "Countdown bis Heiligabend", text, url: SEITE }); }
      catch (e) { /* abgebrochen */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(text + " " + SEITE);
      toast("Spruch und Link kopiert – jetzt z. B. in WhatsApp einfügen 💌");
    } catch (e) {
      window.open("https://wa.me/?text=" + encodeURIComponent(text + " " + SEITE), "_blank", "noopener");
    }
  }

  // ---------- Bedienung ----------
  $("zurueck").addEventListener("click", () => blaettern(-1));
  $("vor").addEventListener("click", () => blaettern(1));
  $("heute").addEventListener("click", () => { ansichtIdx = heuteIdx; zeigeSpruch(); });
  $("speichern").addEventListener("click", speichern);
  $("teilen").addEventListener("click", teilen);
  $("bild-teilen").addEventListener("click", bildTeilen);
  $("bild-schliessen").addEventListener("click", () => $("bild-dialog").close());
  $("bild-dialog").addEventListener("click", (e) => { if (e.target.id === "bild-dialog") e.target.close(); });
  document.addEventListener("keydown", (e) => {
    if ($("bild-dialog").open) return;
    if (e.key === "ArrowLeft") blaettern(-1);
    if (e.key === "ArrowRight") blaettern(1);
  });

  // Wischen auf dem Handy (rechts = zurück, links = vor)
  let wischX = null;
  const briefEl = $("brief");
  briefEl.addEventListener("touchstart", (e) => { wischX = e.touches[0].clientX; }, { passive: true });
  briefEl.addEventListener("touchend", (e) => {
    if (wischX === null) return;
    const dx = e.changedTouches[0].clientX - wischX;
    if (Math.abs(dx) > 60) blaettern(dx > 0 ? -1 : 1);
    wischX = null;
  });

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

    // Brief: Wer gerade "heute" ansieht, springt beim Tageswechsel mit.
    const alterHeuteIdx = heuteIdx;
    heuteIdx = clamp(vergangen, 0, SPRUECHE.length - 1);
    if (ansichtIdx === null || ansichtIdx === alterHeuteIdx) ansichtIdx = heuteIdx;
    ansichtIdx = clamp(ansichtIdx, 0, heuteIdx);
    zeigeSpruch();

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
