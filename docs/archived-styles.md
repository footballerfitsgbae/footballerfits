# Footballer Fits — Archived Layout Styles (1, 2, 3)

> **Why this file exists.** The site was pitched as 4 layout concepts. **Style 4 became the
> live site** and Styles 1–3 were removed for a clean handoff. Their code + design notes are
> preserved here so any section can be reconstructed later — just copy the JSX/CSS back in.
>
> **Important:** the *reusable section components* the styles were built from are **still in
> `src/App.jsx`** (they power the live site), and their CSS is **still in `src/App.css`**:
> - `FeaturedPair` (two-up cover cards) → `.s2-feature*`, `.s2-lead*`
> - `Marquee` (scrolling word band) → `.s2-marquee*`
> - `BlogReel` (infinite horizontal reel) → `.s2-reel*`
> - `IndexList` (hover-reveal editorial index) → `.s2-index*`, `.s2-row*`, `.s2-preview`
> - `EditorialGrid` (uniform card grid) → `.s3-grid`, `.s3-card*`, `.s3-link*`
> - `ArticleCard` (Style-1 magazine card) → `.article-card`, `.card-*`, `.columns-grid`
> - `ParallaxColumns` (2-col drift-on-scroll) → `.s4-parallax`, `.columns-grid`
> - `SeeAll` button → `.btn-see-all`
>
> So to rebuild a style you mostly need the **wrapper component** (below) + the **wrapper CSS**
> (below). The inner pieces already exist.

---

## Design concepts

