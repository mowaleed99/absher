import { Apartment } from '../types/apartment';
import { University } from '../types/university';
import { District } from '../types/district';
import { Service } from '../types/service';
import { ServiceRequest } from '../types/request';
import { ServiceReview, ReviewsAnalytics, ReviewStatus } from '../types/review';
import { ApplicationFeedback, FeedbackStatus } from '../types/feedback';
import { Student } from '../types/student';

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function toNumber(v: unknown): number | null {
  if (typeof v === 'number' && isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return isFinite(n) ? n : null;
  }
  return null;
}

function toString(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return fallback;
}

function parseArrayField(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.map(item => typeof item === 'string' ? item : String(item));
  }
  if (typeof v === 'string') {
    if (v.trim().startsWith('[') && v.trim().endsWith(']')) {
      try {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {
        // ignore json parse error
      }
    }
    return v ? [v] : [];
  }
  return [];
}

export function parseApartment(v: unknown): Apartment | null {
  if (!isObject(v)) return null;
  const id = toNumber(v.id);
  const price = toNumber(v.price);
  if (id === null || price === null) return null;

  const titleAr = toString(v.title_ar || v.title);
  const titleEn = toString(v.title_en);
  const title = titleAr || titleEn || `Apartment #${id}`;

  const locAr = toString(v.location_ar || v.location);
  const locEn = toString(v.location_en);
  const location = locAr || locEn;

  const proxAr = toString(v.proximity_ar || v.proximity);
  const proxEn = toString(v.proximity_en);
  const proximity = proxAr || proxEn;

  const capAr = toString(v.capacity_ar || v.capacity);
  const capEn = toString(v.capacity_en);
  const capacity = capAr || capEn;

  const miTypeAr = toString(v.move_in_type_ar || v.move_in_type);
  const miTypeEn = toString(v.move_in_type_en);
  const moveInType = miTypeAr || miTypeEn || 'فوري';

  const miDateAr = toString(v.move_in_date_ar || v.move_in_date);
  const miDateEn = toString(v.move_in_date_en);
  const moveInDate = miDateAr || miDateEn || '';

  const descAr = toString(v.description_ar || v.description);
  const descEn = toString(v.description_en);
  const description = descAr || descEn;

  const images = parseArrayField(v.images);
  const featuresAr = parseArrayField(v.features_ar || v.features);
  const featuresEn = parseArrayField(v.features_en);
  const features = featuresAr.length > 0 ? featuresAr : featuresEn;

  const universities = Array.isArray(v.universities)
    ? (v.universities as (string | number)[])
    : [];

  return {
    id,
    title,
    title_ar: titleAr,
    title_en: titleEn,
    price,
    location,
    location_ar: locAr,
    location_en: locEn,
    proximity,
    proximity_ar: proxAr,
    proximity_en: proxEn,
    capacity,
    capacity_ar: capAr,
    capacity_en: capEn,
    move_in_type: moveInType,
    move_in_type_ar: miTypeAr,
    move_in_type_en: miTypeEn,
    move_in_date: moveInDate,
    move_in_date_ar: miDateAr,
    move_in_date_en: miDateEn,
    description,
    description_ar: descAr,
    description_en: descEn,
    images,
    features,
    features_ar: featuresAr,
    features_en: featuresEn,
    universities,
    district_id: toNumber(v.district_id),
    rental_type: toString(v.rental_type, 'apartment'),
    rooms_count: toNumber(v.rooms_count),
    roommate_reqs: toString(v.roommate_reqs || v.roommate_requirements) || null,
    roommate_facilities: toString(v.roommate_facilities) || null,
    owner_phone: toString(v.owner_phone) || null,
    is_available: toNumber(v.is_available) ?? 1,
  };
}

export function parseApartments(v: unknown): Apartment[] | null {
  if (!Array.isArray(v)) return null;
  const parsed = v.map(parseApartment);
  if (parsed.some(p => p === null)) return null;
  return parsed as Apartment[];
}

