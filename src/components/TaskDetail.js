import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './TaskDetail.css';

function TaskDetail() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchTask();
    fetchMessages();
  }, [id]);

  const fetchTask = async () => {
    try {
      const response = await axios.get(`/api/tasks/${id}`);
      setTask(response.data);
    } catch (error) {
      console.error('Error fetching task:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/api/tasks/${id}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/tasks/${id}/messages`, { content: newMessage });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!task) return <div>Loading...</div>;

  return (
    <div className="task-detail">
      <div className="task-info">
        <h2>{task.title}</h2>
        <p>{task.description}</p>
        <div className={`priority ${task.priority.toLowerCase()}`}>
          {task.priority}
        </div>
        <div className="task-meta">
          {task.inBacklog && <span className="backlog-badge">Backlog</span>}
          <span className="date">Created: {new Date(task.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="chat-section">
        <h3>AI-Powered Chat</h3>
        <div className="messages">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.role}`}>
              <div className="message-content">{message.content}</div>
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
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default TaskDetail; 