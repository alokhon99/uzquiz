// Uzquiz savollar bazasi. Bu fayl savollar muharriri (admin.html) tomonidan yaratiladi.
// Variantli savollarda `answer` — `options` dagi to'g'ri javob indeksi (0–3).
// Matnli savollarda `answer` — asosiy javob, `alts` — qabul qilinadigan muqobillar.
export const ROUNDS = [
  {
    "id": 1,
    "title": "Rasmli savollar",
    "icon": "🖼️",
    "color": "#7C5CFF",
    "description": "Rasmga diqqat bilan qarang va to'g'ri javobni tanlang. Oson savollar bilan qiziqarli boshlaymiz!",
    "type": "options",
    "timeLimit": 20,
    "questions": [
      {
        "image": "🍎",
        "text": "Rasmda qanday meva tasvirlangan?",
        "options": [
          "Olma",
          "Nok",
          "Anor",
          "Shaftoli"
        ],
        "answer": 0
      },
      {
        "image": "🐘",
        "text": "Bu qanday hayvon?",
        "options": [
          "Fil",
          "Ot",
          "Tuya",
          "Karkidon"
        ],
        "answer": 0,
        "fact": "Fil — quruqlikdagi eng katta sutemizuvchi hayvon."
      },
      {
        "imageSvg": "<svg viewBox=\"0 0 250 125\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\" aria-label=\"Bayroq\">\n  <rect width=\"250\" height=\"125\" fill=\"#fff\"/>\n  <rect width=\"250\" height=\"40\" fill=\"#0099B5\"/>\n  <rect y=\"85\" width=\"250\" height=\"40\" fill=\"#1EB53A\"/>\n  <rect y=\"40\" width=\"250\" height=\"3\" fill=\"#CE1126\"/>\n  <rect y=\"82\" width=\"250\" height=\"3\" fill=\"#CE1126\"/>\n  <circle cx=\"30\" cy=\"20\" r=\"12\" fill=\"#fff\"/>\n  <circle cx=\"35\" cy=\"20\" r=\"12\" fill=\"#0099B5\"/>\n  <g fill=\"#fff\">\n    <circle cx=\"62\" cy=\"10\" r=\"2.6\"/><circle cx=\"74\" cy=\"10\" r=\"2.6\"/><circle cx=\"86\" cy=\"10\" r=\"2.6\"/><circle cx=\"50\" cy=\"20\" r=\"2.6\"/><circle cx=\"62\" cy=\"20\" r=\"2.6\"/><circle cx=\"74\" cy=\"20\" r=\"2.6\"/><circle cx=\"86\" cy=\"20\" r=\"2.6\"/><circle cx=\"38\" cy=\"30\" r=\"2.6\"/><circle cx=\"50\" cy=\"30\" r=\"2.6\"/><circle cx=\"62\" cy=\"30\" r=\"2.6\"/><circle cx=\"74\" cy=\"30\" r=\"2.6\"/><circle cx=\"86\" cy=\"30\" r=\"2.6\"/>\n  </g>\n</svg>",
        "text": "Bu qaysi davlatning bayrog'i?",
        "options": [
          "O'zbekiston",
          "Qozog'iston",
          "Tojikiston",
          "Ozarbayjon"
        ],
        "answer": 0,
        "fact": "O'zbekiston bayrog'idagi 12 yulduz 12 oyni anglatadi."
      },
      {
        "image": "🐪",
        "text": "Cho'lda yashaydigan bu hayvon nima deb ataladi?",
        "options": [
          "Tuya",
          "Ot",
          "Eshak",
          "Qo'y"
        ],
        "answer": 0,
        "fact": "Tuya suv ichmasdan bir necha hafta yura oladi."
      },
      {
        "image": "🍉",
        "text": "Bu poliz mahsulotining nomi nima?",
        "options": [
          "Tarvuz",
          "Qovun",
          "Qovoq",
          "Bodring"
        ],
        "answer": 0
      },
      {
        "image": "⚽",
        "text": "Bu to'p qaysi sport turida ishlatiladi?",
        "options": [
          "Futbol",
          "Basketbol",
          "Tennis",
          "Voleybol"
        ],
        "answer": 0
      },
      {
        "image": "🌙",
        "text": "Rasmda nima tasvirlangan?",
        "options": [
          "Oy",
          "Quyosh",
          "Yulduz",
          "Bulut"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": 2,
    "title": "Bilimdon",
    "icon": "🧠",
    "color": "#00C2A8",
    "description": "Umumiy bilim savollari. Har bir savolga 4 ta javob varianti beriladi — faqat bittasi to'g'ri.",
    "type": "options",
    "timeLimit": 30,
    "questions": [
      {
        "text": "O'zbekistonda nechta viloyat bor?",
        "options": [
          "12",
          "13",
          "14",
          "10"
        ],
        "answer": 0,
        "fact": "12 viloyat, Qoraqalpog'iston Respublikasi va Toshkent shahri."
      },
      {
        "text": "Dunyodagi eng katta okean qaysi?",
        "options": [
          "Tinch okeani",
          "Atlantika okeani",
          "Hind okeani",
          "Shimoliy Muz okeani"
        ],
        "answer": 0
      },
      {
        "text": "Amir Temur qaysi shahar yaqinida tug'ilgan?",
        "options": [
          "Shahrisabz (Kesh)",
          "Samarqand",
          "Buxoro",
          "Termiz"
        ],
        "answer": 0,
        "fact": "Amir Temur 1336-yilda Kesh yaqinidagi Xo'ja Ilg'or qishlog'ida tug'ilgan."
      },
      {
        "text": "Kabisa bo'lmagan yilda necha kun bor?",
        "options": [
          "365",
          "364",
          "366",
          "360"
        ],
        "answer": 0
      },
      {
        "text": "Qaysi sayyora \"Qizil sayyora\" deb ataladi?",
        "options": [
          "Mars",
          "Venera",
          "Yupiter",
          "Saturn"
        ],
        "answer": 0
      },
      {
        "text": "Suvning kimyoviy formulasi qanday?",
        "options": [
          "H₂O",
          "CO₂",
          "O₂",
          "NaCl"
        ],
        "answer": 0
      },
      {
        "text": "O'zbekiston mustaqilligi qaysi yili e'lon qilingan?",
        "options": [
          "1991",
          "1990",
          "1992",
          "1989"
        ],
        "answer": 0,
        "fact": "Mustaqillik 1991-yil 31-avgustda e'lon qilingan."
      }
    ]
  },
  {
    "id": 3,
    "title": "So'z zanjiri",
    "icon": "🔗",
    "color": "#FF8A3D",
    "description": "Javobni yozing. Har bir keyingi javob oldingi javobning oxirgi harfi bilan boshlanadi! Harf va harflar soni yordam sifatida ko'rsatiladi.",
    "type": "text",
    "timeLimit": 45,
    "questions": [
      {
        "text": "O'zbekiston Respublikasining poytaxti qaysi shahar?",
        "answer": "Toshkent"
      },
      {
        "text": "Yozda pishadigan, ichi qizil, katta yumaloq poliz mevasi?",
        "answer": "Tarvuz"
      },
      {
        "text": "Terisi oq-qora yo'l-yo'l bo'lgan, otga o'xshash Afrika hayvoni?",
        "answer": "Zebra"
      },
      {
        "text": "Ichida yuzlab qizil donachalari bo'lgan, \"jannat mevasi\" deb ataluvchi meva?",
        "answer": "Anor"
      },
      {
        "text": "Musulmonlar ro'za tutadigan muqaddas oy?",
        "answer": "Ramazon",
        "alts": [
          "Ramazon oyi",
          "Ramadan"
        ]
      },
      {
        "text": "Tandirda yopiladigan, o'zbek dasturxonining eng aziz ne'mati?",
        "answer": "Non"
      },
      {
        "text": "\"Xamsa\" asarini yozgan buyuk o'zbek shoiri kim?",
        "answer": "Navoiy",
        "alts": [
          "Alisher Navoiy",
          "Nizomiddin Mir Alisher Navoiy"
        ]
      }
    ]
  },
  {
    "id": 4,
    "title": "Kino olami",
    "icon": "🎬",
    "color": "#FF4D8D",
    "description": "Jahon va o'zbek kinosi haqidagi savollar. Sevimli filmlaringizni eslang!",
    "type": "options",
    "timeLimit": 30,
    "questions": [
      {
        "text": "\"Titanik\" (1997) filmida Jek rolini kim ijro etgan?",
        "options": [
          "Leonardo DiKaprio",
          "Bred Pitt",
          "Tom Kruz",
          "Jonni Depp"
        ],
        "answer": 0
      },
      {
        "text": "\"Shum bola\" filmi qaysi yozuvchining qissasi asosida suratga olingan?",
        "options": [
          "G'afur G'ulom",
          "Abdulla Qodiriy",
          "Cho'lpon",
          "Oybek"
        ],
        "answer": 0,
        "fact": "\"Shum bola\" filmi 1977-yilda suratga olingan."
      },
      {
        "text": "\"Garri Potter\" filmlaridagi sehrgarlik maktabi qanday nomlanadi?",
        "options": [
          "Xogvarts",
          "Narniya",
          "Olimp",
          "Atlantida"
        ],
        "answer": 0
      },
      {
        "text": "\"Sher qirol\" multfilmidagi bosh qahramon — sher bolasining ismi nima?",
        "options": [
          "Simba",
          "Mufasa",
          "Nala",
          "Skar"
        ],
        "answer": 0
      },
      {
        "text": "Kino sohasidagi eng nufuzli xalqaro mukofot qaysi?",
        "options": [
          "Oskar",
          "Grammi",
          "Nobel",
          "Emmi"
        ],
        "answer": 0
      },
      {
        "text": "\"Avatar\" filmining rejissyori kim?",
        "options": [
          "Jeyms Kemeron",
          "Stiven Spilberg",
          "Kristofer Nolan",
          "Jorj Lukas"
        ],
        "answer": 0
      },
      {
        "text": "Charli Chaplin qaysi turdagi kinoning afsonaviy yulduzi bo'lgan?",
        "options": [
          "Ovozsiz kino",
          "3D kino",
          "Animatsion kino",
          "Hujjatli kino"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": 5,
    "title": "Musiqa sadosi",
    "icon": "🎵",
    "color": "#3DA9FF",
    "description": "Musiqa, cholg'u asboblari va xonandalar haqidagi savollar.",
    "type": "options",
    "timeLimit": 30,
    "questions": [
      {
        "text": "Qaysi musiqa asbobida odatda 88 ta klavish bo'ladi?",
        "options": [
          "Fortepiano",
          "Gitara",
          "Skripka",
          "Akkordeon"
        ],
        "answer": 0
      },
      {
        "text": "Qaysi biri o'zbek milliy urma cholg'u asbobi?",
        "options": [
          "Doira",
          "Dutor",
          "Nay",
          "Rubob"
        ],
        "answer": 0
      },
      {
        "text": "\"Shashmaqom\" qaysi san'at turiga tegishli?",
        "options": [
          "Mumtoz musiqa",
          "Raqs",
          "Rassomlik",
          "Me'morchilik"
        ],
        "answer": 0,
        "fact": "Shashmaqom YuNESKOning nomoddiy madaniy meros ro'yxatiga kiritilgan."
      },
      {
        "text": "\"Oy nuri\" sonatasining muallifi kim?",
        "options": [
          "Betxoven",
          "Motsart",
          "Bax",
          "Chaykovskiy"
        ],
        "answer": 0
      },
      {
        "text": "Nomi \"ikki tor\" degan ma'noni anglatuvchi o'zbek xalq cholg'usi?",
        "options": [
          "Dutor",
          "Tanbur",
          "G'ijjak",
          "Chang"
        ],
        "answer": 0
      },
      {
        "text": "\"Pop qiroli\" deb nom olgan xonanda kim?",
        "options": [
          "Maykl Jekson",
          "Elvis Presli",
          "Fredi Merkyuri",
          "Stivi Uander"
        ],
        "answer": 0
      },
      {
        "text": "Musiqada nechta asosiy nota bor (do, re, mi…)?",
        "options": [
          "7",
          "5",
          "6",
          "8"
        ],
        "answer": 0
      }
    ]
  },
  {
    "id": 6,
    "title": "Yashirin mavzu",
    "icon": "🕵️",
    "color": "#FFC53D",
    "description": "Dastlabki 6 ta savolning javoblari bitta yashirin mavzu bilan bog'liq. 7-savolda o'sha mavzuni toping va yozing! (20 ochko)",
    "type": "options",
    "timeLimit": 30,
    "hiddenTheme": "Samarqand",
    "questions": [
      {
        "text": "Uchta madrasadan iborat mashhur me'moriy ansambl qaysi?",
        "options": [
          "Registon",
          "Labi hovuz",
          "Ichan qal'a",
          "Ko'kaldosh"
        ],
        "answer": 0
      },
      {
        "text": "XV asrda mashhur rasadxona qurdirgan olim-hukmdor kim?",
        "options": [
          "Mirzo Ulug'bek",
          "Al-Xorazmiy",
          "Ibn Sino",
          "Beruniy"
        ],
        "answer": 0
      },
      {
        "text": "Amir Temur dafn etilgan maqbara qanday nomlanadi?",
        "options": [
          "Go'ri Amir",
          "Toj Mahal",
          "Oqsaroy",
          "Somoniylar maqbarasi"
        ],
        "answer": 0
      },
      {
        "text": "Nomi \"Tirik shoh\" ma'nosini anglatuvchi maqbaralar majmuasi?",
        "options": [
          "Shohi Zinda",
          "Chor Minor",
          "Poi Kalon",
          "Bolo hovuz"
        ],
        "answer": 0
      },
      {
        "text": "Amir Temurning suyukli rafiqasi nomi bilan ataluvchi jome masjidi?",
        "options": [
          "Bibixonim",
          "Juma masjidi",
          "Hazrati Imom",
          "Kalon masjidi"
        ],
        "answer": 0
      },
      {
        "text": "Bibixonim masjidi yonidagi mashhur qadimiy bozor?",
        "options": [
          "Siyob bozori",
          "Chorsu bozori",
          "Oloy bozori",
          "Eski Juva"
        ],
        "answer": 0
      },
      {
        "type": "text",
        "final": true,
        "timeLimit": 60,
        "points": 20,
        "text": "Yuqoridagi barcha javoblarni qaysi yashirin mavzu birlashtiradi?",
        "answer": "Samarqand",
        "alts": [
          "Samarkand",
          "Samarqand shahri",
          "Samarqand viloyati"
        ],
        "fact": "Registon, Go'ri Amir, Shohi Zinda, Bibixonim, Siyob bozori va Ulug'bek rasadxonasi — barchasi Samarqandda!"
      }
    ]
  }
];
