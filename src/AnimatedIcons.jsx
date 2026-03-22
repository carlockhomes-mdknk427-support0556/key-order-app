// AnimatedIcons.jsx — CSS アニメーション SVG アイコン集
import './AnimatedIcons.css'

// ── ステータスアイコン ─────────────────────────────────────────

// 💬 チャットバブル (お問合せ)
export function IconChat({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
      <path className="ai-bubble" d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      <circle className="ai-dot ai-dot-1" cx="8"  cy="12" r="1.4" fill="white"/>
      <circle className="ai-dot ai-dot-2" cx="12" cy="12" r="1.4" fill="white"/>
      <circle className="ai-dot ai-dot-3" cx="16" cy="12" r="1.4" fill="white"/>
    </svg>
  )
}

// 📋 クリップボード (案内済み)
export function IconClipboard({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
      <rect className="ai-clip-body" x="4" y="4" width="16" height="18" rx="2" opacity=".8"/>
      <rect x="8" y="2" width="8" height="4" rx="1" opacity=".95"/>
      <line className="ai-clip-line ai-clip-l1" x1="8" y1="10" x2="16" y2="10" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <line className="ai-clip-line ai-clip-l2" x1="8" y1="14" x2="16" y2="14" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <line className="ai-clip-line ai-clip-l3" x1="8" y1="18" x2="13" y2="18" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

// 🏢 ビル (杉並電話受付)
export function IconBuilding({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
      <rect x="3"  y="4"  width="18" height="20" rx="1" opacity=".7"/>
      <rect x="3"  y="1"  width="18" height="5"  rx="1" opacity=".9"/>
      <rect className="ai-win ai-win-a" x="6"  y="8"  width="3" height="3" rx=".5" fill="white"/>
      <rect className="ai-win ai-win-b" x="10.5" y="8"  width="3" height="3" rx=".5" fill="white"/>
      <rect className="ai-win ai-win-c" x="15" y="8"  width="3" height="3" rx=".5" fill="white"/>
      <rect className="ai-win ai-win-d" x="6"  y="14" width="3" height="3" rx=".5" fill="white"/>
      <rect className="ai-win ai-win-e" x="10.5" y="14" width="3" height="3" rx=".5" fill="white"/>
      <rect className="ai-win ai-win-f" x="15" y="14" width="3" height="3" rx=".5" fill="white"/>
      <rect x="9" y="19" width="6" height="5" rx=".5" fill="white" opacity=".45"/>
    </svg>
  )
}

// 📥 受注ボックス (受注)
export function IconInbox({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
      <rect x="2" y="14" width="20" height="8" rx="2" opacity=".8"/>
      <g className="ai-arr">
        <line x1="12" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <polyline points="7,8 12,13 17,8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </g>
    </svg>
  )
}

// ⚙️ ギア (手配済み)
export function IconGearAnim({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
      <g className="ai-gear">
        <circle cx="12" cy="12" r="3.2" fill="currentColor"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" opacity=".7"/>
      </g>
    </svg>
  )
}

// 📦 パッケージ (入荷済み)
export function IconPackage({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
      <rect className="ai-lid" x="1" y="3"  width="22" height="6"  rx="1" opacity=".9"/>
      <rect                     x="2" y="9"  width="20" height="13" rx="1" opacity=".75"/>
      <line x1="12" y1="3" x2="12" y2="9"  stroke="white" strokeWidth="2.2" opacity=".5" fill="none"/>
      <rect x="7"  y="13" width="10" height="1.5" rx=".75" fill="white" opacity=".35"/>
    </svg>
  )
}

// 📅 カレンダー (作業アポ済み)
export function IconCalendar({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
      <rect x="3" y="4"  width="18" height="18" rx="2" opacity=".7"/>
      <rect x="3" y="4"  width="18" height="6"  rx="2" opacity=".95"/>
      <line x1="8"  y1="2" x2="8"  y2="6" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      <line x1="16" y1="2" x2="16" y2="6" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      <path className="ai-cal-check" d="M7.5 15.5l3.5 3.5 6-6.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  )
}

// ✅ チェックマーク (完了)
export function IconCheckmark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="ai-icon">
      <circle className="ai-chk-ring" cx="12" cy="12" r="10" fill="currentColor" opacity=".85"/>
      <path className="ai-chk-path" d="M7 12.5l4 4 6-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ❌ Xマーク (キャンセル)
export function IconXMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="ai-icon">
      <circle className="ai-x-ring"  cx="12" cy="12" r="10" fill="currentColor" opacity=".85"/>
      <g className="ai-x-lines">
        <line x1="8" y1="8" x2="16" y2="16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="16" y1="8" x2="8" y2="16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      </g>
    </svg>
  )
}

// ── UI アイコン ────────────────────────────────────────────────

// 🔑 鍵
export function IconKey({ size = 22, large = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="ai-icon">
      <g className={large ? 'ai-key-lg' : 'ai-key-g'} stroke="currentColor">
        <circle cx="8"  cy="8"  r="5"  fill="none"/>
        <circle cx="8"  cy="8"  r="2"  fill="currentColor" stroke="none"/>
        <line   x1="11.5" y1="10.5" x2="21" y2="19.5"/>
        <line   x1="17"   y1="19"   x2="19" y2="19"/>
        <line   x1="17"   y1="17"   x2="17" y2="19"/>
      </g>
    </svg>
  )
}

// 🏷️ タグ
export function IconTag({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
      <g className="ai-tag-g">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" opacity=".85"/>
        <circle cx="7" cy="7" r="1.6" fill="white"/>
      </g>
    </svg>
  )
}

// 💳 クレジットカード
export function IconCreditCard({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
      <g className="ai-card-g">
        <rect x="1" y="5" width="22" height="16" rx="2" opacity=".85"/>
        <rect x="1" y="9" width="22" height="4"  opacity=".5"/>
        <rect x="4" y="15" width="7" height="2" rx="1" fill="white" opacity=".55"/>
      </g>
    </svg>
  )
}

// 🔧 レンチ
export function IconWrench({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
      <g className="ai-wrench-g">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" opacity=".9"/>
      </g>
    </svg>
  )
}

// 🔐🔒 ロック
export function IconLock({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
      <rect x="3" y="11" width="18" height="11" rx="2" opacity=".85"/>
      <path className="ai-shackle" d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="12" cy="16.5" r="1.6" fill="white"/>
    </svg>
  )
}

// 🔄 リロード
export function IconReload({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="ai-icon">
      <g className="ai-reload-g" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M21 12a9 9 0 1 1-9-9"/>
        <polyline points="12,3 16,6 12,9" fill="currentColor" stroke="none"/>
      </g>
    </svg>
  )
}

// ✏️ 鉛筆
export function IconPencil({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
      <g className="ai-pencil-g">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" opacity=".9"/>
      </g>
    </svg>
  )
}

// 🗑️ ゴミ箱
export function IconTrash({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ai-icon">
      <g className="ai-trash-g">
        <polyline points="3,6 5,6 21,6" strokeWidth="2.5"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 6V4h4v2"/>
        <line x1="10" y1="11" x2="10" y2="17" opacity=".6"/>
        <line x1="14" y1="11" x2="14" y2="17" opacity=".6"/>
      </g>
    </svg>
  )
}

// ⚠️ 警告
export function IconWarning({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
      <g className="ai-warn-g">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9"  x2="12" y2="13" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <circle cx="12" cy="17" r="1.3" fill="white"/>
      </g>
    </svg>
  )
}

// ☠️ ドクロ (セッション失効)
export function IconSkull({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="ai-icon">
      <g className="ai-skull-g">
        <ellipse cx="50" cy="43" rx="35" ry="37" fill="#f87171"/>
        <circle cx="36" cy="40" r="10" fill="white" opacity=".95"/>
        <circle cx="64" cy="40" r="10" fill="white" opacity=".95"/>
        <circle cx="36" cy="40" r="5"  fill="#1e1e2e"/>
        <circle cx="64" cy="40" r="5"  fill="#1e1e2e"/>
        <rect x="28" y="69" width="11" height="14" rx="2.5" fill="#f87171" stroke="white" strokeWidth="2.5"/>
        <rect x="44" y="69" width="11" height="14" rx="2.5" fill="#f87171" stroke="white" strokeWidth="2.5"/>
        <rect x="60" y="69" width="11" height="14" rx="2.5" fill="#f87171" stroke="white" strokeWidth="2.5"/>
      </g>
    </svg>
  )
}

// 💾 フロッピー
export function IconSave({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
      <g className="ai-save-g">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" opacity=".85"/>
        <polyline points="17,21 17,13 7,13 7,21" fill="none" stroke="white" strokeWidth="1.6"/>
        <polyline points="7,3 7,8 15,8"           fill="none" stroke="white" strokeWidth="1.6"/>
      </g>
    </svg>
  )
}

// 成功チェック (メッセージ用小)
export function IconSuccess({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="ai-icon">
      <circle cx="12" cy="12" r="10" fill="#10b981" opacity=".9"/>
      <path d="M7 12.5l4 4 6-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// エラーX (メッセージ用小)
export function IconError({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="ai-icon">
      <circle cx="12" cy="12" r="10" fill="#ef4444" opacity=".9"/>
      <line x1="8"  y1="8"  x2="16" y2="16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="16" y1="8"  x2="8"  y2="16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

// 🔗 リンク
export function IconLink({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="ai-icon">
      <g className="ai-link-g">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </g>
    </svg>
  )
}

// 📱 スマホ
export function IconPhone({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
      <g className="ai-phone-g">
        <rect x="5" y="2" width="14" height="20" rx="2" opacity=".85"/>
        <circle cx="12" cy="18" r="1.3" fill="white" opacity=".7"/>
        <rect x="9" y="5" width="6" height="1" rx=".5" fill="white" opacity=".4"/>
      </g>
    </svg>
  )
}

// 📄 ドキュメント
export function IconDocument({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" opacity=".85"/>
      <polyline points="14,2 14,8 20,8" fill="none" stroke="white" strokeWidth="1.6"/>
      <line x1="8" y1="13" x2="16" y2="13" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".7"/>
      <line x1="8" y1="17" x2="13" y2="17" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".5"/>
    </svg>
  )
}

// ⚙️ ギア(設定)
export function IconGearSettings({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
      <g className="ai-gear-slow">
        <circle cx="12" cy="12" r="3.2"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" opacity=".7"/>
      </g>
    </svg>
  )
}

// 👥 ユーザー
export function IconUsers({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" opacity=".7"/>
      <circle cx="9" cy="7" r="4" opacity=".9"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

// 📊 グラフ(売上)
export function IconChart({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
      <rect className="ai-bar ai-bar-1" x="2"  y="12" width="5"  height="10" rx="1" opacity=".8"/>
      <rect className="ai-bar ai-bar-2" x="9"  y="7"  width="5"  height="15" rx="1" opacity=".9"/>
      <rect className="ai-bar ai-bar-3" x="16" y="3"  width="5"  height="19" rx="1"/>
      <line x1="1" y1="22" x2="23" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".5" fill="none"/>
    </svg>
  )
}

// ➕ プラス
export function IconPlusAnim({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="ai-icon">
      <g className="ai-plus-g">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity=".85"/>
        <path d="M12 7v10M7 12h10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      </g>
    </svg>
  )
}

// ⏳ 砂時計
export function IconHourglass({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ai-icon">
      <g className="ai-hourglass-g">
        <line x1="5" y1="22" x2="19" y2="22"/>
        <line x1="5" y1="2"  x2="19" y2="2"/>
        <path d="M17 2v8l-5 4 5 4v6H7v-6l5-4-5-4V2"/>
        <path d="M8.5 20c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5H8.5z" fill="currentColor" stroke="none" opacity=".8"/>
      </g>
    </svg>
  )
}

// ℹ️ 情報
export function IconInfo({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
      <g className="ai-info-g">
        <circle cx="12" cy="12" r="10" opacity=".75"/>
        <line x1="12" y1="16"   x2="12" y2="12"   stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <line x1="12" y1="8.01" x2="12.01" y2="8" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      </g>
    </svg>
  )
}

// 💡 電球
export function IconLightbulb({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
      <g className="ai-bulb-g">
        <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.73-1.56 5.1-4 6.32V17H9v-1.68A7 7 0 0 1 5 9a7 7 0 0 1 7-7z" opacity=".9"/>
      </g>
    </svg>
  )
}

// 📥 ダウンロード (Excel)
export function IconDownload({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ai-icon">
      <g className="ai-dl-g">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7,10 12,15 17,10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </g>
    </svg>
  )
}

// 📧 メール送信
export function IconEmailSend({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ai-icon">
      <g className="ai-send-g">
        <path d="M22 2L11 13"/>
        <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
      </g>
    </svg>
  )
}

// 🧾 領収書
export function IconReceipt({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
      <g className="ai-receipt-g">
        <path d="M4 2l2 2 2-2 2 2 2-2 2 2 2-2 2 2V22l-2-2-2 2-2-2-2 2-2-2-2 2-2-2V2z" opacity=".85"/>
        <line x1="8"  y1="9"  x2="16" y2="9"  stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".7"/>
        <line x1="8"  y1="13" x2="16" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".7"/>
        <line x1="8"  y1="17" x2="12" y2="17" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".5"/>
      </g>
    </svg>
  )
}

// ✉️ 封筒
export function IconMail({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ai-icon">
      <path className="ai-mail-body" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" opacity=".85"/>
      <polyline className="ai-mail-flap" points="22,6 12,13 2,6" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

// ── ヘルパー関数 ────────────────────────────────────────────────

// ステータスID → アイコンコンポーネント のマップ
const STATUS_ICON_MAP = {
  inquiry:   IconChat,
  guided:    IconClipboard,
  suginami:  IconBuilding,
  order:     IconInbox,
  arranged:  IconGearAnim,
  arrived:   IconPackage,
  appt:      IconCalendar,
  done:      IconCheckmark,
  cancelled: IconXMark,
}

export function getStatusIcon(statusId, size = 22) {
  const Cmp = STATUS_ICON_MAP[statusId]
  return Cmp ? <Cmp size={size} /> : null
}

// paymentMsg の ✅/❌ をアイコンに置換して表示するヘルパー
export function PayMsg({ msg }) {
  if (!msg) return null
  const isOk  = msg.startsWith('✅')
  const isErr = msg.startsWith('❌')
  const text  = (isOk || isErr) ? msg.slice(2).trim() : msg
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {isOk  && <IconSuccess size={13} />}
      {isErr && <IconError   size={13} />}
      {text}
    </span>
  )
}
