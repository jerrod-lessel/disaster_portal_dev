// map.js - full version with Landslide Raster querying added

// Initialize the map
var map = L.map('map').setView([37.5, -119.5], 6);
// Force map to resize/repaint once fully loaded
setTimeout(() => {
  map.invalidateSize();
}, 200);

// Base Layer
var baseOSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Marker for clicked location
var clickMarker = null;

// Variables
let landslideRaster = null;

proj4.defs("EPSG:3310", "+proj=aea +lat_1=34 +lat_2=40.5 +lat_0=0 +lon_0=-120 +x_0=0 +y_0=-4000000 +datum=NAD83 +units=m +no_defs");

// About Button
document.getElementById('about-toggle').addEventListener('click', function () {
  document.getElementById('about-panel').classList.toggle('hidden');
});

function showSpinner() {
  document.getElementById("loading-spinner").classList.remove("hidden");
}
function hideSpinner() {
  document.getElementById("loading-spinner").classList.add("hidden");
}

// --- Layers ---

// Dynamic Landslide Layer (visual only)
var landslideLayer = L.esri.dynamicMapLayer({
  url: 'https://gis.conservation.ca.gov/server/rest/services/CGS/MS58_LandslideSusceptibility_Classes/MapServer',
  opacity: 0.6
})//.addTo(map);

// Fire Hazard Layer
var fireHazardLayer = L.esri.featureLayer({
  url: 'https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/FHSZ_SRA_LRA_Combined/FeatureServer/0',
  attribution: 'CAL FIRE',
  style: function (feature) {
    const hazard = feature.properties.FHSZ_Description;
    let color = "#ffffff";
    if (hazard === "Very High") color = "#d7191c";
    else if (hazard === "High") color = "#fdae61";
    else if (hazard === "Moderate") color = "#ffffbf";
    return { color, weight: 1, fillOpacity: 0.4 };
  }
})//.addTo(map);

// Flood Hazard Layer
var floodLayer = L.esri.featureLayer({
  url: 'https://services2.arcgis.com/Uq9r85Potqm3MfRV/ArcGIS/rest/services/S_FLD_HAZ_AR_Reduced_Set_CA_wm/FeatureServer/0',
  style: function (feature) {
    const zone = feature.properties.ESRI_SYMBOLOGY;
    const colorMap = {
      "1% Annual Chance Flood Hazard": "#f03b20",
      "0.2% Annual Chance Flood Hazard": "#feb24c",
      "Regulatory Floodway": "#769ccd",
      "Area with Reduced Risk Due to Levee": "#e5d099"
    };
    return {
      color: colorMap[zone] || "#cccccc",
      weight: 0.5,
      fillOpacity: 0.6
    };
  }
})//.addTo(map);

// CalEnviroScreen Ozone Layer
var ozoneLayer = L.esri.featureLayer({
  url: "https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/CalEnviroScreen_4_0_Results_/FeatureServer/0",
  where: "ozoneP IS NOT NULL",
  attribution: 'OEHHA - CalEnviroScreen 4.0',
  style: function (feature) {
    const percentile = feature.properties.ozoneP;
    let color = "#ffffcc"; // default light yellow

    if (percentile >= 90) color = "#08306b";
    else if (percentile >= 80) color = "#08519c";
    else if (percentile >= 70) color = "#2171b5";
    else if (percentile >= 60) color = "#4292c6";
    else if (percentile >= 50) color = "#6baed6";
    else if (percentile >= 40) color = "#9ecae1";
    else if (percentile >= 30) color = "#c6dbef";
    else if (percentile >= 20) color = "#deebf7";
    else if (percentile >= 10) color = "#f7fbff";
    else color = "#ffffcc"; // 0-10%

    return { color: color, weight: 0.5, fillOpacity: 0.6 };
  }
})//.addTo(map);