| Style | Name | Inspiration | Core idea |
|-------|------|-------------|-----------|
| **1** | Asymmetric Parallax | dense editorial | Two card columns; the **right column scroll-drifts** (`translateY(scrollY * -0.08)`), giving an asymmetric parallax. Category **filter bar** on top. |
| **2** | Editorial Broadsheet | [culted.com](https://culted.com) | Two-up **cover cards** → bold **marquee** → infinite **blog reel** → **"The Index"** hover-reveal list (cursor-follows a floating image preview). Loud newsstand energy, black↔paper rhythm. |
| **3** | The Journal | [nagisa.framer.website](https://nagisa.framer.website) | Luxe-minimal: oversized **stacked statement**, generous whitespace, **scroll reveals**, a featured pair + a uniform **3-col editorial grid**. Underline-draw "Read story" links. |

Weight/animation principles carried into Style 4: reveal easing `cubic-bezier(0.22,1,0.36,1)`, category tags, `agoOf()` + `readTime()` metadata.

---

## Style 1 — Asymmetric Parallax (component)

```jsx
// helpers it needs: leftArticles / rightArticles / cap / ArticleCard / SeeAll
const leftArticles  = articles.filter((_, i) => i % 2 === 0); // 1,3,5,7
const rightArticles = articles.filter((_, i) => i % 2 !== 0); // 2,4,6,8
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function StyleOne() {
  const rightColumnRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (rightColumnRef.current) {
            rightColumnRef.current.style.transform = `translateY(${window.scrollY * -0.08}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filters = ['all', 'culture', 'style', 'editorial', 'archive'];
  const filtered = (list) => activeFilter === 'all' ? list : list.filter(a => a.category === activeFilter);

  return (
    <section className="articles-section">
      <div className="filter-bar">
        {filters.map(f => (
          <button key={f} className={`filter-btn${activeFilter === f ? ' active' : ''}`} onClick={() => setActiveFilter(f)}>
            {cap(f)}
          </button>
        ))}
      </div>
      <div className="columns-grid">
        <div className="col-left">
          {filtered(leftArticles).map(a => <ArticleCard key={a.id} article={a} />)}
        </div>
        <div className="col-right" ref={rightColumnRef} style={{ willChange: 'transform' }}>
          {filtered(rightArticles).map(a => <ArticleCard key={a.id} article={a} />)}
        </div>
      </div>
      <div className="see-all-wrap"><SeeAll /></div>
    </section>
  );
}
```

### Style 1 exclusive CSS (deleted — `.columns-grid`/`.col-*`/`.article-card`/`.card-*` are KEPT in App.css)

```css
.articles-section { background: var(--paper); padding: 0 36px 100px; position: relative; }
.filter-bar {
  display: flex; align-items: center; border-bottom: 1px solid var(--border-light);
  margin-bottom: 56px; overflow-x: auto; scrollbar-width: none;
  max-width: 1480px; margin-left: auto; margin-right: auto;
}
.filter-bar::-webkit-scrollbar { display: none; }
.filter-btn {
  font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-light);
  padding: 20px 22px; border: none; background: none; cursor: pointer;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
  transition: color 0.2s, border-color 0.2s; white-space: nowrap; font-family: var(--font-body);
}
.filter-btn:hover { color: var(--ink); }
.filter-btn.active { color: var(--ink); border-bottom-color: var(--ink); font-weight: 500; }
.see-all-wrap { max-width: 1480px; margin: 28px auto 0; display: flex; justify-content: center; }
/* responsive: .articles-section { padding: 0 20px 80px } · .filter-btn { padding: 14px 14px; font-size: 10px } */
```

---

## Style 2 — Editorial Broadsheet (component)

```jsx
function StyleTwo() {
  return (
    <section className="s2">
      <FeaturedPair items={articles.slice(0, 2)} />
      <Marquee />
      <BlogReel items={articles} />
      <IndexList
        items={articles.slice(2)}
        startNum={3}
        sub={`Hover a story to preview. ${articles.length - 2} more reads from this week's drop.`}
      />
      <div className="s2-see-all-wrap"><SeeAll /></div>
    </section>
  );
}
```

### Style 2 exclusive CSS (wrapper only — all `.s2-feature/lead/marquee/reel/index/row` KEPT in App.css)

```css
.s2 { background: var(--black); }
.s2-see-all-wrap { background: var(--paper); padding: 0 36px 100px; display: flex; justify-content: center; }
/* responsive: .s2-see-all-wrap { padding: 0 20px 70px } */
```

---

## Style 3 — The Journal (component)

```jsx
function StyleThree() {
  const rootRef = useRef(null);
  useReveal(rootRef);

  return (
    <section className="s3" ref={rootRef}>
      <div className="s3-intro">
        <span className="s3-eyebrow reveal"><span className="s3-eyebrow-line" />Selected Stories — 2026</span>
        <h2 className="s3-statement reveal">
          <span>The way they</span>
          <span className="s3-italic">dress off the pitch</span>
          <span>is the story.</span>
        </h2>
        <div className="s3-intro-meta reveal">
          <p>An editorial gallery of the looks, the labels and the culture moving through the game right now — slowed down, given room to breathe.</p>
          <span className="s3-intro-count">(08 Features)</span>
        </div>
      </div>

      <div className="s3-featured">
        {articles.slice(0, 2).map((a) => (
          <a key={a.id} href="#" className="s3-card s3-card-lg reveal" data-category={a.category}>
            <div className="s3-card-img s3-card-img-lg">
              <img src={a.image} alt={a.title} loading="lazy" />
              <span className="s3-card-tag">{catOf(a)}</span>
            </div>
            <div className="s3-card-body">
              <span className="s3-card-date">Featured · {readTime(a)} min read</span>
              <h3 className="s3-card-title">{a.title}</h3>
              <p className="s3-card-excerpt">{a.excerpt}</p>
              <span className="s3-card-link">
                <span className="s3-link-label">Read the story</span>
                <span className="s3-link-line" />
              </span>
            </div>
          </a>
        ))}
      </div>

      <div className="s3-grid-head reveal">
        <h3 className="s3-grid-title">Latest Stories</h3>
        <span className="s3-grid-meta">Updated weekly</span>
      </div>
      <EditorialGrid items={articles.slice(2)} reveal />

      <div className="s3-see-all"><SeeAll /></div>
    </section>
  );
}
```

### Style 3 exclusive CSS (intro / featured / grid-head — the `.s3-card*`/`.s3-grid`/`.s3-link*` are KEPT)

```css
.s3 { background: var(--paper); color: var(--ink); }
.s3 .reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1); }
.s3 .reveal.in-view { opacity: 1; transform: none; }

.s3-intro { max-width: 1480px; margin: 0 auto; padding: 104px 36px 76px; }
.s3-eyebrow { display: inline-flex; align-items: center; gap: 14px; font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase; color: var(--ink-light); margin-bottom: 52px; }
.s3-eyebrow-line { width: 44px; height: 1px; background: var(--ink-light); }
.s3-statement { font-family: var(--font-display); font-weight: 700; font-size: clamp(38px, 6.6vw, 100px); line-height: 0.98; letter-spacing: -0.04em; text-transform: uppercase; color: var(--ink); }
.s3-statement span { display: block; }
.s3-statement .s3-italic { font-family: var(--font-body); font-style: italic; font-weight: 300; text-transform: none; letter-spacing: -0.01em; color: var(--ink-mid); }
.s3-intro-meta { display: flex; justify-content: space-between; align-items: flex-end; gap: 40px; margin-top: 58px; padding-top: 28px; border-top: 1px solid var(--border-light); }
.s3-intro-meta p { max-width: 440px; font-size: 14px; line-height: 1.75; font-weight: 300; color: var(--ink-mid); }
.s3-intro-count { font-family: var(--font-display); font-weight: 500; font-size: 12px; letter-spacing: 0.14em; color: var(--ink-light); white-space: nowrap; }

