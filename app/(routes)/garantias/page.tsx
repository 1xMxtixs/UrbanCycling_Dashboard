import { HeaderGarantias, ListGarantias } from "./components";

export const dynamic = "force-dynamic";

export default function GarantiasPage() {
  return (
    <div className="space-y-6">
      <HeaderGarantias />
      <ListGarantias />
    </div>
  );
}