export function parseUniversity(v: unknown): University | null {
  if (!isObject(v)) return null;
  const id = toNumber(v.id);
  if (id === null) return null;
  const name = toString(v.name || v.name_ar);
  return {
    id,
    name,
    name_ar: toString(v.name_ar, name),
    name_en: toString(v.name_en),
  };
}

export function parseUniversities(v: unknown): University[] | null {
  if (!Array.isArray(v)) return null;
  const parsed = v.map(parseUniversity);
  if (parsed.some(p => p === null)) return null;
  return parsed as University[];
}

export function parseDistrict(v: unknown): District | null {
  if (!isObject(v)) return null;
  const id = toNumber(v.id);
  if (id === null) return null;
  const name = toString(v.name || v.name_ar);
  return {
    id,
    name,
    name_ar: toString(v.name_ar, name),
    name_en: toString(v.name_en),
  };
}

export function parseDistricts(v: unknown): District[] | null {
  if (!Array.isArray(v)) return null;
  const parsed = v.map(parseDistrict);
  if (parsed.some(p => p === null)) return null;
  return parsed as District[];
}

export function parseService(v: unknown): Service | null {
  if (!isObject(v)) return null;
  const id = toNumber(v.id);
  if (id === null) return null;
  const title = toString(v.title || v.title_ar);
  return {
    id,
    title,
    title_ar: toString(v.title_ar, title),
    title_en: toString(v.title_en),
    description: toString(v.description || v.description_ar),
    description_ar: toString(v.description_ar || v.description),
    description_en: toString(v.description_en),
    image_url: toString(v.image_url),
    has_form: v.has_form !== undefined ? (toNumber(v.has_form) ?? 1) : 1,
    price_points: toNumber(v.price_points) ?? 0,
    created_at: toString(v.created_at),
    display_title: toString(v.display_title || v.title_ar || v.title),
    display_desc: toString(v.display_desc || v.description_ar || v.description),
  };
}

export function parseServices(v: unknown): Service[] | null {
  if (!Array.isArray(v)) return null;
  const parsed = v.map(parseService);
  if (parsed.some(p => p === null)) return null;
  return parsed as Service[];
}

export function parseRequest(v: unknown): ServiceRequest | null {
  if (!isObject(v)) return null;
  const id = toNumber(v.id);
  if (id === null) return null;
  return {
    id,
    student_id: toNumber(v.student_id) ?? 0,
    service_id: toNumber(v.service_id) ?? 0,
    service_title: toString(v.service_title),
    student_name: toString(v.student_name),
    student_phone: toString(v.student_phone),
    status: toString(v.status, 'جديد'),
    details: toString(v.details || v.form_data),
    form_data: toString(v.form_data || v.details),
    service_price_points: toNumber(v.service_price_points) ?? undefined,
    points_charged: toNumber(v.points_charged) ?? undefined,
    payment_method: toString(v.payment_method) || undefined,
    request_uuid: toString(v.request_uuid) || undefined,
    created_at: toString(v.created_at),
  };
}

export function parseRequests(v: unknown): ServiceRequest[] | null {
  if (!Array.isArray(v)) return null;
  const parsed = v.map(parseRequest);
  if (parsed.some(p => p === null)) return null;
  return parsed as ServiceRequest[];
}

export function parseReview(v: unknown): ServiceReview | null {
  if (!isObject(v)) return null;
  const id = toNumber(v.id);
  if (id === null) return null;
  return {
    id,
    student_id: toNumber(v.student_id) ?? 0,
    service_request_id: toNumber(v.service_request_id),
    rating: toNumber(v.rating) ?? 5,
    comment: toString(v.comment),
    status: toString(v.status, 'pending') as ReviewStatus,
    student_name: toString(v.student_name, 'طالب كريم'),
    uni: toString(v.uni, 'جامعة في جورجيا'),
    date: toString(v.date),
    reviewed_by_admin_id: toNumber(v.reviewed_by_admin_id),
    reviewed_at: toString(v.reviewed_at) || null,
  };
}

