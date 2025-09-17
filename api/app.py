# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI
import os
import shutil
import sys
from pathlib import Path
from typing import Optional, List

# Add the parent directory to the Python path to import aimakerspace
sys.path.append(str(Path(__file__).parent.parent))

# Import aimakerspace components for RAG functionality
from aimakerspace.text_utils import PDFLoader, CharacterTextSplitter
from aimakerspace.vectordatabase import VectorDatabase
from aimakerspace.openai_utils.chatmodel import ChatOpenAI

# Initialize FastAPI application with a title
app = FastAPI(title="OpenAI Chat API with RAG")

# Configure CORS (Cross-Origin Resource Sharing) middleware
# This allows the API to be accessed from different domains/origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,  # Allows cookies to be included in requests
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers in requests
)

# Global variables for RAG system
vector_db: Optional[VectorDatabase] = None
chat_model: Optional[ChatOpenAI] = None

# Use /tmp for Vercel serverless functions (read-only file system)
pdf_upload_path = Path("/tmp/pdf_data/uploads")
pdf_processed_path = Path("/tmp/pdf_data/processed")

# Ensure directories exist
pdf_upload_path.mkdir(parents=True, exist_ok=True)
pdf_processed_path.mkdir(parents=True, exist_ok=True)

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    developer_message: str  # Message from the developer/system
    user_message: str      # Message from the user
    model: Optional[str] = "gpt-4.1-mini"  # Optional model selection with default

class RAGChatRequest(BaseModel):
    user_message: str      # Message from the user
    model: Optional[str] = "gpt-4o-mini"  # Optional model selection with default

class UploadResponse(BaseModel):
    message: str
    filename: str
    status: str

class SuggestedQuestion(BaseModel):
    question: str
    category: str
    confidence: float

class QuestionSuggestionsResponse(BaseModel):
    questions: List[SuggestedQuestion]
    content_summary: str

class DeleteResponse(BaseModel):
    message: str
    filename: str
    status: str

class ClearAllResponse(BaseModel):
    message: str
    deleted_count: int
    status: str

# Helper functions for RAG functionality
async def initialize_rag_system():
    """Initialize the RAG system components."""
    global vector_db, chat_model
    
    try:
        vector_db = VectorDatabase()
        chat_model = ChatOpenAI(model_name="gpt-4o-mini")
        
        # Load existing processed PDFs if any
        await load_existing_pdfs()
        
        return True
    except Exception as e:
        print(f"Error initializing RAG system: {e}")
        return False

async def load_existing_pdfs():
    """Load and index existing PDFs from the processed directory."""
    global vector_db
    
    if not vector_db:
        return
    
    try:
        # Check if there are any processed PDFs
        pdf_files = list(pdf_processed_path.glob("*.pdf"))
        
        if pdf_files:
            print(f"Loading {len(pdf_files)} existing PDFs...")
            
            # Load PDFs and extract text
            pdf_loader = PDFLoader(str(pdf_processed_path))
            documents = pdf_loader.load_documents()
            
            if documents:
                # Split documents into chunks
                text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
                chunks = text_splitter.split_texts(documents)
                
                # Build vector database from chunks
                if vector_db:
                    await vector_db.abuild_from_list(chunks)
                print(f"Successfully indexed {len(chunks)} text chunks from existing PDFs")
        
    except Exception as e:
        print(f"Error loading existing PDFs: {e}")

async def process_uploaded_pdf(file_path: Path) -> bool:
    """Process an uploaded PDF file and add it to the vector database."""
    global vector_db
    
    if not vector_db:
        await initialize_rag_system()
    
    try:
        # Load PDF and extract text
        pdf_loader = PDFLoader(str(file_path))
        documents = pdf_loader.load_documents()
        
        if not documents:
            return False
        
        # Split documents into chunks
        text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_texts(documents)
        
        # Add chunks to vector database
        if vector_db:
            await vector_db.abuild_from_list(chunks)
        
        # Move processed PDF to processed directory
        processed_file_path = pdf_processed_path / file_path.name
        shutil.move(str(file_path), str(processed_file_path))
        
        print(f"Successfully processed PDF: {file_path.name} with {len(chunks)} chunks")
        return True
        
    except Exception as e:
        print(f"Error processing PDF {file_path.name}: {e}")
        return False

