# Frequently Asked Questions & Common Issues

## 🚀 **Deployment Issues**

### Q: The app is deployed but recipe generation doesn't work
**A:** This usually means the OpenAI API key isn't set correctly.
- Go to your Vercel dashboard
- Navigate to Settings → Environment Variables
- Add `OPENAI_API_KEY` with your actual OpenAI API key
- Redeploy the application

### Q: PDF upload works but RAG chat says "no ingredients found"
**A:** This was a known issue that has been fixed! The system prompt has been updated to better detect ingredients from uploaded PDFs. If you're still experiencing this:
- Make sure your PDF contains text (not just images)
- Try uploading a simple grocery list or recipe PDF
- Check the Vercel function logs for any errors

### Q: Backend returns 500 errors
**A:** Check these common causes:
- Missing `OPENAI_API_KEY` environment variable
- Invalid OpenAI API key
- Rate limiting from OpenAI
- Check Vercel function logs for detailed error messages

## 🔧 **Development Issues**

### Q: Local development setup problems
**A:** Follow these steps:
1. **Backend setup:**
   ```bash
   cd api
   pip install -r requirements.txt
   cp env.example .env
   # Add your OpenAI API key to .env
   python app.py
   ```

2. **Frontend setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Q: PDF processing not working locally
**A:** Make sure you have all required dependencies:
```bash
pip install PyPDF2 numpy python-dotenv openai
```

### Q: Frontend can't connect to backend
**A:** Check that:
- Backend is running on port 8000
- Frontend is running on port 3000
- No CORS issues (should be handled automatically)

## 📱 **Feature Questions**

### Q: Can I upload multiple PDFs?
**A:** Yes! You can upload multiple PDFs and the RAG system will search across all of them when generating recipes.

### Q: What types of PDFs work best?
**A:** The system works best with:
- Text-based PDFs (not scanned images)
- Grocery lists
- Recipe collections
- Ingredient lists
- Cooking guides

### Q: How accurate is the nutritional information?
**A:** The nutritional information is estimated based on ingredients and serving sizes. It's a good approximation but not a substitute for professional nutritional analysis.

### Q: Can I customize the recipe generation?
**A:** Yes! You can specify:
- Cuisine type (8 options)
- Dietary restrictions (8 options)
- Cooking time (strict limits)
- Number of servings
- Specific ingredients

## 🐛 **Troubleshooting**

### Common Error Messages

**"I don't see any ingredients in the uploaded documents"**
- This issue has been fixed in the latest version
- Make sure you're using the updated deployment
- Try uploading a simple grocery list PDF

**"OpenAI API key not found"**
- Set the `OPENAI_API_KEY` environment variable in Vercel
- Make sure the key is valid and has sufficient credits

**"Module not found" errors**
- All required dependencies are included in `api/requirements.txt`
- Redeploy to ensure all packages are installed

**PDF upload fails**
- Check file size (should be under 10MB)
- Ensure PDF contains extractable text
- Try with a different PDF file

## 📞 **Getting Help**

If you run into an issue not covered here:

1. **Check the logs:**
   - Vercel function logs in the dashboard
   - Browser developer console for frontend errors

2. **Test the endpoints directly:**
   ```bash
   # Health check
   curl https://your-app.vercel.app/api/health
   
   # Test recipe generation
   curl -X POST "https://your-app.vercel.app/api/chat" \
     -H "Content-Type: application/json" \
     -d '{"developer_message": "Generate a recipe", "user_message": "Ingredients: chicken, rice", "model": "gpt-4.1-mini"}'
   ```

3. **Submit an issue:**
   - Create a GitHub issue with:
     - Description of the problem
     - Steps to reproduce
     - Error messages
     - Browser/device information

4. **Check the documentation:**
   - [README.md](README.md) - Main project documentation
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
   - [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) - Vercel-specific guide

---

**💡 Pro Tip:** Most issues are related to missing environment variables or API key problems. Always check your Vercel dashboard first!
