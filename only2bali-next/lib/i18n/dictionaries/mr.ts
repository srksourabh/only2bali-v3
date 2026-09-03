import type { Dictionary } from "./en";

export const mr: Dictionary = {
  meta: {
    title: "Only2Bali - Indonesia travel marketplace for Indian groups",
    description:
      "Book verified stays, rides, guides, restaurants and group packages across Bali, Jakarta and Indonesia — built for Indian travellers, with food protocol as one clear filter.",
  },

  nav: {
    home: "मुख्यपृष्ठ",
    circuits: "सर्किट",
    destinations: "Destinations",
    services: "Services",
    guarantee: "Trip quality",
    verify: "आम्ही कशी तपासणी करतो",
    packages: "पॅकेजेस",
    providers: "Providers",
    plan: "माझा प्रवास आखा",
    language: "भाषा",
    theme: "उजेड आणि अंधार बदला",
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
    heading: "ज्या बालीसाठी तुम्ही खरोखर आला आहात, ती निवडा.",
    sub: "चार सर्किट, प्रत्येक खऱ्या जमिनीवर बांधलेले — मंदिरे, वाटा, स्वयंपाकघरे आणि कार्यशाळा जिथे आम्ही स्वतः गेलो आहोत. एक निवडा, आणि सगळा प्रवास त्याभोवती उभा राहील.",
    addOn: "अधिक",
    items: {
      ramayana: {
        name: "मंदिर सर्किट",
        blurb: "बेसाकिह, तीर्थ एम्पुल, लेम्पुयांग आणि सूर्य मावळताना उलुवातुचे केचक अग्निनृत्य.",
        stops: "6 मंदिरे · सूर्यास्ताला केचक · सात्त्विक जेवणाचे दिवस",
      },
      adventure: {
        name: "राफ्टिंगपासून सूर्योदयापर्यंत",
        blurb: "अयुंग नदी, पहाटेपूर्वी माउंट बातुर, नुसा पेनिदाचे पाणी.",
        stops: "ऊर्जा देणारी शाकाहारी जेवणाची योजना",
      },
      culinary: {
        name: "शाकाहारी खाद्ययात्रा",
        blurb: "शुद्ध शाकाहारी स्वयंपाकघरे, एक कुकिंग क्लास, आणि नियमाने शिजवणारी वारुंग.",
        stops: "प्रत्येक स्वयंपाकघर तपासलेले",
      },
      artistic: {
        name: "कारागीर, विणकर आणि चित्रकार",
        blurb: "मास गावातील लाकडी कोरीवकाम, चेलुकची चांदी, उबुद आणि सानूरचे बाटिक स्टुडिओ — कारागिरांसोबत काम करत, बसच्या खिडकीतून पाहत नाही.",
        stops: "प्रत्यक्ष कार्यशाळा · लहान गट",
      },
      coast: {
        name: "किनारा आणि विश्रांतीचे दिवस",
        blurb: "नुसा दुआ, जिम्बरन, आणि काहीच न करण्याचा वेळ.",
        stops: "",
      },
      wellness: {
        name: "आरोग्य",
        blurb: "उबुदमध्ये योग, फुलांचे स्नान, शांत सकाळी.",
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
    bookNow: "Book and pay",
    booking: "Holding…",
    signedInRequired: "Sign in to hold this date and pay Only2Bali.",
    signIn: "Sign in to book",
    leadName: "Lead traveller full name",
    pax: "Group size",
    protocol: "Food protocol",
    date: "Service date",
    success: "Held — reference",
    errGeneric: "Could not create the booking. Nothing was charged.",
    filterAll: "All destinations",
    filterBali: "Bali",
    filterJakarta: "Jakarta",
    back: "All services",
    reviewsHeading: "Traveller reviews",
  },

  providers: {
    heading: "Verified Bali and Jakarta providers.",
    sub: "Only admin-verified partners appear here. Open a profile to see approved photos and live services.",
    empty: "No verified providers are public yet.",
    viewCta: "View provider",
    verified: "Verified",
  },

  guarantee: {
    heading: "Food protocol is one filter. Stays, rides and budget are checked too.",
    sub: "Vegetarian, Jain and vegan remain first-class options — disclosed meal by meal — alongside stay comfort, vehicle type, guide language and clear INR pricing.",
    protocols: { jain: "जैन", veg: "शाकाहारी", vegan: "व्हीगन", satvik: "सात्त्विक (कांदा-लसूण नाही)", eggetarian: "अंड्यासह शाकाहारी", halal: "हलाल", nonVeg: "मांसाहारी" },
    legend: {
      green: "स्वतंत्र स्वयंपाकघर, प्रमाणित",
      amber: "सामायिक स्वयंपाकघर, वेगळी रांग",
      red: "या नियमात वाढले जात नाही",
    },
    dayTitle: "दिवस 3 — उबुद आणि तेगालालांग",
    protocolLabel: { jain: "जैन नियम", veg: "शाकाहारी नियम", vegan: "व्हीगन नियम" },
    meals: { breakfast: "न्याहारी", lunch: "दुपारचे जेवण", dinner: "रात्रीचे जेवण" },
    ratingLabel: { dedicated: "स्वतंत्र", shared: "सामायिक रांग", substituted: "बदलले" },
    jain: {
      note: "<strong>जैन हा सर्वात कडक नियम आहे.</strong> कांदा नाही, लसूण नाही, कंदमुळे नाहीत. वेगळ्या जागी शिजवण्याची हमी न देणारी स्वयंपाकघरे अंबरवर येतात, आणि तेगालालांगचे वारुंग त्या दिवसातून पूर्णपणे वगळले जाते — बदलले जाते, गुपचूप वाढले जात नाही.",
      foot: "तिनांपैकी दोन जेवणे स्वतंत्र स्वयंपाकघरातून. एक बदल आपोआप केला गेला.",
      breakfast: { what: "व्हिलाचे स्वयंपाकघर — गुजराती थाळी", note: "तुमच्यासोबत येणाऱ्या स्वयंपाक्याने बनवलेली" },
      lunch: { what: "सात्त्विक बाय नेचर, उबुद", note: "शुद्ध शाकाहारी स्वयंपाकघर, सांगितल्यास कांदा-लसूण वगळून" },
      dinner: { what: "तेगालालांगजवळचे वारुंग", note: "सामायिक कढई — जैन नियम पाळणाऱ्या स्वयंपाकघराने बदलले" },
    },
    veg: {
      note: "<strong>शाकाहारीमध्ये दिवस मोकळा होतो.</strong> तेगालालांगचे वारुंग परत येते — ते पूर्णपणे शाकाहारी आहे, पण त्याचे स्वयंपाकघर मांसाहारी तयारीसोबत सामायिक आहे. म्हणून अंबर रेटिंग, आणि तुम्हाला कारण सांगितले जाते; नुसती खात्री दिली जात नाही.",
      foot: "तिन्ही जेवणे वाढली. एक अंबर रेटिंग आधीच सांगितले.",
      breakfast: { what: "रिसॉर्टची न्याहारी, स्वतंत्र शाकाहारी काउंटर", note: "वेगळी वाढण्याची रांग, तपासलेली" },
      lunch: { what: "सात्त्विक बाय नेचर, उबुद", note: "शुद्ध शाकाहारी स्वयंपाकघर" },
      dinner: { what: "तेगालालांगजवळचे वारुंग", note: "शाकाहारी मेनू, सामायिक स्वयंपाकघर — सांगितले" },
    },
    vegan: {
      note: "<strong>व्हीगनसाठी बाली सर्वात मजबूत आहे.</strong> चांगू आणि उबुदमध्ये खरी वनस्पती-आधारित संस्कृती आहे. त्यामुळे अडचण उपलब्धतेची नाही तर भारतीय स्वयंपाकातील दुधाच्या पदार्थांची होते — व्हिलाची न्याहारी तूप आणि दह्यापासून दूर जाते.",
      foot: "तिन्ही जेवणे वाढली. व्हिलाच्या स्वयंपाकघरातून दुग्धजन्य पदार्थ काढले.",
      breakfast: { what: "व्हिलाचे स्वयंपाकघर — वनस्पती-आधारित भारतीय", note: "तूप आणि दही सूचनेतून वगळले" },
      lunch: { what: "द शेडी शॅक, चांगू", note: "पूर्णपणे वनस्पती-आधारित स्वयंपाकघर" },
      dinner: { what: "रॉ अँड स्मूदी बार, उबुद", note: "व्हीगन स्वयंपाकघर, कोणताही संपर्क नाही" },
    },
  },

  verify: {
    heading: "प्रदाता विश्वास कसा मिळवतो.",
    sub: "राहण्याची जागा, सवारी, मार्गदर्शक, उपक्रम आणि स्वयंपाकघर — प्रवाशांना खरोखर मिळणारी सेवा आम्ही तपासतो, फक्त विक्रीचे वचन नाही.",
    steps: [
      { title: "आम्ही स्वतः पाहून तपासतो", body: "लिस्टिंग लाईव्ह होण्यापूर्वी आमची टीम जागा किंवा वाहन पाहते, किंवा मार्गदर्शकासोबत जाते. दाखवण्यासाठीची तपासणी नाही." },
      { title: "आम्ही खरी सेवा पाहतो", body: "राहण्यासाठी खोली, सवारीसाठी वाहनाची स्थिती, मार्गदर्शकाची भाषा आणि मार्ग, आणि जेथे जेवण असेल तेथे स्वयंपाकघराची पद्धत." },
      { title: "जेवण असेल तेथे प्रोटोकॉल विचारतो", body: "जेवण समाविष्ट असेल तर जैन/शाकाहारी नियम त्याच स्वयंपाकऱ्याकडे पुष्टी — कांदा, लसूण, कंदमुळे नको जेव्हा मागितले — आणि छायाचित्र." },
      { title: "रेटिंगची मुदत संपते", body: "हॉटेल, ड्रायव्हर, मेनू आणि किंमती बदलतात. नव्याने न तपासलेली तपासणी शांतपणे जुनी होण्याऐवजी बाहेर पडते." },
    ],
  },

  packages: {
    heading: "खऱ्या तारखा आणि खऱ्या जागांसह प्रस्थान.",
    sub: "प्रति व्यक्ती अंदाजे, आंतरराष्ट्रीय विमानभाडे वगळून. प्रत्येक पॅकेज बदलता येते — ही सुरुवात आहे, ठरलेला मेनू नाही.",
    perPerson: "प्रति व्यक्ती · पासून",
    checkDates: "तारखा पहा",
    bookNow: "Book this departure",
    nights: "रात्री",
    days: "दिवस",
    empty: "No published packages yet.",
    items: [
      {
        slug: "sattvik-serenity",

        tag: "रामायण",
        name: "सात्त्विक सेरेनिटी",
        meta: "6 दिवस · 5 रात्री · उबुद, तीर्थ एम्पुल, उलुवातु, नुसा दुआ",
        price: "₹1,18,000",
        why: [
          "व्हिलामध्ये जैन नियमाचे स्वयंपाकघर, स्वयंपाकी ऐच्छिक",
          "संपूर्ण प्रवासात गुजराती आणि हिंदी बोलणारा गाइड",
          "गर्दीच्या आधी मंदिरातील सकाळी",
        ],
        chips: ["जैन", "शाकाहारी", "खाजगी व्हिला"],
      },
      {
        slug: "bali-veg-explorer",

        tag: "मिश्र",
        name: "बाली व्हेज एक्सप्लोरर",
        meta: "5 दिवस · 4 रात्री · कुटा, उबुद, उलुवातु",
        price: "₹58,000",
        why: [
          "प्रत्येक प्रवासाच्या दिवशी तपासलेली भारतीय शाकाहारी उपाहारगृहे",
          "वॉटर स्पोर्ट्स आणि उलुवातु केचक समाविष्ट",
          "कमी बजेटमध्ये पहिल्यांदा जाणाऱ्या गटांसाठी",
        ],
        chips: ["शाकाहारी", "जैन", "गट"],
      },
      {
        slug: "active-bali",

        tag: "साहस",
        name: "अ‍ॅक्टिव्ह बाली",
        meta: "5 दिवस · 4 रात्री · अयुंग, माउंट बातुर, नुसा पेनिदा",
        price: "₹62,000",
        why: [
          "ट्रेकच्या दिवसांसाठी जास्त प्रथिनांची शाकाहारी आणि व्हीगन जेवण योजना",
          "बातुरचा सूर्योदय, सोबत नियमाप्रमाणे बांधलेली न्याहारी",
          "एकाच आठवड्यात राफ्टिंग, ATV आणि स्नॉर्कलिंग",
        ],
        chips: ["शाकाहारी", "व्हीगन", "सक्रिय"],
      },
    ],
  },

  langs: {
    heading: "तुमच्या आई-वडिलांना त्यांचे जेवण इंग्रजीत समजावून सांगावे लागू नये.",
    sub: "बालीतील आमच्या गाइड नेटवर्कमध्ये भारतीय भाषा बोलणारे आहेत — मंदिरातील शिष्टाचार, उपवासाचे दिवस आणि कुटुंबाच्या प्रवासाची लय — दोन्ही बाजूंची समजणारे.",
  },

  close: {
    heading: "तुमच्या तारखा सांगा. आम्ही तीन कोट घेऊन परत येऊ.",
    body: "प्रमाणित पुरवठादारांकडून, 24 तासांत, प्रत्येकाची पूर्ण किंमत आणि प्रत्येक जेवणाचे रेटिंग आधीच जोडलेले. कॉल सेंटर नाही, सतत येणारे ईमेल नाहीत.",
    cta1: "माझ्या तारखांपासून सुरू करा",
    cta2: "पुरवठादार म्हणून माझा व्यवसाय जोडा",
  },

  brand: {
    heading: "चिन्ह",
    body: "<em>चंडी बेंतार</em> — बालीच्या मंदिर प्रांगणाचे प्रवेशद्वार दर्शवणारा दुभंगलेला दरवाजा. पायऱ्यांसारखे दोन स्तंभ, मध्ये एक वाट, आणि त्या मोकळ्या जागेतून उगवणारा सूर्य. आत जाण्यासाठी तुम्ही त्यातूनच जाता.",
    scale: "आकार",
    full: "पूर्ण",
    favicon: "20px · फेविकॉन",
    reversed: "उलटे",
    reversedBody: "आयव्हरी स्तंभ, केशरी सूर्य. गडद हिरव्या आणि फोटो पार्श्वभूमीसाठी.",
    palette: "रंग — अपरिवर्तित",
    paletteBody: "प्रत्येक रंग आधीपासून तुमच्या कोडमध्ये आहे. नवीन काहीही जोडलेले नाही.",
  },

  footer: {
    tagline: "बालीसाठी प्रमाणित शाकाहारी, जैन आणि व्हीगन समूह प्रवास.",
    note: "फोटो आणि रंग सध्याच्या साइटवरून.",
  },

  auth: {
    signIn: "साइन इन",
    signOut: "साइन आउट",
    account: "माझे खाते",
    heading: "पासवर्ड नाही. फक्त एक कोड.",
    sub: "तुमचा ईमेल किंवा मोबाइल क्रमांक द्या, आम्ही सहा अंकी कोड पाठवू. लक्षात ठेवायला पासवर्ड नाही, चोरायला काहीच नाही.",
    useEmail: "ईमेल",
    useMobile: "मोबाइल",
    emailLabel: "ईमेल पत्ता",
    emailPlaceholder: "tumcha@example.com",
    mobileLabel: "मोबाइल क्रमांक",
    mobilePlaceholder: "+91 98765 43210",
    continue: "मला कोड पाठवा",
    sending: "पाठवत आहे…",
    codeHeading: "सहा अंकी कोड टाका",
    codeSentTo: "आम्ही पाठवला",
    codeLabel: "सहा अंकी कोड",
    verify: "साइन इन करा",
    verifying: "तपासत आहे…",
    resend: "नवीन कोड पाठवा",
    resendIn: "दुसरा मागण्यासाठी",
    seconds: "से",
    changeContact: "दुसरा पत्ता वापरा",
    expiresNote: "कोड दहा मिनिटांत संपतो आणि एकदाच चालतो.",
    errInvalid: "हा कोड बरोबर नाही.",
    errExpired: "हा कोड संपला आहे. नवीन मागा.",
    errLocked: "खूप वेळा चुकीचा प्रयत्न. नवीन कोड मागा.",
    errRate: "खूप विनंत्या. कृपया थोडा वेळ थांबा.",
    errNetwork: "सर्व्हरपर्यंत पोहोचता आले नाही. कनेक्शन तपासून पुन्हा प्रयत्न करा.",
    errGeneric: "काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.",
    welcomeNew: "स्वागत आहे. तुमचे खाते तयार आहे.",
  },

  account: {
    heading: "तुमचे खाते",
    signedInAs: "साइन इन",
    role: "भूमिका",
    roleTraveller: "प्रवासी",
    roleVendor: "पुरवठादार",
    roleAdmin: "अ‍ॅडमिन",
    tripsHeading: "तुमचे प्रवास",
    tripsEmpty: "तुम्ही अजून कोणताही प्रवास आखलेला नाही.",
    tripsEmptyCta: "प्रवास आखा",
    bookingsHeading: "बुकिंग",
    bookingsEmpty: "अजून काहीही बुक झालेले नाही. बुकिंग इथे व्हाउचर आणि पेमेंट वेळापत्रकासह दिसेल.",
    payNow: "आता पेमेंट करा",
    paying: "पेमेंट उघडत आहे…",
    paid: "पेमेंट झाले — बुकिंग कन्फर्म",
    holdExpired: "सीट होल्ड संपला — पुन्हा बुक करण्यासाठी संपर्क करा",
    awaitingPayment: "पेमेंटची वाट",
    confirmed: "कन्फर्म",
    payErrSetup: "ऑनलाइन पेमेंट अजून सेट नाही. तुमच्या सीट होल्ड आहेत.",
    payErrGeneric: "पेमेंट पूर्ण झाले नाही. दोनदा चार्ज नाही. पुन्हा प्रयत्न करा.",
    savedHeading: "जतन केलेली पॅकेजेस",
    savedEmpty: "तुम्ही जतन केलेली पॅकेजेस इथे दिसतील.",
    browseCta: "पॅकेजेस पहा",
    protocolNote: "तुमचा आहार नियम एकदा ठरवा, आम्ही बनवलेला प्रत्येक कार्यक्रम तो पाळेल.",

    reviewHeading: "Leave a rating",
    reviewSubmit: "Submit rating",
    reviewThanks: "Thank you — your rating is saved.",
    reviewPrompt: "Rate this provider",
  },

};
