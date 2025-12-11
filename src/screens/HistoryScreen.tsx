import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types';
import { getHistory, deleteHistoryItem, clearHistory, HistoryItem } from '../services/history';

type HistoryScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'History'>;
};

const { width } = Dimensions.get('window');
const SPACING = 15;
const ITEM_WIDTH = (width - (SPACING * 3)) / 2;

export default function HistoryScreen({ navigation }: HistoryScreenProps) {
  const { t } = useTranslation();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const insets = useSafeAreaInsets();

  const loadHistory = async () => {
    const items = await getHistory();
    setHistory(items);
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handleItemPress = (item: HistoryItem) => {
    navigation.navigate('Edit', { imageUri: item.imageUri });
  };

  const handleDeleteItem = (id: string) => {
    Alert.alert(
      t('history.deleteConfirmTitle'),
      t('history.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteHistoryItem(id);
            loadHistory();
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      t('history.clearConfirmTitle'),
      t('history.clearConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.clearAll'),
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
            loadHistory();
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t('history.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('history.yesterday');
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const renderItem = ({ item, index }: { item: HistoryItem; index: number }) => (
    <TouchableOpacity
      style={[
        styles.item,
        { marginLeft: index % 2 === 0 ? SPACING : SPACING / 2 },
        { marginRight: index % 2 === 0 ? SPACING / 2 : SPACING },
      ]}
      onPress={() => handleItemPress(item)}
      onLongPress={() => handleDeleteItem(item.id)}
    >
      <Image
        source={{ uri: item.imageUri }}
        style={styles.itemImage}
        resizeMode="cover"
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView 
      style={[styles.container, { paddingTop: insets.top }]} 
      edges={['left', 'right']}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <View style={styles.backArrow} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('history.title')}</Text>
        {history.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
            <Text style={styles.clearButtonText}>{t('history.clear')}</Text>
          </TouchableOpacity>
        )}
        {history.length === 0 && <View style={styles.spacer} />}
      </View>

      {/* Content */}
      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('history.emptyTitle')}</Text>
          <Text style={styles.emptySubtext}>
            {t('history.emptySubtitle')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backArrow: {
    width: 12,
    height: 12,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#000',
    transform: [{ rotate: '45deg' }],
    marginLeft: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  spacer: {
    width: 44,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  listContent: {
    paddingTop: 15,
    paddingBottom: 20,
  },
  item: {
    width: ITEM_WIDTH,
    marginBottom: 20,
  },
  itemImage: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.3,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
  },
  itemInfo: {
    marginTop: 8,
  },
  itemDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
    color: '#666',
  },
});

