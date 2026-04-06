/* =============================================================
   analytics.js — Momentum, policy growth, convergence charts
   ============================================================= */
function calculateMomentumData() {
    var momentumStats = [];
    var POLICY_AREAS = [
        "LAWS Employment/Deployment",
        "Adoption & Intent of Use",
        "Acquisition & Procurement",
        "Ethical Guidelines & Restrictions",
        "Technical Safety & Security Requirements",
        "Int'l Cooperation & Interoperability"
    ];
    
    // Region mapping for tooltip display
    var regionMap = {
        "USA": "Americas", "Canada": "Americas", "Brazil": "Americas", "Colombia": "Americas",
        "UK": "Europe", "France": "Europe", "Germany": "Europe", "Italy": "Europe", "Spain": "Europe",
        "Netherlands": "Europe", "Belgium": "Europe", "Poland": "Europe", "Norway": "Europe",
        "Sweden": "Europe", "Finland": "Europe", "Denmark": "Europe", "Estonia": "Europe",
        "Latvia": "Europe", "Lithuania": "Europe", "Greece": "Europe", "Hungary": "Europe",
        "Croatia": "Europe", "Bulgaria": "Europe", "Czechia": "Europe",
        "Russia": "Europe", "Ukraine": "Europe", "Turkey": "Europe",
        "China": "Asia-Pacific", "Japan": "Asia-Pacific", "South Korea": "Asia-Pacific",
        "Singapore": "Asia-Pacific", "India": "Asia-Pacific", "Pakistan": "Asia-Pacific",
        "Australia": "Asia-Pacific", "North Korea": "Asia-Pacific",
        "Israel": "Middle East", "UAE": "Middle East", "Iran": "Middle East",
        "Iraq": "Middle East", "Egypt": "Middle East", "Morocco": "Middle East",
        "Algeria": "Africa", "South Africa": "Africa",
        "Armenia": "Europe", "Azerbaijan": "Europe"
    };
    
    var regionColors = {
        "Americas": "#d64045",
        "Europe": "#1a2744",
        "Asia-Pacific": "#0d7377",
        "Middle East": "#e07020",
        "Africa": "#6b3074"
    };
    
    Object.keys(policyData).forEach(function(country) {
        var countryData = policyData[country];
        var recentEntries = 0; // 2023-2025
        var historicalEntries = 0; // before 2023
        var totalEntries = 0;
        
        POLICY_AREAS.forEach(function(area) {
            var areaData = countryData[area];
            if (areaData) {
                ['legal_directives', 'policy_documents', 'public_statements'].forEach(function(type) {
                    if (areaData[type]) {
                        areaData[type].forEach(function(entry) {
                            var text = entry.text || '';
                            var yearMatch = text.match(/\(([A-Z][a-z]+ )?(\d{4})\)/);
                            totalEntries++;
                            if (yearMatch) {
                                var year = parseInt(yearMatch[2]);
                                if (year >= 2023) {
                                    recentEntries++;
                                } else {
                                    historicalEntries++;
                                }
                            } else {
                                historicalEntries++; // Assume older if no date
                            }
                        });
                    }
                });
            }
        });
        
        if (totalEntries > 0) {
            var recentRate = recentEntries / Math.max(1, totalEntries);
            var momentum;
            var color;
            
            if (recentEntries >= 5 && recentRate > 0.5) {
                momentum = "accelerating";
                color = "#4a9d5b";
            } else if (totalEntries >= 5 && recentRate >= 0.3) {
                momentum = "steady";
                color = "#0d7377";
            } else if (recentEntries >= 2 && totalEntries < 8) {
                momentum = "emerging";
                color = "#e07020";
            } else {
                momentum = "dormant";
                color = "#7a8a9a";
            }
            
            var region = regionMap[country] || "Other";
            var regionColor = regionColors[region] || "#888888";
            
            momentumStats.push({
                country: country,
                displayName: displayNames[country] || country,
                total: totalEntries,
                recent: recentEntries,
                historical: historicalEntries,
                recentRate: recentRate,
                momentum: momentum,
                color: color,
                region: region,
                regionColor: regionColor
            });
        }
    });
    
    return momentumStats;
}

