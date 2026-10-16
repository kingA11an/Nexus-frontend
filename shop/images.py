"""
Image URL resolution.

MEDIA_ROOT and one STATICFILES_DIRS entry both point at Images/, so a file can
be reachable two ways:

* static: fast, compressed and cached by WhiteNoise, but only for files that
  existed when collectstatic last ran;
* media: works for anything uploaded later through the admin.

Existing assets keep being served as static files, and new uploads fall back
to the media URL automatically, so nothing has to be moved or renamed.
"""
from pathlib import Path

from django.conf import settings
from django.contrib.staticfiles import finders
from django.templatetags.static import static

_collected = {}


def _is_static(rel_path):
    if settings.DEBUG:
        # runserver serves straight from the source folders
        return bool(finders.find(rel_path))
    if rel_path not in _collected:
        _collected[rel_path] = (Path(settings.STATIC_ROOT) / rel_path).is_file()
    return _collected[rel_path]


def image_url(field_file, static_prefix=''):
    """Return a URL for an ImageField value, or '' when it is empty."""
    if not field_file:
        return ''
    rel_path = f'{static_prefix}{field_file.name}'
    if _is_static(rel_path):
        return static(rel_path)
    return field_file.url
