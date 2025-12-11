import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { Video } from 'expo-av';
import COLORS from '../constants/colors';
import TYPO from '../constants/typography';

type VideoCardProps = {
  videoUri: string;
  poster?: string | ImageSourcePropType;
  title: string;
  width: number;
  height: number;
  description?: string;
  onPress?: () => void;
};

const VideoCard: React.FC<VideoCardProps> = ({
  videoUri,
  poster,
  title,
  width,
  height,
  description,
  onPress,
}) => {
  return (
    <TouchableOpacity style={[styles.card, { width }]} activeOpacity={0.9} onPress={onPress}>
      <View style={[styles.videoWrapper, { width, height }]}>
        <Video
          source={{ uri: videoUri }}
          style={styles.video}
          isMuted
          shouldPlay
          isLooping
          resizeMode="cover"
          posterSource={typeof poster === 'string' ? { uri: poster } : poster}
          usePoster={!!poster}
        />
        <View style={styles.overlay}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
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
  overlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  title: {
    fontSize: 12,
    fontFamily: TYPO.semibold,
    color: '#FFFFFF', // branco para o título do card
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

export default VideoCard;

