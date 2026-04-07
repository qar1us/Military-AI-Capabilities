/* =============================================================
   compare.js — Country comparison view
   ============================================================= */

function toggleCompareCountry(country) {
  if (selectedCountries.has(country)) {
    selectedCountries.delete(country);
  } else if (selectedCountries.size < MAX_COMPARE) {
    selectedCountries.add(country);
  }
  updateCompareChipsState();
  updateMapHighlights();

  if (selectedCountries.size === MAX_COMPARE) {
    renderComparison();
  } else {
    document.getElementById("compare-content").innerHTML = `
      <div class="placeholder">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        <p>Select ${MAX_COMPARE - selectedCountries.size} more ${MAX_COMPARE - selectedCountries.size === 1 ? 'country' : 'countries'} to compare</p>
      </div>`;
  }
}

function renderComparison() {
  const countriesArr = Array.from(selectedCountries);
  if (countriesArr.length < 2) return;

  const [c1, c2] = countriesArr;
  const data1 = policyData[c1] || {};
  const data2 = policyData[c2] || {};

  const areaConfig = [
    { name: "LAWS Employment/Deployment", short: "LAWS", color1: "#1a2744", color2: "#6b3074" },
    { name: "Adoption & Intent of Use", short: "Adoption", color1: "#1a2744", color2: "#6b3074" },
    { name: "Acquisition & Procurement", short: "Acquisition", color1: "#1a2744", color2: "#6b3074" },
    { name: "Ethical Guidelines & Restrictions", short: "Ethics", color1: "#1a2744", color2: "#6b3074" },
    { name: "Technical Safety & Security Requirements", short: "Tech Safety", color1: "#1a2744", color2: "#6b3074" },
    { name: "Int'l Cooperation & Interoperability", short: "Int'l Coop.", color1: "#1a2744", color2: "#6b3074" }
  ];

  function countEntries(data, areaName) {
    const area = data[areaName];
    if (!area) return 0;
    return (area.legal_directives?.length || 0) +
      (area.policy_documents?.length || 0) +
      (area.public_statements?.length || 0);
  }

  const totals = {
    c1: Object.keys(data1).reduce((s, k) => s + countEntries(data1, k), 0),
    c2: Object.keys(data2).reduce((s, k) => s + countEntries(data2, k), 0)
  };

  const maxAreaCount = Math.max(1, ...areaConfig.map(a =>
    Math.max(countEntries(data1, a.name), countEntries(data2, a.name))
  ));
  const maxTotal = Math.max(totals.c1, totals.c2, 1);
  const BAR_MAX = 120;

  const content = document.getElementById("compare-content");
  content.innerHTML = "";

  // ---- HEADER ----
  const headerBox = document.createElement("div");
  headerBox.className = "compare-section-box";

  const chartHeaderRow = document.createElement("div");
  chartHeaderRow.className = "chart-header-row";

  const countryNamesRow = document.createElement("div");
  countryNamesRow.className = "country-names-row";

  const nameLabel1 = document.createElement("div");
  nameLabel1.className = "country-name-label country-1";
  nameLabel1.innerHTML = `<span class="country-name-dot"></span>${escapeHtml(displayNames[c1] || c1)}`;
  countryNamesRow.appendChild(nameLabel1);

  const spacer = document.createElement("div");
  spacer.className = "country-name-spacer";
  countryNamesRow.appendChild(spacer);

  const nameLabel2 = document.createElement("div");
  nameLabel2.className = "country-name-label country-2";
  nameLabel2.innerHTML = `${escapeHtml(displayNames[c2] || c2)}<span class="country-name-dot"></span>`;
  countryNamesRow.appendChild(nameLabel2);

  chartHeaderRow.appendChild(countryNamesRow);
  headerBox.appendChild(chartHeaderRow);

  // ---- DIVERGING BAR CHART ----
  const title = document.createElement("div");
  title.className = "compare-section-title";
  title.textContent = "Policy Coverage by Area";
  headerBox.appendChild(title);

  const chart = document.createElement("div");
  chart.className = "diverging-chart";

  // Total row
  const totalRow = document.createElement("div");
  totalRow.className = "chart-row total-row";
  totalRow.innerHTML = `
    <div class="chart-value-left">${totals.c1}</div>
    <div class="chart-bar-left"><div class="chart-bar left" style="width:${Math.round((totals.c1 / maxTotal) * BAR_MAX)}px"></div></div>
    <div class="chart-row-label total">Total Entries</div>
    <div class="chart-bar-right"><div class="chart-bar right" style="width:${Math.round((totals.c2 / maxTotal) * BAR_MAX)}px"></div></div>
    <div class="chart-value-right">${totals.c2}</div>`;
  chart.appendChild(totalRow);

  areaConfig.forEach(area => {
    const v1 = countEntries(data1, area.name);
    const v2 = countEntries(data2, area.name);
    const row = document.createElement("div");
    row.className = "chart-row clickable";
    row.innerHTML = `
      <div class="chart-value-left">${v1}</div>
      <div class="chart-bar-left"><div class="chart-bar left" style="width:${Math.round((v1 / maxAreaCount) * BAR_MAX)}px"></div></div>
      <div class="chart-row-label">${area.short}</div>
      <div class="chart-bar-right"><div class="chart-bar right" style="width:${Math.round((v2 / maxAreaCount) * BAR_MAX)}px"></div></div>
      <div class="chart-value-right">${v2}</div>`;
    row.addEventListener("click", () => {
      const detailBtn = document.getElementById("detail-toggle-btn");
      if (detailBtn && !detailBtn.classList.contains("open")) detailBtn.click();
      const sectionEl = document.querySelector(`.detail-policy-section[data-area="${getDataArea(area.name)}"]`);
      if (sectionEl) {
        sectionEl.classList.add("expanded");
        setTimeout(() => sectionEl.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
      }
    });
    chart.appendChild(row);
  });

  headerBox.appendChild(chart);
  content.appendChild(headerBox);

  // ---- TIMELINE ----
  const timelineBox = document.createElement("div");
  timelineBox.className = "compare-section-box";
  const timelineTitle = document.createElement("div");
  timelineTitle.className = "compare-section-title";
  timelineTitle.textContent = "Policy Timeline";
  timelineBox.appendChild(timelineTitle);

  const years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const timelineContainer = document.createElement("div");
  timelineContainer.className = "compare-timeline-container";

  function getYearEntries(data, year) {
    const entries = [];
    POLICY_AREAS.forEach(area => {
      const d = data[area];
      if (!d) return;
      ['legal_directives', 'policy_documents', 'public_statements'].forEach(type => {
        (d[type] || []).forEach(entry => {
          const dt = extractDate(entry.text || "");
          if (dt && dt.includes(year.toString())) entries.push(entry);
        });
      });
    });
    return entries;
  }

  function buildTimelineRow(country, rowClass) {
    const row_el = document.createElement("div");
    row_el.className = "timeline-row";
    const label = document.createElement("div");
    label.className = `timeline-row-label ${rowClass}`;
    label.textContent = getAlpha3(country);
    row_el.appendChild(label);

    const MAX_DOTS_PER_COL = 5;
    const data = policyData[country] || {};
    years.forEach((year, idx) => {
      const entries = getYearEntries(data, year);
      const pct = (idx / (years.length - 1)) * 100;
      const colWidth = 18;
      entries.forEach((entry, eIdx) => {
        const col = Math.floor(eIdx / MAX_DOTS_PER_COL);
        const row = eIdx % MAX_DOTS_PER_COL;
        const dot = document.createElement("div");
        dot.className = `timeline-dot ${rowClass}`;
        dot.style.cssText = `left:calc(${pct}% + ${col * colWidth}px);top:${8 + row * 14}px;`;
        dot.dataset.title = parseTitleWithoutDate(entry.text || "");
        dot.dataset.year = year;
        dot.dataset.country = displayNames[country] || country;
        row_el.appendChild(dot);
      });
    });
    return row_el;
  }

  timelineContainer.appendChild(buildTimelineRow(c1, "country-1"));

  const axis = document.createElement("div");
  axis.className = "timeline-axis";
  timelineContainer.appendChild(axis);

  timelineContainer.appendChild(buildTimelineRow(c2, "country-2"));

  const yearLabels = document.createElement("div");
  yearLabels.className = "timeline-year-labels";
  years.forEach(y => {
    const lbl = document.createElement("div");
    lbl.className = "timeline-year-label";
    lbl.textContent = y;
    yearLabels.appendChild(lbl);
  });
  timelineContainer.appendChild(yearLabels);

  const legend = document.createElement("div");
  legend.className = "timeline-legend";
  [
    { country: c1, cls: "country-1" },
    { country: c2, cls: "country-2" }
  ].forEach(({ country, cls }) => {
    const item = document.createElement("div");
    item.className = "timeline-legend-item";
    item.innerHTML = `<div class="timeline-legend-dot ${cls}"></div><span>${escapeHtml(displayNames[country] || country)}</span>`;
    legend.appendChild(item);
  });
  timelineContainer.appendChild(legend);
  timelineBox.appendChild(timelineContainer);
  content.appendChild(timelineBox);

  // Timeline tooltip
  let tooltip = document.getElementById("compare-timeline-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "compare-timeline-tooltip";
    tooltip.className = "compare-tooltip";
    document.body.appendChild(tooltip);
  }
  content.querySelectorAll(".timeline-dot").forEach(dot => {
    dot.addEventListener("mouseenter", () => {
      tooltip.innerHTML = `<strong>${dot.dataset.country}</strong><br>${dot.dataset.title}`;
      tooltip.classList.add("visible");
    });
    dot.addEventListener("mousemove", e => {
      tooltip.style.left = (e.clientX + 12) + "px";
      tooltip.style.top = (e.clientY - 50) + "px";
    });
    dot.addEventListener("mouseleave", () => {
      tooltip.classList.remove("visible");
    });
  });

  // ---- PAIRWISE CONVERGENCE CHART ----
  const convergenceBox = document.createElement("div");
  convergenceBox.className = "compare-section-box";
  const convTitle = document.createElement("div");
  convTitle.className = "compare-section-title";
  convTitle.textContent = "Policy Convergence Over Time";
  convergenceBox.appendChild(convTitle);
  renderPairwiseConvergenceChart(c1, c2, convergenceBox);
  content.appendChild(convergenceBox);

  // ---- DETAIL TOGGLE ----
  const toggleBtn = document.createElement("button");
  toggleBtn.id = "detail-toggle-btn";
  toggleBtn.className = "detail-toggle-btn";
  toggleBtn.innerHTML = `<span>View Detailed Policy Comparison</span><span class="detail-toggle-icon">▼</span>`;

  const detailWrapper = document.createElement("div");
  detailWrapper.className = "detail-content-wrapper";

  toggleBtn.addEventListener("click", function () {
    this.classList.toggle("open");
    detailWrapper.classList.toggle("open");
  });
  content.appendChild(toggleBtn);

  // Build detailed comparison
  areaConfig.forEach(area => {
    const d1 = data1[area.name];
    const d2 = data2[area.name];
    const v1 = countEntries(data1, area.name);
    const v2 = countEntries(data2, area.name);
    if (!v1 && !v2) return;

    const section = document.createElement("div");
    section.className = "detail-policy-section";
    const dataArea = getDataArea(area.name);
    if (dataArea) section.setAttribute("data-area", dataArea);

    const sectionHeader = document.createElement("div");
    sectionHeader.className = "detail-policy-header";
    sectionHeader.innerHTML = `
      <span>${area.name}</span>
      <div class="detail-policy-counts" style="margin-left:auto;">
        <span class="count-1">${displayNames[c1] || c1}: ${v1}</span>
        <span class="count-2">${displayNames[c2] || c2}: ${v2}</span>
      </div>
      <span class="toggle-icon" style="margin-left:12px;">▼</span>`;
    sectionHeader.addEventListener("click", () => section.classList.toggle("expanded"));
    section.appendChild(sectionHeader);

    const sectionContent = document.createElement("div");
    sectionContent.className = "detail-policy-content";
    const entriesGrid = document.createElement("div");
    entriesGrid.className = "detail-entries-grid";

    [{ data: d1, country: c1, cls: "country-1" }, { data: d2, country: c2, cls: "country-2" }].forEach(({ data: areaData, country, cls }) => {
      const col = document.createElement("div");
      col.className = `detail-country-entries ${cls}`;
      col.innerHTML = `<h4>${escapeHtml(displayNames[country] || country)}</h4>`;

      if (!areaData) {
        col.innerHTML += '<p style="color:#999;font-size:0.8rem;">No entries</p>';
      } else {
        ['legal_directives', 'policy_documents', 'public_statements'].forEach(type => {
          (areaData[type] || []).forEach(entry => {
            const text = entry.text || "";
            const url = entry.url || extractUrl(text);
            const itemEl = document.createElement("div");
            itemEl.className = "detail-entry-item";
            const headerEl = document.createElement("div");
            headerEl.className = "detail-entry-header";
            headerEl.innerHTML = `
              <div class="detail-entry-info">
                <div class="detail-entry-title">${url ? `<a href="${url}" target="_blank">${escapeHtml(parseTitleWithoutDate(text))}</a>` : escapeHtml(parseTitleWithoutDate(text))}</div>
                ${extractDate(text) ? `<div class="detail-entry-date">${extractDate(text)}</div>` : ''}
              </div>
              <svg class="detail-entry-expand" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 9l-7 7-7-7"/></svg>`;
            headerEl.addEventListener("click", () => itemEl.classList.toggle("expanded"));
            itemEl.appendChild(headerEl);

            const desc = document.createElement("div");
            desc.className = "detail-entry-description";
            desc.innerHTML = parseDetails(text) || `<p>${escapeHtml(text)}</p>`;
            itemEl.appendChild(desc);
            col.appendChild(itemEl);
          });
        });
      }
      entriesGrid.appendChild(col);
    });

    sectionContent.appendChild(entriesGrid);
    section.appendChild(sectionContent);
    detailWrapper.appendChild(section);
  });

  content.appendChild(detailWrapper);
}

function renderPairwiseConvergenceChart(country1, country2, container) {
  const years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const data1 = policyData[country1] || {};
  const data2 = policyData[country2] || {};

  function getAreasActive(data, year) {
    const active = new Set();
    POLICY_AREAS.forEach(area => {
      const d = data[area];
      if (!d) return;
      ['legal_directives', 'policy_documents', 'public_statements'].forEach(type => {
        (d[type] || []).forEach(entry => {
          const dt = extractDate(entry.text || "");
          if (dt) {
            const entryYear = parseInt(dt.match(/\d{4}/)?.[0]);
            if (entryYear && entryYear <= year) active.add(area);
          }
        });
      });
    });
    return active;
  }

  const similarities = years.map(year => {
    const areas1 = getAreasActive(data1, year);
    const areas2 = getAreasActive(data2, year);
    if (areas1.size === 0 && areas2.size === 0) return null;

    const union = new Set([...areas1, ...areas2]);
    const intersection = new Set([...areas1].filter(a => areas2.has(a)));
    const jaccardBase = union.size > 0 ? intersection.size / union.size : 0;
    const penalty = calcVotingDivergencePenalty(country1, country2, year);
    return Math.max(0, Math.min(1, jaccardBase - penalty));
  });

  const lastSim = similarities.filter(s => s !== null).pop() || 0;

  // Current similarity header
  const simHeader = document.createElement("div");
  simHeader.className = "convergence-current-similarity";
  simHeader.innerHTML = `
    <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:1.5rem;font-weight:800;color:var(--navy)">${Math.round(lastSim * 100)}%</div>
    <div>
      <div style="font-weight:600;color:var(--navy);margin-bottom:2px">Current Policy Similarity</div>
      <div style="font-size:0.75rem;color:var(--text-muted)">Based on overlapping policy areas • ${displayNames[country1] || country1} vs ${displayNames[country2] || country2}</div>
    </div>`;
  container.appendChild(simHeader);

  // SVG chart
  const chartContainer = document.createElement("div");
  chartContainer.className = "convergence-similarity-chart";
  chartContainer.style.cssText = "height:auto;width:100%;";

  const W = 700, H = 300;
  const M = { top: 20, right: 40, bottom: 40, left: 50 };
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;

  const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgEl.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svgEl.style.width = "100%";
  svgEl.style.display = "block";

  // Threshold line
  const threshY = M.top + plotH - 0.5 * plotH;
  const threshLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  threshLine.setAttribute("x1", M.left); threshLine.setAttribute("y1", threshY);
  threshLine.setAttribute("x2", M.left + plotW); threshLine.setAttribute("y2", threshY);
  threshLine.setAttribute("stroke", "#ddd"); threshLine.setAttribute("stroke-dasharray", "4,4");
  threshLine.setAttribute("stroke-width", "1.5");
  svgEl.appendChild(threshLine);

  const threshLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  threshLabel.setAttribute("x", M.left + plotW + 4); threshLabel.setAttribute("y", threshY + 4);
  threshLabel.setAttribute("font-size", "9"); threshLabel.setAttribute("fill", "#bbb");
  threshLabel.textContent = "50%";
  svgEl.appendChild(threshLabel);

  // Y axis labels
  [0, 25, 50, 75, 100].forEach(pct => {
    const y = M.top + plotH - (pct / 100) * plotH;
    const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    lbl.setAttribute("x", M.left - 6); lbl.setAttribute("y", y + 4);
    lbl.setAttribute("text-anchor", "end"); lbl.setAttribute("font-size", "9");
    lbl.setAttribute("fill", "#999"); lbl.textContent = pct + "%";
    svgEl.appendChild(lbl);
    if (pct > 0 && pct < 100) {
      const gl = document.createElementNS("http://www.w3.org/2000/svg", "line");
      gl.setAttribute("x1", M.left); gl.setAttribute("y1", y);
      gl.setAttribute("x2", M.left + plotW); gl.setAttribute("y2", y);
      gl.setAttribute("stroke", "#f0f0f0"); gl.setAttribute("stroke-width", "1");
      svgEl.appendChild(gl);
    }
  });

  // Build path
  const validPoints = [];
  similarities.forEach((sim, idx) => {
    if (sim === null) return;
    const x = M.left + (idx / (years.length - 1)) * plotW;
    const y = M.top + plotH - sim * plotH;
    validPoints.push({ x, y, sim, year: years[idx] });
  });

  if (validPoints.length >= 2) {
    const pathD = validPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const linePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    linePath.setAttribute("d", pathD);
    linePath.setAttribute("fill", "none");
    linePath.setAttribute("stroke", "#0d7377");
    linePath.setAttribute("stroke-width", "2.5");
    linePath.setAttribute("stroke-linecap", "round");
    svgEl.appendChild(linePath);
  }

  validPoints.forEach(pt => {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", pt.x); dot.setAttribute("cy", pt.y);
    dot.setAttribute("r", "5"); dot.setAttribute("fill", "#0d7377");
    dot.setAttribute("stroke", "white"); dot.setAttribute("stroke-width", "2");
    dot.style.cursor = "pointer";
    dot.setAttribute("title", `${pt.year}: ${Math.round(pt.sim * 100)}%`);
    svgEl.appendChild(dot);
  });

  // X labels
  years.forEach((year, idx) => {
    if (idx % 2 !== 0) return;
    const x = M.left + (idx / (years.length - 1)) * plotW;
    const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    lbl.setAttribute("x", x); lbl.setAttribute("y", M.top + plotH + 20);
    lbl.setAttribute("text-anchor", "middle"); lbl.setAttribute("font-size", "9");
    lbl.setAttribute("fill", "#999"); lbl.textContent = year;
    svgEl.appendChild(lbl);
  });

  chartContainer.appendChild(svgEl);
  container.appendChild(chartContainer);

  const legend = document.createElement("div");
  legend.className = "convergence-chart-legend";
  legend.innerHTML = `
    <div class="convergence-chart-legend-item"><div class="convergence-legend-line similarity"></div><span>Policy similarity score</span></div>
    <div class="convergence-chart-legend-item"><div class="convergence-legend-line threshold"></div><span>50% threshold</span></div>`;
  container.appendChild(legend);
}
