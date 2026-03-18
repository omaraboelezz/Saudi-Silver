import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { FaWhatsapp, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import './CartModal.css';
import { pdf } from '@react-pdf/renderer';
import InvoiceDocument from './InvoiceDocument';

export interface Product {
  id: number | string;
  name: string;
  price: number;
  image?: string;
  image_file?: string;
  image_url?: string;
  quantity?: number;
  description?: string;
  isDeleted?: boolean;
}

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductClick?: (product: Product) => void;
  language?: string;
}

const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose, onProductClick, language = 'ar' }) => {
  const { cartItems, removeFromCart, cleanupDeletedProducts } = useCart();
  const [validatedItems, setValidatedItems] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);


  useEffect(() => {
    if (isOpen) {
      if (cartItems.length > 0) {
        validateCartItems();
      } else {
        setValidatedItems([]);
      }
    }
  }, [isOpen, cartItems]);

  const validateCartItems = async () => {
    try {
      const response = await fetch('https://omarawad9.pythonanywhere.com/api/products/');
      const existingProducts = await response.json();
      const existingIds = new Set(existingProducts.map((p: any) => p.id));

      const validated = cartItems.map(item => ({
        ...item,
        isDeleted: !existingIds.has(item.id)
      }));

      setValidatedItems(validated);
    } catch (error) {
      console.error('Error validating cart items:', error);
      setValidatedItems(cartItems);
    }
  };

  const texts: Record<string, {
    shoppingCart: string;
    item: string;
    items: string;
    cartEmpty: string;
    nothingAdded: string;
    total: string;
    connectToBuy: string;
    removeFromCart: string;
    closeCart: string;
    whatsappMessage: string;
    productDeleted: string;
    cleanDeletedItems: string;
  }> = {
    ar: {
      shoppingCart: 'سلة التسوق',
      item: 'عنصر',
      items: 'عناصر',
      cartEmpty: 'سلة التسوق فارغة',
      nothingAdded: 'يبدو أنك لم تضف أي شيء بعد.',
      total: 'الإجمالي:',
      connectToBuy: 'اطلب عبر واتساب',
      removeFromCart: 'إزالة من السلة',
      closeCart: 'إغلاق السلة',
      whatsappMessage: 'مرحباً، أود طلب العناصر التالية من El-Saudi jewelry:',
      productDeleted: 'هذا المنتج تم حذفه',
      cleanDeletedItems: 'إزالة المنتجات المحذوفة'
    },
    en: {
      shoppingCart: 'Shopping Cart',
      item: 'item',
      items: 'items',
      cartEmpty: 'Your cart is empty',
      nothingAdded: 'Looks like you haven\'t added anything yet.',
      total: 'Total:',
      connectToBuy: 'Connect to Buy',
      removeFromCart: 'Remove from cart',
      closeCart: 'Close cart',
      whatsappMessage: 'Hello, I would like to order the following items from El-Saudi jewelry:',
      productDeleted: 'This product has been deleted',
      cleanDeletedItems: 'Remove Deleted Items'
    }
  };

  const t = texts[language as string] || texts.ar;

  const getImageUrl = (product: Product): string => {
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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const calculateTotal = (): number => {
    return validatedItems
      .filter(item => !item.isDeleted)
      .reduce((acc: number, item: any) => {
        return acc + (item.price * (item.quantity || 1));
      }, 0);
  };

 const handleConnectToBuy = async () => {
  if (isGenerating) return;
  const validItems = validatedItems.filter(item => !item.isDeleted);
  if (validItems.length === 0) return;

  setIsGenerating(true);
  try {
    const blob = await pdf(
      <InvoiceDocument items={validItems} language={language} />
    ).toBlob();

    const file = new File([blob], 'Saudi-Silver-Invoice.pdf', { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Saudi Silver Invoice',
        text: language === 'ar'
          ? 'مرحباً، هذه فاتورة طلبي من Saudi Silver 🧾'
          : 'Hello, here is my order invoice from Saudi Silver 🧾',
      });
    } else {
      // fallback للديسكتوب بس
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Saudi-Silver-Invoice.pdf';
      link.click();
      URL.revokeObjectURL(url);

      const phoneNumber = '201067365567';
      const message = language === 'ar'
        ? 'مرحباً، أرسلت لك فاتورة طلبي 🧾'
        : 'Hello, I sent you my order invoice 🧾';
      window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    }
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      console.error('Invoice error:', err);
    }
  } finally {
    setIsGenerating(false);
  }
};

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleProductClick = (product: Product) => {
    if (product.isDeleted) return;

    if (onProductClick) {
      onProductClick(product);
      onClose();
    }
  };

  const getProductName = (product: any): string => {
    if (!product) return '';
    return language === 'ar'
      ? (product.arabic_name || product.name_ar || product.name || 'منتج')
      : (product.english_name || product.name_en || product.name || 'Product');
  };

  const getTotalQuantity = (): number => {
    return validatedItems
      .filter(item => !item.isDeleted)
      .reduce((total: number, item: any) => {
        return total + (item.quantity || 1);
      }, 0);
  };



  const hasDeletedItems = validatedItems.some(item => item.isDeleted);

  return (
    <div
      className={`cart-modal-backdrop ${isOpen ? 'modal-open' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className="cart-modal-content">
        <button
          className="cart-modal-close-button"
          onClick={onClose}
          aria-label={t.closeCart}
          style={{ fontSize: '35px' }}
        >
          &times;
        </button>

        <div className="cart-modal-header">
          <h2 className="cart-modal-title">{t.shoppingCart}</h2>
          <p className="cart-modal-count">
            {getTotalQuantity()} {getTotalQuantity() === 1 ? t.item : t.items}
          </p>
        </div>

        {hasDeletedItems && (
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            padding: '12px',
            margin: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FaExclamationTriangle color="#856404" size={20} />
            <span style={{ flex: 1, color: '#856404', fontSize: '14px' }}>
              {language === 'ar'
                ? 'بعض المنتجات تم حذفها ولن يتم تضمينها في الطلب'
                : 'Some products have been deleted and won\'t be included in the order'}
            </span>
            <button
              onClick={() => {
                if (cleanupDeletedProducts) {
                  cleanupDeletedProducts();
                }
              }}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {t.cleanDeletedItems}
            </button>
          </div>
        )}

        <div className="cart-modal-body">
          {validatedItems.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">🛒</div>
              <h3>{t.cartEmpty}</h3>
              <p>{t.nothingAdded}</p>
            </div>
          ) : (
            <div className="cart-items">
              {validatedItems.map((product: any) => (
                <div
                  key={product.id}
                  className={`cart-item ${product.isDeleted ? 'cart-item-deleted' : ''}`}
                  onClick={() => handleProductClick(product)}
                  style={{
                    cursor: product.isDeleted ? 'not-allowed' : 'pointer',
                    opacity: product.isDeleted ? 0.6 : 1,
                    position: 'relative'
                  }}
                >
                  {product.isDeleted && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: '#dc3545',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      zIndex: 2
                    }}>
                      {t.productDeleted}
                    </div>
                  )}

                  <div className="cart-item-image-container">
                    <img
                      src={getImageUrl(product)}
                      alt={getProductName(product)}
                      className="cart-item-image"
                      style={{ filter: product.isDeleted ? 'grayscale(100%)' : 'none' }}
                    />
                    <button
                      className="cart-item-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(product.id);
                      }}
                      aria-label={t.removeFromCart}
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>

                  <div className="cart-item-info">
                    <h3 className="cart-item-name">
                      {getProductName(product)}
                    </h3>

                    <div className="cart-item-details">
                      <p className="cart-item-price">${product.price?.toLocaleString() || 'N/A'}</p>
                      {product.quantity && product.quantity > 1 && (
                        <span className="cart-item-quantity">x{product.quantity}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {validatedItems.filter(item => !item.isDeleted).length > 0 && (
          <div className="cart-modal-footer">
            <div className="cart-total">
              <span>{t.total}</span>
              <span className="cart-total-price">
                ${calculateTotal().toLocaleString()}
              </span>
            </div>

            <button
              className="cart-connect-btn"
              onClick={handleConnectToBuy}
              disabled={isGenerating}
            >
              <span>{isGenerating ? '⏳ جاري التحضير...' : t.connectToBuy}</span>
              <FaWhatsapp size={22} />
            </button>

            <button onClick={async () => {
              const validItems = validatedItems.filter(item => !item.isDeleted);
              const blob = await pdf(
                <InvoiceDocument items={validItems} language={language} />
              ).toBlob();
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
            }}>
              تجربة PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;