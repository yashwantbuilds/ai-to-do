import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <nav className="navbar">
            <Link to="/">Task Manager</Link>
        </nav>
    );
}

export default Navbar;