"use client";
import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

const spec = {
  openapi: "3.0.3",
  info: {
    title: "IMEISnap API",
    version: "1.0.0",
    description:
      "IMEISnap resolves IMEI numbers and device model names to high-quality device images and metadata. Images are sourced from GSMArena (via RapidAPI) with a Wikimedia Commons fallback.",
    contact: { name: "IMEISnap Support", url: "https://imeisnap-api.vercel.app" },
  },
  servers: [{ url: "https://imeisnap-api.vercel.app", description: "Production" }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "API Key",
        description: "Pass your API key in the Authorization header: `Bearer isk_...`",
      },
    },
    schemas: {
      ImageMeta: {
        type: "object",
        properties: {
          model: { type: "string", example: "Samsung Galaxy S24 Ultra" },
          cached: { type: "boolean", example: false },
          image_url: { type: "string", format: "uri", example: "https://imeisnap-api.vercel.app/api/v1/images/samsung%20galaxy%20s24%20ultra" },
          mime_type: { type: "string", example: "image/jpeg" },
          bytes: { type: "integer", example: 23905 },
          source_url: { type: "string", format: "uri" },
          attribution: { type: "string", example: "GSMArena (via RapidAPI)" },
          license: { type: "string", example: "Copyrighted/Fair Use" },
          license_url: { type: "string", format: "uri", example: "https://www.gsmarena.com" },
          reviewed: { type: "boolean", example: false },
          stored_at: { type: "string", format: "date-time" },
        },
      },
      ImeiResponse: {
        allOf: [
          { $ref: "#/components/schemas/ImageMeta" },
          { type: "object", properties: { imei: { type: "string", example: "351832114631147" }, tac: { type: "string", example: "35183211" } } },
        ],
      },
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "unauthorized" },
              message: { type: "string", example: "No API key provided." },
            },
          },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        description: "Returns service status. No authentication required.",
        security: [],
        responses: {
          "200": {
            description: "Service is up",
            content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", example: "ok" }, service: { type: "string", example: "imeisnap" }, version: { type: "string", example: "1.0.0" } } } } },
          },
        },
      },
    },
    "/api/v1/image": {
      get: {
        tags: ["Device Images"],
        summary: "Look up a device image by model name",
        description: "Resolves a model name (e.g. `Galaxy S24 Ultra`, `Pixel 8 Pro`) to a high-quality device image. Images are cached permanently after the first lookup.",
        parameters: [
          { name: "model", in: "query", required: true, schema: { type: "string" }, description: "Device model name. Partial names (e.g. `galaxy s24`) are matched automatically.", example: "Galaxy S24 Ultra" },
          { name: "format", in: "query", required: false, schema: { type: "string", enum: ["image"] }, description: "Pass `format=image` to receive the raw image bytes instead of JSON metadata." },
        ],
        responses: {
          "200": { description: "Image metadata (or raw bytes when `format=image`)", content: { "application/json": { schema: { $ref: "#/components/schemas/ImageMeta" } } } },
          "401": { description: "Missing or invalid API key", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Model not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "429": { description: "Rate limit exceeded (60 req/min)", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/v1/imei": {
      post: {
        tags: ["Device Images"],
        summary: "Look up a device image by IMEI",
        description: "Accepts a 15-digit IMEI, extracts the TAC (first 8 digits), resolves the manufacturer and model name, then returns the cached or freshly fetched device image metadata.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["imei"], properties: { imei: { type: "string", minLength: 15, maxLength: 15, example: "351832114631147" } } },
            },
          },
        },
        responses: {
          "200": { description: "Image metadata for the resolved device", content: { "application/json": { schema: { $ref: "#/components/schemas/ImeiResponse" } } } },
          "400": { description: "Invalid IMEI format", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "Missing or invalid API key", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "TAC not found in database", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "429": { description: "Rate limit exceeded (10 IMEI req/min)", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/v1/images/{id}": {
      get: {
        tags: ["Device Images"],
        summary: "Fetch raw image bytes by model ID",
        description: "Returns the raw image binary (JPEG/PNG/WebP). The `id` is the URL-encoded model name returned in `image_url` from other endpoints.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "URL-encoded model name (e.g. `samsung%20galaxy%20s24%20ultra`)" },
          { name: "If-None-Match", in: "header", required: false, schema: { type: "string" }, description: "ETag from a previous response for conditional caching." },
        ],
        responses: {
          "200": { description: "Raw image binary", content: { "image/jpeg": {}, "image/png": {}, "image/webp": {} } },
          "304": { description: "Not modified (ETag matched)" },
          "401": { description: "Missing or invalid API key", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "404": { description: "Image not in cache", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
  },
};

export default function SwaggerPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#1a1a2e] py-6 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="text-neutral-400 hover:text-white transition-colors text-sm">← Back to Home</a>
          <span className="text-neutral-600">|</span>
          <span className="text-white font-semibold text-lg">IMEISnap · API Reference</span>
        </div>
        <div className="flex gap-3">
          <a href="/docs" className="text-sm text-neutral-300 hover:text-white transition-colors border border-neutral-700 px-3 py-1 rounded-lg">Docs</a>
          <a href="/demo" className="text-sm bg-violet-600 hover:bg-violet-500 text-white transition-colors px-3 py-1 rounded-lg">Try Demo</a>
        </div>
      </div>
      <SwaggerUI spec={spec} docExpansion="list" defaultModelsExpandDepth={1} />
    </div>
  );
}