export function parseReviews(v: unknown): ServiceReview[] | null {
  if (!Array.isArray(v)) return null;
  const parsed = v.map(parseReview);
  if (parsed.some(p => p === null)) return null;
  return parsed as ServiceReview[];
}

export function parseReviewsAnalytics(v: unknown): ReviewsAnalytics | null {
  if (!isObject(v)) return null;
  const total_reviews = toNumber(v.total_reviews) ?? 0;
  const average_rating = typeof v.average_rating === 'number' ? v.average_rating : (toNumber(v.average_rating) ?? 0);
  
  const rating_distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  if (isObject(v.rating_distribution)) {
    for (const [k, val] of Object.entries(v.rating_distribution)) {
      rating_distribution[k] = toNumber(val) ?? 0;
    }
  }

  const service_analytics: ReviewsAnalytics['service_analytics'] = [];
  if (Array.isArray(v.service_analytics)) {
    for (const item of v.service_analytics) {
      if (isObject(item)) {
        service_analytics.push({
          service_type: toString(item.service_type, 'خدمة عامة'),
          review_count: toNumber(item.review_count) ?? 0,
          average_rating: typeof item.average_rating === 'number' ? item.average_rating : (toNumber(item.average_rating) ?? 0),
        });
      }
    }
  }

  return {
    total_reviews,
    average_rating,
    rating_distribution,
    service_analytics,
  };
}

export function parseFeedbackItem(v: unknown): ApplicationFeedback | null {
  if (!isObject(v)) return null;
  const id = toNumber(v.id);
  if (id === null) return null;
  return {
    id,
    student_id: toNumber(v.student_id) ?? 0,
    feedback_type: toString(v.feedback_type, 'suggestion'),
    comment: toString(v.comment),
    status: toString(v.status, 'pending') as FeedbackStatus,
    reviewed_by_admin_id: toNumber(v.reviewed_by_admin_id),
    reviewed_at: toString(v.reviewed_at) || null,
    date: toString(v.date),
    student_name: toString(v.student_name, 'طالب كريم'),
    student_uni: toString(v.student_uni, 'جامعة في جورجيا'),
  };
}

export function parseFeedbackList(v: unknown): ApplicationFeedback[] | null {
  if (!Array.isArray(v)) return null;
  const parsed = v.map(parseFeedbackItem);
  if (parsed.some(p => p === null)) return null;
  return parsed as ApplicationFeedback[];
}

export function parseStudent(v: unknown): Student | null {
  if (!isObject(v)) return null;
  const id = toNumber(v.id);
  if (id === null) return null;
  return {
    id,
    full_name: toString(v.full_name),
    email: toString(v.email),
    phone: toString(v.phone),
    university: toString(v.university),
    nationality: toString(v.nationality) || null,
    points: toNumber(v.points) ?? 0,
    admin_status: toString(v.admin_status) || null,
    admin_note: toString(v.admin_note) || null,
    is_blocked: toNumber(v.is_blocked) ?? 0,
    created_at: toString(v.created_at),
  };
}

export function parseStudents(v: unknown): Student[] | null {
  if (!Array.isArray(v)) return null;
  const parsed = v.map(parseStudent);
  if (parsed.some(p => p === null)) return null;
  return parsed as Student[];
}

export function parseBlockedIdentity(v: unknown): import('../types/student').BlockedIdentity | null {
  if (!isObject(v)) return null;
  const id = toNumber(v.id);
  if (id === null) return null;
  return {
    id,
    identifier_type: toString(v.identifier_type) === 'email' ? 'email' : 'phone',
    identifier_value: toString(v.identifier_value),
    normalized_value: toString(v.normalized_value),
    source_student_id: toNumber(v.source_student_id),
    reason: toString(v.reason) || null,
    created_by_admin: toString(v.created_by_admin) || null,
    created_at: toString(v.created_at),
  };
}

