/* ============================================================
   D365 License Optimizer - App logic
   ------------------------------------------------------------
   Navigation, currency switching, the group editor UI and the
   rules engine. Pricing comes from js/pricing-data.js.

   Currency:
   - GBP (UK list prices) is the default.
   - ?currency=usd in the URL switches to USD, and the toggle
     in the header and footer does the same with one click.

   Rules implemented in v1:
   - Base + attach: the most expensive app becomes the base,
     every additional app is an attach.
   - Team Member eligibility: light usage AND no custom apps.
   - Professional / Enterprise mixing ban, environment-wide.
   - Duplicate group detection (informational only).
   ============================================================ */

const APPS = PRICING.apps;

/* ---------------- Currency state ---------------- */

let cur = PRICING.defaultCurrency;
(function initCurrencyFromUrl() {
  try {
    const p = new URLSearchParams(window.location.search).get("currency");
    if (p && PRICING.currencies[p.toLowerCase()]) cur = p.toLowerCase();
  } catch (e) { /* keep default */ }
})();

function P(priceObj) { return priceObj[cur]; }
function tmPrice() { return P(PRICING.teamMemberPrice); }
function attachPrice() { return P(PRICING.attachPrice); }

function money(n) {
  const c = PRICING.currencies[cur];
  const hasDecimals = Math.round(n * 100) % 100 !== 0;
  return c.symbol + n.toLocaleString(c.locale, {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2
  });
}

function setCurrency(c) {
  if (!PRICING.currencies[c] || c === cur) return;
  cur = c;
  /* Update the URL so the selection is shareable. Some contexts
     (file://, sandboxed previews) block history updates, so this
     is best-effort and never allowed to break the switch itself. */
  try {
    const url = c === PRICING.defaultCurrency
      ? window.location.pathname
      : window.location.pathname + "?currency=" + c;
    window.history.replaceState(null, "", url);
  } catch (e) { /* URL update unavailable in this context, ignore */ }
  refreshCurrencyUI();
}

function refreshCurrencyUI() {
  /* toggle states (header + footer share the same markup) */
  document.querySelectorAll(".cur-toggle button").forEach(b =>
    b.classList.toggle("on", b.dataset.cur === cur)
  );
  renderPriceTable();
  updateStaticNumbers();
  calc();
}

/* ---------------- Navigation ---------------- */

function goTo(page) {
  document.querySelectorAll("section.page").forEach(s => s.classList.remove("visible"));
  document.getElementById("page-" + page).classList.add("visible");
  document.querySelectorAll(".nav-links button").forEach(b =>
    b.classList.toggle("active", b.dataset.page === page)
  );
  window.scrollTo({ top: 0 });
}

document.querySelectorAll(".nav-links button").forEach(b =>
  b.addEventListener("click", () => goTo(b.dataset.page))
);

/* ---------------- Group editor ---------------- */

let groups = [];
let gid = 0;

function addGroup(preset) {
  gid++;
  groups.push(Object.assign(
    { id: gid, name: "", count: 5, apps: [], profile: "full", advanced: false, customApp: false },
    preset || {}
  ));
  render();
}

function removeGroup(id) {
  groups = groups.filter(g => g.id !== id);
  render();
}

function upd(id, key, val) {
  const g = groups.find(g => g.id === id);
  if (!g) return;
  g[key] = val;
  render();
}

function toggleApp(id, app) {
  const g = groups.find(g => g.id === id);
  if (!g) return;
  g.apps = g.apps.includes(app) ? g.apps.filter(a => a !== app) : [...g.apps, app];
  render();
}

