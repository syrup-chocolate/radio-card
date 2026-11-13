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

// スタンプ4種（絵文字のみ・テキスト案内なし）
const STAMP_TYPES = [
  { id: 'beans', emoji: '🫘' },
  { id: 'fist', emoji: '👊' },
  { id: 'gymnast', emoji: '🤸' },
  { id: 'candy', emoji: '🍭' },
];

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const STORAGE_KEYS = {
  STAMPS: 'radio_taiso_stamps_v5',
  SELECTED_STAMP: 'radio_taiso_selected_stamp_v5',
  USER_NAME: 'radio_taiso_user_name_v5',
  SOUND_ENABLED: 'radio_taiso_sound_enabled_v5',
};

export default function App() {
  // 本日日付（2026年11月13日固定）
  const [today] = useState(() => new Date(2026, 10, 13));

  const [stamps, setStamps] = useState({});
  const [selectedStamp, setSelectedStamp] = useState('beans');
  const [userName, setUserName] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // 表示中の年月（2026年11月）
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(10);

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
    const startBound = new Date(2026, 10, 1); // 2026年11月1日
    const yesterdayBound = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

    if (cellDate > today) {
      triggerToast('未来の日付にはまだスタンプを押せません');
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

    if (cellDate < startBound) {
      triggerToast('2026年11月1日以降の日付のみスタンプを押せます');
      return;
    }

    if (cellDate >= startBound && cellDate <= yesterdayBound) {
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
    }
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
    return STAMP_TYPES.find((s) => s.id === stampId)?.emoji || '🫘';
  };

  return (
    <div className="min-h-screen bg-[#FDF8E7] text-[#3B2A1E] font-sans pb-12 selection:bg-[#E04F33] selection:text-white">
      <style>{`
        @keyframes stampSlam {
          0% { transform: scale(2.4) rotate(-25deg); opacity: 0; }
          65% { transform: scale(0.9) rotate(-6deg); opacity: 1; }
          100% { transform: scale(1) rotate(-8deg); opacity: 1; }
        }
        .animate-stamp-slam {
          animation: stampSlam 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .paper-texture {
          background-image: radial-gradient(rgba(180, 145, 95, 0.12) 1px, transparent 0);
          background-size: 16px 16px;
        }
      `}</style>

      {/* トップヘッダー */}
      <header className="w-full bg-[#E04F33] text-white shadow-md sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl leading-none select-none" role="img" aria-label="beans">
              🫘
            </span>
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
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#3B2A1E] text-[#FDF8E7] text-xs sm:text-sm font-bold px-4 py-2.5 rounded-full shadow-lg border border-[#E6D5B8] whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      <main className="max-w-lg mx-auto px-4 pt-5 flex flex-col gap-5">
        {/* 実績カード */}
        <section className="grid grid-cols-2 gap-3.5">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#EFE3C8] flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#FFF2E2] flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 text-[#E86F2C]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#8C735B]">連続達成</p>
              <p className="text-2xl font-black text-[#E04F33] leading-tight mt-0.5">
                {streak} <span className="text-sm font-bold text-[#5C4532]">日</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#EFE3C8] flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#FDECEC] flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6 text-[#E04F33]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#8C735B]">通算スタンプ</p>
              <p className="text-2xl font-black text-[#E04F33] leading-tight mt-0.5">
                {totalCount} <span className="text-sm font-bold text-[#5C4532]">個</span>
              </p>
            </div>
          </div>
        </section>

        {/* クイックチェックインエリア */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#E04F33] shadow-[0_6px_20px_rgba(224,79,51,0.12)] text-center">
          <p className="text-xs sm:text-sm font-bold text-[#7A624B]">
            本日: {today.getFullYear()}年{today.getMonth() + 1}月{today.getDate()}日
          </p>

          <h2 className="text-base sm:text-lg font-extrabold text-[#3B2A1E] mt-1.5">
            体操が終わったらハンコを押そう！
          </h2>

          <div className="mt-4">
            {isCheckedInToday ? (
              <div className="w-full py-4 px-6 rounded-full bg-[#F3EFE6] border-2 border-[#D8CCB8] text-[#6E5844] font-extrabold text-base sm:text-lg flex items-center justify-center gap-2 select-none">
                <CheckCircle2 className="w-6 h-6 text-[#2E9E5B]" />
                <span>本日のスタンプ押印済み！</span>
              </div>
            ) : (
              <button
                onClick={handleTodayCheckIn}
                disabled={isStamping}
                className={`w-full py-4 px-6 rounded-full bg-gradient-to-b from-[#EE5D3F] to-[#D94326] hover:from-[#F2674A] hover:to-[#E04F33] text-white font-black text-lg sm:text-xl shadow-[0_6px_0_#A82E17,0_10px_20px_rgba(224,79,51,0.35)] active:translate-y-1 active:shadow-[0_2px_0_#A82E17] transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer ${
                  isStamping ? 'scale-95' : ''
                }`}
              >
                <span className="text-2xl leading-none select-none">👊</span>
                <span>スタンプを押す！</span>
              </button>
            )}
          </div>

          {/* 印鑑デザイン選択（テキスト案内なし・絵文字のみ） */}
          <div className="mt-6 pt-4 border-t border-[#F2E8D5] flex flex-col sm:flex-row items-center justify-center gap-3">
            <span className="text-xs font-extrabold text-[#7A624B] tracking-wider">
              印鑑デザイン：
            </span>
            <div className="flex items-center justify-center gap-3.5">
              {STAMP_TYPES.map((stamp) => {
                const isSelected = selectedStamp === stamp.id;
                return (
                  <button
                    key={stamp.id}
                    type="button"
                    onClick={() => handleSelectStamp(stamp.id)}
                    aria-label={`スタンプ ${stamp.emoji}`}
                    className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-2 border-[#E04F33] bg-[#FFF5F2] scale-110 shadow-[0_4px_12px_rgba(224,79,51,0.3)] ring-2 ring-[#E04F33]/20'
                        : 'border border-[#E5D7BE] bg-[#FAF6ED] hover:border-[#C9B493] hover:bg-white opacity-80 hover:opacity-100'
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl leading-none select-none">{stamp.emoji}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 出席カードエリア（自動スクロール対象） */}
        <section 
          ref={matrixRef}
          className={`bg-[#FFFDF7] paper-texture rounded-3xl p-4 sm:p-6 border-2 shadow-md transition-all duration-700 scroll-mt-24 ${
            isMatrixHighlighted 
              ? 'border-[#E04F33] bg-[#FFF4F0] scale-[1.01] shadow-[0_0_30px_rgba(224,79,51,0.35)]' 
              : 'border-[#DFC9A6]'
          }`}
        >
          <div className="text-center pb-3 border-b-2 border-dashed border-[#E3CFAF]">
            <p className="text-xs font-extrabold tracking-widest text-[#9E7B56] uppercase">
              Radio Exercise
            </p>

            <div className="flex items-center justify-between mt-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-full hover:bg-[#F5EAD6] text-[#6E4F32] active:scale-90 transition cursor-pointer"
                aria-label="前の月へ"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <h2 className="text-xl sm:text-2xl font-black text-[#6E4222] tracking-wide">
                {viewYear}年{viewMonth + 1}月 出席カード
              </h2>

              <button
                onClick={handleNextMonth}
                className="p-2 rounded-full hover:bg-[#F5EAD6] text-[#6E4F32] active:scale-90 transition cursor-pointer"
                aria-label="次の月へ"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="mt-3 bg-[#FAF2E1] border border-[#E2CCA8] rounded-xl px-3.5 py-2 flex items-center gap-2 max-w-sm mx-auto focus-within:border-[#E04F33] focus-within:bg-white transition">
              <label htmlFor="user-name-input" className="text-xs sm:text-sm font-extrabold text-[#6E4222] whitespace-nowrap">
                なまえ：
              </label>
              <input
                id="user-name-input"
                type="text"
                value={userName}
                onChange={handleNameChange}
                placeholder="ここになまえをかいてね"
                maxLength={24}
                className="w-full bg-transparent text-sm sm:text-base font-bold text-[#3B2A1E] placeholder-[#BCA586] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mt-4 mb-1.5 text-center">
            {WEEKDAYS.map((dayName, idx) => (
              <div
                key={dayName}
                className={`text-xs font-extrabold py-1 rounded-md ${
                  idx === 0 ? 'text-[#D94326] bg-[#FDECE8]' : idx === 6 ? 'text-[#2B6CB0] bg-[#EBF4FF]' : 'text-[#6E5338] bg-[#F5EAD6]'
                }`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* カレンダーグリッド（未来日ロック＆鍵表示） */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarCells.map((cellDate, index) => {
              if (!cellDate) {
                return <div key={`empty-${index}`} className="aspect-square rounded-xl bg-[#F7EFE0]/45 border border-transparent" />;
              }

              const key = formatDateKey(cellDate);
              const stampedId = stamps[key];
              const isTodayCell = key === todayKey;
              const startBound = new Date(2026, 10, 1);
              const yesterdayBound = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
              const isPastEditable = cellDate >= startBound && cellDate <= yesterdayBound;
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
                      ? 'border-[#ECE2CE] bg-[#F9F4E8]/70 opacity-60 cursor-not-allowed'
                      : isTodayCell
                      ? 'border-2 border-[#E04F33] bg-[#FFF4F0] shadow-sm cursor-pointer'
                      : isPastEditable
                      ? 'border-[#DFC9A6] bg-white hover:border-[#E04F33]/70 hover:bg-[#FFF9F2] cursor-pointer active:scale-95'
                      : 'border-[#E8DBC3] bg-[#FAF4E8]/80 cursor-default'
                  }`}
                >
                  <div className="w-full flex items-center justify-between px-0.5">
                    <span
                      className={`text-[11px] sm:text-xs font-extrabold leading-none ${
                        isTodayCell
                          ? 'text-[#E04F33]'
                          : dayOfWeek === 0
                          ? 'text-[#D94326]'
                          : dayOfWeek === 6
                          ? 'text-[#2B6CB0]'
                          : 'text-[#6E5338]'
                      }`}
                    >
                      {cellDate.getDate()}
                    </span>
                    {isTodayCell && (
                      <span className="text-[8px] font-black text-white bg-[#E04F33] px-1 rounded-sm leading-tight">今日</span>
                    )}
                  </div>

                  <div className="flex-1 flex items-center justify-center w-full">
                    {stampedId ? (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#E04F33] bg-[#FFF5F3]/90 flex flex-col items-center justify-center shadow-[0_1px_4px_rgba(224,79,51,0.25)] animate-stamp-slam">
                        <span className="text-base sm:text-xl leading-none">{getStampEmoji(stampedId)}</span>
                        <span className="text-[6px] sm:text-[7px] font-black text-[#E04F33] leading-none mt-0.5 tracking-tighter">済</span>
                      </div>
                    ) : isFuture ? (
                      <Lock className="w-3.5 h-3.5 text-[#BCA586]" />
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-dashed border-[#DFC9A6]/80" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-[11px] text-[#8C735B] text-center leading-relaxed">
            ※ 2026年11月1日〜前日までのマス目は、タップすると任意でスタンプの押印・取り消しができます（未来日はロック）。
          </p>
        </section>

        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="text-xs text-[#9E876E] hover:text-[#D94326] flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>スタンプ記録をリセットする</span>
          </button>
        </div>
      </main>

      {/* 達成モーダル */}
      {celebrationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFDF7] border-4 border-[#E04F33] rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative animate-stamp-slam">
            <button
              onClick={() => setCelebrationModal(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full text-[#8C735B] hover:bg-[#F3E9D6] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 rounded-full bg-[#FFF2E2] border-2 border-[#E04F33] flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Award className="w-9 h-9 text-[#E04F33]" />
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E04F33] text-white text-xs font-black tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              {celebrationModal.badge}
            </span>
            <h3 className="text-xl font-black text-[#3B2A1E] mt-1">{celebrationModal.title}</h3>
            <p className="text-sm text-[#5C4532] mt-2.5 leading-relaxed bg-[#FAF2E1] p-3.5 rounded-2xl border border-[#E6D4B5]">
              {celebrationModal.message}
            </p>
            <button
              onClick={() => setCelebrationModal(null)}
              className="mt-5 w-full py-3 rounded-full bg-[#E04F33] hover:bg-[#C94127] text-white font-extrabold text-sm shadow-md transition cursor-pointer"
            >
              やったね！とじる
            </button>
          </div>
        </div>
      )}

      {/* リセット確認モーダル */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-[#E04F33] rounded-3xl max-w-sm w-full p-6 text-center shadow-xl">
            <h3 className="text-lg font-extrabold text-[#3B2A1E]">スタンプ記録をリセットしますか？</h3>
            <p className="text-xs sm:text-sm text-[#7A624B] mt-2 leading-relaxed">
              これまでに押したすべてのスタンプ履歴が消去されます。（入力したなまえは残ります）
            </p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="py-2.5 rounded-full bg-[#F3EFE6] hover:bg-[#E7E0D2] text-[#5C4532] font-bold text-sm transition cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleResetAll}
                className="py-2.5 rounded-full bg-[#E04F33] hover:bg-[#C94127] text-white font-bold text-sm shadow-sm transition cursor-pointer"
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
