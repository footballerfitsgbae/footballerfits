import { createContext, useContext, useEffect, useRef, useState } from 'react';
import './App.css';
import { useSanityContent, cardToArticle, mapArticle } from './lib/content';
import { sanityClient } from './lib/sanityClient';
import { ARTICLE_BY_SLUG_QUERY } from './lib/queries';

// URL-safe slug (matches the migration + Sanity slugs).
const slugify = (s) =>
  String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Router context — lets any blog card open an article without prop-threading.
// `openArticle(article)` is the single seam we'll later point at Sanity slugs.
const RouterCtx = createContext({ navigate: () => {}, openArticle: () => {} });
const useRouter = () => useContext(RouterCtx);

// Content context — live Sanity content, seeded with the hardcoded fallbacks
// below so the UI is complete on first paint and never breaks if Sanity is
// empty, slow or unreachable.
const ContentCtx = createContext(null);
const useContent = () => useContext(ContentCtx);

// ── Article data ────────────────────────────────────────────────────────────
// Each gets a stable `slug` (matching the Sanity slugs) so every card is its own
// entity, routed at #/article/<slug>.
const articles = ([
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
]).map((a) => ({ ...a, slug: slugify(a.title) }));

// Real read time when Sanity supplies it, otherwise the deterministic pseudo value.
const readTime = (a) => a?.readMinutes ?? (3 + (Number(a?.id) % 4 || 0));
const catOf = (a) => a?.tag?.split(' / ')[1] ?? '';

// ── Real-time "published X ago" ──────────────────────────────────────────────
// Each post has an "hours since published" offset; the timestamp is anchored to
// page-load, so the relative label is always accurate and ticks up live.
const AGO_HOURS = { 1: 3, 2: 6, 3: 20, 4: 31, 5: 47, 6: 72, 7: 120, 8: 168 };
const PAGE_LOAD = Date.now();
// Real publish date when Sanity supplies it, otherwise the page-load anchored offset.
const publishedAtMs = (a) =>
  a?.publishedAt ? Date.parse(a.publishedAt) : PAGE_LOAD - (AGO_HOURS[a?.id] ?? 24) * 3600_000;

const plural = (n) => (n === 1 ? '' : 's');
function timeAgo(ts) {
  const mins = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${plural(mins)} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${plural(hrs)} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${plural(days)} ago`;
  if (days < 30) { const wks = Math.floor(days / 7); return `${wks} week${plural(wks)} ago`; }
  if (days < 365) { const mos = Math.floor(days / 30); return `${mos} month${plural(mos)} ago`; }
  const yrs = Math.floor(days / 365);
  return `${yrs} year${plural(yrs)} ago`;
}
const agoOf = (a) => timeAgo(publishedAtMs(a));

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
const DEFAULT_MARQUEE = ['Editorial', 'Off-Pitch', 'Style', 'Culture', 'Archive', 'The Tunnel', 'Weekly Drops'];

function Marquee({ words }) {
  const content = useContent();
  const list = words ?? content?.marqueeWords ?? DEFAULT_MARQUEE;
  return (
    <div className="s2-marquee" aria-hidden="true">
      <div className="s2-marquee-track">
        {[0, 1].map((g) => (
          <span key={g} className="s2-marquee-group">
            {list.map((w, j) => (
              <span key={j} className="s2-marquee-item">{w}<span className="s2-marquee-star">✦</span></span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

// Infinite horizontal blog reel
const REEL_CARD_PX = 324;   // 300px card + 12px margin each side
function BlogReel({ items }) {
  const { openArticle } = useRouter();
  const list = items ?? [];
  // Repeat the cards so one loop-half always overflows even wide screens — with
  // few articles this is what prevents a blank gap ("stuck") at the loop point.
  const reps = list.length ? Math.max(1, Math.ceil(2800 / (list.length * REEL_CARD_PX))) : 1;
  const half = Array.from({ length: reps }, () => list).flat();
  // Constant scroll speed (~matches the word marquee above): duration scales
  // with the number of cards in a half.
  const dur = `${Math.max(half.length, 1) * 4.5}s`;
  return (
    <div className="s2-reel">
      <div className="s2-reel-track" style={{ animationDuration: dur }}>
        {[0, 1].map((g) => (
          <div key={g} className="s2-reel-group" aria-hidden={g === 1 ? 'true' : undefined}>
            {half.map((a, i) => (
              <a key={`${g}-${i}-${a.id}`} href={a.slug ? `#/article/${a.slug}` : '#/article'} onClick={(e) => { e.preventDefault(); openArticle(a); }} className="s2-reel-card" data-category={a.category}>
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
    heroCover: '/jcvr.png', heroHeadline: 'Do England Have The Best Hair Game In The World Cup?',
    homeEyebrow: 'Latest Stories', homeMeta: 'Updated weekly',
  },
  lifestyle: {
    name: 'Lifestyle', label: 'Off the pitch', image: '/blog1.JPG',
    introTitle: 'Off the pitch is where the story lives.',
    introCopy: 'How the game’s biggest names move once the whistle goes. The homes, the rides, the downtime and the flexes that never make the highlight reel.',
    heroCover: '/jcvr.png', heroHeadline: 'Do England Have The Best Hair Game In The World Cup?',
    homeEyebrow: 'Off the pitch', homeMeta: '',
  },
  entertainment: {
    name: 'Entertainment', label: 'Culture & more', image: '/blog8.jpeg',
    introTitle: 'The game after the game.',
    introCopy: 'Music, cameos, memes and the moments football hands straight to culture. Everything the sport touches the second it leaves the ninety minutes.',
    heroCover: '/jcvr.png', heroHeadline: 'Do England Have The Best Hair Game In The World Cup?',
    homeEyebrow: 'Culture & more', homeMeta: 'Selected',
  },
};
// The next two sections, cyclically. Order comes from Sanity when available.
const otherSections = (current, order) => {
  const list = order?.length ? order : SECTION_ORDER;
  const n = list.length;
  const i = list.indexOf(current);
  if (i < 0 || n < 2) return list.filter((s) => s !== current).slice(0, 2);
  return [list[(i + 1) % n], list[(i + 2) % n]];
};

