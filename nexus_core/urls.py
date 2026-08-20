from django.contrib import admin
from django.urls import path, re_path
from django.conf import settings
from django.views.static import serve

# Import your views
from shop.views import shop_view, home_view 

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home_view, name='home'),         
    path('shop/', shop_view, name='shop'),    
]

# 🚨 This explicit route bypasses Gunicorn's block in production 🚨
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]