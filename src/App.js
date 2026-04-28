import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';

// ── Canvas Scratch Reveal ─────────────────────────────────────────────────────
function ScratchCard({ src, alt }) {
  const canvasRef = useRef(null);
  const [revealed, setRevealed] = useState(false);
  const drawing = useRef(false);

  useEffect(() => {
    if (revealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.parentElement.offsetWidth || 340;
    const H = canvas.parentElement.offsetHeight || 420;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#f7ecd5');
    grad.addColorStop(0.5, '#eddfc0');
    grad.addColorStop(1, '#e8d5b0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(184,150,62,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, W-24, H-24);
    ctx.strokeRect(18, 18, W-36, H-36);
    const fs1 = Math.max(16, Math.round(W*0.048));
    const fs2 = Math.max(11, Math.round(W*0.03));
    ctx.textAlign = 'center';
    ctx.fillStyle = '#b8963e';
    ctx.font = `italic ${fs1}px 'Cormorant Garamond', Georgia, serif`;
    ctx.fillText('🤍  Barmağınızla cızın', W/2, H/2-10);
    ctx.fillStyle = 'rgba(92,61,46,0.5)';
    ctx.font = `300 ${fs2}px 'Lato', sans-serif`;
    ctx.fillText('şəkli aşkar etmək üçün', W/2, H/2+fs2+6);
  }, [revealed]);

  const checkPercent = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0,0,canvas.width,canvas.height).data;
    let t = 0;
    for (let i=3; i<data.length; i+=4) { if(data[i]<128) t++; }
    if ((t/(canvas.width*canvas.height))*100 > 52) setRevealed(true);
  }, []);

  const scratchAt = useCallback((x,y) => {
    const canvas = canvasRef.current;
    if (!canvas||revealed) return;
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x,y,30,0,Math.PI*2);
    ctx.fill();
  }, [revealed]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width/rect.width, sy = canvas.height/rect.height;
    const s = e.touches ? e.touches[0] : e;
    return { x:(s.clientX-rect.left)*sx, y:(s.clientY-rect.top)*sy };
  };

  const onStart = (e) => { drawing.current=true; const p=getPos(e); scratchAt(p.x,p.y); };
  const onMove  = (e) => { if(!drawing.current)return; e.preventDefault(); const p=getPos(e); scratchAt(p.x,p.y); checkPercent(); };
  const onEnd   = () => { drawing.current=false; checkPercent(); };

  return (
    <div className="scratch-wrap">
      <img src={src} alt={alt} className="scratch-base-img"/>
      {!revealed && (
        <canvas ref={canvasRef} className="scratch-canvas"
          onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
          onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}/>
      )}
    </div>
  );
}

// ── Scroll Reveal ─────────────────────────────────────────────────────────────
function SR({ children, className='', delay=0 }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if(!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if(e.isIntersecting){setVis(true); obs.unobserve(el);} },
      { threshold:0.12 }
    );
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`sr ${vis?'sr-in':''} ${className}`} style={{transitionDelay:`${delay}ms`}}>
      {children}
    </div>
  );
}

