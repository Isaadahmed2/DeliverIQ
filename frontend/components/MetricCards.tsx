'use client';

import React from 'react';
import { ShieldAlert, TrendingUp, DollarSign, Activity } from 'lucide-react';

interface MetricsProps {
  data: {
    total_orders: number;
    average_risk_score: number;
    delivery_success_rate: number;
    approved_count: number;
    in_confirmation_count: number;
    cancelled_count: number;
    escalated_count: number;
    estimated_pkr_saved: number;
  } | null;
  loading: boolean;
}

export default function MetricCards({ data, loading }: MetricsProps) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-900/60 border border-slate-800/80"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Avg Risk Score */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Risk Safety Index</p>
          <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Activity className="w-5 h-5" />
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white tracking-tight">{data.average_risk_score}</span>
          <span className="text-sm font-medium text-slate-400">/ 100</span>
        </div>
        <p className="mt-1 text-xs text-indigo-400 font-medium">Pre-dispatch risk calibrated</p>
      </div>

      {/* 2. Success Rate */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Delivery Success</p>
          <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-emerald-400 tracking-tight">
            {data.delivery_success_rate}%
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400 font-medium">{data.approved_count} orders directly dispatchable</p>
      </div>

      {/* 3. Estimated PKR Saved */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avoided RTO Losses</p>
          <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <DollarSign className="w-5 h-5" />
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-sm font-bold text-amber-400">PKR</span>
          <span className="text-3xl font-bold text-white tracking-tight">
            {data.estimated_pkr_saved.toLocaleString()}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400 font-medium">Saved from wasted courier charges</p>
      </div>

      {/* 4. Total Orders & Confirmation Queue */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tackled by Agents</p>
          <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white tracking-tight">{data.total_orders}</span>
          <span className="text-xs font-medium text-amber-400">({data.in_confirmation_count} in WA)</span>
        </div>
        <p className="mt-1 text-xs text-slate-400 font-medium">{data.escalated_count} escalated to owner</p>
      </div>
    </div>
  );
}
