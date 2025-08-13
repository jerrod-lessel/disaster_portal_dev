 // map.js - full version 

// Initialize the map
var map = L.map('map').setView([37.5, -119.5], 6);
// Force map to resize/repaint once fully loaded
setTimeout(() => {
  map.invalidateSize();
}, 200);

// Base Layer Options
var baseOSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);
const esriSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri'
});
const cartoLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; Carto'
});
const cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; Carto'
});

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

// --- Live Wildfire Incidents Layer (VERIFIED Public Source from NIFC) ---
var calFireLayer = L.esri.featureLayer({
  url: 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0',
  where: "POOState = 'US-CA'",
  attribution: 'National Interagency Fire Center',
 
 pointToLayer: function (geojson, latlng) {
  const props = geojson.properties;
  const acres = props.IncidentSize || 0;
  
  // Define our size categories, including the CSS class name
  let iconDetails = {
    size: 30,
    className: 'fire-icon fire-icon-sm' // Default for small fires
  };

  if (acres >= 10000) {
    iconDetails = { size: 60, className: 'fire-icon fire-icon-xl' }; // Major
  } else if (acres >= 1000) {
    iconDetails = { size: 50, className: 'fire-icon fire-icon-lg' }; // Large
  } else if (acres >= 100) {
    iconDetails = { size: 40, className: 'fire-icon fire-icon-md' }; // Medium
  }

  return L.marker(latlng, {
    icon: L.divIcon({
      html: "🔥",
      className: iconDetails.className, // Use the dynamic class name
      iconSize: L.point(iconDetails.size, iconDetails.size), // Use the dynamic container size
      // THIS IS THE KEY: It keeps the icon centered on the point
      iconAnchor: [iconDetails.size / 2, iconDetails.size / 2]
    })
  });
},

  onEachFeature: function(feature, layer) {
    // console.log("Fire Properties:", feature.properties); // Use for finding property names
    const props = feature.properties;
    const cause = props.FireCause || 'Undetermined';
    const acres = (props.IncidentSize && props.IncidentSize > 0) ? Math.round(props.IncidentSize).toLocaleString() : 'N/A';
    const contained = props.PercentContained ?? 0; // The name for Percent Contained
    const updated = new Date(props.ModifiedOnDateTime_dt).toLocaleString(); // The name for Last Updated
    const discovered = new Date(props.FireDiscoveryDateTime).toLocaleDateString(); // This one was already working
  
    // Build the new, more detailed popup content
    const popupContent = `
      <strong>${props.IncidentName || 'Unknown Fire'}</strong><hr>
      <strong>Acres Burned:</strong> ${acres}<br>
      <strong>Percent Contained:</strong> ${contained}%<br>
      <strong>Cause:</strong> ${cause}<br> 
      <strong>Discovered:</strong> ${discovered}<br>
      <strong>Last Updated:</strong> ${updated}
    `;

    layer.bindPopup(popupContent);
  }
});

// Caltrans National Highway System (visible at zoom <= 10)
var highwayLayer = L.esri.featureLayer({
  url: 'https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHhighway/National_Highway_System/MapServer/0',
  attribution: 'Caltrans',
  style: function () {
    return { color: '#3c3c3c', weight: 3 };
  }
})//.addTo(map);

// Caltrans All Roads (visible at zoom >= 11)
var allRoadsLayer = L.esri.featureLayer({
  url: 'https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHhighway/All_Roads/MapServer/0',
  attribution: 'Caltrans/DRISI',
  style: function () {
    return { color: '#5c5c5c', weight: 1 };
  }
})//.addTo(map);

// Public schools 
var schoolsLayer = L.esri.featureLayer({
  url: 'https://services3.arcgis.com/fdvHcZVgB2QSRNkL/arcgis/rest/services/SchoolSites2324/FeatureServer/0',
  attribution: 'California Department of Education',
  pointToLayer: function (geojson, latlng) {
    return L.marker(latlng, {
    icon: L.divIcon({
      html: "🏫",
      className: "school-icon",
      iconSize: L.point(30, 30),
      })
    });
  },
  onEachFeature: function (feature, layer) {
    var name = feature.properties.SchoolName || "Unknown School";
    var district = feature.properties.DistrictName || "Unknown District";
    var props = feature.properties;
    var name = props.SchoolName || "Unknown School";
    var district = props.DistrictName || "Unknown District";
    var type = props.SchoolType || "N/A";
    var charter = props.Charter === "Y" ? "Yes" : (props.Charter === "N" ? "No" : "N/A");
    var magnet = props.Magnet === "Y" ? "Yes" : (props.Magnet === "N" ? "No" : "N/A");
    var enroll = props.EnrollTotal !== null ? props.EnrollTotal : "N/A";
    layer.bindPopup(`
    <strong>PUBLIC SCHOOL</strong><br>
    Name: ${name}<br>
    District: ${district}<br>
    Type: ${type}<br>
    Charter: ${charter}<br>
    Magnet: ${magnet}<br>
    Enrollment: ${enroll}
  `);
  }
});