// ── Countdown ─────────────────────────────────────────────────────────────────
function CountdownTimer() {
  const wedding = new Date('2026-05-29T18:00:00');
  const [t, setT] = useState({});
  useEffect(() => {
    const calc = () => {
      const d = wedding - new Date();
      if(d<=0) return setT({days:0,hours:0,minutes:0,seconds:0});
      setT({days:Math.floor(d/86400000), hours:Math.floor((d%86400000)/3600000), minutes:Math.floor((d%3600000)/60000), seconds:Math.floor((d%60000)/1000)});
    };
    calc(); const id=setInterval(calc,1000); return ()=>clearInterval(id);
  }, []);
  return (
    <div className="timer-card">
      <div className="timer-eyebrow">Toyadək qalan vaxt</div>
      <div className="timer-boxes">
        {[['days','Gün'],['hours','Saat'],['minutes','Dəq'],['seconds','San']].map(([k,l])=>(
          <div key={k} className="timer-box">
            <span className="timer-num">{String(t[k]??0).padStart(2,'0')}</span>
            <span className="timer-unit">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Ornament() {
  return (
    <SR className="orn-wrap">
      <div className="ornament">
        <span className="orn-line"/><span className="orn-diamond">◆</span><span className="orn-line"/>
      </div>
    </SR>
  );
}

function RSVPSection() {
  const [name,setName]=useState('');
  const [guests,setGuests]=useState('1');
  const [note,setNote]=useState('');
  const [sent,setSent]=useState(false);
  const handleSend = () => {
    if(!name.trim()) return;
    const msg=`🌿 Toy Dəvətnaməsi · İştirak Blankı\n\n👤 Ad Soyad: ${name}\n👥 Qonaq sayı: ${guests}\n💬 Qeyd: ${note||'—'}\n\n📅 Zülfüqar & Aylin · 29 May 2026`;
    window.open(`https://wa.me/994104195344?text=${encodeURIComponent(msg)}`,'_blank');
    setSent(true);
  };
  if(sent) return (
    <div className="thank-card">
      <div className="thank-flourish">✦</div>
      <h3 className="thank-title">Təşəkkür edirik</h3>
      <p className="thank-text">İştirakınız bizə böyük sevinc gətirəcək.<br/>Sizi 29 May günündə görmək arzusundayıq.</p>
      <div className="thank-sig">Zülfüqar & Aylin</div>
    </div>
  );
  return (
    <div className="rsvp-form">
      <p className="rsvp-intro">İştirakınızı zəhmət olmasa təsdiqləyin</p>
      <div className="field-wrap"><label className="field-label">Ad, Soyad</label>
        <input className="field-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Adınızı daxil edin"/>
      </div>
      <div className="field-wrap"><label className="field-label">Qonaq sayı</label>
        <select className="field-input" value={guests} onChange={e=>setGuests(e.target.value)}>
          {[1,2,3,4,5].map(n=><option key={n} value={n}>{n} nəfər</option>)}
        </select>
      </div>
      <div className="field-wrap"><label className="field-label">Qeyd <span className="opt-lbl">(ixtiyari)</span></label>
        <textarea className="field-input field-textarea" value={note} onChange={e=>setNote(e.target.value)} placeholder="Xüsusi istəyiniz..." rows={3}/>
      </div>
      <button className="rsvp-btn" onClick={handleSend}>Göndər <span>↗</span></button>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState('video');
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [imgFading, setImgFading] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  // Video ends → white flash → invitation + music
  const handleVideoEnded = useCallback(() => {
    setPhase('transition');
    if (audioRef.current) {
      audioRef.current.play().then(() => setMusicOn(true)).catch(() => {});
    }
    setTimeout(() => setPhase('invitation'), 1400);
  }, []);

  // Tap/click directly on the button (guaranteed user gesture)
  const handleCtaClick = (e) => {
    e.stopPropagation();
    if (videoPlaying) return;
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => {
      v.play()
        .then(() => setVideoPlaying(true))
        .catch(() => {
          v.muted = true;
          v.play().then(() => {
            v.muted = false;
            setVideoPlaying(true);
          }).catch(() => {});
        });
    };
    tryPlay();
  };

  const toggleTheme = useCallback(() => {
    setImgFading(true);
    setTimeout(() => { setIsDark(d=>!d); setImgFading(false); }, 380);
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicOn) { audioRef.current.pause(); setMusicOn(false); }
    else { audioRef.current.play().catch(()=>{}); setMusicOn(true); }
  };

  return (
    <div className="app">
      <div className="bg-petals" aria-hidden>
        {[...Array(14)].map((_,i)=><div key={i} className={`petal petal-${i}`}/>)}
      </div>

      <audio ref={audioRef} loop>
        <source src="/music.mp3" type="audio/mpeg"/>
      </audio>

      {phase==='invitation' && (
        <button className="music-btn" onClick={toggleMusic} aria-label="Musiqi">
          {musicOn ? '♪' : '♩'}
        </button>
      )}

      {/* ── VIDEO SCREEN ── */}
      {phase==='video' && (
        <div className="video-screen">
          <video
            ref={videoRef}
            className="video-bg"
            src="/video.mp4"
            playsInline
            webkit-playsinline="true"
            preload="auto"
            onEnded={handleVideoEnded}
          />
          {/* CTA overlay — tap THIS button to play */}
          {!videoPlaying && (
            <button className="video-cta-btn" onClick={handleCtaClick}>
              <span className="vcta-line"/>
              <span className="vcta-text">Məktuba toxunun</span>
              <span className="vcta-line"/>
            </button>
          )}
        </div>
      )}

      {/* ── WHITE FLASH TRANSITION ── */}
      {phase==='transition' && (
        <div className="white-flash">
          <div className="flash-unfold"/>
        </div>
      )}

      {/* ── INVITATION ── */}
      {phase==='invitation' && (
        <div className="invitation">

          {/* HERO: image + names BELOW image (not overlapping) */}
          <section className="hero-section">
            <div className="hero-img-wrap">
              <button className="dn-toggle" onClick={toggleTheme} aria-label="Gündüz / Gecə">
                {isDark ? '☀️' : '🌙'}
              </button>
              <img src="/img1.png" alt="Gündüz"
                className={`hero-img ${imgFading?'img-fading':''} ${isDark?'img-hide':'img-show'}`}/>
              <img src="/img2.png" alt="Gecə"
                className={`hero-img hero-abs ${imgFading?'img-fading':''} ${isDark?'img-show':'img-hide'}`}/>
            </div>

            {/* Names BELOW image — cloud gradient blends from image into cream */}
            <div className="hero-names-cloud">
              <div className="hnc-fog"/>
              <div className="hnc-body">
                <div className="hnc-eyebrow">Toy Dəvətnaməsi</div>
                <h1 className="hnc-names">
                  <span>Zülfüqar</span>
                  <span className="hnc-amp">&</span>
                  <span>Aylin</span>
                </h1>
                <div className="hnc-date">29 May 2026 · Cümə</div>
                <div className="hnc-venue">Ay işığı Şadlıq Sarayı</div>
              </div>
            </div>
          </section>

          <Ornament/>

          <SR className="section timer-section">
            <CountdownTimer/>
          </SR>

          <Ornament/>

          <section className="section couple-section">
            <SR><h2 className="section-title">Bizim Anımız</h2></SR>
            <SR delay={100}><ScratchCard src="/img3.jpg" alt="Cütlük"/></SR>
            <SR delay={220}>
              <p className="couple-quote">"Hər şeyi birlikdə yaşamaq üçün yaranmışıq —<br/>bu gün onun başlanğıcıdır."</p>
            </SR>
          </section>

          <Ornament/>

          <section className="section">
            <SR><h2 className="section-title">Dress Code</h2></SR>
            <SR delay={120}>
              <div className="dresscode-card">
                <div className="dc-theme-line">Elegant · Classic · Refined</div>
                <p className="dresscode-desc">Bu xüsusi gecədə elegantlıq hər detalda hiss olunmalıdır. Zəhmət olmasa geyim seçiminizdə aşağıdakılara riayət edin.</p>
                <div className="dresscode-cols">
                  <div className="dc-col">
                    <div className="dc-swatch dc-ladies"/>
                    <div className="dc-col-title">Xanımlar</div>
                    <div className="dc-col-desc">Axşam köynəyi · Uzun geyim · Klassik elegantlıq</div>
                    <div className="dc-dots">
                      {['#e8d5c4','#c9b99a','#d4c4b0','#f5f0ea','#a08060'].map(c=><span key={c} className="dc-dot" style={{background:c}}/>)}
                    </div>
                    <div className="dc-note-red">⚠ Ağ rəngdən çəkinin</div>
                  </div>
                  <div className="dc-div"/>
                  <div className="dc-col">
                    <div className="dc-swatch dc-gents"/>
                    <div className="dc-col-title">Cənablar</div>
                    <div className="dc-col-desc">Smokinq · Klassik kostyum · Qaravat qalstuk</div>
                    <div className="dc-dots">
                      {['#1a1a2e','#2c3e50','#3d3d3d','#8b7355','#4a3728'].map(c=><span key={c} className="dc-dot" style={{background:c}}/>)}
                    </div>
                    <div className="dc-note-gold">✦ Rəsmi görünüş tələb olunur</div>
                  </div>
                </div>
                <div className="dc-foot">✨ May bahçəsinin ruhuna uyğun pastel, bej və tünd ton kombinasiyaları tövsiyə olunur</div>
              </div>
            </SR>
          </section>

          <Ornament/>

          <section className="section">
            <SR><h2 className="section-title">İştirak Blankı</h2></SR>
            <SR delay={120}><RSVPSection/></SR>
          </section>

          <Ornament/>

          <section className="section">
            <SR><h2 className="section-title">Mərasim Albomunuz</h2></SR>
            <SR delay={120}>
              <div className="album-card">
                <div className="album-left">
                  <div className="album-icon">📸</div>
                  <div>
                    <div className="album-title-text">Google Photos</div>
                    <div className="album-sub">Çəkdiyiniz şəkil və videoları paylaşın — bu anlar əbədi qalsın</div>
                  </div>
                </div>
                <a href="https://photos.app.goo.gl/BPSocL9vY1ZXRWpm8" target="_blank" rel="noreferrer" className="album-btn">Alboma keç ↗</a>
              </div>
            </SR>
          </section>

          <Ornament/>

          <section className="section">
            <SR><h2 className="section-title">Mərasim Yeri</h2></SR>
            <SR delay={120}>
              <div className="venue-card">
                <div className="venue-img-wrap"><img src="/img5.jpg" alt="Şadlıq Sarayı" className="venue-img"/></div>
                <div className="venue-info">
                  <div className="venue-name">Ay işığı Şadlıq Sarayı</div>
                  <div className="venue-time">29 May 2026 · Saat 18:00</div>
                  <div className="nav-label-top">Naviqasiya seçin</div>
                  <div className="nav-btns">
                    <a href="https://maps.google.com/?q=Ayışığı+Şadlıq+Sarayı+Bakı" target="_blank" rel="noreferrer" className="nav-btn"><span>🗺</span> Google Maps</a>
                    <a href="https://bolt.eu/" target="_blank" rel="noreferrer" className="nav-btn"><span>⚡</span> Bolt</a>
                    <a href="https://yango.com/" target="_blank" rel="noreferrer" className="nav-btn"><span>🚖</span> Yango</a>
                    <a href="https://waze.com/ul?q=Ayışığı+Şadlıq+Sarayı+Bakı" target="_blank" rel="noreferrer" className="nav-btn"><span>🔵</span> Waze</a>
                  </div>
                </div>
              </div>
            </SR>
          </section>

          <SR className="inv-footer">
            <div className="footer-flourish">✦ &nbsp; ✦ &nbsp; ✦</div>
            <div className="footer-names">Zülfüqar & Aylin</div>
            <div className="footer-date">29 · V · 2026</div>
            <div className="footer-verse">"Sevgi hər şeyi gözəlləşdirir"</div>
          </SR>

        </div>
      )}
    </div>
  );
}
