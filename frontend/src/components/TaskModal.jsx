import React, { useState, useEffect } from 'react';
import { X, Calendar, Type, AlignLeft, BarChart, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';

export const TaskModal = ({ isOpen, onClose, task, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('Pending');
  const [priority, setPriority] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (task) {
        // Edit Mode: Populate existing fields
        setTitle(task.title || '');
        setDescription(task.description || '');
        setStatus(task.status || 'Pending');
        setPriority(task.priority || 'Medium');
        
        // Format ISO Date to datetime-local compatible format (YYYY-MM-DDTHH:MM)
        if (task.deadline) {
          const date = new Date(task.deadline);
          // adjust for timezone offset
          const localISO = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setDeadline(localISO);
        } else {
          setDeadline('');
        }
      } else {
        // Create Mode: Reset fields
        setTitle('');
        setDescription('');
        
        // Set default deadline to 2 hours + 5 minutes from now for quick evaluation!
        const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000 + 5 * 60 * 1000);
        const localISO = new Date(futureDate.getTime() - futureDate.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setDeadline(localISO);
        setStatus('Pending');
        setPriority('Medium');
      }
      setError('');
      setLoading(false);
    }
  }, [isOpen, task]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a task title.');
      return;
    }
    if (!deadline) {
      setError('Please select a deadline date and time.');
      return;
    }

    const selectedDeadline = new Date(deadline);
    if (isNaN(selectedDeadline.getTime())) {
      setError('Please select a valid date and time.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title,
        description,
        deadline: selectedDeadline.toISOString(),
        status,
        priority,
      };

      let response;
      if (task) {
        // Update task API request
        response = await axios.put(`/tasks/${task._id}`, payload);
      } else {
        // Create task API request
        response = await axios.post('/tasks', payload);
      }

      if (response.data.success) {
        onSave();
        onClose();
      }
    } catch (err) {
      console.error('[Task Save Error]', err);
      setError(err.response?.data?.message || 'Failed to save task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSet = (minutes) => {
    const futureDate = new Date(Date.now() + minutes * 60000);
    const localISO = new Date(futureDate.getTime() - futureDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setDeadline(localISO);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '550px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 40px rgba(99, 102, 241, 0.1)',
        }}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }} className="gradient-text">
            {task ? 'Edit Task Settings' : 'Create New Task'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {task ? 'Amend current task progress and details' : 'Add details to create and schedule reminders'}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#fca5a5',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Task Title</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Type size={16} />
              </span>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', paddingLeft: '40px' }}
                placeholder="e.g. Design Landing Page mockups"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Task Description</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }}>
                <AlignLeft size={16} />
              </span>
              <textarea
                className="form-input"
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                  minHeight: '80px',
                  resize: 'vertical',
                  fontFamily: 'var(--font-body)'
                }}
                placeholder="Describe key instructions or checklists..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Deadline (Date & Time)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Calendar size={16} />
              </span>
              <input
                type="datetime-local"
                className="form-input"
                style={{ width: '100%', paddingLeft: '40px' }}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Quick Set Deadlines Actions */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '8px',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginRight: '4px' }}>
                Quick Set:
              </span>
              {[
                { label: '+1 Min', value: 1 },
                { label: '+2 Min', value: 2 },
                { label: '+5 Min', value: 5 },
                { label: '+2 Hours', value: 120 },
                { label: '+24 Hours', value: 1440 }
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => handleQuickSet(btn.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'var(--primary-glow)';
                    e.target.style.borderColor = 'var(--primary)';
                    e.target.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.color = 'var(--text-secondary)';
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Clock size={16} />
                </span>
                <select
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '40px', appearance: 'none', background: 'rgba(255,255,255,0.03)' }}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={loading}
                >
                  <option style={{ backgroundColor: '#111827' }} value="Pending">Pending</option>
                  <option style={{ backgroundColor: '#111827' }} value="In Progress">In Progress</option>
                  <option style={{ backgroundColor: '#111827' }} value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <BarChart size={16} />
                </span>
                <select
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '40px', appearance: 'none', background: 'rgba(255,255,255,0.03)' }}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  disabled={loading}
                >
                  <option style={{ backgroundColor: '#111827' }} value="Low">Low</option>
                  <option style={{ backgroundColor: '#111827' }} value="Medium">Medium</option>
                  <option style={{ backgroundColor: '#111827' }} value="High">High</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '120px' }}>
              {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
