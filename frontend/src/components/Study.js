import React, { useState, useEffect } from 'react';
import './Study.css';
import axios from 'axios';
import { API_BASE_URL, API_CONFIG } from '../api/config';

function Study() {
  const [problems, setProblems] = useState([]);
  const [newProblem, setNewProblem] = useState({
    name: '',
    link: '',
    tags: '',
    notes: '',
    status: 'UNSOLVED' // can be 'unsolved', 'solving', 'solved'
  });
  const [editingNotes, setEditingNotes] = useState(null);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  useEffect(() => {
    fetchProblems();
    fetchExistingTags();
  }, []);

  const fetchProblems = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/problems`, API_CONFIG);
      setProblems(response.data);
    } catch (error) {
      console.error('Error fetching problems:', error);
    }
  };

  const fetchExistingTags = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/problems/tags`, API_CONFIG);
      setTagSuggestions(response.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const extractNameFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('geeksforgeeks')) {
        const match = urlObj.pathname.match(/problems\/(.*?)(\/|$)/);
        if (match) {
          return match[1].split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
        }
      }
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        return pathParts[pathParts.length - 1]
          .split(/[-_]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      return '';
    } catch (error) {
      console.error('Error extracting name from URL:', error);
      return '';
    }
  };

  const handleLinkChange = (e) => {
    const link = e.target.value;
    setNewProblem(prev => ({
      ...prev,
      link,
      name: !prev.name || prev.name === extractNameFromUrl(prev.link) 
        ? extractNameFromUrl(link)
        : prev.name
    }));
  };

  const handleProblemSubmit = async (e) => {
    e.preventDefault();
    if (newProblem.name || newProblem.link) {
      try {
        const problemData = {
          ...newProblem,
          name: newProblem.name || new URL(newProblem.link).hostname,
          link: newProblem.link || '#',
          tags: newProblem.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        };
        await axios.post(`${API_BASE_URL}/problems`, problemData, API_CONFIG);
        await fetchProblems();
        setNewProblem({
          name: '',
          link: '',
          tags: '',
          notes: '',
          status: 'UNSOLVED'
        });
      } catch (error) {
        console.error('Error creating problem:', error);
        if (!newProblem.name && error.message.includes('URL')) {
          alert('Please provide a valid URL or a problem name');
        }
      }
    }
  };

  const handleStatusChange = async (problemId, newStatus) => {
    try {
      const problem = problems.find(p => p.id === problemId);
      await axios.put(
        `${API_BASE_URL}/problems/${problemId}`,
        { ...problem, status: newStatus },
        API_CONFIG
      );
      await fetchProblems();
    } catch (error) {
      console.error('Error updating problem status:', error);
    }
  };

  const handleDeleteProblem = async (problemId) => {
    try {
      await axios.delete(`${API_BASE_URL}/problems/${problemId}`, API_CONFIG);
      await fetchProblems();
    } catch (error) {
      console.error('Error deleting problem:', error);
    }
  };

  const handleNotesChange = async (problemId, notes) => {
    try {
      const problem = problems.find(p => p.id === problemId);
      await axios.put(
        `${API_BASE_URL}/problems/${problemId}`,
        { ...problem, notes },
        API_CONFIG
      );
      await fetchProblems();
    } catch (error) {
      console.error('Error updating problem notes:', error);
    }
  };

  const handleTagInput = (e) => {
    const value = e.target.value;
    setNewProblem({ ...newProblem, tags: value });
    
    const currentTag = value.split(',').pop().trim().toLowerCase();
    if (currentTag) {
      const filtered = tagSuggestions.filter(tag => 
        tag.toLowerCase().includes(currentTag) && 
        !value.split(',').slice(0, -1).map(t => t.trim()).includes(tag)
      );
      setShowTagSuggestions(filtered.length > 0);
    } else {
      setShowTagSuggestions(false);
    }
  };

  const handleTagSelect = (tag) => {
    const tags = newProblem.tags.split(',');
    tags.pop();
    const newTags = [...tags, tag].filter(Boolean).join(', ');
    setNewProblem({ ...newProblem, tags: newTags + ', ' });
    setShowTagSuggestions(false);
  };

  return (
    <div className="study-container">
      <h1>Problem Tracker</h1>
      
      <div className="problem-tracking-section">
        <form onSubmit={handleProblemSubmit} className="problem-form">
          <div className="input-group">
            <label htmlFor="problemName">Problem Name (optional if link provided)</label>
            <input
              id="problemName"
              type="text"
              value={newProblem.name}
              onChange={(e) => setNewProblem({ ...newProblem, name: e.target.value })}
              placeholder="Enter problem name"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="problemLink">Problem Link (optional if name provided)</label>
            <input
              id="problemLink"
              type="url"
              value={newProblem.link}
              onChange={handleLinkChange}
              placeholder="https://example.com/problem"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="problemTags">Tags (comma-separated)</label>
            <div className="tags-input-container">
              <input
                id="problemTags"
                type="text"
                value={newProblem.tags}
                onChange={handleTagInput}
                placeholder="dp, arrays, sorting"
                onFocus={() => {
                  const currentTag = newProblem.tags.split(',').pop().trim().toLowerCase();
                  if (currentTag) {
                    setShowTagSuggestions(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowTagSuggestions(false), 200);
                }}
              />
              {showTagSuggestions && (
                <div className="tag-suggestions">
                  {tagSuggestions
                    .filter(tag => 
                      tag.toLowerCase().includes(newProblem.tags.split(',').pop().trim().toLowerCase()) &&
                      !newProblem.tags.split(',').slice(0, -1).map(t => t.trim()).includes(tag)
                    )
                    .map(tag => (
                      <div
                        key={tag}
                        className="tag-suggestion"
                        onClick={() => handleTagSelect(tag)}
                      >
                        {tag}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={!newProblem.name && !newProblem.link}
          >
            Add Problem
          </button>
        </form>

        {problems.length > 0 && (
          <div className="problems-list">
            {problems.map(problem => (
              <div key={problem.id} className={`problem-card ${problem.status.toLowerCase()}`}>
                <div className="problem-info">
                  <h3>
                    <a href={problem.link} target="_blank" rel="noopener noreferrer">
                      {problem.name}
                    </a>
                  </h3>
                  <div className="problem-tags">
                    {problem.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                  <div className="problem-notes">
                    {editingNotes === problem.id ? (
                      <textarea
                        value={problem.notes}
                        onChange={(e) => {
                          const newNotes = e.target.value;
                          setProblems(problems.map(p => 
                            p.id === problem.id 
                              ? { ...p, notes: newNotes }
                              : p
                          ));
                        }}
                        onBlur={(e) => {
                          handleNotesChange(problem.id, e.target.value);
                          setEditingNotes(null);
                        }}
                        placeholder="Add notes about your solution approach..."
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="notes-display"
                        onClick={() => setEditingNotes(problem.id)}
                      >
                        {problem.notes ? problem.notes : 'Click to add notes...'}
                      </div>
                    )}
                  </div>
                </div>
                <div className="problem-actions">
                  <select
                    value={problem.status}
                    onChange={(e) => handleStatusChange(problem.id, e.target.value)}
                  >
                    <option value="UNSOLVED">Unsolved</option>
                    <option value="SOLVING">Solving</option>
                    <option value="SOLVED">Solved</option>
                  </select>
                  <button 
                    onClick={() => handleDeleteProblem(problem.id)}
                    className="delete-btn"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Study; 