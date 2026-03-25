from django.urls import path
from . import views

urlpatterns = [
    # 📂 SECTIONS
    path('sections/', views.section_list),
    path('sections/<int:pk>/', views.section_detail),

    # 🛒 PRODUCTS
    path('products/', views.product_list),
    path('products/<int:pk>/', views.product_detail),

    # 📈 METAL PRICES
    path('metal-prices/', views.metal_prices, name='metal_prices'),
    path('badges/', views.badge_list, name='badge-list'),
    path('badges/<int:pk>/', views.badge_detail, name='badge-detail'),

]
