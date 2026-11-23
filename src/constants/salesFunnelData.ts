import type { Lead, FunnelStage } from '@/types/crm.types'

export interface FunnelStep {
  id: FunnelStage
  stepNumber: number
  title: string
  titleMr: string
  description: string
  actionLabel: string
  badgeColor: string
}

export const SALES_FUNNEL_STEPS: FunnelStep[] = [
  {
    id: 'New Lead',
    stepNumber: 1,
    title: 'Lead Outreach & Call',
    titleMr: 'कॉल आणि संपर्क',
    description: 'Lead coming from Careerfixx or Instagram. Connect on call and save contact.',
    actionLabel: 'Call Candidate',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  {
    id: 'Video Sent',
    stepNumber: 2,
    title: '10-Min Intro Video',
    titleMr: '10 मिनिट प्रेझेंटेशन व्हिडिओ',
    description: 'Send 10 min YouTube introduction video & free WhatsApp community link.',
    actionLabel: 'Send Video on WhatsApp',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: '15m Follow-up',
    stepNumber: 3,
    title: '15-Min Confirmation',
    titleMr: '15 मिनिटांनंतर फॉलो-अप',
    description: 'Confirm if candidate watched the entire presentation video.',
    actionLabel: 'Send 15m Check-in',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    id: 'Payment Pending (₹99)',
    stepNumber: 4,
    title: '₹99 QR Code & Registration',
    titleMr: '₹99 पेमेंट आणि QR कोड',
    description: 'If watched: send Paytm QR & UPI. If not watched: send urgency reminder.',
    actionLabel: 'Send QR & ₹99 Request',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    id: 'Seat Reserved',
    stepNumber: 5,
    title: 'Seat Reserved (Zoom Link)',
    titleMr: 'सीट कन्फर्म & Zoom लिंक',
    description: 'Send live session confirmation with Speaker Prateek Garg and Zoom link.',
    actionLabel: 'Send Seat Confirmation',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'Workshop Attended',
    stepNumber: 6,
    title: 'Workshop Attended',
    titleMr: 'वर्कशॉप पूर्ण केले',
    description: 'Candidate attended the live 7:00 PM masterclass.',
    actionLabel: 'Closing Call',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    id: 'Course Enrolled',
    stepNumber: 7,
    title: 'Course Enrolled',
    titleMr: 'कोर्स प्रवेश पूर्ण',
    description: 'Lead converted to premium course package.',
    actionLabel: 'Enrolled & Paid',
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
  },
]

export const PAYMENT_DETAILS = {
  payeeName: 'Jayesh Balaram Phale',
  upiId: '8975142143@ptsbi',
  amount: 99,
  qrCodeUrl: '/assets/jayesh_upi_qr.png',
  workshopTitle: 'Online Income Blueprint',
  speakerName: 'Mr. Prateek Garg',
  sessionTime: '7:00 PM',
  zoomLink: 'https://us06web.zoom.us/j/87539846326',
  videoLink: 'https://www.youtube.com/watch?v=nz7umc1hdq8',
  communityLink: 'https://whatsapp.com/channel/0029Vb8lE7B8F2pAwPukzB3v',
}

export const FUNNEL_TEMPLATES = {
  // 1. Intro 10 min Video Send
  introVideo: (_lead: Lead) =>
`काम समजून घेण्यासाठी हा 10 min चा व्हिडिओ पूर्ण पहा.

Video link 👇

${PAYMENT_DETAILS.videoLink}

Join now free community

${PAYMENT_DETAILS.communityLink}`,

  // 2. 15-Minute Follow-up Check-in
  followUp15Min: (_lead: Lead) =>
`Hey Hi,

मी तुम्हाला एक छोटासा Presentation Video पाठवला होता, ज्यामध्ये Online Work विषयी काही महत्त्वाच्या गोष्टी सांगितल्या आहेत.

फक्त एकदा Confirm करायचं होतं 👀

तुम्ही तो संपूर्ण Presentation Video पाहिला का?`,

  // 3A. If YES (Video Watched -> Send QR Code for ₹99)
  videoWatchedYes: (_lead: Lead) =>
`Perfect! 🎉

मी तुला वर QR Code पाठवला आहे. त्यावर ₹99 Payment करून मला Payment चा Screenshot पाठव.

त्यानंतर मी तुझं Workshop साठी Registration पूर्ण करून तुला Workshop ची Joining Link पाठवतो. 😊

UPI ID: ${PAYMENT_DETAILS.upiId}
नाव: ${PAYMENT_DETAILS.payeeName}
फी: ₹${PAYMENT_DETAILS.amount} मात्र`,

  // 3B. If NO (Video Not Watched -> Urgency reminder)
  videoWatchedNo: (_lead: Lead) =>
`please watch video as soon as possible and let me know because i have limited vacancy.`,

  // 4. Payment Completed -> Seat Reserved
  seatReserved: (_lead: Lead) =>
`‼️ Your Seat Is Reserved ‼️

Join our LIVE Online Session and discover how digital skills can help you create online income opportunities. 🚀

👤 Speaker: ${PAYMENT_DETAILS.speakerName}
📌 Topic: ${PAYMENT_DETAILS.workshopTitle}

 In this session, you’ll learn:
✅ Learn high-demand digital skills
✅ Explore online income opportunities
✅ Get a beginner-friendly roadmap

🔗 Join LIVE Here:
${PAYMENT_DETAILS.zoomLink}

🕖 ${PAYMENT_DETAILS.sessionTime} (Join 5 minutes early)

 ⏳ Join on time and don't miss this valuable learning opportunity!`,
}

export interface ObjectionItem {
  id: string
  category: '💰 फी आणि पैसे' | '⏰ वेळ आणि टाइमिंग' | '🛡️ फ्रॉड / विश्वास' | '👨‍👩‍👦 पालक आणि निर्णय' | '📱 कौशल्य आणि काम'
  objection: string
  keyPoint: string
  responseMr: string
}

export const OBJECTION_HANDLING_LIST: ObjectionItem[] = [
  {
    id: 'obj-1',
    category: '💰 फी आणि पैसे',
    objection: 'माझ्याकडे सध्या ₹99 / पैसे नाहीत.',
    keyPoint: '₹99 चहा-नाश्त्याएवढी रक्कम, रिस्क शून्य, करिअरचा रोडमॅप',
    responseMr:
`मी तुमची अडचण समजू शकतो. पण विचार करा, आज ₹99 आपण मित्र किंवा चहा-नाश्त्यावर सहज खर्च करतो. 

ही कोणती मोठी फी नाही, तर आजच्या 1 तासाच्या प्रॅक्टिकल सेशनसाठी घेतलेला अगदी नाममात्र टोकन चार्ज आहे — जेणेकरून फक्त सिरीयस विद्यार्थीच उपस्थित राहतील.

या 1 तासात तुम्हाला मोबाईलवरून घरबसल्या ऑनलाईन इन्कम कशी करायची याचा स्टेप-बाय-स्टेप रोडमॅप मिळेल. तुमच्या स्वतःच्या करिअरसाठी ₹99 ची एक संधी घ्यायला नक्कीच हरकत नाही. बरोबर ना? मी सीट रिझर्व्ह करू?`,
  },
  {
    id: 'obj-2',
    category: '💰 फी आणि पैसे',
    objection: 'आधी काम शिकवा किंवा मोफत द्या, कमाई झाल्यावर फी देतो.',
    keyPoint: 'डॉक्टर/इंजिनियर आधी शिकतात मग पगार, स्किल्स महत्त्वाच्या',
    responseMr:
`मित्रा, तुमचं म्हणणं समजलं! पण मला सांगा, आपण कॉलेज किंवा शाळेत शिकताना कधी असं म्हणतो का की "आधी मला नोकरी द्या, मग मी फी भरतो"? 

नाही, कारण कोणतीही गोष्ट शिकल्याशिवाय काम जमत नाही. आम्ही तुम्हाला आधी आवश्यक डिजिटल स्किल्स शिकवून सक्षम करतो जेणेकरून तुम्ही स्वतः कामातून पैसे कमवू शकाल. हा सेशन त्याच स्किल्सची ओळख करून देण्यासाठी आहे. ₹99 फक्त टोकन अमाऊंट आहे.`,
  },
  {
    id: 'obj-3',
    category: '🛡️ फ्रॉड / विश्वास',
    objection: 'हे फ्रॉड / फेक तर नाही ना? ऑनलाईन वर विश्वास कसा ठेवायचा?',
    keyPoint: 'कोणताही मोठा कोर्स नाही, मेंटॉर लाईव्ह Zoom वर स्क्रीन शेअर करून दाखवणार',
    responseMr:
`तुमचा हा प्रश्न अगदी रास्त आहे! कारण आजकाल सोशल मीडियावर बरेच खोटे दावे केले जातात. 

म्हणूनच आम्ही तुम्हाला कोणताही महागडा कोर्स डायरेक्ट विकत नाहीये. आमचे मेंटॉर प्रतीक गर्ग सर स्वतः लाईव्ह Zoom वर येऊन स्क्रीन शेअर करून सर्व प्रॅक्टिकल काम दाखवणार आहेत. 

₹99 फक्त सिरीयस लोकांसाठी ठेवलेले आहेत. तुम्ही आधी स्वतः आजचा 1 तासाचा लाईव्ह सेशन अटेंड करा, माहिती योग्य आणि खरी वाटली तरच पुढे निर्णय घ्या!`,
  },
  {
    id: 'obj-4',
    category: '🛡️ फ्रॉड / विश्वास',
    objection: 'कंपनी लीगल आहे का? ऑफिस कुठे आहे?',
    keyPoint: 'गव्हर्नमेंट रजिस्टर्ड, शेकडो विद्यार्थ्यांचे पुरावे आणि टेस्टिमोनियल्स',
    responseMr:
`हो, आमची सिस्टीम पूर्णपणे कायदेशीर आणि रजिस्टर्ड आहे. आम्ही विद्यार्थ्यांना डिजिटल स्किल्स, फ्रीलान्सिंग आणि सोशल मीडियाच्या माध्यमातून रिमोट इन्कमचे कायदेशीर मार्ग शिकवतो. 

सेशनमध्ये आमच्या कंपनीचे लीगल डॉक्युमेंट्स, प्रोजेक्ट्स आणि यशस्वी विद्यार्थ्यांचे रिझल्ट्स लाईव्ह दाखवले जातात. त्यामुळे काळजी करण्याचे काहीच कारण नाही.`,
  },
  {
    id: 'obj-5',
    category: '⏰ वेळ आणि टाइमिंग',
    objection: 'माझ्याकडे सध्या वेळ नाही / मी नंतर करतो.',
    keyPoint: 'वेळ कधीच नसतो, काढावा लागतो; 1 तास आजच्या संध्याकाळी 7 PM',
    responseMr:
`वेळ कोणाकडेच मोकळा नसतो, स्वतःच्या प्रगतीसाठी तो काढावा लागतो. 

जर आपण आज वेळ काढला नाही तर पुढच्या काही महिन्यांतही परिस्थिती तशीच राहील. हा सेशन फक्त 1 तासाचा आहे आणि संध्याकाळी 7:00 PM ला आहे — कॉलेज आणि जॉब संपवून तुम्ही घरून आरामात पाहू शकता. 

आजचा 1 तास तुमच्या भविष्याला नवी दिशा देऊ शकतो. बॅचच्या जागा मर्यादित आहेत, आजच संध्याकाळी अटेंड करा!`,
  },
  {
    id: 'obj-6',
    category: '⏰ वेळ आणि टाइमिंग',
    objection: 'मी संध्याकाळी 7:00 वाजता व्यस्त असतो, रेकॉर्डिंग मिळेल का?',
    keyPoint: 'लाईव्ह सेशनमध्ये प्रश्न विचारता येतात, रेकॉर्डिंग उपलब्ध नसते',
    responseMr:
`हा एक अत्यंत महत्त्वाचा आणि इंटरॅक्टिव्ह LIVE सेशन आहे, त्यामुळे याची रेकॉर्डिंग दिली जात नाही. 

लाईव्ह सेशनमध्ये तुम्ही स्वतः स्पीकर सरांशी बोलून तुमच्या सर्व शंकांचे निरसन करू शकता. संध्याकाळी 7:00 वाजता फक्त 1 तास नक्की मॅनेज करा, हा अनुभव रेकॉर्डिंगमध्ये कधीच मिळणार नाही.`,
  },
  {
    id: 'obj-7',
    category: '👨‍👩‍👦 पालक आणि निर्णय',
    objection: 'घरच्यांना / पालकांना विचारून सांगतो.',
    keyPoint: 'पालकांना माहिती कशी सांगणार? आधी स्वतः समजून घ्या किंवा सोबत बसवा',
    responseMr:
`नक्कीच! पालकांना सांगणं आणि त्यांचा सल्ला घेणं खूप चांगली सवय आहे. 

पण मला सांगा, जोपर्यंत तुम्ही स्वतः सेशन पाहून काम कसं चालतं हे समजून घेत नाही, तोपर्यंत तुम्ही पालकांना काय समजावून सांगणार? 

माझा सल्ला असा राहील: आज संध्याकाळी 7:00 वाजता तुम्ही स्वतः सेशन अटेंड करा आणि शक्य असल्यास पालकांनाही तुमच्यासोबत बसवा. पालक स्वतः पाहतील की आपला मुलगा नवीन आणि चांगल्या गोष्टी शिकत आहे, तर ते नक्कीच पाठिंबा देतील!`,
  },
  {
    id: 'obj-8',
    category: '📱 कौशल्य आणि काम',
    objection: 'मी कधी ऑनलाईन काम केलेलं नाही, मला काही जमेल का?',
    keyPoint: '0 लेव्हलपासून मराठीत, फक्त स्मार्टफोन आणि इंटरनेट पुरेसे',
    responseMr:
`तुम्हाला आधीचा काहीही अनुभव नसला तरी चालेल! या वर्कशॉपची रचनाच अशा लोकांसाठी केली आहे ज्यांनी कधीही ऑनलाईन काम केलेलं नाही. 

याच्यासाठी कोणत्याही कोडिंग किंवा मोठ्या लॅपटॉपची गरज नसते, तुमच्या हातातील स्मार्टफोन आणि इंटरनेट पुरेसं आहे. कॉलेज स्टुडंट्स, नोकरदार आणि गृहिणीसुद्धा हे सहज शिकत आहेत. तुम्हाला शून्य लेव्हलपासून स्टेप बाय स्टेप शिकवलं जाईल.`,
  },
  {
    id: 'obj-9',
    category: '📱 कौशल्य आणि काम',
    objection: 'काम नक्की काय असतं? कंपनी काय प्रॉडक्ट विकते?',
    keyPoint: 'डिजिटल स्किल्स, कंटेंट, सोशल मीडिया व एफिलिएट - लाईव्ह दाखवणार',
    responseMr:
`हे डिजिटल स्किल्सवर आधारित काम आहे — जसे की सोशल मीडिया मॅनेजमेंट, कंटेंट क्रिएशन आणि डिजिटल प्रोजेक्ट्स. 

काम नेमकं कसं करायचं, प्रोजेक्ट्स कुठून मिळतात आणि पैसे थेट खात्यात कसे येतात, हे सर्व आजच्या सेशनमध्ये स्क्रीन शेअर करून प्रॅक्टिकल दाखवलं जाणार आहे. म्हणूनच हा 1 तासाचा ओरिएंटेशन सेशन ठेवला आहे.`,
  },
  {
    id: 'obj-10',
    category: '💰 फी आणि पैसे',
    objection: 'मी विचार करून सांगतो / नंतर मेसेज करतो.',
    keyPoint: 'विचार करण्यात वेळ जातो, मर्यादित व्हॅकन्सी, त्वरित कृती महत्त्वाची',
    responseMr:
`विचार नक्की करा, पण विचार करण्यात जास्त वेळ घालवू नका कारण आजच्या बॅचसाठी मोजक्याच जागा शिल्लक आहेत. 

₹99 मध्ये आजच्या काळात काहीही येत नाही, पण आज घेतलेला हा एक छोटासा निर्णय तुमच्या करिअरसाठी मोठा ठरू शकतो. नंतर विचार करत बसण्यापेक्षा 1 तास देऊन सत्य जाणून घेणं कधीही फायद्याचं ठरेल. आत्ताच तुमची जागा निश्चित करा!`,
  },
]
