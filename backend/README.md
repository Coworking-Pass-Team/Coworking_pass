# Coworking Pass Backend



---

## الخطوة 1: سحب المشروع

```powershell
git clone https://github.com/Coworking-Pass-Team/Coworking_pass.git
cd Coworking_pass\backend
git checkout develop
git pull origin develop
```

---

## الخطوة 2: تثبيت المكتبات

```powershell
npm install
```

---

## الخطوة 3: إنشاء ملف `.env` (بقيمة مؤقتة أولاً)

```powershell
New-Item .env
code .env
```

يُكتب بالملف سطر واحد مؤقت فقط بهذي المرحلة:
```
DATABASE_URL="placeholder"
```
يُحفَظ الملف (`Ctrl+S`).

> **لماذا قيمة مؤقتة أولاً؟** لأن ملف إعدادات المشروع (`prisma.config.ts`) يتطلب وجود `DATABASE_URL` حتى لتشغيل أمر إنشاء قاعدة البيانات نفسه. توضع قيمة وهمية الآن، ثم تُستبدل بالقيمة الحقيقية بالخطوة القادمة.

---

## الخطوة 4: تشغيل قاعدة بيانات محلية

تُفتح نافذة PowerShell **جديدة ومنفصلة** (تبقى مفتوحة طوال فترة العمل على المشروع):
```powershell
cd Coworking_pass\backend
npx prisma dev --name coworkingpass
```

يظهر رد يحتوي على **رابطين مختلفين** — يُستخدم **الثاني فقط** (الذي يبدأ بـ `postgres://`، وليس `prisma+postgres://`):

```
يُستخدم هذا الشكل:
DATABASE_URL="postgres://postgres:postgres@localhost:XXXXX/template1?sslmode=disable&connection_limit=10&connect_timeout=0&max_idle_connection_lifetime=0&pool_timeout=0&socket_timeout=0"

لا يُستخدم هذا الشكل:
DATABASE_URL="prisma+postgres://localhost:XXXXX/?api_key=..."
```

**يُنسَخ الرابط الصحيح (الثاني) بالكامل.**


## الخطوة 5: تحديث `.env` بالقيم الحقيقية

بنافذة PowerShell **ثانية** (تبقى نافذة `prisma dev` مفتوحة بالأولى):
```powershell
cd Coworking_pass\backend
code .env
```

يُستبدل السطر المؤقت، وتُضاف باقي القيم:

```
DATABASE_URL="الرابط المنسوخ من الخطوة 4 (الشكل الصحيح: postgres://...)"
JWT_SECRET="أي نص طويل عشوائي، مثال: my-super-secret-dev-key-2026"
RESEND_API_KEY="يُؤخذ ذاتياً، الخطوات بالأسفل"
```

### الحصول على `RESEND_API_KEY` (مجاني، خطوتين)
1. يُفتح الموقع resend.com/signup ويُنشأ حساب مجاني
2. من القائمة الجانبية: **API Keys** → **Create API Key** → يُختار أي اسم → **Add**
3. يُنسخ المفتاح فوراً (يبدأ بـ `re_`) — لا يظهر مرة أخرى بعد إغلاق الصفحة
4. يُلصق بملف `.env`

يُحفَظ الملف (`Ctrl+S`).

---

## الخطوة 6: بناء الجداول

```powershell
npx prisma db push
```
يجب أن يظهر:
```
Your database is now in sync with your Prisma schema.
✔ Generated Prisma Client
```

---

## الخطوة 7: تشغيل المشروع

بنافذة **ثالثة**:
```powershell
npm run dev
```
يُنتظر حتى يظهر:
```
✓ Ready in ...
```
تبقى هذي النافذة مفتوحة أيضاً طوال فترة الاستخدام.

---

## الخطوة 8: فتح Swagger وتجربة الـ APIs

يُفتح المتصفح على:
```
http://localhost:3000/api-doc
```

### تسلسل التجربة الأولى (القاعدة فارغة تماماً بالبداية):
1. `POST /api/auth/register` → Try it out → تُعدَّل القيم (بريد حقيقي) → Execute
2. `POST /api/auth/verify-email` → يُلصق `userId` من الرد السابق + الكود الوارد بالبريد
3. `POST /api/auth/login` → نفس البريد وكلمة المرور
4. `POST /api/auth/verify-login` → الكود الجديد → يُنسخ `token` من الرد
5. زر **Authorize** أعلى الصفحة → يُلصق التوكن (بدون كلمة `Bearer`) → Authorize → Close

بعد هذي الخطوة، أي طلب محمي يُستخدم فيه التوكن تلقائياً.

### بناء بيانات تجريبية أولية
```
1. Partners (POST) → يُؤخذ id الشريك
2. Workspaces (POST) → يحتاج partner id
3. باقي الجداول حسب الحاجة
```

---

## أدوات إضافية

### عرض قاعدة البيانات بصرياً
```powershell
npx prisma studio
```


يُفتح على `http://localhost:5555`.



```powershell
# لإيقاف آمن (يحافظ على البيانات):
npx prisma dev stop coworkingpass

# لإعادة التشغيل لاحقاً (بنفس البيانات ونفس الرابط):
npx prisma dev start coworkingpass
```
> يُفضَّل عدم إغلاق النافذة بزر الإغلاق مباشرة — يُستخدَم أمر `stop` دائماً بدلاً من ذلك.

---

## مشاكل شائعة وحلولها

| المشكلة | السبب والحل |
|---|---|
| `PrismaConfigEnvError: Missing required environment variable` | ملف `.env` غير موجود أو فارغ — تُنشأ قيمة مؤقتة `DATABASE_URL="placeholder"` أولاً (الخطوة 3) قبل تشغيل أي أمر Prisma آخر |
| `Can't reach database server` | القاعدة المحلية متوقفة — يُشغَّل الأمر `npx prisma dev start coworkingpass` |
| `EPERM: operation not permitted, rename ...query_engine...` | نافذة `npm run dev` مفتوحة وتمسك ملفاً قيد التحديث — تُغلَق تلك النافذة (Ctrl+C)، ثم يُعاد تشغيل `npx prisma generate` |
| `Error: prepared statement "s0" already exists` | اتصال قديم عالق بقاعدة البيانات المحلية — يُنفَّذ: `npx prisma dev stop coworkingpass` ثم `npx prisma dev start coworkingpass`، وإذا استمرت المشكلة: `npx prisma dev rm coworkingpass` ثم إعادة الإنشاء من جديد بنفس الاسم |
| اتصال فاشل رغم اتباع كل الخطوات | يُتأكَّد من استخدام الرابط الذي يبدأ بـ `postgres://` وليس `prisma+postgres://` بملف `.env` |
| `Module not found` بعد `git pull` | يُشغَّل `npm install` من جديد |
| صفحة Swagger فارغة أو 404 | يُتأكَّد من تشغيل `npm run dev` بدون أخطاء، ومن كون الفرع الحالي هو `develop` المحدَّث |
| `401 Unauthorized` بكل الطلبات | يُتأكَّد من الضغط على **Authorize** بصفحة Swagger مع توكن صالح |
| عدم وصول رمز التحقق بالبريد | يُتأكَّد من صحة `RESEND_API_KEY`، ويُفحَص مجلد الرسائل غير المرغوبة |
| أوامر PowerShell لا تعمل مع مسارات تحتوي `[id]` | يُستخدم الخيار `-LiteralPath` بدلاً من `-Path` مع أوامر `Get-Content` أو `Select-String` |

---
