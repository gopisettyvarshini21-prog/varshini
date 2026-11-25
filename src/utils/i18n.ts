import { UILanguage } from '../types';

export interface UITranslations {
  languageLabel: string;
  tagline: string;
  nav: {
    dashboard: string;
    replyEngine: string;
    analyzer: string;
    careerHub: string;
    wordPdfExport: string;
    themeStudio: string;
    history: string;
    adminPortal: string;
    settings: string;
    platformModules: string;
    themeBtn: string;
    signIn: string;
    adminBtn: string;
    signOut: string;
    privacyTitle: string;
    privacyDesc: string;
  };
  dashboard: {
    heroBadge: string;
    heroTitlePart1: string;
    heroTitlePart2: string;
    heroSubtitle: string;
    launchEngineBtn: string;
    careerHubBtn: string;
    wordPdfStudioBtn: string;
    modelsHeading: string;
    modelsSubheading: string;
    modelsBadge: string;
    toolsHeading: string;
    toolsSubheading: string;
    openAllTemplates: string;
    presetsHeading: string;
    presetsSubheading: string;
    recentHeading: string;
    viewAll: string;
    catAll: string;
    catWork: string;
    catPersonal: string;
    catSocial: string;
    catAcademic: string;
  };
  settings: {
    title: string;
    subtitle: string;
    resetBtn: string;
    resetToast: string;
    uiLangTitle: string;
    uiLangBadge: string;
    uiLangHelp: string;
    uiLangToast: string;
    defaultPlatformTitle: string;
    defaultPlatformHelp: string;
    replyLangTitle: string;
    replyLangHelp: string;
    emojiTitle: string;
    lengthTitle: string;
    privacyTitle: string;
    allowSaveHistory: string;
    autoAnalyzeLabel: string;
    cleanupTitle: string;
    cleanupDesc: string;
    cleanupConfirmPrompt: string;
    cleanupConfirmBtn: string;
    cleanupCancelBtn: string;
    cleanupActionBtn: string;
    cleanupToast: string;
  };
  engine: {
    presetsBannerTitle: string;
    presetsBannerHint: string;
    analyzerHeading: string;
    inputHeading: string;
    inputSubheading: string;
    pasteBtn: string;
    uploadBtn: string;
    clearBtn: string;
    historyLabel: string;
    historyHint: string;
    latestLabel: string;
    actionRequired: string;
    includeHashtags: string;
    includeLinks: string;
    autoRefine: string;
    optionalShow: string;
    optionalHide: string;
    analyzeOnlyBtn: string;
    generateBtn: string;
  };
}

export const UI_LANGUAGE_OPTIONS: {
  id: UILanguage;
  name: string;
  nativeLabel: string;
  description: string;
}[] = [
  {
    id: 'en',
    name: 'English',
    nativeLabel: '🇺🇸 English (Standard)',
    description: 'Clean executive English across menus, controls, and tooltips.',
  },
  {
    id: 'te',
    name: 'Telugu (తెలుగు)',
    nativeLabel: '🇮🇳 తెలుగు (Telugu Native)',
    description: 'సహజమైన తెలుగు భాషలో పూర్తి యాప్ ఇంటర్‌ఫేస్.',
  },
  {
    id: 'hi-slang',
    name: 'Hindi (Native Slang)',
    nativeLabel: '🇮🇳 हिंदी (देसी स्लैंग / Desi Slang)',
    description: 'एकदम देसी और बिंदास हिंदी स्लैंग में पूरा ऐप.',
  },
];

