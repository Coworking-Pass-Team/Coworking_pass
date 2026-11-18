Deck.slots.act4 = function (B) {
  const scenes = [
  [
    "Saudi business impact",
    [
      [
        "A shorter commitment",
        "For freelancers and SMBs",
        "Flexible access to desks, offices and meeting rooms",
        "Return to the original workshop. A small business can choose a room for the period it actually needs. The venue gains another way to present unused capacity. This is the business value proposition. Measuring it would require observing completed bookings and net revenue over time.",
        "ارجع إلى مثال الورشة. تختار المنشأة الصغيرة القاعة للمدة المطلوبة فعلاً، ويحصل المشغّل على قناة لعرض السعة المتاحة. هذه هي القيمة المقترحة، ويحتاج قياسها إلى متابعة الحجوزات المكتملة وصافي الإيراد مع مرور الوقت."
      ],
      [
        "Up to 35%",
        "Partner revenue lift",
        "Illustrative industry projection · Saudi workspace occupancy optimization",
        "Present this explicitly as an illustrative industry projection for occupancy optimization in Saudi Arabia. The curve illustrates a scenario, and Muttaka has no measured uplift attached to it. Describe a pilot comparison using comparable rooms, opening hours, booking volume, realized rates and cancellations.",
        "قدّم نسبة تصل إلى ٣٥٪ بوصفها تصوراً توضيحياً لقطاع تحسين إشغال المساحات في السعودية. المنحنى يمثل سيناريو افتراضياً. لقياس الأثر الفعلي نقارن غرفاً وساعات عمل متشابهة ونراجع الحجوزات والأسعار المحصلة والإلغاءات."
      ]
    ]
  ],
  [
    "Production roadmap",
    [
      [
        "Validate the database",
        "Neon staging",
        "SQL check constraints · real concurrent requests",
        "Start rollout with the migration. Inspect historical ledger rows for values that conflict with the check constraints. Apply the migration in staging, then exercise concurrent debits and retries against real PostgreSQL. The transaction mocks in the unit suite answer a different question.",
        "ابدأ بترحيل قاعدة البيانات. افحص سجلات المحفظة القديمة بحثاً عن قيم تتعارض مع القيود. طبّق الترحيل في بيئة تجريبية ثم اختبر الخصم المتزامن وإعادة الطلب على PostgreSQL حقيقية."
      ],
      [
        "Rotate credentials",
        "Production readiness",
        "Signing keys · sessions · deployment checks",
        "Describe a coordinated deployment rehearsal. Provision a strong runtime signing key, rotate affected credentials, revoke affected sessions and confirm delivery of one-time codes. Review production builds and browser checks with the matching application and migration before enabling traffic.",
        "اشرح تجربة نشر منسقة: إعداد مفتاح توقيع قوي لوقت التشغيل وتدوير بيانات الاعتماد وإبطال الجلسات المتأثرة والتحقق من تسليم الرموز المؤقتة. تُراجع حزم الإنتاج واختبارات المتصفح مع إصدار التطبيق والترحيل المطابق."
      ],
      [
        "Extend discovery",
        "Mobile and AI matching",
        "Planned product work",
        "Close the roadmap with two product proposals. A mobile app would shorten the path from a nearby search to arrival. Matching could rank venues by the customer’s time, location and needs. Explain how a pilot would compare the suggestions with actual booking choices before wider release.",
        "اختم بمقترحين: تطبيق جوال يختصر الرحلة من البحث القريب إلى الوصول، ونظام مطابقة يرتب المساحات بحسب الوقت والموقع والاحتياج. يمكن اختبار جودة الاقتراحات بمقارنتها بخيارات الحجز الفعلية قبل التوسع."
      ]
    ]
  ],
  [
    "Committee defense",
    [
      [
        "Ready for review",
        "Committee sign-off",
        "Khaled Abdulghani · Lecturer Rami Alghamdi",
        "Address Khaled Abdulghani and Lecturer Rami Alghamdi. Summarize the evidence for review: the two-sided workspace journey, transactional settlement and ten remediated audit findings. Identify the staging checks still ahead, then submit the work for the committee’s assessment.",
        "توجّه إلى الأستاذ خالد عبدالغني والمحاضر رامي الغامدي. لخص للجنة رحلة الحجز للطرفين وتسوية المحفظة ضمن معاملة واحدة ومعالجة نتائج التدقيق العشر. اذكر خطوات التحقق المتبقية في البيئة التجريبية ثم اعرض العمل للتقييم."
      ],
      [
        "Questions",
        "مُتَّكَأ",
        "Umm Al-Qura University · College of Computer & Information Systems",
        "Give the emblem a moment to settle, then open the floor. If asked about booking correctness, return to page 5. For an audit decision use page 9, and for what the tests establish use page 10. Invite questions in English or Arabic.",
        "اترك الشعار يستقر لحظة ثم افتح المجال للأسئلة بالعربية أو الإنجليزية. عند السؤال عن صحة التسوية ارجع إلى الصفحة ٥، ولتفاصيل المعالجة الأمنية استخدم الصفحة ٩، ولحدود ما تثبته الاختبارات اعرض الصفحة ١٠."
      ]
    ]
  ]
];
  for (const [title, beats] of scenes) B.sequence(title, beats);
};
