====================================================================
PRAXIS AI - QUICK START COMMANDS
====================================================================

IMPORTANT: Close all editors and terminals in this folder first!

====================================================================
1. RENAME FOLDERS
====================================================================

cd /c/Users/Admin/Desktop/Cursor
cd Spectra-Clinical
mv spectra-app praxis-ai
cd ..
mv Spectra-Clinical Praxis-AI
cd Praxis-AI

====================================================================
2. INITIALIZE GIT & COMMIT
====================================================================

git init
git add .
git commit -m "feat: initial commit - Praxis AI platform

Complete clinical workflow management system with AI-powered
report generation for NDIS healthcare professionals.

Developed by JD Digital Systems

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

====================================================================
3. ADD GITHUB REMOTE (replace YOUR_USERNAME)
====================================================================

git remote add origin https://github.com/YOUR_USERNAME/Praxis-AI.git

====================================================================
4. PUSH TO GITHUB
====================================================================

git branch -M main
git push -u origin main

====================================================================
ALTERNATIVE: If repository doesn't exist yet
====================================================================

1. Go to: https://github.com/new
2. Name: Praxis-AI
3. DO NOT initialize with README
4. Click "Create repository"
5. Then run the commands above

====================================================================
VERIFY
====================================================================

Visit: https://github.com/YOUR_USERNAME/Praxis-AI
Check that all files are present and README displays correctly

====================================================================
