import { useState } from 'react';
import './ProductCard.css';
import useBadges from '../utils/useBadges';

interface Product {
  id: number;
  name?: string;
  name_ar?: string;
  name_en?: string;
  price?: number;
  image?: string;
  image_file?: string;
  image_url?: string;
  badge?: string;
  [key: string]: any;
}

interface ProductCardProps {
  product: Product;
  onCardClick: (product: Product) => void;
  language?: 'ar' | 'en';
}

const ProductCard = ({ product, onCardClick, language = 'ar' }: ProductCardProps) => {
  const [isClicked, setIsClicked] = useState(false);
  const { getBadgeColor, getLocalizedBadgeName } = useBadges();
  const customBadgeColor = getBadgeColor(product.badge);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => {
      setIsClicked(false);
      onCardClick(product);
    }, 250);
  };

  const getProductName = (): string => {
    if (!product) return '';
    return language === 'ar'
      ? (product.name_ar || product.name || 'منتج')
      : (product.name_en || product.name || 'Product');
  };

  const getImageUrl = (): string => {
    if (product.image_file) return product.image_file;
    if (product.image_url) return product.image_url;
    if (product.image) return product.image;
    return 'https://via.placeholder.com/400x400?text=No+Image';
  };

  const formatPrice = (price: any): string => {
    if (!price) return language === 'ar' ? 'غير متاح' : 'N/A';
    const numeric = parseFloat(price);
    if (isNaN(numeric)) return language === 'ar' ? 'غير متاح' : 'N/A';
    const formatted = Math.ceil(numeric).toLocaleString();
    return language === 'ar' ? `${formatted} ج.م` : `EGP ${formatted}`;
  };



  return (
    <article
      className={`product-card ${isClicked ? 'product-card-clicked' : ''}`}
      onClick={handleClick}
    >
      <div className="product-card-image-container">

        <img
          src={getImageUrl()}
          alt={getProductName()}
          className="product-card-image"
          loading="lazy"
        />
      </div>
      <div className="product-card-content">
        <h3 className="product-card-name">{getProductName()}</h3>
        <p className="product-card-price">{formatPrice(product.price)}</p>
        {product.show_weight !== false && product.weight && parseFloat(product.weight) > 0 && (
          <p className="product-card-weight" style={{ fontSize: '0.85rem', color: '#666', margin: '4px 0 0 0', fontWeight: '500' }}>
            {language === 'ar' ? `الوزن: ${product.weight} جرام` : `Weight: ${product.weight}g`}
          </p>
        )}
      </div>
    </article>
  );
};

export default ProductCard;