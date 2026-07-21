import { createContext, useContext, useEffect, useRef, useState } from 'react';
import './App.css';

// Router context — lets any blog card open an article without prop-threading.
// `openArticle(article)` is the single seam we'll later point at Sanity slugs.
const RouterCtx = createContext({ navigate: () => {}, openArticle: () => {} });
const useRouter = () => useContext(RouterCtx);

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
  { id: 9,  tag: '09 / Editorial', title: 'The Comeback Kit',       excerpt: "A retro away shirt reborn — how the archive keeps rewriting the modern matchday wardrobe.",                  image: '/blog9.jpeg', ratio: 'portrait', category: 'editorial'},
  { id: 10, tag: '10 / Archive',   title: 'Tunnel Vision',          excerpt: "The pre-match walk has become the runway. Inside football's obsession with the tunnel fit.",                image: '/blog2.JPG',  ratio: 'tall',     category: 'archive'  },
  { id: 11, tag: '11 / Culture',   title: 'Ballon Nights',          excerpt: "Tailoring, ice and quiet luxury — how the game's biggest night became a menswear moment.",                   image: '/blog5.jpeg', ratio: 'portrait', category: 'culture'  },
  { id: 12, tag: '12 / Style',     title: 'Vintage Nine',           excerpt: "Chasing the perfect number-nine shirt through 90s catalogues and dead-stock rails.",                         image: '/blog3.JPG',  ratio: 'tall',     category: 'style'    },
];

const readTime = (a) => 3 + (a.id % 4);            // pseudo read-time (mins), deterministic
const catOf = (a) => a.tag.split(' / ')[1];

// ── Real-time "published X ago" ──────────────────────────────────────────────
// Each post has an "hours since published" offset; the timestamp is anchored to
// page-load, so the relative label is always accurate and ticks up live.
const AGO_HOURS = { 1: 3, 2: 6, 3: 20, 4: 31, 5: 47, 6: 72, 7: 120, 8: 168 };
const PAGE_LOAD = Date.now();
const publishedAt = (a) => PAGE_LOAD - (AGO_HOURS[a.id] ?? 24) * 3600_000;

function timeAgo(ts) {
  const mins = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const wks = Math.floor(days / 7);
  return `${wks} week${wks === 1 ? '' : 's'} ago`;
}
const agoOf = (a) => timeAgo(publishedAt(a));

// Re-render every 60s so the "X ago" labels stay current without a reload
function useMinuteTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);
}

// Shared diagonal arrow
const Arrow = ({ className }) => (
  <svg className={className} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 16L16 2M16 2H6M16 2V12" />
  </svg>
);

const SeeAll = ({ label = 'See All Stories', onClick }) => (
  <a href="#" className="btn-see-all" onClick={onClick}>
    <span>{label}</span>
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 16L16 2M16 2H6M16 2V12" />
    </svg>
  </a>
);

// Reveal-on-scroll — observes any `.reveal` inside the given root (re-runs on `key`)
function useReveal(ref, key) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = root.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in-view'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
      }),
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ref, key]);
}

/* ══════════════════════════════════════════════════════════════════════════
   REUSABLE SECTIONS  (shared by Style 2, 3 and the final Style 4)
   ══════════════════════════════════════════════════════════════════════════ */

