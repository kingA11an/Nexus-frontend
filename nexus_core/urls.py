from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

# Import BOTH of your views
from shop.views import shop_view, home_view 

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home_view, name='home'),         # This maps to index.html
    path('shop/', shop_view, name='shop'),    # This maps to shop.html
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)