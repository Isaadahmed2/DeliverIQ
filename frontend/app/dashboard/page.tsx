'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, RefreshCw, Layers, ShieldCheck, CheckCircle, 
  AlertCircle, Smartphone, Database, LogOut, Sparkles, Filter, CheckSquare, Square
} from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';
import MetricCards from '@/components/MetricCards';
import RiskMap from '@/components/RiskMap';
import CaseAuditModal from '@/components/CaseAuditModal';

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoursFilter, setHoursFilter] = useState<number>(24);
  const [runningBatch, setRunningBatch] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Selective order selection state
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [mRes, oRes] = await Promise.all([
        fetchWithAuth(`/reports/metrics?hours=${hoursFilter}`),
        fetchWithAuth(`/orders/?hours=${hoursFilter}&limit=100`)
      ]);

      if (mRes.ok) {
        const mData = await mRes.json();
        setMetrics(mData);
      }
      if (oRes.ok) {
        const oData = await oRes.json();
        setOrders(oData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('deliveriq_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadDashboardData();
  }, [hoursFilter]);

  // Toggle single order selection
  const toggleSelectOrder = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedOrderIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map((o) => o.id));
    }
  };

  // Run agents on selective or batch window
  const handleRunBatchAgents = async (specificIds?: string[]) => {
    try {
      setRunningBatch(true);
      const targetIds = specificIds || (selectedOrderIds.length > 0 ? selectedOrderIds : undefined);
      
      const res = await fetchWithAuth('/orders/batch-run', {
        method: 'POST',
        body: JSON.stringify({ 
          hours: hoursFilter,
          order_ids: targetIds
        })
      });
      if (res.ok) {
        setSelectedOrderIds([]);
        await loadDashboardData();
      }
    } catch (err) {
      console.error('Error running batch agents:', err);
    } finally {
      setRunningBatch(false);
    }
  };

  const handleSimulateReply = async (orderId: string, reply: string) => {
    try {
      const res = await fetchWithAuth(`/orders/${orderId}/simulate-reply?reply=${reply}`, {
        method: 'POST'
      });
      if (res.ok) {
        await loadDashboardData();
        const updated = await (await fetchWithAuth(`/orders/?hours=${hoursFilter}&limit=100`)).json();
        const found = updated.find((o: any) => o.id === orderId);
        if (found) setSelectedOrder(found);
      }
    } catch (err) {
      console.error('Failed to simulate reply:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('deliveriq_token');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              📦
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-2">
                DeliverIQ
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                  AI Agents Active
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/integrations')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              Integrations (WhatsApp/Sheets)
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Filter & Batch Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl">
          {/* Time Window Buttons */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <span className="px-2.5 text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Filter className="w-3 h-3 text-indigo-400" /> Window:
            </span>
            {[6, 12, 18, 24].map((h) => (
              <button
                key={h}
                onClick={() => setHoursFilter(h)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  hoursFilter === h
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>

          {/* Selective or Batch Action Button */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => handleRunBatchAgents()}
              disabled={runningBatch || orders.length === 0}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all disabled:opacity-50 text-white ${
                selectedOrderIds.length > 0 
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 hover:opacity-95 shadow-indigo-600/25'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${runningBatch ? 'animate-spin' : ''}`} />
              {runningBatch
                ? 'Agents Executing Verification...'
                : selectedOrderIds.length > 0
                ? `⚡ Run AI Agents on ${selectedOrderIds.length} Selected Order${selectedOrderIds.length > 1 ? 's' : ''}`
                : `⚡ Run AI Agents on Last ${hoursFilter}h Orders (${orders.length})`
              }
            </button>
          </div>
        </div>

        {/* Executive KPI Cards */}
        <MetricCards data={metrics} loading={loading} />

        {/* Core Layout: Map + Live Orders Queue with Multi-Select */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Map (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <RiskMap orders={orders} onSelectOrder={(o) => setSelectedOrder(o)} />
          </div>

          {/* Right Column: Selectable Orders Queue (5 cols) */}
          <div className="lg:col-span-5 glass-panel p-5 rounded-2xl flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleSelectAll}
                  className="text-slate-400 hover:text-white"
                  title={selectedOrderIds.length === orders.length ? 'Deselect All' : 'Select All'}
                >
                  {selectedOrderIds.length > 0 && selectedOrderIds.length === orders.length ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                </button>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Orders ({selectedOrderIds.length > 0 ? `${selectedOrderIds.length} selected` : `${orders.length} total`})
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {selectedOrderIds.length > 0 ? (
                  <button 
                    onClick={() => setSelectedOrderIds([])}
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    Clear selection
                  </button>
                ) : 'Select to run agent'}
              </span>
            </div>

            {/* Orders Feed */}
            <div className="mt-3 flex-1 overflow-y-auto space-y-2.5 pr-1">
              {orders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <ShieldCheck className="w-8 h-8 mb-2 opacity-40 text-emerald-400" />
                  <p className="text-xs">No orders found in the last {hoursFilter} hours.</p>
                </div>
              ) : (
                orders.map((o) => {
                  const isSelected = selectedOrderIds.includes(o.id);
                  return (
                    <div
                      key={o.id}
                      onClick={() => setSelectedOrder(o)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-indigo-950/40 border-indigo-500/70 shadow-sm shadow-indigo-500/10' 
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <button 
                          onClick={(e) => toggleSelectOrder(e, o.id)} 
                          className="text-slate-400 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                          )}
                        </button>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white">{o.external_order_id}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              o.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                              o.status === 'CANCELLED' ? 'bg-rose-500/20 text-rose-400' :
                              'bg-amber-500/20 text-amber-400'
                            }`}>
                              {o.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate max-w-[190px]">{o.customer_name} • {o.city}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-sm font-extrabold font-mono ${
                          o.risk_score >= 80 ? 'text-emerald-400' :
                          o.risk_score < 50 ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          {o.risk_score} pts
                        </span>
                        <p className="text-[10px] text-slate-400">PKR {o.cod_amount?.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Case Audit & Inspection Modal */}
      {selectedOrder && (
        <CaseAuditModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSimulateReply={handleSimulateReply}
        />
      )}
    </div>
  );
}
