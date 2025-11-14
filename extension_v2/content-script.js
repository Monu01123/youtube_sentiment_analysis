// (function(){
//   const BACKEND = 'http://localhost:8000/api/fetch_and_analyze';
//   const styleId = 'yt-sentiment-pro-style-v3';

//   function injectStyles() {
//     if (document.getElementById(styleId)) return;
//     const css = `
//       #yt-sentiment-pro {
//         border-radius:12px;
//         background:linear-gradient(180deg,#fff,#fbfbfb);
//         box-shadow:0 8px 30px rgba(15,23,42,0.08);
//         padding:18px;
//         margin-top:12px;
//         font-family: Inter, Arial, sans-serif;
//         color:#0f172a;
//         max-width:460px;
//       }
//       #yt-sentiment-pro .title { font-weight:700; font-size:16px; margin-bottom:6px }
//       #yt-sentiment-pro .sub { color:#566270; font-size:13px; margin-bottom:12px }
//       #yt-sentiment-pro .chart { width:170px;height:170px;border-radius:50%;margin:8px auto;position:relative; transition: background 600ms ease; }
//       #yt-sentiment-pro .legend { display:flex;justify-content:space-around;margin-top:12px;font-size:13px }
//       #yt-sentiment-pro .legend .item { text-align:center }
//       #yt-sentiment-pro .meta { text-align:center;margin-top:12px;color:#0f172a;font-weight:600 }
//       #yt-sentiment-pro .refresh { margin-top:12px;width:100%;padding:10px;border-radius:10px;border:none;background:linear-gradient(90deg,#1366ff,#0b63ff);color:#fff;font-weight:700;cursor:pointer;box-shadow:0 6px 18px rgba(11,99,255,0.18) }
//       #yt-sentiment-pro .small { font-size:12px;color:#6b7280;margin-top:6px }
//       #yt-sentiment-pro .status { font-size:13px;color:#374151;margin-top:8px; text-align:center }
//       #yt-sentiment-pro .spinner { display:inline-block; width:18px; height:18px; border-radius:50%; border:3px solid rgba(0,0,0,0.08); border-top-color:#0b63ff; animation:spin 1s linear infinite; vertical-align:middle; margin-right:8px; }
//       @keyframes spin { to { transform: rotate(360deg); } }
//     `;
//     const s = document.createElement('style');
//     s.id = styleId;
//     s.innerText = css;
//     document.head.appendChild(s);
//   }

//   async function waitFor(selector, timeout=15000) {
//     return new Promise((resolve,reject)=>{
//       const el=document.querySelector(selector);
//       if(el) return resolve(el);
//       const obs=new MutationObserver(()=>{ const f=document.querySelector(selector); if(f){ obs.disconnect(); resolve(f); }});
//       obs.observe(document.body,{childList:true,subtree:true});
//       setTimeout(()=>{ obs.disconnect(); reject('timeout') }, timeout);
//     });
//   }

//   function createPanel() {
//     const wrap = document.createElement('div');
//     wrap.id = 'yt-sentiment-pro';
//     wrap.innerHTML = `
//       <div class="title">Sentiment Insights (Pro)</div>
//       <div class="sub">Aggregated sentiment from video comments</div>
//       <div class="chart" id="yt-pro-chart" aria-hidden="true"></div>
//       <div class="legend">
//         <div class="item"><div style="width:10px;height:10px;background:#27ae60;border-radius:50%;margin:0 auto"></div><div>Positive</div></div>
//         <div class="item"><div style="width:10px;height:10px;background:#bdbdbd;border-radius:50%;margin:0 auto"></div><div>Neutral</div></div>
//         <div class="item"><div style="width:10px;height:10px;background:#e74c3c;border-radius:50%;margin:0 auto"></div><div>Negative</div></div>
//       </div>
//       <div class="meta">Total <span id="yt-pro-total">0</span> comments</div>
//       <button class="refresh" id="yt-pro-refresh">Refresh (Force)</button>
//       <div class="status" id="yt-pro-status">Status: idle</div>
//     `;
//     return wrap;
//   }

//   function drawDonut(positive, neutral, negative) {
//     const el = document.getElementById('yt-pro-chart');
//     const p = Number(positive||0), n = Number(neutral||0), neg = Number(negative||0);
//     const total = Math.max(1, p + n + neg);
//     const pPct = (p/total)*100;
//     const nPct = (n/total)*100;
//     el.style.background = `conic-gradient(#27ae60 0 ${pPct}%, #bdbdbd ${pPct}% ${pPct+nPct}%, #e74c3c ${pPct+nPct}% 100%)`;
//     el.setAttribute('aria-label', `Positive ${pPct.toFixed(1)} percent, Neutral ${nPct.toFixed(1)} percent`);
//     el.style.transition = 'background 600ms ease';
//   }

//   async function getVideoId() {
//     try { const url = new URL(window.location.href); const v = url.searchParams.get('v'); if (v) return v; } catch(e) {}
//     const m = document.querySelector('meta[itemprop="videoId"]'); if (m) return m.content;
//     const f = document.querySelector('ytd-watch-flexy'); if (f && f.getAttribute('video-id')) return f.getAttribute('video-id');
//     return null;
//   }

