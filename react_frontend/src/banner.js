import React from 'react';
import './banner.css';

function Banner({ username }) {
  return (
    <div className="Banner">
      <div className="Banner-content">
        <div className="Banner-title">Cardfight Companion</div>
        <div className="Banner-username">{username}</div>
      </div>
    </div>
  );
}

export default Banner;