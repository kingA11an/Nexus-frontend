import os
import re
import zipfile
import pandas as pd
import shutil

EXCEL_FILE = "Copy of PRICE list.xlsx"
OUTPUT_IMG_FOLDER = "extracted_images"
OUTPUT_CSV = "database_ready.csv"

os.makedirs(OUTPUT_IMG_FOLDER, exist_ok=True)

print("🚀 Hacking into the Excel XML source code...")

archive = zipfile.ZipFile(EXCEL_FILE, 'r')

# 1. Crack open the Relationship mappings
drawing_rels = [f for f in archive.namelist() if 'drawings/_rels/drawing' in f]
rels_xml = archive.read(drawing_rels[0]).decode('utf-8')
rel_matches = re.findall(r'Id="([^"]+)".*?Target="([^"]+)"', rels_xml)
rel_dict = dict(rel_matches)

# 2. Parse the visual Drawing XML to find which row holds which image
drawing_files = [f for f in archive.namelist() if 'drawings/drawing' in f]
drawing_xml = archive.read(drawing_files[0]).decode('utf-8')

blocks = re.split(r'<xdr:oneCellAnchor>|<xdr:twoCellAnchor>', drawing_xml)
pic_blocks = [b for b in blocks if 'xdr:pic' in b or 'a:blip' in b]

row_to_zip_path = {}
for block in pic_blocks:
    row_match = re.search(r'<xdr:row>(\d+)</xdr:row>', block)
    rid_match = re.search(r'r:embed="([^"]+)"', block)
    
    if row_match and rid_match:
        row = int(row_match.group(1)) + 1 
        rid = rid_match.group(1)
        
        if row not in row_to_zip_path:
            target = rel_dict.get(rid)
            if target:
                filename = target.split('/')[-1]
                row_to_zip_path[row] = f"xl/media/{filename}"

print(f"🔗 Successfully hard-linked {len(row_to_zip_path)} rows to exact image paths.")

# 3. Read the Data and Extract Everything
print("📸 Extracting images and matching to products...")
df = pd.read_excel(EXCEL_FILE, sheet_name=0)

# 🚨 MAGIC TRICK: Fill blank merged cells with the data from the row above!
df['Product'] = df['Product'].ffill()
df['CATEGORY'] = df['CATEGORY'].ffill()

results = []
extracted_count = 0

# Track the last seen image so variations can share the same picture
last_seen_image = ""
last_seen_product = ""

for index, row_data in df.iterrows():
    excel_row = index + 2
    product_name = str(row_data.get('Product', '')).strip()
    category = str(row_data.get('CATEGORY', '')).strip()
    price = row_data.get('SELLING PRICE PRICE - KSH', 0)
    
    # 🚨 FIX: Grab the descriptions!
    short_desc = str(row_data.get('DESCRIPTION', '')).strip()
    long_desc = str(row_data.get('Long Description', '')).strip()
    
    # Clean up Pandas reading blank cells as the word 'nan'
    if short_desc.lower() == 'nan': short_desc = ""
    if long_desc.lower() == 'nan': long_desc = ""
    
    if not product_name or product_name.lower() == 'nan':
        continue
        
    clean_name = re.sub(r'[^a-zA-Z0-9]', '-', product_name.lower())
    clean_name = re.sub(r'-+', '-', clean_name).strip('-')
    final_filename = ""
    
    zip_path = row_to_zip_path.get(excel_row)
    
    if zip_path and zip_path in archive.namelist():
        ext = zip_path.split('.')[-1]
        final_filename = f"{clean_name}.{ext}"
        
        with archive.open(zip_path) as source, open(os.path.join(OUTPUT_IMG_FOLDER, final_filename), "wb") as target:
            shutil.copyfileobj(source, target)
        extracted_count += 1
        print(f"✅ Exact Match: [{excel_row}] {product_name} -> {final_filename}")
        
        # Save this to memory for the next row
        last_seen_image = final_filename
        last_seen_product = product_name
        
    elif product_name == last_seen_product and last_seen_image:
        # 🚨 FIX: If this is a variation (same name, no picture), reuse the last picture!
        final_filename = last_seen_image
        print(f"🔄 Variation Match: [{excel_row}] {product_name} (Reusing image)")
            
    results.append({
        'Product_Name': product_name,
        'Category': category,
        'Price': price,
        'Short_Description': short_desc,
        'Long_Description': long_desc,
        'Image_Filename': final_filename
    })

pd.DataFrame(results).to_csv(OUTPUT_CSV, index=False)
print(f"\n🎉 DONE! Generated database with {len(results)} total variations/products.")