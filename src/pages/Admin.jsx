import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { Table, Input, Button, Space, Modal } from 'antd';
import { SearchOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import Header from '../components/Header';
import './Admin.css';

const Admin = ({ language, onLanguageChange, navigate, onLogout }) => {
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    type: 'silver',
    weight: '',
    manufacturing_cost: '',
    price: '',
    category: '',
    badge: '',
    stock: 'In Stock',
    section: '',
    image_url: '',
    image_file: null,
    description_ar: '',
    description_en: '',
    shortDescription_ar: '',
    shortDescription_en: ''
  });

  const [products, setProducts] = useState([]);
  const [sections, setSections] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageType, setImageType] = useState('url');
  const [sectionError, setSectionError] = useState(false);
  const sectionRef = useRef(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [editOrderValue, setEditOrderValue] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [refreshKey, setRefreshKey] = useState(0); // ✅ أضف هنا بعد السطر 35


  // eslint-disable-next-line no-unused-vars
  const [searchText, setSearchText] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef(null);

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText('');
  };

  const getColumnSearchProps = (dataIndex, title) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Search ${title}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]?.toString().toLowerCase().includes(value.toLowerCase()),
    filterDropdownProps: {
      onOpenChange: (visible) => {
        if (visible) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
  });

  // ✅ Section Management State
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [sectionFormData, setSectionFormData] = useState({
    title_ar: '',
    title_en: '',
    order: 1
  });
  const [expandedSections, setExpandedSections] = useState([]); // ✅ Track which sections are expanded

  const API_URL = 'https://omarawad9.pythonanywhere.com/api/products/';
  const SECTION_API_URL = 'https://omarawad9.pythonanywhere.com/api/sections/';

  const texts = {
    ar: {
      title: 'لوحة التحكم',
      subtitle: 'إضافة منتجات جديدة للمتجر',
      selectSection: 'اختر القسم',
      noSection: 'بدون قسم',
      createSection: '➕ إنشاء قسم جديد',
      createProduct: '➕ إنشاء منتج جديد',
      sectionTitleAr: 'عنوان القسم (عربي)',
      sectionTitleEn: 'عنوان القسم (إنجليزي)',
      sectionOrder: 'ترتيب الظهور',
      saveSection: 'حفظ القسم',
      cancel: 'إلغاء',
      featured: 'مميز',
      cannotDelete: 'لا يمكن الحذف (قسم أساسي)',
      productNameAr: 'اسم المنتج (عربي)',
      productNameEn: 'اسم المنتج (إنجليزي)',
      gold: 'ذهب',
      silver: 'فضة',
      price: 'السعر ($)',
      category: 'الفئة',
      badge: 'شارة (اختياري)',
      stock: 'حالة المخزون',
      image: 'صورة المنتج',
      useUrl: 'استخدام رابط',
      uploadFile: 'رفع ملف',
      shortDescAr: 'وصف مختصر (عربي)',
      shortDescEn: 'وصف مختصر (إنجليزي)',
      fullDescAr: 'الوصف الكامل (عربي)',
      fullDescEn: 'الوصف الكامل (إنجليزي)',
      addProduct: 'إضافة منتج',
      updateProduct: 'تحديث المنتج',
      addingProduct: 'جاري الإضافة...',
      updatingProduct: 'جاري التحديث...',
      instructions: '📋 التعليمات',
      instructionsList: [
        'املأ جميع الحقول المطلوبة (المعلَّمة بعلامة *)',
        'أدخل بيانات المنتج باللغتين العربية والإنجليزية',
        'يجب أن يكون رابط الصورة مباشرًا لملف الصورة',
        'تأكد من تشغيل السيرفر الخلفي على'
      ],
      currentInventory: 'المخزون الحالي',
      noProducts: 'لا توجد منتجات',
      delete: 'حذف',
      edit: 'تعديل',
      selectCategory: 'اختر الفئة',
      noBadge: 'بدون شارة',
      rings: 'خواتم',
      necklaces: 'قلادات',
      bracelets: 'أساور',
      earrings: 'أقراط',
      watches: 'ساعات',
      newArrivals: 'وصل حديثاً',
      inStock: 'متوفر',
      limitedStock: 'مخزون محدود',
      outOfStock: 'غير متوفر',
      bestSeller: 'الأكثر مبيعًا',
      newArrival: 'وصل حديثًا',
      limitedEdition: 'إصدار محدود',
      manageSections: 'إدارة الأقسام',
      sectionsList: 'قائمة الأقسام',
      productsCount: 'عدد المنتجات',
      sectionError: 'يرجى اختيار قسم',
      editOrder: 'تعديل الترتيب',
      updateOrder: 'تحديث الترتيب',
      logout: 'تسجيل الخروج',
    },
    en: {
      title: 'Admin Dashboard',
      subtitle: 'Add new products to your jewelry store',
      selectSection: 'Select Section',
      noSection: 'No Section',
      createSection: '➕ Create New Section',
      createProduct: '➕ Create New Product',
      sectionTitleAr: 'Section Title (Arabic)',
      sectionTitleEn: 'Section Title (English)',
      sectionOrder: 'Display Order',
      saveSection: 'Save Section',
      cancel: 'Cancel',
      featured: 'Featured',
      cannotDelete: 'Cannot delete (Essential section)',
      productNameAr: 'Product Name (Arabic)',
      productNameEn: 'Product Name (English)',
      gold: 'Gold',
      silver: 'Silver',
      price: 'Price ($)',
      category: 'Category',
      badge: 'Badge (Optional)',
      stock: 'Stock Status',
      image: 'Product Image',
      useUrl: 'Use URL',
      uploadFile: 'Upload File',
      shortDescAr: 'Short Description (Arabic)',
      shortDescEn: 'Short Description (English)',
      fullDescAr: 'Full Description (Arabic)',
      fullDescEn: 'Full Description (English)',
      addProduct: 'Add Product',
      updateProduct: 'Update Product',
      addingProduct: 'Adding Product...',
      updatingProduct: 'Updating Product...',
      instructions: '📋 Instructions',
      instructionsList: [
        'Fill in all required fields (marked with *)',
        'Enter product information in both Arabic and English',
        'Image URL should be a direct link to the image file',
        'Make sure your backend is running on'
      ],
      currentInventory: 'Current Inventory',
      noProducts: 'No products found',
      delete: 'Delete',
      edit: 'Edit',
      selectCategory: 'Select category',
      noBadge: 'No badge',
      rings: 'Rings',
      necklaces: 'Necklaces',
      bracelets: 'Bracelets',
      earrings: 'Earrings',
      watches: 'Watches',
      newArrivals: 'New Arrivals',
      inStock: 'In Stock',
      limitedStock: 'Limited Stock',
      outOfStock: 'Out of Stock',
      bestSeller: 'Best Seller',
      newArrival: 'New Arrival',
      limitedEdition: 'Limited Edition',
      manageSections: 'Manage Sections',
      sectionsList: 'Sections List',
      productsCount: 'Products Count',
      sectionError: 'Please select a section',
      editOrder: 'Edit Order',
      updateOrder: 'Update Order',
      logout: 'Logout',
    }
  };

  const t = texts[language] || texts.ar;

  useEffect(() => {
    fetchProducts();
    fetchSections();

    // ✅ إنشاء Featured Section تلقائياً لو مش موجود
    const createFeaturedSection = async () => {
      try {
        const response = await fetch(SECTION_API_URL);
        const sections = await response.json();

        const hasFeatured = sections.some(s => s.is_featured);

        if (!hasFeatured) {
          const createResponse = await fetch(SECTION_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title_ar: 'المنتجات المميزة',
              title_en: 'Featured Products',
              order: 0,
              is_featured: true
            }),
          });

          if (createResponse.ok) {
            console.log('✅ Featured Section created automatically');
            fetchSections(); // تحديث القائمة
          }
        }
      } catch (error) {
        console.error('Error creating featured section:', error);
      }
    };

    createFeaturedSection();
  }, []);

  useEffect(() => {
    if (status.message) {
      const timer = setTimeout(() => {
        setStatus({ type: '', message: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status.message]);


  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (showProductModal) {
          setShowProductModal(false);
          setEditingProductId(null);
          setFormData({
            name_ar: '', name_en: '', type: 'silver', weight: '', manufacturing_cost: '', price: '', category: '', badge: '', stock: 'In Stock',
            section: '', image_url: '', description_ar: '', description_en: '',
            shortDescription_ar: '', shortDescription_en: ''
          });
          setSelectedFile(null);
          setImageType('url');
          setSectionError(false);
        }

        if (showSectionModal) {
          setShowSectionModal(false);
          setSectionFormData({ title_ar: '', title_en: '', order: 1 });
        }

        if (showEditOrderModal) {
          setShowEditOrderModal(false);
          setEditingSectionId(null);
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showProductModal, showSectionModal, showEditOrderModal]); // Dependenciesk

  const fetchProducts = async () => {
    try {
      const response = await fetch(API_URL);
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Fetch error: Server returned HTML instead of JSON. Check API_URL port.");
        return;
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await fetch(SECTION_API_URL);
      const data = await response.json();
      console.log('📦 Fetched Sections:', data);
      if (Array.isArray(data)) {
        setSections(data);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };


  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(SECTION_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sectionFormData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: 'success',
          message: language === 'ar' ? '✅ تم إنشاء القسم بنجاح!' : '✅ Section created successfully!'
        });
        setSectionFormData({ title_ar: '', title_en: '', order: 1 });
        setShowSectionModal(false);
        fetchSections();
      } else {
        Modal.error({
          title: language === 'ar' ? '❌ فشل الإنشاء' : '❌ Creation Failed',
          content: language === 'ar'
            ? (data.error_ar || data.error || 'حدث خطأ')
            : (data.error || 'Failed to create section'),
          centered: true,
          okText: language === 'ar' ? 'حسناً' : 'OK',
        });
      }
    } catch (error) {
      console.error('Error creating section:', error);
      setStatus({ type: 'error', message: `❌ Error: ${error.message}` });
    } finally {
      setIsSubmitting(false); // ✅ دايماً يرجع false سواء نجح أو فشل
    }
  };

  // ✅ Delete Section
  const handleDeleteSection = async (id) => {
    const section = sections.find(s => s.id === id);
    if (section && section.is_featured) {
      Modal.warning({
        title: language === 'ar' ? '⭐ لا يمكن حذف القسم المميز' : '⭐ Cannot Delete Featured Section',
        content: (
          <div>
            <p>{language === 'ar'
              ? 'هذا القسم أساسي ومهم للموقع.'
              : 'This is an essential section for the website.'}</p>
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              <li>✅ {language === 'ar' ? 'يمكنك إضافة منتجات جديدة فيه' : 'You can add new products to it'}</li>
              <li>✅ {language === 'ar' ? 'يمكنك حذف المنتجات منه' : 'You can delete products from it'}</li>
              <li>❌ {language === 'ar' ? 'لكن لا يمكن حذف القسم نفسه' : 'But you cannot delete the section itself'}</li>
            </ul>
          </div>
        ),
        centered: true,
        okText: language === 'ar' ? 'حسناً' : 'OK',
      });
      return;
    }

    const sectionProducts = getProductsForSection(id);
    const productsCount = sectionProducts.length;

    Modal.confirm({
      title: language === 'ar' ? 'تأكيد حذف القسم' : 'Confirm Section Delete',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>{language === 'ar'
            ? 'هل أنت متأكد من حذف هذا القسم؟'
            : 'Are you sure you want to delete this section?'}</p>
          <p style={{ color: '#ff4d4f', marginTop: '10px', fontWeight: '600', fontSize: '15px' }}>
            {language === 'ar'
              ? `⚠️ تحذير: سيتم حذف ${productsCount} منتج مع هذا القسم!`
              : `⚠️ Warning: ${productsCount} product${productsCount !== 1 ? 's' : ''} will be deleted with this section!`}
          </p>
          <p style={{ color: '#8c8c8c', marginTop: '5px', fontSize: '13px' }}>
            {language === 'ar'
              ? 'لا يمكن التراجع عن هذا الإجراء'
              : 'This action cannot be undone'}
          </p>
        </div>
      ),
      okText: language === 'ar' ? 'نعم، احذف القسم والمنتجات' : 'Yes, Delete Section & Products',
      okType: 'danger',
      cancelText: language === 'ar' ? 'إلغاء' : 'Cancel',
      centered: true,
      onOk: async () => {
        try {
          const response = await fetch(`${SECTION_API_URL}${id}/`, {
            method: 'DELETE',
          });

          if (response.ok) {
            setSections(prevSections => prevSections.filter(s => s.id !== id));
            const successMsg = language === 'ar'
              ? `✅ تم حذف القسم و ${productsCount} منتج بنجاح`
              : `✅ Section and ${productsCount} product${productsCount !== 1 ? 's' : ''} deleted successfully`;

            Modal.success({
              title: language === 'ar' ? '🎉 تم الحذف!' : '🎉 Deleted!',
              content: successMsg,
              centered: true,
              okText: language === 'ar' ? 'حسناً' : 'OK',
            });

            fetchProducts(); // Refresh products
          } else {
            const data = await response.json();
            const errorMsg = language === 'ar'
              ? (data.message_ar || data.error || 'فشل الحذف')
              : (data.message_en || data.error || 'Failed to delete');

            Modal.error({
              title: language === 'ar' ? '❌ فشل الحذف' : '❌ Delete Failed',
              content: errorMsg,
              centered: true,
              okText: language === 'ar' ? 'حسناً' : 'OK',
            });
          }
        } catch (err) {
          console.error('Error deleting section:', err);

          Modal.error({
            title: language === 'ar' ? '❌ خطأ في الاتصال' : '❌ Network Error',
            content: err.message,
            centered: true,
            okText: language === 'ar' ? 'حسناً' : 'OK',
          });
        }
      },
    });
  };


  // ✅ Edit Section Order
  const handleEditSectionOrder = async () => {
    // ✅ تحقق من الـ order قبل ما تبعت للـ backend
    if (!editOrderValue || editOrderValue < 1) {
      Modal.error({
        title: language === 'ar' ? '❌ ترتيب غير صحيح' : '❌ Invalid Order',
        content: language === 'ar'
          ? 'الترتيب 0 محجوز للقسم المميز، اختر رقم من 1 فأكثر'
          : 'Order 0 is reserved for the featured section, choose 1 or higher',
        centered: true,
        okText: language === 'ar' ? 'حسناً' : 'OK',
      });
      return;
    }

    try {
      const response = await fetch(`${SECTION_API_URL}${editingSectionId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order: editOrderValue }),
      });

      const data = await response.json();

      if (response.ok) {
        Modal.success({
          title: language === 'ar' ? '🎉 تم التحديث!' : '🎉 Updated!',
          content: language === 'ar' ? '✅ تم تحديث الترتيب بنجاح!' : '✅ Order updated successfully!',
          centered: true,
          okText: language === 'ar' ? 'حسناً' : 'OK',
        });

        setShowEditOrderModal(false);
        setEditingSectionId(null);
        fetchSections();
      } else {
        Modal.error({
          title: language === 'ar' ? '❌ فشل التحديث' : '❌ Update Failed',
          content: language === 'ar'
            ? (data.error_ar || data.error || 'حدث خطأ')
            : (data.error || 'An error occurred'),
          centered: true,
          okText: language === 'ar' ? 'حسناً' : 'OK',
        });
      }
    } catch (error) {
      console.error('Error updating section order:', error);
      Modal.error({
        title: language === 'ar' ? '❌ خطأ في الاتصال' : '❌ Network Error',
        content: error.message,
        centered: true,
        okText: language === 'ar' ? 'حسناً' : 'OK',
      });
    }
  };
  const toggleSectionExpansion = (sectionId) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const getProductsForSection = (sectionId) => {
    return products.filter(product => product.section === sectionId);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete',
      icon: <ExclamationCircleOutlined />,
      content: language === 'ar'
        ? 'هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.'
        : 'Are you sure you want to delete this product? This action cannot be undone.',
      okText: language === 'ar' ? 'نعم، احذف' : 'Yes, Delete',
      okType: 'danger',
      cancelText: language === 'ar' ? 'إلغاء' : 'Cancel',
      centered: true,
      onOk: async () => {
        try {
          const deleteUrl = `${API_URL}${id}/`;
          const response = await fetch(deleteUrl, {
            method: 'DELETE',
          });

          if (response.ok) {
            setProducts(prevProducts => prevProducts.filter(p => (p._id || p.id) !== id));
            const successMsg = language === 'ar'
              ? '✅ تم حذف المنتج بنجاح'
              : '✅ Product deleted successfully';

            Modal.success({
              title: language === 'ar' ? '🎉 تم الحذف!' : '🎉 Deleted!',
              content: successMsg,
              centered: true,
              okText: language === 'ar' ? 'حسناً' : 'OK',
            });

            fetchProducts();
          } else {
            const data = await response.json();

            Modal.error({
              title: language === 'ar' ? '❌ فشل الحذف' : '❌ Delete Failed',
              content: data.message || (language === 'ar' ? 'حدث خطأ أثناء الحذف' : 'An error occurred while deleting'),
              centered: true,
              okText: language === 'ar' ? 'حسناً' : 'OK',
            });
          }
        } catch (err) {
          console.error('Error deleting product:', err);

          Modal.error({
            title: language === 'ar' ? '❌ خطأ في الاتصال' : '❌ Network Error',
            content: err.message,
            centered: true,
            okText: language === 'ar' ? 'حسناً' : 'OK',
          });
        }
      },
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.section) {
      setSectionError(true);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const form = new FormData();

      // ✅ إضافة البيانات بحقول اللغتين
      form.append('name_ar', formData.name_ar);
      form.append('name_en', formData.name_en);
      form.append('type', formData.type);
      form.append('weight', Number(formData.weight));
      form.append('manufacturing_cost', Number(formData.manufacturing_cost));
      form.append('price', Number(formData.price));
      form.append('category', formData.category);
      form.append('badge', formData.badge || '');
      form.append('stock', formData.stock);
      form.append('section', formData.section);
      form.append('description_ar', formData.description_ar);
      form.append('description_en', formData.description_en);
      form.append('shortDescription_ar', formData.shortDescription_ar);
      form.append('shortDescription_en', formData.shortDescription_en);

      // إضافة الصورة
      if (imageType === 'file' && selectedFile) {
        form.append('image_file', selectedFile);
      } else if (imageType === 'url' && formData.image_url) {
        form.append('image_url', formData.image_url);
      }

      console.log('📤 Sending data:');
      for (let pair of form.entries()) {
        console.log(pair[0], ':', pair[1]);
      }

      const method = editingProductId ? 'PUT' : 'POST';
      const url = editingProductId ? `${API_URL}${editingProductId}/` : API_URL;

      const response = await fetch(url, {
        method: method,
        body: form,
      });

      let data;
      try {
        data = await response.json();
      } catch (err) {
        console.error('❌ Failed to parse response:', err);
        setStatus({ type: 'error', message: '❌ Server returned invalid response' });
        setIsSubmitting(false);
        return;
      }

      if (response.ok) {
        const successMsg = editingProductId
          ? (language === 'ar' ? '✅ تم تحديث المنتج بنجاح!' : '✅ Product updated successfully!')
          : (language === 'ar' ? '✅ تم إضافة المنتج بنجاح!' : '✅ Product added successfully!');

        Modal.success({
          title: language === 'ar' ? '🎉 تم بنجاح!' : '🎉 Success!',
          content: successMsg,
          centered: true,
          okText: language === 'ar' ? 'حسناً' : 'OK',
          onOk: () => {
            // إعادة تعيين النموذج
            setFormData({
              name_ar: '',
              name_en: '',
              type: 'silver',
              weight: '',
              manufacturing_cost: '',
              price: '',
              category: '',
              badge: '',
              stock: 'In Stock',
              section: '',
              image_url: '',
              description_ar: '',
              description_en: '',
              shortDescription_ar: '',
              shortDescription_en: ''
            });
            setSelectedFile(null);
            setEditingProductId(null);
            setImageType('url');
            setShowProductModal(false);

            fetchProducts();
          }
        });
      } else {
        console.error('❌ Backend error:', data);
        const errorMsg = data.error || data.message || 'Failed to save product';

        // ✅ عرض Error Modal
        Modal.error({
          title: language === 'ar' ? '❌ حدث خطأ' : '❌ Error Occurred',
          content: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg),
          centered: true,
          okText: language === 'ar' ? 'حسناً' : 'OK',
        });
      }
    } catch (error) {
      console.error('❌ Error submitting product:', error);

      // ✅ عرض Network Error Modal
      Modal.error({
        title: language === 'ar' ? '❌ خطأ في الاتصال' : '❌ Network Error',
        content: error.message,
        centered: true,
        okText: language === 'ar' ? 'حسناً' : 'OK',
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const [metalPrices, setMetalPrices] = useState({
    gold_price_per_gram: 0,
    silver_price_per_gram: 0
  });

  const METAL_PRICES_URL = 'https://omarawad9.pythonanywhere.com/api/metal-prices/';

  const fetchMetalPrices = async () => {
    try {
      const response = await fetch(METAL_PRICES_URL);
      const data = await response.json();
      setMetalPrices(data);
    } catch (error) {
      console.error('Error fetching metal prices:', error);
    }
  };

  // في useEffect
  useEffect(() => {
    fetchProducts();
    fetchSections();
    fetchMetalPrices(); // ✅ إضافة هنا
  }, []);

  const handleUpdateMetalPrices = async () => {
    try {
      const dataToSend = {
        gold_price_per_gram: parseFloat(metalPrices.gold_price_per_gram),
        silver_price_per_gram: parseFloat(metalPrices.silver_price_per_gram)
      };

      console.log('📤 Sending metal prices:', dataToSend);

      const response = await fetch(METAL_PRICES_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      console.log('📥 Response status:', response.status);
      const data = await response.json();
      console.log('📥 Response data:', data);

      if (response.ok) {
        // ✅ تحديث المنتجات
        console.log('🔄 Refreshing products...');
        await fetchProducts();
        console.log('✅ Products refreshed!');

        // ✅ تحديث الـ refreshKey عشان الـ products تتعرض من جديد
        setRefreshKey(prev => prev + 1);

        Modal.success({
          title: language === 'ar' ? '✅ تم التحديث!' : '✅ Updated!',
          content: (
            <div>
              <p>{language === 'ar' ? 'تم تحديث الأسعار بنجاح' : 'Prices updated successfully'}</p>
              <p style={{ marginTop: '10px', fontSize: '14px', color: '#28a745' }}>
                {language === 'ar'
                  ? `✅ تم تحديث ${data.total_products_updated || 0} منتج`
                  : `✅ ${data.total_products_updated || 0} products updated`
                }
              </p>
              <div style={{ marginTop: '10px', fontSize: '13px', color: '#666' }}>
                {data.gold_products_updated > 0 && (
                  <p>💰 {language === 'ar' ? 'منتجات الذهب:' : 'Gold products:'} {data.gold_products_updated}</p>
                )}
                {data.silver_products_updated > 0 && (
                  <p>⚪ {language === 'ar' ? 'منتجات الفضة:' : 'Silver products:'} {data.silver_products_updated}</p>
                )}
              </div>
            </div>
          ),
          centered: true,
          okText: language === 'ar' ? 'حسناً' : 'OK',
        });

        // ✅ تحديث الأسعار المعروضة
        fetchMetalPrices();

      } else {
        Modal.error({
          title: language === 'ar' ? '❌ خطأ' : '❌ Error',
          content: data.message || data.error || (language === 'ar' ? 'فشل التحديث' : 'Update failed'),
          centered: true,
          okText: language === 'ar' ? 'حسناً' : 'OK',
        });
      }
    } catch (error) {
      console.error('Error updating prices:', error);
      Modal.error({
        title: language === 'ar' ? '❌ خطأ في الاتصال' : '❌ Network Error',
        content: error.message,
        centered: true,
        okText: language === 'ar' ? 'حسناً' : 'OK',
      });
    }
  };


  const columns = [
    {
      title: t.sectionTitleAr,
      dataIndex: 'title_ar',
      key: 'title_ar',
      ...getColumnSearchProps('title_ar', t.sectionTitleAr),
      render: (text, record) => (
        <span onClick={() => toggleSectionExpansion(record.id)} style={{ cursor: 'pointer' }}>
          {text}
          {record.is_featured && (
            <span style={{
              marginLeft: '8px',
              background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
              color: '#856404',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              {t.featured}
            </span>
          )}
        </span>
      ),
    },
    {
      title: t.sectionTitleEn,
      dataIndex: 'title_en',
      key: 'title_en',
      ...getColumnSearchProps('title_en', t.sectionTitleEn),
    },
    {
      title: t.sectionOrder,
      dataIndex: 'order',
      key: 'order',
      sorter: (a, b) => a.order - b.order,
      render: (order, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: '600', fontSize: '16px' }}>{order}</span>
          {!record.is_featured ? (
            <Button
              size="small"
              type="primary"
              onClick={() => {
                setEditingSectionId(record.id);
                setEditOrderValue(record.order);
                setShowEditOrderModal(true);
              }}
              style={{ fontSize: '12px' }}
            >
              {t.editOrder}
            </Button>
          ) : (
            <span style={{
              display: 'inline-block',
              padding: '4px 8px',
              background: '#f8f9fa',
              color: '#6c757d',
              borderRadius: '4px',
              fontSize: '11px',
              fontStyle: 'italic'
            }}>
              🔒 {language === 'ar' ? 'ثابت' : 'Fixed'}
            </span>
          )}
        </div>
      ),
    },
    {
      title: t.productsCount,
      key: 'productsCount',
      render: (_, record) => {
        const count = getProductsForSection(record.id).length;
        return (
          <span style={{
            background: '#e3f2fd',
            color: '#1976d2',
            padding: '4px 12px',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            {count}
          </span>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        record.is_featured ? (
          <span style={{
            display: 'inline-block',
            padding: '8px 12px',
            background: '#f8f9fa',
            color: '#6c757d',
            borderRadius: '6px',
            fontSize: '12px',
            fontStyle: 'italic'
          }}>
            {t.cannotDelete}
          </span>
        ) : (
          <Button
            danger
            onClick={() => handleDeleteSection(record.id)}
            style={{ width: '90%' }}
          >
            {t.delete}
          </Button>
        )
      ),
    },
  ];

  const [metalPriceInputs, setMetalPriceInputs] = useState({
    gold: String(metalPrices.gold_price_per_gram),
    silver: String(metalPrices.silver_price_per_gram),
  });

  // ✅ 2. Sync if metalPrices changes from outside (e.g. after fetch)
  useEffect(() => {
    setMetalPriceInputs({
      gold: String(metalPrices.gold_price_per_gram),
      silver: String(metalPrices.silver_price_per_gram),
    });
  }, [metalPrices.gold_price_per_gram, metalPrices.silver_price_per_gram]);

  return (
    <div className="admin-page">
      <Header
        language={language}
        onLanguageChange={onLanguageChange}
        navigate={navigate}
        onWishlistClick={null}
        onCartClick={null}
        adminMode={true}
        onLogout={onLogout}
      />

      <div className="admin-container">
        <header className="admin-header">
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </header>

        {/* ✅ Section Selection & Creation */}
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          marginBottom: '30px'
        }}>
          <button
            type="button"
            onClick={() => setShowProductModal(true)}
            style={{
              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
              color: 'white',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '18px',
              boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
            }}
          >
            {t.createProduct}
          </button>

          <button
            type="button"
            onClick={() => setShowSectionModal(true)}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '18px',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}
          >
            {t.createSection}
          </button>
        </div>


        {/* ✅ Metal Prices Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',   // stack on mobile by default
          gap: '16px',
          marginTop: '20px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>

          {/* Row: Gold + Silver inputs side by side on tablet/desktop */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',        // wraps to second line on small screens
            gap: '16px',
          }}>

            {/* Gold Price */}
            <div style={{ flex: '1 1 200px', minWidth: '0' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#856404',
                fontSize: '14px'
              }}>
                💰 {language === 'ar' ? 'سعر الذهب (للجرام)' : 'Gold Price (per gram)'}
              </label>
              <input
                type="number"
                inputMode="decimal"           // ✅ shows numeric keyboard on mobile
                value={metalPriceInputs.gold}
                onChange={(e) => {
                  // ✅ store raw string — no parseFloat during typing
                  setMetalPriceInputs(prev => ({ ...prev, gold: e.target.value }));
                }}
                onBlur={(e) => {
                  // ✅ only parse & commit to real state when user leaves the field
                  const parsed = parseFloat(e.target.value);
                  const value = isNaN(parsed) ? 0 : parsed;
                  setMetalPriceInputs(prev => ({ ...prev, gold: String(value) }));
                  setMetalPrices(prev => ({ ...prev, gold_price_per_gram: value }));
                }}
                step="0.01"
                min="0"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #ffd700',
                  fontSize: '16px',        // ✅ prevents iOS zoom
                  fontWeight: '600',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Silver Price */}
            <div style={{ flex: '1 1 200px', minWidth: '0' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#495057',
                fontSize: '14px'
              }}>
                ⚪ {language === 'ar' ? 'سعر الفضة (للجرام)' : 'Silver Price (per gram)'}
              </label>
              <input
                type="number"
                inputMode="decimal"           // ✅ shows numeric keyboard on mobile
                value={metalPriceInputs.silver}
                onChange={(e) => {
                  // ✅ store raw string — no parseFloat during typing
                  setMetalPriceInputs(prev => ({ ...prev, silver: e.target.value }));
                }}
                onBlur={(e) => {
                  // ✅ only parse & commit to real state when user leaves the field
                  const parsed = parseFloat(e.target.value);
                  const value = isNaN(parsed) ? 0 : parsed;
                  setMetalPriceInputs(prev => ({ ...prev, silver: String(value) }));
                  setMetalPrices(prev => ({ ...prev, silver_price_per_gram: value }));
                }}
                step="0.01"
                min="0"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #c0c0c0',
                  fontSize: '16px',        // ✅ prevents iOS zoom
                  fontWeight: '600',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Save Button — full width on mobile */}
          <button
            onClick={() => {
              // ✅ commit any un-blurred values before saving
              const gold = parseFloat(metalPriceInputs.gold) || 0;
              const silver = parseFloat(metalPriceInputs.silver) || 0;
              setMetalPrices(prev => ({
                ...prev,
                gold_price_per_gram: gold,
                silver_price_per_gram: silver,
              }));
              handleUpdateMetalPrices();
            }}
            style={{
              width: '100%',               // ✅ full width on mobile, looks clean on desktop too
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '16px',
              transition: 'background 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#0056b3'}
            onMouseOut={e => e.currentTarget.style.background = '#007bff'}
          >
            {language === 'ar' ? '💾 حفظ الأسعار' : '💾 Save Prices'}
          </button>
        </div>


        {/* ✅ Product Creation Modal */}
        {showProductModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            overflow: 'auto',
            padding: '20px'
          }}>
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}>
              <h3 style={{ marginBottom: '20px', color: '#2c3e50', fontSize: '24px', fontWeight: '700' }}>
                {editingProductId
                  ? (language === 'ar' ? '🔄 تعديل المنتج' : '🔄 Edit Product')
                  : (language === 'ar' ? '➕ إضافة منتج جديد' : '➕ Add New Product')
                }
              </h3>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Section Selection */}
                <div ref={sectionRef} className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
                    {t.selectSection}
                    <span style={{ marginLeft: '4px', color: '#e74c3c' }}>*</span>
                  </label>
                  <select
                    required
                    value={formData.section}
                    onChange={(e) => {
                      setFormData({ ...formData, section: e.target.value });
                      setSectionError(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      borderRadius: '8px',
                      border: sectionError ? '2px solid #e74c3c' : '2px solid #e0e0e0',
                      fontSize: '16px',
                      background: 'white'
                    }}
                  >
                    <option value="" disabled>{t.noSection}</option>
                    {sections.map(section => (
                      <option key={section.id} value={section.id}>
                        {language === 'ar' ? section.title_ar : section.title_en}
                      </option>
                    ))}
                  </select>
                  {sectionError && (
                    <span style={{ color: '#e74c3c', fontSize: '14px', marginTop: '6px', display: 'block' }}>
                      {t.sectionError}
                    </span>
                  )}
                </div>

                {/* Product Name AR */}
                <div className="form-group">
                  <label htmlFor="name_ar">{t.productNameAr} *</label>
                  <input
                    type="text"
                    id="name_ar"
                    name="name_ar"
                    value={formData.name_ar}
                    onChange={handleChange}
                    required
                    placeholder="مثال: خاتم ذهبي كلاسيكي"
                  />
                </div>

                {/* Product Name EN */}
                <div className="form-group">
                  <label htmlFor="name_en">{t.productNameEn} *</label>
                  <input
                    type="text"
                    id="name_en"
                    name="name_en"
                    value={formData.name_en}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Classic Gold Ring"
                  />
                </div>

                {/* ✨ Product Type */}
                <div className="form-group">
                  <label htmlFor="type" style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    fontSize: '16px'
                  }}>
                    {language === 'ar' ? 'نوع المعدن' : 'Metal Type'}
                    <span style={{ marginLeft: '4px', color: '#000000' }}>*</span>
                  </label>

                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      borderRadius: '10px',
                      border: '2px solid #e0e0e0',
                      fontSize: '16px',
                      background: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontWeight: '500',
                      color: '#2c3e50',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#d4af37';
                      e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e0e0e0';
                      e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                    }}
                  >
                    <option value="gold" style={{ padding: '10px' }}>
                      {language === 'ar' ? 'ذهب ' : 'Gold'}
                    </option>
                    <option value="silver" style={{ padding: '10px' }}>
                      {language === 'ar' ? 'فضة' : 'Silver'}
                    </option>
                  </select>
                </div>

                {/* Weight Input */}
                <div className="form-group">
                  <label htmlFor="weight">
                    {language === 'ar' ? 'الوزن (جرام)' : 'Weight (grams)'} *
                  </label>
                  <input
                    type="number"
                    id="weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    required
                    onWheel={(e) => e.target.blur()}
                    min="0"
                    step="0.01"
                    placeholder="10.5"
                  />
                </div>

                {/* Manufacturing Cost Input */}
                <div className="form-group">
                  <label htmlFor="manufacturing_cost">
                    {language === 'ar' ? 'المصنعية (للجرام)' : 'Manufacturing Cost (per gram)'} *
                  </label>
                  <input
                    type="number"
                    id="manufacturing_cost"
                    name="manufacturing_cost"
                    value={formData.manufacturing_cost}
                    onChange={handleChange}
                    required
                    onWheel={(e) => e.target.blur()}
                    min="0"
                    step="0.01"
                    placeholder={language === 'ar' ? 'مثال: 2.5' : 'e.g., 2.5'}
                  />
                  <small style={{ color: '#6c757d', fontSize: '13px', marginTop: '5px', display: 'block' }}>
                    {language === 'ar'
                      ? '💡 تكلفة التصنيع لكل جرام (ستُضاف على سعر المعدن)'
                      : '💡 Manufacturing cost per gram (will be added to metal price)'}
                  </small>
                </div>

                {/* Category */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="category">{t.category} *</label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                    >
                      <option value="">{t.selectCategory}</option>
                      <option value="Rings">{t.rings}</option>
                      <option value="Necklaces">{t.necklaces}</option>
                      <option value="Bracelets">{t.bracelets}</option>
                      <option value="Earrings">{t.earrings}</option>
                      <option value="Watches">{t.watches}</option>
                      <option value="New Arrivals">{t.newArrivals}</option>
                    </select>
                  </div>
                </div>

                {/* Badge & Stock */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="badge">{t.badge}</label>
                    <select
                      id="badge"
                      name="badge"
                      value={formData.badge}
                      onChange={handleChange}
                    >
                      <option value="">{t.noBadge}</option>
                      <option value="Best Seller">{t.bestSeller}</option>
                      <option value="New Arrival">{t.newArrival}</option>
                      <option value="Limited Edition">{t.limitedEdition}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="stock">{t.stock} *</label>
                    <select
                      id="stock"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      required
                    >
                      <option value="In Stock">{t.inStock}</option>
                      <option value="Limited Stock">{t.limitedStock}</option>
                      <option value="Out of Stock">{t.outOfStock}</option>
                    </select>
                  </div>
                </div>

                {/* Image */}
                <div className="form-group">
                  <label>{t.image} *</label>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ marginRight: '20px' }}>
                      <input
                        type="radio"
                        name="imageType"
                        value="url"
                        checked={imageType === 'url'}
                        onChange={() => setImageType('url')}
                        style={{ marginRight: '5px' }}
                      />
                      {t.useUrl}
                    </label>

                    <label>
                      <input
                        type="radio"
                        name="imageType"
                        value="file"
                        checked={imageType === 'file'}
                        onChange={() => setImageType('file')}
                        style={{ marginRight: '5px' }}
                      />
                      {t.uploadFile}
                    </label>
                  </div>

                  {imageType === 'url' ? (
                    <input
                      type="url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  ) : (
                    <>
                      <button
                        type="button"
                        className="upload-image-btn"
                        onClick={() => document.getElementById('imageUploadInput').click()}
                        style={{ fontSize: "18px" }}
                      >
                        📷 {language === 'ar' ? 'اختيار صورة' : 'Choose Image'}
                      </button>

                      <input
                        id="imageUploadInput"
                        type="file"
                        name="image_file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                      />

                      {selectedFile && (
                        <p style={{ marginTop: '8px', fontSize: '14px' }}>
                          {language === 'ar' ? 'تم اختيار:' : 'Selected:'} {selectedFile.name}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Short Description AR */}
                <div className="form-group">
                  <label htmlFor="shortDescription_ar">{t.shortDescAr} *</label>
                  <input
                    type="text"
                    id="shortDescription_ar"
                    name="shortDescription_ar"
                    value={formData.shortDescription_ar}
                    onChange={handleChange}
                    required
                    maxLength="100"
                    placeholder="وصف موجز من سطر واحد"
                  />
                </div>

                {/* Short Description EN */}
                <div className="form-group">
                  <label htmlFor="shortDescription_en">{t.shortDescEn} *</label>
                  <input
                    type="text"
                    id="shortDescription_en"
                    name="shortDescription_en"
                    value={formData.shortDescription_en}
                    onChange={handleChange}
                    required
                    maxLength="100"
                    placeholder="Brief one-line description"
                  />
                </div>

                {/* Full Description AR */}
                <div className="form-group">
                  <label htmlFor="description_ar">{t.fullDescAr} *</label>
                  <textarea
                    id="description_ar"
                    name="description_ar"
                    value={formData.description_ar}
                    onChange={handleChange}
                    required
                    rows="4"
                    placeholder="وصف تفصيلي للمنتج..."
                  />
                </div>

                {/* Full Description EN */}
                <div className="form-group">
                  <label htmlFor="description_en">{t.fullDescEn} *</label>
                  <textarea
                    id="description_en"
                    name="description_en"
                    value={formData.description_en}
                    onChange={handleChange}
                    required
                    rows="4"
                    placeholder="Detailed product description..."
                  />
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductModal(false);
                      setEditingProductId(null);
                      setFormData({
                        name_ar: '', name_en: '', type: 'silver', weight: '',
                        manufacturing_cost: '', price: '', category: '', badge: '', stock: 'In Stock',
                        section: '', image_url: '', description_ar: '', description_en: '',
                        shortDescription_ar: '', shortDescription_en: ''
                      });
                      setSelectedFile(null);
                      setImageType('url');
                      setSectionError(false);
                    }}
                    style={{
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '16px'
                    }}
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      background: isSubmitting ? '#ccc' : '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '6px',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '16px'
                    }}
                  >
                    {isSubmitting
                      ? (editingProductId ? t.updatingProduct : t.addingProduct)
                      : (editingProductId ? t.updateProduct : t.addProduct)
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


        {/* ✅ Section Creation Modal */}
        {showSectionModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}>
              <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>
                {t.createSection}
              </h3>

              <form onSubmit={handleSectionSubmit}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    {t.sectionTitleAr} *
                    <span style={{ color: '#666', fontSize: '14px', marginLeft: '10px' }}>
                      ({sectionFormData.title_ar.length}/20)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={sectionFormData.title_ar}
                    onChange={(e) => {
                      // ✅ منع الكتابة إذا تجاوز 15 حرف
                      if (e.target.value.length <= 20) {
                        setSectionFormData({ ...sectionFormData, title_ar: e.target.value });
                      }
                    }}
                    required
                    maxLength={20}
                    placeholder="مثال: مجموعة الصيف"
                    style={{
                      width: '100%',
                      padding: '10px 15px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '16px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    {t.sectionTitleEn} *
                    <span style={{ color: '#666', fontSize: '14px', marginLeft: '10px' }}>
                      ({sectionFormData.title_en.length}/20)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={sectionFormData.title_en}
                    onChange={(e) => {
                      // ✅ منع الكتابة إذا تجاوز 20 حرف
                      if (e.target.value.length <= 20) {
                        setSectionFormData({ ...sectionFormData, title_en: e.target.value });
                      }
                    }}
                    required
                    maxLength={20}
                    placeholder="e.g., Summer Collection"
                    style={{
                      width: '100%',
                      padding: '10px 15px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '16px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    {t.sectionOrder}
                  </label>
                  <input
                    type="number"
                    value={sectionFormData.order}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, order: parseInt(e.target.value) })}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '10px 15px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '16px'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSectionModal(false);
                      setSectionFormData({ title_ar: '', title_en: '', order: 0 });
                    }}
                    style={{
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      background: isSubmitting ? '#6c757d' : '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      opacity: isSubmitting ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <span style={{
                          width: '14px',
                          height: '14px',
                          border: '2px solid rgba(255,255,255,0.4)',
                          borderTopColor: 'white',
                          borderRadius: '50%',
                          display: 'inline-block',
                          animation: 'spin 0.7s linear infinite',
                        }} />
                        {language === 'ar' ? 'جارٍ الحفظ...' : 'Saving...'}
                      </>
                    ) : t.saveSection}
                  </button>

                  {/* أضف الـ CSS للـ spinner في أي style tag */}
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ✅ Edit Order Modal */}
        {showEditOrderModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}>
              <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>
                {t.editOrder}
              </h3>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  {t.sectionOrder}
                </label>
                <input
                  type="number"
                  value={editOrderValue}
                  onChange={(e) => setEditOrderValue(parseInt(e.target.value))}
                  min="1"
                  style={{
                    width: '100%',
                    padding: '10px 15px',
                    borderRadius: '6px',
                    border: '2px solid #667eea',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditOrderModal(false);
                    setEditingSectionId(null);
                  }}
                  style={{
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleEditSectionOrder}
                  style={{
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  {t.updateOrder}
                </button>
              </div>
            </div>
          </div>
        )}

        {status.message && (
          <div className={`status-message ${status.type}`}>
            {status.message}
          </div>
        )}

        {/* ✅ Sections List */}
        {sections.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ marginTop: "20px", marginBottom: "20px" }}>{t.sectionsList}</h2>
            <hr style={{ marginBottom: "20px" }} />

            <Table
              columns={columns}
              dataSource={sections}
              rowKey="id"
              scroll={{ x: 'max-content' }}
              pagination={{
                pageSize: pageSize,
                showSizeChanger: true,
                pageSizeOptions: ['5', '10'],
                placement: ['bottomCenter'],
                onShowSizeChange: (current, size) => {
                  setPageSize(size);
                },
              }}
              expandable={{
                expandedRowRender: (record) => {
                  const sectionProducts = getProductsForSection(record.id);
                  if (sectionProducts.length === 0) {
                    return (
                      <p style={{ textAlign: 'center', color: '#6c757d', fontStyle: 'italic', padding: '20px' }}>
                        {language === 'ar' ? '📭 لا توجد منتجات في هذا القسم' : '📭 No products in this section'}
                      </p>
                    );
                  }
                  return (
                    <div style={{ padding: '20px', borderLeft: '4px solid #667eea' }}>
                      <h4 style={{ marginBottom: '15px', color: '#667eea', fontSize: '16px' }}>
                        {language === 'ar' ? '📦 المنتجات في هذا القسم:' : '📦 Products in this section:'}
                      </h4>

                      {/* ✅ Fixed grid — same column width regardless of content */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 160px))',
                        gap: '15px',
                        justifyContent: 'start'
                      }}>
                        {sectionProducts.map(product => (
                          <div
                            key={`${product.id || product._id}-${refreshKey}`}
                            style={{
                              background: 'white',
                              padding: '12px',
                              borderRadius: '8px',
                              border: '1px solid #e0e0e0',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              width: '160px',       /* ✅ fixed width — same for AR and EN */
                              height: '320px',      /* ✅ fixed height — cards never grow with text */
                              overflow: 'hidden',
                              boxSizing: 'border-box'
                            }}
                          >
                            <img
                              src={product.image || product.image_url || product.image_file || 'https://via.placeholder.com/150'}
                              alt={language === 'ar' ? product.name_ar : product.name_en}
                              style={{
                                width: '100%',
                                height: '120px',
                                objectFit: 'cover',
                                borderRadius: '6px',
                                flexShrink: 0          /* ✅ image never shrinks */
                              }}
                            />

                            {/* ✅ Name — truncate overflow so long Arabic names don't push other elements */}
                            <strong style={{
                              fontSize: '13px',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,        /* max 2 lines */
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: '1.3',
                              minHeight: '34px'          /* reserve space for 2 lines always */
                            }}>
                              {language === 'ar' ? (product.name_ar || product.name) : (product.name_en || product.name)}
                            </strong>

                            <span style={{ color: '#28a745', fontWeight: '600', fontSize: '13px' }}>
                              ${product.price}
                            </span>

                            {/* ✨ Type Badge (Gold/Silver) */}
                            <span style={{
                              display: 'inline-block',
                              width: 'fit-content',
                              background: product.type === 'gold'
                                ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)'
                                : 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)',
                              color: product.type === 'gold' ? '#856404' : '#393939',
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                              {product.type === 'gold'
                                ? (language === 'ar' ? 'ذهب' : 'Gold')
                                : (language === 'ar' ? 'فضة' : 'Silver')
                              }
                            </span>

                            <span
                              className={`stock-badge ${product.stock?.toLowerCase().replace(/\s/g, '-')}`}
                              style={{ fontSize: '11px' }}
                            >
                              {product.stock}
                            </span>

                            {/* ✅ Buttons pushed to bottom via marginTop: auto */}
                            <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                              <button
                                onClick={() => {
                                  setEditingProductId(product.id || product._id);
                                  setFormData({
                                    name_ar: product.name_ar || product.name || '',
                                    name_en: product.name_en || product.name || '',
                                    type: product.type || 'silver',
                                    weight: product.weight || '',
                                    manufacturing_cost: product.manufacturing_cost || '',
                                    price: product.price,
                                    category: product.category,
                                    badge: product.badge || '',
                                    stock: product.stock,
                                    section: product.section,
                                    image_url: product.image_url || product.image || '',
                                    description_ar: product.description_ar || product.description || '',
                                    description_en: product.description_en || product.description || '',
                                    shortDescription_ar: product.shortDescription_ar || product.shortDescription || '',
                                    shortDescription_en: product.shortDescription_en || product.shortDescription || ''
                                  });
                                  setShowProductModal(true);
                                }}
                                style={{
                                  flex: 1,
                                  background: '#ffc107',
                                  color: 'white',
                                  border: 'none',
                                  padding: '7px 4px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}
                              >
                                {t.edit}
                              </button>

                              <button
                                onClick={() => handleDelete(product.id || product._id)}
                                style={{
                                  flex: 1,
                                  background: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  padding: '7px 4px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}
                              >
                                {t.delete}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                },
                expandedRowKeys: expandedSections,
                onExpand: (expanded, record) => toggleSectionExpansion(record.id),
              }}
            />
          </div>
        )}


        {/* ✅ Current Inventory - المنتجات بدون قسم (Orphaned Products) */}
        {(() => {
          // ✅ فلترة المنتجات اللي بدون section أو section مش موجود
          const orphanedProducts = products.filter(product => {
            if (!product.section) return true; // لو مافيش section خالص
            // لو الـ section موجود لكن مش في قائمة الـ sections (تم حذفه)
            return !sections.find(s => s.id === product.section);
          });

          // ✅ لو مافيش منتجات orphaned، ما تظهرش القسم ده
          if (orphanedProducts.length === 0) return null;

          return (
            <div style={{ marginTop: '40px' }}>
              <h2 style={{ marginBottom: "20px", color: '#ff9800' }}>
                ⚠️ {language === 'ar' ? 'منتجات بدون قسم' : 'Orphaned Products'}
              </h2>
              <p style={{
                marginBottom: "15px",
                color: '#6c757d',
                fontSize: '14px'
              }}>
                {language === 'ar'
                  ? `تم العثور على ${orphanedProducts.length} منتج بدون قسم. يرجى تعيين قسم لهم.`
                  : `Found ${orphanedProducts.length} product${orphanedProducts.length !== 1 ? 's' : ''} without a section. Please assign them to a section.`}
              </p>
              <hr style={{ marginBottom: "20px" }} />

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '20px'
              }}>
                {orphanedProducts.map(product => (
                  <div
                    key={`${product.id || product._id}-${refreshKey}`}
                    style={{
                      background: '#fff8e1',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '2px solid #ff9800',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: '0 2px 8px rgba(255, 152, 0, 0.1)',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 152, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 152, 0, 0.1)';
                    }}
                  >
                    {/* Warning Badge */}
                    <span style={{
                      display: 'inline-block',
                      width: 'fit-content',
                      background: '#ff9800',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      ⚠️ {language === 'ar' ? 'بدون قسم' : 'No Section'}
                    </span>

                    <img
                      src={product.image || product.image_url || product.image_file || 'https://via.placeholder.com/250'}
                      alt={language === 'ar' ? product.name_ar : product.name_en}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />

                    {product.badge && (
                      <span style={{
                        display: 'inline-block',
                        width: 'fit-content',
                        background: '#667eea',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {product.badge}
                      </span>
                    )}

                    <strong style={{ fontSize: '16px', color: '#2c3e50' }}>
                      {language === 'ar' ? (product.name_ar || product.name) : (product.name_en || product.name)}
                    </strong>

                    <p style={{
                      fontSize: '14px',
                      color: '#6c757d',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {language === 'ar'
                        ? (product.shortDescription_ar || product.shortDescription)
                        : (product.shortDescription_en || product.shortDescription)}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#28a745'
                      }}>
                        ${product.price}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6c757d' }}>
                        {product.category}
                      </span>
                    </div>

                    <span
                      className={`stock-badge ${product.stock?.toLowerCase().replace(/\s/g, '-')}`}
                      style={{
                        fontSize: '12px',
                        textAlign: 'center',
                        padding: '6px',
                        borderRadius: '6px'
                      }}
                    >
                      {product.stock}
                    </span>

                    <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                      <button
                        onClick={() => {
                          setEditingProductId(product.id || product._id);
                          setFormData({
                            name_ar: product.name_ar || product.name || '',
                            name_en: product.name_en || product.name || '',
                            type: product.type || 'silver',
                            weight: product.weight || '',
                            manufacturing_cost: product.manufacturing_cost || '',
                            price: product.price,
                            category: product.category,
                            badge: product.badge || '',
                            stock: product.stock,
                            section: product.section || '',
                            image_url: product.image_url || product.image || '',
                            description_ar: product.description_ar || product.description || '',
                            description_en: product.description_en || product.description || '',
                            shortDescription_ar: product.shortDescription_ar || product.shortDescription || '',
                            shortDescription_en: product.shortDescription_en || product.shortDescription || ''
                          });
                          setShowProductModal(true);
                        }}
                        style={{
                          flex: 1,
                          background: '#ffc107',
                          color: 'white',
                          border: 'none',
                          padding: '10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e0a800'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#ffc107'}
                      >
                        {t.edit}
                      </button>

                      <button
                        onClick={() => handleDelete(product.id || product._id)}
                        style={{
                          flex: 1,
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#c82333'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#dc3545'}
                      >
                        {t.delete}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default Admin;