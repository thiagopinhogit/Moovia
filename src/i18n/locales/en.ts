export default {
  common: {
    cancel: 'Cancel',
    retry: 'Retry',
    ok: 'OK',
    back: 'Back',
    delete: 'Delete',
    clear: 'Clear',
    clearAll: 'Clear All',
    generate: 'Generate',
    generating: 'Generating...',
  },
  
  home: {
    title: 'Moovia',
    recentEdits: 'Recent edits',
    viewAll: 'View all',
    settingsTitle: 'Settings',
    currentPlan: 'Current plan',
    free: 'Free',
    close: 'Close',
    language: 'Language',
    selectLanguage: 'Choose your preferred language',
    choosePhoto: 'Choose Photo',
    choosePhotoSubtitle: 'Select where to get your photo from',
    gallery: 'Gallery',
    galleryDescription: 'Choose from your photos',
    camera: 'Camera',
    cameraDescription: 'Take a new photo',
    before: 'Before',
    after: 'After',
    trending: 'Trending Now',
  },
  
  categoryDetail: {
    appName: 'Moovia',
    tryIt: 'Try it',
    choosePhoto: 'Choose Photo',
  },
  
  edit: {
    tapToChangePhoto: 'Tap to change photo',
    tapToSelect: 'Tap to select image',
    chooseOrTake: 'Choose from gallery or take a photo',
    descriptionPlaceholder: 'Describe what you want to edit...',
    generate: 'Generate',
    generating: 'Generating...',
    choosePhoto: 'Choose Photo',
    choosePhotoSubtitle: 'Select where to get your photo from',
    gallery: 'Gallery',
    galleryDescription: 'Choose from your photos',
    camera: 'Camera',
    cameraDescription: 'Take a new photo',
    brandName: 'Moovia',
    creatingMagic: 'Creating magic...',
    loadingMessages: {
      finalizing: 'Finalizing final adjustments...',
      applying: 'Applying final touches...',
      processing: 'Processing details...',
      almostReady: 'Almost ready...',
      refining: 'Refining image...',
      lastAdjustments: 'Last adjustments...',
      preparing: 'Preparing result...',
      polishing: 'Polishing details...',
    },
  },
  
  history: {
    title: 'History',
    clear: 'Clear',
    emptyTitle: 'No history yet',
    emptySubtitle: 'Generated images will appear here',
    deleteConfirmTitle: 'Delete Image',
    deleteConfirmMessage: 'Are you sure you want to delete this image from history?',
    clearConfirmTitle: 'Clear History',
    clearConfirmMessage: 'Are you sure you want to clear all history?',
    today: 'Today',
    yesterday: 'Yesterday',
  },
  
  permissions: {
    libraryTitle: 'Permission Required',
    libraryMessage: 'Sorry, we need camera roll permissions to make this work!',
    cameraTitle: 'Permission Required',
    cameraMessage: 'Sorry, we need camera permissions to take photos!',
    saveTitle: 'Permission Required',
    saveMessage: 'We need permission to save images to your photo library',
  },
  
  errors: {
    noImage: 'No Image',
    noImageMessage: 'Please select an image first',
    noDescription: 'No Description',
    noDescriptionMessage: 'Please describe what you want to edit',
    pickImageFailed: 'Failed to pick image',
    pickImageMessage: 'Failed to pick image. Please try again.',
    takePhotoFailed: 'Failed to take photo',
    takePhotoMessage: 'Failed to take photo. Please check camera permissions and try again.',
    downloadFailed: 'Error',
    downloadMessage: 'Only generated images can be downloaded',
    saveFailed: 'Error',
    saveImageMessage: 'Failed to save image to gallery. Please check storage permissions and try again.',
    generationFailed: 'Generation Failed',
    generationMessage: 'Something went wrong during image generation. Please check your internet connection and try again.',
    timeout: 'Request Timeout',
    timeoutMessage: 'The image generation took too long. This might be due to a slow connection or a complex request.',
    network: 'Network Error',
    networkMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
    unexpected: 'An unexpected error occurred. Please try again.',
  },
  
  success: {
    imageSaved: 'Success! 🎉',
    imageSavedMessage: 'Image saved to your photo library',
  },
  
  subscription: {
    upgradeToPro: 'PRO',
    restorePurchases: 'Restore Purchases',
    error: 'Error',
    errorMessage: 'Failed to show subscription options. Please try again.',
    restoreSuccess: 'Success!',
    restoreSuccessMessage: 'Your purchases have been restored successfully.',
    restoreError: 'Error',
    restoreErrorMessage: 'Failed to restore purchases. Please try again or contact support.',
  },

  settings: {
    aiModel: 'AI Model',
    selectAIModel: 'Select AI Model',
    selectAIModelSubtitle: 'Choose the AI model for image generation',
    modelChanged: 'Model Changed',
    modelChangedMessage: 'Now using {{model}} for image generation',
    error: 'Error',
    modelSaveError: 'Failed to save model selection. Please try again.',
    speedFast: 'Fast',
    speedMedium: 'Medium',
    speedSlow: 'Slow',
    qualityHigh: 'High Quality',
    qualityMedium: 'Medium Quality',
    qualityLow: 'Low Quality',
  },
  
  onboarding: {
    welcome: {
      title: 'Create amazing videos with AI',
      button: 'Get started',
      footer: 'By continuing, you\'re accepting our',
      terms: 'Terms of Service',
      and: 'and',
      privacy: 'Privacy Policy',
    },
    tutorial: {
      step1: {
        title: 'Start with an Image',
      },
      step2: {
        title: 'Describe Your Vision',
        description: 'Girl runs into TV, enters Call of Duty game',
      },
      step3: {
        title: 'Watch Your Video',
      },
      next: 'Next',
      finish: 'Get Started',
    },
  },
  
  categories: {
    fashion: {
      name: 'Fashion',
      emoji: '👕',
      effects: {
        outfitChange: {
          name: 'Outfit Change',
          description: 'Try on different outfits and styles virtually before buying.',
        },
        hairstyle: {
          name: 'Change Hairstyle',
          description: 'Experiment with new hairstyles before your next salon visit.',
        },
        hairColor: {
          name: 'Hair Color',
          description: 'Try different hair colors to find your perfect match.',
        },
        makeup: {
          name: 'Makeup',
          description: 'Apply virtual makeup looks to enhance your photos.',
        },
      },
    },
    beauty: {
      name: 'Beauty',
      emoji: '✨',
      effects: {
        skinSmooth: {
          name: 'Smooth Skin',
          description: 'Enhance your skin with natural-looking smoothing.',
        },
        teethWhitening: {
          name: 'Teeth Whitening',
          description: 'Brighten your smile with natural teeth whitening.',
        },
        eyeEnhancement: {
          name: 'Eye Enhancement',
          description: 'Make your eyes pop with subtle enhancements.',
        },
      },
    },
    creative: {
      name: 'Creative',
      emoji: '🎨',
      effects: {
        artisticFilter: {
          name: 'Artistic Filter',
          description: 'Transform your photo into a work of art.',
        },
        backgroundChange: {
          name: 'Background Change',
          description: 'Replace your background with amazing scenes.',
        },
        lighting: {
          name: 'Lighting Effects',
          description: 'Adjust lighting to create the perfect mood.',
        },
      },
    },
    photoEnhancement: {
      name: 'Photo Enhancement',
      emoji: '📸',
      effects: {
        hdQuality: {
          name: 'HD Quality',
          description: 'Enhance photo quality and sharpness.',
        },
        colorCorrection: {
          name: 'Color Correction',
          description: 'Perfect your photo colors automatically.',
        },
        removeBlemish: {
          name: 'Remove Blemish',
          description: 'Remove unwanted spots and blemishes.',
        },
      },
    },
  },
};

