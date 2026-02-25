import React, { useEffect, useState } from 'react'
import './Loading.css'

export default function Loading({ onDone }) {
  const [phase, setPhase] = useState('show') // show → fadeout

  // 外部から完了通知 + 最低3秒保証
  useEffect(() => {
    if (!onDone) return
    // onDoneはPromiseを返す or コールバック登録
  }, [])

  return (
    <div className={`loading-overlay ${phase === 'fadeout' ? 'fadeout' : ''}`}>
      <div className="loading-inner">
        <div className="logo-ring">
          <img src="/logo.png" alt="carlockhomes" className="loading-logo" />
        </div>
        <div className="loading-dots">
          <span /><span /><span />
        </div>
        <p className="loading-text">データを読み込んでいます...</p>
      </div>
    </div>
  )
}
