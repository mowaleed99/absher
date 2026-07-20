import json
import re

with open('new_flutter_mappings.json', 'r', encoding='utf-8') as f:
    mappings = json.load(f)

# Hardcode some known English translations for the flutter app
trans_dict = {
    'الآن': 'Now',
    'غرف مشتركة': 'Shared Rooms',
    'غرفة': 'Room',
    'الكل': 'All',
    'إلغاء': 'Cancel',
    'تسجيل الدخول': 'Login',
    'تنبيه هام': 'Important Notice',
    'زائر': 'Guest',
    'طالب': 'Student',
    'مفروشة ومجهزة ✨': 'Furnished & Equipped ✨',
    'عروض خاصة 🔥': 'Special Offers 🔥',
    'إغلاق': 'Close',
    'تحديث الإشعارات': 'Update Notifications',
    'شريك': 'Roommate',
    'بمفردك': 'Alone',
    'ميعاد': 'Date',
    'انتقال فوري ⚡': 'Immediate Move-in ⚡',
    'أبشر - Absher Georgia': 'Absher Georgia',
    'عفواً، يجب تسجيل الدخول أو إنشاء حساب طلابي أولاً لتتمكن من طلب حجز الشقق والسكن الطلابي!': 'Sorry, you must log in or create a student account first to book apartments and student housing!',
    'رقم هاتف التواصل (واتساب)': 'Contact Phone Number (WhatsApp)',
    'يوم المعاينة': 'Viewing Day',
    'الوقت المناسب': 'Suitable Time',
    'ملاحظات إضافية (مثال: نقطة التقاء محددة)': 'Additional Notes (e.g. specific meeting point)',
    'ملاحظة: أي تغيير أو تعديل في الموعد يتم بسهولة ومباشرة من خلال الشات مع خدمة العملاء.': 'Note: Any change or modification in the appointment is easily and directly done through chat with customer service.',
    'طالب أبشر': 'Absher Student',
    'جامعة في جورجيا': 'University in Georgia',
    'تأكيد الطلب والانتقال للمحادثة الفورية 💬': 'Confirm Request and Go to Instant Chat 💬',
    'تبليسي، جورجيا': 'Tbilisi, Georgia',
    'أبشر': 'Absher',
    'آخر أخبار جورجيا 📰': 'Latest Georgia News 📰',
    'تحديث الأخبار': 'Update News',
    'لا توجد أخبار حالياً 📰': 'No news currently 📰',
    'عروض الموسم الدراسي 🎓': 'School Season Offers 🎓',
    'احجز سكنك الطلابي الآن بسهولة وأمان!': 'Book your student housing now easily and safely!',
    'دفع نقدي (Cash) آمن مباشرة عند استلام مفتاح شقتك في تبليسي.': 'Safe cash payment directly upon receiving your apartment key in Tbilisi.',
    'عروض حصرية 🔥': 'Exclusive Offers 🔥',
    'سكن مشترك اقتصادي 🤝': 'Economical Shared Housing 🤝',
    'تجميع الطلاب في شقق قريبة من الجامعات': 'Grouping students in apartments near universities',
    'وفر نصف القيمة الإيجارية وسجل اسمك ليقوم الدعم بمطابقتك مع زملاء متوافقين.': 'Save half the rent and register your name for support to match you with compatible peers.',
    'توفير 50% 💰': 'Save 50% 💰',
    'استقبال مطار ونقل جامعي 🚖': 'Airport Reception and University Transfer 🚖',
    'وصلت تبليسي حديثاً؟ نحن في استقبالك!': 'Recently arrived in Tbilisi? We welcome you!',
    'سيارات مريحة ومندوبين لمساعدتك في خطك الأول وتوصيلك حتى باب سكنك.': 'Comfortable cars and representatives to assist you on your first step and deliver you to your door.',
    'خدمة 24/7 ⚡': '24/7 Service ⚡',
    'إقامات طلابية وتسجيل قانوني 🛂': 'Student Residencies and Legal Registration 🛂',
    'تخليص كافة أوراقك الجامعية والقانونية': 'Clearing all your university and legal papers',
    'فريق متخصص لضمان سلامة وضعك القانوني وإقامتك في جورجيا بكل سهولة.': 'A specialized team to ensure the safety of your legal status and residency in Georgia easily.',
    'مضمون ومعتمد 📜': 'Guaranteed and Certified 📜',
    'شقة طلابية فاخرة - شارع بيكيني (Pekini)': 'Luxury Student Apartment - Pekini Street',
    '450 دولار / شهر': '450 USD / Month',
    'سابورتالو (Saburtalo)': 'Saburtalo',
    'التبليسي الطبية TSMU (10 دقائق مشياً) | جامعة جورجيا UG (20 دقيقة)': 'TSMU (10 mins walk) | UG (20 mins)',
    'شقة بمفردك': 'Apartment alone',
    '3 أفراد (شقة كاملة)': '3 Individuals (Full Apartment)',
    '2 حمام': '2 Bathrooms',
    '3 غرف واسعة': '3 Spacious Rooms',
    'تدفئة مركزية دافئة': 'Warm Central Heating',
    'بلكونة بإطلالة مفتوحة': 'Balcony with open view',
    'إنترنت ألياف ضوئية سريع': 'Fast Fiber Optic Internet',
    'مفروشة بالكامل': 'Fully Furnished',
    'شقة ممتازة للطلاب في قلب تبليسي بالقرب من محطة مترو التكنيكال. مجهزة بالكامل بالفرش والأجهزة الكهربائية مع إطلالة رائعة من البلكونة وتدفئة مركزية ممتازة للشتاء. الدفع يتم نقداً عند الاستلام.': 'Excellent student apartment in the heart of Tbilisi near the Technical metro station. Fully equipped with furniture and appliances, with a wonderful view from the balcony and excellent central heating for winter. Payment is cash on delivery.',
    'ستوديو مودرن - بالقرب من جامعة جورجيا (UG)': 'Modern Studio - Near UG',
    '380 دولار / شهر': '380 USD / Month',
    'فاكي (Vake)': 'Vake',
    'جامعة جورجيا UG (10 دقائق مشياً) | إيليا ستيت (15 دقيقة)': 'UG (10 mins walk) | Ilia State (15 mins)',
    '1 فرد (ستوديو منفرد)': '1 Individual (Single Studio)',
    '1 حمام': '1 Bathroom',
    'ستوديو منفرد هادئ': 'Quiet Single Studio',
    'تكييف وتدفئة': 'AC & Heating',
    'أمن على مدار 24 ساعة': '24-hour Security',
    'قريب من السوبرماركت': 'Close to Supermarket',
    'ستوديو مثالي للطالب المنفرد الباحث عن الهدوء والتركيز في الدراسة. يبعد دقائق مشياً عن حرم جامعة جورجيا. أثاث حديث ومطبخ مجهز بالكامل.': 'Perfect studio for a single student looking for peace and focus on studies. Minutes walk from UG campus. Modern furniture and fully equipped kitchen.',
    'شقة مشتركة لـ 3 طلاب - إطلالة بنورامية': 'Shared Apartment for 3 Students - Panoramic View',
    '550 دولار (أو 180 دولار للشخص)': '550 USD (or 180 USD per person)',
    'إيليا ستيت Ilia (10 دقائق) | جامعة تبليسي الحكومية TSU (20 دقيقة)': 'Ilia State (10 mins) | TSU (20 mins)',
    'استئجار مع شريك': 'Rent with Roommate',
    '3 أفراد (شقة مشتركة)': '3 Individuals (Shared Apartment)',
    'غير مدخن ، طالب هادئ ومحترم ، يحافظ على النظافة العامة والهدوء': 'Non-smoker, quiet and respectful student, maintains general cleanliness and calm',
    'غرفة نوم خاصة ومفروشة ، حمام ومطبخ مشترك ، شرفة (بلكونة واسعة)': 'Private furnished bedroom, shared bathroom and kitchen, balcony (spacious)',
    'غرف منفصلة ومريحة': 'Separate and comfortable rooms',
    'صالة كبيرة للمذاكرة المشتركة': 'Large hall for joint study',
    'بلكونة واسعة جداً': 'Very large balcony',
    'مصعد يعمل 24/7': 'Elevator works 24/7',
    'فرصة ممتازة لثلاثة أصدقاء طلاب أو لتجميع الطلاب. مساحة واسعة وتوزيع ممتاز للغرف يضمن الخصوصية لكل طالب.': 'Excellent opportunity for three student friends or grouping students. Spacious area and excellent room distribution ensures privacy for each student.',
    'ستوديو فاخر مستقل - شارع أغماشينيبلي': 'Luxury Independent Studio - Aghmashenebeli Street',
    '400 دولار / شهر': '400 USD / Month',
    'ديدوبي (Didube)': 'Didube',
    'مشياً إلى محطة المترو والجامعات (10 دقائق)': 'Walking to metro station and universities (10 mins)',
    '1 فرد': '1 Individual',
    'ستوديو مستقل لشخص واحد': 'Independent studio for one person',
    'إنترنت سريع': 'Fast Internet',
    'أثاث جديد': 'New Furniture',
    'شقة ستوديو خاصة لشخص واحد بموقع ممتاز بالقرب من الخدمات والمواصلات.': 'Private studio apartment for one person in an excellent location near services and transportation.',
    'شقة مع شريك - سابورتالو بالقرب من الطبية': 'Apartment with Roommate - Saburtalo near Medical',
    '220 دولار للشخص': '220 USD per person',
    'التبليسي الطبية TSMU (5 دقائق مشياً)': 'TSMU (5 mins walk)',
    'مطلوب شريك واحد سكن': 'One roommate required',
    'طالب طب أو هندسة غير مدخن ومحافظ على الهدوء والنظافة': 'Medical or engineering student, non-smoker, maintains calm and cleanliness',
    'غرفة نوم كبيرة خاصة ومكيفة ، حمام ومطبخ مشترك مع طالب واحد فقط': 'Large private air-conditioned bedroom, shared bathroom and kitchen with only one student',
    '1 غرفة نوم مستقلة للشريك': '1 independent bedroom for roommate',
    'مطبخ مجهز': 'Equipped kitchen',
    'بلكونة هادئة': 'Quiet balcony',
    'شقة ممتازة لطالب يبحث عن شريك سكن هادئ ومحترم على بعد خطوات من التبليسي الطبية.': 'Excellent apartment for a student looking for a quiet and respectful roommate steps away from TSMU.',
    'الإشعارات والتنبيهات 🔔': 'Notifications & Alerts 🔔',
    'لا توجد تنبيهات جديدة حالياً 🔕': 'No new alerts currently 🔕',
    'التبليسي الطبية (TSMU)': 'TSMU',
    'جامعة جورجيا (UG)': 'UG',
    'إيليا ستيت (Ilia State)': 'Ilia State',
    'جامعة تبليسي الحكومية (TSU)': 'TSU',
    'شقة': 'Apartment',
    'مشترك': 'Shared',
    'غرفة في شقة': 'Room in Apartment',
    '🎓 اختر الجامعات القريبة': '🎓 Select nearby universities',
    '💰 السعر بنفسك': '💰 Price yourself',
    '🏘️ الحي السكني': '🏘️ District',
    '🤝 نوع السكن': '🤝 Accommodation Type',
    '🛏️ الغرف': '🛏️ Rooms',
    '🛁 الحمامات': '🛁 Bathrooms',
    '3 حمامات فأكثر': '3 Bathrooms or more',
    'تاريخ': 'Date',
    'سبتمبر': 'September',
    'انقر لمعاينة الصور وحجز الشقة >>': 'Click to preview photos and book apartment >>',
    'زائر كريم': 'Dear Guest',
    'تصفح عام (ضيف)': 'General Browsing (Guest)',
    'لا توجد تنبيهات عاجلة حالياً 🔕': 'No urgent alerts currently 🔕',
    'التنبيهات تتم إزالتها تلقائياً بعد مرور 48 ساعة': 'Alerts are automatically removed after 48 hours',
    'قريب من التبليسي الطبية': 'Near TSMU',
    'ستوديو منفرد': 'Single Studio',
    'عروض السكن الطلابي الحصرية 🏢': 'Exclusive Student Housing Offers 🏢',
    'لا توجد شقق تطابق هذا الفلتر حالياً': 'No apartments match this filter currently',
    '🇪🇬 العربية (Arabic)': '🇪🇬 Arabic (العربية)',
    '🇬🇧 English (الإنجليزي)': '🇬🇧 English',
    'جامعة تبليسي الطبية (TSMU)': 'TSMU',
}

