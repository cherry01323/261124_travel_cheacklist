export interface ChecklistItem {
  id: string;
  text: string;
  isChecked: boolean;
  checkedAt: number | null; // 체크된 타임스탬프 (정렬 기준)
}

export const INITIAL_ITEMS: string[] = [
  '여권',
  '보조배터리',
  '세면도구',
  '비상약',
  '충전기',
  '옷',
  '편한 신발',
  '우산',
  '썬크림',
  '멀티어댑터',
];
