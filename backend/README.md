# Coworking Pass Backend

> **ملاحظة مهمة:** كل شخص يشغّل **قاعدة بيانات محلية خاصة به** (بجهازه فقط)  بياناتك التجريبية منفصلة تماماً عن باقي الفريق.

---

## 1. سحب المشروع

```powershell
git clone https://github.com/Coworking-Pass-Team/Coworking_pass.git
cd Coworking_pass\backend
git checkout develop
git pull origin develop
```

---

## 2. تثبيت المكتبات

```powershell
npm install
```
هذا يقرأ ملف `package.json` ويحمّل **كل** المكتبات اللي يحتاجها المشروع تلقائياً.

---

## 3. إعداد قاعدة بيانات محلية

### افتحي نافذة PowerShell **جديدة ومخصصة** لهذا (خليها مفتوحة طول وقت شغلك):
```powershell
cd Coworking_pass\backend
npx prisma dev --name coworkingpas
```

> **ليش `--name coworkingpass`؟** عشان تصير قاعدتك "مسمّاة" وثابتة — رابط الاتصال ما يتغيّر بكل مرة، وتقدرين توقفينها وترجعينها بأمان بدون ما تضيع بياناتك.

انتظري لين يطلع لك:
```
✔ Your local Prisma Postgres server default is now running 👍

🔌 To connect with Prisma ORM use the following connection strings:

   DATABASE_URL="postgres://postgres:postgres@localhost:XXXXX/template1?..."
```

**انسخي سطر `DATABASE_URL` كامل** — بتحتاجينه بالخطوة الجاية.

### كيف توقفينها وترجعينها بأمان (بدل قفل النافذة)
```powershell
# لإيقافها بأمان (يحفظ بياناتك):
npx prisma dev stop coworkingpass

# لتشغيلها من جديد لاحقاً (بنفس البيانات ونفس الرابط):
npx prisma dev start coworkingpass
```

> ⚠️ لو قفلتِ النافذة مباشرة (بزر X) بدل الأمر أعلاه، احتمال تفقدين بياناتك أو يتغيّر رابط الاتصال. الأفضل دايماً استخدام `stop`/`start`.

---

## 4. إعداد ملف `.env`

بنافذة **PowerShell ثانية** (خلي نافذة `prisma dev` شغالة بالأولى):

```powershell
cd Coworking_pass\backend
cp .env.example .env
code .env
```

### أ) `DATABASE_URL`
الصقي الرابط اللي نسختيه من الخطوة 4.

### ب) `JWT_SECRET`
أي نص طويل عشوائي، مثال:
```
JWT_SECRET="my-super-secret-dev-key-2026"
```

### ج) `RESEND_API_KEY` 

Resend هي الخدمة اللي يرسل منها المشروع كود التفعيل (OTP) للإيميل. كل شخص يسوي حسابه الخاص:

1. روحي لـ resend.com/signup وسجلي حساب مجاني
2. اضغطي **Create API Key**
3. اختاري أي اسم (مثال: `local-dev`)، واضغطي **Add**
4. **انسخي المفتاح فوراً** (يبدأ بـ `re_...`) — ما يظهر مرة ثانية بعد ما تسكرين الصفحة
5. الصقيه بملف `.env`:
```
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxx"
```

احفظي الملف (`Ctrl+S`) بعد تعبئة الثلاث قيم.

---

## 5. بناء الجداول بقاعدتك المحلية

```powershell
npx prisma db push
```

لازم يطلع لك:
```
Your database is now in sync with your Prisma schema.
✔ Generated Prisma Client
```

---

## 6. تشغيل المشروع

بنفس النافذة أو نافذة **ثالثة**:
```powershell
npm run dev
```
انتظري لين يطلع:
```
✓ Ready in ...
```
اتركي هذي النافذة مفتوحة كمان طول وقت التجربة.

---

## 7. فتح Swagger وتجربة الـ APIs

افتحي المتصفح على:
```
http://localhost:3000/api-doc
```

بتشوفين قائمة بكل الـ endpoints مقسّمة بأقسام (auth, partners, workspaces...). كل وحدة تقدرين تضغطين عليها وتشوفين شكل البيانات المطلوبة.

### الخطوات الأولى (بما إن قاعدتك فاضية تماماً، ما فيها بيانات):

1. **سجلي حساب** — افتحي `POST /api/auth/register` → اضغطي **Try it out** → عدّلي القيم بالمربع (استخدمي إيميلك الحقيقي) → **Execute**
2. **فعّلي الإيميل** — افتحي `POST /api/auth/verify-email` → الصقي الـ `userId` من الرد السابق + الكود اللي وصلك بالإيميل
3. **سجلي دخول** — `POST /api/auth/login` بنفس الإيميل وكلمة المرور
4. **أكملي الدخول** — `POST /api/auth/verify-login` بالكود الجديد اللي وصلك → **انسخي قيمة `token` من الرد**
5. **فعّلي التوكن لكل الصفحة** — اضغطي زر **Authorize** فوق يمين الصفحة → الصقي التوكن (بدون كلمة `Bearer` قبله) → **Authorize** → **Close**

بعد كذا، أي endpoint محمي تجربينه بزر "Try it out" بياخذ التوكن تلقائياً معه.

### بناء بيانات تجريبية (بما إن القاعدة فاضية، لازم تبنين أول شي أساسي)
رتبي حسب الترابط بينهم:
```
1. Partners (POST) → خذي id الشريك من الرد
2. Workspaces (POST) → تحتاج partner id، خذي id المساحة
3. باقي الجداول حسب اللي تبين تجربينه
```

---

## 8. أدوات إضافية مفيدة

### عرض قاعدة بياناتك بصرياً (زي جدول Excel)
```powershell
npx prisma studio
```
يفتح `http://localhost:5555` — تشوفين فيها كل الجداول والبيانات اللي أضفتيها.
ئعة وحلولها

## 9. مشاكل شائعة وحلولها


| المشكلة | الحل |
|---|---|
| `Can't reach database server` | القاعدة متوقفة — شغّليها بـ `npx prisma dev start coworkingpass` |
| `Module not found` بعد `git pull` | شغّلي `npm install` من جديد (مكتبات جديدة انضافت) |
| صفحة Swagger فاضية أو 404 | تأكدي إن `npm run dev` شغال بدون أخطاء، وإنك على فرع `develop` محدّث |
| `401 Unauthorized` بكل الطلبات | تأكدي ضغطتِ **Authorize** بصفحة Swagger وحطيتِ توكن صالح |
| ما توصلني رسالة الإيميل (OTP) | تأكدي `RESEND_API_KEY` معبّى صح بـ `.env` (مفتاحك الشخصي من الخطوة 5-ج)، وشيكي مجلد الرسائل غير المرغوبة (Spam) |

---

**عندك سؤال أو مشكلة غير موجودة هنا؟** اسألي بقروب الفريق.