//   async function fetchAndShow(videoId, statusEl, force=false) {
//     statusEl.innerHTML = `<span class="spinner"></span>Analyzing comments...`;
//     try {
//       const res = await fetch(BACKEND, {
//         method:'POST',
//         headers:{'Content-Type':'application/json'},
//         body: JSON.stringify({ video_id: videoId, force })
//       });
//       if (!res.ok) {
//         const txt = await res.text();
//         statusEl.textContent = 'Backend error: ' + txt;
//         return;
//       }
//       const data = await res.json();
//       const agg = data.aggregate || {};
//       document.getElementById('yt-pro-total').textContent = agg.total || 0;
//       drawDonut(agg.positive, agg.neutral, agg.negative);
//       statusEl.textContent = 'Status: done' + (data.cached ? ' (cached)' : '');
//     } catch (e) {
//       statusEl.textContent = 'Status: failed - ' + e.message;
//     }
//   }

//   async function init() {
//     injectStyles();
//     const vid = await getVideoId(); if (!vid) return;
//     const meta = await waitFor('#meta-contents,#info-contents,ytd-watch-metadata',15000).catch(()=>null);
//     const container = meta?.parentNode || document.querySelector('#below') || document.body;
//     const panel = createPanel();
//     container.insertBefore(panel, meta?.nextSibling || null);
//     const statusEl = panel.querySelector('#yt-pro-status');
//     const refresh = panel.querySelector('#yt-pro-refresh');
//     fetchAndShow(vid, statusEl, false);
//     refresh.onclick = ()=> fetchAndShow(vid, statusEl, true);
//     let last = vid;
//     setInterval(async ()=>{
//       const v = await getVideoId();
//       if (v && v !== last) {
//         last = v;
//         fetchAndShow(v, statusEl, false);
//       }
//     }, 1800);
//   }

//   init();
// })();


// content-script.js
// (function () {
//   const BACKEND = "http://localhost:8000/api/fetch_and_analyze";
//   const STYLE_ID = "yt-sentiment-pro-v4-style";
//   const PANEL_ID = "yt-sentiment-pro-v4";
//   const AUTO_REFRESH_MS = 3000; // poll for video change
//   const EMO_ORDER = [
//     "happy",
//     "positive",
//     "neutral",
//     "angry",
//     "sad",
//     "surprise",
//     "disgust",
//     "fear",
//     "other",
//   ];

//   // default palette (you can tweak)
//   const PALETTE = {
//     positive: "#10b981",
//     happy: "#22c55e",
//     neutral: "#94a3b8",
//     angry: "#ef4444",
//     sad: "#3b82f6",
//     surprise: "#a78bfa",
//     disgust: "#f59e0b",
//     fear: "#fb7185",
//     other: "#64748b",
//   };

//   /* ----------------------------- Styles ------------------------------ */
//   function injectStyles() {
//     if (document.getElementById(STYLE_ID)) return;
//     const css = `
//       /* Container */
//       #${PANEL_ID} {
//         --glass-bg: rgba(255,255,255,0.92);
//         --glass-acc: rgba(99,102,241,0.06);
//         --muted: #6b7280;
//         --radius: 14px;
//         --shadow: 0 10px 30px rgba(2,6,23,0.12);
//         position: relative;
//         display: block;
//         width: 650px;
//         max-width: calc(100vw - 28px);
//         border-radius: var(--radius);
//         background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,250,251,0.98));
//         box-shadow: var(--shadow);
//         padding: 14px;
//         margin-top: 14px;
//         color: #0f1724;
//         font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
//         z-index: 9999;
//         transition: transform .22s ease, box-shadow .22s ease;
//       }
//       #${PANEL_ID}:hover { transform: translateY(-4px); box-shadow: 0 18px 36px rgba(2,6,23,0.14); }

//       /* Header */
//       #${PANEL_ID} .s-header { display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px; }
//       #${PANEL_ID} .s-title { font-weight:700;font-size:16px; display:flex;align-items:center;gap:8px }
//       #${PANEL_ID} .s-sub { color:var(--muted); font-size:13px; margin-top:2px }

//       /* Layout */
//       // #${PANEL_ID} .s-top { display:flex; gap:6px; align-items:flex-start; }
//       // #${PANEL_ID} .s-left { flex:1; min-width:200px; display:flex;flex-direction:column;align-items:center; }
//       // #${PANEL_ID} .s-right { width:220px; min-width:180px; }

//       /* Layout */
//       #${PANEL_ID} .s-top { 
//         display: flex; 
//         flex-wrap: wrap;      /* prevents any overflow */
//         gap: 12px; 
//         align-items: flex-start; 
//       }

//       #${PANEL_ID} .s-left { 
//         flex: 1 1 40%;        /* left takes max 55% of width */
//         max-width: 40%; 
//         min-width: 260px; 
//         display: flex;
//         flex-direction: column;
//         align-items: center;
//       }

