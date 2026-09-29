import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

export interface ChartDataTableProps {
  caption: string;
  headers: [string, string];
  rows: { key: string; cells: [string, string | number] }[];
  showLabel: string;
  hideLabel: string;
}

/**
 * Alternativa accesible a cualquier gráfico: una tabla plegable con sus datos.
 * El tooltip de ECharts solo funciona con ratón o tacto; esta tabla también
 * con teclado y lector de pantalla.
 */
export function ChartDataTable({ caption, headers, rows, showLabel, hideLabel }: ChartDataTableProps) {
  const [open, setOpen] = useState(false);

  return (
    <Box>
      <Button size="small" aria-expanded={open} onClick={() => setOpen((value) => !value)} sx={{ px: 0.5 }}>
        {open ? hideLabel : showLabel}
      </Button>
      {open && (
        <Table size="small" aria-label={caption}>
          <TableHead>
            <TableRow>
              <TableCell>{headers[0]}</TableCell>
              <TableCell align="right">{headers[1]}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell>{row.cells[0]}</TableCell>
                <TableCell align="right">{row.cells[1]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}
