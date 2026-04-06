/* =============================================================
   app.js — Application state, utilities, init, tabs
   ============================================================= */

// ===== RUNTIME STATE =====
let policyData = {};
let allianceData = {};
let rawData = {};

let currentView = "overview";
let selectedCountry = null;
let selectedAlliance = null;
let selectedCountries = new Set();
let selectedPolicyArea = "all";
let mapZoom = null;
let activeConvergenceGroups = [];
let currentContentType = "placeholder";

const tooltip = document.getElementById("tooltip");

// ===== UTILITY FUNCTIONS =====

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML.replace(/"/g, '&quot;');
}

function extractUrl(text) {
  const match = text.match(/(https?:\/\/[^\s)]+)/g);
  return match ? match[0].replace(/[.,;:]+$/, '') : null;
}

function extractDate(text) {
  const title = text.split("\n")[0].trim();
  const match = title.match(/\(([A-Z][a-z]+ \d{4}|\d{4})\)\s*$/);
  return match ? match[1] : null;
}

function parseTitleWithoutDate(text) {
  let title = text.split("\n")[0].trim();
  title = title.replace(/\s*\([A-Z][a-z]+ \d{4}\)\s*$/, '').replace(/\s*\(\d{4}\)\s*$/, '').trim();
  return title;
}

function parseDetails(text) {
  const lines = text.split("\n").slice(1).join("\n").trim();
  return lines.split("\n")
    .filter(l => l.trim())
    .map(line => {
      const cleaned = line.replace(/^-\s*/, "").trim().replace(/(https?:\/\/[^\s)]+)/g, "").trim();
      return cleaned ? `<p>${escapeHtml(cleaned)}</p>` : "";
    })
    .filter(p => p)
    .join("");
}

function getShortAreaName(area) {
  const shortNames = {
    "LAWS Employment/Deployment": "LAWS",
    "Adoption & Intent of Use": "Adoption",
    "Ethical Guidelines & Restrictions": "Ethics",
    "Technical Safety & Security Requirements": "Tech Safety",
    "Acquisition & Procurement": "Acquisition",
    "Int'l Cooperation & Interoperability": "International Coop."
  };
  return shortNames[area] || area;
}

function getAlpha3(countryName) {
  return isoAlpha3[countryName] || countryName.substring(0, 3).toUpperCase();
}

// ===== VOTING DIVERGENCE =====

function calcVotingDivergencePenalty(country1, country2, year) {
  const c1Against = votedAgainstResolutions[country1];
  const c2Against = votedAgainstResolutions[country2];
  const c1Abstain = abstainedResolutions[country1];
  const c2Abstain = abstainedResolutions[country2];

  const c1VotedAgainst = c1Against && year >= c1Against.year;
  const c2VotedAgainst = c2Against && year >= c2Against.year;
  const c1Abstained = c1Abstain && year >= c1Abstain.year;
  const c2Abstained = c2Abstain && year >= c2Abstain.year;

  const stance1 = c1VotedAgainst ? 'against' : (c1Abstained ? 'abstain' : 'for');
  const stance2 = c2VotedAgainst ? 'against' : (c2Abstained ? 'abstain' : 'for');

  if (stance1 === stance2) {
    if (stance1 === 'against') return -0.05;
    if (stance1 === 'abstain') return -0.03;
    return 0;
  }
  if (stance1 === 'against' || stance2 === 'against') {
    return (stance1 === 'abstain' || stance2 === 'abstain') ? 0.20 : 0.35;
  }
  return 0.15;
}

// ===== CONTENT STATE MANAGEMENT =====

function resetToPlaceholder() {
  currentContentType = "placeholder";
  selectedCountry = null;

  document.getElementById("overview-dropdown").value = "";
  document.getElementById("policy-area-filter").value = "";
  document.getElementById("keyword-search").value = "";
  document.getElementById("overview-header").style.display = "none";
  document.getElementById("overview-content").innerHTML =
    `<div class="placeholder" id="overview-placeholder">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
      </svg>
      <p>Select a country, policy area, or search by keyword<br>to explore defense AI policy frameworks</p>
    </div>`;

  if (typeof d3 !== 'undefined') {
    d3.selectAll(".country-path").classed("selected", false);
  }
}

