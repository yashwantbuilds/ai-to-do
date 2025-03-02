import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TaskDetail.css';
import { API_BASE_URL, API_CONFIG } from '../api/config';

function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isNotesMaximized, setIsNotesMaximized] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editedSubtaskTitle, setEditedSubtaskTitle] = useState('');
  const [saveSubtaskTimeout, setSaveSubtaskTimeout] = useState(null);
  const [editedPriority, setEditedPriority] = useState('');
  const [editedScheduledTime, setEditedScheduledTime] = useState(
    task?.scheduledTime ? new Date(task.scheduledTime).toLocaleString('en-US', { 
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }) : ''
  );
  const [allTasks, setAllTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);
  const [isChatMaximized, setIsChatMaximized] = useState(false);
  const [showAISubtaskPrompt, setShowAISubtaskPrompt] = useState(false);
  const [aiSubtaskPrompt, setAISubtaskPrompt] = useState('');
  const [generatedSubtasks, setGeneratedSubtasks] = useState([]);
  const [showSubtaskReview, setShowSubtaskReview] = useState(false);
  const [selectedSubtasks, setSelectedSubtasks] = useState(new Set());

  useEffect(() => {
    fetchTask();
    fetchMessages();
    fetchSubtasks();
  }, [id]);

  useEffect(() => {
    if (task) {
      setEditedTitle(task.title);
      setEditedDescription(task.description);
      setEditedPriority(task.priority);
    }
  }, [task]);

  // Add timer update effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Add useEffect for escape key handling
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isNotesMaximized) {
        setIsNotesMaximized(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    // Cleanup listener on component unmount
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isNotesMaximized]); // Only re-run effect if isNotesMaximized changes

  // Add useEffect for title update
  useEffect(() => {
    if (task) {
      document.title = `Task Manager | ${task.title}`;
    }
    
    // Reset title when component unmounts
    return () => {
      document.title = 'Task Manager';
    };
  }, [task]); // Re-run when task changes

  useEffect(() => {
    const fetchAllTasks = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/tasks`, API_CONFIG);
        setAllTasks(response.data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };
    fetchAllTasks();
  }, []);

  const fetchTask = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks/${id}`, API_CONFIG);
      setTask(response.data);
      setNotes(response.data.notes || '');
    } catch (error) {
      console.error('Error fetching task:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks/${id}/messages`, API_CONFIG);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchSubtasks = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/tasks/${id}/subtasks`,
        API_CONFIG
      );
      setSubtasks(response.data);
    } catch (error) {
      console.error('Error fetching subtasks:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/tasks/${id}/messages`, 
        { content: newMessage },
        API_CONFIG
      );
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Auto-save notes with debounce
  const saveNotes = useCallback(async (content) => {
    try {
      await axios.put(
        `${API_BASE_URL}/tasks/${id}/notes`,
        { notes: content },
        API_CONFIG
      );
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  }, [id]);

  const handleNotesChange = (e) => {
    const newContent = e.target.value;
    setNotes(newContent);
    
    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Set new timeout for auto-save
    const timeoutId = setTimeout(() => {
      saveNotes(newContent);
    }, 1000); // Auto-save after 1 second of no typing
    
    setSaveTimeout(timeoutId);
  };

  const formatMessage = (content) => {
    // Split the content by newlines and map each line to a paragraph or list item
    return content.split('\n').map((line, index) => {
      // Check if line is a list item (numbered or bullet)
      const isListItem = /^(\d+\.|•|\*|-)\s/.test(line);
      
      if (isListItem) {
        return <li key={index} className="message-list-item">{line}</li>;
      }
      return <p key={index} className="message-paragraph">{line}</p>;
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedTitle(task.title);
    setEditedDescription(task.description);
    setEditedPriority(task.priority);
  };

  const handleSave = async () => {
    try {
      const updatedTask = {
        title: editedTitle,
        description: editedDescription,
        priority: editedPriority,
        scheduledTime: editedScheduledTime ? new Date(editedScheduledTime).toISOString() : null
      };

      await axios.put(`${API_BASE_URL}/tasks/${id}`, updatedTask, API_CONFIG);
      setIsEditing(false);
      fetchTask();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;

    try {
      await axios.post(
        `${API_BASE_URL}/tasks/${id}/subtasks`,
        { title: newSubtask },
        API_CONFIG
      );
      setNewSubtask('');
      fetchSubtasks();
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  const toggleSubtask = async (subtaskId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/tasks/${id}/subtasks/${subtaskId}/toggle`,
        {},
        API_CONFIG
      );
      fetchSubtasks();
    } catch (error) {
      console.error('Error toggling subtask:', error);
    }
  };

  const deleteSubtask = async (subtaskId) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/tasks/${id}/subtasks/${subtaskId}`,
        API_CONFIG
      );
      fetchSubtasks();
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  };

  const formatElapsedTime = (seconds) => {
    if (seconds <= 0) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateElapsedSeconds = (task) => {
    if (!task?.startedAt) return 0;
    
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

  const handleStartTask = async () => {
    try {
      await axios.put(
        `${API_BASE_URL}/tasks/${id}/start`,
        {},
        API_CONFIG
      );
      fetchTask(); // Refresh task data
    } catch (error) {
      console.error('Error starting task:', error);
    }
  };

  const handlePauseTask = async () => {
    try {
      await axios.put(
        `${API_BASE_URL}/tasks/${id}/pause`,
        {},
        API_CONFIG
      );
      fetchTask(); // Refresh task data
    } catch (error) {
      console.error('Error pausing task:', error);
    }
  };

  const handleCompleteTask = async () => {
    try {
      await axios.put(
        `${API_BASE_URL}/tasks/${id}/complete`,
        {},
        API_CONFIG
      );
      fetchTask(); // Refresh task data
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleDeleteTask = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await axios.delete(`${API_BASE_URL}/tasks/${id}`, API_CONFIG);
        navigate('/'); // Navigate back to task list
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  // Add this function to detect and convert URLs to clickable links
  const formatNotesWithLinks = (text) => {
    if (!text) return null;
    
    // Split text into lines
    return text.split('\n').map((line, index) => {
      // Check if line is a list item (numbered or bullet)
      const isNumberedList = /^\d+\.\s/.test(line);
      const isBulletList = /^[•\-\*]\s/.test(line);
      
      // Process the line content for links
      const processedContent = line.split(' ').map((word, wordIndex) => {
        if (word.startsWith('http://') || word.startsWith('https://')) {
          return (
            <a 
              key={wordIndex}
              href={word}
              className="notes-link"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {word}
            </a>
          );
        }
        return word;
      }).reduce((prev, curr) => [prev, ' ', curr]);

      if (isNumberedList) {
        return <li key={index} className="notes-numbered-item">{processedContent}</li>;
      } else if (isBulletList) {
        return <li key={index} className="notes-bullet-item">{processedContent}</li>;
      }
      
      return <p key={index}>{processedContent}</p>;
    });
  };

  const handleEditSubtask = async (subtaskId, newTitle) => {
    if (!newTitle.trim()) {
      setEditingSubtaskId(null);
      return;
    }
    
    try {
      const response = await axios.put(
        `${API_BASE_URL}/tasks/${id}/subtasks/${subtaskId}`,
        { title: newTitle },
        API_CONFIG
      );
      
      // Update the local state immediately
      setSubtasks(prevSubtasks => 
        prevSubtasks.map(subtask => 
          subtask.id === subtaskId 
            ? { ...subtask, title: newTitle }
            : subtask
        )
      );
    } catch (error) {
      console.error('Error updating subtask:', error);
      // Optionally revert the changes on error
      fetchSubtasks();
    }
  };

  const toggleBacklog = async () => {
    try {
      await axios.put(`${API_BASE_URL}/tasks/${id}/backlog`, {}, API_CONFIG);
      fetchTask();
    } catch (error) {
      console.error('Error toggling backlog:', error);
    }
  };

  const handleTaskSelect = (taskId) => {
    setSearchQuery('');
    setShowSearchResults(false);
    navigate(`/task/${taskId}`, { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update the insertFormatting function
  const insertFormatting = (format, e) => {
    // Prevent the textarea from losing focus
    e.preventDefault();
    e.stopPropagation();
    
    const textarea = document.querySelector('.notes-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    let prefix = '';
    let suffix = '';

    switch (format) {
      case 'h1':
        prefix = '# ';
        suffix = '\n';
        break;
      case 'h2':
        prefix = '## ';
        suffix = '\n';
        break;
      case 'h3':
        prefix = '### ';
        suffix = '\n';
        break;
      case 'h4':
        prefix = '#### ';
        suffix = '\n';
        break;
      case 'bold':
        prefix = '**';
        suffix = '**';
        break;
      case 'italic':
        prefix = '_';
        suffix = '_';
        break;
      case 'code':
        prefix = '`';
        suffix = '`';
        break;
      default:
        return;
    }

    const newText = text.substring(0, start) + prefix + 
                   text.substring(start, end) + suffix + 
                   text.substring(end);
    
    setNotes(newText);
    // Update the notes in the backend
    saveNotes(newText);
    
    // Restore focus to textarea
    textarea.focus();
  };

  // Update the formatNotesDisplay function
  const formatNotesDisplay = (text) => {
    if (!text) return null;
    
    return text.split('\n').map((line, index) => {
      // Handle headings
      if (line.startsWith('#### ')) {
        return <h4 key={index}>{line.substring(5)}</h4>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index}>{line.substring(4)}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index}>{line.substring(3)}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={index}>{line.substring(2)}</h1>;
      }

      // Split content into parts to handle links and other formatting
      const parts = line.split(/(\s+)/);
      const formattedParts = parts.map((part, partIndex) => {
        // Handle links
        if (part.match(/^(https?:\/\/[^\s]+)$/)) {
          return `<a href="${part}" class="notes-link" target="_blank" rel="noopener noreferrer">${part}</a>`;
        }

        // Handle code snippets
        if (part.match(/`([^`]+)`/)) {
          return part.replace(/`([^`]+)`/g, (_, code) => 
            `<code>${code}</code>`
          );
        }
        
        // Handle bold
        if (part.match(/\*\*([^*]+)\*\*/)) {
          return part.replace(/\*\*([^*]+)\*\*/g, (_, bold) => 
            `<strong>${bold}</strong>`
          );
        }
        
        // Handle italic
        if (part.match(/_([^_]+)_/)) {
          return part.replace(/_([^_]+)_/g, (_, italic) => 
            `<em>${italic}</em>`
          );
        }

        return part;
      });

      // Return paragraph with HTML string
      return (
        <p 
          key={index} 
          dangerouslySetInnerHTML={{ 
            __html: formattedParts.join('') 
          }} 
          onClick={(e) => {
            // Prevent editing when clicking links
            if (e.target.tagName === 'A') {
              e.stopPropagation();
            }
          }}
        />
      );
    });
  };

  // Add this effect to handle clicks outside notes section
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsEditingNotes(false);
      }
    };

    if (isEditingNotes) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditingNotes]);

  // Add this function to handle escape key
  const handleNotesKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsEditingNotes(false);
    }
  };

  // Add this function near other task-related functions
  const createSubtask = async (title) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/tasks/${id}/subtasks`,
        { title },
        API_CONFIG
      );
      // Update the subtasks list
      setSubtasks([...subtasks, response.data]);
    } catch (error) {
      console.error('Error creating subtask:', error);
    }
  };

  // Update the handleAISubtaskGeneration function
  const handleAISubtaskGeneration = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_BASE_URL}/tasks/${id}/generate-subtasks`,
        { prompt: aiSubtaskPrompt },
        API_CONFIG
      );
      
      // Show the review dialog with generated subtasks
      if (response.data && response.data.length > 0) {
        setGeneratedSubtasks(response.data);
        setSelectedSubtasks(new Set(response.data.map((_, index) => index)));
        setShowSubtaskReview(true);
      }
    } catch (error) {
      console.error('Error generating subtasks:', error);
    }
  };

  // Add function to handle subtask selection
  const handleSubtaskSelection = (index) => {
    const newSelected = new Set(selectedSubtasks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSubtasks(newSelected);
  };

  // Add function to handle subtask creation after review
  const handleCreateSelectedSubtasks = async () => {
    try {
      // Create selected subtasks in parallel
      await Promise.all(
        Array.from(selectedSubtasks).map(index => 
          createSubtask(generatedSubtasks[index])
        )
      );
      
      // Clear states and close review
      setGeneratedSubtasks([]);
      setSelectedSubtasks(new Set());
      setShowSubtaskReview(false);
      setShowAISubtaskPrompt(false);
      setAISubtaskPrompt('');
    } catch (error) {
      console.error('Error creating subtasks:', error);
    }
  };

  // Add this helper function for priority sorting
  const getPriorityWeight = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': return 3;
      case 'MEDIUM': return 2;
      case 'LOW': return 1;
      default: return 0;
    }
  };

  if (!task) return <div>Loading...</div>;

  return (
    <div className="task-detail">
      <div className="task-search" ref={searchRef}>
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSearchResults(true);
          }}
          onFocus={() => setShowSearchResults(true)}
        />
        {showSearchResults && searchQuery && (
          <div className="search-results">
            {allTasks
              .filter(t => 
                t.title.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .sort((a, b) => {
                // First sort by backlog status
                if (a.inBacklog !== b.inBacklog) {
                  return a.inBacklog ? 1 : -1;
                }
                // Then sort by priority within each group
                const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
                if (priorityDiff !== 0) return priorityDiff;
                // Finally sort by creation date
                return new Date(b.createdAt) - new Date(a.createdAt);
              })
              .map(t => (
                <div
                  key={t.id}
                  className={`search-result-item ${t.id === task?.id ? 'current' : ''}`}
                  onClick={() => handleTaskSelect(t.id)}
                >
                  <span className="task-title">
                    {t.priority && (
                      <span className={`priority-indicator ${t.priority.toLowerCase()}`}>
                        {t.priority === 'HIGH' ? '🔴' : t.priority === 'MEDIUM' ? '🟡' : '🟢'}
                      </span>
                    )}
                    {t.title}
                  </span>
                  <span className={`task-status ${t.status.toLowerCase()}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
      <div className="task-info">
        {isEditing ? (
          <>
            <input
              type="text"
              className="edit-title"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder="Task title"
            />
            <textarea
              className="edit-description"
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              placeholder="Task description"
            />
            <select
              className="edit-priority"
              value={editedPriority}
              onChange={(e) => setEditedPriority(e.target.value)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <div className="schedule-time">
              <label htmlFor="scheduledTime">Schedule Time (IST)</label>
              <input
                type="datetime-local"
                id="scheduledTime"
                value={editedScheduledTime}
                onChange={(e) => setEditedScheduledTime(e.target.value)}
                className="edit-scheduled-time"
              />
            </div>
            <div className="edit-actions">
              <button onClick={handleSave} className="save-btn">Save</button>
              <button onClick={handleCancel} className="cancel-btn">Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div className="title-section">
              <h2>{task.title}</h2>
              <div className="task-controls">
                <button 
                  onClick={handleEdit} 
                  className="action-btn edit-btn"
                  title="Edit"
                >
                  ✎
                </button>
              </div>
            </div>
            <p>{task.description}</p>
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
                      onClick={() => handleStartTask(task.id)}
                      title={task.status === 'PAUSED' ? 'Resume' : 'Start'}
                    >
                      {task.status === 'PAUSED' ? '⏯️' : '▶️'}
                    </button>
                  )}
                  {task.status === 'IN_PROGRESS' && (
                    <button 
                      className="action-btn pause-btn"
                      onClick={() => handlePauseTask(task.id)}
                      title="Pause"
                    >
                      ⏸️
                    </button>
                  )}
                  <button 
                    className="action-btn complete-btn"
                    onClick={() => handleCompleteTask(task.id)}
                    title="Complete"
                  >
                    ✅
                  </button>
                </>
              )}
              <button 
                className="action-btn backlog-btn"
                onClick={() => toggleBacklog(task.id)}
                title={task.inBacklog ? 'Move to Active' : 'Move to Backlog'}
              >
                {task.inBacklog ? '📥' : '📤'}
              </button>
              <button 
                className="action-btn delete-btn"
                onClick={handleDeleteTask}
                title="Delete"
              >
                🗑️
              </button>
            </div>
            <div className="task-meta">
              {task.inBacklog && <span className="backlog-badge">Backlog</span>}
              <span className="date">Created: {new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
            {task.scheduledTime && (
              <div className="scheduled-time">
                <span className="schedule-icon">🗓️</span>
                Scheduled for: {new Date(task.scheduledTime).toLocaleString('en-US', { 
                  timeZone: 'Asia/Kolkata',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })} IST
              </div>
            )}
          </>
        )}
      </div>

      <div className="subtasks-section">
        <div className="subtasks-header">
          <h3>Subtasks</h3>
          <div className="subtask-actions">
            <button 
              className="ai-subtask-btn"
              onClick={() => setShowAISubtaskPrompt(!showAISubtaskPrompt)}
              title="Generate subtasks using AI"
            >
              🤖 AI Assist
            </button>
          </div>
        </div>
        
        {/* Manual subtask form - always visible */}
        <form onSubmit={handleAddSubtask} className="subtask-form">
          <input
            type="text"
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            placeholder="Add a subtask..."
          />
          <button type="submit">Add</button>
        </form>

        {/* AI subtask form */}
        {showAISubtaskPrompt && (
          <form onSubmit={handleAISubtaskGeneration} className="ai-subtask-form">
            <input
              type="text"
              value={aiSubtaskPrompt}
              onChange={(e) => setAISubtaskPrompt(e.target.value)}
              placeholder="Describe what subtasks you need help with..."
              className="ai-subtask-input"
            />
            <button type="submit" disabled={!aiSubtaskPrompt.trim()}>
              Generate
            </button>
            <button 
              type="button" 
              onClick={() => {
                setShowAISubtaskPrompt(false);
                setAISubtaskPrompt('');
              }}
              className="cancel-btn"
            >
              Cancel
            </button>
          </form>
        )}

        {showSubtaskReview && (
          <div className="subtask-review">
            <h4>Review Generated Subtasks</h4>
            <div className="subtask-review-list">
              {generatedSubtasks.map((subtask, index) => (
                <div key={index} className="subtask-review-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedSubtasks.has(index)}
                      onChange={() => handleSubtaskSelection(index)}
                    />
                    <span>{subtask}</span>
                  </label>
                </div>
              ))}
            </div>
            <div className="subtask-review-actions">
              <button 
                onClick={handleCreateSelectedSubtasks}
                disabled={selectedSubtasks.size === 0}
              >
                Create Selected ({selectedSubtasks.size})
              </button>
              <button 
                onClick={() => {
                  setShowSubtaskReview(false);
                  setGeneratedSubtasks([]);
                  setSelectedSubtasks(new Set());
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="subtask-list">
          {subtasks.map(subtask => (
            <div key={subtask.id} className="subtask-item">
              <div className={`subtask-content ${editingSubtaskId === subtask.id ? 'editing' : ''}`}>
                <input
                  type="checkbox"
                  checked={subtask.completed}
                  onChange={() => toggleSubtask(subtask.id)}
                />
                {editingSubtaskId === subtask.id ? (
                  <input
                    type="text"
                    className="subtask-edit-input"
                    value={editedSubtaskTitle}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setEditedSubtaskTitle(newTitle);
                      
                      // Clear existing timeout
                      if (saveSubtaskTimeout) {
                        clearTimeout(saveSubtaskTimeout);
                      }
                      
                      // Set new timeout for auto-save
                      const timeoutId = setTimeout(async () => {
                        await handleEditSubtask(subtask.id, newTitle);
                      }, 500);
                      
                      setSaveSubtaskTimeout(timeoutId);
                    }}
                    onBlur={() => {
                      // Save on blur if there are unsaved changes
                      if (saveSubtaskTimeout) {
                        clearTimeout(saveSubtaskTimeout);
                        handleEditSubtask(subtask.id, editedSubtaskTitle);
                      }
                      setEditingSubtaskId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        if (saveSubtaskTimeout) {
                          clearTimeout(saveSubtaskTimeout);
                        }
                        setEditingSubtaskId(null);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <span 
                    className={subtask.completed ? 'completed' : ''}
                    onClick={() => {
                      setEditingSubtaskId(subtask.id);
                      setEditedSubtaskTitle(subtask.title);
                    }}
                  >
                    {subtask.title}
                  </span>
                )}
              </div>
              <button
                onClick={() => deleteSubtask(subtask.id)}
                className="delete-subtask"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="content-split">
        <div className={`notes-section ${isNotesMaximized ? 'maximized' : ''}`}>
          <div className="notes-header">
            <h3>Notes</h3>
            <div className="formatting-toolbar">
              <button onClick={(e) => insertFormatting('h1', e)} title="Heading 1" type="button">H1</button>
              <button onClick={(e) => insertFormatting('h2', e)} title="Heading 2" type="button">H2</button>
              <button onClick={(e) => insertFormatting('h3', e)} title="Heading 3" type="button">H3</button>
              <button onClick={(e) => insertFormatting('h4', e)} title="Heading 4" type="button">H4</button>
              <span className="divider">|</span>
              <button onClick={(e) => insertFormatting('bold', e)} title="Bold" type="button">B</button>
              <button onClick={(e) => insertFormatting('italic', e)} title="Italic" type="button">I</button>
              <button onClick={(e) => insertFormatting('code', e)} title="Code" type="button">{`<>`}</button>
            </div>
            <button 
              className="maximize-btn"
              onClick={() => setIsNotesMaximized(!isNotesMaximized)}
              title={isNotesMaximized ? "Minimize" : "Maximize"}
            >
              {isNotesMaximized ? '⎯' : '⤢'}
            </button>
          </div>
          <div className="notes-content" ref={searchRef}>
            {isEditingNotes ? (
              <textarea
                className="notes-textarea"
                value={notes}
                onChange={handleNotesChange}
                placeholder="Add your notes here..."
                onKeyDown={handleNotesKeyDown}
                autoFocus
              />
            ) : (
              <div 
                className="notes-display"
                onClick={() => setIsEditingNotes(true)}
              >
                {formatNotesDisplay(notes)}
              </div>
            )}
          </div>
        </div>

        <div className={`chat-section ${isChatMaximized ? 'maximized' : ''}`}>
          <div className="chat-header">
            <h3>AI-Powered Chat</h3>
            <button 
              className="maximize-btn"
              onClick={() => setIsChatMaximized(!isChatMaximized)}
              title={isChatMaximized ? "Minimize" : "Maximize"}
            >
              {isChatMaximized ? '⎯' : '⤢'}
            </button>
          </div>
          <div className="messages">
            {messages.map(message => (
              <div key={message.id} className={`message ${message.role}`}>
                <div className="message-content">
                  {formatMessage(message.content)}
                </div>
                <div className="message-timestamp">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="message-form">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              required
            />
            <button type="submit">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TaskDetail; 