// Two-up featured cover cards (culted-style)
function FeaturedPair({ items, label = 'Featured — This Week', meta = 'Selected Editorial', hideHead = false }) {
  const { openArticle } = useRouter();
  return (
    <div className="s2-feature-wrap">
      {!hideHead && (
        <div className="s2-feature-head">
          <span className="s2-fh-label"><span className="s2-fh-dot" />{label}</span>
          <span className="s2-fh-meta">{meta}</span>
        </div>
      )}
      <div className="s2-feature">
        {items.map((a) => (
          <a key={a.id} href="#/article" onClick={(e) => { e.preventDefault(); openArticle(a); }} className="s2-lead" data-category={a.category}>
            <div className="s2-lead-img"><img src={a.image} alt={a.title} /></div>
            <div className="s2-lead-overlay">
              <div className="s2-lead-top">
                <span className="s2-tag solid">{catOf(a)}</span>
                <span className="s2-lead-flag">{agoOf(a)} · {readTime(a)} min read</span>
              </div>
              <div className="s2-lead-bottom">
                <h2 className="s2-lead-title">{a.title}</h2>
                <p className="s2-lead-excerpt">{a.excerpt}</p>
                <span className="s2-lead-cta">Read the feature <Arrow className="s2-cta-arrow" /></span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// Bold scrolling word band
function Marquee({ words = ['Editorial', 'Off-Pitch', 'Style', 'Culture', 'Archive', 'The Tunnel', 'Weekly Drops'] }) {
  return (
    <div className="s2-marquee" aria-hidden="true">
      <div className="s2-marquee-track">
        {[0, 1].map((g) => (
          <span key={g} className="s2-marquee-group">
            {words.map((w, j) => (
              <span key={j} className="s2-marquee-item">{w}<span className="s2-marquee-star">✦</span></span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

// Infinite horizontal blog reel
function BlogReel({ items }) {
  const { openArticle } = useRouter();
  return (
    <div className="s2-reel">
      <div className="s2-reel-track">
        {[0, 1].map((g) => (
          <div key={g} className="s2-reel-group" aria-hidden={g === 1 ? 'true' : undefined}>
            {items.map((a) => (
              <a key={`${g}-${a.id}`} href="#/article" onClick={(e) => { e.preventDefault(); openArticle(a); }} className="s2-reel-card" data-category={a.category}>
                <div className="s2-reel-img">
                  <img src={a.image} alt={a.title} loading="lazy" />
                  <span className="s2-reel-tag">{catOf(a)}</span>
                </div>
                <div className="s2-reel-meta">
                  <span className="s2-reel-num">{a.tag.split(' / ')[0]}</span>
                  <h4 className="s2-reel-title">{a.title}</h4>
                  <span className="s2-reel-time">{agoOf(a)} · {readTime(a)} min</span>
                </div>
              </a>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Editorial index list with cursor-following image preview
function IndexList({ items, startNum = 1, eyebrow = 'The Index', titleMain = 'Everything,', titleAccent = 'in order.', sub }) {
  const { openArticle } = useRouter();
  const indexRef = useRef(null);
  const previewRef = useRef(null);
  const [hovered, setHovered] = useState(null);

  const handleMove = (e) => {
    const el = previewRef.current, host = indexRef.current;
    if (!el || !host) return;
    const r = host.getBoundingClientRect();
    el.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px) translate(-50%, -50%) rotate(-3deg)`;
  };

  return (
    <div className="s2-index" ref={indexRef} onMouseMove={handleMove}>
      <div className="s2-index-head">
        <div>
          <p className="s2-index-eyebrow">{eyebrow}</p>
          <h2 className="s2-index-title">{titleMain}<span> {titleAccent}</span></h2>
        </div>
        <p className="s2-index-sub">{sub ?? `Hover a story to preview. ${items.length} reads in the archive.`}</p>
      </div>

      <ul className="s2-list">
        {items.map((a, i) => (
          <li key={a.id}>
            <a href="#/article" onClick={(e) => { e.preventDefault(); openArticle(a); }} className="s2-row" onMouseEnter={() => setHovered(a)} onMouseLeave={() => setHovered(null)}>
              <span className="s2-row-num">{String(i + startNum).padStart(2, '0')}</span>
              <span className="s2-row-cat">{catOf(a)}</span>
              <span className="s2-row-title">{a.title}</span>
              <span className="s2-row-meta">{agoOf(a)} · {readTime(a)} min read</span>
              <Arrow className="s2-row-arrow" />
            </a>
          </li>
        ))}
      </ul>

      <div ref={previewRef} className={`s2-preview${hovered ? ' show' : ''}`}>
        {hovered && <img src={hovered.image} alt="" />}
      </div>
    </div>
  );
}

// Uniform editorial card grid (Nagisa-minimal)
function EditorialGrid({ items, reveal = false }) {
  const { openArticle } = useRouter();
  return (
    <div className="s3-grid">
      {items.map((a) => (
        <a key={a.id} href="#/article" onClick={(e) => { e.preventDefault(); openArticle(a); }} className={`s3-card${reveal ? ' reveal' : ''}`} data-category={a.category}>
          <div className="s3-card-img">
            <img src={a.image} alt={a.title} loading="lazy" />
            <span className="s3-card-tag">{catOf(a)}</span>
          </div>
          <div className="s3-card-body">
            <span className="s3-card-date">{agoOf(a)} · {readTime(a)} min read</span>
            <h3 className="s3-card-title">{a.title}</h3>
            <p className="s3-card-excerpt">{a.excerpt}</p>
            <span className="s3-card-link">
              <span className="s3-link-label">Read story</span>
              <span className="s3-link-line" />
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}

// ── Article Card (Style 1) ───────────────────────────────────────────────────
function ArticleCard({ article }) {
  const { openArticle } = useRouter();
  return (
    <a href="#/article" onClick={(e) => { e.preventDefault(); openArticle(article); }} className={`article-card`} id={`article-${article.id}`} data-category={article.category}>
      <div className={`card-image-wrap ${article.ratio === 'tall' ? 'ratio-tall' : 'ratio-portrait'}`}>
        <img src={article.image} alt={article.title} loading="lazy" />
        <div className="card-category"><span className="card-cat-label">{catOf(article)}</span></div>
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
        <p className="card-meta">{agoOf(article)} · {readTime(article)} min read</p>
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

// Parallax columns — right column drifts on scroll (asymmetric editorial grid)
function ParallaxColumns({ items }) {
  const secRef = useRef(null);
  const rightRef = useRef(null);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (rightRef.current && secRef.current) {
          const top = secRef.current.getBoundingClientRect().top;
          const progress = Math.max(0, window.innerHeight - top);
          rightRef.current.style.transform = `translateY(${progress * -0.05}px)`;
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const left = items.filter((_, i) => i % 2 === 0);
  const right = items.filter((_, i) => i % 2 !== 0);

  return (
    <div className="s4-parallax">
      <div className="columns-grid" ref={secRef}>
        <div className="col-left">
          {left.map((a) => <ArticleCard key={a.id} article={a} />)}
        </div>
        <div className="col-right" ref={rightRef} style={{ willChange: 'transform' }}>
          {right.map((a) => <ArticleCard key={a.id} article={a} />)}
        </div>
      </div>
    </div>
  );
}

// ── The site ─────────────────────────────────────────────────────────────────
// Same 8 posts, shuffled per section so each reads as distinct dummy content.
const byId = (...ids) => ids.map((id) => articles.find((a) => a.id === id));
const fashionItems       = byId(3, 4, 5);            // editorial grid
const lifestyleItems     = byId(1, 2);               // two-up covers
const entertainmentItems = byId(8, 6, 4, 2);         // parallax columns (4)

// Fuller sets for the dedicated "See More" section pages
const fashionPage        = byId(3, 4, 5, 6, 9, 12, 7, 8, 11);        // editorial grid (9)
const lifestyleCards     = byId(1, 2, 11, 6, 5, 9, 3, 8, 7, 4, 10, 12); // Style-2 card grid (12)
const entertainmentPage  = byId(8, 6, 4, 2, 1, 7, 5, 10);           // parallax (8)

// Per-section blog pools — used to build the cross-section teasers at the foot of each page
const SECTION_POOL = { fashion: fashionPage, lifestyle: lifestyleCards, entertainment: entertainmentPage };

// Cross-section "keep exploring" glimpse (culted-style)
const SECTION_ORDER = ['fashion', 'lifestyle', 'entertainment'];
const SECTION_META = {
  fashion: {
    name: 'Fashion', label: 'Kits, collabs & drip', image: '/blog3.JPG',
    introTitle: 'Worth getting dressed for.',
    introCopy: 'Kits, collabs, sneakers and matchday drip. The shirts worth framing, the drops worth queuing for and the fits we haven’t stopped thinking about.',
  },
  lifestyle: {
    name: 'Lifestyle', label: 'Off the pitch', image: '/blog1.JPG',
    introTitle: 'Off the pitch is where the story lives.',
    introCopy: 'How the game’s biggest names move once the whistle goes. The homes, the rides, the downtime and the flexes that never make the highlight reel.',
  },
  entertainment: {
    name: 'Entertainment', label: 'Culture & more', image: '/blog8.jpeg',
    introTitle: 'The game after the game.',
    introCopy: 'Music, cameos, memes and the moments football hands straight to culture. Everything the sport touches the second it leaves the ninety minutes.',
  },
};
const otherSections = (current) => {
  const i = SECTION_ORDER.indexOf(current);
  return [SECTION_ORDER[(i + 1) % 3], SECTION_ORDER[(i + 2) % 3]];   // the next two, in order
};

function Site({ navigate }) {
  const { openArticle } = useRouter();
  const rootRef = useRef(null);
  useReveal(rootRef);
  useMinuteTick();   // keeps the "X ago" labels live
  const go = (page) => (e) => { e.preventDefault(); navigate(page); };

  return (
    <section className="s4" ref={rootRef}>
      {/* ── Hero + Fashion stack — the ONLY overlapping pair. Hero pins here and
             Fashion slides up to cover it; everything below scrolls normally. ── */}
      <div className="s4-hero-stack">
      <section className="s4-hero">
        <div className="s4-hero-bg">
          <img src="/michael_olise.png" alt="Every boot Michael Olise has worn at the World Cup" />
        </div>

        <div className="s4-hero-lede">
          <a href="#/article" onClick={(e) => { e.preventDefault(); openArticle(articles[0]); }} className="s4-hero-post">
            <span className="s4-hero-post-tag">Latest Article</span>
            <h2 className="s4-hero-post-title">Every Boot Michael Olise Has Worn At The World Cup</h2>
            <span className="s4-hero-post-meta">{timeAgo(PAGE_LOAD - 22 * 3600_000)} · 5 min read</span>
            <span className="s4-hero-readmore">Read more <Arrow className="s4-hero-rm-arrow" /></span>
          </a>
        </div>

        <div className="s4-hero-side">
          <span><span className="dim">01/</span> Editorial</span>
          <span>Culture</span>
          <span>Style</span>
        </div>
        <div className="s4-hero-footer">
          <span className="s4-hf-copy">© 2026</span>
          <span className="s4-hf-rule" aria-hidden="true" />
          <span className="s4-hf-mark">FF</span>
        </div>

        <span className="s4-hero-mark m1" aria-hidden="true">+</span>
        <span className="s4-hero-mark m2" aria-hidden="true">+</span>
        <span className="s4-hero-mark m3" aria-hidden="true">+</span>
      </section>

      {/* ── Fashion — Style 3 editorial grid ── */}
      <section id="fashion" className="s4-sec s4-sec-light">
        <div className="s4-sec-head reveal">
          <div>
            <p className="s4-sec-eyebrow">Latest Stories</p>
            <h2 className="s4-sec-title">Fashion</h2>
          </div>
          <span className="s4-sec-meta">Updated weekly</span>
        </div>
        <EditorialGrid items={fashionItems} reveal />
        <div className="s4-more-wrap"><SeeAll label="See More" onClick={go('fashion')} /></div>
      </section>
      </div>

      {/* ── Lifestyle — Style 2 two-up + marquee (fully normal scroll from here on) ── */}
      <section id="lifestyle" className="s4-sec s4-sec-dark">
        <div className="s4-sec-head reveal">
          <div>
            <p className="s4-sec-eyebrow">Off the pitch</p>
            <h2 className="s4-sec-title">Lifestyle</h2>
          </div>
          <a href="#" className="s4-more-link" onClick={go('lifestyle')}>See More <Arrow className="s4-more-arrow" /></a>
        </div>
        <FeaturedPair items={lifestyleItems} hideHead />
        <Marquee />
        <BlogReel items={byId(5, 8, 3, 6, 1, 7, 4, 2)} />
      </section>

      {/* ── Entertainment — Style 1 parallax (4 posts) ── */}
      <section id="entertainment" className="s4-sec s4-sec-light">
        <div className="s4-sec-head reveal">
          <div>
            <p className="s4-sec-eyebrow">Culture & more</p>
            <h2 className="s4-sec-title">Entertainment</h2>
          </div>
          <span className="s4-sec-meta">Selected</span>
        </div>
        <ParallaxColumns items={entertainmentItems} />
        <div className="s4-more-wrap"><SeeAll label="See More" onClick={go('entertainment')} /></div>
      </section>

      {/* ── Featured — index of every story ── */}
      <IndexList items={articles} eyebrow="Featured" titleMain="Featured Fits," titleAccent="in order." />
    </section>
  );
}

// ── Section pages (reached via "See More") — each uses its section's own style ──
// Section hero — the latest post in that section (culted-style, ~2/3 viewport tall)
function SectionHero({ section, navigate }) {
  const { openArticle } = useRouter();
  const m = SECTION_META[section];
  return (
    <section className="sec-hero">
      <div className="sec-hero-bg">
        <img src="/jcvr.png" alt="Do England have the best hair game in the World Cup?" />
      </div>
      <div className="sec-hero-inner">
        <a href="#/" className="sec-hero-crumb" onClick={(e) => { e.preventDefault(); navigate('home'); }}>
          Home <span>/</span> {m.name}
        </a>
        <a href="#/article" onClick={(e) => { e.preventDefault(); openArticle(SECTION_POOL[section][0]); }} className="sec-hero-post">
          <span className="sec-hero-tag">Latest in {m.name}</span>
          <h1 className="sec-hero-title">Do England Have The Best Hair Game In The World Cup?</h1>
          <span className="sec-hero-meta">{timeAgo(PAGE_LOAD - 4 * 3600_000)} · 4 min read</span>
          <span className="sec-hero-readmore">Read more <Arrow className="sec-hero-rm-arrow" /></span>
        </a>
      </div>
    </section>
  );
}

// The little section caption that sits under the hero (culted-style intro line)
function SectionIntro({ section }) {
  const m = SECTION_META[section];
  return (
    <div className="sec-intro">
      <h2 className="sec-intro-title">{m.introTitle}</h2>
      <p className="sec-intro-copy">{m.introCopy}</p>
    </div>
  );
}

// Style-2 blog cards laid out as a static grid (not the scrolling reel)
function CardGrid({ items }) {
  const { openArticle } = useRouter();
  return (
    <div className="s2-cardgrid">
      {items.map((a) => (
        <a key={a.id} href="#/article" onClick={(e) => { e.preventDefault(); openArticle(a); }} className="s2-reel-card" data-category={a.category}>
          <div className="s2-reel-img">
            <img src={a.image} alt={a.title} loading="lazy" />
            <span className="s2-reel-tag">{catOf(a)}</span>
          </div>
          <div className="s2-reel-meta">
            <span className="s2-reel-num">{a.tag.split(' / ')[0]}</span>
            <h4 className="s2-reel-title">{a.title}</h4>
            <span className="s2-reel-time">{agoOf(a)} · {readTime(a)} min</span>
          </div>
        </a>
      ))}
    </div>
  );
}

// Cross-section teasers before the footer: a scrolling reel of one other section,
// then the top two of the next — each with a button straight into that page.
function CrossSections({ current, navigate }) {
  const [reelSec, pairSec] = otherSections(current);
  const reel = SECTION_META[reelSec];
  const pair = SECTION_META[pairSec];
  const goTo = (s) => (e) => { e.preventDefault(); navigate(s); };
  return (
    <section className="xsec">
      <div className="xsec-lead">
        <p className="xsec-eyebrow">Keep going</p>
        <h2 className="xsec-heading">There’s more to the fit than {SECTION_META[current].name.toLowerCase()}.</h2>
      </div>

      {/* Scrolling reel of section B */}
      <div className="xsec-block">
        <div className="xsec-head">
          <div className="xsec-head-txt">
            <span className="xsec-tag">From {reel.name}</span>
            <h3 className="xsec-title">{reel.label}</h3>
          </div>
          <a href={`#/${reelSec}`} className="xsec-cta" onClick={goTo(reelSec)}>See all {reel.name} <Arrow className="xsec-arrow" /></a>
        </div>
        <BlogReel items={SECTION_POOL[reelSec]} />
      </div>

      {/* Top two of section C */}
      <div className="xsec-block">
        <div className="xsec-head">
          <div className="xsec-head-txt">
            <span className="xsec-tag">Also in {pair.name}</span>
            <h3 className="xsec-title">Two you shouldn’t miss</h3>
          </div>
          <a href={`#/${pairSec}`} className="xsec-cta" onClick={goTo(pairSec)}>See all {pair.name} <Arrow className="xsec-arrow" /></a>
        </div>
        <FeaturedPair items={SECTION_POOL[pairSec].slice(0, 2)} hideHead />
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ARTICLE (inner blog) — Sanity-ready. `body` is a Portable-Text-style array of
   composable blocks; each block type maps 1:1 to a future Sanity field. The page
   reads beautifully whether an article ships 1 image or 5, because typography and
   spacing carry it and every media block is optional.
   ══════════════════════════════════════════════════════════════════════════ */
const MOCK_ARTICLE = {
  slug: 'every-boot-michael-olise-has-worn-at-the-world-cup',
  section: 'fashion',
  category: 'Style',
  title: 'Every Boot Michael Olise Has Worn At The World Cup',
  hero: '/michael_olise.png',
  heroAlt: 'Michael Olise at the World Cup',
  author: 'Jules Okafor',
  agoHours: 22,   // anchored to page-load so the label stays live
  readMin: 5,
  standfirst: 'While the biggest names chase million dollar deals, the France winger has spent the World Cup quietly building the tournament’s most talked about boot rotation.',
  body: [
    { _type: 'paragraph', text: 'Michael Olise has quietly become one of the most fascinating football boot stories at the World Cup. While the biggest names in the game are often tied to multi million dollar endorsement deals and required to wear the latest commercial releases, the France winger has gone in the opposite direction. His choices have turned him into a favourite among football boot enthusiasts, not because he is chasing attention, but because he simply wears what he likes.' },
    { _type: 'paragraph', text: 'Throughout the tournament, Olise has rotated between several carefully selected colourways while staying loyal to one iconic silhouette, the Nike Hypervenom Phantom III. The boot was discontinued years ago, yet Olise continues to source fresh pairs privately instead of switching to newer models. From clean white editions to striking blue, mint green and gold variations, every pair has been chosen to complement France’s kit rather than satisfy a sponsor’s marketing campaign.' },
    { _type: 'gallery', images: [
      { src: '/ib1.jpeg', alt: 'Olise in the white Hypervenom Phantom III' },
      { src: '/ib2.jpeg', alt: 'A blue colourway of the Phantom III' },
    ] },
    { _type: 'paragraph', text: 'That attention to detail has become part of his identity. Every match feels like another opportunity to showcase a different colourway while maintaining the same trusted performance. It is an approach rarely seen in modern football where nearly every elite player is contractually obligated to wear whatever their boot manufacturer launches each season. Olise, however, has reportedly turned down lucrative sponsorship opportunities in order to keep complete freedom over what he wears on the pitch.' },
    { _type: 'image', src: '/ib3.jpeg', alt: 'A close detail of the Phantom III soleplate', caption: 'The Phantom III soleplate, sourced privately years after the boot was discontinued.' },
    { _type: 'paragraph', text: 'His loyalty to the Hypervenom Phantom III is easy to understand. The boot remains one of Nike’s most celebrated creations, known for its close touch, responsive feel and aggressive traction. For a player who relies on quick changes of direction, delicate first touches and precise passing in tight spaces, familiarity matters more than marketing. Instead of constantly adapting to new technology, Olise has perfected his game in a model he completely trusts.' },
    { _type: 'embed', provider: 'instagram', url: 'https://www.instagram.com/p/Da20rt_CFVe/?hl=en&img_index=1', caption: 'The rotation, catalogued by the boot community.' },
    { _type: 'paragraph', text: 'As France progressed through the World Cup, fans began paying almost as much attention to Olise’s boots as they did to his performances. Each appearance sparked conversations across football boot communities as supporters tried to identify the latest colourway before kickoff. In a tournament dominated by bright pink releases and coordinated brand campaigns, Olise’s understated individuality stood out even more.' },
    { _type: 'gallery', images: [
      { src: '/ib4.jpeg', alt: 'A mint green Phantom III' },
      { src: '/ib5.jpeg', alt: 'A gold Phantom III catching the light' },
    ] },
    { _type: 'paragraph', text: 'In an era where football equipment has become heavily commercialised, Michael Olise reminds us that style can still be personal. Every pair he has worn tells a story of preference over promotion, comfort over contracts and individuality over conformity. Whether he steps onto the pitch in white, blue, green or gold, one thing remains constant. Michael Olise continues to prove that some of football’s most memorable boot stories are written by players who simply refuse to follow the script.' },
  ],
};

// ── Portable-Text-style body renderer. Each case = one Sanity block type. ──
function ArticleBody({ blocks }) {
  return (
    <div className="art-body">
      {blocks.map((b, i) => {
        switch (b._type) {
          case 'paragraph': return <p key={i} className="art-p">{b.text}</p>;
          case 'image':     return <ArticleImage key={i} {...b} />;
          case 'gallery':   return <ArticleGallery key={i} images={b.images} caption={b.caption} />;
          case 'embed':     return <ArticleEmbed key={i} {...b} />;
          default:          return null;
        }
      })}
    </div>
  );
}

function ArticleImage({ src, alt = '', caption }) {
  return (
    <figure className="art-figure art-figure-single">
      <div className="art-media"><img src={src} alt={alt} loading="lazy" /></div>
      {caption && <figcaption className="art-cap">{caption}</figcaption>}
    </figure>
  );
}

// Renders 1..n images gracefully — a single image goes full column,
// two or more tile up to a 2-wide grid. No empty states, no broken rows.
function ArticleGallery({ images = [], caption }) {
  if (!images.length) return null;
  if (images.length === 1) return <ArticleImage {...images[0]} caption={caption} />;
  const cols = Math.min(images.length, 2);
  return (
    <figure className="art-figure art-gallery">
      <div className="art-gallery-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {images.map((im, i) => (
          <div key={i} className="art-media"><img src={im.src} alt={im.alt || ''} loading="lazy" /></div>
        ))}
      </div>
      {caption && <figcaption className="art-cap">{caption}</figcaption>}
    </figure>
  );
}

// Social embed — Instagram renders its own rich, clickable preview card.
function ArticleEmbed({ provider, url, caption }) {
  useEffect(() => {
    if (provider !== 'instagram') return;
    const process = () => window.instgrm?.Embeds?.process();
    if (window.instgrm) { process(); return; }
    let s = document.querySelector('script[src="https://www.instagram.com/embed.js"]');
    if (!s) {
      s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.instagram.com/embed.js';
      document.body.appendChild(s);
    }
    s.addEventListener('load', process);
    return () => s.removeEventListener('load', process);
  }, [provider, url]);

  if (provider !== 'instagram') return null;
  return (
    <figure className="art-figure art-embed">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{ background: '#fff', border: 0, margin: '0 auto', maxWidth: 540, width: '100%' }}
      >
        <a href={url} target="_blank" rel="noopener noreferrer">View this post on Instagram</a>
      </blockquote>
      {caption && <figcaption className="art-cap">{caption}</figcaption>}
    </figure>
  );
}

function ArticleHero({ article, navigate }) {
  const secName = SECTION_META[article.section]?.name ?? 'Stories';
  return (
    <section className="art-hero">
      <div className="art-hero-bg"><img src={article.hero} alt={article.heroAlt || ''} /></div>
      <div className="art-hero-inner">
        <nav className="art-hero-crumb" aria-label="Breadcrumb">
          <a href="#/" onClick={(e) => { e.preventDefault(); navigate('home'); }}>Home</a>
          <span>/</span>
          <a href={`#/${article.section}`} onClick={(e) => { e.preventDefault(); navigate(article.section); }}>{secName}</a>
        </nav>
        <div className="art-hero-post">
          <span className="art-hero-tag">{article.category}</span>
          <h1 className="art-hero-title">{article.title}</h1>
          {article.standfirst && <p className="art-hero-stand">{article.standfirst}</p>}
          <div className="art-hero-byline">
            <span>By {article.author}</span>
            <span className="art-dot" aria-hidden="true">·</span>
            <span>{timeAgo(PAGE_LOAD - article.agoHours * 3600_000)}</span>
            <span className="art-dot" aria-hidden="true">·</span>
            <span>{article.readMin} min read</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// After the read: the next few stories from the same section.
function ReadNext({ section, navigate }) {
  const secName = SECTION_META[section]?.name ?? 'More';
  const items = (SECTION_POOL[section] ?? []).slice(0, 3);
  return (
    <section className="read-next">
      <div className="read-next-head">
        <div>
          <p className="read-next-eyebrow">Keep reading</p>
          <h2 className="read-next-title">More in {secName}</h2>
        </div>
        <a href={`#/${section}`} className="read-next-cta" onClick={(e) => { e.preventDefault(); navigate(section); }}>
          See all {secName} <Arrow className="read-next-arrow" />
        </a>
      </div>
      <EditorialGrid items={items} />
    </section>
  );
}

function ArticlePage({ navigate }) {
  useMinuteTick();
  const a = MOCK_ARTICLE;
  return (
    <main className="page page-light article">
      <ArticleHero article={a} navigate={navigate} />
      <article className="art-wrap">
        <ArticleBody blocks={a.body} />
      </article>
      <ReadNext section={a.section} navigate={navigate} />
    </main>
  );
}

function FashionPage({ navigate }) {
  useMinuteTick();
  return (
    <main className="page page-light">
      <SectionHero section="fashion" navigate={navigate} />
      <SectionIntro section="fashion" />
      <EditorialGrid items={fashionPage} />
      <CrossSections current="fashion" navigate={navigate} />
    </main>
  );
}

function LifestylePage({ navigate }) {
  useMinuteTick();
  return (
    <main className="page page-dark">
      <SectionHero section="lifestyle" navigate={navigate} />
      <SectionIntro section="lifestyle" />
      <CardGrid items={lifestyleCards} />
      <Marquee />
      <CrossSections current="lifestyle" navigate={navigate} />
    </main>
  );
}

function EntertainmentPage({ navigate }) {
  useMinuteTick();
  return (
    <main className="page page-light">
      <SectionHero section="entertainment" navigate={navigate} />
      <SectionIntro section="entertainment" />
      <ParallaxColumns items={entertainmentPage} />
      <CrossSections current="entertainment" navigate={navigate} />
    </main>
  );
}

// Big editorial footer for the final site
function S4Footer({ navigate }) {
  return (
    <footer className="s4-footer">
      <div className="s4-footer-inner">
        <div className="s4-footer-top">
          <div className="s4-footer-contact">
            <a href="mailto:sayhi@footballerfits.co.uk" className="s4-footer-email">
              sayhi@footballerfits.co.uk
            </a>
            <a href="#" className="s4-footer-cta">
              Contact Now
              <span className="s4-footer-bracket" aria-hidden="true" />
            </a>
          </div>
          <nav className="s4-footer-nav" aria-label="Footer">
            {NAV_LINKS.map(({ label, page }, i) => (
              <a key={label} href={`#/${page === 'home' ? '' : page}`} className="s4-footer-link"
                 onClick={(e) => { e.preventDefault(); navigate(page); }}>
                <span>{label}</span><sup>0{i + 1}</sup>
              </a>
            ))}
          </nav>
        </div>

        <div className="s4-footer-sign">
          <div className="s4-footer-wordmark">
            <img src="/ff_hero.avif" alt="Footballer Fits" />
          </div>
          <div className="s4-footer-tag">
            <span className="s4-hf-copy">© 2026</span>
            <span className="s4-hf-rule" aria-hidden="true" />
            <span className="s4-hf-mark">FF</span>
          </div>
        </div>
      </div>

      <span className="s4-hero-mark s4-fmark m1" aria-hidden="true">+</span>
      <span className="s4-hero-mark s4-fmark m2" aria-hidden="true">+</span>
    </footer>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Home', page: 'home' },
  { label: 'Fashion', page: 'fashion' },
  { label: 'Lifestyle', page: 'lifestyle' },
  { label: 'Entertainment', page: 'entertainment' },
];

// Social icons (culted / versus style top bar)
const SOCIALS = [
  { name: 'X', href: '#', icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-7.1 8.1L23.3 22h-6.6l-5.2-6.8L5.6 22H2.5l7.6-8.7L1 2h6.8l4.6 6.1L18.9 2zm-1.1 18h1.8L7.3 3.9H5.4L17.8 20z"/></svg>
  ) },
  { name: 'Instagram', href: '#', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>
  ) },
  { name: 'TikTok', href: '#', icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.5 3c.35 2.1 1.6 3.6 3.6 3.9v2.6c-1.3.05-2.5-.35-3.65-1.1v5.85A5.65 5.65 0 1 1 10.8 8.6c.3 0 .6.03.9.08v2.65a3.05 3.05 0 1 0 2.15 2.92V3h2.65z"/></svg>
  ) },
  { name: 'YouTube', href: '#', icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.75-1.77C19.28 5 12 5 12 5s-7.28 0-8.85.53A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.75 1.77C4.72 19 12 19 12 19s7.28 0 8.85-.53a2.5 2.5 0 0 0 1.75-1.77C23 15.2 23 12 23 12zm-13.2 3.2V8.8l5.55 3.2-5.55 3.2z"/></svg>
  ) },
];

// Lightweight hash router — gives working back-button + shareable #/fashion URLs
const ROUTES = ['home', 'fashion', 'lifestyle', 'entertainment', 'article'];
const readRoute = () => {
  const h = window.location.hash.replace(/^#\/?/, '');
  return ROUTES.includes(h) ? h : 'home';
};
const PAGES = { fashion: FashionPage, lifestyle: LifestylePage, entertainment: EntertainmentPage, article: ArticlePage };

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState(readRoute);

  // Sync route with the URL hash (back/forward buttons + deep links)
  useEffect(() => {
    const onHash = () => { setPage(readRoute()); window.scrollTo({ top: 0 }); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const navigate = (p) => {
    setMenuOpen(false);
    window.location.hash = p === 'home' ? '/' : `/${p}`;
    window.scrollTo({ top: 0 });
  };
  // The single seam for opening a story. For now every card lands on the one
  // mock article; later this will route to `/article/${article.slug}` from Sanity.
  const openArticle = (/* article */) => navigate('article');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock scroll while the menu overlay is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const PageComponent = PAGES[page];

  return (
    <RouterCtx.Provider value={{ navigate, openArticle }}>
    <div className="app">
      {/* ── Nav ── */}
      <header className={`s4-nav${scrolled ? ' scrolled' : ''}`}>
        <button className="s4-burger" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <span /><span />
        </button>
        <a href="#/" className="s4-logo" aria-label="Footballer Fits — home" onClick={(e) => { e.preventDefault(); navigate('home'); }}>
          <img src="/logo.JPG" alt="" />
        </a>
        <div className="s4-socials">
          {SOCIALS.map((s) => (
            <a key={s.name} href={s.href} className="s4-social" aria-label={s.name} target="_blank" rel="noopener">
              {s.icon}
            </a>
          ))}
        </div>
      </header>

      {/* ── Menu overlay ── */}
      {menuOpen && (
        <div className="s4-menu" role="dialog" aria-modal="true">
          <div className="s4-menu-top">
            <a href="#/" className="s4-logo" aria-label="Footballer Fits — home" onClick={(e) => { e.preventDefault(); navigate('home'); }}>
              <img src="/logo.JPG" alt="" />
            </a>
            <button className="s4-menu-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
              Close <span aria-hidden="true">✕</span>
            </button>
          </div>
          <nav className="s4-menu-links" aria-label="Primary">
            {NAV_LINKS.map(({ label, page: p }, i) => (
              <a key={label} href={`#/${p === 'home' ? '' : p}`} onClick={(e) => { e.preventDefault(); navigate(p); }}>
                {label}<sup>0{i + 1}</sup>
              </a>
            ))}
          </nav>
          <div className="s4-menu-foot">
            <div className="s4-menu-socials">
              {SOCIALS.map((s) => (
                <a key={s.name} href={s.href} className="s4-social" aria-label={s.name} target="_blank" rel="noopener">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Page ── */}
      {PageComponent ? <PageComponent navigate={navigate} /> : <Site navigate={navigate} />}

      {/* ── Footer ── */}
      <S4Footer navigate={navigate} />
    </div>
    </RouterCtx.Provider>
  );
}
