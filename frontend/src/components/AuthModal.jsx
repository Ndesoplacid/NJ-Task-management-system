import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export const AuthModal = () => {
  const {
    authModalOpen,
    authModalMode,
    setAuthModalMode,
    openAuthModal,
    closeAuthModal,
    authError,
    loginUser,
    registerUser,
    forgotPassword,
    resetPassword,
  } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resetToken, setResetToken] = useState('');

  // Detect if page URL matches the reset password route /reset-password/:token
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    if (pathParts[1] === 'reset-password' && pathParts[2]) {
      setResetToken(pathParts[2]);
      openAuthModal('reset');
      // Clean URL pathname back to root so clicking refresh or modal close behaves normally
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  // Clear inputs when modal state changes
  useEffect(() => {
    if (authModalOpen) {
      setUsername('');
      setEmail('');
      setPassword('');
      setValidationError('');
      setSuccessMessage('');
      setLoading(false);
    }
  }, [authModalOpen, authModalMode]);

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setSuccessMessage('');
    setLoading(true);

    // 1. Forgot Password Mode
    if (authModalMode === 'forgot') {
      if (!email) {
        setValidationError('Please enter your registered email address.');
        setLoading(false);
        return;
      }
      const result = await forgotPassword(email);
      if (result.success) {
        setSuccessMessage(result.message || 'Password recovery link has been sent to your email.');
      }
      setLoading(false);
      return;
    }

    // 2. Reset Password Mode
    if (authModalMode === 'reset') {
      if (!password || password.length < 6) {
        setValidationError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }
      const result = await resetPassword(resetToken, password);
      if (result.success) {
        // Successful reset logs user in automatically via Context
        alert('Password successfully reset! You have been logged in.');
      }
      setLoading(false);
      return;
    }

    // 3. Login and Signup Modes
    if (!email || !password) {
      setValidationError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    if (authModalMode === 'signup' && !username) {
      setValidationError('Username is required for signup.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    let result;
    if (authModalMode === 'signup') {
      result = await registerUser(username, email, password);
    } else {
      result = await loginUser(email, password);
    }

    setLoading(false);
  };

  // Dynamic Header Titles
  const getHeaderTitle = () => {
    switch (authModalMode) {
      case 'signup':
        return 'Create Account';
      case 'forgot':
        return 'Recover Password';
      case 'reset':
        return 'Reset Password';
      case 'login':
      default:
        return 'Welcome Back';
    }
  };

  const getHeaderSub = () => {
    switch (authModalMode) {
      case 'signup':
        return 'Join us and master your deadlines today';
      case 'forgot':
        return 'Enter your email to receive a secure recovery link';
      case 'reset':
        return 'Please choose a strong new password for security';
      case 'login':
      default:
        return 'Enter your credentials to access your dashboard';
    }
  };

  return (
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div
        className="modal-content glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 40px rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <button className="modal-close" onClick={closeAuthModal}>
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }} className="gradient-text">
            {getHeaderTitle()}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {getHeaderSub()}
          </p>
        </div>

        {(validationError || authError) && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#fca5a5',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{validationError || authError}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#a7f3d0',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Username (Only for Signup) */}
          {authModalMode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <User size={18} />
                </span>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '44px' }}
                  placeholder="e.g. John Doe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Email Input (All except Reset Password) */}
          {authModalMode !== 'reset' && (
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '44px' }}
                  placeholder="e.g. email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Password Input (All except Forgot Password) */}
          {authModalMode !== 'forgot' && (
            <div className="form-group" style={{ marginBottom: '4px' }}>
              <label className="form-label">
                {authModalMode === 'reset' ? 'New Password' : 'Password'}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '44px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Forgot Password Clicker (Only in Login mode) */}
          {authModalMode === 'login' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px', marginBottom: '8px' }}>
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'color 0.2s',
                }}
                onClick={() => setAuthModalMode('forgot')}
                onMouseEnter={(e) => e.target.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '46px', marginTop: '8px' }} disabled={loading}>
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>
                  {authModalMode === 'login' && 'Sign In'}
                  {authModalMode === 'signup' && 'Sign Up'}
                  {authModalMode === 'forgot' && 'Send Recovery Email'}
                  {authModalMode === 'reset' && 'Reset Password'}
                </span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle Actions */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)'
        }}>
          {authModalMode === 'login' && (
            <>
              Don't have an account?{' '}
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  color: 'var(--primary)'
                }}
                onClick={() => setAuthModalMode('signup')}
              >
                Sign Up
              </button>
            </>
          )}

          {authModalMode === 'signup' && (
            <>
              Already have an account?{' '}
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  color: 'var(--primary)'
                }}
                onClick={() => setAuthModalMode('login')}
              >
                Sign In
              </button>
            </>
          )}

          {(authModalMode === 'forgot' || authModalMode === 'reset') && (
            <button
              style={{
                background: 'none',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
                color: 'var(--primary)'
              }}
              onClick={() => setAuthModalMode('login')}
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
