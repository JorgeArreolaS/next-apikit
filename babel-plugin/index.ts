import * as BabelNS from '@babel/core';
import { template } from '@babel/core';
import generate from '@babel/generator'
import { Binding } from '@babel/traverse';
import chalk from 'chalk';
import * as fs from 'fs'
import { join, normalize, parse, resolve } from 'path'

type Babel = typeof BabelNS;
type PluginObj = BabelNS.PluginObj

type Node = BabelNS.NodePath<BabelNS.types.Node>

const isServer = (parent: BabelNS.PluginPass) => parent.file.opts.caller && parent.file.opts.caller['isServer'] === true
const isClient = (parent: BabelNS.PluginPass) => !isServer(parent)

const sideTag = (parent: BabelNS.PluginPass) => chalk.gray(isServer(parent) ? "[SERVER]" : "[CLIENT]")
const log = (text: string, parent: BabelNS.PluginPass) => {
  const filepath = String(parent.filename).replace(parent.cwd, "")
  console.log(sideTag(parent), chalk.green(filepath), chalk.yellow(text))
}
const printCode = ({ header = "", node, parent }: {
  header?: string,
  node?: BabelNS.Node
  parent: BabelNS.PluginPass,
}) => {
  const code = generate(node || parent.file.path.node).code
    .split("\n")
    .map((line, index) => `${chalk.yellow(index + 1)} | ${line}`)
    .join("\n")

  console.log(
    sideTag(parent), chalk.cyan(header),
    '\n' + code + "\n"
  );
}

const fromCode = (code: string, params: Record<string, any> = {}) => {
  const buildRequire = template(code);
  const ast = buildRequire(params) as BabelNS.types.Statement
  return ast
}

const isCapableOfBlocks = (item: string, exts: string[] = [".tsx", ".ts"]): boolean => {
  const parsed = parse(item)
  if (
    item.includes('pages/api/block') ||
    item.includes('lib/helpers/queryToolkit') ||
    !exts.includes(parsed.ext) ||
    parsed.dir.includes('lib/plugins') ||
    parsed.name.startsWith('_')
  ) return false
  return true
}

export default (babel: Babel): PluginObj => ({
  visitor: {
    Program: {
      enter(path, parent) {
        if (parent.filename.includes('pages/api/block')) {
          log("Start processing in ", parent)
          processBlockApiFound(babel, path, parent)
        }
        if (parent.filename.includes('pages/api/')) {
          log("Joining into an api file", parent)

          path.traverse({
            CallExpression(_path) {
              const callee = _path.node.callee as BabelNS.types.Identifier;
              if (callee.name !== "createEndpoint") return;

              const match = (parent.filename).match(/(?<=\/pages)(.*)(?=\.)/)
              const url = match ? match[0] : '';

              _path.node.arguments[1] = BabelNS.types.stringLiteral(url);

              if (isClient(parent)) { // Remove backend handlers on client bundle
                const obj = _path.get("arguments.0") as Node
                // console.log(obj)
               	const props = obj.get("properties") as Node[]
               	props.forEach( p => {
                  	const v = p.get("value") as Node
                    v[willBeReplacedMark] = true;
                    v.replaceWithSourceString('()=>{}')
                })
              }
            }
          });
        }
        if (isCapableOfBlocks(parent.filename) && parent.file.code.includes("createApiBlock")) {
          log("Creating export of included API blocks", parent)

          const buildRequire = template(`
          export const includeApiBlocks = {}
        `);

          path.node.body.push(buildRequire() as BabelNS.types.Statement)

          // console.log( generate(path.node).code.split("\n").map( (line, index) => `${chalk.yellow(index+1)} | ${line}` ).join("\n"), "\n" )
        }
      },
      exit: (path, parent) => {
        if (isClient(parent) && parent.filename.includes('pages/api/')) {
          parent.opts['ignore'] = ["twin.macro"];
          RemoveUnusedAndRemovedRefsImports({ path, parent, t: babel.types });
          printCode({ parent, header: "After removed:" })
        }
      }
    },
    CallExpression(path, parent) {
      if (!parent.filename.includes('pages/') && !parent.filename.includes('lib/')) return
      if (parent.filename.startsWith("_")) return

      const node = path.node as BabelNS.types.CallExpression
      const callee = node.callee as BabelNS.types.Identifier
      if (callee.name !== "createApiBlock") return

      if (isServer(parent)) {
        const key = node.arguments[0] as BabelNS.types.StringLiteral
        const func = node.arguments[1] as BabelNS.types.ArrowFunctionExpression

        log("Creating API blocks key", parent)

        parent.file.path.node.body.push(fromCode(
          `includeApiBlocks['${key.value}'] = %%func%%`,
          { func: func }
        ))

      } else {
        const func = node.arguments[1] as BabelNS.types.ArrowFunctionExpression
        const body = func.body as BabelNS.types.BlockStatement

        body.body = []
        log("Purged API Blocks in ", parent)
      }
    }
  },
})

