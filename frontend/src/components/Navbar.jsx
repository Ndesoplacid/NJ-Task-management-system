import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, LogIn, UserPlus, CheckSquare, Plus } from 'lucide-react';

export const Navbar = ({ onCreateTask }) => {
  const { user, openAuthModal, logoutUser } = useAuth();

  return (
    <nav className="glass-panel" style={{
      margin: '16px',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: '16px',
      position: 'sticky',
      top: '16px',
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          background: 'var(--primary-gradient)',
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
        }}>
          <CheckSquare size={20} color="white" />
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }} className="gradient-text">
          NJ Management System
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user ? (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--secondary)',
                boxShadow: '0 0 8px var(--secondary)',
              }} />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                {user.username}
              </span>
            </div>

            <button className="btn btn-primary" onClick={onCreateTask} style={{ height: '40px' }}>
              <Plus size={18} />
              <span>Create Task</span>
            </button>

            <button
              className="btn btn-icon btn-icon-danger"
              onClick={logoutUser}
              title="Log Out"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={() => openAuthModal('login')}>
              <LogIn size={16} />
              <span>Log In</span>
            </button>
            <button className="btn btn-primary" onClick={() => openAuthModal('signup')}>
              <UserPlus size={16} />
              <span>Sign Up</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
