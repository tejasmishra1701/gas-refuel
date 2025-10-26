import { GasDashboard } from "@/components/GasDashboard";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <ErrorBoundary>
          <GasDashboard />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
