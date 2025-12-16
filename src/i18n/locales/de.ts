export default {
  common: {
    cancel: 'Abbrechen',
    retry: 'Wiederholen',
    ok: 'OK',
    back: 'Zurück',
    delete: 'Löschen',
    clear: 'Löschen',
    clearAll: 'Alles Löschen',
    generate: 'Generieren',
    generating: 'Generierung...',
  },
  
  home: {
    title: 'Moovia',
    recentEdits: 'Letzte Bearbeitungen',
    viewAll: 'Alle anzeigen',
    settingsTitle: 'Einstellungen',
    currentPlan: 'Aktueller Plan',
    free: 'Gratis',
    close: 'Schließen',
    language: 'Sprache',
    selectLanguage: 'Wählen Sie Ihre bevorzugte Sprache',
    choosePhoto: 'Foto Wählen',
    choosePhotoSubtitle: 'Wählen Sie aus, woher Sie Ihr Foto bekommen möchten',
    gallery: 'Galerie',
    galleryDescription: 'Aus Ihren Fotos wählen',
    camera: 'Kamera',
    cameraDescription: 'Neues Foto aufnehmen',
    before: 'Vorher',
    after: 'Nachher',
    trending: 'Aktuell Beliebt',
  },
  
  categoryDetail: {
    appName: 'Moovia',
    tryIt: 'Ausprobieren',
    choosePhoto: 'Foto Wählen',
  },
  
  edit: {
    tapToChangePhoto: 'Tippen zum Foto wechseln',
    tapToSelect: 'Tippen zum Bild auswählen',
    chooseOrTake: 'Aus Galerie wählen oder Foto aufnehmen',
    descriptionPlaceholder: 'Beschreiben Sie, was Sie bearbeiten möchten...',
    generate: 'Generieren',
    generating: 'Generierung...',
    choosePhoto: 'Foto Wählen',
    choosePhotoSubtitle: 'Wählen Sie aus, woher Sie Ihr Foto bekommen möchten',
    gallery: 'Galerie',
    galleryDescription: 'Aus Ihren Fotos wählen',
    camera: 'Kamera',
    cameraDescription: 'Neues Foto aufnehmen',
    brandName: 'Moovia',
    creatingMagic: 'Magie erschaffen...',
    loadingMessages: {
      finalizing: 'Abschlussanpassungen...',
      applying: 'Letzte Feinheiten...',
      processing: 'Details verarbeiten...',
      almostReady: 'Fast fertig...',
      refining: 'Bild verfeinern...',
      lastAdjustments: 'Letzte Anpassungen...',
      preparing: 'Ergebnis vorbereiten...',
      polishing: 'Details polieren...',
    },
  },
  
  history: {
    title: 'Verlauf',
    clear: 'Löschen',
    emptyTitle: 'Noch kein Verlauf',
    emptySubtitle: 'Generierte Bilder erscheinen hier',
    deleteConfirmTitle: 'Bild Löschen',
    deleteConfirmMessage: 'Sind Sie sicher, dass Sie dieses Bild aus dem Verlauf löschen möchten?',
    clearConfirmTitle: 'Verlauf Löschen',
    clearConfirmMessage: 'Sind Sie sicher, dass Sie den gesamten Verlauf löschen möchten?',
    today: 'Heute',
    yesterday: 'Gestern',
  },
  
  permissions: {
    libraryTitle: 'Berechtigung Erforderlich',
    libraryMessage: 'Entschuldigung, wir benötigen Galerie-Berechtigungen zum Funktionieren!',
    cameraTitle: 'Berechtigung Erforderlich',
    cameraMessage: 'Entschuldigung, wir benötigen Kamera-Berechtigungen zum Fotos aufnehmen!',
    saveTitle: 'Berechtigung Erforderlich',
    saveMessage: 'Wir benötigen die Berechtigung, Bilder in Ihrer Fotobibliothek zu speichern',
  },
  
  errors: {
    noImage: 'Kein Bild',
    noImageMessage: 'Bitte wählen Sie zuerst ein Bild aus',
    noDescription: 'Keine Beschreibung',
    noDescriptionMessage: 'Bitte beschreiben Sie, was Sie bearbeiten möchten',
    pickImageFailed: 'Bildauswahl fehlgeschlagen',
    pickImageMessage: 'Bildauswahl fehlgeschlagen. Bitte versuchen Sie es erneut.',
    takePhotoFailed: 'Foto aufnehmen fehlgeschlagen',
    takePhotoMessage: 'Foto aufnehmen fehlgeschlagen. Überprüfen Sie die Kamera-Berechtigungen und versuchen Sie es erneut.',
    downloadFailed: 'Fehler',
    downloadMessage: 'Nur generierte Bilder können heruntergeladen werden',
    saveFailed: 'Fehler',
    saveImageMessage: 'Bild konnte nicht in Galerie gespeichert werden. Überprüfen Sie die Speicherberechtigungen und versuchen Sie es erneut.',
    generationFailed: 'Generierung Fehlgeschlagen',
    generationMessage: 'Bei der Bildgenerierung ist ein Fehler aufgetreten. Überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.',
    timeout: 'Zeitüberschreitung',
    timeoutMessage: 'Die Bildgenerierung hat zu lange gedauert. Dies kann an einer langsamen Verbindung oder komplexen Anfrage liegen.',
    network: 'Netzwerkfehler',
    networkMessage: 'Verbindung zum Server nicht möglich. Überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.',
    unexpected: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
  },
  
  success: {
    imageSaved: 'Erfolg! 🎉',
    imageSavedMessage: 'Bild in Ihrer Fotobibliothek gespeichert',
  },
  
  subscription: {
    upgradeToPro: 'PRO',
    restorePurchases: 'Käufe Wiederherstellen',
    error: 'Fehler',
    errorMessage: 'Abonnementoptionen konnten nicht angezeigt werden. Bitte versuchen Sie es erneut.',
    restoreSuccess: 'Erfolg!',
    restoreSuccessMessage: 'Ihre Käufe wurden erfolgreich wiederhergestellt.',
    restoreError: 'Fehler',
    restoreErrorMessage: 'Käufe konnten nicht wiederhergestellt werden. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.',
  },

  settings: {
    aiModel: 'KI-Modell',
    selectAIModel: 'KI-Modell Auswählen',
    selectAIModelSubtitle: 'Wählen Sie das KI-Modell für die Bildgenerierung',
    modelChanged: 'Modell Geändert',
    modelChangedMessage: 'Verwende jetzt {{model}} für die Bildgenerierung',
    error: 'Fehler',
    modelSaveError: 'Modellauswahl konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.',
    speedFast: 'Schnell',
    speedMedium: 'Mittel',
    speedSlow: 'Langsam',
    qualityHigh: 'Hohe Qualität',
    qualityMedium: 'Mittlere Qualität',
    qualityLow: 'Niedrige Qualität',
  },
  
  onboarding: {
    welcome: {
      title: 'Erstellen Sie erstaunliche Videos mit KI',
      button: 'Loslegen',
      footer: 'Indem Sie fortfahren, akzeptieren Sie unsere',
      terms: 'Nutzungsbedingungen',
      and: 'und',
      privacy: 'Datenschutzrichtlinie',
    },
    tutorial: {
      step1: {
        title: 'Beginnen Sie mit einem Bild',
      },
      step2: {
        title: 'Beschreiben Sie Ihre Vision',
        description: 'Mädchen rennt in TV, tritt in Call of Duty-Spiel ein',
      },
      step3: {
        title: 'Sehen Sie Ihr Video',
      },
      next: 'Weiter',
      finish: 'Loslegen',
    },
  },
  
  categories: {
    fashion: {
      name: 'Mode',
      emoji: '👕',
      effects: {
        outfitChange: {
          name: 'Outfit Wechseln',
          description: 'Probieren Sie virtuell verschiedene Outfits und Stile vor dem Kauf.',
        },
        hairstyle: {
          name: 'Frisur Ändern',
          description: 'Experimentieren Sie mit neuen Frisuren vor Ihrem nächsten Salonbesuch.',
        },
        hairColor: {
          name: 'Haarfarbe',
          description: 'Probieren Sie verschiedene Haarfarben, um Ihre perfekte Kombination zu finden.',
        },
        makeup: {
          name: 'Make-up',
          description: 'Wenden Sie virtuelle Make-up-Looks an, um Ihre Fotos zu verbessern.',
        },
      },
    },
    beauty: {
      name: 'Schönheit',
      emoji: '✨',
      effects: {
        skinSmooth: {
          name: 'Glatte Haut',
          description: 'Verbessern Sie Ihre Haut mit natürlich wirkendem Glätten.',
        },
        teethWhitening: {
          name: 'Zahnaufhellung',
          description: 'Erhellen Sie Ihr Lächeln mit natürlicher Zahnaufhellung.',
        },
        eyeEnhancement: {
          name: 'Augen-Verbesserung',
          description: 'Lassen Sie Ihre Augen mit subtilen Verbesserungen hervorstechen.',
        },
      },
    },
    creative: {
      name: 'Kreativ',
      emoji: '🎨',
      effects: {
        artisticFilter: {
          name: 'Künstlerischer Filter',
          description: 'Verwandeln Sie Ihr Foto in ein Kunstwerk.',
        },
        backgroundChange: {
          name: 'Hintergrund Ändern',
          description: 'Ersetzen Sie Ihren Hintergrund durch erstaunliche Szenen.',
        },
        lighting: {
          name: 'Beleuchtungseffekte',
          description: 'Passen Sie die Beleuchtung an, um die perfekte Stimmung zu schaffen.',
        },
      },
    },
    photoEnhancement: {
      name: 'Foto-Verbesserung',
      emoji: '📸',
      effects: {
        hdQuality: {
          name: 'HD-Qualität',
          description: 'Verbessern Sie Fotoqualität und Schärfe.',
        },
        colorCorrection: {
          name: 'Farbkorrektur',
          description: 'Perfektionieren Sie automatisch die Farben Ihres Fotos.',
        },
        removeBlemish: {
          name: 'Makel Entfernen',
          description: 'Entfernen Sie unerwünschte Flecken und Makel.',
        },
      },
    },
  },
};

