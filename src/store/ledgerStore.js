import { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

let listeners = [];
let state = {
  parties: [],
  transactions: [],
  summary: {
    totalYouWillGet: 0,
    totalYouWillGive: 0,
    netBalance: 0,
    totalParties: 0,
    totalTransactions: 0,
    currency: 'INR'
  },
  selectedParty: null,
  activeTab: 'dashboard', // 'dashboard' | 'parties' | 'transactions' | 'telemetry'
  isTransactionModalOpen: false,
  transactionModalParty: null,
  transactionModalDefaultType: 'GAVE', // 'GAVE' | 'GOT'
  editingTransaction: null, // null or object when editing
  searchTerm: '',
  partyTypeFilter: '', // '' | 'CUSTOMER' | 'SUPPLIER'
  isLoading: false,
  error: null
};

function setState(newState) {
  state = { ...state, ...newState };
  listeners.forEach(l => l(state));
}

const LOCAL_STORAGE_DATA_KEY = 'khata_local_ledger_data';

function getLocalData(workspaceId) {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_DATA_KEY}_${workspaceId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveLocalData(workspaceId, data) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_DATA_KEY}_${workspaceId}`, JSON.stringify({
      summary: data.summary,
      parties: data.parties,
      transactions: data.transactions
    }));
  } catch (e) {
    console.error('Failed to save local data:', e);
  }
}

function recalculateSummary(parties = [], transactions = []) {
  let totalYouWillGet = 0;
  let totalYouWillGive = 0;
  parties.forEach(p => {
    const bal = Number(p.current_balance || 0);
    if (bal > 0) totalYouWillGet += bal;
    else if (bal < 0) totalYouWillGive += Math.abs(bal);
  });
  return {
    totalYouWillGet,
    totalYouWillGive,
    netBalance: totalYouWillGet - totalYouWillGive,
    totalParties: parties.length,
    totalTransactions: transactions.length,
    currency: 'INR'
  };
}

export function useLedgerStore() {
  const [store, setStore] = useState(state);

  useEffect(() => {
    listeners.push(setStore);
    return () => {
      listeners = listeners.filter(l => l !== setStore);
    };
  }, []);

  const fetchWorkspaceData = async (workspaceId) => {
    if (!workspaceId) return;
    setState({ isLoading: true, error: null });
    try {
      const summaryRes = await apiClient.getExecutiveSummary(workspaceId);
      const partiesRes = await apiClient.getParties(workspaceId, {
        search: state.searchTerm,
        type: state.partyTypeFilter
      });
      const txRes = await apiClient.getTransactions(workspaceId, { limit: 50 });

      const freshSelected = state.selectedParty 
        ? (partiesRes.data.find(p => p.id === state.selectedParty.id) || (partiesRes.data.length > 0 ? partiesRes.data[0] : null))
        : (partiesRes.data.length > 0 ? partiesRes.data[0] : null);

      const freshState = {
        summary: summaryRes.data.summary,
        parties: partiesRes.data,
        transactions: txRes.data,
        selectedParty: freshSelected,
        isLoading: false
      };
      saveLocalData(workspaceId, freshState);
      setState(freshState);
    } catch (err) {
      console.warn('Backend data fetch unavailable, loading local offline ledger cache:', err);
      const localData = getLocalData(workspaceId) || {
        summary: recalculateSummary(state.parties, state.transactions),
        parties: state.parties,
        transactions: state.transactions
      };
      const freshSelected = state.selectedParty 
        ? (localData.parties.find(p => p.id === state.selectedParty.id) || (localData.parties[0] || null))
        : (localData.parties[0] || null);

      setState({
        summary: localData.summary || recalculateSummary(localData.parties, localData.transactions),
        parties: localData.parties || [],
        transactions: localData.transactions || [],
        selectedParty: freshSelected,
        isLoading: false,
        error: null
      });
    }
  };

  const createParty = async (workspaceId, partyData) => {
    setState({ isLoading: true, error: null });
    try {
      const res = await apiClient.createParty(workspaceId, partyData);
      await fetchWorkspaceData(workspaceId);
      return res.data;
    } catch (err) {
      console.warn('Backend createParty unavailable, saving party locally:', err);
      const initialBal = Number(partyData.openingBalance || 0);
      const newParty = {
        id: `party_local_${Date.now()}`,
        workspace_id: workspaceId,
        name: partyData.name,
        phone: partyData.phone || '',
        email: partyData.email || '',
        address: partyData.address || '',
        type: partyData.type || 'CUSTOMER',
        opening_balance: initialBal,
        current_balance: initialBal,
        created_at: new Date().toISOString()
      };

      const updatedParties = [newParty, ...state.parties];
      const updatedSummary = recalculateSummary(updatedParties, state.transactions);

      const updatedState = {
        parties: updatedParties,
        summary: updatedSummary,
        selectedParty: newParty,
        isLoading: false,
        error: null
      };

      saveLocalData(workspaceId, updatedState);
      setState(updatedState);
      return newParty;
    }
  };

  const updateParty = async (workspaceId, partyId, partyData) => {
    setState({ isLoading: true, error: null });
    try {
      const res = await apiClient.updateParty(workspaceId, partyId, partyData);
      await fetchWorkspaceData(workspaceId);
      return res.data;
    } catch (err) {
      console.warn('Backend updateParty unavailable, updating party locally:', err);
      const updatedParties = state.parties.map(p => {
        if (p.id === partyId) {
          return {
            ...p,
            name: partyData.name !== undefined ? partyData.name : p.name,
            phone: partyData.phone !== undefined ? partyData.phone : p.phone,
            email: partyData.email !== undefined ? partyData.email : p.email,
            address: partyData.address !== undefined ? partyData.address : p.address,
            type: partyData.type !== undefined ? partyData.type : p.type
          };
        }
        return p;
      });

      const updatedSummary = recalculateSummary(updatedParties, state.transactions);
      const updatedSelected = updatedParties.find(p => p.id === (state.selectedParty?.id || partyId)) || null;

      const updatedState = {
        parties: updatedParties,
        summary: updatedSummary,
        selectedParty: updatedSelected,
        isLoading: false,
        error: null
      };

      saveLocalData(workspaceId, updatedState);
      setState(updatedState);
      return updatedSelected;
    }
  };

  const deleteParty = async (workspaceId, partyId) => {
    setState({ isLoading: true, error: null });
    try {
      const res = await apiClient.deleteParty(workspaceId, partyId);
      if (state.selectedParty && state.selectedParty.id === partyId) {
        setState({ selectedParty: null });
      }
      await fetchWorkspaceData(workspaceId);
      return res.data;
    } catch (err) {
      console.warn('Backend deleteParty unavailable, deleting party locally:', err);
      const updatedParties = state.parties.filter(p => p.id !== partyId);
      const updatedSummary = recalculateSummary(updatedParties, state.transactions);

      const updatedState = {
        parties: updatedParties,
        summary: updatedSummary,
        selectedParty: state.selectedParty?.id === partyId ? (updatedParties[0] || null) : state.selectedParty,
        isLoading: false,
        error: null
      };

      saveLocalData(workspaceId, updatedState);
      setState(updatedState);
      return { success: true };
    }
  };

  const addTransaction = async (workspaceId, txData, fileAttachment) => {
    setState({ isLoading: true, error: null });
    try {
      const res = await apiClient.addTransaction(workspaceId, txData);
      
      if (fileAttachment && res.data.id) {
        try {
          await apiClient.uploadAttachment(res.data.id, fileAttachment);
        } catch (uploadErr) {
          console.error('Attachment upload failed:', uploadErr);
        }
      }

      await fetchWorkspaceData(workspaceId);
      return res.data;
    } catch (err) {
      console.warn('Backend addTransaction unavailable, saving transaction locally:', err);
      const newTx = {
        id: `tx_local_${Date.now()}`,
        party_id: txData.partyId,
        type: txData.type,
        amount: Number(txData.amount || 0),
        payment_mode: txData.paymentMode || 'CASH',
        category: txData.category || 'GENERAL',
        notes: txData.notes || '',
        date: txData.date || new Date().toISOString()
      };

      const amountChange = txData.type === 'GOT' ? Number(txData.amount) : -Number(txData.amount);

      const updatedParties = state.parties.map(p => {
        if (p.id === txData.partyId) {
          return {
            ...p,
            current_balance: Number(p.current_balance || 0) + amountChange
          };
        }
        return p;
      });

      const updatedTxs = [newTx, ...state.transactions];
      const updatedSummary = recalculateSummary(updatedParties, updatedTxs);
      const updatedSelected = updatedParties.find(p => p.id === state.selectedParty?.id) || state.selectedParty;

      const updatedState = {
        parties: updatedParties,
        transactions: updatedTxs,
        summary: updatedSummary,
        selectedParty: updatedSelected,
        isLoading: false,
        error: null
      };

      saveLocalData(workspaceId, updatedState);
      setState(updatedState);
      return newTx;
    }
  };

  const updateTransaction = async (workspaceId, txId, txData) => {
    setState({ isLoading: true, error: null });
    try {
      const res = await apiClient.updateTransaction(workspaceId, txId, txData);
      await fetchWorkspaceData(workspaceId);
      return res.data;
    } catch (err) {
      console.warn('Backend updateTransaction unavailable, updating transaction locally:', err);
      const updatedTxs = state.transactions.map(t => {
        if (t.id === txId) {
          return {
            ...t,
            type: txData.type || t.type,
            amount: txData.amount !== undefined ? Number(txData.amount) : t.amount,
            payment_mode: txData.paymentMode || t.payment_mode,
            category: txData.category || t.category,
            notes: txData.notes !== undefined ? txData.notes : t.notes
          };
        }
        return t;
      });

      const updatedSummary = recalculateSummary(state.parties, updatedTxs);
      const updatedState = {
        transactions: updatedTxs,
        summary: updatedSummary,
        isLoading: false,
        error: null
      };

      saveLocalData(workspaceId, updatedState);
      setState(updatedState);
      return { success: true };
    }
  };

  const deleteTransaction = async (workspaceId, txId) => {
    setState({ isLoading: true, error: null });
    try {
      const res = await apiClient.deleteTransaction(workspaceId, txId);
      await fetchWorkspaceData(workspaceId);
      return res.data;
    } catch (err) {
      console.warn('Backend deleteTransaction unavailable, deleting transaction locally:', err);
      const updatedTxs = state.transactions.filter(t => t.id !== txId);
      const updatedSummary = recalculateSummary(state.parties, updatedTxs);

      const updatedState = {
        transactions: updatedTxs,
        summary: updatedSummary,
        isLoading: false,
        error: null
      };

      saveLocalData(workspaceId, updatedState);
      setState(updatedState);
      return { success: true };
    }
  };

  const setSelectedParty = (party) => {
    setState({ selectedParty: party });
  };

  const setActiveTab = (tab) => {
    setState({ activeTab: tab });
  };

  const setSearchTerm = (term) => {
    setState({ searchTerm: term });
  };

  const setPartyTypeFilter = (filter) => {
    setState({ partyTypeFilter: filter });
  };

  const openTransactionModal = (party = null, type = 'GAVE') => {
    setState({
      isTransactionModalOpen: true,
      transactionModalParty: party,
      transactionModalDefaultType: type,
      editingTransaction: null
    });
  };

  const openEditTransactionModal = (transaction) => {
    setState({
      isTransactionModalOpen: true,
      editingTransaction: transaction,
      transactionModalDefaultType: transaction.type,
      transactionModalParty: state.parties.find(p => p.id === transaction.party_id) || null
    });
  };

  const closeTransactionModal = () => {
    setState({
      isTransactionModalOpen: false,
      transactionModalParty: null,
      editingTransaction: null
    });
  };

  return {
    ...store,
    fetchWorkspaceData,
    createParty,
    updateParty,
    deleteParty,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setSelectedParty,
    setActiveTab,
    setSearchTerm,
    setPartyTypeFilter,
    openTransactionModal,
    openEditTransactionModal,
    closeTransactionModal
  };
}
