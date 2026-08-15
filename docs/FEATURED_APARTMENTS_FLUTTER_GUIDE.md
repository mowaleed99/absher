# دليل تنفيذ ميزة الشقق المميزة / المثبتة لتطبيق Flutter
# Featured & Pinned Apartments Integration Guide (Flutter Mobile App)

مرحباً يا هندسة، هذا الدليل يوضح كيفية التعامل مع ميزة **الشقق المثبتة / الإعلانات المميزة (Featured / Pinned Apartments)** في تطبيق الموبايل (Flutter).

---

## 1. كيف تعمل الميزة في الباك إند تلقائياً؟ (Automatic Backend Sorting)

الباك إند يقوم بالفعل بفرز الشقق وترتيبها تلقائياً عند استدعاء API القائمة:
```
GET https://absher-georgia.com/api/apartments/list.php
```

الترتيب المعتمد في السيرفر:
```sql
ORDER BY (is_featured = 1 AND (featured_until IS NULL OR featured_until > NOW())) DESC, created_at DESC, id DESC
```

> **ملاحظة هامة:** الشقق المميزة والمثبتة النشطة ستصل لتطبيق الموبايل **في أول القائمة تلقائياً** بدون الحاجة لأي تعديل على كود الفرز في الفلاتر. وإذا انتهت مدة التثبيت تسقط الشقة تلقائياً للترتيب الطبيعي.

---

## 2. الحقول الجديدة في استجابة الـ API (API Response Fields)

تمت إضافة حقلين في كائن كل شقة `apartment`:
1. `is_featured` (`bool`): قيمته `true` إذا كانت الشقة مثبتة ومميزة حالياً ونشطة، أو `false` إذا كانت عادية أو انتهت مدة التثبيت.
2. `featured_until` (`String?`): تاريخ ووقت انتهاء التثبيت (بتنسيق `YYYY-MM-DD HH:MM:SS`)، أو `null` إذا كان التثبيت دائم أو غير مثبت.

### مثال على الـ JSON Response:
```json
{
  "status": true,
  "message": "Success",
  "data": {
    "apartments": [
      {
        "id": 5,
        "title": "شقة فاخرة بإطلالة مميزة",
        "description": "شقة مفروشة بالكامل قريبة من الجامعة",
        "price": "600 دولار",
        "location": "سابورتالو",
        "district_id": 3,
        "proximity": "5 دقائق مشياً",
        "capacity": "3 أفراد",
        "rental_type": "apartment",
        "rooms_count": 2,
        "move_in_type": "فوري",
        "move_in_date": "انتقال فوري",
        "is_available": true,
        "is_featured": true,
        "featured_until": "2026-08-22 18:00:00",
        "images": [
          "uploads/apartments/img1.jpg"
        ],
        "features": ["إنترنت فائق السرعة", "تكييف", "مصعد"],
        "universities": ["جامعة ولاية تبليسي"]
      }
    ]
  }
}
```

---

## 3. التعديلات المطلوبة في كود Flutter (خطوات بسيطة جداً)

### أ) تحديث الموديل (ApartmentModel.dart)

أضف الحقلين في الـ Model:

```dart
class ApartmentModel {
  final int id;
  final String title;
  final String description;
  final String price;
  final String location;
  final bool isAvailable;
  final bool isFeatured;          // <-- حقل جديد
  final String? featuredUntil;    // <-- حقل جديد
  final List<String> images;
  // ... باقي الحقول

  ApartmentModel({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    required this.location,
    required this.isAvailable,
    this.isFeatured = false,
    this.featuredUntil,
    required this.images,
  });

  factory ApartmentModel.fromJson(Map<String, dynamic> json) {
    return ApartmentModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      price: json['price'] ?? '',
      location: json['location'] ?? '',
      isAvailable: json['is_available'] == true || json['is_available'] == 1,
      // قراءة حقول التثبيت المميز بأمان
      isFeatured: json['is_featured'] == true || json['is_featured'] == 1,
      featuredUntil: json['featured_until']?.toString(),
      images: (json['images'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
    );
  }
}
```

---

### ب) إضافة شارة جمالية مميزة في كارت الشقة (ApartmentCard.dart)

لإعطاء لمسة جمالية للإعلان المميز (شارة ذهبية / Golden Badge + إطار خفيف):

```dart
Widget buildApartmentCard(ApartmentModel apartment) {
  return Container(
    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    decoration: BoxDecoration(
      color: const Color(0xFF1E293B),
      borderRadius: BorderRadius.circular(16),
      // إذا كانت الشقة مميزة، نضع إطار ذهبي خفيف
      border: Border.all(
        color: apartment.isFeatured ? const Color(0xFFF59E0B) : const Color(0xFF334155),
        width: apartment.isFeatured ? 1.5 : 1.0,
      ),
      boxShadow: apartment.isFeatured
          ? [
              BoxShadow(
                color: const Color(0xFFF59E0B).withOpacity(0.15),
                blurRadius: 12,
                offset: const Offset(0, 4),
              )
            ]
          : [],
    ),
    child: Stack(
      children: [
        // محتوى الكارت (الصورة، العنوان، السعر، التفاصيل)
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // صورة الشقة
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              child: Image.network(
                apartment.images.isNotEmpty ? apartment.images.first : '',
                height: 180,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (ctx, _, __) => Container(
                  height: 180,
                  color: Colors.grey[900],
                  child: const Icon(Icons.apartment, size: 50, color: Colors.grey),
                ),
              ),
            ),
            
            // تفاصيل الشقة...
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    apartment.title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    apartment.price,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF10B981),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),

        // شارة "إعلان مميز ⭐" في أعلى زاوية الكارت
        if (apartment.isFeatured)
          Positioned(
            top: 12,
            right: 12, // أو left حسب لغة التطبيق RTL/LTR
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
                ),
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 4,
                  ),
                ],
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.star, color: Colors.white, size: 14),
                  SizedBox(width: 4),
                  Text(
                    "مميز",
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    ),
  );
}
```

---

## 4. شاشة التفاصيل (ApartmentDetailsScreen.dart)

استدعاء API تفاصيل الشقة:
```
GET https://absher-georgia.com/api/apartments/details.php?id=5
```
يعيد نفس حقل `is_featured: true/false` في حال رغبت بإظهار شارة "إعلان مميز" داخل صفحة التفاصيل أيضاً.

---

جاهز للاستخدام مباشرة على Production و Staging! 🚀
