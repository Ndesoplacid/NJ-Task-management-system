import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import AuthModal from './components/AuthModal';
import TaskModal from './components/TaskModal';
import AlarmModal from './components/AlarmModal';
import { Loader } from 'lucide-react';

export const App = () => {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  
  // Modal & Popup States
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null);
  const [activeAlarmTask, setActiveAlarmTask] = useState(null);

  // Fetch all user tasks from the backend
  const fetchTasks = async (filters = {}) => {
    if (!user) return;
    setTasksLoading(true);
    try {
      const response = await axios.get('/tasks', { params: filters });
      if (response.data.success) {
        setTasks(response.data.tasks);
      }
    } catch (error) {
      console.error('[App Fetch Error] Failed to fetch tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  };

  // Toggle or change status directly from card (e.g. click Complete badge)
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const response = await axios.put(`/tasks/${taskId}`, { status: newStatus });
      if (response.data.success) {
        // Update task inline to prevent full loading reload flickers!
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task._id === taskId ? response.data.task : task))
        );
      }
    } catch (error) {
      console.error('[App Task Update Error]', error);
    }
  };

  // Prompt safe confirmation before task deletion
  const handleDeleteTask = async (taskId) => {
    const confirmDelete = window.confirm('Are you absolutely sure you want to delete this task? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(`/tasks/${taskId}`);
      if (response.data.success) {
        // Filter out task immediately from state
        setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));
        
        // If the deleted task is currently triggering the alarm, silence it
        if (activeAlarmTask && activeAlarmTask._id === taskId) {
          setActiveAlarmTask(null);
        }
      }
    } catch (error) {
      console.error('[App Task Delete Error]', error);
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedTaskForEdit(null);
    setTaskModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setSelectedTaskForEdit(task);
    setTaskModalOpen(true);
  };

  const handleAlarmTrigger = (task) => {
    setActiveAlarmTask(task);
  };

  const handleDismissAlarm = () => {
    setActiveAlarmTask(null);
  };

  // Request browser Notification permissions on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fetch tasks on startup or when logged-in user changes
  useEffect(() => {
    if (user) {
      fetchTasks();
    } else {
      setTasks([]);
    }
  }, [user]);

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '16px'
      }}>
        <Loader className="gradient-text" style={{ animation: 'spin 2s linear infinite' }} size={42} />
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Securing Connection session...</h3>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Global Header Navigation */}
      <Navbar onCreateTask={handleOpenCreateModal} />

      {/* Main Core View Area */}
      <main className="main-content">
        <Dashboard
          tasks={tasks}
          onEditTask={handleOpenEditModal}
          onDeleteTask={handleDeleteTask}
          onStatusChange={handleStatusChange}
          onAlarmTrigger={handleAlarmTrigger}
          fetchTasks={fetchTasks}
        />
      </main>

      {/* Authentication popup modal */}
      <AuthModal />

      {/* Task Creation & Update Modal Form */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        task={selectedTaskForEdit}
        onSave={fetchTasks}
      />

      {/* Extreme Priority Alarm modal */}
      <AlarmModal
        task={activeAlarmTask}
        onDismiss={handleDismissAlarm}
      />
    </div>
  );
};

export default App;
