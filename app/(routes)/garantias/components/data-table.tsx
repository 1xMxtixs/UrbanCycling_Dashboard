"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { useState } from "react";
import { ShieldCheck, ChevronLeft, ChevronRight, Search } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTableContainer } from "@/components/common/DataTableContainer";
import { EmptyState } from "@/components/common/EmptyState";
import { NOMBRES_ESTADO_GARANTIA } from "@/lib/garantia-status";

import type { GarantiasTableMeta } from "./columns";
import type { EstadoGarantiaCodigo } from "../types";

interface DataTableProps<TData extends { idGarantia: number }, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  meta?: GarantiasTableMeta;
}

export function DataTable<TData extends { idGarantia: number }, TValue>({
  columns,
  data,
  meta,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "idGarantia", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("all");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
    meta,
  });

  const filteredRowCount = table.getFilteredRowModel().rows.length;
  const hayFiltros = Boolean(globalFilter.trim()) || estadoFiltro !== "all";
  const estados: EstadoGarantiaCodigo[] = [
    "INGRESADO",
    "EN_REVISION",
    "EN_ESPERA",
    "APROBADO",
    "RECHAZADO",
  ];

  return (
    <DataTableContainer
      title="Solicitudes de garantía"
      description={`${filteredRowCount} ${filteredRowCount === 1 ? "solicitud encontrada" : "solicitudes encontradas"}`}
      toolbar={
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Buscar solicitudes de garantía"
              placeholder="Buscar por cliente, orden o motivo..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={estadoFiltro}
            onValueChange={(value) => {
              setEstadoFiltro(value);
              table
                .getColumn("estado")
                ?.setFilterValue(value === "all" ? undefined : value);
            }}
          >
            <SelectTrigger className="h-9 w-full sm:w-48">
              <SelectValue placeholder="Estado: Todos" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="all">Todos los estados</SelectItem>
              {estados.map((estado) => (
                <SelectItem key={estado} value={estado}>
                  {NOMBRES_ESTADO_GARANTIA[estado]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
      footer={
        filteredRowCount > 0 ? (
          <>
            <div>
              Página {table.getState().pagination.pageIndex + 1} de{" "}
              {table.getPageCount() || 1}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-8 px-2"
                aria-label="Página anterior"
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-8 px-2"
                aria-label="Página siguiente"
              >
                Siguiente <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </>
        ) : undefined
      }
    >
      {filteredRowCount === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={ShieldCheck}
            title="No se encontraron solicitudes"
            description={
              hayFiltros
                ? "No hay solicitudes que coincidan con los filtros."
                : "Aún no hay garantías registradas."
            }
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={getResponsiveColumnClass(header.column.id)}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() =>
                  meta?.onViewDetails?.(row.original.idGarantia)
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={getResponsiveColumnClass(cell.column.id)}
                    onClick={
                      cell.column.id === "acciones"
                        ? (event) => event.stopPropagation()
                        : undefined
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DataTableContainer>
  );
}

function getResponsiveColumnClass(columnId: string) {
  if (columnId === "motivoReclamo") return "hidden lg:table-cell";
  if (columnId === "fechaIngreso") return "hidden sm:table-cell";
  if (columnId === "acciones") return "text-right";
  return undefined;
}