function processBlockApiFound(
  babel: Babel,
  path: BabelNS.NodePath<BabelNS.types.Program>,
  parent: BabelNS.PluginPass
) {

  const blocksDir = resolve(parent.cwd, ".dist/api", "blocks")

  if (!fs.existsSync(blocksDir))
    fs.mkdirSync(blocksDir)

  console.log("Loading API blocks\n")

  const exts = ['.ts', '.tsx']
  const dirs = ['pages', 'lib']
  let files = []

  const ignoreCondition = (item: string) => !isCapableOfBlocks(item, exts)

  for (let dir of dirs) {
    files = [...files, ...recursiveReadDirSync(dir, ignoreCondition)]
  }

  let appended_log = []
  const append = (code: string, { log }: { log?: boolean } = { log: true }) => {
    const buildRequire = template(code);
    const ast = buildRequire() as BabelNS.types.Statement
    path.node.body.push(ast)
    if (log) appended_log.push(code)
  }

  console.log("Located API blocks in files:")
  console.log(files.map(f => ` - ${f}`).join('\n'))

  for (let filename of files) {

    let file = fs.readFileSync(filename)
    if (!file.includes('includeApiBlocks'))
      continue

    const filePath = normalize(join(parent.cwd, filename))

    append(`requires = [ ...requires, require("${filePath}").includeApiBlocks ]`)

  }

  console.log("Appended following lines to API endpoint:")
  console.log(appended_log.map(l => ` ${l}`).join("\n"))

  append(`
    updateBlocks()
  `)

  const code = babel.transformFromAstSync(path.node, generate(path.node).code, {
    ast: true,
    filename: parse(parent.filename).base,
    presets: [
      // 'next/babel',
      '@babel/preset-react',
    ],
    plugins: [],
  })

  path.node.body = code.ast.program.body

  console.log("")
}

/**
 * Recursively read directory
 * @param {string[]=[]} arr This doesn't have to be provided, it's used for the recursion
 * @param {string=dir} rootDir Used to replace the initial path, only the relative path is left, it's faster than path.relative.
 * @returns Array holding all relative paths
 */
export function recursiveReadDirSync(
  dir: string,
  ignoreFunc: (item: string) => boolean,
  arr: string[] = [],
  rootDir = dir
): string[] {
  const result = fs.readdirSync(dir)

  result.forEach((part: string) => {
    const path = join(dir, part)
    const pathStat = fs.statSync(path)

    if (pathStat.isDirectory()) {
      recursiveReadDirSync(path, ignoreFunc, arr, rootDir)
      return
    }
    if (ignoreFunc(path)) return
    arr.push(path)
  })

  return arr
}

const willBeReplacedMark = "willBeReplacedMark";

const RemoveUnusedAndRemovedRefsImports = ({ path, parent, t }: {
  path: BabelNS.NodePath<BabelNS.types.Program>,
  parent: BabelNS.PluginPass,
  t: typeof BabelNS.types
}) => {
  const opts = (parent && parent.opts) || {};
  // Setups
  function match(rule: string | string[] | Function | RegExp, value: string) {
    if (typeof rule === "string") return rule === value;
    if (rule instanceof RegExp) return rule.test(value);
    if (typeof rule === "function") return rule(value);
    if (Array.isArray(rule)) return rule.some((r) => match(r, value));
  }

  const isRemoved = (_path: babel.NodePath) => {
    if (!_path) return false;
    if (_path[willBeReplacedMark]) return true;
    return isRemoved(_path.parentPath);
  };
  const areReferencesRemoved = (binding: Binding) => {
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
    if (!binding.path.parentPath || binding.kind !== "module") continue;

    const source = binding.path.parentPath.get("source") as any as BabelNS.NodePath<any>;
    const importName = source.node.value;

    if (!t.isStringLiteral(source) || (opts['ignore'] && match(opts['ignore'], importName))) continue;

    const key = `${importName}(${source.node.loc && source.node.loc.start.line})`;

    if (!UnRefBindings.has(key)) {
      UnRefBindings.set(key, binding);
    }

    if (binding.referenced && !areReferencesRemoved(binding)) {
      UnRefBindings.set(key, null);
    } else {
      const nodeType = binding.path.node.type;
      if (["ImportSpecifier", "ImportDefaultSpecifier", "ImportNamespaceSpecifier"].includes(nodeType)) {
        binding.path.remove();
      } else if (binding.path.parentPath) {
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
