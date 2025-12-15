import os
import json

PRODUCTS_ROOT_FOLDER = os.path.join("images", "products")
WEB_PATH_PREFIX = "/images/products"
OUTPUT_JSON_FILE = os.path.join("data", "products.json")

def generate_product_catalog():
    if not os.path.exists(PRODUCTS_ROOT_FOLDER):
        print(f"❌ Error: Root folder not found at '{PRODUCTS_ROOT_FOLDER}'")
        return

    catalog_by_category = {}
    global_id_counter = 1

    for dirpath, _, filenames in os.walk(PRODUCTS_ROOT_FOLDER):
        category_name = os.path.basename(dirpath)
        
        if dirpath == PRODUCTS_ROOT_FOLDER:
            continue

        print(f"\n--- Processing Category: {category_name} ---")

        image_files = sorted([f for f in filenames if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))])

        if not image_files:
            print("No images found in this category. Skipping.")
            continue

        # Rename all to temp files to avoid conflict
        temp_files_map = {}
        for i, filename in enumerate(image_files):
            old_path = os.path.join(dirpath, filename)
            extension = os.path.splitext(filename)[1]
            temp_filename = f"temp_{category_name}_{i}{extension}"
            temp_path = os.path.join(dirpath, temp_filename)
            os.rename(old_path, temp_path)
            temp_files_map[temp_filename] = extension

        products = []
        for count, temp_filename in enumerate(sorted(temp_files_map.keys()), start=1):
            temp_path = os.path.join(dirpath, temp_filename)
            extension = temp_files_map[temp_filename]

            final_filename = f"{category_name}-{count}{extension}"
            final_path = os.path.join(dirpath, final_filename)
            os.rename(temp_path, final_path)

            product_object = {
                "id": global_id_counter,
                "name": f"{category_name.replace('-', ' ').title()} {count}",
                "category": category_name,
                "subCategory": "General Collection",
                "imageSrc": f"{WEB_PATH_PREFIX}/{category_name}/{final_filename}"
            }

            products.append(product_object)
            print(f"  ✓ Renamed and processed: {final_filename}")
            global_id_counter += 1

        # Add this category and its products to the catalog
        catalog_by_category[category_name] = {
            "category": category_name,
            "products": products
        }

    os.makedirs(os.path.dirname(OUTPUT_JSON_FILE), exist_ok=True)

    with open(OUTPUT_JSON_FILE, 'w') as f:
        json.dump(catalog_by_category, f, indent=4)

    print(f"\n✅ Success! Catalog generated with {global_id_counter - 1} products.")
    print(f"JSON file saved to: {OUTPUT_JSON_FILE}")


if __name__ == "__main__":
    generate_product_catalog()