// Hospitals and health centers
var healthCentLayer = L.esri.featureLayer({
  url: 'https://services5.arcgis.com/fMBfBrOnc6OOzh7V/arcgis/rest/services/facilitylist/FeatureServer/0',
  attribution: 'California Office of Statewide Health Planning and Development',
  pointToLayer: function (geojson, latlng) {
    return L.marker(latlng, {
    icon: L.divIcon({
      html: "🏥",
      className: "healthCent-icon",
      iconSize: L.point(30, 30),
      })
    });
  },
  onEachFeature: function (feature, layer) {
    var props = feature.properties;
    var name = props.FacilityName || "Unknown Facility";
    var status = props.FacilityStatus || "Unknown Status";
    var type = props.LicenseType || "N/A";
    layer.bindPopup(`
    <strong>HOSPITAL/HEALTH CENTER</strong><br>
    Name: ${name}<br>
    Status: ${status}<br>
    Type: ${type}<br>
  `);
  }
});

// Public airports
var pubAirport = L.esri.featureLayer({
  url: 'https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHaviation/Public_Airport/FeatureServer/0',
  attribution: 'California Office of Statewide Health Planning and Development',
  pointToLayer: function (geojson, latlng) {
    return L.marker(latlng, {
    icon: L.divIcon({
      html: "✈️",
      className: "airport-icon",
      iconSize: L.point(30, 30),
      })
    });
  },
  onEachFeature: function (feature, layer) {
    var props = feature.properties;
    var name = props.FACILITY || "Unknown Facility";
    var classType = props.FNCTNLCLSS || "Unknown Class";
    var ID = props.AIRPORTID || "N/A";
    layer.bindPopup(`
    <strong>PUBLIC AIRPORTS</strong><br>
    Name: ${name}<br>
    Class: ${classType}<br>
    Airport ID: ${ID}<br>
  `);
  }
});

// Power plants
var powerPlants = L.esri.featureLayer({
  url: 'https://services3.arcgis.com/bWPjFyq029ChCGur/arcgis/rest/services/Power_Plant/FeatureServer/0',
  attribution: 'California Energy Commission',
  pointToLayer: function (geojson, latlng) {
    return L.marker(latlng, {
    icon: L.divIcon({
      html: "⚡",
      className: "power-icon",
      iconSize: L.point(30, 30),
      })
    });
  },
  onEachFeature: function (feature, layer) {
    var props = feature.properties;
    var name = props.PlantName || "Unknown Facility";
    var nrgSource = props.PriEnergySource || "Unknown Energy Source";
    var cap = props.Capacity_Latest || "Unknown Capacity";
    layer.bindPopup(`
    <strong>POWER PLANT</strong><br>
    Name: ${name}<br>
    Primary Energy Source: ${nrgSource}<br>
    Capacity (MW): ${cap}<br>
  `);
  }
});

// OpenChargeMap EV Chargers
const evChargersLayer = L.layerGroup(); // Create a simple layer group
const OCM_API_KEY = '166f53f4-5ccd-4fae-92fe-e03a24423a7b';
const OCM_ATTRIBUTION = '<a href="https://openchargemap.org/site">OpenChargeMap</a>';

let isLoadingChargers = false;

