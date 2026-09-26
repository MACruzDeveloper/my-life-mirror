// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const setOption = vi.fn();
const dispose = vi.fn();
const init = vi.fn(() => ({ setOption, resize: vi.fn(), dispose }));
vi.mock("echarts/core", () => ({ use: vi.fn(), init: (...args: unknown[]) => init(...(args as [])) }));

import { TimeLineChart } from "@shared/ui/charts/TimeLineChart/TimeLineChart";

const points = [
  { date: new Date("2026-01-15T10:00:00"), value: 3 },
  { date: new Date("2026-09-18T10:00:00"), value: 7 },
];
const WINDOW = { start: new Date("2026-01-01T00:00:00"), end: new Date("2026-10-01T00:00:00") };
const props = { points, window: WINDOW, yAxis: { min: 1, max: 10 }, ariaLabel: "Evolución de ejemplo", formatTooltip: () => "" };

describe("TimeLineChart (plantilla)", () => {
  beforeEach(() => {
    setOption.mockClear();
    dispose.mockClear();
    init.mockClear();
  });

  it("se describe con el texto recibido para lectores de pantalla", () => {
    render(<TimeLineChart {...props} />);

    expect(screen.getByRole("img", { name: "Evolución de ejemplo" })).toBeInTheDocument();
  });

  it("crea el gráfico una vez con la ventana y los puntos recibidos", () => {
    render(<TimeLineChart {...props} />);

    expect(init).toHaveBeenCalledOnce();
    const option = setOption.mock.calls.at(-1)![0];
    expect(option.xAxis.min).toBe(WINDOW.start.getTime());
    expect(option.series[0].data).toHaveLength(2);
  });

  it("al cambiar la ventana actualiza el gráfico existente y lo libera al desmontar", () => {
    const { rerender, unmount } = render(<TimeLineChart {...props} />);
    const other = { start: new Date("2026-04-01T00:00:00"), end: new Date("2026-10-01T00:00:00") };

    rerender(<TimeLineChart {...props} window={other} />);

    expect(init).toHaveBeenCalledOnce();
    expect(setOption.mock.calls.at(-1)![0].xAxis.min).toBe(other.start.getTime());
    unmount();
    expect(dispose).toHaveBeenCalledOnce();
  });
});
