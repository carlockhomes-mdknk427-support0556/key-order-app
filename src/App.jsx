import React, { useState, useEffect, useCallback } from 'react'
import { Key, Plus, X, ChevronRight, Phone, Building2, FileText, JapaneseYen, ArrowRight, Loader2, RefreshCw, Settings, Search, AlertTriangle, LogOut, RotateCcw, Lock, Users, Check, XCircle } from 'lucide-react'
import './App.css'
import Loading from './Loading'

// ============================================================
// バージョン・定数
// ============================================================
const APP_VERSION  = 'v2.3.0'
const WORKER_URL   = 'https://web-order.clh-0556-clh.workers.dev'
const EMAIL_KEY    = 'clh_admin_email'

// ロール定義
const ROLE_PERMS = {
  master: ['view','add','edit','delete','restore','sales','settings','users'],
  sales:  ['view','add','edit','delete','restore','sales','settings'],
  staff:  ['view','add','status_change'],
}
function can(role, action) {
  return (ROLE_PERMS[role] || ROLE_PERMS.staff).includes(action)
}
const ROLE_LABELS = { master: 'マスター', sales: '売上管理', staff: 'スタッフ' }

// ============================================================
// ステータス・アラート・メーカー定義
// ============================================================
const STATUSES = [
  { id: 'inquiry',   label: 'お問合せ',      color: '#e67e22', bg: 'rgba(230,126,34,0.12)',  icon: '💬' },
  { id: 'guided',    label: '案内済み',      color: '#d4a017', bg: 'rgba(212,160,23,0.12)',  icon: '📋' },
  { id: 'suginami',  label: '杉並電話受付',  color: '#1abc9c', bg: 'rgba(26,188,156,0.12)', icon: '🏢' },
  { id: 'order',     label: '受注',          color: '#ff6b35', bg: 'rgba(255,107,53,0.12)',  icon: '📥' },
  { id: 'arranged',  label: '手配済み',      color: '#9b59b6', bg: 'rgba(155,89,182,0.12)', icon: '🏭' },
  { id: 'arrived',   label: '入荷済み',      color: '#3498db', bg: 'rgba(52,152,219,0.12)', icon: '📦' },
  { id: 'appt',      label: '作業アポ済み',  color: '#27ae60', bg: 'rgba(39,174,96,0.12)',  icon: '📅' },
  { id: 'done',      label: '完了',          color: '#95a5a6', bg: 'rgba(149,165,166,0.12)', icon: '✅' },
  { id: 'cancelled', label: 'キャンセル',    color: '#e74c3c', bg: 'rgba(231,76,60,0.12)',  icon: '❌' },
]

const STATUS_TRANSITIONS = {
  inquiry:   ['guided', 'suginami', 'order'],
  guided:    ['order', 'inquiry'],
  suginami:  ['order', 'inquiry'],
  order:     ['arranged', 'inquiry'],
  arranged:  ['arrived', 'order'],
  arrived:   ['appt', 'arranged'],
  appt:      ['done', 'arrived'],
  done:      ['inquiry', 'order'],
  cancelled: ['inquiry'],
}

const ALERTS = [
  { id: 'alert_order',    status: 'order',    days: 7,  label: '受注後１週間経過',   color: '#27ae60', borderColor: '#27ae60' },
  { id: 'alert_arranged', status: 'arranged', days: 21, label: '手配済み３週間経過', color: '#f1c40f', borderColor: '#f1c40f' },
  { id: 'alert_arrived',  status: 'arrived',  days: 7,  label: '入荷後１週間経過',   color: '#e74c3c', borderColor: '#e74c3c' },
]

const MAKERS = [
  { id: 'miwa',      label: '美和ロック', taxIncluded: false },
  { id: 'shibutani', label: 'シブタニ',   taxIncluded: true  },
  { id: 'goal',      label: 'ゴール',     taxIncluded: false },
]

const MAKER_PRODUCTS = {
  miwa: [
    { group: '商品', items: [
      { name: 'TLRS2-K01D（Raccessキーヘッド）',       price: 10050 },
      { name: 'TLRS2-E01（Raccessポップアップキー）',   price: 15500 },
      { name: 'TLNT-K(T)02A（ノンタッチキーヘッド）',   price: 3550  },
      { name: 'TLNT-K03 (4)A（彩ノンタッチキーヘッド）', price: 4200  },
      { name: 'FKLカード',                              price: 3550  },
      { name: '標準キー',                                price: 2000  },
    ]},
    { group: '作業費・手数料', items: [
      { name: '出作業費',        price: 12000 },
      { name: '事務手数料',      price: 1100  },
      { name: '美和サーバー手数料', price: 2200  },
    ]},
  ],
  shibutani: [
    { group: '🔑 カギ類', items: [
      { name: 'Tebraキー',              price: 15400 },
      { name: 'Tebra収納キー（新旧あり）', price: 6600  },
      { name: 'F22 TLキー',             price: 7100  },
      { name: 'TFキー',                 price: 7800  },
      { name: 'FTSキー',                price: 13200 },
      { name: 'F22 標準キー',            price: 3900  },
      { name: 'T20 標準キー',            price: 3900  },
    ]},
    { group: '🏷️ タグ類', items: [
      { name: 'Tebraタグ', price: 11500 },
      { name: 'TLタグ',    price: 3200  },
    ]},
    { group: '💳 カード類', items: [
      { name: 'TLカード', price: 3200 },
      { name: 'TFカード', price: 3900 },
    ]},
    { group: '🔧 作業費・手数料類', items: [
      { name: '出張費',                 price: 8000  },
      { name: '交換作業費（シリンダー）',  price: 8000  },
      { name: '交換作業費（収納キー）',    price: 5000  },
      { name: '登録作業費',              price: 5000  },
      { name: 'メーカー手数料',           price: 2500  },
      { name: '送料・事務手数料（弊社）',  price: 1210  },
    ]},
  ],
  goal: [],
}

// ============================================================
// セッション管理（token + role を sessionStorage に保存）
// ============================================================
const SESSION_KEY = 'clh_admin_token'
const ROLE_KEY    = 'clh_admin_role'

function getToken()         { try { return sessionStorage.getItem(SESSION_KEY) || '' } catch { return '' } }
function setToken(v)        { try { sessionStorage.setItem(SESSION_KEY, v) } catch {} }
function clearToken()       { try { sessionStorage.removeItem(SESSION_KEY) } catch {} }
function getRoleSession()   { try { return sessionStorage.getItem(ROLE_KEY) || '' } catch { return '' } }
function setRoleSession(v)  { try { sessionStorage.setItem(ROLE_KEY, v) } catch {} }
function clearRoleSession() { try { sessionStorage.removeItem(ROLE_KEY) } catch {} }
function getUserEmail()     { try { return sessionStorage.getItem(EMAIL_KEY) || '' } catch { return '' } }
function setUserEmail(v)    { try { sessionStorage.setItem(EMAIL_KEY, v) } catch {} }
function clearUserEmail()   { try { sessionStorage.removeItem(EMAIL_KEY) } catch {} }

async function sha256(message) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ============================================================
// API通信（全てWorker経由・個別操作）
// ============================================================
async function apiCall(payload) {
  const token = getToken()
  if (token) payload.token = token
  const email = getUserEmail()
  if (email) payload.userEmail = email
  try {
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return { status: 'error', message: 'サーバーエラー(' + res.status + ')' }
    return await res.json()
  } catch { return { status: 'error', message: 'ネットワークエラーが発生しました' } }
}

async function fetchOrders() {
  try {
    const data = await apiCall({ action: 'get_orders' })
    return data.orders || null
  } catch { return null }
}

async function fetchDeletedOrders() {
  try {
    const data = await apiCall({ action: 'get_deleted' })
    return data.orders || []
  } catch { return [] }
}

// ============================================================
// ユーティリティ
// ============================================================
function getAlertInfo(order) {
  const alert = ALERTS.find(a => a.status === order.status)
  if (!alert || !order.createdAt) return null
  const diffDays = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  if (diffDays >= alert.days) return alert
  return null
}

const EMPTY_FORM = {
  name: '', mansion: '', room: '', phone: '', work: '',
  isInquiry: false, isGuided: false, isSuginami: false,
  keyNumber: '', clientName: '', clientPhone: '', clientAddress: '',
  maker: '', items: [], priceOverride: '',
}

