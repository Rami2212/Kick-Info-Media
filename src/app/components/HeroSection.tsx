"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type MouseEvent } from "react";

type HeroPost = {
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl?: string;
  categoryName?: string;
  createdAt: string;
};

type HeroSectionProps = {
  posts: HeroPost[];
};

type Countdown = {
  days: string;
  hours: string;
  mins: string;
  secs: string;
};

const WORLD_CUP_START_ISO = "2026-06-11T00:00:00.000Z";
const EMPTY_COUNTDOWN: Countdown = { days: "00", hours: "00", mins: "00", secs: "00" };

function pad(value: number) {
  return String(Math.max(0, value)).padStart(2, "0");
}

function getCountdown(targetIso: string): Countdown {
  const now = Date.now();
  const target = new Date(targetIso).getTime();
  const diff = Math.max(0, target - now);

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return {
    days: pad(days),
    hours: pad(hours),
    mins: pad(mins),
    secs: pad(secs),
  };
}

export default function HeroSection({ posts }: HeroSectionProps) {
  if (!posts || posts.length === 0) {
    return (
      <section className="hero">
        <div className="empty-state">
          <h2 className="empty-state-title">No stories yet</h2>
          <p className="empty-state-desc">Check back later for top stories.</p>
        </div>
      </section>
    );
  }

  const slidePosts = posts.slice(0, 4);
  const [activeIndex, setActiveIndex] = useState(0);
  const [countdown, setCountdown] = useState<Countdown>(EMPTY_COUNTDOWN);

  useEffect(() => {
    if (slidePosts.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slidePosts.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slidePosts.length]);

  useEffect(() => {
    setCountdown(getCountdown(WORLD_CUP_START_ISO));
    const timer = setInterval(() => {
      setCountdown(getCountdown(WORLD_CUP_START_ISO));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const activePost = slidePosts[activeIndex] || slidePosts[0];
  const mainDate = useMemo(
    () =>
      new Date(activePost.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      }),
    [activePost.createdAt],
  );

  const hasMultipleSlides = slidePosts.length > 1;

  function goToPreviousSlide(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!hasMultipleSlides) return;
    setActiveIndex((current) => (current - 1 + slidePosts.length) % slidePosts.length);
  }

  function goToNextSlide(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!hasMultipleSlides) return;
    setActiveIndex((current) => (current + 1) % slidePosts.length);
  }

  return (
    <section className="hero">
      <div className="section-head">
        <span className="section-label">Today&apos;s Top Stories</span>
        <div className="section-line"></div>
        <Link href="/posts" className="section-all">All Stories →</Link>
      </div>

      <div className="hero-grid">
        <Link href={`/posts/${activePost.slug}`} className="hero-main">
          <div
            className="hero-bg"
            style={
              activePost.coverImageUrl
                ? {
                    backgroundImage: `linear-gradient(135deg, rgba(8, 20, 36, 0.68), rgba(5, 5, 5, 0.72)), url(${activePost.coverImageUrl})`,
                  }
                : undefined
            }
          ></div>
          <div className="hero-pitch"></div>
          <div className="hero-circle"></div>
          <div className="hero-num">01</div>
          <div className="hero-accent"></div>
          {hasMultipleSlides && (
            <>
              <button
                type="button"
                className="hero-side-arrow hero-side-arrow-left"
                aria-label="Previous hero slide"
                onClick={goToPreviousSlide}
              >
                {"<"}
              </button>
              <button
                type="button"
                className="hero-side-arrow hero-side-arrow-right"
                aria-label="Next hero slide"
                onClick={goToNextSlide}
              >
                {">"}
              </button>
            </>
          )}
          <div className="hero-content">
            <div className="hero-badges">
              {activePost.categoryName && <span className="badge badge-blue">{activePost.categoryName}</span>}
            </div>
            <h1 className="hero-title">{activePost.title}</h1>
            <p className="hero-excerpt">{activePost.excerpt}</p>
            <div className="hero-meta">
              <span className="hero-meta-author">Editorial Team</span>
              <span>·</span>
              <span>{mainDate}</span>
              <span>·</span>
              <span>6 min read</span>
            </div>
            {hasMultipleSlides && (
              <div className="hero-slider-controls">
                <div className="hero-slider-dots">
                  {slidePosts.map((post, index) => (
                    <button
                      key={post.slug}
                      type="button"
                      aria-label={`Show hero slide ${index + 1}`}
                      className={`hero-slider-dot ${index === activeIndex ? "active" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveIndex(index);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Link>

        <div className="hero-side">
          <Link href="/fifa-world-cup" className="side-card side-countdown-card">
            <div className="side-overlay"></div>
            <div className="side-num">02</div>
            <div className="side-accent"></div>
            <div className="side-content">
              <p className="side-title">FIFA World Cup 2026 Countdown</p>
              <div className="hero-countdown-grid">
                <div>
                  <span>{countdown.days}</span>
                  <small>Days</small>
                </div>
                <div>
                  <span>{countdown.hours}</span>
                  <small>Hours</small>
                </div>
                <div>
                  <span>{countdown.mins}</span>
                  <small>Mins</small>
                </div>
                <div>
                  <span>{countdown.secs}</span>
                  <small>Secs</small>
                </div>
              </div>
            </div>
          </Link>

          <div className="side-card side-card-blank" aria-hidden="true">
            <div className="side-num">03</div>
          </div>

          <div className="side-card side-card-blank" aria-hidden="true">
            <div className="side-num">04</div>
          </div>
        </div>
      </div>
    </section>
  );
}
