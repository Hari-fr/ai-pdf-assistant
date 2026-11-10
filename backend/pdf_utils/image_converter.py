from pdf2image import convert_from_path
import os
import shutil

def _find_poppler_path():
    """Auto-detect poppler bin path if not already in system PATH."""
    if shutil.which("pdftoppm"):
        return None  # Already in system PATH
    
    # Check project-relative paths
    candidates = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "poppler-24.08.0", "Library", "bin")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "poppler-24.08.0", "Library", "bin")),
        r"C:\Projects\Pdf query system\poppler-24.08.0\Library\bin",
    ]
    for candidate in candidates:
        if os.path.isdir(candidate) and os.path.exists(os.path.join(candidate, "pdftoppm.exe")):
            return candidate
    return None

def convert_pdf_to_images(pdf_path: str, output_folder: str) -> list:
    os.makedirs(output_folder, exist_ok=True)
    poppler_path = _find_poppler_path()
    
    if poppler_path:
        images = convert_from_path(pdf_path, poppler_path=poppler_path)
    else:
        images = convert_from_path(pdf_path)

    image_paths = []
    for i, image in enumerate(images):
        image_path = os.path.join(output_folder, f"page_{i + 1}.png")
        image.save(image_path, "PNG")
        image_paths.append(image_path)

    return image_paths