function Site({ navigate }) {
  const { openArticle } = useRouter();
  const c = useContent();
  const rootRef = useRef(null);
  useReveal(rootRef, c?.articles?.length);
  useMinuteTick();   // keeps the "X ago" labels live
  const go = (page) => (e) => { e.preventDefault(); navigate(page); };

  // Content, with the hardcoded defaults standing in wherever Sanity is empty.
  const home  = c?.home ?? {};
  const order = c?.sectionOrder ?? SECTION_ORDER;
  const meta  = c?.sectionMeta ?? SECTION_META;
  const pool  = c?.sectionPool ?? SECTION_POOL;
  const [s1, s2, s3] = order;                       // fashion / lifestyle / entertainment
  const m1 = meta[s1] ?? {}, m2 = meta[s2] ?? {}, m3 = meta[s3] ?? {};
  const items = (slug, n, fb) => (pool[slug]?.length ? pool[slug].slice(0, n) : fb);
  const allArticles = c?.articles ?? articles;
  const heroPost = home.heroPost ?? allArticles[0];
  // "Featured Fits, in order." -> main + accent, keeping the two-tone heading.
  const [fMain, ...fRest] = String(home.featuredTitle ?? 'Featured Fits, in order.').split(',');
  const featuredMain = fRest.length ? `${fMain},` : fMain;
  const featuredAccent = fRest.join(',').trim();

  return (
    <section className="s4" ref={rootRef}>
      {/* ── Hero + Fashion stack — the ONLY overlapping pair. Hero pins here and
             Fashion slides up to cover it; everything below scrolls normally. ── */}
      <div className="s4-hero-stack">
      <section className="s4-hero">
        <div className="s4-hero-bg">
          <img src={home.heroImage} alt={home.heroTitle} />
        </div>

        <div className="s4-hero-lede">
          <a href="#/article" onClick={(e) => { e.preventDefault(); openArticle(heroPost); }} className="s4-hero-post">
            <span className="s4-hero-post-tag">{home.heroTag}</span>
            <h2 className="s4-hero-post-title">{home.heroTitle}</h2>
            <span className="s4-hero-post-meta">
              {home.heroPost ? agoOf(home.heroPost) : timeAgo(PAGE_LOAD - 22 * 3600_000)}
              {' · '}{home.heroPost ? readTime(home.heroPost) : 5} min read
            </span>
            <span className="s4-hero-readmore">{home.heroCtaLabel} <Arrow className="s4-hero-rm-arrow" /></span>
          </a>
        </div>

        <div className="s4-hero-side">
          {(home.sideLabels ?? []).map((label, i) => (
            <span key={i}>{i === 0 ? <><span className="dim">01/</span> {label}</> : label}</span>
          ))}
        </div>
        <div className="s4-hero-footer">
          <span className="s4-hf-copy">{home.copyright}</span>
          <span className="s4-hf-rule" aria-hidden="true" />
          <img src="/logo.png" className="s4-hf-logo" alt={c?.site?.siteTitle} />
        </div>

        <span className="s4-hero-mark m1" aria-hidden="true">+</span>
        <span className="s4-hero-mark m2" aria-hidden="true">+</span>
        <span className="s4-hero-mark m3" aria-hidden="true">+</span>
      </section>

      {/* ── Fashion — Style 3 editorial grid ── */}
      <section id={s1} className="s4-sec s4-sec-light">
        <div className="s4-sec-head reveal">
          <div>
            <p className="s4-sec-eyebrow">{m1.homeEyebrow}</p>
            <h2 className="s4-sec-title">{m1.name}</h2>
          </div>
          <span className="s4-sec-meta">{m1.homeMeta}</span>
        </div>
        <EditorialGrid items={items(s1, 3, fashionItems)} reveal />
        <div className="s4-more-wrap"><SeeAll label={c?.microcopy?.seeMoreLabel} onClick={go(s1)} /></div>
      </section>
      </div>

      {/* ── Lifestyle — Style 2 two-up + marquee (fully normal scroll from here on) ── */}
      <section id={s2} className="s4-sec s4-sec-dark">
        <div className="s4-sec-head reveal">
          <div>
            <p className="s4-sec-eyebrow">{m2.homeEyebrow}</p>
            <h2 className="s4-sec-title">{m2.name}</h2>
          </div>
          <a href="#" className="s4-more-link" onClick={go(s2)}>{c?.microcopy?.seeMoreLabel} <Arrow className="s4-more-arrow" /></a>
        </div>
        <FeaturedPair items={items(s2, 2, lifestyleItems)} hideHead />
        <Marquee />
        {/* Marquee reel = up to 6 lifestyle articles so the loop stays full and
            doesn't visibly repeat. The two already in the pair above are placed
            LAST, so the covers aren't echoed immediately below them. */}
        <BlogReel items={[...(pool[s2] ?? []).slice(2), ...(pool[s2] ?? []).slice(0, 2)].slice(0, 6)} />
      </section>

      {/* ── Entertainment — Style 1 parallax (4 posts) ── */}
      <section id={s3} className="s4-sec s4-sec-light">
        <div className="s4-sec-head reveal">
          <div>
            <p className="s4-sec-eyebrow">{m3.homeEyebrow}</p>
            <h2 className="s4-sec-title">{m3.name}</h2>
          </div>
          <span className="s4-sec-meta">{m3.homeMeta}</span>
        </div>
        <ParallaxColumns items={items(s3, 4, entertainmentItems)} />
        <div className="s4-more-wrap"><SeeAll label={c?.microcopy?.seeMoreLabel} onClick={go(s3)} /></div>
      </section>

      {/* ── Featured — index of every story ── */}
      <IndexList
        items={home.featuredPosts ?? allArticles}
        eyebrow={home.featuredEyebrow}
        titleMain={featuredMain}
        titleAccent={featuredAccent}
      />
    </section>
  );
}

// ── Section pages (reached via "See More") — each uses its section's own style ──
// Section hero — the latest post in that section (culted-style, ~2/3 viewport tall)
// The article the section hero represents: a manually-set spotlight wins,
// otherwise the latest article in the category, otherwise the first pooled
// article (fallback mode). Shared so the grid below can exclude this same one.
function sectionHeroArticle(c, slug) {
  const m = c?.sectionMeta?.[slug] ?? SECTION_META[slug] ?? {};
  const all = c?.sectionAll?.[slug];
  const pool = c?.sectionPool?.[slug] ?? SECTION_POOL[slug] ?? [];
  return m.spotlight ?? m.latest ?? all?.[0] ?? pool[0] ?? null;
}

// The section grid, minus the hero article, so it never appears twice.
function sectionGridItems(c, slug) {
  const hero = sectionHeroArticle(c, slug);
  const list = c?.sectionAll?.[slug] ?? c?.sectionPool?.[slug] ?? SECTION_POOL[slug] ?? [];
  return list.filter((a) => a && a.slug !== hero?.slug && a.id !== hero?.id);
}

function SectionHero({ section, navigate }) {
  const { openArticle } = useRouter();
  const c = useContent();
  const m = c?.sectionMeta?.[section] ?? SECTION_META[section] ?? {};
  const mc = c?.microcopy ?? {};
  // Image, headline, meta and click-through all come from the hero article.
  const hero = sectionHeroArticle(c, section);
  const bgImage = m.heroCover ?? hero?.image ?? m.image;      // optional cover override, else the article image
  const headline = hero?.title ?? m.heroHeadline;
  const articleHref = hero?.slug ? `#/article/${hero.slug}` : '#/article';
  return (
    <section className="sec-hero">
      <div className="sec-hero-bg">
        <img src={bgImage} alt={headline ?? m.name} />
      </div>
      <div className="sec-hero-inner">
        <a href="#/" className="sec-hero-crumb" onClick={(e) => { e.preventDefault(); navigate('home'); }}>
          {mc.homeBreadcrumbLabel} <span>/</span> {m.name}
        </a>
        <a href={articleHref} onClick={(e) => { e.preventDefault(); openArticle(hero); }} className="sec-hero-post">
          <span className="sec-hero-tag">{mc.sectionLatestPrefix} {m.name}</span>
          <h1 className="sec-hero-title">{headline}</h1>
          <span className="sec-hero-meta">
            {hero ? agoOf(hero) : timeAgo(PAGE_LOAD - 4 * 3600_000)}
            {' · '}{hero ? readTime(hero) : 4} {mc.readTimeSuffix}
          </span>
          <span className="sec-hero-readmore">{mc.readMoreLabel} <Arrow className="sec-hero-rm-arrow" /></span>
        </a>
      </div>
    </section>
  );
}