//       #${PANEL_ID} .s-right { 
//         flex: 1 1 40%;        /* right takes remaining space */
//         max-width: 40%; 
//         min-width: 260px;     /* ensures it never becomes too small */
//       }


//       /* Big donut (multi-segment) */
//       #${PANEL_ID} .donut {
//         width:180px; height:180px; border-radius:50%;
//         display:inline-grid; place-items:center;
//         position:relative; overflow:hidden;
//         background: conic-gradient(#e5e7eb 0 100%);
//         box-shadow: inset 0 -6px 18px rgba(0,0,0,0.03);
//         transition: background .6s cubic-bezier(.2,.9,.3,.98);
//       }
//       #${PANEL_ID} .donut .core {
//         width:100px; height:100px; border-radius:50%;
//         background:linear-gradient(180deg, #fff, #fbfbfb);
//         display:flex;flex-direction:column;align-items:center;justify-content:center;
//         text-align:center; font-weight:700;
//         box-shadow: 0 6px 18px rgba(2,6,23,0.04);
//       }
//       #${PANEL_ID} .donut .core .pct { font-size:20px; }
//       #${PANEL_ID} .donut .core .lbl { font-size:12px; color:var(--muted); margin-top:4px; font-weight:600 }

//       /* small emotion rings grid */
//       #${PANEL_ID} .rings-grid { display:grid; grid-template-columns: repeat(2, 1fr); gap:8px; margin-top:8px; }
//       #${PANEL_ID} .ring-item { display:flex; align-items:center; gap:10px; padding:8px; border-radius:10px; background:linear-gradient(180deg, rgba(0,0,0,0.01), rgba(0,0,0,0.01)); }
//       #${PANEL_ID} .ring-canvas { width:54px; height:54px; border-radius:50%; display:inline-grid; place-items:center; position:relative; }
//       #${PANEL_ID} .ring-canvas .ring-inner { position:absolute; width:38px; height:38px; border-radius:50%; background:white; display:grid; place-items:center; font-weight:700; font-size:12px; box-shadow: 0 6px 12px rgba(2,6,23,0.04); }
//       #${PANEL_ID} .ring-meta { display:flex;flex-direction:column; min-width:0; }
//       #${PANEL_ID} .ring-meta .name { font-weight:700; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
//       #${PANEL_ID} .ring-meta .sub { font-size:12px; color:var(--muted); margin-top:2px; display:flex; gap:8px; align-items:center; }
//       #${PANEL_ID} .trend-pill { font-size:11px; padding:4px 6px; border-radius:999px; background:rgba(0,0,0,0.03); }

//       /* comments */
//       #${PANEL_ID} .comments { margin-top:10px; max-height:120px; overflow:auto; display:flex; flex-direction:column; gap:8px; padding-right:4px; }
//       #${PANEL_ID} .comment { padding:8px; border-radius:10px; font-size:13px; background:linear-gradient(180deg, rgba(0,0,0,0.01), rgba(0,0,0,0.01)); color:#0f1724; }
//       #${PANEL_ID} .comment.pos { border-left:4px solid ${PALETTE.positive}; padding-left:10px; }
//       #${PANEL_ID} .comment.neg { border-left:4px solid ${PALETTE.angry}; padding-left:10px; }
//       #${PANEL_ID} .comment.neu { border-left:4px solid ${PALETTE.neutral}; padding-left:10px; }

//       /* footer controls */
//       #${PANEL_ID} .controls { display:flex; gap:8px; margin-top:12px; align-items:center; justify-content:space-between; }
//       #${PANEL_ID} .btn { padding:8px 10px; border-radius:10px; border:none; cursor:pointer; font-weight:700; }
//       #${PANEL_ID} .btn.primary { background:linear-gradient(90deg,#1366ff,#0b63ff); color:#fff; box-shadow:0 8px 22px rgba(11,99,255,0.12); }
//       #${PANEL_ID} .btn.ghost { background:transparent; border:1px solid rgba(15,23,42,0.06); color:#0f1724; }

//       /* status */
//       #${PANEL_ID} .status { font-size:13px; color:var(--muted); text-align:center; margin-top:6px; }

//       /* responsive */
//       @media (max-width:560px) {
//         #${PANEL_ID} { width: calc(100vw - 20px); padding:10px; }
//         #${PANEL_ID} .s-top { flex-direction:column; align-items:center; }
//         #${PANEL_ID} .s-right { width:100%; }
//         #${PANEL_ID} .rings-grid { grid-template-columns: repeat(3, 1fr); }
//       }
//     `;
//     const s = document.createElement("style");
//     s.id = STYLE_ID;
//     s.innerText = css;
//     document.head.appendChild(s);
//   }

//   /* ----------------------------- Helpers ----------------------------- */
//   async function waitFor(selector, timeout = 15000) {
//     return new Promise((resolve, reject) => {
//       const el = document.querySelector(selector);
//       if (el) return resolve(el);
//       const obs = new MutationObserver(() => {
//         const f = document.querySelector(selector);
//         if (f) {
//           obs.disconnect();
//           resolve(f);
//         }
//       });
//       obs.observe(document.body, { childList: true, subtree: true });
//       setTimeout(() => {
//         obs.disconnect();
//         reject("timeout");
//       }, timeout);
//     });
//   }

