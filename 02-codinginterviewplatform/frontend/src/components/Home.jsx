import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || ''

function Home() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const createRoom = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      navigate(`/room/${data.roomId}`)
    } catch (error) {
      console.error('Failed to create room:', error)
      alert('Failed to create room. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home">
      <h1>⌨️ CodeInterview</h1>
      <p className="subtitle">Collaborative coding interviews made simple</p>
      
      <button 
        className="create-btn" 
        onClick={createRoom}
        disabled={loading}
      >
        {loading ? 'Creating...' : '🚀 Create Interview Room'}
      </button>
      
      <div style={{ marginTop: '3rem', color: '#666', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '1rem', color: '#888' }}>Features</h3>
        <ul style={{ listStyle: 'none', lineHeight: '2' }}>
          <li>✅ Real-time collaborative editing</li>
          <li>✅ Syntax highlighting for multiple languages</li>
          <li>✅ In-browser code execution</li>
          <li>✅ Shareable interview links</li>
        </ul>
      </div>
    </div>
  )
}

export default Home