async def get_relevant_context(query: str, k: int = 5) -> List[str]:
    """Retrieve relevant context from the vector database for a given query."""
    global vector_db
    
    if not vector_db:
        return []
    
    try:
        # Search for relevant chunks
        relevant_chunks = vector_db.search_by_text(query, k=k, return_as_text=True)
        # Ensure we return List[str] as expected
        if isinstance(relevant_chunks, list) and relevant_chunks:
            if isinstance(relevant_chunks[0], str):
                return relevant_chunks
            else:
                # If it's List[Tuple[str, float]], extract just the strings
                return [chunk[0] for chunk in relevant_chunks if isinstance(chunk, tuple) and len(chunk) > 0]
        return []
    except Exception as e:
        print(f"Error retrieving context: {e}")
        return []

async def delete_pdf_from_vector_db(filename: str) -> bool:
    """Remove PDF content from vector database by filename."""
    global vector_db
    
    if not vector_db:
        return False
    
    try:
        # Note: This is a simplified approach. In a production system, you'd want
        # to track which chunks belong to which PDF for more precise deletion.
        # For now, we'll rebuild the vector database without the deleted PDF.
        
        # Get all remaining processed PDFs
        remaining_pdfs = []
        for pdf_file in pdf_processed_path.glob("*.pdf"):
            if pdf_file.name != filename:
                remaining_pdfs.append(pdf_file)
        
        if not remaining_pdfs:
            # No PDFs left, clear the vector database
            vector_db = VectorDatabase()
            return True
        
        # Rebuild vector database with remaining PDFs
        vector_db = VectorDatabase()
        pdf_loader = PDFLoader(str(pdf_processed_path))
        documents = pdf_loader.load_documents()
        
        if documents:
            text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            chunks = text_splitter.split_texts(documents)
            await vector_db.abuild_from_list(chunks)
        
        return True
        
    except Exception as e:
        print(f"Error deleting PDF from vector database: {e}")
        return False

async def generate_question_suggestions() -> QuestionSuggestionsResponse:
    """Generate relevant question suggestions based on uploaded PDF content."""
    global vector_db, chat_model
    
    if not vector_db:
        return QuestionSuggestionsResponse(
            questions=[],
            content_summary="No PDFs uploaded yet"
        )
    
    try:
        # Get comprehensive content from multiple query strategies to ensure we cover all sources
        query_strategies = [
            "cooking ingredients recipes food",
            "meal planning nutrition health", 
            "shopping list ingredients preparation",
            "dietary guidelines food safety"
        ]
        
        all_chunks = []
        for query in query_strategies:
            chunks = await get_relevant_context(query, k=5)
            all_chunks.extend(chunks)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_chunks = []
        for chunk in all_chunks:
            if chunk not in seen:
                seen.add(chunk)
                unique_chunks.append(chunk)
        
        if not unique_chunks:
            return QuestionSuggestionsResponse(
                questions=[],
                content_summary="No content available in uploaded PDFs"
            )
        
        # Generate questions using the chat model
        if not chat_model:
            await initialize_rag_system()
        
        if not chat_model:
            raise Exception("Chat model not available")
        
        # Generate dynamic questions based on actual PDF content
        try:
            # Create a comprehensive prompt that emphasizes cross-source questions
            content_text = "\n\n".join(unique_chunks[:8])  # Use first 8 chunks for comprehensive coverage
            
            prompt = f"""Based on the following content from uploaded documents, generate 8-12 relevant cooking and recipe questions. 
            IMPORTANT: The questions should demonstrate that you're using information from ALL the sources provided.
            Make sure questions reference multiple documents and show cross-source connections.

            Content from documents:
            {content_text}

            Generate questions that:
            1. Reference ingredients or information from multiple sources
            2. Show cross-source connections (e.g., "Based on the shopping lists and ingredient guides...")
            3. Demonstrate comprehensive understanding of all uploaded content
            4. Cover practical cooking scenarios using the combined information
            5. Include questions that compare or combine information from different sources

            Categories to cover:
            - Recipe creation using available ingredients from multiple sources
            - Cooking techniques and methods across different documents
            - Meal planning and preparation using combined information
            - Flavor pairing and seasoning from various guides
            - Dietary considerations from multiple sources
            - Time-efficient cooking using all available resources

            Return the questions in this format:
            Category: [category_name]
            Question: [question_text that references multiple sources]
            Confidence: [0.0-1.0]

            Separate each question with a blank line."""

            # Generate questions using the chat model
            messages = [
                {"role": "system", "content": "You are a helpful cooking assistant that generates relevant questions based on multiple ingredient lists, shopping lists, and cooking guides. Always create questions that demonstrate understanding of ALL sources and show cross-source connections."},
                {"role": "user", "content": prompt}
            ]
            
            response = chat_model.run(messages)
            generated_text = response.strip()
            
            # Parse the generated questions
            questions = []
            lines = generated_text.split('\n')
            current_question = {}
            
            for line in lines:
                line = line.strip()
                if line.startswith('Category:'):
                    if current_question:
                        questions.append(SuggestedQuestion(**current_question))
                    current_question = {'category': line.replace('Category:', '').strip()}
                elif line.startswith('Question:'):
                    current_question['question'] = line.replace('Question:', '').strip()
                elif line.startswith('Confidence:'):
                    try:
                        current_question['confidence'] = float(line.replace('Confidence:', '').strip())
                    except:
                        current_question['confidence'] = 0.7
            
            # Add the last question if it exists
            if current_question and 'question' in current_question:
                questions.append(SuggestedQuestion(**current_question))
            
            # If we didn't get good questions, fall back to some generic ones
            if len(questions) < 3:
                questions = [
                    SuggestedQuestion(question="What recipes can I make using ingredients from all the uploaded documents?", category="recipe_creation", confidence=0.8),
                    SuggestedQuestion(question="How can I prepare a balanced meal using items from multiple shopping lists?", category="meal_planning", confidence=0.7),
                    SuggestedQuestion(question="What cooking techniques work best for the ingredients across all sources?", category="techniques", confidence=0.7),
                ]
            
            # Count unique sources referenced in questions
            source_count = len(set([chunk.split('\n')[0] for chunk in unique_chunks if chunk.startswith('[SOURCE:')]))
            
            return QuestionSuggestionsResponse(
                questions=questions,
                content_summary=f"Generated {len(questions)} questions using content from {source_count} uploaded documents"
            )
            
        except Exception as e:
            print(f"Error generating dynamic questions: {e}")
            # Fallback to basic questions if AI generation fails
            fallback_questions = [
                SuggestedQuestion(question="What recipes can I make using ingredients from all the uploaded documents?", category="recipe_creation", confidence=0.8),
                SuggestedQuestion(question="How can I prepare a balanced meal using items from multiple shopping lists?", category="meal_planning", confidence=0.7),
                SuggestedQuestion(question="What cooking techniques work best for the ingredients across all sources?", category="techniques", confidence=0.7),
            ]
            
            return QuestionSuggestionsResponse(
                questions=fallback_questions,
                content_summary="Basic questions generated from uploaded document content"
            )
        
    except Exception as e:
        print(f"Error generating question suggestions: {e}")
        return QuestionSuggestionsResponse(
            questions=[],
            content_summary=f"Error generating suggestions: {str(e)}"
        )

