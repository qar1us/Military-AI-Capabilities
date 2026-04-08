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
    const isTop = rowClass === "country-1"; // country-1 grows upward (bottom), country-2 grows downward (top)
    years.forEach((year, idx) => {
      const entries = getYearEntries(data, year);
      const pct = (idx / (years.length - 1)) * 100;
      const numCols = Math.ceil(entries.length / MAX_DOTS_PER_COL);
      entries.forEach((entry, eIdx) => {
        const col = Math.floor(eIdx / MAX_DOTS_PER_COL);
        const row = eIdx % MAX_DOTS_PER_COL;
        const offsetX = (col - (numCols - 1) / 2) * 14;
        const dot = document.createElement("div");
        dot.className = `timeline-dot ${rowClass}`;
        if (isTop) {
          dot.style.cssText = `left:calc(${pct}% + ${offsetX}px);bottom:${5 + row * 13}px;`;
        } else {
          dot.style.cssText = `left:calc(${pct}% + ${offsetX}px);top:${5 + row * 13}px;`;
        }
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
                <div class="detail-entry-title-row">
                  <span class="detail-entry-title">${escapeHtml(parseTitleWithoutDate(text))}</span>
                  ${extractDate(text) ? `<span class="detail-entry-date">${extractDate(text)}</span>` : ''}
                  ${url ? `<button class="source-link" type="button" title="Open source document"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></button>` : ''}
                </div>
              </div>
              <svg class="detail-entry-expand" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 9l-7 7-7-7"/></svg>`;
            if (url) {
              headerEl.querySelector(".source-link").addEventListener("click", e => { e.stopPropagation(); e.preventDefault(); window.open(url, "_blank"); });
            }
            headerEl.addEventListener("click", (e) => { if (e.target.closest(".source-link")) return; itemEl.classList.toggle("expanded"); });
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
  var years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  var name1 = displayNames[country1] || country1;
  var name2 = displayNames[country2] || country2;
  var color = "#0d7377";

  // Look up pre-calculated pairwise similarity
  var pairwise = rawData.pairwise_similarity || {};
  var pairData = pairwise[country1 + '|' + country2] || pairwise[country2 + '|' + country1] || {};

  var chartData = years.map(function(year) {
    var val = pairData[String(year)];
    return { year: year, similarity: val !== undefined ? val * 100 : null };
  });

  var lastPoint = chartData.filter(function(d) { return d.similarity !== null; }).slice(-1)[0];
  var currentSim = lastPoint ? lastPoint.similarity : 0;

  // Title with info tooltip
  var titleDiv = document.createElement("div");
  titleDiv.className = "convergence-header";
  titleDiv.innerHTML =
    '<div class="convergence-title">Policy Convergence Over Time ' +
    '<span class="convergence-info-icon">\u24D8' +
    '<span class="convergence-info-tooltip">Convergence scores measure policy alignment across the 6 different policy areas, blending coverage (10%) with substantive stance similarity (90%). UN voting records on LAWS resolutions apply additional adjustments.</span>' +
    '</span></div>' +
    '<div class="convergence-subtitle">' + name1 + ' vs ' + name2 + ' — Current similarity: <strong>' + currentSim.toFixed(0) + '%</strong></div>';
  container.appendChild(titleDiv);

  // Chart area (matches alliance view structure)
  var chartArea = document.createElement("div");
  chartArea.className = "convergence-chart-area";
  chartArea.id = "compare-convergence-chart-area";
  chartArea.innerHTML =
    '<div class="convergence-zone-label high">High Convergence</div>' +
    '<div class="convergence-zone-label low">Low Convergence</div>';

  // Append chart area first so we can measure its width
  container.appendChild(chartArea);

  var svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgEl.className = "convergence-chart-svg";

  var height = 300;
  var margin = { top: 30, right: 20, bottom: 45, left: 50 };

  // Use 100% width and let viewBox scale to fill container
  svgEl.setAttribute("width", "100%");
  svgEl.setAttribute("height", height);
  // Defer viewBox to after SVG is in the DOM so we get actual width
  chartArea.appendChild(svgEl);
  var width = svgEl.getBoundingClientRect().width || 700;
  svgEl.setAttribute("viewBox", "0 0 " + width + " " + height);

  var plotWidth = width - margin.left - margin.right;
  var plotHeight = height - margin.top - margin.bottom;

  // Y-axis grid lines and labels
  [0, 25, 50, 75, 100].forEach(function(val) {
    var y = margin.top + plotHeight - (val / 100) * plotHeight;

    var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", margin.left);
    line.setAttribute("y1", y);
    line.setAttribute("x2", width - margin.right);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", "#e8ebef");
    line.setAttribute("stroke-width", "1");
    if (val === 25 || val === 75) line.setAttribute("stroke-dasharray", "4,4");
    svgEl.appendChild(line);

    var label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", margin.left - 10);
    label.setAttribute("y", y + 4);
    label.setAttribute("text-anchor", "end");
    label.setAttribute("font-size", "11");
    label.setAttribute("fill", "#7a8a9a");
    label.textContent = val + "%";
    svgEl.appendChild(label);
  });

  // Y-axis label
  var yLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  yLabel.setAttribute("x", 15);
  yLabel.setAttribute("y", margin.top + plotHeight / 2);
  yLabel.setAttribute("text-anchor", "middle");
  yLabel.setAttribute("font-size", "11");
  yLabel.setAttribute("fill", "#1a2744");
  yLabel.setAttribute("font-weight", "600");
  yLabel.setAttribute("transform", "rotate(-90, 15, " + (margin.top + plotHeight / 2) + ")");
  yLabel.textContent = "Policy Similarity Index";
  svgEl.appendChild(yLabel);

  // X-axis with ticks and labels
  years.forEach(function(year, idx) {
    var x = margin.left + (idx / (years.length - 1)) * plotWidth;

    var tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
    tick.setAttribute("x1", x);
    tick.setAttribute("y1", margin.top + plotHeight);
    tick.setAttribute("x2", x);
    tick.setAttribute("y2", margin.top + plotHeight + 5);
    tick.setAttribute("stroke", "#7a8a9a");
    tick.setAttribute("stroke-width", "1");
    svgEl.appendChild(tick);

    var label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x);
    label.setAttribute("y", margin.top + plotHeight + 20);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "11");
    label.setAttribute("fill", "#7a8a9a");
    label.setAttribute("font-weight", "600");
    label.textContent = year;
    svgEl.appendChild(label);
  });

  // X-axis label
  var xLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  xLabel.setAttribute("x", margin.left + plotWidth / 2);
  xLabel.setAttribute("y", height - 8);
  xLabel.setAttribute("text-anchor", "middle");
  xLabel.setAttribute("font-size", "11");
  xLabel.setAttribute("fill", "#1a2744");
  xLabel.setAttribute("font-weight", "600");
  xLabel.textContent = "Year";
  svgEl.appendChild(xLabel);

  // Line path
  var validPoints = chartData.filter(function(d) { return d.similarity !== null; });
  if (validPoints.length >= 2) {
    var pathD = "";
    validPoints.forEach(function(d, idx) {
      var x = margin.left + ((d.year - 2016) / (2025 - 2016)) * plotWidth;
      var y = margin.top + plotHeight - (d.similarity / 100) * plotHeight;
      pathD += (idx === 0 ? "M " : " L ") + x + " " + y;
    });
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathD);
    path.setAttribute("class", "convergence-line");
    path.setAttribute("stroke", color);
    svgEl.appendChild(path);
  }

  // Dots with hover tooltip
  var tooltip = document.getElementById("compare-convergence-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "compare-convergence-tooltip";
    tooltip.className = "convergence-tooltip";
    document.body.appendChild(tooltip);
  }

  validPoints.forEach(function(d) {
    var x = margin.left + ((d.year - 2016) / (2025 - 2016)) * plotWidth;
    var y = margin.top + plotHeight - (d.similarity / 100) * plotHeight;

    var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", 6);
    circle.setAttribute("fill", color);
    circle.setAttribute("class", "convergence-dot");

    circle.addEventListener("mouseenter", function(e) {
      tooltip.innerHTML = '<strong>' + name1 + ' vs ' + name2 + '</strong><br>Year: ' + d.year + '<br>Similarity: ' + d.similarity.toFixed(1) + '%';
      tooltip.classList.add("visible");
    });
    circle.addEventListener("mousemove", function(e) {
      tooltip.style.left = (e.clientX + 15) + "px";
      tooltip.style.top = (e.clientY - 10) + "px";
    });
    circle.addEventListener("mouseleave", function() {
      tooltip.classList.remove("visible");
    });
    svgEl.appendChild(circle);
  });

  // Legend
  var legend = document.createElement("div");
  legend.className = "convergence-legend";
  legend.innerHTML =
    '<div class="convergence-legend-item"><div class="convergence-legend-left">' +
    '<div class="convergence-legend-marker" style="background:' + color + '"></div>' +
    '<span class="convergence-legend-name">' + name1 + ' vs ' + name2 + '</span>' +
    '</div></div>';
  container.appendChild(legend);
}
