'use client';

import React from 'react';
import { X, CheckCircle2, AlertTriangle, MessageSquare, MapPin, Bot, Clock } from 'lucide-react';

interface CaseAuditModalProps {
  order: any;
  onClose: () => void;
  onSimulateReply: (orderId: string, reply: string) => void;
}

export default function CaseAuditModal({ order, onClose, onSimulateReply }: CaseAuditModalProps) {
  if (!order) return null;

  const isSafe = order.risk_score >= 80;
  const isHighRisk = order.risk_score < 50;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <span className={`p-2 rounded-xl ${isSafe ? 'bg-emerald-500/10 text-emerald-400' : isHighRisk ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
              <Bot className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Order #{order.external_order_id}
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  order.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' :
                  order.status === 'CANCELLED' ? 'bg-rose-500/20 text-rose-300' :
                  'bg-amber-500/20 text-amber-300'
                }`}>
                  {order.status}
                </span>
              </h2>
              <p className="text-xs text-slate-400">{order.customer_name} • {order.city} • PKR {order.cod_amount?.toLocaleString()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Risk Score & Reason Factors */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Risk Assessment</span>
              <span className="text-sm font-bold text-white">Score: {order.risk_score} / 100</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-3">
              <div
                className={`h-full ${isSafe ? 'bg-emerald-500' : isHighRisk ? 'bg-rose-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, Math.max(5, order.risk_score))}%` }}
              ></div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-300">Signals Evaluated:</p>
              {order.risk_factors?.map((factor: string, idx: number) => (
                <p key={idx} className="text-xs text-slate-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  {factor}
                </p>
              ))}
            </div>
          </div>

          {/* Delivery Address & Nearby OSM Landmarks */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Address & Drop Anchors</p>
            <p className="text-sm text-slate-200">{order.shipping_address}</p>
            
            {order.nearby_landmarks && order.nearby_landmarks.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800/80">
                <p className="text-xs font-semibold text-indigo-400 flex items-center gap-1 mb-2">
                  <MapPin className="w-3.5 h-3.5" /> OpenStreetMap Nearby Landmarks Identified:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {order.nearby_landmarks.map((lm: any, idx: number) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                      <p className="font-semibold text-slate-200 truncate">{lm.name}</p>
                      <p className="text-[10px] text-slate-400">{lm.type}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Agent Execution Timeline */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> Multi-Agent Execution Audit Log
            </p>
            <div className="space-y-2">
              {order.agent_executions?.map((exec: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 font-mono">{exec.agent_name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">{exec.status}</span>
                  </div>
                  <p className="text-xs text-slate-300"><strong>Thought:</strong> {exec.thought}</p>
                  <p className="text-xs text-slate-400"><strong>Action:</strong> {exec.action_taken}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer / Simulation Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Simulate Customer WhatsApp Reply:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSimulateReply(order.id, 'confirm')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              Confirm Order (+25 pts)
            </button>
            <button
              onClick={() => onSimulateReply(order.id, 'cancel')}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
            >
              Cancel Order (Save COD)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
