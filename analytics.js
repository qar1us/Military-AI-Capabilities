/* =============================================================
   analytics.js — Momentum, policy growth, convergence charts
   ============================================================= */

// ===== MOMENTUM CHART =====

function calculateMomentumData() {
  const data = [];
  const years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

  Object.keys(policyData).forEach(country => {
    const region = regionMap[country] || "Other";
    const yearCounts = {};
    let totalEntries = 0;

    years.forEach(y => { yearCounts[y] = 0; });

    POLICY_AREAS.forEach(area => {
      const areaData = policyData[country][area];
      if (!areaData) return;
      ['legal_directives', 'policy_documents', 'public_statements'].forEach(type => {
        (areaData[type] || []).forEach(entry => {
          const dt = extractDate(entry.text || "");
          if (dt) {
            const yr = parseInt(dt.match(/\d{4}/)?.[0]);
            if (yr && years.includes(yr)) { yearCounts[yr]++; totalEntries++; }
          }
        });
      });
    });

    if (totalEntries === 0) return;

    const recent2 = (yearCounts[2024] || 0) + (yearCounts[2025] || 0);
    const prev2 = (yearCounts[2022] || 0) + (yearCounts[2023] || 0);
    const momentum = prev2 > 0 ? ((recent2 - prev2) / prev2) * 100 : (recent2 > 0 ? 100 : 0);

    let status;
    if (momentum > 50) status = "accelerating";
    else if (momentum > 0) status = "steady";
    else if (totalEntries > 3) status = "emerging";
    else status = "dormant";

    data.push({
      country, region, totalEntries, recent2, prev2,
     momentum: Math.max(-100, Math.min(100, Math.round(momentum))), status,
      displayName: displayNames[country] || country
    });
  });

  return data.sort((a, b) => b.totalEntries - a.totalEntries);
}

window.momentumChartData = null;
window.momentumReapplyHighlight = null;

