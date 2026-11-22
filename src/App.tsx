import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ConjunctionProvider } from './context/ConjunctionContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ToastContainer } from './components/common/Toast';
import { SpaceTrackConnectModal } from './components/common/SpaceTrackConnectModal';
import { OverviewPage } from './pages/OverviewPage';
import { ConjunctionRegistryPage } from './pages/ConjunctionRegistryPage';
import { EncounterAnalysisPage } from './pages/EncounterAnalysisPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { SecondaryRiskPage } from './pages/SecondaryRiskPage';
import { ReportsPage } from './pages/ReportsPage';

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ConjunctionProvider>
          <div className="min-h-screen flex flex-col bg-[#F7F6F2] text-[#252A30] font-sans selection:bg-[#EAF0E9] selection:text-[#52745C]">
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
              <Routes>
                <Route path="/" element={<OverviewPage />} />
                <Route path="/conjunctions" element={<ConjunctionRegistryPage />} />
                <Route path="/conjunctions/:id" element={<EncounterAnalysisPage />} />
                <Route path="/simulator" element={<SimulatorPage />} />
                <Route path="/secondary-risk" element={<SecondaryRiskPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
            <SpaceTrackConnectModal />
            <ToastContainer />
          </div>
        </ConjunctionProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
