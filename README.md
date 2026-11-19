# 🎄 Countdown bis Heiligabend 2026

Ein Tages-Countdown vom 19.11. bis 24.12.2026 im kitschigen Y2K-Weihnachtslook:
- jeden Tag ein neuer Spruch im Brief – frühere Sprüche lassen sich nachlesen (‹ ›), künftige nicht,
- Spruch als Bild speichern und teilen (WhatsApp & Co.),
- je näher Heiligabend rückt, desto mehr Schneeflocken (❄, ✦, Pixel-Herzen),
- an Heiligabend Konfetti.

Reine HTML/CSS/JavaScript-Seite ohne Build-Schritt, direkt für GitHub Pages geeignet.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Aufbau der Seite, Sticker (SVG) |
| `style.css` | Gestaltung, Farben, Animationen |
| `script.js` | Countdown, Spruch des Tages, Schnee, Konfetti |
| `sprueche.js` | **Die 36 Sprüche** – hier kannst du Texte ändern |
| `*.woff2` | Schriften lokal (Nunito, Pacifico, Rubik – SIL Open Font License) |
| `.nojekyll` | sorgt dafür, dass GitHub Pages die Dateien unverändert ausliefert |

## Veröffentlichen mit GitHub Pages (Weg über den Browser)

1. Bei github.com anmelden → oben rechts **„+“ → „New repository“**.
2. Name z. B. `weihnachts-countdown`, Sichtbarkeit **Public** → **Create repository**.
   *(Mit einem kostenlosen Konto funktioniert GitHub Pages nur bei öffentlichen Repositorys.)*
3. Auf der leeren Repo-Seite **„uploading an existing file“** anklicken.
4. Alle Dateien und den Ordner `fonts` per Drag & Drop hineinziehen
   (am einfachsten: das ZIP entpacken und den **Inhalt** des Ordners ziehen).
   Hinweis: `.nojekyll` ist eine versteckte Datei – falls sie fehlt, ist das unkritisch.
5. Unten **„Commit changes“**.
6. Im Repo **Settings → Pages**:
   - *Source:* **Deploy from a branch**
   - *Branch:* **main**, Ordner **/ (root)** → **Save**
7. Nach 1–2 Minuten ist die Seite erreichbar unter
   `https://<dein-github-name>.github.io/weihnachts-countdown/`

## Veröffentlichen per Kommandozeile (alternativ)

```bash
cd weihnachts-countdown
git init -b main
git add .
git commit -m "Weihnachts-Countdown"
git remote add origin https://github.com/<dein-github-name>/weihnachts-countdown.git
git push -u origin main
```
Danach Schritt 6 oben (Settings → Pages).

## Testen & Vorschau

- Einen Test-Parameter für ein anderes Datum gibt es bewusst nicht, damit niemand vorspringen kann.
  Zum Testen die Uhrzeit/das Datum am eigenen Gerät umstellen.
- **Lokal öffnen:** Doppelklick auf `index.html` funktioniert, die Chrom-Schrift lädt aber
  nur über einen Webserver korrekt, z. B.:
  ```bash
  python3 -m http.server 8000
  ```
  dann `http://localhost:8000` aufrufen.

## Anpassen

- **Sprüche:** in `sprueche.js` – ein Eintrag pro Tag, Reihenfolge = Kalendertage.
- **Schneemenge:** in `script.js` oben (`SCHNEE_MIN`, `SCHNEE_VORABEND`, `SCHNEE_HEILIGABEND`).
- **Farben:** in `style.css` ganz oben unter `:root`.

## Gut zu wissen

- Datum und Tageswechsel richten sich nach der Uhr des jeweiligen Geräts. Der Spruch wechselt um Mitternacht automatisch.
- Wer am Gerät „Bewegung reduzieren“ eingestellt hat, sieht weniger Schnee und keine Animationen.
- Es werden keine externen Dienste geladen (keine Cookies, keine Tracker, Schriften lokal).