function renderMomentumChart() {
  const container = document.getElementById("momentum-chart");
  if (!container) return;
  if (!Object.keys(policyData).length) return;

  const data = calculateMomentumData();
  window.momentumChartData = data;

  const containerW = container.clientWidth || 800;
  const containerH = 320;
  const M = { top: 30, right: 20, bottom: 60, left: 50 };
  const plotW = containerW - M.left - M.right;
  const plotH = containerH - M.top - M.bottom;

  const maxEntries = Math.max(1, ...data.map(d => d.totalEntries));
  const maxMomentum = 100;

  const statusColors = {
    accelerating: "#4a9d5b",
    steady: "#0d7377",
    emerging: "#e07020",
    dormant: "#999"
  };

  container.innerHTML = "";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", containerW);
  svg.setAttribute("height", containerH);
  svg.style.display = "block";

  // Grid lines
  const mkLine = (x1, y1, x2, y2, s, sw, dash) => {
    const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
    l.setAttribute("x1", x1); l.setAttribute("y1", y1);
    l.setAttribute("x2", x2); l.setAttribute("y2", y2);
    l.setAttribute("stroke", s); l.setAttribute("stroke-width", sw);
    if (dash) l.setAttribute("stroke-dasharray", dash);
    return l;
  };

  // Zero line
  const zeroY = M.top + plotH * 0.5;
  svg.appendChild(mkLine(M.left, zeroY, M.left + plotW, zeroY, "#ccc", "1", "4,4"));

  // Y axis labels
  const yTicks = [-100, -50, 0, 50, 100];
  yTicks.forEach(tick => {
    const y = M.top + plotH * (1 - (tick + maxMomentum) / (2 * maxMomentum));
    const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    lbl.setAttribute("x", M.left - 8); lbl.setAttribute("y", y + 4);
    lbl.setAttribute("text-anchor", "end"); lbl.setAttribute("font-size", "10"); lbl.setAttribute("fill", "#999");
    lbl.textContent = tick + "%";
    svg.appendChild(lbl);
    if (tick !== 0) svg.appendChild(mkLine(M.left, y, M.left + plotW, y, "#eee", "1", ""));
  });

  // Y axis label
  const yLabelEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
  yLabelEl.setAttribute("x", 14); yLabelEl.setAttribute("y", M.top + plotH / 2);
  yLabelEl.setAttribute("text-anchor", "middle"); yLabelEl.setAttribute("font-size", "10");
  yLabelEl.setAttribute("fill", "#666"); yLabelEl.setAttribute("font-weight", "600");
  yLabelEl.setAttribute("transform", `rotate(-90, 14, ${M.top + plotH / 2})`);
  yLabelEl.textContent = "Momentum (%)";
  svg.appendChild(yLabelEl);

  // X axis label
  const xLabelEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
  xLabelEl.setAttribute("x", M.left + plotW / 2); xLabelEl.setAttribute("y", containerH - 8);
  xLabelEl.setAttribute("text-anchor", "middle"); xLabelEl.setAttribute("font-size", "10");
  xLabelEl.setAttribute("fill", "#666"); xLabelEl.setAttribute("font-weight", "600");
  xLabelEl.textContent = "Number of Policies (2023-2025)";
  svg.appendChild(xLabelEl);

  // Quadrant labels
  const quadrantLabels = [
    { x: M.left + plotW * 0.85, y: M.top + 14, text: "HIGH VOLUME + GROWING" },
    { x: M.left + plotW * 0.85, y: M.top + plotH - 8, text: "HIGH VOLUME + SLOWING" },
    { x: M.left + 10, y: M.top + 14, text: "EMERGING" },
    { x: M.left + 10, y: M.top + plotH - 8, text: "DECLINING" }
  ];
  quadrantLabels.forEach(({ x, y, text }) => {
    const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    lbl.setAttribute("x", x); lbl.setAttribute("y", y);
    lbl.setAttribute("text-anchor", x < M.left + plotW / 2 ? "start" : "end");
    lbl.setAttribute("font-size", "8"); lbl.setAttribute("fill", "rgba(26,39,68,0.25)");
    lbl.setAttribute("font-weight", "700"); lbl.setAttribute("letter-spacing", "1");
    lbl.textContent = text;
    svg.appendChild(lbl);
  });

  // Dots
  const dotsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  data.forEach(d => {
    const x = M.left + (d.totalEntries / maxEntries) * plotW;
    const y = M.top + plotH * (1 - (d.momentum + maxMomentum) / (2 * maxMomentum));
    const r = 4 + Math.sqrt(d.totalEntries) * 0.8;

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x); circle.setAttribute("cy", y); circle.setAttribute("r", r);
    circle.setAttribute("fill", regionColors[d.region] || "#999");
    circle.setAttribute("fill-opacity", "0.75");
    circle.setAttribute("stroke", statusColors[d.status]); circle.setAttribute("stroke-width", "2");
    circle.setAttribute("data-country", d.country);
    circle.style.cursor = "pointer";
    circle.style.transition = "r 0.15s, fill-opacity 0.15s";

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x); label.setAttribute("y", y - r - 3);
    label.setAttribute("text-anchor", "middle"); label.setAttribute("font-size", "9");
    label.setAttribute("fill", "#333"); label.setAttribute("font-weight", "600");
    label.setAttribute("data-country-label", d.country);
    label.style.pointerEvents = "none";
    label.textContent = getAlpha3(d.country);

    const tipEl = document.getElementById("momentum-tooltip");

    circle.addEventListener("mouseenter", function () {
      this.setAttribute("r", parseFloat(this.getAttribute("r")) + 3);
      this.setAttribute("fill-opacity", "1");
      if (tipEl) {
        tipEl.innerHTML = `<strong>${escapeHtml(d.displayName)}</strong>
          Momentum: <span class="tooltip-status ${d.status}">${d.momentum > 0 ? '+' : ''}${d.momentum}%</span><br>
          Total entries: ${d.totalEntries}<br>
          Recent (2024–25): ${d.recent2} | Prior: ${d.prev2}<br>
          Status: <span class="tooltip-status ${d.status}">${d.status.charAt(0).toUpperCase() + d.status.slice(1)}</span>`;
        tipEl.classList.add("visible");
      }
    });
    circle.addEventListener("mousemove", function (e) {
      if (tipEl) { tipEl.style.left = `${e.clientX + 14}px`; tipEl.style.top = `${e.clientY - 10}px`; }
    });
    circle.addEventListener("mouseleave", function () {
      this.setAttribute("r", r);
      this.setAttribute("fill-opacity", "0.75");
      tipEl?.classList.remove("visible");
    });
    circle.addEventListener("click", () => {
      const tab = document.querySelector('.explore-tab[data-view="overview"]');
      if (tab) tab.click();
      selectOverviewCountry(d.country);
    });

    dotsGroup.appendChild(circle);
    dotsGroup.appendChild(label);
  });
  svg.appendChild(dotsGroup);

  // X axis ticks
  [0, 10, 20, 30, 40, 50].forEach(val => {
    if (val > maxEntries + 5) return;
    const x = M.left + (val / maxEntries) * plotW;
    const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    lbl.setAttribute("x", x); lbl.setAttribute("y", M.top + plotH + 16);
    lbl.setAttribute("text-anchor", "middle"); lbl.setAttribute("font-size", "9"); lbl.setAttribute("fill", "#999");
    lbl.textContent = val;
    svg.appendChild(lbl);
    svg.appendChild(mkLine(x, M.top + plotH, x, M.top + plotH + 4, "#999", "1", ""));
  });

  container.appendChild(svg);

  // Search highlight
  const searchInput = document.getElementById("momentum-search");
  window.momentumReapplyHighlight = function (query) {
    if (!query) {
      svg.querySelectorAll("circle[data-country]").forEach(c => {
        c.setAttribute("fill-opacity", "0.75"); c.setAttribute("stroke-width", "2");
      });
      svg.querySelectorAll("text[data-country-label]").forEach(l => l.setAttribute("fill", "#333"));
      return;
    }
    const q = query.toLowerCase();
    svg.querySelectorAll("circle[data-country]").forEach(c => {
      const key = c.getAttribute("data-country");
      const nm = (displayNames[key] || key).toLowerCase();
      const match = nm.includes(q) || key.toLowerCase().includes(q);
      c.setAttribute("fill-opacity", match ? "1" : "0.15");
      c.setAttribute("stroke-width", match ? "3" : "1");
    });
    svg.querySelectorAll("text[data-country-label]").forEach(l => {
      const key = l.getAttribute("data-country-label");
      const nm = (displayNames[key] || key).toLowerCase();
      l.setAttribute("fill", nm.includes(q) || key.toLowerCase().includes(q) ? "#1a2744" : "#ddd");
    });
  };

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      window.momentumReapplyHighlight(this.value.trim());
    });
  }
}

