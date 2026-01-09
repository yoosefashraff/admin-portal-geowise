'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import React, {useRef, useEffect, useState} from "react";
import {ArrowLeft, Search} from "lucide-react";
import GWCard from "@/components/shared/GWCard";
import {Separator} from "@/components/ui/separator";
import {useSchedulerStore} from "@/lib/store/schedulerStore";
import { useRouter } from 'next/navigation';
import {DashboardHeader} from "@/components/layout/DashboardHeader";
import {SchedulerSteps} from "@/components/layout/SchedulerSteps";
import Link from "next/link";
import EnterLocation from "@/components/scheduler/EnterLocation";
import Image from 'next/image';
import { useSessionStorage } from '@/lib/hooks/useSessionStorage';
import { LocationInfo } from '@/lib/types/scheduler.types';

export default function LocationSelect() {

  const router = useRouter();
  const {schedulerData, _hasHydrated } = useSchedulerStore();
  const [locationStep, setLocationStep] = useState<number>(1);
  const [mapCenter, setMapCenter] = useSessionStorage('mapCenter', { lat: 36.156264, lng: -86.789491 });
  const [searchQuery, setSearchQuery] = useState<string | undefined>('');
  const [map, setMap] = useState<any>(null);
  const [autocomplete, setAutocomplete] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [service] = useSessionStorage('Service', '');

  const mapKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAq2Vf7Ss-yLruim9i_vog14LwVGPBmt_g';
  const [isMapLoaded, setIsMapLoaded] = useState(false);


  useEffect(() => {
    if (!service) {
      router.replace('/scheduler/select-service');
    }
  }, [router]);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = () => {
      if (!window.google || !mapRef.current) return;
      
      // Create map
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      // Add map idle listener
      mapInstance.addListener('idle', () => {
        const center = mapInstance.getCenter();
        if (center) {
          const lat = center.lat();
          const lng = center.lng();
          
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
            if (status === 'OK' && results && results[0]) {
              setSearchQuery(results[0].formatted_address);
              setLocationInfo({
                  lat: results[0].geometry.location.lat(),
                  lng: results[0].geometry.location.lng(),
                  address: results[0].formatted_address,
                  street_address: (results[0].address_components.find((component: any) => component.types.includes('street_number'))?.long_name || '') + ' ' + (results[0].address_components.find((component: any) => component.types.includes('route'))?.long_name || ''),
                  city: results[0].address_components.find((component: any) => component.types.includes("administrative_area_level_2"))?.long_name || '',
                  state: results[0].address_components.find((component: any) => component.types.includes('administrative_area_level_1'))?.long_name || '',
                  zipCode: results[0].address_components.find((component: any) => component.types.includes('postal_code'))?.long_name || ''
                }
              );
              setMapCenter({ lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng() });
            }
          });
        }
      });

      setMap(mapInstance);

      // Initialize autocomplete
      if (searchInputRef.current) {
        const autocompleteInstance = new window.google.maps.places.Autocomplete(
          searchInputRef.current,
          {
            fields: ['formatted_address', 'geometry', 'name', 'address_components'],
          }
        );

        autocompleteInstance.addListener('place_changed', () => {
          const place = autocompleteInstance.getPlace();

          if (!place.geometry || !place.geometry.location) {
            return;
          }

          mapInstance.setCenter(place.geometry.location);
          mapInstance.setZoom(15);
          setSearchQuery(place.formatted_address || place.name);
        });

        setAutocomplete(autocompleteInstance);
      }
    };

    if (!window.google && !isMapLoaded) {
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          setIsMapLoaded(true);
          initMap();
        });
      } else {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${mapKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setIsMapLoaded(true);
          initMap();
        };
        document.head.appendChild(script);
      }
    } else if (window.google) {
      initMap();
    }
  }, []);

  useEffect(() => {
    if (locationStep === 1 && window.google && mapRef.current && !map) {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      setMap(mapInstance);
    }
  }, [locationStep]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className='max-w-5xl mx-auto py-8 px-4'>
      <DashboardHeader
        title="Scheduler"
      />

      <SchedulerSteps currentStep={2} />

      {
        locationStep == 2 ? (
          <EnterLocation
            setLocationStep={setLocationStep}
            locationInfo={locationInfo}
          />
        ) : (
          <GWCard title="Enter Location" className="max-w-3xl mx-auto" >
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
            <Separator className="my-4 bg-gray-200" />
            <div className="flex justify-end">
              <Button
                variant="outline"
                className="cursor-pointer"
              >
                <Link href="/scheduler/select-service" className="flex items-center gap-2">
                  <ArrowLeft className="h-6 w-6"></ArrowLeft>
                  Previous
                </Link>
              </Button>
              <Button
                className="ml-3 cursor-pointer"
                onClick={() => setLocationStep(2)}
              >
                  Continue
              </Button>
            </div>
          </GWCard>
        )
      }
    </div>
  )
}