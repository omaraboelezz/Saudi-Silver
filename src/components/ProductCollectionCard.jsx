import useWishlist from '../context/useWishlist';
import { FaHeart } from 'react-icons/fa'; 
import './ProductCollectionCard.css';

/**
 * ProductCollectionCard Component
 * Enhanced product card with badges, stock, wishlist, and "Contact to Buy" button
 * @param {Object} product - Product object
 * @param {Function} onProductClick - Callback when card is clicked (opens modal)
 * @param {Function} onContactClick - Callback when "Contact to Buy" is clicked (opens WhatsApp)
 * @param {String} language - Current language ('ar' or 'en')
 */
const ProductCollectionCard = ({ product, onProductClick, onContactClick, language = 'ar' }) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);

  // النصوص حسب اللغة
  const texts = {
    ar: {
      contactToBuy: 'تواصل للشراء',
      addToWishlist: 'أضف للمفضلة',
      removeFromWishlist: 'إزالة من المفضلة',
      newArrival: 'وصل حديثاً',
      bestSeller: 'الأكثر مبيعاً',
      limitedEdition: 'إصدار محدود',
      inStock: 'متوفر',
      limitedStock: 'مخزون محدود',
      outOfStock: 'غير متوفر'
    },
    en: {
      contactToBuy: 'Contact to Buy',
      addToWishlist: 'Add to wishlist',
      removeFromWishlist: 'Remove from wishlist',
      newArrival: 'New Arrival',
      bestSeller: 'Best Seller',
      limitedEdition: 'Limited Edition',
      inStock: 'In Stock',
      limitedStock: 'Limited Stock',
      outOfStock: 'Out of Stock'
    }
  };

  const t = texts[language] || texts.ar;

  const handleCardClick = () => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  const handleContactClick = (e) => {
    e.stopPropagation(); // Prevent card click when button is clicked
    if (onContactClick) {
      onContactClick(product);
    }
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation(); // Prevent card click when heart is clicked
    toggleWishlist(product);
  };

  const getBadgeClass = (badge) => {
    if (badge === 'New Arrival') return 'badge-new';
    if (badge === 'Best Seller') return 'badge-bestseller';
    if (badge === 'Limited Edition') return 'badge-limited';
    return 'badge-default';
  };

  // ترجمة الـ Badge
  const translateBadge = (badge) => {
    if (badge === 'New Arrival') return t.newArrival;
    if (badge === 'Best Seller') return t.bestSeller;
    if (badge === 'Limited Edition') return t.limitedEdition;
    return badge;
  };

  // ترجمة حالة المخزون
  const translateStock = (stock) => {
    if (stock === 'In Stock') return t.inStock;
    if (stock === 'Limited Stock') return t.limitedStock;
    if (stock === 'Out of Stock') return t.outOfStock;
    return stock;
  };

  // Helper function to get the correct image URL
  const getImageUrl = () => {
    // Priority: image_file (uploaded) > image_url (link) > fallback
    if (product.image_file) {
      return product.image_file;
    }
    if (product.image_url) {
      return product.image_url;
    }
    if (product.image) {
      return product.image;
    }
    return 'https://via.placeholder.com/400x400?text=No+Image';
  };

  return (
    <article 
      className="product-collection-card"
      onClick={handleCardClick}
    >
      <div className="product-collection-image-container">
        {/* Product Badge - مترجم */}
        {product.badge && (
          <div className={`product-badge ${getBadgeClass(product.badge)}`}>
            {translateBadge(product.badge)}
          </div>
        )}
        
        {/* Wishlist Heart */}
        <button 
          className={`wishlist-button ${isWishlisted ? 'active' : ''}`}
          onClick={handleWishlistClick}
          aria-label={isWishlisted ? t.removeFromWishlist : t.addToWishlist}
        >
          {isWishlisted ? <FaHeart/> : '🤍'}
        </button>

        {/* Stock Indicator - مترجم */}
        {product.stock && (
          <div className={`stock-indicator ${product.stock === 'Limited Stock' ? 'stock-limited' : 'stock-in'}`}>
            {translateStock(product.stock)}
          </div>
        )}

        <img 
          src={getImageUrl()}
          alt={language === 'ar' ? (product.name_ar || product.name) : (product.name_en || product.name)}
          className="product-collection-image"
          loading="lazy"
        />
      </div>
      <div className="product-collection-content">
        {/* 👇 عرض الاسم حسب اللغة */}
        <h3 className="product-collection-name">
          {language === 'ar' ? (product.name_ar || product.name) : (product.name_en || product.name)}
        </h3>
        {/* 👇 عرض الوصف المختصر حسب اللغة */}
        <p className="product-collection-short-description">
          {language === 'ar' 
            ? (product.shortDescription_ar || product.shortDescription || product.description_ar?.substring(0, 50) + '...' || product.description?.substring(0, 50) + '...')
            : (product.shortDescription_en || product.shortDescription || product.description_en?.substring(0, 50) + '...' || product.description?.substring(0, 50) + '...')
          }
        </p>
        {product.price && (
          <p className="product-collection-price">${product.price.toLocaleString()}</p>
        )}
        {/* Contact to Buy Button - مترجم */}
        <button 
          className="contact-to-buy-button"
          onClick={handleContactClick}
        >
          {t.contactToBuy}
        </button>
      </div>
    </article>
  );
};

export default ProductCollectionCard;