// ===== POLICY GROWTH CHART =====

function renderPolicyGrowthChart() {
  const container = document.getElementById("policy-growth-container");
  if (!container) return;
  if (!Object.keys(policyData).length) return;

  // Clear previous
  container.innerHTML = "";

  const years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const areaKeys = [
    { key: "laws", name: "LAWS Employment/Deployment", color: "#1a2744" },
    { key: "adoption", name: "Adoption & Intent of Use", color: "#d64045" },
    { key: "acquisition", name: "Acquisition & Procurement", color: "#6b3074" },
    { key: "ethical", name: "Ethical Guidelines & Restrictions", color: "#4a9d5b" },
    { key: "technical", name: "Technical Safety & Security Requirements", color: "#e07020" },
    { key: "international", name: "Int'l Cooperation & Interoperability", color: "#0d7377" }
  ];

  const areaNameToKey = {};
  areaKeys.forEach(a => { areaNameToKey[a.name] = a.key; });

  // Count entries per year per area
  const yearAreaCounts = {};
  years.forEach(y => {
    yearAreaCounts[y] = {};
    areaKeys.forEach(a => { yearAreaCounts[y][a.key] = 0; });
  });

  Object.keys(policyData).forEach(country => {
    POLICY_AREAS.forEach(area => {
      const areaData = policyData[country][area];
      if (!areaData) return;
      const areaKey = areaNameToKey[area];
      if (!areaKey) return;

      ['legal_directives', 'policy_documents', 'public_statements'].forEach(type => {
        (areaData[type] || []).forEach(entry => {
          const dt = extractDate(entry.text || "");
          if (dt) {
            const yr = parseInt(dt.match(/\d{4}/)?.[0]);
            if (yr && years.includes(yr)) yearAreaCounts[yr][areaKey]++;
          }
          // NOTE: Undated entries are intentionally excluded from the growth chart.
          // In the time slider choropleth they default to Q4, but here the chart
          // only shows dated entries to accurately reflect year-by-year growth.
        });
      });
    });
  });

  const maxYearTotal = Math.max(1, ...years.map(y =>
    Object.values(yearAreaCounts[y]).reduce((s, v) => s + v, 0)
  ));

  // Build chart
  const wrapper = document.createElement("div");
  wrapper.className = "policy-growth-chart";

  // Y axis
  const yAxis = document.createElement("div");
  yAxis.className = "policy-growth-y-axis";

  const gridContainer = document.createElement("div");
  gridContainer.className = "policy-growth-grid";

  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const val = Math.round((maxYearTotal / ySteps) * i);
    const pct = (i / ySteps) * 100;

    const label = document.createElement("div");
    label.textContent = val;
    yAxis.insertBefore(label, yAxis.firstChild);

    const gridLine = document.createElement("div");
    gridLine.className = "policy-growth-grid-line";
    gridLine.style.bottom = `${pct}%`;
    gridContainer.appendChild(gridLine);
  }
  wrapper.appendChild(yAxis);
  wrapper.appendChild(gridContainer);

  // X axis
  const xAxis = document.createElement("div");
  xAxis.className = "policy-growth-x-axis";
  years.forEach(y => {
    const lbl = document.createElement("div");
    lbl.className = "policy-growth-x-label";
    lbl.textContent = y;
    xAxis.appendChild(lbl);
  });

  // Bars
  const barsContainer = document.createElement("div");
  barsContainer.className = "policy-growth-bars";

  const hoverPanel = document.createElement("div");
  hoverPanel.className = "policy-growth-hover-panel";
  document.body.appendChild(hoverPanel);

  years.forEach(year => {
    const yearTotal = Object.values(yearAreaCounts[year]).reduce((s, v) => s + v, 0);
    const yearGroup = document.createElement("div");
    yearGroup.className = "policy-growth-year-group";

    const barGroup = document.createElement("div");
    barGroup.className = "policy-growth-bar-group";

    const stack = document.createElement("div");
    stack.className = "policy-growth-bar-stack";
    stack.style.height = yearTotal > 0 ? `${(yearTotal / maxYearTotal) * 100}%` : "0";

    areaKeys.forEach(area => {
      const count = yearAreaCounts[year][area.key];
      if (count === 0) return;
      const pct = (count / yearTotal) * 100;
      const seg = document.createElement("div");
      seg.className = "policy-growth-bar-segment";
      seg.style.cssText = `flex:${pct};background:${area.color};`;
      stack.appendChild(seg);
    });
    barGroup.appendChild(stack);

    barGroup.addEventListener("mouseenter", e => {
      if (yearTotal === 0) return;
      hoverPanel.innerHTML = `
        <div class="policy-growth-hover-title">
          <span>${year}</span>
          <span class="policy-growth-hover-total">${yearTotal} entries</span>
        </div>
        <div class="policy-growth-hover-rows">
          ${areaKeys.map(area => {
            const cnt = yearAreaCounts[year][area.key];
            const pct = yearTotal > 0 ? Math.round((cnt / yearTotal) * 100) : 0;
            return `<div class="policy-growth-hover-row">
              <div class="policy-growth-hover-row-label" style="color:${area.color};font-weight:600">${getShortAreaName(area.name)}</div>
              <div class="policy-growth-hover-row-bar"><div class="policy-growth-hover-row-fill" style="width:${pct}%;background:${area.color}"></div></div>
              <div class="policy-growth-hover-row-pct">${pct}%</div>
              <div class="policy-growth-hover-row-count">${cnt}</div>
            </div>`;
          }).join('')}
        </div>`;
      hoverPanel.classList.add("visible");
    });

    barGroup.addEventListener("mousemove", e => {
      const panelW = hoverPanel.offsetWidth;
      const panelH = hoverPanel.offsetHeight;
      const left = Math.min(e.clientX + 16, window.innerWidth - panelW - 8);
      const top = Math.max(8, e.clientY - panelH / 2);
      hoverPanel.style.left = left + "px";
      hoverPanel.style.top = top + "px";
    });

    barGroup.addEventListener("mouseleave", () => hoverPanel.classList.remove("visible"));

    yearGroup.appendChild(barGroup);
    barsContainer.appendChild(yearGroup);
  });

  wrapper.appendChild(barsContainer);
  wrapper.appendChild(xAxis);
  container.appendChild(wrapper);

  // Legend
  const legend = document.createElement("div");
  legend.style.cssText = "display:flex;flex-wrap:wrap;gap:12px;margin-top:16px;font-size:0.75rem;";
  areaKeys.forEach(area => {
    const item = document.createElement("div");
    item.style.cssText = "display:flex;align-items:center;gap:6px;";
    item.innerHTML = `<div style="width:12px;height:12px;border-radius:2px;background:${area.color};flex-shrink:0;"></div>
      <span style="color:#666;">${getShortAreaName(area.name)}</span>`;
    legend.appendChild(item);
  });
  container.appendChild(legend);
}

