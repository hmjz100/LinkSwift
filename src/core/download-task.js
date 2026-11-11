"use strict";

const { ValidationError } = require("./errors");

const HTTP_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]);

function normalizeHeaders(headers = {}) {
  if (!headers || typeof headers !== "object" || Array.isArray(headers)) {
    throw new ValidationError("headers must be an object");
  }

  const normalized = {};
  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined || value === null || value === "") continue;
    const key = String(name).trim();
    if (!key) continue;
    normalized[key] = String(value);
  }
  return normalized;
}

function normalizeExpiresAt(value) {
  if (value === undefined || value === null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError("expiresAt must be a valid date");
  }
  return date.toISOString();
}

function assertHttpUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new ValidationError("url must be a valid URL");
  }
  if (!new Set(["http:", "https:"]).has(parsed.protocol)) {
    throw new ValidationError("url protocol must be http or https");
  }
}

/**
 * Canonical representation passed from a provider adapter to a downloader adapter.
 * Provider-specific response shapes must not leak past this boundary.
 */
class DownloadTask {
  constructor(input = {}) {
    const provider = String(input.provider || "").trim();
    const url = String(input.url || "").trim();
    const filename = input.filename == null ? "" : String(input.filename);
    const method = String(input.method || "GET").toUpperCase();

    if (!provider) throw new ValidationError("provider is required");
    if (!url) throw new ValidationError("url is required");
    assertHttpUrl(url);
    if (!HTTP_METHODS.has(method)) throw new ValidationError(`unsupported HTTP method: ${method}`);

    this.provider = provider;
    this.url = url;
    this.filename = filename;
    this.method = method;
    this.headers = normalizeHeaders(input.headers);
    this.body = input.body ?? null;
    this.size = input.size == null ? null : Number(input.size);
    this.expiresAt = normalizeExpiresAt(input.expiresAt);
    this.referer = input.referer ? String(input.referer) : null;
    this.userAgent = input.userAgent ? String(input.userAgent) : null;
    this.cookies = input.cookies ? String(input.cookies) : null;
    this.meta = input.meta && typeof input.meta === "object" && !Array.isArray(input.meta)
      ? { ...input.meta }
      : {};

    if (this.size !== null && (!Number.isFinite(this.size) || this.size < 0)) {
      throw new ValidationError("size must be a non-negative finite number");
    }

    Object.freeze(this.headers);
    Object.freeze(this.meta);
    Object.freeze(this);
  }

  isExpired(now = new Date()) {
    if (!this.expiresAt) return false;
    return new Date(this.expiresAt).getTime() <= now.getTime();
  }

  toJSON() {
    return {
      provider: this.provider,
      url: this.url,
      filename: this.filename,
      method: this.method,
      headers: { ...this.headers },
      body: this.body,
      size: this.size,
      expiresAt: this.expiresAt,
      referer: this.referer,
      userAgent: this.userAgent,
      cookies: this.cookies,
      meta: { ...this.meta },
    };
  }
}

module.exports = {
  DownloadTask,
  normalizeHeaders,
};
