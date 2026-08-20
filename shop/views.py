from django.shortcuts import render
from django.db.models import Q  
from .models import Product, Category

def home_view(request):
    return render(request, 'index.html')

def shop_view(request):
    # 1. Grab both the category AND the search query from the URL
    selected_category_name = request.GET.get('category')
    search_query = request.GET.get('q', '').strip()  # 'q' is for query
    
    categories = Category.objects.all()
    products = Product.objects.all()
    active_category = 'all'

    # 2. Filter by Category (if selected)
    if selected_category_name and selected_category_name != 'all':
        products = products.filter(categories__name=selected_category_name).distinct()
        active_category = selected_category_name
        
    # 3. Filter by Search Text (if typed)
    if search_query:
        products = products.filter(
            Q(product_name__icontains=search_query) | 
            Q(short_description__icontains=search_query) |
            Q(long_description__icontains=search_query)
        ).distinct()

    context = {
        'products': products,
        'categories': categories,
        'active_category': active_category,
        'search_query': search_query,  
    }
    
    return render(request, 'shop.html', context)