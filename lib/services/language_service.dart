import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LanguageService {
  // 'ar'= العربية, 'en'= الإنجليزية
  static final ValueNotifier<String> currentLang = ValueNotifier<String>('ar');

  static Future<void> initLanguage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedLang = prefs.getString('app_lang');
      if (savedLang == 'ar' || savedLang == 'en') {
        currentLang.value = savedLang!;
      } else {
        currentLang.value = 'ar';
        await prefs.setString('app_lang', 'ar');
      }
    } catch (e) {
      debugPrint('initLanguage error: $e');
    }

    // Add a listener to automatically save language whenever it changes
    currentLang.addListener(() async {
      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('app_lang', currentLang.value);
      } catch (e) {
        debugPrint('saveLanguage error: $e');
      }
    });
  }

  static bool get isRtl => currentLang.value == 'ar';
  static TextDirection get textDirection =>
      isRtl ? TextDirection.rtl : TextDirection.ltr;

  static final Map<String, Map<String, String>> _translations = {
    'ar': {
      'admin_portal_btn': 'لوحة الإدارة',
      'up_to_price': 'حتى',
      'admin_portal_sub': 'إدارة الشقق والخدمات والطلاب والدعم',
      'georgian_lang_label': 'ქართული (تحت التطوير)',
      'apply': 'تطبيق الفلتر',
      'book_apartment_desc':
          'املأ الاستمارة وسنقوم بالتواصل معك لتأكيد الحجز وترتيب المعاينة',
      'book_apartment_title': 'حجز سكن (شقة أو استوديو)',
      'book_now_cash': 'احجز الآن الدفع كاش عند المعاينة',
      'budget_title': 'الميزانية الشهرية',
      'cancel_filter': 'إلغاء',
      'clear_filter': 'مسح الفلاتر',
      'enter_budget_hint': 'أدخل الحد الأقصى للسعر بالدولار',
      'notifications': 'الإشعارات',
      'select_universities': 'اختر الجامعات القريبة',
      'active_apartments': 'الشقق النشطة',
      'active_services': 'الخدمات النشطة',
      'active_students': 'الطلاب المسجلين',
      'service_requests': 'طلبات الخدمات',
      'total_points_spent': 'إجمالي النقاط المستهلكة',
      'total_transactions': 'إجمالي الحركات المالية',
      'app_title': 'أبشر',
      'welcome': 'مرحباً بك،',
      'home': 'الرئيسية',
      'services': 'الخدمات',
      'chat': 'المحادثة',
      'offers': 'عروض السكن',
      'profile': 'حسابي',
      'change_lang': 'تغيير لغة التطبيق (Language)',
      'lang_desc': 'العربية / English',
      'logout': 'تسجيل الخروج من الحساب',
      'guest_logout': 'الخروج للعودة لتسجيل الدخول',
      'guest_mode': 'أنت تتصفح حالياً كزائر!',
      'roommate_match': 'تجميع الطلاب في شقة مشتركة',
      'roommate_desc':
          'سجل اسمك وجامعتك، وسيتواصل معك الدعم لتجميعك مع زملاء متوافقين.',
      'quick_services': 'الخدمات الطلابية السريعة',
      'view_all': 'عرض الكل',
      'browse_apts': 'تصفح الشقق السكنية المتاحة للطلاب',
      'no_commission': 'عروض طلابية مباشرة ومجهزة',
      'cash_payment': 'دفع نقدي (Cash) آمن عند الاستلام',
      'my_bookings': 'حجوزاتي وطلباتي السابقة',
      'payment_method': 'طريقة الدفع في أبشر',
      'contact_support': 'التواصل المباشر مع الدعم',
      'about_app': 'عن تطبيق أبشر (ABSHER)',
      'splash_subtitle': 'أبشر - رفيقك الطلابي الأول في جورجيا',
      'skip_to_start': 'تخطي إلى البداية >>',
      'login_fail': 'فشل تسجيل الدخول. تأكد من صحة البيانات.',
      'login_welcome': 'مرحباً بك في أبشر',
      'login_subtitle': 'سجل دخولك للوصول إلى السكن الطلابي والخدمات في جورجيا',
      'email_or_phone': 'البريد الإلكتروني أو رقم الهاتف',
      'please_enter_email': 'يرجى إدخال البريد أو رقم الهاتف',
      'password': 'كلمة المرور',
      'please_enter_password': 'يرجى إدخال كلمة المرور',
      'contact_support_pw':
          'تواصل مع الدعم عبر انستجرام @absher_georgia لاستعادة الحساب',
      'forgot_pw': 'نسيت كلمة المرور؟',
      'login_btn': 'تسجيل الدخول',
      'enter_as_guest': 'الدخول كزائر واستكشاف التطبيق',
      'no_account_yet': 'ليس لديك حساب طالب بعد؟',
      'create_new_account': 'إنشاء حساب جديد',
      'guest_name': 'زائر كريم',
      'guest_uni': 'تصفح عام (ضيف)',
      'other_uni_manual': 'أخرى (إدخال يدوي)',
      'register_fail': 'فشل إنشاء الحساب. تأكد من البيانات.',
      'create_account_title': 'إنشاء حساب طالب جديد',
      'create_account_subtitle':
          'انضم إلى أسرة أبشر واستفد من كافة خدماتنا في جورجيا',
      'full_name': 'الاسم الكامل',
      'required_field': 'مطلوب',
      'email': 'البريد الإلكتروني',
      'invalid_email': 'بريد غير صالح',
      'phone_example': 'رقم الهاتف',
      'georgia_uni': 'الجامعة في جورجيا',
      'uni_and_district': 'اسم الجامعة واسم الحي المنطقه',
      'please_enter_uni_dist': 'يرجى إدخال اسم الجامعة والحي',
      'pw_min_6': '6 أحرف على الأقل',
      'create_account_btn': 'إنشاء الحساب الآن',
      'already_have_account': 'لديك حساب بالفعل؟',
      'all_flats': 'جميع الشقق',
      'flat_alone': 'شقة بمفردك',
      'with_roommate': 'استئجار مع شريك',
      'all_districts': 'جميع الأحياء',
      'all': 'الكل',
      'select_rooms': 'اختر عدد الغرف...',
      'one_room': 'غرفة واحدة',
      'two_rooms': 'غرفتين',
      'three_plus_rooms': '3 غرف فأكثر',
      'filter_flats': 'تصفية الشقق',
      'rental_type': 'نوع الاستئجار:',
      'district': 'الحي:',
      'bedrooms': 'غرف النوم:',
      'bathrooms': 'الحمامات:',
      'distance_uni': 'المسافة للجامعات (مشياً):',
      '10_mins': '10 دقائق',
      '20_mins': '20 دقيقة',
      '30_mins': '30 دقيقة',
      'apply_filter': 'تطبيق التصفية',
      'close_dialog': 'إغلاق',
      'error_sending_request': 'خطأ في إرسال الطلب',
      'connection_error': 'خطأ في الاتصال',
      'error_occurred': 'حدث خطأ',
      'error': 'خطأ',
      'retry': 'إعادة المحاولة',
      'close': 'إغلاق',
      'save': 'حفظ',
      'title': 'العنوان',
      'description': 'الوصف',
      'admin_portal': 'بوابة الإدارة (أبشر)',
      'dashboard': 'لوحة القيادة',
      'apartments': 'الشقق',
      'students': 'الطلاب',
      'failed_load_students': 'فشل تحميل الطلاب',
      'search_students': 'البحث عن الطلاب...',
      'failed_load_services': 'فشل تحميل الخدمات',
      'failed_save_service': 'فشل حفظ الخدمة',
      'price_points': 'السعر (نقاط)',
      'active': 'مفعل',
      'please_fill_fields': 'يرجى ملء جميع الحقول',
      'username_or_email': 'اسم المستخدم أو البريد الإلكتروني',
      'failed_load_dashboard': 'فشل تحميل لوحة القيادة',
      'failed_load_apartments': 'فشل تحميل الشقق',
      'failed_save_apartment': 'فشل حفظ الشقة',
      'price': 'السعر',
      'capacity': 'السعة',
      'district_id': 'رقم الحي',
      'available': 'متاح',
      'cancel': 'إلغاء',
      'select_nearby_unis': 'اختيار الجامعات القريبة (اختر جامعة أو أكثر)',
      'confirm_selection': 'تأكيد الاختيار',
      'search_flats': 'البحث في الشقق...',
      'no_results': 'لا توجد نتائج تطابق بحثك',
      'details': 'التفاصيل',
      'book_now': 'احجز الآن',
      'welcome_user': 'أهلاً بك،',
      'wallet_points': 'المحفظة والنقاط',
      'current_points_balance': 'رصيد النقاط الحالي',
      'points_usage_desc': 'يمكنك استخدام النقاط لدفع تكلفة الخدمات',
      'transaction_history': 'سجل العمليات والإشعارات',
      'no_previous_transactions': 'لا توجد عمليات سابقة',
      'default_student_name': 'الزائر الكريم',
      'default_student_uni': 'جامعة جورجيا',
      'create_account_now':
          'قم بإنشاء حساب طالب الآن للاستفادة من كافة العروض وطلب تجميع الشقق.',
      'login_or_register': 'تسجيل الدخول / حساب جديد',
      'booking_status_subtitle': 'متابعة حالة شقتك أو طلب التجميع',
      'wallet_subtitle': 'متابعة الرصيد والدفع بالنقاط',
      'please_login_wallet': 'الرجاء تسجيل الدخول أولاً لاستخدام المحفظة',
      'support_subtitle': 'محادثة مباشرة مع فريق الدعم الفني',
      'about_subtitle': 'الإصدار 1.0.0 - تطبيق أبشر في جورجيا',
      'clicked_on': 'تم النقر على:',
      'available_options': 'الخيارات المتاحة',
      'furnished_equipped': 'شقق مفروشة ومجهزة ️',
      'no_matching_flats': 'لا توجد شقق مطابقة حالياً في هذه القائمة.',
      'go_back': 'العودة للخلف',
      'immediate_move_in': 'انتقال فوري',
      'click_to_view_images': 'انقر لمعاينة الصور وحجز الشقة >>',
      'apartment_details': 'تفاصيل السكن',
      'images_count': 'صور',
      'apartment_number': 'شقة رقم #',
      'proximity_label': 'القرب:',
      'close_to_unis': 'قريبة من الجامعات الرئيسية',
      'roommate_reqs_title':
          'استئجار مع شريك (بيانات ومواصفات الشريك المطلوب):',
      'roommate_reqs': 'شروط ومواصفات الشريك:',
      'roommate_facilities': 'المساحة والمرافق المتاحة للشريك:',
      'features_and_facilities': 'المميزات والمرافق المتوفرة',
      'great_features': 'مميزات رائعة',
      'apartment_description': 'وصف السكن',
      'guest_alert_title': 'تنبيه',
      'guest_alert_body_booking':
          'عفواً، لا يمكنك طلب حجز أو إرسال طلب سكن إلا بعد تسجيل الدخول كطالب في التطبيق.',
      'guest_alert_body_roommate':
          'عفواً، يجب تسجيل الدخول أو إنشاء حساب طلابي أولاً لتتمكن من إرسال طلب البحث عن شريك سكن!',
      'choose_housing_method': 'اختر طريقة السكن المناسبة لك',
      'housing_method_desc':
          'يمكنك حجز شقة كاملة بمفردك أو تعبئة نموذج البحث عن شريك سكن ليقوم الدعم بمطابقتك.',
      'browse_flats': 'تصفح الشقق',
      'browse_flats_desc':
          'استعرض قائمة الشقق السكنية المتاحة للطلاب مع كافة الصور والأسعار.',
      'all_available_flats': 'جميع الشقق المتاحة',
      'all_available_flats_desc':
          'قائمة بكافة الشقق السكنية المتاحة للطلاب مع كافة التفاصيل والأسعار.',
      'flat_room_choice': 'اختيار غرفه فى شقه',
      'flat_room_desc':
          'عرض قائمة الشقق والاستوديوهات المناسبة لسكن شخص واحد بمفرده.',
      'flats_for_one': 'شقق تناسب شخص بمفرده',
      'flats_for_one_desc':
          'قائمة الشقق والاستوديوهات المخصصة والمناسبة لسكن طالب واحد فقط.',
      'roommate_form_title': 'نموذج البحث عن شريك',
      'roommate_form_desc':
          'قم بتعبئة بياناتك ليقوم فريق أبشر بمطابقتك مع الشريك الأنسب:',
      'full_name_label': 'الاسم الكامل',
      'nationality_label': 'الجنسية',
      'gender_label': 'النوع',
      'male': 'ذكر',
      'female': 'أنثى',
      'males_only': 'ذكور فقط',
      'females_only': 'إناث فقط',
      'university_label': 'الجامعة',
      'major_label': 'التخصص',
      'major_study_label': 'التخصص الدراسي',
      'whatsapp_number': 'رقم الواتساب',
      'whatsapp_contact_number': 'رقم هاتف التواصل (واتساب)',
      'when_move_in': 'متى تريد الانتقال؟',
      'move_in_date_label': 'موعد الانتقال المطلوب',
      'immediate_move': 'فوري / بأسرع وقت',
      'this_month_move': 'خلال هذا الشهر',
      'next_semester_move': 'مع بداية الفصل الدراسي الجديد',
      'choose_date': 'اختر تاريخ',
      'additional_notes': 'ملاحظات إضافية',
      'additional_notes_hint':
          'ملاحظات إضافية (مثال: تفضيل التدخين، الهدوء، إلخ)',
      'send_to_customer_service': 'إرسال إلى خدمة العملاء',
      'send_roommate_request': 'إرسال طلب التجميع لفريق الدعم',
      'roommate_match_title': 'تجميع الطلاب في شقة مشتركة',
      'roommate_match_card_title': 'ابحث عن شريك سكن متوافق!',
      'roommate_match_card_desc':
          'سجل بياناتك وميزانيتك، وسيقوم فريق أبشر بتجميعك مع طلاب من نفس جامعتك وتجهيز الشقة لكم.',
      'your_info_and_prefs': 'بياناتك والتفضيلات السكنية',
      'monthly_budget_usd': 'الميزانية الشهرية المقدرة للشخص (بالدولار USD)',
      'housing_type_req': 'نوع السكن المطلوب',
      'guest_alert_body_services':
          'عفواً، يجب تسجيل الدخول أو إنشاء حساب طلابي أولاً لتتمكن من طلب الخدمات والصيانة الفورية!',
      'service_form_title': 'نموذج طلب خدمة (Service Form)',
      'service_form_desc': 'اختر الخدمة وتأكد من ملء بيانات الطلب:',
      'requested_service': 'الخدمة المطلوبة',
      'whatsapp_contact_short': 'رقم الواتساب للتواصل',
      'detailed_address': 'العنوان بالتفصيل',
      'best_time_to_execute': 'أفضل وقت للتنفيذ (من التقويم)',
      'attach_image_optional': 'إرفاق صورة للمشكلة (اختياري)',
      'image_attached_success': 'تم إرفاق صورة الخدمة ️',
      'cleaning_details_title':
          'تحديد مساحة المنزل والتسعير التقديري (3 - 4 لاري لكل متر):',
      'number_of_rooms': 'عدد الغرف',
      'area_in_meters': 'المساحة (متر)',
      'estimated_cost': 'التكلفة التقديرية:',
      'currency_gel': 'لاري جورجي',
      'notes_details_hint': 'اكتب تفاصيل وملاحظاتك المحددة هنا...',
      'notes_and_details': 'ملاحظات وتفاصيل الطلب',
      'promo_code': 'كود الخصم (Promo Code)',
      'use_wallet_points': 'استخدام نقاط المحفظة للدفع',
      'submit_form_confirm': 'إرسال الفورم وتأكيد الطلب',
      'all_student_services': 'كافة خدمات أبشر الطلابية ️',
      'instant_tag': 'فوري',
      'request_service_button': 'طلب الخدمة ️',
      'welcome_chat_msg':
          'مرحباً بك في الدعم الفني المباشر لتطبيق أبشر ! كيف يمكننا مساعدتك اليوم بخصوص السكن أو الخدمات في جورجيا؟',
      'rate_customer_service': 'تقييم خدمة العملاء',
      'rate_customer_service_desc':
          'ما مدى رضاك عن سرعة وجودة التواصل مع الدعم الفني لـ أبشر؟ (الرؤية للأدمن فقط)',
      'additional_comments_hint': 'ملاحظات أو تعليقات إضافية...',
      'submit_rating': 'إرسال التقييم',
      'rating_success_msg':
          'تم إرسال تقييمك لإدارة أبشر وحفظه بنجاح. شكراً لك!',
      'attach_link': 'إرفاق رابط',
      'enter_or_paste_link': 'أدخل أو الصق أي رابط لمشاركته في المحادثة:',
      'url_label': 'الرابط (URL)',
      'send_now': 'إرسال الآن',
      'attach_youtube_drive': 'إرفاق فيديو يوتيوب أو درايف',
      'enter_youtube_drive_link':
          'أدخل أو الصق رابط فيديو من يوتيوب أو جوجل درايف:',
      'video_url_label': 'رابط الفيديو (URL)',
      'uploading_file_loading': 'جاري رفع وإرسال الملف... ⏳',
      'file_upload_success': 'تم رفع وإرسال الملف بنجاح!',
      'file_upload_fail': 'عذراً، فشل رفع الملف إلى السيرفر',
      'attach_media_chat': 'إرفاق وسائط للمحادثة',
      'choose_image_gallery': 'اختيار صورة من المعرض',
      'choose_video_gallery': 'اختيار فيديو من المعرض',
      'manual_link_input': 'إدخال رابط ملف يدوي (موقع خارجي)',
      'preview_video_attachment': 'معاينة الفيديو المرفق',
      'preview_image_attachment': 'معاينة الصورة المرفقة',
      'video_player_active': 'مشغل الفيديو نشط',
      'absher_support_chat_title': 'إدارة أبشر - الدعم والمحادثة',
      'rate_button': 'تقييم',
      'direct_call_snackbar':
          'الاتصال الهاتفي المباشر أو عبر واتساب 995555123456+',
      'reply_to_message_selected': 'تم تحديد الرسالة للرد عليها',
      'you': 'أنت',
      'tech_support': 'الدعم الفني',
      'click_to_play_video': 'انقر لتشغيل الفيديو',
      'reply_to_yourself': 'الرد على نفسك',
      'reply_to_support': 'الرد على خدمة العملاء',
      'attach_image_tooltip': 'إرفاق صورة',
      'attach_video_tooltip': 'إرفاق فيديو',
      'attach_link_tooltip': 'إرفاق رابط',
      'type_message_hint': 'اكتب رسالتك للإدارة هنا...',
      'sending_service_request': 'جاري إرسال طلب الخدمة... ⏳',
      'error_sending_service': 'خطأ في إرسال طلب الخدمة:',
      'auto_trans_1000': 'أبشر - Absher Georgia',
      'auto_trans_1001': '12:00 ظهراً',
      'auto_trans_1002': 'زائر',
      'auto_trans_1003': 'تنبيه هام',
      'auto_trans_1004':
          'عفواً، يجب تسجيل الدخول أو إنشاء حساب طلابي أولاً لتتمكن من طلب حجز الشقق والسكن الطلابي!',
      'auto_trans_1005': 'إلغاء',
      'auto_trans_1006': 'تسجيل الدخول',
      'auto_trans_1007': 'أنت على وشك طلب رؤية ومعاينة:',
      'auto_trans_1008': '. الدفع يتم نقداً عند الاستلام.',
      'auto_trans_1009': 'رقم هاتف التواصل (واتساب)',
      'auto_trans_1010': 'يوم المعاينة',
      'auto_trans_1011': 'الوقت المناسب',
      'auto_trans_1012': 'ملاحظات إضافية (مثال: نقطة التقاء محددة)',
      'auto_trans_1013':
          'ملاحظة: أي تغيير أو تعديل في الموعد يتم بسهولة ومباشرة من خلال الشات مع خدمة العملاء.',
      'auto_trans_1014': 'جاري إرسال طلب الحجز... ⏳',
      'auto_trans_1015': 'لا يوجد',
      'auto_trans_1016':
          'ملاحظة: الطالب يرغب برؤية الشقة في هذا الموعد، وأي تغيير في الموعد يتم التنسيق له عبر هذا الشات.',
      'auto_trans_1017': 'طالب أبشر',
      'auto_trans_1018': 'جامعة في جورجيا',
      'auto_trans_1019': 'تأكيد الطلب والانتقال للمحادثة الفورية',
      'auto_trans_1020': 'تبليسي، جورجيا',
      'auto_trans_1021': 'شريك',
      'auto_trans_1022': 'الآن',
      'auto_trans_1023': 'الآن',
      'auto_trans_1024': 'الآن',
      'auto_trans_1025': 'الآن',
      'auto_trans_1026': 'طالب',
      'auto_trans_1027': 'جامعة في جورجيا',
      'auto_trans_1028': 'طالب أبشر',
      'auto_trans_1029': 'جامعة في جورجيا',
      'auto_trans_1030': 'تقييم ممتاز بدون ملاحظات إضافية',
      'auto_trans_1031': 'الآن',
      'auto_trans_1032': 'طالب',
      'auto_trans_1033': 'جامعة في جورجيا',
      'auto_trans_1034': 'إلغاء',
      'auto_trans_1035': 'إلغاء',
      'auto_trans_1036': 'فيديو مرفق من الطالب',
      'auto_trans_1037': 'صورة مرفقة من الطالب',
      'auto_trans_1038': 'ستوديو',
      'auto_trans_1039': 'منفرد',
      'auto_trans_1040': '1 غرفة',
      'auto_trans_1041': 'خاصة',
      'auto_trans_1042': 'مشتركة لـ 3',
      'auto_trans_1043': 'أبشر',
      'auto_trans_1044': 'ميعاد',
      'auto_trans_1045': 'تاريخ',
      'auto_trans_1046': 'سبتمبر',
      'auto_trans_1047': 'آخر أخبار جورجيا',
      'auto_trans_1048': 'تحديث الأخبار',
      'auto_trans_1049': 'لا توجد أخبار حالياً',
      'auto_trans_1050': 'الآن',
      'auto_trans_1051': 'عروض الموسم الدراسي',
      'auto_trans_1052': 'احجز سكنك الطلابي الآن بسهولة وأمان!',
      'auto_trans_1053':
          'دفع نقدي (Cash) آمن مباشرة عند استلام مفتاح شقتك في تبليسي.',
      'auto_trans_1054': 'عروض حصرية',
      'auto_trans_1055': 'سكن مشترك اقتصادي',
      'auto_trans_1056': 'تجميع الطلاب في شقق قريبة من الجامعات',
      'auto_trans_1057':
          'وفر نصف القيمة الإيجارية وسجل اسمك ليقوم الدعم بمطابقتك مع زملاء متوافقين.',
      'auto_trans_1058': 'توفير 50%',
      'auto_trans_1059': 'استقبال مطار ونقل جامعي',
      'auto_trans_1060': 'وصلت تبليسي حديثاً؟ نحن في استقبالك!',
      'auto_trans_1061':
          'سيارات مريحة ومندوبين لمساعدتك في خطك الأول وتوصيلك حتى باب سكنك.',
      'auto_trans_1062': 'خدمة 24/7',
      'auto_trans_1063': 'إقامات طلابية وتسجيل قانوني',
      'auto_trans_1064': 'تخليص كافة أوراقك الجامعية والقانونية',
      'auto_trans_1065':
          'فريق متخصص لضمان سلامة وضعك القانوني وإقامتك في جورجيا بكل سهولة.',
      'auto_trans_1066': 'مضمون ومعتمد',
      'auto_trans_1067': 'شقة طلابية فاخرة - شارع بيكيني (Pekini)',
      'auto_trans_1068': '450 دولار / شهر',
      'auto_trans_1069': 'سابورتالو (Saburtalo)',
      'auto_trans_1070':
          'التبليسي الطبية TSMU (10 دقائق مشياً) | جامعة جورجيا UG (20 دقيقة)',
      'auto_trans_1071': 'شقة بمفردك',
      'auto_trans_1072': '3 أفراد (شقة كاملة)',
      'auto_trans_1073': 'شقة بمفردك',
      'auto_trans_1074': '2 حمام',
      'auto_trans_1075': '3 غرف واسعة',
      'auto_trans_1076': 'تدفئة مركزية دافئة',
      'auto_trans_1077': 'بلكونة بإطلالة مفتوحة',
      'auto_trans_1078': 'إنترنت ألياف ضوئية سريع',
      'auto_trans_1079': 'مفروشة بالكامل',
      'auto_trans_1080':
          'شقة ممتازة للطلاب في قلب تبليسي بالقرب من محطة مترو التكنيكال. مجهزة بالكامل بالفرش والأجهزة الكهربائية مع إطلالة رائعة من البلكونة وتدفئة مركزية ممتازة للشتاء. الدفع يتم نقداً عند الاستلام.',
      'auto_trans_1081': 'ستوديو مودرن - بالقرب من جامعة جورجيا (UG)',
      'auto_trans_1082': '380 دولار / شهر',
      'auto_trans_1083': 'فاكي (Vake)',
      'auto_trans_1084':
          'جامعة جورجيا UG (10 دقائق مشياً) | إيليا ستيت (15 دقيقة)',
      'auto_trans_1085': 'شقة بمفردك',
      'auto_trans_1086': '1 فرد (ستوديو منفرد)',
      'auto_trans_1087': 'شقة بمفردك',
      'auto_trans_1088': '1 حمام',
      'auto_trans_1089': 'ستوديو منفرد هادئ',
      'auto_trans_1090': 'تكييف وتدفئة',
      'auto_trans_1091': 'أمن على مدار 24 ساعة',
      'auto_trans_1092': 'قريب من السوبرماركت',
      'auto_trans_1093':
          'ستوديو مثالي للطالب المنفرد الباحث عن الهدوء والتركيز في الدراسة. يبعد دقائق مشياً عن حرم جامعة جورجيا. أثاث حديث ومطبخ مجهز بالكامل.',
      'auto_trans_1094': 'شقة مشتركة لـ 3 طلاب - إطلالة بنورامية',
      'auto_trans_1095': '550 دولار (أو 180 دولار للشخص)',
      'auto_trans_1096': 'سابورتالو (Saburtalo)',
      'auto_trans_1097':
          'إيليا ستيت Ilia (10 دقائق) | جامعة تبليسي الحكومية TSU (20 دقيقة)',
      'auto_trans_1098': 'استئجار مع شريك',
      'auto_trans_1099': '3 أفراد (شقة مشتركة)',
      'auto_trans_1100':
          'غير مدخن ، طالب هادئ ومحترم ، يحافظ على النظافة العامة والهدوء',
      'auto_trans_1101':
          'غرفة نوم خاصة ومفروشة ، حمام ومطبخ مشترك ، شرفة (بلكونة واسعة)',
      'auto_trans_1102': 'استئجار مع شريك',
      'auto_trans_1103': '2 حمام',
      'auto_trans_1104': 'غرف منفصلة ومريحة',
      'auto_trans_1105': 'صالة كبيرة للمذاكرة المشتركة',
      'auto_trans_1106': 'بلكونة واسعة جداً',
      'auto_trans_1107': 'مصعد يعمل 24/7',
      'auto_trans_1108':
          'فرصة ممتازة لثلاثة أصدقاء طلاب أو لتجميع الطلاب. مساحة واسعة وتوزيع ممتاز للغرف يضمن الخصوصية لكل طالب.',
      'auto_trans_1109': 'ستوديو فاخر مستقل - شارع أغماشينيبلي',
      'auto_trans_1110': '400 دولار / شهر',
      'auto_trans_1111': 'ديدوبي (Didube)',
      'auto_trans_1112': 'مشياً إلى محطة المترو والجامعات (10 دقائق)',
      'auto_trans_1113': 'شقة بمفردك',
      'auto_trans_1114': '1 فرد',
      'auto_trans_1115': 'شقة بمفردك',
      'auto_trans_1116': '1 حمام',
      'auto_trans_1117': 'ستوديو مستقل لشخص واحد',
      'auto_trans_1118': 'تكييف وتدفئة',
      'auto_trans_1119': 'إنترنت سريع',
      'auto_trans_1120': 'أثاث جديد',
      'auto_trans_1121':
          'شقة ستوديو خاصة لشخص واحد بموقع ممتاز بالقرب من الخدمات والمواصلات.',
      'auto_trans_1122': 'شقة مع شريك - سابورتالو بالقرب من الطبية',
      'auto_trans_1123': '220 دولار للشخص',
      'auto_trans_1124': 'سابورتالو (Saburtalo)',
      'auto_trans_1125': 'التبليسي الطبية TSMU (5 دقائق مشياً)',
      'auto_trans_1126': 'استئجار مع شريك',
      'auto_trans_1127': 'مطلوب شريك واحد سكن',
      'auto_trans_1128': 'طالب طب أو هندسة غير مدخن ومحافظ على الهدوء والنظافة',
      'auto_trans_1129':
          'غرفة نوم كبيرة خاصة ومكيفة ، حمام ومطبخ مشترك مع طالب واحد فقط',
      'auto_trans_1130': 'استئجار مع شريك',
      'auto_trans_1131': '1 حمام',
      'auto_trans_1132': '1 غرفة نوم مستقلة للشريك',
      'auto_trans_1133': 'مطبخ مجهز',
      'auto_trans_1134': 'بلكونة هادئة',
      'auto_trans_1135':
          'شقة ممتازة لطالب يبحث عن شريك سكن هادئ ومحترم على بعد خطوات من التبليسي الطبية.',
      'auto_trans_1136': 'الإشعارات والتنبيهات',
      'auto_trans_1137': 'لا توجد تنبيهات جديدة حالياً',
      'auto_trans_1138': 'الآن',
      'auto_trans_1139': 'الكل',
      'auto_trans_1140': 'التبليسي الطبية (TSMU)',
      'auto_trans_1141': 'جامعة جورجيا (UG)',
      'auto_trans_1142': 'إيليا ستيت (Ilia State)',
      'auto_trans_1143': 'جامعة تبليسي الحكومية (TSU)',
      'auto_trans_1144': 'شقة',
      'auto_trans_1145': 'بمفردك',
      'auto_trans_1146': 'شقة',
      'auto_trans_1147': 'شريك',
      'auto_trans_1148': 'مشترك',
      'auto_trans_1149': 'غرفة في شقة',
      'auto_trans_1150': 'غرفة في شقة',
      'auto_trans_1151': 'شريك',
      'auto_trans_1152': 'غرفة في شقة',
      'auto_trans_1153': 'مشترك',
      'auto_trans_1154': 'سابورتالو',
      'auto_trans_1155': 'حمامات',
      'auto_trans_1156': 'الكل',
      'auto_trans_1157': 'وقت مفتوح',
      'auto_trans_1158': 'مشياً',
      'auto_trans_1159': '(d+)s*دقيقة',
      'auto_trans_1160': 'الزائر الكريم',
      'auto_trans_1161': 'جورجيا - تبليسي',
      'auto_trans_1162': 'أخبار جورجيا',
      'auto_trans_1163': 'إعلان',
      'auto_trans_1164': 'الآن',
      'auto_trans_1165': 'اختر الجامعات القريبة',
      'auto_trans_1166': 'السعر بنفسك',
      'auto_trans_1167': '️ الحي السكني',
      'auto_trans_1168': 'سابورتالو (Saburtalo)',
      'auto_trans_1169': 'فاكي (Vake)',
      'auto_trans_1170': 'ديدوبي (Didube)',
      'auto_trans_1171': 'نوع السكن',
      'auto_trans_1172': '️ الغرف',
      'auto_trans_1173': 'الحمامات',
      'auto_trans_1174': '1 حمام',
      'auto_trans_1175': '2 حمام',
      'auto_trans_1176': '3 حمامات فأكثر',
      'auto_trans_1177': 'انتقال فوري',
      'auto_trans_1178': 'ميعاد',
      'auto_trans_1179': 'تاريخ',
      'auto_trans_1180': 'سبتمبر',
      'auto_trans_1181': 'انقر لمعاينة الصور وحجز الشقة >>',
      'auto_trans_1182': 'زائر كريم',
      'auto_trans_1183': 'تصفح عام (ضيف)',
      'auto_trans_1184': 'الآن',
      'auto_trans_1185': 'الآن',
      'auto_trans_1186': 'إغلاق',
      'auto_trans_1187': 'الإشعارات والتنبيهات',
      'auto_trans_1188': 'تحديث الإشعارات',
      'auto_trans_1189': 'لا توجد تنبيهات عاجلة حالياً',
      'auto_trans_1190': 'التنبيهات تتم إزالتها تلقائياً بعد مرور 48 ساعة',
      'auto_trans_1191': 'الآن',
      'auto_trans_1192': 'الكل',
      'auto_trans_1193': 'الكل',
      'auto_trans_1194': 'عروض خاصة',
      'auto_trans_1195': 'قريب من التبليسي الطبية',
      'auto_trans_1196': 'ستوديو منفرد',
      'auto_trans_1197': 'غرف مشتركة',
      'auto_trans_1198': 'الكل',
      'auto_trans_1199': 'عروض',
      'auto_trans_1200': 'عروض السكن الطلابي الحصرية',
      'auto_trans_1201': 'لا توجد شقق تطابق هذا الفلتر حالياً',
      'auto_trans_1202': 'مفروشة ومجهزة',
      'auto_trans_1203': '🇪🇬 العربية (Arabic)',
      'auto_trans_1204': '🇬🇧 English (الإنجليزي)',
      'auto_trans_1205': 'جامعة تبليسي الطبية (TSMU)',
      'auto_trans_1206': 'جامعة تبليسي الطبية (TSMU)',
      'auto_trans_1207': 'جامعة تبليسي الطبية (TSMU)',
      'auto_trans_1208': 'جامعة تبليسي الطبية (TSMU)',
      'auto_trans_1209': 'تصفح عام (ضيف)',
      'auto_trans_1210': 'زائر كريم',
      'auto_trans_1211': 'زائر',
      'auto_trans_1212': 'تصفح عام (ضيف)',
      'auto_trans_1213': 'زائر كريم',
      'auto_trans_1214': 'زائر',
      'auto_trans_1215': 'تسجيل الدخول',
      'auto_trans_1216': 'طلب شريك سكن (Find Roommate):\n',
      'auto_trans_1217': 'لا يوجد',
      'auto_trans_1218': 'جاري إرسال طلب السكن... ⏳',
      'auto_trans_1219': 'طالب أبشر',
      'auto_trans_1220': 'جامعة في جورجيا',
      'auto_trans_1221': 'حجز سكن (شقة بمفردك)',
      'auto_trans_1222': 'جاري الاتصال بخدمة العملاء... ⏳',
      'auto_trans_1223':
          'مرحباً، أريد مساعدة خدمة العملاء في حجز سكن بمفردي (Rent Flat - Alone).',
      'auto_trans_1224': 'طالب أبشر',
      'auto_trans_1225': 'جامعة في جورجيا',
      'auto_trans_1226': 'تواصل مباشر لحجز سكن',
      'auto_trans_1227': 'أبشر',
      'auto_trans_1228': 'جميع الشقق المتاحة',
      'auto_trans_1229':
          'قائمة بكافة الشقق السكنية المتاحة للطلاب مع كافة التفاصيل والأسعار.',
      'auto_trans_1230': 'شقق تناسب شخص بمفرده',
      'auto_trans_1231':
          'قائمة الشقق والاستوديوهات المخصصة والمناسبة لسكن طالب واحد فقط.',
      'auto_trans_1232': 'نموذج البحث عن شريك',
      'auto_trans_1233':
          'قم بتعبئة بياناتك ليقوم فريق أبشر بمطابقتك مع الشريك الأنسب:',
      'auto_trans_1234': 'الاسم الكامل',
      'auto_trans_1235': 'مطلوب',
      'auto_trans_1236': 'الجنسية',
      'auto_trans_1237': 'مطلوب',
      'auto_trans_1238': 'الجامعة',
      'auto_trans_1239': 'التخصص الدراسي',
      'auto_trans_1240': 'مطلوب',
      'auto_trans_1241': 'رقم الواتساب',
      'auto_trans_1242': 'مطلوب',
      'auto_trans_1243': 'متى تريد الانتقال؟',
      'auto_trans_1244': 'مطلوب',
      'auto_trans_1245': 'ملاحظات إضافية',
      'auto_trans_1246': 'إرسال إلى خدمة العملاء',
      'auto_trans_1247': 'جامعة تبليسي الطبية (TSMU)',
      'auto_trans_1248': 'جامعة تبليسي الطبية (TSMU)',
      'auto_trans_1249': 'زائر',
      'auto_trans_1250': 'تسجيل الدخول',
      'auto_trans_1251': 'جاري إرسال طلب الشريك... ⏳',
      'auto_trans_1252': 'طالب أبشر',
      'auto_trans_1253': 'جامعة في جورجيا',
      'auto_trans_1254': 'بحث عن شريك سكن (Roommate)',
      'auto_trans_1255': 'تجميع الطلاب في شقة مشتركة',
      'auto_trans_1256': 'الاسم الكامل',
      'auto_trans_1257': 'مطلوب',
      'auto_trans_1258': 'الجامعة',
      'auto_trans_1259': 'التخصص',
      'auto_trans_1260': 'مطلوب',
      'auto_trans_1261': 'رقم هاتف التواصل (واتساب)',
      'auto_trans_1262': 'مطلوب',
      'auto_trans_1263': 'الميزانية الشهرية المقدرة للشخص (بالدولار USD)',
      'auto_trans_1264': 'مطلوب',
      'auto_trans_1265': 'ملاحظات إضافية (مثال: تفضيل التدخين، الهدوء، إلخ)',
      'auto_trans_1266': 'إرسال طلب التجميع لفريق الدعم',
      'auto_trans_1267': 'فني كهربائي',
      'auto_trans_1268': 'صيانة كافة الأعطال والتوصيلات الكهربائية',
      'auto_trans_1269': 'فني سباكة',
      'auto_trans_1270': 'إصلاح تسريبات المياه والصيانة الصحية',
      'auto_trans_1271': 'استخراج إقامة طلابية',
      'auto_trans_1272': 'تجهيز أوراق الإقامة لأول مرة أو التجديد',
      'auto_trans_1273': 'تسجيل العنوان القانوني',
      'auto_trans_1274': 'إصدار وثيقة العنوان المعتمدة في جورجيا',
      'auto_trans_1275': 'التسجيل والنقل الجامعي',
      'auto_trans_1276': 'إجراءات القبول وتحويل الساعات بين الجامعات',
      'auto_trans_1277': 'زائر',
      'auto_trans_1278': 'تسجيل الدخول',
      'auto_trans_1279': 'لم يتم التحديد',
      'auto_trans_1280': 'تنظيف',
      'auto_trans_1281': 'إلغاء',
      'auto_trans_1282': 'لم يُحدد',
      'auto_trans_1283': 'نعم ️',
      'auto_trans_1284': 'لا',
      'auto_trans_1285': 'بدون ملاحظات إضافية',
      'auto_trans_1286': 'خصم من نقاط المحفظة',
      'auto_trans_1287': 'الدفع نقداً',
      'auto_trans_1288': 'فشل الخصم من النقاط',
      'auto_trans_1289': 'طالب أبشر',
      'auto_trans_1290': 'جامعة في جورجيا',
      'auto_trans_1291': 'إضافة',
      'auto_trans_1292': 'طالب تجريبي (أبشر)',
      'auto_trans_1293': 'جامعة تبليسي الطبية (TSMU)',
      'auto_trans_1294': 'تم تسجيل الحساب بنجاح',
      'auto_trans_1295': 'شقة طلابية ممتازة',
      'auto_trans_1296': 'شقة سكنية',
      'auto_trans_1297': 'سعر مميز',
      'auto_trans_1298': 'تبليسي',
      'auto_trans_1299': 'موقع ممتاز',
      'auto_trans_1300': '3 غرف',
      'auto_trans_1301': 'شقة',
      'auto_trans_1302': 'فوري',
      'auto_trans_1303': 'انتقال فوري',
      'auto_trans_1304': 'شقة طلابية فاخرة - شارع بيكيني (Pekini)',
      'auto_trans_1305': '450 دولار / شهر',
      'auto_trans_1306': 'تبليسي - საბურთალო (سابورتالو)',
      'auto_trans_1307': 'قريبة جداً من التبليسي الطبية TSMU (مشياً)',
      'auto_trans_1308': '3 غرف',
      'auto_trans_1309': 'شقة',
      'auto_trans_1310': 'فوري',
      'auto_trans_1311': 'انتقال فوري',
      'auto_trans_1312': '3 غرف واسعة',
      'auto_trans_1313': 'تدفئة مركزية دافئة',
      'auto_trans_1314': 'بلكونة بإطلالة مفتوحة',
      'auto_trans_1315': 'إنترنت ألياف ضوئية سريع',
      'auto_trans_1316': 'مفروشة بالكامل',
      'auto_trans_1317': 'جامعة تبليسي الطبية (TSMU)',
      'auto_trans_1318':
          'شقة ممتازة للطلاب في قلب تبليسي بالقرب من محطة مترو التكنيكال. مجهزة بالكامل بالفرش والأجهزة الكهربائية مع إطلالة رائعة من البلكونة وتدفئة مركزية ممتازة للشتاء. الدفع يتم نقداً عند الاستلام.',
      'auto_trans_1319': 'ستوديو مودرن - بالقرب من جامعة جورجيا (UG)',
      'auto_trans_1320': '380 دولار / شهر',
      'auto_trans_1321': 'تبليسي - شارع كوستافا',
      'auto_trans_1322': 'جامعة جورجيا UG وستيت UT',
      'auto_trans_1323': '1 غرفة',
      'auto_trans_1324': 'شقة',
      'auto_trans_1325': 'فوري',
      'auto_trans_1326': 'انتقال فوري',
      'auto_trans_1327': 'ستوديو منفرد هادئ',
      'auto_trans_1328': 'تكييف وتدفئة',
      'auto_trans_1329': 'أمن على مدار 24 ساعة',
      'auto_trans_1330': 'قريب من السوبرماركت',
      'auto_trans_1331':
          'ستوديو مثالي للطالب المنفرد الباحث عن الهدوء والتركيز في الدراسة. يبعد دقائق مشياً عن حرم جامعة جورجيا. أثاث حديث ومطبخ مجهز بالكامل.',
      'auto_trans_1332': 'شقة مشتركة لـ 3 طلاب - إطلالة بنورامية',
      'auto_trans_1333': '550 دولار (أو 180 دولار للشخص)',
      'auto_trans_1334': 'تبليسي - فاكي (Vake)',
      'auto_trans_1335': 'قريبة من جامعة إيليا والطبية',
      'auto_trans_1336': '3 غرف',
      'auto_trans_1337': 'غرفة في شقة',
      'auto_trans_1338': 'فوري',
      'auto_trans_1339': 'انتقال فوري',
      'auto_trans_1340': 'غرف منفصلة ومريحة',
      'auto_trans_1341': 'صالة كبيرة للمذاكرة المشتركة',
      'auto_trans_1342': 'بلكونة واسعة جداً',
      'auto_trans_1343': 'مصعد يعمل 24/7',
      'auto_trans_1344': 'جامعة إيليا الحكومية (Ilia)',
      'auto_trans_1345':
          'فرصة ممتازة لثلاثة أصدقاء طلاب أو لتجميع الطلاب. مساحة واسعة وتوزيع ممتاز للغرف يضمن الخصوصية لكل طالب.',
      'auto_trans_1346': 'جامعة تبليسي الطبية (TSMU)',
      'auto_trans_1347': 'جامعة جورجيا (UG)',
      'auto_trans_1348': 'جامعة إيليا الحكومية (Ilia)',
      'auto_trans_1349': 'جامعة تبليسي الحكومية (TSU)',
      'auto_trans_1350': 'سابورتالو (Saburtalo)',
      'auto_trans_1351': 'فاكي (Vake)',
      'auto_trans_1352': 'ديدوبي (Didube)',
      'auto_trans_1353': 'متاتسميندا (Mtatsminda)',
      'auto_trans_1354': 'إساني (Isani)',
      'auto_trans_1355': 'جلَداني (Gldani)',
      'auto_trans_1356': 'الآن',
      'auto_trans_1357': 'انقطاع المياه غداً الأحد في سابورتالو',
      'auto_trans_1358':
          'تعلن شركة المياه الوطنية عن قطع مؤقت لإمدادات المياه غداً الأحد من الساعة 10:00 صباحاً وحتى الساعة 04:00 عصراً لإجراء أعمال الصيانة السنوية لخطوط الإمداد المغذية للمنطقة.',
      'auto_trans_1359': 'منذ ساعة',
      'auto_trans_1360': 'تعديل موعد صلاة الجمعة في مسجد تبليسي',
      'auto_trans_1361':
          'تقرر بدء الخطبة الأولى لصلاة الجمعة المباركة في مسجد تبليسي المركزي في تمام الساعة 01:30 ظهراً بدلاً من الساعة 01:00 ظهراً لتسهيل انضمام المصلين من الجامعات المختلفة.',
      'auto_trans_1362': 'منذ 3 ساعات',
      'auto_trans_1363': 'قطع الكهرباء المجدول يوم الثلاثاء القادم',
      'auto_trans_1364':
          'فصل مبرمج للتيار الكهربائي عن أجزاء من حي ديدوبي Didube يوم الثلاثاء القادم من الساعة 09:00 صباحاً إلى الساعة 11:00 صباحاً لتوصيل محولات شبكية جديدة وتحسين استقرار الطاقة.',
      'auto_trans_1365': 'أمس',
      'auto_trans_1366': 'الآن',
      'auto_trans_1367': 'تنبيه انقطاع المياه في سابورتالو',
      'auto_trans_1368':
          'نسترعي انتباه الطلاب الكرام في سابورتالو بأنه سيتم قطع المياه غداً الأحد من الساعة 10:00 صباحاً وحتى الساعة 04:00 عصراً.',
      'auto_trans_1369': 'منذ ساعة',
      'auto_trans_1370': 'صلاة الجمعة في مسجد تبليسي',
      'auto_trans_1371':
          'تقرر بدء خطبة صلاة الجمعة المباركة في تمام الساعة 01:30 ظهراً لتسهيل انضمام الطلاب من مختلف الجامعات.',
      'auto_trans_1372': 'منذ 3 ساعات',
      'auto_trans_1373': 'خدمة طلابية',
      'auto_trans_1374': 'فني كهربائي',
      'auto_trans_1375': 'صيانة كافة الأعطال والتوصيلات الكهربائية',
      'auto_trans_1376': 'فني سباكة',
      'auto_trans_1377': 'إصلاح تسريبات المياه والصيانة الصحية',
      'auto_trans_1378': 'استخراج إقامة طلابية',
      'auto_trans_1379': 'تجهيز أوراق الإقامة لأول مرة أو التجديد',
      'auto_trans_1380': 'تسجيل العنوان القانوني',
      'auto_trans_1381': 'إصدار وثيقة العنوان المعتمدة في جورجيا',
      'auto_trans_1382': 'التسجيل والنقل الجامعي',
      'auto_trans_1383': 'إجراءات القبول وتحويل الساعات بين الجامعات',
      'auto_trans_1384': 'تم إرسال الطلب وحفظه مؤقتاً في التطبيق',
      'auto_trans_1385': 'الآن',
      'auto_trans_1386': 'حدث خطأ في الاتصال بالخادم',
      'auto_trans_1387': 'معاينة الفيديو (YouTube / Drive) متاحة على الويب',
      'reviews_screen_title': 'تقييماتي وآراء الطلاب',
      'rate_service_prompt': 'يرجى تقييم الخدمة التي تلقيتها',
      'rate_now': 'قيم الآن',
      'remind_later': 'تذكيري لاحقاً',
      'comment_optional': 'ملاحظات أو تعليقات إضافية (اختياري)...',
      'submit_review': 'إرسال التقييم',
      'my_reviews': 'تقييماتي',
      'service_name': 'اسم الخدمة',
      'rating': 'التقييم',
      'comment': 'التعليق',
      'status': 'حالة المراجعة',
      'created_date': 'تاريخ التقديم',
      'status_pending': 'قيد الانتظار',
      'status_approved': 'مقبول',
      'status_rejected': 'مرفوض',
      'edit_review': 'تعديل التقييم',
      'delete_review': 'حذف التقييم',
      'delete_confirm_title': 'تأكيد الحذف',
      'delete_confirm_msg': 'هل أنت متأكد من رغبتك في حذف هذا التقييم نهائياً؟',
      'feedback_menu_option': 'مقترحات وبلاغات الأعطال',
      'feedback_form_title': 'تقديم بلاغ أو مقترح عطل',
      'feedback_type': 'نوع البلاغ/المقترح',
      'feedback_suggestion': 'مقترح',
      'feedback_bug': 'بلاغ عن عطل',
      'feedback_ux': 'تجربة المستخدم',
      'feedback_feature': 'طلب ميزة جديدة',
      'feedback_comment': 'تفاصيل المقترح أو البلاغ',
      'submit_feedback': 'إرسال البلاغ/المقترح',
      'my_feedback': 'سجل المقترحات والبلاغات',
      'status_reviewed': 'تمت المراجعة',
      'status_resolved': 'تم حلها',
      'failed_to_send': 'فشل إرسال الرسالة. من فضلك حاول مرة أخرى.',
      'request_service_title': 'تقديم طلب خدمة جديدة',
      'selected_service': 'الخدمة المطلوبة',
      'execution_time': 'موعد التنفيذ المفضل',
      'additional_details': 'تفاصيل إضافية',
      'detailed_address_hint': 'اسم الشارع، رقم البناية، رقم الشقة',
      'previous_requests': 'طلباتي السابقة',
      'status_under_review': 'قيد المراجعة',
      'status_completed': 'تم التنفيذ',
      'service_request': 'طلب خدمة طلابية',
      'apartment_booking': 'حجز سكن طلابي',
      'roommate_request': 'طلب شريك سكن',
      'request_number': 'رقم الطلب',
      'request': 'طلب',
      'request_date': 'تاريخ الطلب',
      'failed_load_requests': 'فشل تحميل الطلبات السابقة',
      'no_previous_requests': 'لا توجد طلبات سابقة',
      'status_pending_payment': 'في انتظار الدفع',
      'status_in_progress': 'جاري التنفيذ',
      'status_unknown': 'غير معروف',
      'points_unit': 'نقطة',
      'tx_type_credit': 'شحن رصيد / إيداع',
      'tx_type_debit': 'خصم نقاط / دفع',
      'tx_type_unknown': 'عملية غير معروفة',
      'failed_load_transactions': 'فشل تحميل سجل المعاملات',
      'about_description':
          'تطبيق أبشر هو المنصة الطلابية الشاملة في جورجيا، نوفر لك حلول السكن الطلابي المباشر وحجز الغرف والاستوديوهات، وتجميع الشركاء المتوافقين بالإضافة إلى الخدمات والصيانة الفورية وخدمات الإقامة والأوراق القانونية بأعلى جودة وأفضل الأسعار.',
      'supported_languages_title': 'اللغات المدعومة',
      'contact_us_title': 'معلومات التواصل',
      'instagram_label': 'حساب الإنستجرام',
      'whatsapp_label': 'رقم الواتساب',
      'office_address_label': 'عنوان المكتب',
      'office_address_value': 'تبليسي، جورجيا (شارع بيكيني رقم 24)',
      'apartment': 'شقة كاملة',
      'room_shared': 'غرفة في شقة مشتركة',
      'studio': 'استوديو',
      'not_specified': 'غير حدد',
      'no_services_available': 'لا توجد خدمات متاحة حاليًا',
      'password_changed_success': 'تم تغيير كلمة المرور بنجاح.',
      'change_password': 'تغيير كلمة المرور',
      'current_password': 'كلمة المرور الحالية',
      'new_password_label': 'كلمة المرور الجديدة',
      'pw_min_8': 'كلمة المرور قصيرة (8 أحرف على الأقل)',
      'pw_max_128': 'كلمة المرور طويلة جداً (128 حرفاً كحد أقصى)',
      'confirm_password_label': 'تأكيد كلمة المرور الجديدة',
      'passwords_dont_match': 'كلمات المرور غير متطابقة',
      'change_password_btn': 'تغيير كلمة المرور',
      'edit_profile_title': 'تعديل الملف الشخصي',
      'name_too_short': 'الاسم قصير جداً (3 أحرف على الأقل)',
      'name_too_long': 'الاسم طويل جداً (الحد الأقصى 150 حرفاً)',
      'email_too_long': 'البريد الإلكتروني طويل جداً',
      'phone_len_error': 'رقم الهاتف يجب أن يكون بين 5 و 50 رقم',
      'uni_too_long': 'الاسم طويل جداً (الحد الأقصى 150 حرفاً)',
      'failed_load_profile': 'فشل تحميل بيانات الحساب',
      'confirm_avatar_title': 'تغيير الصورة الشخصية',
      'confirm_avatar_desc': 'هل تريد حفظ الصورة المختارة كصورة شخصية جديدة؟',
      'confirm': 'تأكيد',
      'image_pick_error': 'حدث خطأ أثناء اختيار الصورة',
      'edit_profile_sub': 'تعديل الاسم والبريد والهاتف والجامعة',
      'change_password_sub': 'تحديث كلمة مرور حسابك بأمان',
      'status_cancelled': 'تم الإلغاء',
      'status_accepted': 'مقبول',
      'status_processing': 'جاري المعالجة',
      'status_paid': 'مدفوع',
      'status_unpaid': 'غير مدفوع',
      'status_expired': 'منتهي',
      'tx_type_bonus': 'مكافأة',
      'tx_type_refund': 'استرداد',
      'attached_video': 'فيديو مرفق',
      'attached_image': 'صورة مرفقة',
      'service_cost_free': 'مجانية (0 نقاط)',
      'no_apartments_title': 'لا توجد شقق سكنية',
      'no_apartments_desc': 'لم نجد أي شقق تطابق معايير البحث والفلترة حالياً.',
      'no_roommates_title': 'لا يوجد زملاء سكن',
      'no_roommates_desc': 'لا يوجد طلبات تجميع سكن متاحة حالياً.',
      'no_requests_title': 'لا توجد طلبات سابقة',
      'no_requests_desc': 'لم تقم بتقديم أي طلبات سكن أو خدمات طلابية بعد.',
      'no_wallet_history_title': 'سجل العمليات فارغ',
      'no_wallet_history_desc': 'لم تقم بأي عمليات مالية أو شحن رصيد حتى الآن.',
      'no_notifications_title': 'لا توجد إشعارات',
      'no_notifications_desc':
          'صندوق الإشعارات فارغ، لا توجد تنبيهات جديدة لك حالياً.',
      'no_services_title': 'الخدمات غير متوفرة',
      'no_services_desc': 'نعتذر، لا توجد خدمات طلابية متاحة في منطقتك حالياً.',
      'no_ratings_title': 'لا توجد تقييمات',
      'no_ratings_desc': 'لم تقم بتقييم أي خدمات طلابية سابقة بعد.',
      'no_search_results_title': 'لا توجد نتائج بحث',
      'no_search_results_desc':
          'لم نجد أي نتائج تطابق الكلمات التي تبحث عنها. يرجى تعديل خيارات البحث.',
      'no_offers_title': 'لا توجد عروض',
      'no_offers_desc': 'لا توجد عروض سكن خاصة متاحة حالياً في هذه الفئة.',
      'limited_offer': 'عرض محدود',
      'loading_data': 'جاري تحميل البيانات...',
      'loading_apartments': 'جاري تحميل الشقق...',
      'loading_services': 'جاري تحميل الخدمات...',
      'loading_requests': 'جاري تحميل الطلبات...',
      'loading_transactions': 'جاري تحميل سجل المعاملات...',
      'loading_notifications': 'جاري تحميل الإشعارات...',
      'loading_profile': 'جاري تحميل بيانات الملف الشخصي...',
      'loading_news': 'جاري تحميل الأخبار...',
      'loading_chat': 'جاري تحميل المحادثة...',
      'saving_data': 'جاري حفظ البيانات...',
      'sending_request': 'جاري إرسال الطلب...'
    },
    'en': {
      'admin_portal_btn': 'Admin Portal',
      'up_to_price': 'Up to',
      'admin_portal_sub': 'Manage apartments, services, students, and support',
      'georgian_lang_label': 'ქართული (Under Development)',
      'apply': 'Apply Filter',
      'book_apartment_desc':
          'Fill out the form and we will contact you to confirm booking and arrange viewing',
      'book_apartment_title': 'Book Accommodation (Apartment or Studio)',
      'book_now_cash': 'Book Now (Cash Payment on Viewing)',
      'budget_title': 'Monthly Budget',
      'cancel_filter': 'Cancel',
      'clear_filter': 'Clear Filters',
      'enter_budget_hint': 'Enter maximum price in USD',
      'notifications': 'Notifications',
      'select_universities': 'Select Nearby Universities',
      'active_apartments': 'Active Apartments',
      'active_services': 'Active Services',
      'active_students': 'Registered Students',
      'service_requests': 'Service Requests',
      'total_points_spent': 'Total Points Spent',
      'total_transactions': 'Total Transactions',
      'app_title': 'ABSHER',
      'welcome': 'Welcome,',
      'home': 'Home',
      'services': 'Services',
      'chat': 'Chat',
      'offers': 'Offers',
      'profile': 'Profile',
      'change_lang': 'Change App Language',
      'lang_desc': 'English / Arabic',
      'logout': 'Logout from Account',
      'guest_logout': 'Exit to Login Screen',
      'guest_mode': 'You are currently browsing as a guest!',
      'roommate_match': 'Roommate Matchmaking',
      'roommate_desc':
          'Register your details and support will match you with compatible roommates.',
      'quick_services': 'Quick Student Services',
      'view_all': 'View All',
      'browse_apts': 'Browse Available Student Apartments',
      'no_commission': 'Direct & Furnished Student Offers',
      'cash_payment': 'Safe Cash Payment upon Delivery',
      'my_bookings': 'My Bookings & Requests',
      'payment_method': 'Payment Method in ABSHER',
      'contact_support': 'Direct Contact with Support',
      'about_app': 'About ABSHER App',
      'splash_subtitle': 'ABSHER - Your Premier Student Companion in Georgia',
      'skip_to_start': 'Skip to Start >>',
      'login_fail': 'Login failed. Check your credentials.',
      'login_welcome': 'Welcome to ABSHER',
      'login_subtitle':
          'Log in to access student housing and services in Georgia',
      'email_or_phone': 'Email or Phone Number',
      'please_enter_email': 'Please enter email or phone',
      'password': 'Password',
      'please_enter_password': 'Please enter password',
      'contact_support_pw':
          'Contact support on Instagram @absher_georgia to recover account',
      'forgot_pw': 'Forgot Password?',
      'login_btn': 'Log In',
      'enter_as_guest': 'Enter as Guest & Explore',
      'no_account_yet': 'Don\'t have a student account yet?',
      'create_new_account': 'Create New Account',
      'guest_name': 'Respected Guest',
      'guest_uni': 'General Browsing (Guest)',
      'other_uni_manual': 'Other (Manual Entry)',
      'register_fail': 'Account creation failed. Check details.',
      'create_account_title': 'Create New Student Account',
      'create_account_subtitle':
          'Join ABSHER family and benefit from all our services in Georgia',
      'full_name': 'Full Name',
      'required_field': 'Required',
      'email': 'Email',
      'invalid_email': 'Invalid Email',
      'phone_example': 'Phone Number',
      'georgia_uni': 'University in Georgia',
      'uni_and_district': 'University Name and District',
      'please_enter_uni_dist': 'Please enter university and district',
      'pw_min_6': 'At least 6 characters',
      'create_account_btn': 'Create Account Now',
      'already_have_account': 'Already have an account?',
      'all_flats': 'All Flats',
      'flat_alone': 'Flat Alone',
      'with_roommate': 'With Roommate',
      'all_districts': 'All Districts',
      'all': 'All',
      'select_rooms': 'Select Rooms...',
      'one_room': '1 Room',
      'two_rooms': '2 Rooms',
      'three_plus_rooms': '3+ Rooms',
      'filter_flats': 'Filter Flats',
      'rental_type': 'Rental Type:',
      'district': 'District:',
      'bedrooms': 'Bedrooms:',
      'bathrooms': 'Bathrooms:',
      'distance_uni': 'Distance to Uni (walking):',
      '10_mins': '10 mins',
      '20_mins': '20 mins',
      '30_mins': '30 mins',
      'apply_filter': 'Apply Filter',
      'cancel': 'Cancel',
      'select_nearby_unis': 'Select Nearby Universities',
      'confirm_selection': 'Confirm Selection',
      'search_flats': 'Search Flats...',
      'no_results': 'No results matching your search',
      'details': 'Details',
      'book_now': 'Book Now',
      'welcome_user': 'Welcome,',
      'wallet_points': 'Wallet & Points',
      'current_points_balance': 'Current Points Balance',
      'points_usage_desc': 'You can use points to pay for services',
      'transaction_history': 'Transaction History',
      'no_previous_transactions': 'No previous transactions',
      'default_student_name': 'Honored Guest',
      'default_student_uni': 'University of Georgia',
      'create_account_now':
          'Create a student account now to benefit from all offers and request roommate matching.',
      'login_or_register': 'Login / Register',
      'booking_status_subtitle': 'Track your flat status or roommate request',
      'wallet_subtitle': 'Track balance and pay with points',
      'please_login_wallet': 'Please login first to use wallet',
      'support_subtitle': 'Direct chat with our support team',
      'about_subtitle': 'Version 1.0.0 - ABSHER in Georgia',
      'clicked_on': 'Clicked on:',
      'available_options': 'Available Options',
      'furnished_equipped': 'Furnished & Equipped ️',
      'no_matching_flats': 'No matching flats currently in this list.',
      'go_back': 'Go Back',
      'immediate_move_in': 'Immediate Move-in',
      'click_to_view_images': 'Click to view images and book >>',
      'apartment_details': 'Apartment Details',
      'images_count': 'Images',
      'apartment_number': 'Apartment #',
      'proximity_label': 'Proximity:',
      'close_to_unis': 'Close to main universities',
      'roommate_reqs_title': 'Rent with Roommate (Requirements):',
      'roommate_reqs': 'Roommate Requirements:',
      'roommate_facilities': 'Available Space & Facilities:',
      'features_and_facilities': 'Features & Facilities',
      'great_features': 'Great features',
      'apartment_description': 'Apartment Description',
      'guest_alert_title': 'Alert',
      'guest_alert_body_booking':
          'Sorry, you cannot request a booking without logging in.',
      'guest_alert_body_roommate':
          'Sorry, you must login to send a roommate request!',
      'choose_housing_method': 'Choose your housing method',
      'housing_method_desc':
          'You can book a flat alone or fill out a roommate form.',
      'browse_flats': 'Browse Flats',
      'browse_flats_desc': 'View available flats with all images and prices.',
      'all_available_flats': 'All Available Flats',
      'all_available_flats_desc':
          'List of all available flats for students with details and prices.',
      'flat_room_choice': 'Choose a room in a flat',
      'flat_room_desc': 'Show flats and studios suitable for one person.',
      'flats_for_one': 'Flats for one person',
      'flats_for_one_desc': 'Flats and studios dedicated to single students.',
      'roommate_form_title': 'Roommate Request Form',
      'roommate_form_desc':
          'Fill out your info and we will match you with the best roommate.',
      'full_name_label': 'Full Name',
      'nationality_label': 'Nationality',
      'gender_label': 'Gender',
      'male': 'Male',
      'female': 'Female',
      'males_only': 'Males Only',
      'females_only': 'Females Only',
      'university_label': 'University',
      'major_label': 'Major',
      'major_study_label': 'Major of Study',
      'whatsapp_number': 'WhatsApp Number',
      'whatsapp_contact_number': 'Contact WhatsApp Number',
      'when_move_in': 'When do you want to move?',
      'move_in_date_label': 'Required Move-in Date',
      'immediate_move': 'Immediate / ASAP',
      'this_month_move': 'During this month',
      'next_semester_move': 'At the start of the next semester',
      'choose_date': 'Choose a Date',
      'additional_notes': 'Additional Notes',
      'additional_notes_hint': 'Additional Notes (e.g., smoking, quiet, etc)',
      'send_to_customer_service': 'Send to Customer Service',
      'send_roommate_request': 'Send Match Request to Support',
      'roommate_match_title': 'Student Flat Matching',
      'roommate_match_card_title': 'Find a compatible roommate!',
      'roommate_match_card_desc':
          'Register your info and budget, and we will match you with students from your uni.',
      'your_info_and_prefs': 'Your Info & Housing Prefs',
      'monthly_budget_usd': 'Estimated Monthly Budget per Person (USD)',
      'housing_type_req': 'Required Housing Type',
      'guest_alert_body_services':
          'Sorry, you must login to request services and instant maintenance!',
      'service_form_title': 'Service Request Form',
      'service_form_desc': 'Choose a service and fill in the request details:',
      'requested_service': 'Requested Service',
      'whatsapp_contact_short': 'WhatsApp Contact Number',
      'detailed_address': 'Detailed Address',
      'best_time_to_execute': 'Best Execution Time (from Calendar)',
      'attach_image_optional': 'Attach Image (Optional)',
      'image_attached_success': 'Image Attached ️',
      'cleaning_details_title':
          'Set Home Area & Estimated Price (3-4 GEL per meter):',
      'number_of_rooms': 'Number of Rooms',
      'area_in_meters': 'Area (meters)',
      'estimated_cost': 'Estimated Cost:',
      'currency_gel': 'GEL',
      'notes_details_hint': 'Write your specific details and notes here...',
      'notes_and_details': 'Notes & Order Details',
      'promo_code': 'Promo Code',
      'use_wallet_points': 'Use wallet points to pay',
      'submit_form_confirm': 'Submit Form & Confirm Order',
      'all_student_services': 'All ABSHER Student Services ️',
      'instant_tag': 'Instant',
      'request_service_button': 'Request Service ️',
      'welcome_chat_msg':
          'Welcome to ABSHER live support ! How can we help you today with housing or services in Georgia?',
      'rate_customer_service': 'Rate Customer Service',
      'rate_customer_service_desc':
          'How satisfied are you with the speed and quality of ABSHER technical support? (Admin visibility only)',
      'additional_comments_hint': 'Additional notes or comments...',
      'submit_rating': 'Submit Rating',
      'rating_success_msg':
          'Your rating has been submitted to ABSHER management and saved successfully. Thank you!',
      'attach_link': 'Attach Link',
      'enter_or_paste_link': 'Enter or paste any link to share in the chat:',
      'url_label': 'URL',
      'send_now': 'Send Now',
      'attach_youtube_drive': 'Attach YouTube or Drive Video',
      'enter_youtube_drive_link':
          'Enter or paste a video link from YouTube or Google Drive:',
      'video_url_label': 'Video URL',
      'uploading_file_loading': 'Uploading and sending file... ⏳',
      'file_upload_success': 'File uploaded and sent successfully!',
      'file_upload_fail': 'Sorry, failed to upload file to the server',
      'attach_media_chat': 'Attach media to chat',
      'choose_image_gallery': 'Choose image from gallery',
      'choose_video_gallery': 'Choose video from gallery',
      'manual_link_input': 'Manual file link input (external site)',
      'preview_video_attachment': 'Preview Attached Video',
      'preview_image_attachment': 'Preview Attached Image',
      'video_player_active': 'Video player active',
      'absher_support_chat_title': 'ABSHER Management - Support & Chat',
      'rate_button': 'Rate',
      'direct_call_snackbar': 'Direct phone call or via WhatsApp +995555123456',
      'reply_to_message_selected': 'Message selected to reply',
      'you': 'You',
      'tech_support': 'Tech Support',
      'click_to_play_video': 'Click to play video',
      'reply_to_yourself': 'Reply to yourself',
      'reply_to_support': 'Reply to customer service',
      'attach_image_tooltip': 'Attach Image',
      'attach_video_tooltip': 'Attach Video',
      'attach_link_tooltip': 'Attach Link',
      'type_message_hint': 'Type your message for management here...',
      'sending_service_request': 'Sending service request... ⏳',
      'error_sending_service': 'Error sending service request:',
      'close_dialog': 'Close',
      'error_sending_request': 'Error sending request',
      'connection_error': 'Connection error',
      'error_occurred': 'An error occurred',
      'error': 'Error',
      'retry': 'Retry',
      'close': 'Close',
      'save': 'Save',
      'title': 'Title',
      'description': 'Description',
      'admin_portal': 'Absher Admin Portal',
      'dashboard': 'Dashboard',
      'apartments': 'Apartments',
      'students': 'Students',
      'failed_load_students': 'Failed to load students',
      'search_students': 'Search students...',
      'failed_load_services': 'Failed to load services',
      'failed_save_service': 'Failed to save service',
      'price_points': 'Price (Points)',
      'active': 'Active',
      'please_fill_fields': 'Please fill all fields',
      'username_or_email': 'Username or Email',
      'failed_load_dashboard': 'Failed to load dashboard',
      'failed_load_apartments': 'Failed to load apartments',
      'failed_save_apartment': 'Failed to save apartment',
      'price': 'Price',
      'capacity': 'Capacity',
      'district_id': 'District ID',
      'available': 'Available',
      'auto_trans_1000': 'Absher Georgia',
      'auto_trans_1001': '12:00 PM',
      'auto_trans_1002': 'Guest',
      'auto_trans_1003': 'Important Notice',
      'auto_trans_1004':
          'Sorry, you must log in or create a student account first to book apartments and student housing!',
      'auto_trans_1005': 'Cancel',
      'auto_trans_1006': 'Login',
      'auto_trans_1007': 'You are about to request a viewing for:',
      'auto_trans_1008': '. Payment is in cash upon arrival.',
      'auto_trans_1009': 'Contact Phone Number (WhatsApp)',
      'auto_trans_1010': 'Viewing Day',
      'auto_trans_1011': 'Suitable Time',
      'auto_trans_1012': 'Additional Notes (e.g. specific meeting point)',
      'auto_trans_1013':
          'Note: Any change or modification in the appointment is easily and directly done through chat with customer service.',
      'auto_trans_1014': 'Sending booking request... ⏳',
      'auto_trans_1015': 'None',
      'auto_trans_1016':
          'Note: The student wants to view the apartment at this time, and any change in time is coordinated via this chat.',
      'auto_trans_1017': 'Absher Student',
      'auto_trans_1018': 'University in Georgia',
      'auto_trans_1019': 'Confirm Request and Go to Instant Chat',
      'auto_trans_1020': 'Tbilisi, Georgia',
      'auto_trans_1021': 'Roommate',
      'auto_trans_1022': 'Now',
      'auto_trans_1023': 'Now',
      'auto_trans_1024': 'Now',
      'auto_trans_1025': 'Now',
      'auto_trans_1026': 'Student',
      'auto_trans_1027': 'University in Georgia',
      'auto_trans_1028': 'Absher Student',
      'auto_trans_1029': 'University in Georgia',
      'auto_trans_1030': 'Excellent rating with no additional notes',
      'auto_trans_1031': 'Now',
      'auto_trans_1032': 'Student',
      'auto_trans_1033': 'University in Georgia',
      'auto_trans_1034': 'Cancel',
      'auto_trans_1035': 'Cancel',
      'auto_trans_1036': 'Video attached by student',
      'auto_trans_1037': 'Image attached by student',
      'auto_trans_1038': 'Studio',
      'auto_trans_1039': 'Single',
      'auto_trans_1040': '1 Room',
      'auto_trans_1041': 'Private',
      'auto_trans_1042': 'Shared for 3',
      'auto_trans_1043': 'Absher',
      'auto_trans_1044': 'Date',
      'auto_trans_1045': 'Date',
      'auto_trans_1046': 'September',
      'auto_trans_1047': 'Latest Georgia News',
      'auto_trans_1048': 'Update News',
      'auto_trans_1049': 'No news currently',
      'auto_trans_1050': 'Now',
      'auto_trans_1051': 'School Season Offers',
      'auto_trans_1052': 'Book your student housing now easily and safely!',
      'auto_trans_1053':
          'Safe cash payment directly upon receiving your apartment key in Tbilisi.',
      'auto_trans_1054': 'Exclusive Offers',
      'auto_trans_1055': 'Economical Shared Housing',
      'auto_trans_1056': 'Grouping students in apartments near universities',
      'auto_trans_1057':
          'Save half the rent and register your name for support to match you with compatible peers.',
      'auto_trans_1058': 'Save 50%',
      'auto_trans_1059': 'Airport Reception and University Transfer',
      'auto_trans_1060': 'Recently arrived in Tbilisi? We welcome you!',
      'auto_trans_1061':
          'Comfortable cars and representatives to assist you on your first step and deliver you to your door.',
      'auto_trans_1062': '24/7 Service',
      'auto_trans_1063': 'Student Residencies and Legal Registration',
      'auto_trans_1064': 'Clearing all your university and legal papers',
      'auto_trans_1065':
          'A specialized team to ensure the safety of your legal status and residency in Georgia easily.',
      'auto_trans_1066': 'Guaranteed and Certified',
      'auto_trans_1067': 'Luxury Student Apartment - Pekini Street',
      'auto_trans_1068': '450 USD / Month',
      'auto_trans_1069': 'Saburtalo',
      'auto_trans_1070': 'TSMU (10 mins walk) | UG (20 mins)',
      'auto_trans_1071': 'Apartment alone',
      'auto_trans_1072': '3 Individuals (Full Apartment)',
      'auto_trans_1073': 'Apartment alone',
      'auto_trans_1074': '2 Bathrooms',
      'auto_trans_1075': '3 Spacious Rooms',
      'auto_trans_1076': 'Warm Central Heating',
      'auto_trans_1077': 'Balcony with open view',
      'auto_trans_1078': 'Fast Fiber Optic Internet',
      'auto_trans_1079': 'Fully Furnished',
      'auto_trans_1080':
          'Excellent student apartment in the heart of Tbilisi near the Technical metro station. Fully equipped with furniture and appliances, with a wonderful view from the balcony and excellent central heating for winter. Payment is cash on delivery.',
      'auto_trans_1081': 'Modern Studio - Near UG',
      'auto_trans_1082': '380 USD / Month',
      'auto_trans_1083': 'Vake',
      'auto_trans_1084': 'UG (10 mins walk) | Ilia State (15 mins)',
      'auto_trans_1085': 'Apartment alone',
      'auto_trans_1086': '1 Individual (Single Studio)',
      'auto_trans_1087': 'Apartment alone',
      'auto_trans_1088': '1 Bathroom',
      'auto_trans_1089': 'Quiet Single Studio',
      'auto_trans_1090': 'AC & Heating',
      'auto_trans_1091': '24-hour Security',
      'auto_trans_1092': 'Close to Supermarket',
      'auto_trans_1093':
          'Perfect studio for a single student looking for peace and focus on studies. Minutes walk from UG campus. Modern furniture and fully equipped kitchen.',
      'auto_trans_1094': 'Shared Apartment for 3 Students - Panoramic View',
      'auto_trans_1095': '550 USD (or 180 USD per person)',
      'auto_trans_1096': 'Saburtalo',
      'auto_trans_1097': 'Ilia State (10 mins) | TSU (20 mins)',
      'auto_trans_1098': 'Rent with Roommate',
      'auto_trans_1099': '3 Individuals (Shared Apartment)',
      'auto_trans_1100':
          'Non-smoker, quiet and respectful student, maintains general cleanliness and calm',
      'auto_trans_1101':
          'Private furnished bedroom, shared bathroom and kitchen, balcony (spacious)',
      'auto_trans_1102': 'Rent with Roommate',
      'auto_trans_1103': '2 Bathrooms',
      'auto_trans_1104': 'Separate and comfortable rooms',
      'auto_trans_1105': 'Large hall for joint study',
      'auto_trans_1106': 'Very large balcony',
      'auto_trans_1107': 'Elevator works 24/7',
      'auto_trans_1108':
          'Excellent opportunity for three student friends or grouping students. Spacious area and excellent room distribution ensures privacy for each student.',
      'auto_trans_1109': 'Luxury Independent Studio - Aghmashenebeli Street',
      'auto_trans_1110': '400 USD / Month',
      'auto_trans_1111': 'Didube',
      'auto_trans_1112': 'Walking to metro station and universities (10 mins)',
      'auto_trans_1113': 'Apartment alone',
      'auto_trans_1114': '1 Individual',
      'auto_trans_1115': 'Apartment alone',
      'auto_trans_1116': '1 Bathroom',
      'auto_trans_1117': 'Independent studio for one person',
      'auto_trans_1118': 'AC & Heating',
      'auto_trans_1119': 'Fast Internet',
      'auto_trans_1120': 'New Furniture',
      'auto_trans_1121':
          'Private studio apartment for one person in an excellent location near services and transportation.',
      'auto_trans_1122': 'Apartment with Roommate - Saburtalo near Medical',
      'auto_trans_1123': '220 USD per person',
      'auto_trans_1124': 'Saburtalo',
      'auto_trans_1125': 'TSMU (5 mins walk)',
      'auto_trans_1126': 'Rent with Roommate',
      'auto_trans_1127': 'One roommate required',
      'auto_trans_1128':
          'Medical or engineering student, non-smoker, maintains calm and cleanliness',
      'auto_trans_1129':
          'Large private air-conditioned bedroom, shared bathroom and kitchen with only one student',
      'auto_trans_1130': 'Rent with Roommate',
      'auto_trans_1131': '1 Bathroom',
      'auto_trans_1132': '1 independent bedroom for roommate',
      'auto_trans_1133': 'Equipped kitchen',
      'auto_trans_1134': 'Quiet balcony',
      'auto_trans_1135':
          'Excellent apartment for a student looking for a quiet and respectful roommate steps away from TSMU.',
      'auto_trans_1136': 'Notifications & Alerts',
      'auto_trans_1137': 'No new alerts currently',
      'auto_trans_1138': 'Now',
      'auto_trans_1139': 'All',
      'auto_trans_1140': 'TSMU',
      'auto_trans_1141': 'UG',
      'auto_trans_1142': 'Ilia State',
      'auto_trans_1143': 'TSU',
      'auto_trans_1144': 'Apartment',
      'auto_trans_1145': 'Alone',
      'auto_trans_1146': 'Apartment',
      'auto_trans_1147': 'Roommate',
      'auto_trans_1148': 'Shared',
      'auto_trans_1149': 'Room in Apartment',
      'auto_trans_1150': 'Room in Apartment',
      'auto_trans_1151': 'Roommate',
      'auto_trans_1152': 'Room in Apartment',
      'auto_trans_1153': 'Shared',
      'auto_trans_1154': 'Saburtalo',
      'auto_trans_1155': 'Bathrooms',
      'auto_trans_1156': 'All',
      'auto_trans_1157': 'Open Time',
      'auto_trans_1158': 'Walking',
      'auto_trans_1159': '(d+)s*mins',
      'auto_trans_1160': 'Honored Guest',
      'auto_trans_1161': 'Georgia - Tbilisi',
      'auto_trans_1162': 'Georgia News',
      'auto_trans_1163': 'Announcement',
      'auto_trans_1164': 'Now',
      'auto_trans_1165': 'Select nearby universities',
      'auto_trans_1166': 'Price yourself',
      'auto_trans_1167': '️ District',
      'auto_trans_1168': 'Saburtalo',
      'auto_trans_1169': 'Vake',
      'auto_trans_1170': 'Didube',
      'auto_trans_1171': 'Accommodation Type',
      'auto_trans_1172': '️ Rooms',
      'auto_trans_1173': 'Bathrooms',
      'auto_trans_1174': '1 Bathroom',
      'auto_trans_1175': '2 Bathrooms',
      'auto_trans_1176': '3 Bathrooms or more',
      'auto_trans_1177': 'Immediate Move-in',
      'auto_trans_1178': 'Date',
      'auto_trans_1179': 'Date',
      'auto_trans_1180': 'September',
      'auto_trans_1181': 'Click to preview photos and book apartment >>',
      'auto_trans_1182': 'Dear Guest',
      'auto_trans_1183': 'General Browsing (Guest)',
      'auto_trans_1184': 'Now',
      'auto_trans_1185': 'Now',
      'auto_trans_1186': 'Close',
      'auto_trans_1187': 'Notifications & Alerts',
      'auto_trans_1188': 'Update Notifications',
      'auto_trans_1189': 'No urgent alerts currently',
      'auto_trans_1190': 'Alerts are automatically removed after 48 hours',
      'auto_trans_1191': 'Now',
      'auto_trans_1192': 'All',
      'auto_trans_1193': 'All',
      'auto_trans_1194': 'Special Offers',
      'auto_trans_1195': 'Near TSMU',
      'auto_trans_1196': 'Single Studio',
      'auto_trans_1197': 'Shared Rooms',
      'auto_trans_1198': 'All',
      'auto_trans_1199': 'Offers',
      'auto_trans_1200': 'Exclusive Student Housing Offers',
      'auto_trans_1201': 'No apartments match this filter currently',
      'auto_trans_1202': 'Furnished & Equipped',
      'auto_trans_1203': '🇪🇬 Arabic',
      'auto_trans_1204': '🇬🇧 English',
      'auto_trans_1205': 'TSMU',
      'auto_trans_1206': 'TSMU',
      'auto_trans_1207': 'TSMU',
      'auto_trans_1208': 'TSMU',
      'auto_trans_1209': 'General Browsing (Guest)',
      'auto_trans_1210': 'Dear Guest',
      'auto_trans_1211': 'Guest',
      'auto_trans_1212': 'General Browsing (Guest)',
      'auto_trans_1213': 'Dear Guest',
      'auto_trans_1214': 'Guest',
      'auto_trans_1215': 'Login',
      'auto_trans_1216': 'Find Roommate Request:\n',
      'auto_trans_1217': 'None',
      'auto_trans_1218': 'Sending housing request... ⏳',
      'auto_trans_1219': 'Absher Student',
      'auto_trans_1220': 'University in Georgia',
      'auto_trans_1221': 'Book Housing (Apartment Alone)',
      'auto_trans_1222': 'Connecting to customer service... ⏳',
      'auto_trans_1223':
          'Hello, I need customer service help to book a flat alone.',
      'auto_trans_1224': 'Absher Student',
      'auto_trans_1225': 'University in Georgia',
      'auto_trans_1226': 'Direct contact for housing booking',
      'auto_trans_1227': 'Absher',
      'auto_trans_1228': 'All Available Flats',
      'auto_trans_1229':
          'List of all available flats for students with all details and prices.',
      'auto_trans_1230': 'Flats for one person',
      'auto_trans_1231':
          'List of flats and studios dedicated to single students.',
      'auto_trans_1232': 'Roommate Request Form',
      'auto_trans_1233':
          'Fill out your info and we will match you with the best roommate:',
      'auto_trans_1234': 'Full Name',
      'auto_trans_1235': 'Required',
      'auto_trans_1236': 'Nationality',
      'auto_trans_1237': 'Required',
      'auto_trans_1238': 'University',
      'auto_trans_1239': 'Major of Study',
      'auto_trans_1240': 'Required',
      'auto_trans_1241': 'WhatsApp Number',
      'auto_trans_1242': 'Required',
      'auto_trans_1243': 'When do you want to move?',
      'auto_trans_1244': 'Required',
      'auto_trans_1245': 'Additional Notes',
      'auto_trans_1246': 'Send to Customer Service',
      'auto_trans_1247': 'TSMU',
      'auto_trans_1248': 'TSMU',
      'auto_trans_1249': 'Guest',
      'auto_trans_1250': 'Login',
      'auto_trans_1251': 'Sending roommate request... ⏳',
      'auto_trans_1252': 'Absher Student',
      'auto_trans_1253': 'University in Georgia',
      'auto_trans_1254': 'Roommate Search',
      'auto_trans_1255': 'Student Flat Matching',
      'auto_trans_1256': 'Full Name',
      'auto_trans_1257': 'Required',
      'auto_trans_1258': 'University',
      'auto_trans_1259': 'Major',
      'auto_trans_1260': 'Required',
      'auto_trans_1261': 'Contact Phone Number (WhatsApp)',
      'auto_trans_1262': 'Required',
      'auto_trans_1263': 'Estimated Monthly Budget per Person (USD)',
      'auto_trans_1264': 'Required',
      'auto_trans_1265':
          'Additional Notes (e.g. smoking preference, calm, etc.)',
      'auto_trans_1266': 'Send Match Request to Support',
      'auto_trans_1267': 'Electrician',
      'auto_trans_1268': 'Maintenance of all electrical faults and connections',
      'auto_trans_1269': 'Plumber',
      'auto_trans_1270': 'Repair of water leaks and plumbing',
      'auto_trans_1271': 'Student Residency Issuance',
      'auto_trans_1272':
          'Preparing residency papers for the first time or renewal',
      'auto_trans_1273': 'Legal Address Registration',
      'auto_trans_1274': 'Issuance of certified address document in Georgia',
      'auto_trans_1275': 'University Registration & Transfer',
      'auto_trans_1276': 'Admission procedures and credit transfers',
      'auto_trans_1277': 'Guest',
      'auto_trans_1278': 'Login',
      'auto_trans_1279': 'Not specified',
      'auto_trans_1280': 'Cleaning',
      'auto_trans_1281': 'Cancel',
      'auto_trans_1282': 'Not specified',
      'auto_trans_1283': 'Yes ️',
      'auto_trans_1284': 'No',
      'auto_trans_1285': 'No additional notes',
      'auto_trans_1286': 'Deduct from wallet points',
      'auto_trans_1287': 'Pay in cash',
      'auto_trans_1288': 'Failed to deduct from points',
      'auto_trans_1289': 'Absher Student',
      'auto_trans_1290': 'University in Georgia',
      'auto_trans_1291': 'Add',
      'auto_trans_1292': 'Test Student (Absher)',
      'auto_trans_1293': 'TSMU',
      'auto_trans_1294': 'Account registered successfully',
      'auto_trans_1295': 'Excellent student flat',
      'auto_trans_1296': 'Residential flat',
      'auto_trans_1297': 'Special price',
      'auto_trans_1298': 'Tbilisi',
      'auto_trans_1299': 'Excellent location',
      'auto_trans_1300': '3 Rooms',
      'auto_trans_1301': 'Apartment',
      'auto_trans_1302': 'Immediate',
      'auto_trans_1303': 'Immediate Move-in',
      'auto_trans_1304': 'Luxury Student Apartment - Pekini Street',
      'auto_trans_1305': '450 USD / Month',
      'auto_trans_1306': 'Tbilisi - Saburtalo',
      'auto_trans_1307': 'Very close to TSMU (walking)',
      'auto_trans_1308': '3 Rooms',
      'auto_trans_1309': 'Apartment',
      'auto_trans_1310': 'Immediate',
      'auto_trans_1311': 'Immediate Move-in',
      'auto_trans_1312': '3 Spacious Rooms',
      'auto_trans_1313': 'Warm Central Heating',
      'auto_trans_1314': 'Balcony with open view',
      'auto_trans_1315': 'Fast Fiber Optic Internet',
      'auto_trans_1316': 'Fully Furnished',
      'auto_trans_1317': 'TSMU',
      'auto_trans_1318':
          'Excellent student apartment in the heart of Tbilisi near the Technical metro station. Fully equipped with furniture and appliances, with a wonderful view from the balcony and excellent central heating for winter. Payment is cash on delivery.',
      'auto_trans_1319': 'Modern Studio - Near UG',
      'auto_trans_1320': '380 USD / Month',
      'auto_trans_1321': 'Tbilisi - Kostava Street',
      'auto_trans_1322': 'UG and UT Universities',
      'auto_trans_1323': '1 Room',
      'auto_trans_1324': 'Apartment',
      'auto_trans_1325': 'Immediate',
      'auto_trans_1326': 'Immediate Move-in',
      'auto_trans_1327': 'Quiet Single Studio',
      'auto_trans_1328': 'AC & Heating',
      'auto_trans_1329': '24-hour Security',
      'auto_trans_1330': 'Close to Supermarket',
      'auto_trans_1331':
          'Perfect studio for a single student looking for peace and focus on studies. Minutes walk from UG campus. Modern furniture and fully equipped kitchen.',
      'auto_trans_1332': 'Shared Apartment for 3 Students - Panoramic View',
      'auto_trans_1333': '550 USD (or 180 USD per person)',
      'auto_trans_1334': 'Tbilisi - Vake',
      'auto_trans_1335': 'Close to Ilia and Medical Universities',
      'auto_trans_1336': '3 Rooms',
      'auto_trans_1337': 'Room in Apartment',
      'auto_trans_1338': 'Immediate',
      'auto_trans_1339': 'Immediate Move-in',
      'auto_trans_1340': 'Separate and comfortable rooms',
      'auto_trans_1341': 'Large hall for joint study',
      'auto_trans_1342': 'Very large balcony',
      'auto_trans_1343': 'Elevator works 24/7',
      'auto_trans_1344': 'Ilia State University',
      'auto_trans_1345':
          'Excellent opportunity for three student friends or grouping students. Spacious area and excellent room distribution ensures privacy for each student.',
      'auto_trans_1346': 'TSMU',
      'auto_trans_1347': 'UG',
      'auto_trans_1348': 'Ilia State University',
      'auto_trans_1349': 'TSU',
      'auto_trans_1350': 'Saburtalo',
      'auto_trans_1351': 'Vake',
      'auto_trans_1352': 'Didube',
      'auto_trans_1353': 'Mtatsminda',
      'auto_trans_1354': 'Isani',
      'auto_trans_1355': 'Gldani',
      'auto_trans_1356': 'Now',
      'auto_trans_1357': 'Water Cutoff Tomorrow Sunday in Saburtalo',
      'auto_trans_1358':
          'National Water Company announces temporary water cutoff tomorrow Sunday from 10 AM to 4 PM for annual maintenance.',
      'auto_trans_1359': '1 hour ago',
      'auto_trans_1360': 'Friday Prayer Time Change at Tbilisi Mosque',
      'auto_trans_1361':
          'First Friday prayer sermon will start at 1:30 PM instead of 1:00 PM to facilitate students.',
      'auto_trans_1362': '3 hours ago',
      'auto_trans_1363': 'Scheduled Power Cut Next Tuesday',
      'auto_trans_1364':
          'Scheduled power cutoff for parts of Didube next Tuesday from 9 AM to 11 AM.',
      'auto_trans_1365': 'Yesterday',
      'auto_trans_1366': 'Now',
      'auto_trans_1367': 'Water Cutoff Alert in Saburtalo',
      'auto_trans_1368':
          'Attention students in Saburtalo, water will be cut off tomorrow Sunday from 10 AM to 4 PM.',
      'auto_trans_1369': '1 hour ago',
      'auto_trans_1370': 'Friday Prayer at Tbilisi Mosque',
      'auto_trans_1371':
          'Friday prayer sermon starts at 1:30 PM to facilitate students.',
      'auto_trans_1372': '3 hours ago',
      'auto_trans_1373': 'Student Service',
      'auto_trans_1374': 'Electrician',
      'auto_trans_1375': 'Maintenance of all electrical faults and connections',
      'auto_trans_1376': 'Plumber',
      'auto_trans_1377': 'Repair of water leaks and plumbing',
      'auto_trans_1378': 'Student Residency Issuance',
      'auto_trans_1379':
          'Preparing residency papers for the first time or renewal',
      'auto_trans_1380': 'Legal Address Registration',
      'auto_trans_1381': 'Issuance of certified address document in Georgia',
      'auto_trans_1382': 'University Registration & Transfer',
      'auto_trans_1383': 'Admission procedures and credit transfers',
      'auto_trans_1384': 'Request sent and saved temporarily in the app',
      'auto_trans_1385': 'Now',
      'auto_trans_1386': 'Server connection error',
      'auto_trans_1387': 'Video preview (YouTube/Drive) available on web',
      'reviews_screen_title': 'My Reviews & Feedback',
      'rate_service_prompt': 'Please rate the service you received',
      'rate_now': 'Rate Now',
      'remind_later': 'Remind Me Later',
      'comment_optional': 'Additional comments (optional)...',
      'submit_review': 'Submit Review',
      'my_reviews': 'My Reviews',
      'service_name': 'Service Name',
      'rating': 'Rating',
      'comment': 'Comment',
      'status': 'Review Status',
      'created_date': 'Submission Date',
      'status_pending': 'Pending',
      'status_approved': 'Approved',
      'status_rejected': 'Rejected',
      'edit_review': 'Edit Review',
      'delete_review': 'Delete Review',
      'delete_confirm_title': 'Confirm Delete',
      'delete_confirm_msg':
          'Are you sure you want to delete this review permanently?',
      'feedback_menu_option': 'Suggestions & Bug Reports',
      'feedback_form_title': 'Submit Suggestion or Bug',
      'feedback_type': 'Feedback Type',
      'feedback_suggestion': 'Suggestion',
      'feedback_bug': 'Bug Report',
      'feedback_ux': 'UX Feedback',
      'feedback_feature': 'Feature Request',
      'feedback_comment': 'Details of Suggestion/Bug',
      'submit_feedback': 'Submit Feedback',
      'my_feedback': 'My Feedback & Reports',
      'status_reviewed': 'Reviewed',
      'status_resolved': 'Resolved',
      'failed_to_send': 'Failed to send the message. Please try again.',
      'request_service_title': 'Request a New Service',
      'selected_service': 'Requested Service',
      'execution_time': 'Preferred Execution Time',
      'additional_details': 'Additional Details',
      'detailed_address_hint': 'Street name, building number, apartment number',
      'previous_requests': 'Previous Requests',
      'status_under_review': 'Under Review',
      'status_completed': 'Completed',
      'service_request': 'Student Service Request',
      'apartment_booking': 'Apartment Booking',
      'roommate_request': 'Roommate Request',
      'request_number': 'Request Number',
      'request': 'Request',
      'request_date': 'Request Date',
      'failed_load_requests': 'Failed to load requests',
      'no_previous_requests': 'No previous requests',
      'status_pending_payment': 'Pending Payment',
      'status_in_progress': 'In Progress',
      'status_unknown': 'Unknown',
      'points_unit': 'Points',
      'tx_type_credit': 'Deposit / Credit',
      'tx_type_debit': 'Payment / Debit',
      'tx_type_unknown': 'Unknown Transaction',
      'failed_load_transactions': 'Failed to load transaction history',
      'about_description':
          'Absher App is the comprehensive student platform in Georgia, offering direct student housing solutions, room/studio bookings, compatible roommate matching, instant maintenance, and official residency/legal services at the best quality and prices.',
      'supported_languages_title': 'Supported Languages',
      'contact_us_title': 'Contact Us',
      'instagram_label': 'Instagram',
      'whatsapp_label': 'WhatsApp',
      'office_address_label': 'Office Address',
      'office_address_value': '24 Pekini Ave, Tbilisi, Georgia',
      'apartment': 'Full Apartment',
      'room_shared': 'Shared Room',
      'studio': 'Studio',
      'not_specified': 'Not specified',
      'no_services_available': 'No services are currently available',
      'password_changed_success': 'Password changed successfully.',
      'change_password': 'Change Password',
      'current_password': 'Current Password',
      'new_password_label': 'New Password',
      'pw_min_8': 'Password must be at least 8 characters',
      'pw_max_128': 'Password must be under 128 characters',
      'confirm_password_label': 'Confirm New Password',
      'passwords_dont_match': 'Passwords do not match',
      'change_password_btn': 'Change Password',
      'edit_profile_title': 'Edit Profile',
      'name_too_short': 'Name is too short (min 3 characters)',
      'name_too_long': 'Name is too long (max 150 characters)',
      'email_too_long': 'Email is too long',
      'phone_len_error': 'Phone number must be between 5 and 50 characters',
      'uni_too_long': 'University name is too long (max 150 characters)',
      'failed_load_profile': 'Failed to load profile',
      'confirm_avatar_title': 'Change Profile Image',
      'confirm_avatar_desc':
          'Do you want to set the selected image as your profile picture?',
      'confirm': 'Confirm',
      'image_pick_error': 'Error selecting image',
      'edit_profile_sub': 'Update name, email, phone, and university',
      'change_password_sub': 'Update your password securely',
      'status_cancelled': 'Cancelled',
      'status_accepted': 'Accepted',
      'status_processing': 'Processing',
      'status_paid': 'Paid',
      'status_unpaid': 'Unpaid',
      'status_expired': 'Expired',
      'tx_type_bonus': 'Bonus',
      'tx_type_refund': 'Refund',
      'attached_video': 'Attached video',
      'attached_image': 'Attached image',
      'service_cost_free': 'Free (0 points)',
      'no_apartments_title': 'No Apartments Found',
      'no_apartments_desc':
          'We couldn\'t find any apartments matching your search criteria right now.',
      'no_roommates_title': 'No Roommates Found',
      'no_roommates_desc':
          'There are no active roommate requests matching your profile.',
      'no_requests_title': 'No Previous Requests',
      'no_requests_desc':
          'You have not submitted any accommodation or student service requests yet.',
      'no_wallet_history_title': 'No Wallet History',
      'no_wallet_history_desc':
          'Your transaction log is empty. No deposits or payments have been made yet.',
      'no_notifications_title': 'No Notifications',
      'no_notifications_desc':
          'Your notification center is empty. We will notify you of any updates.',
      'no_services_title': 'No Services Available',
      'no_services_desc':
          'We are sorry, but there are no student services available in your area at the moment.',
      'no_ratings_title': 'No Ratings Yet',
      'no_ratings_desc':
          'You have not submitted any reviews or feedback for services yet.',
      'no_search_results_title': 'No Search Results',
      'no_search_results_desc':
          'We couldn\'t find any results matching your search query. Please try different terms.',
      'no_offers_title': 'No Offers Available',
      'no_offers_desc':
          'There are no special housing offers available in this category currently.',
      'limited_offer': 'Limited Offer',
      'loading_data': 'Loading data...',
      'loading_apartments': 'Loading apartments...',
      'loading_services': 'Loading services...',
      'loading_requests': 'Loading requests...',
      'loading_transactions': 'Loading transaction history...',
      'loading_notifications': 'Loading notifications...',
      'loading_profile': 'Loading profile data...',
      'loading_news': 'Loading news...',
      'loading_chat': 'Loading chat history...',
      'saving_data': 'Saving data...',
      'sending_request': 'Sending request...'
    }
  };

  static String tr(String key) {
    final lang = currentLang.value;
    return _translations[lang]?[key] ?? _translations['ar']?[key] ?? key;
  }

  static String normalizeHousingType(String? rawType) {
    if (rawType == null) return 'not_specified';
    final t = rawType.trim().toLowerCase();
    if (t == 'apartment') return 'apartment';
    if (t == 'studio') return 'studio';
    if (t == 'room_shared' || t == 'shared_room') return 'room_shared';
    return 'not_specified';
  }

  static String getLocalizedHousingType(String? rawType) {
    final key = normalizeHousingType(rawType);
    return tr(key);
  }

  static String normalizeBackendKey(dynamic value) {
    if (value == null) return '';
    return value
        .toString()
        .trim()
        .toLowerCase()
        .replaceAll('-', '_')
        .replaceAll(' ', '_');
  }

  static String getLocalizedRequestStatus(String? status) {
    final s = normalizeBackendKey(status);
    switch (s) {
      case 'pending':
      case 'قيد_المراجعة':
        return tr('status_under_review'); // pending → قيد المراجعة
      case 'under_review':
      case 'underreview':
        return tr('status_under_review');
      case 'pending_payment':
      case 'pending_cash':
      case 'pendingcash':
      case 'في_انتظار_الدفع':
        return tr('status_pending_payment'); // في انتظار الدفع
      case 'in_progress':
      case 'in_progress_execution':
      case 'جاري_التنفيذ':
        return tr('status_in_progress'); // جاري التنفيذ
      case 'completed':
      case 'مكتمل':
        return tr('status_completed'); // تم التنفيذ
      case 'cancelled':
      case 'canceled':
      case 'ملغي':
        return tr('status_cancelled'); // تم الإلغاء
      default:
        return s.isNotEmpty ? s : tr('status_unknown');
    }
  }

  static String getLocalizedReviewStatus(String? status) {
    final s = normalizeBackendKey(status);
    switch (s) {
      case 'pending':
      case 'قيد_الانتظار':
        return tr('status_pending');
      case 'approved':
      case 'مقبول':
        return tr('status_approved');
      case 'rejected':
      case 'مرفوض':
        return tr('status_rejected');
      default:
        return tr('status_unknown');
    }
  }

  static String getLocalizedFeedbackStatus(String? status) {
    final s = normalizeBackendKey(status);
    switch (s) {
      case 'pending':
      case 'قيد_الانتظار':
        return tr('status_pending');
      case 'reviewed':
      case 'تمت_المراجعة':
        return tr('status_reviewed');
      case 'resolved':
      case 'تم_حلها':
        return tr('status_resolved');
      default:
        return tr('status_unknown');
    }
  }

  static String getLocalizedTransactionType(String? rawType) {
    final t = normalizeBackendKey(rawType);
    switch (t) {
      case 'credit':
      case 'deposit':
      case 'إضافة':
      case 'add':
      case 'top_up':
        return tr('tx_type_credit');
      case 'debit':
      case 'withdraw':
      case 'خصم':
        return tr('tx_type_debit');
      case 'bonus':
      case 'مكافأة':
        return tr('tx_type_bonus');
      case 'refund':
      case 'استرداد':
        return tr('tx_type_refund');
      default:
        return tr('tx_type_unknown');
    }
  }

  static String formatBookingMessage({
    required String aptId,
    required String aptTitle,
    required String rentalType,
    required String price,
    required String date,
    required String time,
    required String phone,
    required String notes,
  }) {
    if (currentLang.value == 'ar') {
      return 'طلب حجز ومعاينة سكن رقم (#$aptId):\n'
          'السكن: $aptTitle\n'
          'نوع السكن: $rentalType\n'
          'السعر: $price\n'
          'موعد المعاينة المقترح: $date\n'
          'الوقت المناسب لك: $time\n'
          'هاتف التواصل: $phone\n'
          'ملاحظات: $notes\n\n';
    } else {
      return 'Apartment booking & viewing request (#$aptId):\n'
          'Property: $aptTitle\n'
          'Rental Type: $rentalType\n'
          'Price: $price\n'
          'Suggested viewing date: $date\n'
          'Convenient time: $time\n'
          'Contact phone: $phone\n'
          'Notes: $notes\n\n';
    }
  }

  static String formatServiceRequestMessage({
    required String title,
    required String name,
    required String phone,
    required String address,
    required String executionTime,
    required bool hasImage,
    required String details,
    String? rooms,
    String? meters,
    String? calcPrice,
    String? promoCode,
    String? paymentMethod,
  }) {
    final isAr = currentLang.value == 'ar';
    String msg = '';
    if (isAr) {
      msg = 'طلب خدمة ($title):\n'
          'الاسم: $name\n'
          'رقم الهاتف: $phone\n'
          'العنوان: $address\n'
          'موعد التنفيذ: $executionTime\n'
          'إرفاق صورة: ${hasImage ? 'نعم' : 'لا'}\n'
          'التفاصيل: $details.';
      if (rooms != null && meters != null && calcPrice != null) {
        msg +=
            '\n[تفاصيل التنظيف: $rooms غرف، مساحة $meters متر، التكلفة التقديرية $calcPrice لاري].';
      }
      if (promoCode != null && promoCode.isNotEmpty) {
        msg += '\n[كود الخصم: $promoCode].';
      }
      if (paymentMethod != null) {
        msg += '\n[طريقة الدفع: $paymentMethod]';
      }
    } else {
      msg = 'Service Request ($title):\n'
          'Name: $name\n'
          'Phone: $phone\n'
          'Address: $address\n'
          'Execution Time: $executionTime\n'
          'Attached Image: ${hasImage ? 'Yes' : 'No'}\n'
          'Details: $details.';
      if (rooms != null && meters != null && calcPrice != null) {
        msg +=
            '\n[Cleaning Details: $rooms rooms, area $meters sq.m., estimated cost $calcPrice GEL].';
      }
      if (promoCode != null && promoCode.isNotEmpty) {
        msg += '\n[Promo Code: $promoCode].';
      }
      if (paymentMethod != null) {
        msg += '\n[Payment Method: $paymentMethod]';
      }
    }
    return msg;
  }

  static String formatRoommateRequestMessage({
    required String name,
    required String university,
    required String major,
    required String budget,
    required String housingPref,
    required String partnerPref,
    required String moveInDate,
    required String notes,
  }) {
    final isAr = currentLang.value == 'ar';
    if (isAr) {
      return 'طلب شريك سكن:\n'
          'الاسم: $name\n'
          'الجامعة: $university\n'
          'التخصص: $major\n'
          'الميزانية المقدرة: $budget USD\n'
          'نوع السكن المطلوب: $housingPref\n'
          'تفضيل الشركاء: $partnerPref\n'
          'موعد الانتقال: $moveInDate\n'
          'ملاحظات إضافية: $notes.';
    } else {
      return 'Roommate Request:\n'
          'Name: $name\n'
          'University: $university\n'
          'Major: $major\n'
          'Estimated Budget: $budget USD\n'
          'Requested Housing Type: $housingPref\n'
          'Partner Preference: $partnerPref\n'
          'Move-in Date: $moveInDate\n'
          'Additional Notes: $notes.';
    }
  }

  static String formatRentRequestMessage({
    required String name,
    required String nationality,
    required String gender,
    required String university,
    required String major,
    required String whatsapp,
    required String moveInDate,
    required String notes,
  }) {
    final isAr = currentLang.value == 'ar';
    if (isAr) {
      return 'الاسم: $name\n'
          'الجنسية: $nationality\n'
          'النوع: $gender\n'
          'الجامعة: $university\n'
          'التخصص: $major\n'
          'رقم الواتساب: $whatsapp\n'
          'موعد النقل: $moveInDate\n'
          'ملاحظات: $notes';
    } else {
      return 'Name: $name\n'
          'Nationality: $nationality\n'
          'Gender: $gender\n'
          'University: $university\n'
          'Major: $major\n'
          'WhatsApp: $whatsapp\n'
          'Move-in Date: $moveInDate\n'
          'Notes: $notes';
    }
  }

  static String formatServiceCost(int price) {
    if (price == 0) {
      return tr('service_cost_free');
    }
    final pointsLabel = tr('points_unit');
    return '$price $pointsLabel';
  }

  static String formatCleaningEstimate(String price) {
    if (currentLang.value == 'ar') {
      return 'السعر التقديري للتنظيف: $price لاري (يدفع كاش للفني)';
    } else {
      return 'Estimated cleaning price: $price GEL (to be paid in cash to the technician)';
    }
  }

  static String formatCurrentBalance(int balance) {
    if (currentLang.value == 'ar') {
      return 'رصيدك الحالي: $balance نقطة';
    } else {
      return 'Your current balance: $balance Points';
    }
  }

  static String formatRequestNumber(int id) {
    return '${tr('request_number')} #$id';
  }

  static String formatAvailableOptionsCount(int count) {
    return '${tr('available_options')} ($count)';
  }

  static String formatDiscountPercent(int percent) {
    if (currentLang.value == 'ar') {
      return 'خصم $percent٪';
    } else {
      return '$percent% OFF';
    }
  }

  static String formatOfferPriceWithDiscount(int price, int percent) {
    if (currentLang.value == 'ar') {
      return '$price \$ (خصم $percent٪)';
    } else {
      return '\$$price ($percent% OFF)';
    }
  }

  static String formatRatingPromptMessage(String serviceTitle) {
    if (currentLang.value == 'ar') {
      return 'لقد تم إكمال طلبك لـ ($serviceTitle). ما رأيك في جودة الخدمة؟';
    } else {
      return 'Your request for ($serviceTitle) has been completed. What is your feedback?';
    }
  }

  static String getLocalizedBadgeText(String? rawBadge) {
    if (rawBadge == null || rawBadge.trim().isEmpty) return '';
    final normalized = rawBadge.trim().toLowerCase();
    if (normalized == 'عرض محدود' ||
        normalized == 'limited offer' ||
        normalized == 'limited_offer') {
      return tr('limited_offer');
    }
    return rawBadge;
  }
}
