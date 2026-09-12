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

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect and create a fresh WhatsApp connection?')) return;
    try {
      setLoadingWa(true);
      await fetchWithAuth('/integrations/whatsapp/disconnect', { method: 'POST' });
      setWaStatus({ connected: false });
      setWaQr(null);
      await fetchQr();
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
ORD-PK-9004,Saad VIP Order,+923455113612,House 22 Street 10 Sector F-7/2,Islamabad,12000
ORD-PK-9005,Usman Gujjar,+923001122334,D-Type Colony Samundri Road,Faisalabad,4200
ORD-PK-9006,Bilal Tariq,+923334445566,Near Karkhano Market Hayatabad Phase 3,Peshawar,5900`;
    navigator.clipboard.writeText(csvContent);
    setSavedMessage('Copied 6-order Pakistani sample CSV to clipboard!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="font-extrabold text-base text-white tracking-tight">
              Data &amp; Channel Integrations
            </h1>
          </div>
          {savedMessage && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-in fade-in">
              {savedMessage}
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* 1. Evolution API WhatsApp Integration */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <MessageSquare className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-white">WhatsApp Business (Evolution API)</h3>
                <p className="text-xs text-slate-400">Dedicated DeliverIQ Instance: <code className="text-emerald-400 font-mono">deliveriq_main</code></p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                waStatus?.connected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${waStatus?.connected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></span>
                {waStatus?.connected ? `Connected (${waStatus.instance})` : 'Awaiting Connection'}
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
            {waStatus?.connected ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>WhatsApp is connected via <strong className="font-mono">{waStatus.instance}</strong>. Orders for 03455113612 and 03410015303 will be sent live!</span>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-all flex-shrink-0"
                >
                  Disconnect &amp; Reset
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
                <div className="space-y-2">
                  <button
                    onClick={fetchQr}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <QrCode className="w-4 h-4" /> {waQr ? 'Refresh QR Code' : 'Scan QR to Connect WhatsApp'}
                  </button>
                  <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                    Open WhatsApp on your phone &gt; Settings &gt; Linked Devices &gt; Link a Device, then scan this QR code to connect.
                  </p>
                </div>
                {waQr && (
                  <div className="p-3 bg-white rounded-2xl shadow-2xl border-4 border-emerald-500/40 flex flex-col items-center">
                    <img src={waQr} alt="WhatsApp QR Code" className="w-48 h-48" />
                    <p className="text-center text-[10px] text-slate-800 font-bold mt-1.5">DeliverIQ Official Pair</p>
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