function renderMomentumChart() {
    var data = calculateMomentumData();
    var container = document.getElementById("momentum-chart");
    if (!container) return;
    
    container.innerHTML = '';
    
    var width = container.offsetWidth || 300;
    var height = 320;
    var margin = { top: 20, right: 20, bottom: 45, left: 55 };
    var plotWidth = width - margin.left - margin.right;
    var plotHeight = height - margin.top - margin.bottom;
    
    // Calculate data extents with padding
    var maxTotal = Math.max.apply(null, data.map(function(d) { return d.total; }));
    var maxRecent = Math.max.apply(null, data.map(function(d) { return d.recent; }));
    maxTotal = maxTotal * 1.15; // Add 15% padding
    maxRecent = maxRecent * 1.15; // Add 15% padding
    
    // Zoom state
    var zoomLevel = 1;
    var panX = 0;
    var panY = 0;
    var isDragging = false;
    var dragStartX = 0;
    var dragStartY = 0;
    var dragStartPanX = 0;
    var dragStartPanY = 0;
    
    // Create SVG
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.style.cursor = "grab";
    container.appendChild(svg);
    
    // Create clip path for plot area
    var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    var clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clipPath.setAttribute("id", "momentum-clip");
    var clipRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    clipRect.setAttribute("x", margin.left);
    clipRect.setAttribute("y", margin.top);
    clipRect.setAttribute("width", plotWidth);
    clipRect.setAttribute("height", plotHeight);
    clipPath.appendChild(clipRect);
    defs.appendChild(clipPath);
    svg.appendChild(defs);
    
    // Background for plot area
    var plotBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    plotBg.setAttribute("x", margin.left);
    plotBg.setAttribute("y", margin.top);
    plotBg.setAttribute("width", plotWidth);
    plotBg.setAttribute("height", plotHeight);
    plotBg.setAttribute("fill", "white");
    svg.appendChild(plotBg);
    
    // Groups for layering
    var gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    var axisGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    var dotsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    dotsGroup.setAttribute("clip-path", "url(#momentum-clip)");
    svg.appendChild(gridGroup);
    svg.appendChild(axisGroup);
    svg.appendChild(dotsGroup);
    
    // Calculate pan limits to prevent scrolling past 0
    function getPanLimits() {
        // At zoom level 1, pan should be 0
        // At higher zoom, limit pan so that 0,0 origin stays visible
        var maxPanX = (zoomLevel - 1) * plotWidth / 2;
        var maxPanY = (zoomLevel - 1) * plotHeight / 2;
        return {
            minX: -maxPanX,
            maxX: maxPanX,
            minY: -maxPanY,
            maxY: maxPanY
        };
    }
    
    function constrainPan() {
        var limits = getPanLimits();
        panX = Math.max(limits.minX, Math.min(limits.maxX, panX));
        panY = Math.max(limits.minY, Math.min(limits.maxY, panY));
    }
    
    function scaleX(recent) {
        var baseX = margin.left + (recent / maxRecent) * plotWidth;
        return margin.left + (baseX - margin.left - plotWidth/2) * zoomLevel + plotWidth/2 + panX;
    }
    function scaleY(total) {
        var baseY = margin.top + plotHeight - (total / maxTotal) * plotHeight;
        return margin.top + (baseY - margin.top - plotHeight/2) * zoomLevel + plotHeight/2 + panY;
    }
    
    function renderChart() {
        // Clear groups
        gridGroup.innerHTML = '';
        axisGroup.innerHTML = '';
        dotsGroup.innerHTML = '';
        
        // Grid lines and tick labels
        var yTicks = 5;
        for (var i = 0; i <= yTicks; i++) {
            var val = (maxTotal / yTicks) * (yTicks - i);
            var y = scaleY(val);
            
            if (y >= margin.top && y <= margin.top + plotHeight) {
                // Grid line
                var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", margin.left);
                line.setAttribute("y1", y);
                line.setAttribute("x2", margin.left + plotWidth);
                line.setAttribute("y2", y);
                line.setAttribute("stroke", "#e8ebef");
                line.setAttribute("stroke-width", "1");
                gridGroup.appendChild(line);
                
                // Y-axis tick label
                var label = document.createElementNS("http://www.w3.org/2000/svg", "text");
                label.setAttribute("x", margin.left - 8);
                label.setAttribute("y", y + 3);
                label.setAttribute("text-anchor", "end");
                label.setAttribute("font-size", "9");
                label.setAttribute("fill", "#7a8a9a");
                label.textContent = Math.round(val);
                axisGroup.appendChild(label);
            }
        }
        
        var xTicks = 5;
        for (var j = 0; j <= xTicks; j++) {
            var xVal = (maxRecent / xTicks) * j;
            var x = scaleX(xVal);
            
            if (x >= margin.left && x <= margin.left + plotWidth) {
                // Grid line
                var vline = document.createElementNS("http://www.w3.org/2000/svg", "line");
                vline.setAttribute("x1", x);
                vline.setAttribute("y1", margin.top);
                vline.setAttribute("x2", x);
                vline.setAttribute("y2", margin.top + plotHeight);
                vline.setAttribute("stroke", "#e8ebef");
                vline.setAttribute("stroke-width", "1");
                gridGroup.appendChild(vline);
                
                // X-axis tick label
                var xLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
                xLabel.setAttribute("x", x);
                xLabel.setAttribute("y", margin.top + plotHeight + 15);
                xLabel.setAttribute("text-anchor", "middle");
                xLabel.setAttribute("font-size", "9");
                xLabel.setAttribute("fill", "#7a8a9a");
                xLabel.textContent = Math.round(xVal);
                axisGroup.appendChild(xLabel);
            }
        }
        
        // Axis labels
        var xAxisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        xAxisLabel.setAttribute("x", margin.left + plotWidth / 2);
        xAxisLabel.setAttribute("y", height - 8);
        xAxisLabel.setAttribute("text-anchor", "middle");
        xAxisLabel.setAttribute("font-size", "10");
        xAxisLabel.setAttribute("fill", "#1a2744");
        xAxisLabel.setAttribute("font-weight", "600");
        xAxisLabel.textContent = "Recent Entries (2023-2025)";
        axisGroup.appendChild(xAxisLabel);
        
        var yAxisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        yAxisLabel.setAttribute("x", 14);
        yAxisLabel.setAttribute("y", margin.top + plotHeight / 2);
        yAxisLabel.setAttribute("text-anchor", "middle");
        yAxisLabel.setAttribute("font-size", "10");
        yAxisLabel.setAttribute("fill", "#1a2744");
        yAxisLabel.setAttribute("font-weight", "600");
        yAxisLabel.setAttribute("transform", "rotate(-90, 14, " + (margin.top + plotHeight / 2) + ")");
        yAxisLabel.textContent = "Total Entries";
        axisGroup.appendChild(yAxisLabel);
        
        // Axis lines
        var xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
        xAxis.setAttribute("x1", margin.left);
        xAxis.setAttribute("y1", margin.top + plotHeight);
        xAxis.setAttribute("x2", margin.left + plotWidth);
        xAxis.setAttribute("y2", margin.top + plotHeight);
        xAxis.setAttribute("stroke", "#1a2744");
        xAxis.setAttribute("stroke-width", "1.5");
        axisGroup.appendChild(xAxis);
        
        var yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
        yAxis.setAttribute("x1", margin.left);
        yAxis.setAttribute("y1", margin.top);
        yAxis.setAttribute("x2", margin.left);
        yAxis.setAttribute("y2", margin.top + plotHeight);
        yAxis.setAttribute("stroke", "#1a2744");
        yAxis.setAttribute("stroke-width", "1.5");
        axisGroup.appendChild(yAxis);
        
        // Plot dots - sort by total so high-value countries render on top
        var sortedData = data.slice().sort(function(a, b) {
            return a.total - b.total;
        });
        
        sortedData.forEach(function(item) {
            var cx = scaleX(item.recent);
            var cy = scaleY(item.total);
            var r = 4 * Math.sqrt(zoomLevel);
            
            // Only render if in visible area
            if (cx < margin.left - r || cx > margin.left + plotWidth + r ||
                cy < margin.top - r || cy > margin.top + plotHeight + r) {
                return;
            }
            
            var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", cx);
            circle.setAttribute("cy", cy);
            circle.setAttribute("r", r);
            circle.setAttribute("fill", item.color);
            circle.setAttribute("fill-opacity", "0.85");
            circle.setAttribute("stroke", "white");
            circle.setAttribute("stroke-width", "1");
            circle.setAttribute("cursor", "pointer");
            circle.style.transition = "r 0.15s, fill-opacity 0.15s";
            
            // Tooltip events
            circle.addEventListener("mouseenter", function(e) {
                this.setAttribute("r", r * 1.5);
                this.setAttribute("fill-opacity", "1");
                
                var tooltip = document.getElementById("momentum-tooltip");
                var statusLabel = item.momentum.charAt(0).toUpperCase() + item.momentum.slice(1);
                tooltip.innerHTML = '<strong>' + item.displayName + '</strong><br>' +
                    'Total: ' + item.total + ' entries<br>' +
                    'Recent (2023+): ' + item.recent + '<br>' +
                    'Status: <span class="tooltip-status ' + item.momentum + '">' + statusLabel + '</span>';
                tooltip.classList.add("visible");
            });
            
            circle.addEventListener("mousemove", function(e) {
                var tooltip = document.getElementById("momentum-tooltip");
                var tooltipRect = tooltip.getBoundingClientRect();
                var viewportWidth = window.innerWidth;
                var viewportHeight = window.innerHeight;
                
                var left = e.clientX + 15;
                var top = e.clientY - 10;
                
                // Keep tooltip in viewport
                if (left + tooltipRect.width > viewportWidth - 10) {
                    left = e.clientX - tooltipRect.width - 15;
                }
                if (top + tooltipRect.height > viewportHeight - 10) {
                    top = e.clientY - tooltipRect.height - 10;
                }
                if (top < 10) top = 10;
                
                tooltip.style.left = left + "px";
                tooltip.style.top = top + "px";
            });
            
            circle.addEventListener("mouseleave", function() {
                this.setAttribute("r", r);
                this.setAttribute("fill-opacity", "0.85");
                document.getElementById("momentum-tooltip").classList.remove("visible");
            });
            
            circle.addEventListener("click", function(e) {
                e.stopPropagation();
                selectOverviewCountry(item.country);
            });
            
            dotsGroup.appendChild(circle);
        });
    }
    
    // Initial render
    renderChart();
    
    // Zoom controls
    var zoomInBtn = document.getElementById("momentum-zoom-in");
    var zoomOutBtn = document.getElementById("momentum-zoom-out");
    var zoomResetBtn = document.getElementById("momentum-zoom-reset");
    
    if (zoomInBtn) {
        zoomInBtn.addEventListener("click", function() {
            zoomLevel = Math.min(zoomLevel * 1.5, 10);
            constrainPan();
            renderChart();
            if (window.momentumReapplyHighlight) setTimeout(window.momentumReapplyHighlight, 20);
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener("click", function() {
            zoomLevel = Math.max(zoomLevel / 1.5, 1);
            constrainPan();
            renderChart();
            if (window.momentumReapplyHighlight) setTimeout(window.momentumReapplyHighlight, 20);
        });
    }
    
    if (zoomResetBtn) {
        zoomResetBtn.addEventListener("click", function() {
            zoomLevel = 1;
            panX = 0;
            panY = 0;
            renderChart();
            if (window.momentumReapplyHighlight) setTimeout(window.momentumReapplyHighlight, 20);
        });
    }
    
    // Mouse wheel zoom - zooms toward mouse position
    container.addEventListener("wheel", function(e) {
        e.preventDefault();
        var delta = e.deltaY > 0 ? 0.9 : 1.1;
        var newZoom = Math.max(1, Math.min(10, zoomLevel * delta));
        
        if (newZoom !== zoomLevel) {
            // Get mouse position relative to plot area center
            var rect = container.getBoundingClientRect();
            var mouseX = e.clientX - rect.left;
            var mouseY = e.clientY - rect.top;
            
            // Calculate offset from plot center
            var plotCenterX = margin.left + plotWidth / 2;
            var plotCenterY = margin.top + plotHeight / 2;
            var offsetX = mouseX - plotCenterX;
            var offsetY = mouseY - plotCenterY;
            
            // Adjust pan so the point under mouse stays fixed
            var zoomRatio = newZoom / zoomLevel;
            panX = panX * zoomRatio - offsetX * (zoomRatio - 1);
            panY = panY * zoomRatio - offsetY * (zoomRatio - 1);
            
            zoomLevel = newZoom;
            constrainPan();
            renderChart();
            if (window.momentumReapplyHighlight) setTimeout(window.momentumReapplyHighlight, 20);
        }
    }, { passive: false });
    
    // Pan with mouse drag
    container.addEventListener("mousedown", function(e) {
        if (e.target.tagName === "circle") return;
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        dragStartPanX = panX;
        dragStartPanY = panY;
        svg.style.cursor = "grabbing";
    });
    
    document.addEventListener("mousemove", function(e) {
        if (!isDragging) return;
        var dx = e.clientX - dragStartX;
        var dy = e.clientY - dragStartY;
        panX = dragStartPanX + dx;
        panY = dragStartPanY + dy;
        constrainPan();
        renderChart();
    });
    
    document.addEventListener("mouseup", function() {
        if (isDragging) {
            isDragging = false;
            svg.style.cursor = "grab";
            if (window.momentumReapplyHighlight) setTimeout(window.momentumReapplyHighlight, 20);
        }
    });
    
    // Store data and elements for search functionality
    window.momentumChartData = {
        data: data,
        dotsGroup: dotsGroup,
        scaleX: scaleX,
        scaleY: scaleY,
        margin: margin,
        plotWidth: plotWidth,
        plotHeight: plotHeight,
        zoomLevel: function() { return zoomLevel; },
        activeSearch: null
    };
}

// ===== MOMENTUM CHART SEARCH =====
(function() {
    // Country aliases for common names
    var countryAliases = {
        'russia': 'Russian Federation',
        'uk': 'United Kingdom',
        'britain': 'United Kingdom',
        'great britain': 'United Kingdom',
        'england': 'United Kingdom',
        'usa': 'United States',
        'us': 'United States',
        'america': 'United States',
        'uae': 'United Arab Emirates',
        'emirates': 'United Arab Emirates',
        'south korea': 'Korea, Republic of',
        'korea': 'Korea, Republic of',
        'rok': 'Korea, Republic of',
        'czech': 'Czech Republic',
        'czechia': 'Czech Republic',
        'netherlands': 'The Netherlands',
        'holland': 'The Netherlands',
        'ksa': 'Saudi Arabia',
        'prc': 'China',
        'roc': 'Taiwan'
    };
    
    function findCountry(searchTerm) {
        if (!window.momentumChartData) return null;
        var data = window.momentumChartData.data;
        var term = searchTerm.toLowerCase().trim();
        
        // Check aliases first
        if (countryAliases[term]) {
            var aliasTarget = countryAliases[term];
            for (var i = 0; i < data.length; i++) {
                if (data[i].displayName === aliasTarget || data[i].country === aliasTarget) {
                    return data[i];
                }
            }
        }
        
        // Partial match on country name
        for (var i = 0; i < data.length; i++) {
            var name = data[i].displayName.toLowerCase();
            var countryId = data[i].country.toLowerCase();
            if (name.indexOf(term) !== -1 || countryId.indexOf(term) !== -1) {
                return data[i];
            }
        }
        
        return null;
    }
    
    function highlightCountry(item) {
        if (!window.momentumChartData) return;
        
        // Store active search for re-apply after zoom/pan
        window.momentumChartData.activeSearch = item;
        
        var chartData = window.momentumChartData;
        var dotsGroup = chartData.dotsGroup;
        var scaleX = chartData.scaleX;
        var scaleY = chartData.scaleY;
        var zoomLevel = chartData.zoomLevel();
        
        // Remove any existing highlight
        var existingHighlight = document.getElementById('momentum-highlight-group');
        if (existingHighlight) existingHighlight.remove();
        
        // Get position
        var cx = scaleX(item.recent);
        var cy = scaleY(item.total);
        var r = 4 * Math.sqrt(zoomLevel);
        
        // Create highlight group
        var highlightGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        highlightGroup.setAttribute("id", "momentum-highlight-group");
        
        // Pulsing ring
        var ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        ring.setAttribute("cx", cx);
        ring.setAttribute("cy", cy);
        ring.setAttribute("r", r * 2.5);
        ring.setAttribute("fill", "none");
        ring.setAttribute("stroke", item.color);
        ring.setAttribute("stroke-width", "2");
        ring.setAttribute("stroke-opacity", "0.6");
        
        // Add pulse animation
        var animR = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        animR.setAttribute("attributeName", "r");
        animR.setAttribute("from", r * 1.5);
        animR.setAttribute("to", r * 3);
        animR.setAttribute("dur", "1s");
        animR.setAttribute("repeatCount", "indefinite");
        ring.appendChild(animR);
        
        var animOpacity = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        animOpacity.setAttribute("attributeName", "stroke-opacity");
        animOpacity.setAttribute("from", "0.8");
        animOpacity.setAttribute("to", "0");
        animOpacity.setAttribute("dur", "1s");
        animOpacity.setAttribute("repeatCount", "indefinite");
        ring.appendChild(animOpacity);
        
        highlightGroup.appendChild(ring);
        
        // Highlighted dot
        var dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        dot.setAttribute("cx", cx);
        dot.setAttribute("cy", cy);
        dot.setAttribute("r", r * 1.8);
        dot.setAttribute("fill", item.color);
        dot.setAttribute("stroke", "white");
        dot.setAttribute("stroke-width", "2");
        highlightGroup.appendChild(dot);
        
        // Label background
        var labelText = item.displayName;
        var labelWidth = labelText.length * 6.5 + 16;
        var labelHeight = 20;
        var labelX = cx + r * 2 + 8;
        var labelY = cy - labelHeight / 2;
        
        // Adjust if label would go off right edge
        var container = document.getElementById("momentum-chart");
        if (container && labelX + labelWidth > container.offsetWidth - 20) {
            labelX = cx - r * 2 - labelWidth - 8;
        }
        
        var labelBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        labelBg.setAttribute("x", labelX);
        labelBg.setAttribute("y", labelY);
        labelBg.setAttribute("width", labelWidth);
        labelBg.setAttribute("height", labelHeight);
        labelBg.setAttribute("rx", "4");
        labelBg.setAttribute("fill", "white");
        labelBg.setAttribute("stroke", item.color);
        labelBg.setAttribute("stroke-width", "1.5");
        labelBg.setAttribute("filter", "drop-shadow(0 1px 3px rgba(0,0,0,0.15))");
        highlightGroup.appendChild(labelBg);
        
        // Label text
        var label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", labelX + 8);
        label.setAttribute("y", labelY + 14);
        label.setAttribute("font-family", "Inter, sans-serif");
        label.setAttribute("font-size", "11");
        label.setAttribute("font-weight", "600");
        label.setAttribute("fill", "#1a2744");
        label.textContent = labelText;
        highlightGroup.appendChild(label);
        
        dotsGroup.appendChild(highlightGroup);
        
        // Show the hover tooltip
        var tooltip = document.getElementById("momentum-tooltip");
        if (tooltip && container) {
            var statusLabel = item.momentum.charAt(0).toUpperCase() + item.momentum.slice(1);
            tooltip.innerHTML = '<strong>' + item.displayName + '</strong><br>' +
                'Total: ' + item.total + ' entries<br>' +
                'Recent (2023+): ' + item.recent + '<br>' +
                'Status: <span class="tooltip-status ' + item.momentum + '">' + statusLabel + '</span>';
            tooltip.classList.add("visible");
            
            // Position tooltip near the highlighted dot
            var containerRect = container.getBoundingClientRect();
            var tooltipLeft = containerRect.left + cx + 20;
            var tooltipTop = containerRect.top + cy - 30 + window.scrollY;
            
            // Keep tooltip in viewport
            if (tooltipLeft + 150 > window.innerWidth - 10) {
                tooltipLeft = containerRect.left + cx - 170;
            }
            
            tooltip.style.left = tooltipLeft + "px";
            tooltip.style.top = tooltipTop + "px";
        }
    }
    
    function clearHighlight() {
        var existingHighlight = document.getElementById('momentum-highlight-group');
        if (existingHighlight) existingHighlight.remove();
        
        var tooltip = document.getElementById("momentum-tooltip");
        if (tooltip) tooltip.classList.remove("visible");
        
        // Clear active search
        if (window.momentumChartData) {
            window.momentumChartData.activeSearch = null;
        }
    }
    
    // Function to re-apply highlight after zoom/pan
    window.momentumReapplyHighlight = function() {
        if (window.momentumChartData && window.momentumChartData.activeSearch) {
            highlightCountry(window.momentumChartData.activeSearch);
        }
    };
    
    // Set up search input handler
    document.addEventListener('DOMContentLoaded', function() {
        var searchInput = document.getElementById('momentum-country-search');
        if (!searchInput) return;
        
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                var term = this.value.trim();
                if (!term) {
                    clearHighlight();
                    return;
                }
                
                var found = findCountry(term);
                if (found) {
                    highlightCountry(found);
                    this.style.borderColor = '';
                } else {
                    clearHighlight();
                    this.style.borderColor = '#e63946';
                    setTimeout(function() {
                        searchInput.style.borderColor = '';
                    }, 1500);
                }
            }
        });
        
        // Clear highlight when input is cleared
        searchInput.addEventListener('input', function() {
            if (!this.value.trim()) {
                clearHighlight();
            }
        });
        
        // Clear search and highlight when clicking on chart
        var chartContainer = document.getElementById('momentum-chart');
        if (chartContainer) {
            chartContainer.addEventListener('click', function(e) {
                // Don't clear if clicking on a country dot (let that handler work)
                if (e.target.tagName === 'circle') return;
                
                searchInput.value = '';
                searchInput.style.borderColor = '';
                clearHighlight();
            });
        }
    });
})();

