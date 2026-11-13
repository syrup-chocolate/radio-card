import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Flame,
  Trophy,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

const STAMP_TYPES = [
  { id: 'beans', name: '小豆', emoji: '🫘' },
  { id: 'punch', name: 'グー', emoji: '👊' },
  { id: 'gymnastics', name: '体操', emoji: '🤸' },
  { id: 'candy', name: 'ペロペロキャンディ', emoji: '🍭' },
];

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const STORAGE_KEYS = {
  LOGS: 'radio_card_logs_v3',
  SELECTED_STAMP: 'radio_card_selected_stamp_v3',
  USER_NAME: 'radio_card_user_name_v3',
  SOUND_ENABLED: 'radio_card_sound_enabled_v3',
};

export default function App() {
  const [realToday] = useState(() => new Date(2026, 10, 13)); // 2026年11月13日

  const [logs, setLogs] = useState({});
  const [selectedStamp, setSelectedStamp] = useState('beans');
  const [userName, setUserName] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(10); // 11月

  const [isStamping, setIsStamping] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isMatrixHighlighted, setIsMatrixHighlighted] = useState(false);

  const matrixRef = useRef(null);

  const realTodayYear = realToday.getFullYear();
  const realTodayMonth = realToday.getMonth() + 1;
  const realTodayDay = realToday.getDate();

  const todayKey = `${realTodayYear}-${realTodayMonth}-${realTodayDay}`;

  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (savedLogs) setLogs(JSON.parse(savedLogs));

      const savedStamp = localStorage.getItem(STORAGE_KEYS.SELECTED_STAMP);
      if (savedStamp && STAMP_TYPES.some((s) => s.id === savedStamp)) {
        setSelectedStamp(savedStamp);
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
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    } catch (err) {
      console.error(err);
    }
  }, [logs]);

  const handleSelectStamp = (id) => {
    setSelectedStamp(id);
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_STAMP, id);
    } catch (err) {
      console.error(err);
    }

    if (logs[todayKey]) {
      setLogs((prev) => ({ ...prev, [todayKey]: id }));
      playStampSound();
      triggerToast('本日のスタンプを変更しました');
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

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
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
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (err) {
      console.error(err);
    }
  };

  // 連続達成日数の正しい計算ロジック
  const calculateStreak = () => {
    let streak = 0;
    let cursor = new Date(realTodayYear, realTodayMonth - 1, realTodayDay);

    const cursorKey = `${cursor.getFullYear()}-${cursor.getMonth() + 1}-${cursor.getDate()}`;
    if (!logs[cursorKey]) {
      cursor.setDate(cursor.getDate() - 1);
    }

    while (true) {
      const y = cursor.getFullYear();
      const m = cursor.getMonth() + 1;
      const d = cursor.getDate();
      const key = `${y}-${m}-${d}`;

      if (logs[key]) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const totalStamps = Object.keys(logs).length;
  const streakCount = calculateStreak();
  const isTodayDone = !!logs[todayKey];

  const scrollToMatrix = () => {
    setIsMatrixHighlighted(true);
    setTimeout(() => setIsMatrixHighlighted(false), 1000);
    setTimeout(() => {
      if (matrixRef.current) {
        matrixRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  const handleTodayStamp = () => {
    if (isStamping) return;
    setIsStamping(true);

    setViewYear(realTodayYear);
    setViewMonth(realTodayMonth - 1);

    setTimeout(() => {
      setLogs((prev) => {
        const updated = { ...prev };
        if (updated[todayKey]) {
          delete updated[todayKey];
          playRemoveSound();
          triggerToast('本日のスタンプを取り消しました');
        } else {
          updated[todayKey] = selectedStamp;
          playStampSound();
          triggerToast('スタンプを押しました！');
        }
        return updated;
      });
      setIsStamping(false);
      scrollToMatrix();
    }, 200);
  };

  const handleDateCellClick = (cellDate) => {
    const cellYear = cellDate.getFullYear();
    const cellMonth = cellDate.getMonth() + 1;
    const cellDay = cellDate.getDate();
    const key = `${cellYear}-${cellMonth}-${cellDay}`;

    if (cellDate > realToday) {
      triggerToast('未来の日付にはスタンプを押せません');
      return;
    }

    setLogs((prev) => {
      const updated = { ...prev };
      if (updated[key]) {
        if (updated[key] === selectedStamp) {
          delete updated[key];
          playRemoveSound();
          triggerToast('スタンプを削除しました');
        } else {
          updated[key] = selectedStamp;
          playStampSound();
          triggerToast('別のスタンプに変更しました');
        }
      } else {
        updated[key] = selectedStamp;
        playStampSound();
        triggerToast('スタンプを押しました！');
      }
      return updated;
    });
    scrollToMatrix();
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
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFDF9', color: '#4A3B32', fontFamily: 'sans-serif', paddingBottom: '3rem' }}>
      <style>{`
        @keyframes stampPop {
          0% { transform: scale(2); opacity: 0; }
          70% { transform: scale(0.9); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-stamp {
          animation: stampPop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>

      {/* ヘッダー */}
      <header style={{ width: '100%', backgroundColor: '#D94336', color: '#FFF', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <div style={{ maxWidth: '32rem', margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>🫘</span>
            <h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0, letterSpacing: '0.05em' }}>
              ラジオ体操カード
            </h1>
          </div>
          <button
            onClick={toggleSound}
            style={{ padding: '8px', borderRadius: '9999px', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {soundEnabled ? <Volume2 style={{ width: '20px', height: '20px' }} /> : <VolumeX style={{ width: '20px', height: '20px' }} />}
          </button>
        </div>
      </header>

      {toastMessage && (
        <div style={{ position: 'fixed', top: '72px', left: '50%', transform: 'translateX(-50%)', zIndex: 50, backgroundColor: '#333', color: '#FFF', fontSize: '13px', fontWeight: 700, padding: '10px 20px', borderRadius: '9999px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          {toastMessage}
        </div>
      )}

      <main style={{ maxWidth: '32rem', margin: '0 auto', padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* 実績カード */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', padding: '16px', border: '1px solid #F3E5D8', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#FFF4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Flame style={{ width: '22px', height: '22px', color: '#E67E22' }} />
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#8C7B70', margin: 0, fontWeight: 700 }}>連続達成</p>
              <p style={{ fontSize: '20px', fontWeight: 900, color: '#2C221E', margin: '2px 0 0 0' }}>
                {streakCount} <span style={{ fontSize: '12px', color: '#8C7B70', fontWeight: 700 }}>日</span>
              </p>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', padding: '16px', border: '1px solid #F3E5D8', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#FFF4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Trophy style={{ width: '22px', height: '22px', color: '#E67E22' }} />
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#8C7B70', margin: 0, fontWeight: 700 }}>通算スタンプ</p>
              <p style={{ fontSize: '20px', fontWeight: 900, color: '#2C221E', margin: '2px 0 0 0' }}>
                {totalStamps} <span style={{ fontSize: '12px', color: '#8C7B70', fontWeight: 700 }}>個</span>
              </p>
            </div>
          </div>
        </section>

        {/* メインアクションカード */}
        <section style={{ backgroundColor: '#FFF', borderRadius: '20px', padding: '20px', border: '1px solid #F3E5D8', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: '12px', color: '#8C7B70', margin: 0, fontWeight: 700 }}>
            本日: {realTodayYear}年{realTodayMonth}月{realTodayDay}日
          </p>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#2C221E', margin: '6px 0 16px 0' }}>
            体操が終わったらハンコを押そう！
          </h2>

          <button
            onClick={handleTodayStamp}
            disabled={isStamping}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '9999px',
              backgroundColor: isTodayDone ? '#27AE60' : '#D94336',
              color: '#FFF',
              fontWeight: 900,
              fontSize: '16px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: isTodayDone ? '0 4px 14px rgba(39,174,96,0.3)' : '0 4px 14px rgba(217,67,54,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'transform 0.1s'
            }}
          >
            <span>{isTodayDone ? '✅' : '👊'}</span>
            <span>{isTodayDone ? '本日のスタンプは押印済み（タップで取消）' : 'スタンプを押す！'}</span>
          </button>

          <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px dashed #F3E5D8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              {STAMP_TYPES.map((stamp) => {
                const isSelected = selectedStamp === stamp.id;
                return (
                  <button
                    key={stamp.id}
                    type="button"
                    onClick={() => handleSelectStamp(stamp.id)}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      fontSize: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #D94336' : '1px solid #E5D5C5',
                      backgroundColor: isSelected ? '#FFF5F4' : '#FAFAFA',
                      boxShadow: isSelected ? '0 2px 8px rgba(217,67,54,0.2)' : 'none',
                      transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.2s'
                    }}
                    title={stamp.name}
                  >
                    {stamp.emoji}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 出席カード（カレンダーエリア） */}
        <section 
          ref={matrixRef}
          style={{
            backgroundColor: '#FFF',
            borderRadius: '20px',
            padding: '20px',
            border: isMatrixHighlighted ? '2px solid #D94336' : '1px solid #F3E5D8',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
            transition: 'all 0.5s'
          }}
        >
          <p style={{ fontSize: '10px', textAlign: 'center', color: '#A08F84', fontWeight: 700, letterSpacing: '0.1em', margin: 0, textTransform: 'uppercase' }}>
            RADIO EXERCISE
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', marginBottom: '14px' }}>
            <button onClick={() => setViewMonth((m) => (m === 0 ?