// CalEnviroScreen PM2.5 Layer
var pmLayer = L.esri.featureLayer({
  url: "https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/CalEnviroScreen_4_0_Results_/FeatureServer/0",
  where: "pmP IS NOT NULL",
  attribution: 'OEHHA - CalEnviroScreen 4.0',
  style: function (feature) {
    const percentile = feature.properties.pmP;
    let color = "#ffffcc"; // lightest

    if (percentile >= 90) color = "#08306b";
    else if (percentile >= 80) color = "#08519c";
    else if (percentile >= 70) color = "#2171b5";
    else if (percentile >= 60) color = "#4292c6";
    else if (percentile >= 50) color = "#6baed6";
    else if (percentile >= 40) color = "#9ecae1";
    else if (percentile >= 30) color = "#c6dbef";
    else if (percentile >= 20) color = "#deebf7";
    else if (percentile >= 10) color = "#f7fbff";
    else color = "#ffffcc";

    return { color: color, weight: 0.5, fillOpacity: 0.6 };
  }
})//.addTo(map);

// CalEnviroScreen Drinking Water Contaminant Percentile Layer
var drinkP_Layer = L.esri.featureLayer({
  url: "https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/CalEnviroScreen_4_0_Results_/FeatureServer/0",
  where: "drinkP IS NOT NULL",
  attribution: 'OEHHA - CalEnviroScreen 4.0',
  style: function (feature) {
    const percentile = feature.properties.drinkP;
    let color = "#ffffcc"; // Default dull yellow

    if (percentile >= 90) color = "#08306b";
    else if (percentile >= 80) color = "#08519c";
    else if (percentile >= 70) color = "#2171b5";
    else if (percentile >= 60) color = "#4292c6";
    else if (percentile >= 50) color = "#6baed6";
    else if (percentile >= 40) color = "#9ecae1";
    else if (percentile >= 30) color = "#c6dbef";
    else if (percentile >= 20) color = "#deebf7";
    else if (percentile >= 10) color = "#f7fbff";
    else color = "#ffffcc";

    return { color: color, weight: 0.5, fillOpacity: 0.6 };
  }
})//.addTo(map);

// Earthquake Shaking Potential Layer (visual only)
var shakingLayer = L.esri.dynamicMapLayer({
  url: 'https://gis.conservation.ca.gov/server/rest/services/CGS/MS48_ShakingPotential/MapServer',
  opacity: 0.6
})//.addTo(map);

// Caltrans National Highway System (visible at zoom <= 10)
var highwayLayer = L.esri.featureLayer({
  url: 'https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHhighway/National_Highway_System/MapServer/0',
  style: function () {
    return { color: '#242424', weight: 3 };
  }
})//.addTo(map);

// Caltrans All Roads (visible at zoom >= 11)
var allRoadsLayer = L.esri.featureLayer({
  url: 'https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHhighway/All_Roads/MapServer/0',
  style: function () {
    return { color: '#5c5c5c', weight: 1 };
  }
})//.addTo(map);

// Road layer level zoom logic
map.on('zoomend', function() {
  var zoom = map.getZoom();
  if (zoom <= 10) {
    if (map.hasLayer(allRoadsLayer)) map.removeLayer(allRoadsLayer);
    if (!map.hasLayer(highwayLayer)) map.addLayer(highwayLayer);
  } else {
    if (!map.hasLayer(allRoadsLayer)) map.addLayer(allRoadsLayer);
    if (!map.hasLayer(highwayLayer)) map.removeLayer(highwayLayer);
  }
});

// --- Controls ---

// Layer Control
L.control.layers({ "OpenStreetMap": baseOSM }, {
  "Highway System": highwayLayer,
  "All Roads": allRoadsLayer,
  "Landslide Susceptibility": landslideLayer,
  "Fire Hazard Zones": fireHazardLayer,
  "Flood Hazard Zones": floodLayer,
  "Shaking Potential": shakingLayer,
  "Ozone Percentiles": ozoneLayer,
  "PM2.5 Concentration": pmLayer,
  "Water Contaminant Percentile": drinkP_Layer,
}).addTo(map);

// Scale Bar
L.control.scale({ imperial: true }).addTo(map);

// Home Button
var homeButton = L.control({ position: 'topleft' });
homeButton.onAdd = function(map) {
  var button = L.DomUtil.create('button', 'home-button');
  button.innerHTML = '🏠';
  button.title = 'Reset View';
  button.onclick = function () {
    map.setView([37.5, -119.5], 6);
  };
  L.DomEvent.disableClickPropagation(button);
  return button;
};
homeButton.addTo(map);

