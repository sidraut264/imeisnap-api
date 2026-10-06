import React from 'react';
import { Terminal, Key, Shield, Smartphone, Box, Webhook, HelpCircle } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto px-6 py-16">
        
        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-6">
            <Terminal className="w-4 h-4" />
            <span>Developer API</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
            IMEISnap API Documentation
          </h1>
          <p className="text-lg text-neutral-400 leading-relaxed max-w-2xl">
            Integrate IMEI lookups and device model resolution directly into your application. 
            Access rich device metadata and licensed device imagery instantly.
          </p>
        </div>

        {/* Global Settings */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
              <Webhook className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Base URL</h3>
            <code className="text-sm text-emerald-400 font-mono">https://imeisnap-api.vercel.app</code>
          </div>
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
              <Key className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Authentication</h3>
            <p className="text-sm text-neutral-400 mb-3">All requests require a Bearer token provided by your admin.</p>
            <code className="text-sm text-orange-400 font-mono break-all">Authorization: Bearer isk_...</code>
          </div>
        </div>

        {/* Endpoints */}
        <div className="space-y-12">
          
          {/* Lookup by IMEI */}
          <section className="scroll-mt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Smartphone className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Lookup by IMEI</h2>
                <p className="text-neutral-400 text-sm mt-1">Resolve a 15-digit IMEI to a device model.</p>
              </div>
            </div>

            <div className="bg-[#0c0c0c] rounded-2xl border border-neutral-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/50 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/20 text-indigo-400">POST</span>
                  <code className="text-sm font-mono text-neutral-300">/api/v1/imei</code>
                </div>
              </div>
              <div className="p-6">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Request Body (JSON)</h4>
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-neutral-800 text-neutral-400">
                        <th className="pb-3 font-medium">Parameter</th>
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium">Required</th>
                        <th className="pb-3 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      <tr>
                        <td className="py-4"><code className="text-white">imei</code></td>
                        <td className="py-4 text-emerald-400 font-mono text-xs">string</td>
                        <td className="py-4 text-neutral-300">Yes</td>
                        <td className="py-4 text-neutral-400">A strict 15-digit numeric IMEI string.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Example Request</h4>
                <pre className="bg-black p-4 rounded-xl overflow-x-auto border border-neutral-800">
                  <code className="text-sm font-mono text-neutral-300">
{`curl -X POST "https://imeisnap-api.vercel.app/api/v1/imei" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"imei": "351832114631147"}'`}
                  </code>
                </pre>
              </div>
            </div>
          </section>

          {/* Lookup by Model Name */}
          <section className="scroll-mt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <Box className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Lookup by Model Name</h2>
                <p className="text-neutral-400 text-sm mt-1">Fetch device details and image directly by model name.</p>
              </div>
            </div>

            <div className="bg-[#0c0c0c] rounded-2xl border border-neutral-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/50 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400">GET</span>
                  <code className="text-sm font-mono text-neutral-300">/api/v1/image</code>
                </div>
              </div>
              <div className="p-6">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Query Parameters</h4>
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-neutral-800 text-neutral-400">
                        <th className="pb-3 font-medium">Parameter</th>
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium">Required</th>
                        <th className="pb-3 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      <tr>
                        <td className="py-4"><code className="text-white">model</code></td>
                        <td className="py-4 text-emerald-400 font-mono text-xs">string</td>
                        <td className="py-4 text-neutral-300">Yes</td>
                        <td className="py-4 text-neutral-400">The device model identifier (e.g. Galaxy S24 Ultra).</td>
                      </tr>
                      <tr>
                        <td className="py-4"><code className="text-white">format</code></td>
                        <td className="py-4 text-emerald-400 font-mono text-xs">string</td>
                        <td className="py-4 text-neutral-500">No</td>
                        <td className="py-4 text-neutral-400">Pass <code className="text-neutral-300">image</code> to receive raw image bytes.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Example Request</h4>
                <pre className="bg-black p-4 rounded-xl overflow-x-auto border border-neutral-800">
                  <code className="text-sm font-mono text-neutral-300">
{`curl -X GET "https://imeisnap-api.vercel.app/api/v1/image?model=Galaxy%20S24%20Ultra" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                  </code>
                </pre>
              </div>
            </div>
          </section>

          {/* Success Response */}
          <section className="pt-8 border-t border-neutral-800/50">
            <h2 className="text-2xl font-bold text-white mb-6">Success Response Example</h2>
            <div className="bg-[#0c0c0c] rounded-2xl border border-neutral-800 overflow-hidden">
              <div className="px-4 py-3 bg-neutral-900/50 border-b border-neutral-800 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-sm font-medium text-neutral-300">200 OK</span>
              </div>
              <div className="p-4">
                <pre className="overflow-x-auto">
                  <code className="text-sm font-mono text-emerald-400/80">
{`{
  "model": "Samsung Galaxy S24 Ultra",
  "cached": false,
  "image_url": "https://imeisnap-api.vercel.app/api/v1/images/samsung%20galaxy%20s24%20ultra",
  "mime_type": "image/jpeg",
  "bytes": 19993,
  "source_url": "https://commons.wikimedia.org/wiki/File:Galaxy_S24_Ultra.jpg",
  "attribution": "Vis M",
  "license": "CC BY-SA 4.0",
  "license_url": "https://creativecommons.org/licenses/by-sa/4.0",
  "reviewed": false,
  "stored_at": "2026-10-06T06:39:03.651Z"
}`}
                  </code>
                </pre>
              </div>
            </div>
          </section>

          {/* Important Limits */}
          <section className="pt-8 border-t border-neutral-800/50">
            <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-orange-400" />
                <h3 className="text-xl font-semibold text-white">Rate Limits & Security</h3>
              </div>
              <ul className="space-y-3 text-neutral-400">
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>API keys are capped at <strong>60 requests per minute</strong>. Exceeding this will return a <code className="text-white text-sm">429 Too Many Requests</code> error.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>Missing or invalid tokens will return a <code className="text-white text-sm">401 Unauthorized</code> error. Keep your keys secret.</span>
                </li>
              </ul>
            </div>
          </section>
          {/* FAQs */}
          <section className="pt-8 border-t border-neutral-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                <HelpCircle className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
              </div>
            </div>

            <div className="space-y-6">
              {/* FAQ 1 */}
              <div className="bg-[#0c0c0c] p-6 rounded-2xl border border-neutral-800">
                <h3 className="text-lg font-semibold text-white mb-3">How is the end-user supposed to use the image?</h3>
                <p className="text-neutral-400 leading-relaxed mb-4">
                  Because the <code className="text-emerald-400 font-mono text-sm">image_url</code> returned in the JSON requires the <code className="text-orange-400 font-mono text-sm">Authorization: Bearer</code> header, it cannot be placed directly into a standard HTML <code className="text-white text-sm">&lt;img src="..." /&gt;</code> tag.
                </p>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                    <h4 className="text-white font-medium mb-2">Option A: Backend Proxy (Recommended)</h4>
                    <p className="text-neutral-400 text-sm">Your backend server should fetch the <code className="text-white text-sm">image_url</code> using your API key, and then either serve it directly to your frontend or store it in your own bucket (like AWS S3) for caching.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                    <h4 className="text-white font-medium mb-2">Option B: Direct Bytes Download</h4>
                    <p className="text-neutral-400 text-sm">If you do not need the JSON metadata at all, you can instantly download the raw image bytes (e.g. <code className="text-white text-sm">image/jpeg</code>) by appending <code className="text-emerald-400 font-mono text-xs">&format=image</code> to your original request.</p>
                  </div>
                </div>
              </div>

              {/* FAQ 2 */}
              <div className="bg-[#0c0c0c] p-6 rounded-2xl border border-neutral-800">
                <h3 className="text-lg font-semibold text-white mb-3">Why are we exposing our source and licensing?</h3>
                <p className="text-neutral-400 leading-relaxed">
                  The API dynamically aggregates device images from open-source repositories (such as <strong>Wikimedia Commons</strong>). 
                  These images are often licensed under <strong>Creative Commons (e.g. CC BY-SA 4.0)</strong>, which carries a strict legal requirement: 
                  anyone displaying the image must give appropriate credit (Attribution) and provide a link to the license.
                </p>
                <p className="text-neutral-400 leading-relaxed mt-4">
                  By returning <code className="text-white text-sm">attribution</code>, <code className="text-white text-sm">license</code>, and <code className="text-white text-sm">source_url</code> in the API response, we are providing you with the necessary legal metadata to comply with copyright laws when you display these images in your own applications.
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
