import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../constants/colors';
import TYPO from '../constants/typography';

type MyMovieCardProps = {
  taskId?: string;
  videoUri: string;
  description: string;
  status: 'processing' | 'completed' | 'failed';
  width: number;
  height: number;
  onPress?: () => void;
};

const MyMovieCard: React.FC<MyMovieCardProps> = ({
  taskId,
  videoUri,
  description,
  status,
  width,
  height,
  onPress,
}) => {
  const isProcessing = status === 'processing';
  const isFailed = status === 'failed';
  const isCompleted = status === 'completed';

  return (
    <TouchableOpacity 
      style={[styles.card, { width }]} 
      activeOpacity={0.9} 
      onPress={isCompleted ? onPress : undefined}
      disabled={!isCompleted}
    >
      <View style={[styles.videoWrapper, { width, height }]}>
        {isCompleted && videoUri ? (
          <>
            <Video
              source={{ uri: videoUri }}
              style={styles.video}
              isMuted
              shouldPlay={false}
              isLooping
              resizeMode={ResizeMode.COVER}
            />
            <LinearGradient
              colors={['transparent', 'transparent', 'rgba(0,0,0,0.7)']}
              locations={[0, 0.5, 1]}
              style={styles.gradient}
            />
            <View style={styles.playIconContainer}>
              <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
            </View>
          </>
        ) : (
          <View style={styles.placeholderContainer}>
            <LinearGradient
              colors={[COLORS.primary.violet + '40', COLORS.primary.pink + '40']}
              style={styles.gradientBg}
            />
            {isProcessing && (
              <>
                <ActivityIndicator size="large" color={COLORS.primary.violet} />
                <Text style={styles.processingText}>Generating...</Text>
              </>
            )}
            {isFailed && (
              <>
                <Ionicons name="alert-circle" size={48} color={COLORS.error} />
                <Text style={styles.failedText}>Failed</Text>
              </>
            )}
          </View>
        )}
        
        <View style={styles.overlay}>
          <Text style={styles.description} numberOfLines={2}>
            {description || 'Untitled Video'}
          </Text>
          {isProcessing && (
            <View style={styles.statusBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.statusText}>Processing</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginRight: 15,
  },
  videoWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.surface.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  playIconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface.secondary,
  },
  gradientBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  processingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: TYPO.semibold,
    color: COLORS.text.primary,
  },
  failedText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: TYPO.semibold,
    color: COLORS.error,
  },
  overlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  description: {
    fontSize: 13,
    fontFamily: TYPO.semibold,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary.violet,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontFamily: TYPO.medium,
    color: '#FFFFFF',
  },
});

export default MyMovieCard;
