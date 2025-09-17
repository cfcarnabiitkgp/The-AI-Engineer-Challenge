#!/usr/bin/env python3
"""
Test script to demonstrate how suggested questions use information from multiple PDF sources.
This script will:
1. Process multiple PDFs
2. Generate question suggestions
3. Show how questions reference content from all sources
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

async def test_multiple_pdf_question_generation():
    """Test question generation with multiple PDFs to show cross-source questions."""
    print("🧪 Testing Multiple PDF Question Generation")
    print("=" * 60)
    
    # Initialize components
    vector_db = VectorDatabase()
    chat_model = ChatOpenAI(model_name="gpt-4o-mini")
    
    # PDF files to test
    pdf_files = [
        "pdf_data/uploads/shopping_list_family_4.pdf",
        "pdf_data/uploads/VA_ingredients.pdf", 
        "pdf_data/uploads/WOYP_shopping_list.pdf",
        "pdf_data/uploads/CDC_guide.pdf"
    ]
    
    print(f"📚 Processing {len(pdf_files)} PDF files...")
    
    # Process each PDF and add to vector database
    all_chunks = []
    for pdf_file in pdf_files:
        if not os.path.exists(pdf_file):
            print(f"⚠️  Skipping {pdf_file} - file not found")
            continue
            
        print(f"\n📄 Processing: {Path(pdf_file).name}")
        
        try:
            # Load PDF and extract text
            pdf_loader = PDFLoader(pdf_file)
            documents = pdf_loader.load_documents()
            
            if not documents:
                print(f"❌ No content extracted from {pdf_file}")
                continue
            
            # Split documents into chunks
            text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            chunks = text_splitter.split_texts(documents)
            
            # Add source information to chunks for tracking
            source_name = Path(pdf_file).stem
            for i, chunk in enumerate(chunks):
                chunks[i] = f"[SOURCE: {source_name}]\n{chunk}"
            
            all_chunks.extend(chunks)
            print(f"✅ Extracted {len(chunks)} chunks from {Path(pdf_file).name}")
            
        except Exception as e:
            print(f"❌ Error processing {pdf_file}: {e}")
            continue
    
    if not all_chunks:
        print("❌ No content extracted from any PDFs")
        return
    
    # Build vector database from all chunks
    print(f"\n🔍 Building vector database with {len(all_chunks)} total chunks...")
    await vector_db.abuild_from_list(all_chunks)
    
    # Test different query strategies to show cross-source questions
    test_queries = [
        "cooking ingredients recipes food",
        "meal planning nutrition health",
        "shopping list ingredients preparation",
        "dietary guidelines food safety"
    ]
    
    print(f"\n🎯 Testing question generation with different query strategies...")
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n--- Test {i}: Query = '{query}' ---")
        
        # Get relevant context
        relevant_chunks = vector_db.search_by_text(query, k=8, return_as_text=True)
        
        if isinstance(relevant_chunks, list) and relevant_chunks:
            if isinstance(relevant_chunks[0], tuple):
                relevant_chunks = [chunk[0] for chunk in relevant_chunks]
        
        if not relevant_chunks:
            print("❌ No relevant context found")
            continue
        
        # Show which sources are represented
        sources_found = set()
        for chunk in relevant_chunks:
            if chunk.startswith("[SOURCE:"):
                source = chunk.split("]")[0].replace("[SOURCE: ", "")
                sources_found.add(source)
        
        print(f"📊 Sources represented: {', '.join(sources_found)}")
        print(f"📊 Total chunks retrieved: {len(relevant_chunks)}")
        
        # Create content summary for question generation
        content_text = "\n\n".join(relevant_chunks[:5])  # Use first 5 chunks
        
        # Generate questions
        prompt = f"""Based on the following content from multiple uploaded documents, generate 6-8 relevant cooking and recipe questions. 
        The questions should demonstrate that you're using information from ALL the sources provided.

        Content from documents (note the [SOURCE: filename] tags):
        {content_text}

        Generate questions that:
        1. Reference ingredients or information from multiple sources
        2. Show cross-source connections (e.g., "Based on the shopping lists and ingredient guides...")
        3. Demonstrate comprehensive understanding of all uploaded content
        4. Cover practical cooking scenarios using the combined information

        Return the questions in this format:
        Category: [category_name]
        Question: [question_text]
        Confidence: [0.0-1.0]
        Sources: [list of source files referenced]

        Separate each question with a blank line."""

        messages = [
            {"role": "system", "content": "You are a helpful cooking assistant that generates relevant questions based on multiple ingredient lists, shopping lists, and cooking guides. Always reference the specific sources when generating questions."},
            {"role": "user", "content": prompt}
        ]
        
        try:
            response = chat_model.run(messages)
            generated_text = response.strip()
            
            print("🤖 Generated Questions:")
            print("-" * 40)
            print(generated_text)
            
        except Exception as e:
            print(f"❌ Error generating questions: {e}")
    
    # Test a comprehensive query that should pull from all sources
    print(f"\n🌟 COMPREHENSIVE TEST: Generating questions using ALL sources")
    print("=" * 60)
    
    # Get a broader sample of content
    comprehensive_chunks = vector_db.search_by_text("ingredients food cooking recipes shopping meal", k=15, return_as_text=True)
    
    if isinstance(comprehensive_chunks, list) and comprehensive_chunks:
        if isinstance(comprehensive_chunks[0], tuple):
            comprehensive_chunks = [chunk[0] for chunk in comprehensive_chunks]
    
    if comprehensive_chunks:
        # Show comprehensive source analysis
        all_sources = set()
        for chunk in comprehensive_chunks:
            if chunk.startswith("[SOURCE:"):
                source = chunk.split("]")[0].replace("[SOURCE: ", "")
                all_sources.add(source)
        
        print(f"📚 All sources in comprehensive query: {', '.join(all_sources)}")
        print(f"📊 Total chunks for comprehensive analysis: {len(comprehensive_chunks)}")
        
        # Generate comprehensive questions
        comprehensive_content = "\n\n".join(comprehensive_chunks[:8])
        
        comprehensive_prompt = f"""Based on ALL the following content from multiple uploaded documents, generate 8-10 comprehensive cooking questions that clearly demonstrate you're using information from ALL sources.

        Content from ALL documents:
        {comprehensive_content}

        IMPORTANT: Your questions must:
        1. Explicitly reference multiple sources (e.g., "Using the shopping lists from [files] and the ingredient guide from [file]...")
        2. Show cross-source connections and comparisons
        3. Demonstrate comprehensive understanding of all uploaded content
        4. Be practical and actionable for someone with access to all this information

        Return questions in this format:
        Category: [category_name]
        Question: [question_text that references multiple sources]
        Confidence: [0.0-1.0]
        Sources: [specific source files referenced]

        Separate each question with a blank line."""

        comprehensive_messages = [
            {"role": "system", "content": "You are a comprehensive cooking assistant that analyzes multiple documents and generates questions that demonstrate understanding of ALL sources. Always explicitly reference which sources you're using."},
            {"role": "user", "content": comprehensive_prompt}
        ]
        
        try:
            comprehensive_response = chat_model.run(comprehensive_messages)
            print("🎯 Comprehensive Questions (Using ALL Sources):")
            print("-" * 50)
            print(comprehensive_response)
            
        except Exception as e:
            print(f"❌ Error generating comprehensive questions: {e}")
    
    print(f"\n✅ Multiple PDF question generation test completed!")
    print("\n📋 Summary:")
    print("- The system processes multiple PDFs and combines their content")
    print("- Questions are generated using information from ALL sources")
    print("- Source tracking allows verification of cross-source question generation")
    print("- Different query strategies can be used to explore different aspects of the combined content")

if __name__ == "__main__":
    asyncio.run(test_multiple_pdf_question_generation())
