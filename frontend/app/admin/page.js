'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');

useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    const fetchAll = async () => {
      try {
        const [usersRes, itemsRes, bookingsRes] = await Promise.all([
          fetch('http://http://44.200.227.55:5000/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://http://44.200.227.55:5000/api/admin/items', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://http://44.200.227.55:5000/api/admin/bookings', { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);
        const usersData = await usersRes.json();
        const itemsData = await itemsRes.json();
        const bookingsData = await bookingsRes.json();
        setUsers(Array.isArray(usersData) ? usersData : []);
        setItems(Array.isArray(itemsData) ? itemsData : []);
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      } catch (err) {
        console.log(err);
      }
      setLoading(false);
    };
    fetchAll();
  }, [router]);
  const handleDeleteItem = async (id) => {
    if (!confirm('Are you sure?')) return;
    const token = localStorage.getItem('token');
    await fetch(`http://http://44.200.227.55:5000/api/admin/items/${id}`, {
      method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
    });
    setItems(prev => prev.filter(i => i._id !== id));
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure?')) return;
    const token = localStorage.getItem('token');
    await fetch(`http://http://44.200.227.55:5000/api/admin/users/${id}`, {
      method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
    });
    setUsers(prev => prev.filter(u => u._id !== id));
  };

  const getImgSrc = (src) => {
    if (!src) return '';
    return src.startsWith('data:') ? src : `data:image/jpeg;base64,${src}`;
  };

  // Date filter function
  const filterByDate = (arr, dateField = 'createdAt') => {
    const now = new Date();
    return arr.filter(item => {
      const date = new Date(item[dateField] || item.createdAt);
      if (dateFilter === 'today') {
        return date.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      } else if (dateFilter === 'month') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const filteredUsers = filterByDate(users);
  const filteredItems = filterByDate(items);
  const filteredBookings = filterByDate(bookings, 'createdAt');

  const totalRevenue = filteredBookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const stats = {
    totalUsers: filteredUsers.length,
    totalItems: filteredItems.length,
    totalBookings: filteredBookings.length,
    totalRevenue,
    pendingBookings: filteredBookings.filter(b => b.status === 'pending').length,
    confirmedBookings: filteredBookings.filter(b => b.status === 'confirmed').length,
    rejectedBookings: filteredBookings.filter(b => b.status === 'rejected').length,
  };

  const categoryCount = {
    vehicle: filteredItems.filter(i => i.category === 'vehicle').length,
    tool: filteredItems.filter(i => i.category === 'tool').length,
    equipment: filteredItems.filter(i => i.category === 'equipment').length,
  };

  const maxCategory = Math.max(categoryCount.vehicle, categoryCount.tool, categoryCount.equipment) || 1;

  // Date filter buttons
  const DateFilterBar = () => (
    <div style={{
      display: 'flex', gap: '8px', marginBottom: '24px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '14px', padding: '8px'
    }}>
      {[
        { key: 'all', label: '📅 All Time' },
        { key: 'today', label: '☀️ Today' },
        { key: 'week', label: '📆 This Week' },
        { key: 'month', label: '🗓️ This Month' },
      ].map(f => (
        <button key={f.key} onClick={() => setDateFilter(f.key)} style={{
          padding: '8px 18px', borderRadius: '10px', border: 'none',
          cursor: 'pointer', fontSize: '13px', fontWeight: '600',
          background: dateFilter === f.key ? 'linear-gradient(135deg, #1565c0, #0d47a1)' : 'transparent',
          color: dateFilter === f.key ? 'white' : '#546e7a',
          transition: 'all 0.2s'
        }}>{f.label}</button>
      ))}
      <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px'}}>
        <span style={{color: '#546e7a', fontSize: '12px'}}>Showing:</span>
        <span style={{color: '#64b5f6', fontSize: '12px', fontWeight: '600'}}>
          {dateFilter === 'all' ? 'All records' :
           dateFilter === 'today' ? "Today's records" :
           dateFilter === 'week' ? 'Last 7 days' : 'This month'}
        </span>
      </div>
    </div>
  );

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
        <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
          <span style={{
            background: 'rgba(100,181,246,0.15)', border: '1px solid rgba(100,181,246,0.3)',
            color: '#64b5f6', padding: '4px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: '600'
          }}>👑 ADMIN</span>
          <Link href="/" style={{color: '#90a4ae', textDecoration: 'none', fontSize: '14px'}}>← Back to Site</Link>
        </div>
      </nav>

      <section style={{padding: '40px', maxWidth: '1300px', margin: '0 auto'}}>

        {/* HEADER */}
        <div style={{marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
          <div>
            <h2 style={{color: 'white', fontSize: '32px', fontWeight: 'bold', marginBottom: '8px'}}>
              Admin Dashboard 👑
            </h2>
            <p style={{color: '#546e7a'}}>Monitor and manage the entire platform</p>
          </div>
          <div style={{color: '#546e7a', fontSize: '13px'}}>
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        {/* DATE FILTER */}
        <DateFilterBar />

        {/* TOP STATS */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px'}}>
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#1565c0', sub: 'Registered users' },
            { label: 'Total Items', value: stats.totalItems, icon: '📦', color: '#0d47a1', sub: 'Listed on platform' },
            { label: 'Total Bookings', value: stats.totalBookings, icon: '📅', color: '#1a237e', sub: 'All time' },
            { label: 'Total Revenue', value: `Rs. ${stats.totalRevenue}`, icon: '💰', color: '#283593', sub: 'Confirmed bookings' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${stat.color}55`,
              borderRadius: '18px', padding: '24px',
              display: 'flex', alignItems: 'center', gap: '16px'
            }}>
              <div style={{
                background: `${stat.color}33`, width: '56px', height: '56px',
                borderRadius: '16px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '26px', flexShrink: 0
              }}>{stat.icon}</div>
              <div>
                <div style={{color: 'white', fontSize: '26px', fontWeight: 'bold', lineHeight: 1}}>{stat.value}</div>
                <div style={{color: 'white', fontSize: '13px', fontWeight: '500', marginTop: '4px'}}>{stat.label}</div>
                <div style={{color: '#546e7a', fontSize: '11px', marginTop: '2px'}}>{stat.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CHARTS ROW */}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px'}}>

          {/* BOOKING STATUS CHART */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(100,181,246,0.15)',
            borderRadius: '20px', padding: '28px'
          }}>
            <h3 style={{color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '24px'}}>
              📊 Booking Status Overview
            </h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              {[
                { label: 'Confirmed', value: stats.confirmedBookings, color: '#4caf50' },
                { label: 'Pending', value: stats.pendingBookings, color: '#ffc107' },
                { label: 'Rejected', value: stats.rejectedBookings, color: '#f44336' },
              ].map((bar, i) => {
                const percent = stats.totalBookings > 0 ? (bar.value / stats.totalBookings) * 100 : 0;
                return (
                  <div key={i}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                      <span style={{color: '#90a4ae', fontSize: '13px'}}>{bar.label}</span>
                      <span style={{color: 'white', fontSize: '13px', fontWeight: '600'}}>{bar.value}</span>
                    </div>
                    <div style={{background: 'rgba(255,255,255,0.08)', borderRadius: '999px', height: '10px', overflow: 'hidden'}}>
                      <div style={{width: `${percent}%`, height: '100%', background: bar.color, borderRadius: '999px'}}/>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '20px',
              marginTop: '24px', paddingTop: '20px',
              borderTop: '1px solid rgba(255,255,255,0.08)'
            }}>
              {[
                { label: 'Confirmed', color: '#4caf50', value: stats.confirmedBookings },
                { label: 'Pending', color: '#ffc107', value: stats.pendingBookings },
                { label: 'Rejected', color: '#f44336', value: stats.rejectedBookings },
              ].map((item, i) => (
                <div key={i} style={{textAlign: 'center'}}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: `${item.color}22`, border: `3px solid ${item.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 6px', color: item.color, fontWeight: 'bold', fontSize: '14px'
                  }}>{item.value}</div>
                  <div style={{color: '#546e7a', fontSize: '11px'}}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ITEMS BY CATEGORY */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(100,181,246,0.15)',
            borderRadius: '20px', padding: '28px'
          }}>
            <h3 style={{color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '24px'}}>
              📦 Items by Category
            </h3>
            <div style={{display: 'flex', alignItems: 'flex-end', gap: '24px', height: '150px', marginBottom: '16px', padding: '0 20px'}}>
              {[
                { label: 'Vehicles', value: categoryCount.vehicle, color: '#1565c0' },
                { label: 'Tools', value: categoryCount.tool, color: '#0d47a1' },
                { label: 'Equipment', value: categoryCount.equipment, color: '#283593' },
              ].map((bar, i) => {
                const height = (bar.value / maxCategory) * 120;
                return (
                  <div key={i} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'}}>
                    <span style={{color: 'white', fontSize: '13px', fontWeight: 'bold'}}>{bar.value}</span>
                    <div style={{
                      width: '100%', height: `${height}px`,
                      background: `linear-gradient(180deg, ${bar.color}, ${bar.color}88)`,
                      borderRadius: '8px 8px 0 0', minHeight: '8px'
                    }}/>
                  </div>
                );
              })}
            </div>
            <div style={{display: 'flex', gap: '24px', padding: '0 20px'}}>
              {[
                { label: 'Vehicles', icon: '🚗' },
                { label: 'Tools', icon: '🔧' },
                { label: 'Equipment', icon: '⚙️' },
              ].map((item, i) => (
                <div key={i} style={{flex: 1, textAlign: 'center'}}>
                  <div style={{fontSize: '20px'}}>{item.icon}</div>
                  <div style={{color: '#546e7a', fontSize: '11px', marginTop: '4px'}}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{display: 'flex', gap: '8px', marginBottom: '24px'}}>
          {['overview', 'users', 'items', 'bookings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '10px 24px', borderRadius: '12px', border: 'none',
              cursor: 'pointer', fontSize: '14px', fontWeight: '600',
              background: activeTab === tab ? 'linear-gradient(135deg, #1565c0, #0d47a1)' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab ? 'white' : '#546e7a',
            }}>
              {tab === 'overview' ? `📊 Overview (${stats.totalBookings})` :
               tab === 'users' ? `👥 Users (${stats.totalUsers})` :
               tab === 'items' ? `📦 Items (${stats.totalItems})` :
               `📅 Bookings (${stats.totalBookings})`}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px'}}>
              {[
                { icon: '👥', label: 'Total Users', value: stats.totalUsers, color: '#1565c0' },
                { icon: '✅', label: 'Confirmed Bookings', value: stats.confirmedBookings, color: '#4caf50' },
                { icon: '⏳', label: 'Pending Bookings', value: stats.pendingBookings, color: '#ffc107' },
                { icon: '❌', label: 'Rejected Bookings', value: stats.rejectedBookings, color: '#f44336' },
                { icon: '🚗', label: 'Vehicles Listed', value: categoryCount.vehicle, color: '#1565c0' },
                { icon: '🔧', label: 'Tools Listed', value: categoryCount.tool, color: '#0d47a1' },
              ].map((card, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${card.color}33`,
                  borderRadius: '16px', padding: '20px',
                  display: 'flex', alignItems: 'center', gap: '16px'
                }}>
                  <div style={{
                    background: `${card.color}22`, width: '48px', height: '48px',
                    borderRadius: '12px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '22px'
                  }}>{card.icon}</div>
                  <div>
                    <div style={{color: 'white', fontSize: '24px', fontWeight: 'bold'}}>{card.value}</div>
                    <div style={{color: '#546e7a', fontSize: '12px'}}>{card.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* RECENT ACTIVITY */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(100,181,246,0.15)',
              borderRadius: '20px', padding: '24px'
            }}>
              <h3 style={{color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '16px'}}>
                🕐 Recent Activity
              </h3>
              {filteredBookings.slice(0, 5).map((booking, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.06)' : 'none'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '14px', fontWeight: 'bold'
                    }}>{booking.renter?.name?.charAt(0).toUpperCase()}</div>
                    <div>
                      <p style={{color: 'white', fontSize: '13px', margin: 0, fontWeight: '500'}}>
                        {booking.renter?.name} booked {booking.item?.title}
                      </p>
                      <p style={{color: '#546e7a', fontSize: '11px', margin: 0}}>
                        {new Date(booking.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span style={{
                    background: booking.status === 'confirmed' ? 'rgba(76,175,80,0.2)' :
                               booking.status === 'rejected' ? 'rgba(244,67,54,0.2)' : 'rgba(255,193,7,0.2)',
                    color: booking.status === 'confirmed' ? '#81c784' :
                           booking.status === 'rejected' ? '#ef9a9a' : '#fff176',
                    padding: '3px 10px', borderRadius: '999px', fontSize: '11px'
                  }}>{booking.status}</span>
                </div>
              ))}
              {filteredBookings.length === 0 && (
                <p style={{color: '#546e7a', textAlign: 'center', padding: '20px', fontSize: '14px'}}>
                  No activity for this period
                </p>
              )}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div>
            <p style={{color: '#546e7a', fontSize: '13px', marginBottom: '16px'}}>
              Showing {filteredUsers.length} users
            </p>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {loading ? (
                <div style={{textAlign: 'center', color: '#546e7a', padding: '40px'}}>⏳ Loading...</div>
              ) : filteredUsers.length === 0 ? (
                <div style={{textAlign: 'center', color: '#546e7a', padding: '60px',
                  background: 'rgba(255,255,255,0.03)', borderRadius: '20px',
                  border: '1px dashed rgba(255,255,255,0.1)'}}>
                  <div style={{fontSize: '56px', marginBottom: '16px'}}>👥</div>
                  <h3 style={{color: 'white'}}>No users for this period</h3>
                </div>
              ) : filteredUsers.map((user, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(100,181,246,0.15)',
                  borderRadius: '14px', padding: '16px 20px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '18px', fontWeight: 'bold'
                    }}>{user.name?.charAt(0).toUpperCase()}</div>
                    <div>
                      <h4 style={{color: 'white', fontWeight: '600', marginBottom: '4px'}}>{user.name}</h4>
                      <p style={{color: '#546e7a', fontSize: '12px', marginBottom: '2px'}}>📧 {user.email}</p>
                      <p style={{color: '#546e7a', fontSize: '12px'}}>
                        📍 {user.location || 'No location'} •
                        🕐 Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    <span style={{
                      background: user.role === 'admin' ? 'rgba(100,181,246,0.2)' :
                                 user.role === 'owner' ? 'rgba(76,175,80,0.2)' : 'rgba(255,193,7,0.2)',
                      color: user.role === 'admin' ? '#64b5f6' :
                             user.role === 'owner' ? '#81c784' : '#fff176',
                      padding: '4px 12px', borderRadius: '999px', fontSize: '12px'
                    }}>{user.role}</span>
                    <button onClick={() => handleDeleteUser(user._id)} style={{
                      padding: '6px 16px', background: 'rgba(244,67,54,0.15)',
                      border: '1px solid rgba(244,67,54,0.3)',
                      borderRadius: '8px', color: '#ef9a9a', fontSize: '12px', cursor: 'pointer'
                    }}>🗑️ Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ITEMS TAB */}
        {activeTab === 'items' && (
          <div>
            <p style={{color: '#546e7a', fontSize: '13px', marginBottom: '16px'}}>
              Showing {filteredItems.length} items
            </p>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {loading ? (
                <div style={{textAlign: 'center', color: '#546e7a', padding: '40px'}}>⏳ Loading...</div>
              ) : filteredItems.length === 0 ? (
                <div style={{textAlign: 'center', color: '#546e7a', padding: '60px',
                  background: 'rgba(255,255,255,0.03)', borderRadius: '20px',
                  border: '1px dashed rgba(255,255,255,0.1)'}}>
                  <div style={{fontSize: '56px', marginBottom: '16px'}}>📭</div>
                  <h3 style={{color: 'white'}}>No items for this period</h3>
                </div>
              ) : filteredItems.map((item, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(100,181,246,0.15)',
                  borderRadius: '14px', overflow: 'hidden',
                  display: 'flex', alignItems: 'center'
                }}>
                  <div style={{
                    width: '80px', height: '80px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #1565c020, #0d47a130)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                  }}>
                    {item.images && item.images.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getImgSrc(item.images[0])} alt={item.title}
                        style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
                    ) : (
                      <span style={{fontSize: '28px'}}>
                        {item.category === 'vehicle' ? '🚗' : item.category === 'tool' ? '🔧' : '⚙️'}
                      </span>
                    )}
                  </div>
                  <div style={{flex: 1, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                      <h4 style={{color: 'white', fontWeight: '600', marginBottom: '4px'}}>{item.title}</h4>
                      <p style={{color: '#546e7a', fontSize: '12px', marginBottom: '2px'}}>
                        📍 {item.location} • 👤 {item.owner?.name} • Rs. {item.pricePerDay}/day
                      </p>
                      <p style={{color: '#546e7a', fontSize: '11px'}}>
                        🕐 Added {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                      <span style={{
                        background: item.available ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)',
                        color: item.available ? '#81c784' : '#ef9a9a',
                        padding: '4px 12px', borderRadius: '999px', fontSize: '12px'
                      }}>{item.available ? '✅ Available' : '❌ Unavailable'}</span>
                      <button onClick={() => handleDeleteItem(item._id)} style={{
                        padding: '6px 16px', background: 'rgba(244,67,54,0.15)',
                        border: '1px solid rgba(244,67,54,0.3)',
                        borderRadius: '8px', color: '#ef9a9a', fontSize: '12px', cursor: 'pointer'
                      }}>🗑️ Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div>
            <p style={{color: '#546e7a', fontSize: '13px', marginBottom: '16px'}}>
              Showing {filteredBookings.length} bookings • Revenue: Rs. {totalRevenue}
            </p>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {filteredBookings.length === 0 ? (
                <div style={{textAlign: 'center', color: '#546e7a', padding: '60px',
                  background: 'rgba(255,255,255,0.03)', borderRadius: '20px',
                  border: '1px dashed rgba(255,255,255,0.1)'}}>
                  <div style={{fontSize: '56px', marginBottom: '16px'}}>📭</div>
                  <h3 style={{color: 'white'}}>No bookings for this period</h3>
                </div>
              ) : filteredBookings.map((booking, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(100,181,246,0.15)',
                  borderRadius: '14px', overflow: 'hidden',
                  display: 'flex', alignItems: 'center'
                }}>
                  <div style={{
                    width: '80px', height: '80px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #1565c020, #0d47a130)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                  }}>
                    {booking.item?.images && booking.item.images.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getImgSrc(booking.item.images[0])} alt={booking.item?.title}
                        style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
                    ) : (
                      <span style={{fontSize: '28px'}}>
                        {booking.item?.category === 'vehicle' ? '🚗' : booking.item?.category === 'tool' ? '🔧' : '⚙️'}
                      </span>
                    )}
                  </div>
                  <div style={{flex: 1, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                      <h4 style={{color: 'white', fontWeight: '600', marginBottom: '6px'}}>{booking.item?.title}</h4>
                      <p style={{color: '#546e7a', fontSize: '12px', marginBottom: '2px'}}>
                        👤 Renter: {booking.renter?.name} • Owner: {booking.owner?.name}
                      </p>
                      <p style={{color: '#546e7a', fontSize: '12px', marginBottom: '2px'}}>
                        📅 {new Date(booking.startDate).toLocaleDateString()} → {new Date(booking.endDate).toLocaleDateString()}
                      </p>
                      <p style={{color: '#546e7a', fontSize: '11px'}}>
                        🕐 Booked on {new Date(booking.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <div style={{color: '#64b5f6', fontWeight: 'bold', marginBottom: '6px', fontSize: '16px'}}>
                        Rs. {booking.totalPrice}
                      </div>
                      <span style={{
                        background: booking.status === 'confirmed' ? 'rgba(76,175,80,0.2)' :
                                   booking.status === 'rejected' ? 'rgba(244,67,54,0.2)' : 'rgba(255,193,7,0.2)',
                        color: booking.status === 'confirmed' ? '#81c784' :
                               booking.status === 'rejected' ? '#ef9a9a' : '#fff176',
                        padding: '4px 12px', borderRadius: '999px', fontSize: '12px'
                      }}>{booking.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </section>
    </main>
  );
}