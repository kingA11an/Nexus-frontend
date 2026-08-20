import os
import django
import pandas as pd

# Wake up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nexus_core.settings')
django.setup()

from shop.models import Category, Product

def map_categories(raw_string):
    """
    Intelligently groups Sylvia's messy Excel categories into clean UI categories.
    """
    raw = str(raw_string).lower()
    clean_cats = set() # We use a set so we never get duplicates!
    
    # 1. SENSORY & FURNITURE (Groups tactile, vestibular, proprioception, etc.)
    if any(word in raw for word in ['sensory', 'tactile', 'visual', 'auditory', 'vestibular', 'proprioception', 'furniture']):
        clean_cats.add('Sensory & Furniture')
        
    # 2. SWINGS (Pulls swings and hammocks into their own group)
    if 'swing' in raw or 'hammock' in raw:
        clean_cats.add('Swings')
        
    # 3. FIDGET TOYS
    if 'fidget' in raw or 'pop' in raw:
        clean_cats.add('Fidget Toys')
        
    # 4. ORAL MOTOR
    if 'oral' in raw or 'chew' in raw:
        clean_cats.add('Oral Motor')
        
    # 5. COGNITIVE AD (Groups memory, sorting, STEM)
    if any(word in raw for word in ['cognitive', 'memory', 'colour', 'sorting', 'stem']):
        clean_cats.add('Cognitive AD')
        
    # 6. MOTOR SKILLS (Groups fine motor, gross motor, eye-hand coordination)
    if 'motor' in raw or 'coordination' in raw:
        clean_cats.add('Motor Skills')
        
    # 7. ADL TRAINING (Activities of Daily Living & Potty Training)
    if 'adl' in raw or 'potty' in raw or 'schedule' in raw or 'routine' in raw:
        clean_cats.add('ADL Training')
        
    # 8. EDUCATION & SPEECH
    if any(word in raw for word in ['education', 'speech', 'communication', 'flashcard', 'learning']):
        clean_cats.add('Education & Speech')
        
    # 9. SAFETY AD
    if 'safety' in raw or 'lanyard' in raw or 'helmet' in raw:
        clean_cats.add('Safety AD')
        
    # Fallback if blank 
    if not clean_cats:
        clean_cats.add('General Resources')
        
    return list(clean_cats)

def run_import():
    file_path = "database_ready-latest.xlsx"
    print(f"📖 Reading {file_path}...")
    df = pd.read_excel(file_path)

    # Completely wipe the old messy database before importing the clean one
    Product.objects.all().delete()
    Category.objects.all().delete()
    print("🧹 Cleared old database records.")

    imported_count = 0

    for index, row in df.iterrows():
        product_name = str(row.get('Product_Name', '')).strip()
        if not product_name or product_name.lower() == 'nan':
            continue

        # Handle Price
        price = row.get('Price', 0)
        if pd.isna(price): price = 0.0
        
        # Handle Descriptions
        short_desc = str(row.get('Short_Description', '')).strip()
        long_desc = str(row.get('Long_Description', '')).strip()
        if short_desc.lower() == 'nan': short_desc = ""
        if long_desc.lower() == 'nan': long_desc = ""

        # Handle Image Path
        image_filename = str(row.get('Image_Filename', '')).strip()
        image_path = image_filename if image_filename and image_filename.lower() != 'nan' else ""

        # Create Product
        product = Product.objects.create(
            product_name=product_name,
            price=price,
            short_description=short_desc,
            long_description=long_desc,
            image=image_path
        )

        # 🚨 Use our new smart mapper to clean the categories!
        raw_category = str(row.get('Category', '')).strip()
        if raw_category and raw_category.lower() != 'nan':
            clean_category_names = map_categories(raw_category)
            
            for c_name in clean_category_names:
                cat_obj, created = Category.objects.get_or_create(name=c_name)
                product.categories.add(cat_obj)

        imported_count += 1
        print(f"✅ Imported: {product_name}")

    print(f"\n Successfully imported {imported_count} products with CLEAN categories!")

if __name__ == '__main__':
    run_import()