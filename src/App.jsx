import React, { useState, useEffect, Component } from 'react';
import { useAuthStore } from './store/authStore.js';
import { useLedgerStore } from './store/ledgerStore.js';
import ExecutiveDashboard from './components/ExecutiveDashboard.jsx';
import PartyLedgerView from './components/PartyLedgerView.jsx';
import AllTransactionsView from './components/AllTransactionsView.jsx';
import PhotoScannerView from './components/PhotoScannerView.jsx';
import BackupTelemetryCenter from './components/BackupTelemetryCenter.jsx';
import TransactionModal from './components/TransactionModal.jsx';
import SmartEntryModal from './components/SmartEntryModal.jsx';
import UserProfileModal from './components/UserProfileModal.jsx';
import GlobalSearchModal from './components/GlobalSearchModal.jsx';
import ProfilePageView from './components/ProfilePageView.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import BottomMobileNav from './components/BottomMobileNav.jsx';
import './styles/theme.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Khata App ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-canvas)',
          color: 'var(--text-main)',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--color-rose)' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '400px', fontSize: '0.9rem' }}>
            {this.state.error?.message || 'An unexpected application error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="btn-primary"
          >
            Reload Khata Ledger
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { isAuthenticated, isLoading, currentWorkspace, initAuth } = useAuthStore();
  const { activeTab, setActiveTab, fetchWorkspaceData } = useLedgerStore();
  
  const [isSmartEntryOpen, setIsSmartEntryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentWorkspace?.id) {
      localStorage.setItem('khata_active_ws', JSON.stringify(currentWorkspace));
      fetchWorkspaceData(currentWorkspace.id);
    }
  }, [isAuthenticated, currentWorkspace]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-canvas)',
        color: 'var(--color-purple)',
        fontWeight: '700'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="mic-pulse" style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-purple)', margin: '0 auto 1rem auto' }}></div>
          Initializing Khata Fintech Environment...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !currentWorkspace) {
    return <AuthScreen />;
  }

  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingTop: '1rem', paddingBottom: '90px' }}>
        <main style={{ flex: 1 }}>
          {activeTab === 'dashboard' && (
            <ExecutiveDashboard 
              onOpenSmartEntry={() => setIsSmartEntryOpen(true)} 
              onNavigateTab={(tab) => setActiveTab(tab)} 
              onOpenSearch={() => setIsSearchOpen(true)}
              onOpenProfile={() => setIsProfileOpen(true)}
            />
          )}
          {activeTab === 'parties' && <PartyLedgerView />}
          {activeTab === 'transactions' && <AllTransactionsView />}
          {activeTab === 'scanner' && <PhotoScannerView key={Date.now()} />}
          {activeTab === 'telemetry' && <BackupTelemetryCenter />}
          {activeTab === 'profile' && <ProfilePageView onBack={() => setActiveTab('dashboard')} />}
        </main>

        {/* Floating Bottom Mobile Circular Dock */}
        <BottomMobileNav onOpenSmartEntry={() => setIsSmartEntryOpen(true)} />

        <TransactionModal />
        
        <SmartEntryModal 
          isOpen={isSmartEntryOpen} 
          onClose={() => setIsSmartEntryOpen(false)} 
        />

        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        />

        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      </div>
    </ErrorBoundary>
  );
}
