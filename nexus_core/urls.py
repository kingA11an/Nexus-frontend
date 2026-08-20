from django.contrib import admin
from django.urls import path

# Import your views
from shop.views import shop_view, home_view 

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home_view, name='home'),         
    path('shop/', shop_view, name='shop'),    
]