// Legend Toggle
var legendToggle = L.control({ position: 'topright' });
legendToggle.onAdd = () => {
  var div = L.DomUtil.create('div', 'map-widget leaflet-control leaflet-bar');
  div.innerHTML = `<a href="#" id="legend-toggle" title="Show/Hide Legend">🗺️</a>`;
  L.DomEvent.disableClickPropagation(div);
  return div;
};
legendToggle.addTo(map);

var legendPanel = L.control({ position: 'topright' });
legendPanel.onAdd = () => {
  var div = L.DomUtil.create('div', 'legend-panel hidden');
  div.innerHTML = `
    <h4>Legends</h4>
    <div class="legend-section">
      <strong>Fire Hazard Zones</strong>
      <div><i style="background:#d7191c;"></i> Very High</div>
      <div><i style="background:#fdae61;"></i> High</div>
      <div><i style="background:#ffffbf;"></i> Moderate</div>
    </div>
    <div class="legend-section">
      <strong>Flood Zones</strong>
      <div><i style="background:#f03b20;"></i> 1% Annual Chance Flood Hazard</div>
      <div><i style="background:#feb24c;"></i> 0.2% Annual Chance Flood Hazard</div>
      <div><i style="background:#e5d099;"></i> Area with Reduced Risk Due to Levee</div>
      <div><i style="background:#769ccd;"></i> Regulatory Floodway</div>
    </div>
    <div class="legend-section">
      <strong>Ozone Percentile</strong>
      <div><i style="background:#08306b;"></i> 90–100</div>
      <div><i style="background:#08519c;"></i> 80–89</div>
      <div><i style="background:#2171b5;"></i> 70–79</div>
      <div><i style="background:#4292c6;"></i> 60–69</div>
      <div><i style="background:#6baed6;"></i> 50–59</div>
      <div><i style="background:#9ecae1;"></i> 40–49</div>
      <div><i style="background:#c6dbef;"></i> 30–39</div>
      <div><i style="background:#deebf7;"></i> 20–29</div>
      <div><i style="background:#f7fbff;"></i> 10–19</div>
      <div><i style="background:#ffffcc;"></i> 0–9</div>
    </div>
    <div class="legend-section">
      <strong>PM2.5 Percentile</strong>
      <div><i style="background:#08306b;"></i> 90–100</div>
      <div><i style="background:#08519c;"></i> 80–89</div>
      <div><i style="background:#2171b5;"></i> 70–79</div>
      <div><i style="background:#4292c6;"></i> 60–69</div>
      <div><i style="background:#6baed6;"></i> 50–59</div>
      <div><i style="background:#9ecae1;"></i> 40–49</div>
      <div><i style="background:#c6dbef;"></i> 30–39</div>
      <div><i style="background:#deebf7;"></i> 20–29</div>
      <div><i style="background:#f7fbff;"></i> 10–19</div>
      <div><i style="background:#ffffcc;"></i> 0–9</div>
    </div>
        <div class="legend-section">
      <strong>Drinking Water Contaminant Percentile</strong>
      <div><i style="background:#08306b;"></i> 90–100</div>
      <div><i style="background:#08519c;"></i> 80–89</div>
      <div><i style="background:#2171b5;"></i> 70–79</div>
      <div><i style="background:#4292c6;"></i> 60–69</div>
      <div><i style="background:#6baed6;"></i> 50–59</div>
      <div><i style="background:#9ecae1;"></i> 40–49</div>
      <div><i style="background:#c6dbef;"></i> 30–39</div>
      <div><i style="background:#deebf7;"></i> 20–29</div>
      <div><i style="background:#f7fbff;"></i> 10–19</div>
      <div><i style="background:#ffffcc;"></i> 0–9</div>
    </div>
    <div class="legend-section">
      <strong>Landslide Susceptibility</strong>
      <div><i style="background:#9a1e13;"></i> X</div>
      <div><i style="background:#d32d1f;"></i> IX</div>
      <div><i style="background:#ec622b;"></i> VIII</div>
      <div><i style="background:#db9b36;"></i> VII</div>
      <div><i style="background:#f3ae3d;"></i> VI</div>
      <div><i style="background:#f8d58b;"></i> V</div>
      <div><i style="background:#ffffc5;"></i> III</div>
    </div>
    <div class="legend-section">
      <strong>Earthquake Shaking Potential</strong>
      <div><i style="background:rgb(56,168,0);"></i> < 0.4</div>
      <div><i style="background:rgb(176,224,0);"></i> 0.4-0.8</div>
      <div><i style="background:rgb(255,225,0);"></i> 0.8-1.2</div>
      <div><i style="background:rgb(255,115,0);"></i> 1.2-1.6</div>
      <div><i style="background:rgb(255,0,0);"></i> 1.6-2.0</div>
      <div><i style="background:rgb(255,0,119);"></i> 2.0-2.2</div>
      <div><i style="background:rgb(255,54,201);"></i> 2.2-2.4</div>
      <div><i style="background:rgb(255,148,221);"></i> 2.4-2.5</div>
      <div><i style="background:rgb(255,191,233);"></i> >2.5</div>
    </div>`;
  return div;
};
legendPanel.addTo(map);

