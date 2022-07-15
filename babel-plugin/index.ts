import * as BabelNS from '@babel/core';
import generate from '@babel/generator'
import { Binding } from '@babel/traverse';
import chalk from 'chalk';

type Babel = typeof BabelNS;
type PluginObj = BabelNS.PluginObj
const t = BabelNS.types

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

export default (babel: Babel): PluginObj => ({
  visitor: {
    Program: {
      enter(path, parent) {
        if (parent.filename.includes('pages/api/')) {
          // log("Into an api file", parent)

          path.traverse({
            CallExpression(_path) {
              const callee = _path.node.callee as BabelNS.types.Identifier;
              if (callee.name !== "endpoint") return;

              const match = (parent.filename).match(/(?<=\/pages)(.*)(?=\.)/)
              const url = match ? match[0] : '';

              _path.node.arguments[1] = BabelNS.types.stringLiteral(url);

              if (isClient(parent)) { // Remove backend handlers on client bundle
                const obj = _path.get("arguments.0") as Node

                const props = obj.get("properties") as Node[]
                props.forEach(p => {
                  const k = p.get("key") as BabelNS.NodePath<BabelNS.types.Identifier>
                  if (['key', 'routes'].includes(k.node.name))
                    return

                  const v = p.get("value") as Node
                  v[willBeReplacedMark] = true;
                  v.replaceWithSourceString('()=>{}')
                })

                const declarator = _path.parentPath.node as BabelNS.types.VariableDeclarator
                const name = ( declarator.id as BabelNS.types.Identifier ).name

                const defExport = path.get('body').find(e => t.isExportDefaultDeclaration(e))

                if (!defExport) {
                  const e = t.exportDefaultDeclaration(
                    t.memberExpression(
                      t.identifier(name),
                      t.identifier("handler"),
                    )
                  )
                  path.node.body.push(e)
                }

              }
            }
          });
        }
      },
      exit: (path, parent) => {
        if (isClient(parent) && parent.filename.includes('pages/api/')) {
          RemoveUnusedAndRemovedRefsImports({ path, parent, t: babel.types });
          printCode({ parent, header: "After removed:" })
        }
      }
    },
  },
})

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
