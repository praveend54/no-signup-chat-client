import React, { useState } from 'react'
import axios from 'axios'


const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'


export default function CreateJoin({ onEnter }){
const [name, setName] = useState('Guest-' + Math.floor(Math.random()*10000))
const [code, setCode] = useState('')
const [error, setError] = useState('')


async function handleCreate(){
setError('')
try{
const res = await axios.post(`${API}/api/rooms`)
if(res.data.ok) onEnter(res.data.code, name)
}catch(e){ setError('Could not create room') }
}


async function handleJoin(){
setError('')
if(!code) return setError('Enter code')
try{
const res = await axios.get(`${API}/api/rooms/${code}`)
if(res.data.ok) onEnter(code, name)
}catch(e){ setError('Room not found') }
}


return (
<div className="create-join">
<h2>No-signup Chat</h2>
<label>Display name</label>
<input value={name} onChange={e=>setName(e.target.value)} />


<div className="group">
<button onClick={handleCreate}>Create Room</button>
</div>


<div className="group">
<input placeholder="Room code" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} />
<button onClick={handleJoin}>Join Room</button>
</div>
{error && <div className="error">{error}</div>}


<p className="hint">Rooms are simple 6-character codes — share them with others to join.</p>
</div>
)
}