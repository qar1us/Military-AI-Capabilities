/* =============================================================
   overview.js — Country overview, alliance view, keyword search,
                 side panel, policy area filter
   ============================================================= */

// ===== NAVIGATION HELPERS =====

function selectOverviewCountry(country, skipScroll) {
  selectedCountry = country;
  currentContentType = "country";

  document.getElementById("policy-area-filter").value = "";
  document.getElementById("keyword-search").value = "";
  document.getElementById("overview-dropdown").value = country;

  updateMapHighlights();
  renderOverview();

  if (!skipScroll) {
    setTimeout(() => {
      document.getElementById("view-overview")?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
}

function switchToCountryOverview(countryKey) {
  currentView = "overview";

  document.querySelectorAll(".explore-tab").forEach(t => {
    t.classList.remove("active");
    t.setAttribute("aria-selected", "false");
  });
  const overviewTab = document.querySelector('.explore-tab[data-view="overview"]');
  overviewTab.classList.add("active");
  overviewTab.setAttribute("aria-selected", "true");

  document.querySelectorAll(".view-content").forEach(v => v.classList.remove("active"));
  document.getElementById("view-overview").classList.add("active");

  selectOverviewCountry(countryKey);
}

function selectAlliance(alliance) {
  selectedAlliance = alliance;
  document.getElementById("alliance-dropdown").value = alliance;
  updateMapHighlights();
  renderAllianceOverview();
}

function getActiveFilters() {
  return {
    legal: document.getElementById("filter-legal").checked,
    policy: document.getElementById("filter-policy").checked,
    statement: document.getElementById("filter-statement").checked
  };
}

function getAllianceFilters() {
  return {
    legal: document.getElementById("alliance-filter-legal").checked,
    policy: document.getElementById("alliance-filter-policy").checked,
    statement: document.getElementById("alliance-filter-statement").checked
  };
}

// ===== SOURCE ITEM BUILDERS =====

function createSourceItem(entry) {
  const text = entry.text || entry;
  const url = entry.url || null;

  const item = document.createElement("div");
  item.className = "source-item";

  const itemHeader = document.createElement("div");
  itemHeader.className = "source-item-header";

  const titleRow = document.createElement("div");
  titleRow.className = "source-item-title-row";

  const title = document.createElement("span");
  title.className = "source-item-title";
  title.textContent = parseTitleWithoutDate(text);
  titleRow.appendChild(title);

  const dateStr = extractDate(text);
  if (dateStr) {
    const dateBadge = document.createElement("span");
    dateBadge.className = "source-item-date";
    dateBadge.textContent = dateStr;
    titleRow.appendChild(dateBadge);
  }

  if (url) {
    const link = document.createElement("button");
    link.className = "source-link";
    link.type = "button";
    link.title = "Open source document";
    link.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
    </svg>`;
    link.addEventListener("click", e => { e.stopPropagation(); e.preventDefault(); window.open(url, "_blank"); });
    titleRow.appendChild(link);
  }

  itemHeader.appendChild(titleRow);

  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", "source-item-expand");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("d", "M19 9l-7 7-7-7");
  icon.appendChild(path);
  itemHeader.appendChild(icon);

  itemHeader.addEventListener("click", e => {
    if (e.target.closest(".source-link")) return;
    item.classList.toggle("expanded");
  });
  item.appendChild(itemHeader);

  const details = document.createElement("div");
  details.className = "source-item-details";
  details.innerHTML = parseDetails(text);
  item.appendChild(details);

  return item;
}

function createSourceSection(entries, type, label) {
  if (!entries.length) return null;
  const section = document.createElement("div");
  section.className = "source-section";

  const header = document.createElement("div");
  header.className = `source-type-header ${type}`;
  header.textContent = `${label} (${entries.length})`;
  section.appendChild(header);

  const items = document.createElement("div");
  items.className = "source-items";
  entries.forEach(entry => items.appendChild(createSourceItem(entry)));
  section.appendChild(items);
  return section;
}

function buildPolicyAreaSection(areaName, filteredEntries, dataArea) {
  const total = filteredEntries.legal_directives.length +
    filteredEntries.policy_documents.length +
    filteredEntries.public_statements.length;
  if (total === 0) return null;

  const policyArea = document.createElement("div");
  policyArea.className = "policy-area";
  if (dataArea) policyArea.setAttribute("data-area", dataArea);

  const areaHeader = document.createElement("div");
  areaHeader.className = "policy-area-header";
  areaHeader.addEventListener("click", () => policyArea.classList.toggle("expanded"));

  const areaTitle = document.createElement("span");
  areaTitle.className = "policy-area-title";
  areaTitle.textContent = areaName;
  areaHeader.appendChild(areaTitle);

  const areaMeta = document.createElement("div");
  areaMeta.className = "policy-area-meta";
  const sourceCount = document.createElement("span");
  sourceCount.className = "source-count";
  sourceCount.textContent = `${total} entries`;
  areaMeta.appendChild(sourceCount);

  const expandIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  expandIcon.setAttribute("class", "expand-icon");
  expandIcon.setAttribute("viewBox", "0 0 24 24");
  expandIcon.setAttribute("fill", "none");
  expandIcon.setAttribute("stroke", "currentColor");
  const expandPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  expandPath.setAttribute("stroke-linecap", "round");
  expandPath.setAttribute("stroke-linejoin", "round");
  expandPath.setAttribute("stroke-width", "2");
  expandPath.setAttribute("d", "M19 9l-7 7-7-7");
  expandIcon.appendChild(expandPath);
  areaMeta.appendChild(expandIcon);
  areaHeader.appendChild(areaMeta);
  policyArea.appendChild(areaHeader);

  const areaContent = document.createElement("div");
  areaContent.className = "policy-area-content";
  const legalSection = createSourceSection(filteredEntries.legal_directives, "legal", "Legal Directives");
  if (legalSection) areaContent.appendChild(legalSection);
  const policySection = createSourceSection(filteredEntries.policy_documents, "policy", "Policy Documents");
  if (policySection) areaContent.appendChild(policySection);
  const stmtSection = createSourceSection(filteredEntries.public_statements, "statement", "Public Statements");
  if (stmtSection) areaContent.appendChild(stmtSection);
  policyArea.appendChild(areaContent);

  return policyArea;
}

function getDataArea(areaName) {
  if (areaName.indexOf("LAWS") !== -1) return "laws";
  if (areaName.indexOf("Adoption") !== -1) return "adoption";
  if (areaName.indexOf("Acquisition") !== -1) return "acquisition";
  if (areaName.indexOf("Int'l") !== -1 || areaName.indexOf("International") !== -1) return "international";
  if (areaName.indexOf("Technical") !== -1) return "technical";
  if (areaName.indexOf("Ethical") !== -1) return "ethical";
  return "";
}

// ===== OVERVIEW RENDER =====

function renderOverview() {
  if (!selectedCountry) return;

  const data = policyData[selectedCountry];
  const filters = getActiveFilters();
  const displayName = displayNames[selectedCountry] || selectedCountry;
  const summary = rawData.summaries?.[selectedCountry];

  document.getElementById("overview-header").style.display = "flex";
  document.getElementById("overview-title").textContent = displayName;
  document.getElementById("overview-filters").style.display = "flex";
  document.getElementById("content-clear-btn").style.display = "none";

  // Chart data
  const pieColors = ["#1a2744", "#d64045", "#6b3074", "#0d7377", "#e07020", "#4a9d5b"];
  let totalCount = 0;

  const policyAreasConfig = [
    { key: "laws", name: "LAWS Employment/Deployment", short: "LAWS\nDeployment", color: "#1a2744" },
    { key: "adoption", name: "Adoption & Intent of Use", short: "Adoption &\nIntent", color: "#d64045" },
    { key: "acquisition", name: "Acquisition & Procurement", short: "Acquisition &\nProcurement", color: "#6b3074" },
    { key: "international", name: "Int'l Cooperation & Interoperability", short: "Int'l\nCooperation", color: "#0d7377" },
    { key: "technical", name: "Technical Safety & Security Requirements", short: "Technical\nSafety", color: "#e07020" },
    { key: "ethical", name: "Ethical Guidelines & Restrictions", short: "Ethical\nGuidelines", color: "#4a9d5b" }
  ];

  const chartData = {};
  policyAreasConfig.forEach(cfg => {
    const entries = data[cfg.name];
    let count = 0;
    if (entries) {
      count = (filters.legal ? entries.legal_directives.length : 0) +
        (filters.policy ? entries.policy_documents.length : 0) +
        (filters.statement ? entries.public_statements.length : 0);
    }
    chartData[cfg.key] = count;
    totalCount += count;
  });

  // Build policy areas
  const areasContainer = document.createElement("div");
  areasContainer.className = "policy-areas";

  Object.keys(data).forEach(areaName => {
    const entries = data[areaName];
    const filtered = {
      legal_directives: filters.legal ? entries.legal_directives : [],
      policy_documents: filters.policy ? entries.policy_documents : [],
      public_statements: filters.statement ? entries.public_statements : []
    };
    const section = buildPolicyAreaSection(areaName, filtered, getDataArea(areaName));
    if (section) areasContainer.appendChild(section);
  });

  const areaCount = areasContainer.children.length;
  document.getElementById("overview-subtitle").textContent =
    `${totalCount} entries across ${areaCount} policy areas`;

  const content = document.getElementById("overview-content");
  content.innerHTML = "";

  if (areaCount === 0) {
    content.innerHTML = '<div class="no-data-message">No results match the current filters</div>';
    return;
  }

  if (summary) {
    const summaryBox = document.createElement("div");
    summaryBox.className = "country-summary-box";
    summaryBox.textContent = summary;
    content.appendChild(summaryBox);
  }

  // Charts row
  const insightsRow = buildInsightsRow(policyAreasConfig, chartData, totalCount);
  insightsRow.id = "insights-container";
  content.appendChild(insightsRow);

  // Interaction setup (deferred)
  setTimeout(() => setupInsightsInteraction(policyAreasConfig), 0);

  content.appendChild(areasContainer);
}

function buildInsightsRow(policyAreasConfig, chartData, totalCount) {
  const insightsRow = document.createElement("div");
  insightsRow.className = "country-insights-row";

  // --- PIE CHART ---
  const pieSection = document.createElement("div");
  pieSection.className = "chart-section";
  const pieTitle = document.createElement("div");
  pieTitle.className = "pie-chart-title";
  pieTitle.textContent = "Policy Distribution";
  pieSection.appendChild(pieTitle);

  const pieWrapper = document.createElement("div");
  pieWrapper.className = "pie-chart-wrapper";

  const W = 500, H = 380, R = 100, cx = W / 2, cy = H / 2;
  const pieSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  pieSvg.setAttribute("class", "pie-chart-svg");
  pieSvg.setAttribute("viewBox", `0 0 ${W} ${H}`);

  let startAngle = -Math.PI / 2;
  const sliceData = [];

  policyAreasConfig.forEach(cfg => {
    const value = chartData[cfg.key];
    if (!value) return;
    const sliceAngle = (value / totalCount) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    const x1 = cx + R * Math.cos(startAngle), y1 = cy + R * Math.sin(startAngle);
    const x2 = cx + R * Math.cos(endAngle), y2 = cy + R * Math.sin(endAngle);
    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    const slicePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    slicePath.setAttribute("d", `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`);
    slicePath.setAttribute("fill", cfg.color);
    slicePath.setAttribute("stroke", "white");
    slicePath.setAttribute("stroke-width", "2");
    slicePath.setAttribute("class", "pie-slice");
    slicePath.setAttribute("data-area", cfg.key);
    pieSvg.appendChild(slicePath);

    sliceData.push({
      key: cfg.key, name: cfg.name, short: cfg.short, color: cfg.color,
      midAngle: startAngle + sliceAngle / 2,
      pct: Math.round((value / totalCount) * 100)
    });
    startAngle = endAngle;
  });

  // Labels
  const labelR = R + 18, textOffset = 25;
  sliceData.forEach(slice => {
    const midA = slice.midAngle;
    const edgeX = cx + R * Math.cos(midA), edgeY = cy + R * Math.sin(midA);
    const anchorX = cx + labelR * Math.cos(midA), anchorY = cy + labelR * Math.sin(midA);
    const isRight = Math.cos(midA) >= 0;
    const lineEndX = isRight ? anchorX + textOffset : anchorX - textOffset;

    const leaderLine = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    leaderLine.setAttribute("points", `${edgeX},${edgeY} ${anchorX},${anchorY} ${lineEndX},${anchorY}`);
    leaderLine.setAttribute("fill", "none");
    leaderLine.setAttribute("stroke", "#999");
    leaderLine.setAttribute("stroke-width", "1");
    leaderLine.setAttribute("class", "pie-leader-line");
    leaderLine.setAttribute("data-area", slice.key);
    pieSvg.appendChild(leaderLine);

    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", lineEndX);
    dot.setAttribute("cy", anchorY);
    dot.setAttribute("r", "3");
    dot.setAttribute("fill", slice.color);
    dot.setAttribute("class", "pie-leader-dot");
    dot.setAttribute("data-area", slice.key);
    pieSvg.appendChild(dot);

    const labelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    labelText.setAttribute("x", isRight ? lineEndX + 6 : lineEndX - 6);
    labelText.setAttribute("text-anchor", isRight ? "start" : "end");
    labelText.setAttribute("font-size", "12");
    labelText.setAttribute("font-family", "Plus Jakarta Sans, sans-serif");
    labelText.setAttribute("font-weight", "500");
    labelText.setAttribute("fill", "#333");
    labelText.setAttribute("class", "pie-label");
    labelText.setAttribute("data-area", slice.key);

    const lines = slice.short.split("\n");
    lines.forEach((txt, idx) => {
      const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      tspan.setAttribute("x", isRight ? lineEndX + 6 : lineEndX - 6);
      if (idx === 0) tspan.setAttribute("y", anchorY - 5);
      else tspan.setAttribute("dy", "14");
      tspan.textContent = idx === lines.length - 1 ? `${txt} (${slice.pct}%)` : txt;
      labelText.appendChild(tspan);
    });
    pieSvg.appendChild(labelText);
  });

  pieWrapper.appendChild(pieSvg);
  pieSection.appendChild(pieWrapper);
  insightsRow.appendChild(pieSection);

  // --- BAR CHART ---
  const barSection = document.createElement("div");
  barSection.className = "chart-section";
  const barTitle = document.createElement("div");
  barTitle.className = "bar-chart-title";
  barTitle.textContent = "Number of Policies by Area";
  barSection.appendChild(barTitle);

  const barWrapper = document.createElement("div");
  barWrapper.className = "bar-chart-wrapper";

  const BW = 520, BH = 320;
  const BM = { top: 30, right: 25, bottom: 80, left: 55 };
  const plotW = BW - BM.left - BM.right, plotH = BH - BM.top - BM.bottom;

  const barSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  barSvg.setAttribute("class", "bar-chart-svg");
  barSvg.setAttribute("viewBox", `0 0 ${BW} ${BH}`);

  const maxVal = Math.max(2, Math.ceil(Math.max(...Object.values(chartData).filter(v => v > 0)) / 2) * 2);
  const yScale = plotH / maxVal;
  const singleW = plotW / policyAreasConfig.length * 0.7;
  const gap = plotW / policyAreasConfig.length * 0.3;

  // Axes
  const mkLine = (x1, y1, x2, y2, stroke, sw) => {
    const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
    l.setAttribute("x1", x1); l.setAttribute("y1", y1);
    l.setAttribute("x2", x2); l.setAttribute("y2", y2);
    l.setAttribute("stroke", stroke); l.setAttribute("stroke-width", sw);
    return l;
  };
  barSvg.appendChild(mkLine(BM.left, BM.top, BM.left, BM.top + plotH, "#ccc", "1"));
  barSvg.appendChild(mkLine(BM.left, BM.top + plotH, BM.left + plotW, BM.top + plotH, "#ccc", "1"));

  // Y label
  const yAxisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  yAxisLabel.setAttribute("x", 15); yAxisLabel.setAttribute("y", BM.top + plotH / 2);
  yAxisLabel.setAttribute("text-anchor", "middle"); yAxisLabel.setAttribute("font-size", "11");
  yAxisLabel.setAttribute("fill", "#1a2744"); yAxisLabel.setAttribute("font-weight", "600");
  yAxisLabel.setAttribute("transform", `rotate(-90, 15, ${BM.top + plotH / 2})`);
  yAxisLabel.textContent = "Number of Policies";
  barSvg.appendChild(yAxisLabel);

  // Y ticks
  for (let i = 0; i <= maxVal / 2; i++) {
    const val = i * 2;
    const y = BM.top + plotH - val * yScale;
    barSvg.appendChild(mkLine(BM.left, y, BM.left + plotW, y, "#eee", "1"));
    const tickLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tickLabel.setAttribute("x", BM.left - 8); tickLabel.setAttribute("y", y + 4);
    tickLabel.setAttribute("text-anchor", "end"); tickLabel.setAttribute("font-size", "10");
    tickLabel.setAttribute("fill", "#666"); tickLabel.textContent = val;
    barSvg.appendChild(tickLabel);
  }

  // Bars
  policyAreasConfig.forEach((cfg, idx) => {
    const value = chartData[cfg.key];
    const rH = value * yScale;
    const xPos = BM.left + idx * (singleW + gap) + gap / 2;
    const yPos = BM.top + plotH - rH;

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", xPos); rect.setAttribute("y", yPos);
    rect.setAttribute("width", singleW); rect.setAttribute("height", rH);
    rect.setAttribute("fill", cfg.color); rect.setAttribute("rx", "3");
    rect.setAttribute("class", "bar-rect"); rect.setAttribute("data-area", cfg.key);
    barSvg.appendChild(rect);

    const valLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    valLabel.setAttribute("x", xPos + singleW / 2);
    valLabel.setAttribute("y", value > 0 ? yPos - 8 : BM.top + plotH - 8);
    valLabel.setAttribute("text-anchor", "middle"); valLabel.setAttribute("font-size", "11");
    valLabel.setAttribute("font-weight", "600"); valLabel.setAttribute("fill", value > 0 ? "#333" : "#999");
    valLabel.setAttribute("class", "bar-value"); valLabel.setAttribute("data-area", cfg.key);
    valLabel.textContent = value;
    barSvg.appendChild(valLabel);

    const shortLabel = cfg.short.replace("\n", " ");
    const xLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    xLabel.setAttribute("x", xPos + singleW / 2); xLabel.setAttribute("y", BM.top + plotH + 12);
    xLabel.setAttribute("text-anchor", "start"); xLabel.setAttribute("font-size", "10");
    xLabel.setAttribute("fill", "#666");
    xLabel.setAttribute("transform", `rotate(35, ${xPos + singleW / 2}, ${BM.top + plotH + 12})`);
    xLabel.setAttribute("class", "bar-label"); xLabel.setAttribute("data-area", cfg.key);
    xLabel.textContent = shortLabel;
    barSvg.appendChild(xLabel);
  });

  barWrapper.appendChild(barSvg);
  barSection.appendChild(barWrapper);
  insightsRow.appendChild(barSection);

  const hint = document.createElement("div");
  hint.className = "insights-hint";
  hint.innerHTML = "<strong>Tip:</strong> Hover to highlight + Click to expand policies below";
  insightsRow.appendChild(hint);

  return insightsRow;
}

function setupInsightsInteraction(policyAreasConfig) {
  const container = document.getElementById("insights-container");
  if (!container) return;

  const keyToName = {};
  policyAreasConfig.forEach(cfg => { keyToName[cfg.key] = cfg.name; });

  const allDataElements = container.querySelectorAll("[data-area]");
  const clickableElements = container.querySelectorAll(".pie-slice, .bar-rect");

  allDataElements.forEach(el => {
    el.addEventListener("mouseenter", function () {
      const area = this.getAttribute("data-area");
      container.classList.add("has-hover");
      allDataElements.forEach(other => {
        if (other.getAttribute("data-area") === area) other.classList.add("highlighted");
      });
    });
    el.addEventListener("mouseleave", function () {
      container.classList.remove("has-hover");
      allDataElements.forEach(other => other.classList.remove("highlighted"));
    });
  });

  clickableElements.forEach(el => {
    el.addEventListener("click", function () {
      const areaName = keyToName[this.getAttribute("data-area")];
      if (!areaName) return;
      document.querySelectorAll(".policy-area").forEach(pa => {
        if (pa.querySelector(".policy-area-title")?.textContent === areaName) {
          pa.classList.add("expanded");
          setTimeout(() => pa.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        }
      });
    });
  });
}

// ===== ALLIANCE OVERVIEW RENDER =====

function renderAllianceOverview() {
  if (!selectedAlliance) return;

  const data = allianceData[selectedAlliance];
  if (!data) return;

  const allianceDisplayNames = {
    "NATO": "North Atlantic Treaty Organization (NATO)",
    "AUKUS": "AUKUS (Australia, UK, US)",
    "FVEY": "Five Eyes (FVEY)"
  };

  const displayName = allianceDisplayNames[selectedAlliance] || selectedAlliance;
  document.getElementById("alliance-header").style.display = "flex";
  document.getElementById("alliance-name").textContent = displayName;

  // Member list
  const membersListContainer = document.getElementById("alliance-members-list");
  membersListContainer.style.display = "block";
  membersListContainer.innerHTML = "";

  const membersHeader = document.createElement("div");
  membersHeader.className = "alliance-members-header";

  const membersLeft = document.createElement("div");
  membersLeft.className = "alliance-members-left";
  const membersLabel = document.createElement("div");
  membersLabel.className = "alliance-members-label";
  membersLabel.textContent = "Member States";
  membersLeft.appendChild(membersLabel);
  const membersHint = document.createElement("span");
  membersHint.className = "alliance-members-hint";
  membersHint.textContent = "click to expand";
  membersLeft.appendChild(membersHint);
  membersHeader.appendChild(membersLeft);

  const membersToggle = document.createElement("span");
  membersToggle.className = "alliance-members-toggle";
  membersToggle.textContent = "▼";
  membersHeader.appendChild(membersToggle);
  membersListContainer.appendChild(membersHeader);

  const membersChips = document.createElement("div");
  membersChips.className = "alliance-members-chips";

  const members = allianceMembers[selectedAlliance] || [];
  members.sort().forEach(member => {
    const chip = document.createElement("span");
    chip.className = "alliance-member-chip";
    chip.textContent = displayNames[member] || member;
    if (policyData[member]) {
      chip.classList.add("has-data");
      chip.addEventListener("click", () => switchToCountryOverview(member));
    }
    membersChips.appendChild(chip);
  });
  membersListContainer.appendChild(membersChips);

  membersHeader.addEventListener("click", function () {
    const isExpanded = membersChips.classList.toggle("expanded");
    membersToggle.classList.toggle("expanded");
    membersHint.textContent = isExpanded ? "click to collapse" : "click to expand";
  });

  // Convergence timeline
  renderConvergenceTimeline(selectedAlliance);

  // Content
  const content = document.getElementById("alliance-content");
  content.innerHTML = "";

  const allianceSummaries = {
    "NATO": "NATO has developed a comprehensive AI strategy framework emphasizing principles of responsible use (PRUs) including lawfulness, accountability, explainability, reliability, governability, and bias mitigation.",
    "AUKUS": "AUKUS is a trilateral security partnership focused on sharing advanced defense capabilities including AI and autonomous systems. Pillar II specifically addresses emerging technologies.",
    "FVEY": "The Five Eyes intelligence alliance has developed joint guidance on secure AI deployment, focusing on protecting AI systems from adversarial manipulation."
  };

  if (allianceSummaries[selectedAlliance]) {
    const summaryBox = document.createElement("div");
    summaryBox.className = "country-summary-box";
    summaryBox.textContent = allianceSummaries[selectedAlliance];
    content.appendChild(summaryBox);
  }

  // Heatmap
  const memberContributions = [];
  const memberByArea = {};
  const AREA_KEYS = ["laws", "adoption", "acquisition", "ethical", "technical", "international"];
  const AREA_COLORS = ["#1a2744", "#d64045", "#6b3074", "#4a9d5b", "#e07020", "#0d7377"];
  const AREA_SHORT = ["LAWS", "Adoption", "Acq.", "Ethics", "Tech.", "Int'l"];

  const areaNameToKey = {
    "LAWS Employment/Deployment": "laws",
    "Adoption & Intent of Use": "adoption",
    "Acquisition & Procurement": "acquisition",
    "Ethical Guidelines & Restrictions": "ethical",
    "Technical Safety & Security Requirements": "technical",
    "Int'l Cooperation & Interoperability": "international"
  };

  members.forEach(member => {
    if (!policyData[member]) return;
    let memberTotal = 0;
    const areaData = {};
    AREA_KEYS.forEach(k => { areaData[k] = 0; });

    POLICY_AREAS.forEach(areaName => {
      const key = areaNameToKey[areaName];
      const area = policyData[member][areaName];
      if (area) {
        const count = (area.legal_directives || []).length +
          (area.policy_documents || []).length +
          (area.public_statements || []).length;
        areaData[key] = count;
        memberTotal += count;
      }
    });

    if (memberTotal > 0) {
      memberContributions.push({ key: member, name: displayNames[member] || member, total: memberTotal });
      memberByArea[member] = areaData;
    }
  });

  memberContributions.sort((a, b) => b.total - a.total);
  const maxHeatValue = Math.max(1, ...memberContributions.flatMap(m =>
    AREA_KEYS.map(k => memberByArea[m.key][k])
  ));

  if (memberContributions.length > 0) {
    const insightsRow = document.createElement("div");
    insightsRow.className = "alliance-insights-row";

    const heatmapBox = document.createElement("div");
    heatmapBox.className = "alliance-chart-box";

    const heatHeader = document.createElement("div");
    heatHeader.className = "alliance-chart-header";

    const heatTitle = document.createElement("div");
    heatTitle.className = "alliance-chart-title";
    heatTitle.textContent = "Policy Coverage Heatmap";
    heatHeader.appendChild(heatTitle);

    const heatInfo = document.createElement("div");
    heatInfo.className = "alliance-info-note";
    heatInfo.innerHTML = `<span class="info-icon">i</span><span>Info</span>
      <div class="alliance-info-tooltip">Only members with individual country profiles are shown.</div>`;
    heatHeader.appendChild(heatInfo);
    heatmapBox.appendChild(heatHeader);

    const heatSubtitle = document.createElement("div");
    heatSubtitle.className = "alliance-chart-subtitle";
    heatSubtitle.textContent = "Entry counts by member and policy area (darker = more)";
    heatmapBox.appendChild(heatSubtitle);

    const tableWrapper = document.createElement("div");
    tableWrapper.style.cssText = "overflow-x: auto;";
    const table = document.createElement("table");
    table.className = "alliance-heatmap";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const memberTh = document.createElement("th");
    memberTh.className = "member-col";
    memberTh.textContent = "MEMBER";
    headerRow.appendChild(memberTh);

    AREA_SHORT.forEach((shortName, idx) => {
      const th = document.createElement("th");
      th.style.minWidth = "52px";
      const dot = document.createElement("div");
      dot.className = "area-dot";
      dot.style.background = AREA_COLORS[idx];
      th.appendChild(dot);
      th.appendChild(document.createTextNode(shortName));
      headerRow.appendChild(th);
    });
    const totalTh = document.createElement("th");
    totalTh.textContent = "TOTAL";
    headerRow.appendChild(totalTh);
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const createHeatmapRow = member => {
      const row = document.createElement("tr");
      const nameTd = document.createElement("td");
      nameTd.className = "member-name";
      nameTd.textContent = member.name;
      nameTd.style.cursor = "pointer";
      nameTd.addEventListener("click", () => switchToCountryOverview(member.key));
      row.appendChild(nameTd);

      AREA_KEYS.forEach(key => {
        const td = document.createElement("td");
        td.className = "heat-cell";
        const value = memberByArea[member.key][key] || 0;
        if (value === 0) {
          td.classList.add("empty");
          td.textContent = "—";
          td.style.background = "#f5f5f5";
        } else {
          td.textContent = value;
          const intensity = value / maxHeatValue;
          const r = Math.round(245 - (245 - 26) * intensity);
          const g = Math.round(245 - (245 - 39) * intensity);
          const b = Math.round(245 - (245 - 68) * intensity);
          td.style.background = `rgb(${r},${g},${b})`;
          if (intensity > 0.5) td.classList.add("high");
        }
        row.appendChild(td);
      });

      const totalTd = document.createElement("td");
      totalTd.className = "total-cell";
      totalTd.textContent = member.total;
      row.appendChild(totalTd);
      return row;
    };

    const tbody = document.createElement("tbody");
    const initial = memberContributions.slice(0, 10);
    const extra = memberContributions.slice(10);
    initial.forEach(m => tbody.appendChild(createHeatmapRow(m)));
    table.appendChild(tbody);

    let extraTbody = null;
    if (extra.length > 0) {
      extraTbody = document.createElement("tbody");
      extraTbody.style.display = "none";
      extra.forEach(m => extraTbody.appendChild(createHeatmapRow(m)));
      table.appendChild(extraTbody);

      const toggleEl = document.createElement("div");
      toggleEl.className = "expand-more-toggle";
      toggleEl.innerHTML = `<span class="expand-more-text">+${extra.length} more members</span>
        <svg class="expand-more-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 9l-7 7-7-7"/></svg>`;
      let expanded = false;
      toggleEl.addEventListener("click", () => {
        expanded = !expanded;
        extraTbody.style.display = expanded ? "table-row-group" : "none";
        toggleEl.querySelector(".expand-more-text").textContent =
          expanded ? "Show less" : `+${extra.length} more members`;
        toggleEl.querySelector(".expand-more-icon").style.transform =
          expanded ? "rotate(180deg)" : "rotate(0)";
      });
      heatmapBox.appendChild(tableWrapper.appendChild(table) || tableWrapper);
      heatmapBox.appendChild(toggleEl);
    } else {
      tableWrapper.appendChild(table);
      heatmapBox.appendChild(tableWrapper);
    }

    if (!extraTbody) {
      tableWrapper.appendChild(table);
      heatmapBox.appendChild(tableWrapper);
    }

    const legend = document.createElement("div");
    legend.className = "heatmap-legend";
    legend.innerHTML = `<span>Coverage:</span>
      <div class="heatmap-legend-item"><div class="heatmap-legend-swatch" style="background:#f5f5f5"></div><span>None</span></div>
      <div class="heatmap-legend-item"><div class="heatmap-legend-swatch" style="background:#b8c4d4"></div><span>Low</span></div>
      <div class="heatmap-legend-item"><div class="heatmap-legend-swatch" style="background:#5a7a9a"></div><span>Med</span></div>
      <div class="heatmap-legend-item"><div class="heatmap-legend-swatch" style="background:#1a2744"></div><span>High</span></div>`;
    heatmapBox.appendChild(legend);

    insightsRow.appendChild(heatmapBox);
    content.appendChild(insightsRow);
  }

  // Alliance-level policy areas
  const filters = getAllianceFilters();
  const areasContainer = document.createElement("div");
  areasContainer.className = "policy-areas";

  Object.keys(data).forEach(areaName => {
    const entries = data[areaName];
    const filtered = {
      legal_directives: filters.legal ? (entries.legal_directives || []) : [],
      policy_documents: filters.policy ? (entries.policy_documents || []) : [],
      public_statements: filters.statement ? (entries.public_statements || []) : []
    };
    const section = buildPolicyAreaSection(areaName, filtered, getDataArea(areaName));
    if (section) areasContainer.appendChild(section);
  });

  document.getElementById("alliance-subtitle").textContent =
    `${memberContributions.length} members with policy data`;

  if (areasContainer.children.length > 0) {
    const sectionTitle = document.createElement("div");
    sectionTitle.style.cssText = "font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:0.95rem;color:var(--navy);margin-bottom:16px;";
    sectionTitle.textContent = "Alliance-Level Policies";
    content.appendChild(sectionTitle);
  }
  content.appendChild(areasContainer);
}

// ===== POLICY AREA FILTER =====

function initPolicyAreaFilter() {
  const dropdown = document.getElementById("policy-area-filter");
  if (!dropdown) return;

  // FIX: use "International" label in dropdown for the Int'l area
  dropdown.innerHTML = '<option value="">All areas</option>';
  const areaCounts = {};
  Object.values(policyData).forEach(countryData => {
    POLICY_AREAS.forEach(area => {
      const d = countryData[area];
      if (d) {
        const count = (d.legal_directives?.length || 0) + (d.policy_documents?.length || 0) + (d.public_statements?.length || 0);
        areaCounts[area] = (areaCounts[area] || 0) + count;
      }
    });
  });

  POLICY_AREAS.forEach(area => {
    const option = document.createElement("option");
    option.value = area;
    option.textContent = `${POLICY_AREA_DISPLAY[area] || area} (${areaCounts[area] || 0})`;
    dropdown.appendChild(option);
  });

  dropdown.addEventListener("change", function () {
    const selectedArea = this.value;
    if (!selectedArea) {
      if (currentContentType === "policyArea") resetToPlaceholder();
      return;
    }

    document.getElementById("overview-dropdown").value = "";
    document.getElementById("keyword-search").value = "";
    selectedCountry = null;
    currentContentType = "policyArea";

    const countriesWithArea = [];
    Object.keys(policyData).forEach(country => {
      const areaData = policyData[country][selectedArea];
      if (areaData) {
        const total = (areaData.legal_directives?.length || 0) +
          (areaData.policy_documents?.length || 0) +
          (areaData.public_statements?.length || 0);
        if (total > 0) {
          countriesWithArea.push({ country, displayName: displayNames[country] || country, count: total });
        }
      }
    });

    countriesWithArea.sort((a, b) => b.count - a.count);
    const totalEntries = countriesWithArea.reduce((a, b) => a + b.count, 0);

    setContentHeader(
      POLICY_AREA_DISPLAY[selectedArea] || selectedArea,
      `${countriesWithArea.length} countries • ${totalEntries} entries`,
      false, true
    );

    const content = document.getElementById("overview-content");
    const grid = document.createElement("div");
    grid.className = "content-country-grid";

    countriesWithArea.forEach(item => {
      const card = document.createElement("div");
      card.className = "content-country-card";
      card.innerHTML = `<div class="content-country-name">${escapeHtml(item.displayName)}</div>
        <div class="content-country-meta">
          <span class="content-count-badge">${item.count}</span>
          <span class="content-arrow">→</span>
        </div>`;
      card.addEventListener("click", () => openPolicyAreaSidePanel(item.country, selectedArea, item.count));
      grid.appendChild(card);
    });

    content.innerHTML = "";
    content.appendChild(grid);

    if (typeof d3 !== 'undefined') d3.selectAll(".country-path").classed("selected", false);
  });
}

// ===== SIDE PANEL =====

function openPolicyAreaSidePanel(country, policyArea, entryCount) {
  const overlay = document.getElementById("side-panel-overlay");
  const panel = document.getElementById("side-panel");
  const content = document.getElementById("side-panel-content");

  document.getElementById("side-panel-title").textContent = displayNames[country] || country;
  document.getElementById("side-panel-subtitle").textContent =
    `${getShortAreaName(policyArea)} • ${entryCount} entries`;

  document.getElementById("side-panel-view-country").onclick = () => {
    closeSidePanel();
    document.getElementById("policy-area-filter").value = "";
    selectOverviewCountry(country);
  };

  content.innerHTML = "";
  const countryData = policyData[country];
  const areaData = countryData[policyArea];
  if (!areaData) {
    content.innerHTML = '<div class="side-panel-empty">No entries found.</div>';
    return;
  }

  [
    { key: "legal_directives", label: "Legal" },
    { key: "policy_documents", label: "Policy" },
    { key: "public_statements", label: "Statement" }
  ].forEach(source => {
    (areaData[source.key] || []).forEach(entry => {
      const text = entry.text || "";
      const entryEl = document.createElement("div");
      entryEl.className = "side-panel-entry";

      const header = document.createElement("div");
      header.className = "side-panel-entry-header";
      header.innerHTML = `
        <div class="side-panel-entry-expand"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M9 18l6-6-6-6"/></svg></div>
        <div class="side-panel-entry-info">
          <div class="side-panel-entry-title">${escapeHtml(parseTitleWithoutDate(text))}</div>
          <div class="side-panel-entry-meta">
            <span class="side-panel-entry-type ${source.label.toLowerCase()}">${source.label}</span>
            ${extractDate(text) ? `<span>${extractDate(text)}</span>` : ''}
          </div>
        </div>`;
      header.addEventListener("click", () => entryEl.classList.toggle("expanded"));
      entryEl.appendChild(header);

      const desc = document.createElement("div");
      desc.className = "side-panel-entry-description";
      const url = extractUrl(text);
      desc.innerHTML = escapeHtml(text) + (url ? `<div class="side-panel-entry-link"><a href="${url}" target="_blank">View source →</a></div>` : '');
      entryEl.appendChild(desc);
      content.appendChild(entryEl);
    });
  });

  overlay.classList.add("active");
  panel.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeSidePanel() {
  document.getElementById("side-panel-overlay").classList.remove("active");
  document.getElementById("side-panel").classList.remove("active");
  document.body.style.overflow = "";
}

function initSidePanel() {
  document.getElementById("side-panel-overlay")?.addEventListener("click", closeSidePanel);
  document.getElementById("side-panel-close")?.addEventListener("click", closeSidePanel);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeSidePanel(); });
}

// ===== KEYWORD SEARCH =====

function initKeywordSearch() {
  const searchInput = document.getElementById("keyword-search");
  if (!searchInput) return;

  function performSearch() {
    const keyword = searchInput.value.trim().toLowerCase();
    if (keyword.length < 2) { alert("Please enter at least 2 characters."); return; }

    document.getElementById("overview-dropdown").value = "";
    document.getElementById("policy-area-filter").value = "";
    selectedCountry = null;
    currentContentType = "keyword";

    const results = {};
    let totalCount = 0;

    Object.keys(policyData).forEach(country => {
      const matches = [];
      POLICY_AREAS.forEach(area => {
        const areaData = policyData[country][area];
        if (!areaData) return;
        [
          { key: "legal_directives", label: "Legal" },
          { key: "policy_documents", label: "Policy" },
          { key: "public_statements", label: "Statement" }
        ].forEach(source => {
          (areaData[source.key] || []).forEach(entry => {
            const text = entry.text || "";
            if (text.toLowerCase().includes(keyword)) {
              matches.push({ area, type: source.label, text, url: extractUrl(text) });
              totalCount++;
            }
          });
        });
      });
      if (matches.length) results[country] = matches;
    });

    renderKeywordResults(keyword, results, totalCount);
    if (typeof d3 !== 'undefined') d3.selectAll(".country-path").classed("selected", false);
  }

  searchInput.addEventListener("keypress", e => { if (e.key === "Enter") performSearch(); });
}

function highlightKeyword(text, keyword) {
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
  return escapeHtml(text).replace(regex, "<mark>$1</mark>");
}

function renderKeywordResults(keyword, results, totalCount) {
  const content = document.getElementById("overview-content");
  const countryCount = Object.keys(results).length;

  setContentHeader(
    `Results for "${keyword}"`,
    `${totalCount} entries across ${countryCount} countries`,
    false, true
  );

  content.innerHTML = "";

  if (countryCount === 0) {
    content.innerHTML = `<div class="placeholder">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <p>No entries found matching "${escapeHtml(keyword)}"</p>
    </div>`;
    return;
  }

  const resultsContainer = document.createElement("div");
  resultsContainer.className = "content-keyword-results";

  Object.keys(results)
    .sort((a, b) => results[b].length - results[a].length)
    .forEach(country => {
      const matches = results[country];
      const group = document.createElement("div");
      group.className = "keyword-country-group";

      const header = document.createElement("div");
      header.className = "keyword-country-header";
      header.innerHTML = `<span class="keyword-country-name">${escapeHtml(displayNames[country] || country)}</span>
        <span class="keyword-country-count">${matches.length} match${matches.length > 1 ? 'es' : ''}</span>`;
      header.addEventListener("click", () => {
        document.getElementById("keyword-search").value = "";
        selectOverviewCountry(country);
      });
      group.appendChild(header);

      const entryList = document.createElement("div");
      entryList.className = "keyword-entry-list";

      matches.forEach(match => {
        const title = parseTitleWithoutDate(match.text);
        const entry = document.createElement("div");
        entry.className = "keyword-entry";

        const entryHeader = document.createElement("div");
        entryHeader.className = "keyword-entry-header";
        entryHeader.innerHTML = `
          <div class="keyword-entry-expand"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M9 18l6-6-6-6"/></svg></div>
          <div class="keyword-entry-info">
            <div class="keyword-entry-title">${highlightKeyword(title, keyword)}</div>
            <div class="keyword-entry-meta">
              <span class="keyword-entry-type ${match.type.toLowerCase()}">${match.type}</span>
              <span>${getShortAreaName(match.area)}</span>
            </div>
          </div>`;
        entryHeader.addEventListener("click", () => entry.classList.toggle("expanded"));
        entry.appendChild(entryHeader);

        const desc = document.createElement("div");
        desc.className = "keyword-entry-description";
        desc.innerHTML = highlightKeyword(match.text, keyword) +
          (match.url ? `<div class="keyword-entry-link"><a href="${match.url}" target="_blank">View source →</a></div>` : '');
        entry.appendChild(desc);
        entryList.appendChild(entry);
      });

      group.appendChild(entryList);
      resultsContainer.appendChild(group);
    });

  content.appendChild(resultsContainer);
}
