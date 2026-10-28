"use strict";

class LinkSwiftError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = new.target.name;
  }
}

class ValidationError extends LinkSwiftError {}
class AdapterNotFoundError extends LinkSwiftError {}
class UnsupportedCapabilityError extends LinkSwiftError {}

module.exports = {
  LinkSwiftError,
  ValidationError,
  AdapterNotFoundError,
  UnsupportedCapabilityError,
};
