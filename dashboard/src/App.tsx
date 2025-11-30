import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  TestTube,
  Activity,
  Wind,
  TrendingUp,
  Clock,
  BarChart3,
  Github,
  Heart,
  Menu,
  X,
} from 'lucide-react';
import { FilterProvider, useFilters } from './context/FilterContext';
import { FilterPanel } from './components/filters/FilterPanel';
import { LoadingOverlay } from './components/ui/LoadingSpinner';
import { loadCSVData } from './utils/dataLoader';

// Pages
import { SummaryPage } from './pages/SummaryPage';
import { DemographicsPage } from './pages/DemographicsPage';
import { ClinicalPage } from './pages/ClinicalPage';
import { VitalsPage } from './pages/VitalsPage';
import { RespiratoryPage } from './pages/RespiratoryPage';
import { OutcomesPage } from './pages/OutcomesPage';
import { LOSPage } from './pages/LOSPage';
import { ExplorerPage } from './pages/ExplorerPage';

import type { TabId } from './types';

const TABS = [
  { id: 'summary' as TabId, label: 'Overview', icon: LayoutDashboard },
  { id: 'demographics' as TabId, label: 'Demographics', icon: Users },
  { id: 'clinical' as TabId, label: 'Lab Values', icon: TestTube },
  { id: 'vitals' as TabId, label: 'Vital Signs', icon: Activity },
  { id: 'respiratory' as TabId, label: 'Blood Gas', icon: Wind },
  { id: 'outcomes' as TabId, label: 'Outcomes', icon: TrendingUp },
  { id: 'los' as TabId, label: 'Length of Stay', icon: Clock },
  { id: 'explorer' as TabId, label: 'Explorer', icon: BarChart3 },
];

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<TabId>('summary');
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { setAllData, allData } = useFilters();

  useEffect(() => {
    loadCSVData()
      .then((data) => {
        setAllData(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load data:', error);
        setIsLoading(false);
      });
  }, [setAllData]);

  if (isLoading) {
    return <LoadingOverlay message="Loading MIMIC-IV pneumonia cohort data..." />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'summary':
        return <SummaryPage />;
      case 'demographics':
        return <DemographicsPage />;
      case 'clinical':
        return <ClinicalPage />;
      case 'vitals':
        return <VitalsPage />;
      case 'respiratory':
        return <RespiratoryPage />;
      case 'outcomes':
        return <OutcomesPage />;
      case 'los':
        return <LOSPage />;
      case 'explorer':
        return <ExplorerPage />;
      default:
        return <SummaryPage />;
    }
  };

  return (
    <div className="min-h-screen bg-surface-muted gradient-mesh">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-primary-100">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-medical-blue to-medical-indigo text-white">
                <Wind className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary-900">
                  MIMIC-IV Pneumonia ICU
                </h1>
                <p className="text-xs text-primary-500 hidden sm:block">
                  Interactive Clinical Dashboard
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-medical-blue/10 text-medical-blue'
                        : 'text-primary-600 hover:bg-primary-100 hover:text-primary-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-primary-600 hover:bg-primary-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Right side */}
            <div className="hidden lg:flex items-center gap-3">
              <a
                href="https://physionet.org/content/mimiciv/2.2/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                title="MIMIC-IV Documentation"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-primary-100 bg-white py-2 px-4">
            <nav className="grid grid-cols-2 gap-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-medical-blue/10 text-medical-blue'
                        : 'text-primary-600 hover:bg-primary-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filter Panel */}
        <div className="mb-6">
          <FilterPanel />
        </div>

        {/* Page Content */}
        <div className="min-h-[calc(100vh-300px)]">
          {renderPage()}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-primary-100 bg-white mt-12">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-primary-500">
              <Heart className="w-4 h-4 text-died" />
              <span>
                Built with MIMIC-IV data from{' '}
                <a 
                  href="https://physionet.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-medical-blue hover:underline"
                >
                  PhysioNet
                </a>
              </span>
            </div>
            <div className="text-sm text-primary-400">
              Created by BIS638 Database Group
            </div>
            <div className="text-sm text-primary-500">
              Data Period: 2008-2019
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <FilterProvider>
      <DashboardContent />
    </FilterProvider>
  );
}

