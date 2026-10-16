import re

from django.db import models

from .images import image_url


class Category(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Categories"


class Product(models.Model):
    product_name = models.CharField(max_length=255)

    # One product can belong to multiple categories.
    categories = models.ManyToManyField(Category, related_name='products')

    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    short_description = models.TextField(blank=True, null=True)
    long_description = models.TextField(blank=True, null=True)

    image = models.ImageField(upload_to='products/', blank=True, null=True)
    image_alt = models.CharField(
        max_length=255,
        blank=True,
        help_text="Short description of the image for screen-reader users. "
                  "Leave blank to fall back to the product name.",
    )

    def __str__(self):
        return self.product_name

    @property
    def alt(self):
        return self.image_alt or self.product_name

    @property
    def image_src(self):
        # Imported products store a bare filename that lives in Images/product_images/.
        # Products uploaded through the admin live under Images/products/ (media).
        return image_url(self.image, static_prefix='product_images/')


class Highlight(models.Model):
    """A photo in the homepage "Project Highlights" gallery."""

    caption = models.CharField(max_length=150, help_text="Short label shown on the photo.")
    image = models.ImageField(upload_to='highlights/')
    image_alt = models.CharField(
        max_length=255,
        blank=True,
        help_text="Describe what the photo shows, for screen-reader users. "
                  "Leave blank to fall back to the caption.",
    )
    display_order = models.PositiveSmallIntegerField(default=0, help_text="Lower numbers appear first.")
    is_published = models.BooleanField(default=True, help_text="Untick to hide without deleting.")

    class Meta:
        ordering = ['display_order', 'id']
        verbose_name = 'project highlight'
        verbose_name_plural = 'project highlights'

    def __str__(self):
        return self.caption

    @property
    def alt(self):
        return self.image_alt or self.caption

    @property
    def image_src(self):
        return image_url(self.image)


class Project(models.Model):
    """A completed project card in the homepage "Our Work" section."""

    class Section(models.TextChoices):
        CSR = 'csr', 'CSR & public school support'
        INSTITUTIONAL = 'institutional', 'Institutional & commercial'

    section = models.CharField(max_length=20, choices=Section.choices)
    badge = models.CharField(max_length=60, help_text='Small label on the photo, e.g. "CSR Project".')
    title = models.CharField(max_length=150)
    description = models.TextField()

    image_1 = models.ImageField(upload_to='projects/')
    image_1_alt = models.CharField(max_length=255, blank=True)
    label_1 = models.CharField(max_length=30, default='Before')

    image_2 = models.ImageField(
        upload_to='projects/', blank=True, null=True,
        help_text="Optional. With a second photo the card becomes an automatic before/after slider.",
    )
    image_2_alt = models.CharField(max_length=255, blank=True)
    label_2 = models.CharField(max_length=30, default='After')

    display_order = models.PositiveSmallIntegerField(default=0, help_text="Lower numbers appear first.")
    is_published = models.BooleanField(default=True, help_text="Untick to hide without deleting.")

    class Meta:
        ordering = ['display_order', 'id']

    def __str__(self):
        return self.title

    @property
    def alt_1(self):
        return self.image_1_alt or f'{self.title}: {self.label_1.lower()}'

    @property
    def alt_2(self):
        return self.image_2_alt or f'{self.title}: {self.label_2.lower()}'

    @property
    def image_1_src(self):
        return image_url(self.image_1)

    @property
    def image_2_src(self):
        return image_url(self.image_2)


class ImpactStat(models.Model):
    """A counter in the homepage "Our impact so far" section."""

    value = models.PositiveIntegerField(help_text="The number the counter counts up to.")
    suffix = models.CharField(max_length=5, blank=True, help_text='Optional, e.g. "+".')
    label = models.CharField(max_length=200)
    display_order = models.PositiveSmallIntegerField(default=0, help_text="Lower numbers appear first.")
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ['display_order', 'id']

    def __str__(self):
        return f'{self.value}{self.suffix} {self.label}'


class FeaturedCategory(models.Model):
    """A "Featured Categories" tile on the homepage (a 2x2 photo collage that links to the shop)."""

    title = models.CharField(max_length=120)
    category = models.ForeignKey(
        Category, null=True, blank=True, on_delete=models.SET_NULL, related_name='+',
        help_text="The shop category this tile opens. Leave blank to open the full shop.",
    )
    display_order = models.PositiveSmallIntegerField(default=0, help_text="Lower numbers appear first.")
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ['display_order', 'id']
        verbose_name_plural = 'featured categories'

    def __str__(self):
        return self.title


class FeaturedCategoryImage(models.Model):
    featured_category = models.ForeignKey(FeaturedCategory, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='featured/')
    display_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['display_order', 'id']

    def __str__(self):
        return f'{self.featured_category} image {self.pk}'

    @property
    def image_src(self):
        return image_url(self.image)


class Location(models.Model):
    """An office listed in the homepage contact section."""

    city = models.CharField(max_length=80)
    address = models.TextField(blank=True, help_text="One line per row; line breaks are kept.")
    phone = models.CharField(max_length=30, help_text='As it should be displayed, e.g. "0716 951 777".')
    display_order = models.PositiveSmallIntegerField(default=0, help_text="Lower numbers appear first.")
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ['display_order', 'id']

    def __str__(self):
        return self.city

    @property
    def phone_tel(self):
        """Dialable form for tel: links (Kenyan numbers become +254...)."""
        digits = re.sub(r'\D', '', self.phone)
        if digits.startswith('0'):
            return '+254' + digits[1:]
        return '+' + digits