// ===== POLICY GROWTH CHART =====
function renderPolicyGrowthChart() {
    var container = document.getElementById("policy-growth-chart");
    if (!container) return;
    
    container.innerHTML = '';
    
    // Calculate policy counts by year, quarter, and dimension
    var quarterlyData = {};
    var years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
    var quarters = [1, 2, 3, 4];
    var dims = ['LAWS', 'Adoption', 'Procurement', 'Safety', 'Ethics', 'Interoperability'];
    var dimLabels = {
        'LAWS': 'LAWS Employment',
        'Adoption': 'Adoption & Intent',
        'Procurement': 'Procurement',
        'Safety': 'Safety & Security',
        'Ethics': 'Ethics',
        'Interoperability': 'Interoperability'
    };
    var colors = {
        'LAWS': '#e63946',
        'Adoption': '#457b9d',
        'Procurement': '#2a9d8f',
        'Safety': '#e9c46a',
        'Ethics': '#a855f7',
        'Interoperability': '#14b8a6'
    };
    
    // Map full area names to short names
    var areaToShort = {
        'LAWS Employment/Deployment': 'LAWS',
        'Adoption & Intent of Use': 'Adoption',
        'Acquisition & Procurement': 'Procurement',
        'Technical Safety & Security Requirements': 'Safety',
        'Ethical Guidelines & Restrictions': 'Ethics',
        "Int'l Cooperation & Interoperability": 'Interoperability'
    };
    
    // Month to quarter mapping
    var monthToQuarter = {
        'Jan': 1, 'January': 1,
        'Feb': 1, 'February': 1,
        'Mar': 1, 'March': 1,
        'Apr': 2, 'April': 2,
        'May': 2,
        'Jun': 2, 'June': 2,
        'Jul': 3, 'July': 3,
        'Aug': 3, 'August': 3,
        'Sep': 3, 'September': 3,
        'Oct': 4, 'October': 4,
        'Nov': 4, 'November': 4,
        'Dec': 4, 'December': 4
    };
    
    var POLICY_AREAS = [
        "LAWS Employment/Deployment",
        "Adoption & Intent of Use",
        "Acquisition & Procurement",
        "Technical Safety & Security Requirements",
        "Ethical Guidelines & Restrictions",
        "Int'l Cooperation & Interoperability"
    ];
    
    // Initialize data structure
    years.forEach(function(y) {
        quarterlyData[y] = {};
        quarters.forEach(function(q) {
            quarterlyData[y][q] = {};
            dims.forEach(function(d) { quarterlyData[y][q][d] = 0; });
        });
    });
    
    // Count policies from policyData structure
    Object.keys(policyData).forEach(function(country) {
        var countryData = policyData[country];
        
        POLICY_AREAS.forEach(function(area) {
            var areaData = countryData[area];
            var shortName = areaToShort[area];
            
            if (areaData) {
                ['legal_directives', 'policy_documents', 'public_statements'].forEach(function(type) {
                    if (areaData[type]) {
                        areaData[type].forEach(function(entry) {
                            var text = entry.text || '';
                            // Extract month and year from pattern like "(Month YYYY)" or "(YYYY)"
                            var dateMatch = text.match(/\(([A-Z][a-z]+)?\s*(\d{4})\)/);
                            if (dateMatch) {
                                var monthStr = dateMatch[1] || '';
                                var year = parseInt(dateMatch[2]);
                                
                                if (year >= 2016 && year <= 2025) {
                                    // Determine quarter (default to Q4 if no month)
                                    var quarter = 4;
                                    if (monthStr && monthToQuarter[monthStr]) {
                                        quarter = monthToQuarter[monthStr];
                                    }
                                    quarterlyData[year][quarter][shortName]++;
                                }
                            }
                        });
                    }
                });
            }
        });
    });
    
    // Calculate max for scaling (max of any single quarter)
    var maxQuarterTotal = 0;
    years.forEach(function(y) {
        quarters.forEach(function(q) {
            var total = 0;
            dims.forEach(function(d) { total += quarterlyData[y][q][d]; });
            if (total > maxQuarterTotal) maxQuarterTotal = total;
        });
    });
    
    var chartHeight = 360;
    var scale = maxQuarterTotal > 0 ? chartHeight / maxQuarterTotal : 1;
    
    // Create grid lines
    var gridContainer = document.createElement('div');
    gridContainer.className = 'policy-growth-grid';
    var gridSteps = [0, 20, 40, 60, 80, 100];
    if (maxQuarterTotal > 100) gridSteps = [0, 25, 50, 75, 100, 125];
    if (maxQuarterTotal > 125) gridSteps = [0, 30, 60, 90, 120, 150];
    gridSteps.forEach(function(val) {
        if (val <= maxQuarterTotal * 1.1) {
            var line = document.createElement('div');
            line.className = 'policy-growth-grid-line';
            line.style.bottom = ((val / maxQuarterTotal) * 100) + '%';
            gridContainer.appendChild(line);
        }
    });
    container.appendChild(gridContainer);
    
    // Create Y-axis
    var yAxis = document.createElement('div');
    yAxis.className = 'policy-growth-y-axis';
    var yAxisSteps = gridSteps.slice().reverse();
    yAxisSteps.forEach(function(val) {
        if (val <= maxQuarterTotal * 1.1) {
            var label = document.createElement('span');
            label.textContent = val;
            yAxis.appendChild(label);
        }
    });
    container.appendChild(yAxis);
    
    // Create tooltip element
    var tooltip = document.getElementById('policy-growth-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'policy-growth-tooltip';
        tooltip.className = 'policy-growth-hover-panel';
        document.body.appendChild(tooltip);
    }
    
    // Create bars container
    var barsContainer = document.createElement('div');
    barsContainer.className = 'policy-growth-bars';
    
    years.forEach(function(year) {
        var yearGroup = document.createElement('div');
        yearGroup.className = 'policy-growth-year-group';
        
        quarters.forEach(function(quarter) {
            var counts = quarterlyData[year][quarter];
            var total = 0;
            dims.forEach(function(d) { total += counts[d]; });
            
            var group = document.createElement('div');
            group.className = 'policy-growth-bar-group';
            
            // Store data for tooltip
            group.dataset.year = year;
            group.dataset.quarter = quarter;
            group.dataset.total = total;
            group.dataset.counts = JSON.stringify(counts);
            
            // Create stacked bar
            var stack = document.createElement('div');
            stack.className = 'policy-growth-bar-stack';
            
            dims.forEach(function(dim) {
                if (counts[dim] > 0) {
                    var segment = document.createElement('div');
                    segment.className = 'policy-growth-bar-segment';
                    segment.style.height = (counts[dim] * scale) + 'px';
                    segment.style.background = colors[dim];
                    stack.appendChild(segment);
                }
            });
            
            // Mouse events for tooltip
            group.addEventListener('mouseenter', function(e) {
                var year = this.dataset.year;
                var quarter = this.dataset.quarter;
                var total = parseInt(this.dataset.total);
                var counts = JSON.parse(this.dataset.counts);
                
                var quarterLabel = 'Q' + quarter + ' ' + year;
                var html = '<div class="policy-growth-hover-title">' +
                    '<span>' + quarterLabel + '</span>' +
                    '<span class="policy-growth-hover-total">' + total + ' policies</span>' +
                    '</div><div class="policy-growth-hover-rows">';
                
                dims.forEach(function(dim) {
                    var count = counts[dim];
                    var pct = total > 0 ? (count / total) * 100 : 0;
                    html += '<div class="policy-growth-hover-row">' +
                        '<div class="policy-growth-hover-row-label">' + dimLabels[dim] + '</div>' +
                        '<div class="policy-growth-hover-row-bar">' +
                            '<div class="policy-growth-hover-row-fill" style="width:' + pct + '%;background:' + colors[dim] + '"></div>' +
                        '</div>' +
                        '<div class="policy-growth-hover-row-pct">' + pct.toFixed(0) + '%</div>' +
                        '<div class="policy-growth-hover-row-count">' + count + '</div>' +
                    '</div>';
                });
                html += '</div>';
                
                tooltip.innerHTML = html;
                tooltip.classList.add('visible');
            });
            
            group.addEventListener('mousemove', function(e) {
                var tooltipRect = tooltip.getBoundingClientRect();
                var chartRect = container.getBoundingClientRect();
                
                var left = e.clientX - tooltipRect.width / 2;
                var top = chartRect.top + 15;
                
                if (left < chartRect.left + 10) {
                    left = chartRect.left + 10;
                }
                if (left + tooltipRect.width > chartRect.right - 10) {
                    left = chartRect.right - tooltipRect.width - 10;
                }
                
                tooltip.style.left = left + 'px';
                tooltip.style.top = top + 'px';
            });
            
            group.addEventListener('mouseleave', function() {
                tooltip.classList.remove('visible');
            });
            
            group.appendChild(stack);
            yearGroup.appendChild(group);
        });
        
        barsContainer.appendChild(yearGroup);
    });
    
    container.appendChild(barsContainer);
    
    // Create X-axis ticks (4 per year)
    var xTicks = document.createElement('div');
    xTicks.className = 'policy-growth-x-ticks';
    years.forEach(function(year) {
        var tickGroup = document.createElement('div');
        tickGroup.className = 'policy-growth-x-tick-group';
        quarters.forEach(function(q) {
            var tick = document.createElement('div');
            tick.className = 'policy-growth-x-tick';
            tickGroup.appendChild(tick);
        });
        xTicks.appendChild(tickGroup);
    });
    container.appendChild(xTicks);
    
    // Create X-axis labels (years only)
    var xAxis = document.createElement('div');
    xAxis.className = 'policy-growth-x-axis';
    years.forEach(function(year) {
        var label = document.createElement('div');
        label.className = 'policy-growth-x-label';
        label.textContent = year;
        xAxis.appendChild(label);
    });
    container.appendChild(xAxis);
}

