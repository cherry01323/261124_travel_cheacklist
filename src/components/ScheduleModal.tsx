import React, { useState } from 'react';
import {
  Calendar,
  X,
  Compass,
  Check,
  Info
} from 'lucide-react';
import {
  TripSchedule,
  SCHEDULE_PRESETS,
} from '../types';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSchedule: TripSchedule;
  onApplySchedule: (schedule: TripSchedule, createSampleItems: boolean) => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  currentSchedule,
  onApplySchedule,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(() => {
    const matched = SCHEDULE_PRESETS.find(
      (p) => p.nights === currentSchedule.nights && p.days === currentSchedule.days
    );
    return matched ? matched.label : 'custom';
  });

  const [destination, setDestination] = useState(currentSchedule.destination || '');
  const [customNights, setCustomNights] = useState<number>(
    currentSchedule.nights >= 5 ? currentSchedule.nights : 5
  );
  const [customDays, setCustomDays] = useState<number>(
    currentSchedule.days >= 6 ? currentSchedule.days : 6
  );
  const [createSampleItems, setCreateSampleItems] = useState(true);

  if (!isOpen) return null;

  const quickDestinations = ['제주도', '일본 오사카', '베트남 다낭', '부산', '동남아 휴양지'];

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();

    let nights = 0;
    let days = 1;
    let label = '당일치기';
    let isCustom = false;

    if (selectedPreset === 'custom') {
      nights = Math.max(0, Number(customNights) || 0);
      days = Math.max(1, Number(customDays) || nights + 1);
      label = nights === 0 ? '당일치기' : `${nights}박 ${days}일`;
      isCustom = true;
    } else {
      const preset = SCHEDULE_PRESETS.find((p) => p.label === selectedPreset);
      if (preset) {
        nights = preset.nights;
        days = preset.days;
        label = preset.label;
      }
    }

    const newSchedule: TripSchedule = {
      destination: destination.trim(),
      nights,
      days,
      label,
      isCustom,
    };

    onApplySchedule(newSchedule, createSampleItems);
    onClose();
  };

  // 현재 선택된 일수 계산 (미리보기용)
  const previewDays =
    selectedPreset === 'custom'
      ? Math.max(1, Number(customDays) || 1)
      : SCHEDULE_PRESETS.find((p) => p.label === selectedPreset)?.days || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E2E8F0] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 */}
        <div className="px-6 py-4 bg-white border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EEF3FB] text-[#83A0DC] flex items-center justify-center">
              <Calendar className="w-4 h-4 text-[#83A0DC]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E232B]">여행 일정 선택</h2>
              <p className="text-xs text-[#646E7E]">일정에 따라 필요한 물품 수량이 자동 계산됩니다</p>
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

        {/* 폼 내용 */}
        <form onSubmit={handleApply} className="p-6 space-y-5">
          {/* 1. 여행지 입력 (선택) */}
          <div>
            <label className="block text-xs font-semibold text-[#2C323D] mb-1.5 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#83A0DC]" />
              여행지 (선택)
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="예: 제주도, 일본 도쿄, 다낭"
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

          {/* 2. 여행 일정 (몇박 며칠) 선택 */}
          <div>
            <label className="block text-xs font-semibold text-[#2C323D] mb-2 flex items-center justify-between">
              <span>여행 일정 (몇박 며칠)</span>
              <span className="text-[11px] text-[#83A0DC] font-medium">당일치기 ~ 4박 5일 / 직접 입력</span>
            </label>

            {/* 프리셋 칩 그리드 */}
            <div className="grid grid-cols-3 gap-2">
              {SCHEDULE_PRESETS.map((preset) => {
                const isSelected = selectedPreset === preset.label;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setSelectedPreset(preset.label)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-[#EEF3FB] border-[#83A0DC] text-[#395CA6] shadow-xs'
                        : 'bg-white border-[#CBD3E0] text-[#646E7E] hover:border-[#83A0DC]/50'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
              {/* 직접 입력 칩 */}
              <button
                type="button"
                onClick={() => setSelectedPreset('custom')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                  selectedPreset === 'custom'
                    ? 'bg-[#EEF3FB] border-[#83A0DC] text-[#395CA6] shadow-xs'
                    : 'bg-white border-[#CBD3E0] text-[#646E7E] hover:border-[#83A0DC]/50'
                }`}
              >
                직접 입력
              </button>
            </div>

            {/* 직접 입력 선택 시 (5박 이상) 인풋 필드 */}
            {selectedPreset === 'custom' && (
              <div className="mt-3 p-3.5 bg-[#F8FAFC] border border-[#CBD3E0] rounded-xl space-y-2 animate-in fade-in duration-150">
                <span className="text-[11px] font-semibold text-[#2C323D] block">
                  직접 여행 기간 입력 (5박 이상 등)
                </span>
                <div className="flex items-center gap-2 text-sm text-[#2C323D]">
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={customNights}
                    onChange={(e) => {
                      const n = parseInt(e.target.value) || 0;
                      setCustomNights(n);
                      setCustomDays(n + 1);
                    }}
                    className="w-16 px-2.5 py-1.5 bg-white border border-[#CBD3E0] rounded-lg text-center font-bold text-sm focus:outline-none focus:border-[#83A0DC]"
                  />
                  <span className="font-medium text-xs text-[#646E7E]">박</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={customDays}
                    onChange={(e) => setCustomDays(parseInt(e.target.value) || 1)}
                    className="w-16 px-2.5 py-1.5 bg-white border border-[#CBD3E0] rounded-lg text-center font-bold text-sm focus:outline-none focus:border-[#83A0DC]"
                  />
                  <span className="font-medium text-xs text-[#646E7E]">일</span>
                  <span className="text-[11px] text-[#8E98A8] ml-auto">
                    (총 {customDays}일)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 3. 일차별 수량 자동 계산 안내 및 템플릿 생성 토글 */}
          <div className="p-3 bg-[#EEF3FB]/70 border border-[#C5D4ED] rounded-xl space-y-2 text-xs text-[#2C323D]">
            <div className="flex items-center gap-1.5 font-bold text-[#395CA6]">
              <Info className="w-4 h-4 text-[#83A0DC] shrink-0" />
              <span>일차별 물품 수량 자동 반영</span>
            </div>
            <p className="text-[11px] text-[#54637A] leading-relaxed">
              선택한 일정(<strong className="text-[#395CA6]">{previewDays}일</strong>)에 맞춰{' '}
              <strong>수건({previewDays}장)</strong>, <strong>양말({previewDays}켤레)</strong>,{' '}
              <strong>속옷({previewDays}벌)</strong>, <strong>여벌 옷({Math.max(1, previewDays - 1)}벌)</strong> 수량이 자동으로 계산되어 리스트에 반영됩니다.
            </p>
          </div>

          {/* 추천 체크 목록 임의 생성 옵션 */}
          <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-[#2C323D]">
            <input
              type="checkbox"
              checked={createSampleItems}
              onChange={(e) => setCreateSampleItems(e.target.checked)}
              className="mt-0.5 rounded text-[#83A0DC] focus:ring-[#83A0DC]"
            />
            <span>
              선택한 일정에 맞는 <strong>추천 준비물 목록</strong>을 자동으로 채우기
              <span className="block text-[11px] text-[#8E98A8]">
                (일정에 비례한 수량 및 필수품이 임의로 준비물 목록에 생성됩니다)
              </span>
            </span>
          </label>

          {/* 하단 액션 버튼 */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#646E7E] hover:bg-[#F4F6FA] rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#83A0DC] hover:bg-[#6E8ECF] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              일정 적용하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