function setContentHeader(title, subtitle, showFilters, showClearBtn) {
  document.getElementById("overview-header").style.display = "flex";
  document.getElementById("overview-title").textContent = title;
  document.getElementById("overview-subtitle").textContent = subtitle;
  document.getElementById("overview-filters").style.display = showFilters ? "flex" : "none";
  document.getElementById("content-clear-btn").style.display = showClearBtn ? "inline-block" : "none";
}

function initClearButton() {
  const btn = document.getElementById("content-clear-btn");
  if (btn) btn.addEventListener("click", resetToPlaceholder);
}

// ===== DROPDOWNS =====

function buildDropdowns() {
  const overviewDropdown = document.getElementById("overview-dropdown");
  const compareDropdown = document.getElementById("compare-dropdown");

  const countries = Object.keys(policyData).sort((a, b) => {
    return (displayNames[a] || a).localeCompare(displayNames[b] || b);
  });

  countries.forEach(country => {
    const name = displayNames[country] || country;
    [overviewDropdown, compareDropdown].forEach(dropdown => {
      const option = document.createElement("option");
      option.value = country;
      option.textContent = name;
      dropdown.appendChild(option);
    });
  });

  overviewDropdown.addEventListener("change", function () {
    if (this.value) {
      selectOverviewCountry(this.value, true);
    } else {
      resetToPlaceholder();
    }
  });

  compareDropdown.addEventListener("change", function () {
    if (this.value && !selectedCountries.has(this.value) && selectedCountries.size < MAX_COMPARE) {
      toggleCompareCountry(this.value);
      this.value = "";
    }
  });
}

// ===== COUNTRY SEARCH (compare tab) =====

function initCountrySearch() {
  const countryList = Object.keys(policyData).map(key => ({
    key,
    displayName: displayNames[key] || key
  }));

  setupSearch(
    document.getElementById("compare-search"),
    document.getElementById("compare-search-results"),
    document.getElementById("compare-search-message"),
    countryList,
    country => {
      if (!selectedCountries.has(country.key) && selectedCountries.size < MAX_COMPARE) {
        toggleCompareCountry(country.key);
      }
    }
  );
}

function setupSearch(searchInput, resultsDropdown, searchMessage, countryList, onSelect) {
  if (!searchInput) return;

  function performSearch(query) {
    query = query.trim().toLowerCase();
    resultsDropdown.classList.remove("visible");
    searchMessage.classList.remove("visible");
    resultsDropdown.innerHTML = "";
    if (!query) return;

    const matches = countryList.filter(c =>
      c.displayName.toLowerCase().includes(query) || c.key.toLowerCase().includes(query)
    );

    if (matches.length === 0) {
      searchMessage.textContent = "Sorry, your search does not match any entries";
      searchMessage.classList.add("visible");
    } else if (matches.length === 1) {
      onSelect(matches[0]);
      searchInput.value = "";
    } else {
      matches.forEach(country => {
        const item = document.createElement("div");
        item.className = "search-result-item";
        item.textContent = country.displayName;
        item.addEventListener("click", () => {
          onSelect(country);
          searchInput.value = "";
          resultsDropdown.classList.remove("visible");
        });
        resultsDropdown.appendChild(item);
      });
      resultsDropdown.classList.add("visible");
    }
  }

  let searchTimeout;
  searchInput.addEventListener("input", function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSearch(this.value), 150);
  });

  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); clearTimeout(searchTimeout); performSearch(this.value); }
    if (e.key === "Escape") { resultsDropdown.classList.remove("visible"); searchMessage.classList.remove("visible"); this.blur(); }
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".country-search-wrapper")) {
      resultsDropdown.classList.remove("visible");
      searchMessage.classList.remove("visible");
    }
  });
}

// ===== COMPARE CHIPS =====

function updateCompareChipsState() {
  const atLimit = selectedCountries.size >= MAX_COMPARE;
  document.getElementById("compare-dropdown").disabled = atLimit;

  const container = document.getElementById("selected-countries");
  container.innerHTML = "";
  selectedCountries.forEach(country => {
    const tag = document.createElement("div");
    tag.className = "selected-tag";
    tag.innerHTML = `<span>${escapeHtml(displayNames[country] || country)}</span>
      <button class="remove-btn" data-country="${country}">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>`;
    tag.querySelector(".remove-btn").addEventListener("click", function () {
      toggleCompareCountry(this.dataset.country);
    });
    container.appendChild(tag);
  });

  const limitText = document.getElementById("selection-limit");
  limitText.textContent = selectedCountries.size > 0
    ? `(${selectedCountries.size}/${MAX_COMPARE} selected)`
    : `(max ${MAX_COMPARE})`;
}

