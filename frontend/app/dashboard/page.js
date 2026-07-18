'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

function DashboardMessages({ currentUser }) {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://http://44.200.227.55:5000/api/messages/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const seen = new Set();
        const unique = [];
        data.forEach(msg => {
          const otherId = msg.sender._id === currentUser?.id
            ? msg.receiver._id : msg.sender._id;
          if (!seen.has(otherId)) {
            seen.add(otherId);
            unique.push({
              user: msg.sender._id === currentUser?.id ? msg.receiver : msg.sender,
              lastMessage: msg.message,
              time: msg.createdAt
            });
          }
        });
        setConversations(unique);
      }
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const fetchMessages = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://http://44.200.227.55:5000/api/messages/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.log(err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://http://44.200.227.55:5000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ receiverId: selectedUser._id, message: newMessage.trim() })
      });
      const data = await res.json();
      if (data._id) {
        setMessages(prev => [...prev, data]);
        setNewMessage('');
        fetchConversations();
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (currentUser) fetchConversations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (selectedUser) fetchMessages(selectedUser._id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{display: 'grid', gridTemplateColumns: '250px 1fr', flex: 1, overflow: 'hidden'}}>
      {/* CONVERSATIONS LIST */}
      <div style={{borderRight: '1px solid rgba(255,255,255,0.08)', overflowY: 'auto'}}>
        {loading ? (
          <div style={{textAlign: 'center', color: '#546e7a', padding: '30px', fontSize: '13px'}}>⏳ Loading...</div>
        ) : conversations.length === 0 ? (
          <div style={{textAlign: 'center', color: '#546e7a', padding: '30px'}}>
            <div style={{fontSize: '32px', marginBottom: '8px'}}>💬</div>
            <p style={{fontSize: '12px'}}>No conversations yet</p>
          </div>
        ) : conversations.map((conv, i) => (
          <div key={i} onClick={() => setSelectedUser(conv.user)} style={{
            padding: '12px 16px', cursor: 'pointer',
            background: selectedUser?._id === conv.user._id ? 'rgba(100,181,246,0.1)' : 'transparent',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            borderLeft: selectedUser?._id === conv.user._id ? '3px solid #64b5f6' : '3px solid transparent'
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 'bold', fontSize: '14px'
              }}>{conv.user.name?.charAt(0).toUpperCase()}</div>
              <div style={{flex: 1, minWidth: 0}}>
                <p style={{color: 'white', fontSize: '13px', fontWeight: '500', margin: 0}}>{conv.user.name}</p>
                <p style={{
                  color: '#546e7a', fontSize: '11px', margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>{conv.lastMessage}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CHAT AREA */}
      <div style={{display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
        {!selectedUser ? (
          <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#546e7a', gap: '8px'}}>
            <div style={{fontSize: '40px'}}>💬</div>
            <p style={{fontSize: '14px'}}>Select a conversation</p>
          </div>
        ) : (
          <>
            <div style={{padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '10px'}}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 'bold', fontSize: '13px'
              }}>{selectedUser.name?.charAt(0).toUpperCase()}</div>
              <div>
                <p style={{color: 'white', fontSize: '14px', fontWeight: '600', margin: 0}}>{selectedUser.name}</p>
                <p style={{color: '#546e7a', fontSize: '11px', margin: 0}}>{selectedUser.email}</p>
              </div>
            </div>
            <div style={{flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
              {messages.length === 0 ? (
                <div style={{textAlign: 'center', color: '#546e7a', padding: '30px'}}>
                  <p style={{fontSize: '13px'}}>Start the conversation! 👋</p>
                </div>
              ) : messages.map((msg, i) => {
                const isMe = msg.sender._id === currentUser?.id || msg.sender.email === currentUser?.email;
                return (
                  <div key={i} style={{display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start'}}>
                    <div style={{
                      maxWidth: '70%', padding: '8px 12px',
                      borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: isMe ? 'linear-gradient(135deg, #1565c0, #0d47a1)' : 'rgba(255,255,255,0.08)',
                      color: 'white', fontSize: '13px', lineHeight: 1.5
                    }}>
                      <p style={{margin: 0}}>{msg.message}</p>
                      <p style={{color: isMe ? 'rgba(255,255,255,0.5)' : '#546e7a', fontSize: '10px', margin: '3px 0 0', textAlign: isMe ? 'right' : 'left'}}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div style={{padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '8px'}}>
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                style={{
                  flex: 1, padding: '10px 14px',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', color: 'white',
                  fontSize: '13px', outline: 'none'
                }}
              />
              <button onClick={sendMessage} disabled={!newMessage.trim()} style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                color: 'white', border: 'none', borderRadius: '10px',
                cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                opacity: !newMessage.trim() ? 0.5 : 1
              }}>Send →</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('items');
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '', description: '', category: 'vehicle',
    pricePerDay: '', location: '', editId: null
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [currentImgIndex, setCurrentImgIndex] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const fetchMyItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://http://44.200.227.55:5000/api/items', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const fetchMyBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://http://44.200.227.55:5000/api/bookings/owner', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      window.location.href = '/auth/login';
      return;
    }
    const parsedUser = JSON.parse(userData);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(parsedUser);
    fetchMyItems();
    fetchMyBookings();
  }, []);

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 3) {
      setError('You can only upload a maximum of 3 images!');
      return;
    }
    setError('');
    const compressImage = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxWidth = 800;
            const scale = Math.min(1, maxWidth / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    };
    const compressedImages = await Promise.all(files.map(compressImage));
    const newImages = [...images, ...files].slice(0, 3);
    const newCompressed = [...imagePreviews, ...compressedImages].slice(0, 3);
    setImages(newImages);
    setImagePreviews(newCompressed);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleAddItem = async () => {
    setError('');
    setSuccess('');
    if (!newItem.title || !newItem.pricePerDay || !newItem.location) {
      setError('Please fill in Title, Price and Location!');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const imageBase64s = imagePreviews;
      const res = await fetch('http://http://44.200.227.55:5000/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...newItem, images: imageBase64s })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.msg || 'Failed to add item');
      } else {
        setSuccess('✅ Item added successfully!');
        setShowAddItem(false);
        setNewItem({ title: '', description: '', category: 'vehicle', pricePerDay: '', location: '', editId: null });
        setImages([]);
        setImagePreviews([]);
        fetchMyItems();
      }
    } catch (err) {
      setError('Something went wrong.');
    }
  };

  const handleEditItem = async () => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      let imageBase64s = imagePreviews;
      const updateData = {
        title: newItem.title,
        description: newItem.description,
        category: newItem.category,
        pricePerDay: newItem.pricePerDay,
        location: newItem.location,
      };
      if (imageBase64s.length > 0) updateData.images = imageBase64s;
      const res = await fetch(`http://http://44.200.227.55:5000/api/items/${newItem.editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updateData)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.msg || 'Failed to update item');
      } else {
        setSuccess('✅ Item updated successfully!');
        setShowAddItem(false);
        setNewItem({ title: '', description: '', category: 'vehicle', pricePerDay: '', location: '', editId: null });
        setImages([]);
        setImagePreviews([]);
        fetchMyItems();
      }
    } catch (err) {
      setError('Something went wrong.');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://http://44.200.227.55:5000/api/items/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchMyItems();
    } catch (err) {
      console.log(err);
    }
  };

  const handleBookingStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://http://44.200.227.55:5000/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      fetchMyBookings();
    } catch (err) {
      console.log(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const getImgSrc = (src) => {
    return src.startsWith('data:') ? src : `data:image/jpeg;base64,${src}`;
  };

  const prevImg = (itemId, totalImages) => {
    setCurrentImgIndex(prev => ({
      ...prev,
      [itemId]: prev[itemId] === 0 || !prev[itemId] ? totalImages - 1 : prev[itemId] - 1
    }));
  };

  const nextImg = (itemId, totalImages) => {
    setCurrentImgIndex(prev => ({
      ...prev,
      [itemId]: !prev[itemId] || prev[itemId] === totalImages - 1 ? 0 : prev[itemId] + 1
    }));
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px', color: 'white',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    marginBottom: '14px'
  };

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
          <Link href="/messages" style={{color: '#90a4ae', textDecoration: 'none', fontSize: '14px'}}>💬 Messages</Link>
          <Link href="/bookings" style={{color: '#90a4ae', textDecoration: 'none', fontSize: '14px'}}>📅 Bookings</Link>
          <span style={{color: '#90a4ae', fontSize: '14px'}}>👋 Hello, {user?.name}</span>
          <button onClick={handleLogout} style={{
            background: 'rgba(244,67,54,0.2)', color: '#ef9a9a',
            border: '1px solid rgba(244,67,54,0.3)',
            padding: '8px 20px', borderRadius: '12px',
            fontSize: '14px', cursor: 'pointer'
          }}>Logout</button>
        </div>
      </nav>

      <section style={{padding: '40px', maxWidth: '1200px', margin: '0 auto'}}>

        {/* WELCOME */}
        <div style={{marginBottom: '32px'}}>
          <h2 style={{color: 'white', fontSize: '32px', fontWeight: 'bold', marginBottom: '8px'}}>
            Dashboard 📊
          </h2>
          <p style={{color: '#546e7a'}}>Manage your items and bookings</p>
        </div>

        {/* STATS */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px'}}>
          {[
            { label: 'My Items', value: items.length, icon: '📦', color: '#1565c0' },
            { label: 'Total Bookings', value: bookings.length, icon: '📅', color: '#0d47a1' },
            { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, icon: '✅', color: '#2e7d32' },
            { label: 'Total Income', value: `Rs. ${bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + (b.totalPrice || 0), 0)}`, icon: '💰', color: '#1a237e' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${stat.color}44`,
              borderRadius: '16px', padding: '24px',
              display: 'flex', alignItems: 'center', gap: '16px'
            }}>
              <div style={{
                background: `${stat.color}33`, width: '52px', height: '52px',
                borderRadius: '14px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '24px'
              }}>{stat.icon}</div>
              <div>
                <div style={{color: 'white', fontSize: '22px', fontWeight: 'bold'}}>{stat.value}</div>
                <div style={{color: '#546e7a', fontSize: '13px'}}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ANALYTICS SECTION */}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px'}}>

          {/* BOOKING STATUS CHART */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(100,181,246,0.15)',
            borderRadius: '20px', padding: '24px'
          }}>
            <h3 style={{color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '20px'}}>
              📊 Booking Overview
            </h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
              {[
                { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, color: '#4caf50' },
                { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length, color: '#ffc107' },
                { label: 'Rejected', value: bookings.filter(b => b.status === 'rejected').length, color: '#f44336' },
              ].map((bar, i) => {
                const percent = bookings.length > 0 ? (bar.value / bookings.length) * 100 : 0;
                return (
                  <div key={i}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                      <span style={{color: '#90a4ae', fontSize: '13px'}}>{bar.label}</span>
                      <span style={{color: 'white', fontSize: '13px', fontWeight: '600'}}>{bar.value}</span>
                    </div>
                    <div style={{background: 'rgba(255,255,255,0.08)', borderRadius: '999px', height: '8px', overflow: 'hidden'}}>
                      <div style={{width: `${percent}%`, height: '100%', background: bar.color, borderRadius: '999px', transition: 'width 1s ease'}}/>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)'}}>
              {[
                { label: 'Confirmed', color: '#4caf50', value: bookings.filter(b => b.status === 'confirmed').length },
                { label: 'Pending', color: '#ffc107', value: bookings.filter(b => b.status === 'pending').length },
                { label: 'Rejected', color: '#f44336', value: bookings.filter(b => b.status === 'rejected').length },
              ].map((item, i) => (
                <div key={i} style={{textAlign: 'center'}}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: `${item.color}22`, border: `3px solid ${item.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 6px', color: item.color, fontWeight: 'bold', fontSize: '14px'
                  }}>{item.value}</div>
                  <div style={{color: '#546e7a', fontSize: '11px'}}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* INCOME BY ITEM */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(100,181,246,0.15)',
            borderRadius: '20px', padding: '24px'
          }}>
            <h3 style={{color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '20px'}}>
              💰 Income by Item
            </h3>
            {items.length === 0 ? (
              <div style={{textAlign: 'center', color: '#546e7a', padding: '40px 0'}}>
                <div style={{fontSize: '40px', marginBottom: '8px'}}>📭</div>
                <p style={{fontSize: '13px'}}>No items yet</p>
              </div>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {items.slice(0, 5).map((item, i) => {
                  const itemIncome = bookings
                    .filter(b => b.item?._id === item._id && b.status === 'confirmed')
                    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
                  const maxIncome = Math.max(...items.map(it =>
                    bookings.filter(b => b.item?._id === it._id && b.status === 'confirmed')
                            .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
                  ), 1);
                  const percent = (itemIncome / maxIncome) * 100;
                  return (
                    <div key={i}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                        <span style={{color: '#90a4ae', fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{item.title}</span>
                        <span style={{color: '#64b5f6', fontSize: '12px', fontWeight: '600'}}>Rs. {itemIncome}</span>
                      </div>
                      <div style={{background: 'rgba(255,255,255,0.08)', borderRadius: '999px', height: '8px', overflow: 'hidden'}}>
                        <div style={{width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, #1565c0, #64b5f6)', borderRadius: '999px', transition: 'width 1s ease'}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{color: '#546e7a', fontSize: '13px'}}>Total Income</span>
              <span style={{color: '#64b5f6', fontSize: '18px', fontWeight: 'bold'}}>
                Rs. {bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + (b.totalPrice || 0), 0)}
              </span>
            </div>
          </div>
        </div>

        {/* SUCCESS MESSAGE */}
        {success && (
          <div style={{
            background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)',
            borderRadius: '12px', padding: '14px', marginBottom: '20px',
            color: '#81c784', fontSize: '14px', textAlign: 'center'
          }}>{success}</div>
        )}

        {/* TABS */}
        <div style={{display: 'flex', gap: '8px', marginBottom: '24px'}}>
          {['items', 'messages', 'bookings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '10px 24px', borderRadius: '12px', border: 'none',
              cursor: 'pointer', fontSize: '14px', fontWeight: '600',
              background: activeTab === tab ? 'linear-gradient(135deg, #1565c0, #0d47a1)' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab ? 'white' : '#546e7a',
            }}>
              {tab === 'items' ? '📦 My Items' : tab === 'messages' ? '💬 Messages' : '📅 Bookings'}
            </button>
          ))}
          {activeTab === 'items' && (
            <button onClick={() => {
              setNewItem({ title: '', description: '', category: 'vehicle', pricePerDay: '', location: '', editId: null });
              setImages([]);
              setImagePreviews([]);
              setError('');
              setShowAddItem(!showAddItem);
            }} style={{
              marginLeft: 'auto', padding: '10px 24px',
              background: 'rgba(100,181,246,0.15)',
              border: '1px solid rgba(100,181,246,0.3)',
              borderRadius: '12px', color: '#64b5f6',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer'
            }}>+ Add New Item</button>
          )}
        </div>

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(100,181,246,0.15)',
            borderRadius: '20px', overflow: 'hidden',
            height: '500px', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h3 style={{color: 'white', fontSize: '16px', fontWeight: 'bold', margin: 0}}>💬 Messages</h3>
              <Link href="/messages" style={{
                color: '#64b5f6', fontSize: '13px', textDecoration: 'none',
                background: 'rgba(100,181,246,0.1)', border: '1px solid rgba(100,181,246,0.2)',
                padding: '5px 14px', borderRadius: '8px'
              }}>Open Full Messages →</Link>
            </div>
            <DashboardMessages currentUser={user} />
          </div>
        )}

        {/* ADD / EDIT ITEM FORM */}
        {showAddItem && activeTab === 'items' && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(100,181,246,0.2)',
            borderRadius: '20px', padding: '28px', marginBottom: '24px'
          }}>
            <h3 style={{color: 'white', fontWeight: 'bold', marginBottom: '20px', fontSize: '18px'}}>
              {newItem.editId ? '✏️ Edit Item' : '➕ Add New Item'}
            </h3>
            {error && (
              <div style={{
                background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)',
                borderRadius: '10px', padding: '12px', marginBottom: '16px',
                color: '#ef9a9a', fontSize: '14px'
              }}>{error}</div>
            )}
            <input placeholder="Item Title *" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} style={inputStyle}/>
            <textarea placeholder="Description" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} style={{...inputStyle, height: '80px', resize: 'none'}}/>
            <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} style={inputStyle}>
              <option value="vehicle">🚗 Vehicle</option>
              <option value="tool">🔧 Tool</option>
              <option value="equipment">⚙️ Equipment</option>
            </select>
            <input placeholder="Price Per Day (Rs.) *" type="number" value={newItem.pricePerDay} onChange={e => setNewItem({...newItem, pricePerDay: e.target.value})} style={inputStyle}/>
            <input placeholder="Location (e.g. Colombo) *" value={newItem.location} onChange={e => setNewItem({...newItem, location: e.target.value})} style={inputStyle}/>

            {/* IMAGE UPLOAD */}
            <div style={{marginBottom: '14px'}}>
              <label style={{color: '#90a4ae', fontSize: '13px', display: 'block', marginBottom: '8px'}}>
                📸 Upload Images (Maximum 3 images)
                {newItem.editId && <span style={{color: '#546e7a'}}> — Upload new images to replace existing ones</span>}
              </label>
              <div onClick={() => fileInputRef.current.click()} style={{
                border: '2px dashed rgba(100,181,246,0.3)', borderRadius: '12px', padding: '24px',
                textAlign: 'center', cursor: 'pointer', background: 'rgba(100,181,246,0.05)', marginBottom: '12px'
              }}>
                <div style={{fontSize: '32px', marginBottom: '8px'}}>📁</div>
                <p style={{color: '#64b5f6', fontSize: '14px', margin: 0}}>Click to upload images</p>
                <p style={{color: '#546e7a', fontSize: '12px', marginTop: '4px'}}>{images.length}/3 images selected</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageChange} style={{display: 'none'}}/>
              {imagePreviews.length > 0 && (
                <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                  {imagePreviews.map((preview, i) => (
                    <div key={i} style={{position: 'relative'}}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt={`preview ${i + 1}`} style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '10px', border: '2px solid rgba(100,181,246,0.3)'}}/>
                      <button onClick={() => removeImage(i)} style={{
                        position: 'absolute', top: '-8px', right: '-8px',
                        background: '#f44336', color: 'white', border: 'none',
                        borderRadius: '50%', width: '22px', height: '22px',
                        cursor: 'pointer', fontSize: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>✕</button>
                    </div>
                  ))}
                  {images.length < 3 && (
                    <div onClick={() => fileInputRef.current.click()} style={{
                      width: '100px', height: '100px', border: '2px dashed rgba(100,181,246,0.3)',
                      borderRadius: '10px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', cursor: 'pointer', color: '#64b5f6', fontSize: '28px'
                    }}>+</div>
                  )}
                </div>
              )}
            </div>

            <div style={{display: 'flex', gap: '12px'}}>
              <button onClick={newItem.editId ? handleEditItem : handleAddItem} style={{
                flex: 1, padding: '12px', background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                color: 'white', border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: '600', cursor: 'pointer'
              }}>{newItem.editId ? 'Update Item ✅' : 'Add Item ✅'}</button>
              <button onClick={() => {
                setShowAddItem(false); setImages([]); setImagePreviews([]); setError('');
                setNewItem({ title: '', description: '', category: 'vehicle', pricePerDay: '', location: '', editId: null });
              }} style={{
                padding: '12px 24px', background: 'rgba(255,255,255,0.05)',
                color: '#90a4ae', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', cursor: 'pointer'
              }}>Cancel</button>
            </div>
          </div>
        )}

        {/* ITEMS TAB */}
        {activeTab === 'items' && (
          <div>
            {loading ? (
              <div style={{textAlign: 'center', color: '#546e7a', padding: '40px'}}>
                <div style={{fontSize: '40px', marginBottom: '12px'}}>⏳</div>
                <p>Loading items...</p>
              </div>
            ) : items.length === 0 ? (
              <div style={{textAlign: 'center', color: '#546e7a', padding: '60px',
                background: 'rgba(255,255,255,0.03)', borderRadius: '20px',
                border: '1px dashed rgba(255,255,255,0.1)'}}>
                <div style={{fontSize: '56px', marginBottom: '16px'}}>📭</div>
                <h3 style={{color: 'white', marginBottom: '8px'}}>No items yet</h3>
                <p>Click Add New Item to list your first item!</p>
              </div>
            ) : (
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px'}}>
                {items.map((item, i) => {
                  const currentIdx = currentImgIndex[item._id] || 0;
                  return (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(100,181,246,0.15)',
                      borderRadius: '16px', overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '160px', position: 'relative', overflow: 'hidden',
                        background: 'linear-gradient(135deg, #1565c020, #0d47a120)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {item.images && item.images.length > 0 ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={getImgSrc(item.images[currentIdx])} alt={item.title} style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
                            {item.images.length > 1 && (
                              <>
                                <button onClick={() => prevImg(item._id, item.images.length)} style={{
                                  position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
                                  background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
                                  borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '16px',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>‹</button>
                                <button onClick={() => nextImg(item._id, item.images.length)} style={{
                                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                                  background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
                                  borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '16px',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>›</button>
                                <div style={{position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px'}}>
                                  {item.images.map((_, idx) => (
                                    <div key={idx} onClick={() => setCurrentImgIndex(prev => ({...prev, [item._id]: idx}))} style={{
                                      width: '6px', height: '6px', borderRadius: '50%', cursor: 'pointer',
                                      background: idx === currentIdx ? '#64b5f6' : 'rgba(255,255,255,0.4)'
                                    }}/>
                                  ))}
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          <span style={{fontSize: '48px'}}>
                            {item.category === 'vehicle' ? '🚗' : item.category === 'tool' ? '🔧' : '⚙️'}
                          </span>
                        )}
                      </div>
                      <div style={{padding: '16px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px'}}>
                          <h4 style={{color: 'white', fontWeight: '600', margin: 0}}>{item.title}</h4>
                          <span style={{background: 'rgba(21,101,192,0.3)', color: '#64b5f6', fontSize: '11px', padding: '2px 8px', borderRadius: '999px'}}>{item.category}</span>
                        </div>
                        <p style={{color: '#546e7a', fontSize: '13px', marginBottom: '4px'}}>📍 {item.location}</p>
                        <p style={{color: '#64b5f6', fontWeight: 'bold', marginBottom: '16px', fontSize: '16px'}}>Rs. {item.pricePerDay}/day</p>
                        <div style={{display: 'flex', gap: '8px'}}>
                          <button onClick={() => {
                            setNewItem({ title: item.title, description: item.description || '', category: item.category, pricePerDay: item.pricePerDay, location: item.location, editId: item._id });
                            setImages([]); setImagePreviews([]); setError(''); setShowAddItem(true);
                          }} style={{
                            flex: 1, padding: '8px', background: 'rgba(100,181,246,0.15)',
                            border: '1px solid rgba(100,181,246,0.3)', borderRadius: '10px',
                            color: '#64b5f6', fontSize: '13px', cursor: 'pointer', fontWeight: '500'
                          }}>✏️ Edit</button>
                          <button onClick={() => handleDeleteItem(item._id)} style={{
                            flex: 1, padding: '8px', background: 'rgba(244,67,54,0.15)',
                            border: '1px solid rgba(244,67,54,0.3)', borderRadius: '10px',
                            color: '#ef9a9a', fontSize: '13px', cursor: 'pointer', fontWeight: '500'
                          }}>🗑️ Delete</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            {bookings.length === 0 ? (
              <div style={{textAlign: 'center', color: '#546e7a', padding: '60px',
                background: 'rgba(255,255,255,0.03)', borderRadius: '20px',
                border: '1px dashed rgba(255,255,255,0.1)'}}>
                <div style={{fontSize: '56px', marginBottom: '16px'}}>📭</div>
                <h3 style={{color: 'white', marginBottom: '8px'}}>No bookings yet</h3>
                <p>Bookings will appear here when users request your items</p>
              </div>
            ) : bookings.map((booking, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(100,181,246,0.15)',
                borderRadius: '16px', padding: '20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h4 style={{color: 'white', fontWeight: '600', marginBottom: '6px'}}>{booking.item?.title}</h4>
                  <p style={{color: '#546e7a', fontSize: '13px', marginBottom: '4px'}}>
                    👤 Renter: {booking.renter?.name} — {booking.renter?.email}
                  </p>
                  <p style={{color: '#546e7a', fontSize: '13px', marginBottom: '4px'}}>
                    📅 {new Date(booking.startDate).toLocaleDateString()} → {new Date(booking.endDate).toLocaleDateString()}
                  </p>
                  <p style={{color: '#64b5f6', fontWeight: 'bold'}}>Rs. {booking.totalPrice}</p>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end'}}>
                  <span style={{
                    background: booking.status === 'confirmed' ? 'rgba(76,175,80,0.2)' :
                               booking.status === 'rejected' ? 'rgba(244,67,54,0.2)' : 'rgba(255,193,7,0.2)',
                    color: booking.status === 'confirmed' ? '#81c784' :
                           booking.status === 'rejected' ? '#ef9a9a' : '#fff176',
                    padding: '4px 14px', borderRadius: '999px', fontSize: '13px'
                  }}>{booking.status}</span>
                  {booking.status === 'pending' && (
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button onClick={() => handleBookingStatus(booking._id, 'confirmed')} style={{
                        padding: '6px 16px', background: 'rgba(76,175,80,0.2)',
                        border: '1px solid rgba(76,175,80,0.3)',
                        borderRadius: '8px', color: '#81c784', cursor: 'pointer', fontSize: '13px'
                      }}>✅ Accept</button>
                      <button onClick={() => handleBookingStatus(booking._id, 'rejected')} style={{
                        padding: '6px 16px', background: 'rgba(244,67,54,0.2)',
                        border: '1px solid rgba(244,67,54,0.3)',
                        borderRadius: '8px', color: '#ef9a9a', cursor: 'pointer', fontSize: '13px'
                      }}>❌ Reject</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </section>
    </main>
  );
}