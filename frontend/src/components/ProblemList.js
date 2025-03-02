import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL, API_CONFIG } from '../api/config';
import './ProblemList.css';

function ProblemList() {
  const [problems, setProblems] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingNotes, setEditingNotes] = useState(null);
  const [editingTags, setEditingTags] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [maximizedNotes, setMaximizedNotes] = useState(null);
  const [editingExamples, setEditingExamples] = useState(null);
  const [exampleInput, setExampleInput] = useState('');

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/problems`, API_CONFIG);
      setProblems(response.data);
      
      // Extract unique tags from all problems
      const tags = new Set();
      response.data.forEach(problem => {
        problem.tags.forEach(tag => tags.add(tag));
      });
      setAvailableTags(Array.from(tags).sort());
    } catch (error) {
      console.error('Error fetching problems:', error);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
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

  const handleTagUpdate = async (problemId, updatedTags) => {
    try {
      const problem = problems.find(p => p.id === problemId);
      await axios.put(
        `${API_BASE_URL}/problems/${problemId}`,
        { ...problem, tags: updatedTags },
        API_CONFIG
      );
      await fetchProblems();
      setTagInput('');
    } catch (error) {
      console.error('Error updating problem tags:', error);
    }
  };

  const handleAddTag = async (problemId, newTag) => {
    try {
      const problem = problems.find(p => p.id === problemId);
      const updatedTags = [...new Set([...problem.tags, newTag])]; // Remove duplicates
      await handleTagUpdate(problemId, updatedTags);
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const handleTagInput = (value) => {
    setTagInput(value);
    const currentTag = value.trim().toLowerCase();
    if (currentTag) {
      const filtered = availableTags.filter(tag => 
        tag.toLowerCase().includes(currentTag)
      );
      setShowTagSuggestions(filtered.length > 0);
    } else {
      setShowTagSuggestions(false);
    }
  };

  const handleMaximizedNotesChange = async (problemId, notes) => {
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

  const handleExampleAdd = async (problemId, link) => {
    try {
      const problem = problems.find(p => p.id === problemId);
      // Ensure exampleLinks is initialized as an array
      const currentLinks = problem.exampleLinks || [];
      const updatedLinks = [...currentLinks, link];
      
      // Log the request for debugging
      console.log('Updating problem with:', { ...problem, exampleLinks: updatedLinks });
      
      await axios.put(
        `${API_BASE_URL}/problems/${problemId}`,
        { ...problem, exampleLinks: updatedLinks },
        API_CONFIG
      );
      await fetchProblems();
      setExampleInput('');
    } catch (error) {
      console.error('Error adding example link:', error);
      // Add better error handling
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    }
  };

  const handleExampleRemove = async (problemId, linkToRemove) => {
    try {
      const problem = problems.find(p => p.id === problemId);
      const updatedLinks = problem.exampleLinks.filter(link => link !== linkToRemove);
      await axios.put(
        `${API_BASE_URL}/problems/${problemId}`,
        { ...problem, exampleLinks: updatedLinks },
        API_CONFIG
      );
      await fetchProblems();
    } catch (error) {
      console.error('Error removing example link:', error);
    }
  };

  const filteredProblems = problems.filter(problem => {
    // Filter by status
    if (statusFilter !== 'ALL' && problem.status !== statusFilter) {
      return false;
    }
    
    // Filter by selected tags
    if (selectedTags.length > 0) {
      return selectedTags.every(tag => problem.tags.includes(tag));
    }
    
    return true;
  });

  // Add function to count problems for each tag
  const getTagCount = (tag) => {
    return problems.filter(problem => problem.tags.includes(tag)).length;
  };

  return (
    <div className="problem-list-container">
      <div className="filters-section">
        <div className="status-filters">
          <button 
            className={`status-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            All
          </button>
          <button 
            className={`status-btn ${statusFilter === 'UNSOLVED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('UNSOLVED')}
          >
            Unsolved
          </button>
          <button 
            className={`status-btn ${statusFilter === 'SOLVING' ? 'active' : ''}`}
            onClick={() => setStatusFilter('SOLVING')}
          >
            Solving
          </button>
          <button 
            className={`status-btn ${statusFilter === 'SOLVED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('SOLVED')}
          >
            Solved
          </button>
        </div>

        <div className="tags-filter">
          <h3>Filter by Tags</h3>
          <div className="tags-grid">
            {availableTags.map(tag => (
              <button
                key={tag}
                className={`tag-btn ${selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                <span>{tag}</span>
                <span className="tag-count">{getTagCount(tag)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="problems-list">
        {filteredProblems.map(problem => (
          <div key={problem.id} className={`problem-item ${problem.status.toLowerCase()}`}>
            <div className="problem-header">
              <h3>
                {problem.link && problem.link !== '#' ? (
                  <a href={problem.link} target="_blank" rel="noopener noreferrer">
                    {problem.name}
                  </a>
                ) : (
                  <span className="problem-name">{problem.name}</span>
                )}
              </h3>
              <div className="problem-status">
                {problem.status.toLowerCase()}
              </div>
            </div>
            
            <div className="problem-tags">
              {problem.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                  <button 
                    className="remove-tag"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const updatedTags = problem.tags.filter(t => t !== tag);
                      await handleTagUpdate(problem.id, updatedTags);
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
              {editingTags === problem.id ? (
                <div className="add-tag-container">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => handleTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        handleAddTag(problem.id, tagInput.trim());
                        setEditingTags(null);
                      } else if (e.key === 'Escape') {
                        setEditingTags(null);
                        setTagInput('');
                      }
                    }}
                    placeholder="Add tag..."
                    autoFocus
                  />
                  {showTagSuggestions && (
                    <div className="tag-suggestions">
                      {availableTags
                        .filter(tag => 
                          tag.toLowerCase().includes(tagInput.toLowerCase()) &&
                          !problem.tags.includes(tag)
                        )
                        .map(tag => (
                          <div
                            key={tag}
                            className="tag-suggestion"
                            onClick={() => {
                              handleAddTag(problem.id, tag);
                              setEditingTags(null);
                            }}
                          >
                            {tag}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <button 
                  className="add-tag-btn"
                  onClick={() => setEditingTags(problem.id)}
                >
                  +
                </button>
              )}
            </div>

            <div className="problem-examples">
              <div className="examples-header">
                <span>Example Solutions</span>
                {editingExamples === problem.id ? (
                  <input
                    type="text"
                    value={exampleInput}
                    onChange={(e) => setExampleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && exampleInput.trim()) {
                        handleExampleAdd(problem.id, exampleInput.trim());
                        setEditingExamples(null);
                      } else if (e.key === 'Escape') {
                        setEditingExamples(null);
                        setExampleInput('');
                      }
                    }}
                    placeholder="Enter example link..."
                    autoFocus
                  />
                ) : (
                  <button 
                    className="add-example-btn"
                    onClick={() => setEditingExamples(problem.id)}
                  >
                    +
                  </button>
                )}
              </div>
              <div className="example-links">
                {problem.exampleLinks?.map((link, index) => (
                  <div key={index} className="example-link">
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      {new URL(link).hostname}
                    </a>
                    <button
                      className="remove-example"
                      onClick={() => handleExampleRemove(problem.id, link)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
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
                <div className="notes-container">
                  <div 
                    className="notes-display"
                    onClick={() => setEditingNotes(problem.id)}
                  >
                    {problem.notes ? problem.notes : 'Click to add notes...'}
                  </div>
                  <button
                    className="maximize-notes-btn"
                    onClick={() => setMaximizedNotes(problem.id)}
                    title="Maximize notes"
                  >
                    ⤢
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {maximizedNotes && (
        <div className="notes-modal-overlay" onClick={() => setMaximizedNotes(null)}>
          <div className="notes-modal" onClick={e => e.stopPropagation()}>
            <div className="notes-modal-header">
              <h3>{problems.find(p => p.id === maximizedNotes)?.name}</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setMaximizedNotes(null)}
              >
                ×
              </button>
            </div>
            <textarea
              className="notes-modal-content"
              value={problems.find(p => p.id === maximizedNotes)?.notes || ''}
              onChange={(e) => {
                const newNotes = e.target.value;
                setProblems(problems.map(p => 
                  p.id === maximizedNotes
                    ? { ...p, notes: newNotes }
                    : p
                ));
              }}
              onBlur={(e) => handleMaximizedNotesChange(maximizedNotes, e.target.value)}
              placeholder="Add detailed notes about your solution approach..."
            />
          </div>
        </div>
      )}

      <Link to="/study" className="add-problem-btn">
        + Add New Problem
      </Link>
    </div>
  );
}

export default ProblemList; 