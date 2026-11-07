import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowUpRight,
  ArrowDown,
  Sparkles,
  Flame,
  RotateCcw,
  Copy,
  Download,
  Send,
  Gift,
  X,
  Menu,
  Check,
  Heart,
  ArrowRight,
  Stars,
} from "lucide-react";
import Rangoli, { Diya } from "./components/Rangoli";
import Fireworks, { burst, AmbientFireworks } from "./components/Fireworks";
import Music from "./components/Music";
import { Link } from "react-router-dom";
import { playDiyaSound } from "./lib/diyaSound";
import {
  blessings,
  greeting,
  whatsappLink,
  downloadGreeting,
} from "./lib/greetings";
const DiyaScene = lazy(() => import("./components/DiyaScene"));
gsap.registerPlugin(ScrollTrigger);
const wishes = [
  {
    tag: "NEW BEGINNINGS",
    title: "A little light.\nEndless possibilities.",
    text: "May this Diwali bring happiness, prosperity, and the courage to begin something beautiful.",
    color: "gold",
  },
  {
    tag: "THE PEOPLE WE LOVE",
    title: "Home is where\nthe light is.",
    text: "May your family be wrapped in warmth, your home filled with laughter, and your hearts forever connected.",
    color: "purple",
  },
  {
    tag: "DOSTI & DIWALI",
    title: "Good friends.\nBrighter celebrations.",
    text: "To the friends who make ordinary days sparkle: may your Diwali be as wonderful as you are.",
    color: "pink",
  },
  {
    tag: "शुभ दीपावली",
    title: "हर घर में उजाला,\nहर दिल में खुशियाँ।",
    text: "दीपों का यह पावन त्योहार आपके जीवन में सुख, शांति और समृद्धि लेकर आए। शुभ दीपावली!",
    color: "orange",
  },
  {
    tag: "A MOMENT OF HOPE",
    title: "Let your light\nfind its way.",
    text: "Even the smallest flame can brighten the darkest night. May you always find the light within.",
    color: "blue",
  },
];
function readLit() {
  try {
    const x = JSON.parse(sessionStorage.getItem("jyoti-lit") || "[]");
    return Array.isArray(x)
      ? [...new Set(x.filter((n) => Number.isInteger(n) && n >= 0 && n < 12))]
      : [];
  } catch {
    return [];
  }
}
function SectionHead({ number, eyebrow, title, children }) {
  return (
    <div className="section-head reveal">
      <span className="eyebrow">
        <span>{number}</span> {eyebrow}
      </span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}
function App() {
  const reduced = useReducedMotion(),
    [lit, setLit] = useState(readLit),
    [toast, setToast] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [style, setStyle] = useState("Traditional"),
    [card, setCard] = useState(greeting("", "", "Traditional")),
    [cardVersion, setCardVersion] = useState(0),
    [gift, setGift] = useState(false),
    [menu, setMenu] = useState(false),
    [copied, setCopied] = useState(""),
    [busy, setBusy] = useState(false),
    [skyActive, setSkyActive] = useState(false);
  const toastTimer = useRef(),
    copyTimer = useRef();
  const notify = (s) => {
    setToast(s);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4500);
  };
  useEffect(
    () => () => {
      clearTimeout(toastTimer.current);
      clearTimeout(copyTimer.current);
    },
    [],
  );
  useEffect(() => {
    try {
      sessionStorage.setItem("jyoti-lit", JSON.stringify(lit));
    } catch {
      /* Session storage can be disabled; in-memory lighting still works. */
    }
  }, [lit]);
  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".reveal").forEach((el) =>
        gsap.fromTo(
          el,
          { y: 35, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 91%", once: true },
          },
        ),
      );
      gsap.to(".art-halo", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    });
    return () => ctx.revert();
  }, [reduced]);
  useEffect(() => {
    if (!menu) return;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenu(false);
    };
    const closeOutside = (event) => {
      if (!event.target.closest("header")) setMenu(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutside);
    };
  }, [menu]);
  const lightDiya = (id, e) => {
    if (lit.includes(id)) {
      notify("This diya is already carrying your light.");
      return;
    }
    setLit((prev) => (prev.includes(id) ? prev : [...prev, id]));
    void playDiyaSound();
    if (e) {
      const r = e.currentTarget.getBoundingClientRect();
      burst(r.x + r.width / 2, r.y + r.height * 0.35, 1, "sparkle");
    }
    notify(blessings[id % blessings.length]);
  };
  const heroLight = () => {
    const id = Array.from({ length: 12 }, (_, i) => i).find(
      (i) => !lit.includes(i),
    );
    document
      .getElementById("diyas")
      .scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
    if (id !== undefined) lightDiya(id);
    else notify("All twelve diyas are glowing with your love.");
  };
  const copy = async (text, id) => {
    try {
      if (!navigator.clipboard) throw new Error();
      await navigator.clipboard.writeText(text);
      setCopied(id);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(""), 2000);
      notify("Copied. A little light, ready to share.");
    } catch {
      notify(
        "Copy is unavailable. Select the greeting text and copy it manually.",
      );
    }
  };
  const grand = () => {
    burst(undefined, undefined, reduced ? 3 : 9);
    setSkyActive(true);
    notify("A sky full of light, just for you.");
  };
  const reset = () => {
    setLit([]);
    setGift(false);
    setSkyActive(false);
    setFrom("");
    setTo("");
    setStyle("Traditional");
    setCard(greeting("", "", "Traditional"));
    window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });
    burst(undefined, undefined, 3);
    notify("A new beginning. Let’s make it bright.");
  };
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to celebration
      </a>
      <Fireworks reduced={reduced} />
      <AmbientFireworks reduced={reduced} />
      <div className="starfield" aria-hidden="true">
        {Array.from({ length: 65 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${(i * 47.71) % 100}%`,
              top: `${(i * 31.17) % 100}%`,
              animationDelay: `-${i * 0.37}s`,
            }}
          />
        ))}
      </div>
      <header>
        <a className="brand" href="#" aria-label="दीपोत्सव home">
          <span className="brand-icon">
            <Flame size={25} />
          </span>
          दीपोत्सव
        </a>
        <nav
          id="main-navigation"
          aria-label="Main navigation"
          className={menu ? "open" : ""}
        >
          {[
            ["The celebration", "#main"],
            ["Light a diya", "#diyas"],
            ["Send a wish", "#greetings"],
          ].map(([label, href]) => (
            <a key={href} href={href} onClick={() => setMenu(false)}>
              {label}
            </a>
          ))}
        </nav>
        <div className="header-right">
          <Music notify={notify} />
          <button
            className="menu-toggle icon-button"
            aria-label={menu ? "Close navigation" : "Open navigation"}
            aria-expanded={menu}
            aria-controls="main-navigation"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-arch" aria-hidden="true" />
          <button
            className="moon"
            aria-label="Discover the moon’s fireworks surprise"
            onClick={() => {
              burst(undefined, undefined, 6);
              notify("Even the moon has a little magic to share.");
            }}
          />
          <button
            className="lantern lantern-one"
            aria-label="Release golden lantern sparkles"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              burst(r.x + r.width / 2, r.bottom, 2, "sparkle");
              notify("A wish released into the night.");
            }}
          >
            <span />
            <i />
          </button>
          <button
            className="lantern lantern-two"
            aria-label="Release another lantern’s golden sparkles"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              burst(r.x, r.bottom, 1, "sparkle");
            }}
          >
            <span />
            <i />
          </button>
          <motion.div
            className="hero-copy"
            initial={reduced ? false : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15 }}
          >
            <div className="occasion">
              <span /> THE FESTIVAL OF LIGHTS <span />
            </div>
            <p className="hindi">शुभ दीपावली</p>
            <h1 id="hero-title">
              Happy
              <br />
              <em>Diwali</em>
              <span className="heading-star">✧</span>
            </h1>
            <p className="hero-subtitle">
              A little light. A little love.
              <br />A world of beautiful possibilities.
            </p>
            <p className="hero-description">
              May the festival of lights illuminate your life with happiness,
              prosperity, love, and endless possibilities.
            </p>
            <div className="hero-actions">
              <button className="button primary" onClick={heroLight}>
                <Flame size={17} /> Light a Diya <ArrowUpRight size={17} />
              </button>
              <Link className="button secondary" to="/fireworks">
                <Sparkles size={17} /> Celebrate with Fireworks
              </Link>
            </div>
            <div className="hero-note">
              <span className="tiny-spark">✦</span> A celebration to feel. A
              light to share.
            </div>
          </motion.div>
          <motion.div
            className="hero-art"
            initial={reduced ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.6 }}
          >
            <div className="art-halo" />
            <Rangoli className="hero-rangoli" />
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <Suspense
              fallback={
                <div className="diya-scene">
                  <Diya className="hero-fallback" />
                </div>
              }
            >
              <DiyaScene reduced={reduced} />
            </Suspense>
            <span className="art-spark spark-one">✧</span>
            <span className="art-spark spark-two">✦</span>
            <div className="art-caption">
              <span /> FROM DARKNESS, INTO LIGHT <span />
            </div>
            <div className="floating-dust" aria-hidden="true">
              {Array.from({ length: 16 }, (_, i) => (
                <i
                  key={i}
                  style={{
                    left: `${15 + i * 4.7}%`,
                    top: `${20 + ((i * 19) % 65)}%`,
                    animationDelay: `-${i * 0.7}s`,
                  }}
                />
              ))}
            </div>
          </motion.div>
          <div className="hero-bottom">
            <a href="#diyas" className="scroll-cue">
              <span className="scroll-line" /> SCROLL TO FEEL THE MAGIC{" "}
              <ArrowDown size={14} />
            </a>
            <span>
              LIGHT OVER DARKNESS <i /> LOVE OVER EVERYTHING
            </span>
            <span className="edition">
              DIWALI <span>2026</span>
            </span>
          </div>
        </section>
        <div className="festival-ribbon" aria-hidden="true">
          <span>LIGHT</span>✧<span>LOVE</span>✧<span>TOGETHERNESS</span>✧
          <span>NEW BEGINNINGS</span>✧<span>LIGHT</span>✧<span>LOVE</span>
        </div>
        <section id="diyas" className="section diya-section">
          <SectionHead
            number="01"
            eyebrow="A SMALL FLAME. A BEAUTIFUL BEGINNING."
            title={
              <>
                Let there be <em>light.</em>
              </>
            }
          >
            Every diya carries a wish. Light one for yourself, one for someone
            you love,
            <br className="desktop-break" /> and one for all the beautiful
            things yet to come.
          </SectionHead>
          <div className="diya-garden reveal">
            {Array.from({ length: 12 }, (_, i) => (
              <button
                key={i}
                className={`diya-tile ${lit.includes(i) ? "is-lit" : ""}`}
                aria-label={`Light diya ${i + 1}`}
                aria-pressed={lit.includes(i)}
                onClick={(e) => lightDiya(i, e)}
              >
                <Diya lit={lit.includes(i)} />
                <span>
                  {lit.includes(i)
                    ? [
                        "Hope",
                        "Love",
                        "Joy",
                        "Peace",
                        "Abundance",
                        "New beginnings",
                      ][i % 6]
                    : String(i + 1).padStart(2, "0")}
                </span>
              </button>
            ))}
          </div>
          <div className="garden-bottom reveal">
            <span>
              <Sparkles size={16} />
              <strong data-testid="diya-count">{lit.length}</strong>{" "}
              {lit.length === 1 ? "Diya" : "Diyas"} Lit with Love{" "}
              <span className="count-limit">/ 12</span>
            </span>
            <button
              className="text-button"
              onClick={() => {
                setLit([]);
                notify("The diyas are ready for your next wish.");
              }}
            >
              <RotateCcw size={14} /> Reset diyas
            </button>
          </div>
          <p className="quiet-note">Tap a diya. Make a wish. Let it glow.</p>
        </section>
        <section
          id="fireworks"
          className="sky-section"
          onClick={(e) => {
            if (!e.target.closest("button,a")) {
              burst(e.clientX, e.clientY);
              setSkyActive(true);
            }
          }}
        >
          <Rangoli className="sky-mandala" />
          <div className="sky-copy reveal">
            <span className="eyebrow">
              <span>02</span> PAINT THE NIGHT
            </span>
            <h2>
              Some joys are
              <br />
              written in the <em>sky.</em>
            </h2>
            <p>
              A thousand sparks. A million possibilities.
              <br />
              Make the night your own canvas.
            </p>
            <button className="button primary" onClick={grand}>
              <Sparkles size={18} /> Grand Celebration{" "}
              <ArrowUpRight size={17} />
            </button>
            <span className="tap-hint">
              {skyActive
                ? "Keep going. The sky is yours."
                : "Or tap anywhere in this sky to make it sparkle."}
            </span>
          </div>
          <div className="firework-art" aria-hidden="true">
            {[0, 1, 2].map((k) => (
              <div className={`static-burst burst-${k}`} key={k}>
                {Array.from({ length: 28 }, (_, i) => (
                  <i
                    key={i}
                    style={{
                      "--a": `${(i * 360) / 28}deg`,
                      "--l": `${50 + (i % 4) * 12}px`,
                    }}
                  />
                ))}
              </div>
            ))}
            <span className="sky-star">✧</span>
          </div>
          <button
            className="sky-accessible"
            onClick={() => {
              burst(undefined, undefined, 1);
              setSkyActive(true);
            }}
            aria-label="Launch a single firework"
          >
            Launch a spark <ArrowUpRight size={15} />
          </button>
        </section>
        <section id="greetings" className="section greetings-section">
          <SectionHead
            number="03"
            eyebrow="WORDS THAT GLOW"
            title={
              <>
                A wish, with your <em>heart in it.</em>
              </>
            }
          >
            For the ones near, the ones far, and the ones always in your heart.
          </SectionHead>
          <div className="greeting-layout reveal">
            <form
              className="greeting-form"
              onSubmit={(e) => {
                e.preventDefault();
                setCard(greeting(from, to, style));
                setCardVersion((v) => v + 1);
                notify("Your wish is ready to brighten someone’s day.");
              }}
            >
              <div className="form-heading">
                <span className="mini-number">✧</span>
                <h3>Make it personal</h3>
              </div>
              <label htmlFor="from">YOUR NAME</label>
              <input
                id="from"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                maxLength={60}
                placeholder="A little love, from…"
                autoComplete="given-name"
              />
              <label htmlFor="to">SOMEONE SPECIAL</label>
              <input
                id="to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                maxLength={60}
                placeholder="Who are you thinking of?"
              />
              <fieldset>
                <legend>CHOOSE YOUR KIND OF WISH</legend>
                <div className="style-options">
                  {["Traditional", "Romantic", "Family", "Friends"].map((s) => (
                    <label key={s} className={style === s ? "selected" : ""}>
                      <input
                        type="radio"
                        name="style"
                        value={s}
                        checked={style === s}
                        onChange={() => setStyle(s)}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </fieldset>
              <button className="button primary generate" type="submit">
                <Sparkles size={16} /> Create my greeting{" "}
                <ArrowRight size={16} />
              </button>
            </form>
            <div className="card-and-tools">
              <AnimatePresence mode="wait">
                <motion.div
                  key={cardVersion}
                  initial={reduced ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="personal-card"
                >
                  <div className="card-corner top-left" />
                  <div className="card-corner bottom-right" />
                  <span className="card-ornament">✧</span>
                  <span className="card-eyebrow">
                    A LITTLE LIGHT, JUST FOR YOU
                  </span>
                  <h3>Happy Diwali</h3>
                  <p className="generated-text">{card}</p>
                  <Diya />
                  <span className="card-brand">
                    दीपोत्सव <span>A CELEBRATION OF LIGHT</span>
                  </span>
                </motion.div>
              </AnimatePresence>
              <div className="card-tools">
                <button
                  className="text-button"
                  onClick={() => copy(card, "personal")}
                >
                  {copied === "personal" ? (
                    <Check size={15} />
                  ) : (
                    <Copy size={15} />
                  )}{" "}
                  {copied === "personal" ? "Copied" : "Copy greeting"}
                </button>
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await downloadGreeting(card);
                      notify("Your greeting card has been downloaded.");
                    } catch (e) {
                      notify(e.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Download size={15} />
                  {busy ? "Creating…" : "Download PNG"}
                </button>
                <a
                  className="text-button"
                  href={whatsappLink(card)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Send size={15} /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>
        <section className="rangoli-section">
          <div className="rangoli-stage reveal">
            <Rangoli colorful />
            {[0, 1, 2, 3].map((i) => (
              <Diya key={i} className={`rangoli-diya rd-${i}`} />
            ))}
          </div>
          <div className="rangoli-copy reveal">
            <span className="eyebrow">
              <span>04</span> COLOURS OF TRADITION
            </span>
            <h2>
              A thousand petals.
              <br />
              One beautiful <em>feeling.</em>
            </h2>
            <p>
              At our doorsteps, a welcome. In every colour, a story.
              <br />A rangoli is more than a pattern—it’s a little piece
              <br className="desktop-break" /> of love, made by hand, shared
              with the world.
            </p>
            <span className="hindi-quote">
              रंगों में बसी है, खुशियों की कहानी।
            </span>
            <span className="quote-translation">
              In every colour lives a story of joy.
            </span>
          </div>
        </section>
        <section id="wishes" className="section wishes-section">
          <div className="wishes-heading reveal">
            <SectionHead
              number="05"
              eyebrow="PASS THE LIGHT ON"
              title={
                <>
                  Good wishes travel <em>far.</em>
                </>
              }
            >
              Find the words you were looking for. Share a little warmth.
            </SectionHead>
            <span className="gallery-note">
              MADE TO BE SHARED <ArrowDown size={16} />
            </span>
          </div>
          <div className="wishes-grid">
            {wishes.map((w, i) => (
              <article className={`wish-card ${w.color} reveal`} key={w.tag}>
                <div className="wish-top">
                  <span>{w.tag}</span>
                  <span>0{i + 1}</span>
                </div>
                <span className="wish-decoration" aria-hidden="true">
                  {["✦", "❋", "✧", "✺", "✷"][i]}
                </span>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
                <div className="wish-actions">
                  <button
                    className="text-button"
                    aria-label={`Copy ${w.tag.toLowerCase()} wish`}
                    onClick={() => copy(w.text, String(i))}
                  >
                    {copied === String(i) ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}{" "}
                    {copied === String(i) ? "Copied" : "Copy wish"}
                  </button>
                  <a
                    className="icon-button"
                    href={whatsappLink(w.text)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Share ${w.tag.toLowerCase()} wish on WhatsApp`}
                  >
                    <ArrowUpRight size={18} />
                  </a>
                </div>
              </article>
            ))}
            <button
              className="gift-card reveal"
              onClick={() => {
                setGift(true);
                burst(undefined, undefined, 3, "confetti");
              }}
            >
              <span className="eyebrow">A LITTLE SOMETHING FOR YOU</span>
              <span className="gift-visual">
                <Gift size={65} strokeWidth={0.8} />
              </span>
              <h3>
                Some magic is
                <br />
                waiting to be found.
              </h3>
              <span className="text-button">
                Unwrap your surprise <ArrowUpRight size={16} />
              </span>
            </button>
          </div>
        </section>
        <footer>
          <div className="footer-glow" />
          <Diya />
          <span className="eyebrow">UNTIL THE NEXT LITTLE SPARK</span>
          <h2>
            Keep the light <em>within.</em>
          </h2>
          <p>
            May every diya bring new hope, every sparkle bring new joy,
            <br className="desktop-break" /> and every moment bring beautiful
            memories.
          </p>
          <button className="button secondary" onClick={reset}>
            <RotateCcw size={15} /> Celebrate Again
          </button>
          <div className="footer-bottom">
            <a href="#" className="brand">
              दीपोत्सव
            </a>
            <span>
              Made with <Heart size={12} fill="currentColor" /> and Light
            </span>
            <span>A CELEBRATION OF LIGHT & LOVE</span>
          </div>
        </footer>
      </main>
      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            role="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Sparkles size={18} />
            <span>{toast}</span>
            <button onClick={() => setToast("")} aria-label="Dismiss message">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {gift && <GiftDialog name={from} close={() => setGift(false)} />}
    </>
  );
}
function GiftDialog({ name, close }) {
  const ref = useRef(),
    previous = useRef(document.activeElement);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    const prev = previous.current;
    return () => prev?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      className="gift-dialog"
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <button
        className="modal-close icon-button"
        aria-label="Close blessing"
        onClick={close}
      >
        <X />
      </button>
      <div className="gift-confetti" aria-hidden="true">
        {Array.from({ length: 30 }, (_, i) => (
          <i
            key={i}
            style={{
              "--x": `${Math.cos(i * 2.4) * 230}px`,
              "--y": `${Math.sin(i * 2.4) * 230}px`,
              "--r": `${i * 39}deg`,
              "--delay": `${(i % 5) * 0.06}s`,
              background: ["#e7be70", "#d86b99", "#9d83c3"][i % 3],
            }}
          />
        ))}
      </div>
      <Stars size={38} />
      <span className="eyebrow">THE UNIVERSE HAS A WISH FOR YOU</span>
      <h2>
        {name.trim() ? `${name.trim()}, may` : "May"} your light
        <br />
        grow <em>brighter.</em>
      </h2>
      <p>
        May what you hope for find you. May what you love stay close. And may
        this Diwali mark the beginning of something wonderful.
      </p>
      <Diya />
      <button className="button primary" onClick={close}>
        Carry this light with you <Heart size={16} />
      </button>
    </dialog>
  );
}
export default App;
