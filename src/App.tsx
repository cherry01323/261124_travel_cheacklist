import React, { useState, useEffect, useMemo } from 'react';
import type { ChecklistItem } from './types';
import { INITIAL_ITEMS } from './types';
import {
  Plane,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  Luggage,
  CheckCircle2,
  ListFilter
} from 'lucide-react';

const STORAGE_KEY = 'travel_checklist_items_v1';

export function App() {
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
      console.error('Failed to parse localStorage data:', e);
    }
    // 기본 초기 데이터 생성
    return INITIAL_ITEMS.map((text, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
      text,
      isChecked: false,
      checkedAt: null,
    }));
  });

  const [inputText, setInputText] = useState('');

  // localStorage 자동 저장
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [items]);

  // 새로운 항목 추가
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const newItem: ChecklistItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: trimmed,
      isChecked: false,
      checkedAt: null,
    };

    setItems((prev) => [newItem, ...prev]);
    setInputText('');
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
        // 체크 완료 시: 해당 항목을 제외한 리스트의 맨 끝으로 이동
        const remaining = prev.filter((item) => item.id !== id);
        return [...remaining, updatedTarget];
      } else {
        // 체크 해제 시: 미완료 항목들 중 최하단(완료 항목들의 바로 앞)으로 이동
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
    e.stopPropagation(); // 텍스트 영역/행 클릭 이벤트 전파 방지
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

  // 기본 목록으로 초기화
  const handleResetToDefault = () => {
    if (window.confirm('기본 준비물 목록으로 초기화하시겠습니까? 현재 항목들은 대체됩니다.')) {
      const defaultItems: ChecklistItem[] = INITIAL_ITEMS.map((text, index) => ({
        id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
        text,
        isChecked: false,
        checkedAt: null,
      }));
      setItems(defaultItems);
    }
  };

  // 통계 계산
  const totalCount = items.length;
  const completedCount = useMemo(
    () => items.filter((item) => item.isChecked).length,
    [items]
  );
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50/40 to-slate-100 text-slate-800 flex flex-col justify-between p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-xl mx-auto space-y-6">
        {/* 헤더 카드 */}
        <header className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/60">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <Plane className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  여행 준비물 체크리스트
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  설레는 여행, 빠짐없이 꼼꼼하게 챙겨보세요!
                </p>
              </div>
            </div>
            <Luggage className="w-8 h-8 text-indigo-400/40 hidden sm:block" />
          </div>

          {/* 진행률 바 및 통계 */}
          <div className="mt-5 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sky-500" />
                준비 진행률
              </span>
              <span className="text-sm font-medium text-slate-600">
                <strong className="text-sky-600 font-bold">{completedCount}</strong> / {totalCount} 완료
                <span className="ml-1.5 text-xs text-slate-400">({progressPercent}%)</span>
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* 상단 액션 버튼들 */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              onClick={handleUncheckAll}
              disabled={completedCount === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              title="완료된 체크를 모두 해제합니다"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              전체 체크 해제
            </button>
            <button
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
              title="기본 10가지 준비물 목록으로 리셋합니다"
            >
              <Sparkles className="w-3.5 h-3.5" />
              기본 목록 초기화
            </button>
          </div>
        </header>

        {/* 새 항목 입력 폼 */}
        <form onSubmit={handleAddItem} className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="추가할 준비물을 입력하세요 (예: 여권 사본, 카메라)"
            className="w-full pl-4 pr-24 py-3.5 bg-white rounded-xl shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 text-sm sm:text-base text-slate-800 placeholder-slate-400 transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            추가
          </button>
        </form>

        {/* 체크리스트 목록 영역 */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-sm border border-white/60 space-y-2">
          <div className="flex items-center justify-between pb-2 px-1 border-b border-slate-100 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <ListFilter className="w-3.5 h-3.5" />
              준비물 목록 ({totalCount}개)
            </span>
            <span className="text-[11px] text-slate-400">
              체크 시 맨 아래로 자동 이동
            </span>
          </div>

          {items.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-slate-400 text-sm">등록된 준비물이 없습니다.</p>
              <button
                onClick={handleResetToDefault}
                className="text-xs text-sky-600 hover:underline font-medium"
              >
                기본 준비물 목록 불러오기
              </button>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {items.map((item) => (
                <li
                  key={item.id}
                  onClick={() => handleToggleCheck(item.id)}
                  className={`group relative flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border min-h-[48px] cursor-pointer select-none transition-all duration-200 ${item.isChecked
                      ? 'bg-slate-50/70 border-slate-200/60 text-slate-400'
                      : 'bg-white border-slate-200/80 hover:border-sky-300 hover:shadow-xs text-slate-800'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* 왼쪽 체크박스 버튼 */}
                    <button
                      type="button"
                      aria-label={item.isChecked ? '체크 해제' : '체크 완료'}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${item.isChecked
                          ? 'bg-sky-500 border-sky-500 text-white shadow-xs'
                          : 'border-slate-300 bg-slate-50 hover:border-sky-400 group-hover:bg-white text-transparent'
                        }`}
                    >
                      <Check className={`w-3.5 h-3.5 stroke-[3] ${item.isChecked ? 'opacity-100' : 'opacity-0'}`} />
                    </button>

                    {/* 준비물 텍스트 */}
                    <span
                      className={`text-sm sm:text-base font-medium truncate transition-all duration-200 ${item.isChecked
                          ? 'line-through text-slate-400'
                          : 'text-slate-700'
                        }`}
                    >
                      {item.text}
                    </span>
                  </div>

                  {/* 오른쪽 개별 삭제 버튼 */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteItem(item.id, e)}
                    aria-label={`${item.text} 삭제`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-80 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 하단 푸터 */}
      <footer className="text-center text-xs text-slate-400 mt-8 py-2">
        여행 준비물 체크리스트 &copy; {new Date().getFullYear()} &middot; 즐겁고 안전한 여행 되세요!
      </footer>
    </div>
  );
}

export default App;
