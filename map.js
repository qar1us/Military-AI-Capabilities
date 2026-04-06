/* =============================================================
   map.js — D3 world map, choropleth, time slider
   ============================================================= */

let mapTimeSliderValue = 39; // Default to Q4 2025
let mapAnimationInterval = null;
let countryEntriesCumulative = {};
let countryEntriesYearly = {};
let mapViewMode = 'cumulative';

// ===== TOOLTIP =====

function showTooltip(event, countryName) {
  const displayName = displayNames[countryName] || countryName;
  tooltip.querySelector(".tooltip-title").textContent = displayName;

  let msg = "Click to select";
  if (currentView === "compare" && selectedCountries.size >= MAX_COMPARE && !selectedCountries.has(countryName)) {
    msg = `Max ${MAX_COMPARE} countries selected`;
  } else if (currentView === "alliance") {
    msg = policyData[countryName] ? "Click to view country" : "No country data available";
  }
  tooltip.querySelector(".tooltip-subtitle").textContent = msg;
  tooltip.style.left = `${event.clientX + 15}px`;
  tooltip.style.top = `${event.clientY - 10}px`;
  tooltip.classList.add("visible");
}

function showAllianceMemberTooltip(event, mapName, memberName) {
  const allianceFullNames = { "NATO": "NATO", "AUKUS": "AUKUS", "FVEY": "Five Eyes" };
  tooltip.querySelector(".tooltip-title").textContent = memberName;
  tooltip.querySelector(".tooltip-subtitle").textContent = `${allianceFullNames[selectedAlliance]} member`;
  tooltip.style.left = `${event.clientX + 15}px`;
  tooltip.style.top = `${event.clientY - 10}px`;
  tooltip.classList.add("visible");
}

function hideTooltip() { tooltip.classList.remove("visible"); }

// ===== MAP HIGHLIGHTS =====

function updateMapHighlights() {
  document.querySelectorAll(".country-path").forEach(path => {
    const country = path.getAttribute("data-country");
    const mapName = path.getAttribute("data-map-name");
    let isSelected = false, isDisabled = false, isAllianceMember = false;

    if (currentView === "overview") {
      isSelected = country === selectedCountry;
    } else if (currentView === "alliance" && selectedAlliance) {
      const members = allianceMembers[selectedAlliance];
      if (members && mapName) {
        const memberName = allianceMemberMap[mapName];
        if (memberName) {
          isAllianceMember = members.indexOf(memberName) !== -1;
        }
        if (!isAllianceMember) {
          isAllianceMember = members.some(m => mapName.indexOf(m) !== -1 || m.indexOf(mapName) !== -1);
        }
      }
    } else if (currentView === "compare") {
      isSelected = selectedCountries.has(country);
      isDisabled = selectedCountries.size >= MAX_COMPARE && !isSelected && policyData[country];
    }

    path.classList.remove("selected", "disabled", "alliance-member");
    if (isSelected) path.classList.add("selected");
    if (isDisabled) path.classList.add("disabled");
    if (isAllianceMember) path.classList.add("alliance-member");
  });
}

// ===== CHOROPLETH DATA =====

function calculateCountryEntriesByQuarter() {
  const monthToQuarter = {
    'Jan': 1, 'Feb': 1, 'Mar': 1, 'January': 1, 'February': 1, 'March': 1,
    'Apr': 2, 'May': 2, 'Jun': 2, 'April': 2, 'June': 2,
    'Jul': 3, 'Aug': 3, 'Sep': 3, 'July': 3, 'August': 3, 'September': 3,
    'Oct': 4, 'Nov': 4, 'Dec': 4, 'October': 4, 'November': 4, 'December': 4
  };

  Object.keys(policyData).forEach(country => {
    countryEntriesCumulative[country] = {};
    countryEntriesYearly[country] = {};
    for (let q = 0; q <= 39; q++) {
      countryEntriesCumulative[country][q] = 0;
      countryEntriesYearly[country][q] = 0;
    }
  });

  Object.keys(policyData).forEach(country => {
    POLICY_AREAS.forEach(area => {
      const areaData = policyData[country][area];
      if (!areaData) return;

      ['legal_directives', 'policy_documents', 'public_statements'].forEach(type => {
        if (!areaData[type]) return;
        areaData[type].forEach(entry => {
          const text = entry.text || '';
          const match = text.match(/\(([A-Z][a-z]+)?\s*(\d{4})\)/);
          if (!match) return;

          const monthStr = match[1] || '';
          const year = parseInt(match[2]);
          if (year < 2016 || year > 2025) return;

          const quarter = monthToQuarter[monthStr] || 4; // Default Q4 if no month
          const quarterIndex = (year - 2016) * 4 + (quarter - 1);

          // Yearly: entries within that year's quarters
          const yearStart = (year - 2016) * 4;
          for (let q = yearStart; q <= yearStart + 3; q++) {
            countryEntriesYearly[country][q]++;
          }

          // Cumulative: this quarter and all subsequent
          for (let q = quarterIndex; q <= 39; q++) {
            countryEntriesCumulative[country][q]++;
          }
        });
      });
    });
  });
}