// ===== CONVERGENCE TIMELINE =====

// Helper to get area emergence year for a country
function getAreaEmergenceYear(country, areaShortName) {
    var areaNameMap = {
        'LAWS': 'LAWS Employment/Deployment',
        'Adoption': 'Adoption & Intent of Use',
        'Procurement': 'Acquisition & Procurement',
        'Safety': 'Technical Safety & Security Requirements',
        'Ethics': 'Ethical Guidelines & Restrictions',
        'Interoperability': "Int'l Cooperation & Interoperability"
    };
    
    var data = policyData[country];
    if (!data) return null;
    
    var fullName = areaNameMap[areaShortName];
    var area = data[fullName];
    if (!area) return null;
    
    var entries = (area.legal_directives || [])
        .concat(area.policy_documents || [])
        .concat(area.public_statements || []);
    
    var minYear = 2030;
    entries.forEach(function(entry) {
        var text = entry.text || entry;
        var match = text.match(/\(([A-Za-z]{3,4}\s+)?(\d{4})\)/);
        if (match) {
            var yr = parseInt(match[2]);
            if (yr < minYear && yr >= 2010) minYear = yr;
        }
    });
    
    return minYear < 2030 ? minYear : null;
}

// Calculate blended similarity (20% presence + 80% substance) with temporal evolution
function calculateCountrySimilarity(country1, country2, year) {
    // Use pre-calculated yearly scores
    var yearlyScores = rawData.yearlyScores || {};
    var scores1 = yearlyScores[country1];
    var scores2 = yearlyScores[country2];
    
    if (!scores1 || !scores2) return null;
    
    var yearStr = year.toString();
    var s1 = scores1[yearStr];
    var s2 = scores2[yearStr];
    
    if (!s1 || !s2) return null;
    
    var dims = ['LAWS', 'Adoption', 'Procurement', 'Safety', 'Ethics', 'Interoperability'];
    
    // Count how many areas each country has data for
    var country1Areas = 0;
    var country2Areas = 0;
    
    dims.forEach(function(dim) {
        if (s1[dim] !== null && s1[dim] !== undefined) country1Areas++;
        if (s2[dim] !== null && s2[dim] !== undefined) country2Areas++;
    });
    
    // If either country has NO policy data for this year, return null
    if (country1Areas === 0 || country2Areas === 0) {
        return null;
    }
    
    var presenceScore = 0;
    var substanceScore = 0;
    var activeAreas = 0;
    var relevantAreas = 0;
    
    dims.forEach(function(dim) {
        var v1 = s1[dim];
        var v2 = s2[dim];
        
        var has1 = v1 !== null && v1 !== undefined;
        var has2 = v2 !== null && v2 !== undefined;
        
        // Only consider areas where at least one country has data
        if (has1 || has2) {
            relevantAreas++;
            if (has1 === has2) {
                presenceScore += 1;
            }
        }
        
        // Substance similarity: only for areas where both countries have data
        if (has1 && has2) {
            var dimSim = 1 - Math.abs(v1 - v2) / 4;
            substanceScore += dimSim;
            activeAreas++;
        }
    });
    
    // Normalize scores
    presenceScore = relevantAreas > 0 ? presenceScore / relevantAreas : 0;
    substanceScore = activeAreas > 0 ? substanceScore / activeAreas : 0;
    
    // Calculate base similarity
    var baseSimilarity;
    if (activeAreas === 0) {
        baseSimilarity = presenceScore * 0.3;
    } else {
        baseSimilarity = 0.2 * presenceScore + 0.8 * substanceScore;
    }
    
    // Apply voting divergence penalty (or bonus for same stance)
    var votingPenalty = calcVotingDivergencePenalty(country1, country2, year);
    return Math.min(1, Math.max(0, baseSimilarity - votingPenalty));
}