// ===== CONVERGENCE TIMELINE (alliance view) =====

function renderConvergenceTimeline(alliance) {
  const container = document.getElementById("convergence-timeline-container");
  if (!container) return;

  container.style.display = "block";
  container.innerHTML = "";

  const groupings = convergenceGroupings;
  const allianceGroupings = {};
  if (alliance === "NATO") allianceGroupings["NATO Members"] = groupings["NATO Members"];
  if (alliance === "AUKUS") allianceGroupings["AUKUS"] = groupings["AUKUS"];
  if (alliance === "FVEY") allianceGroupings["Five Eyes"] = groupings["Five Eyes"];

  const wrapper = document.createElement("div");
  wrapper.className = "convergence-timeline-container";

  const header = document.createElement("div");
  header.className = "convergence-header";
  header.innerHTML = `
    <div class="convergence-title">
      Policy Convergence Over Time
      <div class="convergence-info-icon">i
        <div class="convergence-info-tooltip">
          Convergence scores measure how similarly member states approach AI governance.
          Higher scores indicate greater policy alignment. Calculated using Jaccard similarity across shared policy areas.
        </div>
      </div>
    </div>
    <div class="convergence-subtitle">Tracking policy alignment trends within ${alliance}</div>`;
  wrapper.appendChild(header);

  // Group toggle buttons
  const groupingButtons = document.createElement("div");
  groupingButtons.className = "convergence-groupings";
  const groupLabel = document.createElement("div");
  groupLabel.className = "convergence-groupings-label";
  groupLabel.textContent = "Select groups to compare:";
  groupingButtons.appendChild(groupLabel);

  Object.keys(allianceGroupings).forEach(gName => {
    const btn = document.createElement("button");
    btn.className = "convergence-group-btn" + (activeConvergenceGroups.includes(gName) ? " active" : "");
    btn.textContent = gName;
    btn.addEventListener("click", function () {
      if (activeConvergenceGroups.includes(gName)) {
        activeConvergenceGroups = activeConvergenceGroups.filter(g => g !== gName);
      } else {
        activeConvergenceGroups.push(gName);
      }
      renderConvergenceChart(allianceGroupings, container);
    });
    groupingButtons.appendChild(btn);
  });
  wrapper.appendChild(groupingButtons);

  // Chart area
  const chartArea = document.createElement("div");
  chartArea.className = "convergence-chart-area";
  chartArea.id = "convergence-chart-area";

  const highLabel = document.createElement("div");
  highLabel.className = "convergence-zone-label high";
  highLabel.textContent = "HIGH ALIGNMENT";
  const lowLabel = document.createElement("div");
  lowLabel.className = "convergence-zone-label low";
  lowLabel.textContent = "LOW ALIGNMENT";

  chartArea.appendChild(highLabel);
  chartArea.appendChild(lowLabel);
  wrapper.appendChild(chartArea);

  // Legend
  const legendEl = document.createElement("div");
  legendEl.className = "convergence-legend";
  legendEl.id = "convergence-legend";
  wrapper.appendChild(legendEl);

  // Similarity bars section
  const simSection = document.createElement("div");
  simSection.className = "convergence-similarity-section";
  simSection.id = "convergence-similarity-section";
  wrapper.appendChild(simSection);

  container.appendChild(wrapper);

  // Auto-activate first group
  if (activeConvergenceGroups.length === 0 && Object.keys(allianceGroupings).length > 0) {
    activeConvergenceGroups = [Object.keys(allianceGroupings)[0]];
  }

  renderConvergenceChart(allianceGroupings, container);
}

