'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Monitor,
  MapPin,
  Clock,
} from 'lucide-react';

interface PopupConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  description: string;
  badgeText: string;
  badgeColor: string;
  scrollingTexts: string[];
  onlineLink: string;
  offlineLink: string;
  onlineLinkText: string;
  offlineLinkText: string;
  ctaButtonText: string;
  ctaButtonLink: string;
  showOnce: boolean;
  delaySeconds: number;
  imageUrl?: string;
  updatedAt?: string;
}

const DEFAULT_CONFIG: PopupConfig = {
  enabled: true,
  title: 'Register for Free Mock Test',
  subtitle: 'MSI Group of Institutes — Official Mock Test Series 2027',
  description:
    'Attempt Full-Length Mock Tests for CLAT, PCS-J (Judiciary) & AILET. Instant Scorecard, Ranking & PDF Download.',
  badgeText: 'FREE REGISTRATION',
  badgeColor: '#EFC988',
  scrollingTexts: [
    '🏛️ CLAT 2027 Free Mock Test — Register Now!',
    '⚖️ PCS-J (Judiciary) Mock Series — Online & Offline',
    '📋 AILET & Law Entrance Mock Tests Available',
    '🎯 All-India Ranking with Instant Scorecard',
    '📄 Free PDF Download with Answer Key',
  ],
  onlineLink: '/exam',
  offlineLink: '/contact',
  onlineLinkText: 'Register Online',
  offlineLinkText: 'Register Offline / Walk-In',
  ctaButtonText: 'Register for Free Mock Test',
  ctaButtonLink: '/exam',
  showOnce: false,
  delaySeconds: 3,
};

