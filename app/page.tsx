import { GasDashboard } from "@/components/GasDashboard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Home() {
  return (
    <ErrorBoundary>
      <GasDashboard />
    </ErrorBoundary>
  );
}
