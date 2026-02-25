import React from 'react'
import logoImg from './logo.png'
import './Loading.css'

export default function Loading() {
  return (
    <div className="loading-overlay">
      <div className="loading-inner">
        <div className="logo-ring">
          <img src={logoImg} alt="carlockhomes" className="loading-logo" />
        </div>
        <div className="loading-dots">
          <span /><span /><span />
        </div>
        <p className="loading-text">データを読み込んでいます...</p>
      </div>
    </div>
  )
}