function getChargersInView() {
    if (isLoadingChargers) return;
    isLoadingChargers = true;
 
    const bounds = map.getBounds();
    const ocmUrl = `https://api.openchargemap.io/v3/poi/?output=json&boundingbox=(${bounds.getSouthWest().lat},${bounds.getSouthWest().lng}),(${bounds.getNorthEast().lat},${bounds.getNorthEast().lng})&maxresults=5000&key=${OCM_API_KEY}`;
    
    fetch(ocmUrl)
        .then(response => response.json())
        .then(data => {
            evChargersLayer.clearLayers();

            data.forEach(charger => {
                if (charger.AddressInfo && charger.AddressInfo.Latitude && charger.AddressInfo.Longitude) {

                    let totalPorts = 0;
                    if (charger.Connections && charger.Connections.length > 0) {
                        // Loop through each connection type at the location
                        charger.Connections.forEach(connection => {
                            // Add the quantity of each connection type to the total. Default to 1 if quantity isn't specified.
                            totalPorts += connection.Quantity || 1; 
                        });
                    }

                    const status = charger.StatusType?.Title ?? 'Unknown Status';
                    const usage = charger.UsageType?.Title ?? 'Usage details not specified';
                    const network = charger.OperatorInfo?.Title ?? 'Unknown Network';
                    
                    let equipmentInfo = '<li>No equipment details</li>';
                    if (charger.Connections && charger.Connections.length > 0) {
                        equipmentInfo = charger.Connections.map(conn => `
                            <li>
                                <strong>${conn.ConnectionType?.Title ?? 'Connector'} (${conn.Quantity || 1})</strong>: 
                                <br> ${conn.PowerKW ?? 'N/A'} kW <br> ${conn.Voltage ?? 'N/A'} V <br> ${conn.Amps ?? 'N/A'} A <br> (${conn.Level?.Title ?? 'Level info unavailable'})
                            </li>
                        `).join('');
                    }

                    const marker = L.marker([charger.AddressInfo.Latitude, charger.AddressInfo.Longitude], {
                        icon: L.divIcon({ html: "🔋", className: "evcharger-icon", iconSize: L.point(30, 30) })
                    });

                    // Build the popup using the new 'totalPorts' variable
                    const popupContent = `
                        <strong>${charger.AddressInfo.Title}</strong><br>
                        <hr>
                        <strong>Status:</strong> ${status} (${usage})<br>
                        <strong>Network:</strong> ${network}<br>
                        <strong>Total Charging Ports:</strong> ${totalPorts}<br>
                        <br>
                        <strong>Equipment Breakdown:</strong>
                        <ul>${equipmentInfo}</ul>
                    `;
                    
                    marker.bindPopup(popupContent);
                    marker.addTo(evChargersLayer);
                }
            });
            isLoadingChargers = false;
        })
        .catch(error => {
            console.error('Error fetching OpenChargeMap data:', error);
            isLoadingChargers = false;
        });
}

// --- Colleges & Universities Layer ---
var universitiesLayer = L.esri.featureLayer({
  url: 'https://services1.arcgis.com/Hp6G80Pky0om7QvQ/arcgis/rest/services/Colleges_and_Universities/FeatureServer/0',
  where: "STATE = 'CA'",
  attribution: 'HIFLD Open Data',

  pointToLayer: function (geojson, latlng) {
    return L.marker(latlng, {
      icon: L.divIcon({
        html: "🎓", 
        className: 'university-icon',
        iconSize: L.point(30, 30)
      })
    });
  },

  onEachFeature: function(feature, layer) {
    const props = feature.properties;
    
    // Format the student enrollment number
    const enrollment = props.TOT_ENROLL ? props.TOT_ENROLL.toLocaleString() : 'N/A';

    const popupContent = `
      <strong>${props.NAME || 'Unknown Institution'}</strong><hr>
      <strong>Type:</strong> ${props.TYPE || 'N/A'}<br>
      <strong>Status:</strong> ${props.STATUS || 'N/A'}<br>
      <strong>Total Enrollment:</strong> ${enrollment}<br>
      <strong>City:</strong> ${props.CITY || 'N/A'}
    `;

    layer.bindPopup(popupContent);
  }
});

// --- Parks and Green Space Layer (Using Your Verified CNRA Source) ---
var parksLayer = L.esri.featureLayer({
  // This is the excellent URL you found from the CA Natural Resources Agency
  url: 'https://gis.cnra.ca.gov/arcgis/rest/services/Boundaries/CPAD_AccessType/MapServer/1',
  // A simple green style for the park polygons
  style: function () {
    return { 
      color: "#2E8B57", // "SeaGreen"
      weight: 1, 
      fillOpacity: 0.5 
    };
  },
  attribution: 'CA Natural Resources Agency (CPAD)',

  onEachFeature: function(feature, layer) {
    const props = feature.properties;
    
    // Create popup content with the park's name and access type
    const popupContent = `
      <strong>${props.LABEL_NAME || 'Unnamed Park Area'}</strong><hr>
      <strong>Access Type:</strong> ${props.ACCESS_TYP || 'N/A'}<br>
      <strong>Acres:</strong> ${props.ACRES || 'N/A'}<br>
      <strong>Manager:</strong> ${props.AGNCY_NAME || 'N/A'}
    `;

    layer.bindPopup(popupContent);
  }
});

