import { HeaderGarantias, ListGarantias } from "./components";

export const dynamic = "force-dynamic";

export default function GarantiasPage() {
  return (
    <div className="min-h-full space-y-6">
      <HeaderGarantias />
      <ListGarantias />
    </div>
  );
}