function getEntryColor(count, mode) {
  if (count === 0) return null;
  const scales = {
    yearly: [
      { t: 1, c: '#d4f0f0' }, { t: 3, c: '#a8e0e0' }, { t: 5, c: '#7ed0d0' },
      { t: 8, c: '#54c0c0' }, { t: 12, c: '#2ab0b0' }, { t: 18, c: '#0d9090' },
      { t: 25, c: '#0d7377' }, { t: Infinity, c: '#1a5a5c' }
    ],
    cumulative: [
      { t: 1, c: '#d4f0f0' }, { t: 5, c: '#a8e0e0' }, { t: 10, c: '#7ed0d0' },
      { t: 20, c: '#54c0c0' }, { t: 30, c: '#2ab0b0' }, { t: 40, c: '#0d9090' },
      { t: 50, c: '#0d7377' }, { t: Infinity, c: '#1a5a5c' }
    ]
  };
  const arr = scales[mode] || scales.cumulative;
  return (arr.find(s => count < s.t) || arr[arr.length - 1]).c;
}

function quarterIndexToDisplay(index) {
  return (2016 + Math.floor(index / 4)).toString();
}

function updateMapChoropleth(quarterIndex) {
  let countriesWithData = 0, totalEntries = 0;
  const dataSource = mapViewMode === 'cumulative' ? countryEntriesCumulative : countryEntriesYearly;

  document.querySelectorAll('.country-path').forEach(path => {
    const country = path.getAttribute('data-country');
    if (country && dataSource[country]) {
      const count = dataSource[country][quarterIndex] || 0;
      if (count > 0) {
        path.style.fill = getEntryColor(count, mapViewMode);
        path.classList.add('has-data');
        countriesWithData++;
        totalEntries += count;
      } else {
        path.style.fill = '';
        path.classList.remove('has-data');
      }
    }
  });

  // Update label based on mode
  const entriesLabel = mapViewMode === 'cumulative' ? 'Total Entries' : 'Entries This Year';
  const labelEl = document.querySelector('#map-stat-entries + .map-stat-label');
  if (labelEl) labelEl.textContent = entriesLabel;

  document.getElementById('map-stat-countries').textContent = countriesWithData;
  document.getElementById('map-stat-entries').textContent = totalEntries;
}

// ===== TIME SLIDER =====

function initMapTimeSlider() {
  calculateCountryEntriesByQuarter();

  const slider = document.getElementById('map-time-slider');
  const display = document.getElementById('map-time-display');
  const playBtn = document.getElementById('map-play-btn');
  if (!slider) return;

  slider.addEventListener('input', function () {
    mapTimeSliderValue = parseInt(this.value);
    display.textContent = quarterIndexToDisplay(mapTimeSliderValue);
    updateMapChoropleth(mapTimeSliderValue);
  });

  playBtn.addEventListener('click', function () {
    if (mapAnimationInterval) {
      clearInterval(mapAnimationInterval);
      mapAnimationInterval = null;
      playBtn.classList.remove('playing');
      playBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    } else {
      if (mapTimeSliderValue >= 39) mapTimeSliderValue = 0;
      playBtn.classList.add('playing');
      playBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';

      mapAnimationInterval = setInterval(() => {
        mapTimeSliderValue++;
        if (mapTimeSliderValue > 39) {
          mapTimeSliderValue = 39;
          clearInterval(mapAnimationInterval);
          mapAnimationInterval = null;
          playBtn.classList.remove('playing');
          playBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
        }
        slider.value = mapTimeSliderValue;
        display.textContent = quarterIndexToDisplay(mapTimeSliderValue);
        updateMapChoropleth(mapTimeSliderValue);
      }, 300);
    }
  });

  // View mode toggle
  const cumulativeBtn = document.getElementById('map-view-cumulative');
  const yearlyBtn = document.getElementById('map-view-yearly');

  cumulativeBtn?.addEventListener('click', () => {
    mapViewMode = 'cumulative';
    cumulativeBtn.classList.add('active');
    yearlyBtn.classList.remove('active');
    updateMapChoropleth(mapTimeSliderValue);
  });

  yearlyBtn?.addEventListener('click', () => {
    mapViewMode = 'yearly';
    yearlyBtn.classList.add('active');
    cumulativeBtn.classList.remove('active');
    updateMapChoropleth(mapTimeSliderValue);
  });

  updateMapChoropleth(mapTimeSliderValue);
}

