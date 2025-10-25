import React, { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'


const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'


export default function ChatRoom({ roomCode, name, onLeave }){
const [socket, setSocket] = useState(null)
const [messages, setMessages] = useState([])
const [text, setText] = useState('')
const [status, setStatus] = useState('')
const [hasLeft, setHasLeft] = useState(false) // <- added
const bottomRef = useRef(null)


useEffect(()=>{
const s = io(API, { autoConnect: true })
setSocket(s)


s.on('connect', ()=>{
s.emit('join-room', { code: roomCode, name }, (res)=>{
if(!res || !res.ok){ setStatus(res?.error || 'failed to join'); return }
setMessages(res.history || [])
})
})


s.on('new-message', (m)=>{
setMessages(prev => [...prev, m])
})


s.on('user-joined', ({ name })=>{
setMessages(prev => [...prev, { system: true, text: `${name} joined` }])
})


s.on('user-left', ({ name })=>{
setMessages(prev => [...prev, { system: true, text: `${name} left` }])
})


s.on('room-ended', ()=>{
setStatus('Room ended by host.');
setTimeout(()=> onLeave(), 1500);
})


return ()=>{
s.disconnect()
}
}, [roomCode])


useEffect(()=>{ bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])


function send(){
  // prevent sending after leaving or when socket is not connected
  if(hasLeft) return
  if(!text.trim()) return
  if(!socket || !socket.connected) return

  socket.emit('send-message', { code: roomCode, name, text }, ()=>{})
  // removed optimistic append to avoid duplicate messages when server broadcasts back
  setText('')
}


function leave(){
  if(hasLeft) return
  setHasLeft(true)
  setStatus('You left the room.')
  if(socket){
    try { socket.emit('leave-room', { code: roomCode, name }) } catch(e){/* ignore */ }
    try { socket.disconnect() } catch(e){/* ignore */ }
  }
  // call onLeave to navigate away / unmount the component
  setTimeout(()=> onLeave(), 200)
}

return (
  <div className="chat-room">
    <div className="chat-header">
      <span>Room: {roomCode}</span>
      <button onClick={leave} disabled={hasLeft}>Leave</button>
    </div>
    <div className="chat-messages" style={{ overflowY: 'auto', maxHeight: 400 }}>
      {messages.map((m, i) =>
        m.system ? (
          <div key={i} className="chat-system">{m.text}</div>
        ) : (
          <div key={i} className={`chat-message${m.sender === name ? ' own' : ''}`}>
            <b>{m.sender || 'Unknown'}:</b> {m.text}
          </div>
        )
      )}
      <div ref={bottomRef} />
    </div>
    {status && <div className="chat-status">{status}</div>}
    <form
      className="chat-input"
      onSubmit={e => {
        e.preventDefault();
        send();
      }}
      style={{ display: 'flex', gap: 8, marginTop: 8 }}
    >
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type a message..."
        disabled={!!status || hasLeft}
        style={{ flex: 1 }}
      />
      <button type="submit" disabled={!!status || !text.trim() || hasLeft}>
        Send
      </button>
    </form>
  </div>
)
}