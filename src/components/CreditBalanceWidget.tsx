/**
 * Credit Balance Widget
 * Display user's credit balance in the UI
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { getCreditBalance, formatCredits } from '../services/credits';

interface CreditBalanceWidgetProps {
  onPress?: () => void;
  style?: any;
}

export default function CreditBalanceWidget({ onPress, style }: CreditBalanceWidgetProps) {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBalance();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadBalance, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadBalance = async () => {
    try {
      const balance = await getCreditBalance();
      if (balance) {
        setCredits(balance.credits);
      }
    } catch (error) {
      console.error('Error loading credit balance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <TouchableOpacity style={[styles.container, style]} onPress={onPress}>
        <ActivityIndicator size="small" color="#8B5CF6" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={styles.emoji}>💎</Text>
        <View style={styles.textContainer}>
          <Text style={styles.amount}>{formatCredits(credits || 0)}</Text>
          <Text style={styles.label}>credits</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    minWidth: 120,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  label: {
    fontSize: 12,
    color: '#94A3B8',
  },
});

