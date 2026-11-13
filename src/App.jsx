import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Flame,
  Trophy,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Award,
  Sparkles,
  RotateCcw,
  X,
  Lock
} from 'lucide-react';

const STAMP_TYPES = [
  { id: 'beans', name: 'たいそう', emoji: '🤸' },
  { id: 'fist', name: 'さくら', emoji: '🌸' },
  { id: 'gymnast', name: 'ひまわり', emoji: '🌻' },
  { id: 'candy', name: 'グッド', emoji: '👍' },
];

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const STORAGE_KEYS = {
  STAMPS: 'radio_taiso_stamps_v4',
  SELECTED_STAMP: 'radio_taiso_selected_stamp_v4',
  USER_NAME: 'radio_taiso_user_name_v4',
  SOUND_ENABLED: 'radio_taiso_sound_enabled_v4',
};

export default function App() {
  const [today] = useState(() => new Date(2026, 10, 13));

  const [stamps, setStamps] = useState({});
  const [selectedStamp, setSelectedStamp] = useState('beans');
  const [userName, setUserName] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(10); // 11月

  const [isStamping, setIsStamping] = useState(false);
  const [celebrationModal, setCelebrationModal] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isMatrixHighlighted, setIsMatrixHighlighted] = useState(false);

  const matrixRef = useRef(null);

  const formatDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayKey = useMemo(() => formatDateKey(today), [today]);

  useEffect(() => {
    try {
      const savedStamps = localStorage.getItem(STORAGE_KEYS.STAMPS);
      if (savedStamps) setStamps(JSON.parse(savedStamps));

      const savedStampType = localStorage.getItem(STORAGE_KEYS.SELECTED_STAMP);
      if (savedStampType && STAMP_TYPES.some((s) => s.id === savedStampType)) {
        setSelectedStamp(savedStampType);
      }

      const savedName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
      if (savedName !== null) setUserName(savedName);

      const savedSound = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
      if (savedSound !== null) setSoundEnabled(JSON.parse(savedSound));
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STAMPS, JSON.stringify(stamps));
    } catch (err) {
      console.error(err);
    }
  }, [stamps]);

  const handleSelectStamp = (id) => {
    setSelectedStamp(id);
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_STAMP, id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setUserName(value);
    try {
      localStorage.setItem(STORAGE_KEYS.USER_NAME, value);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, JSON.stringify(next));
    } catch (err) {
      console.error(err);
    }
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2400);
  };

  const playStampSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const thudOsc = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thudOsc.type = 'triangle';
      thudOsc.frequency.setValueAtTime(190, now);
      thudOsc.frequency.exponentialRampToValueAtTime(52, now + 0.14);
      thudGain.gain.setValueAtTime(0.55, now);
      thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      thudOsc.connect(thudGain);
      thudGain.connect(ctx.destination);
      thudOsc.start(now);
      thudOsc.stop(now + 0.15);

      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + 0.1 + idx * 0.065;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.16, startTime);
        gain.gain.exponentialRampToValueAtTime(0.005, startTime + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.28);
      });
    } catch (err) {
      console.error(err);
    }
  };

  const playRemoveSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.1);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (err) {
      console.error(err);
    }
  };

  const { totalCount, streak } = useMemo(() => {
    const keys = Object.keys(stamps);
    const total = keys.length;

    let currentStreak = 0;
    const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (!stamps[formatDateKey(cursor)]) {
      cursor.setDate(cursor.getDate() - 1);
    }

    while (stamps[formatDateKey(cursor)]) {
      currentStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return { totalCount: total, streak: currentStreak };
  }, [stamps, today]);

  const isCheckedInToday = Boolean(stamps[todayKey]);

  const checkMilestoneCelebration = (newTotal) => {
    const milestones = {
      7: { badge: '7日達成賞', title: 'スタンプ 7個 達成！', message: '1週間よくがんばりました！毎朝の体操習慣が身についてきましたね！' },
      14: { badge: '14日達成賞', title: 'スタンプ 14個 達成！', message: '2週間継続達成おめでとうございます！その調子で健康な毎日を続けましょう！' },
      30: { badge: '30日皆勤賞', title: 'スタンプ 30個 達成！', message: 'おめでとうございます！30日達成のスペシャル表彰状です！' },
    };
    if (milestones[newTotal]) {
      setCelebrationModal(milestones[newTotal]);
    }
  };

  const scrollToCard = () => {
    setIsMatrixHighlighted(true);
    setTimeout(() => {
      setIsMatrixHighlighted(false);
    }, 1000);

    setTimeout(() => {
      if (matrixRef.current) {
        matrixRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  const handleTodayCheckIn = () => {
    if (isCheckedInToday || isStamping) return;

    setIsStamping(true);
    playStampSound();

    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());

    setTimeout(() => {
      setStamps((prev) => {
        const updated = { ...prev, [todayKey]: selectedStamp };
        checkMilestoneCelebration(Object.keys(updated).length);
        return updated;
      });
      setIsStamping(false);
      scrollToCard();
    }, 220);
  };

  const handleDateCellClick = (cellDate) => {
    if (cellDate > today) {
      triggerToast('未来の日付にはスタンプを押せません');
      return;
    }

    if (cellDate.getTime() === today.getTime()) {
      if (!isCheckedInToday) {
        handleTodayCheckIn();
      } else {
        triggerToast('本日のスタンプはすでに押印済みです！');
        scrollToCard();
      }
      return;
    }

    const key = formatDateKey(cellDate);
    setStamps((prev) => {
      const updated = { ...prev };
      if (updated[key]) {
        delete updated[key];
        playRemoveSound();
      } else {
        updated[key] = selectedStamp;
        playStampSound();
        checkMilestoneCelebration(Object.keys(updated).length);
      }
      return updated;
    });
    scrollToCard();
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleResetAll = () => {
    setStamps({});
    try {
      localStorage.removeItem(STORAGE_KEYS.STAMPS);
    } catch (err) {
      console.error(err);
    }
    setShowResetModal(false);
    triggerToast('スタンプ記録をリセットしました');
  };

  const calendarCells = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewYear, viewMonth, d));
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    return cells;
  }, [viewYear, viewMonth]);

  const getStampEmoji = (stampId) => {
    return STAMP_TYPES.find((s) => s.id === stampId)?.emoji || '🤸';
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-[#4A3B32] font-sans pb-12 selection:bg-[#E85D4E] selection:text-white">
      <style>{`
        @keyframes stampSlam {
          0% { transform: scale(2.4) rotate(-25deg); opacity: 0; }
          65% { transform: scale(0.9) rotate(-6deg); opacity: 1; }
          100% { transform: scale(1) rotate(-8deg); opacity: 1; }
        }
        .animate-stamp-slam {
          animation: stampSlam 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>

      {/* トップヘッダー（レトロオレンジ） */}
      <header className="w-full bg-[#E85D4E] text-white shadow-md sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">☀️</span>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-wide">
              ラジオ体操カード
            </h1>
          </div>
          <button
            onClick={toggleSound}
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition cursor-pointer"
            aria-label="音声切り替え"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-white/75" />}
          </button>
        </div>
      </header>

      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#4A3B32] text-[#FFFDF7] text-xs sm:text-sm font-bold px-4 py-2.5 rounded-full shadow-lg border border-[#E6D5B8] whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      <main className="max-w-lg mx-auto px-4 pt-5 flex flex-col gap-5">
        {/* 実績カード（2カラム） */}
        <section className="grid grid-cols-2 gap-3.5">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F0E6D8] flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#FFF2E8] flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 text-[#E86F2C]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#8C7A6B]">連続達成</p>
              <p className="text-2xl font-black text-[#E85D4E] leading-tight mt-0.5">
                {streak} <span className="text-sm font-bold text-[#4A3B32]">日</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F0E6D8] flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#FFF2E8] flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6 text-[#E85D4E]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#8C7A6B]">通算スタンプ</p>
              <p className="text-2xl font-black text-[#E85D4E] leading-tight mt-0.5">
                {totalCount} <span className="text-sm font-bold text-[#4A3B32]">個</span>
              </p>
            </div>
          </div>
        </section>

        {/* クイックチェックイン（白い角丸カード ＋ 朱赤の枠線） */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#E85D4E] shadow-[0_6px_20px_rgba(232,93,78,0.1)] text-center">
          <p className="text-xs sm:text-sm font-bold text-[#7A695B]">
            本日: {today.getFullYear()}年{today.getMonth() + 1}月{today.getDate()}日
          </p>

          <h2 className="text-base sm:text-lg font-extrabold text-[#4A3B32] mt-1.5">
            体操が終わったらハンコを押そう！
          </h2>

          <div className="mt-4">
            {isCheckedInToday ? (
              <div className="w-full py-4 px-6 rounded-full bg-[#F5EFE6] border-2 border-[#D8CCA8] text-[#5C4D40] font-extrabold text-base sm:text-lg flex items-center justify-center gap-2 select-none">
                <CheckCircle2 className="w-6 h-6 text-[#2E9E5B]" />
                <span>本日のスタンプ押印済み！</span>
              </div>
            ) : (
              <button
                onClick={handleTodayCheckIn}
                disabled={isStamping}
                className={`w-full py-4 px-6 rounded-full bg-gradient-to-b from-[#F26E5C] to-[#E85D4E] hover:from-[#F57F70] hover:to-[#D94C3D] text-white font-black text-lg sm:text-xl shadow-[0_6px_0_#B83A2C,0_10px_20px_rgba(232,93,78,0.3)] active:translate-y-1 active:shadow-[0_2px_0_#B83A2C] transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer ${
                  isStamping ? 'scale-95' : ''
                }`}
              >
                <span className="text-2xl leading-none select-none">✨</span>
                <span>スタンプを押す！</span>
              </button>
            )}
          </div>

          {/* 印鑑デザイン選択（画像通りの丸型デザイン・テキスト付き） */}
          <div className="mt-6 pt-4 border-t border-[#F5EFE6] flex flex-col sm:flex-row items-center justify-center gap-3">
            <span className="text-xs font-extrabold text-[#7A695B] tracking-wider whitespace-nowrap">
              印鑑デザイン：
            </span>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {STAMP_TYPES.map((stamp) => {
                const isSelected = selectedStamp === stamp.id;
                return (
                  <button
                    key={stamp.id}
                    type="button"
                    onClick={() => handleSelectStamp(stamp.id)}
                    className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-full transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-2 border-[#E85D4E] bg-[#FFF5F3] scale-105 shadow-[0_2px_8px_rgba(232,93,78,0.25)]'
                        : 'border border-[#E5DCC9] bg-[#FAF6ED] hover:border-[#C9B99E] hover:bg-white opacity-80 hover:opacity-100'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl leading-none">{stamp.emoji}</span>
                    <span className="text-[9px] font-bold text-[#6E5E52] mt-0.5">{stamp.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 出席カード（自動スクロール対象） */}
        <section 
          ref={matrixRef}
          className={`bg-white rounded-3xl p-4 sm:p-6 border-2 shadow-md transition-all duration-700 scroll-mt-24 ${
            isMatrixHighlighted 
              ? 'border-[#E85D4E] bg-[#FFF5F3] scale-[1.01] shadow-[0_0_30px_rgba(232,93,78,0.3)]' 
              : 'border-[#E5DCC9]'
          }`}
        >
          <div className="text-center pb-3 border-b-2 border-dashed border-[#EFE5D0]">
            <p className="text-[11px] font-extrabold tracking-widest text-[#9E8775] uppercase">
              夏休み Radio Exercise
            </p>

            <div className="flex items-center justify-between mt-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-full hover:bg-[#F5EFE6] text-[#6E5E52] active:scale-90 transition cursor-pointer"
                aria-label="前の月へ"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <h2 className="text-lg sm:text-xl font-black text-[#5C4532] tracking-wide">
                {viewYear}年{viewMonth + 1}月 出席カード
              </h2>

              <button
                onClick={handleNextMonth}
                className="p-2 rounded-full hover:bg-[#F5EFE6] text-[#6E5E52] active:scale-90 transition cursor-pointer"
                aria-label="次の月へ"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="mt-3 bg-[#FAF5EC] border border-[#E5DCC9] rounded-xl px-3.5 py-2 flex items-center gap-2 max-w-sm mx-auto focus-within:border-[#E85D4E] focus-within:bg-white transition">
              <label htmlFor="user-name-input" className="text-xs sm:text-sm font-extrabold text-[#5C4532] whitespace-nowrap">
                なまえ：
              </label>
              <input
                id="user-name-input"
                type="text"
                value={userName}
                onChange={handleNameChange}
                placeholder="ここになまえをかいてね"
                maxLength={24}
                className="w-full bg-transparent text-sm sm:text-base font-bold text-[#4A3B32] placeholder-[#BCAF9B] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mt-4 mb-1.5 text-center">
            {WEEKDAYS.map((dayName, idx) => (
              <div
                key={dayName}
                className={`text-xs font-extrabold py-1 rounded-md ${
                  idx === 0 ? 'text-[#E85D4E] bg-[#FFF2EE]' : idx === 6 ? 'text-[#2B6CB0] bg-[#EBF4FF]' : 'text-[#7A695B] bg-[#F5EFE6]'
                }`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* カレンダーグリッド */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarCells.map((cellDate, index) => {
              if (!cellDate) {
                return <div key={`empty-${index}`} className="aspect-square rounded-xl bg-[#FAF6EE]/50 border border-transparent" />;
              }

              const key = formatDateKey(cellDate);
              const stampedId = stamps[key];
              const isTodayCell = key === todayKey;
              const isFuture = cellDate > today;
              const dayOfWeek = cellDate.getDay();

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleDateCellClick(cellDate)}
                  disabled={isFuture}
                  className={`aspect-square rounded-xl border flex flex-col items-center justify-between p-1 relative transition-all select-none ${
                    isFuture
                      ? 'border-[#EBE3D3] bg-[#FAF6EE]/60 text-[#A89886]/60 cursor-not-allowed opacity-75'
                      : isTodayCell
                      ? 'border-2 border-[#E85D4E] bg-[#FFF2EE] shadow-sm cursor-pointer'
                      : 'border-[#E5DCC9] bg-white hover:border-[#E85D4E]/70 hover:bg-[#FFF9F6] cursor-pointer active:scale-95'
                  }`}
                >
                  <div className="w-full flex items-center justify-between px-0.5">
                    <span
                      className={`text-[11px] sm:text-xs font-extrabold leading-none ${
                        isTodayCell
                          ? 'text-[#E85D4E]'
                          : dayOfWeek === 0
                          ? 'text-[#E85D4E]'
                          : dayOfWeek === 6
                          ? 'text-[#2B6CB0]'
                          : 'text-[#6E5E52]'
                      }`}
                    >
                      {cellDate.getDate()}
                    </span>
                    {isTodayCell && (
                      <span className="text-[8px] font-black text-white bg-[#E85D4E] px-1 rounded-sm leading-tight">今日</span>
                    )}
                  </div>

                  <div className="flex-1 flex items-center justify-center w-full">
                    {stampedId ? (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#E85D4E] bg-[#FFF5F3]/90 flex flex-col items-center justify-center shadow-[0_1px_4px_rgba(232,93,78,0.25)] animate-stamp-slam">
                        <span className="text-base sm:text-xl leading-none">{getStampEmoji(stampedId)}</span>
                        <span className="text-[6px] sm:text-[7px] font-black text-[#E85D4E] leading-none mt-0.5 tracking-tighter">済</span>
                      </div>
                    ) : isFuture ? (
                      <Lock className="w-3.5 h-3.5 text-[#BCAF9B]" />
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-dashed border-[#E5DCC9]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-[11px] text-[#8C7A6B] text-center leading-relaxed">
            ※ 未来の日付には鍵がかかりスタンプを押せません。過去の日付はタップでON/OFFできます。
          </p>
        </section>

        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="text-xs text-[#9E8775] hover:text-[#E85D4E] flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>スタンプ記録をリセットする</span>
          </button>
        </div>
      </main>

      {celebrationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border-4 border-[#E85D4E] rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative animate-stamp-slam">
            <button
              onClick={() => setCelebrationModal(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full text-[#8C7A6B] hover:bg-[#F5EFE6] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 rounded-full bg-[#FFF2E8] border-2 border-[#E85D4E] flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Award className="w-9 h-9 text-[#E85D4E]" />
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E85D4E] text-white text-xs font-black tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              {celebrationModal.badge}
            </span>
            <h3 className="text-xl font-black text-[#4A3B32] mt-1">{celebrationModal.title}</h3>
            <p className="text-sm text-[#5C4532] mt-2.5 leading-relaxed bg-[#FAF5EC] p-3.5 rounded-2xl border border-[#E5DCC9]">
              {celebrationModal.message}
            </p>
            <button
              onClick={() => setCelebrationModal(null)}
              className="mt-5 w-full py-3 rounded-full bg-[#E85D4E] hover:bg-[#D94C3D] text-white font-extrabold text-sm shadow-md transition cursor-pointer"
            >
              やったね！とじる
            </button>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-[#E85D4E] rounded-3xl max-w-sm w-full p-6 text-center shadow-xl">
            <h3 className="text-lg font-extrabold text-[#4A3B32]">スタンプ記録をリセットしますか？</h3>
            <p className="text-xs sm:text-sm text-[#7A695B] mt-2 leading-relaxed">
              これまでに押したすべてのスタンプ履歴が消去されます。（入力したなまえは残ります）
            </p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="py-2.5 rounded-full bg-[#F5EFE6] hover:bg-[#EAE0D0] text-[#5C4532] font-bold text-sm transition cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleResetAll}
                className="py-2.5 rounded-full bg-[#E85D4E] hover:bg-[#D94C3D] text-white font-bold text-sm shadow-sm transition cursor-pointer"
              >
                リセットする
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
