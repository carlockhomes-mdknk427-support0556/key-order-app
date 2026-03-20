import React, { useState, useEffect, useCallback } from 'react'
import { Key, Plus, X, ChevronRight, ArrowRight, Loader2, RefreshCw, Settings, Search, AlertTriangle, LogOut, RotateCcw, Lock, Check, XCircle } from 'lucide-react'
import './App.css'
import Loading from './Loading'

// ============================================================
// バージョン・定数
// ============================================================
const APP_VERSION  = 'v3.2.9'
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
  { id: 'inquiry',   label: 'お問合せ',      color: '#ff7c1a', bg: 'rgba(255,124,26,0.18)',  icon: '💬' },
  { id: 'guided',    label: '案内済み',      color: '#ffd000', bg: 'rgba(255,208,0,0.18)',   icon: '📋' },
  { id: 'suginami',  label: '杉並電話受付',  color: '#00f0c8', bg: 'rgba(0,240,200,0.18)',   icon: '🏢' },
  { id: 'order',     label: '受注',          color: '#ff5722', bg: 'rgba(255,87,34,0.18)',   icon: '📥' },
  { id: 'arranged',  label: '手配済み',      color: '#cc66ff', bg: 'rgba(204,102,255,0.18)', icon: '🏭' },
  { id: 'arrived',   label: '入荷済み',      color: '#2196ff', bg: 'rgba(33,150,255,0.18)',  icon: '📦' },
  { id: 'appt',      label: '作業アポ済み',  color: '#00e676', bg: 'rgba(0,230,118,0.18)',   icon: '📅' },
  { id: 'done',      label: '完了',          color: '#ccdde0', bg: 'rgba(204,221,224,0.18)', icon: '✅' },
  { id: 'cancelled', label: 'キャンセル',    color: '#ff3d33', bg: 'rgba(255,61,51,0.18)',   icon: '❌' },
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
    if (data.status === 'error') return { orders: null, error: data.message || '同期エラー' }
    return { orders: data.orders || null, error: null }
  } catch (e) { return { orders: null, error: 'ネットワークエラー' } }
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
  name: '', mansion: '', room: '', phone: '', email: '', work: '',
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
        <div className="login-logo">
          <span className="key-icon-wrap">
            <span className="key-wave" />
            <span className="key-wave" />
            <span className="key-wave" />
            <Key size={34} color="var(--accent)" style={{position:'relative',zIndex:1}} />
          </span>
          <span className="login-title">CLH-Support-Bridge</span>
        </div>
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
// 確認ダイアログ
// ============================================================
function Dialog({ icon, title, message, buttons }) {
  return (
    <div className="dialog-overlay">
      <div className="dialog-box">
        {icon && <span className="dialog-icon">{icon}</span>}
        {title && <div className="dialog-title">{title}</div>}
        {message && <div className="dialog-message">{message}</div>}
        <div className="dialog-buttons">
          {buttons.map((b, i) => (
            <button key={i} className={`dialog-btn ${b.variant || 'default'}`} onClick={b.onClick}>
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function useConfirm() {
  const [dialog, setDialog] = useState(null)
  const showDialog = useCallback(({ icon, title, message, buttons }) => {
    return new Promise(resolve => {
      setDialog({
        icon, title, message,
        buttons: buttons.map(b => ({
          ...b,
          onClick: () => { setDialog(null); resolve(b.value) }
        }))
      })
    })
  }, [])
  const DialogEl = dialog ? <Dialog {...dialog} /> : null
  return { showDialog, DialogEl }
}

// ============================================================
// COMPONENTS
// ============================================================
function StatusCard({ status, count, onClick, active }) {
  return (
    <button onClick={onClick} className={`stat-card${active ? ' active' : ''}`} style={{'--c': status.color}}>
      <span className="stat-icon">{status.icon}</span>
      <div className="stat-num">{count}</div>
      <div className="stat-label">{status.label}</div>
    </button>
  )
}

function AlertCard({ alert, count, onClick, active }) {
  if (count === 0) return null
  return (
    <button onClick={onClick} className={`alert-chip${active ? ' active' : ''}`}
      style={{background:'rgba(239,68,68,0.08)',borderColor:'rgba(239,68,68,0.2)',color:'#fca5a5'}}>
      ⚠ {alert.label} <strong>{count}</strong>
    </button>
  )
}

function OrderCard({ order, onStatusChange, onDelete, onEdit, onCancel, canDelete, canEdit, locks, userEmail, onLock, onUnlock }) {
  const [expanded, setExpanded]         = useState(false)
  const [mailSending, setMailSending]   = useState(false)
  const [mailMsg, setMailMsg]           = useState('')
  const [paymentUrl, setPaymentUrl]     = useState('')
  const { showDialog, DialogEl }        = useConfirm()
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentMsg, setPaymentMsg]     = useState('')
  const [showPayPanel, setShowPayPanel] = useState(false)
  const [receiptUrl, setReceiptUrl]     = useState('')
  const [receiptLoading, setReceiptLoading] = useState(false)

  const st = STATUSES.find(s => s.id === order.status) || STATUSES[1]
  const transitions = STATUS_TRANSITIONS[order.status] || []
  const alertInfo = getAlertInfo(order)
  const cardStyle = { '--card-color': st.color, '--card-bg': st.bg }
  const borderStyle = alertInfo ? { border: `2px solid ${alertInfo.borderColor}`, boxShadow: `0 0 10px ${alertInfo.borderColor}40` } : {}

  const lock            = locks && locks[order.id]
  const isLockedByOther = lock && lock.email !== userEmail
  const isLockedByMe    = lock && lock.email === userEmail
  // order.email を優先、旧データで phone に @ が含まれる場合も後方互換対応
  const customerEmail = (order.email && order.email.includes('@')) ? order.email
                      : (order.phone && order.phone.includes('@')) ? order.phone : ''
  const hasEmail = !!customerEmail

  // 決済パネルは完了ステータスのみ・全ロール表示
  const showPayButton = order.status === 'done'

  function handleExpand() {
    if (!expanded) { onLock && onLock(order.id) }
    else           { onUnlock && onUnlock(order.id) }
    setExpanded(e => !e)
  }

  // Square決済リンク発行
  async function generatePaymentLink() {
    setPaymentLoading(true); setPaymentMsg('')
    try {
      const res = await fetch(WORKER_URL + '/square/payment-link', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:      order.id,
          name:    order.name,
          mansion: order.mansion,
          room:    order.room,
          work:    order.work,
          items:   order.items || [],
          amount:  order.amount,
        }),
      })
      const data = await res.json()
      if (data.status === 'ok' && data.url) {
        setPaymentUrl(data.url)
        setPaymentMsg('✅ 決済リンクを生成しました')
      } else {
        setPaymentMsg('❌ ' + (data.message || 'リンク生成失敗'))
      }
    } catch {
      setPaymentMsg('❌ 通信エラーが発生しました')
    } finally {
      setPaymentLoading(false)
    }
  }

  // LINEで開く
  function openLine() {
    const text = encodeURIComponent(
      order.name + ' 様\n\nカーロックホームズより決済リンクをお送りします。\n\n' +
      '【注文ID】' + order.id + '\n' +
      '【金額】¥' + Number(order.amount).toLocaleString() + '（税込）\n\n' +
      '下記リンクよりお支払い手続きをお願いいたします。\n' + paymentUrl
    )
    window.open('https://line.me/R/msg/text/?' + text, '_blank')
  }

  // freee領収書直接発行
  async function issueFreeeReceipt() {
    const ok = await showDialog({
      icon: '🧾', title: 'freee 領収書発行',
      message: '金額：¥' + Number(order.amount).toLocaleString() + '（税込）\n\nfreeeで領収書を発行しますか？',
      buttons: [
        { label: '発行する', value: true, variant: 'primary' },
        { label: 'キャンセル', value: false, variant: 'default' },
      ]
    })
    if (!ok) return
    setReceiptLoading(true)
    try {
      const res = await fetch(WORKER_URL + '/freee/receipt', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:      order.id,
          name:    order.name,
          email:   customerEmail || '',
          mansion: order.mansion,
          room:    order.room,
          work:    order.work,
          items:   order.items || [],
          amount:  order.amount,
        }),
      })
      const data = await res.json()
      if (data.status === 'ok' && data.receiptUrl) {
        setReceiptUrl(data.receiptUrl)
        setPaymentMsg('✅ freeeに領収書を作成しました')
      } else {
        setPaymentMsg('❌ ' + (data.message || '発行失敗'))
      }
    } catch {
      setPaymentMsg('❌ 通信エラーが発生しました')
    } finally {
      setReceiptLoading(false)
      setTimeout(() => setPaymentMsg(''), 10000)
    }
  }

  // メール送信
  async function sendPaymentMail() {
    if (!hasEmail) return
    const ok = await showDialog({
      icon: '✉️', title: '決済案内メールを送信',
      message: '宛先: ' + customerEmail + '\n\nこの宛先にメールを送信しますか？',
      buttons: [
        { label: '送信する', value: true, variant: 'primary' },
        { label: 'キャンセル', value: false, variant: 'default' },
      ]
    })
    if (!ok) return
    setMailSending(true)
    const res = await apiCall({
      action:     'send_payment_mail',
      id:         order.id,
      email:      customerEmail,
      name:       order.name,
      mansion:    order.mansion,
      room:       order.room,
      work:       order.work,
      items:      order.items || [],
      amount:     order.amount,
      paymentUrl: paymentUrl,
    })
    setMailSending(false)
    if (res.status === 'ok') { setPaymentMsg('✅ メールを送信しました') }
    else { setPaymentMsg('❌ ' + (res.message || '送信失敗')) }
    setTimeout(() => setPaymentMsg(''), 10000)
  }

  return (
    <>
    {DialogEl}
    {/* リスト内カード */}
    <div className={`order-card-v3${alertInfo ? ' has-alert' : ''}${isLockedByOther ? ' locked-by-other' : ''}`} onClick={handleExpand}>
      {alertInfo && (
        <div className="card-alert-strip">
          <AlertTriangle size={12} /> {alertInfo.label}
        </div>
      )}
      {isLockedByOther && (
        <div className="card-lock-strip">
          🔒 {lock.email} が編集中です
        </div>
      )}
      <div className="card-header-v3">
        <div className="card-status-bar" style={{background: st.color}} />
        <div className="card-info-v3">
          <div className="card-name-v3">
            {order.status === 'inquiry' && <span className="inquiry-tag-v3">問合せ</span>}
            {order.maker && <span className="maker-tag-v3">{MAKERS.find(m=>m.id===order.maker)?.label || order.maker}</span>}
            <span style={{wordBreak:'break-all'}}>{order.name}</span>
          </div>
          <div className="card-sub-v3">{order.mansion}{order.room ? '　'+order.room+'号室' : ''}</div>
          {order.phone && <div className="card-phone-v3">{order.phone}</div>}
        </div>
        <div className="card-right-v3">
          <div className="card-amount-v3">{formatAmount(order.amount)}</div>
          <div className="card-tax-label">税込</div>
          <span className="card-status-badge" style={{background: st.bg, color: st.color}}>{st.label}</span>
          <ChevronRight size={16} className="card-chevron" />
        </div>
      </div>
    </div>

    {/* 全画面展開オーバーレイ */}
    {expanded && (
      <div className="card-fullscreen-overlay" onClick={e => { if (e.target === e.currentTarget) handleExpand() }}>
        <div className="card-fullscreen">
          <div className="card-fullscreen-top">
            <div className="card-status-bar" style={{background: st.color, height: 52}} />
            <div style={{flex:1,minWidth:0}}>
              <div className="card-name-v3">
                {order.status === 'inquiry' && <span className="inquiry-tag-v3">問合せ</span>}
                {order.maker && <span className="maker-tag-v3">{MAKERS.find(m=>m.id===order.maker)?.label || order.maker}</span>}
                <span style={{wordBreak:'break-all'}}>{order.name}</span>
              </div>
              <div className="card-sub-v3">{order.mansion}{order.room ? '　'+order.room+'号室' : ''}</div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div className="card-amount-v3">{formatAmount(order.amount)}</div>
              <div className="card-tax-label">税込</div>
              <span className="card-status-badge" style={{background: st.bg, color: st.color, marginTop:4, display:'inline-block'}}>{st.label}</span>
            </div>
            <button className="card-fullscreen-close" onClick={handleExpand}><X size={22} /></button>
          </div>

          {isLockedByMe && (
            <div className="card-editing-strip">✏️ あなたが編集中</div>
          )}

          <div className="card-body-v3">
            <div className="detail-grid-v3">
              <div className="detail-item-v3">
                <div className="detail-key-v3">電話番号</div>
                <div className="detail-val-v3">{order.phone || '—'}</div>
              </div>
              {customerEmail && (
                <div className="detail-item-v3">
                  <div className="detail-key-v3">メールアドレス</div>
                  <div className="detail-val-v3" style={{wordBreak:'break-all'}}>{customerEmail}</div>
                </div>
              )}
              <div className="detail-item-v3">
                <div className="detail-key-v3">物件</div>
                <div className="detail-val-v3">{order.mansion} {order.room ? order.room+'号室' : ''}</div>
              </div>
              <div className="detail-item-v3 full">
                <div className="detail-key-v3">作業内容</div>
                <div className="detail-val-v3">{order.work || '—'}</div>
              </div>
            </div>

            {order.items && order.items.length > 0 ? (
              <div className="items-table-v3">
                <div className="items-thead-v3">
                  <span className="col-name">商品名</span>
                  <span className="col-qty">数量</span>
                  <span className="col-unit">単価</span>
                  <span className="col-total">小計</span>
                </div>
                {order.items.map(item => (
                  <div key={item.name} className="item-row-v3">
                    <span className="col-name">{item.name}</span>
                    <span className="col-qty">{item.qty || 1}</span>
                    <span className="col-unit">¥{Number(item.price).toLocaleString()}</span>
                    <span className="col-total">¥{(item.price * (item.qty || 1)).toLocaleString()}</span>
                  </div>
                ))}
                {(() => {
                  const makerObj = MAKERS.find(m => m.id === order.maker)
                  const taxIncluded = makerObj?.taxIncluded || false
                  const subtotal = order.items.reduce((s, it) => s + (it.price * (it.qty || 1)), 0)
                  const tax = Math.floor(subtotal * 0.1)
                  const total = Number(order.amount) || subtotal + tax
                  return (
                    <div className="items-footer-v3">
                      <span className="items-footer-label">
                        {!taxIncluded ? `税抜 ¥${subtotal.toLocaleString()} + 税 ¥${tax.toLocaleString()}` : '税込価格'}
                      </span>
                      <span className="items-footer-amount">¥{total.toLocaleString()}</span>
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div className="detail-grid-v3" style={{marginBottom:12}}>
                <div className="detail-item-v3">
                  <div className="detail-key-v3">金額</div>
                  <div className="detail-val-v3">{formatAmount(order.amount)}</div>
                </div>
              </div>
            )}

            {(order.keyNumber || order.clientName || order.clientPhone || order.clientAddress) && (
              <div className="detail-grid-v3" style={{marginBottom:12}}>
                <div className="detail-item-v3 full" style={{background:'rgba(240,165,0,0.03)',borderColor:'rgba(240,165,0,0.1)'}}>
                  <div className="detail-key-v3" style={{color:'var(--gold)'}}>その他管理会社</div>
                  <div className="detail-val-v3">
                    {order.keyNumber     && <div>キーナンバー: {order.keyNumber}</div>}
                    {order.clientName    && <div>ご依頼主様: {order.clientName}</div>}
                    {order.clientPhone   && <div>電話番号: {order.clientPhone}</div>}
                    {order.clientAddress && <div>ご住所: {order.clientAddress}</div>}
                  </div>
                </div>
              </div>
            )}

            <div style={{fontSize:11,color:'var(--text3)',marginBottom:14}}>登録: {formatDate(order.createdAt)}</div>

            <div className="card-actions-v3">
              <div className="trans-btns-v3">
                {transitions.map(toId => {
                  const to = STATUSES.find(s => s.id === toId)
                  return (
                    <button key={toId} className="trans-btn-v3" style={{ borderLeftColor: to.color }} onClick={() => onStatusChange(order.id, toId)}>
                      <ArrowRight size={14} />{to.label}へ
                    </button>
                  )
                })}
              </div>
              <div className="ctrl-btns-v3">
                {canEdit && <button className="ctrl-btn-v3" onClick={() => onEdit(order)} disabled={isLockedByOther}>編集</button>}
                {order.status !== 'done' && order.status !== 'cancelled' && (
                  <button className="ctrl-btn-v3 done-btn" onClick={() => onStatusChange(order.id, 'done')}><Check size={14}/> 完了</button>
                )}
                {order.status !== 'cancelled' && (
                  <button className="ctrl-btn-v3 cancel-btn" onClick={async () => {
                    const ok = await showDialog({
                      icon: '⚠️', title: 'キャンセルにしますか？',
                      message: order.name + ' 様の受注をキャンセルステータスに変更します。',
                      buttons: [
                        { label: 'キャンセルにする', value: true, variant: 'danger' },
                        { label: '戻る', value: false, variant: 'default' },
                      ]
                    })
                    if (ok) onCancel(order.id)
                  }}><XCircle size={14}/> キャンセル</button>
                )}
                {canDelete && <button className="ctrl-btn-v3 del-btn" onClick={async () => {
                  const ok = await showDialog({
                    icon: '🗑️', title: 'この受注を削除しますか？',
                    message: order.name + ' 様の受注を削除します。\n「設定 > 削除済み」から復元できます。',
                    buttons: [
                      { label: '削除する', value: true, variant: 'danger' },
                      { label: 'キャンセル', value: false, variant: 'default' },
                    ]
                  })
                  if (ok) onDelete(order.id)
                }}><X size={14}/> 削除</button>}
                {showPayButton && (
                  <button className="ctrl-btn-v3 pay-btn" onClick={() => setShowPayPanel(true)}>💳 決済</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* 決済モーダル */}
      {showPayPanel && (
        <div className="modal-overlay pay-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowPayPanel(false) }}>
          <div className="modal pay-modal">
            <div className="modal-header">
              <h2>💳 {order.name} 様 — 決済</h2>
              <button className="modal-close" onClick={() => setShowPayPanel(false)}><X size={20} /></button>
            </div>
            <div style={{padding:'16px 20px 28px',display:'flex',flexDirection:'column',gap:12}}>

              {/* Square決済リンク */}
              <button
                className="ctrl-btn"
                style={{background:'rgba(0,0,0,0.6)',color:'#fff',borderColor:'rgba(255,255,255,0.15)',width:'100%',justifyContent:'center',padding:'12px 0'}}
                onClick={generatePaymentLink}
                disabled={paymentLoading}
              >
                {paymentLoading ? <Loader2 size={14} style={{animation:'spin 1s linear infinite'}} /> : '🔗 Square決済リンクを生成'}
              </button>

              {paymentUrl && (
                <>
                  <div style={{display:'flex',gap:6,alignItems:'center',background:'rgba(0,0,0,0.2)',borderRadius:8,padding:'8px 10px'}}>
                    <span style={{fontSize:10,color:'rgba(255,255,255,0.5)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'monospace'}}>{paymentUrl}</span>
                    <button style={{flexShrink:0,fontSize:11,padding:'4px 10px',background:'rgba(255,255,255,0.1)',border:'none',borderRadius:6,color:'#fff',cursor:'pointer'}}
                      onClick={() => { navigator.clipboard?.writeText(paymentUrl); setPaymentMsg('✅ URLをコピーしました') }}>📋 コピー</button>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button className="ctrl-btn" style={{background:'rgba(6,214,160,0.15)',color:'#06d6a0',borderColor:'rgba(6,214,160,0.3)',flex:1,justifyContent:'center'}} onClick={openLine}>💬 LINEで送る</button>
                    {hasEmail && (
                      <button className="ctrl-btn" style={{background:'rgba(52,152,219,0.15)',color:'#3498db',borderColor:'rgba(52,152,219,0.3)',flex:1,justifyContent:'center'}} onClick={sendPaymentMail} disabled={mailSending}>
                        {mailSending ? <Loader2 size={12} style={{animation:'spin 1s linear infinite'}} /> : '📧 メールで送る'}
                      </button>
                    )}
                  </div>
                </>
              )}

              <button
                className="ctrl-btn"
                style={{background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.7)',borderColor:'rgba(255,255,255,0.1)',width:'100%',justifyContent:'center',padding:'12px 0'}}
                onClick={() => window.open('square-commerce-v1://payment/create?amount=' + Math.round(Number(order.amount)||0) + '&currency_code=JPY&description=' + encodeURIComponent(order.id), '_blank')}
              >📱 Squareアプリでタッチ決済</button>

              <div style={{borderTop:'1px solid rgba(255,255,255,0.08)',paddingTop:12}}>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:8}}>現金・振込・対面カード決済後</div>
                <button
                  className="ctrl-btn"
                  style={{background:'rgba(0,132,132,0.15)',color:'#00b2b2',borderColor:'rgba(0,178,178,0.3)',width:'100%',justifyContent:'center',padding:'12px 0'}}
                  onClick={issueFreeeReceipt} disabled={receiptLoading}
                >
                  {receiptLoading ? <Loader2 size={14} style={{animation:'spin 1s linear infinite'}} /> : '📄 freeeで領収書を発行'}
                </button>
                {receiptUrl && (
                  <button className="ctrl-btn" style={{marginTop:8,background:'rgba(0,132,132,0.25)',color:'#00d4d4',borderColor:'rgba(0,212,212,0.3)',width:'100%',justifyContent:'center'}} onClick={() => window.open(receiptUrl,'_blank')}>
                    🔗 freeeで領収書を確認・送付
                  </button>
                )}
              </div>

              {paymentMsg && (
                <div style={{fontSize:12,fontWeight:600,padding:'8px 12px',borderRadius:8,background: paymentMsg.startsWith('✅') ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)', color: paymentMsg.startsWith('✅') ? '#2ecc71' : '#e74c3c'}}>
                  {paymentMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
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
  const [customName, setCustomName]   = useState('')
  const [customPrice, setCustomPrice] = useState('')
  const groups = MAKER_PRODUCTS[maker] || []

  function addProduct(product) {
    const existing = items.find(i => i.name === product.name)
    if (existing) onChange(items.map(i => i.name === product.name ? { ...i, qty: i.qty + 1 } : i))
    else          onChange([...items, { name: product.name, price: product.price, qty: 1 }])
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
        <div className="product-chip-area">
          {groups.map(g => (
            <div key={g.group}>
              <div className="product-chip-group-label">{g.group}</div>
              <div className="product-chip-list">
                {g.items.map(p => {
                  const inCart = items.find(i => i.name === p.name)
                  return (
                    <button type="button" key={p.name} className={`product-chip${inCart ? ' in-cart' : ''}`} onClick={() => addProduct(p)}>
                      <span className="chip-name">{p.name}</span>
                      <span className="chip-price">¥{p.price.toLocaleString()}</span>
                      {inCart && <span className="chip-qty-badge">×{inCart.qty}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
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
              <div className="item-row-top">
                <span className="item-name">{item.name}</span>
                <button type="button" className="item-remove" onClick={() => onChange(items.filter(i => i.name !== item.name))}><X size={12} /></button>
              </div>
              <div className="item-row-bottom">
                <span className="item-unit-price">¥{item.price.toLocaleString()}</span>
                <div className="item-qty-ctrl">
                  <button type="button" onClick={() => updateQty(item.name, item.qty - 1)}>－</button>
                  <span>{item.qty}</span>
                  <button type="button" onClick={() => updateQty(item.name, item.qty + 1)}>＋</button>
                </div>
                <span className="item-subtotal">¥{(item.price * item.qty).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OrderForm({ initial, onSave, onCancel }) {
  const initialForm = { ...(initial || EMPTY_FORM), items: initial?.items || [], priceOverride: initial?.priceOverride || '', maker: initial?.maker || '' }
  const [form, setForm]       = useState(initialForm)
  const [showExtra, setShowExtra] = useState(!!(initial?.keyNumber || initial?.clientName || initial?.clientPhone || initial?.clientAddress))
  const { showDialog, DialogEl } = useConfirm()
  const makerObj      = MAKERS.find(m => m.id === form.maker)
  const taxIncluded   = makerObj?.taxIncluded || false
  const showKeyNumber = shouldShowKeyNumber(form.maker, form.items)
  const { subtotal, tax, total, isOverride, taxIncluded: isTaxIncluded } = calcAmounts(form.items, form.priceOverride, taxIncluded)

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm)

  function handle(e) {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    if (e.target.name === 'maker') { setForm(f => ({ ...f, maker: val, items: [], priceOverride: '' })); return }
    setForm(f => ({ ...f, [e.target.name]: val }))
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      await showDialog({
        icon: '⚠️', title: '入力エラー',
        message: '氏名を入力してください',
        buttons: [{ label: 'OK', value: true, variant: 'primary' }]
      })
      return
    }
    onSave({ ...form, amount: String(total) })
  }

  async function handleClose() {
    if (!isDirty) { onCancel(); return }
    const result = await showDialog({
      icon: '💾', title: '変更を保存しますか？',
      message: '入力内容が保存されていません。\nどうしますか？',
      buttons: [
        { label: '保存して閉じる',      value: 'save',    variant: 'primary' },
        { label: '保存しないで閉じる',  value: 'discard', variant: 'danger'  },
        { label: '戻って編集を続ける',  value: 'cancel',  variant: 'default' },
      ]
    })
    if (result === 'save') {
      if (!form.name.trim()) {
        await showDialog({
          icon: '⚠️', title: '入力エラー',
          message: '氏名を入力してください',
          buttons: [{ label: 'OK', value: true, variant: 'primary' }]
        })
        return
      }
      onSave({ ...form, amount: String(total) })
    } else if (result === 'discard') {
      onCancel()
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && handleClose()}>
      {DialogEl}
      <div className="modal" style={{maxWidth:1320}}>
        <div className="modal-header">
          <h2>{initial ? '受注編集' : '新規受注'}</h2>
          <button className="modal-close" onClick={handleClose}><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="order-form">
          <div className="inquiry-toggle full-col">
            <label className="toggle-label">
              <input type="checkbox" name="isInquiry" checked={form.isInquiry || false} onChange={e => { handle(e); if (e.target.checked) setForm(f => ({ ...f, isGuided: false, isSuginami: false })) }} />
              <span>💬 お問合せセクションとして登録</span>
            </label>
            <label className="toggle-label">
              <input type="checkbox" name="isGuided" checked={form.isGuided || false} onChange={e => { handle(e); if (e.target.checked) setForm(f => ({ ...f, isInquiry: false, isSuginami: false })) }} />
              <span>📋 案内済みとして登録</span>
            </label>
            <label className="toggle-label">
              <input type="checkbox" name="isSuginami" checked={form.isSuginami || false} onChange={e => { handle(e); if (e.target.checked) setForm(f => ({ ...f, isInquiry: false, isGuided: false })) }} />
              <span>🏢 杉並本社（受付）として登録</span>
            </label>
            <p className="toggle-note">チェックなしの場合は受注セクションで処理されます</p>
          </div>
          <label><span>氏名 <span className="req">*</span></span><input name="name" value={form.name} onChange={handle} placeholder="田中 太郎" required /></label>
          <label>電話番号<input name="phone" value={form.phone} onChange={handle} placeholder="090-0000-0000" type="tel" /></label>
          <div className="form-row">
            <label>マンション名<input name="mansion" value={form.mansion} onChange={handle} placeholder="○○マンション" /></label>
            <label style={{flex:'0 0 140px'}}>部屋番号<input name="room" value={form.room} onChange={handle} placeholder="101" /></label>
          </div>
          <label>メールアドレス<span style={{fontSize:12,color:'var(--text3)',marginLeft:8,textTransform:'none',fontWeight:400,letterSpacing:0}}>任意・決済案内メール送付に使用</span><input name="email" value={form.email||''} onChange={handle} placeholder="example@email.com" type="email" autoComplete="email" /></label>
          <label className="full-col">作業内容<textarea name="work" value={form.work} onChange={handle} placeholder="作業内容を入力..." rows={3} /></label>
          <div className="form-section-title">メーカー・商品選択</div>
          <div className="maker-tabs full-col">
            {MAKERS.map(m => (
              <button key={m.id} type="button" className={`maker-tab ${form.maker === m.id ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, maker: m.id, items: [], priceOverride: '' }))}>
                {m.label}{m.taxIncluded && <span className="tax-badge">税込</span>}
              </button>
            ))}
          </div>
          <div className="full-col">{form.maker ? <ItemSelector maker={form.maker} items={form.items} onChange={items => setForm(f => ({ ...f, items }))} /> : <div className="maker-hint">↑ メーカーを選択すると商品を追加できます</div>}</div>
          {showKeyNumber && (
            <div className="keynumber-section full-col">
              <label className="keynumber-label">
                🔑 キーナンバー <span className="req">*</span>
                <input name="keyNumber" value={form.keyNumber} onChange={handle} placeholder="例: KY-1234" className="keynumber-input" autoComplete="off" />
              </label>
              <p className="keynumber-hint">標準キーの複製に必要なキーナンバーを入力してください</p>
            </div>
          )}
          <div className="price-summary full-col">
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
          <div className="extra-section full-col">
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
          <div className="form-buttons full-col">
            <button type="button" className="btn-cancel" onClick={handleClose}>キャンセル</button>
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
  const { showDialog, DialogEl } = useConfirm()
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
    setTimeout(() => setMsg(''), 10000)
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
    const ok = await showDialog({
      icon: '🗑️', title: 'ユーザーを削除しますか？',
      message: email + '\n\nこのユーザーを削除します。この操作は取り消せません。',
      buttons: [
        { label: '削除する', value: true, variant: 'danger' },
        { label: 'キャンセル', value: false, variant: 'default' },
      ]
    })
    if (!ok) return
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
      {DialogEl}
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

  function showMsg(msg) { setSaveMsg(msg); setTimeout(() => setSaveMsg(''), 10000) }

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

              {/* freee認証 */}
              <div style={{marginTop:16}}>
                <div className="settings-title">freee 連携</div>
                <p className="settings-desc">Square決済完了後にfreeeへ自動連携するための認証です。初回のみ必要です。</p>
                <button
                  className="btn-save"
                  style={{width:'100%', background:'rgba(0,132,132,0.8)', marginTop:8}}
                  onClick={() => window.open(WORKER_URL + '/freee/auth', '_blank')}
                >
                  🔗 freeeと連携する
                </button>
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
  // 編集中はポーリングをスキップして編集画面が閉じないようにする
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
    ]).then(([result, deleted]) => {
      if (result.error) {
        setSyncError(result.error)
      } else if (result.orders !== null) {
        if (result.orders.length > 0) setOrders(result.orders)
        setLastSync(new Date())
      }
      if (deleted) setDeletedOrders(deleted)
      finishLoading(); clearTimeout(safetyTimer)
    }).catch(() => { setSyncError('接続に失敗しました'); finishLoading(); clearTimeout(safetyTimer) })

    const timer = setInterval(() => {
      // 編集中・フォーム表示中はポーリングをスキップ
      setEditingOrder(current => {
        if (current) return current // 編集中はスキップ
        fetchOrders().then(result => {
          if (result.error) {
            setSyncError(result.error)
          } else if (result.orders !== null) {
            if (result.orders.length > 0) setOrders(result.orders)
            setLastSync(new Date())
          }
        })
        return current
      })
    }, 60000)
    return () => clearInterval(timer)
  }, [authed])

  // ロック状態ポーリング（15秒）編集中はスキップ
  useEffect(() => {
    if (!authed) return
    const fetchLocks = () => {
      setEditingOrder(current => {
        if (current) return current // 編集中はスキップ
        apiCall({ action: 'get_locks' }).then(res => {
          if (res.status === 'ok') setLocks(res.locks || {})
        })
        return current
      })
    }
    // 初回は即実行
    apiCall({ action: 'get_locks' }).then(res => {
      if (res.status === 'ok') setLocks(res.locks || {})
    })
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
    const t = setTimeout(() => setSyncError(''), 10000)
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
    setSyncing(true); setSyncError('')
    const result = await fetchOrders()
    if (result.error) {
      setSyncError(result.error)
    } else if (result.orders) {
      setOrders(result.orders); setLastSync(new Date())
    }
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

  if (loading) {
    return <Loading />
  }

  const hasSettings = can(role, 'settings')

  return (
    <>
      <div className="app">
        <header className="header">
          <div className="header-left">
            <span className="key-icon-wrap">
              <span className="key-wave" />
              <span className="key-wave" />
              <span className="key-wave" />
              <Key size={30} color="var(--accent)" style={{position:'relative',zIndex:1}} />
            </span>
            <span className="header-title">CLH-Support-Bridge</span>
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
              </div>
            )}
          </div>
        </header>

        <div className="main-content">
          <div className="status-grid-v3">
            {/* グループ1: 杉並・お問合せ・案内済み */}
            <div className="stat-group group-3">
              {['suginami','inquiry','guided'].map(id => {
                const s = STATUSES.find(st => st.id === id)
                return (
                  <button key={id} onClick={() => toggleStatus(id)} className={`stat-group-btn${activeStatus === id ? ' active' : ''}`} style={{'--c': s.color}}>
                    <span className="stat-icon">{s.icon}</span>
                    <div className="stat-num">{counts[id]}</div>
                    <div className="stat-label">{s.label}</div>
                  </button>
                )
              })}
            </div>
            {/* 個別: 受注・手配済み・入荷済・作業アポ済み */}
            {['order','arranged','arrived','appt'].map(id => {
              const s = STATUSES.find(st => st.id === id)
              return <StatusCard key={id} status={s} count={counts[id]} active={activeStatus === id} onClick={() => toggleStatus(id)} />
            })}
            {/* グループ2: 完了・キャンセル */}
            <div className="stat-group group-2">
              {['done','cancelled'].map(id => {
                const s = STATUSES.find(st => st.id === id)
                return (
                  <button key={id} onClick={() => toggleStatus(id)} className={`stat-group-btn${activeStatus === id ? ' active' : ''}`} style={{'--c': s.color}}>
                    <span className="stat-icon">{s.icon}</span>
                    <div className="stat-num">{counts[id]}</div>
                    <div className="stat-label">{s.label}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="alert-chips">
            {ALERTS.map(a => <AlertCard key={a.id} alert={a} count={alertCounts[a.id]} active={activeAlert === a.id} onClick={() => toggleAlert(a.id)} />)}
          </div>

          <div className="toolbar-v3">
            <div className="search-wrap-v3">
              <Search size={14} className="search-icon-v3" />
              <input name="search" className="search-input-v3" placeholder="氏名・マンション・電話番号で検索..." value={search} onChange={e => setSearch(e.target.value)} autoComplete="off" />
              {search && <button onClick={() => setSearch('')} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',position:'absolute',right:10,top:'50%',transform:'translateY(-50%)'}}><X size={14}/></button>}
            </div>
            {(activeStatus || activeAlert) && (
              <button className="filter-chip-v3" onClick={() => { setActiveStatus(null); setActiveAlert(null) }}>
                {activeStatus ? STATUSES.find(s=>s.id===activeStatus)?.label : ALERTS.find(a=>a.id===activeAlert)?.label}
                <X size={12} />
              </button>
            )}
            <span className="count-label-v3">{filtered.length}件</span>
          </div>

          {/* 同期ステータスバー */}
          <div className="sync-bar-v3">
            <span>
              {syncError
                ? <span className="sync-err">⚠ {syncError} — <button onClick={pullFromGAS} style={{background:'none',border:'none',color:'#fca5a5',cursor:'pointer',textDecoration:'underline',padding:0,fontSize:'inherit'}}>再試行</button></span>
                : lastSync
                  ? <><span className="sync-dot" /> 最終同期: {formatDate(lastSync.toISOString())}</>
                  : <span style={{color:'var(--warn)'}}>● 未同期 — <button onClick={pullFromGAS} style={{background:'none',border:'none',color:'var(--warn)',cursor:'pointer',textDecoration:'underline',padding:0,fontSize:'inherit'}}>今すぐ同期</button></span>
              }
            </span>
            <span>{APP_VERSION}</span>
          </div>

          <div className="order-list-v3">
            {filtered.length === 0 && (
              <div className="empty-state-v3">
                <div className="empty-icon-v3">🔑</div>
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

    </>
  )
}
