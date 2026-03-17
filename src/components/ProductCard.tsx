import { useState } from 'react';
import './ProductCard.css';

interface Product {
  id: number;
  name?: string;
  name_ar?: string;
  name_en?: string;
  price?: number;
  image?: string;
  image_file?: string;
  image_url?: string;
  [key: string]: any;
}

interface ProductCardProps {
  product: Product;
  onCardClick: (product: Product) => void;
  language?: 'ar' | 'en';
}

const ProductCard = ({ product, onCardClick, language = 'ar' }: ProductCardProps) => {
  const [isClicked, setIsClicked] = useState(false);

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
        <p className="product-card-price">${product.price?.toLocaleString() || 'N/A'}</p>
      </div>
    </article>
  );
};

export default ProductCard;