export function parseBlockedIdentities(v: unknown): import('../types/student').BlockedIdentity[] | null {
  if (!Array.isArray(v)) return null;
  const parsed = v.map(parseBlockedIdentity);
  if (parsed.some(p => p === null)) return null;
  return parsed as import('../types/student').BlockedIdentity[];
}

export function parseNewsItem(v: unknown): import('../types/news').NewsItem | null {
  if (!isObject(v)) return null;
  const id = toNumber(v.id);
  if (id === null) return null;
  const title_ar = toString(v.title_ar || v.title);
  const title_en = toString(v.title_en);
  const content_ar = toString(v.content_ar || v.content);
  const content_en = toString(v.content_en);
  return {
    id,
    title: toString(v.display_title || v.title_ar || v.title),
    title_ar,
    title_en,
    content: toString(v.display_content || v.content_ar || v.content),
    content_ar,
    content_en,
    image_url: toString(v.image_url || v.image),
    date: toString(v.date || v.created_at),
    created_at: toString(v.created_at),
  };
}

export function parseNewsList(v: unknown): import('../types/news').NewsItem[] | null {
  if (!Array.isArray(v)) return null;
  const parsed = v.map(parseNewsItem);
  if (parsed.some(p => p === null)) return null;
  return parsed as import('../types/news').NewsItem[];
}

export function parseNotificationItem(v: unknown): import('../types/notification').BroadcastNotification | null {
  if (!isObject(v)) return null;
  const id = toNumber(v.id);
  if (id === null) return null;
  return {
    id,
    student_id: toNumber(v.student_id) ?? 0,
    title: toString(v.title),
    body: toString(v.body || v.content),
    date: toString(v.date || v.created_at),
    created_at: toString(v.created_at),
  };
}

export function parseNotificationList(v: unknown): import('../types/notification').BroadcastNotification[] | null {
  if (!Array.isArray(v)) return null;
  const parsed = v.map(parseNotificationItem);
  if (parsed.some(p => p === null)) return null;
  return parsed as import('../types/notification').BroadcastNotification[];
}

export function parseChatMessage(v: unknown): import('../types/chat').ChatMessage | null {
  if (!isObject(v)) return null;
  const id = toNumber(v.id);
  if (id === null) return null;
  return {
    id,
    sender: toString(v.sender) === 'admin' ? 'admin' : 'student',
    text: toString(v.text),
    type: toString(v.type) === 'image' ? 'image' : 'text',
    imageUrl: toString(v.imageUrl || v.image_url) || null,
    quoteText: toString(v.quoteText || v.quote_text) || null,
    quoteSender: toString(v.quoteSender || v.quote_sender) || null,
    deleted: !!(v.deleted || v.is_deleted),
    time: toString(v.time || v.created_at),
    created_at: toString(v.created_at),
  };
}

export function parseChatConversation(v: unknown): import('../types/chat').ChatConversation | null {
  if (!isObject(v)) return null;
  const id = toNumber(v.id);
  if (id === null) return null;
  const rawMsgs = Array.isArray(v.messages) ? v.messages : [];
  const parsedMsgs = rawMsgs.map(parseChatMessage).filter((m): m is import('../types/chat').ChatMessage => m !== null);
  return {
    id,
    student_id: toNumber(v.student_id),
    student_name: toString(v.student_name, 'طالب'),
    student_uni: toString(v.student_uni, 'جامعة في جورجيا'),
    phone: toString(v.phone),
    last_msg: toString(v.last_msg),
    status: toString(v.status, 'رسالة جديدة'),
    time: toString(v.time || v.updated_at),
    updated_at: toString(v.updated_at),
    messages: parsedMsgs,
  };
}

export function parseChatList(v: unknown): import('../types/chat').ChatConversation[] | null {
  if (!Array.isArray(v)) return null;
  const parsed = v.map(parseChatConversation);
  if (parsed.some(p => p === null)) return null;
  return parsed as import('../types/chat').ChatConversation[];
}
