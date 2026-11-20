/* ============================================================
   AgriSense Field Lab — frontend controller
   3 colour modes · offline agronomy engine · optional Flask ML API
   ============================================================ */
(function () {
  "use strict";

  const FIELDS = ["n", "p", "k", "ph", "temp", "humidity", "rainfall"];
  const INFO = {
    n:        ["Nitrogen", "kg/ha", "Drives leaf growth and chlorophyll production."],
    p:        ["Phosphorus", "kg/ha", "Supports root development, flowering and energy transfer."],
    k:        ["Potassium", "kg/ha", "Improves disease resistance and fruit or tuber quality."],
    ph:       ["Soil pH", "0–14", "Controls how available nutrients are to the plant."],
    temp:     ["Temperature", "°C", "Sets germination speed and crop cycle length."],
    humidity: ["Humidity", "% RH", "Affects transpiration and fungal disease pressure."],
    rainfall: ["Rainfall", "mm", "Seasonal water supply; drainage matters just as much."]
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- Theme modes ---------- */
  const MODES = ["light", "dark", "eco"];
  function applyMode(mode) {
    if (!MODES.includes(mode)) mode = "light";
    document.documentElement.setAttribute("data-theme", mode);
    $$(".mode-btn").forEach(b => {
      const active = b.dataset.theme === mode;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    try { localStorage.setItem("agrisense-mode", mode); } catch (e) { /* file:// */ }
  }
  function initModes() {
    let saved = null;
    try { saved = localStorage.getItem("agrisense-mode"); } catch (e) { /* ignore */ }
    applyMode(saved || "light");
    $$(".mode-btn").forEach(b => b.addEventListener("click", () => {
      applyMode(b.dataset.theme);
      toast(b.dataset.theme.toUpperCase() + " MODE ACTIVE");
    }));
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    let el = $("#toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
  }

  /* ---------- Form ---------- */
  function values() {
    const out = {};
    FIELDS.forEach(f => { out[f] = Number($("#" + f + "-num").value); });
    return out;
  }
  function setValues(v) {
    FIELDS.forEach(f => {
      if (!(f in v)) return;
      const num = $("#" + f + "-num"), range = $("#" + f + "-range");
      num.value = v[f];
      range.value = clamp(v[f], Number(range.min), Number(range.max));
      fill(range);
    });
  }
  function fill(range) {
    const pct = ((Number(range.value) - Number(range.min)) / (Number(range.max) - Number(range.min))) * 100;
    range.style.background = "linear-gradient(90deg, var(--accent) " + pct + "%, var(--track) " + pct + "%)";
  }
  function validate(v) {
    if (!FIELDS.every(f => Number.isFinite(v[f]))) return "ALL INPUTS MUST BE NUMERIC.";
    if (v.n < 0 || v.p < 0 || v.k < 0) return "NUTRIENT VALUES CANNOT BE NEGATIVE.";
    if (v.ph < 0 || v.ph > 14) return "SOIL pH MUST BE BETWEEN 0 AND 14.";
    if (v.humidity < 0 || v.humidity > 100) return "HUMIDITY MUST BE BETWEEN 0 AND 100%.";
    if (v.temp > 60 || v.rainfall > 1000) return "CHECK TEMPERATURE / RAINFALL RANGE.";
    return "";
  }
  function initForm() {
    FIELDS.forEach(f => {
      const num = $("#" + f + "-num"), range = $("#" + f + "-range");
      fill(range);
      range.addEventListener("input", () => { num.value = range.value; fill(range); });
      num.addEventListener("input", () => { range.value = clamp(Number(num.value), Number(range.min), Number(range.max)); fill(range); });
    });

    $$("[data-preset]").forEach(b => b.addEventListener("click", () => {
      setValues(window.CROP_PRESETS[b.dataset.preset]);
      toast("LOADED: " + b.textContent.toUpperCase());
    }));

    $("#predict-form").addEventListener("submit", async e => {
      e.preventDefault();
      const v = values(), err = validate(v);
      $("#form-error").textContent = err;
      if (err) return;
      await infer(v);
    });

    $("#reset-btn").addEventListener("click", () => {
      setValues({ n: 90, p: 45, k: 50, ph: 6.5, temp: 28, humidity: 80, rainfall: 200 });
      idle();
      toast("CONSOLE RESET");
    });

    $("#guide-toggle").addEventListener("click", () => $("#guide-drawer").classList.toggle("open"));
  }

  /* ---------- Engines ---------- */
  function paramScore(value, bounds) {
    const lo = bounds[0], hi = bounds[1], span = Math.max(hi - lo, 1);
    if (value >= lo && value <= hi) return 1;
    const slack = span * 0.55;
    const d = value < lo ? lo - value : value - hi;
    return clamp(1 - d / slack, 0, 1);
  }
  function localPredict(v) {
    const ranked = window.CROP_DATA.map(c => {
      let total = 0;
      FIELDS.forEach(f => {
        const bounds = c.range[f];
        const span = Math.max(bounds[1] - bounds[0], 1);
        const centre = (bounds[0] + bounds[1]) / 2;
        // Membership dominates; centre proximity breaks ties between overlapping crops.
        const proximity = Math.exp(-2 * Math.pow((v[f] - centre) / span, 2));
        total += 0.75 * paramScore(v[f], bounds) + 0.25 * proximity;
      });
      return { crop: c, score: total / FIELDS.length };
    }).sort((a, b) => b.score - a.score);

    const best = ranked[0];
    return {
      crop: best.crop.name, emoji: best.crop.emoji, season: best.crop.season, tip: best.crop.tip,
      confidence: clamp(Math.round(56 + best.score * 42), 0, 99),
      engine: "AGRONOMY RULE ENGINE",
      alternatives: ranked.slice(1, 4).map(r => ({
        crop: r.crop.name, confidence: clamp(Math.round(38 + r.score * 45), 0, 96)
      }))
    };
  }
  async function remotePredict(v) {
    const res = await fetch("/predict", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v)
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (!data.crop) throw new Error("bad response");
    return { ...data, engine: (data.model || "FLASK ML API").toUpperCase() };
  }
  async function infer(v) {
    const btn = $("#predict-btn");
    btn.disabled = true; btn.textContent = "PROCESSING…";
    idle("RUNNING INFERENCE…");
    let result;
    const server = window.FLASK_MODE === true;
    if (server) {
      try { result = await remotePredict(v); }
      catch (e) { result = localPredict(v); result.note = "SERVER UNAVAILABLE — USED LOCAL ENGINE."; }
    } else {
      await new Promise(r => setTimeout(r, 240));
      result = localPredict(v);
    }
    render(result);
    btn.disabled = false; btn.textContent = "RUN INFERENCE →";
  }

  /* ---------- Output ---------- */
  function idle(msg) {
    $("#result-content").innerHTML =
      '<div class="idle"><div class="scanner">◌</div><p>' +
      (msg ? escapeHtml(msg) : "AWAITING FIELD READINGS.<br>ADJUST THE CONSOLE, THEN RUN INFERENCE.") +
      "</p></div>";
    $("#engine-line").textContent = "ENGINE: " + (window.FLASK_MODE ? "CONNECTING…" : "AGRONOMY RULE ENGINE");
  }
  function render(r) {
    const ranks = (r.alternatives || []).map(a =>
      '<div class="rank-row"><b>' + escapeHtml(a.crop) + '</b><div class="mini"><i data-w="' + a.confidence + '"></i></div><small>' + a.confidence + '%</small></div>'
    ).join("");
    $("#result-content").innerHTML =
      '<div class="result">' +
        '<div class="result-top">' +
          '<div class="gauge" style="--val:' + r.confidence + '"><div class="gtext"><b>' + r.confidence + '%</b><small>match</small></div></div>' +
          '<div><div class="result-name"><span>' + (r.emoji || "🌱") + "</span>" + escapeHtml(r.crop) + "</div>" +
          '<div class="result-meta"><span>' + escapeHtml(r.season || "BEST MATCH") + '</span><span>' + escapeHtml(r.engine || "ENGINE") + "</span></div></div>" +
        "</div>" +
        (r.tip ? '<div class="advice"><b>FIELD NOTE · </b>' + escapeHtml(r.tip) + "</div>" : "") +
        (ranks ? '<div class="rank"><h4>RUNNERS UP</h4>' + ranks + "</div>" : "") +
        (r.note ? '<div class="note">// ' + escapeHtml(r.note) + "</div>" : "") +
      "</div>";
    $("#engine-line").textContent = "ENGINE: " + (r.engine || "—");
    requestAnimationFrame(() => $$(".mini i").forEach(i => { i.style.width = i.dataset.w + "%"; }));
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- Guide + nav ---------- */
  function initGuide() {
    $("#guide-body").innerHTML = FIELDS.map(f => {
      const max = $("#" + f + "-range").max;
      return "<tr><td><b>" + INFO[f][0] + "</b><small>" + INFO[f][2] + "</small></td><td>" + INFO[f][1] + "</td><td>0 – " + max + "</td></tr>";
    }).join("");
  }
  function initNav() {
    $("#menu-btn").addEventListener("click", () => $("#nav").classList.toggle("open"));
    $$("#nav a").forEach(a => a.addEventListener("click", () => $("#nav").classList.remove("open")));
    const links = $$('a[href^="#"]');
    const targets = links.map(a => $(a.getAttribute("href"))).filter(Boolean);
    if (!("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
      });
    }, { rootMargin: "-35% 0px -60% 0px" });
    targets.forEach(t => obs.observe(t));
  }

  document.addEventListener("DOMContentLoaded", () => {
    initModes();
    initForm();
    initGuide();
    initNav();
    idle();
    setValues({ n: 90, p: 45, k: 50, ph: 6.5, temp: 28, humidity: 80, rainfall: 200 });
    if (window.FLASK_MODE) {
      fetch("/health").then(r => r.json()).then(d => {
        $("#engine-status").textContent = (d.engine || "ML").split(" ")[0].toUpperCase();
      }).catch(() => {});
    }
  });
})();
