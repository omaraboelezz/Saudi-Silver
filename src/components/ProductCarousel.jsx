import { useEffect, useRef, useState } from 'react';
import ProductCard from './ProductCard';
import './ProductCarousel.css';

/**
 * ProductCarousel Component
 * Horizontal scrollable carousel with auto-slide and manual navigation
 * @param {Array} products - Array of product objects
 * @param {Function} onProductClick - Callback function when a product is clicked
 * @param {String} language - Current language ('ar' or 'en')
 * @param {Object} sectionTitle - Section object with title_ar and title_en
 */
const ProductCarousel = ({ products, onProductClick, language = 'ar', sectionTitle }) => {
  const carouselRef = useRef(null);
  const autoSlideRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // النصوص حسب اللغة
  const texts = {
    ar: {
      featuredCollection: 'المجموعة المميزة',
      scrollLeft: 'التمرير لليسار',
      scrollRight: 'التمرير لليمين'
    },
    en: {
      featuredCollection: 'Featured Collection',
      scrollLeft: 'Scroll left',
      scrollRight: 'Scroll right'
    }
  };

  const t = texts[language] || texts.ar;

  // ✅ Get dynamic title from section or use default
  const getTitle = () => {
    if (sectionTitle) {
      return language === 'ar' ? sectionTitle.title_ar : sectionTitle.title_en;
    }
    return t.featuredCollection;
  };

  // Auto-slide functionality
  useEffect(() => {
    const startAutoSlide = () => {
      autoSlideRef.current = setInterval(() => {
        if (carouselRef.current && !isHovered && !isDragging && !isUserScrolling) {
          const carousel = carouselRef.current;
          const cardWidth = carousel.querySelector('.carousel-card-wrapper')?.offsetWidth || 300;
          const gap = 32; // Match CSS gap
          const scrollAmount = cardWidth + gap;
          
          // Check if we've reached the end
          if (carousel.scrollLeft + carousel.offsetWidth >= carousel.scrollWidth - 10) {
            // Reset to beginning
            carousel.scrollTo({
              left: 0,
              behavior: 'smooth'
            });
          } else {
            // Scroll to next card
            carousel.scrollBy({
              left: scrollAmount,
              behavior: 'smooth'
            });
          }
        }
      }, 3000); // Auto-slide every 3 seconds
    };

    startAutoSlide();

    return () => {
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current);
      }
    };
  }, [isHovered, isDragging, isUserScrolling]);

  // Manual scroll handlers
  const scrollLeftHandler = () => {
    if (carouselRef.current) {
      setIsUserScrolling(true);
      const cardWidth = carouselRef.current.querySelector('.carousel-card-wrapper')?.offsetWidth || 300;
      const gap = 32;
      const scrollAmount = cardWidth + gap;
      
      carouselRef.current.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
      
      // Reset user scrolling flag after scroll completes
      setTimeout(() => setIsUserScrolling(false), 1000);
    }
  };

  const scrollRightHandler = () => {
    if (carouselRef.current) {
      setIsUserScrolling(true);
      const cardWidth = carouselRef.current.querySelector('.carousel-card-wrapper')?.offsetWidth || 300;
      const gap = 32;
      const scrollAmount = cardWidth + gap;
      
      carouselRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
      
      // Reset user scrolling flag after scroll completes
      setTimeout(() => setIsUserScrolling(false), 1000);
    }
  };

  // Drag handlers for mobile/touch
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
    carouselRef.current.style.cursor = 'grabbing';
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setIsHovered(false);
    if (carouselRef.current) {
      carouselRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (carouselRef.current) {
      carouselRef.current.style.cursor = 'grab';
    }
    // Reset user scrolling flag after a delay
    setTimeout(() => setIsUserScrolling(false), 1000);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    setIsUserScrolling(true);
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !carouselRef.current) return;
    setIsUserScrolling(true);
    const x = e.touches[0].pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // Reset user scrolling flag after a delay
    setTimeout(() => setIsUserScrolling(false), 1000);
  };

  return (
    <section id="featured-collection" className="product-carousel-section">
      <div className="carousel-container">
        {/* ✅ عنوان ديناميكي من الـ Section */}
        <h2 className="carousel-title">{getTitle()}</h2>
        <div className="carousel-wrapper">
          {/* 👇 أزرار مترجمة */}
          <button 
            className="carousel-button carousel-button-left"
            onClick={scrollLeftHandler}
            aria-label={t.scrollLeft}
          >
            ‹
          </button>
          <div
            ref={carouselRef}
            className="product-carousel"
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => setIsHovered(true)}
          >
            {products.map((product) => (
              <div key={product.id} className="carousel-card-wrapper">
                <ProductCard
                  product={product}
                  onCardClick={onProductClick}
                  language={language}
                />
              </div>
            ))}
          </div>
          <button 
            className="carousel-button carousel-button-right"
            onClick={scrollRightHandler}
            aria-label={t.scrollRight}
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductCarousel;