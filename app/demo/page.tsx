"use client";
import React, { useState } from "react";
import { Smartphone, Search, Cpu, CheckCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react";

const API_BASE = "https://imeisnap-api.vercel.app";

type ResultData = {
  model?: string;
  image_url?: string;
  mime_type?: string;
  bytes?: number;
  source_url?: string;
  attribution?: string;
  license?: string;
  license_url?: string;
  cached?: boolean;
  stored_at?: string;
  error?: { code: string; message: string };
};

export default function DemoPage() {
  const [apiKey, setApiKey] = useState("");
  const [tab, setTab] = useState<"model" | "imei">("model");
  const [modelInput, setModelInput] = useState("Galaxy S24 Ultra");
  const [imeiInput, setImeiInput] = useState("");
  const [result, setResult] = useState<ResultData | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawJson, setRawJson] = useState<string | null>(null);

  const authHeader = apiKey ? `Bearer ${apiKey}` : "";

  async function fetchModel() {
    if (!authHeader) { setError("Please enter your API key above."); return; }
    if (!modelInput.trim()) { setError("Please enter a model name."); return; }
    setLoading(true); setError(null); setResult(null); setImageUrl(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/image?model=${encodeURIComponent(modelInput)}`, {
        headers: { Authorization: authHeader },
      });
      const data: ResultData = await res.json();
      setRawJson(JSON.stringify(data, null, 2));
      if (!res.ok) { setError(data.error?.message || "Request failed"); return; }
      setResult(data);
      if (data.image_url) {
        const imgRes = await fetch(data.image_url, { headers: { Authorization: authHeader } });
        if (imgRes.ok) {
          const blob = await imgRes.blob();
          setImageUrl(URL.createObjectURL(blob));
        }
      }
    } catch (e) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchImei() {
    if (!authHeader) { setError("Please enter your API key above."); return; }
    const imei = imeiInput.replace(/\s/g, "");
    if (!/^\d{15}$/.test(imei)) { setError("IMEI must be exactly 15 digits."); return; }
    setLoading(true); setError(null); setResult(null); setImageUrl(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/imei`, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ imei }),
      });
      const data: ResultData = await res.json();
      setRawJson(JSON.stringify(data, null, 2));
      if (!res.ok) { setError(data.error?.message || "Request failed"); return; }
      setResult(data);
      if (data.image_url) {
        const imgRes = await fetch(data.image_url, { headers: { Authorization: authHeader } });
        if (imgRes.ok) {
          const blob = await imgRes.blob();
          setImageUrl(URL.createObjectURL(blob));
        }
      }
    } catch (e) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  const exampleModels = ["iPhone 15 Pro Max", "Galaxy S24 Ultra", "Google Pixel 8 Pro", "OnePlus 12", "Xiaomi 14 Ultra"];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-[#0a0a0f]/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />Back
            </a>
            <div className="w-px h-4 bg-neutral-700" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">IMEISnap <span className="text-neutral-500 font-normal">· Live Demo</span></span>
            </div>
          </div>
          <div className="flex gap-2">
            <a href="/docs" className="text-sm text-neutral-400 hover:text-white border border-neutral-700 px-3 py-1.5 rounded-lg transition-colors">Docs</a>
            <a href="/swagger" className="text-sm text-neutral-400 hover:text-white border border-neutral-700 px-3 py-1.5 rounded-lg transition-colors">Swagger</a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm mb-4">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse"></span>Live API Demo
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
            Try the IMEISnap API
          </h1>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto">
            Look up any device by model name or IMEI number and instantly get a high-quality device image.
          </p>
        </div>

        {/* API Key input */}
        <div className="mb-8 p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
          <label className="block text-sm font-medium text-neutral-300 mb-2">Your API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="isk_xxxxxxxxxxxxxxxxxxxx..."
            className="w-full bg-[#0c0c0c] border border-neutral-700 rounded-xl px-4 py-2.5 text-white placeholder-neutral-600 font-mono text-sm focus:outline-none focus:border-violet-500 transition-colors"
          />
          <p className="text-xs text-neutral-600 mt-2">Your key is never stored or sent to any third party.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Input Panel */}
          <div className="space-y-4">
            {/* Tab switcher */}
            <div className="flex rounded-xl bg-neutral-900 border border-neutral-800 p-1">
              {(["model", "imei"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setResult(null); setImageUrl(null); setError(null); setRawJson(null); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-violet-600 text-white" : "text-neutral-400 hover:text-white"}`}
                >
                  {t === "model" ? <><Search className="w-3.5 h-3.5 inline mr-1.5" />By Model Name</> : <><Cpu className="w-3.5 h-3.5 inline mr-1.5" />By IMEI</>}
                </button>
              ))}
            </div>

            {tab === "model" ? (
              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Model Name</label>
                  <input
                    value={modelInput}
                    onChange={e => setModelInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && fetchModel()}
                    placeholder="e.g. Galaxy S24 Ultra"
                    className="w-full bg-[#0c0c0c] border border-neutral-700 rounded-xl px-4 py-2.5 text-white placeholder-neutral-600 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-2">Quick picks:</p>
                  <div className="flex flex-wrap gap-2">
                    {exampleModels.map(m => (
                      <button key={m} onClick={() => setModelInput(m)} className="text-xs px-3 py-1 rounded-lg bg-neutral-800 text-neutral-400 hover:bg-violet-600/20 hover:text-violet-300 border border-neutral-700 hover:border-violet-600/40 transition-all">{m}</button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={fetchModel}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Fetching...</> : <><Search className="w-4 h-4" />Fetch Image</>}
                </button>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">IMEI Number</label>
                  <input
                    value={imeiInput}
                    onChange={e => setImeiInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && fetchImei()}
                    placeholder="15-digit IMEI e.g. 351832114631147"
                    maxLength={15}
                    className="w-full bg-[#0c0c0c] border border-neutral-700 rounded-xl px-4 py-2.5 text-white placeholder-neutral-600 font-mono text-sm focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  <p className="text-xs text-neutral-600 mt-2">Find on your device by dialing *#06#</p>
                </div>
                <button
                  onClick={fetchImei}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Looking up IMEI...</> : <><Cpu className="w-4 h-4" />Lookup Device</>}
                </button>
              </div>
            )}

            {/* JSON output */}
            {rawJson && (
              <div className="rounded-2xl bg-[#0c0c0c] border border-neutral-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-neutral-900/60 border-b border-neutral-800 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-xs font-medium text-neutral-400">JSON Response</span>
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-400/80 overflow-x-auto max-h-80">{rawJson}</pre>
              </div>
            )}
          </div>

          {/* Right: Result panel */}
          <div>
            {!result && !loading && !error && (
              <div className="h-full min-h-[400px] rounded-2xl border border-dashed border-neutral-800 flex flex-col items-center justify-center text-center p-8">
                <Smartphone className="w-14 h-14 text-neutral-700 mb-4" />
                <p className="text-neutral-500 font-medium">Your device image will appear here</p>
                <p className="text-neutral-700 text-sm mt-2">Enter a model name or IMEI and click Fetch</p>
              </div>
            )}

            {loading && (
              <div className="h-full min-h-[400px] rounded-2xl border border-neutral-800 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                <p className="text-neutral-400">Resolving device...</p>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-300">Request Failed</p>
                  <p className="text-red-400/80 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {result && !loading && (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden">
                {/* Image */}
                <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 aspect-square flex items-center justify-center relative">
                  {imageUrl ? (
                    <img src={imageUrl} alt={result.model} className="max-h-80 max-w-full object-contain drop-shadow-2xl" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-neutral-500">
                      <Smartphone className="w-16 h-16" />
                      <span className="text-sm">Image loading...</span>
                    </div>
                  )}
                  <div className={`absolute top-3 right-3 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${result.cached ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"}`}>
                    <CheckCircle className="w-3 h-3" />
                    {result.cached ? "Cache HIT" : "Cache MISS"}
                  </div>
                </div>

                {/* Metadata */}
                <div className="p-5 space-y-3">
                  <h3 className="text-lg font-bold text-white">{result.model}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {[
                      ["Format", result.mime_type],
                      ["Size", result.bytes ? `${(result.bytes / 1024).toFixed(1)} KB` : "-"],
                      ["License", result.license],
                      ["Attribution", result.attribution],
                    ].map(([k, v]) => (
                      <div key={k as string} className="bg-neutral-800 rounded-xl p-3">
                        <p className="text-neutral-500 text-xs">{k}</p>
                        <p className="text-neutral-200 font-medium mt-0.5 truncate">{v || "-"}</p>
                      </div>
                    ))}
                  </div>
                  {result.source_url && (
                    <a href={result.source_url} target="_blank" rel="noopener noreferrer" className="block text-center text-xs text-violet-400 hover:text-violet-300 transition-colors py-2">
                      View source →
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
