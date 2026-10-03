import { Search } from "lucide-react"

export function GlobalSearch() {
  return (
    <div role="search" className="flex w-full items-center justify-end md:justify-start">
      {/* TODO: abrir un CommandDialog (cmdk) cuando se implemente la búsqueda global */}
      <button
        type="button"
        aria-label="Buscar en todo el sistema"
        className="hidden md:flex h-9 w-full max-w-md cursor-pointer items-center gap-2.5 rounded-xl border border-border/70 bg-muted/50 px-3 text-sm text-muted-foreground transition-colors motion-reduce:transition-none hover:bg-muted/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="truncate">Buscar en todo el sistema…</span>
      </button>
      <button
        type="button"
        aria-label="Buscar en todo el sistema"
        className="flex md:hidden h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-border/70 bg-muted/50 text-muted-foreground transition-colors motion-reduce:transition-none hover:bg-muted/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Search className="h-4 w-4" />
      </button>
    </div>
  )
}
