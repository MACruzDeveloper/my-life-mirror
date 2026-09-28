import { describe, expect, it } from "vitest";
import { assertLocalSupabase, buildRoutes, matchRoute } from "../../../e2e/support/apiDevServer";

// Los mismos archivos que hay hoy en api/.
const FILES = [
  "accounts/[action].ts",
  "admin/[action].ts",
  "admin/categories/index.ts",
  "admin/categories/retire.ts",
  "assessments/history.ts",
  "assessments/index.ts",
  "categories/[action].ts",
  "categories/index.ts",
  "consent/grant.ts",
  "recommendations/index.ts",
];

describe("apiDevServer: rutas como las resuelve Vercel", () => {
  const routes = buildRoutes(FILES);
  const fileFor = (url: string) => matchRoute(routes, url)?.file;

  it("un archivo concreto responde a su propia ruta", () => {
    expect(fileFor("/api/assessments/history")).toBe("assessments/history.ts");
    expect(fileFor("/api/consent/grant")).toBe("consent/grant.ts");
  });

  it("index.ts responde a la carpeta, con o sin barra final y con query", () => {
    expect(fileFor("/api/assessments")).toBe("assessments/index.ts");
    expect(fileFor("/api/categories/")).toBe("categories/index.ts");
    expect(fileFor("/api/recommendations?x=1")).toBe("recommendations/index.ts");
  });

  it("[action] responde a un segmento cualquiera", () => {
    expect(fileFor("/api/accounts/login")).toBe("accounts/[action].ts");
    expect(fileFor("/api/categories/translations")).toBe("categories/[action].ts");
  });

  it("lo concreto gana a lo dinámico", () => {
    expect(fileFor("/api/admin/categories")).toBe("admin/categories/index.ts");
    expect(fileFor("/api/admin/categories/retire")).toBe("admin/categories/retire.ts");
    expect(fileFor("/api/admin/users")).toBe("admin/[action].ts");
  });

  it("no inventa rutas", () => {
    expect(fileFor("/api/accounts/login/extra")).toBeUndefined();
    expect(fileFor("/api/nothing")).toBeUndefined();
    expect(fileFor("/inicio")).toBeUndefined();
  });
});

describe("apiDevServer: nunca contra la base de datos real", () => {
  it("acepta un Supabase local", () => {
    expect(() => assertLocalSupabase("http://127.0.0.1:54321")).not.toThrow();
    expect(() => assertLocalSupabase("http://localhost:54321")).not.toThrow();
  });

  it("rechaza cualquier otro, o ninguno", () => {
    expect(() => assertLocalSupabase("https://abcdefgh.supabase.co")).toThrow(/local/);
    expect(() => assertLocalSupabase(undefined)).toThrow(/local/);
    expect(() => assertLocalSupabase("no es una url")).toThrow(/local/);
  });
});
