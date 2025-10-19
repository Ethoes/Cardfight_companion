import React from 'react';
import { Link } from 'react-router-dom';
import './banner.css';

function Banner({ username, onLogout }) {
  return (
    <div className="Banner">
      <div className="Banner-content">
        <Link to="/" className="Banner-title">
          Cardfight Companion!!
        </Link>
        <div className="Banner-username">
          {username}
          <button className="Banner-logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Banner;