function render() {
  const wrap = document.getElementById("groups");
  wrap.innerHTML = groups.map(g => {
    const appsLabel = g.profile === "light"
      ? "Which apps' data do they need to access?"
      : "Which apps do they need?";
    const appsNote = g.profile === "light"
      ? `<div class="apps-note">Light users don't buy app licenses. A single Team Member license grants read access to the selected apps' data.</div>`
      : "";
    return `
    <div class="group-card">
      <div class="g-head">
        <div class="g-title">Group ${groups.indexOf(g) + 1}${g.name ? " · " + esc(g.name) : ""}</div>
        <button class="g-remove" onclick="removeGroup(${g.id})">Remove</button>
      </div>
      <div class="field field-row">
        <div>
          <label>Group name (optional)</label>
          <input type="text" value="${esc(g.name)}" placeholder="e.g. Sales team" onchange="upd(${g.id},'name',this.value)">
        </div>
        <div>
          <label>Headcount</label>
          <input type="number" min="1" value="${g.count}" onchange="upd(${g.id},'count',Math.max(1,parseInt(this.value)||1))">
        </div>
      </div>
      <div class="field">
        <label>${appsLabel}</label>
        <div class="chips">
          ${Object.keys(APPS).map(a => `<button class="chip ${g.apps.includes(a) ? "on" : ""}" onclick="toggleApp(${g.id},'${a}')">${APPS[a].name}</button>`).join("")}
        </div>
        ${appsNote}
      </div>
      <div class="field">
        <label>Usage profile</label>
        <div class="radio-line">
          <label><input type="radio" name="prof${g.id}" ${g.profile === "full" ? "checked" : ""} onchange="upd(${g.id},'profile','full')"> Full user (creates records, runs processes)</label>
          <label><input type="radio" name="prof${g.id}" ${g.profile === "light" ? "checked" : ""} onchange="upd(${g.id},'profile','light')"> Light user (reads, approves, small updates)</label>
        </div>
      </div>
      ${g.profile === "full" ? `
      <div class="field switch-line">
        <input type="checkbox" id="adv${g.id}" ${g.advanced ? "checked" : ""} onchange="upd(${g.id},'advanced',this.checked)">
        <label for="adv${g.id}" style="font-weight:400;color:var(--ink)">Needs advanced features (forecasting, deep customization, omnichannel)</label>
      </div>` : `
      <div class="field switch-line">
        <input type="checkbox" id="cus${g.id}" ${g.customApp ? "checked" : ""} onchange="upd(${g.id},'customApp',this.checked)">
        <label for="cus${g.id}" style="font-weight:400;color:var(--ink)">These users work with custom-built apps</label>
      </div>`}
    </div>`;
  }).join("");
  calc();
}

/* ---------------- Rules engine ---------------- */

