"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.queryUrl = exports.parseUrl = exports.isServer = exports.httpCode = exports.catchHandler = exports.capitalize = void 0;

var _httpCodes = require("./http-codes");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

var httpCode = function httpCode(nameOrCode) {
  if (typeof nameOrCode === 'number') return nameOrCode;
  return _httpCodes.http_codes[nameOrCode];
};

exports.httpCode = httpCode;
var isServer = typeof window === 'undefined' ? true : false;
exports.isServer = isServer;

var parseUrl = function parseUrl(url) {
  if (isServer && !url.includes("http")) url = "http://localhost:".concat(process.env.PORT || 3000) + url;
  if (url.endsWith('index')) url = url.replace(/\/index$/, "");
  return url;
};

exports.parseUrl = parseUrl;

var queryUrl = function queryUrl(_ref) {
  var url = _ref.url,
      query = _ref.query;
  // If the "query" is just a string, number or boolean
  // transform it to ?value=query
  if (['string', 'number', 'boolean'].includes(_typeof(query))) query = {
    value: query
  };
  var params = new URLSearchParams(query).toString();
  if (params) return url + '?' + params;
  return url;
};

exports.queryUrl = queryUrl;

var catchHandler = function catchHandler(err) {
  var data = err.response.data;

  if (typeof data == 'string') {
    var default_error = {
      message: data
    };
    data = default_error;
  }

  throw _objectSpread({
    code: err.code,
    status: err.response.status,
    statusText: err.response.statusText
  }, data);
};

exports.catchHandler = catchHandler;

var capitalize = function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
};

exports.capitalize = capitalize;