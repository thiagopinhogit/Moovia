import { Category, EditEffect } from '../types';
import { TFunction } from 'i18next';

// Helper function to get translated categories
export const getTranslatedCategories = (t: TFunction): Category[] => {
  return [
    {
      id: 'fashion',
      name: t('categories.fashion.name'),
      emoji: t('categories.fashion.emoji'),
      effects: [
        {
          id: 'outfit-change',
          name: t('categories.fashion.effects.outfitChange.name'),
          description: t('categories.fashion.effects.outfitChange.description'),
          image: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=400&h=600&fit=crop',
          category: 'fashion'
        },
        {
          id: 'hairstyle',
          name: t('categories.fashion.effects.hairstyle.name'),
          description: t('categories.fashion.effects.hairstyle.description'),
          image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=600&fit=crop',
          category: 'fashion'
        },
        {
          id: 'hair-color',
          name: t('categories.fashion.effects.hairColor.name'),
          description: t('categories.fashion.effects.hairColor.description'),
          image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=400&h=600&fit=crop',
          category: 'fashion'
        },
        {
          id: 'makeup',
          name: t('categories.fashion.effects.makeup.name'),
          description: t('categories.fashion.effects.makeup.description'),
          image: 'https://images.unsplash.com/photo-1596704017254-9b121068ac31?w=400&h=600&fit=crop',
          category: 'fashion'
        }
      ]
    },
    {
      id: 'beauty',
      name: t('categories.beauty.name'),
      emoji: t('categories.beauty.emoji'),
      effects: [
        {
          id: 'skin-smooth',
          name: t('categories.beauty.effects.skinSmooth.name'),
          description: t('categories.beauty.effects.skinSmooth.description'),
          image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=600&fit=crop',
          category: 'beauty'
        },
        {
          id: 'teeth-whitening',
          name: t('categories.beauty.effects.teethWhitening.name'),
          description: t('categories.beauty.effects.teethWhitening.description'),
          image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=600&fit=crop',
          category: 'beauty'
        },
        {
          id: 'eye-enhancement',
          name: t('categories.beauty.effects.eyeEnhancement.name'),
          description: t('categories.beauty.effects.eyeEnhancement.description'),
          image: 'https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=400&h=600&fit=crop',
          category: 'beauty'
        }
      ]
    },
    {
      id: 'creative',
      name: t('categories.creative.name'),
      emoji: t('categories.creative.emoji'),
      effects: [
        {
          id: 'artistic-filter',
          name: t('categories.creative.effects.artisticFilter.name'),
          description: t('categories.creative.effects.artisticFilter.description'),
          image: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=400&h=600&fit=crop',
          category: 'creative'
        },
        {
          id: 'background-change',
          name: t('categories.creative.effects.backgroundChange.name'),
          description: t('categories.creative.effects.backgroundChange.description'),
          image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=600&fit=crop',
          category: 'creative'
        },
        {
          id: 'lighting',
          name: t('categories.creative.effects.lighting.name'),
          description: t('categories.creative.effects.lighting.description'),
          image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
          category: 'creative'
        }
      ]
    },
    {
      id: 'photo-enhancement',
      name: t('categories.photoEnhancement.name'),
      emoji: t('categories.photoEnhancement.emoji'),
      effects: [
        {
          id: 'hd-quality',
          name: t('categories.photoEnhancement.effects.hdQuality.name'),
          description: t('categories.photoEnhancement.effects.hdQuality.description'),
          image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=600&fit=crop',
          category: 'photo-enhancement'
        },
        {
          id: 'color-correction',
          name: t('categories.photoEnhancement.effects.colorCorrection.name'),
          description: t('categories.photoEnhancement.effects.colorCorrection.description'),
          image: 'https://images.unsplash.com/photo-1513789181297-6f2ec112c0bc?w=400&h=600&fit=crop',
          category: 'photo-enhancement'
        },
        {
          id: 'remove-blemish',
          name: t('categories.photoEnhancement.effects.removeBlemish.name'),
          description: t('categories.photoEnhancement.effects.removeBlemish.description'),
          image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop',
          category: 'photo-enhancement'
        }
      ]
    }
  ];
};

// Keep original for backwards compatibility
export const CATEGORIES: Category[] = [
  {
    id: 'fashion',
    name: 'Fashion',
    emoji: '👕',
    effects: [
      {
        id: 'outfit-change',
        name: 'Outfit Change',
        description: 'Try on different outfits and styles virtually before buying.',
        image: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=400&h=600&fit=crop',
        category: 'fashion'
      },
      {
        id: 'hairstyle',
        name: 'Change Hairstyle',
        description: 'Experiment with new hairstyles before your next salon visit.',
        image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=600&fit=crop',
        category: 'fashion'
      },
      {
        id: 'hair-color',
        name: 'Hair Color',
        description: 'Try different hair colors to find your perfect match.',
        image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=400&h=600&fit=crop',
        category: 'fashion'
      },
      {
        id: 'makeup',
        name: 'Makeup',
        description: 'Apply virtual makeup looks to enhance your photos.',
        image: 'https://images.unsplash.com/photo-1596704017254-9b121068ac31?w=400&h=600&fit=crop',
        category: 'fashion'
      }
    ]
  },
  {
    id: 'beauty',
    name: 'Beauty',
    emoji: '✨',
    effects: [
      {
        id: 'skin-smooth',
        name: 'Smooth Skin',
        description: 'Enhance your skin with natural-looking smoothing.',
        image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=600&fit=crop',
        category: 'beauty'
      },
      {
        id: 'teeth-whitening',
        name: 'Teeth Whitening',
        description: 'Brighten your smile with natural teeth whitening.',
        image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=600&fit=crop',
        category: 'beauty'
      },
      {
        id: 'eye-enhancement',
        name: 'Eye Enhancement',
        description: 'Make your eyes pop with subtle enhancements.',
        image: 'https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=400&h=600&fit=crop',
        category: 'beauty'
      }
    ]
  },
  {
    id: 'creative',
    name: 'Creative',
    emoji: '🎨',
    effects: [
      {
        id: 'artistic-filter',
        name: 'Artistic Filter',
        description: 'Transform your photo into a work of art.',
        image: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=400&h=600&fit=crop',
        category: 'creative'
      },
      {
        id: 'background-change',
        name: 'Background Change',
        description: 'Replace your background with amazing scenes.',
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=600&fit=crop',
        category: 'creative'
      },
      {
        id: 'lighting',
        name: 'Lighting Effects',
        description: 'Adjust lighting to create the perfect mood.',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
        category: 'creative'
      }
    ]
  },
  {
    id: 'photo-enhancement',
    name: 'Photo Enhancement',
    emoji: '📸',
    effects: [
      {
        id: 'hd-quality',
        name: 'HD Quality',
        description: 'Enhance photo quality and sharpness.',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=600&fit=crop',
        category: 'photo-enhancement'
      },
      {
        id: 'color-correction',
        name: 'Color Correction',
        description: 'Perfect your photo colors automatically.',
        image: 'https://images.unsplash.com/photo-1513789181297-6f2ec112c0bc?w=400&h=600&fit=crop',
        category: 'photo-enhancement'
      },
      {
        id: 'remove-blemish',
        name: 'Remove Blemish',
        description: 'Remove unwanted spots and blemishes.',
        image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop',
        category: 'photo-enhancement'
      }
    ]
  }
];
