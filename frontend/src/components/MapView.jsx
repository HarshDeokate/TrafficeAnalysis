import { useEffect, useRef, useState } from "react";
import "./MapView.css";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_API_KEY;
const DEFAULT_LAT = 0;
const DEFAULT_LNG = 0;
const LEVEL_COLOR = { LOW: "#00D4AA", MEDIUM: "#de5b2b", HIGH: "#f20909" };

const isValid = (la, lo) =>
  typeof la === "number" && typeof lo === "number" &&
  !isNaN(la) && !isNaN(lo) &&
  la >= -90 && la <= 90 && lo >= -180 && lo <= 180;

export default function MapView({ lat, lng, logs = [], trafficLevel = "MEDIUM", onLocationChange }) {
  const [defaultPos, setDefaultPos] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const heatMarkersRef = useRef([]);
  
  // ✅ Changed from an input ref to a container ref
  const searchContainerRef = useRef(null); 
  const autocompleteRef = useRef(null);
  const isSearchMovingRef = useRef(false);
  const markerColor = LEVEL_COLOR[trafficLevel?.toUpperCase()] || "#FF6B35";

  const buildPinElement = (color, level) => {
    const label = level === "LOW" ? "LO" : level === "HIGH" ? "HI" : "MD";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "36");
    svg.setAttribute("height", "48");
    svg.setAttribute("viewBox", "0 0 36 48");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M18 2C9.163 2 2 9.163 2 18c0 11.25 16 28 16 28S34 29.25 34 18C34 9.163 26.837 2 18 2Z");
    path.setAttribute("fill", color);
    path.setAttribute("opacity", "0.95");
    svg.appendChild(path);

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "18");
    circle.setAttribute("cy", "18");
    circle.setAttribute("r", "9");
    circle.setAttribute("fill", "rgba(0,0,0,0.35)");
    svg.appendChild(circle);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "18");
    text.setAttribute("y", "22");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-family", "JetBrains Mono, monospace");
    text.setAttribute("font-size", "8");
    text.setAttribute("font-weight", "bold");
    text.setAttribute("fill", "white");
    text.setAttribute("letter-spacing", "0.5");
    text.textContent = label;
    svg.appendChild(text);

    return svg;
  };

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDefaultPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => console.warn("Map geolocation unavailable, using fallback.")
    );
  }, []);

  useEffect(() => {
    const initMap = () => {
      // console.log("initMap called, mapRef.current:", mapRef.current);
      // console.log("mapInitializedRef:", mapInitializedRef.current);
      if (mapInstanceRef.current || !mapRef.current) return;

      const safeLat = isValid(lat, lng) ? lat : defaultPos.lat;
      const safeLng = isValid(lat, lng) ? lng : defaultPos.lng;
      const pos = { lat: safeLat, lng: safeLng };

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: pos,
        zoom: 15,
        disableDefaultUI: true,
        zoomControl: true,
        mapId: "DEMO_MAP_ID",
      });

      markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
        position: pos,
        map: mapInstanceRef.current,
        content: buildPinElement(markerColor, trafficLevel?.toUpperCase() || "MEDIUM"),
      });

      // ✅ Modern PlaceAutocompleteElement Implementation
      if (searchContainerRef.current && !autocompleteRef.current) {
        const placeAutocomplete = new window.google.maps.places.PlaceAutocompleteElement();
        
        // ✅ Add a class to target the web component in CSS
        placeAutocomplete.classList.add("modern-gmp-search");
        
        autocompleteRef.current = placeAutocomplete;
        searchContainerRef.current.appendChild(placeAutocomplete);

        // Listen for the new modern event
        // placeAutocomplete.addEventListener("gmp-placeselect", async (event) => {
        //   const place = event.place;

        //   console.log("1. event fired, place:", place);

          
        //   if (!place) return;

        //   try {
        //     // ⚠️ Wrap this in a try/catch. If "Places API (New)" is not enabled
        //     // in your Google Cloud Console, this line will throw an error!
        //     await place.fetchFields({ fields: ["location"] });

        //     console.log("2. after fetchFields, location:", place.location);
        //     console.log("3. markerRef:", markerRef.current);
        //     console.log("4. mapInstanceRef:", mapInstanceRef.current);

        //     if (!place.location) {
        //       console.error("No geometry available for this place.");
        //       return;
        //     }

        //     // Safely extract coordinates (handles both functions and literal properties)
        //     const newLat = typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat;
        //     const newLng = typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng;

        //     const newPos = { lat: newLat, lng: newLng };

        //     // Lock React sync for longer (1.5s) to allow parent state to catch up
        //     isSearchMovingRef.current = true;
            
        //     mapInstanceRef.current.setCenter(newPos);
        //     mapInstanceRef.current.setZoom(15);
            
        //     // Explicitly use Google's LatLng object to ensure compatibility
        //     if (markerRef.current) {
        //       markerRef.current.position = new window.google.maps.LatLng(newLat, newLng);
        //     }

        //     if (onLocationChange) {
        //       onLocationChange(newLat, newLng);
        //     }

        //     // Unlock after a generous delay
        //     setTimeout(() => { isSearchMovingRef.current = false; }, 1500);

        //   } catch (error) {
        //     console.error("🚨 Failed to fetch location data. Did you enable 'Places API (New)' in Google Cloud Console?", error);
        //   }
        // });
        placeAutocomplete.addEventListener(
          "gmp-select",
          async ({ placePrediction }) => {
            const place = placePrediction.toPlace();

            await place.fetchFields({
              fields: ["location"],
            });

            const newPos = {
              lat: place.location.lat(),
              lng: place.location.lng(),
            };

            mapInstanceRef.current.panTo(newPos);

            markerRef.current.map = null;

            markerRef.current.position = newPos;

            markerRef.current.map = mapInstanceRef.current;

            onLocationChange?.(newPos.lat, newPos.lng);
          }
        );
      }
    };

    const checkAndInit = () => {
      // ✅ Check for the new PlaceAutocompleteElement class
      if (window.google?.maps?.places?.PlaceAutocompleteElement && window.google?.maps?.marker?.AdvancedMarkerElement) {
        initMap();
      } else {
        setTimeout(checkAndInit, 100);
      }
    };

    if (window.google) {
      checkAndInit();
    } else if (!document.getElementById("gmaps-script")) {
      const script = document.createElement("script");
      script.id = "gmaps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&loading=async&libraries=places,marker`;
      script.async = true;
      script.defer = true;
      script.onload = checkAndInit;
      document.head.appendChild(script);
    } else {
      checkAndInit();
    }
  }, [defaultPos]); 

  useEffect(() => {
    if (!mapInstanceRef.current || isSearchMovingRef.current) return;

    const safeLat = isValid(lat, lng) ? lat : defaultPos.lat;
    const safeLng = isValid(lat, lng) ? lng : defaultPos.lng;
    const pos = { lat: safeLat, lng: safeLng };

    mapInstanceRef.current.setCenter(pos);
    if (markerRef.current) {
      markerRef.current.position = pos;
    }

    console.log("Marker position:", markerRef.current.position);
  }, [lat, lng, defaultPos]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;
    heatMarkersRef.current.forEach((m) => m.setMap(null));
    heatMarkersRef.current = [];

    logs.forEach((log) => {
      if (!isValid(log.lat, log.lng)) return;
      const color = LEVEL_COLOR[log.level] || "#FF6B35";
      const circle = new window.google.maps.Circle({
        map: mapInstanceRef.current,
        center: { lat: log.lat, lng: log.lng },
        radius: 80,
        fillColor: color,
        fillOpacity: 0.35,
        strokeColor: color,
        strokeOpacity: 0.7,
        strokeWeight: 1.5,
      });
      heatMarkersRef.current.push(circle);
    });
  }, [logs]);

  useEffect(() => {
    if (!markerRef.current || !window.google?.maps?.marker?.PinElement) return;
    const color = LEVEL_COLOR[trafficLevel?.toUpperCase()] || "#FF6B35";
    markerRef.current.content = buildPinElement(color, trafficLevel?.toUpperCase());
  }, [trafficLevel]);

  const displayLat = isValid(lat, lng) ? lat.toFixed(4) : defaultPos.lat.toFixed(4);
  const displayLng = isValid(lat, lng) ? lng.toFixed(4) : defaultPos.lng.toFixed(4);

  return (
    <div style={{ position: "relative" }}>
      {/* ✅ Changed to a container div. The script will inject the search bar here. */}
      <div className="map-search-wrapper" ref={searchContainerRef}></div>
      <div className="map-container">
        <div ref={mapRef} className="map-canvas" />
        <div className="map-coord-tag">{displayLat}°N · {displayLng}°E</div>
        <div className="map-label">LOCATION PREVIEW</div>
        {logs.length > 0 && (
          <div className="map-legend">
            <span className="legend-dot" style={{ background: "#00D4AA" }} />LOW
            <span className="legend-dot" style={{ background: "#FF6B35" }} />MED
            <span className="legend-dot" style={{ background: "#FF4444" }} />HIGH
          </div>
        )}
      </div>
    </div>
  );
}