//   async function getVideoId() {
//     try {
//       const url = new URL(window.location.href);
//       const v = url.searchParams.get("v");
//       if (v) return v;
//     } catch (e) {}
//     const meta = document.querySelector('meta[itemprop="videoId"]');
//     if (meta) return meta.content;
//     const flexy = document.querySelector("ytd-watch-flexy");
//     if (flexy && flexy.getAttribute("video-id"))
//       return flexy.getAttribute("video-id");
//     return null;
//   }

//   /* ----------------------------- UI ------------------------------- */
//   function createPanel() {
//     const wrap = document.createElement("div");
//     wrap.id = PANEL_ID;

//     wrap.innerHTML = `
//       <div class="s-header">
//         <div>
//           <div class="s-title">Sentiment Dashboard <span style="font-size:12px;color:var(--muted);font-weight:600">Pro</span></div>
//           <div class="s-sub">Live emotion breakdown from recent comments</div>
//         </div>
//         <div style="text-align:right">
//           <div id="${PANEL_ID}-total" style="font-weight:800;font-size:18px">0</div>
//           <div style="font-size:12px;color:var(--muted)">comments analyzed</div>
//         </div>
//       </div>

//       <div class="s-top">
//         <div class="s-left">
//           <div class="donut" id="${PANEL_ID}-donut" role="img" aria-label="Sentiment donut"></div>
//           <div class="status" id="${PANEL_ID}-overall">Overall: -</div>
//         </div>

//         <div class="s-right">
//           <div style="font-weight:800;margin-bottom:6px">Emotions</div>
//           <div class="rings-grid" id="${PANEL_ID}-rings"></div>
//         </div>
//       </div>

//       <div style="font-weight:800;margin-top:12px">Top Comments</div>
//       <div class="comments" id="${PANEL_ID}-comments"></div>

//       <div class="controls">
//         <div style="display:flex;gap:8px;">
//           <button class="btn primary" id="${PANEL_ID}-refresh">Refresh</button>
//           <button class="btn ghost" id="${PANEL_ID}-toggleComments">Toggle Comments</button>
//         </div>
//         <div style="font-size:12px;color:var(--muted);align-self:center" id="${PANEL_ID}-last">Last: --</div>
//       </div>

//       <div class="status" id="${PANEL_ID}-status">Status: idle</div>
//     `;

//     return wrap;
//   }

//   /* small helper to create ring using conic-gradient */
//   function buildRingStyle(pct, color) {
//     // pct is 0-100
//     const filled = Math.min(Math.max(pct, 0), 100);
//     const empty = 100 - filled;
//     return `background: conic-gradient(${color} 0 ${filled}%, rgba(0,0,0,0.06) ${filled}% 100%);`;
//   }

//   function renderDonut(emotions) {
//     // emotions: array of { key, label, pct }
//     const donut = document.getElementById(`${PANEL_ID}-donut`);
//     if (!donut) return;
//     // build conic-gradient string by ordering EMO_ORDER then rest
//     const ordered = [];
//     EMO_ORDER.forEach((k) => {
//       const e = emotions.find((x) => x.key === k);
//       if (e && e.pct > 0) ordered.push(e);
//     });
//     // append any remaining emotions
//     emotions.forEach((e) => {
//       if (!ordered.includes(e) && e.pct > 0) ordered.push(e);
//     });

//     let current = 0;
//     const parts = ordered.map((e) => {
//       const start = current;
//       const end = current + (e.pct || 0);
//       current = end;
//       const color = PALETTE[e.key] || PALETTE.other;
//       return `${color} ${start}% ${end}%`;
//     });
//     // if nothing, show neutral light background
//     const bg = parts.length
//       ? `conic-gradient(${parts.join(", ")})`
//       : "conic-gradient(#e5e7eb 0 100%)";
//     donut.style.background = bg;
//     // inner core text updated elsewhere
//   }

//   function populateRings(emotions) {
//     const rings = document.getElementById(`${PANEL_ID}-rings`);
//     if (!rings) return;
//     rings.innerHTML = "";
//     // show top 6 (or all)
//     const toShow = emotions.slice(0, 6);
//     toShow.forEach((e) => {
//       const item = document.createElement("div");
//       item.className = "ring-item";
//       const color = PALETTE[e.key] || PALETTE.other;
//       const pct = Math.round(Number(e.pct || 0));

//       item.innerHTML = `
//         <div class="ring-canvas" title="${e.label} ${pct}%">
//           <div class="ring-bg" style="width:54px;height:54px;border-radius:50%;${buildRingStyle(
//             pct,
//             color
//           )};display:block;"></div>
//           <div class="ring-inner">${pct}%</div>
//         </div>
//         <div class="ring-meta">
//           <div class="name">${e.label}</div>
//           <div class="sub"><div class="trend-pill">${
//             e.trend || ""
//           }</div> <div style="color:var(--muted)">${
//         e.count || 0
//       } comments</div></div>
//         </div>
//       `;
//       rings.appendChild(item);
//     });
//   }

