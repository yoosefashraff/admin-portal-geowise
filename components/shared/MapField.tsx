"use client";

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { useEffect, useRef, useState } from "react";

interface MapFieldProps {
  value: { 
    lat?: number; 
    lng?: number 
  } | null,
  onChange: (value: { lat: number; lng: number }) => void
}

let isGoogleMapsLoading = false;
let isGoogleMapsLoaded = false;

export default function MapField({value, onChange}: MapFieldProps) {

  const [searchQuery, setSearchQuery] = useState<string | undefined>('');
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const onChangeRef = useRef(onChange);

  // Keep onChange ref up to date without causing re-renders
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const mapKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAq2Vf7Ss-yLruim9i_vog14LwVGPBmt_g';

  // Initialize autocomplete separately
  const initAutocomplete = () => {
    if (!searchInputRef.current || autocompleteRef.current || !mapInstance) return;
    
    if (window.google?.maps?.places?.Autocomplete) {
      try {
        const autocompleteInstance = new window.google.maps.places.Autocomplete(
          searchInputRef.current,
          {
            fields: ['formatted_address', 'geometry', 'name'],
          }
        );

        autocompleteInstance.addListener('place_changed', () => {
          const place = autocompleteInstance.getPlace();

          if (!place.geometry || !place.geometry.location || !mapInstance) {
            return;
          }

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          // Update map position
          mapInstance.setCenter(place.geometry.location);
          mapInstance.setZoom(15);

          // Update search query
          setSearchQuery(place.formatted_address || place.name);

          // Update parent component with new location (this was missing!)
          onChangeRef.current({ lat, lng });
        });

        autocompleteRef.current = autocompleteInstance;
      } catch (error) {
        console.error('Failed to initialize Autocomplete:', error);
      }
    }
  };

  // Initialize Google Maps (only once)
  useEffect(() => {
    const initMap = () => {
      if (!window.google || !window.google.maps || !mapRef.current || mapInstance) return;
      
      // Create map only once
      const newMapInstance = new window.google.maps.Map(mapRef.current, {
        center: {lat: value?.lat || 36.156264, lng: value?.lng || -86.789491 },
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      // Add map idle listener (when user stops dragging)
      newMapInstance.addListener('idle', () => {
        const center = newMapInstance.getCenter();
        if (center) {
          const lat = center.lat();
          const lng = center.lng();
          
          // Reverse geocode to get address
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
            if (status === 'OK' && results && results[0]) {
              setSearchQuery(results[0].formatted_address);

              // Use ref to avoid dependency issues - prevents map reloading
              onChangeRef.current({ lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng() });
            }
          });
        }
      });

      setMapInstance(newMapInstance);
    };

    // Load Google Maps API
    if (window.google?.maps) {
      isGoogleMapsLoaded = true;
      initMap();
    } else if (!isGoogleMapsLoading && !isGoogleMapsLoaded) {
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      
      if (existingScript) {
        isGoogleMapsLoading = true;
        const handleLoad = () => {
          isGoogleMapsLoaded = true;
          isGoogleMapsLoading = false;
          // Wait a bit for places library to be available
          setTimeout(() => {
            initMap();
          }, 200);
        };
        
        if (window.google?.maps) {
          handleLoad();
        } else {
          existingScript.addEventListener('load', handleLoad);
        }
      } else {
        isGoogleMapsLoading = true;
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${mapKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          isGoogleMapsLoaded = true;
          isGoogleMapsLoading = false;
          // Wait a bit for places library to be available
          setTimeout(() => {
            initMap();
          }, 200);
        };
        script.onerror = () => {
          isGoogleMapsLoading = false;
          console.error('Failed to load Google Maps API');
        };
        document.head.appendChild(script);
      }
    } else if (isGoogleMapsLoading) {
      const checkInterval = setInterval(() => {
        if (window.google?.maps && isGoogleMapsLoaded) {
          clearInterval(checkInterval);
          initMap();
        }
      }, 100);

      return () => clearInterval(checkInterval);
    }
  }, [value, mapInstance]); // Only depend on value and mapInstance, not onChange (use ref instead)
  
  // Update map center when value changes (if map already exists) - prevents full re-initialization
  useEffect(() => {
    if (mapInstance && value?.lat && value?.lng) {
      const currentCenter = mapInstance.getCenter();
      if (currentCenter) {
        const currentLat = currentCenter.lat();
        const currentLng = currentCenter.lng();
        // Only update if center actually changed (avoid unnecessary updates)
        if (Math.abs(currentLat - value.lat) > 0.0001 || Math.abs(currentLng - value.lng) > 0.0001) {
          mapInstance.setCenter({ lat: value.lat, lng: value.lng });
        }
      }
    }
  }, [value?.lat, value?.lng, mapInstance]);

  // Separate effect to initialize autocomplete when places library becomes available
  useEffect(() => {
    if (mapInstance && searchInputRef.current && !autocompleteRef.current) {
      const checkPlaces = setInterval(() => {
        if (window.google?.maps?.places?.Autocomplete) {
          clearInterval(checkPlaces);
          initAutocomplete();
        }
      }, 100);

      // Cleanup interval after 5 seconds
      const timeout = setTimeout(() => clearInterval(checkPlaces), 5000);

      return () => {
        clearInterval(checkPlaces);
        clearTimeout(timeout);
      };
    }
  }, [mapInstance]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return(
    <div className="max-w-xl mx-auto">
      <div className="relative mb-4">
        <Search
          className="w-4 h-4 focus-visible:outline-0 focus-visible:shadow-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <Input
          placeholder="Type or pinpoint location to view availability..."
          className="pl-10 pr-4 h-11 py-3 md:text-[16px] text-[16px] bg-gray-50 border-0"
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <p className="mb-[12px] text-[#667085] font-medium text-[16px] leading-[24px]">Type or pinpoint location</p>

      <div className="w-full h-96 rounded-xl overflow-hidden border relative">
        <div ref={mapRef} className="w-full h-full" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
          <Image 
            src="/images/marker.png"
            alt="Marker"
            width={14}
            height={26}
          />
        </div>
      </div>
    </div>
  )
}