// Setup the dynamic loading and initial call
map.on('moveend', getChargersInView);
getChargersInView();

// --- Fire Stations Layer (Using Your Verified CalOES Source) ---
var fireStationsLayer = L.esri.featureLayer({
  url: 'https://services2.arcgis.com/FiaPA4ga0iQKduv3/arcgis/rest/services/Structures_Medical_Emergency_Response_v1/FeatureServer/2',
  where: "STATE = 'CA'",
  attribution: 'Esri Federal Data/NGDA',

  pointToLayer: function (geojson, latlng) {
    return L.marker(latlng, {
      icon: L.divIcon({
        html: "🚒", // Fire truck emoji
        className: 'fire-station-icon',
        iconSize: L.point(30, 30)
      })
    });
  },

  onEachFeature: function(feature, layer) {
    const props = feature.properties;

    const popupContent = `
      <strong>${props.NAME || 'Unknown Station'}</strong><hr>
      <strong>Address:</strong> ${props.ADDRESS || 'N/A'}<br>
      <strong>City:</strong> ${props.CITY || 'N/A'}<br>
    `;

    layer.bindPopup(popupContent);
  }
});

// Listen for when layers are added or removed from the map's layer control
map.on('overlayadd', function(e) {
    // If the layer being added is our EV charger layer...
    if (e.layer === evChargersLayer) {
        // ...add our custom attribution text to the map's attribution control.
        this.attributionControl.addAttribution(OCM_ATTRIBUTION);
    }
});

map.on('overlayremove', function(e) {
    // If the layer being removed is our EV charger layer...
    if (e.layer === evChargersLayer) {
        // ...remove our custom attribution text.
        this.attributionControl.removeAttribution(OCM_ATTRIBUTION);
    }
});

// State bridges
var stateBridgesLayer = L.esri.featureLayer({
  url: "https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHhighway/State_Highway_Bridges/FeatureServer/0",
  attribution: 'Caltrans',
  pointToLayer: function(geojson, latlng) {
    return L.circleMarker(latlng, {
      radius: 5,
      fillColor: "#636363",  // Charcoal gray for state bridges
      color: "#252525",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.7
    });
  },
  onEachFeature: function(feature, layer) {
    var name = feature.properties.NAME || "Unknown Bridge";
    var yearBuilt = feature.properties.YRBLT || "Unknown Year";
    var ID = feature.properties.BRIDGE || "N/A";
    layer.bindPopup(`
    <strong>STATE BRIDGE</strong><br>
    Name: ${name}<br>
    Year Built: ${yearBuilt}<br>
    Bridge ID: ${ID}
  `);
  }
});

// Local bridges
var localBridgesLayer = L.esri.featureLayer({
  url: "https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHhighway/Local_Bridges/FeatureServer/0",
  attribution: 'Caltrans',
  pointToLayer: function(geojson, latlng) {
    return L.circleMarker(latlng, {
      radius: 5,
      fillColor: "#bdbdbd",  // Light grey for local bridges
      color: "#636363",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.7
    });
  },
  onEachFeature: function(feature, layer) {
    var name = feature.properties.NAME || "Unknown Bridge";
    var yearBuilt = feature.properties.YRBLT || "Unknown Year";
    var ID = feature.properties.BRIDGE || "N/A";
    layer.bindPopup(`
    <strong>LOCAL BRIDGE</strong><br>
    Name: ${name}<br>
    Year Built: ${yearBuilt}<br>
    Bridge ID: ${ID}
  `);
  }
});

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

// School layer level zoom logic
map.on("zoomend", function () {
  if (map.getZoom() >= 14) {
    if (!map.hasLayer(schoolsLayer)) map.addLayer(schoolsLayer);
  } else {
    if (map.hasLayer(schoolsLayer)) map.removeLayer(schoolsLayer);
  }
});

