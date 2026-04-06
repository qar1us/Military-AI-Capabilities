/* =============================================================
   config.js — Static lookups, name maps, alliance definitions
   ============================================================= */

const MAX_COMPARE = 2;

// Maps TopoJSON country names → dataset keys
const countryNameMap = {
  "United States of America": "USA",
  "United States": "USA",
  "China": "China",
  "France": "France",
  "United Kingdom": "UK",
  "South Korea": "South Korea",
  "Korea, Republic of": "South Korea",
  "Republic of Korea": "South Korea",
  "Israel": "Israel",
  "Russia": "Russia",
  "Russian Federation": "Russia",
  "Estonia": "Estonia",
  "Australia": "Australia",
  "Germany": "Germany",
  "Turkey": "Turkey",
  "Türkiye": "Turkey",
  "India": "India",
  "Pakistan": "Pakistan",
  "Azerbaijan": "Azerbaijan",
  "Ukraine": "Ukraine",
  "United Arab Emirates": "UAE",
  "Iran": "Iran",
  "Iran, Islamic Republic of": "Iran",
  "North Korea": "North Korea",
  "Korea, Democratic People's Republic of": "North Korea",
  "Dem. Rep. Korea": "North Korea",
  "Democratic People's Republic of Korea": "North Korea",
  "Norway": "Norway",
  "Singapore": "Singapore",
  "Japan": "Japan",
  "Canada": "Canada",
  "Poland": "Poland",
  "Belgium": "Belgium",
  "Egypt": "Egypt",
  "Italy": "Italy",
  "Algeria": "Algeria",
  "Armenia": "Armenia",
  "Colombia": "Colombia",
  "Netherlands": "Netherlands",
  "Spain": "Spain",
  "Iraq": "Iraq",
  "Lithuania": "Lithuania",
  "Greece": "Greece",
  "Sweden": "Sweden",
  "Latvia": "Latvia",
  "Finland": "Finland",
  "Denmark": "Denmark",
  "Hungary": "Hungary",
  "Croatia": "Croatia",
  "Morocco": "Morocco",
  // FIX: both variants → "Czechia"
  "Czechia": "Czechia",
  "Czech Republic": "Czechia",
  "Bulgaria": "Bulgaria",
  "Brazil": "Brazil",
  "South Africa": "South Africa",
  "S. Africa": "South Africa",
  // FIX: New Zealand was missing
  "New Zealand": "New Zealand",
};

// Human-readable display names
const displayNames = {
  "USA": "United States of America",
  "China": "China",
  "France": "France",
  "UK": "United Kingdom",
  "South Korea": "Republic of Korea",
  "Israel": "Israel",
  "Russia": "Russian Federation",
  "Estonia": "Estonia",
  "Australia": "Australia",
  "Germany": "Germany",
  "Turkey": "Türkiye",
  "India": "India",
  "Pakistan": "Pakistan",
  "Azerbaijan": "Azerbaijan",
  "Ukraine": "Ukraine",
  "UAE": "United Arab Emirates",
  "Iran": "Iran",
  "North Korea": "Democratic People's Republic of Korea",
  "Norway": "Norway",
  "Singapore": "Singapore",
  "Japan": "Japan",
  "Canada": "Canada",
  "Poland": "Poland",
  "Belgium": "Belgium",
  "Egypt": "Egypt",
  "Italy": "Italy",
  "Algeria": "Algeria",
  "Armenia": "Armenia",
  "Colombia": "Colombia",
  "Netherlands": "Netherlands",
  "Spain": "Spain",
  "Iraq": "Iraq",
  "Lithuania": "Lithuania",
  "Greece": "Greece",
  "Sweden": "Sweden",
  "Latvia": "Latvia",
  "Finland": "Finland",
  "Denmark": "Denmark",
  "Hungary": "Hungary",
  "Croatia": "Croatia",
  "Morocco": "Morocco",
  "Czechia": "Czechia",
  "Bulgaria": "Bulgaria",
  "Brazil": "Brazil",
  "South Africa": "South Africa",
  // FIX: New Zealand was missing
  "New Zealand": "New Zealand",
};

