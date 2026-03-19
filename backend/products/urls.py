from django.urls import path
from . import views

urlpatterns = [
    # 🔐 ADMIN AUTH
 
 #   path('admin/login/', views.admin_login, name='admin-login'),
  #  path('admin/logout/', views.admin_logout, name='admin-logout'),
   # path('admin/verify/', views.admin_verify, name='admin-verify'),
   # path('admin/cleanup-sessions/', views.cleanup_sessions),

    # 📂 SECTIONS
    path('sections/', views.section_list),
    path('sections/<int:pk>/', views.section_detail),

    # 🛒 PRODUCTS
    path('products/', views.product_list),
    path('products/<int:pk>/', views.product_detail),

    # 📈 METAL PRICES
    path('metal-prices/', views.metal_prices, name='metal_prices'),

    path('send-whatsapp/', views.send_whatsapp_order),


]
