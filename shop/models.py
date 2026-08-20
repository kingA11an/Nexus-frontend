from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=255, unique=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Categories"

class Product(models.Model):
    product_name = models.CharField(max_length=255)
    
    #  This allows one product to be in multiple categories!
    categories = models.ManyToManyField(Category, related_name='products')
    
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    short_description = models.TextField(blank=True, null=True)
    long_description = models.TextField(blank=True, null=True)
    
    image = models.ImageField(upload_to='products/', blank=True, null=True)

    def __str__(self):
        return self.product_name