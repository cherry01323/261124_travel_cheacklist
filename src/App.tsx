import React, { useState, useEffect, useMemo } from 'react';
import type { ChecklistItem, TripSchedule } from './types';
import {
  INITIAL_ITEMS,
  formatPerDayItem,
  BASE_RECOMMENDED_POOL,
} from './types';
import {
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  Luggage,
  CheckCircle2,
  ListFilter,
  Key,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AiModal } from './components/AiModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ScheduleModal } from './components/ScheduleModal';
import {
  getStoredApiKey,
  getStoredModel,
} from './services/gemini';

const STORAGE_KEY = 'travel_checklist_items_v2';
const STORAGE_SCHEDULE_KEY = 'travel_current_schedule_v2';

export function App() {
  // 시작 화면 vs 체크리스트 화면
  const [screen, setScreen] = useState<'welcome' | 'checklist'>('welcome');

  // 현재 여행 일정 상태 (기본값: 2박 3일)
  const [schedule, setSchedule] = useState<TripSchedule>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SCHEDULE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse schedule:', e);
    }
    return {
      destination: '',
      nights: 2,
      days: 3,
      label: '2박 3일',
    };
  });

  // 체크리스트 아이템 목록
  const [items, setItems] = useState<ChecklistItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse items:', e);
    }
    // 기본 초기 항목 생성 (초기 일정 2박 3일(3일)에 맞춰 수량 자동 계산)
    return INITIAL_ITEMS.map((text, index) => {
      const perDayInfo = formatPerDayItem(text, 3, 2);
      return {
        id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
        text: perDayInfo ? perDayInfo.text : text,
        baseText: perDayInfo ? text.replace(/\s*\d+.*$/, '') : text,
        count: perDayInfo ? perDayInfo.count : undefined,
        unit: perDayInfo ? perDayInfo.unit : undefined,
        isPerDay: perDayInfo ? true : false,
        isChecked: false,
        checkedAt: null,
      };
    });
  });

  const [inputText, setInputText] = useState('');

  // 모달 상태들
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // AI & API 키 관련 상태
  const [apiKey, setApiKey] = useState<string>(() => getStoredApiKey());
  const [model, setModel] = useState<string>(() => getStoredModel());

  // localStorage 자동 저장
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save items to localStorage:', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SCHEDULE_KEY, JSON.stringify(schedule));
    } catch (e) {
      console.error('Failed to save schedule to localStorage:', e);
    }
  }, [schedule]);

  // 새로운 항목 수동 추가 (일차별 물품 감지 시 수량 자동 계산)
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    // 만약 "수건", "양말" 등 일차별 물품 키워드가 포함되어 있고 숫자가 명시되지 않은 경우
    const perDayInfo = formatPerDayItem(trimmed, schedule.days, schedule.nights);
    const displayText = perDayInfo ? perDayInfo.text : trimmed;

    const newItem: ChecklistItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: displayText,
      baseText: perDayInfo ? trimmed : trimmed,
      count: perDayInfo ? perDayInfo.count : undefined,
      unit: perDayInfo ? perDayInfo.unit : undefined,
      isPerDay: perDayInfo ? true : false,
      isChecked: false,
      checkedAt: null,
    };

    setItems((prev) => [newItem, ...prev]);
    setInputText('');
  };

  // 일정 변경 및 체크 목록 임의 자동 생성
  const handleApplySchedule = (newSchedule: TripSchedule, createSampleItems: boolean) => {
    setSchedule(newSchedule);

    if (createSampleItems) {
      // 새로운 일정에 맞춰 추천 품목 풀에서 임의의 체크리스트를 자동 생성
      const selectedItems: ChecklistItem[] = [];

      // 1. 필수 기본 항목들 (여권, 충전기, 보조배터리 등 + 일차별 물품)
      BASE_RECOMMENDED_POOL.forEach((poolItem, idx) => {
        // always 품목은 무조건 포함하고, 나머지는 약 70% 확률로 다양하게 임의 포함
        if (poolItem.always || Math.random() > 0.3) {
          const baseName = poolItem.name;
          const perDayInfo = formatPerDayItem(baseName, newSchedule.days, newSchedule.nights);

          selectedItems.push({
            id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            text: perDayInfo ? perDayInfo.text : baseName,
            baseText: baseName,
            count: perDayInfo ? perDayInfo.count : undefined,
            unit: perDayInfo ? perDayInfo.unit : undefined,
            isPerDay: perDayInfo ? true : false,
            isChecked: false,
            checkedAt: null,
          });
        }
      });

      setItems(selectedItems);
    } else {
      // 기존 리스트 유지하되, 일차별 필요 품목의 수량을 변경된 일정에 맞게 자동 재계산
      setItems((prev) =>
        prev.map((item) => {
          const searchKey = item.baseText || item.text;
          const perDayInfo = formatPerDayItem(searchKey, newSchedule.days, newSchedule.nights);
          if (perDayInfo) {
            return {
              ...item,
              text: perDayInfo.text,
              count: perDayInfo.count,
              unit: perDayInfo.unit,
              isPerDay: true,
            };
          }
          return item;
        })
      );
    }
  };

  // 물품 수량 개별 증감 (+ / -)
  const handleAdjustCount = (id: string, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const currentCount = item.count || 1;
        const nextCount = Math.max(1, currentCount + delta);
        const unit = item.unit || '개';
        const base = item.baseText || item.text.replace(/\s*\d+.*$/, '');
        return {
          ...item,
          count: nextCount,
          unit,
          baseText: base,
          text: `${base} ${nextCount}${unit}`,
        };
      })
    );
  };

  // AI 추천 항목들 일괄 추가
  const handleAddAiItems = (newTexts: string[]) => {
    if (!newTexts || newTexts.length === 0) return;

    const existingTextSet = new Set(items.map((i) => i.text.toLowerCase().trim()));
    const newItems: ChecklistItem[] = [];

    newTexts.forEach((text, idx) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (!existingTextSet.has(trimmed.toLowerCase())) {
        const perDayInfo = formatPerDayItem(trimmed, schedule.days, schedule.nights);
        newItems.push({
          id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
          text: perDayInfo ? perDayInfo.text : trimmed,
          baseText: perDayInfo ? trimmed : trimmed,
          count: perDayInfo ? perDayInfo.count : undefined,
          unit: perDayInfo ? perDayInfo.unit : undefined,
          isPerDay: perDayInfo ? true : false,
          isChecked: false,
          checkedAt: null,
        });
        existingTextSet.add(trimmed.toLowerCase());
      }
    });

    if (newItems.length > 0) {
      setItems((prev) => [...newItems, ...prev]);
    }
  };

  // 체크 토글 & 하단 이동 로직
  const handleToggleCheck = (id: string) => {
    setItems((prev) => {
      const targetIndex = prev.findIndex((item) => item.id === id);
      if (targetIndex === -1) return prev;

      const target = prev[targetIndex];
      const nextChecked = !target.isChecked;

      const updatedTarget: ChecklistItem = {
        ...target,
        isChecked: nextChecked,
        checkedAt: nextChecked ? Date.now() : null,
      };

      if (nextChecked) {
        // 체크 완료 시: 리스트의 맨 끝으로 이동
        const remaining = prev.filter((item) => item.id !== id);
        return [...remaining, updatedTarget];
      } else {
        // 체크 해제 시: 미완료 항목들 중 최하단(완료 항목들의 바로 앞)으로 복귀
        const remaining = prev.filter((item) => item.id !== id);
        const firstCheckedIndex = remaining.findIndex((item) => item.isChecked);
        if (firstCheckedIndex === -1) {
          return [...remaining, updatedTarget];
        }
        return [
          ...remaining.slice(0, firstCheckedIndex),
          updatedTarget,
          ...remaining.slice(firstCheckedIndex),
        ];
      }
    });
  };

  // 항목 개별 삭제
  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // 전체 체크 해제
  const handleUncheckAll = () => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        isChecked: false,
        checkedAt: null,
      }))
    );
  };

  // 통계 계산
  const totalCount = items.length;
  const completedCount = useMemo(
    () => items.filter((item) => item.isChecked).length,
    [items]
  );
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 1. 앱 시작 화면 렌더링
  if (screen === 'welcome') {
    return (
      <>
        <WelcomeScreen
          onStart={() => setScreen('checklist')}
          onOpenSchedule={() => {
            setIsScheduleModalOpen(true);
            setScreen('checklist');
          }}
          savedItemCount={totalCount}
          currentScheduleLabel={schedule.label}
        />
        <ScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          currentSchedule={schedule}
          onApplySchedule={handleApplySchedule}
        />
      </>
    );
  }

  // 2. 체크리스트 메인 화면 렌더링 (모노톤 & #83A0DC 포인트)
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E232B] flex flex-col justify-between p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-xl mx-auto space-y-5 animate-in fade-in duration-200">
        {/* 상단 네비게이션 & 시작 화면으로 돌아가기 */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setScreen('welcome')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#646E7E] hover:text-[#2C323D] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>시작 화면으로</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsApiKeyModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                apiKey
                  ? 'border-[#C5D4ED] bg-[#EEF3FB] text-[#395CA6]'
                  : 'border-[#CBD3E0] bg-white text-[#646E7E] hover:bg-[#F4F6FA]'
              }`}
              title="Gemini API Key 설정"
            >
              <Key className="w-3 h-3 text-[#83A0DC]" />
              <span>{apiKey ? 'API Key 등록됨' : 'API Key 설정'}</span>
            </button>
          </div>
        </div>

        {/* 메인 헤더 카드 (모노톤 배경에 #83A0DC 포인트) */}
        <header className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-[#E2E8F0] space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#EEF3FB] border border-[#C5D4ED] flex items-center justify-center text-[#83A0DC] shadow-xs">
                <Luggage className="w-6 h-6 text-[#83A0DC]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1E232B]">
                  여행 준비물 체크리스트
                </h1>
                <p className="text-xs sm:text-sm text-[#646E7E]">
                  설레는 여행, 빠짐없이 꼼꼼하게 챙겨보세요!
                </p>
              </div>
            </div>

            {/* 일정 추가하기 / 일정 변경 버튼 (요구사항 3번 & 4번) */}
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="px-3 py-2 bg-[#EEF3FB] hover:bg-[#E3ECF9] border border-[#C5D4ED] text-[#395CA6] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Calendar className="w-3.5 h-3.5 text-[#83A0DC]" />
              <span>일정 추가하기</span>
            </button>
          </div>

          {/* 현재 선택된 여행 일정 배지 안내 영역 */}
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#83A0DC]" />
              <span className="text-[#646E7E]">현재 설정 일정:</span>
              <span className="font-bold text-[#1E232B] flex items-center gap-1">
                {schedule.destination && (
                  <span className="text-[#395CA6]">[{schedule.destination}]</span>
                )}
                {schedule.label} ({schedule.days}일간)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="text-[11px] text-[#83A0DC] hover:underline font-semibold"
            >
              일정 변경
            </button>
          </div>

          {/* 진행률 바 및 통계 */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-[#2C323D] flex items-center gap-1.5 text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#83A0DC]" />
                준비 진행률
              </span>
              <span className="text-xs sm:text-sm font-medium text-[#646E7E]">
                <strong className="text-[#395CA6] font-bold">{completedCount}</strong> / {totalCount} 완료
                <span className="ml-1.5 text-xs text-[#8E98A8]">({progressPercent}%)</span>
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#E9EDF4] rounded-full overflow-hidden p-0.5 border border-[#CBD3E0]/40">
              <div
                className="h-full bg-[#83A0DC] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* 상단 퀵 액션 (AI 추천 / 전체 체크 해제 등) */}
          <div className="pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#83A0DC] hover:bg-[#6E8ECF] text-white shadow-xs transition-all cursor-pointer"
                title="Gemini AI 맞춤 준비물 추천 및 빠진 물품 진단"
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI 맞춤 추천 & 진단
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleUncheckAll}
                disabled={completedCount === 0}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-[#646E7E] hover:text-[#1E232B] hover:bg-[#F4F6FA] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="완료된 체크를 모두 해제합니다"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                전체 체크 해제
              </button>
            </div>
          </div>
        </header>

        {/* 새 항목 입력 폼 */}
        <form onSubmit={handleAddItem} className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="추가할 준비물을 입력하세요 (예: 양말, 수건, 여권, 카메라)"
            className="w-full pl-4 pr-24 py-3.5 bg-white rounded-xl shadow-xs border border-[#CBD3E0] focus:outline-none focus:ring-2 focus:ring-[#83A0DC]/30 focus:border-[#83A0DC] text-sm sm:text-base text-[#1E232B] placeholder-[#8E98A8] transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-2 px-4 py-2 bg-[#83A0DC] hover:bg-[#6E8ECF] text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            추가
          </button>
        </form>

        {/* 체크리스트 목록 영역 */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#E2E8F0] space-y-2.5">
          <div className="flex items-center justify-between pb-2 px-1 border-b border-[#E2E8F0] text-xs font-semibold text-[#646E7E]">
            <span className="flex items-center gap-1.5">
              <ListFilter className="w-3.5 h-3.5 text-[#83A0DC]" />
              준비물 목록 ({totalCount}개)
            </span>
            <span className="text-[11px] text-[#8E98A8]">
              일정({schedule.days}일차) 비례 자동 수량 반영
            </span>
          </div>

          {items.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-[#8E98A8] text-sm">등록된 준비물이 없습니다.</p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="px-3.5 py-1.5 bg-[#EEF3FB] text-[#395CA6] border border-[#C5D4ED] rounded-xl text-xs font-bold hover:bg-[#E3ECF9] transition-colors"
                >
                  📅 일정 추가하고 추천 목록 생성하기
                </button>
              </div>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {items.map((item) => (
                <li
                  key={item.id}
                  onClick={() => handleToggleCheck(item.id)}
                  className={`group relative flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border min-h-[48px] cursor-pointer select-none transition-all duration-200 ${
                    item.isChecked
                      ? 'bg-[#F8FAFC] border-[#E2E8F0] text-[#8E98A8]'
                      : 'bg-white border-[#E2E8F0] hover:border-[#83A0DC]/70 hover:shadow-xs text-[#1E232B]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* 왼쪽 체크박스 버튼 */}
                    <button
                      type="button"
                      aria-label={item.isChecked ? '체크 해제' : '체크 완료'}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                        item.isChecked
                          ? 'bg-[#83A0DC] border-[#83A0DC] text-white shadow-xs'
                          : 'border-[#CBD3E0] bg-[#F8FAFC] group-hover:bg-white text-transparent'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 stroke-[3] ${item.isChecked ? 'opacity-100' : 'opacity-0'}`} />
                    </button>

                    {/* 준비물 텍스트 및 일차별 수량 표시 */}
                    <span
                      className={`text-sm sm:text-base font-medium truncate transition-all duration-200 ${
                        item.isChecked ? 'line-through text-[#8E98A8]' : 'text-[#2C323D]'
                      }`}
                    >
                      {item.text}
                    </span>

                    {/* 일차별 물품 배지 */}
                    {item.isPerDay && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EEF3FB] text-[#395CA6] border border-[#C5D4ED]/60 font-semibold shrink-0 hidden sm:inline-block">
                        일정 연동
                      </span>
                    )}
                  </div>

                  {/* 오른쪽 조작 영역 (수량 조절 버튼 + 삭제 버튼) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* 수량이 있는 품목인 경우 + / - 버튼 제공 */}
                    {item.count !== undefined && !item.isChecked && (
                      <div
                        className="flex items-center bg-[#F1F4F9] border border-[#CBD3E0] rounded-lg text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => handleAdjustCount(item.id, -1, e)}
                          className="px-2 py-0.5 text-[#646E7E] hover:text-[#1E232B] hover:bg-[#E9EDF4] rounded-l-md transition-colors"
                          title="수량 1 감소"
                        >
                          -
                        </button>
                        <span className="px-1.5 font-bold text-[#2C323D] text-[11px]">
                          {item.count}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleAdjustCount(item.id, 1, e)}
                          className="px-2 py-0.5 text-[#646E7E] hover:text-[#1E232B] hover:bg-[#E9EDF4] rounded-r-md transition-colors"
                          title="수량 1 증가"
                        >
                          +
                        </button>
                      </div>
                    )}

                    {/* 개별 삭제 버튼 */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      aria-label={`${item.text} 삭제`}
                      className="p-1.5 rounded-lg text-[#8E98A8] hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-80 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 하단 푸터 */}
      <footer className="text-center text-xs text-[#8E98A8] mt-8 py-3">
        여행 준비물 체크리스트 &copy; {new Date().getFullYear()} &middot; 즐겁고 안전한 여행 되세요!
      </footer>

      {/* 모달 창들 */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        currentSchedule={schedule}
        onApplySchedule={handleApplySchedule}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        currentModel={model}
        onSave={(newKey, newModel) => {
          setApiKey(newKey);
          setModel(newModel);
        }}
      />

      <AiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        apiKey={apiKey}
        model={model}
        onOpenApiKeyModal={() => {
          setIsApiKeyModalOpen(true);
        }}
        existingItems={items.map((i) => i.text)}
        currentScheduleText={schedule.label}
        onAddItems={handleAddAiItems}
      />
    </div>
  );
}

export default App;