// State bridge layer level zoom logic
map.on("zoomend", function () {
  if (map.getZoom() >= 14) {
    if (!map.hasLayer(stateBridgesLayer)) map.addLayer(stateBridgesLayer);
  } else {
    if (map.hasLayer(stateBridgesLayer)) map.removeLayer(stateBridgesLayer);
  }
});

// Local bridge layer level zoom logic
map.on("zoomend", function () {
  if (map.getZoom() >= 14) {
    if (!map.hasLayer(localBridgesLayer)) map.addLayer(localBridgesLayer);
  } else {
    if (map.hasLayer(localBridgesLayer)) map.removeLayer(localBridgesLayer);
  }
});

// Health center layer level zoom logic
map.on("zoomend", function () {
  if (map.getZoom() >= 14) {
    if (!map.hasLayer(healthCentLayer)) map.addLayer(healthCentLayer);
  } else {
    if (map.hasLayer(healthCentLayer)) map.removeLayer(healthCentLayer);
  }
});

// Public airport layer level zoom logic
map.on("zoomend", function () {
  if (map.getZoom() >= 14) {
    if (!map.hasLayer(pubAirport)) map.addLayer(pubAirport);
  } else {
    if (map.hasLayer(pubAirport)) map.removeLayer(pubAirport);
  }
});

// Power plant layer level zoom logic
map.on("zoomend", function () {
  if (map.getZoom() >= 14) {
    if (!map.hasLayer(powerPlants)) map.addLayer(powerPlants);
  } else {
    if (map.hasLayer(powerPlants)) map.removeLayer(powerPlants);
  }
});

// EV Charger layer level zoom logic
map.on("zoomend", function () {
  if (map.getZoom() >= 14) {
    if (!map.hasLayer(evChargersLayer)) map.addLayer(evChargersLayer);
  } else {
    if (map.hasLayer(evChargersLayer)) map.removeLayer(evChargersLayer);
  }
});

// Universities layer level zoom logic
map.on("zoomend", function () {
  if (map.getZoom() >= 14) {
    if (!map.hasLayer(universitiesLayer)) map.addLayer(universitiesLayer);
  } else {
    if (map.hasLayer(universitiesLayer)) map.removeLayer(universitiesLayer);
  }
});

// Fire stations layer level zoom logic
map.on("zoomend", function () {
  if (map.getZoom() >= 14) {
    if (!map.hasLayer(fireStationsLayer)) map.addLayer(fireStationsLayer);
  } else {
    if (map.hasLayer(fireStationsLayer)) map.removeLayer(fireStationsLayer);
  }
});

// Parks layer level zoom logic
map.on("zoomend", function () {
  if (map.getZoom() >= 14) {
    if (!map.hasLayer(parksLayer)) map.addLayer(parksLayer);
  } else {
    if (map.hasLayer(parksLayer)) map.removeLayer(parksLayer);
  }
});

// --- Controls ---
// Layer Control
L.control.layers(
{ "OpenStreetMap": baseOSM,
  "Esri Satellite": esriSat,
  "Carto Light": cartoLight,
  "Carto Dark": cartoDark},  // Base layer
  {
    // Infrastructure
    "Schools": schoolsLayer,
    "Universities": universitiesLayer,
    "Hospitals": healthCentLayer,
    "Power Plants": powerPlants,
    "Airports": pubAirport,
    "Fire Stations": fireStationsLayer,
    "Highway System": highwayLayer,
    "All Roads": allRoadsLayer,
    "State Bridges": stateBridgesLayer,
    "Local Bridges": localBridgesLayer,
    "EV Chargers": evChargersLayer,
    "Parks": parksLayer,

    // Hazards
    "Fire Hazard Zones": fireHazardLayer,
    "Flood Hazard Zones": floodLayer,
    "Landslide Susceptibility": landslideLayer,
    "Shaking Potential": shakingLayer,
    "Active Fires": calFireLayer,

    // Health
    "Ozone Percentiles": ozoneLayer,
    "PM2.5 Concentration": pmLayer,
    "Water Quality": drinkP_Layer
  }
).addTo(map);

// Scale Bar
L.control.scale({ imperial: true }).addTo(map);

