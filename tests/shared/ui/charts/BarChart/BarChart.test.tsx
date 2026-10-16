// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const setOption = vi.fn();
const dispose = vi.fn();
const init = vi.fn(() => ({ setOption, resize: vi.fn(), dispose }));
vi.mock("echarts/core", () => ({ use: vi.fn(), init: (...args: unknown[]) => init(...(args as [])) }));

import { BarChart } from "@shared/ui/charts/BarChart/BarChart";
import { CHART_ACCENT } from "@shared/ui/theme";

describe("BarChart (plantilla)", () => {
  beforeEach(() => {
    setOption.mockClear();
    dispose.mockClear();
    init.mockClear();
  });

  it("se describe con el texto recibido, crea el gráfico una vez con sus barras, en el color de los gráficos por defecto", () => {
    const { unmount } = render(
      <BarChart bars={[{ name: "A", value: 1 }, { name: "B", value: 2 }]} scale={{ min: 0, max: 10 }} ariaLabel="Barras de ejemplo" formatTooltip={() => ""} />,
    );

    expect(screen.getByRole("img", { name: "Barras de ejemplo" })).toBeInTheDocument();
    expect(init).toHaveBeenCalledOnce();
    const option = setOption.mock.calls.at(-1)![0];
    expect(option.yAxis.data).toEqual(["A", "B"]);
    expect(option.series[0].itemStyle.color).toBe(CHART_ACCENT);
    unmount();
    expect(dispose).toHaveBeenCalledOnce();
  });
});
