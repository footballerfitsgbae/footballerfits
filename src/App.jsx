import { useEffect, useRef, useState } from 'react';
import './App.css';

// ── Article data ────────────────────────────────────────────────────────────
const articles = [
  { id: 1,  tag: '01 / Culture',   title: 'Coming Home?',           excerpt: "Tuchel names his 26-man squad. We break down the looks, the choices, and what it says about the culture.", image: '/blog1.JPG',  ratio: 'portrait', category: 'culture'  },
  { id: 2,  tag: '02 / Culture',   title: "Let's Go Arsenal",       excerpt: "21 Savage at the Emirates. When rap and football culture collide in the stands.",                           image: '/blog2.JPG',  ratio: 'portrait', category: 'culture'  },
  { id: 3,  tag: '03 / Editorial', title: 'Como Debut Rhude × Adidas', excerpt: "The fourth kit created to support the fight against childhood leukaemia — a collab that hits different.",  image: '/blog3.JPG',  ratio: 'tall',     category: 'editorial'},
  { id: 4,  tag: '04 / Style',     title: 'Arrived',                excerpt: "Juventus drop their 26/27 home shirt — honouring the club's identity while reimagining iconic elements.",  image: '/blog4.JPG',  ratio: 'tall',     category: 'style'    },
  { id: 5,  tag: '05 / Style',     title: 'Galáctico Elegance',     excerpt: "Redefining what it means to be the face of the world's biggest club — on and off the pitch.",             image: '/blog5.jpeg', ratio: 'portrait', category: 'style'    },
  { id: 6,  tag: '06 / Editorial', title: 'The Dior Era',           excerpt: "When streetwear meets luxury. Tracking the stylistic evolution of the modern winger.",                     image: '/blog6.jpeg', ratio: 'portrait', category: 'editorial'},
  { id: 7,  tag: '07 / Archive',   title: 'Obsession',              excerpt: "Ditching current drops for obscure 90s fashion archives and rare Japanese denim.",                          image: '/blog7.jpeg', ratio: 'tall',     category: 'archive'  },
  { id: 8,  tag: '08 / Archive',   title: 'The Tunnel Walk',        excerpt: "How the Premier League adopted NBA tunnel fashion, turning concrete corridors into runways.",              image: '/blog8.jpeg', ratio: 'tall',     category: 'archive'  },
];

const leftArticles  = articles.filter((_, i) => i % 2 === 0); // 1,3,5,7
const rightArticles = articles.filter((_, i) => i % 2 !== 0); // 2,4,6,8

// ── Article Card ─────────────────────────────────────────────────────────────
function ArticleCard({ article }) {
  return (
    <a href="#" className={`article-card`} id={`article-${article.id}`} data-category={article.category}>
      <div className={`card-image-wrap ${article.ratio === 'tall' ? 'ratio-tall' : 'ratio-portrait'}`}>
        <img src={article.image} alt={article.title} loading="lazy" />
        <div className="card-category"><span className="card-cat-label">{article.tag.split(' / ')[1]}</span></div>
        <div className="card-read-tag" aria-hidden="true">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12L12 2M12 2H5M12 2V9"/>
          </svg>
        </div>
      </div>
      <div className="card-body">
        <p className="card-index">{article.tag}</p>
        <h2 className="card-title">{article.title}</h2>
        <p className="card-excerpt">{article.excerpt}</p>
        <div className="card-footer">
          <span className="card-type">Read Story</span>
          <svg className="card-arrow" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 16L16 2M16 2H6M16 2V12"/>
          </svg>
        </div>
      </div>
    </a>
  );
}