const now2 = new Date()
const daysAgo = (d) => new Date(now2 - d * 24 * 60 * 60 * 1000).toISOString()
const SAMPLE_DATA = [
  { id: '1', status: 'order',    name: '田中 太郎', mansion: 'サンシャイン赤坂',  room: '302',  phone: '090-1234-5678', work: 'ディンプルキー複製 × 2', amount: '8800',  createdAt: daysAgo(8)  },
  { id: '2', status: 'arranged', name: '鈴木 花子', mansion: 'パークコート六本木', room: '1205', phone: '080-9876-5432', work: 'MIWA U9 シリンダー交換',  amount: '24800', createdAt: daysAgo(22) },
  { id: '3', status: 'arrived',  name: '佐藤 一郎', mansion: 'ライオンズ新宿',   room: '501',  phone: '070-1111-2222', work: 'カードキー追加 × 3枚',   amount: '15000', createdAt: daysAgo(9)  },
  { id: '4', status: 'appt',     name: '山田 美咲', mansion: 'ブリリア池袋',     room: '804',  phone: '090-3333-4444', work: 'スマートロック設置',      amount: '42000', createdAt: daysAgo(2)  },
  { id: '5', status: 'done',     name: '高橋 健太', mansion: 'プラウド渋谷',     room: '201',  phone: '080-5555-6666', work: 'ディンプルキー複製 × 1', amount: '4400',  createdAt: daysAgo(1)  },
]

function generateId()    { return Date.now().toString(36) + Math.random().toString(36).slice(2) }
function formatAmount(v) { if (!v) return '—'; return '¥' + Number(v).toLocaleString('ja-JP') }
function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function calcAmounts(items, priceOverride, taxIncluded) {
  if (priceOverride && priceOverride.startsWith('@')) {
    const val = Number(priceOverride.slice(1).replace(/,/g, ''))
    return { subtotal: val, tax: 0, total: val, isOverride: true }
  }
  const itemTotal = items.reduce((sum, it) => sum + (it.price * (it.qty || 1)), 0)
  const manualSubtotal = priceOverride !== '' ? Number(priceOverride.replace(/,/g, '')) : itemTotal
  const subtotal = isNaN(manualSubtotal) ? itemTotal : manualSubtotal
  if (taxIncluded) return { subtotal, tax: null, total: subtotal, isOverride: false, taxIncluded: true }
  const tax = Math.floor(subtotal * 0.1)
  return { subtotal, tax, total: subtotal + tax, isOverride: false, taxIncluded: false }
}