function calculateGroupSimilarity(members, year) {
  const membersWithData = members.filter(m => policyData[m]);
  if (membersWithData.length < 2) return null;

  let totalSimilarity = 0, pairs = 0;
  for (let i = 0; i < membersWithData.length; i++) {
    for (let j = i + 1; j < membersWithData.length; j++) {
      const sim = calculateCountrySimilarity(membersWithData[i], membersWithData[j], year);
      if (sim !== null) { totalSimilarity += sim; pairs++; }
    }
  }
  return pairs > 0 ? totalSimilarity / pairs : null;
}

function calculateCountrySimilarity(c1, c2, year) {
  const data1 = policyData[c1], data2 = policyData[c2];
  if (!data1 || !data2) return null;

  function getAreasActive(data) {
    const active = new Set();
    POLICY_AREAS.forEach(area => {
      const d = data[area];
      if (!d) return;
      ['legal_directives', 'policy_documents', 'public_statements'].forEach(type => {
        (d[type] || []).forEach(entry => {
          const dt = extractDate(entry.text || "");
          if (dt) {
            const yr = parseInt(dt.match(/\d{4}/)?.[0]);
            if (yr && yr <= year) active.add(area);
          }
        });
      });
    });
    return active;
  }

  const areas1 = getAreasActive(data1);
  const areas2 = getAreasActive(data2);
  if (areas1.size === 0 && areas2.size === 0) return null;

  const union = new Set([...areas1, ...areas2]);
  const intersection = new Set([...areas1].filter(a => areas2.has(a)));
  const jaccardBase = union.size > 0 ? intersection.size / union.size : 0;
  const penalty = calcVotingDivergencePenalty(c1, c2, year);
  return Math.max(0, Math.min(1, jaccardBase - penalty));
}

