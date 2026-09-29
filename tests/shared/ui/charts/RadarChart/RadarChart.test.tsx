// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const setOption = vi.fn();
const dispose = vi.fn();
const init = vi.fn(() => ({ setOption, resize: vi.fn(), dispose }));
vi.mock("echarts/core", () => ({ use: vi.fn(), init: (...args: unknown[]) => init(...(args as [])) }));

import { RadarChart } from "@shared/ui/charts/RadarChart/RadarChart";

const props = {
  axes: [
    { name: "A", value: 1 },
    { name: "B", value: 2 },
    { name: "C", value: 3 },
  ],
  scale: { min: 0, max: 10 },
  ariaLabel: "Radar de ejemplo",
  formatTooltip: () => "",
};

describe("RadarChart (plantilla)", () => {
  beforeEach(() => {
    setOption.mockClear();
    dispose.mockClear();
    init.mockClear();
  });

  it("se describe con el texto recibido y crea el gráfico una vez con sus ejes", () => {
    const { unmount } = render(<RadarChart {...props} />);

    expect(screen.getByRole("img", { name: "Radar de ejemplo" })).toBeInTheDocument();
    expect(init).toHaveBeenCalledOnce();
    expect(setOption.mock.calls.at(-1)![0].radar.indicator).toHaveLength(3);
    unmount();
    expect(dispose).toHaveBeenCalledOnce();
  });
});
