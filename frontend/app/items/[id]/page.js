'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function ItemDetail({ params }) {
  const { id } = use(params);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [currentImg, setCurrentImg] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [bookedDates, setBookedDates] = useState([]);

  const fetchItem = async () => {
    try {
      const res = await fetch(`http://http://44.200.227.55:5000/api/items/${id}`);
      const data = await res.json();
      setItem(data);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const fetchBookedDates = async () => {
    try {
      const res = await fetch(`http://http://44.200.227.55:5000/api/bookings/item/${id}`);
      const data = await res.json();
      const dates = [];
      if (Array.isArray(data)) {
        data.forEach(booking => {
          if (booking.status === 'confirmed') {
            let current = new Date(booking.startDate);
            const end = new Date(booking.endDate);
            while (current <= end) {
              dates.push(new Date(current).toDateString());
              current.setDate(current.getDate() + 1);
            }
          }
        });
      }
      setBookedDates(dates);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchItem();
    fetchBookedDates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const getImgSrc = (src) => {
    if (!src) return '';
    return src.startsWith('data:') ? src : `data:image/jpeg;base64,${src}`;
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const diff = new Date(endDate) - new Date(startDate);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const totalPrice = calculateDays() * (item?.pricePerDay || 0);

  const handleBooking = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }
    setBooking(true);
    setError('');
    try {
      const res = await fetch('http://http://44.200.227.55:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ itemId: id, startDate, endDate })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.msg || 'Booking failed');
      } else {
        setSuccess('🎉 Booking request sent successfully!');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
    setBooking(false);
  };

  if (loading) return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1628 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{textAlign: 'center', color: '#546e7a'}}>
        <div style={{fontSize: '48px', marginBottom: '16px'}}>⏳</div>
        <p>Loading item...</p>
      </div>
    </main>
  );

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1628 100%)',
    }}>

      {/* FULLSCREEN IMAGE OVERLAY */}
      {fullscreen && item?.images?.length > 0 && (
        <div
          onClick={() => setFullscreen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.95)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          {/* CLOSE BUTTON */}
          <button
            onClick={() => setFullscreen(false)}
            style={{
              position: 'absolute', top: '20px', right: '20px',
              background: 'rgba(255,255,255,0.2)', color: 'white',
              border: 'none', borderRadius: '50%', width: '44px', height: '44px',
              cursor: 'pointer', fontSize: '20px', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>✕</button>

          {/* PREV ARROW */}
          {item.images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentImg(prev => prev === 0 ? item.images.length - 1 : prev - 1); }}
              style={{
                position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none',
                borderRadius: '50%', width: '50px', height: '50px',
                cursor: 'pointer', fontSize: '24px', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>‹</button>
          )}

          {/* FULLSCREEN IMAGE */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getImgSrc(item.images[currentImg])}
            alt={item.title}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '90vh',
              objectFit: 'contain', borderRadius: '12px'
            }}
          />

          {/* NEXT ARROW */}
          {item.images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentImg(prev => prev === item.images.length - 1 ? 0 : prev + 1); }}
              style={{
                position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none',
                borderRadius: '50%', width: '50px', height: '50px',
                cursor: 'pointer', fontSize: '24px', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>›</button>
          )}

          {/* IMAGE COUNTER */}
          <div style={{
            position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
            color: 'white', fontSize: '14px', background: 'rgba(0,0,0,0.5)',
            padding: '6px 16px', borderRadius: '999px'
          }}>
            {currentImg + 1} / {item.images.length}
          </div>

          {/* THUMBNAIL DOTS */}
          <div style={{
            position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: '8px'
          }}>
            {item.images.map((_, idx) => (
              <div
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentImg(idx); }}
                style={{
                  width: '8px', height: '8px', borderRadius: '50%', cursor: 'pointer',
                  background: idx === currentImg ? '#64b5f6' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.2s'
                }}
              />
            ))}
          </div>
        </div>
      )}

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
        <Link href="/messages" style={{color: '#90a4ae', textDecoration: 'none', fontSize: '14px'}}>
          💬 Messages
       </Link>
        <Link href="/items" style={{color: '#90a4ae', textDecoration: 'none', fontSize: '14px'}}>
          ← Back to Items
        </Link>
      </nav>

      {/* CONTENT */}
      <section style={{padding: '40px', maxWidth: '1100px', margin: '0 auto'}}>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px'}}>

          {/* LEFT - ITEM INFO */}
          <div>
            {/* MAIN IMAGE WITH SLIDER */}
            <div style={{
              height: '320px', position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg, #1565c020, #0d47a130)',
              border: '1px solid rgba(100,181,246,0.15)',
              borderRadius: '20px', marginBottom: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: item?.images?.length > 0 ? 'zoom-in' : 'default'
            }}>
              {item?.images?.length > 0 ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getImgSrc(item.images[currentImg])}
                    alt={item.title}
                    onClick={() => setFullscreen(true)}
                    style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px'}}
                  />

                  {/* FULLSCREEN HINT */}
                  <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                    background: 'rgba(0,0,0,0.6)', color: 'white',
                    fontSize: '11px', padding: '4px 10px', borderRadius: '999px',
                    pointerEvents: 'none'
                  }}>🔍 Click to enlarge</div>

                  {/* ARROWS */}
                  {item.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImg(prev => prev === 0 ? item.images.length - 1 : prev - 1)}
                        style={{
                          position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
                          borderRadius: '50%', width: '36px', height: '36px',
                          cursor: 'pointer', fontSize: '20px', display: 'flex',
                          alignItems: 'center', justifyContent: 'center'
                        }}>‹</button>
                      <button
                        onClick={() => setCurrentImg(prev => prev === item.images.length - 1 ? 0 : prev + 1)}
                        style={{
                          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
                          borderRadius: '50%', width: '36px', height: '36px',
                          cursor: 'pointer', fontSize: '20px', display: 'flex',
                          alignItems: 'center', justifyContent: 'center'
                        }}>›</button>

                      {/* IMAGE COUNTER */}
                      <div style={{
                        position: 'absolute', bottom: '12px', right: '12px',
                        background: 'rgba(0,0,0,0.6)', color: 'white',
                        fontSize: '11px', padding: '3px 10px', borderRadius: '999px'
                      }}>{currentImg + 1}/{item.images.length}</div>
                    </>
                  )}
                </>
              ) : (
                <span style={{fontSize: '100px'}}>
                  {item?.category === 'vehicle' ? '🚗' : item?.category === 'tool' ? '🔧' : '⚙️'}
                </span>
              )}
            </div>

            {/* THUMBNAIL STRIP */}
            {item?.images?.length > 1 && (
              <div style={{display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto'}}>
                {item.images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentImg(idx)}
                    style={{
                      width: '70px', height: '70px', flexShrink: 0,
                      borderRadius: '10px', overflow: 'hidden', cursor: 'pointer',
                      border: idx === currentImg ? '2px solid #64b5f6' : '2px solid transparent',
                      opacity: idx === currentImg ? 1 : 0.6, transition: 'all 0.2s'
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getImgSrc(img)}
                      alt={`thumb ${idx + 1}`}
                      style={{width: '100%', height: '100%', objectFit: 'cover'}}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* DETAILS */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(100,181,246,0.15)',
              borderRadius: '20px', padding: '24px'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px'}}>
                <h2 style={{color: 'white', fontSize: '26px', fontWeight: 'bold', margin: 0}}>
                  {item?.title}
                </h2>
                <span style={{
                  background: 'rgba(21,101,192,0.3)', color: '#64b5f6',
                  fontSize: '12px', padding: '4px 12px', borderRadius: '999px'
                }}>{item?.category}</span>
              </div>

              <p style={{color: '#90a4ae', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px'}}>
                {item?.description}
              </p>

              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <span>📍</span>
                  <span style={{color: '#90a4ae', fontSize: '14px'}}>{item?.location}</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <span>👤</span>
                  <span style={{color: '#90a4ae', fontSize: '14px'}}>Owner: {item?.owner?.name}</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <span>📧</span>
                  <span style={{color: '#90a4ae', fontSize: '14px'}}>{item?.owner?.email}</span>
                </div>
                <Link
                  href={`/messages?userId=${item?.owner?._id}&itemId=${item?._id}`}
                  style={{
                    display: 'inline-block', marginTop: '12px',
                    background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                    color: 'white', padding: '10px 20px', borderRadius: '12px',
                    textDecoration: 'none', fontSize: '14px', fontWeight: '600',
                    boxShadow: '0 4px 15px rgba(21,101,192,0.4)'
                  }}>
                  💬 Contact Owner
                </Link>
                <span style={{
                  background: item?.available ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)',
                  color: item?.available ? '#81c784' : '#ef9a9a',
                  fontSize: '13px', padding: '4px 12px', borderRadius: '999px',
                  display: 'inline-block', width: 'fit-content'
                }}>
                  {item?.available ? '✅ Available' : '❌ Not Available'}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT - BOOKING */}
          <div>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(100,181,246,0.2)',
              borderRadius: '20px', padding: '28px',
              position: 'sticky', top: '100px'
            }}>
              <h3 style={{color: 'white', fontSize: '22px', fontWeight: 'bold', marginBottom: '8px'}}>
                Book This Item
              </h3>
              <p style={{color: '#64b5f6', fontSize: '28px', fontWeight: 'bold', marginBottom: '24px'}}>
                Rs. {item?.pricePerDay} <span style={{color: '#546e7a', fontSize: '16px', fontWeight: 'normal'}}>/day</span>
              </p>

              {success ? (
                <div style={{
                  background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)',
                  borderRadius: '12px', padding: '20px', textAlign: 'center', color: '#81c784'
                }}>
                  {success}
                  <br/>
                  <Link href="/bookings" style={{color: '#64b5f6', fontSize: '14px', marginTop: '10px', display: 'block'}}>
                    View My Bookings →
                  </Link>
                </div>
              ) : (
                <>
                  {error && (
                    <div style={{
                      background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)',
                      borderRadius: '10px', padding: '12px', marginBottom: '16px',
                      color: '#ef9a9a', fontSize: '14px', textAlign: 'center'
                    }}>{error}</div>
                  )}

                  <div style={{marginBottom: '16px'}}>
                    <label style={{color: '#90a4ae', fontSize: '13px', display: 'block', marginBottom: '8px'}}>Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      style={{
                        width: '100%', padding: '12px 16px',
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px', color: 'white',
                        fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{marginBottom: '20px'}}>
                    <label style={{color: '#90a4ae', fontSize: '13px', display: 'block', marginBottom: '8px'}}>End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      style={{
                        width: '100%', padding: '12px 16px',
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px', color: 'white',
                        fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {calculateDays() > 0 && (
                    <div style={{
                      background: 'rgba(21,101,192,0.1)',
                      border: '1px solid rgba(21,101,192,0.3)',
                      borderRadius: '12px', padding: '16px', marginBottom: '20px'
                    }}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                        <span style={{color: '#90a4ae', fontSize: '14px'}}>Rs. {item?.pricePerDay} x {calculateDays()} days</span>
                        <span style={{color: 'white', fontSize: '14px'}}>Rs. {totalPrice}</span>
                      </div>
                      <div style={{
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        paddingTop: '8px', display: 'flex', justifyContent: 'space-between'
                      }}>
                        <span style={{color: 'white', fontWeight: 'bold'}}>Total</span>
                        <span style={{color: '#64b5f6', fontWeight: 'bold', fontSize: '18px'}}>Rs. {totalPrice}</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleBooking}
                    disabled={booking || !startDate || !endDate}
                    style={{
                      width: '100%', padding: '14px',
                      background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                      color: 'white', border: 'none', borderRadius: '12px',
                      fontSize: '16px', fontWeight: '600', cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(21,101,192,0.4)',
                      opacity: (booking || !startDate || !endDate) ? 0.5 : 1
                    }}
                  >
                    {booking ? 'Sending Request...' : 'Request Booking →'}
                  </button>

                  <p style={{color: '#546e7a', fontSize: '12px', textAlign: 'center', marginTop: '12px'}}>
                    You will not be charged until the owner confirms
                  </p>
                </>
              )}
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}