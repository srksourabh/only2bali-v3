import type { Dictionary } from "./en";

export const hi: Dictionary = {
  meta: {
    title: "Only2Bali - Indonesia travel marketplace for Indian groups",
    description:
      "Book verified stays, rides, guides, restaurants and group packages across Bali, Jakarta and Indonesia — built for Indian travellers, with food protocol as one clear filter.",
  },

  nav: {
    circuits: "सर्किट",
    destinations: "Destinations",
    services: "Services",
    guarantee: "Trip quality",
    verify: "हम जाँच कैसे करते हैं",
    packages: "पैकेज",
    plan: "मेरी यात्रा बनाएँ",
    language: "भाषा",
    theme: "उजाला और अँधेरा बदलें",
  },

  hero: {
    eyebrow: "India → Indonesia · Bali · Jakarta · Circuits · Services",
    headlineBefore: "Your Indonesia trip, ",
    headlineEm: "built around you",
    headlineAfter: " — with verified local providers.",
    sub: "Browse curated circuits and book stays, rides, guides, restaurants and packages from verified partners in Bali, Jakarta and beyond. Pay Only2Bali; we pay the providers.",
    cta1: "Explore circuits",
    cta2: "Browse services",
    caption: "Sembah — the folded-hand greeting shared by Bali and India",
  },

  rail: [
    { value: "Bali + Jakarta", label: "Destinations live now, more Indonesia next" },
    { value: "4", label: "Temple, adventure, food and artisan circuits" },
    { value: "7", label: "Indian languages spoken by our guides" },
    { value: "Verified", label: "Providers go live only after admin review" },
  ],

  destinations: {
    heading: "Where do you want to go?",
    sub: "Start with Bali or Jakarta. Every service and package is tied to a place, not a vague brochure.",
    bali: {
      name: "Bali",
      blurb: "Temples, coasts, Ubud, Nusa islands — the core circuits and most of our verified supply.",
    },
    jakarta: {
      name: "Jakarta",
      blurb: "City stays, airport logistics, dining and add-on services for groups entering Indonesia.",
    },
  },

  circuits: {
    heading: "वह बाली चुनिए जिसके लिए आप वाकई आए हैं।",
    sub: "चार सर्किट, हर एक असली ज़मीन पर बना — मंदिर, रास्ते, रसोइयाँ और कार्यशालाएँ जहाँ हम खुद गए हैं। एक चुनिए, और पूरी यात्रा उसी के इर्द-गिर्द बन जाएगी।",
    addOn: "अतिरिक्त",
    items: {
      ramayana: {
        name: "मंदिर सर्किट",
        blurb: "बेसाकिह, तीर्थ एम्पुल, लेम्पुयांग और सूरज ढलते समय उलुवातु का केचक अग्नि नृत्य।",
        stops: "6 मंदिर · सूर्यास्त पर केचक · सात्विक भोजन के दिन",
      },
      adventure: {
        name: "राफ्टिंग से सूर्योदय तक",
        blurb: "अयुंग नदी, भोर से पहले माउंट बातुर, नुसा पेनिदा का पानी।",
        stops: "ऊर्जा से भरपूर शाकाहारी भोजन योजना",
      },
      culinary: {
        name: "शाकाहारी भोजन यात्रा",
        blurb: "शुद्ध शाकाहारी रसोइयाँ, एक कुकिंग क्लास, और नियम से पकाने वाले वारुंग।",
        stops: "हर रसोई की जाँच की गई",
      },
      artistic: {
        name: "कारीगर, बुनकर और चित्रकार",
        blurb: "मास गाँव की लकड़ी की नक्काशी, चेलुक की चाँदी, उबुद और सानूर के बाटिक स्टूडियो — कारीगरों के साथ काम करते हुए, बस की खिड़की से देखते हुए नहीं।",
        stops: "हाथों-हाथ कार्यशालाएँ · छोटे समूह",
      },
      coast: {
        name: "समुद्र तट और आराम के दिन",
        blurb: "नुसा दुआ, जिम्बरन, और कुछ न करने का समय।",
        stops: "",
      },
      wellness: {
        name: "स्वास्थ्य और विश्राम",
        blurb: "उबुद में योग, फूलों का स्नान, शांत सुबहें।",
        stops: "",
      },
    },
  },

  services: {
    heading: "Book services from verified local partners.",
    sub: "Restaurants, stays, transport, guides, activities and more — listed by providers across Bali and Jakarta, published only after Only2Bali checks them.",
    empty: "No published services in this filter yet. Providers are onboarding — try another region or check packages.",
    from: "from",
    verified: "Verified provider",
    viewCta: "View service",
    bookCta: "Enquire to book",
    filterAll: "All destinations",
    filterBali: "Bali",
    filterJakarta: "Jakarta",
    back: "All services",
    reviewsHeading: "Traveller reviews",
  },

  guarantee: {
    heading: "Food protocol is one filter. Stays, rides and budget are checked too.",
    sub: "Vegetarian, Jain and vegan remain first-class options — disclosed meal by meal — alongside stay comfort, vehicle type, guide language and clear INR pricing.",
    protocols: { jain: "जैन", veg: "शाकाहारी", vegan: "वीगन" },
    legend: {
      green: "समर्पित रसोई, प्रमाणित",
      amber: "साझा रसोई, अलग लाइन",
      red: "इस नियम पर परोसा नहीं जाता",
    },
    dayTitle: "दिन 3 — उबुद और तेगालालांग",
    protocolLabel: { jain: "जैन नियम", veg: "शाकाहारी नियम", vegan: "वीगन नियम" },
    meals: { breakfast: "नाश्ता", lunch: "दोपहर का भोजन", dinner: "रात का भोजन" },
    ratingLabel: { dedicated: "समर्पित", shared: "साझा लाइन", substituted: "बदला गया" },
    jain: {
      note: "<strong>जैन सबसे कड़ा नियम है।</strong> प्याज़ नहीं, लहसुन नहीं, कोई ज़मीन के नीचे उगने वाली सब्ज़ी नहीं। जो रसोइयाँ अलग जगह पर पकाने की गारंटी नहीं दे सकतीं वे अंबर हो जाती हैं, और तेगालालांग का वारुंग उस दिन से पूरी तरह हट जाता है — बदला जाता है, चुपचाप परोसा नहीं जाता।",
      foot: "तीन में से दो भोजन समर्पित रसोई से। एक बदलाव अपने आप किया गया।",
      breakfast: { what: "विला की रसोई — गुजराती थाली", note: "आपके साथ चल रहे रसोइये द्वारा बनाई गई" },
      lunch: { what: "सात्विक बाय नेचर, उबुद", note: "शुद्ध शाकाहारी रसोई, माँगने पर बिना प्याज़-लहसुन" },
      dinner: { what: "तेगालालांग के पास वारुंग", note: "साझा कड़ाही — जैन-सक्षम रसोई से बदला गया" },
    },
    veg: {
      note: "<strong>शाकाहारी होने पर दिन खुल जाता है।</strong> तेगालालांग का वारुंग वापस आ जाता है — वह पूरी तरह शाकाहारी है, पर उसकी रसोई मांसाहारी तैयारी के साथ साझा है, इसलिए उसे अंबर रेटिंग मिलती है और आपको कारण बताया जाता है, केवल आश्वासन नहीं दिया जाता।",
      foot: "तीनों भोजन परोसे गए। एक अंबर रेटिंग पहले ही बता दी गई।",
      breakfast: { what: "रिज़ॉर्ट का नाश्ता, अलग शाकाहारी काउंटर", note: "अलग परोसने की लाइन, जाँची गई" },
      lunch: { what: "सात्विक बाय नेचर, उबुद", note: "शुद्ध शाकाहारी रसोई" },
      dinner: { what: "तेगालालांग के पास वारुंग", note: "शाकाहारी मेन्यू, साझा रसोई — बताया गया" },
    },
    vegan: {
      note: "<strong>वीगन के लिए बाली सबसे मज़बूत है।</strong> चांगू और उबुद में असली प्लांट-बेस्ड दुनिया है, इसलिए मुश्किल उपलब्धता की नहीं बल्कि भारतीय पाक-कला में दूध-दही की हो जाती है — विला का नाश्ता घी और दही से हट जाता है।",
      foot: "तीनों भोजन परोसे गए। विला की रसोई से डेयरी हटा दी गई।",
      breakfast: { what: "विला की रसोई — प्लांट-बेस्ड भारतीय", note: "घी और दही निर्देश से हटाए गए" },
      lunch: { what: "द शेडी शैक, चांगू", note: "पूरी तरह प्लांट-बेस्ड रसोई" },
      dinner: { what: "रॉ और स्मूदी बार, उबुद", note: "वीगन रसोई, कोई संपर्क नहीं" },
    },
  },

  verify: {
    heading: "कोई रसोई हरी रेटिंग कैसे कमाती है।",
    sub: "आस्था-आधारित यात्रा में कोई प्रतिस्पर्धी अपना तरीका सार्वजनिक नहीं करता। हम करते हैं, क्योंकि तरीका ही उत्पाद है।",
    steps: [
      { title: "हम बिना बताए जाते हैं", body: "हमारी टीम का कोई सदस्य पहले वहाँ खाना खाता है। न तय निरीक्षण, न पहले से सूचना।" },
      { title: "हम मेन्यू नहीं, रसोई की लाइन देखते हैं", body: "अलग तेल, अलग बर्तन, अलग जगह। जिस रसोई की कड़ाही साझा है उसका छपा शाकाहारी मेन्यू अंबर है, हरा नहीं।" },
      { title: "जैन नियम स्पष्ट रूप से पूछा जाता है", body: "प्याज़ नहीं, लहसुन नहीं, कंद-मूल नहीं — उसी रसोइये से पुष्टि जो असल में उस दिन काम पर होगा, और तस्वीर ली जाती है।" },
      { title: "रेटिंग की मियाद खत्म होती है", body: "रसोइयाँ हाथ बदलती हैं और कर्मचारी चले जाते हैं। जिस रेटिंग की दोबारा जाँच नहीं होती वह चुपचाप पुरानी होने के बजाय हमारी व्यवस्था से हट जाती है।" },
    ],
  },

  packages: {
    heading: "असली तारीखों और असली सीटों के साथ प्रस्थान।",
    sub: "प्रति व्यक्ति अनुमानित, अंतरराष्ट्रीय उड़ानों को छोड़कर। हर पैकेज बदला जा सकता है — ये शुरुआत हैं, तय मेन्यू नहीं।",
    perPerson: "प्रति व्यक्ति · से",
    checkDates: "तारीखें देखें",
    nights: "रातें",
    days: "दिन",
    items: [
      {
        slug: "sattvik-serenity",

        tag: "रामायण",
        name: "सात्विक सेरेनिटी",
        meta: "6 दिन · 5 रातें · उबुद, तीर्थ एम्पुल, उलुवातु, नुसा दुआ",
        price: "₹1,18,000",
        why: [
          "विला में जैन-नियम की रसोई, रसोइया वैकल्पिक",
          "पूरे समय गुजराती और हिन्दी बोलने वाला गाइड",
          "भीड़ से पहले मंदिर की सुबहें",
        ],
        chips: ["जैन", "शाकाहारी", "निजी विला"],
      },
      {
        slug: "bali-veg-explorer",

        tag: "मिश्रित",
        name: "बाली वेज एक्सप्लोरर",
        meta: "5 दिन · 4 रातें · कुटा, उबुद, उलुवातु",
        price: "₹58,000",
        why: [
          "हर यात्रा-दिन पर जाँचे गए भारतीय शाकाहारी रेस्तराँ",
          "वाटर स्पोर्ट्स और उलुवातु केचक शामिल",
          "कम बजट में पहली बार जाने वाले समूहों के लिए",
        ],
        chips: ["शाकाहारी", "जैन", "समूह"],
      },
      {
        slug: "active-bali",

        tag: "एडवेंचर",
        name: "एक्टिव बाली",
        meta: "5 दिन · 4 रातें · अयुंग, माउंट बातुर, नुसा पेनिदा",
        price: "₹62,000",
        why: [
          "ट्रेक के दिनों के लिए उच्च-प्रोटीन शाकाहारी और वीगन भोजन",
          "बातुर का सूर्योदय, साथ में नियम से बना नाश्ता",
          "एक ही सप्ताह में राफ्टिंग, ATV और स्नॉर्कलिंग",
        ],
        chips: ["शाकाहारी", "वीगन", "सक्रिय"],
      },
    ],
  },

  langs: {
    heading: "आपके माता-पिता को अपना खाना अंग्रेज़ी में समझाना न पड़े।",
    sub: "बाली में हमारे गाइड नेटवर्क में भारतीय भाषाएँ बोलने वाले लोग हैं, जो मंदिर की मर्यादा, व्रत के दिन और परिवार की यात्रा की लय — दोनों ओर की — समझते हैं।",
  },

  close: {
    heading: "अपनी तारीखें बताइए। हम तीन प्रस्ताव लेकर लौटेंगे।",
    body: "प्रमाणित प्रदाताओं से, 24 घंटे के भीतर, हर एक की पूरी कीमत और हर भोजन की रेटिंग पहले से जुड़ी हुई। न कॉल सेंटर, न बार-बार के ईमेल।",
    cta1: "अपनी तारीखों से शुरू करें",
    cta2: "प्रदाता के रूप में अपना व्यवसाय जोड़ें",
  },

  brand: {
    heading: "प्रतीक",
    body: "<em>चंडी बेंतार</em> — वह विभाजित द्वार जो बाली के मंदिर प्रांगण का प्रवेश चिह्नित करता है। दो सीढ़ीदार स्तंभ, बीच में एक रास्ता, और उस खुले हिस्से से उगता सूरज। प्रवेश के लिए आप उसी से होकर जाते हैं।",
    scale: "आकार",
    full: "पूर्ण",
    favicon: "20px · फ़ेविकॉन",
    reversed: "विपरीत",
    reversedBody: "आइवरी स्तंभ, केसरिया सूरज। गहरे हरे और तस्वीरों की पृष्ठभूमि के लिए।",
    palette: "रंग — अपरिवर्तित",
    paletteBody: "हर रंग पहले से आपके कोड में मौजूद है। कुछ नया नहीं जोड़ा गया।",
  },

  footer: {
    tagline: "बाली के लिए प्रमाणित शाकाहारी, जैन और वीगन समूह यात्रा।",
    note: "तस्वीरें और रंग मौजूदा साइट से।",
  },

  auth: {
    signIn: "साइन इन",
    signOut: "साइन आउट",
    account: "मेरा खाता",
    heading: "कोई पासवर्ड नहीं। बस एक कोड।",
    sub: "अपना ईमेल या मोबाइल नंबर डालिए, हम छह अंकों का कोड भेजेंगे। न याद रखने को पासवर्ड, न किसी के चुराने को कुछ।",
    useEmail: "ईमेल",
    useMobile: "मोबाइल",
    emailLabel: "ईमेल पता",
    emailPlaceholder: "aap@example.com",
    mobileLabel: "मोबाइल नंबर",
    mobilePlaceholder: "+91 98765 43210",
    continue: "मुझे कोड भेजें",
    sending: "भेजा जा रहा है…",
    codeHeading: "छह अंकों का कोड डालिए",
    codeSentTo: "हमने भेजा है",
    codeLabel: "छह अंकों का कोड",
    verify: "साइन इन करें",
    verifying: "जाँचा जा रहा है…",
    resend: "नया कोड भेजें",
    resendIn: "दूसरा कोड माँगने में बाकी",
    seconds: "से",
    changeContact: "दूसरा पता इस्तेमाल करें",
    expiresNote: "कोड दस मिनट में समाप्त होता है और एक ही बार चलता है।",
    errInvalid: "यह कोड सही नहीं है।",
    errExpired: "यह कोड समाप्त हो चुका है। नया माँगिए।",
    errLocked: "बहुत बार गलत कोशिश। नया कोड माँगिए।",
    errRate: "बहुत ज़्यादा अनुरोध। कृपया थोड़ा रुकिए।",
    errNetwork: "सर्वर तक नहीं पहुँच सके। कनेक्शन जाँचकर दोबारा कोशिश कीजिए।",
    errGeneric: "कुछ गड़बड़ हुई। कृपया दोबारा कोशिश कीजिए।",
    welcomeNew: "स्वागत है। आपका खाता तैयार है।",
  },

  account: {
    heading: "आपका खाता",
    signedInAs: "साइन इन",
    role: "भूमिका",
    roleTraveller: "यात्री",
    roleVendor: "प्रदाता",
    roleAdmin: "एडमिन",
    tripsHeading: "आपकी यात्राएँ",
    tripsEmpty: "आपने अभी कोई यात्रा नहीं बनाई है।",
    tripsEmptyCta: "यात्रा बनाइए",
    bookingsHeading: "बुकिंग",
    bookingsEmpty: "अभी कोई बुकिंग नहीं। बुकिंग यहाँ वाउचर और भुगतान योजना के साथ दिखेगी।",
    payNow: "अभी भुगतान करें",
    paying: "भुगतान खुल रहा है…",
    paid: "भुगतान हो गया — बुकिंग कन्फर्म",
    holdExpired: "सीट होल्ड समाप्त — दोबारा बुक करने के लिए संपर्क करें",
    awaitingPayment: "भुगतान की प्रतीक्षा",
    confirmed: "कन्फर्म",
    payErrSetup: "ऑनलाइन भुगतान अभी सेट नहीं है। आपकी सीटें होल्ड हैं — हम संपर्क करेंगे।",
    payErrGeneric: "भुगतान पूरा नहीं हुआ। दोबारा चार्ज नहीं होगा। फिर कोशिश करें।",
    savedHeading: "सहेजे गए पैकेज",
    savedEmpty: "आप जो पैकेज सहेजेंगे वे यहाँ दिखेंगे।",
    browseCta: "पैकेज देखें",
    protocolNote: "अपना खान-पान नियम एक बार तय कीजिए, हर कार्यक्रम उसी का पालन करेगा।",

    reviewHeading: "Leave a rating",
    reviewSubmit: "Submit rating",
    reviewThanks: "Thank you — your rating is saved.",
    reviewPrompt: "Rate this provider",
  },

};
