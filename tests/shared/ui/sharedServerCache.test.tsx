// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";
import { Home } from "@modules/panel/ui/home/Home";
import { InterviewPage } from "@modules/assessments/ui/InterviewPage";
import { createTestClient, withClient } from "../../helpers/queryClient";
import { categoryLabelsFixture } from "../../helpers/categoryLabels";

vi.mock("echarts/core", () => ({ use: vi.fn(), init: vi.fn(() => ({ setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn() })) }));

afterEach(() => vi.unstubAllGlobals());

// Respuesta a "¿hace falta Zustand para no cargar lo mismo dos veces?": no. La
// caché de TanStack Query es compartida por toda la app (un único QueryClient),
// así que dos pantallas que piden la misma clave reutilizan los mismos datos.
describe("Caché de datos compartida entre pantallas", () => {
  it("ir de Inicio a la Entrevista no vuelve a pedir el historial ni las puntuaciones", async () => {
    const fetchMock = vi.fn((url: string) => {
      const bodies: Record<string, unknown> = {
        "/api/assessments": [{ categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", score: 7, recordedAt: "2026-09-18T10:00:00.000Z" }],
        "/api/assessments/history": [{ recordedAt: "2026-09-18T10:00:00.000Z", entries: [{ categoryId: "c1", catalogId: "k-economia", categoryName: "Economía", score: 7 }] }],
        "/api/categories": [{ id: "c1", catalogId: "k-economia", name: "Economía", status: "active", isSensitiveData: false }],
        "/api/recommendations": [],
        "/api/categories/translations": categoryLabelsFixture(),
      };
      return Promise.resolve({ ok: true, status: 200, json: async () => bodies[url] ?? [] });
    });
    vi.stubGlobal("fetch", fetchMock);
    const client = createTestClient();

    const start = render(withClient(<MemoryRouter><Home /></MemoryRouter>, client));
    await screen.findByRole("region", { name: "Economía" });
    await waitFor(() => expect(fetchMock.mock.calls.some(([u]) => u === "/api/assessments/history")).toBe(true));
    start.unmount();

    render(withClient(<MemoryRouter><InterviewPage /></MemoryRouter>, client));
    await screen.findByRole("checkbox", { name: /economía/i });

    const countCalls = (url: string) => fetchMock.mock.calls.filter(([u]) => u === url).length;
    expect(countCalls("/api/assessments/history")).toBe(1);
    expect(countCalls("/api/assessments")).toBe(1);
  });
});