export const UI_TRANSLATIONS: Record<UILanguage, UITranslations> = {
  en: {
    languageLabel: 'English',
    tagline: 'Understand Every Conversation. Respond Like a Human.',
    nav: {
      dashboard: 'Dashboard',
      replyEngine: 'Reply Engine',
      analyzer: 'Situation Analyzer',
      careerHub: 'Career & Academic Hub',
      wordPdfExport: 'Word & PDF Export',
      themeStudio: 'Theme Studio',
      history: 'Saved History',
      adminPortal: 'Admin Portal',
      settings: 'Settings',
      platformModules: 'Platform Modules',
      themeBtn: 'Theme',
      signIn: 'Sign In',
      adminBtn: 'Admin',
      signOut: 'Sign Out',
      privacyTitle: 'Zero Third-Party Storage',
      privacyDesc:
        'End-to-end encryption. Situations are processed in stateless RAM with no unauthorized account scraping.',
    },
    dashboard: {
      heroBadge: 'AI Chat & Situational Intelligence Platform',
      heroTitlePart1: 'Understand Every Conversation.',
      heroTitlePart2: 'Respond Like a Human.',
      heroSubtitle:
        'Never send awkward, generic, or robotic messages. Situation AI detects relationship dynamics, emotional signals, and unspoken context before crafting natural, platform-perfect replies. Plus, generate formal leave letters, executive emails, LinkedIn thought leadership, and academic research papers with 1-click Word and PDF export.',
      launchEngineBtn: 'Launch AI Reply Engine',
      careerHubBtn: 'Career & Academic Hub',
      wordPdfStudioBtn: 'Word & PDF Studio',
      modelsHeading: 'Supported AI Intelligence Models & Personas',
      modelsSubheading: 'Switch signature reasoning styles to match your conversational style',
      modelsBadge: '5 Models Integrated',
      toolsHeading: 'High-Demand Professional & Academic Tools',
      toolsSubheading:
        'Instant templates for career escalation, formal leave, academic research, and networking',
      openAllTemplates: 'Open All Templates →',
      presetsHeading: 'Instant Conversational Situation Presets',
      presetsSubheading:
        'Click any real-life scenario to launch psychological situation analysis and instant reply generation',
      recentHeading: 'Recently Saved Conversations',
      viewAll: 'View All',
      catAll: 'All',
      catWork: '💼 Work & Career',
      catPersonal: '🏠 Personal & Family',
      catSocial: '💬 Social & Gen Z',
      catAcademic: '🎓 Academic',
    },
    settings: {
      title: 'Platform Preferences & Engine Settings',
      subtitle:
        'Configure your app interface language, communication defaults, privacy preferences, and response modeling rules.',
      resetBtn: 'Reset to Defaults',
      resetToast: 'Settings restored to defaults.',
      uiLangTitle: 'App Interface Language (UI)',
      uiLangBadge: 'Instant UI Switch',
      uiLangHelp:
        'Switch all navigation menus, headers, buttons, and controls between English, Telugu, and Hindi Native Slang.',
      uiLangToast: 'App UI language switched to English.',
      defaultPlatformTitle: 'Default Social Platform',
      defaultPlatformHelp:
        'New conversations will automatically initialize with this platform preset.',
      replyLangTitle: 'Reply Language & Dialect Strategy',
      replyLangHelp:
        'Seamlessly handles Hinglish and code-switching without artificial translation stiffness.',
      emojiTitle: 'Emoji Restraint',
      lengthTitle: 'Default Response Length',
      privacyTitle: 'Privacy & Local Session',
      allowSaveHistory: 'Allow Saving to History',
      autoAnalyzeLabel: 'Auto-Analyze Situation on Generate',
      cleanupTitle: 'Session Cleanup',
      cleanupDesc:
        'Erase all cached conversations, custom replies, and browser-stored session items permanently.',
      cleanupConfirmPrompt: 'Delete all saved sessions?',
      cleanupConfirmBtn: 'Yes, Clear All',
      cleanupCancelBtn: 'Cancel',
      cleanupActionBtn: 'Clear All Stored Applet Data',
      cleanupToast: 'All local session data has been cleared.',
    },
    engine: {
      presetsBannerTitle: 'Instant Conversational Situations',
      presetsBannerHint: 'Click any scenario to autofill',
      analyzerHeading: 'Deep Situation & Context Analyzer',
      inputHeading: 'Smart Chat Input System',
      inputSubheading:
        'Paste the background history and the incoming message. The AI adapts to the dynamic.',
      pasteBtn: 'Paste',
      uploadBtn: 'Upload Chat',
      clearBtn: 'Clear',
      historyLabel: 'A. Previous Chat History',
      historyHint: '(Optional context, timestamps, dialogue)',
      latestLabel: 'B. Latest Incoming Message',
      actionRequired: 'Action Required',
      includeHashtags: 'Include Relevant #Hashtags (for LinkedIn / Social)',
      includeLinks: 'Include Actionable Links & References',
      autoRefine: 'Auto-Refine via Situation Analysis (2-Pass)',
      optionalShow: '+ Add Relationship, Purpose, or Special Context (Optional)',
      optionalHide: 'Hide Optional Relationship & Purpose Controls',
      analyzeOnlyBtn: 'Analyze Situation Only',
      generateBtn: 'Generate Human-Like Replies',
    },
  },
  te: {
    languageLabel: 'తెలుగు',
    tagline: 'ప్రతి మాట వెనుక ఉన్న సీన్ అర్థం చేసుకోండి. మనిషిలా స్పందించండి.',
    nav: {
      dashboard: 'డాష్‌బోర్డ్',
      replyEngine: 'రిప్లై ఇంజిన్',
      analyzer: 'సిట్యుయేషన్ అనలైజర్',
      careerHub: 'కెరీర్ & అకాడమిక్ హబ్',
      wordPdfExport: 'వర్డ్ & PDF ఎక్స్‌పోర్ట్',
      themeStudio: 'థీమ్ స్టూడియో',
      history: 'సేవ్ చేసిన హిస్టరీ',
      adminPortal: 'అడ్మిన్ పోర్టల్',
      settings: 'సెట్టింగ్స్',
      platformModules: 'ప్లాట్‌ఫామ్ మాడ్యూల్స్',
      themeBtn: 'థీమ్',
      signIn: 'సైన్ ఇన్',
      adminBtn: 'అడ్మిన్',
      signOut: 'లాగ్ అవుట్',
      privacyTitle: 'సురక్షిత లోకల్ స్టోరేజ్',
      privacyDesc:
        'ఎండ్-టు-ఎండ్ ప్రైవసీ. మీ చాట్ వివరాలు ఎవరితోనూ షేర్ కాకుండా సురక్షితంగా ప్రాసెస్ అవుతాయి.',
    },
    dashboard: {
      heroBadge: 'AI చాట్ & సిట్యుయేషనల్ ఇంటెలిజెన్స్ ప్లాట్‌ఫామ్',
      heroTitlePart1: 'ప్రతి సంభాషణను లోతుగా అర్థం చేసుకోండి.',
      heroTitlePart2: 'సహజంగా మనిషిలా రిప్లై ఇవ్వండి.',
      heroSubtitle:
        'రోబోట్ లాంటి సమాధానాలకు గుడ్‌బై చెప్పండి. Situation AI ఎదుటివారి మూడ్, రిలేషన్‌షిప్, ఇంకా దాగి ఉన్న భావాలను గుర్తించి పర్ఫెక్ట్ రిప్లైలు ఇస్తుంది. అలాగే లీవ్ లెటర్స్, అఫీషియల్ మెయిల్స్, లింక్డ్‌ఇన్ పోస్టులు & వర్డ్/PDF ఫైల్స్ ఒక క్లిక్‌తో రెడీ చేస్తుంది.',
      launchEngineBtn: 'AI రిప్లై ఇంజిన్ స్టార్ట్ చేయండి',
      careerHubBtn: 'కెరీర్ & అకాడమిక్ హబ్',
      wordPdfStudioBtn: 'వర్డ్ & PDF స్టూడియో',
      modelsHeading: 'సపోర్ట్ చేసే AI మోడల్స్ & పర్సోనాలు',
      modelsSubheading: 'మీ స్టైల్‌కు తగ్గట్టు AI ఆలోచనా శైలిని ఎంచుకోండి',
      modelsBadge: '5 మోడల్స్ సిద్ధం',
      toolsHeading: 'ప్రొఫెషనల్ & స్టూడెంట్స్ కోసం స్పెషల్ టూల్స్',
      toolsSubheading: 'ఆఫీస్ లీవ్ లెటర్, ఈమెయిల్, లింక్డ్‌ఇన్ & అకాడమిక్ టెంప్లేట్స్',
      openAllTemplates: 'అన్ని టెంప్లేట్స్ చూడండి →',
      presetsHeading: 'రెడీమేడ్ చాట్ సిట్యుయేషన్స్',
      presetsSubheading: 'ఏదైనా ఒక సీన్ పై క్లిక్ చేసి వెంటనే అనాలిసిస్ & రిప్లై చూడండి',
      recentHeading: 'ఇటీవల సేవ్ చేసిన చాట్స్',
      viewAll: 'అన్నీ చూడండి',
      catAll: 'అన్నీ',
      catWork: '💼 ఆఫీస్ & కెరీర్',
      catPersonal: '🏠 పర్సనల్ & ఫ్యామిలీ',
      catSocial: '💬 సోషల్ & Gen Z',
      catAcademic: '🎓 చదువు & కాలేజ్',
    },
    settings: {
      title: 'యాప్ సెట్టింగ్స్ & ఇంజిన్ ప్రాధాన్యతలు',
      subtitle:
        'మీకు నచ్చిన UI భాష, డిఫాల్ట్ ప్లాట్‌ఫామ్, ప్రైవసీ ఇంకా రిప్లై స్టైల్ ఇక్కడ సెట్ చేసుకోండి.',
      resetBtn: 'డిఫాల్ట్‌కు రీసెట్ చేయండి',
      resetToast: 'సెట్టింగ్స్ డిఫాల్ట్‌గా రీసెట్ చేయబడ్డాయి.',
      uiLangTitle: 'యాప్ ఇంటర్‌ఫేస్ భాష (UI Language)',
      uiLangBadge: 'వెంటనే మారుతుంది',
      uiLangHelp:
        'ఇక్కడ ఎంచుకున్న భాష ప్రకారం యాప్ మెనూలు, బటన్లు మరియు హెడ్డింగ్స్ అన్నీ English, తెలుగు లేదా హిందీ స్లాంగ్‌లోకి మారతాయి.',
      uiLangToast: 'యాప్ భాష తెలుగులోకి మారింది!',
      defaultPlatformTitle: 'డిఫాల్ట్ సోషల్ ప్లాట్‌ఫామ్',
      defaultPlatformHelp: 'కొత్త చాట్ మొదలుపెట్టినప్పుడల్లా ఇదే ప్లాట్‌ఫామ్ ఆటోమేటిక్‌గా సెట్ అవుతుంది.',
      replyLangTitle: 'రిప్లై భాష & యాస (Dialect)',
      replyLangHelp: 'తెలుగు, హింగ్లిష్ లేదా కోడ్-స్విచింగ్ చాట్‌లను సహజంగా హ్యాండిల్ చేస్తుంది.',
      emojiTitle: 'ఎమోజీల వినియోగం',
      lengthTitle: 'రిప్లై పొడవు (Length)',
      privacyTitle: 'ప్రైవసీ & లోకల్ సెషన్',
      allowSaveHistory: 'హిస్టరీలో చాట్‌లు సేవ్ చేయనివ్వండి',
      autoAnalyzeLabel: 'రిప్లై ఇచ్చే ముందు ఆటో-అనలైజ్ చేయండి',
      cleanupTitle: 'సెషన్ డేటా క్లీనప్',
      cleanupDesc: 'మీ బ్రౌజర్‌లో సేవ్ అయిన పాత చాట్స్, రిప్లైలన్నీ శాశ్వతంగా తొలగించండి.',
      cleanupConfirmPrompt: 'సేవ్ చేసిన డేటా మొత్తం డిలీట్ చేయాలా?',
      cleanupConfirmBtn: 'అవును, డిలీట్ చేయి',
      cleanupCancelBtn: 'వద్దు (Cancel)',
      cleanupActionBtn: 'సేవ్ అయిన డేటా మొత్తం క్లియర్ చేయి',
      cleanupToast: 'లోకల్ సెషన్ డేటా అంతా క్లియర్ చేయబడింది.',
    },
    engine: {
      presetsBannerTitle: 'రెడీమేడ్ చాట్ సిట్యుయేషన్స్',
      presetsBannerHint: 'ఆటో-ఫిల్ కోసం క్లిక్ చేయండి',
      analyzerHeading: 'డీప్ సిట్యుయేషన్ & కాంటెక్స్ట్ అనలైజర్',
      inputHeading: 'స్మార్ట్ చాట్ ఇన్‌పుట్ సిస్టమ్',
      inputSubheading: 'పాత చాట్ హిస్టరీ మరియు కొత్త మెసేజ్ ఇక్కడ పేస్ట్ చేయండి.',
      pasteBtn: 'పేస్ట్',
      uploadBtn: 'చాట్ అప్‌లోడ్',
      clearBtn: 'క్లియర్',
      historyLabel: 'A. పాత చాట్ హిస్టరీ',
      historyHint: '(అవసరమైతేనే — పాత మెసేజ్‌లు, టైమ్‌స్టాంప్స్)',
      latestLabel: 'B. ఇప్పుడే వచ్చిన మెసేజ్',
      actionRequired: 'రిప్లై కావాలి',
      includeHashtags: 'సరైన #హ్యాష్‌ట్యాగ్స్ జోడించండి (LinkedIn / Social)',
      includeLinks: 'ఉపయోగపడే లింక్స్ & రిఫరెన్స్‌లు జోడించండి',
      autoRefine: 'సిట్యుయేషన్ ఆధారంగా ఆటో-రిఫైన్ (2-Pass Quality)',
      optionalShow: '+ రిలేషన్‌షిప్, ఉద్దేశ్యం లేదా స్పెషల్ నోట్స్ జోడించండి (Optional)',
      optionalHide: 'అదనపు రిలేషన్‌షిప్ & ఉద్దేశ్యం వివరాలు దాచండి',
      analyzeOnlyBtn: 'సిట్యుయేషన్ మాత్రమే విశ్లేషించు',
      generateBtn: 'సహజమైన రిప్లైలు క్రియేట్ చేయి',
    },
  },
  'hi-slang': {
    languageLabel: 'हिंदी स्लैंग',
    tagline: 'असली सीन समझो भाई, एकदम इंसान जैसा सॉलिड रिप्लाई ठोको।',
    nav: {
      dashboard: 'मेन अड्डा (Dashboard)',
      replyEngine: 'रिप्लाई का बाप',
      analyzer: 'सीन क्या है? (Analyzer)',
      careerHub: 'करियर & कॉलेज जुगाड़',
      wordPdfExport: 'वर्ड & PDF निकालो',
      themeStudio: 'थीम का स्वैग',
      history: 'पुरानी चैट्स',
      adminPortal: 'बॉस पैनल (Admin)',
      settings: 'सेटिंग्स का अड्डा',
      platformModules: 'सारे धांसू फीचर्स',
      themeBtn: 'लुक / थीम',
      signIn: 'घुसो अंदर (Sign In)',
      adminBtn: 'बॉस लॉगिन',
      signOut: 'निकल लो (Sign Out)',
      privacyTitle: 'फुल प्राइवेसी, नो टेंशन',
      privacyDesc:
        'तुम्हारी चैट यहीं सेफ रहती है बॉस। कोई थर्ड-पार्टी जासूसी या फालतू डेटा चोरी का सीन ही नहीं है।',
    },
    dashboard: {
      heroBadge: 'देसी AI चैट & सिचुएशन बॉस प्लेटफॉर्म',
      heroTitlePart1: 'सामने वाले का असली मूड पकड़ो,',
      heroTitlePart2: 'और एकदम कड़क इंसान जैसा रिप्लाई दो!',
      heroSubtitle:
        'अब बोरिंग रोबोट वाले मैसेज भेजना बंद करो भाई! Situation AI पूरी चैट का सीन, सामने वाले की फीलिंग और छुपा हुआ मतलब भांप कर एकदम मस्त रिप्लाई बना देता है। साथ में ऑफिस की छुट्टी की अर्ज़ी, कड़क ईमेल, लिंक्डइन पोस्ट और Word/PDF भी एक क्लिक में रेडी!',
      launchEngineBtn: 'चलो रिप्लाई निकालते हैं 🚀',
      careerHubBtn: 'करियर & कॉलेज जुगाड़ हब',
      wordPdfStudioBtn: 'वर्ड & PDF स्टूडियो',
      modelsHeading: 'तगड़े AI मॉडल्स का स्क्वाड',
      modelsSubheading: 'जिसका स्टाइल जमे, उसका मोड ऑन कर लो भाई',
      modelsBadge: '5 धांसू मॉडल्स तैयार',
      toolsHeading: 'ऑफिस और कॉलेज के तगड़े टूल्स',
      toolsSubheading: 'छुट्टी की चिट्ठी, बॉस को ईमेल, लिंक्डइन और असाइनमेंट का फुल बंदोबस्त',
      openAllTemplates: 'सारे जुगाड़ देखो →',
      presetsHeading: 'तैयार चैट सीन्स (बस क्लिक करो)',
      presetsSubheading: 'कोई भी असली लाइफ वाला सीन चुनो और तुरंत तगड़ा रिप्लाई पाओ',
      recentHeading: 'ताज़ा सेव की हुई चैट्स',
      viewAll: 'सब देखो',
      catAll: 'सब कुछ',
      catWork: '💼 ऑफिस & करियर',
      catPersonal: '🏠 घर & यारी-दोस्ती',
      catSocial: '💬 इंस्टा & Gen Z',
      catAcademic: '🎓 कॉलेज & पढ़ाई',
    },
    settings: {
      title: 'ऐप सेटिंग्स और जुगाड़ कंट्रोल',
      subtitle:
        'यहीं से ऐप की भाषा, डिफ़ॉल्ट प्लेटफॉर्म, प्राइवेसी और रिप्लाई देने का स्टाइल सेट करो बॉस।',
      resetBtn: 'सब पहले जैसा करो',
      resetToast: 'सारी सेटिंग्स वापस डिफ़ॉल्ट पर सेट हो गईं भाई!',
      uiLangTitle: 'ऐप की भाषा चुनो (UI Language)',
      uiLangBadge: 'तुरंत बदलेगा',
      uiLangHelp:
        'यहाँ से पूरा ऐप इंग्लिश, तेलुगु या देसी हिंदी स्लैंग में पलक झपकते ही बदल सकते हो भाई!',
      uiLangToast: 'लो बॉस, पूरा ऐप अब देसी हिंदी स्लैंग में सेट हो गया!',
      defaultPlatformTitle: 'डिफ़ॉल्ट चैट अड्डा (Platform)',
      defaultPlatformHelp: 'हर नई चैट इसी ऐप के हिसाब से अपने आप शुरू होगी।',
      replyLangTitle: 'रिप्लाई की भाषा और टोन',
      replyLangHelp: 'हिंग्लिश और देसी मिक्स भाषा को बिना किसी बनावटीपन के मस्त संभालता है।',
      emojiTitle: 'इमोजी का तड़का',
      lengthTitle: 'रिप्लाई कितना लंबा हो?',
      privacyTitle: 'प्राइवेसी और लोकल डेटा',
      allowSaveHistory: 'चैट हिस्ट्री सेव होने दो',
      autoAnalyzeLabel: 'रिप्लाई से पहले सीन अपने आप चेक करो',
      cleanupTitle: 'डेटा साफ़-सफाई ज़ोन',
      cleanupDesc: 'ब्राउज़र में सेव सारी पुरानी चैट्स और रिप्लाई हमेशा के लिए उड़ा दो।',
      cleanupConfirmPrompt: 'पक्का सारा सेव डेटा उड़ा दें भाई?',
      cleanupConfirmBtn: 'हाँ, उड़ा दो सब',
      cleanupCancelBtn: 'रहने दो (Cancel)',
      cleanupActionBtn: 'सारा पुराना डेटा साफ़ करो',
      cleanupToast: 'सारा लोकल डेटा एकदम क्लीन हो गया बॉस!',
    },
    engine: {
      presetsBannerTitle: 'झटपट चैट सीन्स',
      presetsBannerHint: 'भरने के लिए किसी पर भी मारो क्लिक',
      analyzerHeading: 'पूरे सीन का डीप पोस्टमार्टम (Analyzer)',
      inputHeading: 'स्मार्ट चैट इनपुट सिस्टम',
      inputSubheading: 'पुरानी चैट और अभी आया हुआ मैसेज यहाँ चिपकाओ, बाकी AI संभाल लेगा।',
      pasteBtn: 'चिपकाओ (Paste)',
      uploadBtn: 'चैट डालो',
      clearBtn: 'साफ़ करो',
      historyLabel: 'A. पुरानी चैट की कहानी',
      historyHint: '(चाहो तो डालो — बैकग्राउंड समझने के लिए)',
      latestLabel: 'B. अभी-अभी आया मैसेज',
      actionRequired: 'जवाब मांगता है',
      includeHashtags: 'मस्त #Hashtags भी लगाओ (LinkedIn / Insta के लिए)',
      includeLinks: 'काम के Links और रेफरेंस भी चिपकाओ',
      autoRefine: 'दोबारा पॉलिश करो (Auto-Refine 2-Pass)',
      optionalShow: '+ रिश्ता, मकसद या सीक्रेट नोट जोड़ना है? (Optional)',
      optionalHide: 'एक्स्ट्रा सेटिंग छुपाओ',
      analyzeOnlyBtn: 'सिर्फ सीन का हाल जानो',
      generateBtn: 'एकदम कड़क रिप्लाई बनाओ',
    },
  },
};

export function getTranslations(lang?: UILanguage): UITranslations {
  if (lang && UI_TRANSLATIONS[lang]) {
    return UI_TRANSLATIONS[lang];
  }
  return UI_TRANSLATIONS.en;
}
