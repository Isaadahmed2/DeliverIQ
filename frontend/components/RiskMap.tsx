'use client';

import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

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

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let L: any;
    let isMounted = true;

    import('leaflet').then((leafletModule) => {
      if (!isMounted) return;
      L = leafletModule.default || leafletModule;

      if (!mapInstanceRef.current) {
        // Center on Pakistan: [30.3753, 69.3451]
        const map = L.map(mapContainerRef.current, {
          center: [30.3753, 69.3451],
          zoom: 5.5,
          minZoom: 4,
          maxZoom: 18,
          zoomControl: false,
        });

        // Add CartoDB Dark Matter free tiles for high-contrast glassmorphic aesthetic
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);
        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      // Clear existing markers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.CircleMarker) {
          map.removeLayer(layer);
        }
      });

      // Plot orders
      orders.forEach((order) => {
        if (!order.latitude || !order.longitude) return;

        let color = '#10B981'; // Green: Safe >= 80
        if (order.risk_score < 50) {
          color = '#EF4444'; // Red: High Risk < 50
        } else if (order.risk_score < 80) {
          color = '#F59E0B'; // Amber: In confirmation 50-79
        }

        const marker = L.circleMarker([order.latitude, order.longitude], {
          radius: 8,
          fillColor: color,
          color: '#ffffff',
          weight: 1.5,
          opacity: 0.9,
          fillOpacity: 0.85,
        }).addTo(map);

        const popupContent = `
          <div style="font-family: sans-serif; min-width: 180px; color: #0f172a; padding: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong style="font-size: 13px;">${order.external_order_id}</strong>
              <span style="background: ${color}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">
                ${order.risk_score} pts
              </span>
            </div>
            <div style="font-size: 12px; margin-bottom: 3px;"><strong>Customer:</strong> ${order.customer_name}</div>
            <div style="font-size: 12px; margin-bottom: 3px;"><strong>City:</strong> ${order.city}</div>
            <div style="font-size: 12px; margin-bottom: 3px;"><strong>COD:</strong> PKR ${order.cod_amount.toLocaleString()}</div>
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
    });

    return () => {
      isMounted = false;
    };
  }, [orders, onSelectOrder]);

  return (
    <div className="relative w-full h-[480px] rounded-2xl overflow-hidden glass-panel border border-slate-800">
      {/* Top Map Header Pill */}
      <div className="absolute top-4 left-4 z-[500] px-3.5 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs font-semibold flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="text-slate-300">Live Delivery Risk Heatmap</span>
      </div>

      {/* Legend Pill */}
      <div className="absolute bottom-4 left-4 z-[500] px-3 py-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-xs flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span className="text-slate-300">Safe (≥ 80)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span className="text-slate-300">Verifying (50-79)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500"></span>
          <span className="text-slate-300">High Risk (&lt; 50)</span>
        </div>
      </div>

      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
