Deck.slots.act1 = function (B) {
  const scenes = [
  [
    "Muttaka · مُتَّكَأ",
    [
      [
        "Muttaka",
        "مُتَّكَأ",
        "Coworking Pass · Saudi Arabia’s B2B2C workspace ecosystem",
        "Welcome the committee at Umm Al-Qura University’s College of Computer and Information Systems. Introduce Anas Saeed Alghamdi, Mohammed Al-Qurashi and Abdullah Malki. Our project asks how a person who needs a desk for one afternoon can use capacity that a venue already has.",
        "نرحب بلجنة التقييم في كلية الحاسب الآلي ونظم المعلومات بجامعة أم القرى. يقدم المشروع أنس سعيد الغامدي ومحمد القرشي وعبدالله مالكي. بدأنا بسؤال بسيط: كيف يستفيد شخص يحتاج إلى مكتب لفترة قصيرة من مقعد متاح فعلاً لدى إحدى المساحات؟"
      ],
      [
        "Room for flexible work",
        "Vision 2030",
        "Anas Saeed Alghamdi · Mohammed Al-Qurashi · Abdullah Malki",
        "Use the four lights to locate Riyadh, Jeddah, Makkah and Khobar. They illustrate the geography of the idea. Connect flexible work to the aspirations of Vision 2030. A freelancer and a distributed team both need access that can change with their schedules.",
        "تمثل النقاط الرياض وجدة ومكة والخبر وتوضح النطاق الجغرافي للفكرة. اربط العمل المرن بتطلعات رؤية 2030. يحتاج المستقل والفريق الذي يعمل عن بعد إلى مكان يمكن اختياره حسب جدول العمل المتغير."
      ]
    ]
  ],
  [
    "Market friction",
    [
      [
        "A desk for a day",
        "The lease lasts longer",
        "Imagine a small team planning a single workshop.",
        "Ask the committee to picture a team meeting for one afternoon. A long lease brings commitments far beyond that meeting. The team starts comparing providers, opening separate listings and contacting each venue to ask the same questions about time, seats and price.",
        "تخيلوا فريقاً يحتاج إلى قاعة لورشة واحدة بعد الظهر. يترتب على الإيجار الطويل التزام يتجاوز حاجته. يبدأ الفريق بمراجعة إعلانات متفرقة والتواصل مع كل مزود ليسأل عن الوقت والمقاعد والسعر."
      ],
      [
        "An empty desk",
        "An invisible opening",
        "Fragmented availability",
        "Now tell the same story from the operator’s side. A vacant desk brings in nothing while it sits empty. A customer may be looking for precisely that desk nearby. When neither side can see the other’s schedule, useful space and real demand pass each other by.",
        "انظروا إلى المسألة من جانب المشغّل. يبقى المقعد فارغاً رغم وجود عميل قريب يحتاج إليه في الوقت نفسه. وعندما لا تتاح معلومات الإشغال في مكان واحد تصبح مطابقة الطلب مع المعروض مهمة يدوية بطيئة."
      ]
    ]
  ],
  [
    "The B2B2C ecosystem",
    [
      [
        "One shared inventory",
        "B2B → Muttaka → B2C",
        "Desks · offices · meeting rooms",
        "Follow the particles as the two groups connect. A partner defines what can be booked, when it opens and how much it costs. A customer sees a bookable section of that inventory. This is the connection that makes the business model B2B2C.",
        "تابعوا التقاء المجموعتين. يحدد الشريك المساحات المتاحة ومواعيدها وأسعارها، ثم يرى العميل الجزء القابل للحجز منها. تقوم المنصة بدور الوسيط التقني والتجاري بين مشغّل المكان والمستفيد النهائي."
      ],
      [
        "One reservation",
        "Two sides stay in sync",
        "Availability → reservation → capacity",
        "Return to the workshop. Once the customer reserves the room, the operator needs that commitment reflected in capacity. Explain why discovery alone solves only half the problem. The customer and the venue must be able to act on the same reservation.",
        "نعود إلى مثال الورشة. عند حجز القاعة يحتاج المشغّل إلى رؤية أثر الحجز على السعة المتبقية. فالعثور على المكان خطوة أولى، وتكتمل الرحلة حين يعتمد الطرفان على سجل الحجز نفسه."
      ]
    ]
  ]
];
  for (const [title, beats] of scenes) B.sequence(title, beats);
};