// Legend Scroll Wheel Fix
document.addEventListener('DOMContentLoaded', function () {
  const legendPanel = document.querySelector('.legend-panel');
  if (legendPanel) {
    legendPanel.addEventListener('mouseenter', function () { map.scrollWheelZoom.disable(); });
    legendPanel.addEventListener('mouseleave', function () { map.scrollWheelZoom.enable(); });
  }
  document.getElementById('legend-toggle').addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector('.legend-panel').classList.toggle('hidden');
  });
});

// Helper to calculate distance to polygon edge
function getDistanceToPolygonEdge(clickLatLng, feature) {
  const point = turf.point([clickLatLng.lng, clickLatLng.lat]);
  const geom = feature.geometry;
  let line;
  if (geom.type === "Polygon") line = turf.polygonToLine(turf.polygon(geom.coordinates));
  else if (geom.type === "MultiPolygon") line = turf.polygonToLine(turf.multiPolygon(geom.coordinates));
  else return NaN;
  const nearestPoint = turf.nearestPointOnLine(line, point);
  const distance = turf.distance(point, nearestPoint, { units: 'miles' });
  return distance.toFixed(2);
}

// Generalized nearest feature query
function getClosestFeatureByEdgeDistance(layer, clickLatLng, label, fieldName, results, finishCallback) {
  layer.query().nearby(clickLatLng, 80467).run(function (err, fc) {
    if (!err && fc.features.length > 0) {
      let minDist = Infinity;
      let bestFeature = null;
      fc.features.forEach(feature => {
        const dist = parseFloat(getDistanceToPolygonEdge(clickLatLng, feature));
        if (!isNaN(dist) && dist < minDist) {
          minDist = dist;
          bestFeature = feature;
        }
      });
      if (bestFeature) {
        results.push(`✅ <strong>Nearest ${label}:</strong> ${bestFeature.properties[fieldName]}<br>📏 Distance: ${minDist} mi`);
      } else {
        results.push(`❌ <strong>${label}:</strong> Unable to measure distance`);
      }
    } else {
      results.push(`❌ <strong>${label}:</strong> No nearby zones`);
    }
    finishCallback();
  });
}

