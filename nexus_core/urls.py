import re

from django.conf import settings
from django.contrib import admin
from django.urls import path, re_path
from django.views.static import serve

from shop.views import home_view, shop_view

urlpatterns = [
    path(settings.ADMIN_URL, admin.site.urls),
    path('', home_view, name='home'),
    path('shop/', shop_view, name='shop'),
]

# Uploaded media. WhiteNoise only serves collected static files, so on hosts
# without a front-end web server Django serves /media/ itself. Turn this off
# with DJANGO_SERVE_MEDIA=False once Nginx or object storage takes over.
if settings.DEBUG or settings.SERVE_MEDIA_WITH_DJANGO:
    urlpatterns += [
        re_path(
            r'^%s(?P<path>.*)$' % re.escape(settings.MEDIA_URL.lstrip('/')),
            serve,
            {'document_root': settings.MEDIA_ROOT},
        ),
    ]