function calc() {
  const R = document.getElementById("receipt");
  if (!R) return;
  const valid = groups.filter(g => g.apps.length > 0 && g.count > 0);

  if (valid.length === 0) {
    R.innerHTML = `<div class="receipt-empty">Your breakdown will appear here as you define groups.<br><br>Add at least one group and pick an app.</div>`;
    return;
  }

  const checks = [];

  /* Rule 1: Professional / Enterprise mixing ban, per app, environment-wide */
  const tier = {};
  for (const a of Object.keys(APPS)) {
    if (!APPS[a].pro) { tier[a] = "ent"; continue; }
    const fullGroups = valid.filter(g => g.profile === "full" && g.apps.includes(a));
    if (fullGroups.length === 0) { tier[a] = "pro"; continue; }
    const needsEnt = fullGroups.some(g => g.advanced);
    tier[a] = needsEnt ? "ent" : "pro";
    if (needsEnt && fullGroups.some(g => !g.advanced)) {
      checks.push({ t: "warn", txt: `${APPS[a].name}: Professional and Enterprise CANNOT be mixed in the same environment. One group needs advanced features, so every ${APPS[a].name} full user was counted as Enterprise.` });
    } else {
      checks.push({ t: "ok", txt: `${APPS[a].name}: All full users are on the same tier (${tier[a] === "ent" ? "Enterprise" : "Professional"}). No mixing violation.` });
    }
  }

  /* Rule 2: duplicate group configurations (informational) */
  const sigMap = {};
  for (const g of valid) {
    const sig = [...g.apps].sort().join(",") + "|" + g.profile + "|" + g.advanced + "|" + g.customApp;
    (sigMap[sig] = sigMap[sig] || []).push(g);
  }
  for (const sig in sigMap) {
    if (sigMap[sig].length > 1) {
      const names = sigMap[sig].map(g => gname(g)).join(" and ");
      checks.push({ t: "info", txt: `${names} have identical configurations. The totals still add up correctly, this is not an error; you could merge them into one group if you like.` });
    }
  }

  let optimized = 0, naive = 0;
  const groupLines = [];

  for (const g of valid) {
    const lines = [];

    let naiveUser = 0;
    for (const a of g.apps) { naiveUser += P(APPS[a][tier[a]].price); }
    naive += naiveUser * g.count;

    if (g.profile === "light" && !g.customApp) {
      const c = tmPrice() * g.count;
      optimized += c;
      lines.push({ lbl: `${g.count} x Team Member`, amt: c });
      checks.push({ t: "ok", txt: `${gname(g)}: Team Member fits (light usage, no custom apps). Team Member can coexist with full licenses in the same tenant.` });
    } else if (g.profile === "light" && g.customApp) {
      const priced = g.apps.map(a => ({ a, p: P(APPS[a][tier[a]].price) })).sort((x, y) => y.p - x.p);
      const base = priced[0];
      const attachCount = priced.length - 1;
      const c = (base.p + attachCount * attachPrice()) * g.count;
      optimized += c;
      lines.push({ lbl: `${g.count} x ${APPS[base.a][tier[base.a]].label} (base)`, amt: base.p * g.count });
      if (attachCount > 0) lines.push({ lbl: `${g.count} x ${attachCount} attach`, amt: attachCount * attachPrice() * g.count });
      checks.push({ t: "warn", txt: `${gname(g)}: Team Member CANNOT be assigned to users who work with custom apps (official rule). A full license was calculated instead.` });
    } else {
      const priced = g.apps.map(a => ({ a, p: P(APPS[a][tier[a]].price) })).sort((x, y) => y.p - x.p);
      const base = priced[0];
      const attaches = priced.slice(1);
      lines.push({ lbl: `${g.count} x ${APPS[base.a][tier[base.a]].label} (base)`, amt: base.p * g.count });
      let c = base.p * g.count;
      for (const at of attaches) {
        lines.push({ lbl: `${g.count} x ${APPS[at.a].name} (attach)`, amt: attachPrice() * g.count });
        c += attachPrice() * g.count;
      }
      optimized += c;
      if (attaches.length > 0) {
        checks.push({ t: "ok", txt: `${gname(g)}: ${APPS[base.a].name} (base) + ${attaches.map(x => APPS[x.a].name).join(" + ")} (attach) is a valid combination. An attach can't be bought without a base.` });
      }
    }
    groupLines.push({ g, lines });
  }

  const savings = naive - optimized;
  const totalUsers = valid.reduce((s, g) => s + g.count, 0);
  const hasWarn = checks.some(c => c.t === "warn");

  R.innerHTML = `
    <div class="receipt-head">
      <div class="rh-title">Monthly total</div>
      <div class="rh-total">${money(optimized)}</div>
      <div class="rh-sub">${totalUsers} users · ${PRICING.currencies[cur].code} list price</div>
    </div>

    <div class="receipt-body">
      ${groupLines.map(({ g, lines }) => `
        <div class="r-group">
          <div class="rg-name">${gname(g)}</div>
          ${lines.map(l => `<div class="r-line"><span class="lbl">${l.lbl}</span><span class="dots"></span><span class="amt">${money(l.amt)}</span></div>`).join("")}
        </div>
      `).join("")}
      <div class="r-divider"></div>
      <div class="r-compare">
        <div class="r-line bad"><span class="lbl">If everyone had a full license</span><span class="dots"></span><span class="amt">${money(naive)}</span></div>
        <div class="r-line"><span class="lbl">With this tool (optimized)</span><span class="dots"></span><span class="amt">${money(optimized)}</span></div>
      </div>

      <div class="compat">
        <div class="c-title">Compatibility checks ${hasWarn ? "" : "· all clear"}</div>
        ${checks.map(c => `<div class="c-item ${c.t}"><span class="ic">${c.t === "warn" ? "!" : c.t === "info" ? "i" : "✓"}</span><span>${c.txt}</span></div>`).join("")}
      </div>

      ${savings > 0 ? `
      <div class="r-savings">
        <div class="r-line"><span class="lbl">Monthly savings you only see because you asked</span><span class="dots"></span><span class="amt">${money(savings)}</span></div>
        <div class="yearly">Yearly: ${money(savings * 12)}</div>
        <div class="basis">Compared against buying a full license for every app each user touches</div>
      </div>` : ``}
    </div>
    <div class="receipt-foot">This result is an estimate, not an official quote. Confirm your final decision with your Microsoft partner.</div>
  `;
}

