export default {
  common: {
    cancel: 'キャンセル',
    retry: '再試行',
    ok: 'OK',
    back: '戻る',
    delete: '削除',
    clear: 'クリア',
    clearAll: '全てクリア',
    generate: '生成',
    generating: '生成中...',
  },
  
  home: {
    title: 'Moovia',
    recentEdits: '最近の編集',
    viewAll: 'すべて表示',
    settingsTitle: '設定',
    currentPlan: '現在のプラン',
    free: '無料',
    close: '閉じる',
    language: '言語',
    selectLanguage: 'お好みの言語を選択',
    choosePhoto: '写真を選択',
    choosePhotoSubtitle: '写真の取得元を選択',
    gallery: 'ギャラリー',
    galleryDescription: '写真から選択',
    camera: 'カメラ',
    cameraDescription: '新しい写真を撮影',
    before: 'ビフォー',
    after: 'アフター',
    trending: 'トレンド',
  },
  
  categoryDetail: {
    appName: 'Moovia',
    tryIt: '試す',
    choosePhoto: '写真を選択',
  },
  
  edit: {
    tapToChangePhoto: 'タップして写真を変更',
    tapToSelect: 'タップして画像を選択',
    chooseOrTake: 'ギャラリーから選択または写真を撮影',
    descriptionPlaceholder: '編集したい内容を記述してください...',
    generate: '生成',
    generating: '生成中...',
    choosePhoto: '写真を選択',
    choosePhotoSubtitle: '写真の取得元を選択',
    gallery: 'ギャラリー',
    galleryDescription: '写真から選択',
    camera: 'カメラ',
    cameraDescription: '新しい写真を撮影',
    brandName: 'Moovia',
    creatingMagic: '魔法を作成中...',
    loadingMessages: {
      finalizing: '最終調整を完了中...',
      applying: '仕上げ中...',
      processing: '詳細を処理中...',
      almostReady: 'もうすぐ完成...',
      refining: '画像を洗練中...',
      lastAdjustments: '最後の調整中...',
      preparing: '結果を準備中...',
      polishing: '詳細を磨き中...',
    },
  },
  
  history: {
    title: '履歴',
    clear: 'クリア',
    emptyTitle: '履歴はまだありません',
    emptySubtitle: '生成された画像がここに表示されます',
    deleteConfirmTitle: '画像を削除',
    deleteConfirmMessage: 'この画像を履歴から削除してもよろしいですか？',
    clearConfirmTitle: '履歴をクリア',
    clearConfirmMessage: 'すべての履歴をクリアしてもよろしいですか？',
    today: '今日',
    yesterday: '昨日',
  },
  
  permissions: {
    libraryTitle: '権限が必要',
    libraryMessage: '申し訳ございませんが、ギャラリーの権限が必要です！',
    cameraTitle: '権限が必要',
    cameraMessage: '申し訳ございませんが、カメラの権限が必要です！',
    saveTitle: '権限が必要',
    saveMessage: 'フォトライブラリに画像を保存するための権限が必要です',
  },
  
  errors: {
    noImage: '画像なし',
    noImageMessage: 'まず画像を選択してください',
    noDescription: '説明なし',
    noDescriptionMessage: '編集したい内容を記述してください',
    pickImageFailed: '画像選択失敗',
    pickImageMessage: '画像の選択に失敗しました。もう一度お試しください。',
    takePhotoFailed: '写真撮影失敗',
    takePhotoMessage: '写真の撮影に失敗しました。カメラの権限を確認してもう一度お試しください。',
    downloadFailed: 'エラー',
    downloadMessage: '生成された画像のみダウンロードできます',
    saveFailed: 'エラー',
    saveImageMessage: 'ギャラリーへの画像保存に失敗しました。ストレージの権限を確認してもう一度お試しください。',
    generationFailed: '生成失敗',
    generationMessage: '画像生成中に問題が発生しました。インターネット接続を確認してもう一度お試しください。',
    timeout: 'タイムアウト',
    timeoutMessage: '画像生成に時間がかかりすぎました。接続が遅いか、リクエストが複雑な可能性があります。',
    network: 'ネットワークエラー',
    networkMessage: 'サーバーに接続できませんでした。インターネット接続を確認してもう一度お試しください。',
    unexpected: '予期しないエラーが発生しました。もう一度お試しください。',
  },
  
  success: {
    imageSaved: '成功！🎉',
    imageSavedMessage: 'フォトライブラリに画像を保存しました',
  },
  
  subscription: {
    upgradeToPro: 'PRO',
    restorePurchases: '購入を復元',
    error: 'エラー',
    errorMessage: 'サブスクリプションオプションを表示できませんでした。もう一度お試しください。',
    restoreSuccess: '成功！',
    restoreSuccessMessage: '購入が正常に復元されました。',
    restoreError: 'エラー',
    restoreErrorMessage: '購入を復元できませんでした。もう一度お試しいただくか、サポートにお問い合わせください。',
  },

  settings: {
    aiModel: 'AIモデル',
    selectAIModel: 'AIモデルを選択',
    selectAIModelSubtitle: '画像生成用のAIモデルを選択してください',
    modelChanged: 'モデルを変更しました',
    modelChangedMessage: '{{model}}を使用して画像を生成します',
    error: 'エラー',
    modelSaveError: 'モデル選択を保存できませんでした。もう一度お試しください。',
    speedFast: '高速',
    speedMedium: '中速',
    speedSlow: '低速',
    qualityHigh: '高品質',
    qualityMedium: '中品質',
    qualityLow: '低品質',
  },
  
  onboarding: {
    welcome: {
      title: 'テキストで何でも編集',
      button: '始める',
      footer: '続行することで、当社の',
      terms: '利用規約',
      and: 'および',
      privacy: 'プライバシーポリシー',
    },
    tutorial: {
      step1: {
        title: '画像を選択',
      },
      step2: {
        title: '編集内容を入力',
        description: '彼女をください',
      },
      step3: {
        title: '変化を見る',
      },
      next: '次へ',
      finish: '始める',
    },
  },
  
  categories: {
    fashion: {
      name: 'ファッション',
      emoji: '👕',
      effects: {
        outfitChange: {
          name: '服装変更',
          description: '購入前にさまざまな服装とスタイルを仮想試着。',
        },
        hairstyle: {
          name: 'ヘアスタイル変更',
          description: '次のサロン訪問前に新しいヘアスタイルを試してみましょう。',
        },
        hairColor: {
          name: 'ヘアカラー',
          description: 'さまざまな髪色を試して完璧な組み合わせを見つけましょう。',
        },
        makeup: {
          name: 'メイクアップ',
          description: '写真を美しくするために仮想メイクを適用。',
        },
      },
    },
    beauty: {
      name: '美容',
      emoji: '✨',
      effects: {
        skinSmooth: {
          name: '肌を滑らかに',
          description: '自然な見た目の滑らかさで肌を改善。',
        },
        teethWhitening: {
          name: '歯のホワイトニング',
          description: '自然なホワイトニングで笑顔を明るく。',
        },
        eyeEnhancement: {
          name: '目の強調',
          description: '微妙な改善で目を際立たせます。',
        },
      },
    },
    creative: {
      name: 'クリエイティブ',
      emoji: '🎨',
      effects: {
        artisticFilter: {
          name: 'アーティスティックフィルター',
          description: '写真を芸術作品に変換。',
        },
        backgroundChange: {
          name: '背景変更',
          description: '素晴らしいシーンで背景を置き換え。',
        },
        lighting: {
          name: '照明効果',
          description: '完璧な雰囲気を作るために照明を調整。',
        },
      },
    },
    photoEnhancement: {
      name: '写真強化',
      emoji: '📸',
      effects: {
        hdQuality: {
          name: 'HD品質',
          description: '写真の品質と鮮明さを向上。',
        },
        colorCorrection: {
          name: '色補正',
          description: '写真の色を自動的に完璧に。',
        },
        removeBlemish: {
          name: 'しみ除去',
          description: '不要な斑点やしみを除去。',
        },
      },
    },
  },
};

