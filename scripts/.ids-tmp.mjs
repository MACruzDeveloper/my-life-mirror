import ts from "typescript";
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
const dict = new Set(readFileSync("/usr/share/dict/words", "utf8").toLowerCase().split("\n"));
for (const w of "api ui id ids url json http html css svg tsx ts js db sql dto env config eslint vite vitest playwright supabase vercel zod mui echarts rls uuid auth jwt props param params init async const enum num str obj arr fn cb req res err msg src dir app admin href regex utc iso min max temp tmp nav tab btn aria ok e2e dom esm fs os lang locale locales i18n i18next sm md lg xs xl fetch toggle optimistic mutate catalog label labels checkbox dialog tooltip radar chart timeline assessment assessments recommendation recommendations dev prod runtime middleware callback unmount rerender stub spy mock fake fakes prev logout login signup viewport endpoint lookup keyof typeof repo repos sessions hmr pathname hostname timeout timestamp timestamps retries formatter encoding stdio tmpdir dirname plugins mkdtemp readdir symlink noSsr lng fallback metadata banned occurred".split(" ")) dict.add(w);
const files = execSync("git ls-files 'src/**/*.ts' 'src/**/*.tsx' 'api/**/*.ts' 'tests/**/*.ts' 'tests/**/*.tsx' 'e2e/**/*.ts'", { encoding: "utf8" }).split("\n").filter(Boolean);
const words = (id) => id.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2").split(/[\s_]+/).filter(Boolean).map((w) => w.toLowerCase());
const eng = (w) => w.length <= 2 || /^\d+$/.test(w) || [w, w.replace(/s$/, ""), w.replace(/es$/, ""), w.replace(/ed$/, ""), w.replace(/ing$/, ""), w.replace(/d$/, ""), w.replace(/ies$/, "y")].some((x) => dict.has(x));
const out = new Map();
for (const f of files) {
  const src = ts.createSourceFile(f, readFileSync(f, "utf8"), ts.ScriptTarget.Latest, true);
  const visit = (n) => {
    const p = n.parent;
    if (ts.isIdentifier(n) && p && "name" in p && p.name === n) {
      const ok = ts.isVariableDeclaration(p) || ts.isFunctionDeclaration(p) || ts.isParameter(p) || ts.isClassDeclaration(p) || ts.isInterfaceDeclaration(p) || ts.isTypeAliasDeclaration(p) || ts.isMethodSignature(p) || ts.isMethodDeclaration(p) || ts.isFunctionExpression(p) || (ts.isBindingElement(p) && !p.propertyName && !ts.isObjectBindingPattern(p.parent));
      if (ok && !/_/.test(n.text.replace(/^[A-Z_]+$/, "x")) && words(n.text).some((w) => !eng(w))) {
        const e = out.get(n.text) ?? new Set(); e.add(ts.SyntaxKind[p.kind].replace("Declaration", "").replace("Signature", "")); out.set(n.text, e);
      }
      if (ok && /^[A-Z][A-Z_]+$/.test(n.text) && words(n.text).some((w) => !eng(w))) { const e = out.get(n.text) ?? new Set(); e.add("Const"); out.set(n.text, e); }
    }
    ts.forEachChild(n, visit);
  };
  visit(src);
}
writeFileSync("/tmp/ids.json", JSON.stringify([...out.keys()].sort()));
console.log(out.size); console.log([...out.entries()].sort().map(([k, v]) => `${k}(${[...v][0][0]})`).join(" "));
