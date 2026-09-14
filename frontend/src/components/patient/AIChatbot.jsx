import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageSquare,
  Send,
  RotateCcw,
  AlertTriangle,
  Bot,
  User,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

const DISCLAIMER =
  'MediPredict AI provides general health information and is not a substitute for professional medical advice, diagnosis, or treatment. If you have severe or worsening symptoms, seek urgent medical care.'

const SUGGESTED_QUESTIONS = [
  'What are the warning signs of diabetes?',
  'Why do I keep getting headaches?',
  'Why am I feeling tired all the time?',
  'What can cause stomach pain?',
  'What are common causes of breathing problems?',
]

const AI_HEADINGS = new Set([
  'Common Signs',
  'Tests for Diabetes',
  'Who Should Get Tested?',
  'Why Early Detection is Important',
])

function formatChatTime(timestamp) {
  if (!timestamp) return ''

  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatAIResponse(text) {
  if (!text) return ''

  let formatted = String(text)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()

  // Convert bullet characters to normal bullets
  formatted = formatted.replace(/â€¢\s*/g, '- ')
  formatted = formatted.replace(/•\s*/g, '- ')

  /*
   * Put known headings on their own lines.
   * This handles MedQuad answers where headings may
   * appear between spaces instead of real line breaks.
   */
  const headings = [
    'Common Signs',
    'Tests for Diabetes',
    'Who Should Get Tested?',
    'Why Early Detection is Important',
  ]

  headings.forEach((heading) => {
    const escaped = heading.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    )

    // Heading preceded by punctuation
    formatted = formatted.replace(
      new RegExp(
        `([.!?])\\s+(${escaped})(?=\\s|$)`,
        'gi'
      ),
      '$1\n\n$2\n\n'
    )

    // Heading preceded by multiple spaces
    formatted = formatted.replace(
      new RegExp(
        `\\s{2,}(${escaped})(?=\\s|$)`,
        'gi'
      ),
      '\n\n$1\n\n'
    )
  })

  /*
   * Put inline bullet points onto separate lines.
   */
  formatted = formatted.replace(
    /\s+-\s+(?=[A-Za-z])/g,
    '\n- '
  )

  /*
   * If bullets come directly after a colon,
   * start them on a new paragraph.
   */
  formatted = formatted.replace(
    /:\s+-\s+/g,
    ':\n\n- '
  )

  /*
   * Normalize spaces while preserving line breaks.
   */
  formatted = formatted
    .split('\n')
    .map((line) =>
      line
        .replace(/[ \t]+/g, ' ')
        .trim()
    )
    .join('\n')

  /*
   * Prevent excessive blank lines.
   */
  formatted = formatted.replace(
    /\n{3,}/g,
    '\n\n'
  )

  return formatted.trim()
}

/*
 * Render the AI response as structured React elements.
 * This makes headings bold and bullets visually separate.
 */