.s3-featured { max-width: 1480px; margin: 0 auto; padding: 28px 36px 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
.s3-card-lg { display: grid; grid-template-columns: 1.05fr 1fr; gap: 28px; align-items: center; }
.s3-card-img-lg { aspect-ratio: 5/6; margin-bottom: 0; }
.s3-card-lg .s3-card-title { font-size: clamp(24px, 2.4vw, 36px); margin-bottom: 16px; }
.s3-card-lg .s3-card-excerpt { font-size: 14px; line-height: 1.72; }

.s3-grid-head { max-width: 1480px; margin: 56px auto 0; padding: 0 36px 22px; display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; border-bottom: 1px solid var(--ink); }
.s3-grid-title { font-family: var(--font-display); font-weight: 700; font-size: clamp(24px, 3vw, 42px); text-transform: uppercase; letter-spacing: -0.03em; color: var(--ink); }
.s3-grid-meta { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-light); }
.s3-see-all { padding: 74px 36px 112px; display: flex; justify-content: center; }

/* responsive (860): .s3-intro{padding:60px 20px 48px} .s3-eyebrow{margin-bottom:32px}
   .s3-intro-meta{flex-direction:column;align-items:flex-start;gap:18px;margin-top:38px}
   .s3-featured{grid-template-columns:1fr;gap:36px;padding:20px 20px 0}
   .s3-card-lg{grid-template-columns:1fr;gap:18px} .s3-card-img-lg{aspect-ratio:4/3}
   .s3-grid-head{margin-top:44px;padding:0 20px 18px} .s3-see-all{padding:52px 20px 84px} */
```

---

## Old shared "masthead" hero + pitch bar + switcher (used by Styles 1–3)

Before Style 4 got its own hero, Styles 1–3 shared a masthead hero, a "pitch bar", a Style-switcher
`<header>`, and a minimal footer. Style 4 replaced all of these. Preserved here:

```jsx
{/* switcher header */}
<header>
  <a href="#" className="logo"><img src="/logo.JPG" alt="Footballer Fits" /></a>
  <nav role="tablist">
    {STYLES.map(({ n }) => (
      <button key={n} className={`style-btn${activeStyle === n ? ' active' : ''}`} onClick={() => setActiveStyle(n)}>
        Style <sup>0{n}</sup>
      </button>
    ))}
  </nav>
  <span className="nav-mobile">Style 0{activeStyle}</span>
</header>

{/* masthead hero */}
<section className="hero">
  <div className="hero-inner">
    <div className="hero-left">
      <div className="hero-eyebrow"><div className="hero-eyebrow-line" /><span className="hero-eyebrow-text">Editorial</span></div>
      <h1 className="hero-title">Follow the fits,<br/><span className="line-italic">read the culture,</span> and your next<br/>obsession drops<br/>every week.</h1>
    </div>
    <div className="hero-right">
      <p className="hero-desc">Footballer Fits was built on one simple obsession — the way footballers move through culture off the pitch is just as compelling as anything on it.</p>
      <div className="hero-meta"><span className="hero-count">08 Stories this week</span><div className="hero-divider" /></div>
    </div>
  </div>
</section>

{/* pitch bar */}
<div className="pitch-bar">
  <div className="pitch-bar-inner">
    <p className="pitch-label"><span className="pitch-label-dot" />Layout Pitch — Viewing<span className="pitch-active-name"> Style 0{activeStyle} · {activeName}</span></p>
    <p className="pitch-label">4 concepts · Click nav to switch</p>
  </div>
</div>

{/* minimal footer */}
<footer>
  <span className="footer-left">© 2026 Footballer Fits.</span>
  <div className="footer-right">
    <a href="#">Instagram</a><a href="#">X / Twitter</a>
  </div>
