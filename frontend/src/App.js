import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import TaskList from './components/TaskList';
import TaskDetail from './components/TaskDetail';
import Study from './components/Study';
import ProblemList from './components/ProblemList';
import Navbar from './components/Navbar';
import ThemeToggle from './components/ThemeToggle';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <ThemeToggle />
          <Navbar />
          <div className="container">
            <Routes>
              <Route path="/" element={<TaskList />} />
              <Route path="/task/:id" element={<TaskDetail />} />
              <Route path="/study" element={<Study />} />
              <Route path="/study/problems" element={<ProblemList />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
