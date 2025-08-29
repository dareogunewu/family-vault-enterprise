// React hook for Family Vault Enterprise with Bitwarden-inspired architecture
'use client';

import { useState, useEffect, useCallback } from 'react';
import { CipherData, CipherType, FamilyMemberData } from '../lib/models/cipher.models';
import { vaultService } from '../lib/services/vault.service';

export interface UseVaultState {
  isLoading: boolean;
  isUnlocked: boolean;
  error: string | null;
  passwords: CipherData[];
  documents: CipherData[];
  secureNotes: CipherData[];
  familyMembers: FamilyMemberData[];
  breachedPasswords: { cipherId: string; breachCount: number }[];
}

export function useVault() {
  const [state, setState] = useState<UseVaultState>({
    isLoading: false,
    isUnlocked: false,
    error: null,
    passwords: [],
    documents: [],
    secureNotes: [],
    familyMembers: [],
    breachedPasswords: [],
  });

  // Initialize vault with master password and YubiKey
  const unlockVault = useCallback(async (email: string, password: string, yubiKeyChallenge?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await vaultService.initializeVault(email, password, yubiKeyChallenge);
      setState(prev => ({ ...prev, isUnlocked: true, isLoading: false }));
      
      // Load vault data
      await refreshVaultData();
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to unlock vault'
      }));
    }
  }, []);

  // Refresh all vault data
  const refreshVaultData = useCallback(async () => {
    if (!state.isUnlocked) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const [passwords, documents, secureNotes, breachedPasswords] = await Promise.all([
        vaultService.getCiphersByType(CipherType.Login),
        vaultService.getCiphersByType(CipherType.Document),
        vaultService.getCiphersByType(CipherType.SecureNote),
        vaultService.checkPasswordBreaches(),
      ]);

      setState(prev => ({
        ...prev,
        passwords,
        documents,
        secureNotes,
        breachedPasswords,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load vault data',
        isLoading: false,
      }));
    }
  }, [state.isUnlocked]);

  // Add new password
  const addPassword = useCallback(async (data: {
    name: string;
    username?: string;
    password?: string;
    uri?: string;
    totp?: string;
    notes?: string;
    favorite?: boolean;
  }) => {
    try {
      await vaultService.addLogin(data);
      await refreshVaultData();
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to add password',
      }));
      return false;
    }
  }, [refreshVaultData]);

  // Add new document
  const addDocument = useCallback(async (data: {
    name: string;
    file: File;
    category: string;
    notes?: string;
  }) => {
    try {
      await vaultService.addDocument(data);
      await refreshVaultData();
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to add document',
      }));
      return false;
    }
  }, [refreshVaultData]);

  // Update cipher
  const updateCipher = useCallback(async (cipher: CipherData) => {
    try {
      await vaultService.updateCipher(cipher);
      await refreshVaultData();
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update item',
      }));
      return false;
    }
  }, [refreshVaultData]);

  // Delete cipher
  const deleteCipher = useCallback(async (cipherId: string) => {
    try {
      await vaultService.deleteCipher(cipherId);
      await refreshVaultData();
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete item',
      }));
      return false;
    }
  }, [refreshVaultData]);

  // Search vault
  const searchVault = useCallback(async (query: string) => {
    try {
      const results = await vaultService.searchCiphers(query);
      return results;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Search failed',
      }));
      return [];
    }
  }, []);

  // Generate secure password
  const generatePassword = useCallback((options: {
    length: number;
    includeUppercase: boolean;
    includeLowercase: boolean;
    includeNumbers: boolean;
    includeSymbols: boolean;
    avoidAmbiguous: boolean;
  }) => {
    return vaultService.generatePassword(options);
  }, []);

  // Share with family
  const shareWithFamily = useCallback(async (cipherId: string, memberIds: string[]) => {
    try {
      await vaultService.shareWithFamily(cipherId, memberIds);
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to share item',
      }));
      return false;
    }
  }, []);

  // Setup emergency access
  const setupEmergencyAccess = useCallback(async (contactEmail: string, waitTimeDays: number) => {
    try {
      await vaultService.setupEmergencyAccess(contactEmail, waitTimeDays);
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to setup emergency access',
      }));
      return false;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Lock vault
  const lockVault = useCallback(() => {
    setState({
      isLoading: false,
      isUnlocked: false,
      error: null,
      passwords: [],
      documents: [],
      secureNotes: [],
      familyMembers: [],
      breachedPasswords: [],
    });
  }, []);

  // Get password strength analysis
  const getPasswordStrength = useCallback((password: string): {
    score: number;
    feedback: string[];
    strength: 'weak' | 'medium' | 'strong';
  } => {
    const score = calculatePasswordStrength(password);
    const feedback = getPasswordFeedback(password);
    
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (score >= 80) strength = 'strong';
    else if (score >= 60) strength = 'medium';

    return { score, feedback, strength };
  }, []);

  // Check if password is breached
  const isPasswordBreached = useCallback((cipherId: string) => {
    return state.breachedPasswords.some(bp => bp.cipherId === cipherId);
  }, [state.breachedPasswords]);

  // Get vault statistics
  const getVaultStats = useCallback(() => {
    const totalItems = state.passwords.length + state.documents.length + state.secureNotes.length;
    const strongPasswords = state.passwords.filter(p => {
      if (!p.login?.password) return false;
      return getPasswordStrength(p.login.password).strength === 'strong';
    }).length;
    const weakPasswords = state.passwords.filter(p => {
      if (!p.login?.password) return false;
      return getPasswordStrength(p.login.password).strength === 'weak';
    }).length;
    const breachedCount = state.breachedPasswords.length;

    return {
      totalItems,
      totalPasswords: state.passwords.length,
      totalDocuments: state.documents.length,
      strongPasswords,
      weakPasswords,
      breachedCount,
    };
  }, [state, getPasswordStrength]);

  return {
    // State
    ...state,
    
    // Actions
    unlockVault,
    lockVault,
    refreshVaultData,
    addPassword,
    addDocument,
    updateCipher,
    deleteCipher,
    searchVault,
    generatePassword,
    shareWithFamily,
    setupEmergencyAccess,
    clearError,
    
    // Utilities
    getPasswordStrength,
    isPasswordBreached,
    getVaultStats,
  };
}

// Helper functions
function calculatePasswordStrength(password: string): number {
  let score = 0;
  
  // Length
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  
  // Character diversity
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;
  
  // Patterns
  if (!/(.)\1{2,}/.test(password)) score += 10; // No repeated characters
  if (!/123|abc|qwe/i.test(password)) score += 5; // No common sequences
  
  return Math.min(100, score);
}

function getPasswordFeedback(password: string): string[] {
  const feedback: string[] = [];
  
  if (password.length < 8) {
    feedback.push('Use at least 8 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    feedback.push('Add lowercase letters');
  }
  
  if (!/[A-Z]/.test(password)) {
    feedback.push('Add uppercase letters');
  }
  
  if (!/[0-9]/.test(password)) {
    feedback.push('Add numbers');
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    feedback.push('Add special characters');
  }
  
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeated characters');
  }
  
  if (/123|abc|qwe/i.test(password)) {
    feedback.push('Avoid common sequences');
  }
  
  return feedback;
}