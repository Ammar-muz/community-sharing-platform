'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function MessagesContent() {  
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);
  const searchParams = useSearchParams();

  const getImgSrc = (src) => {
    if (!src) return '';
    return src.startsWith('data:') ? src : `data:image/jpeg;base64,${src}`;
  };

  // Returns data instead of calling setState internally
  const fetchConversations = async (user) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/messages/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const seen = new Set();
        const unique = [];
        data.forEach(msg => {
          const otherId = msg.sender._id === user?.id
            ? msg.receiver._id : msg.sender._id;
          if (!seen.has(otherId)) {
            seen.add(otherId);
            unique.push({
              user: msg.sender._id === user?.id ? msg.receiver : msg.sender,
              lastMessage: msg.message,
              item: msg.item,
              time: msg.createdAt,
              read: msg.read
            }); 
          }
        });
        return unique;
      }
    } catch (err) {
      console.log(err);
    }
    return [];
  };

  // Returns data instead of calling setState internally
  const fetchMessages = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/messages/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.log(err);
      return [];
    }
  };

 const sendMessage = async () => {
  if (!newMessage.trim() || !selectedUser) return;
  setSending(true);
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }
    const res = await fetch('http://localhost:5000/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        receiverId: selectedUser._id,
        message: newMessage.trim()
      })
    });
    const data = await res.json();
    console.log('Send response:', data);
    if (data._id) {
      setMessages(prev => [...prev, data]);
      setNewMessage('');
      const updated = await fetchConversations(currentUser);
      setConversations(updated);
    } else {
      alert('Failed to send: ' + (data.msg || 'Unknown error'));
    }
  } catch (err) {
    console.log('Send error:', err);
    alert('Connection error — is the backend running?');
  }
  setSending(false);
};

  // Effect 1: Read user from localStorage and load initial data
useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      window.location.href = '/auth/login';
      return;
    }

    const load = async () => {
      const parsed = JSON.parse(userData);
      setCurrentUser(parsed);

      const convs = await fetchConversations(parsed);
      setConversations(convs);
      setLoading(false);

      // Check if coming from item page
      const userId = searchParams.get('userId');
      if (userId) {
        // Try to find user info from conversations
        const existingConv = convs.find(c => c.user._id === userId);
        if (existingConv) {
          setSelectedUser(existingConv.user);
        } else {
          setSelectedUser({ _id: userId, name: 'Owner', email: '' });
        }
        const msgs = await fetchMessages(userId);
        setMessages(msgs);
      }
    };

    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Effect 3: Scroll to bottom when messages change

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Effect 4: Load messages when selected user changes
  useEffect(() => {
    if (!selectedUser) return;

    const load = async () => {
      const msgs = await fetchMessages(selectedUser._id);
      setMessages(msgs);
    };

    load();
  }, [selectedUser]);

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1628 100%)',
    }}>

      {/* NAVBAR */}
      <nav style={{
        background: 'rgba(10,22,40,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(100,181,246,0.15)',
        padding: '16px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 50
      }}>
        <Link href="/" style={{display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none'}}>
          <span style={{fontSize: '28px'}}>🤝</span>
          <h1 style={{color: '#64b5f6', fontSize: '20px', fontWeight: 'bold', margin: 0}}>CommunityShare</h1>
        </Link>
        <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
          <Link href="/items" style={{color: '#90a4ae', textDecoration: 'none', fontSize: '14px'}}>Browse</Link>
          <Link href="/dashboard" style={{color: '#90a4ae', textDecoration: 'none', fontSize: '14px'}}>Dashboard</Link>
          <Link href="/bookings" style={{color: '#90a4ae', textDecoration: 'none', fontSize: '14px'}}>Bookings</Link>
        </div>
      </nav>

      <section style={{padding: '20px 40px', maxWidth: '1200px', margin: '0 auto'}}>

        {/* HEADER */}
        <div style={{marginBottom: '20px'}}>
          <h2 style={{color: 'white', fontSize: '28px', fontWeight: 'bold', marginBottom: '4px'}}>
            💬 Messages
          </h2>
          <p style={{color: '#546e7a', fontSize: '14px'}}>Chat with item owners and renters</p>
        </div>

        {/* CHAT LAYOUT */}
        <div style={{
          display: 'grid', gridTemplateColumns: '320px 1fr',
          gap: '16px', height: '70vh'
        }}>

          {/* LEFT — CONVERSATIONS */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(100,181,246,0.15)',
            borderRadius: '16px', overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)'}}>
              <h3 style={{color: 'white', fontSize: '15px', fontWeight: '600', margin: 0}}>
                Conversations
              </h3>
            </div>

            <div style={{flex: 1, overflowY: 'auto'}}>
              {loading ? (
                <div style={{textAlign: 'center', color: '#546e7a', padding: '40px'}}>
                  <div style={{fontSize: '32px', marginBottom: '8px'}}>⏳</div>
                  <p style={{fontSize: '13px'}}>Loading...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div style={{textAlign: 'center', color: '#546e7a', padding: '40px'}}>
                  <div style={{fontSize: '40px', marginBottom: '8px'}}>💬</div>
                  <p style={{fontSize: '13px'}}>No conversations yet</p>
                  <p style={{fontSize: '12px', marginTop: '8px'}}>
                    Go to an item and click Contact Owner
                  </p>
                </div>
              ) : conversations.map((conv, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedUser(conv.user)}
                  style={{
                    padding: '14px 16px', cursor: 'pointer',
                    background: selectedUser?._id === conv.user._id
                      ? 'rgba(100,181,246,0.1)' : 'transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    borderLeft: selectedUser?._id === conv.user._id
                      ? '3px solid #64b5f6' : '3px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 'bold', fontSize: '16px', flexShrink: 0
                    }}>
                      {conv.user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{flex: 1, minWidth: 0}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <span style={{color: 'white', fontSize: '14px', fontWeight: '500'}}>
                          {conv.user.name}
                        </span>
                        <span style={{color: '#546e7a', fontSize: '11px'}}>
                          {new Date(conv.time).toLocaleDateString()}
                        </span>
                      </div>
                      {conv.item && (
                        <p style={{color: '#64b5f6', fontSize: '11px', margin: '2px 0',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>📦 {conv.item.title}</p>
                      )}
                      <p style={{
                        color: '#546e7a', fontSize: '12px', margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>{conv.lastMessage}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — CHAT */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(100,181,246,0.15)',
            borderRadius: '16px', overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
          }}>
            {!selectedUser ? (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexDirection: 'column',
                color: '#546e7a', gap: '12px'
              }}>
                <div style={{fontSize: '64px'}}>💬</div>
                <p style={{fontSize: '16px', color: 'white'}}>Select a conversation</p>
                <p style={{fontSize: '13px'}}>Or contact an owner from an item page</p>
              </div>
            ) : (
              <>
                {/* CHAT HEADER */}
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 'bold', fontSize: '16px'
                  }}>
                    {selectedUser.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{color: 'white', margin: 0, fontSize: '15px', fontWeight: '600'}}>
                      {selectedUser.name}
                    </h4>
                    <p style={{color: '#546e7a', margin: 0, fontSize: '12px'}}>
                      {selectedUser.email}
                    </p>
                  </div>
                </div>

                {/* MESSAGES */}
                <div style={{
                  flex: 1, overflowY: 'auto', padding: '16px',
                  display: 'flex', flexDirection: 'column', gap: '10px'
                }}>
                  {messages.length === 0 ? (
                    <div style={{textAlign: 'center', color: '#546e7a', padding: '40px'}}>
                      <div style={{fontSize: '40px', marginBottom: '8px'}}>👋</div>
                      <p>Start the conversation!</p>
                    </div>
                  ) : messages.map((msg, i) => {
                    const isMe = msg.sender._id === currentUser?.id ||
                                 msg.sender.email === currentUser?.email;
                    return (
                      <div key={i} style={{
                        display: 'flex',
                        justifyContent: isMe ? 'flex-end' : 'flex-start'
                      }}>
                        <div style={{
                          maxWidth: '65%', padding: '10px 14px',
                          borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: isMe
                            ? 'linear-gradient(135deg, #1565c0, #0d47a1)'
                            : 'rgba(255,255,255,0.08)',
                          color: 'white', fontSize: '14px', lineHeight: 1.5
                        }}>
                          {msg.item && (
                            <p style={{
                              color: isMe ? 'rgba(255,255,255,0.7)' : '#64b5f6',
                              fontSize: '11px', marginBottom: '6px', margin: '0 0 6px'
                            }}>📦 {msg.item.title}</p>
                          )}
                          <p style={{margin: 0}}>{msg.message}</p>
                          <p style={{
                            color: isMe ? 'rgba(255,255,255,0.5)' : '#546e7a',
                            fontSize: '10px', margin: '4px 0 0',
                            textAlign: isMe ? 'right' : 'left'
                          }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* MESSAGE INPUT */}
                <div style={{
                  padding: '16px',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', gap: '10px', alignItems: 'center'
                }}>
                  <input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    style={{
                      flex: 1, padding: '12px 16px',
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px', color: 'white',
                      fontSize: '14px', outline: 'none'
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    style={{
                      padding: '12px 20px',
                      background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                      color: 'white', border: 'none', borderRadius: '12px',
                      cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                      opacity: sending || !newMessage.trim() ? 0.5 : 1
                    }}
                  >
                    {sending ? '...' : 'Send →'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function Messages() {
  return (
    <Suspense fallback={<div style={{minHeight: '100vh', background: '#0a1628'}}/>}>
      <MessagesContent />
    </Suspense>
  );
}