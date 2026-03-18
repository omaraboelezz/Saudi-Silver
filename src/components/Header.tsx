import { useEffect, useState } from 'react';
import useWishlist from '../context/useWishlist';
import { useCart } from '../context/CartContext';
import { FaShoppingCart, FaHeart, FaMapMarkerAlt, FaGlobeAmericas } from 'react-icons/fa';
import './Header.css';

interface Section {
  id: number;
  title_ar: string;
  title_en: string;
  order: number;
  is_featured: boolean;
}

interface Product {
  id: number;
  section: number;
  [key: string]: any;
}

interface LanguageTexts {
  home: string;
  features: string;
  admin: string;
  logout: string;
}

interface Texts {
  ar: LanguageTexts;
  en: LanguageTexts;
}

interface HeaderProps {
  onWishlistClick?: () => void;
  onCartClick?: () => void;
  language?: 'ar' | 'en';
  onLanguageChange?: (lang: 'ar' | 'en') => void;
  adminMode?: boolean;
  onLogout?: () => void;
  isAdmin?: boolean;
}

const Header = ({
  onWishlistClick,
  onCartClick,
  language = 'ar',
  onLanguageChange,
  adminMode = false,
  onLogout,
  isAdmin = false
}: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [hasFeaturedWithProducts, setHasFeaturedWithProducts] = useState(false);

  const { wishlistCount } = useWishlist();
  const { cartCount } = useCart();

  const SECTION_API_URL = 'https://omarawad9.pythonanywhere.com/api/sections/';
  const PRODUCTS_API_URL = 'https://omarawad9.pythonanywhere.com/api/products/';

  useEffect(() => {
    const fetchSectionsAndProducts = async () => {
      try {
        const sectionsResponse = await fetch(SECTION_API_URL);
        const sectionsData: Section[] = await sectionsResponse.json();

        const productsResponse = await fetch(PRODUCTS_API_URL);
        const productsData: Product[] = await productsResponse.json();

        if (Array.isArray(sectionsData)) {
          const sortedSections = sectionsData.sort((a, b) => a.order - b.order);
          setSections(sortedSections);

          const featuredSection = sortedSections.find(s => s.is_featured === true);

          if (featuredSection && Array.isArray(productsData)) {
            const featuredProducts = productsData.filter(
              product => product.section === featuredSection.id
            );

            setHasFeaturedWithProducts(featuredProducts.length > 0);
          } else {
            setHasFeaturedWithProducts(false);
          }
        }
      } catch (error) {
        console.error('Error fetching sections and products:', error);
        setHasFeaturedWithProducts(false);
      }
    };

    if (!adminMode) {
      fetchSectionsAndProducts();
    }
  }, [adminMode]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('.language-selector')) {
        setIsLanguageMenuOpen(false);
      }
    };

    if (isLanguageMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isLanguageMenuOpen]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  const scrollToFeatures = () => {
    const featuredCollectionElement = document.getElementById('featured-collection');
    if (featuredCollectionElement) {
      const headerHeight = 80;
      const featuredPosition = featuredCollectionElement.offsetTop - headerHeight;
      window.scrollTo({ top: featuredPosition, behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const scrollToSection = (sectionId: number) => {
    const sectionElement = document.getElementById(`section-${sectionId}`);
    if (sectionElement) {
      const headerHeight = 80;
      const sectionPosition = sectionElement.offsetTop - headerHeight;
      window.scrollTo({ top: sectionPosition, behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const handleNavClick = (scrollFunc: () => void) => {
    scrollFunc();
    setIsMobileMenuOpen(false);
  };

  const handleLanguageChange = (lang: 'ar' | 'en') => {
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
    setIsLanguageMenuOpen(false);
  };

  const texts: Texts = {
    ar: {
      home: 'الرئيسية',
      features: 'المميزات',
      admin: 'لوحة التحكم',
      logout: 'تسجيل الخروج'
    },
    en: {
      home: 'Home',
      features: 'Features',
      admin: 'Admin',
      logout: 'Logout'
    }
  };

  const currentTexts: LanguageTexts = texts[language] || texts.ar;

  return (
    <header className={`header ${isScrolled ? 'header-scrolled' : ''} ${adminMode ? 'admin-mode' : ''}`}>
      <div className="header-container">

        {!adminMode && (
          <div className="header-logo" onClick={scrollToTop}>
            <h1>El-Saudi jewelry</h1>
          </div>
        )}

        {!adminMode && (
          <nav className={`header-nav ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
            <button className="nav-link" onClick={() => handleNavClick(scrollToTop)}>
              {currentTexts.home}
            </button>

            {hasFeaturedWithProducts && (
              <button className="nav-link" onClick={() => handleNavClick(scrollToFeatures)}>
                {currentTexts.features}
              </button>
            )}

            {sections
              .filter(section => !section.is_featured)
              .map(section => (
                <button
                  key={section.id}
                  className="nav-link"
                  onClick={() => scrollToSection(section.id)}
                >
                  {language === 'ar' ? section.title_ar : section.title_en}
                </button>
              ))}
          </nav>
        )}

        <div className={`header-icons ${adminMode ? 'admin-icons-only' : ''}`}>

          <div className="language-selector">
            <button
              className="language-toggle"
              onClick={(e) => {
                e.stopPropagation();
                setIsLanguageMenuOpen(!isLanguageMenuOpen);
              }}
              aria-label="Change language"
            >
              <FaGlobeAmericas size={24} style={{ color: '#fff' }} />
            </button>

            {isLanguageMenuOpen && (
              <div className="language-menu">
                <button
                  className={`language-option ${language === 'ar' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('ar')}
                >
                  العربية
                </button>
                <button
                  className={`language-option ${language === 'en' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('en')}
                >
                  English
                </button>
              </div>
            )}
          </div>

          {adminMode && onLogout && (
            <button
              className="logout-btn"
              onClick={onLogout}
              aria-label="Logout"
            >
              {currentTexts.logout}
            </button>
          )}

          {!adminMode && (
            <div
              className="wishlist-badge"
              onClick={() => window.open(
                'https://maps.app.goo.gl/qRKKuKsW12zPRh327',
                '_blank'
              )}
              style={{ marginRight: '2px', cursor: 'pointer' }}
            >
              <FaMapMarkerAlt size={25} className="wishlist-icon" style={{ color: '#fff' }} />
            </div>
          )}

          {!adminMode && (
            <div
              className="wishlist-badge-heart"
              onClick={() => {
                if (onWishlistClick) onWishlistClick();
              }}
            >
              <span className="wishlist-icon">
                <FaHeart color='white' size={22} style={{ marginTop: "12px" }} />
              </span>
              {wishlistCount > 0 && (
                <span className="wishlist-count">{wishlistCount}</span>
              )}
            </div>
          )}

          {!adminMode && (
            <div
              className="wishlist-badge"
              onClick={() => {
                if (onCartClick) onCartClick();
              }}
              style={{ marginRight: '2px' }}
            >
              <FaShoppingCart size={25} className="wishlist-icon" style={{ color: '#fff' }} />
              {cartCount > 0 && (
                <span className="wishlist-count">{cartCount}</span>
              )}
            </div>
          )}

          {!adminMode && (
            <button
              className="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;