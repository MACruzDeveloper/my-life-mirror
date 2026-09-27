// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { HowItWorks } from "@shared/ui/components/HowItWorks";

describe("HowItWorks (UX-01)", () => {
  it("explica en tres pasos numerados qué se hace en la app", () => {
    render(<HowItWorks />);

    const section = screen.getByRole("region", { name: /cómo funciona/i });
    const steps = within(section).getAllByRole("listitem");
    expect(steps).toHaveLength(3);
    expect(steps[0]).toHaveTextContent(/elige las áreas/i);
    expect(steps[1]).toHaveTextContent(/del 1 al 10/i);
    expect(steps[2]).toHaveTextContent(/equilibrio/i);
  });
});