function renderConvergenceChart(allianceGroupings, parentContainer) {
  const chartArea = parentContainer.querySelector("#convergence-chart-area") ||
    document.getElementById("convergence-chart-area");
  const legendEl = parentContainer.querySelector("#convergence-legend") ||
    document.getElementById("convergence-legend");
  const simSection = parentContainer.querySelector("#convergence-similarity-section") ||
    document.getElementById("convergence-similarity-section");

  if (!chartArea) return;

  // Update button states
  parentContainer.querySelectorAll(".convergence-group-btn").forEach(btn => {
    const gName = btn.textContent.replace("✓ ", "");
    btn.classList.toggle("active", activeConvergenceGroups.includes(gName));
  });

  // Build SVG
  const W = chartArea.clientWidth || 700;
  const H = 300;
  const M = { top: 20, right: 30, bottom: 40, left: 50 };
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;

  const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgEl.setAttribute("class", "convergence-chart-svg");
  svgEl.setAttribute("viewBox", `0 0 ${W} ${H}`);
  chartArea.innerHTML = "";

  // Re-add zone labels
  const highZ = document.createElement("div");
  highZ.className = "convergence-zone-label high";
  highZ.textContent = "HIGH ALIGNMENT";
  chartArea.appendChild(highZ);
  const lowZ = document.createElement("div");
  lowZ.className = "convergence-zone-label low";
  lowZ.textContent = "LOW ALIGNMENT";
  chartArea.appendChild(lowZ);

  const years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const mkLine = (x1, y1, x2, y2, stroke, sw, dash) => {
    const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
    l.setAttribute("x1", x1); l.setAttribute("y1", y1);
    l.setAttribute("x2", x2); l.setAttribute("y2", y2);
    l.setAttribute("stroke", stroke); l.setAttribute("stroke-width", sw);
    if (dash) l.setAttribute("stroke-dasharray", dash);
    return l;
  };

  // Axes
  svgEl.appendChild(mkLine(M.left, M.top, M.left, M.top + plotH, "#ddd", "1", ""));
  svgEl.appendChild(mkLine(M.left, M.top + plotH, M.left + plotW, M.top + plotH, "#ddd", "1", ""));

  // Y grid
  [0, 25, 50, 75, 100].forEach(pct => {
    const y = M.top + plotH - (pct / 100) * plotH;
    if (pct > 0 && pct < 100) svgEl.appendChild(mkLine(M.left, y, M.left + plotW, y, "#f0f0f0", "1", ""));
    const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    lbl.setAttribute("x", M.left - 6); lbl.setAttribute("y", y + 4);
    lbl.setAttribute("text-anchor", "end"); lbl.setAttribute("font-size", "9"); lbl.setAttribute("fill", "#999");
    lbl.textContent = pct + "%";
    svgEl.appendChild(lbl);
  });

  // X axis labels
  years.forEach((year, idx) => {
    if (idx % 2 !== 0) return;
    const x = M.left + (idx / (years.length - 1)) * plotW;
    const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    lbl.setAttribute("x", x); lbl.setAttribute("y", M.top + plotH + 20);
    lbl.setAttribute("text-anchor", "middle"); lbl.setAttribute("font-size", "9"); lbl.setAttribute("fill", "#999");
    lbl.textContent = year;
    svgEl.appendChild(lbl);
  });

  const groupColors = ["#0d7377", "#e07020", "#1a2744", "#6b3074", "#d64045"];
  const legData = [];
  const convTip = document.querySelector(".convergence-tooltip") || (() => {
    const el = document.createElement("div"); el.className = "convergence-tooltip"; document.body.appendChild(el); return el;
  })();

  activeConvergenceGroups.forEach((gName, gIdx) => {
    const group = allianceGroupings[gName];
    if (!group) return;
    const color = groupColors[gIdx % groupColors.length];

    const scores = years.map(year => calculateGroupSimilarity(group.members, year));
    const validPoints = [];

    scores.forEach((score, idx) => {
      if (score === null) return;
      const x = M.left + (idx / (years.length - 1)) * plotW;
      const y = M.top + plotH - score * plotH;
      validPoints.push({ x, y, score, year: years[idx] });
    });

    if (validPoints.length >= 2) {
      const pathD = validPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      const linePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      linePath.setAttribute("d", pathD);
      linePath.setAttribute("fill", "none"); linePath.setAttribute("stroke", color);
      linePath.setAttribute("stroke-width", "2.5"); linePath.setAttribute("stroke-linecap", "round");
      svgEl.appendChild(linePath);
    }

    validPoints.forEach(pt => {
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", pt.x); dot.setAttribute("cy", pt.y);
      dot.setAttribute("r", "5"); dot.setAttribute("fill", color);
      dot.setAttribute("stroke", "white"); dot.setAttribute("stroke-width", "2");
      dot.setAttribute("class", "convergence-dot");
      dot.style.cursor = "pointer";

      dot.addEventListener("mouseenter", function (e) {
        convTip.innerHTML = `<strong>${gName} — ${pt.year}</strong><br>Similarity: ${Math.round(pt.score * 100)}%`;
        convTip.classList.add("visible");
      });
      dot.addEventListener("mousemove", e => {
        convTip.style.left = `${e.clientX + 14}px`;
        convTip.style.top = `${e.clientY - 10}px`;
      });
      dot.addEventListener("mouseleave", () => convTip.classList.remove("visible"));
      svgEl.appendChild(dot);
    });

    const lastValid = validPoints.filter(p => p.score !== null).pop();
    legData.push({ name: gName, color, currentSimilarity: lastValid ? Math.round(lastValid.score * 100) : null });
  });

  chartArea.appendChild(svgEl);

  // Legend
  if (legendEl) {
    legendEl.innerHTML = "";
    legData.forEach(item => {
      const legItem = document.createElement("div");
      legItem.className = "convergence-legend-item";
      legItem.innerHTML = `
        <div class="convergence-legend-left">
          <div class="convergence-legend-marker" style="background:${item.color}"></div>
          <div class="convergence-legend-name">${item.name}</div>
        </div>
        ${item.currentSimilarity !== null
          ? `<div style="font-weight:700;color:${item.color};font-size:0.9rem">${item.currentSimilarity}%</div>`
          : ''}`;
      legendEl.appendChild(legItem);
    });
  }

  // Similarity bars
  if (simSection) {
    simSection.innerHTML = `<div class="convergence-similarity-title">Current Similarity by Group</div>
      <div class="convergence-similarity-bars" id="convergence-sim-bars"></div>`;
    const barsEl = simSection.querySelector("#convergence-sim-bars");
    legData.forEach(item => {
      if (item.currentSimilarity === null) return;
      const row = document.createElement("div");
      row.className = "convergence-similarity-row";
      row.innerHTML = `
        <div class="convergence-similarity-name">${item.name}</div>
        <div class="convergence-similarity-bar-bg">
          <div class="convergence-similarity-bar-fill" style="width:${item.currentSimilarity}%;background:${item.color}"></div>
        </div>
        <div class="convergence-similarity-value">${item.currentSimilarity}%</div>`;
      barsEl.appendChild(row);
    });
  }
}
