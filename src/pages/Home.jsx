import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Features from '../components/Features';
import ProductCarousel from '../components/ProductCarousel';
import ProductGrid from '../components/ProductGrid';
import SectionProducts from '../components/Sectionproducts';
import Footer from '../components/Footer';
import ProductModal from '../components/ProductModal';
import WishlistModal from '../components/WishlistModal';
import { fetchProducts } from '../utils/api';
import CartModal from '../components/CartModal';
import ScrollReveal from '../components/ScrollReveal';
import './Home.css';



const Home = ({ language, onLanguageChange, navigate }) => {
  const [products, setProducts] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);



  const SECTION_API_URL = 'https://omarawad9.pythonanywhere.com/api/sections/';


  const handleLogout = () => {
    localStorage.removeItem('isAdminAuthenticated');
    localStorage.removeItem('adminUsername');
    if (navigate) {
      navigate('login');
    }
  };

  const isAdmin = () => {
    return localStorage.getItem('isAdminAuthenticated') === 'true';
  };



  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch products
        const fetchedProducts = await fetchProducts();
        setProducts(fetchedProducts);

        // Fetch sections
        const sectionsResponse = await fetch(SECTION_API_URL);
        const sectionsData = await sectionsResponse.json();

        if (Array.isArray(sectionsData)) {
          setSections(sectionsData);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ✅ فتح المنتج من الـ URL تلقائياً لما الـ products تتحمل
  useEffect(() => {
    if (products.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const productId = params.get('product');

    if (productId) {
      const found = products.find(p => String(p.id) === String(productId));
      if (found) {
        setSelectedProduct(found);
        setIsModalOpen(true);
      }
    }
  }, [products]);

  const getFeaturedSection = () => {
    return sections.find(s => s.is_featured === true);
  };

  const getFeaturedProducts = () => {
    return products;
  };

  const hasFeaturedSection = () => {
    return products.length > 0;
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, []);

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const getProductName = (product) => {
    if (!product) return '';
    return language === 'ar'
      ? (product.name_ar || product.name || 'منتج')
      : (product.name_en || product.name || 'Product');
  };

  const handleContactClick = (product) => {
    const phoneNumber = '201067365567';

    const helloText =
      language === 'ar'
        ? 'مرحباً! أنا مهتم بشراء هذا المنتج'
        : "Hello! I'm interested in purchasing";

    const productText =
      language === 'ar'
        ? 'المنتج'
        : 'Product';

    const priceText =
      language === 'ar'
        ? 'السعر'
        : 'Price';

    const moreInfoText =
      language === 'ar'
        ? 'هل يمكنك من فضلك تزويدي بمزيد من المعلومات؟'
        : 'Could you please provide more information?';

    const message = encodeURIComponent(
      `${helloText}\n\n` +
      `${productText}: ${getProductName(product)}\n` +
      `${priceText}: $${product.price?.toLocaleString() || 'غير متوفر'}\n\n` +
      `${moreInfoText}`
    );

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };


  const handleCloseModal = () => {
    setIsModalOpen(false);

    // ✅ امسح الـ ?product من الـ URL لما تقفل الـ modal
    const url = new URL(window.location.href);
    url.searchParams.delete('product');
    window.history.replaceState({}, '', url.toString());

    setTimeout(() => {
      setSelectedProduct(null);
    }, 300);
  };

  const handleWishlistClick = () => {
    setIsWishlistOpen(true);
  };

  const handleCloseWishlist = () => {
    setIsWishlistOpen(false);
  };

  const featuredProducts = getFeaturedProducts();

  return (
    <div className="home">
      <Header
        language={language}
        onLanguageChange={onLanguageChange}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        onWishlistClick={handleWishlistClick}
        onCartClick={() => setIsCartOpen(true)}
        navigate={navigate}
        onLogout={handleLogout}
        isAdmin={isAdmin()}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
      <ScrollReveal>
        <Hero language={language} onLanguageChange={onLanguageChange} />
      </ScrollReveal>

      {loading ? (
        <div className="luxury-preloader">
          <div className="loader-ring"></div>
          <div className="loader-logo">El-Saudi Jewelry</div>
        </div>
      ) : (
        <>
          {/* ✅ Main Featured Carousel - عرض المنتجات المميزة في carousel كبير */}
          {hasFeaturedSection() && (
            <ScrollReveal delay={100}>
              <ProductCarousel
                language={language}
                onLanguageChange={onLanguageChange}
                products={featuredProducts.filter(p =>
                  activeFilter === null ? p.type === 'gold' : p.type === activeFilter
                )}

                onProductClick={handleProductClick}
                sectionTitle={getFeaturedSection()}
              />
            </ScrollReveal>
          )}

          {/* ✅ عرض كل الـ Sections (بدون Featured عشان اتعرض فوق) */}
          {sections.length > 0 ? (
            <ScrollReveal delay={200}>
              <SectionProducts
                sections={sections.filter(s => s.is_featured !== true)}
                products={products}
                onProductClick={handleProductClick}
                onContactClick={handleContactClick}
                activeFilter={activeFilter ?? 'gold'}
                searchQuery={searchQuery}
                language={language}
              />
            </ScrollReveal>
          ) : (
            // ✅ لو مفيش sections، اعرض الـ Grid العادي
            <ScrollReveal delay={200}>
              <ProductGrid
                language={language}
                onLanguageChange={onLanguageChange}
                products={products}
                onProductClick={handleProductClick}
                onContactClick={handleContactClick}
                searchQuery={searchQuery}
              />
            </ScrollReveal>
          )}
        </>
      )}

      {/* <Features /> */}
      <Footer language={language} onLanguageChange={onLanguageChange} />

      <ProductModal
        language={language}
        onLanguageChange={onLanguageChange}
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      <WishlistModal
        language={language}
        onLanguageChange={onLanguageChange}
        isOpen={isWishlistOpen}
        onClose={handleCloseWishlist}
        onProductClick={handleProductClick}
        onContactClick={handleContactClick}
      />

      <CartModal
        language={language}
        onLanguageChange={onLanguageChange}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProductClick={handleProductClick}
      />
    </div>
  );
};

export default Home;