import { useEffect, useState } from 'react';
import useWishlist from '../context/useWishlist';
import { FaFacebookMessenger, FaWhatsapp, FaStar, FaStarHalfAlt, FaRegStar, FaHeart, FaLink, FaShoppingCart, FaMinus, FaPlus, FaShareAlt } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import './ProductModal.css';

const ProductModal = ({ product, isOpen, onClose, language = 'ar' }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const [copySuccess, setCopySuccess] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const texts = {
    ar: {
      closeModal: 'إغلاق',
      clickToZoom: 'اضغط للتكبير',
      reviews: 'تقييم',
      addToWishlist: 'أضف للمفضلة',
      removeFromWishlist: 'إزالة من المفضلة',
      addToCart: 'أضف للسلة',
      share: 'مشاركة',
      shareProduct: 'مشاركة المنتج',
      copied: 'تم النسخ!',
      newArrival: 'وصل حديثاً',
      bestSeller: 'الأكثر مبيعاً',
      limitedEdition: 'إصدار محدود',
      inStock: 'متوفر',
      limitedStock: 'مخزون محدود',
      outOfStock: 'غير متوفر',
      messenger: 'ماسنجر',
      whatsapp: 'واتساب',
      copyLink: 'نسخ الرابط',
      copySuccess: '✅ تم النسخ!',
      copyFailed: '❌ فشل النسخ. الرجاء النسخ يدوياً',
      instagramCopied: '✅ تم نسخ الرابط!\n\nالصقه في Instagram Stories أو Bio أو DM.'
    },
    en: {
      closeModal: 'Close modal',
      clickToZoom: 'Click to zoom',
      reviews: 'reviews',
      addToWishlist: 'Add to wishlist',
      removeFromWishlist: 'Remove from wishlist',
      addToCart: 'Add to Cart',
      share: 'Share',
      shareProduct: 'Share product',
      copied: 'Copied!',
      newArrival: 'New Arrival',
      bestSeller: 'Best Seller',
      limitedEdition: 'Limited Edition',
      inStock: 'In Stock',
      limitedStock: 'Limited Stock',
      outOfStock: 'Out of Stock',
      messenger: 'Messenger',
      whatsapp: 'WhatsApp',
      copyLink: 'Copy link',
      copySuccess: '✅ Copied!',
      copyFailed: '❌ Failed to copy. Please copy manually',
      instagramCopied: '✅ Link copied!\n\nPaste it in Instagram Stories, Bio, or DM.'
    }
  };

  const t = texts[language] || texts.ar;

  const isWishlisted = isInWishlist(product?.id);

  const getProductName = () => {
    if (!product) return '';
    return language === 'ar'
      ? (product.name_ar || product.name || 'منتج')
      : (product.name_en || product.name || 'Product');
  };

  const getProductDescription = () => {
    if (!product) return '';
    return language === 'ar'
      ? (product.description_ar || product.description || '')
      : (product.description_en || product.description || '');
  };

  const getImageUrl = () => {
    if (!product) return '';
    if (product.image_file) {
      return product.image_file;
    }
    if (product.image_url) {
      return product.image_url;
    }
    if (product.image) {
      return product.image;
    }
    return 'https://via.placeholder.com/800x800?text=No+Image';
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

  const handleClose = () => {
    setQuantity(1);
    setIsZoomed(false);
    setCopySuccess(false);
    setIsShareOpen(false);
    onClose();
  };

  const handleIncrement = () => setQuantity(prev => prev + 1);
  const handleDecrement = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    setQuantity(1);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') handleClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleShare = async (platform) => {
    const productUrl = `${window.location.origin}?product=${product.id}`;
    const productName = getProductName();
    const productDesc = getProductDescription();
    let shareUrl = '';

    switch (platform) {
      case 'messenger': {
        shareUrl = `fb-messenger://share?link=${encodeURIComponent(productUrl)}`;
        window.open(shareUrl, '_blank');
        break;
      }

      case 'twitter': {
        const twitterText = `🌟 ${productName}\n💰 $${product.price?.toLocaleString()}\n\n`;
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(productUrl)}`;
        window.open(shareUrl, '_blank', 'width=600,height=400');
        break;
      }

      case 'whatsapp': {
        const safeDesc = productDesc
          ? [...productDesc].slice(0, 80).join('') + '...\n\n'
          : '';

        const whatsappText =
          `✨ *SAUDI SILVER* ✨\n` +
          `──────────\n\n` +
          `💎 *${productName}*\n\n` +
          safeDesc +
          `💰 Price: *$${product.price?.toLocaleString()}*\n\n` +
          `🔥 *Limited Stock - Order Now!*\n\n` +
          `🌐 View Product :\n${productUrl}\n\n` +
          `✅ Premium Quality Guaranteed\n` +
          `✅ Worldwide Shipping Available\n` +
          `✅ Free Shipping Over $200\n\n` +
          `📱 *Reply to order or ask questions!*`;

        const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;
        window.open(shareUrl, '_blank');
        break;
      }

      case 'instagram': {
        if (navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(productUrl);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
            alert(t.instagramCopied);
          } catch {
            fallbackCopyToClipboard(productUrl);
          }
        } else {
          fallbackCopyToClipboard(productUrl);
        }
        break;
      }

      case 'copy': {
        if (navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(productUrl);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
          } catch {
            fallbackCopyToClipboard(productUrl);
          }
        } else {
          fallbackCopyToClipboard(productUrl);
        }
        break;
      }

      default:
        return;
    }
  };

  const fallbackCopyToClipboard = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand('copy');
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      alert(`${t.copyFailed}:\n\n${text}`);
    }

    document.body.removeChild(textArea);
  };


  if (!isOpen || !product) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const handleModalContentClick = (e) => {
    // Close share options when clicking outside the share area
    if (!e.target.closest('.modal-share')) {
      setIsShareOpen(false);
    }
    e.stopPropagation();
  };

  const handleImageMouseMove = (e) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    if (!isZoomed) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomPosition({ x, y });
      setIsZoomed(true);
    } else setIsZoomed(false);
  };


  return (
    <div className={`modal-backdrop ${isOpen ? 'modal-open' : ''}`} onClick={handleBackdropClick}>
      <div className="modal-content" onClick={handleModalContentClick}>

        <button className="modal-close-button" onClick={handleClose} aria-label={t.closeModal}>
          &times;
        </button>

        <div className="modal-body">
          {/* Image Section */}
          <div
            className={`modal-image-container ${isZoomed ? 'zoomed' : ''}`}
            onMouseMove={handleImageMouseMove}
            onClick={handleImageClick}
          >
            <img
              src={getImageUrl()}
              alt={getProductName()}
              className="modal-image"
              style={
                isZoomed
                  ? {
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    transform: 'scale(2)',
                    cursor: 'zoom-out'
                  }
                  : { cursor: 'zoom-in' }
              }
            />
            {!isZoomed && <div className="zoom-hint">{t.clickToZoom}</div>}
          </div>

          {/* Info Section */}
          <div className="modal-info">
            <div className="modal-header">
              <h2 className="modal-title">{getProductName()}</h2>
            </div>
            {(product.badge || product.stock) && (
              <div className="badge-stock-row">
                {product.badge && (
                  <div className={`modal-badge badge-${product.badge.toLowerCase().replace(' ', '-')}`}>
                    {translateBadge(product.badge)}
                  </div>
                )}

                {product.stock && (
                  <div className={`modal-stock ${product.stock === 'Limited Stock' ? 'stock-limited' : 'stock-in'}`}>
                    {translateStock(product.stock)}
                  </div>
                )}
              </div>
            )}


            <p className="modal-description">{getProductDescription()}</p>

            {/* النجوم والقلب */}
            <div className="modal-rating">
              <div className="stars">
                {[...Array(5)].map((_, index) => {
                  const rating = product.rating || 4.5;
                  const starValue = index + 1;
                  return (
                    <span key={index}>
                      {rating >= starValue ? (
                        <FaStar />
                      ) : rating >= starValue - 0.5 ? (
                        <FaStarHalfAlt />
                      ) : (
                        <FaRegStar />
                      )}
                    </span>
                  );
                })}
              </div>
              <span className="rating-count">({product.reviews || 120} {t.reviews})</span>
              <button
                className={`modal-wishlist-button ${isWishlisted ? 'active' : ''}`}
                onClick={() => toggleWishlist(product)}
                aria-label={isWishlisted ? t.removeFromWishlist : t.addToWishlist}
              >
                {isWishlisted ? <FaHeart /> : '🤍'}
              </button>
            </div>

            {/* السعر والـ Quantity في نفس الصف */}
            <div className="price-quantity-row">

              <div className="quantity-selector">
                <button onClick={handleDecrement} disabled={quantity <= 1} type="button">
                  <FaMinus size={10} />
                </button>
                <span>{quantity}</span>
                <button onClick={handleIncrement} type="button">
                  <FaPlus size={10} />
                </button>
              </div>
              <p className="modal-price">${product.price?.toLocaleString() || 'N/A'}</p>

            </div>

            {/* Add to Cart + Share */}
            <div className="modal-actions" >
              <div className="modal-actions-row">
                <button className="add-to-cart-btn" style={{ minWidth: "40%", maxWidth: "10vw" }} onClick={handleAddToCart}>
                  <FaShoppingCart size={18} />
                  <span>{t.addToCart}</span>
                </button>

                <div className="modal-share">
                  {/* Share button — always rendered to hold its space */}
                  <button
                    className="share-main-btn"
                    style={{
                      visibility: isShareOpen ? 'hidden' : 'visible',
                      pointerEvents: isShareOpen ? 'none' : 'auto'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsShareOpen(true);
                    }}
                    aria-label={t.shareProduct}
                  >
                    <FaShareAlt size={18} />
                  </button>

                  {/* Share options — uses .share-options CSS (position: absolute, bottom: 60px, left: 0) */}
                  {isShareOpen && (
                    <div
                      className="share-options"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button onClick={() => handleShare('messenger')} title={t.messenger}>
                        <FaFacebookMessenger size={18} />
                      </button>

                      <button onClick={() => handleShare('whatsapp')} title={t.whatsapp}>
                        <FaWhatsapp size={18} />
                      </button>

                      <button
                        onClick={() => handleShare('copy')}
                        title={t.copyLink}
                        style={{ position: 'relative' }}
                      >
                        <FaLink size={18} />
                        {copySuccess && (
                          <span
                            style={{
                              position: 'absolute',
                              top: '-30px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: '#000000',
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              whiteSpace: 'nowrap',
                              animation: 'fadeInOut 2s ease-in-out',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                            }}
                          >
                            {t.copied}
                          </span>
                        )}
                      </button>


                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;