'use client';

import React, { useEffect, useRef } from 'react';
import { Business } from '@/types';

interface LeafletMapProps {
  businesses: Business[];
  center?: [number, number];
  zoom?: number;
  selectedBusinessId?: string;
  radiusKm?: number;
  height?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  businesses,
  center = [-23.5424, -46.4178], // Default to Guaianases SP
  zoom = 14,
  selectedBusinessId,
  radiusKm,
  height = '420px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    // Dynamically inject Leaflet CSS if missing
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet dynamically on the client
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Fix default Leaflet icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Cleanup existing map instance if already initialized
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current).setView(center, zoom);
      mapInstanceRef.current = map;

      // OpenStreetMap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Force size recalculation to prevent blank tiles
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);

      // Custom marker icon in Laranja Coral (#E36845)
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="background-color: #E36845; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 14px rgba(14,59,67,0.35); font-weight: bold; font-size: 15px;">📍</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      // Add markers for businesses
      businesses.forEach((biz) => {
        if (!biz.latitude || !biz.longitude) return;

        const businessUrl = `/${biz.state_id.toLowerCase()}/${biz.city?.slug || 'sao-paulo'}/${biz.neighborhood?.slug || 'guaianases'}/${biz.slug}`;

        const popupContent = `
          <div style="font-family: sans-serif; min-width: 200px; padding: 6px;">
            <div style="font-weight: 900; font-size: 14px; color: #0E3B43; margin-bottom: 2px;">${biz.name}</div>
            <div style="font-size: 11px; color: #4FA6A6; font-weight: 700; margin-bottom: 4px; text-transform: uppercase;">${biz.category?.name || ''}</div>
            <div style="font-size: 12px; color: #537379; margin-bottom: 8px;">${biz.address}, ${biz.number}</div>
            <a href="${businessUrl}" style="display: block; text-align: center; background: #E36845; color: white; font-size: 12px; font-weight: bold; padding: 7px 12px; border-radius: 10px; text-decoration: none;">Ver Loja</a>
          </div>
        `;

        const marker = L.marker([biz.latitude, biz.longitude], { icon: customIcon }).addTo(map);
        marker.bindPopup(popupContent);

        if (selectedBusinessId && biz.id === selectedBusinessId) {
          marker.openPopup();
        }
      });

      // Draw radius circle if specified
      if (radiusKm && center) {
        L.circle(center, {
          color: '#E36845',
          fillColor: '#4FA6A6',
          fillOpacity: 0.15,
          weight: 2,
          radius: radiusKm * 1000,
        }).addTo(map);
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [businesses, center, zoom, selectedBusinessId, radiusKm]);

  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[#4FA6A6]/30 shadow-sm">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />
    </div>
  );
};
