export interface ChecklistItem {
  id: string;
  text: string;
  baseText?: string;       // 원본 품목명 (예: "수건", "양말")
  count?: number;           // 수량
  unit?: string;            // 단위 ("장", "켤레", "벌", "개" 등)
  isPerDay?: boolean;       // 일차별 비례 증가 품목 여부
  isChecked: boolean;
  checkedAt: number | null; // 체크 타임스탬프
}

export interface TripSchedule {
  destination?: string;
  nights: number;
  days: number;
  label: string; // 예: "3박 4일", "당일치기", "5박 6일"
  isCustom?: boolean;
}

export const SCHEDULE_PRESETS: Array<{ label: string; nights: number; days: number }> = [
  { label: '당일치기', nights: 0, days: 1 },
  { label: '1박 2일', nights: 1, days: 2 },
  { label: '2박 3일', nights: 2, days: 3 },
  { label: '3박 4일', nights: 3, days: 4 },
  { label: '4박 5일', nights: 4, days: 5 },
];

// 일차별 필요 품목 정의 (품목명 매칭 키워드, 단위, 계산 공식)
export const PER_DAY_RULES: Record<
  string,
  { unit: string; calc: (days: number, nights: number) => number }
> = {
  '수건': { unit: '장', calc: (days) => days },
  '양말': { unit: '켤레', calc: (days) => days },
  '속옷': { unit: '벌', calc: (days) => days },
  '여벌 옷': { unit: '벌', calc: (days) => Math.max(1, days - 1) },
  '옷': { unit: '벌', calc: (days) => Math.max(1, days - 1) },
  '마스크': { unit: '개', calc: (days) => days },
  '비타민': { unit: '포', calc: (days) => days },
};

// 여행 일정에 맞춰 텍스트 생성
export function formatPerDayItem(
  baseName: string,
  days: number,
  nights: number
): { text: string; count: number; unit: string; isPerDay: boolean } | null {
  for (const [key, rule] of Object.entries(PER_DAY_RULES)) {
    if (baseName.includes(key)) {
      const count = rule.calc(days, nights);
      return {
        text: `${baseName} ${count}${rule.unit}`,
        count,
        unit: rule.unit,
        isPerDay: true,
      };
    }
  }
  return null;
}

// 기본 추천 여행 품목 템플릿 풀
export const BASE_RECOMMENDED_POOL = [
  { name: '여권', always: true },
  { name: '보조배터리', always: true },
  { name: '스마트폰 충전기', always: true },
  { name: '세면도구', always: true },
  { name: '수건', isPerDay: true, always: true },
  { name: '양말', isPerDay: true, always: true },
  { name: '속옷', isPerDay: true, always: true },
  { name: '여벌 옷', isPerDay: true, always: true },
  { name: '비상약', always: true },
  { name: '편한 신발', always: true },
  { name: '우산/양산' },
  { name: '썬크림' },
  { name: '멀티어댑터' },
  { name: '이어폰/헤드폰' },
  { name: '물티슈' },
  { name: '신분증/운전면허증' },
  { name: '여행자 보험증서' },
  { name: '지퍼백/비닐봉투' },
  { name: '손소독제' },
  { name: '슬리퍼' },
];

export const INITIAL_ITEMS: string[] = [
  '여권',
  '보조배터리',
  '수건 3장',
  '양말 3켤레',
  '속옷 3벌',
  '여벌 옷 2벌',
  '세면도구',
  '비상약',
  '충전기',
  '편한 신발',
  '우산/양산',
  '썬크림',
  '멀티어댑터',
];
