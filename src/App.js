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
  const wedding = new Date('2026-08-21T18:00:00');
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



// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState('video');
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [imgFading, setImgFading] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const playingRef = useRef(false);  // guard against double-fire
  const endedRef = useRef(false);    // guard against double transition

  const goToInvitation = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    setPhase('transition');
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      const p = audioRef.current.play();
      if (p !== undefined) p.then(() => setMusicOn(true)).catch(() => {});
      else setMusicOn(true);
    }
    setTimeout(() => setPhase('invitation'), 1400);
  }, []);

  // Video ends → white flash → invitation + music
  const handleVideoEnded = useCallback(() => {
    goToInvitation();
  }, [goToInvitation]);

  // Fallback: onTimeUpdate — catches cases where onEnded doesn't fire (Android)
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || endedRef.current) return;
    if (v.duration && v.currentTime >= v.duration - 0.3) {
      goToInvitation();
    }
  }, [goToInvitation]);

  // Tap/click on video screen to play
  const handleCtaClick = useCallback(() => {
    if (playingRef.current) return;
    const v = videoRef.current;
    if (!v) return;
    playingRef.current = true;

    // iOS: interact with audio on user gesture
    if (audioRef.current) {
      audioRef.current.load();
    }

    v.play()
      .then(() => setVideoPlaying(true))
      .catch(() => {
        v.muted = true;
        v.play().then(() => {
          v.muted = false;
          setVideoPlaying(true);
        }).catch(() => { playingRef.current = false; });
      });
  }, []);

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

      <audio ref={audioRef} loop preload="auto">
        <source src="/music.mp3" type="audio/mpeg"/>
      </audio>

      {phase==='invitation' && (
        <button className="music-btn" onClick={toggleMusic} aria-label="Musiqi">
          {musicOn ? '♪' : '♩'}
        </button>
      )}

      {/* ── VIDEO SCREEN ── */}
      {phase==='video' && (
        <div className="video-screen"
          onClick={!videoPlaying ? handleCtaClick : undefined}
          style={{cursor: videoPlaying ? 'default' : 'pointer'}}>
          <video
            ref={videoRef}
            className="video-bg"
            src="/video.mp4"
            playsInline
            webkit-playsinline="true"
            preload="auto"
            onEnded={handleVideoEnded}
            onTimeUpdate={handleTimeUpdate}
          />
          {/* CTA overlay — shows until video starts */}
          {!videoPlaying && (
            <div className="video-cta-btn">
              <span className="vcta-line"/>
              <span className="vcta-text">Ekrana toxunun</span>
              <span className="vcta-line"/>
            </div>
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
              {/* Scroll indicator — overlaid at bottom of full-screen image */}
              <div className="scroll-indicator" aria-hidden>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 11 L16 21 L26 11" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 17 L16 27 L26 17" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.45"/>
                </svg>
              </div>
            </div>

            {/* Names BELOW image — cloud gradient blends from image into cream */}
            <div className="hero-names-cloud">
              <div className="hnc-fog"/>
              <div className="hnc-body">
                <div className="hnc-eyebrow">Toy Dəvətnaməsi</div>
                <h1 className="hnc-names">
                  <span>Samir</span>
                  <span className="hnc-amp">&</span>
                  <span>Xanımana</span>
                </h1>
                <div className="hnc-date">21 Avqust 2026 · Cümə</div>
                <div className="hnc-venue">Ağ saray Şadlıq evi</div>
              </div>
            </div>
          </section>

          <Ornament/>

          <SR className="section timer-section">
            <CountdownTimer/>
          </SR>

          <Ornament/>


          <section className="section">
            <SR><h2 className="section-title">Dress Code</h2></SR>
            <SR delay={120}>
              <div className="dresscode-card">
                <div className="dresscode-cols">
                  <div className="dc-col">
                    <div className="dc-col-title">Xanımlar</div>
                    <div className="dc-col-desc">Zərif axşam geyimi · Elegant libas · Klassik stil</div>
                  </div>
                  <div className="dc-div"/>
                  <div className="dc-col">
                    <div className="dc-col-title">Cənablar</div>
                    <div className="dc-col-desc">Klassik kostyum · Smokinq · Rəsmi geyim</div>
                  </div>
                </div>
              </div>
            </SR>
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
                  <div className="venue-name">Ağ saray Şadlıq evi</div>
                  <div className="venue-time">21 Avqust 2026 · Saat 18:00</div>
                  <div className="nav-label-top">Naviqasiya seçin</div>
                  <div className="nav-btns">
                    <a href="https://maps.app.goo.gl/7cKVfyirTi6B5FwU8" target="_blank" rel="noreferrer" className="nav-btn"><span>🗺</span> Google Maps</a>
                    <a href="https://bolt.eu/az-az/ride/?destination=40.4195,49.9315" target="_blank" rel="noreferrer" className="nav-btn"><span>⚡</span> Bolt</a>
                    <a href="https://yango.go.link/route?end-lat=40.4195&end-lon=49.9315&end-name=A%C4%9F+Saray+%C5%9Eadl%C4%B1q+Saray%C4%B1&adj_adgroup=widget&ref=wedding" target="_blank" rel="noreferrer" className="nav-btn"><span>🚖</span> Yango</a>
                    <a href="https://www.waze.com/az/live-map/directions/ag-saray-bekir-cobanzade-baki?to=place.w.32702868.327290824.10022410" target="_blank" rel="noreferrer" className="nav-btn"><span>🔵</span> Waze</a>
                  </div>
                </div>
              </div>
            </SR>
          </section>

          <SR className="inv-footer">
            <div className="footer-flourish">✦ &nbsp; ✦ &nbsp; ✦</div>
            <div className="footer-names">Samir & Xanımana</div>
            <div className="footer-date">21 · VIII · 2026</div>
            <div className="footer-verse">"Sevgi hər şeyi gözəlləşdirir"</div>
          </SR>

        </div>
      )}
    </div>
  );
}