//   function populateComments(list) {
//     const el = document.getElementById(`${PANEL_ID}-comments`);
//     if (!el) return;
//     el.innerHTML = "";
//     const max = 8;
//     const items = list.slice(0, max);
//     items.forEach((c) => {
//       const d = document.createElement("div");
//       d.className =
//         "comment " +
//         (c.type === "positive" ? "pos" : c.type === "negative" ? "neg" : "neu");
//       // small safety: truncate long comments
//       const text =
//         (c.text || "").length > 220
//           ? c.text.slice(0, 217) + "..."
//           : c.text || "";
//       d.textContent = text;
//       el.appendChild(d);
//     });
//     if (items.length === 0) {
//       el.innerHTML = `<div class="comment neu">No comments available</div>`;
//     }
//   }

//   /* -------------------------- Fetch & update ------------------------- */
//   async function fetchAndShow(videoId, statusEl, force = false) {
//     statusEl.textContent = "";
//     setStatus("Analyzing…", true);
//     try {
//       const resp = await fetch(BACKEND, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ video_id: videoId, force }),
//       });
//       if (!resp.ok) {
//         const txt = await resp.text();
//         setStatus("Backend error: " + txt, false, true);
//         return;
//       }
//       const data = await resp.json();
//       // expected shape:
//       // { aggregate: { total, overall_label, overall_pct, emotions: [{key,label,pct,count,trend}], top_positive:[...], top_negative:[...], cached:bool }, cached: bool }
//       const agg = data.aggregate || {};
//       const total = agg.total || 0;
//       const overallLabel = agg.overall_label || agg.overall || "Unknown";
//       const overallPct = agg.overall_pct || 0;
//       const emotions = (agg.emotions || []).map((e) => ({
//         key: (e.key || e.label || "").toLowerCase(),
//         label: e.label || e.key || "Unknown",
//         pct: Number(e.pct || 0),
//         count: Number(e.count || 0),
//         trend: e.trend || "",
//       }));
//       // fallback: if only three categories, map them to keys
//       if (emotions.length === 0 && typeof agg.positive !== "undefined") {
//         emotions.push({
//           key: "positive",
//           label: "Positive",
//           pct: Number(agg.positive || 0),
//           count: Number(agg.positive || 0),
//           trend: "",
//         });
//         emotions.push({
//           key: "neutral",
//           label: "Neutral",
//           pct: Number(agg.neutral || 0),
//           count: Number(agg.neutral || 0),
//           trend: "",
//         });
//         emotions.push({
//           key: "angry",
//           label: "Negative",
//           pct: Number(agg.negative || 0),
//           count: Number(agg.negative || 0),
//           trend: "",
//         });
//       }

//       // normalize pct to sum to 100 if they are absolute counts
//       const sum = emotions.reduce((s, x) => s + (Number(x.pct) || 0), 0);
//       if (sum > 0 && Math.round(sum) !== 100) {
//         // treat as counts -> convert
//         const totalCount = sum;
//         emotions.forEach((e) => {
//           e.pct = (e.pct / totalCount) * 100;
//         });
//       }

//       document.getElementById(`${PANEL_ID}-total`).textContent = total;
//       document.getElementById(
//         `${PANEL_ID}-overall`
//       ).textContent = `Overall: ${overallLabel} (${Math.round(overallPct)}%)`;
//       document.getElementById(`${PANEL_ID}-last`).textContent =
//         "Last: " + new Date().toLocaleTimeString();

//       renderDonut(emotions);
//       populateRings(emotions);
//       // top comments - merge positive then negative for variety
//       const pos = agg.top_positive || data.top_positive || [];
//       const neg = agg.top_negative || data.top_negative || [];
//       const comments = [];
//       pos.forEach((t) => comments.push({ text: t, type: "positive" }));
//       neg.forEach((t) => comments.push({ text: t, type: "negative" }));
//       populateComments(comments);

//       setStatus("Done" + (data.cached ? " (cached)" : ""), false, false);
//     } catch (err) {
//       setStatus(
//         "Failed: " + (err && err.message ? err.message : err),
//         false,
//         true
//       );
//     }
//   }

//   function setStatus(msg, busy = false, isError = false) {
//     const s = document.getElementById(`${PANEL_ID}-status`);
//     if (!s) return;
//     s.textContent = "Status: " + msg;
//     s.style.color = isError ? "#b91c1c" : busy ? "#0b63ff" : "#374151";
//   }

//   /* --------------------------- Init / wiring ------------------------- */
//   async function init() {
//     injectStyles();
//     const vid = await getVideoId();
//     if (!vid) return;
//     // find insertion point: prefer meta-contents or below video info
//     const meta = await waitFor(
//       "#meta-contents,#info-contents,ytd-watch-metadata",
//       15000
//     ).catch(() => null);
//     const container =
//       meta?.parentNode ||
//       document.querySelector("#below") ||
//       document.querySelector("#page-manager") ||
//       document.body;

