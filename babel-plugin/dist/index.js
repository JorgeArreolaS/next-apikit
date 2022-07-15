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
exports.recursiveReadDirSync = void 0;
const BabelNS = __importStar(require("@babel/core"));
const core_1 = require("@babel/core");
const generator_1 = __importDefault(require("@babel/generator"));
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path_1 = require("path");
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
const fromCode = (code, params = {}) => {
    const buildRequire = (0, core_1.template)(code);
    const ast = buildRequire(params);
    return ast;
};
const isCapableOfBlocks = (item, exts = [".tsx", ".ts"]) => {
    const parsed = (0, path_1.parse)(item);
    if (item.includes('pages/api/block') ||
        item.includes('lib/helpers/queryToolkit') ||
        !exts.includes(parsed.ext) ||
        parsed.dir.includes('lib/plugins') ||
        parsed.name.startsWith('_'))
        return false;
    return true;
};
exports.default = (babel) => ({
    visitor: {
        Program: {
            enter(path, parent) {
                if (parent.filename.includes('pages/api/block')) {
                    log("Start processing in ", parent);
                    processBlockApiFound(babel, path, parent);
                }
                if (parent.filename.includes('pages/api/')) {
                    log("Joining into an api file", parent);
                    path.traverse({
                        CallExpression(_path) {
                            const callee = _path.node.callee;
                            if (callee.name !== "createEndpoint")
                                return;
                            const match = (parent.filename).match(/(?<=\/pages)(.*)(?=\.)/);
                            const url = match ? match[0] : '';
                            _path.node.arguments[1] = BabelNS.types.stringLiteral(url);
                            if (isClient(parent)) { // Remove backend handlers on client bundle
                                const obj = _path.get("arguments.0");
                                // console.log(obj)
                                const props = obj.get("properties");
                                props.forEach(p => {
                                    const k = p.get("key");
                                    if (['key', 'routes'].includes(k.node.name))
                                        return;
                                    const v = p.get("value");
                                    v[willBeReplacedMark] = true;
                                    v.replaceWithSourceString('()=>{}');
                                });
                            }
                        }
                    });
                }
                if (isCapableOfBlocks(parent.filename) && parent.file.code.includes("createApiBlock")) {
                    log("Creating export of included API blocks", parent);
                    const buildRequire = (0, core_1.template)(`
          export const includeApiBlocks = {}
        `);
                    path.node.body.push(buildRequire());
                    // console.log( generate(path.node).code.split("\n").map( (line, index) => `${chalk.yellow(index+1)} | ${line}` ).join("\n"), "\n" )
                }
            },
            exit: (path, parent) => {
                if (isClient(parent) && parent.filename.includes('pages/api/')) {
                    parent.opts['ignore'] = ["twin.macro"];
                    RemoveUnusedAndRemovedRefsImports({ path, parent, t: babel.types });
                    printCode({ parent, header: "After removed:" });
                }
            }
        },
        CallExpression(path, parent) {
            if (!parent.filename.includes('pages/') && !parent.filename.includes('lib/'))
                return;
            if (parent.filename.startsWith("_"))
                return;
            const node = path.node;
            const callee = node.callee;
            if (callee.name !== "createApiBlock")
                return;
            if (isServer(parent)) {
                const key = node.arguments[0];
                const func = node.arguments[1];
                log("Creating API blocks key", parent);
                parent.file.path.node.body.push(fromCode(`includeApiBlocks['${key.value}'] = %%func%%`, { func: func }));
            }
            else {
                const func = node.arguments[1];
                const body = func.body;
                body.body = [];
                log("Purged API Blocks in ", parent);
            }
        }
    },
});
function processBlockApiFound(babel, path, parent) {
    const blocksDir = (0, path_1.resolve)(parent.cwd, ".dist/api", "blocks");
    if (!fs.existsSync(blocksDir))
        fs.mkdirSync(blocksDir);
    console.log("Loading API blocks\n");
    const exts = ['.ts', '.tsx'];
    const dirs = ['pages', 'lib'];
    let files = [];
    const ignoreCondition = (item) => !isCapableOfBlocks(item, exts);
    for (let dir of dirs) {
        files = [...files, ...recursiveReadDirSync(dir, ignoreCondition)];
    }
    let appended_log = [];
    const append = (code, { log } = { log: true }) => {
        const buildRequire = (0, core_1.template)(code);
        const ast = buildRequire();
        path.node.body.push(ast);
        if (log)
            appended_log.push(code);
    };
    console.log("Located API blocks in files:");
    console.log(files.map(f => ` - ${f}`).join('\n'));
    for (let filename of files) {
        let file = fs.readFileSync(filename);
        if (!file.includes('includeApiBlocks'))
            continue;
        const filePath = (0, path_1.normalize)((0, path_1.join)(parent.cwd, filename));
        append(`requires = [ ...requires, require("${filePath}").includeApiBlocks ]`);
    }
    console.log("Appended following lines to API endpoint:");
    console.log(appended_log.map(l => ` ${l}`).join("\n"));
    append(`
    updateBlocks()
  `);
    const code = babel.transformFromAstSync(path.node, (0, generator_1.default)(path.node).code, {
        ast: true,
        filename: (0, path_1.parse)(parent.filename).base,
        presets: [
            // 'next/babel',
            '@babel/preset-react',
        ],
        plugins: [],
    });
    path.node.body = code.ast.program.body;
    console.log("");
}
/**
 * Recursively read directory
 * @param {string[]=[]} arr This doesn't have to be provided, it's used for the recursion
 * @param {string=dir} rootDir Used to replace the initial path, only the relative path is left, it's faster than path.relative.
 * @returns Array holding all relative paths
 */
function recursiveReadDirSync(dir, ignoreFunc, arr = [], rootDir = dir) {
    const result = fs.readdirSync(dir);
    result.forEach((part) => {
        const path = (0, path_1.join)(dir, part);
        const pathStat = fs.statSync(path);
        if (pathStat.isDirectory()) {
            recursiveReadDirSync(path, ignoreFunc, arr, rootDir);
            return;
        }
        if (ignoreFunc(path))
            return;
        arr.push(path);
    });
    return arr;
}
exports.recursiveReadDirSync = recursiveReadDirSync;
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