// The little section caption that sits under the hero (culted-style intro line)
function SectionIntro({ section }) {
  const c = useContent();
  const m = c?.sectionMeta?.[section] ?? SECTION_META[section] ?? {};
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
  const c = useContent();
  const meta = c?.sectionMeta ?? SECTION_META;
  const pool = c?.sectionPool ?? SECTION_POOL;
  const mc = c?.microcopy ?? {};
  const [reelSec, pairSec] = otherSections(current, c?.sectionOrder);
  const reel = meta[reelSec] ?? {};
  const pair = meta[pairSec] ?? {};
  const seeAll = (name) => (mc.seeAllTemplate ?? 'See all {section}').replace('{section}', name);
  const goTo = (s) => (e) => { e.preventDefault(); navigate(s); };
  return (
    <section className="xsec">
      <div className="xsec-lead">
        <p className="xsec-eyebrow">{mc.crossEyebrow}</p>
        <h2 className="xsec-heading">
          {(mc.crossHeadingTemplate ?? 'There’s more to the fit than {section}.')
            .replace('{section}', (meta[current]?.name ?? '').toLowerCase())}
        </h2>
      </div>

      {/* Scrolling reel of section B */}
      <div className="xsec-block">
        <div className="xsec-head">
          <div className="xsec-head-txt">
            <span className="xsec-tag">{mc.crossReelTagPrefix} {reel.name}</span>
            <h3 className="xsec-title">{reel.label}</h3>
          </div>
          <a href={`#/${reelSec}`} className="xsec-cta" onClick={goTo(reelSec)}>{seeAll(reel.name)} <Arrow className="xsec-arrow" /></a>
        </div>
        <BlogReel items={pool[reelSec] ?? []} />
      </div>

      {/* Top two of section C */}
      <div className="xsec-block">
        <div className="xsec-head">
          <div className="xsec-head-txt">
            <span className="xsec-tag">{mc.crossPairTagPrefix} {pair.name}</span>
            <h3 className="xsec-title">{mc.crossPairTitle}</h3>
          </div>
          <a href={`#/${pairSec}`} className="xsec-cta" onClick={goTo(pairSec)}>{seeAll(pair.name)} <Arrow className="xsec-arrow" /></a>
        </div>
        <FeaturedPair items={(pool[pairSec] ?? []).slice(0, 2)} hideHead />
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
  if (!src) return null;   // never show an empty image frame
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
  const valid = images.filter((im) => im?.src);   // ignore images with no source
  if (!valid.length) return null;
  if (valid.length === 1) return <ArticleImage {...valid[0]} caption={caption} />;
  const cols = Math.min(valid.length, 2);
  return (
    <figure className="art-figure art-gallery">
      <div className="art-gallery-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {valid.map((im, i) => (
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
  const c = useContent();
  const mc = c?.microcopy ?? {};
  const secName = (c?.sectionMeta ?? SECTION_META)[article.section]?.name ?? 'Stories';
  return (
    <section className="art-hero">
      <div className="art-hero-bg"><img src={article.hero} alt={article.heroAlt || ''} /></div>
      <div className="art-hero-inner">
        <nav className="art-hero-crumb" aria-label="Breadcrumb">
          <a href="#/" onClick={(e) => { e.preventDefault(); navigate('home'); }}>{mc.homeBreadcrumbLabel}</a>
          <span>/</span>
          <a href={`#/${article.section}`} onClick={(e) => { e.preventDefault(); navigate(article.section); }}>{secName}</a>
        </nav>
        <div className="art-hero-post">
          <span className="art-hero-tag">{article.category}</span>
          <h1 className="art-hero-title">{article.title}</h1>
          {article.standfirst && <p className="art-hero-stand">{article.standfirst}</p>}
          <div className="art-hero-byline">
            <span>{mc.bylinePrefix} {article.author}</span>
            <span className="art-dot" aria-hidden="true">·</span>
            <span>{article.publishedAt
              ? timeAgo(Date.parse(article.publishedAt))
              : timeAgo(PAGE_LOAD - article.agoHours * 3600_000)}</span>
            <span className="art-dot" aria-hidden="true">·</span>
            <span>{article.readMin} {mc.readTimeSuffix}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// After the read: up to 3 more stories from the SAME category as the current
// article, always excluding the article being read.
function ReadNext({ section, excludeSlug, navigate }) {
  const c = useContent();
  const mc = c?.microcopy ?? {};
  const secName = (c?.sectionMeta ?? SECTION_META)[section]?.name ?? 'More';
  // Candidates = the whole category (curated pool + any later additions).
  const candidates = [
    ...((c?.sectionPool ?? SECTION_POOL)[section] ?? []),
    ...((c?.sectionExtra ?? {})[section] ?? []),
  ];
  const seen = new Set();
  const items = [];
  for (const p of candidates) {
    if (!p) continue;
    const pid = p.slug ?? p.id;
    if (p.slug === excludeSlug || p.id === excludeSlug || seen.has(pid)) continue;
    seen.add(pid);
    items.push(p);
    if (items.length === 3) break;
  }
  if (!items.length) return null;   // nothing else in this category to suggest
  return (
    <section className="read-next">
      <div className="read-next-head">
        <div>
          <p className="read-next-eyebrow">{mc.readNextEyebrow}</p>
          <h2 className="read-next-title">
            {(mc.readNextTitleTemplate ?? 'More in {section}').replace('{section}', secName)}
          </h2>
        </div>
        <a href={`#/${section}`} className="read-next-cta" onClick={(e) => { e.preventDefault(); navigate(section); }}>
          {(mc.seeAllTemplate ?? 'See all {section}').replace('{section}', secName)} <Arrow className="read-next-arrow" />
        </a>
      </div>
      <EditorialGrid items={items} />
    </section>
  );
}

// Look a card up by slug across everything currently loaded (so deep links and
// refreshes resolve the right article even without the clicked object in hand).
function findCardBySlug(c, slug) {
  if (!c || !slug) return null;
  const pools = Object.values(c.sectionPool ?? {}).flat();
  const all = [
    ...(c.articles ?? []),
    ...pools,
    ...(c.home?.featuredPosts ?? []),
    c.home?.heroPost,
  ].filter(Boolean);
  return all.find((a) => a.slug === slug) ?? null;
}

function ArticlePage({ navigate, article: clicked, slug }) {
  useMinuteTick();
  const c = useContent();
  const mock = c?.article ?? MOCK_ARTICLE;
  // The card whose article this is: prefer the clicked object (instant), but
  // only if it matches the URL slug (so back/forward + deep links stay correct).
  const card = (clicked && (!slug || clicked.slug === slug)) ? clicked : findCardBySlug(c, slug);
  // Identity comes from the card immediately; the real body loads in after.
  const base = cardToArticle(card, mock);

  const [full, setFull] = useState(null);
  useEffect(() => {
    const s = card?.slug ?? slug;
    setFull(null);
    if (!s) return;
    let cancelled = false;
    sanityClient
      .fetch(ARTICLE_BY_SLUG_QUERY, { slug: s })
      .then((doc) => {
        if (!cancelled && doc && Array.isArray(doc.body) && doc.body.length) {
          setFull(mapArticle(doc, cardToArticle(card, mock)));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.slug, slug]);

  const a = full ?? base;
  return (
    <main className="page page-light article">
      <ArticleHero article={a} navigate={navigate} />
      <article className="art-wrap">
        <ArticleBody blocks={a.body} />
      </article>
      <ReadNext section={a.section} excludeSlug={a.slug} navigate={navigate} />
    </main>
  );
}

// How many articles each section shows in its grid (excluding the hero article).
const SECTION_GRID_COUNT = { fashion: 6, lifestyle: 4, entertainment: 6 };

// "See more" button — matches the home page's, and opens the section's dedicated
// all-articles page (#/section/<slug>/all).
function SeeMoreLink({ slug, navigate, label }) {
  return (
    <div className="s4-more-wrap">
      <SeeAll label={label} onClick={(e) => { e.preventDefault(); navigate(`section/${slug}/all`); }} />
    </div>
  );
}

// The right grid component for a section (keeps each section's own card design).
function SectionGrid({ slug, items }) {
  if (slug === 'lifestyle') return <CardGrid items={items} />;
  if (slug === 'entertainment') return <ParallaxColumns items={items} />;
  return <EditorialGrid items={items} />;
}

// Section pages. `slug` defaults keep the existing routes working; the items and
// all copy come from Sanity when present, otherwise the hardcoded pools.
function FashionPage({ navigate }) {
  useMinuteTick();
  const c = useContent();
  const slug = c?.sectionOrder?.[0] ?? 'fashion';
  const grid = sectionGridItems(c, slug).slice(0, SECTION_GRID_COUNT.fashion);
  return (
    <main className="page page-light">
      <SectionHero section={slug} navigate={navigate} />
      <SectionIntro section={slug} />
      <EditorialGrid items={grid} />
      <SeeMoreLink slug={slug} navigate={navigate} label={c?.microcopy?.seeMoreLabel} />
      <CrossSections current={slug} navigate={navigate} />
    </main>
  );
}

function LifestylePage({ navigate }) {
  useMinuteTick();
  const c = useContent();
  const slug = c?.sectionOrder?.[1] ?? 'lifestyle';
  const grid = sectionGridItems(c, slug).slice(0, SECTION_GRID_COUNT.lifestyle);
  return (
    <main className="page page-dark">
      <SectionHero section={slug} navigate={navigate} />
      <SectionIntro section={slug} />
      <CardGrid items={grid} />
      <SeeMoreLink slug={slug} navigate={navigate} label={c?.microcopy?.seeMoreLabel} />
      <Marquee />
      <CrossSections current={slug} navigate={navigate} />
    </main>
  );
}

function EntertainmentPage({ navigate }) {
  useMinuteTick();
  const c = useContent();
  const slug = c?.sectionOrder?.[2] ?? 'entertainment';
  const grid = sectionGridItems(c, slug).slice(0, SECTION_GRID_COUNT.entertainment);
  return (
    <main className="page page-light">
      <SectionHero section={slug} navigate={navigate} />
      <SectionIntro section={slug} />
      <ParallaxColumns items={grid} />
      <SeeMoreLink slug={slug} navigate={navigate} label={c?.microcopy?.seeMoreLabel} />
      <CrossSections current={slug} navigate={navigate} />
    </main>
  );
}

// Dedicated all-articles page for a section (#/section/<slug>/all) — every
// article in that category, newest first, in the section's own grid style.
function SectionAllPage({ navigate, slug }) {
  useMinuteTick();
  const c = useContent();
  const s = (c?.sectionOrder ?? SECTION_ORDER).includes(slug) ? slug : (slug ?? 'fashion');
  const dark = s === 'lifestyle';
  const items = c?.sectionAll?.[s] ?? c?.sectionPool?.[s] ?? SECTION_POOL[s] ?? [];
  return (
    <main className={`page sec-all ${dark ? 'page-dark' : 'page-light'}`}>
      <SectionIntro section={s} />
      <SectionGrid slug={s} items={items} />
      <CrossSections current={s} navigate={navigate} />
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   TERMS & CONDITIONS — UK-based company (governed by the law of England & Wales).
   Template copy for Footballer Fits; the client should confirm their company
   details and have it reviewed before launch.
   ══════════════════════════════════════════════════════════════════════════ */
const TERMS_UPDATED = '27 July 2026';
const TERMS_SECTIONS = [
  {
    h: 'Introduction',
    body: [
      { p: 'These terms and conditions govern your use of the Footballer Fits website. By accessing or using the site you agree to be bound by these terms. If you do not agree with them, please do not use the site.' },
      { p: 'In these terms the words we, us and our refer to Footballer Fits. You refers to anyone who visits or uses the website.' },
    ],
  },
  {
    h: 'About us',
    body: [
      { p: 'Footballer Fits is an online editorial platform covering football culture, style and lifestyle, operated from the United Kingdom. You can contact us at any time at contact@footballerfits.co.uk.' },
    ],
  },
  {
    h: 'Using this website',
    body: [
      { p: 'You may use this website for your own personal, non commercial use. In return, you agree not to:' },
      { list: [
        'Use the site in any way that breaks the law or any applicable regulation.',
        'Copy, reproduce or redistribute our content without our permission.',
        'Attempt to gain unauthorised access to the site, its servers or any connected systems.',
        'Introduce viruses or any other material that is harmful or disruptive.',
        'Use the site in a way that could damage, disable or impair it for others.',
      ] },
      { p: 'We may suspend or withdraw access to the site, or any part of it, at any time and without notice.' },
    ],
  },
  {
    h: 'Intellectual property',
    body: [
      { p: 'Unless stated otherwise, all content on this website, including text, images, graphics, logos and design, is owned by us or our licensors and is protected by copyright and other intellectual property laws. You may not use it for commercial purposes without our written permission.' },
      { p: 'Football club badges, kit designs, brand names and other trademarks featured on the site remain the property of their respective owners and appear for editorial and identification purposes only.' },
    ],
  },
  {
    h: 'Content and accuracy',
    body: [
      { p: 'Our content is provided for general information and entertainment. While we work to keep it accurate and up to date, we make no promises that it is complete, current or free from error, and we may change or remove content at any time.' },
      { p: 'Any opinions expressed are those of the writers and do not constitute professional advice.' },
    ],
  },
  {
    h: 'Links to other websites',
    body: [
      { p: 'This website may contain links to third party websites and embedded content such as social media posts. We do not control those sites and are not responsible for their content, availability or privacy practices. A link does not mean we endorse them.' },
    ],
  },
  {
    h: 'Your submissions',
    body: [
      { p: 'If you send us content, ideas or feedback, you grant us the right to use it without restriction or payment, unless we have agreed otherwise in writing. Please do not send us anything you consider confidential.' },
    ],
  },
  {
    h: 'Disclaimers',
    body: [
      { p: 'The website is provided on an as available basis. To the extent permitted by law, we exclude all warranties, whether express or implied, relating to the site and its content. We do not guarantee that the site will always be available or uninterrupted.' },
    ],
  },
  {
    h: 'Limitation of liability',
    body: [
      { p: 'To the extent permitted by law, we will not be liable for any loss or damage arising from your use of, or inability to use, this website, or from reliance on any content on it. Nothing in these terms limits our liability for death or personal injury caused by negligence, or for fraud, or for anything else that cannot be limited under the law of England and Wales.' },
    ],
  },
  {
    h: 'Privacy',
    body: [
      { p: 'Your use of the website is also governed by our Privacy Policy, which explains how we collect and use your information. Please read it alongside these terms.' },
    ],
  },
  {
    h: 'Governing law',
    body: [
      { p: 'These terms are governed by the law of England and Wales. Any disputes relating to them will be subject to the exclusive jurisdiction of the courts of England and Wales.' },
    ],
  },
  {
    h: 'Changes to these terms',
    body: [
      { p: 'We may update these terms from time to time. When we do, we will change the date at the top of this page. Your continued use of the site after any change means you accept the updated terms.' },
    ],
  },
  {
    h: 'Contact us',
    body: [
      { p: 'If you have any questions about these terms, please email us at contact@footballerfits.co.uk.' },
    ],
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   PRIVACY POLICY — UK data protection (UK GDPR / Data Protection Act 2018 /
   PECR). Template copy for Footballer Fits; the client should confirm their
   company details and have it reviewed before launch.
   ══════════════════════════════════════════════════════════════════════════ */
const PRIVACY_UPDATED = '22 July 2026';
const PRIVACY_SECTIONS = [
  {
    h: 'Who we are',
    body: [
      { p: 'Footballer Fits is an online editorial platform covering football culture, style and lifestyle. In this policy the words we, us and our refer to Footballer Fits. We are the data controller responsible for the personal information collected through this website.' },
      { p: 'If you have any questions about this policy or about how we handle your information, you can reach us at contact@footballerfits.co.uk.' },
    ],
  },
  {
    h: 'The information we collect',
    body: [
      { p: 'We only collect the information we need to run the website and respond to you. This may include:' },
      { list: [
        'The name and email address you give us when you contact us or sign up for updates.',
        'Technical information such as your device type, browser and how you use the site, collected through cookies and similar tools.',
        'Any details you choose to share with us in a message or email.',
      ] },
      { p: 'We do not ask for sensitive personal information, and you should not send it to us.' },
    ],
  },
  {
    h: 'How we use your information',
    body: [
      { p: 'We use your information to:' },
      { list: [
        'Reply to your messages and enquiries.',
        'Send you updates or newsletters where you have asked to receive them.',
        'Understand how people use the site so we can improve it.',
        'Keep the website secure and working properly.',
      ] },
    ],
  },
  {
    h: 'Our lawful basis for using your data',
    body: [
      { p: 'Under UK data protection law we must have a valid reason to use your personal information. Depending on the situation we rely on:' },
      { list: [
        'Your consent, when we send you marketing or newsletters. You can withdraw this at any time.',
        'Our legitimate interests, to run, protect and improve the website, provided your rights do not override those interests.',
        'A legal obligation, where the law requires us to keep or share certain information.',
      ] },
    ],
  },
  {
    h: 'Cookies',
    body: [
      { p: 'Cookies are small files stored on your device that help the website work and help us understand how it is used. We use essential cookies that the site needs to function, and analytics cookies that help us see which content is popular.' },
      { p: 'You can control or delete cookies through your browser settings at any time. Turning off some cookies may affect how the site works for you.' },
    ],
  },
  {
    h: 'Sharing your information',
    body: [
      { p: 'We do not sell your personal information. We may share it with trusted service providers who help us run the website, such as hosting and analytics providers, and only so they can carry out those services for us.' },
      { p: 'We may also share information where the law requires it, or to protect our rights, safety or property. Any providers we work with must keep your information secure and use it only for the purposes we set.' },
    ],
  },
  {
    h: 'How long we keep your information',
    body: [
      { p: 'We keep your personal information only for as long as we need it for the purposes set out in this policy, or for as long as the law requires. When we no longer need it, we delete it or make it anonymous.' },
    ],
  },
  {
    h: 'Storing and transferring your data',
    body: [
      { p: 'We aim to store your information within the UK or the European Economic Area. If any information is transferred outside these areas, we will make sure appropriate safeguards are in place to protect it, in line with UK data protection law.' },
    ],
  },
  {
    h: 'Keeping your information secure',
    body: [
      { p: 'We take reasonable steps to protect your information from loss, misuse and unauthorised access. No method of sending or storing data online is completely secure, so we cannot promise absolute security, but we work to protect your information at all times.' },
    ],
  },
  {
    h: 'Your rights',
    body: [
      { p: 'Under UK data protection law you have a number of rights over your personal information. You can:' },
      { list: [
        'Ask us for a copy of the information we hold about you.',
        'Ask us to correct information that is wrong or incomplete.',
        'Ask us to delete your information in certain circumstances.',
        'Ask us to limit or stop using your information.',
        'Object to us using your information for certain purposes.',
        'Ask us to move your information to another provider.',
      ] },
      { p: 'To use any of these rights, email us at contact@footballerfits.co.uk. We will respond within one month.' },
    ],
  },
  {
    h: 'Children',
    body: [
      { p: 'This website is not aimed at children under the age of 13, and we do not knowingly collect their information. If you believe a child has given us their details, please contact us and we will remove them.' },
    ],
  },
  {
    h: 'Complaints',
    body: [
      { p: 'If you are unhappy with how we have handled your information, please contact us first so we can try to put things right. You also have the right to complain to the Information Commissioner’s Office, the UK regulator for data protection, at ico.org.uk.' },
    ],
  },
  {
    h: 'Changes to this policy',
    body: [
      { p: 'We may update this policy from time to time. When we do, we will change the date at the top of this page. Please check back regularly so you always know how we protect your information.' },
    ],
  },
  {
    h: 'Contact us',
    body: [
      { p: 'If you have any questions about this privacy policy or about how we use your information, please email us at contact@footballerfits.co.uk.' },
    ],
  },
];

// Reusable legal-document layout (Privacy Policy, Terms & Conditions).
function LegalPage({ navigate, title, updated, lead, sections }) {
  return (
    <main className="page page-light legal">
      <div className="legal-head">
        <a href="#/" className="legal-crumb" onClick={(e) => { e.preventDefault(); navigate('home'); }}>
          Home <span>/</span> {title}
        </a>
        <h1 className="legal-title">{title}</h1>
        {updated && <p className="legal-updated">Last updated {updated}</p>}
      </div>
      <article className="legal-wrap">
        {lead && <p className="legal-lead">{lead}</p>}
        {sections.map((s, i) => (
          <section key={i} className="legal-section">
            <h2 className="legal-h">{s.h}</h2>
            {s.body.map((block, j) =>
              block.list ? (
                <ul key={j} className="legal-list">
                  {block.list.map((li, k) => <li key={k}>{li}</li>)}
                </ul>
              ) : (
                <p key={j} className="legal-p">{block.p}</p>
              )
            )}
          </section>
        ))}
      </article>
    </main>
  );
}

const PRIVACY_LEAD = 'This policy explains what information Footballer Fits collects, why we collect it, and the choices you have. We keep it as clear and short as we can.';
const TERMS_LEAD = 'These terms set out the rules for using the Footballer Fits website. By using the site you agree to them, so please take a moment to read through.';

function PrivacyPage({ navigate }) {
  // Prefer the Sanity-edited page; fall back to the hardcoded copy so it never blanks.
  const p = useContent()?.legal?.['legal-privacy'];
  return (
    <LegalPage
      navigate={navigate}
      title={p?.title || 'Privacy Policy'}
      updated={p?.updated || PRIVACY_UPDATED}
      lead={p?.lead || PRIVACY_LEAD}
      sections={p?.sections?.length ? p.sections : PRIVACY_SECTIONS}
    />
  );
}

function TermsPage({ navigate }) {
  const p = useContent()?.legal?.['legal-terms'];
  return (
    <LegalPage
      navigate={navigate}
      title={p?.title || 'Terms & Conditions'}
      updated={p?.updated || TERMS_UPDATED}
      lead={p?.lead || TERMS_LEAD}
      sections={p?.sections?.length ? p.sections : TERMS_SECTIONS}
    />
  );
}

// ── About — editorial mission page (SoccerBible / Versus style) ──
// Hardcoded fallback, used until/unless the About page is filled in in Sanity.
const ABOUT_FALLBACK = {
  eyebrow: 'About',
  statement:
    'The game is bigger than ninety minutes. We cover the culture, the fits and the stories that live around it.',
  lead:
    'Footballer Fits is an editorial platform built for the way football is actually followed today. Not just results and ratings, but the style, the swagger and the culture the sport moves through.',
  paragraphs: [
    'We started from a simple idea. The way players dress, the music in the tunnel, the shirts fans hunt down and the moments that spill off the pitch are as much a part of the game as the football itself. Those stories rarely get told properly, so we tell them.',
    'Across Fashion, Lifestyle and Entertainment we document the drip, the drops and the personalities shaping the modern game. Some of it is deeply researched. Some of it is simply a great fit worth talking about. All of it comes from a real love of football culture.',
    'We are independent, we are opinionated, and we care about doing it with taste. If it moves the culture forward, it belongs here.',
  ],
  columns: [
    { k: 'Fashion', v: 'Kits, collabs, sneakers and the fits worth framing.' },
    { k: 'Lifestyle', v: 'How the game’s biggest names move off the pitch.' },
    { k: 'Entertainment', v: 'Music, cameos and football’s life in wider culture.' },
  ],
  ctaLabel: 'Get in touch',
};

function AboutPage({ navigate }) {
  // Prefer the Sanity-edited page; fall back to the hardcoded copy above.
  const a = useContent()?.about ?? ABOUT_FALLBACK;
  const paragraphs = a.paragraphs?.length ? a.paragraphs : ABOUT_FALLBACK.paragraphs;
  const columns = a.columns?.length ? a.columns : ABOUT_FALLBACK.columns;
  return (
    <main className="page page-light about">
      <section className="about-hero">
        <a href="#/" className="about-crumb" onClick={(e) => { e.preventDefault(); navigate('home'); }}>
          Home <span>/</span> About
        </a>
        <p className="about-eyebrow">{a.eyebrow || ABOUT_FALLBACK.eyebrow}</p>
        <h1 className="about-statement">{a.statement || ABOUT_FALLBACK.statement}</h1>
      </section>

      <div className="about-body">
        <p className="about-lead">{a.lead || ABOUT_FALLBACK.lead}</p>
        {paragraphs.map((p, i) => (
          <p key={i} className="about-p">{p}</p>
        ))}

        <div className="about-cols">
          {columns.map((c) => (
            <div key={c.k} className="about-col">
              <h3 className="about-col-k">{c.k}</h3>
              <p className="about-col-v">{c.v}</p>
            </div>
          ))}
        </div>

        <a href="#/contact" className="about-cta" onClick={(e) => { e.preventDefault(); navigate('contact'); }}>
          {a.ctaLabel || ABOUT_FALLBACK.ctaLabel} <Arrow className="about-cta-arrow" />
        </a>
      </div>
    </main>
  );
}

// ── Contact — info page (SoccerBible style) ──
const CONTACT_LEAD =
  'Whether you have a story, a collaboration or just want to say hello, here is how to reach the team.';
const CONTACT_ROWS = [
  { k: 'General', v: 'For everything else and general enquiries.', email: 'contact@footballerfits.co.uk' },
  { k: 'Editorial & Press', v: 'Story tips, features and press requests.', email: 'editorial@footballerfits.co.uk' },
  { k: 'Partnerships', v: 'Brand, advertising and collaborations.', email: 'partnerships@footballerfits.co.uk' },
];

function ContactPage({ navigate }) {
  const c = useContent();
  const socials = c?.socialLinks ?? [];
  // Prefer the Sanity-edited page; fall back to the hardcoded copy.
  const cp = c?.contact;
  const eyebrow = cp?.eyebrow || 'Contact';
  const title = cp?.title || 'Get in touch';
  const lead = cp?.lead || CONTACT_LEAD;
  const general = c?.site?.contactEmail ?? 'contact@footballerfits.co.uk';
  // Sanity rows if provided, else the defaults with the General email synced to Site settings.
  const rows = cp?.rows?.length
    ? cp.rows
    : CONTACT_ROWS.map((r) => (r.k === 'General' ? { ...r, email: general } : r));
  return (
    <main className="page page-light contact">
      <div className="contact-head">
        <a href="#/" className="about-crumb" onClick={(e) => { e.preventDefault(); navigate('home'); }}>
          Home <span>/</span> Contact
        </a>
        <p className="about-eyebrow">{eyebrow}</p>
        <h1 className="contact-title">{title}</h1>
        <p className="contact-lead">{lead}</p>
      </div>

      <div className="contact-rows">
        {rows.map((r) => (
          <div key={r.k} className="contact-row">
            <h2 className="contact-row-k">{r.k}</h2>
            <p className="contact-row-v">{r.v}</p>
            <a href={`mailto:${r.email}`} className="contact-row-email">{r.email}</a>
          </div>
        ))}
      </div>

      {socials.length > 0 && (
        <div className="contact-social">
          <span className="contact-social-label">Follow along</span>
          <div className="contact-social-icons">
            {socials.map((s) => SOCIAL_ICONS[s.platform] && (
              <a key={s.platform} href={s.url || '#'} className="s4-social" aria-label={SOCIAL_NAMES[s.platform]} target="_blank" rel="noopener">
                {SOCIAL_ICONS[s.platform]}
              </a>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

// Footer information pages (distinct from the header's content nav).
const FOOTER_LINKS = [
  { label: 'About', page: 'about' },
  { label: 'Terms & Conditions', page: 'terms' },
  { label: 'Privacy Policy', page: 'privacy' },
  { label: 'Contact', page: 'contact' },
];

// Big editorial footer for the final site
function S4Footer({ navigate }) {
  const c = useContent();
  const site = c?.site ?? {};
  return (
    <footer className="s4-footer">
      <div className="s4-footer-inner">
        <div className="s4-footer-top">
          <div className="s4-footer-contact">
            <a href={`mailto:${site.contactEmail}`} className="s4-footer-email">
              {site.contactEmail}
            </a>
            <a href="#/contact" className="s4-footer-cta" onClick={(e) => { e.preventDefault(); navigate('contact'); }}>
              {site.contactCtaLabel}
              <span className="s4-footer-bracket" aria-hidden="true" />
            </a>
          </div>
          <nav className="s4-footer-nav" aria-label="Footer">
            {FOOTER_LINKS.map(({ label, page }, i) => (
              <a key={label} href={`#/${page}`} className="s4-footer-link"
                 onClick={(e) => { e.preventDefault(); navigate(page); }}>
                <span>{label}</span><sup>0{i + 1}</sup>
              </a>
            ))}
          </nav>
        </div>

        <div className="s4-footer-sign">
          <div className="s4-footer-wordmark">
            <img src={site.wordmark} alt={site.siteTitle} />
          </div>
          <div className="s4-footer-tag">
            <span className="s4-hf-copy">{site.copyrightText}</span>
            <span className="s4-hf-rule" aria-hidden="true" />
            <img src="/logo.png" className="s4-hf-logo" alt={site.siteTitle} />
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
  { label: 'Privacy Policy', page: 'privacy' },
];

// Social icons (culted / versus style top bar)
const SOCIALS = [
  { name: 'X', platform: 'x', href: '#', icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-7.1 8.1L23.3 22h-6.6l-5.2-6.8L5.6 22H2.5l7.6-8.7L1 2h6.8l4.6 6.1L18.9 2zm-1.1 18h1.8L7.3 3.9H5.4L17.8 20z"/></svg>
  ) },
  { name: 'Instagram', platform: 'instagram', href: '#', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>
  ) },
  { name: 'TikTok', platform: 'tiktok', href: '#', icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.5 3c.35 2.1 1.6 3.6 3.6 3.9v2.6c-1.3.05-2.5-.35-3.65-1.1v5.85A5.65 5.65 0 1 1 10.8 8.6c.3 0 .6.03.9.08v2.65a3.05 3.05 0 1 0 2.15 2.92V3h2.65z"/></svg>
  ) },
  { name: 'Snapchat', platform: 'snapchat', href: 'https://www.snapchat.com/add/footballerfits', icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.31 2c.13 0 .26 0 .4.01 1.29.06 2.5.64 3.31 1.6.68.8 1.02 1.8 1.02 3.05 0 .5-.03 1-.06 1.44v.03c-.01.15.05.28.17.34.19.1.44.09.66-.02.14-.06.31-.09.47-.05.2.04.35.16.4.35.05.23-.03.46-.4.63-.13.06-.28.11-.42.15-.24.07-.5.15-.56.35-.03.11 0 .23.05.35l.01.02c.06.15.75 1.65 2.3 2.28.16.06.3.09.41.13l.05.02c.29.12.35.29.34.43-.01.35-.62.61-.86.7-.09.03-.19.06-.29.08-.32.08-.72.18-.83.44-.05.12-.03.27 0 .4v.02c.02.06.03.13-.01.19-.1.15-.4.14-.6.13-.23-.02-.49-.06-.76-.11-.25-.04-.53-.08-.81-.08-.15 0-.3.01-.45.04-.42.07-.77.31-1.1.55-.5.36-1.01.72-1.85.72h-.09c-.84 0-1.36-.36-1.86-.72-.33-.23-.68-.48-1.1-.55-.15-.03-.3-.04-.45-.04-.27 0-.54.03-.8.08-.28.06-.54.1-.78.11h-.06c-.16 0-.42 0-.5-.13-.04-.06-.03-.13-.01-.19v-.01c.03-.13.05-.28 0-.4-.11-.26-.51-.36-.83-.44-.1-.02-.2-.05-.29-.08-.31-.11-.82-.34-.86-.66-.02-.13.03-.31.34-.44.01 0 .03-.02.05-.02.11-.04.25-.07.41-.13 1.59-.65 2.27-2.21 2.3-2.28l.01-.02c.05-.12.08-.24.05-.35-.06-.2-.32-.28-.56-.35-.14-.04-.29-.09-.42-.15-.26-.13-.46-.35-.4-.63.05-.19.21-.31.4-.35.16-.04.33-.01.47.05.22.11.47.12.66.02.13-.07.19-.21.18-.36v-.02c-.03-.44-.06-.94-.06-1.44 0-1.25.34-2.25 1.02-3.05C7.81 2.65 9.02 2.07 10.31 2.01c.14-.01.27-.01.4-.01h1.6z"/></svg>
  ) },
  { name: 'YouTube', platform: 'youtube', href: '#', icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.75-1.77C19.28 5 12 5 12 5s-7.28 0-8.85.53A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.75 1.77C4.72 19 12 19 12 19s7.28 0 8.85-.53a2.5 2.5 0 0 0 1.75-1.77C23 15.2 23 12 23 12zm-13.2 3.2V8.8l5.55 3.2-5.55 3.2z"/></svg>
  ) },
  { name: 'Facebook', platform: 'facebook', href: 'https://www.facebook.com/FootballerFits/', icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.68 4.53-4.68 1.31 0 2.68.23 2.68.23v2.97h-1.5c-1.48 0-1.94.92-1.94 1.86v2.24h3.3l-.53 3.49h-2.77V24C19.61 23.09 24 18.1 24 12.07z"/></svg>
  ) },
];

// Platform -> icon/label, so Sanity only has to store the platform + URL.
const SOCIAL_ICONS = Object.fromEntries(SOCIALS.map((s) => [s.platform, s.icon]));
const SOCIAL_NAMES = Object.fromEntries(SOCIALS.map((s) => [s.platform, s.name]));

// A card for the featured (Olise) story, so the home hero opens its own article
// rather than falling through to the newest post.
const FEATURE_CARD = {
  id: MOCK_ARTICLE.slug,
  slug: MOCK_ARTICLE.slug,
  tag: `00 / ${MOCK_ARTICLE.category}`,
  title: MOCK_ARTICLE.title,
  excerpt: MOCK_ARTICLE.standfirst,
  image: MOCK_ARTICLE.hero,
  ratio: 'portrait',
  category: MOCK_ARTICLE.section,
  publishedAt: new Date(PAGE_LOAD - MOCK_ARTICLE.agoHours * 3600_000).toISOString(),
  readMinutes: MOCK_ARTICLE.readMin,
  author: MOCK_ARTICLE.author,
  standfirst: MOCK_ARTICLE.standfirst,
};

/* ══════════════════════════════════════════════════════════════════════════
   FALLBACK CONTENT — every hardcoded default in one object. This is what the
   site renders with until (and unless) Sanity has content for a given field, so
   an empty, slow or unreachable Sanity never leaves the UI broken or blank.
   ══════════════════════════════════════════════════════════════════════════ */
const FALLBACK_CONTENT = {
  articles,
  categories: [],
  authors: [],
  sectionOrder: SECTION_ORDER,
  sectionMeta: SECTION_META,
  sectionPool: SECTION_POOL,
  sectionAll: SECTION_POOL,   // full per-section list (== pool when offline)
  sectionExtra: {},   // no "load more" content without Sanity
  home: {
    heroImage: '/michael_olise.png',
    heroTag: 'Latest Article',
    heroTitle: 'Every Boot Michael Olise Has Worn At The World Cup',
    heroPost: FEATURE_CARD,
    heroCtaLabel: 'Read more',
    sideLabels: ['Editorial', 'Culture', 'Style'],
    copyright: '© 2026',
    featuredEyebrow: 'Featured',
    featuredTitle: 'Featured Fits, in order.',
    featuredPosts: articles,
  },
  marqueeWords: DEFAULT_MARQUEE,
  site: {
    siteTitle: 'Footballer Fits',
    logo: '/logo.JPG',
    wordmark: '/ff_hero.avif',
    monogram: 'FF',
    contactEmail: 'contact@footballerfits.co.uk',
    contactCtaLabel: 'Contact Now',
    contactCtaUrl: null,
    copyrightText: '© 2026',
  },
  navLinks: NAV_LINKS,
  socialLinks: SOCIALS.map((s) => ({ platform: s.platform, url: s.href })),
  microcopy: {
    seeMoreLabel: 'See More',
    readMoreLabel: 'Read more',
    seeAllTemplate: 'See all {section}',
    latestArticleLabel: 'Latest Article',
    homeBreadcrumbLabel: 'Home',
    bylinePrefix: 'By',
    readTimeSuffix: 'min read',
    sectionLatestPrefix: 'Latest in',
    crossEyebrow: 'Keep going',
    crossHeadingTemplate: 'There’s more to the fit than {section}.',
    crossReelTagPrefix: 'From',
    crossPairTagPrefix: 'Also in',
    crossPairTitle: 'Two you shouldn’t miss',
    readNextEyebrow: 'Keep reading',
    readNextTitleTemplate: 'More in {section}',
  },
  article: MOCK_ARTICLE,
};

// Lightweight hash router — gives working back-button + shareable #/fashion and
// per-article #/article/<slug> URLs.
const ROUTES = ['home', 'fashion', 'lifestyle', 'entertainment', 'article', 'privacy', 'terms', 'about', 'contact'];
const readRoute = () => {
  const h = window.location.hash.replace(/^#\/?/, '');
  const [seg, ...rest] = h.split('/');
  if (seg === 'article') return { page: 'article', slug: rest.join('/') || null };
  // #/section/<slug>/all — a section's dedicated all-articles page
  if (seg === 'section' && rest[1] === 'all') return { page: 'sectionAll', slug: rest[0] || null };
  return { page: ROUTES.includes(seg) ? seg : 'home', slug: null };
};
const PAGES = { fashion: FashionPage, lifestyle: LifestylePage, entertainment: EntertainmentPage, article: ArticlePage, privacy: PrivacyPage, terms: TermsPage, about: AboutPage, contact: ContactPage, sectionAll: SectionAllPage };

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [route, setRoute] = useState(readRoute);   // { page, slug }
  const [openedArticle, setOpenedArticle] = useState(null);   // the clicked card
  const page = route.page;

  // Live Sanity content, seeded with FALLBACK_CONTENT so the first paint is
  // already complete. `loading` is exposed via aria-busy for assistive tech —
  // there is deliberately no blocking spinner, because swapping a full fallback
  // render for the real content is smoother than showing an empty shell.
  const { content, loading } = useSanityContent(FALLBACK_CONTENT);
  const socials = content?.socialLinks ?? FALLBACK_CONTENT.socialLinks;
  const navLinks = content?.navLinks ?? NAV_LINKS;
  const site = content?.site ?? FALLBACK_CONTENT.site;

  // Sync route with the URL hash (back/forward buttons + deep links)
  useEffect(() => {
    const onHash = () => { setRoute(readRoute()); window.scrollTo({ top: 0 }); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const navigate = (p) => {
    setMenuOpen(false);
    window.location.hash = p === 'home' ? '/' : `/${p}`;
    window.scrollTo({ top: 0 });
  };
  // Opening a story: remember which card was clicked (for an instant, correct
  // render) and route to its own #/article/<slug> URL so each blog is a real,
  // shareable entity that maps 1:1 to a Sanity document.
  const openArticle = (article) => {
    setOpenedArticle(article ?? null);
    navigate(article?.slug ? `article/${article.slug}` : 'article');
  };

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
    <ContentCtx.Provider value={content}>
    <RouterCtx.Provider value={{ navigate, openArticle }}>
    <div className="app" aria-busy={loading || undefined}>
      {/* ── Nav ── */}
      <header className={`s4-nav${scrolled ? ' scrolled' : ''}`}>
        <button className="s4-burger" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <span /><span />
        </button>
        <a href="#/" className="s4-logo" aria-label={`${site.siteTitle} — home`} onClick={(e) => { e.preventDefault(); navigate('home'); }}>
          <img src={site.logo} alt="" />
        </a>
        <div className="s4-socials">
          {socials.map((s) => SOCIAL_ICONS[s.platform] && (
            <a key={s.platform} href={s.url || '#'} className="s4-social" aria-label={SOCIAL_NAMES[s.platform]} target="_blank" rel="noopener">
              {SOCIAL_ICONS[s.platform]}
            </a>
          ))}
        </div>
      </header>

      {/* ── Menu overlay ── */}
      {menuOpen && (
        <div className="s4-menu" role="dialog" aria-modal="true">
          <div className="s4-menu-top">
            <a href="#/" className="s4-logo" aria-label={`${site.siteTitle} — home`} onClick={(e) => { e.preventDefault(); navigate('home'); }}>
              <img src={site.logo} alt="" />
            </a>
            <button className="s4-menu-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
              Close <span aria-hidden="true">✕</span>
            </button>
          </div>
          <nav className="s4-menu-links" aria-label="Primary">
            {navLinks.map(({ label, page: p, href, external }, i) => (
              <a key={label} href={external ? href : `#/${p === 'home' ? '' : p}`}
                 {...(external ? { target: '_blank', rel: 'noopener' } : {})}
                 onClick={external ? undefined : (e) => { e.preventDefault(); navigate(p); }}>
                {label}<sup>0{i + 1}</sup>
              </a>
            ))}
          </nav>
          <div className="s4-menu-foot">
            <div className="s4-menu-socials">
              {socials.map((s) => SOCIAL_ICONS[s.platform] && (
                <a key={s.platform} href={s.url || '#'} className="s4-social" aria-label={SOCIAL_NAMES[s.platform]} target="_blank" rel="noopener">
                  {SOCIAL_ICONS[s.platform]}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Page ── */}
      {PageComponent ? <PageComponent navigate={navigate} article={openedArticle} slug={route.slug} /> : <Site navigate={navigate} />}

      {/* ── Footer ── */}
      <S4Footer navigate={navigate} />
    </div>
    </RouterCtx.Provider>
    </ContentCtx.Provider>
  );
}
