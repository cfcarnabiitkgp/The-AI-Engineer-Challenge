#!/usr/bin/env python3
"""
Test script to check if PDF parsing is working correctly
"""

import sys
import os
from pathlib import Path

# Add the aimakerspace to the path
sys.path.append(str(Path(__file__).parent))

from aimakerspace.text_utils import PDFLoader

def test_pdf_parsing(pdf_path: str):
    """Test PDF parsing and show extracted text"""
    print(f"Testing PDF parsing for: {pdf_path}")
    print("=" * 50)
    
    try:
        # Load PDF
        pdf_loader = PDFLoader(pdf_path)
        documents = pdf_loader.load_documents()
        
        if not documents:
            print("❌ No documents extracted from PDF")
            return False
        
        print(f"✅ Successfully extracted {len(documents)} document(s)")
        print()
        
        # Show extracted text
        for i, doc in enumerate(documents):
            print(f"Document {i+1}:")
            print("-" * 30)
            print(doc)
            print("-" * 30)
            print(f"Length: {len(doc)} characters")
            print()
        
        return True
        
    except Exception as e:
        print(f"❌ Error parsing PDF: {e}")
        return False

if __name__ == "__main__":
    # Test the shopping list PDF
    #pdf_path = "pdf_data/uploads/shopping_list_family_4.pdf"
    pdf_path = "pdf_data/uploads/CDC_guide.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"❌ PDF file not found: {pdf_path}")
        print("Available files in pdf_data/uploads/:")
        uploads_dir = Path("pdf_data/uploads")
        if uploads_dir.exists():
            for file in uploads_dir.glob("*.pdf"):
                print(f"  - {file.name}")
        else:
            print("  No uploads directory found")
        sys.exit(1)
    
    success = test_pdf_parsing(pdf_path)
    
    if success:
        print("✅ PDF parsing test completed successfully")
    else:
        print("❌ PDF parsing test failed")
        print("\nPossible issues:")
        print("1. PDF might be image-based (scanned) rather than text-based")
        print("2. PDF might have complex formatting that PyPDF2 can't handle")
        print("3. PDF might be password-protected")
        print("4. PDF might be corrupted")
        print("\nRecommendations:")
        print("1. Try creating a simple text-based PDF")
        print("2. Use a different PDF library like pdfplumber or pymupdf")
        print("3. Convert the PDF to plain text first")
