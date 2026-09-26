// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import i18n from "@shared/ui/i18n";
import { InterviewHistory } from "@modules/assessments/ui/InterviewHistory";
import { withClient } from "../../../helpers/queryClient";

afterEach(async () => {
  vi.unstubAllGlobals();
  await i18n.changeLanguage("es");
});

describe("InterviewHistory", () => {
  it("en inglés, cada cambio usa el nombre traducido de la categoría", async () => {
    await i18n.changeLanguage("en");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ recordedAt: "2026-09-18T10:00:00.000Z", entries: [{ categoryId: "c1", categoryName: "Economía", score: 4, previousScore: 6 }] }],
      }),
    );

    render(withClient(<InterviewHistory />));

    expect(await screen.findByText(/Finances: 6 → 4/)).toBeInTheDocument();
  });
});
