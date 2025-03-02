import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  
  return (
    <nav className="navbar">
      <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
        Tasks
      </Link>
      <Link to="/study" className={`nav-link ${location.pathname === '/study' ? 'active' : ''}`}>
        Add Problem
      </Link>
      <Link to="/study/problems" className={`nav-link ${location.pathname === '/study/problems' ? 'active' : ''}`}>
        Problems
      </Link>
      <Link to="/study/solve" className={`nav-link ${location.pathname === '/study/solve' ? 'active' : ''}`}>
        Solve a Problem
      </Link>
    </nav>
  );
}

export default Navbar; 