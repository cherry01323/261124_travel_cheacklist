import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Loader2,
  Check,
  Plus,
  Key,
  Compass,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import {
  generateChecklistWithGemini,
  AiRecommendResponse,
  AiRecommendRequest,
} from '../services/gemini';

interface AiModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  model: string;
  onOpenApiKeyModal: () => void;
  existingItems: string[];
  currentScheduleText?: string;
  onAddItems: (newItems: string[]) => void;
}

export const AiModal: React.FC<AiModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  model,
  onOpenApiKeyModal,
  existingItems,
  currentScheduleText,
  onAddItems,
}) => {
  const [mode, setMode] = useState<'generate' | 'diagnose'>('generate');
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState(currentScheduleText || '3박 4일');
  const [travelStyle, setTravelStyle] = useState('관광 및 힐링');
  const [season, setSeason] = useState('사계절/현재');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiRecommendResponse | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const quickDestinations = ['일본 오사카/도쿄', '베트남 다낭', '제주도', '태국 방콕', '유럽 파리'];
  const quickStyles = ['휴양/힐링', '관광/쇼핑', '아이 동반 가족', '배낭/뚜벅이', '출장/비즈니스'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      onOpenApiKeyModal();
      return;
    }

    if (mode === 'generate' && !destination.trim()) {
      setError('여행지를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    const request: AiRecommendRequest = {
      mode,
      destination: destination.trim(),
      duration: duration.trim(),
      travelStyle: travelStyle.trim(),
      season: season.trim(),
      existingItems,
    };

    try {
      const response = await generateChecklistWithGemini(request, apiKey, model);
      setResult(response);

      // 기본적으로 모든 추천 아이템을 선택 상태로 초기화
      const allItems = new Set<string>();
      response.recommendations.forEach((cat) => {
        cat.items.forEach((item) => allItems.add(item));
      });
      setSelectedItems(allItems);
    } catch (err: any) {
      setError(err?.message || '추천 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleItem = (item: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  };

  const handleSelectAll = (select: boolean) => {
    if (!result) return;
    if (select) {
      const all = new Set<string>();
      result.recommendations.forEach((cat) => {
        cat.items.forEach((item) => all.add(item));
      });
      setSelectedItems(all);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleApplySelected = () => {
    if (selectedItems.size === 0) return;
    onAddItems(Array.from(selectedItems));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div
        className="w-full max-w-xl max-h-[90vh] bg-white rounded-2xl shadow-xl border border-[#E2E8F0] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 (모노톤 & #83A0DC) */}
        <div className="px-6 py-4 bg-white border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EEF3FB] text-[#83A0DC] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#83A0DC]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#1E232B]">AI 스마트 여행 플래너</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EEF3FB] text-[#395CA6] border border-[#C5D4ED] font-medium">
                  {model}
                </span>
              </div>
              <p className="text-xs text-[#646E7E]">
                여행지 맞춤 준비물 추천 및 누락된 필수품 진단
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8E98A8] hover:text-[#1E232B] hover:bg-[#F4F6FA] rounded-lg transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* API Key 미등록 시 배너 */}
        {!apiKey && (
          <div className="px-6 py-2.5 bg-[#EEF3FB] border-b border-[#C5D4ED] flex items-center justify-between text-xs text-[#2C323D] shrink-0">
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-[#83A0DC]" />
              <span>Gemini API Key가 등록되지 않았습니다.</span>
            </div>
            <button
              onClick={onOpenApiKeyModal}
              className="px-2.5 py-1 bg-[#83A0DC] hover:bg-[#6E8ECF] text-white text-[11px] font-semibold rounded-lg transition-colors"
            >
              키 등록하기
            </button>
          </div>
        )}

        {/* 모달 본문 (스크롤 가능) */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* 모드 선택 탭 */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F4F6FA] rounded-xl border border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => {
                setMode('generate');
                setResult(null);
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${mode === 'generate'
                  ? 'bg-white text-[#395CA6] shadow-xs border border-[#CBD3E0]/60'
                  : 'text-[#646E7E] hover:text-[#1E232B]'
                }`}
            >
              🎒 맞춤 체크리스트 생성
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('diagnose');
                setResult(null);
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${mode === 'diagnose'
                  ? 'bg-white text-[#395CA6] shadow-xs border border-[#CBD3E0]/60'
                  : 'text-[#646E7E] hover:text-[#1E232B]'
                }`}
            >
              🔍 현재 목록 빠진 물품 진단
            </button>
          </div>

          {/* 입력 폼 */}
          {!result && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 여행지 입력 */}
              <div>
                <label className="block text-xs font-semibold text-[#2C323D] mb-1.5 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#83A0DC]" />
                  여행지 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="예: 일본 오사카, 제주도, 다낭, 파리"
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#CBD3E0] rounded-xl text-sm text-[#1E232B] placeholder-[#8E98A8] focus:outline-none focus:ring-2 focus:ring-[#83A0DC]/30 focus:border-[#83A0DC]"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {quickDestinations.map((dest) => (
                    <button
                      key={dest}
                      type="button"
                      onClick={() => setDestination(dest)}
                      className="px-2 py-0.5 text-[11px] rounded-lg bg-[#F1F4F9] text-[#646E7E] hover:bg-[#EEF3FB] hover:text-[#395CA6] transition-colors"
                    >
                      {dest}
                    </button>
                  ))}
                </div>
              </div>

              {/* 일정 및 계절 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2C323D] mb-1">
                    여행 일정 / 기간
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="예: 3박 4일, 일주일"
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#CBD3E0] rounded-xl text-sm text-[#1E232B] focus:outline-none focus:ring-2 focus:ring-[#83A0DC]/30 focus:border-[#83A0DC]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2C323D] mb-1">
                    시기 / 계절
                  </label>
                  <input
                    type="text"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    placeholder="예: 여름, 겨울, 11월말"
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#CBD3E0] rounded-xl text-sm text-[#1E232B] focus:outline-none focus:ring-2 focus:ring-[#83A0DC]/30 focus:border-[#83A0DC]"
                  />
                </div>
              </div>

              {/* 여행 스타일 */}
              <div>
                <label className="block text-xs font-semibold text-[#2C323D] mb-1">
                  여행 스타일 / 특이사항
                </label>
                <input
                  type="text"
                  value={travelStyle}
                  onChange={(e) => setTravelStyle(e.target.value)}
                  placeholder="예: 수영/스노클링 예정, 어린 아이 동반, 가벼운 출장"
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#CBD3E0] rounded-xl text-sm text-[#1E232B] focus:outline-none focus:ring-2 focus:ring-[#83A0DC]/30 focus:border-[#83A0DC]"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {quickStyles.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTravelStyle(st)}
                      className="px-2 py-0.5 text-[11px] rounded-lg bg-[#F1F4F9] text-[#646E7E] hover:bg-[#EEF3FB] hover:text-[#395CA6] transition-colors"
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* 현재 체크리스트 진단 모드 안내 */}
              {mode === 'diagnose' && (
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#CBD3E0] text-xs text-[#54637A] space-y-1">
                  <span className="font-semibold text-[#1E232B]">
                    현재 목록 ({existingItems.length}개 항목) 분석 준비 완료:
                  </span>
                  <p className="text-[11px] text-[#646E7E] truncate">
                    {existingItems.length > 0 ? existingItems.join(', ') : '등록된 준비물이 없습니다.'}
                  </p>
                </div>
              )}

              {/* 에러 메시지 */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">오류 발생</p>
                    <p className="text-[11px] text-rose-600 leading-relaxed">{error}</p>
                  </div>
                </div>
              )}

              {/* 제출 버튼 */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#83A0DC] hover:bg-[#6E8ECF] text-white font-semibold rounded-xl text-sm shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gemini가 맞춤 추천을 구성하는 중입니다...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {mode === 'generate' ? 'AI 맞춤 준비물 추천받기' : '현재 체크리스트 진단하기'}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* AI 추천 결과 표시 화면 */}
          {result && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* 여행 팁 박스 */}
              {result.tips && (
                <div className="p-3.5 bg-[#EEF3FB] border border-[#C5D4ED] rounded-xl text-xs text-[#2C323D] flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-[#83A0DC] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#395CA6] block mb-0.5">AI 여행 어드바이스</span>
                    <p className="text-[11px] text-[#54637A] leading-relaxed">{result.tips}</p>
                  </div>
                </div>
              )}

              {/* 추천 항목 목록 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#646E7E]">
                  <span className="font-semibold text-[#1E232B]">
                    선택된 항목: <strong className="text-[#395CA6]">{selectedItems.size}개</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAll(true)}
                      className="text-[11px] text-[#83A0DC] hover:underline"
                    >
                      전체 선택
                    </button>
                    <span className="text-[#CBD3E0]">|</span>
                    <button
                      type="button"
                      onClick={() => handleSelectAll(false)}
                      className="text-[11px] text-[#8E98A8] hover:underline"
                    >
                      전체 해제
                    </button>
                  </div>
                </div>

                {/* 카테고리별 아이템 카드 */}
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {result.recommendations.map((cat, catIdx) => (
                    <div
                      key={catIdx}
                      className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 space-y-2"
                    >
                      <h4 className="text-xs font-bold text-[#2C323D] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#83A0DC]" />
                        {cat.category}
                      </h4>
                      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                        {cat.items.map((item) => {
                          const isSelected = selectedItems.has(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => handleToggleItem(item)}
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition-all ${isSelected
                                  ? 'bg-[#EEF3FB] border-[#83A0DC] text-[#395CA6] shadow-xs'
                                  : 'bg-white border-[#E2E8F0] text-[#646E7E] hover:border-[#CBD3E0]'
                                }`}
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border ${isSelected
                                    ? 'bg-[#83A0DC] border-[#83A0DC] text-white'
                                    : 'border-[#CBD3E0] bg-white'
                                  }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                              <span className="truncate">{item}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 하단 액션 버튼 */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="px-3.5 py-2 text-xs font-medium text-[#646E7E] hover:bg-[#F4F6FA] rounded-xl transition-colors"
                >
                  다시 검색하기
                </button>
                <button
                  type="button"
                  disabled={selectedItems.size === 0}
                  onClick={handleApplySelected}
                  className="px-5 py-2.5 bg-[#83A0DC] hover:bg-[#6E8ECF] text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  선택한 {selectedItems.size}개 준비물 추가
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
