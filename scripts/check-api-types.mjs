// Comprueba las funciones de api/ como las compila Vercel, no como las compila `tsc -b`.
//
// Vercel (@vercel/node) busca el tsconfig.json más cercano hacia arriba, lo lee SIN
// resolver `extends` y, si no define `module`, usa `nodenext` (que exige extensiones en
// los imports relativos). Como el paquete es `"type": "module"`, en Vercel las funciones
// se ejecutan como ESM nativo de Node: un import relativo sin `.js` compila, pero falla
// al arrancar. Por eso api/tsconfig.json declara `nodenext`: lo mismo que ejecuta Node. `tsc -b` usa tsconfig.api.json directamente y no ve ese
// problema, así que un despliegue podía fallar con todo verde en local.
// Ver docs/architecture-decisions/03_Arquitectura_Software.md (v2.2).
import { mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = join(raiz, "api");
const tsconfigApi = join(apiDir, "tsconfig.json");

const { config } = ts.readConfigFile(tsconfigApi, ts.sys.readFile); // igual que Vercel: sin resolver `extends`
const compilerOptions = config?.compilerOptions ?? {};
if (compilerOptions.module === undefined) {
  compilerOptions.module = "nodenext";
  compilerOptions.moduleResolution = "nodenext";
}

const { options } = ts.parseJsonConfigFileContent({ compilerOptions }, ts.sys, apiDir);
const archivos = readdirSync(apiDir, { recursive: true })
  .map(String)
  .filter((ruta) => ruta.endsWith(".ts"))
  .map((ruta) => join(apiDir, ruta));

// Plan Hobby de Vercel: máx. 12 funciones serverless por despliegue (cada .ts de api/ es una).
const MAX_FUNCIONES_HOBBY = 12;
if (archivos.length > MAX_FUNCIONES_HOBBY) {
  console.error(`api/ tiene ${archivos.length} funciones y el plan Hobby permite ${MAX_FUNCIONES_HOBBY}. Agrupa acciones con createRouter (ver api/accounts/[action].ts).`);
  process.exit(1);
}

const programa = ts.createProgram(archivos, { ...options, noEmit: true, allowJs: true });
// Todos los archivos que api/ alcanza (src/shared, dominio/aplicación/infraestructura), no
// solo los de api/: el 27 sept. un import sin extensión en src/ tumbaba las funciones en
// Vercel ("Cannot find module …/router") con este script en verde.
const errores = ts.getPreEmitDiagnostics(programa).filter((d) => d.file && !d.file.fileName.includes("/node_modules/"));

if (errores.length > 0) {
  for (const d of errores) {
    const { line } = d.file.getLineAndCharacterOfPosition(d.start ?? 0);
    console.error(`${d.file.fileName.replace(raiz + "/", "")}:${line + 1} TS${d.code} ${ts.flattenDiagnosticMessageText(d.messageText, "\n")}`);
  }
  console.error(`\n${errores.length} error(es): Vercel no compilaría api/ con esta configuración.`);
  process.exit(1);
}
// Segunda comprobación, en tiempo de ejecución: compilar a JS y cargar cada función con
// Node, como hace Vercel. Detecta lo que los tipos no ven (un módulo que no se resuelve,
// un import de algo que solo existe en Vite…). No se ejecuta ningún handler: solo se cargan.
const salida = mkdtempSync(join(tmpdir(), "check-api-"));
const fallos = [];
try {
  const emision = ts.createProgram(archivos, { ...options, noEmit: false, outDir: salida, rootDir: raiz }).emit();
  if (emision.emitSkipped) throw new Error("No se pudo compilar api/ a JavaScript");
  writeFileSync(join(salida, "package.json"), JSON.stringify({ type: "module" }));
  symlinkSync(join(raiz, "node_modules"), join(salida, "node_modules"), "dir");

  for (const archivo of archivos) {
    const compilado = join(salida, archivo.slice(raiz.length + 1)).replace(/\.ts$/, ".js");
    try {
      const modulo = await import(pathToFileURL(compilado).href);
      if (typeof modulo.default !== "function") fallos.push(`${archivo.replace(raiz + "/", "")}: no exporta un handler por defecto`);
    } catch (error) {
      fallos.push(`${archivo.replace(raiz + "/", "")}: ${String(error?.message ?? error).split("\n")[0]}`);
    }
  }
} finally {
  rmSync(salida, { recursive: true, force: true });
}
if (fallos.length > 0) {
  console.error(fallos.join("\n"));
  console.error(`\n${fallos.length} función(es) no arrancarían en Vercel.`);
  process.exit(1);
}

console.log(`api/: ${archivos.length} funciones (máx. ${MAX_FUNCIONES_HOBBY} en Hobby) compilan y cargan como en Vercel.`);
