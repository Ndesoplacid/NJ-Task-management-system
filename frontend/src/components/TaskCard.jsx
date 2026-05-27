import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Trash2, Edit3, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export const TaskCard = ({ task, onEdit, onDelete, onStatusChange, onAlarmTrigger }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isOverdue, setIsOverdue] = useState(false);
  
  // Track whether we have fired the alarm for this task to avoid duplicate prompts
  const alarmFiredRef = useRef(false);

  useEffect(() => {
    // If completed, no ticking is required
    if (task.status === 'Completed') {
      setTimeLeft('Completed');
      setIsUrgent(false);
      setIsOverdue(false);
      return;
    }

    const calculateTime = () => {
      const deadlineTime = new Date(task.deadline).getTime();
      const now = Date.now();
      const difference = deadlineTime - now;

      if (difference <= 0) {
        setTimeLeft('Time\'s Up!');
        setIsOverdue(true);
        setIsUrgent(false);

        // Trigger alarm if not completed, and hasn't fired yet
        if (!alarmFiredRef.current && task.status !== 'Completed') {
          alarmFiredRef.current = true;
          onAlarmTrigger(task);
        }
        return;
      }

      // Convert difference to days, hours, minutes, seconds
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      // Determine urgency (e.g. less than 15 minutes left)
      const totalMinutesLeft = difference / (1000 * 60);
      const urgent = totalMinutesLeft <= 15;
      setIsUrgent(urgent);
      setIsOverdue(false);

      // Format countdown string
      let timeString = '';
      if (days > 0) {
        timeString += `${days}d `;
      }
      const pad = (num) => String(num).padStart(2, '0');
      timeString += `${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;
      
      setTimeLeft(timeString);
    };

    // Calculate immediately and then set interval
    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [task.deadline, task.status, onAlarmTrigger, task]);

  // Styling helper for Priority badge
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'High':
        return {
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#ff8787',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        };
      case 'Medium':
        return {
          background: 'rgba(245, 158, 11, 0.1)',
          color: '#ffd066',
          border: '1px solid rgba(245, 158, 11, 0.2)',
        };
      case 'Low':
        return {
          background: 'rgba(20, 184, 166, 0.1)',
          color: '#8be8db',
          border: '1px solid rgba(20, 184, 166, 0.2)',
        };
      default:
        return {};
    }
  };

  // Styling helper for Status badge
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Completed':
        return { background: 'rgba(16, 185, 129, 0.15)', color: '#a7f3d0' };
      case 'In Progress':
        return { background: 'rgba(99, 102, 241, 0.15)', color: '#c7d2fe' };
      case 'Pending':
      default:
        return { background: 'rgba(107, 114, 128, 0.15)', color: '#e5e7eb' };
    }
  };

  const formattedDeadline = new Date(task.deadline).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`glass-panel`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '240px',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        animation: isUrgent ? 'pulseGlow 2s infinite' : 'none',
        borderWidth: isUrgent ? '1.5px' : '1px',
      }}
    >
      {/* Cards Top Header */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: '6px',
              ...getPriorityStyle(task.priority),
            }}
          >
            {task.priority} Priority
          </span>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn-icon" onClick={() => onEdit(task)} title="Edit Task">
              <Edit3 size={14} />
            </button>
            <button className="btn-icon btn-icon-danger" onClick={() => onDelete(task._id)} title="Delete Task">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 600,
            color: task.status === 'Completed' ? 'var(--text-secondary)' : 'var(--text-primary)',
            textDecoration: task.status === 'Completed' ? 'line-through' : 'none',
            marginBottom: '6px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={task.title}
        >
          {task.title}
        </h3>

        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            height: '40px',
            marginBottom: '12px',
          }}
        >
          {task.description || 'No description provided.'}
        </p>
      </div>

      {/* Cards Footer */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            color: isOverdue && task.status !== 'Completed' ? '#ff8787' : 'var(--text-muted)',
            marginBottom: '12px',
          }}
        >
          <Calendar size={13} />
          <span>Deadline: {formattedDeadline}</span>
          {isOverdue && task.status !== 'Completed' && (
            <AlertTriangle size={13} color="#ff8787" title="Overdue!" />
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            paddingTop: '12px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Countdown
            </span>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: task.status === 'Completed'
                  ? 'var(--success)'
                  : isUrgent
                  ? '#ff8787'
                  : isOverdue
                  ? 'var(--text-muted)'
                  : '#8be8db',
              }}
            >
              {timeLeft}
            </span>
          </div>

          <button
            onClick={() => onStatusChange(task._id, task.status === 'Completed' ? 'Pending' : 'Completed')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              transition: 'all var(--transition-fast)',
              ...getStatusStyle(task.status),
            }}
          >
            <CheckCircle size={14} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              {task.status === 'Completed' ? 'Completed' : 'Mark Done'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
