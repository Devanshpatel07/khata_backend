import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { 
  UploadCloud, 
  CheckCircle2, 
  HardDriveUpload, 
  RefreshCw, 
  ShieldCheck, 
  FileCheck, 
  Wifi, 
  Smartphone 
} from 'lucide-react';

export default function BackupTelemetryCenter() {
  const [telemetry, setTelemetry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackupCreating, setIsBackupCreating] = useState(false);
  const [networkSetting, setNetworkSetting] = useState('WIFI_ONLY');
  const [frequencySetting, setFrequencySetting] = useState('DAILY');
  const [message, setMessage] = useState(null);

  const fetchTelemetry = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getBackupTelemetry();
      setTelemetry(res.data);
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const handleCreateBackup = async () => {
    setIsBackupCreating(true);
    setMessage(null);
    try {
      const res = await apiClient.createBackup();
      setMessage({ type: 'success', text: `Backed up successfully! Snapshot: ${res.data.filename}` });
      await fetchTelemetry();
    } catch (err) {
      setMessage({ type: 'error', text: `Couldn't back up — check your internet connection: ${err.message}` });
    } finally {
      setIsBackupCreating(false);
    }
  };

  return (
    <div style={{ padding: '0 1rem 2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} data-testid="tool_backup_settings">
      
      {/* Page Header */}
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UploadCloud size={22} color="var(--color-purple-40)" /> Cloud Backup & Restore Settings
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            WhatsApp-style automated cloud ledger backup and encrypted disaster recovery.
          </p>
        </div>

        <button onClick={fetchTelemetry} className="btn-secondary" style={{ fontSize: '0.825rem' }}>
          <RefreshCw size={16} /> Refresh Status
        </button>
      </div>

      {message && (
        <div className="glass-card" style={{
          padding: '0.85rem 1.25rem',
          borderColor: message.type === 'success' ? 'var(--color-emerald)' : 'var(--color-rose)',
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
          color: message.type === 'success' ? 'var(--color-emerald)' : 'var(--color-rose)',
          fontWeight: '700',
          fontSize: '0.875rem'
        }}>
          {message.text}
        </div>
      )}

      {/* 1. Account Header Card */}
      <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(79, 70, 229, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UploadCloud size={20} color="var(--color-purple-40)" />
          </div>
          <div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Google Drive Linked Account</div>
            <div style={{ fontSize: '1rem', fontWeight: '800' }}>demo@khata.pro</div>
          </div>
        </div>
        <span className="badge badge-emerald" style={{ padding: '0.35rem 0.65rem' }}>
          <CheckCircle2 size={14} /> Verified Cloud
        </span>
      </div>

      {/* 2. WhatsApp-Style Status Card */}
      <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '24px', textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem auto'
        }}>
          <UploadCloud size={32} color="var(--color-emerald)" />
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.25rem' }}>
          Last backup: {telemetry?.backups?.recentHistory?.[0]?.created_at ? new Date(telemetry.backups.recentHistory[0].created_at).toLocaleString('en-IN') : '12 Sep 2026, 04:30 PM'}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Total size: {telemetry?.database?.dbSizeFormatted || '2.1 MB'} (Encrypted SQLite Store)
        </p>

        <button
          onClick={handleCreateBackup}
          disabled={isBackupCreating}
          className="btn-primary"
          style={{ width: '100%', maxWidth: '340px', justifyContent: 'center', margin: '0 auto', minHeight: '52px', fontSize: '1rem', borderRadius: '16px' }}
        >
          <RefreshCw size={20} /> {isBackupCreating ? 'Backing Up...' : 'Back Up Now'}
        </button>
      </div>

      {/* 3. Settings Group */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '20px' }}>
        <h4 style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1.5px', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>
          BACKUP SETTINGS
        </h4>

        {/* Back up over */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.5rem' }}>Back up over</div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="network"
                checked={networkSetting === 'WIFI_ONLY'}
                onChange={() => setNetworkSetting('WIFI_ONLY')}
              />
              <Wifi size={14} color="var(--color-purple-40)" /> Wi-Fi only
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="network"
                checked={networkSetting === 'CELLULAR'}
                onChange={() => setNetworkSetting('CELLULAR')}
              />
              <Smartphone size={14} color="var(--color-purple-40)" /> Wi-Fi and cellular
            </label>
          </div>
        </div>

        <hr style={{ borderColor: 'var(--border-subtle)', margin: '1rem 0' }} />

        {/* Backup frequency */}
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.5rem' }}>Backup frequency</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['DAILY', 'WEEKLY', 'MANUAL'].map(freq => (
              <button
                key={freq}
                onClick={() => setFrequencySetting(freq)}
                className={frequencySetting === freq ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', minHeight: '36px' }}
              >
                {freq}
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
