import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useLedgerStore } from '../store/ledgerStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { 
  TrendingUp, 
  Users, 
  Camera, 
  UploadCloud, 
  Mic, 
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';

export default function ExecutiveDashboard({ onOpenSmartEntry, onNavigateTab }) {
  const { user } = useAuthStore();
  const { summary, transactions, openTransactionModal } = useLedgerStore();
  const { lang, setLang, t } = usePreferencesStore();

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const getAmountInteger = (val) => {
    const formatted = formatCurrency(val);
    return formatted.split('.')[0];
  };

  const getAmountDecimal = (val) => {
    const formatted = formatCurrency(val);
    const parts = formatted.split('.');
    return parts[1] ? `.${parts[1]}` : '.00';
  };

  const isNetGet = (summary.netBalance || 0) >= 0;

  // Compute category totals dynamically from actual transactions
  const categoryTotals = transactions.reduce((acc, tx) => {
    const cat = tx.category || 'GENERAL';
    acc[cat] = (acc[cat] || 0) + (Number(tx.amount) || 0);
    return acc;
  }, {});

  const spendingCategories = [
    { emoji: '🍽️', title: 'Dining & Food', key: 'DINING' },
    { emoji: '🚗', title: 'Logistics & Fuel', key: 'LOGISTICS' },
    { emoji: '🛒', title: 'Inventory Supplies', key: 'INVENTORY' }
  ];

  return (
    <div style={{ padding: '0 1rem 2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Language Pill Selector */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[
          { code: 'EN', label: '🇬🇧 English' },
          { code: 'HI', label: '🇮🇳 हिंदी' }
        ].map(item => (
          <button
            key={item.code}
            onClick={() => setLang(item.code)}
            className={lang === item.code ? 'btn-primary' : 'btn-secondary'}
            style={{
              borderRadius: '12px',
              padding: '0.35rem 0.85rem',
              fontSize: '0.825rem',
              minHeight: '36px',
              flexShrink: 0
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Welcome User Card */}
      <div 
        onClick={() => onNavigateTab('profile')}
        className="glass-card" 
        style={{ 
          padding: '0.85rem 1.25rem', 
          borderRadius: '16px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          border: '1px solid var(--border-subtle)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(79, 70, 229, 0.15)';
          e.currentTarget.style.borderColor = 'var(--color-purple-40)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '';
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {user?.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt="Avatar" 
              style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--color-purple-40)' }} 
            />
          ) : (
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              border: '1.5px solid var(--color-purple-40)',
              background: 'linear-gradient(135deg, #FF6B6B, #EE5253)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: '800',
              fontSize: '1.25rem',
              boxShadow: '0 4px 12px rgba(238, 82, 83, 0.3)'
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
          )}
          <div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{t('goodMorning')},</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>{user?.name || 'Apex Admin Executive'}</div>
          </div>
        </div>
        <ChevronRight size={20} color="var(--color-purple-40)" />
      </div>

      {/* Hero Net Position Card */}
      <div className="glass-card" data-testid="net_position_card" style={{
        borderRadius: 'var(--radius-hero)',
        background: 'var(--bg-net-position)',
        borderColor: 'var(--border-subtle)',
        padding: '1.5rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}>
        {/* Top Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: '800',
            letterSpacing: '1px',
            color: 'var(--color-deep-purple)',
            textTransform: 'uppercase'
          }}>
            {isNetGet ? t('netBalanceGet') : t('netBalanceGive')}
          </span>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <span className="badge badge-emerald">
              <TrendingUp size={12} /> {summary.totalTransactions ? '+12.5%' : '0.0%'}
            </span>
            <span className="badge badge-purple">
              {summary.totalTransactions || 0} tx
            </span>
          </div>
        </div>

        {/* Hero Amount */}
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '1.25rem' }}>
          <span style={{
            fontSize: '2.6rem',
            fontWeight: '900',
            letterSpacing: '-1px',
            color: 'var(--color-deep-purple)',
            lineHeight: 1
          }}>
            {isNetGet ? `+${getAmountInteger(summary.netBalance || 0)}` : `-${getAmountInteger(Math.abs(summary.netBalance || 0))}`}
          </span>
          <span style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: 'var(--color-deep-purple)',
            opacity: 0.75,
            marginLeft: '2px'
          }}>
            {getAmountDecimal(summary.netBalance || 0)}
          </span>
        </div>

        {/* Bottom Split Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: 'var(--radius-subcard)',
            padding: '0.85rem'
          }}>
            <div style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1px', color: 'var(--text-muted)' }}>
              {t('youWillGet')}
            </div>
            <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--color-emerald)', marginTop: '0.2rem' }}>
              +{formatCurrency(summary.totalYouWillGet || summary.totalGet || 0)}
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: 'var(--radius-subcard)',
            padding: '0.85rem'
          }}>
            <div style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1px', color: 'var(--text-muted)' }}>
              {t('youWillGive')}
            </div>
            <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--color-rose)', marginTop: '0.2rem' }}>
              -{formatCurrency(summary.totalYouWillGive || summary.totalGive || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Utilities & Tools Dock (3-Card Row) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        <div
          onClick={() => onNavigateTab('parties')}
          className="glass-card"
          data-testid="tool_contacts_ledger"
          style={{ padding: '1rem', textAlign: 'center', cursor: 'pointer' }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(79, 70, 229, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.5rem auto'
          }}>
            <Users size={20} color="var(--color-purple-40)" />
          </div>
          <div style={{ fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-main)' }}>{t('contacts')}</div>
        </div>

        <div
          onClick={() => onNavigateTab('scanner')}
          className="glass-card"
          data-testid="tool_photoscan"
          style={{ padding: '1rem', textAlign: 'center', cursor: 'pointer' }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(224, 64, 251, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.5rem auto'
          }}>
            <Camera size={20} color="#E040FB" />
          </div>
          <div style={{ fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-main)' }}>{t('scanBill')}</div>
        </div>

        <div
          onClick={() => onNavigateTab('telemetry')}
          className="glass-card"
          data-testid="tool_backup_settings"
          style={{ padding: '1rem', textAlign: 'center', cursor: 'pointer' }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.5rem auto'
          }}>
            <UploadCloud size={20} color="var(--color-emerald)" />
          </div>
          <div style={{ fontSize: '0.775rem', fontWeight: '700', color: 'var(--text-main)' }}>{t('cloudBackup')}</div>
        </div>
      </div>

      {/* Top Spending Carousel */}
      <div>
        <div style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '1.5px', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          {t('topSpending')}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {spendingCategories.map((item, idx) => {
            const amount = categoryTotals[item.key] || 0;
            return (
              <div key={idx} className="glass-card" style={{ padding: '0.85rem', minWidth: '136px', borderRadius: '20px' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>{item.emoji}</div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: '600' }}>{item.title}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', marginTop: '0.15rem', color: 'var(--text-main)' }}>{formatCurrency(amount)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions Feed */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>{t('recentLedgerEntries')}</h3>
          <button onClick={() => onNavigateTab('transactions')} style={{ background: 'transparent', border: 'none', color: 'var(--color-purple-40)', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}>
            {t('seeAll')}
          </button>
        </div>

        {transactions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {transactions.slice(0, 5).map(tx => (
              <div key={tx.id} className="glass-card" style={{
                padding: '0.9rem 1.1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: tx.type === 'GOT' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(248, 113, 113, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {tx.type === 'GOT' ? (
                      <ArrowDownLeft size={20} color="var(--color-emerald)" />
                    ) : (
                      <ArrowUpRight size={20} color="var(--color-rose)" />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {tx.party_name || 'General Entry'}
                      <span className="badge badge-purple" style={{ fontSize: '0.625rem', padding: '0.15rem 0.45rem' }}>
                        {tx.category || 'GENERAL'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {new Date(tx.date).toLocaleDateString()} • {tx.payment_mode || 'CASH'}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div className="font-mono" style={{
                    fontSize: '1rem',
                    fontWeight: '800',
                    color: tx.type === 'GOT' ? 'var(--color-emerald)' : 'var(--color-rose)'
                  }}>
                    {tx.type === 'GOT' ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem 0', fontSize: '0.875rem' }}>
            No recent ledger entries found.
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={onOpenSmartEntry}
        className="btn-primary mic-pulse"
        data-testid="smart_entry_fab"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          borderRadius: '16px',
          padding: '0.85rem 1.4rem',
          boxShadow: '0 8px 25px rgba(79, 70, 229, 0.4)',
          zIndex: 999
        }}
      >
        <Mic size={18} /> {t('smartEntry')}
      </button>

    </div>
  );
}