# Define the main chat endpoint that handles POST requests
@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        # Get API key from environment variable
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured on server")
        
        # Initialize OpenAI client with the API key from environment
        client = OpenAI(api_key=api_key)
        
        # Create an async generator function for streaming responses
        async def generate():
            # Create a streaming chat completion request
            stream = client.chat.completions.create(
                model=request.model or "gpt-4.1-mini",
                messages=[
                    {"role": "developer", "content": request.developer_message},
                    {"role": "user", "content": request.user_message}
                ],
                stream=True  # Enable streaming response
            )
            
            # Yield each chunk of the response as it becomes available
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        # Return a streaming response to the client
        return StreamingResponse(generate(), media_type="text/plain")
    
    except Exception as e:
        # Handle any errors that occur during processing
        raise HTTPException(status_code=500, detail=str(e))

# PDF Upload endpoint
@app.post("/api/upload-pdf", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    """Upload and process a PDF file for RAG functionality."""
    try:
        # Validate file type
        if not file.filename or not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Save uploaded file
        file_path = pdf_upload_path / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process the PDF
        success = await process_uploaded_pdf(file_path)
        
        if success:
            return UploadResponse(
                message=f"PDF '{file.filename}' uploaded and processed successfully",
                filename=file.filename,
                status="success"
            )
        else:
            # Clean up failed upload
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(status_code=500, detail="Failed to process PDF file")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}") from e

