/**
 * Credits Screen
 * Display credit balance, history, and purchase options
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  getCreditBalance,
  getCreditHistory,
  getCreditStats,
  getAvailableCreditProducts,
  purchaseCreditPack,
  formatCredits,
  getTransactionTypeName,
  getTransactionTypeEmoji,
  CreditTransaction,
  CreditStats,
} from '../services/credits';
import COLORS from '../constants/colors';

export default function CreditsScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<CreditStats | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [creditProducts, setCreditProducts] = useState<any[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load credit stats and products in parallel
      const [statsData, productsData] = await Promise.all([
        getCreditStats(),
        getAvailableCreditProducts(),
      ]);
      
      if (statsData) {
        setStats(statsData);
        setTransactions(statsData.recentTransactions || []);
      }
      
      setCreditProducts(productsData);
    } catch (error) {
      console.error('Error loading credit data:', error);
      Alert.alert(
        t('error', 'Error'),
        t('credits.loadError', 'Failed to load credit information')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handlePurchase = async (productId: string) => {
    try {
      setPurchasing(productId);
      
      const success = await purchaseCreditPack(productId);
      
      if (success) {
        Alert.alert(
          t('success', 'Success'),
          t('credits.purchaseSuccess', 'Credits added successfully!'),
          [{ text: t('ok', 'OK'), onPress: () => loadData() }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        t('error', 'Error'),
        error.message || t('credits.purchaseError', 'Failed to purchase credits')
      );
    } finally {
      setPurchasing(null);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return t('credits.justNow', 'Just now');
    if (minutes < 60) return t('credits.minutesAgo', '{{count}} minutes ago', { count: minutes });
    if (hours < 24) return t('credits.hoursAgo', '{{count}} hours ago', { count: hours });
    if (days < 7) return t('credits.daysAgo', '{{count}} days ago', { count: days });
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>
            {t('credits.loading', 'Loading credits...')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('credits.title', 'Credits')}
          </Text>
          <View style={styles.backButton} />
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>
            {t('credits.yourBalance', 'Your Balance')}
          </Text>
          <Text style={styles.balanceAmount}>
            {formatCredits(stats?.currentBalance || 0)}
          </Text>
          <Text style={styles.balanceSubtext}>
            {t('credits.creditsAvailable', 'credits available')}
          </Text>
          
          {stats?.subscriptionTier && (
            <View style={styles.subscriptionBadge}>
              <Text style={styles.subscriptionText}>
                💎 {stats.subscriptionTier.replace('moovia', '').replace('pro', 'PRO ')}
              </Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {formatCredits(stats?.lifetimeEarned || 0)}
            </Text>
            <Text style={styles.statLabel}>
              {t('credits.totalEarned', 'Total Earned')}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {formatCredits(stats?.lifetimeSpent || 0)}
            </Text>
            <Text style={styles.statLabel}>
              {t('credits.totalSpent', 'Total Spent')}
            </Text>
          </View>
        </View>

        {/* Credit Costs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('credits.costs', 'Credit Costs')}
          </Text>
          <View style={styles.costCard}>
            <Text style={styles.costModel}>🚀 Gemini Pro</Text>
            <Text style={styles.costAmount}>2 credits</Text>
          </View>
          <View style={styles.costCard}>
            <Text style={styles.costModel}>⚡ Gemini Flash</Text>
            <Text style={styles.costAmount}>1 credit</Text>
          </View>
        </View>

        {/* Purchase Credits */}
        {creditProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('credits.buyMore', 'Buy More Credits')}
            </Text>
            {creditProducts.map((product) => (
              <TouchableOpacity
                key={product.productId}
                style={styles.productCard}
                onPress={() => handlePurchase(product.productId)}
                disabled={purchasing === product.productId}
              >
                <View style={styles.productInfo}>
                  <Text style={styles.productTitle}>{product.title}</Text>
                  <Text style={styles.productDescription}>
                    {product.description}
                  </Text>
                </View>
                <View style={styles.productPriceContainer}>
                  {purchasing === product.productId ? (
                    <ActivityIndicator color="#8B5CF6" />
                  ) : (
                    <Text style={styles.productPrice}>{product.price}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('credits.recentActivity', 'Recent Activity')}
          </Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {t('credits.noTransactions', 'No transactions yet')}
              </Text>
            </View>
          ) : (
            transactions.map((tx) => (
              <View key={tx.transactionId} style={styles.transactionCard}>
                <View style={styles.transactionIcon}>
                  <Text style={styles.transactionEmoji}>
                    {getTransactionTypeEmoji(tx.type)}
                  </Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionType}>
                    {getTransactionTypeName(tx.type)}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatDate(tx.timestamp)}
                  </Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text
                    style={[
                      styles.transactionAmountText,
                      tx.amount > 0 ? styles.positive : styles.negative,
                    ]}
                  >
                    {tx.amount > 0 ? '+' : ''}
                    {tx.amount}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  backButton: {
    width: 40,
  },
  backButtonText: {
    fontSize: 28,
    color: COLORS.text.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  balanceCard: {
    backgroundColor: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
    margin: 20,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: COLORS.opacity.white80,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 56,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 14,
    color: COLORS.opacity.white80,
  },
  subscriptionBadge: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  subscriptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface.primary,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  costCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  costModel: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  costAmount: {
    fontSize: 16,
    color: COLORS.cta.secondary,
    fontWeight: '600',
  },
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface.primary,
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  productPriceContainer: {
    marginLeft: 16,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.cta.secondary,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionEmoji: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  transactionAmount: {
    marginLeft: 12,
  },
  transactionAmountText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  positive: {
    color: '#10B981',
  },
  negative: {
    color: '#EF4444',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.text.tertiary,
  },
});

