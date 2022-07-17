"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BabelNS = __importStar(require("@babel/core"));
const generator_1 = __importDefault(require("@babel/generator"));
const chalk_1 = __importDefault(require("chalk"));
const t = BabelNS.types;
const isServer = (parent) => parent.file.opts.caller && parent.file.opts.caller['isServer'] === true;
const isClient = (parent) => !isServer(parent);
const sideTag = (parent) => chalk_1.default.gray(isServer(parent) ? "[SERVER]" : "[CLIENT]");
const log = (text, parent) => {
    const filepath = String(parent.filename).replace(parent.cwd, "");
    console.log(sideTag(parent), chalk_1.default.green(filepath), chalk_1.default.yellow(text));
};
const printCode = ({ header = "", node, parent }) => {
    const code = (0, generator_1.default)(node || parent.file.path.node).code
        .split("\n")
        .map((line, index) => `${chalk_1.default.yellow(index + 1)} | ${line}`)
        .join("\n");
    console.log(sideTag(parent), chalk_1.default.cyan(header), '\n' + code + "\n");
};
exports.default = (babel) => ({
    visitor: {
        Program: {
            enter(path, parent) {
                if (parent.filename.includes('pages/api/')) {
                    // log("Into an api file", parent)
                    path.traverse({
                        CallExpression(_path) {
                            const callee = _path.node.callee;
                            if (callee.name !== "endpoint")
                                return;
                            const match = (parent.filename).match(/(?<=\/pages)(.*)(?=\.)/);
                            const url = match ? match[0] : '';
                            _path.node.arguments[1] = BabelNS.types.stringLiteral(url);
                            if (isClient(parent)) { // Remove backend handlers on client bundle
                                const obj = _path.get("arguments.0");
                                const props = obj.get("properties");
                                props.forEach(p => {
                                    const k = p.get("key");
                                    if (['key', 'routes'].includes(k.node.name))
                                        return;
                                    const v = p.get("value");
                                    v[willBeReplacedMark] = true;
                                    v.replaceWithSourceString('()=>{}');
                                });
                                const declarator = _path.parentPath.node;
                                const name = declarator.id.name;
                                const defExport = path.get('body').find(e => t.isExportDefaultDeclaration(e));
                                if (!defExport) {
                                    const e = t.exportDefaultDeclaration(t.memberExpression(t.identifier(name), t.identifier("handler")));
                                    path.node.body.push(e);
                                }
                            }
                        }
                    });
                }
            },
            exit: (path, parent) => {
                if (isClient(parent) && parent.filename.includes('pages/api/')) {
                    RemoveUnusedAndRemovedRefsImports({ path, parent, t: babel.types });
                    if (parent.opts['printClientCode'])
                        printCode({ parent, header: "After removed:" });
                }
            }
        },
    },
});
const willBeReplacedMark = "willBeReplacedMark";
const RemoveUnusedAndRemovedRefsImports = ({ path, parent, t }) => {
    const opts = (parent && parent.opts) || {};
    // Setups
    function match(rule, value) {
        if (typeof rule === "string")
            return rule === value;
        if (rule instanceof RegExp)
            return rule.test(value);
        if (typeof rule === "function")
            return rule(value);
        if (Array.isArray(rule))
            return rule.some((r) => match(r, value));
    }
    const isRemoved = (_path) => {
        if (!_path)
            return false;
        if (_path[willBeReplacedMark])
            return true;
        return isRemoved(_path.parentPath);
    };
    const areReferencesRemoved = (binding) => {
        const refsExists = binding.referencePaths.map((ref) => {
            //console.log(name, "REF:", ref)
            return isRemoved(ref);
        });
        // If false not exists, means all refs are removed
        // console.log(refsExists)
        return !refsExists.includes(false);
    };
    // Work on
    const UnRefBindings = new Map();
    for (const [_, binding] of Object.entries(path.scope.bindings)) {
        if (!binding.path.parentPath || binding.kind !== "module")
            continue;
        const source = binding.path.parentPath.get("source");
        const importName = source.node.value;
        if (!t.isStringLiteral(source) || (opts['ignore'] && match(opts['ignore'], importName)))
            continue;
        const key = `${importName}(${source.node.loc && source.node.loc.start.line})`;
        if (!UnRefBindings.has(key)) {
            UnRefBindings.set(key, binding);
        }
        if (binding.referenced && !areReferencesRemoved(binding)) {
            UnRefBindings.set(key, null);
        }
        else {
            const nodeType = binding.path.node.type;
            if (["ImportSpecifier", "ImportDefaultSpecifier", "ImportNamespaceSpecifier"].includes(nodeType)) {
                binding.path.remove();
            }
            else if (binding.path.parentPath) {
                binding.path.parentPath.remove();
            }
        }
    }
    UnRefBindings.forEach((binding, _) => {
        if (binding && binding.path.parentPath) {
            binding.path.parentPath.remove();
        }
    });
};