// Helper function to count entries up to a given year
function getEntryCountUpToYear(country, year) {
    var data = policyData[country];
    if (!data) return 0;
    
    var count = 0;
    var POLICY_AREAS = [
        "LAWS Employment/Deployment",
        "Adoption & Intent of Use",
        "Acquisition & Procurement",
        "Ethical Guidelines & Restrictions",
        "Technical Safety & Security Requirements",
        "Int'l Cooperation & Interoperability"
    ];
    
    POLICY_AREAS.forEach(function(area) {
        var areaData = data[area];
        if (!areaData) return;
        
        ['legal_directives', 'policy_documents', 'public_statements'].forEach(function(type) {
            if (areaData[type]) {
                areaData[type].forEach(function(entry) {
                    var text = entry.text || '';
                    var yearMatch = text.match(/\(([A-Z][a-z]+ )?(\d{4})\)/);
                    var entryYear = yearMatch ? parseInt(yearMatch[2]) : 2020;
                    if (entryYear <= year) {
                        count++;
                    }
                });
            }
        });
    });
    
    return count;
}

// Calculate group similarity for a year using blended approach
function calculateGroupSimilarity(groupName, year) {
    var group = convergenceGroupings[groupName];
    if (!group) return null;
    
    var membersWithData = group.members.filter(function(m) { return policyData[m]; });
    if (membersWithData.length < 2) return null;
    
    var similarities = [];
    for (var i = 0; i < membersWithData.length; i++) {
        for (var j = i + 1; j < membersWithData.length; j++) {
            var sim = calculateCountrySimilarity(membersWithData[i], membersWithData[j], year);
            if (sim !== null && !isNaN(sim)) {
                similarities.push(sim);
            }
        }
    }
    
    if (similarities.length === 0) return null;
    
    var avg = similarities.reduce(function(a, b) { return a + b; }, 0) / similarities.length;
    return avg;
}

