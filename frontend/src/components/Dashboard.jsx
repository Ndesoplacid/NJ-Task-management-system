import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TaskCard from './TaskCard';
import {
  Filter,
  ArrowUpDown,
  ListTodo,
  TrendingUp,
  AlertCircle,
  Inbox,
  CheckCircle2,
  CalendarDays,
  Loader
} from 'lucide-react';

export const Dashboard = ({ tasks, onEditTask, onDeleteTask, onStatusChange, onAlarmTrigger, fetchTasks }) => {
  const { user, openAuthModal } = useAuth();
  
  // Filtering & Sorting State
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('deadline_asc');
  const [loading, setLoading] = useState(false);

  // Trigger task refetch when filtering or sorting options change
  useEffect(() => {
    if (user) {
      const getFilteredTasks = async () => {
        setLoading(true);
        try {
          const params = {};
          if (statusFilter) params.status = statusFilter;
          if (priorityFilter) params.priority = priorityFilter;
          if (sortBy) params.sortBy = sortBy;

          await fetchTasks(params);
        } catch (err) {
          console.error('[Dashboard Filter Error]', err);
        } finally {
          setLoading(false);
        }
      };

      getFilteredTasks();
    }
  }, [statusFilter, priorityFilter, sortBy, user]);

  if (!user) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '60px 40px',
          textAlign: 'center',
          maxWidth: '650px',
          margin: '100px auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}
      >
        <div
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '20px',
            background: 'var(--primary-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}
        >
          <ListTodo size={32} color="var(--primary)" />
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '12px' }} className="gradient-text">
          Master Your Daily Schedule
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '32px' }}>
          Welcome to NJ Management System. An elegant, secure tool with automated email reminders, countdown alerts, and real-time ticking alarms to keep you on schedule.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => openAuthModal('signup')}>
            Get Started Free
          </button>
          <button className="btn btn-secondary" onClick={() => openAuthModal('login')}>
            Log In
          </button>
        </div>
      </div>
    );
  }

  // Calculate high-fidelity metrics
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const pendingCount = tasks.filter((t) => t.status === 'Pending').length;
  const urgentCount = tasks.filter((t) => {
    if (t.status === 'Completed') return false;
    const diff = new Date(t.deadline).getTime() - Date.now();
    return diff > 0 && diff <= 2 * 60 * 60 * 1000; // expiring within 2 hours
  }).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* Metric Cards Banner Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
      }}>
        {/* Total Tasks Metric */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'var(--primary-glow)',
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
          }}>
            <ListTodo size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Tracked Tasks</div>
          </div>
        </div>

        {/* Pending Metric */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--warning)',
            border: '1px solid rgba(245, 158, 11, 0.15)',
          }}>
            <CalendarDays size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{pendingCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pending & Active</div>
          </div>
        </div>

        {/* Completed Metric */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--success)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
          }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{completedCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Completed Tasks</div>
          </div>
        </div>

        {/* Urgent Warnings Metric */}
        <div className="glass-panel" style={{
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          border: urgentCount > 0 ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--card-border)'
        }}>
          <div style={{
            background: urgentCount > 0 ? 'var(--danger-glow)' : 'rgba(255,255,255,0.03)',
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: urgentCount > 0 ? 'var(--danger)' : 'var(--text-muted)',
            border: urgentCount > 0 ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(255,255,255,0.05)',
          }}>
            <AlertCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: urgentCount > 0 ? '#ff8787' : 'var(--text-primary)' }}>
              {urgentCount}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Approaching (&lt; 2h)</div>
          </div>
        </div>
      </div>

      {/* Action Controls & Filtering Header Panel */}
      <div className="glass-panel" style={{
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        {/* Left Side Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <Filter size={16} />
            <span>Filter:</span>
          </div>

          <select
            className="form-input"
            style={{
              padding: '6px 12px',
              fontSize: '0.85rem',
              backgroundColor: 'rgba(255,255,255,0.02)',
              appearance: 'none',
              cursor: 'pointer',
            }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option style={{ backgroundColor: '#111827' }} value="">All Statuses</option>
            <option style={{ backgroundColor: '#111827' }} value="Pending">Pending</option>
            <option style={{ backgroundColor: '#111827' }} value="In Progress">In Progress</option>
            <option style={{ backgroundColor: '#111827' }} value="Completed">Completed</option>
          </select>

          <select
            className="form-input"
            style={{
              padding: '6px 12px',
              fontSize: '0.85rem',
              backgroundColor: 'rgba(255,255,255,0.02)',
              appearance: 'none',
              cursor: 'pointer',
            }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option style={{ backgroundColor: '#111827' }} value="">All Priorities</option>
            <option style={{ backgroundColor: '#111827' }} value="Low">Low</option>
            <option style={{ backgroundColor: '#111827' }} value="Medium">Medium</option>
            <option style={{ backgroundColor: '#111827' }} value="High">High</option>
          </select>
        </div>

        {/* Right Side Sorting Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <ArrowUpDown size={16} />
            <span>Sort by:</span>
          </div>

          <select
            className="form-input"
            style={{
              padding: '6px 12px',
              fontSize: '0.85rem',
              backgroundColor: 'rgba(255,255,255,0.02)',
              appearance: 'none',
              cursor: 'pointer',
            }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option style={{ backgroundColor: '#111827' }} value="deadline_asc">Deadline (Soonest First)</option>
            <option style={{ backgroundColor: '#111827' }} value="deadline_desc">Deadline (Furthest First)</option>
            <option style={{ backgroundColor: '#111827' }} value="created_desc">Creation Date (Newest First)</option>
          </select>
        </div>
      </div>

      {/* Task Cards Presentation Grid */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '100px 0' }}>
          <Loader className="gradient-text" style={{ animation: 'spin 2s linear infinite' }} size={36} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading dashboard schedule...</p>
        </div>
      ) : tasks.length === 0 ? (
        /* Empty State */
        <div
          className="glass-panel"
          style={{
            padding: '80px 40px',
            textAlign: 'center',
            borderStyle: 'dashed',
            borderWidth: '1.5px',
            background: 'rgba(255,255,255,0.01)',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: 'var(--text-muted)',
            }}
          >
            <Inbox size={28} />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
            No Tasks Found
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto 24px auto' }}>
            There are no tasks matching your selected filters. Create a new task or adjust filters to begin scheduling.
          </p>
        </div>
      ) : (
        /* Grid Presentation */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px',
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onStatusChange={onStatusChange}
              onAlarmTrigger={onAlarmTrigger}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
