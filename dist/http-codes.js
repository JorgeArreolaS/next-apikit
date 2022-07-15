"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.success_http_codes = exports.http_codes = exports.failure_http_codes = void 0;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var success_http_codes = {
  "CONTINUE": 100,
  "SWITCHING_PROTOCOLS": 101,
  "PROCESSING": 102,
  "OK": 200,
  "CREATED": 201,
  "ACCEPTED": 202,
  "NON_AUTHORITATIVE_INFORMATION": 203,
  "NO_CONTENT": 204,
  "RESET_CONTENT": 205,
  "PARTIAL_CONTENT": 206,
  "MULTI_STATUS": 207,
  "ALREADY_REPORTED": 208,
  "IM_USED": 226,
  "MULTIPLE_CHOICES": 300,
  "MOVED_PERMANENTLY": 301,
  "FOUND": 302,
  "SEE_OTHER": 303,
  "NOT_MODIFIED": 304,
  "USE_PROXY": 305,
  "RESERVED": 306,
  "TEMPORARY_REDIRECT": 307,
  "PERMANENT_REDIRECT": 308
};
exports.success_http_codes = success_http_codes;
var failure_http_codes = {
  "BAD_REQUEST": 400,
  "UNAUTHORIZED": 401,
  "PAYMENT_REQUIRED": 402,
  "FORBIDDEN": 403,
  "NOT_FOUND": 404,
  "METHOD_NOT_ALLOWED": 405,
  "NOT_ACCEPTABLE": 406,
  "PROXY_AUTHENTICATION_REQUIRED": 407,
  "REQUEST_TIMEOUT": 408,
  "CONFLICT": 409,
  "GONE": 410,
  "LENGTH_REQUIRED": 411,
  "PRECONDITION_FAILED": 412,
  "REQUEST_ENTITY_TOO_LARGE": 413,
  "REQUEST_URI_TOO_LONG": 414,
  "UNSUPPORTED_MEDIA_TYPE": 415,
  "REQUESTED_RANGE_NOT_SATISFIABLE": 416,
  "EXPECTATION_FAILED": 417,
  "UNPROCESSABLE_ENTITY": 422,
  "LOCKED": 423,
  "FAILED_DEPENDENCY": 424,
  "UPGRADE_REQUIRED": 426,
  "PRECONDITION_REQUIRED": 428,
  "TOO_MANY_REQUESTS": 429,
  "REQUEST_HEADER_FIELDS_TOO_LARGE": 431,
  "INTERNAL_SERVER_ERROR": 500,
  "NOT_IMPLEMENTED": 501,
  "BAD_GATEWAY": 502,
  "SERVICE_UNAVAILABLE": 503,
  "GATEWAY_TIMEOUT": 504,
  "HTTP_VERSION_NOT_SUPPORTED": 505,
  "VARIANT_ALSO_NEGOTIATES_(EXPERIMENTAL)": 506,
  "INSUFFICIENT_STORAGE": 507,
  "LOOP_DETECTED": 508,
  "NOT_EXTENDED": 510,
  "NETWORK_AUTHENTICATION_REQUIRED": 511
};
exports.failure_http_codes = failure_http_codes;

var http_codes = _objectSpread(_objectSpread({}, failure_http_codes), success_http_codes);

exports.http_codes = http_codes;