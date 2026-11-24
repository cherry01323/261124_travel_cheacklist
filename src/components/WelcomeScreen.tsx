import React from 'react';
import {
  Luggage,
  Calendar,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Plane,
  Compass
} from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
  onOpenSchedule: () => void;
  savedItemCount: number;
  currentScheduleLabel?: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStart,
  onOpenSchedule,
  savedItemCount,
  currentScheduleLabel,
}) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E232B] flex flex-col justify-between p-4 sm:p-8">
      {/* 상단 네비게이션 */}
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#83A0DC] text-white flex items-center justify-center shadow-xs">
            <Plane className="w-5 h-5" />
          </div>
          <span className="font-bold text-sm tracking-wider text-[#2C323D]">
            TRIP CHECKLIST
          </span>
        </div>
        <span className="text-xs font-medium text-[#646E7E] px-2.5 py-1 rounded-full bg-[#E9EDF4] border border-[#CBD3E0]/50">
          Smart Travel Planner
        </span>
      </header>

      {/* 중앙 메인 히어로 카드 */}
      <main className="max-w-xl mx-auto w-full my-auto py-8 space-y-8 text-center animate-in fade-in duration-300">
        {/* 비주얼 아이콘 */}
        <div className="relative inline-block">
          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-3xl bg-[#EEF3FB] border border-[#C5D4ED] flex items-center justify-center shadow-sm">
            <Luggage className="w-12 h-12 sm:w-14 sm:h-14 text-[#83A0DC]" />
          </div>
          <div className="absolute -top-1.5 -right-1.5 w-8 h-8 rounded-full bg-white border border-[#CBD3E0] shadow-xs flex items-center justify-center text-[#83A0DC]">
            <Sparkles className="w-4 h-4 text-[#83A0DC]" />
          </div>
        </div>

        {/* 타이틀 및 소개 문구 */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EEF3FB] text-[#395CA6] border border-[#C5D4ED]">
            <Compass className="w-3.5 h-3.5 text-[#83A0DC]" />
            설레는 여행의 똑똑한 동반자
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E232B] tracking-tight leading-snug">
            여행 준비물 체크리스트
          </h1>
          <p className="text-sm sm:text-base text-[#646E7E] max-w-md mx-auto leading-relaxed">
            여행 일정에 맞춘 <strong className="text-[#2C323D] font-semibold">수량 자동 계산</strong>과{' '}
            <strong className="text-[#395CA6] font-semibold">AI 맞춤 추천</strong>으로 빠짐없이 가볍게 떠나보세요.
          </p>
        </div>

        {/* 3가지 핵심 기능 안내 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-[#F4F6FA] flex items-center justify-center text-[#83A0DC]">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#2C323D]">일정별 수량 자동 계산</h3>
            <p className="text-[11px] text-[#646E7E] leading-normal">
              당일치기부터 장기 여행까지 수건, 양말, 옷 수량을 일정에 맞게 자동 증량합니다.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-[#EEF3FB] flex items-center justify-center text-[#83A0DC]">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#2C323D]">Gemini AI 추천 & 진단</h3>
            <p className="text-[11px] text-[#646E7E] leading-normal">
              gemini-3.8-flash 모델이 여행지 특성에 맞는 필수품과 꿀팁을 조언합니다.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-[#F4F6FA] flex items-center justify-center text-[#646E7E]">
              <CheckCircle2 className="w-4 h-4 text-[#83A0DC]" />
            </div>
            <h3 className="text-xs font-bold text-[#2C323D]">스마트 자동 정렬</h3>
            <p className="text-[11px] text-[#646E7E] leading-normal">
              체크 완료 시 하단으로 자동 이동하며 브라우저에 안전하게 보관됩니다.
            </p>
          </div>
        </div>

        {/* 시작하기 액션 버튼 */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={onStart}
            className="w-full sm:w-auto min-w-[240px] py-3.5 px-8 bg-[#83A0DC] hover:bg-[#6E8ECF] text-white font-semibold text-base rounded-2xl shadow-md shadow-[#83A0DC]/25 transition-all inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <span>체크리스트 시작하기</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div>
            <button
              type="button"
              onClick={onOpenSchedule}
              className="text-xs font-medium text-[#646E7E] hover:text-[#395CA6] hover:underline transition-colors"
            >
              📅 여행 일정(몇박 며칠) 먼저 선택하고 시작하기
            </button>
          </div>

          {savedItemCount > 0 && (
            <p className="text-[11px] text-[#8E98A8]">
              {currentScheduleLabel ? `현재 일정: ${currentScheduleLabel} · ` : ''}
              이전에 작성한 준비물 {savedItemCount}개가 보관되어 있습니다.
            </p>
          )}
        </div>
      </main>

      {/* 하단 푸터 */}
      <footer className="max-w-xl mx-auto w-full text-center text-xs text-[#8E98A8] py-3">
        여행 준비물 체크리스트 &copy; {new Date().getFullYear()} &middot; 즐겁고 안전한 여행 되세요!
      </footer>
    </div>
  );
};