// Home Button
var homeButton = L.control({ position: 'topleft' });
homeButton.onAdd = function(map) {
  var button = L.DomUtil.create('div', 'home-button leaflet-control leaflet-bar');
  button.innerHTML = `<a href="#" id="home-button" title="Home"><span class="legend-icon">⌂</span></a>`;
  button.title = 'Reset View';
  button.onclick = function () {
    map.setView([37.5, -119.5], 6);
  };
  L.DomEvent.disableScrollPropagation(button);
  L.DomEvent.disableClickPropagation(button);
  return button;
};
homeButton.addTo(map);

// Legend Toggle
const LegendToggleControl = L.Control.extend({
  options: { position: 'topright' },
  onAdd: function (map) {
    const container = L.DomUtil.create('div', 'leaflet-bar custom-legend-button');
    container.innerHTML = '<span class="legend-icon">☰</span>';
    container.title = 'Toggle Legend';
    container.onclick = function () {
      const legendPanels = document.getElementsByClassName('legend-panel');
      for (const panel of legendPanels) {
        panel.classList.toggle('hidden');
      }
    };
    L.DomEvent.disableClickPropagation(container);
    return container;
  }
});
map.addControl(new LegendToggleControl());

var legendPanel = L.control({ position: 'topright' });
legendPanel.onAdd = () => {
  var div = L.DomUtil.create('div', 'legend-panel hidden');
  
  div.addEventListener('touchstart', function(e) {
  e.stopPropagation();
  }, { passive: false });

  div.addEventListener('touchmove', function(e) {
  e.stopPropagation();
  }, { passive: false });

  div.addEventListener('wheel', function(e) {
  e.stopPropagation();
  }, { passive: false });
  
  div.innerHTML = `
    <h2>Legends</h2>
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
        results.push(`■ <strong>Nearest ${label}:</strong> ${bestFeature.properties[fieldName]}<br>📏 Distance: ${minDist} mi`);
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
      results.push("■ <strong>Landslide Susceptibility:</strong> Visual only");
      results.push("■ <strong>Shaking Potential:</strong> Visual only");
      document.getElementById("report-content").innerHTML = results.join("<br><br>");
      hideSpinner();
    }
  }

  fireHazardLayer.query().contains(e.latlng).run(function (err, fc) {
  if (!err && fc.features.length > 0) {
    const zone = fc.features[0].properties.FHSZ_Description;
    results.push(`■ <strong>Fire Hazard Zone:</strong><br>
This area falls within a <strong>${zone}</strong> fire hazard zone as defined by the California Department of Forestry and Fire Protection (CAL FIRE).<br>
Fire hazard zones reflect the severity of potential fire exposure based on fuels, terrain, weather, and other factors.`);
    checkDone();
  } else {
    getClosestFeatureByEdgeDistance(fireHazardLayer, e.latlng, "Fire Hazard Zone", "FHSZ_Description", results, function () {
      results.push(`■ <em>Note:</em> Fire hazard zones are designated by CAL FIRE to help guide planning and mitigation efforts in wildfire-prone regions.`);
      checkDone();
    });
  }
});

  floodLayer.query().contains(e.latlng).run(function (err, fc) {
  if (!err && fc.features.length > 0) {
    const zone = fc.features[0].properties.ESRI_SYMBOLOGY;
    results.push(`■ <strong>Flood Hazard Zone:</strong><br>
This location falls within a <strong>${zone}</strong> as designated by FEMA's National Flood Hazard Layer.<br>
Flood zones represent areas at varying levels of flood risk during extreme weather events and are used to inform insurance, development, and evacuation planning.`);
    checkDone();
  } else {
    getClosestFeatureByEdgeDistance(floodLayer, e.latlng, "Flood Hazard Zone", "ESRI_SYMBOLOGY", results, function () {
      results.push(`■ <em>Note:</em> FEMA flood zones help identify areas at high risk for flooding and guide floodplain management decisions across California.`);
      checkDone();
    });
  }
});


  ozoneLayer.query().contains(e.latlng).run(function (err, fc) {
  if (!err && fc.features.length > 0) {
    const props = fc.features[0].properties;
    const ppm = props.ozone?.toFixed(3) ?? "unknown";
    const pct = props.ozoneP !== undefined ? Math.round(props.ozoneP) : "unknown";
    results.push(`■ <strong>Ozone (Ground-Level):</strong><br>
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
    results.push(`■ <strong>PM2.5 (Fine Particulate Matter) Concentration:</strong><br>
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
    results.push(`■ <strong>Drinking Water Contaminants:</strong><br>
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
