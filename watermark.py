import os
from PIL import Image

# 1. Folder & File Paths
INPUT_FOLDER = "raw_images"          
OUTPUT_FOLDER = "watermarked_output" 
WATERMARK_PATH = "./Images/RH-BW-logo-noBG.png" 

# Create output folder if it doesn't exist
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# 2. Open Watermark
watermark = Image.open(WATERMARK_PATH).convert("RGBA")

# 3. Process every image in the folder
supported_extensions = ('.png', '.jpg', '.jpeg', '.webp')

for filename in os.listdir(INPUT_FOLDER):
    if filename.lower().endswith(supported_extensions):
        img_path = os.path.join(INPUT_FOLDER, filename)
        
        with Image.open(img_path) as base_image:
            base_image = base_image.convert("RGBA")
            
            # Scale watermark to take up 40% of the image's width
            wm_width = int(base_image.width * 0.40)
            wm_ratio = wm_width / float(watermark.width)
            wm_height = int(float(watermark.height) * float(wm_ratio))
            resized_wm = watermark.resize((wm_width, wm_height), Image.Resampling.LANCZOS)
            
            # Reduce Opacity to 50%
            alpha = resized_wm.split()[3]
            alpha = alpha.point(lambda p: p * 0.70)
            resized_wm.putalpha(alpha)
            
            # Position watermark: CENTERED
            pos_x = (base_image.width - wm_width) // 2
            pos_y = (base_image.height - wm_height) // 2
            
            # Create a transparent overlay layer and composite
            overlay = Image.new('RGBA', base_image.size, (0, 0, 0, 0))
            # The 3rd argument (resized_wm) acts as the transparency mask!
            overlay.paste(resized_wm, (pos_x, pos_y), resized_wm) 
            
            final_image = Image.alpha_composite(base_image, overlay)
            
            # Save the final image
            output_path = os.path.join(OUTPUT_FOLDER, filename)
            final_image.convert("RGB").save(output_path, quality=90)
            print(f"✓ Processed: {filename}")

print("\n🎉 All images centered and watermarked successfully!")