// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AdminUsers } from "@modules/admin/ui/AdminUsers";
import { withClient } from "../../../helpers/queryClient";

const YO = { id: "u-admin", email: "admin@ejemplo.com", name: "Admin", rol: "admin", suspendido: false, createdAt: "2026-09-01T10:00:00.000Z" };
const ANA = { id: "u-ana", email: "ana@ejemplo.com", name: "Ana", rol: "usuario", suspendido: false, createdAt: "2026-09-18T10:00:00.000Z", lastSignInAt: "2026-09-19T08:00:00.000Z" };
const LUIS = { id: "u-luis", email: "luis@ejemplo.com", rol: "usuario", suspendido: true, createdAt: "2026-09-10T10:00:00.000Z" };
const OTHER_ADMIN = { id: "u-admin2", email: "admin2@ejemplo.com", rol: "admin", suspendido: false, createdAt: "2026-09-05T10:00:00.000Z" };

function stubFetch(post?: (url: string, init: RequestInit) => unknown) {
  const fetchMock: ReturnType<typeof vi.fn> = vi.fn((url: string, init?: RequestInit) => {
    if (init?.method === "POST") {
      return Promise.resolve(post?.(url, init) ?? { ok: true, status: 200, json: async () => ({ ok: true }) });
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => [YO, ANA, LUIS, OTHER_ADMIN] });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderUsers() {
  return render(withClient(<AdminUsers />));
}

async function openAction(email: string, action: RegExp) {
  await screen.findByText(email);
  const row = screen.getByText(email).closest("tr")!;
  fireEvent.click(within(row).getByRole("button", { name: /acciones/i }));
  fireEvent.click(await screen.findByRole("menuitem", { name: action }));
  return screen.findByRole("dialog");
}

function postCalls(fetchMock: ReturnType<typeof vi.fn>, url: string) {
  return fetchMock.mock.calls.filter(([u, i]) => u === url && i?.method === "POST");
}

afterEach(() => vi.unstubAllGlobals());

describe("AdminUsers (ADM-03)", () => {
  it("lista los usuarios con nombre, rol y si están suspendidos", async () => {
    stubFetch();
    renderUsers();

    const rowAna = (await screen.findByText("ana@ejemplo.com")).closest("tr")!;
    expect(within(rowAna).getByText("Ana")).toBeInTheDocument();
    expect(within(rowAna).getByText("usuario")).toBeInTheDocument();
    const rowLuis = screen.getByText("luis@ejemplo.com").closest("tr")!;
    expect(within(rowLuis).getByText(/suspendida/i)).toBeInTheDocument();
  });

  it("suspender pide la contraseña del admin y no llama al servidor hasta confirmar", async () => {
    const fetchMock = stubFetch();
    renderUsers();

    const dialog = await openAction("ana@ejemplo.com", /suspender/i);
    const confirmAction = within(dialog).getByRole("button", { name: /confirmar/i });
    expect(confirmAction).toBeDisabled();
    expect(postCalls(fetchMock, "/api/admin/user-suspend")).toHaveLength(0);

    fireEvent.change(within(dialog).getByLabelText(/tu contraseña/i), { target: { value: "adminpass1" } });
    fireEvent.click(confirmAction);

    await waitFor(() => expect(postCalls(fetchMock, "/api/admin/user-suspend")).toHaveLength(1));
    expect(JSON.parse(postCalls(fetchMock, "/api/admin/user-suspend")[0][1].body)).toEqual({ userId: "u-ana", password: "adminpass1" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("una contraseña incorrecta se explica y deja reintentar", async () => {
    stubFetch(() => ({ ok: false, status: 403, json: async () => ({ error: "Contraseña incorrecta", code: "AUTHENTICATION_ERROR" }) }));
    renderUsers();

    const dialog = await openAction("ana@ejemplo.com", /eliminar/i);
    fireEvent.change(within(dialog).getByLabelText(/tu contraseña/i), { target: { value: "mal" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /confirmar/i }));

    expect(await within(dialog).findByText(/contraseña no es correcta/i)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /confirmar/i })).toBeEnabled();
  });

  it("eliminar avisa de que es irreversible y envía la petición con la contraseña", async () => {
    const fetchMock = stubFetch();
    renderUsers();

    const dialog = await openAction("ana@ejemplo.com", /eliminar/i);
    expect(within(dialog).getByText(/no se puede deshacer/i)).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText(/tu contraseña/i), { target: { value: "adminpass1" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /confirmar/i }));

    await waitFor(() => expect(postCalls(fetchMock, "/api/admin/user-delete")).toHaveLength(1));
    expect(JSON.parse(postCalls(fetchMock, "/api/admin/user-delete")[0][1].body)).toEqual({ userId: "u-ana", password: "adminpass1" });
  });

  it("cambia el rol eligiendo uno y confirmando con la contraseña", async () => {
    const fetchMock = stubFetch();
    renderUsers();

    const dialog = await openAction("ana@ejemplo.com", /cambiar rol/i);
    fireEvent.mouseDown(within(dialog).getByRole("combobox"));
    fireEvent.click(await screen.findByRole("option", { name: "premium" }));
    fireEvent.change(within(dialog).getByLabelText(/tu contraseña/i), { target: { value: "adminpass1" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /confirmar/i }));

    await waitFor(() => expect(postCalls(fetchMock, "/api/admin/user-role")).toHaveLength(1));
    expect(JSON.parse(postCalls(fetchMock, "/api/admin/user-role")[0][1].body)).toEqual({ userId: "u-ana", rol: "premium", password: "adminpass1" });
  });

  it("cambia el email con la contraseña y el nombre sin ella", async () => {
    const fetchMock = stubFetch();
    renderUsers();

    const dEmail = await openAction("ana@ejemplo.com", /cambiar email/i);
    fireEvent.change(within(dEmail).getByLabelText(/nuevo email/i), { target: { value: "ana.nueva@ejemplo.com" } });
    fireEvent.change(within(dEmail).getByLabelText(/tu contraseña/i), { target: { value: "adminpass1" } });
    fireEvent.click(within(dEmail).getByRole("button", { name: /confirmar/i }));
    await waitFor(() => expect(postCalls(fetchMock, "/api/admin/user-email")).toHaveLength(1));
    expect(JSON.parse(postCalls(fetchMock, "/api/admin/user-email")[0][1].body)).toEqual({ userId: "u-ana", email: "ana.nueva@ejemplo.com", password: "adminpass1" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    const dName = await openAction("ana@ejemplo.com", /cambiar nombre/i);
    expect(within(dName).queryByLabelText(/tu contraseña/i)).not.toBeInTheDocument();
    fireEvent.change(within(dName).getByLabelText(/nuevo nombre/i), { target: { value: "Ana María" } });
    fireEvent.click(within(dName).getByRole("button", { name: /confirmar/i }));
    await waitFor(() => expect(postCalls(fetchMock, "/api/admin/user-name")).toHaveLength(1));
    expect(JSON.parse(postCalls(fetchMock, "/api/admin/user-name")[0][1].body)).toEqual({ userId: "u-ana", name: "Ana María" });
  });

  it("reactivar una cuenta suspendida no pide contraseña", async () => {
    const fetchMock = stubFetch();
    renderUsers();

    await screen.findByText("luis@ejemplo.com");
    const row = screen.getByText("luis@ejemplo.com").closest("tr")!;
    fireEvent.click(within(row).getByRole("button", { name: /acciones/i }));
    fireEvent.click(await screen.findByRole("menuitem", { name: /reactivar/i }));

    await waitFor(() => expect(postCalls(fetchMock, "/api/admin/user-reactivate")).toHaveLength(1));
    expect(JSON.parse(postCalls(fetchMock, "/api/admin/user-reactivate")[0][1].body)).toEqual({ userId: "u-luis" });
  });

  it("no ofrece suspender ni eliminar a los administradores (hay que degradarlos antes)", async () => {
    stubFetch();
    renderUsers();

    await screen.findByText("admin2@ejemplo.com");
    const otherAdminRow = screen.getByText("admin2@ejemplo.com").closest("tr")!;
    fireEvent.click(within(otherAdminRow).getByRole("button", { name: /acciones/i }));
    expect(await screen.findByRole("menuitem", { name: /suspender/i })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("menuitem", { name: /eliminar/i })).toHaveAttribute("aria-disabled", "true");
  });

  it("crea un usuario y muestra su contraseña temporal una sola vez", async () => {
    const fetchMock = stubFetch((url) =>
      url === "/api/admin/user-create" ? { ok: true, status: 200, json: async () => ({ id: "n1", email: "nuria@ejemplo.com", temporaryPassword: "Tmp-Pass-1234" }) } : undefined,
    );
    renderUsers();
    await screen.findByText("ana@ejemplo.com");

    fireEvent.click(screen.getByRole("button", { name: /crear usuario/i }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/^email/i), { target: { value: "nuria@ejemplo.com" } });
    fireEvent.change(within(dialog).getByLabelText(/^nombre/i), { target: { value: "Nuria" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /^crear$/i }));

    expect(await within(dialog).findByText("Tmp-Pass-1234")).toBeInTheDocument();
    expect(within(dialog).getByText(/solo se muestra ahora/i)).toBeInTheDocument();
    expect(JSON.parse(postCalls(fetchMock, "/api/admin/user-create")[0][1].body)).toEqual({ email: "nuria@ejemplo.com", name: "Nuria" });

    fireEvent.click(within(dialog).getByRole("button", { name: /cerrar/i }));
    await waitFor(() => expect(screen.queryByText("Tmp-Pass-1234")).not.toBeInTheDocument());
  });

  it("si el email ya existe al crear, lo dice", async () => {
    stubFetch((url) => (url === "/api/admin/user-create" ? { ok: false, status: 409, json: async () => ({ error: "Ya existe", code: "CONFLICT" }) } : undefined));
    renderUsers();
    await screen.findByText("ana@ejemplo.com");

    fireEvent.click(screen.getByRole("button", { name: /crear usuario/i }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/^email/i), { target: { value: "ana@ejemplo.com" } });
    fireEvent.change(within(dialog).getByLabelText(/^nombre/i), { target: { value: "Otra" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /^crear$/i }));

    expect(await within(dialog).findByText(/ya está en uso/i)).toBeInTheDocument();
  });

  it("enviar el enlace de recuperación pide una confirmación sencilla", async () => {
    const fetchMock = stubFetch();
    renderUsers();

    const dialog = await openAction("ana@ejemplo.com", /enlace de recuperación/i);
    fireEvent.click(within(dialog).getByRole("button", { name: /confirmar/i }));

    await waitFor(() => expect(postCalls(fetchMock, "/api/admin/user-recovery")).toHaveLength(1));
  });
});