function renderConvergenceTimeline(alliance) {
    var container = document.getElementById("convergence-timeline-container");
    var svg = document.getElementById("convergence-chart-svg");
    var legendContainer = document.getElementById("convergence-legend");
    var groupingsContainer = document.getElementById("convergence-groupings");
    var similarityBars = document.getElementById("convergence-similarity-bars");
    
    if (!container || !svg) {
        if (container) container.style.display = "none";
        return;
    }
    
    // Show container
    container.style.display = "block";
    
    // Map alliance names to grouping names
    var allianceToGrouping = {
        "NATO": "NATO Members",
        "AUKUS": "AUKUS",
        "FVEY": "Five Eyes"
    };
    
    // ALWAYS reset activeConvergenceGroups to the selected alliance
    if (alliance) {
        var matchedGrouping = allianceToGrouping[alliance];
        if (matchedGrouping && convergenceGroupings[matchedGrouping]) {
            activeConvergenceGroups = [matchedGrouping];
        } else {
            activeConvergenceGroups = ["NATO Members"];
        }
    } else if (activeConvergenceGroups.length === 0) {
        // Default to NATO if no alliance and nothing selected
        activeConvergenceGroups = ["NATO Members"];
    }
    
    // Render grouping buttons
    groupingsContainer.innerHTML = '<div class="convergence-groupings-label">Select Country Groupings</div>';
    
    Object.keys(convergenceGroupings).forEach(function(groupName) {
        var btn = document.createElement("button");
        btn.className = "convergence-group-btn";
        if (activeConvergenceGroups.indexOf(groupName) !== -1) {
            btn.classList.add("active");
        }
        btn.textContent = groupName;
        btn.addEventListener("click", function() {
            var idx = activeConvergenceGroups.indexOf(groupName);
            if (idx === -1) {
                activeConvergenceGroups.push(groupName);
            } else {
                activeConvergenceGroups.splice(idx, 1);
            }
            renderConvergenceChart();
        });
        groupingsContainer.appendChild(btn);
    });
    
    renderConvergenceChart();
    
    function renderConvergenceChart() {
        // Update button states
        var btns = groupingsContainer.querySelectorAll(".convergence-group-btn");
        btns.forEach(function(btn) {
            if (activeConvergenceGroups.indexOf(btn.textContent) !== -1) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });
        
        // Calculate data for all active groups
        var years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
        convergenceData = {};
        
        activeConvergenceGroups.forEach(function(groupName) {
            convergenceData[groupName] = [];
            years.forEach(function(year) {
                var sim = calculateGroupSimilarity(groupName, year);
                convergenceData[groupName].push({
                    year: year,
                    similarity: sim !== null ? sim * 100 : null
                });
            });
        });
        
        // Render SVG chart
        var chartArea = document.getElementById("convergence-chart-area");
        var width = chartArea.offsetWidth || 600;
        var height = 300;
        var margin = { top: 30, right: 30, bottom: 45, left: 60 };
        var plotWidth = width - margin.left - margin.right;
        var plotHeight = height - margin.top - margin.bottom;
        
        svg.innerHTML = '';
        svg.setAttribute("width", width);
        svg.setAttribute("height", height);
        svg.setAttribute("viewBox", "0 0 " + width + " " + height);
        
        // Y-axis (0-100%)
        var yTicks = [0, 25, 50, 75, 100];
        yTicks.forEach(function(val) {
            var y = margin.top + plotHeight - (val / 100) * plotHeight;
            
            // Grid line
            var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", margin.left);
            line.setAttribute("y1", y);
            line.setAttribute("x2", width - margin.right);
            line.setAttribute("y2", y);
            line.setAttribute("stroke", "#e8ebef");
            line.setAttribute("stroke-width", "1");
            if (val === 75) line.setAttribute("stroke-dasharray", "4,4");
            if (val === 25) line.setAttribute("stroke-dasharray", "4,4");
            svg.appendChild(line);
            
            // Label
            var label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("x", margin.left - 10);
            label.setAttribute("y", y + 4);
            label.setAttribute("text-anchor", "end");
            label.setAttribute("font-size", "11");
            label.setAttribute("fill", "#7a8a9a");
            label.textContent = val + "%";
            svg.appendChild(label);
        });
        
        // Y-axis label
        var yAxisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        yAxisLabel.setAttribute("x", 15);
        yAxisLabel.setAttribute("y", margin.top + plotHeight / 2);
        yAxisLabel.setAttribute("text-anchor", "middle");
        yAxisLabel.setAttribute("font-size", "11");
        yAxisLabel.setAttribute("fill", "#1a2744");
        yAxisLabel.setAttribute("font-weight", "600");
        yAxisLabel.setAttribute("transform", "rotate(-90, 15, " + (margin.top + plotHeight / 2) + ")");
        yAxisLabel.textContent = "Policy Similarity Index";
        svg.appendChild(yAxisLabel);
        
        // X-axis (years)
        years.forEach(function(year, idx) {
            var x = margin.left + (idx / (years.length - 1)) * plotWidth;
            
            // Tick line
            var tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
            tick.setAttribute("x1", x);
            tick.setAttribute("y1", margin.top + plotHeight);
            tick.setAttribute("x2", x);
            tick.setAttribute("y2", margin.top + plotHeight + 5);
            tick.setAttribute("stroke", "#7a8a9a");
            tick.setAttribute("stroke-width", "1");
            svg.appendChild(tick);
            
            // Label
            var label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("x", x);
            label.setAttribute("y", margin.top + plotHeight + 20);
            label.setAttribute("text-anchor", "middle");
            label.setAttribute("font-size", "11");
            label.setAttribute("fill", "#7a8a9a");
            label.setAttribute("font-weight", "600");
            label.textContent = year;
            svg.appendChild(label);
        });
        
        // X-axis label
        var xAxisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        xAxisLabel.setAttribute("x", margin.left + plotWidth / 2);
        xAxisLabel.setAttribute("y", height - 8);
        xAxisLabel.setAttribute("text-anchor", "middle");
        xAxisLabel.setAttribute("font-size", "11");
        xAxisLabel.setAttribute("fill", "#1a2744");
        xAxisLabel.setAttribute("font-weight", "600");
        xAxisLabel.textContent = "Year";
        svg.appendChild(xAxisLabel);
        
        // Draw lines and dots for each group
        activeConvergenceGroups.forEach(function(groupName) {
            var groupData = convergenceData[groupName];
            var color = convergenceGroupings[groupName].color;
            
            // Filter valid data points
            var validPoints = groupData.filter(function(d) { return d.similarity !== null; });
            if (validPoints.length < 2) return;
            
            // Create path
            var pathD = "";
            validPoints.forEach(function(d, idx) {
                var x = margin.left + ((d.year - 2019) / (2025 - 2019)) * plotWidth;
                var y = margin.top + plotHeight - (d.similarity / 100) * plotHeight;
                
                if (idx === 0) {
                    pathD += "M " + x + " " + y;
                } else {
                    pathD += " L " + x + " " + y;
                }
            });
            
            var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", pathD);
            path.setAttribute("class", "convergence-line");
            path.setAttribute("stroke", color);
            svg.appendChild(path);
            
            // Add dots
            validPoints.forEach(function(d) {
                var x = margin.left + ((d.year - 2019) / (2025 - 2019)) * plotWidth;
                var y = margin.top + plotHeight - (d.similarity / 100) * plotHeight;
                
                var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circle.setAttribute("cx", x);
                circle.setAttribute("cy", y);
                circle.setAttribute("r", 6);
                circle.setAttribute("fill", color);
                circle.setAttribute("class", "convergence-dot");
                
                circle.addEventListener("mouseenter", function(e) {
                    var tooltip = document.getElementById("convergence-tooltip");
                    tooltip.innerHTML = '<strong>' + groupName + '</strong><br>' +
                        'Year: ' + d.year + '<br>' +
                        'Similarity: ' + d.similarity.toFixed(1) + '%';
                    tooltip.classList.add("visible");
                });
                
                circle.addEventListener("mousemove", function(e) {
                    var tooltip = document.getElementById("convergence-tooltip");
                    tooltip.style.left = (e.clientX + 15) + "px";
                    tooltip.style.top = (e.clientY - 10) + "px";
                });
                
                circle.addEventListener("mouseleave", function() {
                    document.getElementById("convergence-tooltip").classList.remove("visible");
                });
                
                svg.appendChild(circle);
            });
        });
        
        // Render legend with trend indicators
        legendContainer.innerHTML = '';
        activeConvergenceGroups.forEach(function(groupName) {
            var groupData = convergenceData[groupName];
            var color = convergenceGroupings[groupName].color;
            
            var item = document.createElement("div");
            item.className = "convergence-legend-item";
            item.innerHTML = '<div class="convergence-legend-left">' +
                '<div class="convergence-legend-marker" style="background:' + color + '"></div>' +
                '<span class="convergence-legend-name">' + groupName + '</span>' +
                '</div>';
            legendContainer.appendChild(item);
        });
        
        // Render similarity bars (current year)
        similarityBars.innerHTML = '';
        activeConvergenceGroups.forEach(function(groupName) {
            var groupData = convergenceData[groupName];
            var color = convergenceGroupings[groupName].color;
            
            var lastPoint = groupData.filter(function(d) { return d.similarity !== null; }).slice(-1)[0];
            var currentSim = lastPoint ? lastPoint.similarity : 0;
            
            var row = document.createElement("div");
            row.className = "convergence-similarity-row";
            row.innerHTML = '<div class="convergence-similarity-name" style="color:' + color + '">' + groupName + '</div>' +
                '<div class="convergence-similarity-bar-bg">' +
                '<div class="convergence-similarity-bar-fill" style="width:' + currentSim + '%; background:' + color + '"></div>' +
                '</div>' +
                '<div class="convergence-similarity-value">' + currentSim.toFixed(0) + '%</div>';
            similarityBars.appendChild(row);
        });
    }
}

