import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types';
import { getHistory, deleteHistoryItem, clearHistory, HistoryItem } from '../services/history';
import MyMovieCard from '../components/MyMovieCard';
import COLORS from '../constants/colors';

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
    if (item.status === 'completed' && item.imageUri) {
      navigation.navigate('VideoPlayer', {
        videoUrl: item.imageUri,
        description: item.description,
      });
    }
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
    <View
      style={[
        styles.item,
        { marginLeft: index % 2 === 0 ? SPACING : SPACING / 2 },
        { marginRight: index % 2 === 0 ? SPACING / 2 : SPACING },
      ]}
    >
      <TouchableOpacity
        onLongPress={() => handleDeleteItem(item.id)}
        activeOpacity={1}
      >
        <MyMovieCard
          taskId={item.taskId}
          videoUri={item.imageUri}
          description={item.description}
          status={item.status || 'completed'}
          width={ITEM_WIDTH}
          height={ITEM_WIDTH * 1.3}
          onPress={() => handleItemPress(item)}
        />
      </TouchableOpacity>
      <View style={styles.itemInfo}>
        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
      </View>
    </View>
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
    backgroundColor: COLORS.background.primary,
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
    backgroundColor: COLORS.surface.primary,
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
    borderColor: COLORS.text.primary,
    transform: [{ rotate: '45deg' }],
    marginLeft: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.status.error,
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
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: COLORS.text.secondary,
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
  itemInfo: {
    marginTop: 8,
  },
  itemDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
});

