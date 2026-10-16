from django.conf import settings


def site(request):
    """Contact details used across templates, defined once in settings.SITE."""
    return {'site': settings.SITE}
