from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from .models import Product, Section, AdminUser, AdminSession, LoginAttempt, MetalPrice
from .serializers import ProductSerializer, SectionSerializer
from rest_framework.parsers import MultiPartParser, FormParser
import json
import requests as http_requests



# ==================== HELPER FUNCTIONS ====================

def get_client_ip(request):
    """Get client IP address"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def verify_admin_token(request):
    """
    🔐 Middleware function to verify admin token
    Returns session if valid, None otherwise
    """
    auth_header = request.headers.get('Authorization', '')
    
    if not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header[7:]
    
    try:
        session = AdminSession.objects.select_related('admin_user').get(token=token)
        
        # Check if session is still valid
        if session.is_valid():
            return session
        else:
            # Session expired, delete it
            session.delete()
            return None
            
    except AdminSession.DoesNotExist:
        return None


# ==================== ADMIN AUTHENTICATION VIEWS ====================

@api_view(['POST'])
def admin_login(request):
    try:
        data = request.data
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        if not username or not password:
            return Response({
                'success': False,
                'message': 'Username and password are required',
                'message_ar': 'اسم المستخدم وكلمة المرور مطلوبان',
                'message_en': 'Username and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if LoginAttempt.check_rate_limit(ip_address):
            return Response({
                'success': False,
                'message': 'Too many failed attempts. Please try again later.',
                'message_ar': 'محاولات كثيرة فاشلة. حاول مرة أخرى لاحقاً.',
                'message_en': 'Too many failed attempts. Please try again later.'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        try:
            admin_user = AdminUser.objects.get(username=username)
            
            if not admin_user.is_active:
                LoginAttempt.objects.create(
                    username=username,
                    ip_address=ip_address,
                    success=False,
                    user_agent=user_agent
                )
                return Response({
                    'success': False,
                    'message': 'Account is disabled',
                    'message_ar': 'الحساب معطل',
                    'message_en': 'Account is disabled'
                }, status=status.HTTP_403_FORBIDDEN)
            
            if admin_user.check_password(password):
                session = AdminSession.create_session(
                    admin_user=admin_user,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    hours=24
                )
                
                admin_user.update_last_login()
                
                LoginAttempt.objects.create(
                    username=username,
                    ip_address=ip_address,
                    success=True,
                    user_agent=user_agent
                )
                
                return Response({
                    'success': True,
                    'message': 'Login successful',
                    'message_ar': 'تم تسجيل الدخول بنجاح',
                    'message_en': 'Login successful',
                    'token': session.token,
                    'username': admin_user.username,
                    'role': admin_user.role
                }, status=status.HTTP_200_OK)
            else:
                LoginAttempt.objects.create(
                    username=username,
                    ip_address=ip_address,
                    success=False,
                    user_agent=user_agent
                )
                return Response({
                    'success': False,
                    'message': 'Invalid username or password',
                    'message_ar': 'اسم المستخدم أو كلمة المرور غير صحيحة',
                    'message_en': 'Invalid username or password'
                }, status=status.HTTP_401_UNAUTHORIZED)
                
        except AdminUser.DoesNotExist:
            LoginAttempt.objects.create(
                username=username,
                ip_address=ip_address,
                success=False,
                user_agent=user_agent
            )
            return Response({
                'success': False,
                'message': 'Invalid username or password',
                'message_ar': 'اسم المستخدم أو كلمة المرور غير صحيحة',
                'message_en': 'Invalid username or password'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return Response({
            'success': False,
            'message': 'Server error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def admin_logout(request):
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header[7:]
        
        try:
            session = AdminSession.objects.get(token=token)
            session.delete()
            
            return Response({
                'success': True,
                'message': 'Logged out successfully',
                'message_ar': 'تم تسجيل الخروج بنجاح',
                'message_en': 'Logged out successfully'
            })
        except AdminSession.DoesNotExist:
            pass
    
    return Response({
        'success': False,
        'message': 'Invalid token'
    }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
def admin_verify(request):
    session = verify_admin_token(request)
    
    if not session:
        return Response({
            'success': False,
            'message': 'Unauthorized - Please login',
            'message_ar': 'غير مصرح - يرجى تسجيل الدخول',
            'message_en': 'Unauthorized - Please login'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    return Response({
        'success': True,
        'username': session.admin_user.username,
        'role': session.admin_user.role,
        'message': 'Token is valid'
    })


@api_view(['POST'])
def cleanup_sessions(request):
    session = verify_admin_token(request)
    
    if not session or session.admin_user.role != 'admin':
        return Response({
            'success': False,
            'message': 'Unauthorized'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    count = AdminSession.cleanup_expired()
    return Response({
        'success': True,
        'message': f'Cleaned up {count} expired sessions',
        'count': count
    })


# ==================== SECTION VIEWS ====================

@api_view(['GET', 'POST'])
def section_list(request):
    """
    GET: List all sections
    POST: Create a new section (requires authentication)
    """
    try:
        if request.method == 'GET':
            # ✅ ترتيب الـ sections بالـ order تلقائياً (Featured أول لأن order=0)
            sections = Section.objects.all().order_by('order')
            serializer = SectionSerializer(sections, many=True)
            return Response(serializer.data)

        elif request.method == 'POST':
            # 🔐 Verify admin authentication
            session = verify_admin_token(request)
            if not session:
                return Response({
                    'success': False,
                    'message': 'Unauthorized - Please login'
                }, status=status.HTTP_401_UNAUTHORIZED)

            serializer = SectionSerializer(data=request.data)

            if serializer.is_valid():
                # ✅ منع إنشاء أكثر من Featured Section واحد
                if serializer.validated_data.get('is_featured', False):
                    if Section.objects.filter(is_featured=True).exists():
                        return Response({
                            'error': 'A featured section already exists. Only one featured section is allowed.',
                            'error_ar': 'يوجد قسم مميز بالفعل. يسمح بقسم مميز واحد فقط.',
                            'error_en': 'A featured section already exists. Only one featured section is allowed.'
                        }, status=status.HTTP_400_BAD_REQUEST)

                # ✅ منع استخدام order=0 للـ sections العادية
                new_order = serializer.validated_data.get('order', None)
                if new_order is not None and int(new_order) == 0:
                    if not serializer.validated_data.get('is_featured', False):
                        return Response({
                            'error': 'Order 0 is reserved for the featured section',
                            'error_ar': 'الترتيب 0 محجوز للقسم المميز فقط',
                            'error_en': 'Order 0 is reserved for the featured section only'
                        }, status=status.HTTP_400_BAD_REQUEST)

                # ✅ منع تكرار الـ order
                if new_order is not None:
                    if Section.objects.filter(order=new_order).exists():
                        return Response({
                            'error': f'Order {new_order} is already used by another section',
                            'error_ar': f'الترتيب {new_order} مستخدم بالفعل في قسم آخر',
                            'error_en': f'Order {new_order} is already used by another section'
                        }, status=status.HTTP_400_BAD_REQUEST)

                serializer.save()
                return Response({
                    'message': 'Section created successfully',
                    'section': serializer.data
                }, status=status.HTTP_201_CREATED)

            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def section_detail(request, pk):
    """
    GET: Retrieve a section
    PUT/PATCH: Update a section (requires authentication)
    DELETE: Delete a section (requires authentication)
    """
    try:
        section = Section.objects.get(pk=pk)
    except Section.DoesNotExist:
        return Response(
            {'error': 'Section not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = SectionSerializer(section)
        return Response(serializer.data)

    elif request.method == 'DELETE':
        # 🔐 Verify admin authentication
        session = verify_admin_token(request)
        if not session:
            return Response({
                'success': False,
                'message': 'Unauthorized - Please login'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # ✅ منع حذف الـ Featured Section نهائياً
        if section.is_featured:
            return Response(
                {
                    'error': 'Cannot delete featured section',
                    'message_ar': 'لا يمكن حذف القسم المميز - هذا القسم أساسي للموقع',
                    'message_en': 'Cannot delete featured section - This is an essential section for the website',
                },
                status=status.HTTP_403_FORBIDDEN
            )

        section.delete()
        return Response(
            {'message': 'Section deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )

    elif request.method in ['PUT', 'PATCH']:
        # 🔐 Verify admin authentication
        session = verify_admin_token(request)
        if not session:
            return Response({
                'success': False,
                'message': 'Unauthorized - Please login'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # ✅ منع تغيير order الـ Featured Section - دايماً يبقى أول
        if section.is_featured and 'order' in request.data:
            return Response({
                'error': 'Cannot change order of featured section',
                'error_ar': 'لا يمكن تغيير ترتيب القسم المميز، دايماً بيظهر أول',
                'error_en': 'Cannot change the order of the featured section, it always appears first'
            }, status=status.HTTP_400_BAD_REQUEST)

        # ✅ التحقق من الـ order الجديد
        new_order = request.data.get('order')
        if new_order is not None:
            new_order_int = int(new_order)

            # ✅ منع استخدام order=0 للـ sections العادية
            if new_order_int == 0 and not section.is_featured:
                return Response({
                    'error': 'Order 0 is reserved for the featured section',
                    'error_ar': 'الترتيب 0 محجوز للقسم المميز فقط',
                    'error_en': 'Order 0 is reserved for the featured section only'
                }, status=status.HTTP_400_BAD_REQUEST)

            # ✅ منع تكرار الـ order مع sections تانية
            if Section.objects.filter(order=new_order_int).exclude(pk=section.pk).exists():
                return Response({
                    'error': f'Order {new_order_int} is already used by another section',
                    'error_ar': f'الترتيب {new_order_int} مستخدم بالفعل في قسم آخر، اختر رقم مختلف',
                    'error_en': f'Order {new_order_int} is already used by another section'
                }, status=status.HTTP_400_BAD_REQUEST)

        serializer = SectionSerializer(
            section,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            # ✅ منع إزالة صفة is_featured من القسم المميز الأساسي
            if section.is_featured and 'is_featured' in serializer.validated_data:
                if not serializer.validated_data['is_featured']:
                    return Response({
                        'error': 'Cannot remove featured status from the main featured section',
                        'error_ar': 'لا يمكن إزالة صفة "مميز" من القسم المميز الأساسي',
                        'error_en': 'Cannot remove featured status from the main featured section'
                    }, status=status.HTTP_400_BAD_REQUEST)

            # ✅ منع تحويل section عادي إلى featured إذا كان يوجد featured بالفعل
            if serializer.validated_data.get('is_featured', False) and not section.is_featured:
                if Section.objects.filter(is_featured=True).exists():
                    return Response({
                        'error': 'A featured section already exists',
                        'error_ar': 'يوجد قسم مميز بالفعل',
                        'error_en': 'A featured section already exists'
                    }, status=status.HTTP_400_BAD_REQUEST)

            serializer.save()
            return Response({
                'message': 'Section updated successfully',
                'section': serializer.data
            })
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


# ==================== PRODUCT VIEWS ====================

@api_view(['GET', 'POST'])
@parser_classes([MultiPartParser, FormParser])
def product_list(request):
    """
    GET: List all products
    POST: Create a new product (requires authentication)
    """
    try:
        if request.method == 'GET':
            products = Product.objects.all()
            serializer = ProductSerializer(products, many=True, context={'request': request})
            return Response(serializer.data)

        elif request.method == 'POST':
            # 🔐 Verify admin authentication
            session = verify_admin_token(request)
            if not session:
                return Response({
                    'success': False,
                    'message': 'Unauthorized - Please login'
                }, status=status.HTTP_401_UNAUTHORIZED)

            serializer = ProductSerializer(data=request.data, context={'request': request})

            if serializer.is_valid():
                serializer.save()
                return Response({
                    'message': 'Product added successfully',
                    'product': serializer.data
                }, status=status.HTTP_201_CREATED)

            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@parser_classes([MultiPartParser, FormParser])
def product_detail(request, pk):
    """
    GET: Retrieve a product
    PUT/PATCH: Update a product (requires authentication)
    DELETE: Delete a product (requires authentication)
    """
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response(
            {'error': 'Product not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = ProductSerializer(product, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'DELETE':
        # 🔐 Verify admin authentication
        session = verify_admin_token(request)
        if not session:
            return Response({
                'success': False,
                'message': 'Unauthorized - Please login'
            }, status=status.HTTP_401_UNAUTHORIZED)

        product.delete()
        return Response(
            {'message': 'Product deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )

    elif request.method in ['PUT', 'PATCH']:
        # 🔐 Verify admin authentication
        session = verify_admin_token(request)
        if not session:
            return Response({
                'success': False,
                'message': 'Unauthorized - Please login'
            }, status=status.HTTP_401_UNAUTHORIZED)

        serializer = ProductSerializer(
            product,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Product updated successfully',
                'product': serializer.data
            })
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
def metal_prices(request):
    """
    GET: جلب أسعار الذهب والفضة الحالية
    PUT: تحديث أسعار الذهب والفضة (requires authentication)
    """
    try:
        price_obj = MetalPrice.get_current_prices()

        if request.method == 'GET':
            return Response({
                'gold_price_per_gram': float(price_obj.gold_price_per_gram),
                'silver_price_per_gram': float(price_obj.silver_price_per_gram),
                'updated_at': price_obj.updated_at
            })

        elif request.method == 'PUT':
            data = request.data

            if 'gold_price_per_gram' in data:
                price_obj.gold_price_per_gram = data['gold_price_per_gram']

            if 'silver_price_per_gram' in data:
                price_obj.silver_price_per_gram = data['silver_price_per_gram']

            price_obj.save()

            updated_counts = price_obj.update_all_products()

            return Response({
                'success': True,
                'message': 'Prices updated successfully',
                'message_ar': 'تم تحديث الأسعار بنجاح',
                'message_en': 'Prices updated successfully',
                'gold_price_per_gram': float(price_obj.gold_price_per_gram),
                'silver_price_per_gram': float(price_obj.silver_price_per_gram),
                'gold_products_updated': updated_counts['gold_updated'],
                'silver_products_updated': updated_counts['silver_updated'],
                'total_products_updated': updated_counts['gold_updated'] + updated_counts['silver_updated']
            })

    except Exception as e:
        return Response({'error': str(e)}, status=500)
    

# ==================== WHATSAPP VIEWS ====================


WHATSAPP_TOKEN = 'EAAiDBFYTu4cBQZBoq2Q3W029FSG4aYVGpzg86Aqmk4klRDhfxcjmeTkhSFfZCkHfZBd3FmFO3YmDCt9BCi3HQ2ict2H4xMk2PoZAZAZBAEmLiiQrZCjCwhNW0CpKkOy0q5HuqYZBAEQyMP4IS8dKWni2gHyQVKY5MmUq2xt3Xu4bxBzmhhsLRXFksZCKZB2QFMYdaTJoHI3TggNXBUUlx1N0x77xdO0UZBZACBrHOSlis0f5NFcKfjZAz3JcyZAKTb0fmJzZCrFFR2p6Y74SMLDUJGw8XXY1U6i'  # token بتاعك
PHONE_NUMBER_ID = '1107440045780222'
OWNER_PHONE = '201067365567'

@api_view(['POST'])
def send_whatsapp_order(request):
    try:
        data = request.data
        message = data.get('message')
        image_url = data.get('image_url')

        headers = {
            'Authorization': f'Bearer {WHATSAPP_TOKEN}',
            'Content-Type': 'application/json'
        }

        # بعت الصورة
        if image_url:
            http_requests.post(
                f'https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages',
                headers=headers,
                json={
                    'messaging_product': 'whatsapp',
                    'to': OWNER_PHONE,
                    'type': 'image',
                    'image': {'link': image_url}
                }
            )

        # بعت النص
        res = http_requests.post(
            f'https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages',
            headers=headers,
            json={
                'messaging_product': 'whatsapp',
                'to': OWNER_PHONE,
                'type': 'text',
                'text': {'body': message}
            }
        )

        if res.status_code == 200:
            return Response({'success': True})
        else:
            return Response({'success': False}, status=500)

    except Exception as e:
        return Response({'error': str(e)}, status=500)