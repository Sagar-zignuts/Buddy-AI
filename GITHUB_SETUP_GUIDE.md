# Step-by-Step Guide: Push Buddy Project to GitHub

## Prerequisites
- Git installed on your system
- GitHub account created
- Terminal/Command line access

---

## Step 1: Initialize Git Repository (if not already done)

```bash
cd /Users/ztlab119/Desktop/Buddy
git init
```

---

## Step 2: Create a .gitignore File
✅ Already created! The `.gitignore` file has been set up to exclude:
- `node_modules/` folders
- `dist/` build folders
- Environment files (`.env`)
- IDE files
- OS files (`.DS_Store`)

---

## Step 3: Stage All Project Files

```bash
git add .
```

This adds all files in your project to the staging area (respecting .gitignore rules).

---

## Step 4: Create Your First Commit

```bash
git commit -m "Initial commit: Buddy project with backend and frontend"
```

---

## Step 5: Create a New Repository on GitHub

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right corner
3. Select **"New repository"**
4. Fill in the details:
   - **Repository name**: `Buddy` (or any name you prefer)
   - **Description**: (optional) Add a description
   - **Visibility**: Choose **Public** or **Private**
   - **DO NOT** initialize with README, .gitignore, or license (we already have files)
5. Click **"Create repository"**

---

## Step 6: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/Buddy.git

# Verify the remote was added
git remote -v
```

**Alternative (if you prefer SSH):**
```bash
git remote add origin git@github.com:YOUR_USERNAME/Buddy.git
```

---

## Step 7: Push Your Code to GitHub

```bash
# Push to the main branch
git branch -M main
git push -u origin main
```

If this is your first time pushing, you may be prompted for:
- **Username**: Your GitHub username
- **Password**: Use a **Personal Access Token** (not your GitHub password)

### How to Create a Personal Access Token:
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name and select scopes: `repo` (full control)
4. Click "Generate token"
5. **Copy the token immediately** (you won't see it again)
6. Use this token as your password when pushing

---

## Step 8: Verify Your Push

1. Go to your GitHub repository page
2. You should see all your files (backend/, frontend/, etc.)
3. Verify that `node_modules/` and `dist/` folders are NOT visible (thanks to .gitignore)

---

## Troubleshooting

### If you get "remote origin already exists":
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/Buddy.git
```

### If you need to update your commit:
```bash
git add .
git commit -m "Updated commit message"
git push -u origin main
```

### If you want to check what will be committed:
```bash
git status
```

---

## Future Updates

After making changes to your code:

```bash
git add .
git commit -m "Description of your changes"
git push
```

---

## Summary of Commands

```bash
# 1. Navigate to project
cd /Users/ztlab119/Desktop/Buddy

# 2. Initialize git (if needed)
git init

# 3. Add all files
git add .

# 4. Commit
git commit -m "Initial commit: Buddy project"

# 5. Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/Buddy.git

# 6. Push to GitHub
git branch -M main
git push -u origin main
```

---

**Note**: Make sure to replace `YOUR_USERNAME` with your actual GitHub username in the commands above!