// ============================================================
// ログイン画面（アクセス申請フォーム付き）
// ============================================================
function LoginScreen({ onLogin }) {
  const [mode, setMode]       = useState('login') // 'login' | 'request'
  const [email, setEmail]     = useState('')
  const [pass, setPass]       = useState('')
  const [err, setErr]         = useState('')
  const [msg, setMsg]         = useState('')
  const [loading, setLoading] = useState(false)

  async function doLogin() {
    setErr(''); setMsg('')
    if (!email || !pass) { setErr('メールアドレスとパスワードを入力してください'); return }
    setLoading(true)
    try {
      const passHash = await sha256(pass)
      const json = await apiCall({ action: 'admin_login', email, passHash })
      if (json.status === 'ok' && json.token) {
        setToken(json.token)
        setRoleSession(json.role || 'staff')
        setUserEmail(email)
        onLogin(json.role || 'staff')
      } else {
        setErr(json.message || 'メールアドレスまたはパスワードが違います')
      }
    } catch (e) {
      setErr('接続エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  async function doRequest() {
    setErr(''); setMsg('')
    if (!email || !pass) { setErr('メールアドレスとパスワードを入力してください'); return }
    if (pass.length < 6) { setErr('パスワードは6文字以上で設定してください'); return }
    setLoading(true)
    try {
      const passHash = await sha256(pass)
      const json = await apiCall({ action: 'request_access', email, passHash })
      if (json.status === 'ok') {
        setMsg(json.message || '申請を受け付けました。管理者の承認をお待ちください。')
        setMode('login')
        setEmail(''); setPass('')
      } else {
        setErr(json.message || '申請に失敗しました')
      }
    } catch {
      setErr('接続エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(e) { if (e.key === 'Enter') { mode === 'login' ? doLogin() : doRequest() } }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo"><Key size={28} color="var(--accent)" /><span>一般受注管理</span></div>
        <div className="login-sub">CARLOCK HOMES ADMIN</div>

        {mode === 'login' ? (
          <>
            <input className="login-input" type="email"    placeholder="メールアドレス" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={onKeyDown} autoComplete="username" />
            <input className="login-input" type="password" placeholder="パスワード"     value={pass}  onChange={e => setPass(e.target.value)}  onKeyDown={onKeyDown} autoComplete="current-password" />
            <button className="login-btn" onClick={doLogin} disabled={loading}>
              {loading ? <Loader2 size={16} style={{animation:'spin 1s linear infinite'}} /> : <><Lock size={15} /> ログイン</>}
            </button>
            {err && <div className="login-err">{err}</div>}
            {msg && <div className="login-ok">{msg}</div>}
            <button className="login-sub-link" onClick={() => { setMode('request'); setErr(''); setMsg('') }}>
              アクセス申請はこちら
            </button>
          </>
        ) : (
          <>
            <div className="login-request-title">🔐 アクセス申請</div>
            <p className="login-request-note">申請後、管理者が承認するとログインできます</p>
            <input className="login-input" type="email"    placeholder="メールアドレス" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={onKeyDown} autoComplete="email" />
            <input className="login-input" type="password" placeholder="パスワード（6文字以上）" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={onKeyDown} autoComplete="new-password" />
            <button className="login-btn" onClick={doRequest} disabled={loading}>
              {loading ? <Loader2 size={16} style={{animation:'spin 1s linear infinite'}} /> : '申請する'}
            </button>
            {err && <div className="login-err">{err}</div>}
            <button className="login-sub-link" onClick={() => { setMode('login'); setErr('') }}>
              ← ログインに戻る
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTS
// ============================================================
function Badge({ count, color }) {
  if (count === 0) return null
  return <span style={{ background: color, color: '#fff', borderRadius: '50%', minWidth: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, fontFamily: 'Space Mono, monospace', boxShadow: `0 0 12px ${color}80`, padding: '0 6px' }}>{count}</span>
}

function StatusCard({ status, count, onClick, active }) {
  return (
    <button onClick={onClick} className="status-card" style={{ '--card-color': status.color, '--card-bg': status.bg, outline: active ? `2px solid ${status.color}` : 'none' }}>
      <div className="status-card-icon">{status.icon}</div>
      <div className="status-card-label">{status.label}</div>
      <div className="status-card-badge"><Badge count={count} color={status.color} /></div>
    </button>
  )
}

function AlertCard({ alert, count, onClick, active }) {
  return (
    <button onClick={onClick} className="alert-card" style={{ '--alert-color': alert.color, outline: active ? `2px solid ${alert.color}` : 'none', opacity: count === 0 ? 0.4 : 1 }}>
      <AlertTriangle size={14} color={alert.color} />
      <span className="alert-label">{alert.label}</span>
      {count > 0 && <Badge count={count} color={alert.color} />}
    </button>
  )
}

function OrderCard({ order, onStatusChange, onDelete, onEdit, onCancel, canDelete, canEdit, locks, userEmail, onLock, onUnlock }) {
  const [expanded, setExpanded]     = useState(false)
  const [mailSending, setMailSending] = useState(false)
  const [mailMsg, setMailMsg]       = useState('')
  const st = STATUSES.find(s => s.id === order.status) || STATUSES[1]
  const transitions = STATUS_TRANSITIONS[order.status] || []
  const alertInfo = getAlertInfo(order)
  const cardStyle = { '--card-color': st.color, '--card-bg': st.bg }
  const borderStyle = alertInfo ? { border: `2px solid ${alertInfo.borderColor}`, boxShadow: `0 0 10px ${alertInfo.borderColor}40` } : {}

  const lock          = locks && locks[order.id]
  const isLockedByOther = lock && lock.email !== userEmail
  const isLockedByMe    = lock && lock.email === userEmail

  // 電話番号フィールドにメアドが含まれているか判定
  const hasEmail = order.phone && order.phone.includes('@')

  function handleExpand() {
    if (!expanded) { onLock && onLock(order.id) }
    else           { onUnlock && onUnlock(order.id) }
    setExpanded(e => !e)
  }

  async function sendPaymentMail() {
    if (!hasEmail) return
    if (!confirm('決済案内メールを送信しますか？\n\n宛先: ' + order.phone)) return
    setMailSending(true)
    const res = await apiCall({
      action:  'send_payment_mail',
      id:      order.id,
      email:   order.phone,
      name:    order.name,
      mansion: order.mansion,
      room:    order.room,
      work:    order.work,
      items:   order.items || [],
      amount:  order.amount,
      paymentUrl: '', // Square実装後にURLを渡す
    })
    setMailSending(false)
    if (res.status === 'ok') {
      setMailMsg('✅ 送信しました')
    } else {
      setMailMsg('❌ ' + (res.message || '送信失敗'))
    }
    setTimeout(() => setMailMsg(''), 4000)
  }

  return (
    <div className="order-card" style={{ ...cardStyle, ...borderStyle, opacity: isLockedByOther ? 0.85 : 1 }}>
      {alertInfo && (
        <div className="alert-banner" style={{ background: alertInfo.color }}>
          <AlertTriangle size={12} /> {alertInfo.label}
        </div>
      )}
      {isLockedByOther && (
        <div className="alert-banner" style={{ background: '#7f8c8d' }}>
          🔒 {lock.email} が編集中です
        </div>
      )}
      {isLockedByMe && expanded && (
        <div className="alert-banner" style={{ background: '#2980b9' }}>
          ✏️ あなたが編集中
        </div>
      )}
      <div className="order-card-header" onClick={handleExpand}>
        <div className="order-card-left">
          <span className="order-status-dot" style={{ background: st.color }} />
          <div style={{minWidth:0}}>
            <div className="order-name">
              {order.status === 'inquiry' && <span className="inquiry-tag">問合せ</span>}
              {order.maker && <span className="maker-tag">{MAKERS.find(m=>m.id===order.maker)?.label || order.maker}</span>}
              <span style={{wordBreak:'break-all'}}>{order.name}</span>
            </div>
            <div className="order-sub" style={{fontSize:12}}>{order.mansion}{order.room ? '　'+order.room+'号室' : ''}</div>
            {order.phone && <div style={{fontSize:11,color:'var(--text-dim)',marginTop:2}}>{order.phone}</div>}
            {order.items && order.items.length > 0 && (
              <div className="order-items-preview">
                {order.items.slice(0,2).map(it => (
                  <span key={it.name} className="preview-chip">{it.name}{it.qty > 1 ? ` x${it.qty}` : ''}</span>
                ))}
                {order.items.length > 2 && <span className="preview-chip preview-chip-more">+{order.items.length - 2}件</span>}
              </div>
            )}
          </div>
        </div>
        <div className="order-card-right" style={{flexShrink:0,textAlign:'right'}}>
          <div className="order-amount">{formatAmount(order.amount)}</div>
          <div style={{fontSize:10,color:'var(--text-dim)',marginTop:1}}>税込</div>
          <ChevronRight size={16} style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-dim)', marginTop:4 }} />
        </div>
      </div>
      {expanded && (
        <div className="order-card-body">
          <div className="order-detail-grid">
            <div className="detail-row"><Phone size={13} /><span>{order.phone || '—'}</span></div>
            <div className="detail-row"><Building2 size={13} /><span>{order.mansion} {order.room ? order.room+'号室' : ''}</span></div>
            <div className="detail-row"><FileText size={13} /><span>{order.work || '—'}</span></div>
            {order.items && order.items.length > 0 ? (
              <div className="detail-row detail-row-items">
                <JapaneseYen size={13} />
                <div className="items-detail">
                  <div className="items-detail-title">
                    {order.maker && <span className="maker-tag">{MAKERS.find(m=>m.id===order.maker)?.label}</span>}
                    商品明細
                  </div>
                  {order.items.map(item => (
                    <div key={item.name} className="items-detail-row">
                      <span className="items-detail-name">{item.name}</span>
                      <span className="items-detail-qty">x{item.qty || 1}</span>
                      <span className="items-detail-price">¥{(item.price * (item.qty || 1)).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="items-detail-total">合計: <strong>¥{Number(order.amount).toLocaleString()}</strong></div>
                </div>
              </div>
            ) : (
              <div className="detail-row"><JapaneseYen size={13} /><span>{formatAmount(order.amount)}</span></div>
            )}
          </div>
          {(order.keyNumber || order.clientName || order.clientPhone || order.clientAddress) && (
            <div className="extra-info">
              <div className="extra-info-title">その他管理会社</div>
              <div className="order-detail-grid">
                {order.keyNumber    && <div className="detail-row"><span className="extra-label">キーナンバー:</span><span>{order.keyNumber}</span></div>}
                {order.clientName   && <div className="detail-row"><span className="extra-label">ご依頼主様:</span><span>{order.clientName}</span></div>}
                {order.clientPhone  && <div className="detail-row"><span className="extra-label">電話番号:</span><span>{order.clientPhone}</span></div>}
                {order.clientAddress && <div className="detail-row"><span className="extra-label">ご住所:</span><span>{order.clientAddress}</span></div>}
              </div>
            </div>
          )}
          <div className="order-date">登録: {formatDate(order.createdAt)}</div>
          <div className="order-actions">
            <div className="transition-buttons">
              {transitions.map(toId => {
                const to = STATUSES.find(s => s.id === toId)
                return (
                  <button key={toId} className="transition-btn" style={{ '--t-color': to.color }} onClick={() => onStatusChange(order.id, toId)}>
                    <ArrowRight size={12} />{to.label}へ
                  </button>
                )
              })}
            </div>
            <div className="card-controls">
              {canEdit && <button className="ctrl-btn edit" onClick={() => onEdit(order)} disabled={isLockedByOther}>編集</button>}
              {order.status !== 'done' && order.status !== 'cancelled' && (
                <button className="ctrl-btn done" onClick={() => onStatusChange(order.id, 'done')}>✅ 完了</button>
              )}
              {order.status !== 'cancelled' && (
                <button className="ctrl-btn cancel" onClick={() => onCancel(order.id)}>❌ キャンセル</button>
              )}
              {canDelete && <button className="ctrl-btn del" onClick={() => onDelete(order.id)}>削除</button>}
              {hasEmail && (
                <button
                  className="ctrl-btn"
                  style={{background:'rgba(52,152,219,0.15)',color:'#3498db',borderColor:'rgba(52,152,219,0.3)'}}
                  onClick={sendPaymentMail}
                  disabled={mailSending}
                >
                  {mailSending ? <Loader2 size={12} style={{animation:'spin 1s linear infinite'}} /> : '📧 決済案内'}
                </button>
              )}
              {mailMsg && <span style={{fontSize:11,color: mailMsg.startsWith('✅') ? '#27ae60' : '#e74c3c'}}>{mailMsg}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function isStandardKey(name) {
  return name === '標準キー' || name === 'F22 標準キー' || name === 'T20 標準キー'
}

function shouldShowKeyNumber(maker, items) {
  if (maker !== 'miwa' && maker !== 'goal') return false
  return items.some(it => isStandardKey(it.name))
}

function ItemSelector({ maker, items, onChange }) {
  const [selectedKey, setSelectedKey] = useState('')
  const [customName, setCustomName]   = useState('')
  const [customPrice, setCustomPrice] = useState('')
  const groups   = MAKER_PRODUCTS[maker] || []
  const allItems = groups.flatMap(g => g.items.map(i => ({ ...i, group: g.group })))

  function addFromSelect() {
    if (!selectedKey) return
    const product = allItems.find(i => i.name === selectedKey)
    if (!product) return
    const existing = items.find(i => i.name === product.name)
    if (existing) onChange(items.map(i => i.name === product.name ? { ...i, qty: i.qty + 1 } : i))
    else          onChange([...items, { name: product.name, price: product.price, qty: 1 }])
    setSelectedKey('')
  }

  function addCustom() {
    if (!customName.trim() || !customPrice) return
    const price = Number(customPrice)
    if (isNaN(price)) return
    const existing = items.find(i => i.name === customName.trim())
    if (existing) onChange(items.map(i => i.name === customName.trim() ? { ...i, qty: i.qty + 1 } : i))
    else          onChange([...items, { name: customName.trim(), price, qty: 1 }])
    setCustomName(''); setCustomPrice('')
  }

  function updateQty(name, qty) {
    if (qty <= 0) { onChange(items.filter(i => i.name !== name)); return }
    onChange(items.map(i => i.name === name ? { ...i, qty } : i))
  }

  return (
    <div className="item-selector">
      {groups.length > 0 && (
        <div className="item-add-row">
          <select name="product-select" value={selectedKey} onChange={e => setSelectedKey(e.target.value)} className="product-select">
            <option value="">商品を選択...</option>
            {groups.map(g => (
              <optgroup key={g.group} label={g.group}>
                {g.items.map(p => <option key={p.name} value={p.name}>{p.name}（¥{p.price.toLocaleString()}）</option>)}
              </optgroup>
            ))}
          </select>
          <button type="button" className="btn-add-item" onClick={addFromSelect} disabled={!selectedKey}><Plus size={14} /> 追加</button>
        </div>
      )}
      <div className="custom-item-row">
        <input name="custom-name" className="custom-name-input" placeholder="商品名を手入力..." value={customName} onChange={e => setCustomName(e.target.value)} autoComplete="off" />
        <input name="custom-price" className="custom-price-input" placeholder="価格" type="number" min="0" value={customPrice} onChange={e => setCustomPrice(e.target.value)} autoComplete="off" />
        <button type="button" className="btn-add-item" onClick={addCustom} disabled={!customName.trim() || !customPrice}><Plus size={14} /> 追加</button>
      </div>
      {items.length > 0 && (
        <div className="item-list">
          {items.map(item => (
            <div key={item.name} className="item-row">
              <span className="item-name">{item.name}</span>
              <span className="item-unit-price">¥{item.price.toLocaleString()}</span>
              <div className="item-qty-ctrl">
                <button type="button" onClick={() => updateQty(item.name, item.qty - 1)}>－</button>
                <span>{item.qty}</span>
                <button type="button" onClick={() => updateQty(item.name, item.qty + 1)}>＋</button>
              </div>
              <span className="item-subtotal">¥{(item.price * item.qty).toLocaleString()}</span>
              <button type="button" className="item-remove" onClick={() => onChange(items.filter(i => i.name !== item.name))}><X size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OrderForm({ initial, onSave, onCancel }) {
  const [form, setForm]       = useState({ ...(initial || EMPTY_FORM), items: initial?.items || [], priceOverride: initial?.priceOverride || '', maker: initial?.maker || '' })
  const [showExtra, setShowExtra] = useState(!!(initial?.keyNumber || initial?.clientName || initial?.clientPhone || initial?.clientAddress))
  const makerObj      = MAKERS.find(m => m.id === form.maker)
  const taxIncluded   = makerObj?.taxIncluded || false
  const showKeyNumber = shouldShowKeyNumber(form.maker, form.items)
  const { subtotal, tax, total, isOverride, taxIncluded: isTaxIncluded } = calcAmounts(form.items, form.priceOverride, taxIncluded)

  function handle(e) {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    if (e.target.name === 'maker') { setForm(f => ({ ...f, maker: val, items: [], priceOverride: '' })); return }
    setForm(f => ({ ...f, [e.target.name]: val }))
  }

  function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return alert('氏名を入力してください')
    onSave({ ...form, amount: String(total) })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{initial ? '受注編集' : '新規受注'}</h2>
          <button className="modal-close" onClick={onCancel}><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="order-form">
          <div className="inquiry-toggle">
            <label className="toggle-label">
              <input type="checkbox" name="isInquiry" checked={form.isInquiry || false} onChange={e => { handle(e); if (e.target.checked) setForm(f => ({ ...f, isGuided: false, isSuginami: false })) }} />
              <span>💬 お問合せセクションとして登録</span>
            </label>
            <label className="toggle-label" style={{marginTop:6}}>
              <input type="checkbox" name="isGuided" checked={form.isGuided || false} onChange={e => { handle(e); if (e.target.checked) setForm(f => ({ ...f, isInquiry: false, isSuginami: false })) }} />
              <span>📋 案内済みとして登録</span>
            </label>
            <label className="toggle-label" style={{marginTop:6}}>
              <input type="checkbox" name="isSuginami" checked={form.isSuginami || false} onChange={e => { handle(e); if (e.target.checked) setForm(f => ({ ...f, isInquiry: false, isGuided: false })) }} />
              <span>🏢 杉並本社（受付）として登録</span>
            </label>
            <p className="toggle-note">チェックなしの場合は受注セクションで処理されます</p>
          </div>
          <label>氏名 <span className="req">*</span><input name="name" value={form.name} onChange={handle} placeholder="田中 太郎" required /></label>
          <div className="form-row">
            <label>マンション名<input name="mansion" value={form.mansion} onChange={handle} placeholder="○○マンション" /></label>
            <label style={{flex:'0 0 120px'}}>部屋番号<input name="room" value={form.room} onChange={handle} placeholder="101" /></label>
          </div>
          <label>電話番号<input name="phone" value={form.phone} onChange={handle} placeholder="090-0000-0000" type="tel" /></label>
          <label>作業内容<textarea name="work" value={form.work} onChange={handle} placeholder="作業内容を入力..." rows={2} /></label>
          <div className="form-section-title">メーカー・商品選択</div>
          <div className="maker-tabs">
            {MAKERS.map(m => (
              <button key={m.id} type="button" className={`maker-tab ${form.maker === m.id ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, maker: m.id, items: [], priceOverride: '' }))}>
                {m.label}{m.taxIncluded && <span className="tax-badge">税込</span>}
              </button>
            ))}
          </div>
          {form.maker ? <ItemSelector maker={form.maker} items={form.items} onChange={items => setForm(f => ({ ...f, items }))} /> : <div className="maker-hint">↑ メーカーを選択すると商品を追加できます</div>}
          {showKeyNumber && (
            <div className="keynumber-section">
              <label className="keynumber-label">
                🔑 キーナンバー <span className="req">*</span>
                <input name="keyNumber" value={form.keyNumber} onChange={handle} placeholder="例: KY-1234" className="keynumber-input" autoComplete="off" />
              </label>
              <p className="keynumber-hint">標準キーの複製に必要なキーナンバーを入力してください</p>
            </div>
          )}
          <div className="price-summary">
            {isTaxIncluded && <div className="tax-included-notice">💡 シブタニは税込み価格のため消費税計算をスキップします</div>}
            <div className="price-row">
              <label className="price-label">
                {isTaxIncluded ? '税込み合計（直接入力可・@で固定）' : '税抜き合計（直接入力可・@で固定）'}
                <input name="priceOverride" value={form.priceOverride} onChange={handle} placeholder={`¥${subtotal.toLocaleString()}（自動計算）`} className="price-input" />
              </label>
              <label className="price-label">
                {isTaxIncluded ? '請求金額（税込）' : '税込み金額（自動計算）'}
                <div className="price-display" style={{ color: isOverride ? '#e67e22' : 'var(--accent)' }}>
                  ¥{total.toLocaleString()}
                  {isOverride && <span className="override-badge">固定</span>}
                  {isTaxIncluded && !isOverride && <span className="override-badge" style={{background:'#3498db'}}>税込</span>}
                </div>
              </label>
            </div>
            {!isOverride && !isTaxIncluded && subtotal > 0 && <div className="tax-detail">税抜き ¥{subtotal.toLocaleString()} ＋ 消費税10% ¥{tax.toLocaleString()} ＝ 税込み ¥{total.toLocaleString()}</div>}
          </div>
          <div className="extra-section">
            <button type="button" className="extra-toggle-btn" onClick={() => setShowExtra(v => !v)}>
              <ChevronRight size={14} style={{ transform: showExtra ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              その他管理会社（任意）
            </button>
            {showExtra && (
              <div className="extra-fields">
                <label>ご依頼主様<input  name="clientName"    value={form.clientName}    onChange={handle} placeholder="管理会社名など" /></label>
                <label>電話番号<input    name="clientPhone"   value={form.clientPhone}   onChange={handle} placeholder="03-0000-0000" /></label>
                <label>ご住所<input      name="clientAddress" value={form.clientAddress} onChange={handle} placeholder="東京都○○区..." /></label>
              </div>
            )}
          </div>
          <div className="form-buttons">
            <button type="button" className="btn-cancel" onClick={onCancel}>キャンセル</button>
            <button type="submit" className="btn-save">{initial ? '更新する' : '受注登録'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================================
// 売上タブ
// ============================================================
function SalesTab({ allOrders, salesFrom, salesTo, setSalesFrom, setSalesTo }) {
  const filtered = allOrders.filter(o => {
    if (o.status !== 'done') return false
    if (!o.createdAt) return false
    const d = o.createdAt.slice(0,10)
    return d >= salesFrom && d <= salesTo
  })
  const salesData = filtered.map(o => {
    const amount     = Number(o.amount) || 0
    const taxIncAmt  = amount
    const taxExAmt   = Math.round(amount / 1.1)
    const tax        = taxIncAmt - taxExAmt
    const purchaseItems = (o.items || []).filter(it => {
      const n = it.name || ''
      return !n.includes('作業費') && !n.includes('手数料') && !n.includes('出張費') && !n.includes('事務') && !n.includes('送料')
    })
    const purchaseTotal = purchaseItems.reduce((s, it) => s + (it.price * (it.qty || 1)), 0)
    return { ...o, taxIncAmt, taxExAmt, tax, purchaseItems, purchaseTotal }
  })
  const totalTaxInc   = salesData.reduce((s, o) => s + o.taxIncAmt, 0)
  const totalTaxEx    = salesData.reduce((s, o) => s + o.taxExAmt, 0)
  const totalTax      = salesData.reduce((s, o) => s + o.tax, 0)
  const totalPurchase = salesData.reduce((s, o) => s + o.purchaseTotal, 0)
  const itemMap = {}
  salesData.forEach(o => {
    (o.items || []).forEach(it => {
      if (!it.name) return
      if (!itemMap[it.name]) itemMap[it.name] = { name: it.name, price: it.price, qty: 0, total: 0 }
      itemMap[it.name].qty   += (it.qty || 1)
      itemMap[it.name].total += it.price * (it.qty || 1)
    })
  })
  const itemList = Object.values(itemMap).sort((a,b) => b.total - a.total)

  async function exportExcel() {
    const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')
    const wb = XLSX.utils.book_new()
    const summaryData = [
      ['カーロックホームズ 売上レポート'],
      ['期間', `${salesFrom} ～ ${salesTo}`],
      ['対象件数', filtered.length + '件'],
      [],
      ['項目', '金額'],
      ['税込み売上', totalTaxInc],
      ['税抜き売上', totalTaxEx],
      ['消費税合計', totalTax],
      ['仕入れ合計（商品のみ）', totalPurchase],
      ['粗利（税抜き－仕入れ）', totalTaxEx - totalPurchase],
    ]
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
    wsSummary['!cols'] = [{wch:30},{wch:20}]
    XLSX.utils.book_append_sheet(wb, wsSummary, 'サマリー')
    const months = {}
    salesData.forEach(o => {
      const m = (o.createdAt || '').slice(0,7)
      if (!months[m]) months[m] = []
      months[m].push(o)
    })
    Object.entries(months).sort().forEach(([month, rows]) => {
      const header = ['受注ID','氏名','マンション','部屋','メーカー','作業内容','税込金額','税抜金額','消費税','仕入れ合計','登録日']
      const data = [header, ...rows.map(o => [
        o.id, o.name, o.mansion, o.room ? o.room+'号室' : '',
        MAKERS.find(m=>m.id===o.maker)?.label || o.maker || '',
        o.work, o.taxIncAmt, o.taxExAmt, o.tax, o.purchaseTotal,
        (o.createdAt || '').slice(0,10)
      ])]
      const ws = XLSX.utils.aoa_to_sheet(data)
      ws['!cols'] = [{wch:20},{wch:12},{wch:20},{wch:8},{wch:12},{wch:30},{wch:12},{wch:12},{wch:10},{wch:12},{wch:12}]
      XLSX.utils.book_append_sheet(wb, ws, month)
    })
    const itemHeader = ['商品名','単価','数量','合計金額']
    const itemData = [itemHeader, ...itemList.map(it => [it.name, it.price, it.qty, it.total])]
    const wsItems = XLSX.utils.aoa_to_sheet(itemData)
    wsItems['!cols'] = [{wch:35},{wch:12},{wch:8},{wch:12}]
    XLSX.utils.book_append_sheet(wb, wsItems, '商品別仕入れ')
    XLSX.writeFile(wb, `売上レポート_${salesFrom}_${salesTo}.xlsx`)
  }

  return (
    <div className="settings-section">
      <div className="settings-title">売上集計（完了分）</div>
      <div className="sales-period-row">
        <div className="sales-period-item"><span className="sales-period-label">開始日</span><input type="date" className="settings-input" value={salesFrom} onChange={e => setSalesFrom(e.target.value)} /></div>
        <span className="sales-period-sep">〜</span>
        <div className="sales-period-item"><span className="sales-period-label">終了日</span><input type="date" className="settings-input" value={salesTo} onChange={e => setSalesTo(e.target.value)} /></div>
      </div>
      <div className="sales-quick-btns">
        {[
          { label: '今月', fn: () => { const d = new Date(); const f = new Date(d.getFullYear(), d.getMonth(), 1); setSalesFrom(f.toISOString().slice(0,10)); setSalesTo(d.toISOString().slice(0,10)) }},
          { label: '先月', fn: () => { const d = new Date(); const f = new Date(d.getFullYear(), d.getMonth()-1, 1); const t = new Date(d.getFullYear(), d.getMonth(), 0); setSalesFrom(f.toISOString().slice(0,10)); setSalesTo(t.toISOString().slice(0,10)) }},
          { label: '今年', fn: () => { const d = new Date(); setSalesFrom(`${d.getFullYear()}-01-01`); setSalesTo(d.toISOString().slice(0,10)) }},
          { label: '全期間', fn: () => { setSalesFrom('2020-01-01'); setSalesTo(new Date().toISOString().slice(0,10)) }},
        ].map(b => <button key={b.label} className="sales-quick-btn" onClick={b.fn}>{b.label}</button>)}
      </div>
      {filtered.length === 0 ? (
        <div className="deleted-empty">期間内に完了した受注がありません</div>
      ) : (
        <>
          <div className="sales-summary-grid">
            <div className="sales-card"><div className="sales-card-label">対象件数</div><div className="sales-card-value">{filtered.length}<span className="sales-card-unit">件</span></div></div>
            <div className="sales-card"><div className="sales-card-label">税込み売上</div><div className="sales-card-value sales-card-accent">¥{totalTaxInc.toLocaleString()}</div></div>
            <div className="sales-card"><div className="sales-card-label">税抜き売上</div><div className="sales-card-value">¥{totalTaxEx.toLocaleString()}</div></div>
            <div className="sales-card"><div className="sales-card-label">消費税</div><div className="sales-card-value sales-card-dim">¥{totalTax.toLocaleString()}</div></div>
            <div className="sales-card"><div className="sales-card-label">仕入れ合計</div><div className="sales-card-value sales-card-warn">¥{totalPurchase.toLocaleString()}</div></div>
            <div className="sales-card"><div className="sales-card-label">粗利</div><div className="sales-card-value sales-card-profit">¥{(totalTaxEx - totalPurchase).toLocaleString()}</div></div>
          </div>
          {itemList.length > 0 && (
            <div style={{marginTop:16}}>
              <div className="settings-title" style={{fontSize:12}}>商品別仕入れ</div>
              <div className="deleted-list">
                {itemList.slice(0,10).map(it => (
                  <div key={it.name} className="deleted-row">
                    <div className="deleted-info"><div className="deleted-name">{it.name}</div><div className="deleted-sub">¥{it.price.toLocaleString()} × {it.qty}個</div></div>
                    <div style={{fontWeight:700,color:'var(--accent)'}}>¥{it.total.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button className="btn-save" style={{marginTop:16,width:'100%'}} onClick={exportExcel}>📥 Excelでエクスポート</button>
        </>
      )}
    </div>
  )
}

// ============================================================
// ユーザー管理タブ（master専用）
// ============================================================
function UsersTab() {
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [msg, setMsg]           = useState('')
  const [msgType, setMsgType]   = useState('ok') // 'ok' | 'err'
  // 直接追加フォーム
  const [addEmail, setAddEmail] = useState('')
  const [addRole,  setAddRole]  = useState('staff')
  const [addLoading, setAddLoading] = useState(false)
  const [generatedPass, setGeneratedPass] = useState('')

  useEffect(() => {
    apiCall({ action: 'get_users' }).then(res => {
      setUsers(res.users || [])
      setLoading(false)
    })
  }, [])

  function showMsg(text, type = 'ok') {
    setMsg(text); setMsgType(type)
    setTimeout(() => setMsg(''), 4000)
  }

  async function addUser() {
    if (!addEmail.trim()) { showMsg('メールアドレスを入力してください', 'err'); return }
    setAddLoading(true); setGeneratedPass('')
    const res = await apiCall({ action: 'add_user', email: addEmail.trim(), role: addRole })
    setAddLoading(false)
    if (res.status === 'ok') {
      setGeneratedPass(res.password)
      setUsers(prev => [...prev, { email: addEmail.trim(), role: addRole, approved: 'TRUE', createdAt: new Date().toISOString() }])
      setAddEmail('')
      showMsg(addEmail.trim() + ' を追加しました', 'ok')
    } else {
      showMsg(res.message || '追加に失敗しました', 'err')
    }
  }

  async function approve(email, role) {
    const res = await apiCall({ action: 'approve_user', email, role })
    if (res.status === 'ok') {
      showMsg(email + ' を承認しました')
      setUsers(prev => prev.map(u => u.email === email ? { ...u, approved: 'TRUE', role } : u))
    } else { showMsg(res.message || '失敗しました', 'err') }
  }

  async function reject(email) {
    if (!confirm(email + ' を削除しますか？')) return
    const res = await apiCall({ action: 'reject_user', email })
    if (res.status === 'ok') {
      setUsers(prev => prev.filter(u => u.email !== email))
      showMsg(email + ' を削除しました')
    } else { showMsg(res.message || '失敗しました', 'err') }
  }

  const pending       = users.filter(u => u.approved !== 'TRUE')
  const approved      = users.filter(u => u.approved === 'TRUE')
  const masterCount   = approved.filter(u => u.role === 'master').length + 1 // +1はスクリプトプロパティのmaster
  const masterMaxed   = masterCount >= 3

  if (loading) return <div className="deleted-empty"><Loader2 size={18} style={{animation:'spin 1s linear infinite'}} /> 読み込み中...</div>

  return (
    <div className="settings-section">
      {msg && <div className="settings-save-msg" style={{background: msgType === 'err' ? 'rgba(231,76,60,0.15)' : undefined, color: msgType === 'err' ? '#e74c3c' : undefined}}>{msg}</div>}

      {/* 直接追加フォーム */}
      <div className="settings-title">➕ ユーザーを直接追加</div>
      <div style={{display:'flex',gap:8,marginBottom:8,flexWrap:'wrap'}}>
        <input
          className="settings-input"
          style={{flex:'1 1 180px'}}
          type="email"
          placeholder="メールアドレス"
          value={addEmail}
          onChange={e => setAddEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addUser()}
          autoComplete="off"
        />
        <select
          className="settings-input"
          style={{flex:'0 0 130px'}}
          value={addRole}
          onChange={e => setAddRole(e.target.value)}
        >
          <option value="staff">スタッフ</option>
          <option value="sales">売上管理</option>
          <option value="master" disabled={masterMaxed}>
            マスター{masterMaxed ? '（上限3人）' : ''}
          </option>
        </select>
        <button className="btn-save" style={{flex:'0 0 80px'}} onClick={addUser} disabled={addLoading}>
          {addLoading ? <Loader2 size={14} style={{animation:'spin 1s linear infinite'}} /> : '追加'}
        </button>
      </div>
      <p className="settings-desc">パスワードは自動生成（12桁）され画面に1度だけ表示されます。本人への連絡はメールまたは口頭で行ってください。</p>

      {/* 生成パスワード表示 */}
      {generatedPass && (
        <div style={{background:'rgba(39,174,96,0.12)',border:'1px solid #27ae60',borderRadius:8,padding:'12px 16px',marginBottom:12}}>
          <div style={{fontSize:12,color:'#27ae60',marginBottom:4}}>✅ 生成されたパスワード（1度だけ表示）</div>
          <div style={{fontFamily:'monospace',fontSize:20,fontWeight:700,letterSpacing:3,color:'#fff'}}>{generatedPass}</div>
          <button
            style={{marginTop:8,fontSize:12,padding:'4px 12px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:4,color:'#fff',cursor:'pointer'}}
            onClick={() => { navigator.clipboard?.writeText(generatedPass); showMsg('コピーしました') }}
          >📋 コピー</button>
        </div>
      )}

      {/* マスター数表示 */}
      <div style={{fontSize:12,color:'var(--text-dim)',marginBottom:12}}>
        マスター: {masterCount}/3人
      </div>

      {/* 承認待ち */}
      {pending.length > 0 && (
        <>
          <div className="settings-title" style={{color:'#e67e22'}}>⏳ 承認待ち ({pending.length}件)</div>
          <div className="deleted-list">
            {pending.map(u => (
              <div key={u.email} className="deleted-row">
                <div className="deleted-info">
                  <div className="deleted-name">{u.email}</div>
                  <div className="deleted-sub">{formatDate(u.createdAt)} 申請</div>
                </div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  <button className="restore-btn" style={{background:'rgba(39,174,96,0.15)',color:'#27ae60'}} onClick={() => approve(u.email, 'staff')}><Check size={13}/> スタッフ</button>
                  <button className="restore-btn" style={{background:'rgba(52,152,219,0.15)',color:'#3498db'}} onClick={() => approve(u.email, 'sales')}><Check size={13}/> 売上管理</button>
                  {!masterMaxed && <button className="restore-btn" style={{background:'rgba(155,89,182,0.15)',color:'#9b59b6'}} onClick={() => approve(u.email, 'master')}><Check size={13}/> マスター</button>}
                  <button className="restore-btn" style={{background:'rgba(231,76,60,0.15)',color:'#e74c3c'}} onClick={() => reject(u.email)}><XCircle size={13}/> 却下</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 承認済み */}
      {approved.length > 0 && (
        <>
          <div className="settings-title" style={{marginTop:16}}>✅ 承認済みユーザー ({approved.length}人)</div>
          <div className="deleted-list">
            {approved.map(u => (
              <div key={u.email} className="deleted-row">
                <div className="deleted-info">
                  <div className="deleted-name">{u.email}</div>
                  <div className="deleted-sub">{ROLE_LABELS[u.role] || u.role} · {formatDate(u.createdAt)} 登録</div>
                </div>
                <button className="restore-btn" style={{background:'rgba(231,76,60,0.15)',color:'#e74c3c'}} onClick={() => reject(u.email)}><XCircle size={13}/> 削除</button>
              </div>
            ))}
          </div>
        </>
      )}
      {users.length === 0 && pending.length === 0 && <div className="deleted-empty">登録ユーザーはいません</div>}
    </div>
  )
}

// ============================================================
// 設定モーダル（ロール対応）
// ============================================================
const GAS_CONFIG_KEY = 'gas_url'

function SettingsModal({ role, onClose, onLogout, deletedOrders, onRestore, allOrders }) {
  const defaultTab = role === 'master' ? 'gas' : can(role, 'sales') ? 'sales' : 'deleted'
  const [tab, setTab]             = useState(defaultTab)
  const [salesFrom, setSalesFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0,10) })
  const [salesTo, setSalesTo]     = useState(() => new Date().toISOString().slice(0,10))
  const [saveMsg, setSaveMsg]     = useState('')

  // GASタブ用
  const [gasUrl, setGasUrl]           = useState(() => { try { return localStorage.getItem(GAS_CONFIG_KEY) || '' } catch { return '' } })
  const [testStatus, setTestStatus]   = useState('')
  const [testLoading, setTestLoading] = useState(false)

  function showMsg(msg) { setSaveMsg(msg); setTimeout(() => setSaveMsg(''), 3000) }

  async function testWorker() {
    setTestLoading(true); setTestStatus('')
    try {
      const res = await fetch(WORKER_URL + '?action=ping')
      const data = await res.json()
      setTestStatus(data.status === 'ok' ? 'success' : 'error')
    } catch { setTestStatus('error') }
    finally { setTestLoading(false) }
  }

  function saveGasUrl() {
    try { localStorage.setItem(GAS_CONFIG_KEY, gasUrl) } catch {}
    showMsg('✅ GAS URLを保存しました')
  }

  const tabs = [
    role === 'master'     && { id: 'gas',     label: '⚙️ GAS設定' },
    can(role, 'users')    && { id: 'users',   label: '👥 ユーザー' },
    can(role, 'sales')    && { id: 'sales',   label: '📊 売上' },
    can(role, 'restore')  && { id: 'deleted', label: `🗑️ 削除済み${deletedOrders.length > 0 ? ` (${deletedOrders.length})` : ''}` },
  ].filter(Boolean)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:580}}>
        <div className="modal-header">
          <h2>設定</h2>
          <div style={{display:'flex',gap:8}}>
            <button className="logout-btn" onClick={onLogout}><LogOut size={14} /> ログアウト</button>
            <button className="modal-close" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {tabs.length > 0 && (
          <div className="settings-tabs">
            {tabs.map(t => <button key={t.id} className={`settings-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>)}
          </div>
        )}

        <div style={{padding:'20px 24px 24px'}}>
          {saveMsg && <div className="settings-save-msg">{saveMsg}</div>}

          {tab === 'gas' && (
            <div className="settings-section">
              <div className="settings-title">GAS URL（参照・接続確認用）</div>
              <p className="settings-desc">実際の通信はCloudflare Worker経由です。このURLは記録・テスト用です。</p>
              <input
                value={gasUrl}
                onChange={e => setGasUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/..."
                className="settings-input"
                autoComplete="off"
              />
              <div style={{display:'flex',gap:8,marginTop:8}}>
                <button className="btn-cancel" style={{flex:1}} onClick={testWorker} disabled={testLoading}>
                  {testLoading ? <Loader2 size={14} style={{animation:'spin 1s linear infinite'}} /> : 'Worker接続テスト'}
                </button>
                <button className="btn-save" style={{flex:1}} onClick={saveGasUrl}>保存</button>
              </div>
              {testStatus === 'success' && <p style={{color:'#27ae60',fontSize:13,marginTop:8}}>✓ Worker接続成功</p>}
              {testStatus === 'error'   && <p style={{color:'#e74c3c',fontSize:13,marginTop:8}}>✗ 接続失敗</p>}
              <div style={{marginTop:16,padding:'12px',background:'rgba(255,165,0,0.08)',borderRadius:6,fontSize:12,color:'var(--text-dim)'}}>
                ℹ️ APIキー・DropboxトークンはCloudflare環境変数で管理。パスワード・ソルトはGASスクリプトプロパティで管理。
              </div>
            </div>
          )}
          {tab === 'users'   && <UsersTab />}
          {tab === 'sales'   && <SalesTab allOrders={allOrders} salesFrom={salesFrom} salesTo={salesTo} setSalesFrom={setSalesFrom} setSalesTo={setSalesTo} />}
          {tab === 'deleted' && (
            <div className="settings-section">
              <div className="settings-title">削除済み受注</div>
              {deletedOrders.length === 0 ? (
                <div className="deleted-empty">削除済みの受注はありません</div>
              ) : (
                <div className="deleted-list">
                  {deletedOrders.map(o => (
                    <div key={o.id} className="deleted-row">
                      <div className="deleted-info">
                        <div className="deleted-name">{o.name}</div>
                        <div className="deleted-sub">{o.mansion} {o.room ? o.room+'号室' : ''} · {formatDate(o.deletedAt || o.createdAt)}</div>
                      </div>
                      <button className="restore-btn" onClick={() => onRestore(o.id)}>
                        <RotateCcw size={13} /> 復元
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {tabs.length === 0 && <div className="deleted-empty">アクセス可能な設定がありません</div>}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [authed, setAuthed]   = useState(() => !!getToken())
  const [role,   setRole]     = useState(() => getRoleSession())
  const [orders, setOrders]   = useState(() => { try { const s = localStorage.getItem('key_orders'); return s ? JSON.parse(s) : SAMPLE_DATA } catch { return SAMPLE_DATA } })
  const [deletedOrders, setDeletedOrders] = useState([])
  const [activeStatus, setActiveStatus]   = useState(null)
  const [activeAlert,  setActiveAlert]    = useState(null)
  const [showForm,     setShowForm]       = useState(false)
  const [editingOrder, setEditingOrder]   = useState(null)
  const [showSettings, setShowSettings]   = useState(false)
  const [syncing,      setSyncing]        = useState(false)
  const [lastSync,     setLastSync]       = useState(null)
  const [syncError,    setSyncError]      = useState('')
  const [search,       setSearch]         = useState('')
  const [loading,      setLoading]        = useState(true)
  const [locks,        setLocks]          = useState({}) // { orderId: { email, lockedAt } }

  // 受注データをlocalStorageにキャッシュ
  useEffect(() => { localStorage.setItem('key_orders', JSON.stringify(orders)) }, [orders])

  // ログイン後：GASからデータ取得（60秒ポーリング）
  useEffect(() => {
    if (!authed) { setLoading(false); return }
    const startTime = Date.now()
    const finishLoading = () => {
      const remain = Math.max(0, 1500 - (Date.now() - startTime))
      setTimeout(() => setLoading(false), remain)
    }
    const safetyTimer = setTimeout(() => setLoading(false), 5000)

    Promise.all([
      fetchOrders(),
      fetchDeletedOrders(),
    ]).then(([remote, deleted]) => {
      if (remote && remote.length > 0) { setOrders(remote); setLastSync(new Date()) }
      if (deleted) setDeletedOrders(deleted)
      finishLoading(); clearTimeout(safetyTimer)
    }).catch(() => { finishLoading(); clearTimeout(safetyTimer) })

    const timer = setInterval(() => {
      fetchOrders().then(remote => {
        if (remote && remote.length > 0) { setOrders(remote); setLastSync(new Date()) }
      })
    }, 60000)
    return () => clearInterval(timer)
  }, [authed])

  // ロック状態ポーリング（15秒）
  useEffect(() => {
    if (!authed) return
    const fetchLocks = () => {
      apiCall({ action: 'get_locks' }).then(res => {
        if (res.status === 'ok') setLocks(res.locks || {})
      })
    }
    fetchLocks()
    const t = setInterval(fetchLocks, 15000)
    return () => clearInterval(t)
  }, [authed])

  // lock / unlock 関数
  async function lockOrder(orderId) {
    await apiCall({ action: 'lock_order', id: orderId })
    apiCall({ action: 'get_locks' }).then(res => { if (res.status === 'ok') setLocks(res.locks || {}) })
  }
  async function unlockOrder(orderId) {
    await apiCall({ action: 'unlock_order', id: orderId })
    setLocks(prev => { const n = {...prev}; delete n[orderId]; return n })
  }

  // ページ離脱時に全ロック解除
  useEffect(() => {
    const handleUnload = () => {
      Object.keys(locks).forEach(id => {
        if (locks[id]?.email === getUserEmail()) {
          navigator.sendBeacon && navigator.sendBeacon(WORKER_URL,
            JSON.stringify({ action: 'unlock_order', id, token: getToken(), userEmail: getUserEmail() })
          )
        }
      })
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [locks])
  useEffect(() => {
    if (!syncError) return
    const t = setTimeout(() => setSyncError(''), 5000)
    return () => clearTimeout(t)
  }, [syncError])

  function handleLogin(newRole) {
    setRole(newRole)
    setAuthed(true)
  }

  function handleLogout() {
    clearToken(); clearRoleSession(); clearUserEmail()
    setAuthed(false); setRole('')
    setShowSettings(false)
  }

  async function pullFromGAS() {
    setSyncing(true)
    const remote = await fetchOrders()
    if (remote) { setOrders(remote); setLastSync(new Date()) }
    setSyncing(false)
  }

  // 新規受注（個別POST → GAS直接書き込み）
  async function addOrder(form) {
    const status   = form.isSuginami ? 'suginami' : form.isGuided ? 'guided' : form.isInquiry ? 'inquiry' : 'order'
    const newOrder = { ...form, id: generateId(), status, createdAt: new Date().toISOString() }
    setOrders(prev => [newOrder, ...prev])
    setShowForm(false)
    const res = await apiCall({ action: 'admin_add_order', ...newOrder })
    if (res.status !== 'ok') {
      setSyncError('受注の保存に失敗しました: ' + (res.message || ''))
      setOrders(prev => prev.filter(o => o.id !== newOrder.id))
    } else {
      setLastSync(new Date())
    }
  }

  // 受注編集（全フィールド更新）
  async function updateOrder(form) {
    const updated = { ...editingOrder, ...form }
    const prev = orders
    setOrders(orders.map(o => o.id === editingOrder.id ? updated : o))
    setEditingOrder(null)
    const res = await apiCall({ action: 'update_order', id: editingOrder.id, ...form })
    if (res.status !== 'ok') {
      setSyncError('編集の保存に失敗しました: ' + (res.message || ''))
      setOrders(prev)
    } else {
      setLastSync(new Date())
    }
  }

  // 論理削除（個別POST）
  async function deleteOrder(id) {
    if (!confirm('この受注を削除しますか？\n\n「設定 > 削除済み」から復元できます。')) return
    const target = orders.find(o => o.id === id)
    if (!target) return
    const prevOrders  = orders
    const prevDeleted = deletedOrders
    setOrders(orders.filter(o => o.id !== id))
    setDeletedOrders([{ ...target, deletedAt: new Date().toISOString() }, ...deletedOrders])
    const res = await apiCall({ action: 'delete_order', id })
    if (res.status !== 'ok') {
      setSyncError('削除に失敗しました: ' + (res.message || ''))
      setOrders(prevOrders); setDeletedOrders(prevDeleted)
    } else {
      setLastSync(new Date())
    }
  }

  // キャンセル（ステータス変更）
  async function cancelOrder(id) {
    if (!confirm('この受注をキャンセルにしますか？')) return
    await changeStatus(id, 'cancelled')
  }

  // 復元（個別POST）
  async function restoreOrder(id) {
    const target = deletedOrders.find(o => o.id === id)
    if (!target) return
    const { deletedAt, ...restored } = target
    const prevOrders  = orders
    const prevDeleted = deletedOrders
    setOrders([restored, ...orders])
    setDeletedOrders(deletedOrders.filter(o => o.id !== id))
    const res = await apiCall({ action: 'restore_order', id })
    if (res.status !== 'ok') {
      setSyncError('復元に失敗しました: ' + (res.message || ''))
      setOrders(prevOrders); setDeletedOrders(prevDeleted)
    } else {
      setLastSync(new Date())
    }
  }

  // ステータス変更（個別POST）
  async function changeStatus(id, newStatus) {
    const prev = orders
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o))
    const res = await apiCall({ action: 'update_status', id, status: newStatus })
    if (res.status !== 'ok') {
      setSyncError('ステータス更新に失敗しました: ' + (res.message || ''))
      setOrders(prev)
    } else {
      setLastSync(new Date())
    }
  }

  function toggleAlert(alertId)   { setActiveAlert(prev => prev === alertId ? null : alertId); setActiveStatus(null) }
  function toggleStatus(statusId) { setActiveStatus(prev => prev === statusId ? null : statusId); setActiveAlert(null) }

  const alertCounts = {}
  ALERTS.forEach(a => { alertCounts[a.id] = orders.filter(o => getAlertInfo(o)?.id === a.id).length })
  const counts = {}
  STATUSES.forEach(s => { counts[s.id] = orders.filter(o => o.status === s.id).length })

  const q = search.trim().toLowerCase()
  const filtered = orders.filter(o => {
    if (activeStatus && o.status !== activeStatus) return false
    if (activeAlert) { const info = getAlertInfo(o); if (!info || info.id !== activeAlert) return false }
    if (!q) return true
    return (o.name+o.mansion+o.phone+o.work).toLowerCase().includes(q)
  })

  const totalAlerts = ALERTS.reduce((sum, a) => sum + alertCounts[a.id], 0)

  if (!authed) {
    return <LoginScreen onLogin={handleLogin} />
  }

  const hasSettings = can(role, 'settings')

  return (
    <>
      {loading && <Loading />}
      <div className="app">
        <header className="header">
          <div className="header-left">
            <Key size={22} color="var(--accent)" />
            <span className="header-title">一般受注管理</span>
            {totalAlerts > 0 && <span className="header-alert-badge">{totalAlerts}件要対応</span>}
          </div>
          <div className="header-right">
            {/* バージョン・ロール表示 */}
            <span className="header-version">
              <span className="version-badge">{APP_VERSION}</span>
              {role && <span className="role-badge" style={{marginLeft:4}}>{ROLE_LABELS[role] || role}</span>}
            </span>
            <button className="icon-btn" onClick={pullFromGAS} disabled={syncing} title="今すぐ取得">
              {syncing ? <Loader2 size={16} style={{animation:'spin 1s linear infinite'}} /> : <RefreshCw size={16} />}
            </button>
            {hasSettings && (
              <button className="icon-btn" onClick={() => setShowSettings(true)} title="設定"><Settings size={16} /></button>
            )}
            {!hasSettings && (
              <button className="icon-btn" onClick={handleLogout} title="ログアウト"><LogOut size={16} /></button>
            )}
            {can(role, 'add') && (
              <div className="new-order-wrap">
                <button className="btn-primary btn-primary-lg" onClick={() => setShowForm(true)}><Plus size={18} /> 新規受注</button>
                <div className="sync-info-below">
                  {syncError
                    ? <span style={{color:'#e74c3c'}}>⚠ {syncError}</span>
                    : lastSync
                      ? <>最終同期: {formatDate(lastSync.toISOString())}</>
                      : <span style={{color:'#e67e22'}}>未同期</span>
                  }
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="status-grid">
          <div className="status-card-group">
            {['suginami','inquiry','guided'].map(id => {
              const s = STATUSES.find(x => x.id === id)
              return (
                <button key={id} onClick={() => toggleStatus(id)} className="status-card status-card-sub" style={{ '--card-color': s.color, '--card-bg': s.bg, outline: activeStatus === id ? `2px solid ${s.color}` : 'none' }}>
                  <span className="status-card-icon-sm">{s.icon}</span>
                  <span className="status-card-label-sm">{s.label}</span>
                  <span className="status-card-badge-sm"><Badge count={counts[id]} color={s.color} /></span>
                </button>
              )
            })}
          </div>
          {STATUSES.filter(s => !['inquiry','guided','suginami','done','cancelled'].includes(s.id)).map(s => (
            <StatusCard key={s.id} status={s} count={counts[s.id]} active={activeStatus === s.id} onClick={() => toggleStatus(s.id)} />
          ))}
          {(() => {
            const done = STATUSES.find(s => s.id === 'done')
            const cancelled = STATUSES.find(s => s.id === 'cancelled')
            return (
              <div className="status-card-split">
                <button className="status-card-split-half top" style={{ '--card-color': done.color, outline: activeStatus === 'done' ? `2px solid ${done.color}` : 'none' }} onClick={() => toggleStatus('done')}>
                  <span className="split-icon">{done.icon}</span>
                  <span className="split-label">{done.label}</span>
                  <Badge count={counts['done']} color={done.color} />
                </button>
                <button className="status-card-split-half bottom" style={{ '--card-color': cancelled.color, outline: activeStatus === 'cancelled' ? `2px solid ${cancelled.color}` : 'none' }} onClick={() => toggleStatus('cancelled')}>
                  <span className="split-icon">{cancelled.icon}</span>
                  <span className="split-label">{cancelled.label}</span>
                  <Badge count={counts['cancelled']} color={cancelled.color} />
                </button>
              </div>
            )
          })()}
        </div>

        <div className="alert-grid">
          {ALERTS.map(a => <AlertCard key={a.id} alert={a} count={alertCounts[a.id]} active={activeAlert === a.id} onClick={() => toggleAlert(a.id)} />)}
        </div>

        <div className="list-toolbar">
          <div className="search-wrap">
            <Search size={14} color="var(--text-dim)" />
            <input name="search" className="search-input" placeholder="氏名・マンション・電話番号で検索..." value={search} onChange={e => setSearch(e.target.value)} autoComplete="off" />
            {search && <button onClick={() => setSearch('')} style={{background:'none',border:'none',color:'var(--text-dim)',cursor:'pointer'}}><X size={14}/></button>}
          </div>
          {(activeStatus || activeAlert) && (
            <button className="filter-chip" onClick={() => { setActiveStatus(null); setActiveAlert(null) }}>
              {activeStatus ? STATUSES.find(s=>s.id===activeStatus)?.label : ALERTS.find(a=>a.id===activeAlert)?.label}
              <X size={12} />
            </button>
          )}
          <span className="count-label">{filtered.length}件</span>
        </div>

        <div className="order-list">
          {filtered.length === 0 && (
            <div className="empty-state">
              <Key size={40} color="var(--border)" />
              <p>データがありません</p>
              {!activeStatus && !activeAlert && can(role, 'add') && (
                <button className="btn-primary" style={{marginTop:16}} onClick={() => setShowForm(true)}><Plus size={14}/> 最初の受注を登録</button>
              )}
            </div>
          )}
          {filtered.map(o => (
            <OrderCard
              key={o.id}
              order={o}
              onStatusChange={changeStatus}
              onDelete={deleteOrder}
              onEdit={o => setEditingOrder(o)}
              onCancel={cancelOrder}
              canDelete={can(role, 'delete')}
              canEdit={can(role, 'edit')}
              locks={locks}
              userEmail={getUserEmail()}
              onLock={lockOrder}
              onUnlock={unlockOrder}
            />
          ))}
        </div>

        {showForm     && <OrderForm onSave={addOrder}  onCancel={() => setShowForm(false)} />}
        {editingOrder && <OrderForm initial={editingOrder} onSave={updateOrder} onCancel={() => setEditingOrder(null)} />}
        {showSettings && (
          <SettingsModal
            role={role}
            onClose={() => setShowSettings(false)}
            onLogout={handleLogout}
            deletedOrders={deletedOrders}
            onRestore={restoreOrder}
            allOrders={orders}
          />
        )}
      </div>

      {can(role, 'add') && (
        <button className="fab-new-order" onClick={() => setShowForm(true)}>
          <Plus size={20} /> 新規受注
        </button>
      )}
    </>
  )
}
