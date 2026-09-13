import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useLedgerStore } from '../store/ledgerStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  ArrowLeft, 
  MoreVertical, 
  ArrowDownLeft, 
  ArrowUpRight, 
  PlusCircle, 
  MinusCircle, 
  FileText, 
  Paperclip, 
  Lock, 
  Share2, 
  ChevronRight, 
  DollarSign, 
  X,
  Edit3,
  Trash2
} from 'lucide-react';

export default function PartyLedgerView() {
  const { currentWorkspace } = useAuthStore();
  const { 
    parties, 
    transactions, 
    selectedParty, 
    setSelectedParty, 
    searchTerm, 
    setSearchTerm, 
    partyTypeFilter, 
    setPartyTypeFilter, 
    openTransactionModal,
    openEditTransactionModal,
    deleteTransaction,
    deleteParty,
    updateParty,
    createParty 
  } = useLedgerStore();
  const { t } = usePreferencesStore();

  const [activeSubScreen, setActiveSubScreen] = useState('list');
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isAddPartyModalOpen, setIsAddPartyModalOpen] = useState(false);
  const [editingPartyId, setEditingPartyId] = useState(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isBiometricLocked, setIsBiometricLocked] = useState(false);
  const [biometricAuthenticated, setBiometricAuthenticated] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [timelineSearch, setTimelineSearch] = useState('');
  const [timelineFilter, setTimelineFilter] = useState('ALL');

  // Party Form state
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyPhone, setNewPartyPhone] = useState('');
  const [newPartyEmail, setNewPartyEmail] = useState('');
  const [newPartyType, setNewPartyType] = useState('CUSTOMER');
  const [newPartyAddress, setNewPartyAddress] = useState('');
  const [newPartyOpeningBal, setNewPartyOpeningBal] = useState('0');

  const formatCurrency = (val) => {
    const symbol = currencySymbol === '₹' ? '₹' : '$';
    const amount = currencySymbol === '₹' ? val : (val / 83.5).toFixed(2);
    return `${symbol}${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(amount || 0)}`;
  };

  const handleSelectParty = (party) => {
    setSelectedParty(party);
    setActiveSubScreen('detail');
  };

  const handleOpenEditParty = (party) => {
    setEditingPartyId(party.id);
    setNewPartyName(party.name || '');
    setNewPartyPhone(party.phone || '');
    setNewPartyEmail(party.email || '');
    setNewPartyType(party.type || 'CUSTOMER');
    setNewPartyAddress(party.address || '');
    setNewPartyOpeningBal(String(party.opening_balance || 0));
    setIsAddPartyModalOpen(true);
  };

  const handleDeleteCurrentParty = async (partyId, partyName) => {
    if (!window.confirm(`Are you sure you want to delete ${partyName} and all associated ledger transactions?`)) return;
    try {
      await deleteParty(currentWorkspace.id, partyId);
      setActiveSubScreen('list');
      setIsOptionsOpen(false);
    } catch (err) {
      alert(`Delete party failed: ${err.message}`);
    }
  };

  const handleDeleteTx = async (e, tx) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete transaction of ₹${tx.amount}?`)) return;
    try {
      await deleteTransaction(currentWorkspace.id, tx.id);
    } catch (err) {
      alert(`Delete transaction failed: ${err.message}`);
    }
  };

  const handleCreateOrUpdatePartySubmit = async (e) => {
    e.preventDefault();
    if (!newPartyName.trim()) return;
    try {
      if (editingPartyId) {
        const updated = await updateParty(currentWorkspace.id, editingPartyId, {
          name: newPartyName,
          phone: newPartyPhone,
          email: newPartyEmail,
          type: newPartyType,
          address: newPartyAddress
        });
        setSelectedParty(updated);
      } else {
        const created = await createParty(currentWorkspace.id, {
          name: newPartyName,
          phone: newPartyPhone,
          email: newPartyEmail,
          type: newPartyType,
          address: newPartyAddress,
          openingBalance: Number(newPartyOpeningBal)
        });
        setSelectedParty(created);
      }
      setIsAddPartyModalOpen(false);
      setEditingPartyId(null);
      setActiveSubScreen('detail');
      setNewPartyName('');
      setNewPartyPhone('');
      setNewPartyEmail('');
      setNewPartyAddress('');
      setNewPartyOpeningBal('0');
    } catch (err) {
      alert(`Operation failed: ${err.message}`);
    }
  };

  const activeSelectedParty = selectedParty 
    ? (parties.find(p => p.id === selectedParty.id) || selectedParty)
    : (parties.length > 0 ? parties[0] : null);

  const partyTransactions = activeSelectedParty 
    ? transactions.filter(t => t.party_id === activeSelectedParty.id)
    : [];

  const filteredTimelineTransactions = partyTransactions.filter(tx => {
    const matchesSearch = timelineSearch === '' || 
      (tx.notes && tx.notes.toLowerCase().includes(timelineSearch.toLowerCase())) ||
      (tx.category && tx.category.toLowerCase().includes(timelineSearch.toLowerCase())) ||
      (tx.payment_mode && tx.payment_mode.toLowerCase().includes(timelineSearch.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (timelineFilter === 'GOT') return tx.type === 'GOT';
    if (timelineFilter === 'GAVE') return tx.type === 'GAVE';
    if (timelineFilter === 'ATTACHMENTS') return tx.attachments && tx.attachments.length > 0;
    return true;
  });

  return (
    <div style={{
      padding: '0.5rem 1rem 7rem 1rem',
      maxWidth: '640px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>

      {/* ========================================================================= */}
      {/* SCREEN 1: PARTIES LIST VIEW (Single Column Mobile Flow) */}
      {/* ========================================================================= */}
      {activeSubScreen === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '900', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                <Users size={22} color="var(--color-cyan)" /> {t('partiesLedger')}
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {parties.length} {t('contacts')} • Tap party to view full statement
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder={t('searchPartyPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.75rem', fontSize: '0.9rem', borderRadius: '16px' }}
            />
          </div>

          {/* Scrollable Filter Chips */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
            {[
              { id: '', label: t('allParties') },
              { id: 'CUSTOMER', label: t('customersOnly') },
              { id: 'SUPPLIER', label: t('suppliersOnly') }
            ].map(chip => (
              <button
                key={chip.id}
                onClick={() => setPartyTypeFilter(chip.id)}
                className={partyTypeFilter === chip.id ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.775rem', borderRadius: '12px', flexShrink: 0 }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Parties Cards Stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {parties.length > 0 ? (
              parties.map(p => {
                const isReceivable = p.current_balance > 0;
                const isPayable = p.current_balance < 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectParty(p)}
                    className="glass-card"
                    style={{
                      padding: '1rem 1.1rem',
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: p.type === 'CUSTOMER' ? 'linear-gradient(135deg, #4F46E5, #818CF8)' : 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '900',
                        fontSize: '1.2rem'
                      }}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                          <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)' }}>{p.name}</span>
                          <span className={`badge ${p.type === 'CUSTOMER' ? 'badge-cyan' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>
                            {p.type}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-dim)' }}>
                          {p.phone || 'No Contact'} {p.address ? `• ${p.address}` : ''}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div className="font-mono" style={{
                          fontWeight: '900',
                          fontSize: '1rem',
                          color: isReceivable ? 'var(--color-emerald)' : isPayable ? 'var(--color-rose)' : 'var(--text-muted)'
                        }}>
                          {isReceivable ? `+${formatCurrency(p.current_balance)}` : isPayable ? `-${formatCurrency(Math.abs(p.current_balance))}` : '0.00'}
                        </div>
                        <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                          {isReceivable ? t('youGet') : isPayable ? t('youGive') : t('settled')}
                        </div>
                      </div>
                      <ChevronRight size={18} color="var(--text-muted)" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="glass-card" style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '3rem 1rem', borderRadius: '20px' }}>
                <Users size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                <div style={{ fontSize: '0.95rem', fontWeight: '700' }}>No matching parties found</div>
              </div>
            )}
          </div>

          {/* Floating Action Button (FAB) for + Add Party */}
          <button
            onClick={() => { setEditingPartyId(null); setIsAddPartyModalOpen(true); }}
            className="btn-primary mic-pulse"
            style={{
              position: 'fixed',
              bottom: '100px',
              right: '24px',
              borderRadius: '20px',
              padding: '0.85rem 1.35rem',
              fontWeight: '900',
              boxShadow: '0 8px 25px rgba(79, 70, 229, 0.5)',
              zIndex: 99
            }}
          >
            <Plus size={20} /> {t('addParty')}
          </button>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 2: PARTY DETAIL SCREEN */}
      {/* ========================================================================= */}
      {activeSubScreen === 'detail' && activeSelectedParty && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          
          {/* Top Mobile App Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <button
              onClick={() => setActiveSubScreen('list')}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: '700'
              }}
            >
              <ArrowLeft size={18} /> {t('parties')}
            </button>

            <div style={{ fontSize: '0.95rem', fontWeight: '800', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-main)' }}>
              {activeSelectedParty.name}
            </div>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                className="btn-secondary"
                style={{ width: '40px', height: '40px', padding: 0, justifyContent: 'center', borderRadius: '50%' }}
              >
                <MoreVertical size={18} />
              </button>

              {/* Options Menu Dropdown Popup */}
              {isOptionsOpen && (
                <div 
                  className="glass-panel"
                  style={{
                    position: 'absolute',
                    top: '48px',
                    right: '0',
                    width: '220px',
                    borderRadius: '16px',
                    padding: '0.5rem',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                    zIndex: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface)'
                  }}
                >
                  <button 
                    onClick={() => { setIsOptionsOpen(false); handleOpenEditParty(activeSelectedParty); }}
                    className="btn-secondary" 
                    style={{ justifyContent: 'flex-start', padding: '0.6rem 0.85rem', border: 'none', borderRadius: '10px', fontSize: '0.825rem' }}
                  >
                    <Edit3 size={16} color="var(--color-purple)" /> Edit Party Details
                  </button>

                  <button 
                    onClick={() => handleDeleteCurrentParty(activeSelectedParty.id, activeSelectedParty.name)}
                    className="btn-secondary" 
                    style={{ justifyContent: 'flex-start', padding: '0.6rem 0.85rem', border: 'none', borderRadius: '10px', fontSize: '0.825rem', color: 'var(--color-rose)' }}
                  >
                    <Trash2 size={16} /> Delete Party
                  </button>

                  <button 
                    onClick={() => {
                      setIsOptionsOpen(false);
                      const text = `Khata Statement for ${activeSelectedParty.name}: Net Balance ${formatCurrency(activeSelectedParty.current_balance)}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="btn-secondary" 
                    style={{ justifyContent: 'flex-start', padding: '0.6rem 0.85rem', border: 'none', borderRadius: '10px', fontSize: '0.825rem' }}
                  >
                    <Share2 size={16} color="var(--color-emerald)" /> {t('shareViaWhatsApp')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Party Header Details Card */}
          <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: activeSelectedParty.type === 'CUSTOMER' ? 'linear-gradient(135deg, #4F46E5, #818CF8)' : 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '1.5rem'
              }}>
                {activeSelectedParty.name.charAt(0).toUpperCase()}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--text-main)' }}>{activeSelectedParty.name}</h2>
                  <span className={`badge ${activeSelectedParty.type === 'CUSTOMER' ? 'badge-cyan' : 'badge-amber'}`} style={{ fontSize: '0.7rem' }}>
                    {activeSelectedParty.type}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                  {activeSelectedParty.phone && <span><Phone size={12} style={{ display: 'inline', marginRight: '3px' }} />{activeSelectedParty.phone}</span>}
                  {activeSelectedParty.email && <span><Mail size={12} style={{ display: 'inline', marginRight: '3px' }} />{activeSelectedParty.email}</span>}
                </div>
              </div>
            </div>

            {/* Net Balance Status */}
            <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-canvas)', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: '700' }}>Net Balance</span>
              <span className="font-mono" style={{ fontSize: '1.2rem', fontWeight: '900', color: activeSelectedParty.current_balance > 0 ? 'var(--color-emerald)' : activeSelectedParty.current_balance < 0 ? 'var(--color-rose)' : 'var(--text-muted)' }}>
                {formatCurrency(activeSelectedParty.current_balance)}
              </span>
            </div>

            {/* Action Buttons: You Gave / You Got */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                onClick={() => openTransactionModal(activeSelectedParty, 'GAVE')}
                className="btn-rose"
                style={{ padding: '0.85rem 0.5rem', justifyContent: 'center', fontSize: '0.875rem', fontWeight: '900', borderRadius: '14px' }}
              >
                <MinusCircle size={18} /> {t('youGaveDebit')}
              </button>
              <button
                onClick={() => openTransactionModal(activeSelectedParty, 'GOT')}
                className="btn-emerald"
                style={{ padding: '0.85rem 0.5rem', justifyContent: 'center', fontSize: '0.875rem', fontWeight: '900', borderRadius: '14px' }}
              >
                <PlusCircle size={18} /> {t('youGotCredit')}
              </button>
            </div>
          </div>

          {/* Statement Timeline List */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
              {t('statementTimeline')} ({filteredTimelineTransactions.length})
            </div>

            {filteredTimelineTransactions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {filteredTimelineTransactions.map(tx => (
                  <div 
                    key={tx.id} 
                    className="glass-card" 
                    style={{ 
                      padding: '0.95rem 1.1rem', 
                      borderRadius: '16px', 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'space-between', 
                      cursor: 'pointer' 
                    }}
                    onClick={() => openEditTransactionModal(tx)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: tx.type === 'GOT' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {tx.type === 'GOT' ? <ArrowDownLeft size={20} color="var(--color-emerald)" /> : <ArrowUpRight size={20} color="var(--color-rose)" />}
                      </div>

                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)' }}>
                          {tx.notes || (tx.type === 'GOT' ? 'Payment Received' : 'Credit Extended')}
                          <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{tx.category}</span>
                        </div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                          {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} • {tx.payment_mode}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div className="font-mono" style={{
                          fontSize: '1.05rem',
                          fontWeight: '900',
                          color: tx.type === 'GOT' ? 'var(--color-emerald)' : 'var(--color-rose)'
                        }}>
                          {tx.type === 'GOT' ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditTransactionModal(tx);
                          }}
                          className="btn-secondary"
                          style={{ padding: '0.35rem', borderRadius: '8px' }}
                        >
                          <Edit3 size={14} color="var(--color-purple)" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteTx(e, tx)}
                          className="btn-secondary"
                          style={{ padding: '0.35rem', borderRadius: '8px', color: 'var(--color-rose)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card" style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2.5rem 1rem', borderRadius: '16px' }}>
                No matching ledger entries found.
              </div>
            )}
          </div>

        </div>
      )}

      {/* Add/Edit Party Modal */}
      {isAddPartyModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '1.5rem', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-main)' }}>
                {editingPartyId ? 'Edit Party Details' : t('addNewParty')}
              </h3>
              <button onClick={() => setIsAddPartyModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdatePartySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{t('fullName')} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={newPartyName}
                  onChange={(e) => setNewPartyName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{t('phone')}</label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={newPartyPhone}
                    onChange={(e) => setNewPartyPhone(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{t('partyType')}</label>
                  <select value={newPartyType} onChange={(e) => setNewPartyType(e.target.value)} className="input-field">
                    <option value="CUSTOMER">{t('customer')}</option>
                    <option value="SUPPLIER">{t('supplier')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="ramesh@example.com"
                  value={newPartyEmail}
                  onChange={(e) => setNewPartyEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Address</label>
                <input
                  type="text"
                  placeholder="e.g. Shop #12, Market Yard"
                  value={newPartyAddress}
                  onChange={(e) => setNewPartyAddress(e.target.value)}
                  className="input-field"
                />
              </div>

              {!editingPartyId && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{t('openingBalance')} (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newPartyOpeningBal}
                    onChange={(e) => setNewPartyOpeningBal(e.target.value)}
                    className="input-field font-mono"
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsAddPartyModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {editingPartyId ? 'Save Changes' : t('createParty')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
