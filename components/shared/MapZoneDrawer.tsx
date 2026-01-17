import { Zone } from '@/lib/types/zone.types';
import { PenIcon, TrashIcon } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

interface Point {
  P: string; // Format: "lat,lng"
}

interface MapZoneDrawerProps {
  // Current zone being drawn/edited
  value?: Point[];
  onChange?: (points: Point[]) => void;
  
  // Existing zones to display (read-only)
  zones?: Zone[];
  
  // Map settings
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  
  // Drawing settings
  enableDrawing?: boolean;
  
  // Zone click handler
  onZoneClick?: (zone: Zone) => void;

  colorZones?: {Key: string, Value: string}[]
}

let isGoogleMapsLoading = false;
let isGoogleMapsLoaded = false;
const loadCallbacks: (() => void)[] = [];

const MapZoneDrawer: React.FC<MapZoneDrawerProps> = ({
  value = [],
  onChange,
  zones = [],
  center = { lat: 36.156264, lng: -86.789491 },
  zoom = 14,
  height = '400px',
  enableDrawing = true,
  onZoneClick,
  colorZones = []
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [currentPolygon, setCurrentPolygon] = useState<google.maps.Polygon | null>(null);
  const [existingPolygons, setExistingPolygons] = useState<google.maps.Polygon[]>([]);
  const [disbaleDrawing, setDisbaleDrawing] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const zonesRef = useRef<Zone[]>([]);
  const onZoneClickRef = useRef(onZoneClick);

  // Update refs when props change
  useEffect(() => {
    zonesRef.current = zones;
  }, [zones]);

  useEffect(() => {
    onZoneClickRef.current = onZoneClick;
  }, [onZoneClick]);

  // Load Google Maps
  useEffect(() => {
    const initializeMap = () => {
      setMapLoaded(true);
    };

    if (window.google?.maps) {
      isGoogleMapsLoaded = true;
      initializeMap();
    } else if (!isGoogleMapsLoading && !isGoogleMapsLoaded) {
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      
      if (existingScript) {
        isGoogleMapsLoading = true;
        
        const handleLoad = () => {
          isGoogleMapsLoaded = true;
          isGoogleMapsLoading = false;
          initializeMap();
          // Execute all pending callbacks
          loadCallbacks.forEach(cb => cb());
          loadCallbacks.length = 0;
        };
        
        existingScript.addEventListener('load', handleLoad);
        
        // Cleanup
        return () => {
          existingScript.removeEventListener('load', handleLoad);
        };
      } else {
        isGoogleMapsLoading = true;
        const script = document.createElement('script');
        // Strip quotes if present (common Vercel/Netlify env var issue)
        const rawKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
        const mapKey = rawKey.replace(/^["']|["']$/g, '').trim();
        script.src = `https://maps.googleapis.com/maps/api/js?key=${mapKey}&libraries=drawing,geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          isGoogleMapsLoaded = true;
          isGoogleMapsLoading = false;
          initializeMap();
          // Execute all pending callbacks
          loadCallbacks.forEach(cb => cb());
          loadCallbacks.length = 0;
        };
        script.onerror = () => {
          isGoogleMapsLoading = false;
          console.error('Failed to load Google Maps API');
        };
        document.head.appendChild(script);
      }
    } else if (isGoogleMapsLoading) {
      loadCallbacks.push(initializeMap);
      
      // Cleanup
      return () => {
        const index = loadCallbacks.indexOf(initializeMap);
        if (index > -1) {
          loadCallbacks.splice(index, 1);
        }
      };
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || map || !mapRef.current) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: center,
      zoom: zoom,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: false,
      cameraControl: false
    });

    if (enableDrawing) {
      const drawingMgr = new google.maps.drawing.DrawingManager({
        drawingControl: false,
        polygonOptions: {
          strokeColor: '#DC6803',
          strokeOpacity: 1,
          strokeWeight: 2,
          fillColor: '#DC6803',
          fillOpacity: 0.3,
          editable: true,
          draggable: true,
        },
      });

      drawingMgr.setMap(mapInstance);

      google.maps.event.addListener(drawingMgr, 'polygoncomplete', (polygon: google.maps.Polygon) => {
        handlePolygonComplete(polygon, mapInstance);
      });

      setDrawingManager(drawingMgr);
    }

    setMap(mapInstance);
  }, [mapLoaded, center, zoom, enableDrawing]);
  
  useEffect(() => {
    if(drawingManager) {
      if(disbaleDrawing){
        drawingManager.setDrawingMode(null);
      }else{
        drawingManager.setDrawingMode(
          google.maps.drawing.OverlayType.POLYGON
        );
      }
    }
  }, [drawingManager, disbaleDrawing]);

  // Render existing zones (read-only with different colors)
  useEffect(() => {
    if (!map) return;
    
    const currentZones = zonesRef.current;
    
    if (currentZones.length === 0) {
      // Clear existing polygons if no zones
      existingPolygons.forEach(p => p.setMap(null));
      if (existingPolygons.length > 0) {
        setExistingPolygons([]);
      }
      return;
    }

    // Clear old polygons
    existingPolygons.forEach(p => p.setMap(null));

    const newPolygons: google.maps.Polygon[] = [];
    const bounds = new google.maps.LatLngBounds();

    const infoWindow = new google.maps.InfoWindow();

    currentZones.forEach((zone, index) => {
      const path = zone.points.map(point => {
        const [lat, lng] = point.P.split(',').map(Number);
        const latLng = new google.maps.LatLng(lat, lng);
        bounds.extend(latLng);
        return latLng;
      });

      // Use zone's color or default color
      const color = colorZones[index]?.Key || '#FF6B6B';
      const polygon = new google.maps.Polygon({
        paths: path,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.35,
        editable: false, // Read-only
        clickable: true,
        map: map,
      });

      // Add click listener
      google.maps.event.addListener(polygon, 'click', (e: google.maps.MapMouseEvent) => {
        const currentCallback = onZoneClickRef.current;
        if (currentCallback) {
          currentCallback(zone);
        }

        infoWindow.close();

        var providersList = '';
        zone.providers && zone.providers.forEach(function (provider) {
            providersList += provider + '<br>';
        });

        var contentString = `
          <div class="iw-content" style="width:160px;">
          <p><span style="font-weight:bold;">Zone Name:</span><br>${zone.name}</p><br>
          <p><span style="font-weight:bold;">Providers:</span><br>${providersList}</p>
          </div>
        `;
        infoWindow.setContent(contentString);
        infoWindow.setPosition(e.latLng!);
        infoWindow.open(map);
      });

      // Add hover effect
      google.maps.event.addListener(polygon, 'mouseover', () => {
        polygon.setOptions({
          fillOpacity: 0.5,
          strokeWeight: 3,
        });
      });

      google.maps.event.addListener(polygon, 'mouseout', () => {
        polygon.setOptions({
          fillOpacity: 0.3,
          strokeWeight: 2,
        });
      });

      newPolygons.push(polygon);
    });

    setExistingPolygons(newPolygons);

    // Fit map to show all zones
    if (currentZones.length > 0) {
      map.fitBounds(bounds);
    }
  }, [map, zones.length]);

  // Handle polygon complete
  const handlePolygonComplete = (polygon: google.maps.Polygon, mapInstance: google.maps.Map) => {
    const points = extractPoints(polygon);
    
    // Store the completed polygon FIRST before calling onChange
    setCurrentPolygon(polygon);
    
    // Listen for edits on this polygon
    google.maps.event.addListener(polygon.getPath(), 'set_at', () => {
      updatePolygonPoints(polygon);
    });

    google.maps.event.addListener(polygon.getPath(), 'insert_at', () => {
      updatePolygonPoints(polygon);
    });

    google.maps.event.addListener(polygon.getPath(), 'remove_at', () => {
      updatePolygonPoints(polygon);
    });
    
    // Call onChange AFTER setting up the polygon
    if (onChange) {
      onChange(points);
    }

    // Exit drawing mode
    setDisbaleDrawing(true);
  };

  // Update current polygon when value changes (only for external updates)
  useEffect(() => {
    // If map not ready, exit
    if (!map) return;

    const bounds = new google.maps.LatLngBounds();

    // If value is empty, clear polygon
    if (!value || value.length === 0) {
      if (currentPolygon) {
        currentPolygon.setMap(null);
        setCurrentPolygon(null);
      }
      return;
    }

    // If we already have a current polygon from drawing, don't recreate it
    if (currentPolygon) {
      return;
    }

    // Parse points from format {P: "lat,lng"} to Google Maps LatLng
    const path = value.map(point => {
      const [lat, lng] = point.P.split(',').map(Number);
      bounds.extend(new google.maps.LatLng(lat, lng));
      return { lat, lng };
    });

    // Only create polygon if value is set externally (not from drawing)
    const polygon = new google.maps.Polygon({
      paths: path,
      strokeColor: '#DC6803',
      strokeOpacity: 1,
      strokeWeight: 2,
      fillColor: '#DC6803',
      fillOpacity: 0.3,
      editable: true,
      draggable: false,
      map: map,
    });

    // Listen for edits
    google.maps.event.addListener(polygon.getPath(), 'set_at', () => {
      updatePolygonPoints(polygon);
    });

    google.maps.event.addListener(polygon.getPath(), 'insert_at', () => {
      updatePolygonPoints(polygon);
    });

    google.maps.event.addListener(polygon.getPath(), 'remove_at', () => {
      updatePolygonPoints(polygon);
    });

    setCurrentPolygon(polygon);

    // Fit map to show all zones
    map.fitBounds(bounds);

    setDisbaleDrawing(true);
  }, [map, value?.length]);

  const extractPoints = (polygon: google.maps.Polygon): Point[] => {
    const path = polygon.getPath();
    const points: Point[] = [];

    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      points.push({
        P: `${point.lat()},${point.lng()}`,
      });
    }

    return points;
  };

  const updatePolygonPoints = (polygon: google.maps.Polygon) => {
    const points = extractPoints(polygon);
    if (onChange) {
      onChange(points);
    }
  };

  const clearCurrentZone = () => {
    if (currentPolygon) {
      currentPolygon.setMap(null);
      setCurrentPolygon(null);
      setDisbaleDrawing(false);
    }
    if (onChange) {
      onChange([]);
    }
  };

  return (
    <div className="relative w-full" style={{ height }}>
      {enableDrawing && (
        <>
          <div className="absolute top-4 right-4 z-10">
            <button type='button' className={`px-2 py-2 rounded-sm font-medium shadow-lg transition-colors bg-white text-gray-700 hover:bg-gray-100 border border-gray-300`}>
              <PenIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute bottom-4 right-4 z-10">
            {value.length > 0 && (
              <button
                type="button"
                onClick={clearCurrentZone}
                className="px-2 py-2 rounded-sm font-medium shadow-lg transition-colors bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 cursor-pointer"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </>
      )}
      
      <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" />
    </div>
  );
};

export default MapZoneDrawer;