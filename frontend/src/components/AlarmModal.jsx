import React, { useEffect, useRef } from 'react';
import { Bell, BellOff, AlertTriangle, ArrowUpRight } from 'lucide-react';

export const AlarmModal = ({ task, onDismiss }) => {
  const audioIntervalRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Web Audio API Synthesizer Chime
  const playAlarmSound = () => {
    try {
      // Initialize AudioContext if not already created
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Synth a beautiful cyber-chime double beep
      const now = ctx.currentTime;
      
      // Tone 1 (High bell)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);

      // Tone 2 (Higher bell, slightly offset)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now + 0.15); // E6
      gain2.gain.setValueAtTime(0, now + 0.15);
      gain2.gain.linearRampToValueAtTime(0.2, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.55);
    } catch (err) {
      console.warn('[Audio Synth Error] AudioContext blocked or not supported:', err);
    }
  };

  // Browser Notification Trigger
  const triggerBrowserNotification = () => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification(`🚨 Task Deadline Reached!`, {
        body: `Your task "${task.title}" has reached its deadline!`,
        icon: '/favicon.ico',
        tag: 'task-alarm-' + task._id,
        requireInteraction: true,
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(`🚨 Task Deadline Reached!`, {
            body: `Your task "${task.title}" has reached its deadline!`,
            requireInteraction: true,
          });
        }
      });
    }
  };

  useEffect(() => {
    if (task) {
      // 1. Play sound immediately, then loop every 1.5 seconds
      playAlarmSound();
      audioIntervalRef.current = setInterval(playAlarmSound, 1500);

      // 2. Dispatch high-visibility Browser Notification
      triggerBrowserNotification();
    }

    return () => {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
      // Suspend audio context on unmount to save CPU
      if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
        audioCtxRef.current.suspend();
      }
    };
  }, [task]);

  if (!task) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 1100,
        backgroundColor: 'rgba(7, 3, 3, 0.9)',
      }}
    >
      <div
        className="modal-content glass-panel"
        style={{
          maxWidth: '440px',
          textAlign: 'center',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.6), 0 0 50px rgba(239, 68, 68, 0.2)',
          padding: '40px 32px',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'var(--danger-glow)',
            border: '2px solid var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
            animation: 'ringAlarm 1.2s infinite ease-in-out',
          }}
        >
          <Bell size={36} color="var(--danger)" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', color: '#fca5a5', marginBottom: '8px' }}>
          <AlertTriangle size={16} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Deadline Expired!
          </span>
        </div>

        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
          {task.title}
        </h2>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            lineHeight: 1.6,
            marginBottom: '32px',
            maxHeight: '80px',
            overflowY: 'auto',
          }}
        >
          {task.description || 'This task scheduled deadline has arrived. Please complete, reschedule, or archive it.'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            className="btn"
            onClick={onDismiss}
            style={{
              background: 'var(--danger-gradient)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
              width: '100%',
              height: '46px',
            }}
          >
            <BellOff size={18} />
            <span>Acknowledge & Silence</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlarmModal;
