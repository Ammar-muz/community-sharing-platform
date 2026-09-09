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
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [notification, setNotification] = useState(null);

  const API = 'http://44.200.227.55:5000';

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchItem = async () => {
    try {
      const res = await fetch(`${API}/api/items/${id}`);
      const data = await res.json();
      setItem(data);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API}/api/reviews/${id}`);
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchItem();
    fetchReviews();
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

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const handleBooking = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }
    setBooking(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/bookings`, {
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
        showNotification(data.msg || 'Booking failed', 'error');
      } else {
        setSuccess('🎉 Booking request sent successfully!');
        showNotification('🎉 Booking request sent!', 'success');
      }
    } catch (err) {
      setError('Something went wrong.');
      showNotification('Something went wrong', 'error');
    }
    setBooking(false);
  };

  const handleReview = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }
    if (!comment.trim()) {
      setReviewError('Please write a comment!');
      return;
    }
    setReviewLoading(true);
    setReviewError('');
    try {
      const res = await fetch(`${API}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ itemId: id, rating, comment })
      });
      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.msg || 'Failed to submit review');
        showNotification(data.msg || 'Failed to submit review', 'error');
      } else {
        setReviewSuccess('✅ Review submitted!');
        setComment('');
        setRating(5);
        fetchReviews();
        showNotification('✅ Review submitted successfully!', 'success');
      }
    } catch (err) {
      setReviewError('Something went wrong.');
    }
    setReviewLoading(false);
  };

  const renderStars = (count) => {
    return '★'.repeat(count) + '☆'.repeat(5 - count);
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

      {/* NOTIFICATION */}
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: notification.type === 'success' ? 'rgba(76,175,80,0.95)' : 'rgba(244,67,54,0.95)',
          color: 'white', padding: '14px 24px', borderRadius: '12px',
          fontSize: '14px', fontWeight: '600',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          animation: 'slideIn 0.3s ease'
        }}>
          {notification.msg}
        </div>
      )}

      {/* FULLSCREEN IMAGE */}
      {fullscreen && item?.images?.length > 0 && (
        <div onClick={() => setFullscreen(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.95)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <button onClick={() => setFullscreen(false)} style={{
            position: 'absolute', top: '20px', right: '20px',
            background: 'rgba(255,255,255,0.2)', color: 'white',
            border: 'none', borderRadius: '50%', width: '44px', height: '44px',
            cursor: 'pointer', fontSize: '20px'
          }}>✕</button>
          {item.images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setCurrentImg(prev => prev === 0 ? item.images.length - 1 : prev - 1); }} style={{
                position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none',
                borderRadius: '50%', width: '50px', height: '50px', cursor: 'pointer', fontSize: '24px'
              }}>‹</button>
              <button onClick={(e) => { e.stopPropagation(); setCurrentImg(prev => prev === item.images.length - 1 ? 0 : prev + 1); }} style={{
                position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none',
                borderRadius: '50%', width: '50px', height: '50px', cursor: 'pointer', fontSize: '24px'
              }}>›</button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getImgSrc(item.images[currentImg])} alt={item.title}
            onClick={(e) => e.stopPropagation()}
            style={{maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px'}}
          />
          <div style={{position: 'absolute', bottom: '20px', color: 'white', fontSize: '14px'}}>
            {currentImg + 1} / {item.images.length}
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav style={{
        background: 'rgba(10,22,40,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(100,181,246,0.15)',
        padding: '16px 40px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', position: 'sticky', top: 0, zIndex: 50
      }}>
        <Link href="/" style={{display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none'}}>
          <span style={{fontSize: '28px'}}>🤝</span>
          <h1 style={{color: '#64b5f6', fontSize: '20px', fontWeight: 'bold', margin: 0}}>CommunityShare</h1>
        </Link>
        <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
          <Link href="/messages" style={{color: '#90a4ae', textDecoration: 'none', fontSize: '14px'}}>💬 Messages</Link>
          <Link href="/items" style={{color: '#90a4ae', textDecoration: 'none', fontSize: '14px'}}>← Back to Items</Link>
        </div>
      </nav>

      {/* CONTENT */}
      <section style={{padding: '40px', maxWidth: '1100px', margin: '0 auto'}}>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px'}}>

          {/* LEFT */}
          <div>
            {/* MAIN IMAGE */}
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
                  <img src={getImgSrc(item.images[currentImg])} alt={item.title}
                    onClick={() => setFullscreen(true)}
                    style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px'}}
                  />
                  <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                    background: 'rgba(0,0,0,0.6)', color: 'white',
                    fontSize: '11px', padding: '4px 10px', borderRadius: '999px'
                  }}>🔍 Click to enlarge</div>
                  {item.images.length > 1 && (
                    <>
                      <button onClick={() => setCurrentImg(prev => prev === 0 ? item.images.length - 1 : prev - 1)} style={{
                        position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                        background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
                        borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>‹</button>
                      <button onClick={() => setCurrentImg(prev => prev === item.images.length - 1 ? 0 : prev + 1)} style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
                        borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>›</button>
                      <div style={{position: 'absolute', bottom: '12px', right: '12px',
                        background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '11px', padding: '3px 10px', borderRadius: '999px'
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

            {/* THUMBNAILS */}
            {item?.images?.length > 1 && (
              <div style={{display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto'}}>
                {item.images.map((img, idx) => (
                  <div key={idx} onClick={() => setCurrentImg(idx)} style={{
                    width: '70px', height: '70px', flexShrink: 0,
                    borderRadius: '10px', overflow: 'hidden', cursor: 'pointer',
                    border: idx === currentImg ? '2px solid #64b5f6' : '2px solid transparent',
                    opacity: idx === currentImg ? 1 : 0.6
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getImgSrc(img)} alt={`thumb ${idx + 1}`}
                      style={{width: '100%', height: '100%', objectFit: 'cover'}}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* ITEM DETAILS */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(100,181,246,0.15)',
              borderRadius: '20px', padding: '24px', marginBottom: '24px'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px'}}>
                <h2 style={{color: 'white', fontSize: '26px', fontWeight: 'bold', margin: 0}}>{item?.title}</h2>
                <span style={{background: 'rgba(21,101,192,0.3)', color: '#64b5f6', fontSize: '12px', padding: '4px 12px', borderRadius: '999px'}}>{item?.category}</span>
              </div>

              {/* RATING SUMMARY */}
              {avgRating && (
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'}}>
                  <span style={{color: '#ffc107', fontSize: '18px'}}>{renderStars(Math.round(avgRating))}</span>
                  <span style={{color: '#64b5f6', fontWeight: 'bold'}}>{avgRating}</span>
                  <span style={{color: '#546e7a', fontSize: '13px'}}>({reviews.length} reviews)</span>
                </div>
              )}

              <p style={{color: '#90a4ae', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px'}}>{item?.description}</p>

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
                <Link href={`/messages?userId=${item?.owner?._id}&itemId=${item?._id}`} style={{
                  display: 'inline-block', marginTop: '8px',
                  background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                  color: 'white', padding: '10px 20px', borderRadius: '12px',
                  textDecoration: 'none', fontSize: '14px', fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(21,101,192,0.4)'
                }}>💬 Contact Owner</Link>
                <span style={{
                  background: item?.available ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)',
                  color: item?.available ? '#81c784' : '#ef9a9a',
                  fontSize: '13px', padding: '4px 12px', borderRadius: '999px',
                  display: 'inline-block', width: 'fit-content'
                }}>{item?.available ? '✅ Available' : '❌ Not Available'}</span>
              </div>
            </div>

            {/* REVIEWS SECTION */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(100,181,246,0.15)',
              borderRadius: '20px', padding: '24px'
            }}>
              <h3 style={{color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px'}}>
                ⭐ Reviews ({reviews.length})
              </h3>

              {/* ADD REVIEW FORM */}
              <div style={{marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)'}}>
                <h4 style={{color: 'white', fontSize: '15px', marginBottom: '14px'}}>Write a Review</h4>

                {/* STAR RATING */}
                <div style={{display: 'flex', gap: '8px', marginBottom: '14px'}}>
                  {[1,2,3,4,5].map(star => (
                    <button key={star} onClick={() => setRating(star)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '28px', color: star <= rating ? '#ffc107' : '#546e7a',
                      transition: 'all 0.2s'
                    }}>★</button>
                  ))}
                  <span style={{color: '#90a4ae', fontSize: '13px', alignSelf: 'center'}}>{rating}/5</span>
                </div>

                {/* COMMENT */}
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Share your experience with this item..."
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', color: 'white',
                    fontSize: '14px', outline: 'none',
                    resize: 'none', height: '80px',
                    boxSizing: 'border-box', marginBottom: '12px'
                  }}
                />

                {reviewError && (
                  <div style={{color: '#ef9a9a', fontSize: '13px', marginBottom: '10px'}}>{reviewError}</div>
                )}
                {reviewSuccess && (
                  <div style={{color: '#81c784', fontSize: '13px', marginBottom: '10px'}}>{reviewSuccess}</div>
                )}

                <button onClick={handleReview} disabled={reviewLoading} style={{
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                  color: 'white', border: 'none', borderRadius: '12px',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                  opacity: reviewLoading ? 0.7 : 1
                }}>
                  {reviewLoading ? 'Submitting...' : 'Submit Review ⭐'}
                </button>
              </div>

              {/* REVIEWS LIST */}
              {reviews.length === 0 ? (
                <div style={{textAlign: 'center', color: '#546e7a', padding: '30px'}}>
                  <div style={{fontSize: '40px', marginBottom: '8px'}}>⭐</div>
                  <p>No reviews yet — be the first!</p>
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
                  {reviews.map((review, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '14px', padding: '16px'
                    }}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 'bold', fontSize: '14px'
                          }}>{review.reviewer?.name?.charAt(0).toUpperCase()}</div>
                          <div>
                            <p style={{color: 'white', fontSize: '14px', fontWeight: '500', margin: 0}}>{review.reviewer?.name}</p>
                            <p style={{color: '#546e7a', fontSize: '11px', margin: 0}}>
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span style={{color: '#ffc107', fontSize: '16px'}}>{renderStars(review.rating)}</span>
                      </div>
                      <p style={{color: '#90a4ae', fontSize: '14px', margin: 0, lineHeight: 1.6}}>{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — BOOKING */}
          <div>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(100,181,246,0.2)',
              borderRadius: '20px', padding: '28px',
              position: 'sticky', top: '100px'
            }}>
              <h3 style={{color: 'white', fontSize: '22px', fontWeight: 'bold', marginBottom: '8px'}}>Book This Item</h3>
              <p style={{color: '#64b5f6', fontSize: '28px', fontWeight: 'bold', marginBottom: '8px'}}>
                Rs. {item?.pricePerDay} <span style={{color: '#546e7a', fontSize: '16px', fontWeight: 'normal'}}>/day</span>
              </p>

              {/* RATING BADGE */}
              {avgRating && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.2)',
                  padding: '4px 12px', borderRadius: '999px', marginBottom: '20px'
                }}>
                  <span style={{color: '#ffc107'}}>★</span>
                  <span style={{color: '#ffc107', fontSize: '14px', fontWeight: '600'}}>{avgRating}</span>
                  <span style={{color: '#546e7a', fontSize: '12px'}}>({reviews.length} reviews)</span>
                </div>
              )}

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
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{
                      width: '100%', padding: '12px 16px',
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px', color: 'white',
                      fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                    }}/>
                  </div>

                  <div style={{marginBottom: '20px'}}>
                    <label style={{color: '#90a4ae', fontSize: '13px', display: 'block', marginBottom: '8px'}}>End Date</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{
                      width: '100%', padding: '12px 16px',
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px', color: 'white',
                      fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                    }}/>
                  </div>

                  {calculateDays() > 0 && (
                    <div style={{
                      background: 'rgba(21,101,192,0.1)', border: '1px solid rgba(21,101,192,0.3)',
                      borderRadius: '12px', padding: '16px', marginBottom: '20px'
                    }}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                        <span style={{color: '#90a4ae', fontSize: '14px'}}>Rs. {item?.pricePerDay} x {calculateDays()} days</span>
                        <span style={{color: 'white', fontSize: '14px'}}>Rs. {totalPrice}</span>
                      </div>
                      <div style={{borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between'}}>
                        <span style={{color: 'white', fontWeight: 'bold'}}>Total</span>
                        <span style={{color: '#64b5f6', fontWeight: 'bold', fontSize: '18px'}}>Rs. {totalPrice}</span>
                      </div>
                    </div>
                  )}

                  <button onClick={handleBooking} disabled={booking || !startDate || !endDate} style={{
                    width: '100%', padding: '14px',
                    background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
                    color: 'white', border: 'none', borderRadius: '12px',
                    fontSize: '16px', fontWeight: '600', cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(21,101,192,0.4)',
                    opacity: (booking || !startDate || !endDate) ? 0.5 : 1
                  }}>
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

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </main>
  );
}