// import { useEffect, useRef, useState } from "react";
// import "./MapView.css";

// const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_API_KEY;
// const DEFAULT_LAT = 0;
// const DEFAULT_LNG = 0;
// const LEVEL_COLOR = { LOW: "#00D4AA", MEDIUM: "#de5b2b", HIGH: "#f20909" };

// const isValid = (la, lo) =>
//   typeof la === "number" && typeof lo === "number" &&
//   !isNaN(la) && !isNaN(lo) &&
//   la >= -90 && la <= 90 && lo >= -180 && lo <= 180;

// export default function MapView({ lat, lng, logs = [], trafficLevel = "MEDIUM", onLocationChange }) {
//   const [defaultPos, setDefaultPos] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });

//   const mapRef         = useRef(null);
//   const mapObj         = useRef(null);   // google.maps.Map instance
//   const markerObj      = useRef(null);   // AdvancedMarkerElement instance
//   const heatMarkersRef = useRef([]);
//   const searchRef      = useRef(null);   // search container div
//   const didInit        = useRef(false);  // guard against double-init
//   const skipSync       = useRef(false);  // block prop-sync while search moves map

//   const markerColor = LEVEL_COLOR[trafficLevel?.toUpperCase()] || "#FF6B35";

//   const buildPin = (color, level) => {
//     const label = level === "LOW" ? "LO" : level === "HIGH" ? "HI" : "MD";
//     const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
//     svg.setAttribute("width", "36");
//     svg.setAttribute("height", "48");
//     svg.setAttribute("viewBox", "0 0 36 48");

