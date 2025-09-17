#!/usr/bin/env python3
"""
Debug the entire PDF processing pipeline
"""

import sys
import os
import asyncio
from pathlib import Path

# Add the aimakerspace to the path
sys.path.append(str(Path(__file__).parent))

from aimakerspace.text_utils import PDFLoader, CharacterTextSplitter
from aimakerspace.vectordatabase import VectorDatabase
from aimakerspace.openai_utils.chatmodel import ChatOpenAI

async def debug_pipeline():
    """Debug the entire PDF processing pipeline"""
    print("🔍 Debugging PDF Processing Pipeline")
    print("=" * 50)
    
    # Step 1: Test PDF parsing
    print("\n1️⃣ Testing PDF Parsing...")
    pdf_path = "pdf_data/uploads/shopping_list_family_4.pdf"
    
    try:
        pdf_loader = PDFLoader(pdf_path)
        documents = pdf_loader.load_documents()
        
        if not documents:
            print("❌ No documents extracted")
            return False
        
        print(f"✅ Extracted {len(documents)} document(s)")
        print(f"📄 Content length: {len(documents[0])} characters")
        print(f"📄 First 200 chars: {documents[0][:200]}...")
        
    except Exception as e:
        print(f"❌ PDF parsing failed: {e}")
        return False
    
    # Step 2: Test text chunking
    print("\n2️⃣ Testing Text Chunking...")
    try:
        text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_texts(documents)
        
        print(f"✅ Created {len(chunks)} chunks")
        print(f"📦 First chunk: {chunks[0][:150]}...")
        
    except Exception as e:
        print(f"❌ Text chunking failed: {e}")
        return False
    
    # Step 3: Test vector database
    print("\n3️⃣ Testing Vector Database...")
    try:
        vector_db = VectorDatabase()
        await vector_db.abuild_from_list(chunks)
        print("✅ Vector database built successfully")
        
        # Test search
        test_query = "cooking ingredients recipes food"
        results = vector_db.search_by_text(test_query, k=3, return_as_text=True)
        print(f"✅ Search test returned {len(results)} results")
        if results:
            print(f"📝 First result: {results[0][:100]}...")
        
    except Exception as e:
        print(f"❌ Vector database failed: {e}")
        return False
    
    # Step 4: Test question generation
    print("\n4️⃣ Testing Question Generation...")
    try:
        # Check if OpenAI API key is available
        if not os.getenv("OPENAI_API_KEY"):
            print("⚠️ No OpenAI API key found - skipping AI question generation")
            print("💡 Set OPENAI_API_KEY environment variable to test AI generation")
            return True
        
        chat_model = ChatOpenAI(model_name="gpt-4o-mini")
        
        # Create a simple test prompt
        content_text = "\n\n".join(chunks[:3])  # Use first 3 chunks
        prompt = f"""Based on this shopping list content, generate 3 cooking questions:

Content: {content_text[:500]}...

Return questions in this format:
Question: [question text]
Category: [category]
Confidence: [0.0-1.0]"""

        messages = [
            {"role": "system", "content": "You are a helpful cooking assistant."},
            {"role": "user", "content": prompt}
        ]
        
        response = chat_model.run(messages)
        print("✅ AI question generation successful")
        print(f"🤖 AI Response: {response[:200]}...")
        
    except Exception as e:
        print(f"❌ Question generation failed: {e}")
        print("💡 This might be due to API key issues or network problems")
        return False
    
    print("\n🎉 All tests passed! The pipeline should be working.")
    return True

if __name__ == "__main__":
    success = asyncio.run(debug_pipeline())
    
    if not success:
        print("\n❌ Pipeline debugging failed")
        print("\nPossible solutions:")
        print("1. Check OpenAI API key")
        print("2. Check network connectivity")
        print("3. Verify all dependencies are installed")
        print("4. Check if the PDF is actually being processed by the server")
    else:
        print("\n✅ Pipeline is working correctly!")
        print("\nIf questions still aren't updating, the issue might be:")
        print("1. Server not restarting after code changes")
        print("2. Frontend not calling the updated API")
        print("3. Caching issues in the browser")
