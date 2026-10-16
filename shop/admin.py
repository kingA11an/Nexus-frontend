from django.contrib import admin
from django.utils.html import format_html

from .models import (
    Category,
    FeaturedCategory,
    FeaturedCategoryImage,
    Highlight,
    ImpactStat,
    Location,
    Product,
    Project,
)


def thumbnail(image_src, size=40):
    if not image_src:
        return '-'
    return format_html(
        '<img src="{}" alt="" style="height:{}px;width:auto;border-radius:4px;">',
        image_src,
        size,
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    search_fields = ['name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['product_name', 'price', 'category_list', 'preview']
    list_filter = ['categories']
    search_fields = ['product_name', 'short_description']
    filter_horizontal = ['categories']

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('categories')

    @admin.display(description='Categories')
    def category_list(self, obj):
        return ', '.join(category.name for category in obj.categories.all())

    @admin.display(description='Image')
    def preview(self, obj):
        return thumbnail(obj.image_src)


@admin.register(Highlight)
class HighlightAdmin(admin.ModelAdmin):
    list_display = ['caption', 'preview', 'display_order', 'is_published']
    list_editable = ['display_order', 'is_published']
    list_filter = ['is_published']
    search_fields = ['caption', 'image_alt']

    @admin.display(description='Photo')
    def preview(self, obj):
        return thumbnail(obj.image_src)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'section', 'badge', 'display_order', 'is_published']
    list_editable = ['display_order', 'is_published']
    list_filter = ['section', 'is_published']
    search_fields = ['title', 'description']
    fieldsets = [
        (None, {'fields': ['section', 'badge', 'title', 'description']}),
        ('First photo', {'fields': ['image_1', 'image_1_alt', 'label_1']}),
        ('Second photo (optional)', {'fields': ['image_2', 'image_2_alt', 'label_2']}),
        ('Display', {'fields': ['display_order', 'is_published']}),
    ]


@admin.register(ImpactStat)
class ImpactStatAdmin(admin.ModelAdmin):
    list_display = ['label', 'value', 'suffix', 'display_order', 'is_published']
    list_editable = ['display_order', 'is_published']


class FeaturedCategoryImageInline(admin.TabularInline):
    model = FeaturedCategoryImage
    extra = 0
    max_num = 4
    verbose_name_plural = 'Photos (the first four are shown as a 2 x 2 collage)'


@admin.register(FeaturedCategory)
class FeaturedCategoryAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'display_order', 'is_published']
    list_editable = ['display_order', 'is_published']
    inlines = [FeaturedCategoryImageInline]


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ['city', 'phone', 'display_order', 'is_published']
    list_editable = ['display_order', 'is_published']