/* ---------------- Static showcase numbers ----------------
   The hero mockup, the "cost of getting it wrong" box, the
   license guide cards and a few inline amounts are computed
   from PRICING so they always match the selected currency. */

function updateStaticNumbers() {
  const SE = P(APPS.sales.ent.price);
  const CP = P(APPS.cs.pro.price);
  const TM = tmPrice();
  const AT = attachPrice();

  /* sample company: 12 sales ent, 8 cs pro, 3 hybrid (SE base + CS attach), 10 light */
  const l1 = 12 * SE;
  const l2 = 8 * CP;
  const l3 = 3 * (SE + AT);
  const l4 = 10 * TM;
  const total = l1 + l2 + l3 + l4;
  const naive = 12 * SE + 8 * CP + 3 * (SE + CP) + 10 * (SE + CP);
  const save = naive - total;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  /* hero mockup */
  set("m-total", money(total));
  set("m-l1", money(l1));
  set("m-l2", money(l2));
  set("m-l3", money(l3));
  set("m-l4", money(l4));
  set("m-naive", money(naive));
  set("m-save", money(save));
  set("m-year", money(save * 12));

  /* loss box */
  set("loss-over", money(save * 12));
  set("loss-right", money(total * 12));
  set("loss-instead", money(naive * 12));

  /* license guide card prices */
  document.querySelectorAll("[data-price]").forEach(el => {
    const [app, t] = el.dataset.price.split(".");
    el.textContent = money(P(APPS[app][t].price));
  });

  /* inline amounts: attach and team member */
  document.querySelectorAll("[data-amt='attach']").forEach(el => el.textContent = money(AT));
  document.querySelectorAll("[data-amt='tm']").forEach(el => el.textContent = money(TM));

  /* attach example line */
  set("ex-total", money(SE + AT));

  /* pricing page badge */
  set("curBadge", PRICING.currencies[cur].badge);
}

/* ---------------- Pricing table ---------------- */

function renderPriceTable() {
  const el = document.getElementById("priceTable");
  if (!el) return;
  const N = PRICING.priceRowNotes;
  const rows = [
    [APPS.sales.pro.label, "Base", money(P(APPS.sales.pro.price)), N.salesPro],
    [APPS.sales.ent.label, "Base", money(P(APPS.sales.ent.price)), N.salesEnt],
    [APPS.cs.pro.label, "Base", money(P(APPS.cs.pro.price)), N.csPro],
    [APPS.cs.ent.label, "Base", money(P(APPS.cs.ent.price)), N.csEnt],
    [APPS.fs.ent.label, "Base", money(P(APPS.fs.ent.price)), N.fs],
    ["Team Member", "Light user", money(tmPrice()), N.tm],
    ["CE Attach (per app)", "Attach", money(attachPrice()), N.attach]
  ];
  el.innerHTML = rows.map(r =>
    `<tr><td>${r[0]}</td><td class="muted">${r[1]}</td><td class="num">${r[2]}</td><td class="muted" style="font-size:14px">${r[3]}</td></tr>`
  ).join("");
}

/* ---------------- Helpers ---------------- */

function gname(g) { return g.name ? g.name : "Group " + (groups.indexOf(g) + 1); }
function esc(s) {
  return (s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function loadSample() {
  groups = []; gid = 0;
  addGroup({ name: "Sales team", count: 12, apps: ["sales"], profile: "full", advanced: true });
  addGroup({ name: "Customer service", count: 8, apps: ["cs"], profile: "full", advanced: false });
  addGroup({ name: "Sales + service hybrid", count: 3, apps: ["sales", "cs"], profile: "full", advanced: false });
  addGroup({ name: "Managers and report viewers", count: 10, apps: ["sales", "cs"], profile: "light", customApp: false });
}

/* ---------------- Boot ---------------- */

addGroup();
refreshCurrencyUI();
