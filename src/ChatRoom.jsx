import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, LogOut } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ChatRoom({ roomCode, name, onLeave }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [hasLeft, setHasLeft] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMobileKeyboardOpen, setIsMobileKeyboardOpen] = useState(false);
  const bottomRef = useRef(null);
  const chatRef = useRef(null);

  const username = name || '';

  // Connect socket
  useEffect(() => {
    const s = io(API, { autoConnect: true });
    setSocket(s);

    s.on('connect', () => {
      setIsConnected(true);
      s.emit('join-room', { code: roomCode, name }, (res) => {
        if (!res || !res.ok) {
          setStatus(res?.error || 'Failed to join');
          return;
        }
        setMessages(res.history || []);
      });
    });

    s.on('disconnect', () => setIsConnected(false));
    s.on('new-message', (m) => setMessages((prev) => [...prev, m]));
    s.on('user-joined', ({ name: who }) => setMessages((p) => [...p, { system: true, text: `${who} joined` }]));
    s.on('user-left', ({ name: who }) => setMessages((p) => [...p, { system: true, text: `${who} left` }]));
    s.on('room-ended', () => {
      setStatus('Room ended by host.');
      setTimeout(() => onLeave(), 1200);
    });

    return () => {
      try { s.disconnect(); } catch {}
    };
  }, [roomCode, name, onLeave]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detect mobile keyboard visibility
  useEffect(() => {
    const handleResize = () => {
      if (window.innerHeight < 500) {
        setIsMobileKeyboardOpen(true);
      } else {
        setIsMobileKeyboardOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function send() {
    if (hasLeft || !text.trim() || !socket?.connected) return;
    socket.emit('send-message', { code: roomCode, name, text });
    setText('');
  }

  function leave() {
    if (hasLeft) return;
    setHasLeft(true);
    setStatus('You left the room.');
    if (socket) {
      try { socket.emit('leave-room', { code: roomCode, name }); } catch {}
      try { socket.disconnect(); } catch {}
    }
    setTimeout(() => onLeave(), 200);
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="h-screen w-full bg-[#0b141a] flex flex-col">
      {/* Header */}
      <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white font-semibold text-lg">
            {roomCode.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-white font-medium text-lg tracking-wide">
              Room <span className="font-mono font-bold">{roomCode}</span>
            </h2>
            <p className="text-[#8696a0] text-xs">
              {isConnected ? '● Connected' : '○ Connecting...'}
            </p>
          </div>
        </div>

        <button
          onClick={leave}
          disabled={hasLeft}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          <LogOut className="w-4 h-4" />
          Leave
        </button>
      </div>

      {/* Chat Area */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto px-4 py-6 relative scroll-smooth"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundColor: '#0b141a'
        }}
      >
        <div className="max-w-5xl mx-auto">
          {messages.map((msg, index) => {
            if (msg.system) {
              return (
                <div key={index} className="flex justify-center my-4">
                  <div className="bg-[#182229] text-[#8696a0] text-xs px-3 py-1.5 rounded-lg shadow-sm">
                    {msg.text}
                  </div>
                </div>
              );
            }

            const senderName = msg.name ?? msg.sender ?? '';
            const isOwn = senderName === username;
            const displayName = isOwn ? 'You' : (senderName || 'Unknown');
            const time = msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={index} className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] sm:max-w-[65%] md:max-w-[60%] rounded-lg px-3 py-2 shadow-md ${
                    isOwn ? 'bg-[#005c4b] text-white' : 'bg-[#202c33] text-[#e9edef]'
                  }`}
                >
                  {!isOwn && (
                    <div className="text-[#00a884] text-xs font-semibold mb-1">{displayName}</div>
                  )}
                  <div className="text-sm break-words">{msg.text}</div>
                  <div className="text-[10px] mt-1 text-right text-[#8696a0]">
                    {time}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Status */}
      {status && (
        <div className="px-4 py-2 bg-[#182229] text-center">
          <p className="text-[#8696a0] text-sm">{status}</p>
        </div>
      )}

      {/* Floating Input Area (keyboard-aware on mobile) */}
      <div
        className={`px-4 py-3 bg-[#202c33] transition-all duration-300 ${
          isMobileKeyboardOpen
            ? 'fixed bottom-0 left-0 w-full z-50'
            : 'relative'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-[#2a3942] rounded-lg px-4 py-2.5">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message"
              disabled={!!status || hasLeft}
              className="flex-1 bg-transparent text-white text-sm placeholder-[#8696a0] outline-none disabled:opacity-50"
            />
          </div>

          <button
            type="button"
            onClick={send}
            disabled={!!status || !text.trim() || hasLeft}
            className={`p-3 rounded-full transition-all ${
              text.trim() && !status && !hasLeft
                ? 'bg-[#00a884] hover:bg-[#06cf9c] text-white'
                : 'bg-[#2a3942] text-[#8696a0] cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
