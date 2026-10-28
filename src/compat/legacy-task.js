"use strict";

const { DownloadTask } = require("../core/download-task");
const { ValidationError } = require("../core/errors");

/**
 * Convert the legacy userscript state shape into the canonical DownloadTask.
 * This is an intentionally small migration seam: providers can keep their
 * current `files/get/headers` shape while callers move to DownloadTask.
 */
function createLegacyDownloadTask(state, index, options = {}) {
  const normalizedIndex = Number(index);
  if (!Number.isInteger(normalizedIndex) || normalizedIndex < 0) {
    throw new ValidationError("legacy task index must be a non-negative integer");
  }
  if (!state || typeof state !== "object") {
    throw new ValidationError("legacy state is required");
  }

  const files = Array.isArray(state.files) ? state.files : [];
  const file = files[normalizedIndex];
  const get = state.get;
  if (!file) throw new ValidationError(`legacy file not found at index ${normalizedIndex}`);
  if (!get || typeof get !== "object" || typeof get.link !== "function") {
    throw new ValidationError("legacy state.get.link is required");
  }

  const url = get.link(file);
  const filename = typeof get.name === "function" ? get.name(file) : "";
  const rawSize = typeof get.size === "function" ? get.size(file) : null;
  const size = rawSize === "" || rawSize == null ? null : Number(rawSize);

  return new DownloadTask({
    provider: options.provider || state.provider || "legacy",
    url,
    filename,
    size,
    headers: state.headers || {},
    referer: options.referer || state.referer || null,
    userAgent: options.userAgent || state.userAgent || null,
    cookies: options.cookies || state.cookies || null,
    meta: {
      legacyIndex: normalizedIndex,
      ...(options.meta || {}),
    },
  });
}

module.exports = {
  createLegacyDownloadTask,
};
