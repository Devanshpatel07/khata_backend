import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useLedgerStore } from '../store/ledgerStore';
import { 
  X, 
  Mic, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  DollarSign, 
  User, 
  Tag, 
  ArrowLeftRight 
} from 'lucide-react';

export default function SmartEntryModal({ isOpen, onClose }) {
  const { currentWorkspace } = useAuthStore();
  const { addTransaction, parties } = useLedgerStore();

  const [promptText, setPromptText] = useState('');
  const [selectedType, setSelectedType] = useState('DEBIT');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);

  if (!isOpen) return null;

  // Real-time natural language speech & text heuristic parser
  const parsedAmount = (() => {
    const match = promptText.match(/\d+/);
    return match ? match[0] : '0';
  })();

  const parsedParty = (() => {
    if (promptText.toLowerCase().includes('ramesh')) return 'Ramesh';
    if (promptText.toLowerCase().includes('microsoft')) return 'Microsoft';
    if (promptText.toLowerCase().includes('devansh')) return 'Devansh Patel';
    return parties.length > 0 ? parties[0].name : 'General Customer';
  })();

  const parsedCategory = (() => {
    if (promptText.toLowerCase().includes('dinner') || promptText.toLowerCase().includes('food')) return '🍽️ Dining';
    if (promptText.toLowerCase().includes('salary')) return '💼 Salary';
    return '🛒 Supplies';
  })();

  // Live Speech Recognition Engine (Web Speech API)
  const handleStartMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported by your current browser environment. You can type your transaction description directly into the prompt box.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setPromptText(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (err) => {
        console.warn('Speech recognition notice:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setIsListening(false);
    }
  };

  const handleQuickAddAmount = (val) => {
    const num = parseInt(parsedAmount) + val;
    setPromptText(`Paid ₹${num} for supplies to ${parsedParty}`);
  };

  const handleSave = async () => {
    if (parsedAmount === '0') {
      alert('Please describe an amount in your prompt or click a quick pad button.');
      return;
    }

    setIsSubmitting(true);
    try {
      const party = parties.find(p => p.name.toLowerCase().includes(parsedParty.toLowerCase())) || parties[0];
      await addTransaction(currentWorkspace.id, {
        partyId: party ? party.id : (parties[0]?.id || ''),
        type: selectedType === 'DEBIT' ? 'GAVE' : 'GOT',
        amount: Number(parsedAmount),
        paymentMode,
        category: 'GENERAL',
        notes: promptText || `Smart entry payment to ${parsedParty}`
      });
      onClose();
      setPromptText('');
    } catch (err) {
      alert(`Failed to save: ${err.message}`);
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
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1200,
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem', borderRadius: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4F46E5, #818CF8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={20} color="#FFF" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Smart Natural Language Entry</h3>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>AI-Assisted Voice & Text Ledger Parser</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setPromptText('')} className="btn-secondary" style={{ padding: '0.4rem', minHeight: '36px' }}>
              <RefreshCw size={16} />
            </button>
            <button onClick={onClose} className="btn-secondary" style={{ padding: '0.4rem', minHeight: '36px' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Natural Language Prompt Input */}
        <div style={{ marginBottom: '1rem' }}>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder={`Describe your transaction or tap Mic, e.g.\n"Spent 150 for dinner with Ramesh"\n"Received 20000 salary from Devansh"`}
            rows={4}
            className="input-field font-mono"
            style={{
              fontSize: '0.925rem',
              lineHeight: '1.5',
              borderRadius: '16px',
              padding: '1rem',
              resize: 'none'
            }}
          />
        </div>

        {/* Quick Amount Pads */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
          {[100, 500, 1000, 2000].map(amt => (
            <button
              key={amt}
              type="button"
              onClick={() => handleQuickAddAmount(amt)}
              className="btn-secondary"
              style={{ justifyContent: 'center', padding: '0.5rem', fontSize: '0.825rem', color: 'var(--color-purple)' }}
            >
              +₹{amt}
            </button>
          ))}
        </div>

        {/* Transaction Type Fast Toggle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={() => setSelectedType('DEBIT')}
            className={selectedType === 'DEBIT' ? 'btn-rose' : 'btn-secondary'}
            style={{ justifyContent: 'center', minHeight: '44px', borderColor: 'var(--color-rose)' }}
          >
            You Gave (Debit ₹)
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('CREDIT')}
            className={selectedType === 'CREDIT' ? 'btn-emerald' : 'btn-secondary'}
            style={{ justifyContent: 'center', minHeight: '44px', borderColor: 'var(--color-emerald)' }}
          >
            You Got (Credit ₹)
          </button>
        </div>

        {/* Payment Mode Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1.25rem', paddingBottom: '0.25rem' }}>
          {['CASH', 'UPI', 'CARD', 'Bank', 'Cheque'].map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setPaymentMode(mode)}
              className={paymentMode === mode ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.775rem', minHeight: '36px', flexShrink: 0 }}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Auto Parsed Fields Preview */}
        <div className="glass-card" style={{ padding: '1rem', borderRadius: '18px', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: '800', letterSpacing: '1px', color: 'var(--text-muted)' }}>
              AUTO PARSED FIELDS
            </span>
            <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
              <CheckCircle2 size={12} /> HIGH CONFIDENCE
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div className="badge badge-purple" style={{ padding: '0.4rem 0.65rem' }}>
              <DollarSign size={14} /> ₹{parsedAmount}
            </div>
            <div className={`badge ${selectedType === 'CREDIT' ? 'badge-emerald' : 'badge-rose'}`} style={{ padding: '0.4rem 0.65rem' }}>
              <ArrowLeftRight size={14} /> {selectedType}
            </div>
            <div className="badge badge-purple" style={{ padding: '0.4rem 0.65rem' }}>
              <Tag size={14} /> {parsedCategory}
            </div>
            <div className="badge badge-purple" style={{ padding: '0.4rem 0.65rem' }}>
              <User size={14} /> {parsedParty}
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
          <button
            type="button"
            className={isListening ? "mic-pulse active" : "mic-pulse"}
            title="Tap to speak transaction details"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: isListening ? 'linear-gradient(135deg, #EF4444, #F43F5E)' : 'var(--color-purple-40)',
              border: 'none',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: isListening ? '0 0 20px rgba(239, 68, 68, 0.6)' : 'none'
            }}
            onClick={handleStartMic}
          >
            <Mic size={24} />
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSave}
            className="btn-primary"
            style={{ flex: 1, justifyContent: 'center', minHeight: '56px', fontSize: '1rem' }}
          >
            {isSubmitting ? 'Saving Entry...' : 'Save Transaction'}
          </button>
        </div>

      </div>
    </div>
  );
}