# RAG Chat endpoint
@app.post("/api/rag-chat")
async def rag_chat(request: RAGChatRequest):
    """Chat with the uploaded PDFs using RAG."""
    try:
        # Initialize RAG system if not already done
        if not vector_db or not chat_model:
            await initialize_rag_system()
        
        if not vector_db:
            raise HTTPException(status_code=500, detail="RAG system not initialized")
        
        # Get relevant context from PDFs
        relevant_context = await get_relevant_context(request.user_message, k=5)
        
        if not relevant_context:
            return StreamingResponse(
                iter(["I don't have any PDF documents loaded yet. Please upload a PDF first to ask questions about it."]),
                media_type="text/plain"
            )
        
        # Prepare context for the LLM
        context_text = "\n\n".join(relevant_context)
        
        # Create messages for the chat model
        messages = [
            {
                "role": "system", 
                "content": f"""You are a helpful cooking assistant that can work with uploaded PDF documents in two ways:

1. ANSWER QUESTIONS: When asked about information in the uploaded documents, provide detailed answers based only on the provided context.

2. GENERATE RECIPES: When asked to create recipes using ingredients from the uploaded documents, you can generate new recipes using the ingredients mentioned in the context.

IMPORTANT RULES:
- For factual questions about the documents: Only use information from the provided context
- For recipe generation: Use ingredients from the context to create new, creative recipes
- Always be helpful and provide detailed, practical cooking advice
- CAREFULLY examine the context for ingredients before saying none are available
- Look for any food items, produce, pantry items, or cooking ingredients mentioned in the context
- Only say "I don't see any ingredients in the uploaded documents to create a recipe with" if you have thoroughly searched the context and found NO food items whatsoever

RECIPE GENERATION REQUIREMENTS:
When creating recipes, ALWAYS include:
- Recipe title
- Description
- Prep time and cook time (be specific with minutes)
- Total time
- Number of servings
- Complete ingredient list with quantities
- Step-by-step instructions with cooking times for each step
- Cooking tips and techniques
- Estimated difficulty level

Context from uploaded PDFs:
{context_text}"""
            },
            {
                "role": "user", 
                "content": request.user_message
            }
        ]
        
        # Create streaming response
        async def generate():
            if chat_model:
                async for chunk in chat_model.astream(messages):
                    yield chunk
            else:
                yield "Error: Chat model not initialized"
        
        return StreamingResponse(generate(), media_type="text/plain")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get uploaded PDFs endpoint
@app.get("/api/pdfs")
async def get_uploaded_pdfs():
    """Get list of uploaded and processed PDFs."""
    try:
        pdf_files = []
        
        # Get processed PDFs
        for pdf_file in pdf_processed_path.glob("*.pdf"):
            pdf_files.append({
                "filename": pdf_file.name,
                "status": "processed",
                "size": pdf_file.stat().st_size
            })
        
        # Get uploaded but not yet processed PDFs
        for pdf_file in pdf_upload_path.glob("*.pdf"):
            pdf_files.append({
                "filename": pdf_file.name,
                "status": "uploaded",
                "size": pdf_file.stat().st_size
            })
        
        return {"pdfs": pdf_files}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Delete PDF endpoint
@app.delete("/api/pdfs/{filename}", response_model=DeleteResponse)
async def delete_pdf(filename: str):
    """Delete a PDF file from both storage and vector database."""
    try:
        # Check if file exists in processed directory
        processed_file_path = pdf_processed_path / filename
        uploaded_file_path = pdf_upload_path / filename
        
        file_exists = False
        file_location = ""
        
        if processed_file_path.exists():
            file_exists = True
            file_location = "processed"
        elif uploaded_file_path.exists():
            file_exists = True
            file_location = "uploaded"
        
        if not file_exists:
            raise HTTPException(status_code=404, detail=f"PDF '{filename}' not found")
        
        # Remove from vector database if it was processed
        if file_location == "processed":
            vector_success = await delete_pdf_from_vector_db(filename)
            if not vector_success:
                print(f"Warning: Failed to remove {filename} from vector database")
        
        # Delete the physical file
        file_to_delete = processed_file_path if file_location == "processed" else uploaded_file_path
        file_to_delete.unlink()
        
        return DeleteResponse(
            message=f"PDF '{filename}' deleted successfully from {file_location} directory",
            filename=filename,
            status="success"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}") from e

# Clear all PDFs endpoint
@app.delete("/api/pdfs", response_model=ClearAllResponse)
async def clear_all_pdfs():
    """Delete all PDF files from both storage and vector database."""
    try:
        deleted_count = 0
        
        # Delete all processed PDFs
        for pdf_file in pdf_processed_path.glob("*.pdf"):
            pdf_file.unlink()
            deleted_count += 1
        
        # Delete all uploaded PDFs
        for pdf_file in pdf_upload_path.glob("*.pdf"):
            pdf_file.unlink()
            deleted_count += 1
        
        # Clear vector database
        global vector_db
        vector_db = VectorDatabase()
        
        return ClearAllResponse(
            message=f"Successfully deleted {deleted_count} PDF files and cleared vector database",
            deleted_count=deleted_count,
            status="success"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clear all failed: {str(e)}") from e

# Get question suggestions endpoint
@app.get("/api/suggest-questions", response_model=QuestionSuggestionsResponse)
async def get_question_suggestions():
    """Get relevant question suggestions based on uploaded PDF content."""
    try:
        # Initialize RAG system if not already done
        if not vector_db or not chat_model:
            await initialize_rag_system()
        
        return await generate_question_suggestions()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
