import useWishlist from '../context/useWishlist';
import { useCart } from '../context/CartContext';
import { FaHeart } from 'react-icons/fa'; 
import './ProductCollectionCard.css';

/**
 * ProductCollectionCard Component
 * Enhanced product card with badges, stock, wishlist, and "Contact to Buy" button
 * @param {Object} product - Product object
 * @param {Function} onProductClick - Callback when card is clicked (opens modal)
 * @param {Function} onContactClick - Callback when "Contact to Buy" is clicked (opens WhatsApp)
 * @param {Function} onAddToCart - Optional callback after adding to cart
 * @param {String} language - Current language ('ar' or 'en')
 */
const ProductCollectionCard = ({ product, onProductClick, onContactClick, onAddToCart, language = 'ar' }) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const isWishlisted = isInWishlist(product.id);

  // النصوص حسب اللغة
  const texts = {
    ar: {
      contactToBuy: 'تواصل للشراء',
      addToCart: 'أضف للسلة',
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
      addToCart: 'Add to Cart',
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
    e.stopPropagation();
    if (onContactClick) {
      onContactClick(product);
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  const getBadgeClass = (badge) => {
    if (badge === 'New Arrival') return 'badge-new';
    if (badge === 'Best Seller') return 'badge-bestseller';
    if (badge === 'Limited Edition') return 'badge-limited';
    return 'badge-default';
  };

  const translateBadge = (badge) => {
    if (badge === 'New Arrival') return t.newArrival;
    if (badge === 'Best Seller') return t.bestSeller;
    if (badge === 'Limited Edition') return t.limitedEdition;
    return badge;
  };

  const translateStock = (stock) => {
    if (stock === 'In Stock') return t.inStock;
    if (stock === 'Limited Stock') return t.limitedStock;
    if (stock === 'Out of Stock') return t.outOfStock;
    return stock;
  };

  const getImageUrl = () => {
    if (product.image_file) return product.image_file;
    if (product.image_url) return product.image_url;
    if (product.image) return product.image;
    return 'https://via.placeholder.com/400x400?text=No+Image';
  };

  return (
    <article 
      className="product-collection-card"
      onClick={handleCardClick}
    >
      <div className="product-collection-image-container">
        {product.badge && (
          <div className={`product-badge ${getBadgeClass(product.badge)}`}>
            {translateBadge(product.badge)}
          </div>
        )}
        
        <button 
          className={`wishlist-button ${isWishlisted ? 'active' : ''}`}
          onClick={handleWishlistClick}
          aria-label={isWishlisted ? t.removeFromWishlist : t.addToWishlist}
        >
          {isWishlisted ? <FaHeart/> : '🤍'}
        </button>

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
        <h3 className="product-collection-name">
          {language === 'ar' ? (product.name_ar || product.name) : (product.name_en || product.name)}
        </h3>
        <p className="product-collection-short-description">
          {language === 'ar' 
            ? (product.shortDescription_ar || product.shortDescription || product.description_ar?.substring(0, 50) + '...' || product.description?.substring(0, 50) + '...')
            : (product.shortDescription_en || product.shortDescription || product.description_en?.substring(0, 50) + '...' || product.description?.substring(0, 50) + '...')
          }
        </p>
        {product.price && (
          <p className="product-collection-price">${product.price.toLocaleString()}</p>
        )}

        {/* Buttons Row */}
        <div className="card-buttons-row">
          <button 
            className="add-to-cart-button"
            onClick={handleAddToCart}
          >
            {t.addToCart}
          </button>
          <button 
            className="contact-to-buy-button"
            onClick={handleContactClick}
          >
            {t.contactToBuy}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCollectionCard;