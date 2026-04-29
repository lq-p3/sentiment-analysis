/**
 * Region Mapping Utility (regionMapping.ts)
 * 
 * Maps Saudi Arabian cities, towns, landmarks, and tourist destinations to their parent 
 * administrative regions. Supports both Arabic and English naming conventions.
 * Used by the ReportPage sidebar to organize reports into folders.
 */

export interface RegionInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  emoji: string;
  keywords: string[]; // List of cities, towns, and popular landmarks belonging to this region
}

export const SAUDI_REGIONS: RegionInfo[] = [
  {
    id: 'asir',
    nameAr: 'منطقة عسير',
    nameEn: 'Asir Region',
    emoji: '🏔️',
    keywords: [
      'عسير', 'أبها', 'ابها', 'خميس مشيط', 'النماص', 'تنومة', 'محايل',
      'بيشة', 'سراة عبيدة', 'رجال المع', 'ظهران الجنوب', 'أحد رفيدة',
      'السودة', 'مرحبين', 'دلغان', 'الحبلة', 'شلال',
      'asir', 'abha', 'khamis mushait', 'soudah', 'tanomah', 'namas'
    ]
  },
  {
    id: 'riyadh',
    nameAr: 'منطقة الرياض',
    nameEn: 'Riyadh Region',
    emoji: '🏙️',
    keywords: [
      'الرياض', 'رياض', 'الخرج', 'الدرعية', 'الدوادمي', 'المجمعة',
      'الزلفي', 'وادي الدواسر', 'الأفلاج', 'حوطة بني تميم', 'المزاحمية', 'ضرما',
      'بوليفارد', 'ونتر وندر لاند', 'القدية',
      'riyadh', 'alkharj', 'diriyah', 'boulevard', 'quddiya'
    ]
  },
  {
    id: 'makkah',
    nameAr: 'منطقة مكة المكرمة',
    nameEn: 'Makkah Region',
    emoji: '🕋',
    keywords: [
      'مكة', 'مكه', 'جدة', 'جده', 'الطائف', 'رابغ', 'القنفذة', 'الليث', 'خليص',
      'الجموم', 'الكامل', 'تربة', 'الهدا', 'الشفا', 'الحرم', 'الكعبة', 'كورنيش جدة',
      'makkah', 'mecca', 'jeddah', 'taif', 'alhada', 'shafa'
    ]
  },
  {
    id: 'madinah',
    nameAr: 'منطقة المدينة المنورة',
    nameEn: 'Madinah Region',
    emoji: '🕌',
    keywords: [
      'المدينة المنورة', 'المدينه', 'المدينة', 'ينبع', 'العلا', 'بدر', 
      'الحناكية', 'مهد الذهب', 'خيبر', 'المسجد النبوي', 'قباء', 'مدائن صالح',
      'madinah', 'medina', 'yanbu', 'alula', 'al ula'
    ]
  },
  {
    id: 'eastern',
    nameAr: 'المنطقة الشرقية',
    nameEn: 'Eastern Region',
    emoji: '🛢️',
    keywords: [
      'الدمام', 'الخبر', 'الظهران', 'الأحساء', 'الاحساء', 'حفر الباطن',
      'الجبيل', 'القطيف', 'رأس تنورة', 'بقيق', 'الخفجي', 'الجبيل الصناعية',
      'dammam', 'khobar', 'dhahran', 'ahsa', 'jubail', 'qatif'
    ]
  },
  {
    id: 'qassim',
    nameAr: 'منطقة القصيم',
    nameEn: 'Qassim Region',
    emoji: '🌾',
    keywords: [
      'القصيم', 'بريدة', 'عنيزة', 'الرس', 'البكيرية', 'المذنب', 'البدائع',
      'qassim', 'buraidah', 'unaizah', 'rass'
    ]
  },
  {
    id: 'tabuk',
    nameAr: 'منطقة تبوك',
    nameEn: 'Tabuk Region',
    emoji: '🏜️',
    keywords: [
      'تبوك', 'نيوم', 'الوجه', 'ضبا', 'أملج', 'حقل', 'تيماء', 'البدع', 'تروجينا', 'ذا لاين',
      'tabuk', 'neom', 'umluj', 'dhuba', 'trojena', 'the line'
    ]
  },
  {
    id: 'hail',
    nameAr: 'منطقة حائل',
    nameEn: 'Hail Region',
    emoji: '⛰️',
    keywords: [
      'حائل', 'حايل', 'بقعاء', 'الغزالة', 'الشنان', 'موقق', 'جبة',
      'hail', 'baqaa'
    ]
  },
  {
    id: 'jazan',
    nameAr: 'منطقة جازان',
    nameEn: 'Jazan Region',
    emoji: '🌴',
    keywords: [
      'جازان', 'جيزان', 'صبيا', 'أبو عريش', 'صامطة', 'فيفاء', 'الدرب', 'فرسان', 'جزر فرسان',
      'jazan', 'jizan', 'sabya', 'farasan'
    ]
  },
  {
    id: 'najran',
    nameAr: 'منطقة نجران',
    nameEn: 'Najran Region',
    emoji: '🏛️',
    keywords: [
      'نجران', 'شرورة', 'حبونا', 'بدر الجنوب', 'الأخدود',
      'najran', 'sharurah'
    ]
  },
  {
    id: 'baha',
    nameAr: 'منطقة الباحة',
    nameEn: 'Al Baha Region',
    emoji: '🌿',
    keywords: [
      'الباحة', 'بلجرشي', 'المندق', 'المخواة', 'قلوة', 'ذي عين',
      'baha', 'al baha', 'baljurashi'
    ]
  },
  {
    id: 'jawf',
    nameAr: 'منطقة الجوف',
    nameEn: 'Al Jawf Region',
    emoji: '🏕️',
    keywords: [
      'الجوف', 'سكاكا', 'دومة الجندل', 'القريات', 'طبرجل',
      'jawf', 'sakaka', 'qurayyat'
    ]
  },
  {
    id: 'northern_borders',
    nameAr: 'الحدود الشمالية',
    nameEn: 'Northern Borders',
    emoji: '🧭',
    keywords: [
      'عرعر', 'رفحاء', 'طريف', 'العويقيلة',
      'arar', 'rafha', 'turaif'
    ]
  }
];

/**
 * Detects the region for a given city/destination name.
 * Uses keyword matching with case-insensitive and partial match support.
 * 
 * @param cityName - The city or destination name to look up
 * @returns The matching RegionInfo, or null if no match found
 */
export function detectRegion(cityName: string): RegionInfo | null {
  if (!cityName) return null;

  // Normalize string for better matching
  const normalizedCity = cityName.trim().toLowerCase();

  for (const region of SAUDI_REGIONS) {
    for (const keyword of region.keywords) {
      const normalizedKeyword = keyword.toLowerCase();
      // Match if the city name contains the keyword, or the keyword contains the city name
      // This handles cases like "مدينة أبها" matching "أبها"
      if (normalizedCity.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedCity)) {
        return region;
      }
    }
  }

  // Not found in any defined region
  return null;
}
