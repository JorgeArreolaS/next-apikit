"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.httpCode = void 0;

var _httpCodes = require("./http-codes");

var httpCode = function httpCode(nameOrCode) {
  if (typeof nameOrCode === 'number') return nameOrCode;
  return _httpCodes.http_codes[nameOrCode];
};

exports.httpCode = httpCode;