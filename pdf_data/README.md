# PDF Data Storage

This directory contains PDF files for the RAG (Retrieval-Augmented Generation) system.

## Structure

- `uploads/` - Temporary storage for uploaded PDF files
- `processed/` - Processed and indexed PDF content for RAG queries

## Usage

PDFs uploaded through the frontend are temporarily stored in `uploads/` and then processed to extract text content. The extracted text is chunked and indexed using the aimakerspace library for efficient retrieval during chat queries.

## Supported PDF Types

- Cooking recipes
- Ingredient lists
- Food preparation guides
- Nutritional information
- Any text-based PDF content