// --- Click Event Logic ---
map.on("click", function (e) {
  showSpinner();
  if (clickMarker) map.removeLayer(clickMarker);
  clickMarker = L.marker(e.latlng).addTo(map);

  const lat = e.latlng.lat;
  const lng = e.latlng.lng;
  document.getElementById("report-content").innerHTML = `<strong>Location:</strong><br>Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}<br><em>Loading hazard information...</em>`;

  const results = [];
  let completed = 0;

  function checkDone() {
    completed++;
    if (completed === 5) {
      results.push("🪨 <strong>Landslide Susceptibility:</strong> Visual only");
      results.push("💥 <strong>Shaking Potential:</strong> Visual only");
      document.getElementById("report-content").innerHTML = results.join("<br><br>");
      hideSpinner();
    }
  }

  fireHazardLayer.query().contains(e.latlng).run(function (err, fc) {
  if (!err && fc.features.length > 0) {
    const zone = fc.features[0].properties.FHSZ_Description;
    results.push(`🔥 <strong>Fire Hazard Zone:</strong><br>
This area falls within a <strong>${zone}</strong> fire hazard zone as defined by the California Department of Forestry and Fire Protection (CAL FIRE).<br>
Fire hazard zones reflect the severity of potential fire exposure based on fuels, terrain, weather, and other factors.`);
    checkDone();
  } else {
    getClosestFeatureByEdgeDistance(fireHazardLayer, e.latlng, "Fire Hazard Zone", "FHSZ_Description", results, function () {
      results.push(`🔥 <em>Note:</em> Fire hazard zones are designated by CAL FIRE to help guide planning and mitigation efforts in wildfire-prone regions.`);
      checkDone();
    });
  }
});

  floodLayer.query().contains(e.latlng).run(function (err, fc) {
  if (!err && fc.features.length > 0) {
    const zone = fc.features[0].properties.ESRI_SYMBOLOGY;
    results.push(`🌊 <strong>Flood Hazard Zone:</strong><br>
This location falls within a <strong>${zone}</strong> as designated by FEMA's National Flood Hazard Layer.<br>
Flood zones represent areas at varying levels of flood risk during extreme weather events and are used to inform insurance, development, and evacuation planning.`);
    checkDone();
  } else {
    getClosestFeatureByEdgeDistance(floodLayer, e.latlng, "Flood Hazard Zone", "ESRI_SYMBOLOGY", results, function () {
      results.push(`🌊 <em>Note:</em> FEMA flood zones help identify areas at high risk for flooding and guide floodplain management decisions across California.`);
      checkDone();
    });
  }
});


  ozoneLayer.query().contains(e.latlng).run(function (err, fc) {
  if (!err && fc.features.length > 0) {
    const props = fc.features[0].properties;
    const ppm = props.ozone?.toFixed(3) ?? "unknown";
    const pct = props.ozoneP !== undefined ? Math.round(props.ozoneP) : "unknown";
    results.push(`☁️ <strong>Ozone (Ground-Level):</strong><br>
The indicator is the mean of summer months (May – October) of the daily maximum 8-hour ozone concentration (ppm). This measurement is used to represent short-term ozone health impacts. This census tract has a summed concentration of <strong>${ppm} ppm</strong>.
The ozone percentile for this census tract is <strong>${pct}</strong>, meaning the summed concentration is higher than ${pct}% of the census tracts in California.<br>
(Data from 2017 to 2019)`);

    checkDone();
  } else {
    getClosestFeatureByEdgeDistance(
      ozoneLayer,
      e.latlng,
      "Ozone Level",
      "ozoneP",
      results,
      checkDone
    );
  }
});

pmLayer.query().contains(e.latlng).run(function (err, fc) {
  if (!err && fc.features.length > 0) {
    const props = fc.features[0].properties;
    const value = props.pm?.toFixed(2) ?? "unknown";
    const pct = props.pmP !== undefined ? Math.round(props.pmP) : "unknown";
    results.push(`🌫️ <strong>PM2.5 (Fine Particulate Matter) Concentration:</strong><br>
This census tract has a concentration of <strong>${value} µg/m³</strong>. The PM2.5 percentile for this census tract is <strong>${pct}</strong>, meaning it is higher than ${pct}% of the census tracts in California.<br>
(Data from 2015 to 2017)`);
    checkDone();
  } else {
    getClosestFeatureByEdgeDistance(
      pmLayer,
      e.latlng,
      "PM2.5 Concentration",
      "pmP",
      results,
      checkDone
    );
  }
});

drinkP_Layer.query().contains(e.latlng).run(function (err, fc) {
  if (!err && fc.features.length > 0) {
    const props = fc.features[0].properties;
    const value = props.drink?.toFixed(2) ?? "unknown";
    const pct = props.drinkP !== undefined ? Math.round(props.drinkP) : "unknown";
    results.push(`🚰 <strong>Drinking Water Contaminants:</strong><br>
The drinking water contaminant score for this census tract is <strong>${value}</strong>, which is the sum of the contaminant and violation percentiles.
The drinking water contaminant percentile is <strong>${pct}</strong>, meaning it is higher than ${pct}% of census tracts in California.<br>
(Data from 2011–2019, the most recent complete compliance cycle.)`);

    checkDone();
  } else {
    getClosestFeatureByEdgeDistance(
      drinkP_Layer,
      e.latlng,
      "Drinking Water Contaminant Score",
      "drinkP",
      results,
      checkDone
    );
  }
});

}); 
