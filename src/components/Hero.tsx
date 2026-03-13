import { useEffect, useRef } from 'react';
import './Hero.css';

interface LanguageTexts {
  tagline: string;
}

interface Texts {
  ar: LanguageTexts;
  en: LanguageTexts;
}

interface HeroProps {
  language?: 'ar' | 'en';
}

const Hero = ({ language = 'ar' }: HeroProps) => {
  const heroRef = useRef<HTMLElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const userScrolledRef = useRef(false);

  const texts: Texts = {
    ar: {
      tagline: 'أناقة خالدة في كل قطعة'
    },
    en: {
      tagline: 'Timeless Elegance in Every Piece'
    }
  };

  const t: LanguageTexts = texts[language] || texts.en;

  useEffect(() => {
    const updateScrollEffects = (currentScrollY: number) => {
      const isMobile = window.innerWidth < 768;
      const parallaxMultiplier = isMobile ? 0.15 : 0.3;
      const contentOffsetMultiplier = isMobile ? 0.1 : 0.2;

      if (backgroundRef.current) {
        const parallaxOffset = currentScrollY * parallaxMultiplier;
        backgroundRef.current.style.setProperty('--parallax-offset', `${parallaxOffset}px`);
      }

      if (contentRef.current && heroRef.current) {
        const heroHeight = heroRef.current.offsetHeight;
        const contentOpacity = Math.max(0, 1 - (currentScrollY / heroHeight) * 2.5);
        const contentOffset = currentScrollY * contentOffsetMultiplier;
        contentRef.current.style.setProperty('--content-opacity', contentOpacity.toString());
        contentRef.current.style.setProperty('--content-offset', `${contentOffset}px`);
      }
    };

    if (contentRef.current) {
      contentRef.current.style.setProperty('--content-opacity', '1');
      contentRef.current.style.setProperty('--content-offset', '0px');
    }
    if (backgroundRef.current) {
      backgroundRef.current.style.setProperty('--parallax-offset', '0px');
    }

    const initialScrollY = window.scrollY;
    updateScrollEffects(initialScrollY);

    if (initialScrollY > 50) {
      userScrolledRef.current = true;
    }

    const startAutoScroll = () => {
      autoScrollRef.current = window.setTimeout(() => {
        if (!userScrolledRef.current && heroRef.current && window.scrollY < 50) {
          const heroHeight = heroRef.current.offsetHeight;
          window.scrollTo({
            top: heroHeight - 50,
            behavior: 'smooth'
          });
        }
      }, 3000);
    };

    const handleScroll = () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        updateScrollEffects(currentScrollY);

        if (currentScrollY > 10) {
          userScrolledRef.current = true;
          if (autoScrollRef.current) {
            clearTimeout(autoScrollRef.current);
          }
        }
      });
    };

    if (initialScrollY < 50) {
      startAutoScroll();
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (autoScrollRef.current) {
        clearTimeout(autoScrollRef.current);
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <section ref={heroRef} className="hero">
      <div
        ref={backgroundRef}
        className="hero-background"
      ></div>
      <div className="hero-overlay"></div>
      <div ref={contentRef} className="hero-content">
        <div className="hero-content-inner">
          <h1 className="hero-title">Saudi Silver</h1>
          <p className="hero-tagline">{t.tagline}</p>
        </div>
      </div>
    </section>
  );
};

export default Hero;