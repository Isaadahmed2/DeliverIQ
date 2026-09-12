'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, Sheet, CheckCircle2, RefreshCw, QrCode, Download, Sparkles, Copy } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';

export default function IntegrationsPage() {
  const router = useRouter();
  const [waStatus, setWaStatus] = useState<any>(null);
  const [waInstances, setWaInstances] = useState<any[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>('auto');
  const [waQr, setWaQr] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState('');
  const [syncingSheet, setSyncingSheet] = useState(false);
  const [hubspotToken, setHubspotToken] = useState('');
  const [loadingWa, setLoadingWa] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [syncedOrdersInfo, setSyncedOrdersInfo] = useState<any>(null);

  const checkWhatsApp = async () => {
    try {
      setLoadingWa(true);
      const [statusRes, instRes] = await Promise.all([
        fetchWithAuth(`/integrations/whatsapp/status?instance_name=${selectedInstance}`),
        fetchWithAuth('/integrations/whatsapp/instances')
      ]);

      if (statusRes.ok) {
        const data = await statusRes.json();
        setWaStatus(data);
      }
      if (instRes.ok) {
        const list = await instRes.json();
        setWaInstances(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWa(false);
    }
  };

  const fetchQr = async () => {
    try {
      setLoadingWa(true);
      const target = selectedInstance === 'auto' ? 'deliveriq_main' : selectedInstance;
      const res = await fetchWithAuth(`/integrations/whatsapp/qr?instance_name=${target}`);
      if (res.ok) {
        const data = await res.json();
        if (data.base64) {
          setWaQr(data.base64);
        } else if (data.qrcode?.base64) {
          setWaQr(data.qrcode.base64);
        } else if (data.connected) {
          setSavedMessage(data.message || 'WhatsApp is already connected!');
          setTimeout(() => setSavedMessage(''), 3000);
          await checkWhatsApp();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWa(false);
    }
  };

  useEffect(() => {
    checkWhatsApp();
  }, [selectedInstance]);

  const handleSyncGoogleSheet = async () => {
    if (!sheetUrl) return;
    try {
      setSyncingSheet(true);
      setSyncedOrdersInfo(null);
      const res = await fetchWithAuth('/integrations/google-sheets/sync', {
        method: 'POST',
        body: JSON.stringify({ sheet_url: sheetUrl })
      });
      const data = await res.json();
      if (res.ok) {
        setSyncedOrdersInfo(data);
        setSavedMessage(`Successfully synced ${data.synced_count} orders from Google Sheet!`);
        setTimeout(() => setSavedMessage(''), 4000);
      } else {
        alert(data.detail || 'Failed to sync sheet. Ensure link sharing is set to Anyone with link can view.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncingSheet(false);
    }
  };

  const copyTemplateCsv = () => {
    const csvContent = `External_Order_ID,Customer_Name,Customer_Phone,Shipping_Address,City,COD_Amount
ORD-PK-9001,Saad Ahmed,+923410015303,House #14 Street 5 near Jamia Masjid Gulberg 3,Lahore,3500
ORD-PK-9002,Saad Enterprise,+923455113612,Flat 304 Block 13-D near Meezan Bank Gulshan-e-Iqbal,Karachi,4800
ORD-PK-9003,Saad Test Remote,+923410015303,main bazar near river bridge,Turbat,18500
ORD-PK-9004,Saad VIP Order,+923455113612,House 22 Street 10 Sector F-7/2,Islamabad,2900`;
    navigator.clipboard.writeText(csvContent);
    setSavedMessage('Sample table copied to clipboard! Paste into Google Sheets.');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="font-bold text-base text-white">Store Integrations Setup</h1>
          </div>
          {savedMessage && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {savedMessage}
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* 1. Evolution API WhatsApp Integration */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <MessageSquare className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-white">WhatsApp Business (Evolution API)</h3>
                <p className="text-xs text-slate-400">Runs autonomous confirmations & landmark proposals</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                waStatus?.connected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${waStatus?.connected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></span>
                {waStatus?.connected ? `Connected (${waStatus.instance})` : 'Disconnected'}
              </span>
              <button
                onClick={checkWhatsApp}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400"
                title="Check Connection"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingWa ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            {waInstances.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Active WhatsApp Instances Detected in Evolution API:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedInstance('auto')}
                    className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                      selectedInstance === 'auto'
                        ? 'border-indigo-500 bg-indigo-500/10 text-white font-bold'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    <p className="font-semibold">⚡ Auto-Detect</p>
                    <p className="text-[10px] text-slate-400">Picks open instance automatically</p>
                  </button>
                  {waInstances.map((inst, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedInstance(inst.name)}
                      className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                        selectedInstance === inst.name
                          ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold'
                          : 'border-slate-800 bg-slate-900 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono">{inst.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          inst.connectionStatus === 'open' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {inst.connectionStatus}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {waStatus?.connected ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                WhatsApp is live and connected via instance <strong>{waStatus.instance}</strong>. The platform is ready to send confirmations!
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <button
                  onClick={fetchQr}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" /> Scan QR to Connect WhatsApp
                </button>
                {waQr && (
                  <div className="p-2 bg-white rounded-xl shadow-lg">
                    <img src={waQr} alt="WhatsApp QR Code" className="w-44 h-44" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. Google Sheets Integration */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Sheet className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-white">Google Sheets Two-Way Order Ingestion</h3>
                <p className="text-xs text-slate-400">Syncs your customer orders and triggers multi-agent AI verification</p>
              </div>
            </div>
            <button
              onClick={copyTemplateCsv}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-400" /> Copy Sample Table
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Google Spreadsheet Shareable URL (Set link access to: &quot;Anyone with link can view&quot;)
              </label>
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSyncGoogleSheet}
                disabled={syncingSheet || !sheetUrl}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${syncingSheet ? 'animate-spin' : ''}`} />
                {syncingSheet ? 'Ingesting & Scoring Orders...' : '⚡ Ingest & Run Agents on Google Sheet'}
              </button>
            </div>

            {syncedOrdersInfo && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                <p className="font-bold mb-1">✅ Ingested {syncedOrdersInfo.synced_count} Orders:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                  {syncedOrdersInfo.orders?.map((o: any, idx: number) => (
                    <li key={idx}>
                      <strong>{o.order_id}</strong> — {o.customer} ({o.phone}) | Score: <strong>{o.score} pts</strong> ({o.status})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
