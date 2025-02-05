import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './TaskList.css';
import { API_BASE_URL, API_CONFIG } from '../api/config';

function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    description: '', 
    priority: 'MEDIUM',
    scheduledTime: ''
  });
  const [showBacklog, setShowBacklog] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [filterType, setFilterType] = useState('active'); // 'active', 'backlog', or 'completed'

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks`, API_CONFIG);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/tasks`, newTask, API_CONFIG);
      setNewTask({ title: '', description: '', priority: 'MEDIUM', scheduledTime: '' });
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const toggleBacklog = async (taskId) => {
    try {
      await axios.put(`${API_BASE_URL}/tasks/${taskId}/backlog`, {}, API_CONFIG);
      fetchTasks();
    } catch (error) {
      console.error('Error toggling backlog:', error);
    }
  };

  const handleStartTask = async (taskId) => {
    try {
      await axios.put(`${API_BASE_URL}/tasks/${taskId}/start`, {}, API_CONFIG);
      fetchTasks();
    } catch (error) {
      console.error('Error starting task:', error);
    }
  };

  const handlePauseTask = async (taskId) => {
    try {
      await axios.put(`${API_BASE_URL}/tasks/${taskId}/pause`, {}, API_CONFIG);
      fetchTasks();
    } catch (error) {
      console.error('Error pausing task:', error);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await axios.put(`${API_BASE_URL}/tasks/${taskId}/complete`, {}, API_CONFIG);
      fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleDeleteTask = async (taskId, e) => {
    e.preventDefault(); // Prevent navigation
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await axios.delete(`${API_BASE_URL}/tasks/${taskId}`, API_CONFIG);
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleResetDuration = async (taskId, e) => {
    e.preventDefault(); // Prevent navigation
    if (window.confirm('Are you sure you want to reset the duration for this task?')) {
      try {
        await axios.put(`${API_BASE_URL}/tasks/${taskId}/reset-duration`, {}, API_CONFIG);
        fetchTasks();
      } catch (error) {
        console.error('Error resetting task duration:', error);
      }
    }
  };

  const sortTasks = (tasks) => {
    const priorityOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
    return [...tasks].sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, sort by creation date (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  };

  const filteredTasks = sortTasks(
    filterType === 'completed' 
      ? tasks.filter(task => task.status === 'COMPLETED')
      : filterType === 'backlog'
      ? tasks.filter(task => task.inBacklog && task.status !== 'COMPLETED')
      : tasks.filter(task => !task.inBacklog && task.status !== 'COMPLETED')
  );

  const getTaskDurationClass = (createdAt) => {
    const now = new Date();
    const taskDate = new Date(createdAt);
    
    // Reset hours to compare just the dates
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
    
    // Calculate the difference in days
    const diffTime = Math.abs(today - taskDay);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 3) return 'duration-red';
    if (diffDays >= 2) return 'duration-orange';
    if (diffDays >= 1) return 'duration-yellow';
    return 'duration-blue'; // Same day
  };

  const getTaskDurationText = (task) => {
    // If task is completed, show "Well done!"
    if (task.status === 'COMPLETED') {
      return 'Well done!';
    }

    const now = new Date();
    const taskDate = new Date(task.createdAt);
    
    // Reset hours to compare just the dates
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
    
    // Calculate the difference in days
    const diffTime = Math.abs(today - taskDay);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) return `${diffDays} days old`;
    if (diffDays === 1) return '1 day old';
    return 'Do it today';
  };

  const formatElapsedTime = (seconds) => {
    if (seconds <= 0) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update the timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const calculateElapsedSeconds = (task) => {
    if (!task.startedAt) return 0;
    
    let endTime;
    if (task.completedAt) {
      endTime = new Date(task.completedAt);
    } else if (task.status === 'PAUSED') {
      endTime = new Date(task.pausedAt);
    } else if (task.status === 'IN_PROGRESS') {
      endTime = currentTime;
    } else {
      return 0;
    }

    const startTime = new Date(task.startedAt);
    const totalSeconds = Math.floor((endTime - startTime) / 1000);
    return Math.max(0, totalSeconds - (task.totalPausedTime || 0));
  };

  const toggleForm = () => {
    setIsFormVisible(!isFormVisible);
  };

  const calculateTotalTimeWorkedToday = (tasks) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.reduce((total, task) => {
      if (!task.startedAt) return total;
      
      const startedAt = new Date(task.startedAt);
      // Only count if started today
      if (startedAt >= today) {
        let endTime;
        if (task.completedAt) {
          endTime = new Date(task.completedAt);
        } else if (task.status === 'PAUSED') {
          endTime = new Date(task.pausedAt);
        } else if (task.status === 'IN_PROGRESS') {
          endTime = new Date();
        } else {
          return total;
        }
        
        const elapsedSeconds = Math.floor((endTime - startedAt) / 1000) - (task.totalPausedTime || 0);
        return total + Math.max(0, elapsedSeconds);
      }
      return total;
    }, 0);
  };

  const formatTotalTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `Today: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="task-list">
      <div className="task-list-header">
        <div className="total-time">
          <span className="time-icon">⏱️</span>
          <span className="time-label">{formatTotalTime(calculateTotalTimeWorkedToday(tasks))}</span>
        </div>
        <h2>
          {filterType === 'completed' 
            ? 'Completed Tasks'
            : filterType === 'backlog'
            ? 'Backlog Tasks'
            : 'Active Tasks'}
        </h2>
      </div>
      <div className="task-filters">
        <button 
          className={`filter-btn ${filterType === 'active' ? 'active' : ''}`}
          onClick={() => setFilterType('active')}
        >
          Active Tasks
        </button>
        <button 
          className={`filter-btn ${filterType === 'backlog' ? 'active' : ''}`}
          onClick={() => setFilterType('backlog')}
        >
          Backlog
        </button>
        <button 
          className={`filter-btn ${filterType === 'completed' ? 'active' : ''}`}
          onClick={() => setFilterType('completed')}
        >
          Completed
        </button>
      </div>

      <div className="tasks-container">
        {filteredTasks.map(task => (
          <div key={task.id} className="task-card-wrapper">
            <Link 
              to={`/task/${task.id}`} 
              className={`task-card ${getTaskDurationClass(task.createdAt)} ${
                task.scheduledTime ? 'has-schedule' : ''
              } ${task.status === 'COMPLETED' ? 'completed' : ''}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="task-info-section">
                <div className="task-title-container">
                  <h3>{task.title}</h3>
                  {getTaskDurationClass(task.createdAt) === 'duration-red' && (
                    <span className="do-it-today">Do it today</span>
                  )}
                </div>
                {task.scheduledTime && (
                  <div className="task-schedule">
                    <span className="schedule-icon">🗓️</span>
                    {new Date(task.scheduledTime).toLocaleString('en-US', { 
                      timeZone: 'Asia/Kolkata',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })} IST
                  </div>
                )}
                <p>{task.description}</p>
                <div className="task-meta">
                  {task.inBacklog && <span className="backlog-badge">Backlog</span>}
                  <span className="date">{getTaskDurationText(task)}</span>
                </div>
              </div>

              <div className="task-status-section">
                {task.status === 'IN_PROGRESS' && (
                  <div className="elapsed-time active">
                    ⏱️ {formatElapsedTime(calculateElapsedSeconds(task))}
                  </div>
                )}
                {task.status === 'PAUSED' && (
                  <div className="elapsed-time paused">
                    ⏸️ {formatElapsedTime(calculateElapsedSeconds(task))}
                  </div>
                )}
                {task.status === 'COMPLETED' && (
                  <div className="elapsed-time completed">
                    ✅ {formatElapsedTime(calculateElapsedSeconds(task))}
                  </div>
                )}
                
                {task.scheduledTime && (
                  <div className="scheduled-time-badge">
                    🗓️ {new Date(task.scheduledTime).toLocaleString('en-US', { 
                      timeZone: 'Asia/Kolkata',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })} IST
                  </div>
                )}
                
                <div className={`priority ${task.priority.toLowerCase()}`}>
                  {task.priority}
                </div>
              </div>

              <div className="task-actions">
                {task.status !== 'COMPLETED' && (
                  <>
                    {(task.status === 'NOT_STARTED' || task.status === 'PAUSED') && (
                      <button 
                        className="action-btn start-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          handleStartTask(task.id);
                        }}
                        title={task.status === 'PAUSED' ? 'Resume' : 'Start'}
                      >
                        {task.status === 'PAUSED' ? '⏯️' : '▶️'}
                      </button>
                    )}
                    {task.status === 'IN_PROGRESS' && (
                      <button 
                        className="action-btn pause-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePauseTask(task.id);
                        }}
                        title="Pause"
                      >
                        ⏸️
                      </button>
                    )}
                    <button 
                      className="action-btn complete-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        handleCompleteTask(task.id);
                      }}
                      title="Complete"
                    >
                      ✅
                    </button>
                  </>
                )}
                {task.startedAt && (
                  <button 
                    className="action-btn reset-btn"
                    onClick={(e) => handleResetDuration(task.id, e)}
                    title="Reset Duration"
                  >
                    🔄
                  </button>
                )}
                <button 
                  className="action-btn backlog-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleBacklog(task.id);
                  }}
                  title={task.inBacklog ? 'Move to Active' : 'Move to Backlog'}
                >
                  {task.inBacklog ? '📥' : '📤'}
                </button>
                <button 
                  className="action-btn delete-btn"
                  onClick={(e) => handleDeleteTask(task.id, e)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {!showBacklog && (
        <>
          <button 
            className="create-task-toggle"
            onClick={toggleForm}
          >
            {isFormVisible ? '✕' : '+ New Task'}
          </button>
          <div className={`create-task-widget ${isFormVisible ? 'visible' : ''}`}>
            <form onSubmit={handleSubmit} className="task-form">
              <h3>Create New Task</h3>
              <input
                type="text"
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                required
              />
              <textarea
                placeholder="Task description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                required
              />
              <div className="schedule-time">
                <label htmlFor="scheduledTime">Schedule Time (IST)</label>
                <input
                  type="datetime-local"
                  id="scheduledTime"
                  value={newTask.scheduledTime}
                  onChange={(e) => setNewTask({ ...newTask, scheduledTime: e.target.value })}
                  className="edit-scheduled-time"
                />
              </div>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
              <button type="submit">Create Task</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default TaskList; 