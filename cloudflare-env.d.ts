declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ADMIN_PASSWORD?: string;
    SESSION_SECRET?: string;
    IMEI_PROVIDER_URL?: string;
    IMEI_PROVIDER_TOKEN?: string;
    IMEI_MODEL_PATH?: string;
    CORS_ORIGIN?: string;
  }
}