ar_data = {}
en_data = {}

for key, arabic_text in mappings.items():
    ar_data[key] = arabic_text
    # English translation fallback
    en_data[key] = trans_dict.get(arabic_text, arabic_text + ' (EN)')

with open('lib/services/language_service.dart', 'r', encoding='utf-8') as f:
    lang_content = f.read()

# We need to inject ar_data into _translations['ar'] and en_data into _translations['en']
# This is tricky without a full parser.
# Let's find the end of 'ar': { ... }
ar_block_end = lang_content.find("    'en': {")
if ar_block_end != -1:
    # Inject before the end of the 'ar' block
    ar_str = ",\n      ".join([f"'{k}': '{v.replace(chr(39), chr(92)+chr(39)).replace(chr(10), chr(92)+'n')}'" for k, v in ar_data.items()])
    if ar_str:
        # Find the last comma in 'ar' block
        insert_pos_ar = lang_content.rfind('}', 0, ar_block_end)
        lang_content = lang_content[:insert_pos_ar-1] + ",\n      " + ar_str + "\n    " + lang_content[insert_pos_ar:]

en_block_end = lang_content.find("    'ka': {")
if en_block_end != -1:
    en_str = ",\n      ".join([f"'{k}': '{v.replace(chr(39), chr(92)+chr(39)).replace(chr(10), chr(92)+'n')}'" for k, v in en_data.items()])
    if en_str:
        insert_pos_en = lang_content.rfind('}', 0, en_block_end)
        lang_content = lang_content[:insert_pos_en-1] + ",\n      " + en_str + "\n    " + lang_content[insert_pos_en:]

with open('lib/services/language_service.dart', 'w', encoding='utf-8') as f:
    f.write(lang_content)

print('Injected new strings into language_service.dart!')