//     const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
//     path.setAttribute("d", "M18 2C9.163 2 2 9.163 2 18c0 11.25 16 28 16 28S34 29.25 34 18C34 9.163 26.837 2 18 2Z");
//     path.setAttribute("fill", color);
//     path.setAttribute("opacity", "0.95");
//     svg.appendChild(path);

//     const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
//     circle.setAttribute("cx", "18");
//     circle.setAttribute("cy", "18");
//     circle.setAttribute("r", "9");
//     circle.setAttribute("fill", "rgba(0,0,0,0.35)");
//     svg.appendChild(circle);

//     const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
//     text.setAttribute("x", "18");
//     text.setAttribute("y", "22");
//     text.setAttribute("text-anchor", "middle");
//     text.setAttribute("font-family", "JetBrains Mono, monospace");
//     text.setAttribute("font-size", "8");
//     text.setAttribute("font-weight", "bold");
//     text.setAttribute("fill", "white");
//     text.setAttribute("letter-spacing", "0.5");
//     text.textContent = label;
//     svg.appendChild(text);

//     return svg;
//   };

//   // ✅ Geolocation — runs once
//   useEffect(() => {
//     if (!navigator.geolocation) return;
//     navigator.geolocation.getCurrentPosition(
//       (p) => setDefaultPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
//       ()  => console.warn("Geolocation unavailable.")
//     );
//   }, []);

//   // ✅ Map init — runs once after DOM is painted
//   useEffect(() => {
//     // ✅ Wait until mapRef.current is a real DOM node
//     if (!mapRef.current) return;

//     const doInit = () => {
//       // ✅ All guards are refs — always in scope
//       if (didInit.current) return;
//       if (!mapRef.current)  return;
//       if (!window.google?.maps?.places?.PlaceAutocompleteElement) return;
//       if (!window.google?.maps?.marker?.AdvancedMarkerElement)     return;

//       didInit.current = true;

//       const safeLat = isValid(lat, lng) ? lat : defaultPos.lat;
//       const safeLng = isValid(lat, lng) ? lng : defaultPos.lng;
//       const pos = { lat: safeLat, lng: safeLng };

//       // Create map
//       mapObj.current = new window.google.maps.Map(mapRef.current, {
//         center: pos,
//         zoom: 15,
//         disableDefaultUI: true,
//         zoomControl: true,
//         mapId: "DEMO_MAP_ID",
//       });

//       // Create marker
//       markerObj.current = new window.google.maps.marker.AdvancedMarkerElement({
//         position: pos,
//         map: mapObj.current,
//         content: buildPin(markerColor, trafficLevel?.toUpperCase() || "MEDIUM"),
//       });

//       console.log("Map init complete. marker:", markerObj.current);

//       // Attach search
//       if (searchRef.current && searchRef.current.children.length === 0) {
//         const pac = new window.google.maps.places.PlaceAutocompleteElement();
//         searchRef.current.appendChild(pac);

