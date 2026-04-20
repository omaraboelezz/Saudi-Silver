import { useState, useEffect, useRef } from "react";
import { Table, Input, Button, Space, Modal } from "antd";
import { SearchOutlined, ExclamationCircleOutlined, DeleteFilled } from "@ant-design/icons";
import Header from "../components/Header";
import "./Admin.css";
import { pdf } from '@react-pdf/renderer';
import InvoiceDocument from '../components/InvoiceDocument';
import { fetchWithAuth } from '../utils/api';

const Admin = ({ language, onLanguageChange, navigate, onLogout }) => {
  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    type: "silver",
    karat: "999",
    weight: "",
    show_weight: true,
    manufacturing_cost: "",
    price: "",
    badge: "",
    stock: "In Stock",
    section: "",
    image_url: "",
    image_file: null,
    description_ar: "",
    description_en: "",
    shortDescription_ar: "",
    shortDescription_en: "",
  });

  const [products, setProducts] = useState([]);
  const [sections, setSections] = useState([]);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageType, setImageType] = useState("url");
  const [sectionError, setSectionError] = useState(false);
  const sectionRef = useRef(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [editOrderValue, setEditOrderValue] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [refreshKey, _setRefreshKey] = useState(0);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [invoiceLanguage, setInvoiceLanguage] = useState(language);
  const [detailModalState, setDetailModalState] = useState({ visible: false, itemId: null, weight: '', karat: '', notes: '', customPrice: '' });
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [newBadgeNameAr, setNewBadgeNameAr] = useState('');
  const [newBadgeNameEn, setNewBadgeNameEn] = useState('');
  const [newBadgeColor, setNewBadgeColor] = useState('#667eea');
  const [customBadges, setCustomBadges] = useState([]);
  const [isSavingBadge, setIsSavingBadge] = useState(false);
  const [editingBadgeId, setEditingBadgeId] = useState(null);
  const [badgeModalView, setBadgeModalView] = useState("list"); // "list" | "form" | "confirmDelete"
  const [badgeToDelete, setBadgeToDelete] = useState(null);
  const [selectedOrphans, setSelectedOrphans] = useState([]);
  const [showDeleteOrphansModal, setShowDeleteOrphansModal] = useState(false);
  const [isDeletingOrphans, setIsDeletingOrphans] = useState(false);

  // ✅ Move Product State
  const [showMoveProductModal, setShowMoveProductModal] = useState(false);
  const [productToMove, setProductToMove] = useState(null);
  const [newSectionForMove, setNewSectionForMove] = useState("");
  const [isMovingProduct, setIsMovingProduct] = useState(false);



  // eslint-disable-next-line no-unused-vars
  const [searchText, setSearchText] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };

  const handleDeleteSelectedOrphans = async () => {
    setIsDeletingOrphans(true);
    try {
      for (const id of selectedOrphans) {
        await fetch(`${API_URL}${id}/`, { method: "DELETE" });
      }
      setProducts((prev) =>
        prev.filter((p) => !selectedOrphans.includes(p.id || p._id))
      );
      setSelectedOrphans([]);
      setShowDeleteOrphansModal(false);
      Modal.success({
        title: language === "ar" ? "🎉 تم الحذف!" : "🎉 Deleted!",
        content:
          language === "ar"
            ? `✅ تم حذف ${selectedOrphans.length} منتج بنجاح`
            : `✅ ${selectedOrphans.length} product${selectedOrphans.length !== 1 ? "s" : ""} deleted successfully`,
        centered: true,
        okText: language === "ar" ? "حسناً" : "OK",
      });
    } catch (err) {
      Modal.error({
        title: language === "ar" ? "❌ خطأ في الاتصال" : "❌ Network Error",
        content: err.message,
        centered: true,
        okText: language === "ar" ? "حسناً" : "OK",
      });
    } finally {
      setIsDeletingOrphans(false);
    }
  };

  const getColumnSearchProps = (dataIndex, title) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Search ${title}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
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
          <Button
            onClick={() => handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
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
    title_ar: "",
    title_en: "",
    order: 1,
  });
  const [expandedSections, setExpandedSections] = useState([]); // ✅ Track which sections are expanded

  const API_URL = "https://omarawad9.pythonanywhere.com/api/products/";
  const SECTION_API_URL = "https://omarawad9.pythonanywhere.com/api/sections/";

  const texts = {
    ar: {
      title: "لوحة التحكم",
      subtitle: "إضافة منتجات جديدة للمتجر",
      selectSection: "اختر القسم",
      noSection: "بدون قسم",
      createSection: "➕ إنشاء قسم جديد",
      createProduct: "➕ إنشاء منتج جديد",
      sectionTitleAr: "عنوان القسم (عربي)",
      sectionTitleEn: "عنوان القسم (إنجليزي)",
      sectionOrder: "ترتيب الظهور",
      saveSection: "حفظ القسم",
      cancel: "إلغاء",
      featured: "مميز",
      cannotDelete: "لا يمكن الحذف (قسم أساسي)",
      productNameAr: "اسم المنتج (عربي)",
      productNameEn: "اسم المنتج (إنجليزي)",
      gold: "ذهب",
      silver: "فضة",
      price: "السعر ($)",
      badge: "شارة (اختياري)",
      stock: "حالة المخزون",
      image: "صورة المنتج",
      useUrl: "استخدام رابط",
      uploadFile: "رفع ملف",
      shortDescAr: "وصف مختصر (عربي)",
      shortDescEn: "وصف مختصر (إنجليزي)",
      fullDescAr: "الوصف الكامل (عربي)",
      fullDescEn: "الوصف الكامل (إنجليزي)",
      addProduct: "إضافة منتج",
      updateProduct: "تحديث المنتج",
      addingProduct: "جاري الإضافة...",
      updatingProduct: "جاري التحديث...",
      instructions: "📋 التعليمات",
      instructionsList: [
        "املأ جميع الحقول المطلوبة (المعلَّمة بعلامة *)",
        "أدخل بيانات المنتج باللغتين العربية والإنجليزية",
        "يجب أن يكون رابط الصورة مباشرًا لملف الصورة",
        "تأكد من تشغيل السيرفر الخلفي على",
      ],
      currentInventory: "المخزون الحالي",
      noProducts: "لا توجد منتجات",
      delete: "حذف",
      edit: "تعديل",
      noBadge: "بدون شارة",
      inStock: "متوفر",
      limitedStock: "مخزون محدود",
      outOfStock: "غير متوفر",
      bestSeller: "الأكثر مبيعًا",
      newArrival: "وصل حديثًا",
      limitedEdition: "إصدار محدود",
      manageSections: "إدارة الأقسام",
      sectionsList: "قائمة الأقسام",
      productsCount: "عدد المنتجات",
      sectionError: "يرجى اختيار قسم",
      editOrder: "تعديل الترتيب",
      updateOrder: "تحديث الترتيب",
      logout: "تسجيل الخروج",
      moveProduct: "نقل",
      selectNewSection: "اختر القسم الجديد",
      confirmMove: "تأكيد النقل",
      moving: "جاري النقل...",
      productMoved: "✅ تم نقل المنتج بنجاح",
    },
    en: {
      title: "Admin Dashboard",
      subtitle: "Add new products to your jewelry store",
      selectSection: "Select Section",
      noSection: "No Section",
      createSection: "➕ Create New Section",
      createProduct: "➕ Create New Product",
      sectionTitleAr: "Section Title (Arabic)",
      sectionTitleEn: "Section Title (English)",
      sectionOrder: "Display Order",
      saveSection: "Save Section",
      cancel: "Cancel",
      featured: "Featured",
      cannotDelete: "Cannot delete (Essential section)",
      productNameAr: "Product Name (Arabic)",
      productNameEn: "Product Name (English)",
      gold: "Gold",
      silver: "Silver",
      price: "Price ($)",
      badge: "Badge (Optional)",
      stock: "Stock Status",
      image: "Product Image",
      useUrl: "Use URL",
      uploadFile: "Upload File",
      shortDescAr: "Short Description (Arabic)",
      shortDescEn: "Short Description (English)",
      fullDescAr: "Full Description (Arabic)",
      fullDescEn: "Full Description (English)",
      addProduct: "Add Product",
      updateProduct: "Update Product",
      addingProduct: "Adding Product...",
      updatingProduct: "Updating Product...",
      instructions: "📋 Instructions",
      instructionsList: [
        "Fill in all required fields (marked with *)",
        "Enter product information in both Arabic and English",
        "Image URL should be a direct link to the image file",
        "Make sure your backend is running on",
      ],
      currentInventory: "Current Inventory",
      noProducts: "No products found",
      delete: "Delete",
      edit: "Edit",
      noBadge: "No badge",
      inStock: "In Stock",
      limitedStock: "Limited Stock",
      outOfStock: "Out of Stock",
      bestSeller: "Best Seller",
      newArrival: "New Arrival",
      limitedEdition: "Limited Edition",
      manageSections: "Manage Sections",
      sectionsList: "Sections List",
      productsCount: "Products Count",
      sectionError: "Please select a section",
      editOrder: "Edit Order",
      updateOrder: "Update Order",
      logout: "Logout",
      moveProduct: "Move",
      selectNewSection: "Select New Section",
      confirmMove: "Confirm Move",
      moving: "Moving...",
      productMoved: "✅ Product moved successfully",
    },
  };

  const t = texts[language] || texts.ar;

  // ── Close modals on ESC key ──
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (detailModalState.visible) {
          setDetailModalState({ visible: false, itemId: null, weight: '', karat: '', notes: '', customPrice: '' });
        } else if (showInvoiceModal) {
          setShowInvoiceModal(false);
          setInvoiceItems([]);
          setCustomerName('');
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showInvoiceModal, detailModalState.visible]);

  useEffect(() => {
    fetchProducts();
    fetchSections();

    // ✅ إنشاء Featured Section تلقائياً لو مش موجود
    const createFeaturedSection = async () => {
      try {
        const response = await fetch(SECTION_API_URL);
        const sections = await response.json();

        const hasFeatured = sections.some((s) => s.is_featured);

        if (!hasFeatured) {
          const createResponse = await fetch(SECTION_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title_ar: "المنتجات المميزة",
              title_en: "Featured Products",
              order: 0,
              is_featured: true,
            }),
          });

          if (createResponse.ok) {
            fetchSections(); // تحديث القائمة
          }
        }
      } catch (error) {
        console.error("Error creating featured section:", error);
      }
    };

    createFeaturedSection();
  }, []);

  useEffect(() => {
    if (status.message) {
      const timer = setTimeout(() => {
        setStatus({ type: "", message: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status.message]);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        if (showProductModal) {
          setShowProductModal(false);
          setEditingProductId(null);
          setFormData({
            name_ar: "",
            name_en: "",
            type: "silver",
            karat: "999",
            weight: "",
            show_weight: true,
            manufacturing_cost: "",
            price: "",
            badge: "",
            stock: "In Stock",
            section: "",
            image_url: "",
            description_ar: "",
            description_en: "",
            shortDescription_ar: "",
            shortDescription_en: "",
          });
          setSelectedFile(null);
          setImageType("url");
          setSectionError(false);
        }

        if (showSectionModal) {
          setShowSectionModal(false);
          setSectionFormData({ title_ar: "", title_en: "", order: 1 });
        }

        if (showEditOrderModal) {
          setShowEditOrderModal(false);
          setEditingSectionId(null);
        }
      }
    };

    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [showProductModal, showSectionModal, showEditOrderModal]); // Dependenciesk

  const fetchProducts = async () => {
    try {
      const response = await fetch(API_URL);
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error(
          "Fetch error: Server returned HTML instead of JSON. Check API_URL port.",
        );
        return;
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await fetch(SECTION_API_URL);
      const data = await response.json();
      if (Array.isArray(data)) {
        setSections(data);
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
    }
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(SECTION_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sectionFormData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: "success",
          message:
            language === "ar"
              ? "✅ تم إنشاء القسم بنجاح!"
              : "✅ Section created successfully!",
        });
        setSectionFormData({ title_ar: "", title_en: "", order: 1 });
        setShowSectionModal(false);
        fetchSections();
      } else {
        Modal.error({
          title: language === "ar" ? "❌ فشل الإنشاء" : "❌ Creation Failed",
          content:
            language === "ar"
              ? data.error_ar || data.error || "حدث خطأ"
              : data.error || "Failed to create section",
          centered: true,
          okText: language === "ar" ? "حسناً" : "OK",
        });
      }
    } catch (error) {
      console.error("Error creating section:", error);
      setStatus({ type: "error", message: `❌ Error: ${error.message}` });
    } finally {
      setIsSubmitting(false); // ✅ دايماً يرجع false سواء نجح أو فشل
    }
  };

  // ✅ Delete Section
  const handleDeleteSection = async (id) => {
    const section = sections.find((s) => s.id === id);
    if (section && section.is_featured) {
      Modal.warning({
        title:
          language === "ar"
            ? "⭐ لا يمكن حذف القسم المميز"
            : "⭐ Cannot Delete Featured Section",
        content: (
          <div>
            <p>
              {language === "ar"
                ? "هذا القسم أساسي ومهم للموقع."
                : "This is an essential section for the website."}
            </p>
            <ul style={{ marginTop: "10px", paddingLeft: "20px" }}>
              <li>
                ✅{" "}
                {language === "ar"
                  ? "يمكنك إضافة منتجات جديدة فيه"
                  : "You can add new products to it"}
              </li>
              <li>
                ✅{" "}
                {language === "ar"
                  ? "يمكنك حذف المنتجات منه"
                  : "You can delete products from it"}
              </li>
              <li>
                ❌{" "}
                {language === "ar"
                  ? "لكن لا يمكن حذف القسم نفسه"
                  : "But you cannot delete the section itself"}
              </li>
            </ul>
          </div>
        ),
        centered: true,
        okText: language === "ar" ? "حسناً" : "OK",
      });
      return;
    }

    const sectionProducts = getProductsForSection(id);
    const productsCount = sectionProducts.length;

    Modal.confirm({
      title: language === "ar" ? "تأكيد حذف القسم" : "Confirm Section Delete",
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>
            {language === "ar"
              ? "هل أنت متأكد من حذف هذا القسم؟"
              : "Are you sure you want to delete this section?"}
          </p>
          <p
            style={{
              color: "#ff4d4f",
              marginTop: "10px",
              fontWeight: "600",
              fontSize: "15px",
            }}
          >
            {language === "ar"
              ? `⚠️ تحذير: سيتم نقل ${productsCount} منتج إلى القسم المميز قبل حذف القسم!`
              : `⚠️ Warning: ${productsCount} product${productsCount !== 1 ? "s" : ""} will be reassigned to the Featured section!`}
          </p>
          <p style={{ color: "#8c8c8c", marginTop: "5px", fontSize: "13px" }}>
            {language === "ar"
              ? "لا يمكن التراجع عن هذا الإجراء"
              : "This action cannot be undone"}
          </p>
        </div>
      ),
      okText:
        language === "ar"
          ? "نعم، احذف القسم وانقل المنتجات"
          : "Yes, Delete Section & Reassign Products",
      okType: "danger",
      cancelText: language === "ar" ? "إلغاء" : "Cancel",
      centered: true,
      onOk: async () => {
        try {
          const featuredSection = sections.find((s) => s.is_featured);
          if (featuredSection && sectionProducts.length > 0) {
            await Promise.all(
              sectionProducts.map((p) => {
                const patchData = new FormData();
                patchData.append("section", featuredSection.id);
                return fetch(`${API_URL}${p.id || p._id}/`, {
                  method: "PATCH",
                  body: patchData,
                });
              })
            );
          }

          const response = await fetch(`${SECTION_API_URL}${id}/`, {
            method: "DELETE",
          });

          if (response.ok) {
            setSections((prevSections) =>
              prevSections.filter((s) => s.id !== id),
            );
            const successMsg =
              language === "ar"
                ? `✅ تم حذف القسم ونقل ${productsCount} منتج بنجاح`
                : `✅ Section deleted and ${productsCount} product${productsCount !== 1 ? "s" : ""} reassigned successfully`;

            Modal.success({
              title: language === "ar" ? "🎉 تم الحذف!" : "🎉 Deleted!",
              content: successMsg,
              centered: true,
              okText: language === "ar" ? "حسناً" : "OK",
            });

            fetchProducts(); // Refresh products
          } else {
            const data = await response.json();
            const errorMsg =
              language === "ar"
                ? data.message_ar || data.error || "فشل الحذف"
                : data.message_en || data.error || "Failed to delete";

            Modal.error({
              title: language === "ar" ? "❌ فشل الحذف" : "❌ Delete Failed",
              content: errorMsg,
              centered: true,
              okText: language === "ar" ? "حسناً" : "OK",
            });
          }
        } catch (err) {
          console.error("Error deleting section:", err);

          Modal.error({
            title: language === "ar" ? "❌ خطأ في الاتصال" : "❌ Network Error",
            content: err.message,
            centered: true,
            okText: language === "ar" ? "حسناً" : "OK",
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
        title: language === "ar" ? "❌ ترتيب غير صحيح" : "❌ Invalid Order",
        content:
          language === "ar"
            ? "الترتيب 0 محجوز للقسم المميز، اختر رقم من 1 فأكثر"
            : "Order 0 is reserved for the featured section, choose 1 or higher",
        centered: true,
        okText: language === "ar" ? "حسناً" : "OK",
      });
      return;
    }

    try {
      const response = await fetch(`${SECTION_API_URL}${editingSectionId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order: editOrderValue }),
      });

      const data = await response.json();

      if (response.ok) {
        Modal.success({
          title: language === "ar" ? "🎉 تم التحديث!" : "🎉 Updated!",
          content:
            language === "ar"
              ? "✅ تم تحديث الترتيب بنجاح!"
              : "✅ Order updated successfully!",
          centered: true,
          okText: language === "ar" ? "حسناً" : "OK",
        });

        setShowEditOrderModal(false);
        setEditingSectionId(null);
        fetchSections();
      } else {
        Modal.error({
          title: language === "ar" ? "❌ فشل التحديث" : "❌ Update Failed",
          content:
            language === "ar"
              ? data.error_ar || data.error || "حدث خطأ"
              : data.error || "An error occurred",
          centered: true,
          okText: language === "ar" ? "حسناً" : "OK",
        });
      }
    } catch (error) {
      console.error("Error updating section order:", error);
      Modal.error({
        title: language === "ar" ? "❌ خطأ في الاتصال" : "❌ Network Error",
        content: error.message,
        centered: true,
        okText: language === "ar" ? "حسناً" : "OK",
      });
    }
  };
  const toggleSectionExpansion = (sectionId) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId],
    );
  };

  const getProductsForSection = (sectionId) => {
    return products.filter((product) => product.section === sectionId);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "type") {
      setFormData((prev) => ({
        ...prev,
        type: value,
        karat: value === "gold" ? "21K" : value === "silver" ? "999" : "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDelete = async (id) => {
    const productToDelete = products.find((p) => (p._id || p.id) === id);
    const featuredSection = sections.find((s) => s.is_featured);
    const isFeatured = productToDelete && featuredSection && String(productToDelete.section) === String(featuredSection.id);

    Modal.confirm({
      title: language === "ar" ? "تأكيد الإزالة" : "Confirm Removal",
      icon: <ExclamationCircleOutlined />,
      content:
        language === "ar"
          ? (isFeatured ? "هل أنت متأكد من حذف هذا المنتج نهائياً من قاعدة البيانات؟ لا يمكن التراجع." : "سيتم إزالة هذا المنتج من القسم الحالي ونقله تلقائياً إلى القسم المميز، ولن يتم حذفه نهائياً.")
          : (isFeatured ? "Are you sure you want to permanently delete this product? This action cannot be undone." : "This product will be removed from its current section and moved to the Featured Products section. It will not be permanently deleted."),
      okText: language === "ar"
        ? (isFeatured ? "نعم، احذف نهائياً" : "نعم، انقله للقسم المميز")
        : (isFeatured ? "Yes, Delete Permanently" : "Yes, Move to Featured"),
      okType: "danger",
      cancelText: language === "ar" ? "إلغاء" : "Cancel",
      centered: true,
      onOk: async () => {
        try {
          if (!isFeatured && featuredSection) {
            const patchUrl = `${API_URL}${id}/`;

            const patchData = new FormData();
            patchData.append("section", featuredSection.id);

            const response = await fetch(patchUrl, {
              method: "PATCH",
              body: patchData,
            });

            if (response.ok) {
              const successMsg = language === "ar"
                ? "✅ تم نقل المنتج إلى القسم المميز بنجاح"
                : "✅ Product successfully moved to the Featured section";

              Modal.success({
                title: language === "ar" ? "ℹ️ تم النقل!" : "ℹ️ Moved!",
                content: successMsg,
                centered: true,
                okText: language === "ar" ? "حسناً" : "OK",
              });

              fetchProducts();
            } else {
              const data = await response.json();
              Modal.error({
                title: language === "ar" ? "❌ فشل النقل" : "❌ Move Failed",
                content: data.message || "Error",
                centered: true,
                okText: language === "ar" ? "حسناً" : "OK",
              });
            }
            return;
          }

          const deleteUrl = `${API_URL}${id}/`;
          const response = await fetch(deleteUrl, {
            method: "DELETE",
          });

          if (response.ok) {
            setProducts((prevProducts) =>
              prevProducts.filter((p) => (p._id || p.id) !== id),
            );
            const successMsg =
              language === "ar"
                ? "✅ تم حذف المنتج بنجاح"
                : "✅ Product deleted successfully";

            Modal.success({
              title: language === "ar" ? "🎉 تم الحذف!" : "🎉 Deleted!",
              content: successMsg,
              centered: true,
              okText: language === "ar" ? "حسناً" : "OK",
            });

            fetchProducts();
          } else {
            const data = await response.json();

            Modal.error({
              title: language === "ar" ? "❌ فشل الحذف" : "❌ Delete Failed",
              content:
                data.message ||
                (language === "ar"
                  ? "حدث خطأ أثناء الحذف"
                  : "An error occurred while deleting"),
              centered: true,
              okText: language === "ar" ? "حسناً" : "OK",
            });
          }
        } catch (err) {
          console.error("Error deleting product:", err);

          Modal.error({
            title: language === "ar" ? "❌ خطأ في الاتصال" : "❌ Network Error",
            content: err.message,
            centered: true,
            okText: language === "ar" ? "حسناً" : "OK",
          });
        }
      },
    });
  };
  const handleMoveProductSubmit = async () => {
    if (!newSectionForMove || !productToMove) {
      Modal.error({ title: language === 'ar' ? 'خطأ' : 'Error', content: language === 'ar' ? 'الرجاء تحديد قسم' : 'Please select a section', centered: true });
      return;
    }
    setIsMovingProduct(true);
    try {
      const form = new FormData();
      form.append("section", newSectionForMove);

      const response = await fetch(`${API_URL}${productToMove.id || productToMove._id}/`, {
        method: "PATCH",
        body: form,
      });

      if (response.ok) {
        Modal.success({
          title: language === 'ar' ? '🎉 تم النقل!' : '🎉 Moved!',
          content: t.productMoved,
          centered: true,
          okText: language === "ar" ? "حسناً" : "OK",
        });
        setShowMoveProductModal(false);
        setProductToMove(null);
        setNewSectionForMove("");
        fetchProducts(); // Refresh products
      } else {
        const data = await response.json();
        Modal.error({ title: language === 'ar' ? '❌ خطأ' : '❌ Error', content: data.error || data.message || 'Failed to move product', centered: true });
      }
    } catch (err) {
      Modal.error({ title: language === 'ar' ? '❌ خطأ في الاتصال' : '❌ Network Error', content: err.message, centered: true });
    } finally {
      setIsMovingProduct(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.section) {
      setSectionError(true);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const form = new FormData();

      // ✅ إضافة البيانات بحقول اللغتين
      form.append("name_ar", formData.name_ar);
      form.append("name_en", formData.name_en);
      form.append("type", formData.type);
      form.append("karat", formData.karat || "");
      form.append("weight", Number(formData.weight));
      form.append("show_weight", formData.show_weight ? "True" : "False");
      form.append("manufacturing_cost", Number(formData.manufacturing_cost));
      form.append("price", Number(formData.price));
      form.append("badge", formData.badge || "");
      form.append("stock", formData.stock);
      form.append("section", formData.section);
      form.append("description_ar", formData.description_ar);
      form.append("description_en", formData.description_en);
      form.append("shortDescription_ar", formData.shortDescription_ar);
      form.append("shortDescription_en", formData.shortDescription_en);

      // إضافة الصورة
      if (imageType === "file" && selectedFile) {
        // ✅ رفع على Cloudinary مباشرة
        const cloudinaryForm = new FormData();
        cloudinaryForm.append("file", selectedFile);
        cloudinaryForm.append("upload_preset", "saudi_silver_upload");

        const cloudRes = await fetch(
          "https://api.cloudinary.com/v1_1/dpiwfb3sr/image/upload",
          { method: "POST", body: cloudinaryForm },
        );
        const cloudData = await cloudRes.json();

        if (!cloudData.secure_url) {
          Modal.error({
            title:
              language === "ar"
                ? "❌ فشل رفع الصورة"
                : "❌ Image Upload Failed",
            content:
              language === "ar"
                ? "تعذر رفع الصورة على Cloudinary"
                : "Failed to upload image to Cloudinary",
            centered: true,
          });
          setIsSubmitting(false);
          return;
        }

        form.append("image_url", cloudData.secure_url);
      } else if (imageType === "url" && formData.image_url) {
        form.append("image_url", formData.image_url);
      }

      const method = editingProductId ? "PUT" : "POST";
      const url = editingProductId ? `${API_URL}${editingProductId}/` : API_URL;

      const response = await fetch(url, {
        method: method,
        body: form,
      });

      let data;
      try {
        data = await response.json();
      } catch (err) {
        console.error("❌ Failed to parse response:", err);
        setStatus({
          type: "error",
          message: "❌ Server returned invalid response",
        });
        setIsSubmitting(false);
        return;
      }

      if (response.ok) {
        const successMsg = editingProductId
          ? language === "ar"
            ? "✅ تم تحديث المنتج بنجاح!"
            : "✅ Product updated successfully!"
          : language === "ar"
            ? "✅ تم إضافة المنتج بنجاح!"
            : "✅ Product added successfully!";

        Modal.success({
          title: language === "ar" ? "🎉 تم بنجاح!" : "🎉 Success!",
          content: successMsg,
          centered: true,
          okText: language === "ar" ? "حسناً" : "OK",
          onOk: () => {
            // إعادة تعيين النموذج
            setFormData({
              name_ar: "",
              name_en: "",
              type: "silver",
              weight: "",
              manufacturing_cost: "",
              price: "",
              badge: "",
              stock: "In Stock",
              section: "",
              image_url: "",
              description_ar: "",
              description_en: "",
              shortDescription_ar: "",
              shortDescription_en: "",
            });
            setSelectedFile(null);
            setEditingProductId(null);
            setImageType("url");
            setShowProductModal(false);

            fetchProducts();
          },
        });
      } else {
        console.error("❌ Backend error:", data);
        const errorMsg = data.error || data.message || "Failed to save product";

        // ✅ عرض Error Modal
        Modal.error({
          title: language === "ar" ? "❌ حدث خطأ" : "❌ Error Occurred",
          content:
            typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg),
          centered: true,
          okText: language === "ar" ? "حسناً" : "OK",
        });
      }
    } catch (error) {
      console.error("❌ Error submitting product:", error);

      // ✅ عرض Network Error Modal
      Modal.error({
        title: language === "ar" ? "❌ خطأ في الاتصال" : "❌ Network Error",
        content: error.message,
        centered: true,
        okText: language === "ar" ? "حسناً" : "OK",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const PRICES_API_URL = "https://omarawad9.pythonanywhere.com/api/metal-prices/";

  const [allPrices, setAllPrices] = useState(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceEditData, setPriceEditData] = useState({
    metal: "gold",
    base_buy_price: 0,
    spread: 0,
  });

  const fetchPrices = async () => {
    try {
      const response = await fetch(PRICES_API_URL);
      const data = await response.json();
      setAllPrices(data);
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  };

  const BADGES_API_URL = "https://omarawad9.pythonanywhere.com/api/badges/";

  const fetchBadges = async () => {
    try {
      const response = await fetch(BADGES_API_URL);
      const data = await response.json();
      if (Array.isArray(data)) setCustomBadges(data);
    } catch (error) {
      console.error("Error fetching badges:", error);
    }
  };

  const handleSaveBadge = async () => {
    if (!newBadgeNameAr.trim() || !newBadgeNameEn.trim()) return;
    setIsSavingBadge(true);
    try {
      const response = await fetch(BADGES_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name_ar: newBadgeNameAr.trim(),
          name_en: newBadgeNameEn.trim(),
          color: newBadgeColor
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setCustomBadges((prev) => [...prev, data]);
        setFormData((prev) => ({ ...prev, badge: language === 'ar' ? data.name_ar : data.name_en }));
        setNewBadgeNameAr('');
        setNewBadgeNameEn('');
        setNewBadgeColor('#667eea'); // ← ضيف ده كمان عشان يعمل reset للون
        setShowBadgeModal(false);
      } else {
        Modal.error({
          title: language === 'ar' ? '❌ خطأ' : '❌ Error',
          content: data.error || 'Failed to save badge',
          centered: true,
        });
      }
    } catch (err) {
      Modal.error({ title: '❌ Network Error', content: err.message, centered: true });
    } finally {
      setIsSavingBadge(false);
    }
  };

  const handleUpdateBadge = async () => {
    if (!newBadgeNameAr.trim() || !newBadgeNameEn.trim() || !editingBadgeId) return;
    setIsSavingBadge(true);
    try {
      // Find the old badge name before we delete it
      const oldBadge = customBadges.find(b => b.id === editingBadgeId);
      const nameChanged = oldBadge && (
        oldBadge.name_ar !== newBadgeNameAr.trim() ||
        oldBadge.name_en !== newBadgeNameEn.trim()
      );

      // 1. Delete the old badge
      await fetch(`${BADGES_API_URL}${editingBadgeId}/`, { method: "DELETE" });

      // 2. Post the new badge
      const postResponse = await fetch(BADGES_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name_ar: newBadgeNameAr.trim(),
          name_en: newBadgeNameEn.trim(),
          color: newBadgeColor
        }),
      });
      const data = await postResponse.json();

      if (postResponse.ok) {
        // Update local state by removing old and adding new
        setCustomBadges((prev) => [...prev.filter(b => b.id !== editingBadgeId), data]);

        // 3. Patch affected products ONLY if the name changed
        if (nameChanged) {
          const affected = products.filter(p => p.badge === oldBadge?.name_ar || p.badge === oldBadge?.name_en);
          for (const p of affected) {
            try {
              const form = new FormData();
              form.append("badge", language === 'ar' ? newBadgeNameAr.trim() : newBadgeNameEn.trim());
              await fetch(`${API_URL}${p.id || p._id}/`, { method: "PATCH", body: form });
            } catch (e) { console.error('Error updating product badge:', e); }
          }
          fetchProducts(); // Refresh after patching
        }

        setNewBadgeNameAr('');
        setNewBadgeNameEn('');
        setNewBadgeColor('#667eea');
        setEditingBadgeId(null);
        setBadgeModalView('list');
      } else {
        Modal.error({
          title: language === 'ar' ? '❌ خطأ' : '❌ Error',
          content: data.error || 'Failed to update badge',
          centered: true,
        });
      }
    } catch (err) {
      Modal.error({ title: '❌ Network Error', content: err.message, centered: true });
    } finally {
      setIsSavingBadge(false);
    }
  };

  const handleDeleteBadge = async () => {
    if (!badgeToDelete) return;
    setIsSavingBadge(true);
    try {
      // 1. Remove badge from affected products using robust PATCH
      const affected = products.filter(p => p.badge === badgeToDelete.name_ar || p.badge === badgeToDelete.name_en);
      for (const p of affected) {
        try {
          const form = new FormData();
          form.append("badge", ""); // Remove the badge assignment securely
          await fetch(`${API_URL}${p.id || p._id}/`, { method: "PATCH", body: form });
        } catch (e) { console.error('Error updating affected product:', e); }
      }

      fetchProducts(); // Refresh local products list

      // 2. Delete the badge itself
      const response = await fetch(`${BADGES_API_URL}${badgeToDelete.id}/`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCustomBadges((prev) => prev.filter(b => b.id !== badgeToDelete.id));
        setBadgeToDelete(null);
        setBadgeModalView('list');
      } else {
        try {
          const data = await response.json();
          Modal.error({ title: language === 'ar' ? '❌ خطأ' : '❌ Error', content: data.error || 'Failed to delete badge', centered: true });
        } catch { /* IGNORE PARSE ERROR */ }
      }
    } catch (err) {
      Modal.error({ title: '❌ Network Error', content: err.message, centered: true });
    } finally {
      setIsSavingBadge(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSections();
    fetchPrices();
    fetchBadges();
  }, []);

  const handleUpdatePrices = async () => {
    try {
      const response = await fetchWithAuth(PRICES_API_URL, {
        method: "PUT",
        body: JSON.stringify(priceEditData),
      });


      // ⚠️ تعريف data بعد ما response جاهز
      const data = await response.json();

      if (response.ok) {
        Modal.success({
          title: language === "ar" ? "✅ تم التحديث!" : "✅ Updated!",
          content: language === "ar" ? "تم تحديث الأسعار بنجاح" : "Prices updated successfully",
          centered: true,
        });
        setShowPriceModal(false);
        fetchPrices();
        fetchProducts(); // Refresh products if needed
      } else {
        Modal.error({
          title: language === "ar" ? "❌ خطأ" : "❌ Error",
          content: data.message || (language === "ar" ? "فشل التحديث" : "Update failed"),
          centered: true,
        });
      }
    } catch (error) {
      console.error("Error updating prices:", error);
      Modal.error({
        title: language === "ar" ? "❌ خطأ في الاتصال" : "❌ Network Error",
        content: error.message,
        centered: true,
      });
    }
  };

  const getLivePreview = () => {
    const { metal, base_buy_price } = priceEditData;
    const bb = parseInt(base_buy_price) || 0;

    if (metal === 'gold') {
      return [
        { label: '24K', price: Math.round(bb * (24 / 21)) },
        { label: '21K', price: bb },
        { label: '18K', price: Math.round(bb * (18 / 21)) },
      ];
    } else {
      return [
        { label: '999', price: bb },
        { label: '925', price: Math.round(bb * (925 / 999)) },
        { label: '800', price: Math.round(bb * (800 / 999)) },
      ];
    }
  };

  const columns = [
    {
      title: t.sectionTitleAr,
      dataIndex: "title_ar",
      key: "title_ar",
      ...getColumnSearchProps("title_ar", t.sectionTitleAr),
      render: (text, record) => (
        <span
          onClick={() => toggleSectionExpansion(record.id)}
          style={{ cursor: "pointer" }}
        >
          {text}
          {record.is_featured && (
            <span
              style={{
                marginLeft: "8px",
                background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
                color: "#856404",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: "bold",
              }}
            >
              {t.featured}
            </span>
          )}
        </span>
      ),
    },
    {
      title: t.sectionTitleEn,
      dataIndex: "title_en",
      key: "title_en",
      ...getColumnSearchProps("title_en", t.sectionTitleEn),
    },
    {
      title: t.sectionOrder,
      dataIndex: "order",
      key: "order",
      sorter: (a, b) => a.order - b.order,
      render: (order, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontWeight: "600", fontSize: "16px" }}>{order}</span>
          {!record.is_featured ? (
            <Button
              size="small"
              type="primary"
              onClick={() => {
                setEditingSectionId(record.id);
                setEditOrderValue(record.order);
                setShowEditOrderModal(true);
              }}
              style={{ fontSize: "12px" }}
            >
              {t.editOrder}
            </Button>
          ) : (
            <span
              style={{
                display: "inline-block",
                padding: "4px 8px",
                background: "#f8f9fa",
                color: "#6c757d",
                borderRadius: "4px",
                fontSize: "11px",
                fontStyle: "italic",
              }}
            >
              🔒 {language === "ar" ? "ثابت" : "Fixed"}
            </span>
          )}
        </div>
      ),
    },
    {
      title: t.productsCount,
      key: "productsCount",
      render: (_, record) => {
        const count = getProductsForSection(record.id).length;
        return (
          <span
            style={{
              background: "#e3f2fd",
              color: "#1976d2",
              padding: "4px 12px",
              borderRadius: "12px",
              fontWeight: "600",
              fontSize: "14px",
            }}
          >
            {count}
          </span>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) =>
        record.is_featured ? (
          <span
            style={{
              display: "inline-block",
              padding: "8px 12px",
              background: "#f8f9fa",
              color: "#6c757d",
              borderRadius: "6px",
              fontSize: "12px",
              fontStyle: "italic",
            }}
          >
            {t.cannotDelete}
          </span>
        ) : (
          <Button
            danger
            onClick={() => handleDeleteSection(record.id)}
            style={{ width: "90%" }}
          >
            {t.delete}
          </Button>
        ),
    },
  ];

  const urlToBase64 = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const [logoBase64, setLogoBase64] = useState(null);

  useEffect(() => {
    urlToBase64('/Saudi_Silver_Logo.png').then(b64 => setLogoBase64(b64));
  }, []);

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

        {/* 📈 Price Management Dashboard */}
        <section className="price-dashboard" style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#1a1a1a', margin: 0 }}>
              💰 {language === 'ar' ? 'إدارة الأسعار' : 'Price Management'}
            </h2>
            <Button
              type="primary"
              onClick={() => {
                setPriceEditData({
                  metal: 'gold',
                  base_buy_price: allPrices?.karat_21_buy || 0,
                  spread: (allPrices?.karat_21_sell - allPrices?.karat_21_buy) || 0
                });
                setShowPriceModal(true);
              }}
              style={{ background: '#d4af37', borderColor: '#d4af37', color: '#1a1a1a', fontWeight: 'bold' }}
            >
              {language === 'ar' ? 'تعديل الأسعار' : 'Edit Prices'}
            </Button>
          </div>

          <div className="price-management-grid">
            {/* Gold Column */}
            <div className="price-column">
              <h3 style={{ color: '#d4af37', borderBottom: '2px solid #d4af37', paddingBottom: '10px' }}>
                {language === 'ar' ? 'الذهب' : 'Gold'}
              </h3>
              <div className="price-cards-grid">
                {[
                  { label: '24K', price: allPrices?.karat_24_buy },
                  { label: '21K', price: allPrices?.karat_21_buy },
                  { label: '18K', price: allPrices?.karat_18_buy },
                ].map(item => (
                  <div key={item.label} className="price-card-mini" style={{ background: '#fffcf0', border: '1px solid #f0e2b6', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '8px', color: '#d4af37' }}>
                      {item.label}
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '1rem', color: '#2c3e50' }}>
                      {item.price || 0}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                      {language === 'ar' ? 'جنيه' : 'EGP'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Silver Column */}
            <div className="price-column">
              <h3 style={{ color: '#555', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
                {language === 'ar' ? 'الفضة' : 'Silver'}
              </h3>
              <div className="price-cards-grid">
                {[
                  { label: '999', price: allPrices?.fine_999_buy },
                  { label: '925', price: allPrices?.fine_925_buy },
                  { label: '800', price: allPrices?.fine_800_buy },
                ].map(item => (
                  <div key={item.label} className="price-card-mini" style={{ background: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '8px', color: '#555' }}>
                      {item.label}
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '1rem', color: '#2c3e50' }}>
                      {item.price || 0}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                      {language === 'ar' ? 'جنيه' : 'EGP'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ✅ Section Selection & Creation */}
        <div
          style={{
            display: "flex",
            gap: "15px",
            justifyContent: "center",
            marginBottom: "30px",
            flexWrap: "wrap", // ✅ عشان على موبايل ميتقطعش
          }}
        >
          <button
            type="button"
            onClick={() => setShowProductModal(true)}
            style={{
              background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
              color: "white",
              border: "none",
              padding: "14px 32px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "18px",
              boxShadow: "0 4px 15px rgba(40, 167, 69, 0.3)",
            }}
          >
            {t.createProduct}
          </button>

          <button
            type="button"
            onClick={() => setShowSectionModal(true)}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              padding: "14px 32px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "18px",
              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
            }}
          >
            {t.createSection}
          </button>

          {/* ✅ زرار الفاتورة الجديد */}
          <button
            type="button"
            onClick={() => {
              setShowInvoiceModal(true);
              setInvoiceLanguage(language);
              setCustomerName('');
            }}
            style={{
              background:
                "linear-gradient(135deg, #C9A84C 0%, #f5e6c0 50%, #C9A84C 100%)",
              color: "#1a1208",
              border: "none",
              padding: "14px 32px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "18px",
              boxShadow: "0 4px 15px rgba(201, 168, 76, 0.4)",
            }}
          >
            📄 {language === "ar" ? "إنشاء فاتورة" : "Create Invoice"}
          </button>
        </div>

        {/* ✅ Move Product Modal */}
        {showMoveProductModal && productToMove && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
          }}>
            <div style={{
              background: 'white', padding: '30px', borderRadius: '12px',
              maxWidth: '400px', width: '100%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}>
              <h3 style={{ marginBottom: '20px', color: '#1a1a1a', fontSize: '20px', fontWeight: '700' }}>
                🔄 {t.moveProduct}: {language === 'ar' ? (productToMove.name_ar || productToMove.name) : (productToMove.name_en || productToMove.name)}
              </h3>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>{t.selectNewSection}</label>
                <select
                  value={newSectionForMove}
                  onChange={(e) => setNewSectionForMove(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                >
                  <option value="" disabled>-- {t.selectSection} --</option>
                  {sections.filter(s => s.id !== productToMove.section).map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {language === 'ar' ? sec.title_ar : sec.title_en}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setShowMoveProductModal(false);
                    setProductToMove(null);
                    setNewSectionForMove("");
                  }}
                  style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#f1f1f1", cursor: "pointer", fontWeight: "600", color: "#333" }}
                  disabled={isMovingProduct}
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleMoveProductSubmit}
                  style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #17a2b8 0%, #117a8b 100%)", color: "white", cursor: "pointer", fontWeight: "600" }}
                  disabled={isMovingProduct}
                >
                  {isMovingProduct ? t.moving : t.confirmMove}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Invoice Modal */}
        {showInvoiceModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
          }}>
            <div style={{
              position: 'relative',
              background: 'white', padding: '30px', borderRadius: '12px',
              maxWidth: '900px', width: '100%', maxHeight: '140vh', overflow: 'auto',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}>
              <h3 style={{ marginBottom: '20px', color: '#1a1208', fontSize: '22px', fontWeight: '700' }}>
                📄 {language === 'ar' ? 'إنشاء فاتورة' : 'Create Invoice'}
              </h3>

              {/* ── إضافة منتج ── */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>

                {/* DDL من الداتابيز */}
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>
                    {language === 'ar' ? 'اختر من المنتجات' : 'Select from products'}
                  </label>
                  <select
                    onChange={(e) => {
                      const product = products.find(p => p.id === parseInt(e.target.value));
                      if (product) {
                        setInvoiceItems(prev => {
                          const exists = prev.find(i => i.id === product.id);
                          if (exists) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
                          return [...prev, {
                            id: product.id,
                            name: language === 'ar' ? (product.name_ar || product.name) : (product.name_en || product.name),
                            price: product.price,
                            originalPrice: product.price,
                            image_url: product.image_url,
                            quantity: 1,
                            fromDB: true
                          }];
                        });
                        e.target.value = '';
                      }
                    }}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #C9A84C', fontSize: '14px' }}
                    defaultValue=""
                  >
                    <option value="" disabled>{language === 'ar' ? '-- اختر منتج --' : '-- Select product --'}</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {language === 'ar' ? (p.name_ar || p.name) : (p.name_en || p.name)} — ${p.price}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ── قائمة المنتجات المختارة ── */}
              {invoiceItems.length > 0 && (
                <div style={{ marginBottom: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                  {invoiceItems.map((item, idx) => (
                    <div key={item.id} className="invoice-item-row" style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 14px',
                      borderBottom: idx < invoiceItems.length - 1 ? '1px solid #f0f0f0' : 'none',
                      background: idx % 2 === 0 ? '#fafafa' : 'white'
                    }}>
                      <span style={{ flex: 3, fontWeight: '600', fontSize: '14px' }}>{item.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button onClick={() => setInvoiceItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))}
                          style={{ width: '28px', height: '28px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', background: 'white', fontWeight: '700' }}>−</button>
                        <span style={{ width: '24px', textAlign: 'center', fontWeight: '600' }}>{item.quantity}</span>
                        <button onClick={() => setInvoiceItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))}
                          style={{ width: '28px', height: '28px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', background: 'white', fontWeight: '700' }}>+</button>
                      </div>
                      <span style={{ fontWeight: '700', color: '#C9A84C', minWidth: '60px', textAlign: 'right' }}>
                        ${((Math.ceil(item.price / 5) * 5) * item.quantity).toLocaleString()}
                      </span>
                      <button
                        onClick={() => {
                          setDetailModalState({
                            visible: true,
                            itemId: item.id,
                            weight: item.weight || '',
                            karat: item.karat || '',
                            notes: item.notes || '',
                            customPrice: item.customPrice || ''
                          });
                        }}
                        style={{ background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                      >
                        {language === 'ar' ? 'تفاصيل' : 'Details'}
                      </button>
                      <button onClick={() => setInvoiceItems(prev => prev.filter(i => i.id !== item.id))}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: '700' }}>
                        <DeleteFilled />
                      </button>
                    </div>
                  ))}

                  {/* الإجمالي */}
                  <div style={{ padding: '12px 14px', background: '#f5e6c8', color: '#5a3e00', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '16px' }}>
                    <span>{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                    <span>${invoiceItems.reduce((acc, i) => acc + (Math.ceil(i.price / 5) * 5) * i.quantity, 0).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Customer Name and Language */}
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>
                    {language === 'ar' ? 'اسم العميل' : 'Customer Name'} <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder={language === 'ar' ? 'الاسم' : 'Name'}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '14px' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>
                    {language === 'ar' ? 'لغة الفاتورة' : 'Invoice Language'}
                  </label>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      onClick={() => setInvoiceLanguage('ar')}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: invoiceLanguage === 'ar' ? '2px solid #C9A84C' : '1px solid #e0e0e0', background: invoiceLanguage === 'ar' ? '#fcf9f2' : 'white', cursor: 'pointer', fontWeight: '600' }}
                    >
                      عربي
                    </button>
                    <button
                      onClick={() => setInvoiceLanguage('en')}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: invoiceLanguage === 'en' ? '2px solid #C9A84C' : '1px solid #e0e0e0', background: invoiceLanguage === 'en' ? '#fcf9f2' : 'white', cursor: 'pointer', fontWeight: '600' }}
                    >
                      English
                    </button>
                  </div>
                </div>
              </div>

              {/* Detail Modal Overlay */}
              {detailModalState.visible && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0,0,0,0.7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 2000, borderRadius: '0'
                }}>
                  <div style={{
                    background: 'white', padding: '20px', borderRadius: '8px',
                    width: '90%', maxWidth: '400px', border: '1px solid #e0e0e0',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}>
                    <h4 style={{ marginBottom: '15px', color: '#1a1208', fontWeight: '700', fontSize: '18px' }}>
                      {language === 'ar' ? 'تفاصيل العنصر' : 'Item Details'}
                    </h4>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>{language === 'ar' ? 'الوزن (جرام)' : 'Weight (g)'}</label>
                      <input type="number" min="0" onKeyDown={e => { if (e.key === '-') e.preventDefault(); }}
                        value={detailModalState.weight}
                        onChange={e => setDetailModalState(prev => ({ ...prev, weight: e.target.value }))}
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>{language === 'ar' ? 'العيار ' : 'Karat (k)'}</label>
                      <input type="text" placeholder={language === 'ar' ? 'مثال: 21K' : 'e.g. 21K'}
                        value={detailModalState.karat}
                        onChange={e => setDetailModalState(prev => ({ ...prev, karat: e.target.value }))}
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>{language === 'ar' ? 'ملاحظات' : 'Notes'}</label>
                      <input type="text"
                        value={detailModalState.notes}
                        onChange={e => setDetailModalState(prev => ({ ...prev, notes: e.target.value }))}
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>
                        {language === 'ar' ? 'سعر مخصص' : 'Custom Price'}
                      </label>
                      <input type="number" step="0.01" min="0" onKeyDown={e => { if (e.key === '-') e.preventDefault(); }}
                        placeholder={language === 'ar' ? 'يترك فارغاً لاعتبار السعر الأصلي' : 'Leave empty for original price'}
                        value={detailModalState.customPrice}
                        onChange={e => setDetailModalState(prev => ({ ...prev, customPrice: e.target.value }))}
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '6px' }}
                      />
                      <span style={{ fontSize: '12px', color: '#666', display: 'block', lineHeight: '1.4' }}>
                        {language === 'ar'
                          ? 'ملاحظة: إذا أدخلت هذا السعر فسيكون هو السعر النهائي الخاص بهذا المنتج في الفاتورة. اتركه فارغاً لاستخدام سعر الموقع الأصلي.'
                          : 'Note: If entered, this will be the final price in the invoice. If empty, the original site price will be used.'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setDetailModalState({ visible: false, itemId: null, weight: '', karat: '', notes: '', customPrice: '' })} style={{ padding: '8px 16px', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                      <button onClick={() => {
                        setInvoiceItems(prev => prev.map(i => {
                          if (i.id === detailModalState.itemId) {
                            return {
                              ...i,
                              weight: detailModalState.weight,
                              karat: detailModalState.karat,
                              notes: detailModalState.notes,
                              customPrice: detailModalState.customPrice,
                              price: detailModalState.customPrice && !isNaN(parseFloat(detailModalState.customPrice))
                                ? parseFloat(detailModalState.customPrice)
                                : i.originalPrice
                            };
                          }
                          return i;
                        }));
                        setDetailModalState({ visible: false, itemId: null, weight: '', karat: '', notes: '', customPrice: '' });
                      }} style={{ padding: '8px 16px', background: '#C9A84C', color: '#1a1208', fontWeight: '700', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{language === 'ar' ? 'حفظ' : 'Save'}</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── الأزرار ── */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowInvoiceModal(false); setInvoiceItems([]); setCustomerName(''); }}
                  style={{ background: '#6c757d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  disabled={invoiceItems.length === 0 || isGenerating || !customerName.trim()}
                  onClick={async () => {
                    setIsGenerating(true);
                    try {
                      const itemsWithBase64 = await Promise.all(
                        invoiceItems.map(async (item) => {
                          if (item.image_url && item.image_url.startsWith('https://')) {
                            const base64 = await urlToBase64(item.image_url);
                            return { ...item, image_url: base64 || null };
                          }
                          return item;
                        })
                      );

                      const blob = await pdf(
                        <InvoiceDocument
                          items={itemsWithBase64}
                          language={invoiceLanguage}
                          customerName={customerName}
                          fallbackImage={logoBase64}
                        />
                      ).toBlob();

                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `elsaudi-jewelry-invoice-${Date.now()}.pdf`;
                      link.click();
                      URL.revokeObjectURL(url);

                    } catch (error) {
                      console.error('Error generating PDF:', error);
                      Modal.error({
                        title: language === 'ar' ? '❌ خطأ' : '❌ Error',
                        content: language === 'ar' ? 'فشل توليد الفاتورة' : 'Failed to generate invoice',
                        centered: true,
                      });
                    } finally {
                      setIsGenerating(false);
                    }
                  }}
                  style={{
                    background: (invoiceItems.length === 0 || isGenerating || !customerName.trim()) ? '#ccc' : 'linear-gradient(135deg, #C9A84C, #f5e6c0)',
                    color: '#1a1208', border: 'none', padding: '10px 24px',
                    borderRadius: '8px',
                    cursor: (invoiceItems.length === 0 || isGenerating || !customerName.trim()) ? 'not-allowed' : 'pointer',
                    fontWeight: '700', fontSize: '16px',
                    opacity: isGenerating ? 0.7 : 1,
                  }}
                >
                  {isGenerating
                    ? (language === 'ar' ? '⏳ جاري التوليد...' : '⏳ Generating...')
                    : `📄 ${language === 'ar' ? 'توليد الفاتورة' : 'Generate Invoice'}`
                  }
                </button>
              </div>
            </div>
          </div>
        )}


        {/* ✅ Product Creation Modal */}
        {showProductModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              overflow: "auto",
              padding: "20px",
            }}
          >
            <div
              style={{
                background: "white",
                padding: "30px",
                borderRadius: "12px",
                maxWidth: "800px",
                width: "100%",
                maxHeight: "90vh",
                overflow: "auto",
                boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              }}
            >
              <h3
                style={{
                  marginBottom: "20px",
                  color: "#2c3e50",
                  fontSize: "24px",
                  fontWeight: "700",
                }}
              >
                {editingProductId
                  ? language === "ar"
                    ? "🔄 تعديل المنتج"
                    : "🔄 Edit Product"
                  : language === "ar"
                    ? "➕ إضافة منتج جديد"
                    : "➕ Add New Product"}
              </h3>

              <form
                onSubmit={handleSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                {/* Section Selection
                <div ref={sectionRef} className="form-group">
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "600",
                      color: "#2c3e50",
                    }}
                  >
                    {t.selectSection}
                    <span style={{ marginLeft: "4px", color: "#e74c3c" }}>
                      *
                    </span>
                  </label>
                  <select
                    required
                    value={formData.section}
                    onChange={(e) => {
                      setFormData({ ...formData, section: e.target.value });
                      setSectionError(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 15px",
                      borderRadius: "8px",
                      border: sectionError
                        ? "2px solid #e74c3c"
                        : "2px solid #e0e0e0",
                      fontSize: "16px",
                      background: "white",
                    }}
                  >
                    <option value="" disabled>
                      {t.noSection}
                    </option>
                    {sections
                      .filter((s) => !s.is_featured)
                      .map((section) => (
                        <option key={section.id} value={section.id}>
                          {language === "ar"
                            ? section.title_ar
                            : section.title_en}
                        </option>
                      ))}
                  </select>
                  {sectionError && (
                    <span
                      style={{
                        color: "#e74c3c",
                        fontSize: "14px",
                        marginTop: "6px",
                        display: "block",
                      }}
                    >
                      {t.sectionError}
                    </span>
                  )}
                </div> */}

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
                  <label
                    htmlFor="type"
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "600",
                      color: "#2c3e50",
                      fontSize: "16px",
                    }}
                  >
                    {language === "ar" ? "نوع المعدن" : "Metal Type"}
                    <span style={{ marginLeft: "4px", color: "#000000" }}>
                      *
                    </span>
                  </label>

                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      padding: "14px 18px",
                      borderRadius: "10px",
                      border: "2px solid #e0e0e0",
                      fontSize: "16px",
                      background: "white",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      fontWeight: "500",
                      color: "#2c3e50",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#d4af37";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(102, 126, 234, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e0e0e0";
                      e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                    }}
                  >
                    <option value="gold" style={{ padding: "10px" }}>
                      {language === "ar" ? "ذهب " : "Gold"}
                    </option>
                    <option value="silver" style={{ padding: "10px" }}>
                      {language === "ar" ? "فضة" : "Silver"}
                    </option>
                    <option value="accessories" style={{ padding: "10px" }}>
                      {language === "ar" ? "إكسسوارات" : "Accessories"}
                    </option>
                  </select>
                </div>

                {/* Karat Selection for Gold/Silver */}
                {(formData.type === "gold" || formData.type === "silver") && (
                  <div className="form-group">
                    <label
                      htmlFor="karat"
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        color: "#2c3e50",
                        fontSize: "16px",
                      }}
                    >
                      {language === "ar" ? "العيار" : "Karat / Fineness"}
                      <span style={{ marginLeft: "4px", color: "#e74c3c" }}>
                        *
                      </span>
                    </label>
                    <select
                      id="karat"
                      name="karat"
                      value={formData.karat}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        padding: "14px 18px",
                        borderRadius: "10px",
                        border: "2px solid #e0e0e0",
                        fontSize: "16px",
                        background: "white",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        fontWeight: "500",
                        color: "#2c3e50",
                      }}
                    >
                      {formData.type === "gold" ? (
                        <>
                          <option value="24K">24K</option>
                          <option value="21K">21K</option>
                          <option value="18K">18K</option>
                        </>
                      ) : (
                        <>
                          <option value="999">999</option>
                          <option value="925">925</option>
                          <option value="800">800</option>
                        </>
                      )}
                    </select>
                  </div>
                )}

                {/* Price Input for Accessories */}
                {formData.type === "accessories" && (
                  <div className="form-group">
                    <label htmlFor="price">
                      {language === "ar" ? "السعر ($)" : "Price ($)"} *
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      onWheel={(e) => e.target.blur()}
                      min="0"
                      step="0.01"
                      placeholder="150"
                    />
                  </div>
                )}

                {/* Weight Input */}
                {formData.type !== "accessories" && (
                  <div className="form-group">
                    <label htmlFor="weight">
                      {language === "ar" ? "الوزن (جرام)" : "Weight (grams)"} *
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
                    {formData.weight !== "" && (
                      <small style={{
                        marginTop: "6px",
                        display: "block",
                        fontWeight: "600",
                        color: parseFloat(formData.weight) < 3 ? "#1976d2" : "#28a745",
                      }}>
                        {parseFloat(formData.weight) < 3
                          ? (language === "ar" ? "🔵 وزن خفيف" : "🔵 Light weight")
                          : (language === "ar" ? "🟢 وزن تقيل" : "🟢 Heavy weight")
                        }
                      </small>
                    )}

                    <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="checkbox"
                        id="show_weight"
                        name="show_weight"
                        checked={formData.show_weight}
                        onChange={(e) => setFormData(prev => ({ ...prev, show_weight: e.target.checked }))}
                        style={{ width: "16px", height: "16px", cursor: "pointer" }}
                      />
                      <label htmlFor="show_weight" style={{ margin: 0, cursor: "pointer", fontWeight: "normal", fontSize: "14px", color: "#555" }}>
                        {language === "ar" ? "إظهار الوزن في بطاقة المنتج" : "Show weight on product card"}
                      </label>
                    </div>

                  </div>
                )}

                {/* Manufacturing Cost — يظهر بس لو في وزن */}
                {formData.type !== "accessories" && formData.weight !== "" && parseFloat(formData.weight) > 0 && (
                  <div className="form-group">
                    <label htmlFor="manufacturing_cost">
                      {parseFloat(formData.weight) < 3
                        ? (language === "ar" ? "المصنعية (للقطعة كلها)" : "Manufacturing Cost (per piece)")
                        : (language === "ar" ? "المصنعية (للجرام)" : "Manufacturing Cost (per gram)")
                      } *
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
                      placeholder={language === "ar" ? "مثال: 2.5" : "e.g., 2.5"}
                    />
                    <small style={{ color: "#6c757d", fontSize: "13px", marginTop: "5px", display: "block" }}>
                      {parseFloat(formData.weight) < 3
                        ? (language === "ar" ? "💡 مصنعية ثابتة للقطعة" : "💡 Flat cost per piece")
                        : (language === "ar" ? "💡 مصنعية لكل جرام" : "💡 Cost per gram")
                      }
                    </small>
                  </div>
                )}

                {/* Badge & Stock */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="badge">{t.badge}</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select
                        id="badge"
                        name="badge"
                        value={formData.badge}
                        onChange={handleChange}
                        style={{ flex: 1 }}
                      >
                        <option value="">{t.noBadge}</option>
                        <option value="Best Seller">{t.bestSeller}</option>
                        <option value="New Arrival">{t.newArrival}</option>
                        <option value="Limited Edition">{t.limitedEdition}</option>
                        {customBadges.map((b) => (
                          <option key={b.id} value={language === 'ar' ? b.name_ar : b.name_en}>
                            {language === 'ar' ? b.name_ar : b.name_en}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={showBadgeModal}
                        onClick={() => {
                          setBadgeModalView('list');
                          setShowBadgeModal(true);
                        }}
                        title={language === 'ar' ? 'إضافة بادج جديد' : 'Add new badge'}
                        style={{
                          width: '36px', height: '36px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white', border: 'none', borderRadius: '8px',
                          cursor: 'pointer', fontSize: '20px', fontWeight: '700',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {showBadgeModal && (
                    <div style={{
                      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                      background: 'rgba(0,0,0,0.7)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      zIndex: 2000,
                    }}>
                      <div style={{
                        background: 'white', padding: '28px', borderRadius: '12px',
                        maxWidth: '450px', width: '90%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '20px' }}>
                            {badgeModalView === 'list' && (language === 'ar' ? '🏷️ إدارة البادجات' : '🏷️ Manage Badges')}
                            {badgeModalView === 'form' && editingBadgeId && (language === 'ar' ? '✏️ تعديل البادج' : '✏️ Edit Badge')}
                            {badgeModalView === 'form' && !editingBadgeId && (language === 'ar' ? '➕ إضافة بادج جديد' : '➕ Add New Badge')}
                            {badgeModalView === 'confirmDelete' && (language === 'ar' ? '⚠️ تأكيد الحذف' : '⚠️ Confirm Delete')}
                          </h3>
                          <button
                            onClick={() => { setShowBadgeModal(false); setBadgeModalView('list'); setNewBadgeNameAr(''); setNewBadgeNameEn(''); setNewBadgeColor('#667eea'); setEditingBadgeId(null); }}
                            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888' }}
                          >×</button>
                        </div>

                        {badgeModalView === 'list' && (
                          <>
                            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
                              {customBadges.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#6c757d', padding: '20px 0' }}>
                                  {language === 'ar' ? 'لا يوجد بادجات مخصصة بعد.' : 'No custom badges yet.'}
                                </p>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  {customBadges.map(badge => (
                                    <div key={badge.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #eee', borderRadius: '8px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ color: badge.color, fontWeight: 'bold' }}>{badge.name_ar} / {badge.name_en}</span>
                                      </div>
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                          onClick={() => {
                                            setEditingBadgeId(badge.id);
                                            setNewBadgeNameAr(badge.name_ar);
                                            setNewBadgeNameEn(badge.name_en);
                                            setNewBadgeColor(badge.color);
                                            setBadgeModalView('form');
                                          }}
                                          style={{ padding: '6px 12px', background: '#f8f9fa', color: '#1a1a1a', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                                        >
                                          {language === 'ar' ? 'تعديل' : 'Edit'}
                                        </button>
                                        <button
                                          onClick={() => {
                                            setBadgeToDelete(badge);
                                            setBadgeModalView('confirmDelete');
                                          }}
                                          style={{ padding: '6px 12px', background: '#fff0f0', color: '#dc3545', border: '1px solid #ffcccc', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                                        >
                                          {language === 'ar' ? 'حذف' : 'Delete'}
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                              <button
                                onClick={() => { setShowBadgeModal(false); setBadgeModalView('list'); }}
                                style={{ background: '#6c757d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                              >
                                {t.cancel}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingBadgeId(null);
                                  setNewBadgeNameAr('');
                                  setNewBadgeNameEn('');
                                  setNewBadgeColor('#667eea');
                                  setBadgeModalView('form');
                                }}
                                style={{
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white', border: 'none', padding: '10px 20px',
                                  borderRadius: '8px', cursor: 'pointer', fontWeight: '600'
                                }}
                              >
                                {language === 'ar' ? '➕ إضافة بادج' : '➕ Add Badge'}
                              </button>
                            </div>
                          </>
                        )}

                        {badgeModalView === 'form' && (
                          <div style={{ overflowY: 'auto', paddingRight: '5px' }}>
                            {/* Arabic Name */}
                            <div style={{ marginBottom: '16px' }}>
                              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                                {language === 'ar' ? 'اسم البادج (عربي)' : 'Badge Name (Arabic)'} *
                              </label>
                              <input
                                type="text"
                                autoFocus
                                value={newBadgeNameAr}
                                onChange={(e) => setNewBadgeNameAr(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') editingBadgeId ? handleUpdateBadge() : handleSaveBadge();
                                  if (e.key === 'Escape') setBadgeModalView('list');
                                }}
                                maxLength={15}
                                placeholder="مثال: حصري، مميز..."
                                style={{
                                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                                  border: '2px solid #667eea', fontSize: '16px', boxSizing: 'border-box',
                                  direction: 'rtl'
                                }}
                              />
                              <small style={{ color: '#6c757d', fontSize: '13px', marginTop: '6px', display: 'block' }}>
                                {newBadgeNameAr.length}/15
                              </small>
                            </div>

                            {/* English Name */}
                            <div style={{ marginBottom: '16px' }}>
                              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                                {language === 'ar' ? 'اسم البادج (إنجليزي)' : 'Badge Name (English)'} *
                              </label>
                              <input
                                type="text"
                                value={newBadgeNameEn}
                                onChange={(e) => setNewBadgeNameEn(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') editingBadgeId ? handleUpdateBadge() : handleSaveBadge();
                                  if (e.key === 'Escape') setBadgeModalView('list');
                                }}
                                maxLength={15}
                                placeholder="e.g., Exclusive, Special..."
                                style={{
                                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                                  border: '2px solid #667eea', fontSize: '16px', boxSizing: 'border-box',
                                  direction: 'ltr'
                                }}
                              />
                              <small style={{ color: '#6c757d', fontSize: '13px', marginTop: '6px', display: 'block' }}>
                                {newBadgeNameEn.length}/15
                              </small>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                                {language === 'ar' ? 'لون البادج' : 'Badge Color'}
                              </label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input
                                  type="color"
                                  value={newBadgeColor}
                                  onChange={(e) => setNewBadgeColor(e.target.value)}
                                  style={{ width: '48px', height: '48px', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '2px', background: 'none' }}
                                />
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                  {['#667eea', '#28a745', '#dc3545', '#C9A84C', '#17a2b8', '#fd7e14'].map(color => (
                                    <div
                                      key={color}
                                      onClick={() => setNewBadgeColor(color)}
                                      style={{
                                        width: '28px', height: '28px', borderRadius: '50%', background: color,
                                        cursor: 'pointer', border: newBadgeColor === color ? '3px solid #333' : '2px solid transparent',
                                        boxSizing: 'border-box', transition: 'transform 0.15s',
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>

                              <div style={{ marginTop: '12px' }}>
                                <span style={{ fontSize: '13px', color: '#6c757d', marginBottom: '6px', display: 'block' }}>
                                  {language === 'ar' ? 'معاينة:' : 'Preview:'}
                                </span>
                                <span style={{
                                  display: 'inline-block', color: '#fff', backgroundColor: newBadgeColor, border: `1px solid ${newBadgeColor}`,
                                  padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                                }}>
                                  {language === 'ar' ? (newBadgeNameAr || 'اسم البادج') : (newBadgeNameEn || 'Badge Name')}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setBadgeModalView('list'); setNewBadgeNameAr('');
                                  setNewBadgeNameEn(''); setNewBadgeColor('#667eea'); setEditingBadgeId(null);
                                }}
                                style={{ background: '#6c757d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                              >
                                {language === 'ar' ? 'رجوع' : 'Back'}
                              </button>
                              <button
                                type="button"
                                onClick={editingBadgeId ? handleUpdateBadge : handleSaveBadge}
                                disabled={!newBadgeNameAr.trim() || !newBadgeNameEn.trim() || isSavingBadge}
                                style={{
                                  background: (!newBadgeNameAr.trim() || !newBadgeNameEn.trim() || isSavingBadge) ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: (!newBadgeNameAr.trim() || !newBadgeNameEn.trim() || isSavingBadge) ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: isSavingBadge ? 0.7 : 1,
                                }}
                              >
                                {isSavingBadge ? (language === 'ar' ? '⏳ جاري الحفظ...' : '⏳ Saving...') : (language === 'ar' ? '💾 حفظ البادج' : '💾 Save Badge')}
                              </button>
                            </div>
                          </div>
                        )}

                        {badgeModalView === 'confirmDelete' && badgeToDelete && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <p style={{ margin: 0, fontSize: '15px' }}>
                              {language === 'ar' ? `هل أنت متأكد أنك تريد حذف البادج "${language === 'ar' ? badgeToDelete.name_ar : badgeToDelete.name_en}"؟` : `Are you sure you want to delete the badge "${language === 'ar' ? badgeToDelete.name_ar : badgeToDelete.name_en}"?`}
                            </p>

                            {(() => {
                              const affected = products.filter(p => p.badge === badgeToDelete.name_ar || p.badge === badgeToDelete.name_en);
                              if (affected.length > 0) {
                                return (
                                  <div style={{ background: '#fff3cd', color: '#856404', padding: '12px', borderRadius: '8px', fontSize: '14px' }}>
                                    <strong>{language === 'ar' ? `⚠️ تحذير: ${affected.length} منتجات تستخدم هذا البادج.` : `⚠️ Warning: ${affected.length} products are using this badge.`}</strong>
                                    <br />
                                    <span style={{ fontSize: '13px' }}>
                                      {language === 'ar' ? 'سيتم إزالة البادج من هذه المنتجات تلقائياً عند الحذف.' : 'The badge will be automatically removed from these products upon deletion.'}
                                    </span>
                                    <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px', maxHeight: '100px', overflowY: 'auto' }}>
                                      {affected.map(p => (
                                        <li key={p.id || p._id} style={{ marginBottom: '2px' }}>{language === 'ar' ? (p.name_ar || p.name) : (p.name_en || p.name)}</li>
                                      ))}
                                    </ul>
                                  </div>
                                );
                              }
                              return (
                                <p style={{ margin: 0, fontSize: '14px', color: '#28a745' }}>
                                  {language === 'ar' ? '✅ لا توجد منتجات تستخدم هذا البادج حالياً.' : '✅ No products are currently using this badge.'}
                                </p>
                              );
                            })()}

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                              <button
                                onClick={() => { setBadgeToDelete(null); setBadgeModalView('list'); }}
                                disabled={isSavingBadge}
                                style={{ background: '#6c757d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', opacity: isSavingBadge ? 0.7 : 1 }}
                              >
                                {language === 'ar' ? 'رجوع' : 'Back'}
                              </button>
                              <button
                                onClick={handleDeleteBadge}
                                disabled={isSavingBadge}
                                style={{ background: '#dc3545', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: isSavingBadge ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: isSavingBadge ? 0.7 : 1 }}
                              >
                                {isSavingBadge ? (language === 'ar' ? '⏳ جاري الحذف...' : '⏳ Deleting...') : (language === 'ar' ? '🗑️ تأكيد الحذف' : '🗑️ Confirm Delete')}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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
                  <div style={{ marginBottom: "10px" }}>
                    <label style={{ marginRight: "20px" }}>
                      <input
                        type="radio"
                        name="imageType"
                        value="url"
                        checked={imageType === "url"}
                        onChange={() => setImageType("url")}
                        style={{ marginRight: "5px" }}
                      />
                      {t.useUrl}
                    </label>

                    <label>
                      <input
                        type="radio"
                        name="imageType"
                        value="file"
                        checked={imageType === "file"}
                        onChange={() => setImageType("file")}
                        style={{ marginRight: "5px" }}
                      />
                      {t.uploadFile}
                    </label>
                  </div>

                  {imageType === "url" ? (
                    <input
                      type="url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={(e) =>
                        setFormData({ ...formData, image_url: e.target.value })
                      }
                      placeholder="https://example.com/image.jpg"
                    />
                  ) : (
                    <>
                      <button
                        type="button"
                        className="upload-image-btn"
                        onClick={() =>
                          document.getElementById("imageUploadInput").click()
                        }
                        style={{ fontSize: "18px" }}
                      >
                        📷 {language === "ar" ? "اختيار صورة" : "Choose Image"}
                      </button>

                      <input
                        id="imageUploadInput"
                        type="file"
                        name="image_file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                      />

                      {selectedFile && (
                        <p style={{ marginTop: "8px", fontSize: "14px" }}>
                          {language === "ar" ? "تم اختيار:" : "Selected:"}{" "}
                          {selectedFile.name}
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
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "flex-end",
                    marginTop: "20px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductModal(false);
                      setEditingProductId(null);
                      setFormData({
                        name_ar: "",
                        name_en: "",
                        type: "silver",
                        weight: "",
                        manufacturing_cost: "",
                        price: "",
                        badge: "",
                        stock: "In Stock",
                        section: "",
                        image_url: "",
                        description_ar: "",
                        description_en: "",
                        shortDescription_ar: "",
                        shortDescription_en: "",
                      });
                      setSelectedFile(null);
                      setImageType("url");
                      setSectionError(false);
                    }}
                    style={{
                      background: "#6c757d",
                      color: "white",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "16px",
                    }}
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      background: isSubmitting ? "#ccc" : "#28a745",
                      color: "white",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: "6px",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      fontWeight: "600",
                      fontSize: "16px",
                    }}
                  >
                    {isSubmitting
                      ? editingProductId
                        ? t.updatingProduct
                        : t.addingProduct
                      : editingProductId
                        ? t.updateProduct
                        : t.addProduct}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ✅ Section Creation Modal */}
        {showSectionModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "white",
                padding: "30px",
                borderRadius: "12px",
                maxWidth: "500px",
                width: "90%",
                boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              }}
            >
              <h3 style={{ marginBottom: "20px", color: "#2c3e50" }}>
                {t.createSection}
              </h3>

              <form onSubmit={handleSectionSubmit}>
                <div style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "600",
                    }}
                  >
                    {t.sectionTitleAr} *
                    <span
                      style={{
                        color: "#666",
                        fontSize: "14px",
                        marginLeft: "10px",
                      }}
                    >
                      ({sectionFormData.title_ar.length}/20)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={sectionFormData.title_ar}
                    onChange={(e) => {
                      // ✅ منع الكتابة إذا تجاوز 15 حرف
                      if (e.target.value.length <= 20) {
                        setSectionFormData({
                          ...sectionFormData,
                          title_ar: e.target.value,
                        });
                      }
                    }}
                    required
                    maxLength={20}
                    placeholder="مثال: مجموعة الصيف"
                    style={{
                      width: "100%",
                      padding: "10px 15px",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      fontSize: "16px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "600",
                    }}
                  >
                    {t.sectionTitleEn} *
                    <span
                      style={{
                        color: "#666",
                        fontSize: "14px",
                        marginLeft: "10px",
                      }}
                    >
                      ({sectionFormData.title_en.length}/20)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={sectionFormData.title_en}
                    onChange={(e) => {
                      // ✅ منع الكتابة إذا تجاوز 20 حرف
                      if (e.target.value.length <= 20) {
                        setSectionFormData({
                          ...sectionFormData,
                          title_en: e.target.value,
                        });
                      }
                    }}
                    required
                    maxLength={20}
                    placeholder="e.g., Summer Collection"
                    style={{
                      width: "100%",
                      padding: "10px 15px",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      fontSize: "16px",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "600",
                    }}
                  >
                    {t.sectionOrder}
                  </label>
                  <input
                    type="number"
                    value={sectionFormData.order}
                    onChange={(e) =>
                      setSectionFormData({
                        ...sectionFormData,
                        order: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    style={{
                      width: "100%",
                      padding: "10px 15px",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      fontSize: "16px",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowSectionModal(false);
                      setSectionFormData({
                        title_ar: "",
                        title_en: "",
                        order: 0,
                      });
                    }}
                    style={{
                      background: "#6c757d",
                      color: "white",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      background: isSubmitting ? "#6c757d" : "#28a745",
                      color: "white",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "6px",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      fontWeight: "600",
                      opacity: isSubmitting ? 0.7 : 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.2s",
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <span
                          style={{
                            width: "14px",
                            height: "14px",
                            border: "2px solid rgba(255,255,255,0.4)",
                            borderTopColor: "white",
                            borderRadius: "50%",
                            display: "inline-block",
                            animation: "spin 0.7s linear infinite",
                          }}
                        />
                        {language === "ar" ? "جارٍ الحفظ..." : "Saving..."}
                      </>
                    ) : (
                      t.saveSection
                    )}
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
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "white",
                padding: "30px",
                borderRadius: "12px",
                maxWidth: "400px",
                width: "90%",
                boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              }}
            >
              <h3 style={{ marginBottom: "20px", color: "#2c3e50" }}>
                {t.editOrder}
              </h3>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                  }}
                >
                  {t.sectionOrder}
                </label>
                <input
                  type="number"
                  value={editOrderValue}
                  onChange={(e) => setEditOrderValue(parseInt(e.target.value))}
                  min="1"
                  style={{
                    width: "100%",
                    padding: "10px 15px",
                    borderRadius: "6px",
                    border: "2px solid #667eea",
                    fontSize: "16px",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowEditOrderModal(false);
                    setEditingSectionId(null);
                  }}
                  style={{
                    background: "#6c757d",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleEditSectionOrder}
                  style={{
                    background: "#667eea",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
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
          <div style={{ marginBottom: "30px" }}>
            <h2 style={{ marginTop: "20px", marginBottom: "20px" }}>
              {t.sectionsList}
            </h2>
            <hr style={{ marginBottom: "20px" }} />

            <Table
              columns={columns}
              dataSource={sections}
              rowKey="id"
              scroll={{ x: "max-content" }}
              pagination={{
                pageSize: pageSize,
                showSizeChanger: true,
                pageSizeOptions: ["5", "10"],
                placement: ["bottomCenter"],
                onShowSizeChange: (current, size) => {
                  setPageSize(size);
                },
              }}
              expandable={{
                expandedRowRender: (record) => {
                  const sectionProducts = getProductsForSection(record.id);
                  if (sectionProducts.length === 0) {
                    return (
                      <p
                        style={{
                          textAlign: "center",
                          color: "#6c757d",
                          fontStyle: "italic",
                          padding: "20px",
                        }}
                      >
                        {language === "ar"
                          ? "📭 لا توجد منتجات في هذا القسم"
                          : "📭 No products in this section"}
                      </p>
                    );
                  }
                  return (
                    <div
                      style={{
                        padding: "20px",
                        borderLeft: "4px solid #667eea",
                      }}
                    >
                      <h4
                        style={{
                          marginBottom: "15px",
                          color: "#667eea",
                          fontSize: "16px",
                        }}
                      >
                        {language === "ar"
                          ? "📦 المنتجات في هذا القسم:"
                          : "📦 Products in this section:"}
                      </h4>

                      {/* ✅ Fixed grid — same column width regardless of content */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(160px, 160px))",
                          gap: "15px",
                          justifyContent: "start",
                        }}
                      >
                        {sectionProducts.map((product) => (
                          <div
                            key={`${product.id || product._id}-${refreshKey}`}
                            style={{
                              background: "white",
                              padding: "12px",
                              borderRadius: "8px",
                              border: "1px solid #e0e0e0",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                              width:
                                "160px" /* ✅ fixed width — same for AR and EN */,
                              height:
                                "320px" /* ✅ fixed height — cards never grow with text */,
                              overflow: "hidden",
                              boxSizing: "border-box",
                            }}
                          >
                            <img
                              src={
                                product.image ||
                                product.image_url ||
                                product.image_file ||
                                "https://via.placeholder.com/150"
                              }
                              alt={
                                language === "ar"
                                  ? product.name_ar
                                  : product.name_en
                              }
                              style={{
                                width: "100%",
                                height: "120px",
                                objectFit: "cover",
                                borderRadius: "6px",
                                flexShrink: 0 /* ✅ image never shrinks */,
                              }}
                            />

                            {/* ✅ Name — truncate overflow so long Arabic names don't push other elements */}
                            <strong
                              style={{
                                fontSize: "13px",
                                display: "-webkit-box",
                                WebkitLineClamp: 2 /* max 2 lines */,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                lineHeight: "1.3",
                                minHeight:
                                  "34px" /* reserve space for 2 lines always */,
                              }}
                            >
                              {language === "ar"
                                ? product.name_ar || product.name
                                : product.name_en || product.name}
                            </strong>

                            <span
                              style={{
                                color: "#28a745",
                                fontWeight: "600",
                                fontSize: "13px",
                              }}
                            >
                              ${Math.ceil(product.price / 5) * 5}
                            </span>

                            {/* ✨ Type Badge (Gold/Silver/Accessories) */}
                            <span
                              style={{
                                display: "inline-block",
                                width: "fit-content",
                                background:
                                  product.type === "gold"
                                    ? "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)"
                                    : product.type === "accessories"
                                      ? "linear-gradient(135deg, #a8c0ff 0%, #3f2b96 100%)"
                                      : "linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)",
                                color:
                                  product.type === "gold"
                                    ? "#856404"
                                    : product.type === "accessories"
                                      ? "#ffffff"
                                      : "#393939",
                                padding: "3px 10px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: "bold",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                              }}
                            >
                              {product.type === "gold"
                                ? language === "ar"
                                  ? `ذهب ${product.karat || "21K"}`
                                  : `Gold ${product.karat || "21K"}`
                                : product.type === "accessories"
                                  ? language === "ar"
                                    ? "إكسسوارات"
                                    : "Accessories"
                                  : language === "ar"
                                    ? `فضة ${product.karat || "999"}`
                                    : `Silver ${product.karat || "999"}`}
                            </span>

                            <span
                              className={`stock-badge ${product.stock?.toLowerCase().replace(/\s/g, "-")}`}
                              style={{ fontSize: "11px" }}
                            >
                              {product.stock}
                            </span>

                            {/* ✅ Buttons pushed to bottom via marginTop: auto */}
                            <div
                              style={{
                                display: "flex",
                                gap: "6px",
                                marginTop: "auto",
                              }}
                            >
                              <button
                                onClick={() => {
                                  setEditingProductId(
                                    product.id || product._id,
                                  );
                                  setFormData({
                                    name_ar:
                                      product.name_ar || product.name || "",
                                    name_en:
                                      product.name_en || product.name || "",
                                    type: product.type || "silver",
                                    karat: product.karat || (product.type === "gold" ? "21K" : "999"),
                                    weight: product.weight || "",
                                    show_weight: product.show_weight !== false,
                                    manufacturing_cost:
                                      product.manufacturing_cost || "",
                                    price: product.price,
                                    badge: product.badge || "",
                                    stock: product.stock,
                                    section: product.section,
                                    image_url:
                                      product.image_url || product.image || "",
                                    description_ar:
                                      product.description_ar ||
                                      product.description ||
                                      "",
                                    description_en:
                                      product.description_en ||
                                      product.description ||
                                      "",
                                    shortDescription_ar:
                                      product.shortDescription_ar ||
                                      product.shortDescription ||
                                      "",
                                    shortDescription_en:
                                      product.shortDescription_en ||
                                      product.shortDescription ||
                                      "",
                                  });
                                  setShowProductModal(true);
                                }}
                                style={{
                                  flex: 1,
                                  background: "#ffc107",
                                  color: "white",
                                  border: "none",
                                  padding: "7px 4px",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                }}
                              >
                                {t.edit}
                              </button>

                              <button
                                onClick={() => {
                                  setProductToMove(product);
                                  setNewSectionForMove("");
                                  setShowMoveProductModal(true);
                                }}
                                style={{
                                  flex: 1,
                                  background: "#17a2b8",
                                  color: "white",
                                  border: "none",
                                  padding: "7px 4px",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                }}
                              >
                                {t.moveProduct}
                              </button>

                              <button
                                onClick={() =>
                                  handleDelete(product.id || product._id)
                                }
                                style={{
                                  flex: 1,
                                  background: "#dc3545",
                                  color: "white",
                                  border: "none",
                                  padding: "7px 4px",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "600",
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
                onExpand: (expanded, record) =>
                  toggleSectionExpansion(record.id),
              }}
            />
          </div>
        )}

        {/* ✅ Current Inventory - المنتجات بدون قسم (Orphaned Products) */}
        {(() => {
          const orphanedProducts = products.filter((product) => {
            if (!product.section) return true;
            return !sections.find((s) => s.id === product.section);
          });

          if (orphanedProducts.length === 0) return null;

          const allSelected =
            orphanedProducts.length > 0 &&
            orphanedProducts.every((p) =>
              selectedOrphans.includes(p.id || p._id)
            );

          return (
            <div style={{ marginTop: "40px" }}>
              {/* ── Header row ── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {/* Select-All checkbox */}
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => {
                      if (allSelected) {
                        setSelectedOrphans([]);
                      } else {
                        setSelectedOrphans(
                          orphanedProducts.map((p) => p.id || p._id)
                        );
                      }
                    }}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    title={
                      language === "ar" ? "تحديد الكل" : "Select all"
                    }
                  />
                  <h2 style={{ margin: 0, color: "#ff9800" }}>
                    ⚠️{" "}
                    {language === "ar"
                      ? "منتجات بدون قسم"
                      : "Orphaned Products"}
                  </h2>
                </div>

                {/* Delete selected button — shows only when something is selected */}
                {selectedOrphans.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button
                      onClick={() => setShowDeleteOrphansModal(true)}
                      style={{
                        background: "linear-gradient(135deg, #dc3545 0%, #c82333 100%)",
                        color: "white",
                        border: "none",
                        padding: "10px 22px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "700",
                        fontSize: "15px",
                        boxShadow: "0 4px 12px rgba(220,53,69,0.35)",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      🗑️ {language === "ar" ? "حذف المحدد" : "Delete Selected"}
                    </button>

                    <span style={{ color: "#6c757d", fontSize: "14px", fontWeight: "500" }}>
                      {language === "ar"
                        ? `${selectedOrphans.length} محدد`
                        : `${selectedOrphans.length} selected`}
                    </span>
                  </div>
                )}
              </div>

              <p style={{ marginBottom: "15px", color: "#6c757d", fontSize: "14px" }}>
                {language === "ar"
                  ? `تم العثور على ${orphanedProducts.length} منتج بدون قسم. يرجى تعيين قسم لهم.`
                  : `Found ${orphanedProducts.length} product${orphanedProducts.length !== 1 ? "s" : ""} without a section. Please assign them to a section.`}
              </p>
              <hr style={{ marginBottom: "20px" }} />

              {/* ── Confirmation Modal ── */}
              {showDeleteOrphansModal && (
                <div
                  style={{
                    position: "fixed",
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1100,
                  }}
                >
                  <div
                    style={{
                      background: "white",
                      padding: "30px",
                      borderRadius: "14px",
                      maxWidth: "420px",
                      width: "90%",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
                    }}
                  >
                    <h3
                      style={{
                        marginBottom: "16px",
                        color: "#dc3545",
                        fontSize: "20px",
                      }}
                    >
                      🗑️{" "}
                      {language === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
                    </h3>

                    <p style={{ marginBottom: "12px", fontSize: "15px" }}>
                      {language === "ar"
                        ? `هل أنت متأكد أنك تريد حذف ${selectedOrphans.length} منتج؟`
                        : `Are you sure you want to delete ${selectedOrphans.length} product${selectedOrphans.length !== 1 ? "s" : ""}?`}
                    </p>

                    {/* List the selected products */}
                    <div
                      style={{
                        background: "#fff5f5",
                        border: "1px solid #ffcccc",
                        borderRadius: "8px",
                        padding: "12px",
                        maxHeight: "160px",
                        overflowY: "auto",
                        marginBottom: "20px",
                      }}
                    >
                      {orphanedProducts
                        .filter((p) =>
                          selectedOrphans.includes(p.id || p._id)
                        )
                        .map((p) => (
                          <div
                            key={p.id || p._id}
                            style={{
                              fontSize: "14px",
                              padding: "4px 0",
                              borderBottom: "1px solid #ffe0e0",
                              color: "#2c3e50",
                            }}
                          >
                            •{" "}
                            {language === "ar"
                              ? p.name_ar || p.name
                              : p.name_en || p.name}
                          </div>
                        ))}
                    </div>

                    <p
                      style={{
                        color: "#dc3545",
                        fontSize: "13px",
                        fontWeight: "600",
                        marginBottom: "20px",
                      }}
                    >
                      ⚠️{" "}
                      {language === "ar"
                        ? "لا يمكن التراجع عن هذا الإجراء."
                        : "This action cannot be undone."}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => setShowDeleteOrphansModal(false)}
                        disabled={isDeletingOrphans}
                        style={{
                          background: "#6c757d",
                          color: "white",
                          border: "none",
                          padding: "10px 22px",
                          borderRadius: "8px",
                          cursor: isDeletingOrphans ? "not-allowed" : "pointer",
                          fontWeight: "600",
                          opacity: isDeletingOrphans ? 0.7 : 1,
                        }}
                      >
                        {language === "ar" ? "إلغاء" : "Cancel"}
                      </button>
                      <button
                        onClick={handleDeleteSelectedOrphans}
                        disabled={isDeletingOrphans}
                        style={{
                          background: isDeletingOrphans ? "#ccc" : "#dc3545",
                          color: "white",
                          border: "none",
                          padding: "10px 22px",
                          borderRadius: "8px",
                          cursor: isDeletingOrphans ? "not-allowed" : "pointer",
                          fontWeight: "700",
                          fontSize: "15px",
                          opacity: isDeletingOrphans ? 0.7 : 1,
                        }}
                      >
                        {isDeletingOrphans
                          ? language === "ar"
                            ? "⏳ جاري الحذف..."
                            : "⏳ Deleting..."
                          : language === "ar"
                            ? "🗑️ تأكيد الحذف"
                            : "🗑️ Confirm Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Product Cards ── */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                  gap: "20px",
                }}
              >
                {orphanedProducts.map((product) => {
                  const pid = product.id || product._id;
                  const isSelected = selectedOrphans.includes(pid);
                  return (
                    <div
                      key={`${pid}-${refreshKey}`}
                      onClick={() =>
                        setSelectedOrphans((prev) =>
                          prev.includes(pid)
                            ? prev.filter((id) => id !== pid)
                            : [...prev, pid]
                        )
                      }
                      style={{
                        background: isSelected ? "#fff0f0" : "#fff8e1",
                        padding: "20px",
                        borderRadius: "12px",
                        border: isSelected ? "2px solid #dc3545" : "2px solid #ff9800",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        boxShadow: isSelected
                          ? "0 4px 16px rgba(220,53,69,0.18)"
                          : "0 2px 8px rgba(255,152,0,0.1)",
                        transition: "transform 0.2s, box-shadow 0.2s, border 0.2s, background 0.2s",
                        cursor: "pointer",
                        position: "relative",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {/* Circular checkbox top-right */}
                      <div
                        style={{
                          position: "absolute",
                          top: "12px",
                          right: "12px",
                          width: "26px",
                          height: "26px",
                          borderRadius: "50%",
                          background: isSelected ? "#dc3545" : "white",
                          border: isSelected ? "2px solid #dc3545" : "2px solid #ccc",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                          transition: "all 0.2s",
                          zIndex: 2,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrphans((prev) =>
                            prev.includes(pid)
                              ? prev.filter((id) => id !== pid)
                              : [...prev, pid]
                          );
                        }}
                      >
                        {isSelected && (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                          >
                            <path
                              d="M2 7L5.5 10.5L12 3.5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Warning Badge */}
                      <span
                        style={{
                          display: "inline-block",
                          width: "fit-content",
                          background: "#ff9800",
                          color: "white",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "600",
                        }}
                      >
                        ⚠️ {language === "ar" ? "بدون قسم" : "No Section"}
                      </span>

                      <img
                        src={
                          product.image ||
                          product.image_url ||
                          product.image_file ||
                          "https://via.placeholder.com/250"
                        }
                        alt={language === "ar" ? product.name_ar : product.name_en}
                        style={{
                          width: "100%",
                          height: "200px",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />

                      {product.badge && (
                        <span
                          style={{
                            display: "inline-block",
                            width: "fit-content",
                            background: "#667eea",
                            color: "white",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          {product.badge}
                        </span>
                      )}

                      <strong style={{ fontSize: "16px", color: "#2c3e50" }}>
                        {language === "ar"
                          ? product.name_ar || product.name
                          : product.name_en || product.name}
                      </strong>

                      <p
                        style={{
                          fontSize: "14px",
                          color: "#6c757d",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {language === "ar"
                          ? product.shortDescription_ar || product.shortDescription
                          : product.shortDescription_en || product.shortDescription}
                      </p>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "20px",
                            fontWeight: "700",
                            color: "#28a745",
                          }}
                        >
                          ${Math.ceil(product.price / 5) * 5}
                        </span>
                        {(product.type === "gold" || product.type === "silver") && (
                          <span
                            style={{
                              background:
                                product.type === "gold" ? "#ffd700" : "#c0c0c0",
                              color:
                                product.type === "gold" ? "#856404" : "#393939",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "700",
                            }}
                          >
                            {product.karat}
                          </span>
                        )}
                      </div>

                      <span
                        className={`stock-badge ${product.stock?.toLowerCase().replace(/\s/g, "-")}`}
                        style={{
                          fontSize: "12px",
                          textAlign: "center",
                          padding: "6px",
                          borderRadius: "6px",
                        }}
                      >
                        {product.stock}
                      </span>

                      {/* Stop propagation on action buttons */}
                      <div
                        style={{ display: "flex", gap: "10px", marginTop: "auto" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setEditingProductId(product.id || product._id);
                            setFormData({
                              name_ar: product.name_ar || product.name || "",
                              name_en: product.name_en || product.name || "",
                              type: product.type || "silver",
                              karat: product.karat || (product.type === "gold" ? "21K" : "999"),
                              weight: product.weight || "",
                              show_weight: product.show_weight !== false,
                              manufacturing_cost: product.manufacturing_cost || "",
                              price: product.price,
                              badge: product.badge || "",
                              stock: product.stock,
                              section: product.section || "",
                              image_url: product.image_url || product.image || "",
                              description_ar:
                                product.description_ar || product.description || "",
                              description_en:
                                product.description_en || product.description || "",
                              shortDescription_ar:
                                product.shortDescription_ar ||
                                product.shortDescription || "",
                              shortDescription_en:
                                product.shortDescription_en ||
                                product.shortDescription || "",
                            });
                            setShowProductModal(true);
                          }}
                          style={{
                            flex: 1,
                            background: "#ffc107",
                            color: "white",
                            border: "none",
                            padding: "10px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "600",
                          }}
                        >
                          {t.edit}
                        </button>

                        <button
                          onClick={() => {
                            setProductToMove(product);
                            setNewSectionForMove("");
                            setShowMoveProductModal(true);
                          }}
                          style={{
                            flex: 1,
                            background: "#17a2b8",
                            color: "white",
                            border: "none",
                            padding: "10px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "600",
                          }}
                        >
                          {t.moveProduct}
                        </button>

                        <button
                          onClick={() => handleDelete(product.id || product._id)}
                          style={{
                            flex: 1,
                            background: "#dc3545",
                            color: "white",
                            border: "none",
                            padding: "10px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "600",
                          }}
                        >
                          {t.delete}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
      {/* 💰 Edit Price Modal */}
      <Modal
        title={language === 'ar' ? '📊 تعديل الأسعار اليومية' : '📊 Edit Daily Prices'}
        open={showPriceModal}
        onCancel={() => setShowPriceModal(false)}
        onOk={handleUpdatePrices}
        okText={language === 'ar' ? 'حفظ الأسعار' : 'Save Prices'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
        width={600}
        centered
      >
        <div style={{ padding: '10px 0' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              {language === 'ar' ? 'نوع المعدن' : 'Metal Type'}
            </label>
            <select
              value={priceEditData.metal}
              onChange={(e) => setPriceEditData(prev => ({
                ...prev,
                metal: e.target.value,
                base_buy_price: e.target.value === 'gold'
                  ? (allPrices?.karat_21_buy || 0)
                  : (allPrices?.fine_999_buy || 0),
                spread: e.target.value === 'gold'
                  ? ((allPrices?.karat_21_sell - allPrices?.karat_21_buy) || 0)
                  : ((allPrices?.fine_999_sell - allPrices?.fine_999_buy) || 0)
              }))}

              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d9d9d9' }}
            >
              <option value="gold">{language === 'ar' ? 'الذهب' : 'Gold'}</option>
              <option value="silver">{language === 'ar' ? 'الفضة' : 'Silver'}</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                {priceEditData.metal === 'gold'
                  ? (language === 'ar' ? 'سعر شراء 21K الأساسي' : 'Base 21K Buy Price')
                  : (language === 'ar' ? 'سعر شراء 999 الأساسي' : 'Base 999 Buy Price')}
              </label>
              <Input
                type="number"
                value={priceEditData.base_buy_price}
                onChange={(e) => setPriceEditData(prev => ({ ...prev, base_buy_price: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          <div style={{ marginTop: '30px' }}>
            <h4 style={{ marginBottom: '15px', color: '#666', fontSize: '14px', textTransform: 'uppercase' }}>
              🔍 {language === 'ar' ? 'معاينة الأسعار' : 'Live Preview'}
            </h4>
            <div style={{ background: '#f8f9fa', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#e0e0e0' }}>
                {getLivePreview().map((item, idx) => (
                  <div key={idx} style={{ background: 'white', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '8px', color: priceEditData.metal === 'gold' ? '#d4af37' : '#555' }}>
                      {item.label}
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '18px', color: '#2c3e50' }}>
                      {item.price}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                      {language === 'ar' ? 'جنيه' : 'EGP'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Admin;