// ===== POLICY AREA FILTER =====
function initPolicyAreaFilter() {
    var dropdown = document.getElementById("policy-area-filter");
    if (!dropdown) return;
    
    dropdown.addEventListener("change", function() {
        var selectedArea = this.value;
        
        if (!selectedArea) {
            // If deselected and no other content showing, reset to placeholder
            if (currentContentType === "policyArea") {
                resetToPlaceholder();
            }
            return;
        }
        
        // Clear other selections
        document.getElementById("overview-dropdown").value = "";
        document.getElementById("keyword-search").value = "";
        selectedCountry = null;
        currentContentType = "policyArea";
        
        // Calculate countries with entries in this area
        var countriesWithArea = [];
        Object.keys(policyData).forEach(function(country) {
            var countryData = policyData[country];
            var areaData = countryData[selectedArea];
            if (areaData) {
                var total = (areaData.legal_directives || []).length +
                           (areaData.policy_documents || []).length +
                           (areaData.public_statements || []).length;
                if (total > 0) {
                    countriesWithArea.push({
                        country: country,
                        displayName: displayNames[country] || country,
                        count: total
                    });
                }
            }
        });
        
        // Sort by count descending
        countriesWithArea.sort(function(a, b) { return b.count - a.count; });
        
        // Set header
        var totalEntries = countriesWithArea.reduce(function(a, b) { return a + b.count; }, 0);
        setContentHeader(selectedArea, countriesWithArea.length + " countries • " + totalEntries + " entries", false, true);
        
        // Render country cards in main content area
        var content = document.getElementById("overview-content");
        var grid = document.createElement("div");
        grid.className = "content-country-grid";
        
        countriesWithArea.forEach(function(item) {
            var card = document.createElement("div");
            card.className = "content-country-card";
            card.innerHTML = '<div class="content-country-name">' + escapeHtml(item.displayName) + '</div>' +
                '<div class="content-country-meta">' +
                '<span class="content-count-badge">' + item.count + '</span>' +
                '<span class="content-arrow">→</span>' +
                '</div>';
            
            card.addEventListener("click", function() {
                openPolicyAreaSidePanel(item.country, selectedArea, item.count);
            });
            
            grid.appendChild(card);
        });
        
        content.innerHTML = "";
        content.appendChild(grid);
        
        // Clear map selection
        if (typeof d3 !== 'undefined') {
            d3.selectAll(".country-path").classed("selected", false);
        }
    });
}

// ===== SIDE PANEL =====
function openPolicyAreaSidePanel(country, policyArea, entryCount) {
    var overlay = document.getElementById("side-panel-overlay");
    var panel = document.getElementById("side-panel");
    var content = document.getElementById("side-panel-content");
    var title = document.getElementById("side-panel-title");
    var subtitle = document.getElementById("side-panel-subtitle");
    var viewCountryLink = document.getElementById("side-panel-view-country");
    
    // Set header info
    title.textContent = displayNames[country] || country;
    subtitle.textContent = getShortAreaName(policyArea) + " • " + entryCount + " entries";
    
    // Set up "View full country profile" link
    viewCountryLink.onclick = function() {
        closeSidePanel();
        document.getElementById("policy-area-filter").value = "";
        selectOverviewCountry(country);
    };
    
    // Populate entries
    content.innerHTML = "";
    var countryData = policyData[country];
    var areaData = countryData[policyArea];
    
    if (!areaData) {
        content.innerHTML = '<div class="side-panel-empty">No entries found.</div>';
        return;
    }
    
    var sourceTypes = [
        { key: "legal_directives", label: "Legal" },
        { key: "policy_documents", label: "Policy" },
        { key: "public_statements", label: "Statement" }
    ];
    
    sourceTypes.forEach(function(source) {
        var entries = areaData[source.key] || [];
        entries.forEach(function(entry) {
            var text = entry.text || "";
            var entryTitle = parseTitleWithoutDate(text);
            var url = extractUrl(text);
            var date = extractDate(text);
            
            var entryEl = document.createElement("div");
            entryEl.className = "side-panel-entry";
            
            var header = document.createElement("div");
            header.className = "side-panel-entry-header";
            header.innerHTML = 
                '<div class="side-panel-entry-expand"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M9 18l6-6-6-6"/></svg></div>' +
                '<div class="side-panel-entry-info">' +
                    '<div class="side-panel-entry-title">' + escapeHtml(entryTitle) + '</div>' +
                    '<div class="side-panel-entry-meta">' +
                        '<span class="side-panel-entry-type ' + source.label.toLowerCase() + '">' + source.label + '</span>' +
                        (date ? '<span>' + date + '</span>' : '') +
                    '</div>' +
                '</div>';
            
            header.addEventListener("click", function() {
                entryEl.classList.toggle("expanded");
            });
            
            entryEl.appendChild(header);
            
            // Description
            var desc = document.createElement("div");
            desc.className = "side-panel-entry-description";
            desc.textContent = text;
            if (url) {
                desc.innerHTML = escapeHtml(text) + '<div class="side-panel-entry-link"><a href="' + url + '" target="_blank">View source →</a></div>';
            }
            entryEl.appendChild(desc);
            
            content.appendChild(entryEl);
        });
    });
    
    // Show panel
    overlay.classList.add("active");
    panel.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeSidePanel() {
    var overlay = document.getElementById("side-panel-overlay");
    var panel = document.getElementById("side-panel");
    overlay.classList.remove("active");
    panel.classList.remove("active");
    document.body.style.overflow = "";
}

function initSidePanel() {
    var overlay = document.getElementById("side-panel-overlay");
    var closeBtn = document.getElementById("side-panel-close");
    
    if (overlay) {
        overlay.addEventListener("click", closeSidePanel);
    }
    
    if (closeBtn) {
        closeBtn.addEventListener("click", closeSidePanel);
    }
    
    // Close on Escape key
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
            closeSidePanel();
        }
    });
}

