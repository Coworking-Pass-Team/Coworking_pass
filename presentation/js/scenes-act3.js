Deck.slots.act3 = function (B) {
  const scenes = [
  [
    "Full-stack architecture",
    [
      [
        "A request begins",
        "Next.js App Router",
        "TypeScript · Tailwind CSS · React",
        "Trace one request from the seat the customer chose. The Next.js interface renders the available actions, and Tailwind styles the experience. TypeScript helps maintain consistent data shapes across the codebase. The browser can express a choice. The API decides whether the choice is allowed.",
        "تتبع الطلب من المقعد الذي اختاره العميل. تعرض واجهة Next.js الخيارات وتُنسّق باستخدام Tailwind. تساعد TypeScript على اتساق أنواع البيانات. يرسل المتصفح رغبة العميل، ويتخذ الخادم قرار السماح بتنفيذها."
      ],
      [
        "The API decides",
        "Prisma ORM",
        "Authenticate → authorize → transact",
        "Move to the server-side route. Explain the sequence using the booking example. Identify the caller, check their right to act on this resource, read the catalog price, then write the reservation and ledger entries in a Prisma transaction. A typed interface alone cannot enforce ownership.",
        "انتقل إلى مسار الخادم واشرح ترتيب الخطوات. نحدد هوية صاحب الطلب ونتحقق من حقه في استخدام المورد ونقرأ السعر من الدليل، ثم نكتب الحجز وقيود المحفظة في معاملة Prisma واحدة. فحص الأنواع وحده لا يضمن الملكية."
      ],
      [
        "Where records live",
        "Neon PostgreSQL",
        "Serverless API · Vercel deployment target",
        "Follow the write to PostgreSQL. The database provides durable records and transaction boundaries across requests. Neon is the database platform and Vercel is the deployment target in the architecture. Use this boundary to introduce the audit question: what must still hold when a request arrives from outside the interface?",
        "تتبع الكتابة إلى PostgreSQL حيث تُحفظ السجلات وتُضبط حدود المعاملات بين الطلبات. تستخدم البنية Neon للبيانات وتستهدف Vercel للنشر. عند هذا الحد اسأل: ما الضمانات التي يجب أن تبقى صحيحة إذا أتى الطلب من خارج الواجهة؟"
      ]
    ]
  ],
  [
    "Ten audit findings",
    [
      [
        "Ten findings resolved",
        "Identity and funding",
        "F-01  JWT role forgery   /   F-02  Unbacked deposits",
        "Introduce the ten findings from the penetration assessment and Burp Suite review. Begin with two authority decisions. Token verification enforces the signing policy. Wallet funding requires an authorized administrator. For F-02 the audit records code inspection as evidence for the role restriction.",
        "قدّم النتائج العشر لتقييم الاختراق ومراجعة Burp Suite. ابدأ بصلاحيتين: يفرض التحقق من الرمز سياسة التوقيع، ويتطلب تمويل المحفظة صلاحية المسؤول. يسجل التدقيق مراجعة الشيفرة دليلاً على قيد الصلاحية في النتيجة الثانية."
      ],
      [
        "Refund what was paid",
        "An auditable settlement",
        "F-03  Payment and refund chain   /   F-04  Catalog-price fallback",
        "Explain the difference between a plan’s current list price and the amount someone paid. A refund needs the owner’s successful wallet settlement. A payment record asserted by the client cannot establish that money moved. The subscription refund follows the same principle when a payment is missing.",
        "اشرح الفرق بين سعر الخطة في الدليل والمبلغ المدفوع فعلاً. يتطلب الاسترداد عملية دفع ناجحة مرتبطة بصاحبها. لا يكفي أن يصرح العميل بنجاح الدفع، ولا يمكن الاعتماد على سعر الدليل عند غياب سجل السداد."
      ],
      [
        "Bound every request",
        "Amount, attempts, ownership",
        "F-05  Negative amounts   /   F-06  OTP rate limits   /   F-07  Subscription IDOR",
        "Three checks protect different resources. Validate a monetary amount before rounding it. Limit one-time-code attempts per account across concurrent requests. Check ownership against the stored subscription before allowing access. Each decision belongs on the server, where every client encounters it.",
        "تحمي الضوابط الثلاثة موارد مختلفة. يُفحص المبلغ قبل التقريب، وتُقيّد محاولات رمز التحقق لكل حساب حتى مع الطلبات المتزامنة، وتُراجع ملكية الاشتراك قبل السماح بالوصول. تنفذ الضوابط على الخادم لتطبق على جميع العملاء."
      ],
      [
        "Control what leaves",
        "Safe public reads",
        "F-08  Stored JSON-LD XSS   /   F-09  Partner over-fetching   /   F-10  Admin auto-seeding",
        "Finish at the public interface. Encode names safely when embedding structured data. Return only the partner fields a public listing needs. A public read on an empty catalog now stays a read, and administrator provisioning is explicit. Invite the committee to compare output encoding, field selection and side-effect control.",
        "اختم بالواجهة العامة. تُرمّز الأسماء بأمان عند تضمين البيانات المنظمة، وتُعاد فقط حقول الشريك اللازمة للعرض. تظل قراءة دليل فارغ عملية قراءة، ويجري إنشاء المسؤول بإجراء صريح. هذه ضوابط للترميز وللحقول وللآثار الجانبية."
      ]
    ]
  ],
  [
    "Verification at the audit baseline",
    [
      [
        "129 / 129",
        "Vitest tests passed",
        "15 test files · 100% pass rate · audit baseline 19fb9e1",
        "Each point along the check represents a passing test in the audit snapshot. The denominator is the executed suite. Describe one regression the committee can recognize: a failed wallet settlement must leave no booking behind. That gives a passing test a business meaning.",
        "تمثل كل نقطة على علامة التحقق اختباراً ناجحاً ضمن نسخة التدقيق. المقام هو عدد الاختبارات المنفذة. اذكر مثالاً واضحاً: فشل تسوية المحفظة يجب ألا يترك حجزاً قائماً. هكذا يصبح لنجاح الاختبار معنى تشغيلي."
      ],
      [
        "Both type checks passed",
        "tsc --noEmit",
        "Frontend + backend · production build pending in audit report",
        "Explain the layers of evidence. Type checking caught no compilation errors in either project. Vitest checked application behavior with database transactions mocked. The final audit table leaves browser end-to-end, production bundle and real database concurrency checks pending. These are distinct deployment gates.",
        "اشرح طبقات الدليل. اجتاز المشروعان فحص الأنواع بلا أخطاء. اختبر Vitest سلوك التطبيق باستخدام محاكاة لمعاملات قاعدة البيانات. ويسجل التقرير النهائي أن اختبار المتصفح الشامل وبناء الإنتاج والتحقق من التزامن على قاعدة حقيقية ما زالت خطوات تحقق مستقلة."
      ]
    ]
  ]
];
  for (const [title, beats] of scenes) B.sequence(title, beats);
};