// ===== TAB SWITCHING =====

function initTabs() {
  document.querySelectorAll(".explore-tab").forEach(tab => {
    tab.addEventListener("click", function () {
      currentView = this.dataset.view;

      document.querySelectorAll(".explore-tab").forEach(t => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      this.classList.add("active");
      this.setAttribute("aria-selected", "true");

      document.querySelectorAll(".view-content").forEach(v => v.classList.remove("active"));
      document.getElementById("view-" + currentView).classList.add("active");

      if (currentView !== "alliance") {
        selectedAlliance = null;
        document.querySelectorAll(".country-path").forEach(p => p.classList.remove("alliance-member"));
        const conv = document.getElementById("convergence-timeline-container");
        if (conv) conv.style.display = "none";
      }

      if (currentView === "alliance") {
        selectedAlliance = null;
        activeConvergenceGroups = [];
        document.getElementById("alliance-dropdown").value = "";
        document.getElementById("alliance-header").style.display = "none";
        document.getElementById("alliance-members-list").style.display = "none";
        document.getElementById("convergence-timeline-container").style.display = "none";
        document.getElementById("alliance-content").innerHTML = `
          <div class="placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            <p>Select an alliance to explore its<br>defense AI policy framework</p>
          </div>`;
        if (typeof d3 !== 'undefined') d3.selectAll(".country-path").classed("alliance-member", false);
      }

      updateMapHighlights();
      updateCompareChipsState();

      // Refresh choropleth fills on every tab switch to prevent color bleed
      if (typeof updateMapChoropleth === 'function' && typeof mapTimeSliderValue !== 'undefined') {
        updateMapChoropleth(mapTimeSliderValue);
      }

      if (currentView === "analytics") {
        renderMomentumChart();
        renderPolicyGrowthChart();
      }
    });
  });

  // Keyboard nav for tabs
  document.querySelector('.explore-tabs').addEventListener('keydown', function (e) {
    const tabs = Array.from(document.querySelectorAll('.explore-tab'));
    const current = tabs.indexOf(document.activeElement);
    if (current === -1) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = e.key === 'ArrowRight' ? (current + 1) % tabs.length : (current - 1 + tabs.length) % tabs.length;
      tabs[next].focus();
      tabs[next].click();
    }
  });

  // Compact header nav pills
  document.querySelectorAll(".hc-nav-pill").forEach(pill => {
    pill.addEventListener("click", function () {
      const view = this.dataset.view;
      document.querySelector(`.explore-tab[data-view="${view}"]`)?.click();
      document.querySelector('.section-divider')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.querySelectorAll(".hc-nav-pill").forEach(p => p.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // Keep pills in sync with tab clicks
  document.querySelectorAll(".explore-tab").forEach(tab => {
    tab.addEventListener("click", function () {
      const view = this.dataset.view;
      document.querySelectorAll(".hc-nav-pill").forEach(p => p.classList.remove("active"));
      document.querySelector(`.hc-nav-pill[data-view="${view}"]`)?.classList.add("active");
    });
  });
}

// ===== STICKY HEADER =====

function initStickyHeader() {
  const header = document.getElementById('siteHeader');
  const accentBar = document.querySelector('.header-accent');
  if (!header) return;

  let isCompact = false;
  let ticking = false;
  let transitionLock = false;

  function updateHeader() {
    const y = window.scrollY || window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? y / docHeight : 0;

    if (accentBar) {
      accentBar.style.transform = `scaleX(${0.03 + progress * 0.97})`;
    }

    if (!transitionLock) {
      if (!isCompact && y > 10) {
        header.classList.add('compact');
        isCompact = true;
        transitionLock = true;
        setTimeout(() => { transitionLock = false; }, 400);
      } else if (isCompact && y <= 10) {
        header.classList.remove('compact');
        isCompact = false;
        transitionLock = true;
        setTimeout(() => { transitionLock = false; }, 400);
      }
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(updateHeader); ticking = true; }
  }, { passive: true });

  updateHeader();
}

// ===== MAP TIMELINE TICK MARKS =====

function initTimelineTicks() {
  const slider = document.getElementById('map-time-slider');
  if (!slider) return;
  const group = slider.parentElement;
  if (!group) return;

  group.style.position = 'relative';
  const ticksEl = document.createElement('div');
  ticksEl.className = 'map-footer-ticks';

  for (let i = 0; i <= 9; i++) {
    const tick = document.createElement('div');
    tick.className = 'map-footer-tick';
    tick.style.left = `${(i * 4) / 39 * 100}%`;
    ticksEl.appendChild(tick);
  }
  group.appendChild(ticksEl);
}

// ===== CSV DOWNLOAD =====

function downloadFullCSV() {
  const headers = ["Country", "Policy Area", "Source Type", "Title", "Date", "Description", "URL"];
  const rows = [headers.join(",")];

  const sourceTypes = [
    { key: "legal_directives", label: "Legal Directive" },
    { key: "policy_documents", label: "Policy Document" },
    { key: "public_statements", label: "Public Statement" }
  ];

  Object.keys(policyData).forEach(country => {
    Object.keys(policyData[country]).forEach(area => {
      const areaData = policyData[country][area];
      sourceTypes.forEach(st => {
        if (!areaData[st.key]) return;
        areaData[st.key].forEach(entry => {
          const text = entry.text || "";
          const url = entry.url || extractUrl(text) || "";
          const title = parseTitleWithoutDate(text);
          const date = extractDate(text) || "";
          // FIX: removed 500-char truncation — export full description
          const description = text.split("\n").slice(1).join(" ").trim();

          rows.push([
            `"${(displayNames[country] || country).replace(/"/g, '""')}"`,
            `"${area.replace(/"/g, '""')}"`,
            `"${st.label}"`,
            `"${title.replace(/"/g, '""')}"`,
            `"${date}"`,
            `"${description.replace(/"/g, '""')}"`,
            `"${url}"`
          ].join(","));
        });
      });
    });
  });

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "global_defense_ai_policy_database.csv";
  link.click();
}

// ===== INIT =====

async function init() {
  // Load policy data from inline JS global (set by data/policy-data.js)
  if (typeof RAW_POLICY_DATA === "undefined") {
    console.error("RAW_POLICY_DATA not found. Run extract-data.py to generate data/policy-data.js");
    document.getElementById("map-loading").innerHTML =
      '<span style="color:rgba(255,255,255,0.8)">Data file missing.<br>Run extract-data.py then reload.</span>';
    return;
  }
  rawData = RAW_POLICY_DATA;

  policyData = rawData.countries || {};
  allianceData = rawData.alliances || {};

  // Build UI
  buildDropdowns();
  initCountrySearch();
  initTabs();
  initClearButton();
  initPolicyAreaFilter();
  initKeywordSearch();
  initSidePanel();
  initStickyHeader();
  initTimelineTicks();

  // Init alliance dropdown
  document.getElementById("alliance-dropdown").addEventListener("change", function () {
    if (this.value) {
      selectAlliance(this.value);
    } else {
      selectedAlliance = null;
      activeConvergenceGroups = [];
      document.getElementById("alliance-header").style.display = "none";
      document.getElementById("alliance-members-list").style.display = "none";
      document.getElementById("convergence-timeline-container").style.display = "none";
      document.getElementById("alliance-content").innerHTML = `<div class="placeholder"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg><p>Select an alliance to explore its<br>defense AI policy framework</p></div>`;
      if (typeof d3 !== 'undefined') d3.selectAll(".country-path").classed("alliance-member", false);
    }
  });

  // Alliance filter checkboxes
  ["alliance-filter-legal", "alliance-filter-policy", "alliance-filter-statement"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", renderAllianceOverview);
  });

  // Overview filter checkboxes
  document.querySelectorAll(".filter-checkbox input").forEach(cb => {
    cb.addEventListener("change", renderOverview);
  });

  // Init map
  if (typeof d3 !== 'undefined' && typeof topojson !== 'undefined') {
    initMap().catch(err => {
      console.error("Map error:", err);
      document.getElementById("map-loading").innerHTML =
        '<span style="color:rgba(255,255,255,0.7)">Could not load map.<br>Use dropdowns below to navigate.</span>';
    });
  } else {
    document.getElementById("map-loading").innerHTML =
      '<span style="color:rgba(255,255,255,0.7)">Map requires D3 and TopoJSON.<br>Use dropdowns below to navigate.</span>';
  }

  // Init analytics on load (deferred so container has size)
  setTimeout(() => {
    renderMomentumChart();
    renderPolicyGrowthChart();
    window.addEventListener("resize", () => {
      renderMomentumChart();
      renderPolicyGrowthChart();
    });
  }, 100);
}

document.addEventListener("DOMContentLoaded", init);
