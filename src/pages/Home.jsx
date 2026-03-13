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

  const SECTION_API_URL = 'https://omarawad9.pythonanywhere.com/api/sections/';


    const handleLogout = () => {
    localStorage.removeItem('isAdminAuthenticated');
    localStorage.removeItem('adminUsername');
    // لو عندك navigate للصفحة الرئيسية أو صفحة Login
    if (navigate) {
      navigate('login'); // أو navigate('/')
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
        console.log('📦 Fetched Products:', fetchedProducts);
        setProducts(fetchedProducts);

        // Fetch sections
        const sectionsResponse = await fetch(SECTION_API_URL);
        const sectionsData = await sectionsResponse.json();
        console.log('📂 Fetched Sections:', sectionsData);

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

  // ✅ Get Featured Section
  const getFeaturedSection = () => {
    return sections.find(s => s.is_featured === true);
  };

  // ✅ Get Featured Section Products for Main Carousel ONLY
  const getFeaturedProducts = () => {
    const featuredSection = getFeaturedSection();

    if (!featuredSection) {
      console.log('❌ No Featured Section found!');
      return [];
    }

    // Filter products that belong to Featured Section
    const featuredProducts = products.filter(p => p.section === featuredSection.id);
    console.log(`✅ Found ${featuredProducts.length} products in Featured Section (ID: ${featuredSection.id})`);

    return featuredProducts;
  };

  // ✅ Check if Featured Section exists and has products
  const hasFeaturedSection = () => {
    const featuredSection = getFeaturedSection();
    if (!featuredSection) return false;

    const featuredProducts = products.filter(p => p.section === featuredSection.id);
    return featuredProducts.length > 0;
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
  const phoneNumber = '201226878735';

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
      />
      <Hero language={language} onLanguageChange={onLanguageChange} />

      {loading ? (
        <div className="loading-container">
          <p>Loading products...</p>
        </div>
      ) : (
        <>
          {/* ✅ Main Featured Carousel - عرض المنتجات المميزة في carousel كبير */}
          {hasFeaturedSection() && (
            <ProductCarousel
              language={language}
              onLanguageChange={onLanguageChange}
              products={featuredProducts}
              onProductClick={handleProductClick}
              sectionTitle={getFeaturedSection()}
            />
          )}

          {/* ✅ عرض كل الـ Sections (بما فيها Featured) */}
          {/* ✅ عرض كل الـ Sections (بدون Featured عشان اتعرض فوق) */}
          {sections.length > 0 ? (
            <SectionProducts
              sections={sections.filter(s => s.is_featured !== true)} // ❌ استبعد Featured
              products={products}
              onProductClick={handleProductClick}
              onContactClick={handleContactClick}
              searchQuery={searchQuery}
              language={language}
            />
          ) : (
            // ✅ لو مفيش sections، اعرض الـ Grid العادي
            <ProductGrid
              language={language}
              onLanguageChange={onLanguageChange}
              products={products}
              onProductClick={handleProductClick}
              onContactClick={handleContactClick}
              searchQuery={searchQuery}
            />
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