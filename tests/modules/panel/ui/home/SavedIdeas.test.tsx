// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { createTestClient, withClient } from "../../../../helpers/queryClient";
import { SavedIdeas } from "@modules/panel/ui/home/SavedIdeas";
import { visibleIdeaKeys } from "@modules/recommendations/ui/ideaReactions";

const NAMES = { c1: "Economía", c2: "Familia" };
const reaction = (categoryId: string, templateKey: string, kind: string) => ({ categoryId, templateKey, reaction: kind, reactedAt: "2026-10-12T10:00:00.000Z" });

function stubReactions(reactions: unknown[]) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => Promise.resolve({ ok: true, json: async () => (init?.method === "POST" ? { ok: true } : url === "/api/recommendations/reactions" ? reactions : []) }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("Tus ideas guardadas (RF-19)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("enseña cada idea guardada con su texto y su categoría; no las hechas ni las descartadas", async () => {
    stubReactions([reaction("c1", "economia.2", "saved"), reaction("c2", "familia.1", "done"), reaction("c2", "familia.3", "discarded")]);

    render(withClient(<SavedIdeas categoryNames={NAMES} />));

    const section = await screen.findByRole("region", { name: /tus ideas guardadas/i });
    const items = within(section).getAllByRole("listitem");
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent("Economía");
    // El texto de la idea, no su clave.
    expect(items[0]).not.toHaveTextContent("economia.2");
    expect(items[0].textContent!.length).toBeGreaterThan(40);
  });

  it("'Hecha' la marca como hecha y sale de la lista; la caché queda al día sin volver a pedirla", async () => {
    const fetchMock = stubReactions([reaction("c1", "economia.2", "saved")]);
    const client = createTestClient();
    render(withClient(<SavedIdeas categoryNames={NAMES} />, client));

    fireEvent.click(await screen.findByRole("button", { name: /hecha/i }));

    await waitFor(() => expect(screen.queryByRole("region", { name: /tus ideas guardadas/i })).not.toBeInTheDocument());
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST")!;
    expect(JSON.parse(post[1]!.body as string)).toEqual({ categoryId: "c1", templateKey: "economia.2", reaction: "done" });
    expect(fetchMock.mock.calls.filter(([url, init]) => url === "/api/recommendations/reactions" && !init?.method)).toHaveLength(1);
  });

  it("'Quitar' borra la reacción", async () => {
    const fetchMock = stubReactions([reaction("c1", "economia.2", "saved")]);
    render(withClient(<SavedIdeas categoryNames={NAMES} />));

    fireEvent.click(await screen.findByRole("button", { name: /quitar/i }));

    await waitFor(() => expect(fetchMock.mock.calls.some(([, init]) => init?.method === "POST")).toBe(true));
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST")!;
    expect(JSON.parse(post[1]!.body as string)).toMatchObject({ reaction: null });
  });

  it("sin ideas guardadas no pinta nada", async () => {
    stubReactions([reaction("c2", "familia.3", "discarded")]);
    const { container } = render(withClient(<SavedIdeas categoryNames={NAMES} />));

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});

describe("ideas del carrusel sin las descartadas (RF-19)", () => {
  it("quita las descartadas de esa categoría, no las de otra ni las guardadas", () => {
    const reactions = [reaction("c1", "economia.2", "discarded"), reaction("c2", "economia.3", "discarded"), reaction("c1", "economia.4", "saved")] as never;

    expect(visibleIdeaKeys(["economia.1", "economia.2", "economia.3", "economia.4"], reactions, "c1")).toEqual(["economia.1", "economia.3", "economia.4"]);
  });

  it("sin categoría (una idea suelta) no quita nada", () => {
    expect(visibleIdeaKeys(["general.1"], [reaction("c1", "general.1", "discarded")] as never, undefined)).toEqual(["general.1"]);
  });
});
