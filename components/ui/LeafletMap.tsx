'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMapInstance } from 'leaflet';
import { Business, Place } from '@/types';
import { PLACE_CATEGORY_META } from '@/lib/places';

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
  esporte: { bg: '#0284C7', icon: '🏃' },
  turismo: { bg: '#EA580C', icon: '🗺️' },
  transporte: { bg: '#7C3AED', icon: '🚉' },
  servicos_publicos: { bg: '#0D9488', icon: '🏛️' },
  religiao: { bg: '#D97706', icon: '⛪' },
  cultura: { bg: '#DB2777', icon: '🎭' },
  outros: { bg: '#475569', icon: '📍' },
};

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  businesses = [],
  places = [],
  center = [-23.5424, -46.4178], // Default Guaianases SP
  zoom = 15,
  selectedBusinessId,
  selectedPlaceId,
  radiusKm,
  height = '420px',
  addressQuery,
  showCategoryFilters = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMapInstance | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [mapLoaded, setMapLoaded] = useState(false);

  const centerLat = center?.[0] ?? -23.5424;
  const centerLng = center?.[1] ?? -46.4178;
  const availablePlaceGroups = (Object.keys(PLACE_CATEGORY_META) as Array<keyof typeof PLACE_CATEGORY_META>)
    .map((group) => ({
      group,
      count: places.filter((place) => place.category_group === group).length,
    }))
    .filter(({ count }) => count > 0);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;
    let resizeObserver: ResizeObserver | null = null;

    import('leaflet')
      .then((LModule) => {
        if (!isMounted || !mapContainerRef.current) return;
        const L = LModule.default;

        if (!L || typeof L.map !== 'function') {
          console.warn('[LeafletMap] L.map is not available');
          return;
        }

        // Cleanup existing map instance
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove();
          } catch (err) {
            console.warn('[LeafletMap] Error removing old instance:', err);
          }
          mapInstanceRef.current = null;
        }

        // Clean container DOM and delete any existing Leaflet marker.
        if (mapContainerRef.current) {
          const container = mapContainerRef.current as HTMLDivElement & { _leaflet_id?: number };
          if (container._leaflet_id) {
            delete container._leaflet_id;
          }
          mapContainerRef.current.innerHTML = '';
        }

        const safeCenter: [number, number] = [
          typeof centerLat === 'number' && !isNaN(centerLat) ? centerLat : -23.5424,
          typeof centerLng === 'number' && !isNaN(centerLng) ? centerLng : -46.4178,
        ];

        const map = L.map(mapContainerRef.current, {
          center: safeCenter,
          zoom,
          scrollWheelZoom: false,
        });
        mapInstanceRef.current = map;

        // OpenStreetMap Standard Tiles
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        setMapLoaded(true);

        // Force size recalculation to prevent blank or grey tiles
        const triggerInvalidate = () => {
          if (mapInstanceRef.current) {
            try {
              mapInstanceRef.current.invalidateSize();
            } catch {
              // ignore
            }
          }
        };

        triggerInvalidate();
        setTimeout(triggerInvalidate, 120);
        setTimeout(triggerInvalidate, 350);
        setTimeout(triggerInvalidate, 800);

        if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
          try {
            resizeObserver = new ResizeObserver(() => {
              triggerInvalidate();
            });
            resizeObserver.observe(mapContainerRef.current);
          } catch {
            // ignore
          }
        }

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
            if (!Number.isFinite(biz.latitude) || !Number.isFinite(biz.longitude)) return;

            const businessUrl = `/${biz.state_id.toLowerCase()}/${biz.city?.slug || 'sao-paulo'}/${biz.neighborhood?.slug || 'bairro'}/${biz.slug}`;
            const pin = CATEGORY_PINS.business;
            const marker = L.marker([biz.latitude, biz.longitude], {
              icon: createPinIcon(pin.bg, pin.icon),
            }).addTo(map);

            const popupContent = `
              <div style="font-family: sans-serif; min-width: 220px; padding: 6px;">
                <span style="display:inline-block; font-size:10px; font-weight:800; background:#E36845; color:#fff; padding:2px 8px; border-radius:12px; margin-bottom:4px;">COMÉRCIO / SERVIÇO</span>
                <div style="font-weight: 900; font-size: 14px; color: #0E3B43; margin-bottom: 2px;">${escapeHtml(biz.name)}</div>
                <div style="font-size: 11px; color: #4FA6A6; font-weight: 700; margin-bottom: 4px;">${escapeHtml(biz.category?.name || 'Local')}</div>
                <div style="font-size: 12px; color: #537379; margin-bottom: 8px;">${escapeHtml(biz.address || '')}${biz.number ? `, ${escapeHtml(biz.number)}` : ''}</div>
                <a href="${escapeHtml(businessUrl)}" style="display: block; text-align: center; background: #E36845; color: white; font-size: 12px; font-weight: bold; padding: 7px 12px; border-radius: 8px; text-decoration: none;">Ver Estabelecimento</a>
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
          if (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) return;

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
              <div style="font-weight: 900; font-size: 14px; color: #0E3B43; margin-bottom: 2px;">${escapeHtml(place.name)}</div>
              <div style="font-size: 11px; color: #0D9488; font-weight: 700; margin-bottom: 4px;">${escapeHtml(place.subcategory || 'Utilidade Pública')}</div>
              <div style="font-size: 12px; color: #537379; margin-bottom: 8px;">${escapeHtml(place.address)}${place.number ? `, ${escapeHtml(place.number)}` : ''}</div>
              <div style="display: flex; gap: 6px;">
                <a href="${escapeHtml(placeUrl)}" style="flex: 1; text-align: center; background: #0E3B43; color: white; font-size: 11px; font-weight: bold; padding: 6px 8px; border-radius: 8px; text-decoration: none;">Ver Detalhes</a>
                <a href="${escapeHtml(directionsUrl)}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background: #0D9488; color: white; font-size: 11px; font-weight: bold; padding: 6px 8px; border-radius: 8px; text-decoration: none;">Como Chegar</a>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);

          if (selectedPlaceId && place.id === selectedPlaceId) {
            marker.openPopup();
          }
        });

        // Draw radius circle if specified
        if (radiusKm && safeCenter) {
          L.circle(safeCenter, {
            color: '#E36845',
            fillColor: '#4FA6A6',
            fillOpacity: 0.12,
            weight: 2,
            radius: radiusKm * 1000,
          }).addTo(map);
        }
      })
      .catch((err) => {
        console.error('[LeafletMap Init Error]', err);
      });

    return () => {
      isMounted = false;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }
    };
  }, [businesses, places, centerLat, centerLng, zoom, selectedBusinessId, selectedPlaceId, radiusKm, activeFilter]);

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
    <div
      className="relative w-full flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden border border-[#4FA6A6]/30 shadow-sm bg-stone-100"
      style={{ minHeight: height, height }}
    >
      {/* Category Pills Bar on Map */}
      {showCategoryFilters && (
        <div className="bg-white/95 backdrop-blur-md px-3 py-2 border-b border-[#E8E4DA] flex items-center gap-1.5 overflow-x-auto no-scrollbar z-20 shrink-0">
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
          {hasPlaces && availablePlaceGroups.map(({ group, count }) => {
            const meta = PLACE_CATEGORY_META[group];
            const pin = CATEGORY_PINS[group] || CATEGORY_PINS.outros;
            const selected = activeFilter === group;
            return (
              <button
                key={group}
                type="button"
                onClick={() => setActiveFilter(group)}
                style={selected ? { backgroundColor: meta.pinColor } : undefined}
                className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 border ${
                  selected
                    ? 'text-white shadow-sm border-transparent'
                    : meta.bg
                }`}
              >
                <span>{pin.icon} {meta.label}</span>
                <span>({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Map Body */}
      <div className="relative w-full flex-1 min-h-[280px]">
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
              src={`https://maps.google.com/maps?q=${centerLat},${centerLng}&z=${zoom}&output=embed`}
              className="w-full h-full border-0 pointer-events-auto opacity-95"
            />
          </div>
        )}

        {/* Leaflet Dynamic Layer */}
        <div
          ref={mapContainerRef}
          style={{ height: '100%', width: '100%', minHeight: '280px' }}
          className="relative z-10 w-full h-full"
        />
      </div>
    </div>
  );
};
