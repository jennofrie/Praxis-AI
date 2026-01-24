# GitHub Setup Guide for Praxis AI

## Step 1: Close All Open Files and Terminals

Before proceeding, close:
- All IDE windows (VS Code, etc.) with this project open
- All terminal windows in this directory
- Any file explorers showing this folder

## Step 2: Rename Folders

Open a new terminal and run these commands:

```bash
# Navigate to the parent directory
cd /c/Users/Admin/Desktop/Cursor

# Rename the inner folder first
cd Spectra-Clinical
mv spectra-app praxis-ai

# Go back to parent
cd ..

# Rename the main project folder
mv Spectra-Clinical Praxis-AI
```

## Step 3: Initialize Git Repository

```bash
# Navigate to the renamed project
cd Praxis-AI

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "feat: initial commit - Praxis AI clinical workflow platform

- Complete project rebrand from Spectra Clinical to Praxis AI
- Comprehensive documentation suite (README, ARCHITECTURE, SECURITY, etc.)
- Next.js 16 application with TypeScript and Tailwind CSS
- AI-powered clinical workflow management system
- NDIS compliance and healthcare data security
- Designed for scale (1,000+ concurrent users)

Developed by JD Digital Systems

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

## Step 4: Add GitHub Remote

```bash
# Add your GitHub repository as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/Praxis-AI.git

# Or if you've already created the Praxis-AI repository on GitHub:
# git remote add origin git@github.com:YOUR_USERNAME/Praxis-AI.git
```

## Step 5: Push to GitHub

```bash
# Push to GitHub (first time)
git push -u origin main

# Or if your default branch is 'master':
# git branch -M main
# git push -u origin main
```

## Alternative: If You Haven't Created the GitHub Repository Yet

1. Go to https://github.com/new
2. Repository name: `Praxis-AI`
3. Description: "AI-powered clinical workflow management platform for NDIS healthcare professionals"
4. Keep it Public or Private (your choice)
5. **DO NOT** initialize with README (we already have one)
6. Click "Create repository"
7. Copy the repository URL
8. Then run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/Praxis-AI.git
git branch -M main
git push -u origin main
```

## Step 6: Verify

After pushing, verify everything is on GitHub:
- Go to https://github.com/YOUR_USERNAME/Praxis-AI
- Check that all files are present
- Verify the README.md displays correctly

## Project Structure After Rename

```
Praxis-AI/
├── .designs/              # UI design mockups
├── praxis-ai/             # Next.js application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── README.md              # Main documentation
├── ARCHITECTURE.md        # System architecture
├── CLAUDE.md              # AI development guidelines
├── SECURITY.md            # Security policies
├── CONTRIBUTING.md        # Contribution guidelines
├── CHANGELOG.md           # Version history
├── API.md                 # API documentation
├── DEPLOYMENT.md          # Deployment guide
├── TESTING.md             # Testing guide
└── .gitignore            # Git ignore rules
```

## Troubleshooting

### If folder rename fails:
1. Close ALL applications that might have files open
2. Restart your computer if necessary
3. Try the rename commands again

### If git push fails with authentication:
```bash
# Use GitHub CLI (recommended)
gh auth login

# Or set up SSH keys:
# https://docs.github.com/en/authentication/connecting-to-github-with-ssh
```

### If you need to change the commit message:
```bash
git commit --amend -m "Your new commit message"
```

## Next Steps After Push

1. **Set up GitHub Actions** (optional)
   - CI/CD workflows are defined in the documentation
   - Create `.github/workflows/` directory
   - Add workflow files for automated testing and deployment

2. **Configure Branch Protection** (recommended)
   - Go to repository Settings → Branches
   - Add rule for `main` branch
   - Enable "Require pull request reviews before merging"
   - Enable "Require status checks to pass before merging"

3. **Add Repository Topics**
   - Go to repository main page
   - Click the gear icon next to "About"
   - Add topics: `healthcare`, `ndis`, `clinical-workflow`, `nextjs`, `ai`, `typescript`

4. **Create Development Branch**
   ```bash
   git checkout -b develop
   git push -u origin develop
   ```

5. **Invite Collaborators**
   - Go to Settings → Collaborators
   - Add team members

---

**Developed by**: JD Digital Systems
**Last Updated**: January 25, 2026