// ===== KEYWORD SEARCH =====
function initKeywordSearch() {
    var searchInput = document.getElementById("keyword-search");
    var searchBtn = document.getElementById("keyword-search-btn");
    
    if (!searchInput || !searchBtn) return;
    
    function performSearch() {
        var keyword = searchInput.value.trim().toLowerCase();
        if (keyword.length < 2) {
            alert("Please enter at least 2 characters to search.");
            return;
        }
        
        // Clear other selections
        document.getElementById("overview-dropdown").value = "";
        document.getElementById("policy-area-filter").value = "";
        selectedCountry = null;
        currentContentType = "keyword";
        
        // Search through all entries
        var results = {};
        var totalCount = 0;
        
        var POLICY_AREAS = [
            "LAWS Employment/Deployment",
            "Adoption & Intent of Use",
            "Acquisition & Procurement",
            "Ethical Guidelines & Restrictions",
            "Technical Safety & Security Requirements",
            "Int'l Cooperation & Interoperability"
        ];
        
        Object.keys(policyData).forEach(function(country) {
            var countryData = policyData[country];
            var countryMatches = [];
            
            POLICY_AREAS.forEach(function(area) {
                var areaData = countryData[area];
                if (!areaData) return;
                
                var sourceTypes = [
                    { key: "legal_directives", label: "Legal" },
                    { key: "policy_documents", label: "Policy" },
                    { key: "public_statements", label: "Statement" }
                ];
                
                sourceTypes.forEach(function(source) {
                    var entries = areaData[source.key] || [];
                    entries.forEach(function(entry) {
                        var text = entry.text || "";
                        if (text.toLowerCase().indexOf(keyword) !== -1) {
                            countryMatches.push({
                                area: area,
                                type: source.label,
                                text: text,
                                url: extractUrl(text)
                            });
                            totalCount++;
                        }
                    });
                });
            });
            
            if (countryMatches.length > 0) {
                results[country] = countryMatches;
            }
        });
        
        // Render results
        renderKeywordResults(keyword, results, totalCount);
        
        // Clear map selection
        if (typeof d3 !== 'undefined') {
            d3.selectAll(".country-path").classed("selected", false);
        }
    }
    
    searchBtn.addEventListener("click", performSearch);
    searchInput.addEventListener("keypress", function(e) {
        if (e.key === "Enter") performSearch();
    });
}

function renderKeywordResults(keyword, results, totalCount) {
    var content = document.getElementById("overview-content");
    var countryCount = Object.keys(results).length;
    
    // Set header
    setContentHeader(
        'Results for "' + keyword + '"',
        totalCount + " entries across " + countryCount + " countries",
        false,
        true
    );
    
    content.innerHTML = "";
    
    if (countryCount === 0) {
        content.innerHTML = '<div class="placeholder"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg><p>No entries found matching "' + escapeHtml(keyword) + '"</p></div>';
        return;
    }
    
    var resultsContainer = document.createElement("div");
    resultsContainer.className = "content-keyword-results";
    
    // Sort countries by match count
    var sortedCountries = Object.keys(results).sort(function(a, b) {
        return results[b].length - results[a].length;
    });
    
    sortedCountries.forEach(function(country) {
        var matches = results[country];
        var countryName = displayNames[country] || country;
        
        var group = document.createElement("div");
        group.className = "keyword-country-group";
        
        // Country header
        var header = document.createElement("div");
        header.className = "keyword-country-header";
        header.innerHTML = '<span class="keyword-country-name">' + escapeHtml(countryName) + '</span>' +
            '<span class="keyword-country-count">' + matches.length + ' match' + (matches.length > 1 ? 'es' : '') + '</span>';
        header.addEventListener("click", function() {
            document.getElementById("keyword-search").value = "";
            selectOverviewCountry(country);
        });
        group.appendChild(header);
        
        // Entry list
        var entryList = document.createElement("div");
        entryList.className = "keyword-entry-list";
        
        matches.forEach(function(match, idx) {
            var entry = document.createElement("div");
            entry.className = "keyword-entry";
            
            // Parse title from text
            var title = parseTitleWithoutDate(match.text);
            var highlightedTitle = highlightKeyword(title, keyword);
            var highlightedDesc = highlightKeyword(match.text, keyword);
            
            // Entry header (clickable to expand)
            var entryHeader = document.createElement("div");
            entryHeader.className = "keyword-entry-header";
            entryHeader.innerHTML = 
                '<div class="keyword-entry-expand"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M9 18l6-6-6-6"/></svg></div>' +
                '<div class="keyword-entry-info">' +
                    '<div class="keyword-entry-title">' + highlightedTitle + '</div>' +
                    '<div class="keyword-entry-meta">' +
                        '<span class="keyword-entry-type ' + match.type.toLowerCase() + '">' + match.type + '</span>' +
                        '<span>' + getShortAreaName(match.area) + '</span>' +
                    '</div>' +
                '</div>';
            
            entryHeader.addEventListener("click", function(e) {
                entry.classList.toggle("expanded");
            });
            
            entry.appendChild(entryHeader);
            
            // Description (hidden by default)
            var desc = document.createElement("div");
            desc.className = "keyword-entry-description";
            desc.innerHTML = highlightedDesc;
            if (match.url) {
                desc.innerHTML += '<div class="keyword-entry-link"><a href="' + match.url + '" target="_blank">View source →</a></div>';
            }
            entry.appendChild(desc);
            
            entryList.appendChild(entry);
        });
        
        group.appendChild(entryList);
        resultsContainer.appendChild(group);
    });
    
    content.appendChild(resultsContainer);
}

function highlightKeyword(text, keyword) {
    var regex = new RegExp("(" + keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ")", "gi");
    return escapeHtml(text).replace(regex, "<mark>$1</mark>");
}

function getShortAreaName(area) {
    var shortNames = {
        "LAWS Employment/Deployment": "LAWS",
        "Adoption & Intent of Use": "Adoption",
        "Ethical Guidelines & Restrictions": "Ethics",
        "Technical Safety & Security Requirements": "Tech Safety",
        "Acquisition & Procurement": "Acquisition",
        "Int'l Cooperation & Interoperability": "Int'l Coop"
    };
    return shortNames[area] || area;
}

// ===== DOWNLOAD FUNCTIONS =====
function downloadFullCSV() {
    var csvRows = [];
    var headers = ["Country", "Policy Area", "Source Type", "Title", "Date", "Description", "URL"];
    csvRows.push(headers.join(","));
    
    Object.keys(policyData).forEach(function(country) {
        var countryData = policyData[country];
        Object.keys(countryData).forEach(function(area) {
            var areaData = countryData[area];
            
            var sourceTypes = [
                { key: "legal_directives", label: "Legal Directive" },
                { key: "policy_documents", label: "Policy Document" },
                { key: "public_statements", label: "Public Statement" }
            ];
            
            sourceTypes.forEach(function(st) {
                if (areaData[st.key]) {
                    areaData[st.key].forEach(function(entry) {
                        var text = entry.text || "";
                        var url = entry.url || extractUrl(text) || "";
                        var title = parseTitleWithoutDate(text);
                        var date = extractDate(text) || "";
                        var description = text.split("\n").slice(1).join(" ").trim().substring(0, 500);
                        
                        var row = [
                            '"' + (displayNames[country] || country).replace(/"/g, '""') + '"',
                            '"' + area.replace(/"/g, '""') + '"',
                            '"' + st.label + '"',
                            '"' + title.replace(/"/g, '""') + '"',
                            '"' + date + '"',
                            '"' + description.replace(/"/g, '""') + '"',
                            '"' + url + '"'
                        ];
                        csvRows.push(row.join(","));
                    });
                }
            });
        });
    });
    
    var csvContent = csvRows.join("\n");
    var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "global_defense_ai_policy_database.csv";
    link.click();
}
