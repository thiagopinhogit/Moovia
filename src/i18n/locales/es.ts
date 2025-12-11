export default {
  common: {
    cancel: 'Cancelar',
    retry: 'Reintentar',
    ok: 'OK',
    back: 'Atrás',
    delete: 'Eliminar',
    clear: 'Limpiar',
    clearAll: 'Limpiar Todo',
    generate: 'Generar',
    generating: 'Generando...',
  },
  
  home: {
    title: 'Moovia',
    recentEdits: 'Últimas ediciones',
    viewAll: 'Ver todas',
    settingsTitle: 'Configuración',
    currentPlan: 'Plan actual',
    free: 'Gratis',
    close: 'Cerrar',
    language: 'Idioma',
    selectLanguage: 'Elige tu idioma preferido',
    choosePhoto: 'Elegir Foto',
    choosePhotoSubtitle: 'Selecciona de dónde obtener tu foto',
    gallery: 'Galería',
    galleryDescription: 'Elegir de tus fotos',
    camera: 'Cámara',
    cameraDescription: 'Tomar una nueva foto',
    before: 'Antes',
    after: 'Después',
    trending: 'Tendencias Ahora',
  },
  
  categoryDetail: {
    appName: 'Moovia',
    tryIt: 'Probar',
    choosePhoto: 'Elegir Foto',
  },
  
  edit: {
    tapToChangePhoto: 'Toca para cambiar foto',
    tapToSelect: 'Toca para seleccionar imagen',
    chooseOrTake: 'Elige de la galería o toma una foto',
    descriptionPlaceholder: 'Describe lo que quieres editar...',
    generate: 'Generar',
    generating: 'Generando...',
    choosePhoto: 'Elegir Foto',
    choosePhotoSubtitle: 'Selecciona de dónde obtener tu foto',
    gallery: 'Galería',
    galleryDescription: 'Elegir de tus fotos',
    camera: 'Cámara',
    cameraDescription: 'Tomar una nueva foto',
    brandName: 'Moovia',
    creatingMagic: 'Creando magia...',
    loadingMessages: {
      finalizing: 'Finalizando ajustes finales...',
      applying: 'Aplicando toques finales...',
      processing: 'Procesando detalles...',
      almostReady: 'Casi listo...',
      refining: 'Refinando imagen...',
      lastAdjustments: 'Últimos ajustes...',
      preparing: 'Preparando resultado...',
      polishing: 'Puliendo detalles...',
    },
  },
  
  history: {
    title: 'Historial',
    clear: 'Limpiar',
    emptyTitle: 'Sin historial aún',
    emptySubtitle: 'Las imágenes generadas aparecerán aquí',
    deleteConfirmTitle: 'Eliminar Imagen',
    deleteConfirmMessage: '¿Estás seguro de que quieres eliminar esta imagen del historial?',
    clearConfirmTitle: 'Limpiar Historial',
    clearConfirmMessage: '¿Estás seguro de que quieres limpiar todo el historial?',
    today: 'Hoy',
    yesterday: 'Ayer',
  },
  
  permissions: {
    libraryTitle: 'Permiso Requerido',
    libraryMessage: 'Lo sentimos, necesitamos permisos de la galería para funcionar!',
    cameraTitle: 'Permiso Requerido',
    cameraMessage: 'Lo sentimos, necesitamos permisos de cámara para tomar fotos!',
    saveTitle: 'Permiso Requerido',
    saveMessage: 'Necesitamos permiso para guardar imágenes en tu biblioteca de fotos',
  },
  
  errors: {
    noImage: 'Sin Imagen',
    noImageMessage: 'Por favor, selecciona una imagen primero',
    noDescription: 'Sin Descripción',
    noDescriptionMessage: 'Por favor, describe lo que quieres editar',
    pickImageFailed: 'Error al seleccionar imagen',
    pickImageMessage: 'Error al seleccionar imagen. Por favor, inténtalo de nuevo.',
    takePhotoFailed: 'Error al tomar foto',
    takePhotoMessage: 'Error al tomar foto. Verifica los permisos de cámara e inténtalo de nuevo.',
    downloadFailed: 'Error',
    downloadMessage: 'Solo las imágenes generadas pueden ser descargadas',
    saveFailed: 'Error',
    saveImageMessage: 'Error al guardar imagen en la galería. Verifica los permisos de almacenamiento e inténtalo de nuevo.',
    generationFailed: 'Generación Fallida',
    generationMessage: 'Algo salió mal durante la generación de imagen. Verifica tu conexión a internet e inténtalo de nuevo.',
    timeout: 'Tiempo Agotado',
    timeoutMessage: 'La generación de imagen tardó demasiado. Esto puede deberse a una conexión lenta o solicitud compleja.',
    network: 'Error de Red',
    networkMessage: 'No se pudo conectar al servidor. Verifica tu conexión a internet e inténtalo de nuevo.',
    unexpected: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.',
  },
  
  success: {
    imageSaved: '¡Éxito! 🎉',
    imageSavedMessage: 'Imagen guardada en tu biblioteca de fotos',
  },
  
  subscription: {
    upgradeToPro: 'PRO',
    restorePurchases: 'Restaurar Compras',
    error: 'Error',
    errorMessage: 'Error al mostrar opciones de suscripción. Inténtalo de nuevo.',
    restoreSuccess: '¡Éxito!',
    restoreSuccessMessage: 'Tus compras han sido restauradas correctamente.',
    restoreError: 'Error',
    restoreErrorMessage: 'Error al restaurar compras. Inténtalo de nuevo o contacta con soporte.',
  },

  settings: {
    aiModel: 'Modelo de IA',
    selectAIModel: 'Seleccionar Modelo de IA',
    selectAIModelSubtitle: 'Elige el modelo de IA para generación de imágenes',
    modelChanged: 'Modelo Cambiado',
    modelChangedMessage: 'Ahora usando {{model}} para generación de imágenes',
    error: 'Error',
    modelSaveError: 'Error al guardar selección del modelo. Inténtalo de nuevo.',
    speedFast: 'Rápido',
    speedMedium: 'Medio',
    speedSlow: 'Lento',
    qualityHigh: 'Alta Calidad',
    qualityMedium: 'Calidad Media',
    qualityLow: 'Baja Calidad',
  },
  
  onboarding: {
    welcome: {
      title: 'Edita cualquier cosa con texto',
      button: 'Comenzar',
      footer: 'Al continuar, estás aceptando nuestros',
      terms: 'Términos de Servicio',
      and: 'y',
      privacy: 'Política de Privacidad',
    },
    tutorial: {
      step1: {
        title: 'Elige Tu Imagen',
      },
      step2: {
        title: 'Ingresa Tu Edición',
        description: 'Dame un novio',
      },
      step3: {
        title: 'Mira Cómo Se Transforma',
      },
      next: 'Siguiente',
      finish: 'Comenzar',
    },
  },
  
  categories: {
    fashion: {
      name: 'Moda',
      emoji: '👕',
      effects: {
        outfitChange: {
          name: 'Cambiar Outfit',
          description: 'Prueba diferentes outfits y estilos virtualmente antes de comprar.',
        },
        hairstyle: {
          name: 'Cambiar Peinado',
          description: 'Experimenta con nuevos peinados antes de tu próxima visita al salón.',
        },
        hairColor: {
          name: 'Color de Cabello',
          description: 'Prueba diferentes colores de cabello para encontrar tu combinación perfecta.',
        },
        makeup: {
          name: 'Maquillaje',
          description: 'Aplica looks de maquillaje virtual para mejorar tus fotos.',
        },
      },
    },
    beauty: {
      name: 'Belleza',
      emoji: '✨',
      effects: {
        skinSmooth: {
          name: 'Piel Suave',
          description: 'Mejora tu piel con suavizado de aspecto natural.',
        },
        teethWhitening: {
          name: 'Blanqueamiento Dental',
          description: 'Ilumina tu sonrisa con blanqueamiento dental natural.',
        },
        eyeEnhancement: {
          name: 'Realce de Ojos',
          description: 'Haz que tus ojos destaquen con mejoras sutiles.',
        },
      },
    },
    creative: {
      name: 'Creativo',
      emoji: '🎨',
      effects: {
        artisticFilter: {
          name: 'Filtro Artístico',
          description: 'Transforma tu foto en una obra de arte.',
        },
        backgroundChange: {
          name: 'Cambiar Fondo',
          description: 'Reemplaza tu fondo con escenas increíbles.',
        },
        lighting: {
          name: 'Efectos de Iluminación',
          description: 'Ajusta la iluminación para crear el ambiente perfecto.',
        },
      },
    },
    photoEnhancement: {
      name: 'Mejora de Foto',
      emoji: '📸',
      effects: {
        hdQuality: {
          name: 'Calidad HD',
          description: 'Mejora la calidad y nitidez de la foto.',
        },
        colorCorrection: {
          name: 'Corrección de Color',
          description: 'Perfecciona los colores de tu foto automáticamente.',
        },
        removeBlemish: {
          name: 'Eliminar Imperfecciones',
          description: 'Elimina manchas e imperfecciones no deseadas.',
        },
      },
    },
  },
};