//     // remove any existing panel (id collision)
//     const existing = document.getElementById(PANEL_ID);
//     if (existing) existing.remove();

//     const panel = createPanel();
//     // insert after meta if possible
//     try {
//       container.insertBefore(panel, meta?.nextSibling || null);
//     } catch (e) {
//       document.body.appendChild(panel);
//     }

//     const statusEl = document.getElementById(`${PANEL_ID}-status`);
//     const refreshBtn = document.getElementById(`${PANEL_ID}-refresh`);
//     const toggleComments = document.getElementById(
//       `${PANEL_ID}-toggleComments`
//     );
//     let commentsVisible = true;

//     refreshBtn.addEventListener("click", () => {
//       setStatus("Manual refresh…", true);
//       fetchAndShow(vid, statusEl, true);
//     });
//     toggleComments.addEventListener("click", () => {
//       commentsVisible = !commentsVisible;
//       document.getElementById(`${PANEL_ID}-comments`).style.display =
//         commentsVisible ? "flex" : "none";
//       toggleComments.textContent = commentsVisible
//         ? "Hide Comments"
//         : "Show Comments";
//     });

//     // initial fetch
//     fetchAndShow(vid, statusEl, false);

//     // detect video change and auto-refresh
//     let lastVid = vid;
//     setInterval(async () => {
//       const v = await getVideoId();
//       if (v && v !== lastVid) {
//         lastVid = v;
//         // remove old panel and recreate to avoid stale DOM issues
//         const el = document.getElementById(PANEL_ID);
//         if (el) el.remove();
//         init().catch(() => {});
//       }
//     }, AUTO_REFRESH_MS);
//   }

//   // Start
//   try {
//     init();
//   } catch (e) {
//     console.error("sentiment panel init failed", e);
//   }
// })();

















