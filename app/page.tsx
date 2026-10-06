import React from "react";
import {
  Smartphone, Zap, Shield, Globe, ArrowRight, Code2,
  Database, CheckCircle, ExternalLink, Cpu,
} from "lucide-react";

export default function LandingPage() {
  const features = [
    { icon: <Zap className="w-5 h-5" />, title: "IMEI Lookup", desc: "Resolve any 15-digit IMEI to device model and image in one API call." },
    { icon: <Smartphone className="w-5 h-5" />, title: "Model Search", desc: "Query by model name with intelligent fuzzy matching and alias resolution." },
    { icon: <Database className="w-5 h-5" />, title: "Smart Caching", desc: "Every image is cached on first fetch. Subsequent calls return instantly." },
    { icon: <Shield className="w-5 h-5" />, title: "Secure by Design", desc: "Bearer token auth, per-key rate limiting, and HTTPS-only sources." },
    { icon: <Globe className="w-5 h-5" />, title: "GSMArena Quality", desc: "Images sourced from GSMArena via RapidAPI with Wikimedia fallback." },
    { icon: <Code2 className="w-5 h-5" />, title: "REST + JSON", desc: "Dead-simple REST API returning clean JSON or raw image bytes." },
  ];

  const codeSnippets = [
    {
      lang: "cURL",
      code: `curl --request GET \\
  'https://imeisnap-api.vercel.app/api/v1/image?model=Galaxy%20S24%20Ultra' \\
  --header 'Authorization: Bearer isk_YOUR_API_KEY'`,
    },
    {
      lang: "JavaScript",
      code: `const res = await fetch(
  'https://imeisnap-api.vercel.app/api/v1/image?model=Galaxy S24 Ultra',
  { headers: { Authorization: 'Bearer isk_YOUR_API_KEY' } }
);
const data = await res.json();
console.log(data.image_url); // Authenticated image URL`,
    },
    {
      lang: "Python",
      code: `import requests

res = requests.get(
  'https://imeisnap-api.vercel.app/api/v1/image',
  params={'model': 'Galaxy S24 Ultra'},
  headers={'Authorization': 'Bearer isk_YOUR_API_KEY'}
)
print(res.json()['image_url'])`,
    },
  ];

  const steps = [
    { num: "01", title: "Get your API Key", desc: "Contact us or self-host to generate an API key via the admin panel." },
    { num: "02", title: "Make a request", desc: "Pass your key as a Bearer token. Query by model name or 15-digit IMEI." },
    { num: "03", title: "Use the image", desc: "Fetch the image_url using your key, or use format=image to get raw bytes." },
    { num: "04", title: "Display it", desc: "Show the image in your app, portal, or ERP. Attribute as per the license." },
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050508]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">IMEISnap</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-neutral-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#quickstart" className="hover:text-white transition-colors">Quickstart</a>
            <a href="/docs" className="hover:text-white transition-colors">Docs</a>
            <a href="/swagger" className="hover:text-white transition-colors">API Reference</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="/demo" className="text-sm text-neutral-300 hover:text-white border border-neutral-700 hover:border-neutral-500 px-4 py-2 rounded-xl transition-all">Try Demo</a>
            <a href="/swagger" className="text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl transition-all font-medium shadow-lg shadow-violet-500/20">
              API Docs
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm mb-8 font-medium">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            Live API · Production Ready
          </div>

          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-br from-white via-white to-neutral-400 bg-clip-text text-transparent">
              Device Images
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              from Any IMEI
            </span>
          </h1>

          <p className="text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            One REST API to resolve any device model name or 15-digit IMEI into a high-quality product image,
            powered by GSMArena and Wikimedia Commons.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="/demo" className="group flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all shadow-2xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5">
              Try Live Demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a href="/swagger" className="flex items-center gap-2 border border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all hover:-translate-y-0.5">
              <ExternalLink className="w-5 h-5" />View API Reference
            </a>
          </div>
        </div>
      </section>

      {/* Quick stats */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-3 gap-4">
          {[
            ["2 endpoints", "Simple REST API"],
            ["GSMArena quality", "Primary image source"],
            ["Auto-cached", "Sub-10ms after first fetch"],
          ].map(([val, label]) => (
            <div key={label} className="rounded-2xl border border-white/5 bg-white/2 p-6 text-center">
              <p className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">{val}</p>
              <p className="text-sm text-neutral-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 pb-28">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-3">Everything you need</h2>
          <p className="text-neutral-400 text-lg">Built for developers who need device imagery fast.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => (
            <div key={f.title} className="group p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-violet-500/20 transition-all">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-4 group-hover:bg-violet-500/20 transition-all">
                {f.icon}
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quickstart */}
      <section id="quickstart" className="max-w-6xl mx-auto px-6 pb-28">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-3">Up and running in minutes</h2>
          <p className="text-neutral-400 text-lg">Four simple steps to integrate device imagery into your product.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-16">
          {steps.map((s, i) => (
            <div key={s.num} className="relative p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 -right-2 w-4 h-px bg-violet-500/30" />
              )}
              <span className="text-3xl font-black text-violet-500/30 block mb-3">{s.num}</span>
              <h3 className="font-semibold text-white mb-1.5">{s.title}</h3>
              <p className="text-neutral-500 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Code snippets */}
        <div className="space-y-4">
          {codeSnippets.map(s => (
            <div key={s.lang} className="rounded-2xl border border-white/5 bg-[#0c0c14] overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-neutral-700" />
                    <div className="w-3 h-3 rounded-full bg-neutral-700" />
                    <div className="w-3 h-3 rounded-full bg-neutral-700" />
                  </div>
                  <span className="text-xs text-neutral-500 font-medium ml-1">{s.lang}</span>
                </div>
                <Code2 className="w-4 h-4 text-neutral-600" />
              </div>
              <pre className="p-5 text-sm font-mono text-emerald-400/80 overflow-x-auto leading-relaxed">{s.code}</pre>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-28 text-center">
        <div className="relative rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-600/10 to-indigo-600/10 p-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent pointer-events-none" />
          <div className="relative">
            <h2 className="text-4xl font-bold mb-4">Ready to integrate?</h2>
            <p className="text-neutral-400 text-lg mb-8 max-w-xl mx-auto">Try the live demo or read the full documentation to get started.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/demo" className="group flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-8 py-3.5 rounded-2xl font-semibold transition-all">
                Try Live Demo <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a href="/docs" className="flex items-center justify-center gap-2 border border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white px-8 py-3.5 rounded-2xl font-semibold transition-all">
                Read Docs
              </a>
              <a href="/swagger" className="flex items-center justify-center gap-2 border border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white px-8 py-3.5 rounded-2xl font-semibold transition-all">
                API Reference
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center">
              <Smartphone className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-neutral-400">IMEISnap</span>
          </div>
          <div className="flex gap-6 text-sm text-neutral-600">
            <a href="/demo" className="hover:text-neutral-400 transition-colors">Demo</a>
            <a href="/docs" className="hover:text-neutral-400 transition-colors">Docs</a>
            <a href="/swagger" className="hover:text-neutral-400 transition-colors">Swagger</a>
            <a href="/api/health" className="hover:text-neutral-400 transition-colors">Health</a>
          </div>
          <p className="text-sm text-neutral-700">© 2026 IMEISnap. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
