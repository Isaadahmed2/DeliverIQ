'use client';

import React, { useEffect, useRef, useState } from 'react';

interface OrderPin {
  id: string;
  external_order_id: string;
  customer_name: string;
  city: string;
  cod_amount: number;
  risk_score: number;
  risk_tier: string;
  status: string;
  latitude?: number;
  longitude?: number;
  nearby_landmarks?: Array<{ name: string; type: string }>;
}

interface MapProps {
  orders: OrderPin[];
  onSelectOrder?: (order: OrderPin) => void;
}

export default function RiskMap({ orders, onSelectOrder }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    const initMap = async () => {
      const L = (await import('leaflet')).default || (await import('leaflet'));

      if (!mapContainerRef.current) return;

      // Fix missing Leaflet marker icons issue in webpack/Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current) {
        if ((mapContainerRef.current as any)._leaflet_id) {
          (mapContainerRef.current as any)._leaflet_id = null;
        }
        const map = L.map(mapContainerRef.current, {
          center: [30.3753, 69.3451], // Centered on Pakistan
          zoom: 5.5,
          minZoom: 4,
          maxZoom: 18,
          zoomControl: false,
        });

        // OpenStreetMap standard tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);
        mapInstanceRef.current = map;
        setTimeout(() => {
          try {
            map.invalidateSize();
          } catch (e) {}
        }, 300);
        if (isMounted) setMapLoaded(true);
      }

      const map = mapInstanceRef.current;
      if (!map) return;
      try {
        map.invalidateSize();
      } catch (e) {}

      // Clear existing markers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.CircleMarker) {
          map.removeLayer(layer);
        }
      });

      // Plot orders
      orders.forEach((order) => {
        const lat = order.latitude || 31.5204;
        const lon = order.longitude || 74.3587;

        let color = '#10B981'; // Green: Safe >= 80
        if (order.risk_score < 50) {
          color = '#EF4444'; // Red: High Risk < 50
        } else if (order.risk_score < 80) {
          color = '#F59E0B'; // Amber: In confirmation 50-79
        }

        const marker = L.circleMarker([lat, lon], {
          radius: 9,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        }).addTo(map);

        const popupContent = `
          <div style="font-family: sans-serif; min-width: 190px; color: #0f172a; padding: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong style="font-size: 13px;">${order.external_order_id}</strong>
              <span style="background: ${color}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">
                ${order.risk_score} pts
              </span>
            </div>
            <div style="font-size: 12px; margin-bottom: 3px;"><strong>Customer:</strong> ${order.customer_name}</div>
            <div style="font-size: 12px; margin-bottom: 3px;"><strong>City:</strong> ${order.city}</div>
            <div style="font-size: 12px; margin-bottom: 3px;"><strong>COD:</strong> PKR ${order.cod_amount?.toLocaleString()}</div>
            <div style="font-size: 11px; margin-top: 6px; color: #475569; border-top: 1px solid #cbd5e1; padding-top: 4px;">
              Status: <strong>${order.status}</strong>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('click', () => {
          if (onSelectOrder) onSelectOrder(order);
        });
      });
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, [orders, onSelectOrder]);

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden glass-panel border border-slate-800">
      {/* Top Map Header Pill */}
      <div className="absolute top-4 left-4 z-[500] px-3.5 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-800 text-xs font-semibold flex items-center gap-2 shadow-lg">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="text-slate-200">OpenStreetMap — Live Delivery Heatmap ({orders.length} locations)</span>
      </div>

      {/* Legend Pill */}
      <div className="absolute bottom-4 left-4 z-[500] px-3 py-2 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 text-xs flex items-center gap-4 shadow-lg">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span className="text-slate-200">Safe (≥ 80)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span className="text-slate-200">Verifying (50-79)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500"></span>
          <span className="text-slate-200">High Risk (&lt; 50)</span>
        </div>
      </div>

      <div ref={mapContainerRef} className="w-full h-full bg-slate-900" />
    </div>
  );
}
