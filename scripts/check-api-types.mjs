// Comprueba las funciones de api/ como las compila Vercel, no como las compila `tsc -b`.
//
// Vercel (@vercel/node) busca el tsconfig.json más cercano hacia arriba, lo lee SIN
// resolver `extends` y, si no define `module`, usa `nodenext` (que exige extensiones en
// los imports relativos). Como el paquete es `"type": "module"`, en Vercel las funciones
// se ejecutan como ESM nativo de Node: un import relativo sin `.js` compila, pero falla
// al arrancar. Por eso api/tsconfig.json declara `nodenext`: lo mismo que ejecuta Node. `tsc -b` usa tsconfig.api.json directamente y no ve ese
// problema, así que un despliegue podía fallar con todo verde en local.
// Ver docs/architecture-decisions/03_Arquitectura_Software.md (v2.2).
import { mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = join(rootDir, "api");
const tsconfigApi = join(apiDir, "tsconfig.json");

const { config } = ts.readConfigFile(tsconfigApi, ts.sys.readFile); // igual que Vercel: sin resolver `extends`
const compilerOptions = config?.compilerOptions ?? {};
if (compilerOptions.module === undefined) {
  compilerOptions.module = "nodenext";
  compilerOptions.moduleResolution = "nodenext";
}

const { options } = ts.parseJsonConfigFileContent({ compilerOptions }, ts.sys, apiDir);
const apiFiles = readdirSync(apiDir, { recursive: true })
  .map(String)
  .filter((path) => path.endsWith(".ts"))
  .map((path) => join(apiDir, path));

// Plan Hobby de Vercel: máx. 12 funciones serverless por despliegue (cada .ts de api/ es una).
const MAX_HOBBY_FUNCTIONS = 12;
if (apiFiles.length > MAX_HOBBY_FUNCTIONS) {
  console.error(`api/ tiene ${apiFiles.length} funciones y el plan Hobby permite ${MAX_HOBBY_FUNCTIONS}. Agrupa acciones con createRouter (ver api/accounts/[action].ts).`);
  process.exit(1);
}

const program = ts.createProgram(apiFiles, { ...options, noEmit: true, allowJs: true });
// Todos los archivos que api/ alcanza (src/shared, dominio/aplicación/infraestructura), no
// solo los de api/: el 27 sept. un import sin extensión en src/ tumbaba las funciones en
// Vercel ("Cannot find module …/router") con este script en verde.
const errors = ts.getPreEmitDiagnostics(program).filter((d) => d.file && !d.file.fileName.includes("/node_modules/"));

if (errors.length > 0) {
  for (const d of errors) {
    const { line } = d.file.getLineAndCharacterOfPosition(d.start ?? 0);
    console.error(`${d.file.fileName.replace(rootDir + "/", "")}:${line + 1} TS${d.code} ${ts.flattenDiagnosticMessageText(d.messageText, "\n")}`);
  }
  console.error(`\n${errors.length} error(es): Vercel no compilaría api/ con esta configuración.`);
  process.exit(1);
}
// Segunda comprobación, en tiempo de ejecución: compilar a JS y cargar cada función con
// Node, como hace Vercel. Detecta lo que los tipos no ven (un módulo que no se resuelve,
// un import de algo que solo existe en Vite…). No se ejecuta ningún handler: solo se cargan.
const outDir = mkdtempSync(join(tmpdir(), "check-api-"));
const failures = [];
try {
  const emitResult = ts.createProgram(apiFiles, { ...options, noEmit: false, outDir: outDir, rootDir: rootDir }).emit();
  if (emitResult.emitSkipped) throw new Error("No se pudo compilar api/ a JavaScript");
  // Mismo "type" e "imports" que el package.json del proyecto: Node resuelve los imports
  // `#shared/…` y `#modules/…` con ese mapeo, igual que hará en Vercel.
  const { type, imports } = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf8"));
  writeFileSync(join(outDir, "package.json"), JSON.stringify({ type, imports }));
  symlinkSync(join(rootDir, "node_modules"), join(outDir, "node_modules"), "dir");

  for (const file of apiFiles) {
    const compiled = join(outDir, file.slice(rootDir.length + 1)).replace(/\.ts$/, ".js");
    try {
      const loaded = await import(pathToFileURL(compiled).href);
      if (typeof loaded.default !== "function") failures.push(`${file.replace(rootDir + "/", "")}: no exporta un handler por defecto`);
    } catch (error) {
      failures.push(`${file.replace(rootDir + "/", "")}: ${String(error?.message ?? error).split("\n")[0]}`);
    }
  }
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
if (failures.length > 0) {
  console.error(failures.join("\n"));
  console.error(`\n${failures.length} función(es) no arrancarían en Vercel.`);
  process.exit(1);
}

console.log(`api/: ${apiFiles.length} funciones (máx. ${MAX_HOBBY_FUNCTIONS} en Hobby) compilan y cargan como en Vercel.`);
