import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MessageSquare, Send, RotateCcw, AlertTriangle, Bot, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatDateTime } from '../../utils/helpers.js'

const DISCLAIMER = '⚠️ This AI assistant provides general health information only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.'

const SUGGESTED_QUESTIONS = [
  'What does a high blood pressure reading mean?',
  'How can I lower my blood sugar naturally?',
  'What are the early signs of diabetes?',
  'When should I see a cardiologist?',
  'How do I interpret my BMI?',
  'What lifestyle changes help with hypertension?',
]

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      gap: 10,
      alignItems: 'flex-end',
      maxWidth: '100%',
    }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: isUser ? 'var(--color-primary)' : 'var(--color-accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isUser
          ? <User  size={16} color="#fff" />
          : <Bot   size={16} color="#fff" />
        }
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '75%',
        background: isUser ? 'var(--color-primary)' : 'var(--color-surface)',
        color: isUser ? '#fff' : 'var(--color-text)',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        padding: '12px 16px',
        boxShadow: 'var(--shadow-sm)',
        border: isUser ? 'none' : '1px solid var(--color-border)',
        lineHeight: 1.65,
        fontSize: '.9375rem',
        whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
        {msg.timestamp && (
          <div style={{
            fontSize: '.72rem', marginTop: 6,
            color: isUser ? 'rgba(255,255,255,.6)' : 'var(--color-text-light)',
            textAlign: isUser ? 'right' : 'left',
          }}>
            {formatDateTime(msg.timestamp)}
          </div>
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'var(--color-accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Bot size={16} color="#fff" />
      </div>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px 16px 16px 4px',
        padding: '14px 18px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex', gap: 5, alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--color-text-light)',
            display: 'inline-block',
            animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          0%,80%,100% { transform: translateY(0); }
          40%          { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  )
}

export default function AIChatbot({ initialContext }) {
  const { user } = useAuth()
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  const buildInitialMessages = useCallback(() => {
    const welcome = {
      role: 'assistant',
      content: initialContext
        ? `Hello ${user.username}! I can see you have some health concerns from your recent screening. I'm here to help provide general information.\n\n${DISCLAIMER}`
        : `Hello ${user.username}! I'm MediPredict's AI Health Assistant. I can help with general health information, symptom guidance, and wellness advice.\n\n${DISCLAIMER}`,
      timestamp: new Date().toISOString(),
    }
    return [welcome]
  }, [user.username, initialContext])

  const [messages, setMessages] = useState(buildInitialMessages)
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // Reset when initialContext changes
  useEffect(() => {
    setMessages(buildInitialMessages())
  }, [initialContext, buildInitialMessages])

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function sendMessage(text) {
    const trimmed = (text || input).trim()
    if (!trimmed || loading) return

    const userMsg = { role: 'user', content: trimmed, timestamp: new Date().toISOString() }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)
    setError('')

    // Build messages array for API (strip timestamps)
    const apiMessages = history
      .filter(m => m.role !== 'system')
      .map(({ role, content }) => ({ role, content }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          context: initialContext || '',
        }),
      })

      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.reply, timestamp: new Date().toISOString() },
      ])
    } catch (err) {
      setError('Unable to reach the AI service. Please ensure the backend is running on port 4000.')
      // Graceful offline fallback
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `I'm having trouble connecting to the AI service right now. Please make sure the backend server is running.\n\nIn the meantime, here are some general tips:\n• Stay hydrated and get adequate rest.\n• Monitor your symptoms and note any changes.\n• Consult a healthcare professional for personalised advice.\n\n${DISCLAIMER}`,
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleReset() {
    setMessages(buildInitialMessages())
    setError('')
    setInput('')
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', minHeight: 520 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <MessageSquare size={22} color="var(--color-primary)" /> AI Health Assistant
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '.875rem' }}>
            Powered by MediPredict's health AI · Always consult a doctor for medical decisions
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleReset} title="Clear conversation">
          <RotateCcw size={15} /> Clear
        </button>
      </div>

      {/* Connection error */}
      {error && (
        <div className="alert alert-warning" style={{ marginBottom: 12, padding: '10px 14px' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '.875rem' }}>{error}</span>
        </div>
      )}

      {/* Chat window */}
      <div style={{
        flex: 1,
        background: 'var(--color-bg-alt)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        padding: '20px 20px 16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        marginBottom: 16,
      }}>
        {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions — only when fresh */}
      {messages.length <= 1 && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: '.8125rem', color: 'var(--color-text-muted)', marginBottom: 8, fontWeight: 600 }}>
            Suggested questions:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUGGESTED_QUESTIONS.map(q => (
              <button key={q} onClick={() => sendMessage(q)}
                style={{
                  padding: '5px 12px', borderRadius: 'var(--radius-full)',
                  border: '1.5px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-muted)',
                  fontSize: '.8125rem', cursor: 'pointer', fontWeight: 500,
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.color = 'var(--color-primary)' }}
                onMouseLeave={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.color = 'var(--color-text-muted)' }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input box */}
      <div style={{
        display: 'flex', gap: 10,
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '10px 10px 10px 16px',
        boxShadow: 'var(--shadow-sm)',
        transition: 'border-color .15s',
      }}
        onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
        onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
      >
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a health question… (Enter to send, Shift+Enter for new line)"
          disabled={loading}
          style={{
            flex: 1, border: 'none', outline: 'none', resize: 'none',
            fontFamily: 'var(--font-body)', fontSize: '.9375rem',
            color: 'var(--color-text)', background: 'transparent',
            lineHeight: 1.5, maxHeight: 120, overflowY: 'auto',
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: loading || !input.trim() ? 'var(--color-bg-alt)' : 'var(--color-primary)',
            border: 'none', cursor: loading || !input.trim() ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .18s',
            alignSelf: 'flex-end',
          }}
        >
          {loading
            ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            : <Send size={16} color={loading || !input.trim() ? 'var(--color-text-light)' : '#fff'} />
          }
        </button>
      </div>

      {/* Footer disclaimer */}
      <p style={{
        textAlign: 'center', fontSize: '.75rem',
        color: 'var(--color-text-light)', marginTop: 8, lineHeight: 1.5,
      }}>
        {DISCLAIMER}
      </p>
    </div>
  )
}