// ===== MAP INIT =====

async function initMap() {
  const WIDTH = 960, HEIGHT = 480;

  const svg = d3.select("#map-svg")
    .attr("width", "100%")
    .attr("height", HEIGHT)
    .attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const g = svg.append("g").attr("id", "map-group");

  const projection = d3.geoNaturalEarth1()
    .scale(180)
    .translate([WIDTH / 2, HEIGHT / 2 + 25]);

  const pathGen = d3.geoPath().projection(projection);

  mapZoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", event => g.attr("transform", event.transform));

  svg.call(mapZoom);

  // Controls
  document.getElementById("zoom-in").addEventListener("click", () =>
    svg.transition().duration(300).call(mapZoom.scaleBy, 1.5));
  document.getElementById("zoom-out").addEventListener("click", () =>
    svg.transition().duration(300).call(mapZoom.scaleBy, 0.67));
  document.getElementById("zoom-reset").addEventListener("click", () =>
    svg.transition().duration(300).call(mapZoom.transform, d3.zoomIdentity));

  g.append("rect").attr("class", "ocean").attr("width", WIDTH).attr("height", HEIGHT);
  g.append("path").datum(d3.geoGraticule()()).attr("class", "graticule").attr("d", pathGen);

  const world = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
  const countries = topojson.feature(world, world.objects.countries);

  const countryNames = {};
  world.objects.countries.geometries.forEach(geo => {
    countryNames[geo.id] = geo.properties.name;
  });

  g.selectAll(".country-path")
    .data(countries.features)
    .enter()
    .append("path")
    .attr("class", d => {
      const name = countryNames[d.id] || d.properties.name;
      const mapped = countryNameMap[name];
      return "country-path" + (mapped && policyData[mapped] ? " has-data" : "");
    })
    .attr("d", pathGen)
    .attr("data-country", d => {
      const name = countryNames[d.id] || d.properties.name;
      return countryNameMap[name] || null;
    })
    .attr("data-map-name", d => countryNames[d.id] || d.properties.name)
    .on("click", function (event, d) {
      const name = countryNames[d.id] || d.properties.name;
      const mapped = countryNameMap[name];
      if (!mapped || !policyData[mapped]) return;

      if (currentView === "overview") {
        selectOverviewCountry(mapped);
      } else if (currentView === "alliance") {
        switchToCountryOverview(mapped);
      } else if (currentView === "compare") {
        if (selectedCountries.has(mapped) || selectedCountries.size < MAX_COMPARE) {
          toggleCompareCountry(mapped);
        }
      }
    })
    .on("mousemove", function (event, d) {
      const name = countryNames[d.id] || d.properties.name;
      const mapped = countryNameMap[name];
      if (mapped && policyData[mapped]) {
        showTooltip(event, mapped);
      } else if (currentView === "alliance" && selectedAlliance) {
        const memberName = allianceMemberMap[name];
        if (memberName && allianceMembers[selectedAlliance].indexOf(memberName) !== -1) {
          showAllianceMemberTooltip(event, name, memberName);
        }
      }
    })
    .on("mouseout", hideTooltip);

  document.getElementById("map-loading").style.display = "none";
  document.getElementById("map-svg").style.display = "block";

  setTimeout(initMapTimeSlider, 100);
}
