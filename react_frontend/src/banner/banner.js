import React from 'react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import './banner.css';

function Banner({ username }) {
  return (
    <div className="Banner">
      <div className="Banner-content">
        <Link to="/" className="Banner-title"> {/* Wrap the title in a Link */}
          Cardfight Companion
        </Link>
        <div className="Banner-username">{username}</div>
      </div>
    </div>
  );
}

export default Banner;