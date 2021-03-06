"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _reactQuery = require("react-query");

Object.keys(_reactQuery).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _reactQuery[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _reactQuery[key];
    }
  });
});