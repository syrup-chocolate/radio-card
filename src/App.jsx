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
  { id: 'beans', emoji: '🫘' },
  { id: 'fist', emoji: '👊' },
  { id: 'gymnast', emoji: '🤸' },
  { id: 'candy', emoji: '🍭' },
];

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const STORAGE_KEYS = {
  STAMPS: 'radio_taiso_stamps_v8',
  SELECTED_STAMP: 'radio_taiso_selected_stamp_v8',
  USER_NAME: 'radio_taiso_user_name_v8',
  SOUND_ENABLED: 'radio_taiso_sound_enabled_v8',
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
    const startBound = new Date(2026, 10, 1);
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
    <div style={{ minHeight: '100vh', backgroundColor: '#FDF8E7', color: '#3B2A1E', fontFamily: 'sans-serif', paddingBottom: '3rem' }}>
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

      {/* ヘッダー */}
      <header style={{ width: '100%', backgroundColor: '#E04F33', color: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: '32rem', margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px', lineHeight: 1 }}>🫘</span>
            <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, letterSpacing: '0.05em' }}>
              ラジオ体操カード
            </h1>
          </div>
          <button
            onClick={toggleSound}
            style={{ padding: '8px', borderRadius: '9999px', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer' }}
          >
            {soundEnabled ? <Volume2 style={{ width: '20px', height: '20px', color: '#fff' }} /> : <VolumeX style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.75)' }} />}
          </button>
        </div>
      </header>

      {toastMessage && (
        <div style={{ position: 'fixed', top: '64px', left: '50%', transform: 'translateX(-50%)', zIndex: 50, backgroundColor: '#3B2A1E', color: '#FDF8E7', fontSize: '13px', fontWeight: 700, padding: '10px 18px', borderRadius: '9999px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          {toastMessage}
        </div>
      )}

      <main style={{ maxWidth: '32rem', margin: '0 auto', padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 実績カード */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid #EFE3C8', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '9999px', backgroundColor: '#FFF2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Flame style={{ width: '24px', height: '24px', color: '#E86F2C' }} />
            </div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8C735B', margin: 0 }}>連続達成</p>
              <p style={{ fontSize: '24px', fontWeight: 900, color: '#E04F33', margin: '2px 0 0 0' }}>
                {streak} <span style={{ fontSize: '14px', fontWeight: 700, color: '#5C4532' }}>日</span>
              </p>
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid #EFE3C8', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '9999px', backgroundColor: '#FDECEC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Trophy style={{ width: '24px', height: '24px', color: '#E04F33' }} />
            </div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#8C735B', margin: 0 }}>通算スタンプ</p>
              <p style={{ fontSize: '24px', fontWeight: 900, color: '#E04F33', margin: '2px 0 0 0' }}>
                {totalCount} <span style={{ fontSize: '14px', fontWeight: 700, color: '#5C4532' }}>個</span>
              </p>
            </div>
          </div>
        </section>

        {/* チェックインカード */}
        <section style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '20px', border: '2px solid #E04F33', boxShadow: '0 6px 20px rgba(224,79,51,0.12)', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#7A624B', margin: 0 }}>
            本日: {today.getFullYear()}年{today.getMonth() + 1}月{today.getDate()}日
          </p>

          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#3B2A1E', margin: '8px 0 16px 0' }}>
            体操が終わったらハンコを押そう！
          </h2>

          <div>
            {isCheckedInToday ? (
              <div style={{ width: '100%', padding: '16px', borderRadius: '9999px', backgroundColor: '#F3EFE6', border: '2px solid #D8CCB8', color: '#6E5844', fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxSizing: 'border-box' }}>
                <CheckCircle2 style={{ width: '24px', height: '24px', color: '#2E9E5B' }} />
                <span>本日のスタンプ押印済み！</span>
              </div>
            ) : (
              <button
                onClick={handleTodayCheckIn}
                disabled={isStamping}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '9999px',
                  background: 'linear-gradient(to bottom, #EE5D3F, #D94326)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '18px',
                  boxShadow: '0 6px 0 #A82E17, 0 10px 20px rgba(224,79,51,0.35)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'transform 0.1s'
                }}
              >
                <span style={{ fontSize: '24px' }}>👊</span>
                <span>スタンプを押す！</span>
              </button>
            )}
          </div>

          {/* 印鑑デザイン部分（文字を削除し、絵文字ボタンのみ中央配置） */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F2E8D5', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
            {STAMP_TYPES.map((stamp) => {
              const isSelected = selectedStamp === stamp.id;
              return (
                <button
                  key={stamp.id}
                  type="button"
                  onClick={() => handleSelectStamp(stamp.id)}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: isSelected ? '2px solid #E04F33' : '1px solid #E5D7BE',
                    backgroundColor: isSelected ? '#FFF5F2' : '#FAF6ED',
                    boxShadow: isSelected ? '0 4px 12px rgba(224,79,51,0.3)' : 'none',
                    transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                  }}
                >
                  <span style={{ fontSize: '26px' }}>{stamp.emoji}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 出席カードエリア */}
        <section 
          ref={matrixRef}
          style={{
            backgroundColor: '#FFFDF7',
            borderRadius: '24px',
            padding: '20px',
            border: isMatrixHighlighted ? '2px solid #E04F33' : '2px solid #DFC9A6',
            boxShadow: isMatrixHighlighted ? '0 0 30px rgba(224,79,51,0.35)' : '0 4px 12px rgba(0,0,0,0.05)',
            transition: 'all 0.7s'
          }}
        >
          <div style={{ textAlign: 'center', paddingBottom: '12px', borderBottom: '2px dashed #E3CFAF' }}>
            <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.15em', color: '#9E7B56', margin: 0, textTransform: 'uppercase' }}>
              Radio Exercise
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
              <button onClick={handlePrevMonth} style={{ padding: '8px', borderRadius: '9999px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6E4F32' }}>
                <ChevronLeft style={{ width: '24px', height: '24px' }} />
              </button>

              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#6E4222', margin: 0 }}>
                {viewYear}年{viewMonth + 1}月 出席カード
              </h2>

              <button onClick={handleNextMonth} style={{ padding: '8px', borderRadius: '9999px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6E4F32' }}>
                <ChevronRight style={{ width: '24px', height: '24px' }} />
              </button>
            </div>

            <div style={{ marginTop: '12px', backgroundColor: '#FAF2E1', border: '1px solid #E2CCA8', borderRadius: '12px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '320px', margin: '12px auto 0' }}>
              <label htmlFor="user-name-input" style={{ fontSize: '13px', fontWeight: 800, color: '#6E4222', whiteSpace: 'nowrap' }}>
                なまえ：
              </label>
              <input
                id="user-name-input"
                type="text"
                value={userName}
                onChange={handleNameChange}
                placeholder="ここになまえをかいてね"
                maxLength={24}
                style={{ width: '100%', backgroundColor: 'transparent', fontSize: '14px', fontWeight: 700, color: '#3B2A1E', border: 'none', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '6px', marginTop: '16px', marginBottom: '6px', textAlign: 'center' }}>
            {WEEKDAYS.map((dayName, idx) => (
              <div
                key={dayName}
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  padding: '4px 0',
                  borderRadius: '6px',
                  color: idx === 0 ? '#D94326' : idx === 6 ? '#2B6CB0' : '#6E5338',
                  backgroundColor: idx === 0 ? '#FDECE8' : idx === 6 ? '#EBF4FF' : '#F5EAD6'
                }}
              >
                {dayName}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '6px' }}>
            {calendarCells.map((cellDate, index) => {
              if (!cellDate) {
                return <div key={`empty-${index}`} style={{ aspectRatio: '1', borderRadius: '12px', backgroundColor: 'rgba(247,239,224,0.45)' }} />;
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
                  style={{
                    aspectRatio: '1',
                    borderRadius: '12px',
                    border: isTodayCell ? '2px solid #E04F33' : isFuture ? '1px solid rgba(230,212,181,0.6)' : '1px solid #DFC9A6',
                    backgroundColor: isTodayCell ? '#FFF4F0' : isFuture ? 'rgba(250,244,232,0.5)' : 'white',
                    cursor: isFuture ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px',
                    position: 'relative'
                  }}
                >
                  <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: isTodayCell ? '#E04F33' : dayOfWeek === 0 ? '#D94326' : dayOfWeek === 6 ? '#2B6CB0' : '#6E5338' }}>
                      {cellDate.getDate()}
                    </span>
                    {isTodayCell && (
                      <span style={{ fontSize: '8px', fontWeight: 900, color: '#fff', backgroundColor: '#E04F33', padding: '0 2px', borderRadius: '2px' }}>今日</span>
                    )}
                  </div>

                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                    {stampedId ? (
                      <div className="animate-stamp-slam" style={{ width: '32px', height: '32px', borderRadius: '9999px', border: '2px solid #E04F33', backgroundColor: 'rgba(255,245,243,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '16px', lineHeight: 1 }}>{getStampEmoji(stampedId)}</span>
                      </div>
                    ) : isFuture ? (
                      <Lock style={{ width: '14px', height: '14px', color: '#BCA586' }} />
                    ) : (
                      <div style={{ width: '28px', height: '28px', borderRadius: '9999px', border: '1px dashed rgba(223,201,166,0.8)' }} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <p style={{ marginTop: '16px', fontSize: '11px', color: '#8C735B', textAlign: 'center', lineHeight: '1.5' }}>
            ※ 2026年11月1日〜前日までのマス目は、タップすると任意でスタンプの押印・取り消しができます（未来日はロック）。
          </p>
        </section>

        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4px' }}>
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            style={{ fontSize: '12px', color: '#9E876E', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', cursor: 'pointer' }}
          >
            <RotateCcw style={{ width: '14px', height: '14px' }} />
            <span>スタンプ記録をリセットする</span>
          </button>
        </div>
      </main>

      {/* モーダル群 */}
      {celebrationModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 50 }}>
          <div className="animate-stamp-slam" style={{ backgroundColor: '#FFFDF7', border: '4px solid #E04F33', borderRadius: '24px', maxWidth: '360px', width: '100%', padding: '24px', textAlign: 'center', position: 'relative' }}>
            <button onClick={() => setCelebrationModal(null)} style={{ position: 'absolute', top: '12px', right: '12px', padding: '6px', borderRadius: '9999px', background: 'none', border: 'none', cursor: 'pointer', color: '#8C735B' }}>
              <X style={{ width: '20px', height: '20px' }} />
            </button>
            <div style={{ width: '64px', height: '64px', borderRadius: '9999px', backgroundColor: '#FFF2E2', border: '2px solid #E04F33', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Award style={{ width: '36px', height: '36px', color: '#E04F33' }} />
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '9999px', backgroundColor: '#E04F33', color: '#fff', fontSize: '12px', fontWeight: 900, marginBottom: '8px' }}>
              <Sparkles style={{ width: '14px', height: '14px' }} />
              {celebrationModal.badge}
            </span>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#3B2A1E', margin: '4px 0 10px 0' }}>{celebrationModal.title}</h3>
            <p style={{ fontSize: '14px', color: '#5C4532', margin: 0, lineHeight: '1.6', backgroundColor: '#FAF2E1', padding: '14px', borderRadius: '16px', border: '1px solid #E6D4B5' }}>
              {celebrationModal.message}
            </p>
            <button onClick={() => setCelebrationModal(null)} style={{ marginTop: '20px', width: '100%', padding: '12px', borderRadius: '9999px', backgroundColor: '#E04F33', color: '#fff', fontWeight: 800, fontSize: '14px', border: 'none', cursor: 'pointer' }}>
              やったね！とじる
            </button>
          </div>
        </div>
      )}

      {showResetModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 50 }}>
          <div style={{ backgroundColor: '#fff', border: '2px solid #E04F33', borderRadius: '24px', maxWidth: '360px', width: '100%', padding: '24px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#3B2A1E', margin: '0 0 8px 0' }}>スタンプ記録をリセットしますか？</h3>
            <p style={{ fontSize: '13px', color: '#7A624B', margin: 0, lineHeight: '1.5' }}>
              これまでに押したすべてのスタンプ履歴が消去されます。（入力したなまえは残ります）
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px', marginTop: '20px' }}>
              <button type="button" onClick={() => setShowResetModal(false)} style={{ padding: '10px', borderRadius: '9999px', backgroundColor: '#F3EFE6', color: '#5C4532', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer' }}>
                キャンセル
              </button>
              <button type="button" onClick={handleResetAll} style={{ padding: '10px', borderRadius: '9999px', backgroundColor: '#E04F33', color: '#fff', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer' }}>
                リセットする
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