// Alliance members (by dataset key)
const allianceMembers = {
  "NATO": [
    "USA", "UK", "France", "Germany", "Turkey", "Estonia", "Norway",
    "Canada", "Belgium", "Bulgaria", "Croatia", "Czechia", "Denmark",
    "Finland", "Greece", "Hungary", "Italy", "Latvia",
    "Lithuania", "Netherlands", "Poland", "Spain", "Sweden",
    "Albania", "Iceland", "Luxembourg", "Montenegro", "North Macedonia",
    "Portugal", "Romania", "Slovakia", "Slovenia"
  ],
  "AUKUS": ["USA", "UK", "Australia"],
  "FVEY": ["USA", "UK", "Australia", "Canada", "New Zealand"]
};

// Maps TopoJSON names → alliance member names (for map highlighting)
const allianceMemberMap = {
  "United States of America": "USA",
  "United States": "USA",
  "United Kingdom": "UK",
  "U.K.": "UK",
  "Britain": "UK",
  "Great Britain": "UK",
  "France": "France",
  "Germany": "Germany",
  "Turkey": "Turkey",
  "Türkiye": "Turkey",
  "Estonia": "Estonia",
  "Norway": "Norway",
  "Canada": "Canada",
  "Belgium": "Belgium",
  "Bulgaria": "Bulgaria",
  "Croatia": "Croatia",
  "Czechia": "Czechia",
  "Czech Republic": "Czechia",
  "Czech Rep.": "Czechia",
  "Denmark": "Denmark",
  "Finland": "Finland",
  "Greece": "Greece",
  "Hungary": "Hungary",
  "Iceland": "Iceland",
  "Italy": "Italy",
  "Latvia": "Latvia",
  "Lithuania": "Lithuania",
  "Luxembourg": "Luxembourg",
  "Montenegro": "Montenegro",
  "Netherlands": "Netherlands",
  "North Macedonia": "North Macedonia",
  "Macedonia": "North Macedonia",
  "Poland": "Poland",
  "Portugal": "Portugal",
  "Romania": "Romania",
  "Slovakia": "Slovakia",
  "Slovenia": "Slovenia",
  "Spain": "Spain",
  "Sweden": "Sweden",
  "Albania": "Albania",
  "Australia": "Australia",
  "New Zealand": "New Zealand",
  "Japan": "Japan",
};

// Country → region mapping (for momentum chart)
const regionMap = {
  "USA": "Americas", "Canada": "Americas", "Brazil": "Americas", "Colombia": "Americas",
  "UK": "Europe", "France": "Europe", "Germany": "Europe", "Italy": "Europe",
  "Spain": "Europe", "Netherlands": "Europe", "Belgium": "Europe", "Poland": "Europe",
  "Norway": "Europe", "Sweden": "Europe", "Finland": "Europe", "Denmark": "Europe",
  "Estonia": "Europe", "Latvia": "Europe", "Lithuania": "Europe", "Greece": "Europe",
  "Hungary": "Europe", "Croatia": "Europe", "Bulgaria": "Europe", "Czechia": "Europe",
  "Russia": "Europe", "Ukraine": "Europe", "Turkey": "Europe",
  "China": "Asia-Pacific", "Japan": "Asia-Pacific", "South Korea": "Asia-Pacific",
  "Singapore": "Asia-Pacific", "India": "Asia-Pacific", "Pakistan": "Asia-Pacific",
  "Australia": "Asia-Pacific", "North Korea": "Asia-Pacific", "New Zealand": "Asia-Pacific",
  "Israel": "Middle East", "UAE": "Middle East", "Iran": "Middle East",
  "Iraq": "Middle East", "Egypt": "Middle East", "Morocco": "Middle East",
  "Algeria": "Africa", "South Africa": "Africa",
  "Armenia": "Europe", "Azerbaijan": "Europe"
};

const regionColors = {
  "Americas": "#d64045",
  "Europe": "#1a2744",
  "Asia-Pacific": "#0d7377",
  "Middle East": "#e07020",
  "Africa": "#6b3074"
};

// Countries that voted AGAINST key LAWS resolutions
const votedAgainstResolutions = {
  "Russia": { year: 2023, resolutions: ["A/RES/78/241", "A/RES/79/239"] },
  "North Korea": { year: 2024, resolutions: ["L.77"] },
  "India": { year: 2023, resolutions: ["A/RES/78/241"] }
};