export default function HomePopupManager() {
  const [config, setConfig] = useState<PopupConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [newScrollText, setNewScrollText] = useState('');
  const [liveTicker, setLiveTicker] = useState({
    isLive: false,
    liveText: 'REGISTER FOR FREE MOCK TEST 2027 — OFFICIAL ONLINE CBT & ANSWER KEY',
    liveBadge: 'LIVE',
    liveLink: '/exam',
  });
  const [savingTicker, setSavingTicker] = useState(false);

  /* ── Load Config ── */
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/home-popup').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/live-ticker').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([popupData, tickerData]) => {
        if (popupData) setConfig({ ...DEFAULT_CONFIG, ...popupData });
        if (tickerData?.success && tickerData.config) setLiveTicker(tickerData.config);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveLiveTicker = async (nextLiveState?: boolean) => {
    setSavingTicker(true);
    const payload = {
      ...liveTicker,
      isLive: nextLiveState !== undefined ? nextLiveState : liveTicker.isLive,
    };
    try {
      const res = await fetch('/api/live-ticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        setLiveTicker(d.config);
        showToast(
          d.config.isLive
            ? '🔴 Top Live Ticker is now LIVE across the entire website!'
            : '⏹️ Top Live Ticker stopped.',
          'success'
        );
      } else {
        showToast('❌ Failed to update Live Ticker.', 'error');
      }
    } catch {
      showToast('❌ Network error updating Live Ticker.', 'error');
    } finally {
      setSavingTicker(false);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Save Config ── */
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/home-popup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        showToast('✅ Home Popup updated successfully! Changes are live.', 'success');
      } else {
        showToast('❌ Failed to save. Please try again.', 'error');
      }
    } catch {
      showToast('❌ Network error. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addScrollText = () => {
    if (!newScrollText.trim()) return;
    setConfig((prev) => ({
      ...prev,
      scrollingTexts: [...prev.scrollingTexts, newScrollText.trim()],
    }));
    setNewScrollText('');
  };

  const removeScrollText = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      scrollingTexts: prev.scrollingTexts.filter((_, i) => i !== idx),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-[#89190E]" />
        <span className="ml-2 text-sm text-gray-500">Loading popup config...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Top Live Ticker Broadcast Controller */}
      <div className="bg-gradient-to-r from-[#071B37] to-[#122d54] text-white p-6 rounded-2xl border border-[#EFC988]/40 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${liveTicker.isLive ? 'bg-red-500 animate-ping' : 'bg-gray-400'}`} />
              <h3 className="font-serif font-bold text-lg text-[#EFC988]">
                Top Screen Live Ticker Broadcast
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${liveTicker.isLive ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-300'}`}>
                {liveTicker.isLive ? '● LIVE ON WEBSITE' : '○ STOPPED'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Jo text aap yahan likh kar <strong>Start Live</strong> karenge, woh website ke top ticker par lagatar chalta rahega jab tak aap <strong>Stop / End Live</strong> na karein.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={savingTicker}
              onClick={() => handleSaveLiveTicker(!liveTicker.isLive)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                liveTicker.isLive
                  ? 'bg-amber-500 hover:bg-amber-600 text-[#071B37]'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {liveTicker.isLive ? '⏹️ Stop / End Live' : '🔴 Start Live'}
            </button>
            <button
              type="button"
              disabled={savingTicker}
              onClick={() => handleSaveLiveTicker()}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer"
            >
              Save Text
            </button>
          </div>
        </div>
        <div className="grid sm:grid-cols-4 gap-3">
          <input
            type="text"
            value={liveTicker.liveBadge}
            onChange={(e) => setLiveTicker((p) => ({ ...p, liveBadge: e.target.value }))}
            placeholder="Badge (e.g. LIVE)"
            className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-slate-400"
          />
          <input
            type="text"
            value={liveTicker.liveText}
            onChange={(e) => setLiveTicker((p) => ({ ...p, liveText: e.target.value }))}
            placeholder="Enter scrolling live announcement text..."
            className="sm:col-span-2 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-slate-400"
          />
          <input
            type="text"
            value={liveTicker.liveLink}
            onChange={(e) => setLiveTicker((p) => ({ ...p, liveLink: e.target.value }))}
            placeholder="Click Link (e.g. /exam)"
            className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-mono text-white placeholder-slate-400"
          />
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E8EEFF] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#89190E]" />
            <h2 className="text-xl font-serif font-black text-[#071B37]">
              Home Popup Manager
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                config.enabled
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}
            >
              {config.enabled ? '● LIVE' : '○ HIDDEN'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
            Manage the promotional popup that appears on the home screen for visitors.
            Updates here are reflected immediately on the live site.
          </p>
          {config.updatedAt && (
            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last updated: {new Date(config.updatedAt).toLocaleString('en-IN')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              config.enabled
                ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
            }`}
          >
            {config.enabled ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {config.enabled ? 'Disable Popup' : 'Enable Popup'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#89190E] hover:bg-[#6b1309] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Saving...' : 'Save & Publish'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Content Settings ── */}
        <div className="space-y-5">
          {/* Basic Content */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8EEFF] shadow-xs space-y-4">
            <h3 className="text-sm font-black text-[#071B37] border-b border-gray-100 pb-2">📝 Popup Content</h3>

            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Title *</label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig((p) => ({ ...p, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#89190E]/30"
                placeholder="Register for Free Mock Test"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Subtitle / Institute Name</label>
              <input
                type="text"
                value={config.subtitle}
                onChange={(e) => setConfig((p) => ({ ...p, subtitle: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#89190E]/30"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Description</label>
              <textarea
                rows={3}
                value={config.description}
                onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#89190E]/30 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Badge Text</label>
                <input
                  type="text"
                  value={config.badgeText}
                  onChange={(e) => setConfig((p) => ({ ...p, badgeText: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#89190E]/30"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Badge Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.badgeColor}
                    onChange={(e) => setConfig((p) => ({ ...p, badgeColor: e.target.value }))}
                    className="w-10 h-9 border border-gray-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.badgeColor}
                    onChange={(e) => setConfig((p) => ({ ...p, badgeColor: e.target.value }))}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#89190E]/30"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Scrolling Texts */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8EEFF] shadow-xs space-y-4">
            <h3 className="text-sm font-black text-[#071B37] border-b border-gray-100 pb-2">
              📢 Scrolling Marquee Texts
            </h3>
            <div className="space-y-2">
              {config.scrollingTexts.map((text, idx) => (
                <div key={idx} className="flex items-center gap-2 group">
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => {
                      const newTexts = [...config.scrollingTexts];
                      newTexts[idx] = e.target.value;
                      setConfig((p) => ({ ...p, scrollingTexts: newTexts }));
                    }}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#89190E]/30"
                  />
                  <button
                    onClick={() => removeScrollText(idx)}
                    className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newScrollText}
                onChange={(e) => setNewScrollText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addScrollText()}
                placeholder="Add scrolling text..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#89190E]/30"
              />
              <button
                onClick={addScrollText}
                className="px-3 py-2 bg-[#89190E] text-white rounded-xl text-xs font-bold hover:bg-[#6b1309] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: Links & Settings ── */}
        <div className="space-y-5">
          {/* Links */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8EEFF] shadow-xs space-y-4">
            <h3 className="text-sm font-black text-[#071B37] border-b border-gray-100 pb-2">
              🔗 Registration Links
            </h3>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
                <Monitor className="w-3.5 h-3.5" /> Online Registration
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Button Text</label>
                  <input
                    type="text"
                    value={config.onlineLinkText}
                    onChange={(e) => setConfig((p) => ({ ...p, onlineLinkText: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#89190E]/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Link URL</label>
                  <input
                    type="text"
                    value={config.onlineLink}
                    onChange={(e) => setConfig((p) => ({ ...p, onlineLink: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#89190E]/30"
                    placeholder="/exam or https://..."
                  />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
                <MapPin className="w-3.5 h-3.5" /> Offline / Walk-In Registration
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Button Text</label>
                  <input
                    type="text"
                    value={config.offlineLinkText}
                    onChange={(e) => setConfig((p) => ({ ...p, offlineLinkText: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#89190E]/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Link URL</label>
                  <input
                    type="text"
                    value={config.offlineLink}
                    onChange={(e) => setConfig((p) => ({ ...p, offlineLink: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#89190E]/30"
                    placeholder="/contact or https://..."
                  />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-red-50 border border-red-100 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-red-700">
                🎯 Main CTA Button
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={config.ctaButtonText}
                    onChange={(e) => setConfig((p) => ({ ...p, ctaButtonText: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#89190E]/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">CTA Button Link</label>
                  <input
                    type="text"
                    value={config.ctaButtonLink}
                    onChange={(e) => setConfig((p) => ({ ...p, ctaButtonLink: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#89190E]/30"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Behavior Settings */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8EEFF] shadow-xs space-y-4">
            <h3 className="text-sm font-black text-[#071B37] border-b border-gray-100 pb-2">
              ⚙️ Behavior Settings
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">
                  Delay (seconds)
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={config.delaySeconds}
                  onChange={(e) => setConfig((p) => ({ ...p, delaySeconds: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#89190E]/30"
                />
                <p className="text-[10px] text-gray-400 mt-1">Wait before showing popup</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Show Frequency</label>
                <select
                  value={config.showOnce ? 'once' : 'always'}
                  onChange={(e) => setConfig((p) => ({ ...p, showOnce: e.target.value === 'once' }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#89190E]/30"
                >
                  <option value="always">Every Visit</option>
                  <option value="once">Once per Session</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-1">Per session = won&apos;t repeat on refresh</p>
              </div>
            </div>

            {/* Enable/Disable toggle large */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
              <div>
                <p className="text-xs font-bold text-gray-700">Popup Status</p>
                <p className="text-[10px] text-gray-400">Toggle to show or hide popup on home page</p>
              </div>
              <button
                onClick={() => setConfig((p) => ({ ...p, enabled: !p.enabled }))}
                className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                  config.enabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    config.enabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Live Preview mini */}
          <div className="bg-gradient-to-br from-[#0A1628] to-[#10233F] p-4 rounded-2xl border border-[#EFC988]/30 space-y-3">
            <h3 className="text-xs font-black text-[#EFC988]">👁️ Live Preview</h3>
            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div
                className="p-3 text-center"
                style={{ background: 'linear-gradient(135deg, #89190E, #EFC988)' }}
              >
                <div
                  className="inline-block px-3 py-1 rounded-full text-[10px] font-black text-[#10233F] mb-1"
                  style={{ background: config.badgeColor }}
                >
                  {config.badgeText || 'BADGE'}
                </div>
                <div className="text-white text-sm font-black">{config.title || 'Title here'}</div>
              </div>
              <div className="p-3 bg-red-800 overflow-hidden">
                <div className="text-white text-[9px] whitespace-nowrap truncate">
                  {config.scrollingTexts.join(' ✦ ')}
                </div>
              </div>
              <div className="p-3 space-y-2">
                <p className="text-slate-400 text-[9px] leading-relaxed">{config.description}</p>
                <div className="flex gap-2">
                  <div
                    className="flex-1 py-2 rounded-lg text-[9px] font-bold text-[#10233F] text-center"
                    style={{ background: config.badgeColor }}
                  >
                    {config.onlineLinkText}
                  </div>
                  <div className="flex-1 py-2 rounded-lg text-[9px] font-bold text-white text-center border border-white/20 bg-white/10">
                    {config.offlineLinkText}
                  </div>
                </div>
                <div className="py-2 rounded-lg text-[9px] font-black text-white text-center bg-gradient-to-r from-[#89190E] to-[#c0392b]">
                  🎯 {config.ctaButtonText}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button Bottom */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 rounded-xl bg-[#89190E] hover:bg-[#6b1309] text-white font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-60 shadow-lg"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving Changes...' : 'Save & Publish to Live Site'}
        </button>
      </div>
    </div>
  );
}
