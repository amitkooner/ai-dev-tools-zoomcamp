import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import Editor from '@monaco-editor/react'
import CodeExecutor from './CodeExecutor'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'
const API_URL = import.meta.env.VITE_API_URL || ''

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'python', name: 'Python' },
  { id: 'java', name: 'Java' },
  { id: 'cpp', name: 'C++' },
  { id: 'csharp', name: 'C#' },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' },
  { id: 'sql', name: 'SQL' },
]

function Room() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  
  const [socket, setSocket] = useState(null)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userName, setUserName] = useState('')
  const [showJoinModal, setShowJoinModal] = useState(true)
  const [copied, setCopied] = useState(false)
  const [output, setOutput] = useState('')
  const [outputType, setOutputType] = useState('') // 'success' or 'error'
  
  const editorRef = useRef(null)
  const isRemoteChange = useRef(false)

  // Verify room exists
  useEffect(() => {
    const checkRoom = async () => {
      try {
        const response = await fetch(`${API_URL}/api/rooms/${roomId}`)
        if (!response.ok) {
          setError('Room not found')
        }
      } catch (err) {
        setError('Failed to connect to server')
      } finally {
        setLoading(false)
      }
    }
    checkRoom()
  }, [roomId])

  // Connect to socket after user enters name
  useEffect(() => {
    if (showJoinModal || error) return

    const newSocket = io(SOCKET_URL)
    setSocket(newSocket)

    newSocket.on('connect', () => {
      console.log('Connected to server')
      newSocket.emit('join-room', { roomId, userName })
    })

    newSocket.on('room-state', ({ code, language, users }) => {
      setCode(code)
      setLanguage(language)
      setUsers(users)
    })

    newSocket.on('code-update', ({ code }) => {
      isRemoteChange.current = true
      setCode(code)
    })

    newSocket.on('language-update', ({ language }) => {
      setLanguage(language)
    })

    newSocket.on('user-joined', ({ users }) => {
      setUsers(users)
    })

    newSocket.on('user-left', ({ users }) => {
      setUsers(users)
    })

    newSocket.on('error', ({ message }) => {
      setError(message)
    })

    return () => {
      newSocket.close()
    }
  }, [roomId, userName, showJoinModal, error])

  const handleEditorChange = (value) => {
    if (isRemoteChange.current) {
      isRemoteChange.current = false
      return
    }
    
    setCode(value)
    if (socket) {
      socket.emit('code-change', { code: value })
    }
  }

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value
    setLanguage(newLanguage)
    if (socket) {
      socket.emit('language-change', { language: newLanguage })
    }
  }

  const copyLink = async () => {
    const link = window.location.href
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleJoin = (e) => {
    e.preventDefault()
    if (userName.trim()) {
      setShowJoinModal(false)
    }
  }

  const handleEditorMount = (editor) => {
    editorRef.current = editor
  }

  const handleRunCode = (result, isError) => {
    setOutput(result)
    setOutputType(isError ? 'error' : 'success')
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading room...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-page">
        <h2>😕 {error}</h2>
        <p>The room you're looking for doesn't exist or has expired.</p>
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </div>
    )
  }

  if (showJoinModal) {
    return (
      <div className="join-modal">
        <form className="join-modal-content" onSubmit={handleJoin}>
          <h3>Enter your name</h3>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Your name..."
            autoFocus
            maxLength={20}
          />
          <button type="submit">Join Room</button>
        </form>
      </div>
    )
  }

  return (
    <div className="room">
      <header className="room-header">
        <h2>Room: {roomId}</h2>
        
        <div className="room-controls">
          <select 
            className="language-select"
            value={language}
            onChange={handleLanguageChange}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
          
          <button className="copy-btn" onClick={copyLink}>
            {copied ? '✓ Copied!' : '📋 Copy Link'}
          </button>
          
          <div className="users-list">
            {users.map(user => (
              <span 
                key={user.id} 
                className={`user-badge ${user.name === userName ? 'you' : ''}`}
              >
                {user.name === userName ? `${user.name} (you)` : user.name}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="room-content">
        <div className="editor-panel">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              padding: { top: 16 }
            }}
          />
        </div>

        <div className="output-panel">
          <div className="panel-header">
            <h3>Output</h3>
            <CodeExecutor 
              code={code} 
              language={language} 
              onResult={handleRunCode}
            />
          </div>
          <div className={`output-content ${outputType}`}>
            {output || 'Click "Run Code" to execute...'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Room