//         pac.addEventListener("gmp-placeselect", async (evt) => {
//           console.log("gmp-placeselect fired");
//           try {
//             const place = evt.place;
//             await place.fetchFields({ fields: ["location", "displayName"] });

//             const newLat = typeof place.location.lat === "function"
//               ? place.location.lat() : place.location.lat;
//             const newLng = typeof place.location.lng === "function"
//               ? place.location.lng() : place.location.lng;

//             console.log("coords:", newLat, newLng);
//             console.log("markerObj.current at event time:", markerObj.current);

//             if (!isValid(newLat, newLng)) {
//               console.error("Invalid coords returned");
//               return;
//             }

//             const newPos = new window.google.maps.LatLng(newLat, newLng);

//             skipSync.current = true;
//             mapObj.current.setCenter(newPos);
//             mapObj.current.setZoom(15);
//             markerObj.current.position = newPos;

//             console.log("marker moved to:", markerObj.current.position);

//             if (onLocationChange) onLocationChange(newLat, newLng);
//             setTimeout(() => { skipSync.current = false; }, 1000);

//           } catch (err) {
//             console.error("place error:", err);
//           }
//         });
//       }
//     };

//     const poll = () => {
//       if (
//         window.google?.maps?.places?.PlaceAutocompleteElement &&
//         window.google?.maps?.marker?.AdvancedMarkerElement
//       ) {
//         doInit();
//       } else {
//         setTimeout(poll, 100);
//       }
//     };

//     if (window.google) {
//       poll();
//     } else if (!document.getElementById("gmaps-script")) {
//       const script = document.createElement("script");
//       script.id    = "gmaps-script";
//       script.src   = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&loading=async&libraries=places,marker`;
//       script.async = true;
//       script.defer = true;
//       script.onload = poll;
//       document.head.appendChild(script);
//     } else {
//       poll();
//     }
//   }, [mapRef.current]); // ✅ re-runs when the DOM node becomes available

//   // Sync marker to props
//   useEffect(() => {
//     if (!mapObj.current || !markerObj.current) return;
//     if (skipSync.current) return;
//     const safeLat = isValid(lat, lng) ? lat : defaultPos.lat;
//     const safeLng = isValid(lat, lng) ? lng : defaultPos.lng;
//     const pos = new window.google.maps.LatLng(safeLat, safeLng);
//     mapObj.current.setCenter(pos);
//     markerObj.current.position = pos;
//   }, [lat, lng, defaultPos]);

//   // Heatmap circles
//   useEffect(() => {
//     if (!mapObj.current || !window.google) return;
//     heatMarkersRef.current.forEach((m) => m.setMap(null));
//     heatMarkersRef.current = [];
//     logs.forEach((log) => {
//       if (!isValid(log.lat, log.lng)) return;
//       const color = LEVEL_COLOR[log.level] || "#FF6B35";
//       const circle = new window.google.maps.Circle({
//         map: mapObj.current,
//         center: { lat: log.lat, lng: log.lng },
//         radius: 80,
//         fillColor: color,
//         fillOpacity: 0.35,
//         strokeColor: color,
//         strokeOpacity: 0.7,
//         strokeWeight: 1.5,
//       });
//       heatMarkersRef.current.push(circle);
//     });
//   }, [logs]);

//   // Update pin color on traffic level change
//   useEffect(() => {
//     if (!markerObj.current) return;
//     const color = LEVEL_COLOR[trafficLevel?.toUpperCase()] || "#FF6B35";
//     markerObj.current.content = buildPin(color, trafficLevel?.toUpperCase());
//   }, [trafficLevel]);

//   const displayLat = isValid(lat, lng) ? lat.toFixed(4) : defaultPos.lat.toFixed(4);
//   const displayLng = isValid(lat, lng) ? lng.toFixed(4) : defaultPos.lng.toFixed(4);

//   return (
//     <div style={{ position: "relative", height: "200px" }}>
//       {/* ✅ Search outside map-container — overflow:hidden can't clip it */}
//       <div ref={searchRef} className="map-search-wrapper" />

//       <div className="map-container">
//         <div ref={mapRef} className="map-canvas" />
//         <div className="map-coord-tag">{displayLat}°N · {displayLng}°E</div>
//         <div className="map-label">LOCATION PREVIEW</div>
//         {logs.length > 0 && (
//           <div className="map-legend">
//             <span className="legend-dot" style={{ background: "#00D4AA" }} />LOW
//             <span className="legend-dot" style={{ background: "#FF6B35" }} />MED
//             <span className="legend-dot" style={{ background: "#FF4444" }} />HIGH
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }