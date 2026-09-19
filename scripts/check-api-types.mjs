// Comprueba las funciones de api/ como las compila Vercel, no como las compila `tsc -b`.
//
// Vercel (@vercel/node) busca el tsconfig.json más cercano hacia arriba, lo lee SIN
// resolver `extends` y, si no define `module`, usa `nodenext` (que exige extensiones en
// los imports relativos). `tsc -b` usa tsconfig.api.json directamente y no ve ese
// problema, así que un despliegue podía fallar con todo verde en local.
// Ver docs/architecture-decisions/03_Arquitectura_Software.md (v2.2).
import { readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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

const programa = ts.createProgram(archivos, { ...options, noEmit: true, allowJs: true });
const errores = ts.getPreEmitDiagnostics(programa).filter((d) => d.file?.fileName.startsWith(apiDir));

if (errores.length > 0) {
  for (const d of errores) {
    const { line } = d.file.getLineAndCharacterOfPosition(d.start ?? 0);
    console.error(`${d.file.fileName.replace(raiz + "/", "")}:${line + 1} TS${d.code} ${ts.flattenDiagnosticMessageText(d.messageText, "\n")}`);
  }
  console.error(`\n${errores.length} error(es): Vercel no compilaría api/ con esta configuración.`);
  process.exit(1);
}
console.log(`api/: ${archivos.length} funciones compilan como en Vercel.`);
