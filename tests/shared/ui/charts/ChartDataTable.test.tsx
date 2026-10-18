// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChartDataTable } from "@shared/ui/charts/ChartDataTable";

describe("ChartDataTable (alternativa accesible a un gráfico)", () => {
  it("está plegada y se despliega con su botón, mostrando cabeceras y filas", () => {
    render(
      <ChartDataTable
        caption="Puntuaciones de Finanzas"
        headers={["Fecha", "Puntuación"]}
        rows={[
          { key: "a", cells: ["15 ene 2026", 3] },
          { key: "b", cells: ["18 sept 2026", 7] },
        ]}
        showLabel="Ver datos"
        hideLabel="Ocultar datos"
      />,
    );

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Ver datos" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);

    const table = screen.getByRole("table", { name: "Puntuaciones de Finanzas" });
    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(3);
    expect(rows[2]).toHaveTextContent(/18 sept 2026[\s\S]*7/);
    expect(screen.getByRole("button", { name: "Ocultar datos" })).toHaveAttribute("aria-expanded", "true");
  });
});
