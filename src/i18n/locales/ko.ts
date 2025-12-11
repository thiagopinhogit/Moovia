export default {
  common: {
    cancel: '취소',
    retry: '다시 시도',
    ok: '확인',
    back: '뒤로',
    delete: '삭제',
    clear: '지우기',
    clearAll: '모두 지우기',
    generate: '생성',
    generating: '생성 중...',
  },
  
  home: {
    title: 'Moovia',
    recentEdits: '최근 편집',
    viewAll: '모두 보기',
    settingsTitle: '설정',
    currentPlan: '현재 플랜',
    free: '무료',
    close: '닫기',
    language: '언어',
    selectLanguage: '선호하는 언어를 선택하세요',
    choosePhoto: '사진 선택',
    choosePhotoSubtitle: '사진을 가져올 위치를 선택하세요',
    gallery: '갤러리',
    galleryDescription: '사진에서 선택',
    camera: '카메라',
    cameraDescription: '새 사진 촬영',
    before: '전',
    after: '후',
    trending: '인기 트렌드',
  },
  
  categoryDetail: {
    appName: 'Moovia',
    tryIt: '시도해보기',
    choosePhoto: '사진 선택',
  },
  
  edit: {
    tapToChangePhoto: '탭하여 사진 변경',
    tapToSelect: '탭하여 이미지 선택',
    chooseOrTake: '갤러리에서 선택하거나 사진 촬영',
    descriptionPlaceholder: '편집하고 싶은 내용을 설명하세요...',
    generate: '생성',
    generating: '생성 중...',
    choosePhoto: '사진 선택',
    choosePhotoSubtitle: '사진을 가져올 위치를 선택하세요',
    gallery: '갤러리',
    galleryDescription: '사진에서 선택',
    camera: '카메라',
    cameraDescription: '새 사진 촬영',
    brandName: 'Moovia',
    creatingMagic: '마법 만드는 중...',
    loadingMessages: {
      finalizing: '최종 조정 중...',
      applying: '마지막 터치 적용 중...',
      processing: '세부 사항 처리 중...',
      almostReady: '거의 완료...',
      refining: '이미지 개선 중...',
      lastAdjustments: '마지막 조정 중...',
      preparing: '결과 준비 중...',
      polishing: '세부 사항 다듬는 중...',
    },
  },
  
  history: {
    title: '기록',
    clear: '지우기',
    emptyTitle: '아직 기록이 없습니다',
    emptySubtitle: '생성된 이미지가 여기에 표시됩니다',
    deleteConfirmTitle: '이미지 삭제',
    deleteConfirmMessage: '기록에서 이 이미지를 삭제하시겠습니까?',
    clearConfirmTitle: '기록 지우기',
    clearConfirmMessage: '모든 기록을 지우시겠습니까?',
    today: '오늘',
    yesterday: '어제',
  },
  
  permissions: {
    libraryTitle: '권한 필요',
    libraryMessage: '죄송합니다. 갤러리 권한이 필요합니다!',
    cameraTitle: '권한 필요',
    cameraMessage: '죄송합니다. 카메라 권한이 필요합니다!',
    saveTitle: '권한 필요',
    saveMessage: '사진 라이브러리에 이미지를 저장하려면 권한이 필요합니다',
  },
  
  errors: {
    noImage: '이미지 없음',
    noImageMessage: '먼저 이미지를 선택하세요',
    noDescription: '설명 없음',
    noDescriptionMessage: '편집하고 싶은 내용을 설명하세요',
    pickImageFailed: '이미지 선택 실패',
    pickImageMessage: '이미지 선택에 실패했습니다. 다시 시도하세요.',
    takePhotoFailed: '사진 촬영 실패',
    takePhotoMessage: '사진 촬영에 실패했습니다. 카메라 권한을 확인하고 다시 시도하세요.',
    downloadFailed: '오류',
    downloadMessage: '생성된 이미지만 다운로드할 수 있습니다',
    saveFailed: '오류',
    saveImageMessage: '갤러리에 이미지를 저장하지 못했습니다. 저장소 권한을 확인하고 다시 시도하세요.',
    generationFailed: '생성 실패',
    generationMessage: '이미지 생성 중 문제가 발생했습니다. 인터넷 연결을 확인하고 다시 시도하세요.',
    timeout: '시간 초과',
    timeoutMessage: '이미지 생성에 너무 오래 걸렸습니다. 느린 연결이나 복잡한 요청 때문일 수 있습니다.',
    network: '네트워크 오류',
    networkMessage: '서버에 연결할 수 없습니다. 인터넷 연결을 확인하고 다시 시도하세요.',
    unexpected: '예기치 않은 오류가 발생했습니다. 다시 시도하세요.',
  },
  
  success: {
    imageSaved: '성공! 🎉',
    imageSavedMessage: '사진 라이브러리에 이미지가 저장되었습니다',
  },
  
  subscription: {
    upgradeToPro: 'PRO',
    restorePurchases: '구매 복원',
    error: '오류',
    errorMessage: '구독 옵션을 표시하지 못했습니다. 다시 시도하세요.',
    restoreSuccess: '성공!',
    restoreSuccessMessage: '구매가 성공적으로 복원되었습니다.',
    restoreError: '오류',
    restoreErrorMessage: '구매를 복원하지 못했습니다. 다시 시도하거나 지원팀에 문의하세요.',
  },

  settings: {
    aiModel: 'AI 모델',
    selectAIModel: 'AI 모델 선택',
    selectAIModelSubtitle: '이미지 생성을 위한 AI 모델을 선택하세요',
    modelChanged: '모델 변경됨',
    modelChangedMessage: '이제 {{model}}를 사용하여 이미지를 생성합니다',
    error: '오류',
    modelSaveError: '모델 선택을 저장하지 못했습니다. 다시 시도하세요.',
    speedFast: '빠름',
    speedMedium: '보통',
    speedSlow: '느림',
    qualityHigh: '고품질',
    qualityMedium: '중품질',
    qualityLow: '저품질',
  },
  
  onboarding: {
    welcome: {
      title: '텍스트로 무엇이든 편집',
      button: '시작하기',
      footer: '계속하면 당사의',
      terms: '서비스 약관',
      and: '및',
      privacy: '개인정보 보호정책',
    },
    tutorial: {
      step1: {
        title: '이미지 선택',
      },
      step2: {
        title: '편집 내용 입력',
        description: '여자친구를 주세요',
      },
      step3: {
        title: '변환 보기',
      },
      next: '다음',
      finish: '시작하기',
    },
  },
  
  categories: {
    fashion: {
      name: '패션',
      emoji: '👕',
      effects: {
        outfitChange: {
          name: '의상 변경',
          description: '구매 전에 다양한 의상과 스타일을 가상으로 시도해보세요.',
        },
        hairstyle: {
          name: '헤어스타일 변경',
          description: '다음 미용실 방문 전에 새로운 헤어스타일을 실험해보세요.',
        },
        hairColor: {
          name: '머리 색상',
          description: '다양한 머리 색상을 시도하여 완벽한 조합을 찾으세요.',
        },
        makeup: {
          name: '메이크업',
          description: '사진을 향상시키기 위해 가상 메이크업 룩을 적용하세요.',
        },
      },
    },
    beauty: {
      name: '뷰티',
      emoji: '✨',
      effects: {
        skinSmooth: {
          name: '부드러운 피부',
          description: '자연스러운 매끄러움으로 피부를 개선하세요.',
        },
        teethWhitening: {
          name: '치아 미백',
          description: '자연스러운 치아 미백으로 미소를 밝게 하세요.',
        },
        eyeEnhancement: {
          name: '눈 강조',
          description: '미묘한 개선으로 눈을 돋보이게 하세요.',
        },
      },
    },
    creative: {
      name: '크리에이티브',
      emoji: '🎨',
      effects: {
        artisticFilter: {
          name: '예술적 필터',
          description: '사진을 예술 작품으로 변환하세요.',
        },
        backgroundChange: {
          name: '배경 변경',
          description: '놀라운 장면으로 배경을 교체하세요.',
        },
        lighting: {
          name: '조명 효과',
          description: '완벽한 분위기를 만들기 위해 조명을 조정하세요.',
        },
      },
    },
    photoEnhancement: {
      name: '사진 향상',
      emoji: '📸',
      effects: {
        hdQuality: {
          name: 'HD 화질',
          description: '사진 품질과 선명도를 향상시키세요.',
        },
        colorCorrection: {
          name: '색상 보정',
          description: '사진 색상을 자동으로 완벽하게 만드세요.',
        },
        removeBlemish: {
          name: '잡티 제거',
          description: '원하지 않는 반점과 잡티를 제거하세요.',
        },
      },
    },
  },
};

