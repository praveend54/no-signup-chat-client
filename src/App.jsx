import React, { useState } from 'react'
import CreateJoin from './CreateJoin'
import ChatRoom from './ChatRoom'


export default function App(){
const [roomCode, setRoomCode] = useState(null)
const [name, setName] = useState('')


return (
<div className="app-root">
{!roomCode ? (
<CreateJoin onEnter={(code, username)=>{ setRoomCode(code); setName(username); }} />
) : (
<ChatRoom roomCode={roomCode} name={name} onLeave={()=>setRoomCode(null)} />
)}
</div>
)
}