import React, { useState } from 'react';
import {
  Key,
  X,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  Check,
  Cpu
} from 'lucide-react';
import {
  SUPPORTED_MODELS,
  setStoredApiKey,
  setStoredModel,
} from '../services/gemini';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  currentModel: string;
  onSave: (newKey: string, newModel: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  currentModel,
  onSave,
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [model, setModel] = useState(currentModel);
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputKey.trim();
    setStoredApiKey(trimmed);
    setStoredModel(model);
    onSave(trimmed, model);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleClear = () => {
    setInputKey('');
    setStoredApiKey('');
    onSave('', model);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E2E8F0] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 (모노톤 & #83A0DC 포인트) */}
        <div className="px-6 py-4 bg-white border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EEF3FB] text-[#83A0DC] flex items-center justify-center">
              <Key className="w-4 h-4 text-[#83A0DC]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E232B]">Gemini API 키 설정</h2>
              <p className="text-xs text-[#646E7E]">개인 API Key로 스마트 추천 기능을 활성화합니다</p>
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
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* 사용 모델 선택 */}
          <div>
            <label className="block text-xs font-semibold text-[#2C323D] mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#83A0DC]" />
              사용할 AI 모델
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#CBD3E0] rounded-xl text-sm text-[#1E232B] font-medium focus:outline-none focus:ring-2 focus:ring-[#83A0DC]/30 focus:border-[#83A0DC]"
            >
              {SUPPORTED_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* API Key 입력 */}
          <div>
            <label className="block text-xs font-semibold text-[#2C323D] mb-1.5">
              Google Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-3.5 pr-20 py-2.5 bg-[#F8FAFC] border border-[#CBD3E0] rounded-xl text-sm font-mono text-[#1E232B] placeholder-[#8E98A8] focus:outline-none focus:ring-2 focus:ring-[#83A0DC]/30 focus:border-[#83A0DC]"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#8E98A8] hover:text-[#2C323D] transition-colors"
                title={showKey ? '키 숨기기' : '키 보기'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#83A0DC]" />}
              </button>
            </div>
          </div>

          {/* 안내 및 보안 가이드 */}
          <div className="p-3 bg-[#EEF3FB]/70 rounded-xl border border-[#C5D4ED] text-xs text-[#2C323D] space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-[#395CA6]">
              <ShieldCheck className="w-4 h-4 text-[#83A0DC]" />
              보안 및 개인정보 안내
            </div>
            <p className="text-[11px] leading-relaxed text-[#54637A]">
              입력하신 API Key는 외부 서버로 전송되지 않고 브라우저(localStorage)에만 안전하게 보관되며, Google Gemini API로 직접 호출됩니다.
            </p>
          </div>

          {/* 무료 키 발급 링크 */}
          <div className="pt-1">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#395CA6] hover:text-[#83A0DC] hover:underline font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#83A0DC]" />
              Google AI Studio에서 무료 API Key 발급받기
            </a>
          </div>

          {/* 액션 버튼 */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#E2E8F0]">
            {apiKey ? (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl font-medium transition-colors"
              >
                키 삭제
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#646E7E] hover:bg-[#F4F6FA] rounded-xl transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={!inputKey.trim()}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#83A0DC] hover:bg-[#6E8ECF] rounded-xl shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    저장됨
                  </>
                ) : (
                  '저장하기'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
