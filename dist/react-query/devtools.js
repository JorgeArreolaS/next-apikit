"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _devtools = require("react-query/devtools");

Object.keys(_devtools).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _devtools[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _devtools[key];
    }
  });
});