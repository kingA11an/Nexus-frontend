from django.core.paginator import Paginator
from django.db.models import Q
from django.shortcuts import render

from .models import (
    Category,
    FeaturedCategory,
    Highlight,
    ImpactStat,
    Location,
    Product,
    Project,
)

MAX_SEARCH_LENGTH = 100
PRODUCTS_PER_PAGE = 24  # divides evenly into the 2, 3 and 4 column grids


def home_view(request):
    projects = Project.objects.filter(is_published=True)
    context = {
        'highlights': Highlight.objects.filter(is_published=True),
        'featured_categories': (
            FeaturedCategory.objects.filter(is_published=True)
            .select_related('category')
            .prefetch_related('images')
        ),
        'csr_projects': projects.filter(section=Project.Section.CSR),
        'institutional_projects': projects.filter(section=Project.Section.INSTITUTIONAL),
        'impact_stats': ImpactStat.objects.filter(is_published=True),
        'locations': Location.objects.filter(is_published=True),
    }
    return render(request, 'index.html', context)


def shop_view(request):
    # Category and search text both come from the query string.
    selected_category_name = request.GET.get('category')
    search_query = request.GET.get('q', '').strip()[:MAX_SEARCH_LENGTH]

    categories = Category.objects.order_by('id')
    # prefetch avoids one extra query per product for the category pill;
    # explicit ordering keeps results and pages stable on every database.
    products = Product.objects.prefetch_related('categories').order_by('id')
    active_category = 'all'

    if selected_category_name and selected_category_name != 'all':
        products = products.filter(categories__name=selected_category_name).distinct()
        active_category = selected_category_name

    if search_query:
        products = products.filter(
            Q(product_name__icontains=search_query)
            | Q(short_description__icontains=search_query)
            | Q(long_description__icontains=search_query)
        ).distinct()

    page_obj = Paginator(products, PRODUCTS_PER_PAGE).get_page(request.GET.get('page'))

    # Everything except "page", so pagination links keep the current filters.
    params = request.GET.copy()
    params.pop('page', None)

    context = {
        'products': page_obj,
        'page_obj': page_obj,
        'categories': categories,
        'active_category': active_category,
        'search_query': search_query,
        'base_query': params.urlencode(),
    }

    return render(request, 'shop.html', context)
