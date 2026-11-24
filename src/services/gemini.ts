export interface AiRecommendRequest {
  destination: string;
  duration?: string;
  travelStyle?: string;
  season?: string;
  existingItems?: string[];
  mode: 'generate' | 'diagnose';
}

export interface RecommendationCategory {
  category: string;
  items: string[];
}

export interface AiRecommendResponse {
  tips: string;
  recommendations: RecommendationCategory[];
}

export const STORAGE_API_KEY = 'travel_gemini_api_key';
export const STORAGE_MODEL_KEY = 'travel_gemini_model';
export const DEFAULT_MODEL = 'gemini-3.8-flash';

export const SUPPORTED_MODELS = [
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (추천/기본)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
];

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_API_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredApiKey(key: string): void {
  try {
    if (!key.trim()) {
      localStorage.removeItem(STORAGE_API_KEY);
    } else {
      localStorage.setItem(STORAGE_API_KEY, key.trim());
    }
  } catch (e) {
    console.error('Failed to save API key to localStorage', e);
  }
}

export function getStoredModel(): string {
  try {
    return localStorage.getItem(STORAGE_MODEL_KEY) || DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
}

export function setStoredModel(model: string): void {
  try {
    localStorage.setItem(STORAGE_MODEL_KEY, model);
  } catch (e) {
    console.error('Failed to save model to localStorage', e);
  }
}

export async function generateChecklistWithGemini(
  request: AiRecommendRequest,
  apiKey: string,
  modelName: string = DEFAULT_MODEL
): Promise<AiRecommendResponse> {
  if (!apiKey.trim()) {
    throw new Error('Gemini API Key가 입력되지 않았습니다. API 키를 먼저 설정해주세요.');
  }

  let prompt = '';
  if (request.mode === 'generate') {
    prompt = `당신은 여행 준비물 전문 AI 플래너입니다.
여행지: ${request.destination || '미정'}
여행 기간: ${request.duration || '기본 일정'}
여행 스타일/동행: ${request.travelStyle || '일반 관광'}
계절/시기: ${request.season || '현재 계절'}

위 여행 조건에 꼭 맞고 빠짐없이 챙겨야 할 실용적인 짐싸기 체크리스트 품목과 유용한 여행 팁을 작성해주세요.
반드시 아래 JSON 포맷으로만 응답해주세요. 마크다운 코드블록은 최소화하고 유효한 JSON만 반환해야 합니다:
{
  "tips": "해당 여행지의 계절, 전압/콘센트, 문화, 기후 등을 반영한 유용한 팁 1~2문장",
  "recommendations": [
    {
      "category": "필수 서류/안전 (예시)",
      "items": ["여권", "여행자보험증서", "비자/입국서류"]
    },
    {
      "category": "전자기기/편의",
      "items": ["보조배터리", "현지 어댑터/돼지코", "유심/eSIM/포켓와이파이"]
    },
    {
      "category": "의류/생활용품",
      "items": ["여벌 옷", "속옷", "잠옷", "편한 운동화"]
    },
    {
      "category": "여행지 맞춤 특화",
      "items": ["상비약", "우산/양산", "선크림"]
    }
  ]
}`;
  } else {
    const existingList = request.existingItems && request.existingItems.length > 0
      ? request.existingItems.join(', ')
      : '현재 등록된 항목 없음';

    prompt = `당신은 여행 준비물 체크리스트 진단 AI 전문가입니다.
여행지: ${request.destination || '일반 여행'}
스타일/특징: ${request.travelStyle || '일반 관광'}
사용자가 현재 챙기기로 등록한 목록:
[${existingList}]

위 현재 목록을 꼼꼼히 검토하고, 여행지 및 조건상 꼭 필요한데 빠뜨렸을 법한 필수 품목들을 분석하여 추천해주세요.
이미 목록에 있는 항목은 제외하고, 누락된 중요 준비물 위주로 작성해주세요.
반드시 아래 JSON 포맷으로만 응답해주세요:
{
  "tips": "현재 준비 상태에 대한 평가 및 여행지별 주의사항 1~2문장",
  "recommendations": [
    {
      "category": "누락된 필수 항목",
      "items": ["추천물품1", "추천물품2"]
    },
    {
      "category": "상황별 추가 권장 품목",
      "items": ["추천물품3", "추천물품4"]
    }
  ]
}`;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error?.message || JSON.stringify(errJson);
    } catch {
      errorDetail = `HTTP ${response.status} ${response.statusText}`;
    }

    if (response.status === 400 && errorDetail.includes('API_KEY_INVALID')) {
      throw new Error('유효하지 않은 API 키입니다. Google AI Studio에서 올바른 키를 확인해주세요.');
    }
    if (response.status === 404) {
      throw new Error(`모델 '${modelName}'을 찾을 수 없거나 접근 권한이 없습니다. 모델 설정을 확인해주세요. (${errorDetail})`);
    }

    throw new Error(`Gemini API 호출 실패: ${errorDetail}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini로부터 빈 응답을 받았습니다. 다시 시도해주세요.');
  }

  // Parse JSON, handling potential markdown wrappers
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    const parsed = JSON.parse(cleaned);
    const recommendations: RecommendationCategory[] = Array.isArray(parsed.recommendations)
      ? parsed.recommendations.map((rec: any) => ({
          category: String(rec.category || '추천 준비물'),
          items: Array.isArray(rec.items) ? rec.items.map((i: any) => String(i).trim()).filter(Boolean) : [],
        })).filter((rec: RecommendationCategory) => rec.items.length > 0)
      : [];

    return {
      tips: parsed.tips || '안전하고 즐거운 여행 되세요!',
      recommendations,
    };
  } catch (parseError) {
    console.error('JSON Parse error on AI response:', rawText, parseError);
    throw new Error('AI 응답 데이터를 해석하지 못했습니다. 다시 시도해주세요.');
  }
}