// ── Style 1: Asymmetric Parallax ─────────────────────────────────────────────
function StyleOne() {
  const rightColumnRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState('all');

  // ── EXACT parallax code from user ──────────────────────────────────────────
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (rightColumnRef.current) {
            const scrollY = window.scrollY;
            rightColumnRef.current.style.transform = `translateY(${scrollY * -0.08}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // seed on mount

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filters = ['all', 'culture', 'style', 'editorial', 'archive'];

  const filtered = (list) =>
    activeFilter === 'all' ? list : list.filter(a => a.category === activeFilter);

  return (
    <section className="articles-section">
      {/* Filter bar */}
      <div className="filter-bar">
        {filters.map(f => (
          <button
            key={f}
            className={`filter-btn${activeFilter === f ? ' active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* 2-column grid */}
      <div className="columns-grid">
        {/* Left — normal scroll */}
        <div className="col-left">
          {filtered(leftArticles).map(a => <ArticleCard key={a.id} article={a} />)}
        </div>

        {/* Right — parallax (scrolls faster via useEffect above) */}
        <div className="col-right" ref={rightColumnRef} style={{ willChange: 'transform' }}>
          {filtered(rightArticles).map(a => <ArticleCard key={a.id} article={a} />)}
        </div>
      </div>

      {/* See All */}
      <div className="see-all-wrap">
        <a href="#" className="btn-see-all">
          <span>See All Stories</span>
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 16L16 2M16 2H6M16 2V12"/>
          </svg>
        </a>
      </div>
    </section>
  );
}

// ── Coming Soon panel ────────────────────────────────────────────────────────
function ComingSoon({ num, label }) {
  return (
    <div className="coming-soon-panel">
      <span className="cs-num" aria-hidden="true">0{num}</span>
      <p className="cs-eyebrow">Layout Concept</p>
      <h2 className="cs-title">
        Style 0{num}
        <span>Coming in the next drop</span>
      </h2>
      <p className="cs-desc">{label}</p>
    </div>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeStyle, setActiveStyle] = useState(1);

  return (
    <div className="app">
      {/* ── Header / Nav ── */}
      <header>
        <a href="#" className="logo">
          <img src="/logo.JPG" alt="Footballer Fits" />
          <span className="logo-wordmark">Footballer Fits</span>
        </a>

        <nav role="tablist" aria-label="Layout styles">
          {[1, 2, 3].map(n => (
            <button
              key={n}
              className={`style-btn${activeStyle === n ? ' active' : ''}`}
              role="tab"
              aria-selected={activeStyle === n}
              onClick={() => setActiveStyle(n)}
            >
              Style <sup>0{n}</sup>
            </button>
          ))}
        </nav>

        <span className="nav-mobile">Style 0{activeStyle}</span>
      </header>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-eyebrow">
              <div className="hero-eyebrow-line"></div>
              <span className="hero-eyebrow-text">Editorial</span>
            </div>
            <h1 className="hero-title">
              Follow the fits,<br/>
              <span className="line-italic">read the culture,</span>
              and your next<br/>obsession drops<br/>every week.
            </h1>
          </div>
          <div className="hero-right">
            <p className="hero-desc">
              Footballer Fits was built on one simple obsession — the way footballers move through culture off the pitch is just as compelling as anything on it.
            </p>
            <div className="hero-meta">
              <span className="hero-count">08 Stories this week</span>
              <div className="hero-divider"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pitch bar ── */}
      <div className="pitch-bar">
        <div className="pitch-bar-inner">
          <p className="pitch-label">
            <span className="pitch-label-dot"></span>
            Layout Pitch — Viewing
            <span className="pitch-active-name"> Style 0{activeStyle}</span>
          </p>
          <p className="pitch-label">3 concepts · Click nav to switch</p>
        </div>
      </div>

      {/* ── Style Panels ── */}
      {activeStyle === 1 && <StyleOne />}
      {activeStyle === 2 && <ComingSoon num={2} label="A completely different layout direction is being built here." />}
      {activeStyle === 3 && <ComingSoon num={3} label="The third layout direction. A bold alternative to show the client full range." />}

      {/* ── Footer ── */}
      <footer>
        <span className="footer-left">© 2026 Footballer Fits.</span>
        <div className="footer-right">
          <a href="#" target="_blank" rel="noopener">Instagram</a>
          <a href="#" target="_blank" rel="noopener">X / Twitter</a>
        </div>
      </footer>
    </div>
  );
}