// Countries that ABSTAINED from key LAWS resolutions
const abstainedResolutions = {
  "China": { year: 2023, resolutions: ["A/RES/78/241"] },
  "Czechia": { year: 2024, resolutions: ["L.77"] },
  "Estonia": { year: 2024, resolutions: ["L.77"] },
  "Iran": { year: 2023, resolutions: ["A/RES/78/241", "L.77"] },
  "Israel": { year: 2023, resolutions: ["A/RES/78/241", "L.77"] },
  "Latvia": { year: 2024, resolutions: ["L.77"] },
  "Lithuania": { year: 2024, resolutions: ["L.77"] },
  "Poland": { year: 2024, resolutions: ["L.77"] },
  "Turkey": { year: 2023, resolutions: ["A/RES/78/241", "L.77"] },
  "UAE": { year: 2023, resolutions: ["A/RES/78/241"] },
  "Ukraine": { year: 2024, resolutions: ["L.77"] }
};

// Convergence groupings for the Alliance view
const convergenceGroupings = {
  "NATO Members": {
    members: ["USA", "UK", "France", "Germany", "Italy", "Canada", "Spain",
      "Netherlands", "Belgium", "Poland", "Norway", "Denmark", "Turkey",
      "Greece", "Hungary", "Czechia", "Estonia", "Latvia", "Lithuania",
      "Croatia", "Bulgaria"],
    color: "#0d7377",
    description: "NATO alliance members"
  },
  "AUKUS": {
    members: ["USA", "UK", "Australia"],
    color: "#e07020",
    description: "AUKUS security partnership"
  },
  "Five Eyes": {
    members: ["USA", "UK", "Canada", "Australia", "New Zealand"],
    color: "#1a2744",
    description: "Five Eyes intelligence alliance"
  }
};

// ISO Alpha-3 codes (used in compare view)
const isoAlpha3 = {
  "Algeria": "DZA", "Armenia": "ARM", "Australia": "AUS", "Azerbaijan": "AZE",
  "Belgium": "BEL", "Brazil": "BRA", "Bulgaria": "BGR", "Canada": "CAN",
  "China": "CHN", "Colombia": "COL", "Croatia": "HRV", "Czechia": "CZE",
  "Denmark": "DNK", "Egypt": "EGY", "Estonia": "EST", "Finland": "FIN",
  "France": "FRA", "Germany": "DEU", "Greece": "GRC", "Hungary": "HUN",
  "India": "IND", "Iran": "IRN", "Iraq": "IRQ", "Israel": "ISR",
  "Italy": "ITA", "Japan": "JPN", "Latvia": "LVA", "Lithuania": "LTU",
  "Morocco": "MAR", "Netherlands": "NLD", "New Zealand": "NZL",
  "North Korea": "PRK", "Norway": "NOR", "Pakistan": "PAK", "Poland": "POL",
  "Russia": "RUS", "Singapore": "SGP", "South Africa": "ZAF",
  "South Korea": "KOR", "Spain": "ESP", "Sweden": "SWE", "Turkey": "TUR",
  "UAE": "ARE", "UK": "GBR", "USA": "USA", "Ukraine": "UKR"
};

// Full policy area names (used throughout)
const POLICY_AREAS = [
  "LAWS Employment/Deployment",
  "Adoption & Intent of Use",
  "Acquisition & Procurement",
  "Ethical Guidelines & Restrictions",
  "Technical Safety & Security Requirements",
  "Int'l Cooperation & Interoperability"
];

// FIX: Use "International Cooperation & Interoperability" in the dropdown label
// but keep the data key as-is ("Int'l Cooperation & Interoperability")
const POLICY_AREA_DISPLAY = {
  "LAWS Employment/Deployment": "LAWS Employment/Deployment",
  "Adoption & Intent of Use": "Adoption & Intent of Use",
  "Acquisition & Procurement": "Acquisition & Procurement",
  "Ethical Guidelines & Restrictions": "Ethical Guidelines & Restrictions",
  "Technical Safety & Security Requirements": "Technical Safety & Security Requirements",
  "Int'l Cooperation & Interoperability": "International Cooperation & Interoperability"
};
