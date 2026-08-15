class CountryCode {
  final String nameAr;
  final String nameEn;
  final String dialCode;
  final String code;
  final String flag;

  const CountryCode({
    required this.nameAr,
    required this.nameEn,
    required this.dialCode,
    required this.code,
    required this.flag,
  });

  String localizedName(String langCode) => langCode == 'en' ? nameEn : nameAr;

  static const CountryCode defaultCountry = CountryCode(
    nameAr: 'جورجيا',
    nameEn: 'Georgia',
    dialCode: '+995',
    code: 'GE',
    flag: '🇬🇪',
  );

  static CountryCode findCountryByPhone(String phone) {
    if (phone.isEmpty) return defaultCountry;
    final clean = phone.startsWith('+') ? phone : '+$phone';
    
    // Check longest prefix matches first
    CountryCode? matched;
    int maxLen = 0;
    for (final c in allCountries) {
      if (clean.startsWith(c.dialCode) && c.dialCode.length > maxLen) {
        matched = c;
        maxLen = c.dialCode.length;
      }
    }
    return matched ?? defaultCountry;
  }

  static const List<CountryCode> allCountries = [
    // Top Priority & Regional
    CountryCode(nameAr: 'جورجيا', nameEn: 'Georgia', dialCode: '+995', code: 'GE', flag: '🇬🇪'),
    CountryCode(nameAr: 'مصر', nameEn: 'Egypt', dialCode: '+20', code: 'EG', flag: '🇪🇬'),
    CountryCode(nameAr: 'السعودية', nameEn: 'Saudi Arabia', dialCode: '+966', code: 'SA', flag: '🇸🇦'),
    CountryCode(nameAr: 'الإمارات', nameEn: 'United Arab Emirates', dialCode: '+971', code: 'AE', flag: '🇦🇪'),
    CountryCode(nameAr: 'الأردن', nameEn: 'Jordan', dialCode: '+962', code: 'JO', flag: '🇯🇴'),
    CountryCode(nameAr: 'العراق', nameEn: 'Iraq', dialCode: '+964', code: 'IQ', flag: '🇮🇶'),
    CountryCode(nameAr: 'الكويت', nameEn: 'Kuwait', dialCode: '+965', code: 'KW', flag: '🇰🇼'),
    CountryCode(nameAr: 'عمان', nameEn: 'Oman', dialCode: '+968', code: 'OM', flag: '🇴🇲'),
    CountryCode(nameAr: 'قطر', nameEn: 'Qatar', dialCode: '+974', code: 'QA', flag: '🇶🇦'),
    CountryCode(nameAr: 'البحرين', nameEn: 'Bahrain', dialCode: '+973', code: 'BH', flag: '🇧🇭'),
    CountryCode(nameAr: 'سوريا', nameEn: 'Syria', dialCode: '+963', code: 'SY', flag: '🇸🇾'),
    CountryCode(nameAr: 'لبنان', nameEn: 'Lebanon', dialCode: '+961', code: 'LB', flag: '🇱🇧'),
    CountryCode(nameAr: 'فلسطين', nameEn: 'Palestine', dialCode: '+970', code: 'PS', flag: '🇵🇸'),
    CountryCode(nameAr: 'اليمن', nameEn: 'Yemen', dialCode: '+967', code: 'YE', flag: '🇾🇪'),
    CountryCode(nameAr: 'السودان', nameEn: 'Sudan', dialCode: '+249', code: 'SD', flag: '🇸🇩'),
    CountryCode(nameAr: 'ليبيا', nameEn: 'Libya', dialCode: '+218', code: 'LY', flag: '🇱🇾'),
    CountryCode(nameAr: 'تونس', nameEn: 'Tunisia', dialCode: '+216', code: 'TN', flag: '🇹🇳'),
    CountryCode(nameAr: 'الجزائر', nameEn: 'Algeria', dialCode: '+213', code: 'DZ', flag: '🇩🇿'),
    CountryCode(nameAr: 'المغرب', nameEn: 'Morocco', dialCode: '+212', code: 'MA', flag: '🇲🇦'),
    CountryCode(nameAr: 'موريتانيا', nameEn: 'Mauritania', dialCode: '+222', code: 'MR', flag: '🇲🇷'),
    CountryCode(nameAr: 'الصومال', nameEn: 'Somalia', dialCode: '+252', code: 'SO', flag: '🇸🇴'),
    CountryCode(nameAr: 'جيبوتي', nameEn: 'Djibouti', dialCode: '+253', code: 'DJ', flag: '🇩🇯'),

    // Turkey, CIS & Neighborhood
    CountryCode(nameAr: 'تركيا', nameEn: 'Turkey', dialCode: '+90', code: 'TR', flag: '🇹🇷'),
    CountryCode(nameAr: 'أذربيجان', nameEn: 'Azerbaijan', dialCode: '+994', code: 'AZ', flag: '🇦🇿'),
    CountryCode(nameAr: 'أرمينيا', nameEn: 'Armenia', dialCode: '+374', code: 'AM', flag: '🇦🇲'),
    CountryCode(nameAr: 'كازاخستان', nameEn: 'Kazakhstan', dialCode: '+7', code: 'KZ', flag: '🇰🇿'),
    CountryCode(nameAr: 'روسيا', nameEn: 'Russia', dialCode: '+7', code: 'RU', flag: '🇷🇺'),
    CountryCode(nameAr: 'أوزبكستان', nameEn: 'Uzbekistan', dialCode: '+998', code: 'UZ', flag: '🇺🇿'),
    CountryCode(nameAr: 'تركمانستان', nameEn: 'Turkmenistan', dialCode: '+993', code: 'TM', flag: '🇹🇲'),
    CountryCode(nameAr: 'قرغيزستان', nameEn: 'Kyrgyzstan', dialCode: '+996', code: 'KG', flag: '🇰🇬'),
    CountryCode(nameAr: 'طاجيكستان', nameEn: 'Tajikistan', dialCode: '+992', code: 'TJ', flag: '🇹🇯'),
    CountryCode(nameAr: 'أوكرانيا', nameEn: 'Ukraine', dialCode: '+380', code: 'UA', flag: '🇺🇦'),
    CountryCode(nameAr: 'بيلاروسيا', nameEn: 'Belarus', dialCode: '+375', code: 'BY', flag: '🇧🇾'),

    // Asia & South Asia
    CountryCode(nameAr: 'الهند', nameEn: 'India', dialCode: '+91', code: 'IN', flag: '🇮🇳'),
    CountryCode(nameAr: 'باكستان', nameEn: 'Pakistan', dialCode: '+92', code: 'PK', flag: '🇵🇰'),
    CountryCode(nameAr: 'بنغلاديش', nameEn: 'Bangladesh', dialCode: '+880', code: 'BD', flag: '🇧🇩'),
    CountryCode(nameAr: 'سريلانكا', nameEn: 'Sri Lanka', dialCode: '+94', code: 'LK', flag: '🇱🇰'),
    CountryCode(nameAr: 'إيران', nameEn: 'Iran', dialCode: '+98', code: 'IR', flag: '🇮🇷'),
    CountryCode(nameAr: 'الصين', nameEn: 'China', dialCode: '+86', code: 'CN', flag: '🇨🇳'),
    CountryCode(nameAr: 'ماليزيا', nameEn: 'Malaysia', dialCode: '+60', code: 'MY', flag: '🇲🇾'),
    CountryCode(nameAr: 'إندونيسيا', nameEn: 'Indonesia', dialCode: '+62', code: 'ID', flag: '🇮🇩'),
    CountryCode(nameAr: 'الفلبين', nameEn: 'Philippines', dialCode: '+63', code: 'PH', flag: '🇵🇭'),
    CountryCode(nameAr: 'اليابان', nameEn: 'Japan', dialCode: '+81', code: 'JP', flag: '🇯🇵'),
    CountryCode(nameAr: 'كوريا الجنوبية', nameEn: 'South Korea', dialCode: '+82', code: 'KR', flag: '🇰🇷'),

    // Europe
    CountryCode(nameAr: 'المملكة المتحدة', nameEn: 'United Kingdom', dialCode: '+44', code: 'GB', flag: '🇬🇧'),
    CountryCode(nameAr: 'ألمانيا', nameEn: 'Germany', dialCode: '+49', code: 'DE', flag: '🇩🇪'),
    CountryCode(nameAr: 'فرنسا', nameEn: 'France', dialCode: '+33', code: 'FR', flag: '🇫🇷'),
    CountryCode(nameAr: 'إيطاليا', nameEn: 'Italy', dialCode: '+39', code: 'IT', flag: '🇮🇹'),
    CountryCode(nameAr: 'إسبانيا', nameEn: 'Spain', dialCode: '+34', code: 'ES', flag: '🇪🇸'),
    CountryCode(nameAr: 'هولندا', nameEn: 'Netherlands', dialCode: '+31', code: 'NL', flag: '🇳🇱'),
    CountryCode(nameAr: 'بلجيكا', nameEn: 'Belgium', dialCode: '+32', code: 'BE', flag: '🇧🇪'),
    CountryCode(nameAr: 'سويسرا', nameEn: 'Switzerland', dialCode: '+41', code: 'CH', flag: '🇨🇭'),
    CountryCode(nameAr: 'النمسا', nameEn: 'Austria', dialCode: '+43', code: 'AT', flag: '🇦🇹'),
    CountryCode(nameAr: 'السويد', nameEn: 'Sweden', dialCode: '+46', code: 'SE', flag: '🇸🇪'),
    CountryCode(nameAr: 'النرويج', nameEn: 'Norway', dialCode: '+47', code: 'NO', flag: '🇳🇴'),
    CountryCode(nameAr: 'بولندا', nameEn: 'Poland', dialCode: '+48', code: 'PL', flag: '🇵🇱'),
    CountryCode(nameAr: 'اليونان', nameEn: 'Greece', dialCode: '+30', code: 'GR', flag: '🇬🇷'),
    CountryCode(nameAr: 'قبرص', nameEn: 'Cyprus', dialCode: '+357', code: 'CY', flag: '🇨🇾'),
    CountryCode(nameAr: 'رومانيا', nameEn: 'Romania', dialCode: '+40', code: 'RO', flag: '🇷🇴'),
    CountryCode(nameAr: 'المجر', nameEn: 'Hungary', dialCode: '+36', code: 'HU', flag: '🇭🇺'),
    CountryCode(nameAr: 'جمهورية التشيك', nameEn: 'Czech Republic', dialCode: '+420', code: 'CZ', flag: '🇨🇿'),
    CountryCode(nameAr: 'البرتغال', nameEn: 'Portugal', dialCode: '+351', code: 'PT', flag: '🇵🇹'),
    CountryCode(nameAr: 'أيرلندا', nameEn: 'Ireland', dialCode: '+353', code: 'IE', flag: '🇮🇪'),

    // Americas & Africa & Oceania
    CountryCode(nameAr: 'الولايات المتحدة', nameEn: 'United States', dialCode: '+1', code: 'US', flag: '🇺🇸'),
    CountryCode(nameAr: 'كندا', nameEn: 'Canada', dialCode: '+1', code: 'CA', flag: '🇨🇦'),
    CountryCode(nameAr: 'البرازيل', nameEn: 'Brazil', dialCode: '+55', code: 'BR', flag: '🇧🇷'),
    CountryCode(nameAr: 'أستراليا', nameEn: 'Australia', dialCode: '+61', code: 'AU', flag: '🇦🇺'),
    CountryCode(nameAr: 'نيجيريا', nameEn: 'Nigeria', dialCode: '+234', code: 'NG', flag: '🇳🇬'),
    CountryCode(nameAr: 'كينيا', nameEn: 'Kenya', dialCode: '+254', code: 'KE', flag: '🇰🇪'),
    CountryCode(nameAr: 'غانا', nameEn: 'Ghana', dialCode: '+233', code: 'GH', flag: '🇬🇭'),
    CountryCode(nameAr: 'جنوب أفريقيا', nameEn: 'South Africa', dialCode: '+27', code: 'ZA', flag: '🇿🇦'),
  ];
}
