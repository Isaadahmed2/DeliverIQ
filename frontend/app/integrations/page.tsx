'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, Sheet, CheckCircle2, RefreshCw, QrCode } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';

export default function IntegrationsPage() {
  const router = useRouter();
  const [waStatus, setWaStatus] = useState<any>(null);
  const [waInstances, setWaInstances] = useState<any[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>('auto');
  const [waQr, setWaQr] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState('');
  const [hubspotToken, setHubspotToken] = useState('');
  const [loadingWa, setLoadingWa] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

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

  const handleSaveIntegration = async (provider: string, config: any) => {
    try {
      const res = await fetchWithAuth('/integrations/', {
        method: 'POST',
        body: JSON.stringify({ provider, config, is_active: true })
      });
      if (res.ok) {
        setSavedMessage(`Saved ${provider} configuration successfully!`);
        setTimeout(() => setSavedMessage(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
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
            {/* Instance Selector */}
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
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Sheet className="w-6 h-6" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-white">Google Sheets Two-Way Sync</h3>
              <p className="text-xs text-slate-400">Pulls incoming orders and automatically writes back DeliverIQ safety scores & status</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Google Spreadsheet ID or URL</label>
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => handleSaveIntegration('google_sheets', { sheet_url: sheetUrl })}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
            >
              Save Google Sheet Sync
            </button>
          </div>
        </div>

        {/* 3. HubSpot CRM */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              ⚡
            </span>
            <div>
              <h3 className="font-bold text-sm text-white">HubSpot Free CRM Integration</h3>
              <p className="text-xs text-slate-400">Updates HubSpot Deal stages (Pending $\rightarrow$ Verified / Escalated) automatically</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">HubSpot Private App Access Token</label>
              <input
                type="password"
                placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={hubspotToken}
                onChange={(e) => setHubspotToken(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => handleSaveIntegration('hubspot', { token: hubspotToken })}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
            >
              Save HubSpot Connection
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
