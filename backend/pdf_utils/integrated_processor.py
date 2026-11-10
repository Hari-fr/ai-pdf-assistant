import pdfplumber
import os
import tempfile
from pdf_utils.text_extractor import extract_text_from_pdf
from pdf_utils.image_converter import convert_pdf_to_images
from pdf_utils.table_extractor import extract_table_from_image

def extract_comprehensive_content(pdf_path: str, hf_token: str = None) -> str:
    """
    Extract both text and tables from PDF using existing modules
    """
    content = ""
    
    try:
        # 1. Extract text using your existing text extractor
        text_content = extract_text_from_pdf(pdf_path)
        content += "--- TEXT CONTENT ---\n" + text_content + "\n\n"
        
        # 2. Extract tables using your existing image converter + table extractor
        if hf_token:
            table_content = extract_tables_from_pdf(pdf_path, hf_token)
            if table_content:
                content += "--- TABLE CONTENT ---\n" + table_content + "\n\n"
        
        # 3. Also extract simple tables using pdfplumber for backup
        simple_tables = extract_simple_tables_from_pdf(pdf_path)
        if simple_tables:
            content += "--- SIMPLE TABLES ---\n" + simple_tables + "\n\n"
            
        return content.strip()
        
    except Exception as e:
        return f"Error extracting content: {str(e)}"

def extract_tables_from_pdf(pdf_path: str, hf_token: str) -> str:
    """
    Extract tables using your existing image converter + table extractor
    """
    table_content = ""
    
    try:
        # Create temporary directory for images
        with tempfile.TemporaryDirectory() as temp_dir:
            # Convert PDF to images using your existing converter
            image_paths = convert_pdf_to_images(pdf_path, temp_dir)
            
            # Extract tables from each image
            for i, image_path in enumerate(image_paths):
                page_num = i + 1
                
                # Use your existing table extractor
                table_result = extract_table_from_image(image_path, hf_token)
                
                if "error" not in table_result:
                    table_content += f"\n--- Page {page_num} Advanced Tables ---\n"
                    # Format the table result nicely
                    if isinstance(table_result, list):
                        for j, table in enumerate(table_result):
                            table_content += f"[TABLE {j + 1}]\n"
                            table_content += str(table) + "\n"
                    else:
                        table_content += str(table_result) + "\n"
                else:
                    print(f"Warning: Table extraction failed for page {page_num}: {table_result.get('error', 'Unknown error')}")
        
        return table_content
        
    except Exception as e:
        print(f"Error in table extraction: {str(e)}")
        return ""

def extract_simple_tables_from_pdf(pdf_path: str) -> str:
    """
    Extract simple tables using pdfplumber as backup
    """
    table_content = ""
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                tables = page.extract_tables()
                if tables:
                    table_content += f"\n--- Page {page_num + 1} Simple Tables ---\n"
                    for table_num, table in enumerate(tables):
                        table_content += f"[TABLE {table_num + 1}]\n"
                        if table and len(table) > 0:
                            for row in table:
                                clean_row = [str(cell) if cell is not None else "" for cell in row]
                                table_content += " | ".join(clean_row) + "\n"
                        table_content += "[END TABLE]\n\n"
        
        return table_content
        
    except Exception as e:
        return f"Error extracting simple tables: {str(e)}"

def extract_text_and_simple_tables(pdf_path: str) -> str:
    """
    Extract text + simple tables only (no advanced table extraction)
    """
    try:
        # Get text content
        text_content = extract_text_from_pdf(pdf_path)
        
        # Get simple tables
        table_content = extract_simple_tables_from_pdf(pdf_path)
        
        # Combine
        combined_content = text_content
        if table_content:
            combined_content += "\n\n" + table_content
            
        return combined_content
        
    except Exception as e:
        return f"Error extracting content: {str(e)}"

def extract_only_text(pdf_path: str) -> str:
    """
    Extract only text using your existing text extractor
    """
    return extract_text_from_pdf(pdf_path)