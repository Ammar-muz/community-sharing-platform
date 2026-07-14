'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Items() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [currentImgIndex, setCurrentImgIndex] = useState({});

  const fetchItems = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/items');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

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

  const filtered = items.filter(item => {
    const matchSearch = item.title?.toLowerCase().includes(search.toLowerCase()) ||
                       item.location?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category ? item.category === category : true;
    return matchSearch && matchCategory;
  });

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
          <Link href="/dashboard" style={{color: '#90a4ae', textDecoration: 'none', fontSize: '14px'}}>Dashboard</Link>
          <Link href="/bookings" style={{color: '#90a4ae', textDecoration: 'none', fontSize: '14px'}}>My Bookings</Link>
          <Link href="/auth/login" style={{
            background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
            color: 'white', padding: '8px 24px', borderRadius: '12px',
            textDecoration: 'none', fontSize: '14px', fontWeight: '600'
          }}>Login</Link>
        </div>
      </nav>

      {/* HEADER */}
      <section style={{padding: '50px 40px 30px', textAlign: 'center'}}>
        <h2 style={{color: 'white', fontSize: '40px', fontWeight: 'bold', marginBottom: '12px'}}>
          Browse Items
        </h2>
        <p style={{color: '#546e7a', fontSize: '16px', marginBottom: '32px'}}>
          Find what you need near you
        </p>

        {/* SEARCH AND FILTER */}
        <div style={{
          display: 'flex', gap: '12px', maxWidth: '700px',
          margin: '0 auto', alignItems: 'center'
        }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search by name or location..."
            style={{
              flex: 1, padding: '14px 20px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px', color: 'white',
              fontSize: '14px', outline: 'none'
            }}
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{
              padding: '14px 20px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px', color: '#90a4ae',
              fontSize: '14px', outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="">All Categories</option>
            <option value="vehicle">🚗 Vehicles</option>
            <option value="tool">🔧 Tools</option>
            <option value="equipment">⚙️ Equipment</option>
          </select>
        </div>

        {/* RESULTS COUNT */}
        {!loading && (
          <p style={{color: '#546e7a', fontSize: '13px', marginTop: '16px'}}>
            Showing {filtered.length} item{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </section>

      {/* ITEMS GRID */}
      <section style={{padding: '20px 40px 60px'}}>
        {loading ? (
          <div style={{textAlign: 'center', color: '#546e7a', padding: '60px'}}>
            <div style={{fontSize: '48px', marginBottom: '16px'}}>⏳</div>
            <p>Loading items...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{textAlign: 'center', color: '#546e7a', padding: '60px'}}>
            <div style={{fontSize: '64px', marginBottom: '16px'}}>📭</div>
            <h3 style={{color: 'white', marginBottom: '8px'}}>No items found</h3>
            <p>Try a different search or category</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px', maxWidth: '1200px', margin: '0 auto'
          }}>
            {filtered.map((item, i) => {
              const currentIdx = currentImgIndex[item._id] || 0;
              return (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(100,181,246,0.15)',
                  borderRadius: '20px', overflow: 'hidden',
                  cursor: 'pointer'
                }}>
                  {/* IMAGE SLIDER */}
                  <div style={{
                    height: '200px', position: 'relative', overflow: 'hidden',
                    background: 'linear-gradient(135deg, #1565c020, #0d47a120)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {item.images && item.images.length > 0 ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getImgSrc(item.images[currentIdx])}
                          alt={item.title}
                          style={{width: '100%', height: '100%', objectFit: 'cover'}}
                        />
                        {/* ARROWS */}
                        {item.images.length > 1 && (
                          <>
                            <button
                              onClick={(e) => { e.preventDefault(); prevImg(item._id, item.images.length); }}
                              style={{
                                position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
                                background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
                                borderRadius: '50%', width: '30px', height: '30px',
                                cursor: 'pointer', fontSize: '18px', display: 'flex',
                                alignItems: 'center', justifyContent: 'center'
                              }}>‹</button>
                            <button
                              onClick={(e) => { e.preventDefault(); nextImg(item._id, item.images.length); }}
                              style={{
                                position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                                background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
                                borderRadius: '50%', width: '30px', height: '30px',
                                cursor: 'pointer', fontSize: '18px', display: 'flex',
                                alignItems: 'center', justifyContent: 'center'
                              }}>›</button>
                            {/* DOTS */}
                            <div style={{
                              position: 'absolute', bottom: '8px', left: '50%',
                              transform: 'translateX(-50%)', display: 'flex', gap: '4px'
                            }}>
                              {item.images.map((_, idx) => (
                                <div
                                  key={idx}
                                  onClick={(e) => { e.preventDefault(); setCurrentImgIndex(prev => ({...prev, [item._id]: idx})); }}
                                  style={{
                                    width: '6px', height: '6px', borderRadius: '50%', cursor: 'pointer',
                                    background: idx === currentIdx ? '#64b5f6' : 'rgba(255,255,255,0.4)'
                                  }}
                                />
                              ))}
                            </div>
                          </>
                        )}
                        {/* IMAGE COUNT BADGE */}
                        {item.images.length > 1 && (
                          <div style={{
                            position: 'absolute', top: '8px', right: '8px',
                            background: 'rgba(0,0,0,0.6)', color: 'white',
                            fontSize: '11px', padding: '2px 8px', borderRadius: '999px'
                          }}>
                            {currentIdx + 1}/{item.images.length}
                          </div>
                        )}
                      </>
                    ) : (
                      <span style={{fontSize: '64px'}}>
                        {item.category === 'vehicle' ? '🚗' : item.category === 'tool' ? '🔧' : '⚙️'}
                      </span>
                    )}
                  </div>

                  {/* DETAILS */}
                  <div style={{padding: '20px'}}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', marginBottom: '8px'
                    }}>
                      <h3 style={{color: 'white', fontWeight: '600', fontSize: '16px', margin: 0}}>
                        {item.title}
                      </h3>
                      <span style={{
                        background: 'rgba(21,101,192,0.3)',
                        color: '#64b5f6', fontSize: '11px',
                        padding: '3px 10px', borderRadius: '999px'
                      }}>{item.category}</span>
                    </div>
                    <p style={{color: '#546e7a', fontSize: '13px', marginBottom: '16px'}}>
                      📍 {item.location}
                    </p>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                      <span style={{color: '#64b5f6', fontWeight: 'bold', fontSize: '18px'}}>
                        Rs. {item.pricePerDay}/day
                      </span>
                      <span style={{
                        background: item.available ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)',
                        color: item.available ? '#81c784' : '#ef9a9a',
                        fontSize: '12px', padding: '4px 12px', borderRadius: '999px'
                      }}>
                        {item.available ? '✅ Available' : '❌ Unavailable'}
                      </span>
                    </div>
                    <Link href={`/items/${item._id}`} style={{
                      display: 'block', textAlign: 'center',
                      background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                      color: 'white', padding: '10px',
                      borderRadius: '12px', textDecoration: 'none',
                      fontWeight: '600', fontSize: '14px'
                    }}>View Details →</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </main>
  );
}