// content-script.js
(function () {
  const BACKEND = "http://localhost:8000/api/fetch_and_analyze";
  const STYLE_ID = "yt-sentiment-pro-v4-style";
  const PANEL_ID = "yt-sentiment-pro-v4";
  const AUTO_REFRESH_MS = 3000;

  const EMO_ORDER = [
    "happy",
    "positive",
    "neutral",
    "angry",
    "sad",
    "surprise",
    "disgust",
    "fear",
    "other",
  ];

  const PALETTE = {
    positive: "#10b981",
    happy: "#22c55e",
    neutral: "#94a3b8",
    angry: "#ef4444",
    sad: "#3b82f6",
    surprise: "#a78bfa",
    disgust: "#f59e0b",
    fear: "#fb7185",
    other: "#64748b",
  };

  /* ----------------------------- Styles ------------------------------ */
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const css = `
      #${PANEL_ID} {
        width: 550px;
        max-width: calc(100vw - 24px);
        border-radius: 14px;
        background: linear-gradient(180deg,#fff,#fafafa);
        box-shadow: 0 10px 34px rgba(0,0,0,0.08);
        padding: 16px;
        margin-top: 14px;
        color: #0f1724;
        font-family: Inter, Arial;
      }

      /* Header */
      #${PANEL_ID} .s-header {
        display:flex;
        justify-content:space-between;
        gap:12px;
        margin-bottom:12px;
      }

      /* FIXED LAYOUT */
      #${PANEL_ID} .s-top {
        display:flex;
        flex-wrap:wrap;
        gap:14px;
        align-items:flex-start;
      }

      #${PANEL_ID} .s-left {
        flex:1 1 48%;
        max-width:48%;
        min-width:260px;
        display:flex;
        flex-direction:column;
        align-items:center;
      }

      #${PANEL_ID} .s-right {
        flex:1 1 40%;
        max-width:40%;
        min-width:260px;
      }

      /* Big donut */
      #${PANEL_ID} .donut {
        width:180px;height:180px;border-radius:50%;
        display:grid;place-items:center;
        background: conic-gradient(#e5e7eb 0 100%);
      }

      #${PANEL_ID} .donut .core {
        width:100px;height:100px;border-radius:50%;
        background:white;
        display:grid;place-items:center;
        text-align:center;font-weight:700;
        font-size:18px;
      }

      /* Emotion Rings */
      #${PANEL_ID} .rings-grid {
        display:grid;
        grid-template-columns:repeat(2,1fr);
        gap:10px;
      }

      #${PANEL_ID} .ring-item {
        padding:8px;
        border-radius:10px;
        display:flex;
        gap:10px;
        background:#f8f8f8;
      }

      #${PANEL_ID} .ring-canvas {
        width:54px;height:54px;border-radius:50%;position:relative;
      }

      #${PANEL_ID} .ring-inner {
        width:38px;height:38px;border-radius:50%;
        background:white;
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-50%);
        display:grid;place-items:center;
        font-size:12px;font-weight:700;
      }

      /* Comments */
      #${PANEL_ID} .comments {
        max-height:130px;
        overflow:auto;
        margin-top:12px;
        display:flex;
        flex-direction:column;
        gap:8px;
      }

      #${PANEL_ID} .comment {
        padding:8px;border-radius:10px;background:#f6f6f6;
      }
      #${PANEL_ID} .pos { border-left:4px solid #10b981; }
      #${PANEL_ID} .neg { border-left:4px solid #ef4444; }
      #${PANEL_ID} .neu { border-left:4px solid #94a3b8; }

      /* Controls */
      #${PANEL_ID} .controls {
        margin-top:12px;
        display:flex;
        justify-content:space-between;
      }

      #${PANEL_ID} .btn {
        padding:8px 12px;
        border-radius:10px;
        cursor:pointer;
        font-weight:700;
      }
      #${PANEL_ID} .btn.primary {
        background:linear-gradient(90deg,#1366ff,#0b63ff);
        color:white;
      }
      #${PANEL_ID} .btn.ghost {
        background:white;
        border:1px solid #d0d0d0;
      }
    `;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.innerText = css;
    document.head.appendChild(style);
  }

  /* ----------------------------- Helpers ----------------------------- */
  async function waitFor(selector, timeout = 15000) {
    return new Promise((resolve) => {
      const found = document.querySelector(selector);
      if (found) return resolve(found);
      const obs = new MutationObserver(() => {
        const f = document.querySelector(selector);
        if (f) {
          obs.disconnect();
          resolve(f);
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => resolve(null), timeout);
    });
  }

  async function getVideoId() {
    try {
      const url = new URL(location.href);
      if (url.searchParams.get("v")) return url.searchParams.get("v");
    } catch {}

    const meta = document.querySelector('meta[itemprop="videoId"]');
    if (meta) return meta.content;

    const flex = document.querySelector("ytd-watch-flexy");
    if (flex && flex.getAttribute("video-id"))
      return flex.getAttribute("video-id");

    return null;
  }

  /* ----------------------------- UI ------------------------------- */
  function createPanel() {
    const wrap = document.createElement("div");
    wrap.id = PANEL_ID;

    wrap.innerHTML = `
      <div class="s-header">
        <div>
          <div class="s-title">Sentiment Dashboard</div>
          <div class="s-sub">Live emotion analysis</div>
        </div>
        <div style="text-align:right">
          <div id="${PANEL_ID}-total" style="font-size:20px;font-weight:700">0</div>
          <div style="font-size:12px;color:#666">comments</div>
        </div>
      </div>

      <div class="s-top">
        <div class="s-left">
          <div class="donut" id="${PANEL_ID}-donut">
            <div class="core" id="${PANEL_ID}-core">0%</div>
          </div>
          <div class="status" id="${PANEL_ID}-overall">Overall: -</div>
        </div>

        <div class="s-right">
          <div style="font-weight:700;margin-bottom:6px">Emotions</div>
          <div class="rings-grid" id="${PANEL_ID}-rings"></div>
        </div>
      </div>


      <div class="controls">
        <button class="btn primary" id="${PANEL_ID}-refresh">Refresh</button>
      </div>

      <div class="status" id="${PANEL_ID}-status">Status: idle</div>
    `;

    return wrap;
  }

  /* Ring Helper */
  function buildRingStyle(pct, color) {
    return `background: conic-gradient(${color} 0 ${pct}%, #e5e7eb ${pct}% 100%);`;
  }

  /* Donut Renderer */
  function renderDonut(emotions) {
    const donut = document.getElementById(`${PANEL_ID}-donut`);
    if (!donut) return;

    let current = 0;
    const segments = emotions.map((e) => {
      const start = current;
      const end = current + e.pct;
      current = end;
      return `${PALETTE[e.key] || PALETTE.other} ${start}% ${end}%`;
    });

    donut.style.background =
      segments.length > 0
        ? `conic-gradient(${segments.join(", ")})`
        : "conic-gradient(#e5e7eb 0 100%)";
  }

  /* Rings Renderer */
  function populateRings(emotions) {
    const rings = document.getElementById(`${PANEL_ID}-rings`);
    rings.innerHTML = "";

    emotions.slice(0, 6).forEach((e) => {
      const pct = Math.round(e.pct);
      const color = PALETTE[e.key] || PALETTE.other;

      const div = document.createElement("div");
      div.className = "ring-item";
      div.innerHTML = `
        <div class="ring-canvas" style="${buildRingStyle(pct, color)}">
          <div class="ring-inner">${pct}%</div>
        </div>
        <div>
          <div style="font-weight:700">${e.label}</div>
          <div style="font-size:12px;color:#666">${e.count} comments</div>
        </div>
      `;
      rings.appendChild(div);
    });
  }

  /* Comments Renderer */
  // function populateComments(items) {
  //   const el = document.getElementById(`${PANEL_ID}-comments`);
  //   el.innerHTML = "";

  //   if (!items.length) {
  //     el.innerHTML = `<div class="comment neu">No comments available</div>`;
  //     return;
  //   }

  //   items.forEach((c) => {
  //     const div = document.createElement("div");
  //     div.className = `comment ${
  //       c.type === "positive" ? "pos" : c.type === "negative" ? "neg" : "neu"
  //     }`;
  //     div.textContent = c.text;
  //     el.appendChild(div);
  //   });
  // }

  /* -------------------------- Fetch & Update ------------------------- */
  async function fetchAndShow(videoId, statusEl, force = false) {
    setStatus("Analyzing…", true);

    try {
      const res = await fetch(BACKEND, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: videoId, force }),
      });

      if (!res.ok) {
        const error = await res.text();
        return setStatus(`Backend error: ${error}`, false, true);
      }

      const data = await res.json();
      const agg = data.aggregate || {};

      const total = agg.total || 0;
      document.getElementById(`${PANEL_ID}-total`).textContent = total;

      // Build emotion array
      const emotions =
        agg.emotions?.map((e) => ({
          key: (e.key || e.label || "").toLowerCase(),
          label: e.label || e.key,
          pct: Number(e.pct) || 0,
          count: Number(e.count) || 0,
        })) || [];

      // Fallback if backend only returns positive/neutral/negative
      if (!emotions.length && typeof agg.positive !== "undefined") {
        const sum = agg.positive + agg.neutral + agg.negative || 1;
        emotions.push({
          key: "positive",
          label: "Positive",
          pct: (agg.positive / sum) * 100,
          count: agg.positive,
        });
        emotions.push({
          key: "neutral",
          label: "Neutral",
          pct: (agg.neutral / sum) * 100,
          count: agg.neutral,
        });
        emotions.push({
          key: "angry",
          label: "Negative",
          pct: (agg.negative / sum) * 100,
          count: agg.negative,
        });
      }

      /* -------- Fixed Overall Calculation -------- */
      let overallLabel =
        agg.overall_label ||
        agg.overall ||
        agg.sentiment ||
        agg.label ||
        "";

      let overallPct =
        agg.overall_pct ||
        agg.score ||
        0;

      if (!overallLabel || overallLabel === "Unknown") {
        const pos = emotions.find((x) => x.key === "positive")?.pct || 0;
        const neg =
          emotions.find((x) => x.key === "angry" || x.key === "negative")
            ?.pct || 0;

        if (pos > neg) overallLabel = "Positive";
        else if (neg > pos) overallLabel = "Negative";
        else overallLabel = "Neutral";

        overallPct = Math.max(pos, neg);
      }

      document.getElementById(`${PANEL_ID}-core`).textContent =
        Math.round(overallPct) + "%";
      document.getElementById(`${PANEL_ID}-overall`).textContent =
        `Overall: ${overallLabel} (${Math.round(overallPct)}%)`;

      renderDonut(emotions);
      populateRings(emotions);

      const comments = [];
      (agg.top_positive || []).forEach((t) =>
        comments.push({ text: t, type: "positive" })
      );
      (agg.top_negative || []).forEach((t) =>
        comments.push({ text: t, type: "negative" })
      );

      // populateComments(comments);

      setStatus("Done", false, false);
    } catch (err) {
      setStatus("Failed: " + err.message, false, true);
    }
  }

  function setStatus(msg, busy = false, isError = false) {
    const s = document.getElementById(`${PANEL_ID}-status`);
    s.textContent = "Status: " + msg;
    s.style.color = isError ? "#e11d48" : busy ? "#0b63ff" : "#374151";
  }

  /* --------------------------- Init ------------------------- */
  async function init() {
    injectStyles();

    const videoId = await getVideoId();
    if (!videoId) return;

    const meta = await waitFor(
      "#meta-contents,#info-contents,ytd-watch-metadata"
    );

    const container =
      meta?.parentNode ||
      document.querySelector("#below") ||
      document.body;

    const old = document.getElementById(PANEL_ID);
    if (old) old.remove();

    const panel = createPanel();
    container.insertBefore(panel, meta?.nextSibling || null);

    const statusEl = document.getElementById(`${PANEL_ID}-status`);

    fetchAndShow(videoId, statusEl, false);

    document
      .getElementById(`${PANEL_ID}-refresh`)
      .addEventListener("click", () =>
        fetchAndShow(videoId, statusEl, true)
      );

    // document
    //   .getElementById(`${PANEL_ID}-toggleComments`)
    //   .addEventListener("click", (e) => {
    //     const el = document.getElementById(`${PANEL_ID}-comments`);
    //     const nowHidden = el.style.display === "none";
    //     el.style.display = nowHidden ? "flex" : "none";
    //     // e.target.textContent = nowHidden ? "Hide Comments" : "Show Comments";
    //   });

    // Auto detect video change
    let last = videoId;
    setInterval(async () => {
      const v = await getVideoId();
      if (v && v !== last) {
        last = v;
        const oldPanel = document.getElementById(PANEL_ID);
        if (oldPanel) oldPanel.remove();
        init();
      }
    }, AUTO_REFRESH_MS);
  }

  try {
    init();
  } catch (error) {
    console.error("Initialization failed:", error);
  }
})();
