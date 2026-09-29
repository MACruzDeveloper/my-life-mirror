// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AdminAudit } from "@modules/admin/ui/AdminAudit";
import { withClient } from "../../../helpers/queryClient";

function stub(audit: unknown, usuarios: unknown = [{ id: "u-admin", email: "admin@ejemplo.com", rol: "admin", suspendido: false, createdAt: "2026-09-01T10:00:00.000Z" }]) {
  vi.stubGlobal("fetch", vi.fn((url: string) => Promise.resolve({ ok: true, status: 200, json: async () => (url === "/api/admin/audit" ? audit : usuarios) })));
}

afterEach(() => vi.unstubAllGlobals());

describe("AdminAudit (ADM-03)", () => {
  it("muestra las acciones con el email de quien las hizo y solo el id abreviado si la cuenta ya no existe", async () => {
    stub([
      { id: "1", actorId: "u-admin", action: "user.deleted", targetId: "12345678-aaaa-bbbb", occurredAt: "2026-09-20T10:00:00.000Z" },
      { id: "2", actorId: "u-admin", action: "role.changed", targetId: "u-admin", detail: "usuario->premium", occurredAt: "2026-09-19T10:00:00.000Z" },
    ]);
    render(withClient(<AdminAudit />));

    const filaEliminar = (await screen.findByText("Eliminación")).closest("tr")!;
    expect(within(filaEliminar).getByText("admin@ejemplo.com")).toBeInTheDocument();
    expect(within(filaEliminar).getByText("12345678")).toBeInTheDocument();
    const filaRol = screen.getByText("Cambio de rol").closest("tr")!;
    expect(within(filaRol).getByText("usuario->premium")).toBeInTheDocument();
  });

  it("sin acciones lo dice", async () => {
    stub([]);
    render(withClient(<AdminAudit />));

    expect(await screen.findByText(/todavía no hay acciones/i)).toBeInTheDocument();
  });
});