</footer>
```

```css
/* switcher header */
header { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 18px 36px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-dark); background: rgba(8,8,8,0.88); backdrop-filter: blur(14px); }
header.nav-transparent { background: transparent; border-color: transparent; backdrop-filter: none; }
.logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
.logo img { width: 34px; height: 34px; object-fit: contain; }
.logo-wordmark { font-family: var(--font-display); font-weight: 700; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--chalk); }
nav { display: flex; align-items: center; gap: 6px; }
.style-btn { font-size: 11px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--chalk-muted); background: none; border: 1px solid transparent; padding: 7px 18px; cursor: pointer; font-family: var(--font-body); transition: color .2s, border-color .2s, background .2s; display: flex; align-items: baseline; gap: 5px; }
.style-btn sup { font-size: 8px; color: var(--chalk-muted); font-weight: 300; }
.style-btn:hover { color: var(--chalk); border-color: var(--border-dark); }
.style-btn.active { color: var(--chalk); border-color: var(--chalk-dim); background: rgba(232,228,220,0.07); }
.style-btn.active sup { color: var(--chalk); }
.nav-mobile { display: none; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--chalk-dim); }

/* masthead hero */
.hero { background: var(--black); padding: 148px 36px 88px; position: relative; overflow: hidden; }
.hero::before, .hero::after { content: '+'; position: absolute; color: rgba(232,228,220,0.07); font-size: 20px; font-weight: 200; font-family: monospace; pointer-events: none; }
.hero::before { top: 42%; left: 28%; } .hero::after { top: 60%; right: 22%; }
.hero-inner { max-width: 1480px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: end; }
.hero-eyebrow { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
.hero-eyebrow-line { width: 28px; height: 1px; background: var(--chalk-muted); }
.hero-eyebrow-text { font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--chalk-muted); }
.hero-title { font-family: var(--font-display); font-weight: 700; font-size: clamp(36px, 5.2vw, 76px); line-height: 1.0; letter-spacing: -0.03em; text-transform: uppercase; color: var(--chalk); }
.hero-title .line-italic { display: block; font-style: italic; font-weight: 300; color: var(--chalk-dim); font-family: var(--font-body); font-size: 0.78em; letter-spacing: -0.01em; text-transform: none; }
.hero-right { display: flex; flex-direction: column; gap: 20px; align-self: end; padding-bottom: 4px; }
.hero-desc { font-size: 14px; line-height: 1.7; color: var(--chalk-dim); font-weight: 300; max-width: 380px; }
.hero-meta { display: flex; align-items: center; gap: 20px; }
.hero-count { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--chalk-muted); }
.hero-divider { flex: 1; height: 1px; background: var(--border-dark); max-width: 80px; }
/* responsive (860): .hero{padding:110px 20px 64px} .hero-inner{grid-template-columns:1fr;gap:28px} .hero-right{align-self:start} · (520): .hero-title{font-size:clamp(30px,9vw,48px)} */

/* pitch bar */
.pitch-bar { background: var(--black); border-bottom: 1px solid var(--border-dark); padding: 0 36px; }
.pitch-bar-inner { max-width: 1480px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 14px 0; }
.pitch-label { font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--chalk-muted); display: flex; align-items: center; gap: 10px; }
.pitch-label-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--chalk-muted); flex-shrink: 0; }
.pitch-active-name { font-family: var(--font-display); font-weight: 700; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--chalk); }

/* minimal footer */
footer { background: var(--black); border-top: 1px solid var(--border-dark); padding: 40px 36px; display: flex; align-items: center; justify-content: space-between; }
.footer-left { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--chalk-muted); }
.footer-right { display: flex; gap: 28px; }
.footer-right a { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--chalk-muted); text-decoration: none; transition: color .2s; }
.footer-right a:hover { color: var(--chalk); }
```

### "Coming Soon" placeholder panel (used before styles were built)

```css
.coming-soon-panel { background: var(--paper); min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; padding: 80px 36px; position: relative; overflow: hidden; }
.cs-eyebrow { font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase; color: var(--ink-light); display: flex; align-items: center; gap: 10px; }
.cs-eyebrow::before, .cs-eyebrow::after { content: ''; display: block; width: 32px; height: 1px; background: var(--border-light); }
.cs-title { font-family: var(--font-display); font-weight: 700; font-size: clamp(40px, 6vw, 88px); letter-spacing: -0.04em; text-transform: uppercase; color: var(--ink); text-align: center; line-height: 1; }
.cs-title span { font-style: italic; font-weight: 300; font-family: var(--font-body); color: var(--ink-light); font-size: 0.65em; display: block; letter-spacing: -0.01em; text-transform: none; line-height: 1.4; }
.cs-desc { font-size: 13px; line-height: 1.7; color: var(--ink-mid); text-align: center; max-width: 400px; }
.cs-num { font-family: var(--font-display); font-weight: 700; font-size: 120px; color: var(--border-light); line-height: 1; letter-spacing: -0.06em; position: absolute; pointer-events: none; user-select: none; }
```
