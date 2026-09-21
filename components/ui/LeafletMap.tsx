'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Business, Place } from '@/types';
import { PLACE_CATEGORY_META } from '@/components/ui/PlaceCard';

interface LeafletMapProps {
  businesses?: Business[];
  places?: Place[];
  center?: [number, number];
  zoom?: number;
  selectedBusinessId?: string;
  selectedPlaceId?: string;
  radiusKm?: number;
  height?: string;
  addressQuery?: string;
  showCategoryFilters?: boolean;
}

const CATEGORY_PINS: Record<string, { bg: string; icon: string }> = {
  business: { bg: '#E36845', icon: '🏪' },
  saude: { bg: '#E11D48', icon: '🏥' },
  educacao: { bg: '#2563EB', icon: '🏫' },
  lazer: { bg: '#059669', icon: '🌳' },
  transporte: { bg: '#7C3AED', icon: '🚉' },
  servicos_publicos: { bg: '#0D9488', icon: '🏛️' },
  religiao: { bg: '#D97706', icon: '⛪' },
  cultura: { bg: '#DB2777', icon: '🎭' },
  outros: { bg: '#475569', icon: '📍' },
};

export const LeafletMap: React.FC<LeafletMapProps> = ({
  businesses = [],
  places = [],
  center = [-23.5424, -46.4178], // Default Guaianases SP
  zoom = 15,
  selectedBusinessId,
  selectedPlaceId,
  radiusKm,
  height = '440px',
  addressQuery,
  showCategoryFilters = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [mapLoaded, setMapLoaded] = useState(false);

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

    // Load Leaflet dynamically on client
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Fix default Leaflet icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Cleanup existing map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        scrollWheelZoom: false,
      });
      mapInstanceRef.current = map;

      // OpenStreetMap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      setMapLoaded(true);

      // Force size recalculation to prevent blank tiles
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);

      const createPinIcon = (bg: string, icon: string) => {
        return L.divIcon({
          className: 'custom-map-pin',
          html: `<div style="background-color: ${bg}; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(14,59,67,0.35); font-weight: bold; font-size: 14px; cursor: pointer; transition: transform 0.2s;">${icon}</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 34],
          popupAnchor: [0, -34],
        });
      };

      // Filtered Businesses
      const showBusinesses = activeFilter === 'all' || activeFilter === 'negocio';
      if (showBusinesses) {
        businesses.forEach((biz) => {
          if (!biz.latitude || !biz.longitude) return;

          const businessUrl = `/${biz.state_id.toLowerCase()}/${biz.city?.slug || 'sao-paulo'}/${biz.neighborhood?.slug || 'bairro'}/${biz.slug}`;
          const pin = CATEGORY_PINS.business;
          const marker = L.marker([biz.latitude, biz.longitude], {
            icon: createPinIcon(pin.bg, pin.icon),
          }).addTo(map);

          const popupContent = `
            <div style="font-family: sans-serif; min-width: 220px; padding: 6px;">
              <span style="display:inline-block; font-size:10px; font-weight:800; background:#E36845; color:#fff; padding:2px 8px; border-radius:12px; margin-bottom:4px;">COMÉRCIO / SERVIÇO</span>
              <div style="font-weight: 900; font-size: 14px; color: #0E3B43; margin-bottom: 2px;">${biz.name}</div>
              <div style="font-size: 11px; color: #4FA6A6; font-weight: 700; margin-bottom: 4px;">${biz.category?.name || 'Local'}</div>
              <div style="font-size: 12px; color: #537379; margin-bottom: 8px;">${biz.address || ''}${biz.number ? `, ${biz.number}` : ''}</div>
              <a href="${businessUrl}" style="display: block; text-align: center; background: #E36845; color: white; font-size: 12px; font-weight: bold; padding: 7px 12px; border-radius: 8px; text-decoration: none;">Ver Estabelecimento</a>
            </div>
          `;

          marker.bindPopup(popupContent);

          if (selectedBusinessId && biz.id === selectedBusinessId) {
            marker.openPopup();
          }
        });
      }

      // Filtered Places
      places.forEach((place) => {
        if (!place.latitude || !place.longitude) return;

        const matchesFilter =
          activeFilter === 'all' ||
          activeFilter === 'places_all' ||
          activeFilter === place.category_group;

        if (!matchesFilter) return;

        const pin = CATEGORY_PINS[place.category_group] || CATEGORY_PINS.outros;
        const meta = PLACE_CATEGORY_META[place.category_group] || PLACE_CATEGORY_META.outros;
        const placeUrl = `/lugares/${place.slug}`;
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;

        const marker = L.marker([place.latitude, place.longitude], {
          icon: createPinIcon(pin.bg, pin.icon),
        }).addTo(map);

        const popupContent = `
          <div style="font-family: sans-serif; min-width: 230px; padding: 6px;">
            <span style="display:inline-block; font-size:10px; font-weight:800; background:${pin.bg}; color:#fff; padding:2px 8px; border-radius:12px; margin-bottom:4px;">${meta.label.toUpperCase()}</span>
            <div style="font-weight: 900; font-size: 14px; color: #0E3B43; margin-bottom: 2px;">${place.name}</div>
            <div style="font-size: 11px; color: #0D9488; font-weight: 700; margin-bottom: 4px;">${place.subcategory || 'Utilidade Pública'}</div>
            <div style="font-size: 12px; color: #537379; margin-bottom: 8px;">${place.address}${place.number ? `, ${place.number}` : ''}</div>
            <div style="display: flex; gap: 6px;">
              <a href="${placeUrl}" style="flex: 1; text-align: center; background: #0E3B43; color: white; font-size: 11px; font-weight: bold; padding: 6px 8px; border-radius: 8px; text-decoration: none;">Ver Detalhes</a>
              <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background: #0D9488; color: white; font-size: 11px; font-weight: bold; padding: 6px 8px; border-radius: 8px; text-decoration: none;">Como Chegar</a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);

        if (selectedPlaceId && place.id === selectedPlaceId) {
          marker.openPopup();
        }
      });

      // Draw radius circle if specified
      if (radiusKm && center) {
        L.circle(center, {
          color: '#E36845',
          fillColor: '#4FA6A6',
          fillOpacity: 0.12,
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
  }, [businesses, places, center, zoom, selectedBusinessId, selectedPlaceId, radiusKm, activeFilter]);

  if (addressQuery) {
    const queryParam = encodeURIComponent(addressQuery);
    return (
      <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[#4FA6A6]/30 shadow-sm bg-stone-100" style={{ height }}>
        <iframe
          title="Mapa de Localização"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={`https://maps.google.com/maps?q=${queryParam}&z=${zoom}&output=embed`}
          className="w-full h-full border-0 pointer-events-auto opacity-100"
        />
      </div>
    );
  }

  const hasPlaces = places && places.length > 0;

  return (
    <div className="relative w-full flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden border border-[#4FA6A6]/30 shadow-sm bg-stone-100">
      {/* Category Pills Bar on Map */}
      {showCategoryFilters && (
        <div className="bg-white/95 backdrop-blur-md px-3 py-2 border-b border-[#E8E4DA] flex items-center gap-1.5 overflow-x-auto no-scrollbar z-20">
          <span className="text-[11px] font-bold text-[#537379] shrink-0 mr-1">Filtrar mapa:</span>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeFilter === 'all'
                ? 'bg-[#0E3B43] text-white shadow-sm'
                : 'bg-stone-100 text-[#0E3B43] hover:bg-stone-200'
            }`}
          >
            Tudo ({businesses.length + places.length})
          </button>
          {businesses.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('negocio')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                activeFilter === 'negocio'
                  ? 'bg-[#E36845] text-white shadow-sm'
                  : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
              }`}
            >
              <span>🏪 Comércios</span>
              <span>({businesses.length})</span>
            </button>
          )}
          {hasPlaces && (
            <>
              <button
                type="button"
                onClick={() => setActiveFilter('saude')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                  activeFilter === 'saude'
                    ? 'bg-[#E11D48] text-white shadow-sm'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
              >
                <span>🏥 Saúde</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('transporte')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                  activeFilter === 'transporte'
                    ? 'bg-[#7C3AED] text-white shadow-sm'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                }`}
              >
                <span>🚉 Transporte</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('lazer')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                  activeFilter === 'lazer'
                    ? 'bg-[#059669] text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <span>🌳 Lazer</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('educacao')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                  activeFilter === 'educacao'
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                }`}
              >
                <span>🏫 Educação</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('servicos_publicos')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                  activeFilter === 'servicos_publicos'
                    ? 'bg-[#0D9488] text-white shadow-sm'
                    : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                }`}
              >
                <span>🏛️ Serviços</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Map Body */}
      <div className="relative w-full" style={{ height }}>
        {/* Iframe fallback when Leaflet is not yet rendered */}
        {!mapLoaded && (
          <div className="absolute inset-0 z-0">
            <iframe
              title="Mapa de Localização"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={`https://maps.google.com/maps?q=${center[0] || -23.5424},${center[1] || -46.4178}&z=${zoom}&output=embed`}
              className="w-full h-full border-0 pointer-events-auto opacity-95"
            />
          </div>
        )}

        {/* Leaflet Dynamic Layer */}
        <div
          ref={mapContainerRef}
          style={{ height: '100%', width: '100%' }}
          className="relative z-10 w-full h-full"
        />
      </div>
    </div>
  );
};
