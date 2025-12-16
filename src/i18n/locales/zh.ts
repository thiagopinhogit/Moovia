export default {
  common: {
    cancel: '取消',
    retry: '重试',
    ok: '确定',
    back: '返回',
    delete: '删除',
    clear: '清除',
    clearAll: '全部清除',
    generate: '生成',
    generating: '生成中...',
  },
  
  home: {
    title: 'Moovia',
    recentEdits: '最近编辑',
    viewAll: '查看全部',
    settingsTitle: '设置',
    currentPlan: '当前套餐',
    free: '免费',
    close: '关闭',
    language: '语言',
    selectLanguage: '选择您喜欢的语言',
    choosePhoto: '选择照片',
    choosePhotoSubtitle: '选择照片来源',
    gallery: '相册',
    galleryDescription: '从照片中选择',
    camera: '相机',
    cameraDescription: '拍摄新照片',
    before: '前',
    after: '后',
    trending: '热门趋势',
  },
  
  categoryDetail: {
    appName: 'Moovia',
    tryIt: '试一试',
    choosePhoto: '选择照片',
  },
  
  edit: {
    tapToChangePhoto: '点击更换照片',
    tapToSelect: '点击选择图片',
    chooseOrTake: '从相册选择或拍摄照片',
    descriptionPlaceholder: '描述您想要编辑的内容...',
    generate: '生成',
    generating: '生成中...',
    choosePhoto: '选择照片',
    choosePhotoSubtitle: '选择照片来源',
    gallery: '相册',
    galleryDescription: '从照片中选择',
    camera: '相机',
    cameraDescription: '拍摄新照片',
    brandName: 'Moovia',
    creatingMagic: '创造魔法中...',
    loadingMessages: {
      finalizing: '完成最后调整...',
      applying: '应用最后修饰...',
      processing: '处理细节中...',
      almostReady: '即将完成...',
      refining: '精炼图像中...',
      lastAdjustments: '最后调整中...',
      preparing: '准备结果中...',
      polishing: '润色细节中...',
    },
  },
  
  history: {
    title: '历史记录',
    clear: '清除',
    emptyTitle: '暂无历史记录',
    emptySubtitle: '生成的图片将显示在这里',
    deleteConfirmTitle: '删除图片',
    deleteConfirmMessage: '确定要从历史记录中删除这张图片吗？',
    clearConfirmTitle: '清除历史记录',
    clearConfirmMessage: '确定要清除所有历史记录吗？',
    today: '今天',
    yesterday: '昨天',
  },
  
  permissions: {
    libraryTitle: '需要权限',
    libraryMessage: '抱歉，我们需要相册权限才能正常运行！',
    cameraTitle: '需要权限',
    cameraMessage: '抱歉，我们需要相机权限才能拍照！',
    saveTitle: '需要权限',
    saveMessage: '我们需要权限将图片保存到您的照片库',
  },
  
  errors: {
    noImage: '无图片',
    noImageMessage: '请先选择一张图片',
    noDescription: '无描述',
    noDescriptionMessage: '请描述您想要编辑的内容',
    pickImageFailed: '选择图片失败',
    pickImageMessage: '选择图片失败。请重试。',
    takePhotoFailed: '拍照失败',
    takePhotoMessage: '拍照失败。请检查相机权限后重试。',
    downloadFailed: '错误',
    downloadMessage: '只能下载生成的图片',
    saveFailed: '错误',
    saveImageMessage: '保存图片到相册失败。请检查存储权限后重试。',
    generationFailed: '生成失败',
    generationMessage: '图片生成过程中出现问题。请检查网络连接后重试。',
    timeout: '请求超时',
    timeoutMessage: '图片生成时间过长。这可能是由于网络连接缓慢或请求过于复杂。',
    network: '网络错误',
    networkMessage: '无法连接到服务器。请检查网络连接后重试。',
    unexpected: '发生意外错误。请重试。',
  },
  
  success: {
    imageSaved: '成功！🎉',
    imageSavedMessage: '图片已保存到照片库',
  },
  
  subscription: {
    upgradeToPro: 'PRO',
    restorePurchases: '恢复购买',
    error: '错误',
    errorMessage: '无法显示订阅选项。请重试。',
    restoreSuccess: '成功！',
    restoreSuccessMessage: '您的购买已成功恢复。',
    restoreError: '错误',
    restoreErrorMessage: '无法恢复购买。请重试或联系支持。',
  },

  settings: {
    aiModel: 'AI模型',
    selectAIModel: '选择AI模型',
    selectAIModelSubtitle: '选择用于图像生成的AI模型',
    modelChanged: '模型已更改',
    modelChangedMessage: '现在使用{{model}}进行图像生成',
    error: '错误',
    modelSaveError: '无法保存模型选择。请重试。',
    speedFast: '快速',
    speedMedium: '中等',
    speedSlow: '慢速',
    qualityHigh: '高质量',
    qualityMedium: '中等质量',
    qualityLow: '低质量',
  },
  
  onboarding: {
    welcome: {
      title: '用AI创建精彩视频',
      button: '开始',
      footer: '继续即表示您接受我们的',
      terms: '服务条款',
      and: '和',
      privacy: '隐私政策',
    },
    tutorial: {
      step1: {
        title: '从图片开始',
      },
      step2: {
        title: '描述您的愿景',
        description: '女孩跑向电视，进入使命召唤游戏',
      },
      step3: {
        title: '观看您的视频',
      },
      next: '下一步',
      finish: '开始',
    },
  },
  
  categories: {
    fashion: {
      name: '时尚',
      emoji: '👕',
      effects: {
        outfitChange: {
          name: '更换服装',
          description: '购买前虚拟试穿不同服装和风格。',
        },
        hairstyle: {
          name: '更换发型',
          description: '在下次去美发沙龙前尝试新发型。',
        },
        hairColor: {
          name: '发色',
          description: '尝试不同发色，找到完美搭配。',
        },
        makeup: {
          name: '化妆',
          description: '应用虚拟化妆造型来美化照片。',
        },
      },
    },
    beauty: {
      name: '美颜',
      emoji: '✨',
      effects: {
        skinSmooth: {
          name: '光滑肌肤',
          description: '用自然的平滑效果改善肌肤。',
        },
        teethWhitening: {
          name: '牙齿美白',
          description: '用自然美白效果照亮笑容。',
        },
        eyeEnhancement: {
          name: '眼部美化',
          description: '用细微改善让眼睛更有神。',
        },
      },
    },
    creative: {
      name: '创意',
      emoji: '🎨',
      effects: {
        artisticFilter: {
          name: '艺术滤镜',
          description: '将照片转变为艺术作品。',
        },
        backgroundChange: {
          name: '更换背景',
          description: '用精彩场景替换背景。',
        },
        lighting: {
          name: '光照效果',
          description: '调整光照创造完美氛围。',
        },
      },
    },
    photoEnhancement: {
      name: '照片增强',
      emoji: '📸',
      effects: {
        hdQuality: {
          name: '高清画质',
          description: '增强照片质量和清晰度。',
        },
        colorCorrection: {
          name: '色彩校正',
          description: '自动完善照片色彩。',
        },
        removeBlemish: {
          name: '移除瑕疵',
          description: '移除不需要的斑点和瑕疵。',
        },
      },
    },
  },
};

