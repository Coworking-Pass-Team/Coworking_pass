Deck.slots.act2 = function (B) {
  const scenes = [
  [
    "Discovery & booking",
    [
      [
        "Find a workspace",
        "Nearby, at the right time",
        "Location · availability · workspace type",
        "Walk through the afternoon workshop again. Begin with the city or nearby location, then narrow the results by time and space type. A meeting room has different capacity and privacy requirements from an individual desk. The floor plan illustrates that choice.",
        "ابدأ رحلة الورشة بالبحث في المدينة أو بالقرب من الموقع، ثم حدد الوقت ونوع المساحة. تختلف القاعة عن المكتب الفردي في السعة والخصوصية، ويوضح المخطط كيف تؤثر هذه الشروط في الاختيار."
      ],
      [
        "Choose a seat",
        "From plan to reservation",
        "Seat selection · direct booking",
        "Point at the highlighted desk. The visual is a booking illustration. Explain the difference between choosing a seat on screen and getting an accepted reservation. The server must use the section’s availability and stored price when it processes the booking.",
        "أشر إلى المقعد المضاء في المخطط التوضيحي. اختيار المقعد على الشاشة يعبر عن رغبة العميل. عند تأكيد الحجز يتحقق الخادم من بيانات القسم وتوافره ويحسب التكلفة من السعر المحفوظ."
      ],
      [
        "Come back next month",
        "A pass for repeat visits",
        "Tiered monthly memberships",
        "For a single workshop, a direct booking is straightforward. A regular visitor may prefer a membership. Explain how the catalog gives a plan a duration and price. Keep the distinction clear between buying a membership and redeeming a discount at checkout.",
        "الحجز المباشر مناسب للورشة الواحدة، أما الزائر المتكرر فقد يفضل الاشتراك. يحدد دليل الخطط مدة العضوية وسعرها. اشرح الفرق بين شراء الاشتراك واستخدام ميزة خصم عند الدفع."
      ]
    ]
  ],
  [
    "Wallet & settlement",
    [
      [
        "Prepaid balance",
        "A wallet with a ledger",
        "Funds available before checkout",
        "Move from the desk to the vault. A prepaid balance makes the checkout decision concrete. Explain where funding authority lives. The hardened checkout supports wallet funds, and the audit restricts direct funding to administrators pending a verified provider integration.",
        "انتقل من المقعد إلى الخزنة. يوضح الرصيد المسبق قدرة العميل على إتمام الحجز. في النسخة المعالجة أمنياً يقتصر التمويل المباشر على المسؤول، ويتطلب الشحن الذاتي ربطاً موثوقاً بمزود دفع."
      ],
      [
        "Settle once",
        "One transaction",
        "Booking + wallet debit + payment record",
        "Follow a booking through the transaction. The reservation, debit and successful wallet payment commit together. If the funds are insufficient, the booking rolls back. A repeated request with the same idempotency key can replay its result without charging the wallet twice.",
        "تتبع الحجز داخل المعاملة. يُسجّل الحجز والخصم وإثبات الدفع معاً. عند نقص الرصيد تُلغى العملية، وعند إعادة الطلب بالمفتاح نفسه تعيد المنصة النتيجة المحفوظة وتحمي العميل من تكرار الخصم."
      ]
    ]
  ],
  [
    "Loyalty & community",
    [
      [
        "Earn on a visit",
        "Points per riyal",
        "A configurable earning rule",
        "Use the trophy to introduce the loyalty model. Explain an earning rule in plain language. Eligible spending and the rate in effect determine the points. Changing the business rule gives the operator control over a campaign without hard-coding a rate into this talk.",
        "قدّم نموذج الولاء بمساعدة الكأس. يتحدد عدد النقاط بحسب الإنفاق المؤهل ومعدل الكسب الساري. يمكن للمشغّل تعديل القاعدة للحملة، ولذلك لا نفترض معدلاً ثابتاً لكل ريال."
      ],
      [
        "Give people a reason to return",
        "Promotional tiers",
        "Rewards follow published rules",
        "Describe a returning member deciding whether to book again. Promotions and tiers give the operator a way to reward participation. Draw the security boundary for the committee. A client-side points estimate cannot authorize a discounted debit. Server-side redemption is a separate delivery step.",
        "صف عميلاً يفكر في زيارة ثانية. تعطي المستويات والعروض للمشغّل وسيلة لمكافأة المشاركة. تقدير النقاط في المتصفح لا يجيز الخصم من المحفظة، وتطبيق الاستبدال الموثوق على الخادم خطوة مستقلة."
      ]
    ]
  ],
  [
    "Partner operations",
    [
      [
        "Open the doors",
        "Publish bookable space",
        "Onboarding · sections · pricing rules",
        "Switch to the venue operator. Before a customer can discover a desk, someone must describe the venue, define its sections, enter operating hours and publish rates. These inputs connect the partner portal to the customer's booking choices.",
        "انتقل إلى دور مشغّل المكان. قبل أن يجد العميل مقعداً، يعرّف الشريك المنشأة وأقسامها وساعات العمل وأسعارها. هذه البيانات هي الصلة بين عمليات الشريك والخيارات التي يراها العميل."
      ],
      [
        "Read the room",
        "Capacity and revenue",
        "Illustrative operations chart",
        "Walk the committee across the bars as an illustration of changing occupancy. Operators can compare capacity with bookings and review revenue figures. A busy room and a profitable room answer different questions, so the portal needs both views.",
        "استخدم الأعمدة لتوضيح تغير الإشغال. يقارن المشغّل السعة بالحجوزات ويراجع بيانات الإيراد. امتلاء القاعة وربحيتها مسألتان مختلفتان، ولذلك يحتاج الشريك إلى قراءة المؤشرين معاً."
      ],
      [
        "Close the period",
        "Partner settlements",
        "Visits → amount due → payout record",
        "Finish the product journey with settlement. The system tracks the billing period and amount due. Partners can submit a pending payout record for their venue, and administrators control settlement. A payout record alone does not establish that a bank transfer ran automatically.",
        "اختم رحلة المنتج بالتسوية. تحتفظ المنصة بفترة الفوترة والمبلغ المستحق. يستطيع الشريك تسجيل استحقاق معلق لمنشأته، ويدير المسؤول التسوية. ويظل تنفيذ التحويل البنكي خطوة مستقلة عن تسجيل الاستحقاق."
      ]
    ]
  ]
];
  for (const [title, beats] of scenes) B.sequence(title, beats);
};