function renderAIResponse(text) {
  const formatted = formatAIResponse(text)

  if (!formatted) return null

  const lines = formatted.split('\n')

  return lines.map((line, index) => {
    const trimmed = line.trim()

    // Blank line
    if (!trimmed) {
      return (
        <div
          key={`space-${index}`}
          style={{ height: '8px' }}
        />
      )
    }

    // Heading
    if (AI_HEADINGS.has(trimmed)) {
      return (
        <div
          key={`heading-${index}`}
          style={{
            fontWeight: 700,
            fontSize: '14px',
            color: '#0f766e',
            marginTop: index === 0 ? '0' : '8px',
            marginBottom: '6px',
          }}
        >
          {trimmed}
        </div>
      )
    }

    // Bullet
    if (trimmed.startsWith('- ')) {
      return (
        <div
          key={`bullet-${index}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: '5px',
            paddingLeft: '4px',
          }}
        >
          <span
            style={{
              fontWeight: 400,
              lineHeight: '1.65',
            }}
          >
            •
          </span>

          <span>
            {trimmed.slice(2)}
          </span>
        </div>
      )
    }

    // Normal paragraph/text line
    return (
      <div
        key={`text-${index}`}
        style={{
          marginBottom: '5px',
        }}
      >
        {trimmed}
      </div>
    )
  })
}

function ChatBubble({ message }) {
  const isUser = message.role === 'user'
  const time = formatChatTime(message.timestamp)

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser
          ? 'flex-end'
          : 'flex-start',
        marginBottom: '16px',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          maxWidth: '85%',
          flexDirection: isUser
            ? 'row-reverse'
            : 'row',
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: '36px',
            height: '36px',
            minWidth: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isUser
              ? '#2563eb'
              : '#0f766e',
            color: '#ffffff',
          }}
        >
          {isUser ? (
            <User size={19} />
          ) : (
            <Bot size={19} />
          )}
        </div>

        {/* Message + timestamp */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: isUser
              ? 'flex-end'
              : 'flex-start',
          }}
        >
          <div
            style={{
              padding: '12px 15px',
              borderRadius: isUser
                ? '16px 16px 4px 16px'
                : '16px 16px 16px 4px',
              backgroundColor: isUser
                ? '#2563eb'
                : '#f1f5f9',
              color: isUser
                ? '#ffffff'
                : '#1e293b',
              fontSize: '14px',
              lineHeight: '1.65',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}
          >
            {isUser
              ? message.content
              : renderAIResponse(message.content)}
          </div>

          {/* Message time */}
          {time && (
            <span
              style={{
                marginTop: '4px',
                padding: '0 4px',
                fontSize: '11px',
                color: '#94a3b8',
              }}
            >
              {time}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            minWidth: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f766e',
            color: '#ffffff',
          }}
        >
          <Bot size={19} />
        </div>

        <div
          style={{
            padding: '13px 17px',
            borderRadius: '16px 16px 16px 4px',
            backgroundColor: '#f1f5f9',
            color: '#64748b',
            fontSize: '14px',
          }}
        >
          <span>•</span>
          <span style={{ marginLeft: '4px' }}>
            •
          </span>
          <span style={{ marginLeft: '4px' }}>
            •
          </span>
        </div>
      </div>
    </div>
  )
}

export default function AIChatbot() {
  const { user } = useAuth()

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const patientName =
    user?.name ||
    user?.full_name ||
    user?.username ||
    'Patient'

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, scrollToBottom])

  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          'Hello! I’m MediPredict’s AI Health Assistant. I can help you understand general health questions, symptoms, and common medical information.\n\nWhat would you like to know?',
        timestamp: new Date().toISOString(),
      },
    ])
  }, [])

  const sendMessage = async (
    question = input
  ) => {
    const trimmedQuestion = String(
      question || ''
    ).trim()

    if (!trimmedQuestion || loading) {
      return
    }

    setError('')

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedQuestion,
      timestamp: new Date().toISOString(),
    }

    setMessages((previous) => [
      ...previous,
      userMessage,
    ])

    setInput('')
    setLoading(true)

    try {
      const response = await fetch(
        'http://localhost:8000/predict',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: trimmedQuestion,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(
          `AI service returned status ${response.status}`
        )
      }

      const data = await response.json()

      const answer =
        data?.reply ||
        data?.answer ||
        data?.response ||
        data?.prediction ||
        data?.message

      if (
        typeof answer !== 'string' ||
        !answer.trim()
      ) {
        throw new Error(
          'The AI service returned an invalid response.'
        )
      }

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: answer.trim(),
        timestamp: new Date().toISOString(),
      }

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ])
    } catch (err) {
      console.error(
        'AI chatbot error:',
        err
      )

      setError(
        'Unable to connect to the AI health assistant. Please make sure the AI service is running on port 8000.'
      )

      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content:
          'I’m sorry, I couldn’t connect to the AI health service right now. Please try again in a moment.',
        timestamp: new Date().toISOString(),
      }

      setMessages((previous) => [
        ...previous,
        errorMessage,
      ])
    } finally {
      setLoading(false)

      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    sendMessage()
  }

  const handleSuggestedQuestion = (
    question
  ) => {
    sendMessage(question)
  }

  const resetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content:
          'Hello! I’m MediPredict’s AI Health Assistant. I can help you understand general health questions, symptoms, and common medical information.\n\nWhat would you like to know?',
        timestamp: new Date().toISOString(),
      },
    ])

    setInput('')
    setError('')

    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ccfbf1',
              color: '#0f766e',
            }}
          >
            <MessageSquare size={23} />
          </div>

          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              AI Health Assistant
            </h2>

            <p
              style={{
                margin: '3px 0 0',
                fontSize: '13px',
                color: '#64748b',
              }}
            >
              Patient: <strong>{patientName}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={resetChat}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '9px 13px',
            border: '1px solid #cbd5e1',
            borderRadius: '9px',
            backgroundColor: '#ffffff',
            color: '#334155',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <RotateCcw size={15} />
          New Chat
        </button>
      </div>

      {/* Disclaimer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '12px 14px',
          marginBottom: '16px',
          borderRadius: '10px',
          backgroundColor: '#fff7ed',
          border: '1px solid #fed7aa',
          color: '#9a3412',
          fontSize: '13px',
          lineHeight: '1.5',
        }}
      >
        <AlertTriangle
          size={18}
          style={{
            minWidth: '18px',
            marginTop: '1px',
          }}
        />

        <span>{DISCLAIMER}</span>
      </div>

      {/* Chat */}
      <div
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          backgroundColor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        {/* Messages */}
        <div
          style={{
            minHeight: '420px',
            maxHeight: '600px',
            overflowY: 'auto',
            padding: '20px',
            backgroundColor: '#ffffff',
          }}
        >
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message}
            />
          ))}

          {loading && <TypingIndicator />}

          {error && (
            <div
              style={{
                marginTop: '8px',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          {/* Suggested questions */}
          {messages.length <= 1 &&
            !loading && (
              <div
                style={{
                  marginTop: '10px',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#64748b',
                    marginBottom: '10px',
                  }}
                >
                  Suggested questions
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  {SUGGESTED_QUESTIONS.map(
                    (question) => (
                      <button
                        key={question}
                        type="button"
                        onClick={() =>
                          handleSuggestedQuestion(
                            question
                          )
                        }
                        style={{
                          padding: '8px 11px',
                          borderRadius: '9px',
                          border:
                            '1px solid #cbd5e1',
                          backgroundColor:
                            '#f8fafc',
                          color: '#334155',
                          cursor: 'pointer',
                          fontSize: '12px',
                          lineHeight: '1.4',
                        }}
                      >
                        {question}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            gap: '10px',
            padding: '14px',
            borderTop:
              '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            placeholder="Ask a health question..."
            disabled={loading}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '11px 13px',
              border:
                '1px solid #cbd5e1',
              borderRadius: '10px',
              outline: 'none',
              fontSize: '14px',
              color: '#1e293b',
              backgroundColor: '#ffffff',
              boxSizing: 'border-box',
            }}
          />

          <button
            type="submit"
            disabled={
              loading ||
              !input.trim()
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              padding: '11px 16px',
              border: 'none',
              borderRadius: '10px',
              backgroundColor:
                loading ||
                !input.trim()
                  ? '#94a3b8'
                  : '#0f766e',
              color: '#ffffff',
              cursor:
                loading ||
                !input.trim()
                  ? 'not-allowed'
                  : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            <Send size={16} />
            Send
          </button>
        </form>
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: 'center',
          marginTop: '12px',
          fontSize: '11px',
          color: '#94a3b8',
        }}
      >
        AI-generated information • Always consult a
        qualified healthcare professional for medical
        decisions.
      </div>
    </div>
  )
}