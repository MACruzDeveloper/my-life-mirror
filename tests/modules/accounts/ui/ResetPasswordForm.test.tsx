// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { ResetPasswordForm } from "@modules/accounts/ui/ResetPasswordForm";

function renderConHash(hash: string) {
  window.location.hash = hash;
  return render(
    <MemoryRouter>
      <ResetPasswordForm />
    </MemoryRouter>,
  );
}

describe("RestablecerPasswordForm (RF-38)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.location.hash = "";
  });

  it("sin token en la URL, muestra un error y no deja enviar el formulario", () => {
    renderConHash("");

    expect(screen.getByText(/enlace no válido/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/nueva contraseña/i)).not.toBeInTheDocument();
  });

  it("con token válido, envía la nueva contraseña y confirma el cambio", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));

    renderConHash("#access_token=abc123&type=recovery");
    fireEvent.change(screen.getByLabelText(/^nueva contraseña/i), { target: { value: "Nueva-Clave-Lluvia-47" } });
    fireEvent.click(screen.getByRole("button", { name: /cambiar contraseña/i }));

    await waitFor(() => {
      expect(screen.getByText(/contraseña actualizada/i)).toBeInTheDocument();
    });
  });

  it("enseña los requisitos y no envía una contraseña débil (SEC-01)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    renderConHash("#access_token=abc123&type=recovery");
    expect(screen.getByRole("list", { name: /tu contraseña necesita/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/^nueva contraseña/i), { target: { value: "Test1234!" } });
    fireEvent.click(screen.getByRole("button", { name: /cambiar contraseña/i }));

    expect(await screen.findByText(/no cumple los requisitos/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
