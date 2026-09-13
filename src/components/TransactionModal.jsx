import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useLedgerStore } from '../store/ledgerStore';
import { useSyncStore } from '../store/syncStore';
import { 
  X, 
  PlusCircle, 
  MinusCircle, 
  Paperclip, 
  Upload, 
  Trash2,
  Edit3
} from 'lucide-react';

export default function TransactionModal() {
  const { currentWorkspace } = useAuthStore();
  const { 
    isTransactionModalOpen, 
    transactionModalParty, 
    transactionModalDefaultType, 
    editingTransaction,
    closeTransactionModal,
    parties,
    addTransaction,
    updateTransaction,
    deleteTransaction
  } = useLedgerStore();

  const { isOnline, queueOutboxItem } = useSyncStore();

  const [txType, setTxType] = useState('GAVE');
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [category, setCategory] = useState('GENERAL');
  const [notes, setNotes] = useState('');
  const [fileAttachment, setFileAttachment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setTxType(editingTransaction.type || 'GAVE');
      setSelectedPartyId(editingTransaction.party_id || (parties[0]?.id || ''));
      setAmount(String(editingTransaction.amount || ''));
      setPaymentMode(editingTransaction.payment_mode || 'CASH');
      setCategory(editingTransaction.category || 'GENERAL');
      setNotes(editingTransaction.notes || '');
    } else {
      if (transactionModalDefaultType) setTxType(transactionModalDefaultType);
      if (transactionModalParty) setSelectedPartyId(transactionModalParty.id);
      else if (parties.length > 0) setSelectedPartyId(parties[0].id);
      setAmount('');
      setNotes('');
      setPaymentMode('CASH');
      setCategory('GENERAL');
    }
  }, [isTransactionModalOpen, editingTransaction, transactionModalDefaultType, transactionModalParty, parties]);

  if (!isTransactionModalOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileAttachment(e.target.files[0]);
    }
  };

  const handleDelete = async () => {
    if (!editingTransaction) return;
    if (!window.confirm('Are you sure you want to permanently delete this transaction entry? This will revert the party balance.')) return;
    
    setIsSubmitting(true);
    try {
      await deleteTransaction(currentWorkspace.id, editingTransaction.id);
      closeTransactionModal();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPartyId || !amount || Number(amount) <= 0) {
      alert('Please select a party and enter a valid positive amount.');
      return;
    }

    setIsSubmitting(true);

    const txData = {
      partyId: selectedPartyId,
      type: txType,
      amount: Number(amount),
      paymentMode,
      category,
      notes,
      date: editingTransaction ? editingTransaction.date : new Date().toISOString()
    };

    try {
      if (editingTransaction) {
        await updateTransaction(currentWorkspace.id, editingTransaction.id, txData);
      } else {
        if (!isOnline) {
          const targetParty = parties.find(p => p.id === selectedPartyId);
          queueOutboxItem('TRANSACTION', {
            ...txData,
            partyName: targetParty ? targetParty.name : 'Party'
          });
          alert('Offline mode active: Transaction stored in offline outbox.');
        } else {
          await addTransaction(currentWorkspace.id, txData, fileAttachment);
        }
      }
      closeTransactionModal();
      setAmount('');
      setNotes('');
      setFileAttachment(null);
    } catch (err) {
      alert(`Error saving transaction: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
      <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem', position: 'relative', borderRadius: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: txType === 'GOT' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {txType === 'GOT' ? <PlusCircle size={20} color="var(--color-emerald)" /> : <MinusCircle size={20} color="var(--color-rose)" />}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {editingTransaction ? 'Edit Ledger Entry' : `Record ${txType === 'GOT' ? 'Cash Received (Credit ₹)' : 'Cash Given (Debit ₹)'}`}
            </h3>
          </div>

          <button onClick={closeTransactionModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Toggle Type buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => setTxType('GAVE')}
            className={txType === 'GAVE' ? 'btn-rose' : 'btn-secondary'}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <MinusCircle size={16} /> You Gave (Debit ₹)
          </button>
          <button
            type="button"
            onClick={() => setTxType('GOT')}
            className={txType === 'GOT' ? 'btn-emerald' : 'btn-secondary'}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <PlusCircle size={16} /> You Got (Credit ₹)
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Select Party */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Select Party *</label>
            <select
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(e.target.value)}
              className="input-field"
              required
            >
              {parties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type}) — Bal: ₹{p.current_balance}
                </option>
              ))}
            </select>
          </div>

          {/* Amount input */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Amount (₹) *</label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field font-mono"
              style={{ fontSize: '1.25rem', fontWeight: '700', color: txType === 'GOT' ? 'var(--color-emerald)' : 'var(--color-rose)' }}
            />
          </div>

          {/* Payment Mode & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Payment Mode</label>
              <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="input-field">
                <option value="CASH">Cash</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
                <option value="GENERAL">General</option>
                <option value="SUPPLIES">Raw Supplies</option>
                <option value="INVOICE">Invoice Payment</option>
                <option value="SALARY">Salary / Wage</option>
                <option value="UTILITIES">Rent & Utilities</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Notes / Description</label>
            <input
              type="text"
              placeholder="e.g. Bill #4092 payment"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
            />
          </div>

          {/* File Attachment Dropzone */}
          {!editingTransaction && (
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Attach Bill / Receipt / Document</label>
              <div style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'center',
                background: 'var(--bg-canvas)',
                cursor: 'pointer'
              }} onClick={() => document.getElementById('file-upload-input').click()}>
                <input
                  id="file-upload-input"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                />
                {fileAttachment ? (
                  <div style={{ color: 'var(--color-cyan)', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <Paperclip size={16} /> {fileAttachment.name} ({(fileAttachment.size / 1024).toFixed(1)} KB)
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.825rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                    <Upload size={20} color="var(--color-cyan)" />
                    <span>Click to attach invoice image or PDF document</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            {editingTransaction && (
              <button type="button" onClick={handleDelete} className="btn-secondary" style={{ color: 'var(--color-rose)', padding: '0 0.85rem' }}>
                <Trash2 size={16} /> Delete Entry
              </button>
            )}

            <button type="button" onClick={closeTransactionModal} className="btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={txType === 'GOT' ? 'btn-emerald' : 'btn-rose'}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {isSubmitting ? 'Saving...' : editingTransaction ? 'Update Entry' : `Confirm ${txType === 'GOT' ? 'Cash Received' : 'Cash Given'}`}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
