# Branch Protection Setup Guide

This guide explains how to set up branch protection for the `main` branch on GitHub to ensure production stability.

## Steps to Protect the Main Branch

1. **Navigate to Repository Settings**
   - Go to your GitHub repository: https://github.com/AaronPG095/kollektiv-spinnen-timetable
   - Click on **Settings** (top navigation bar)

2. **Access Branch Protection Rules**
   - In the left sidebar, click on **Branches**
   - Under "Branch protection rules", click **Add rule** or edit the existing rule for `main`

3. **Configure Protection Rules**
   
   Set the following settings:
   
   - **Branch name pattern**: `main`
   
   - **Protect matching branches**: ✅ Enable
   
   - **Required settings**:
     - ✅ **Require a pull request before merging**
       - ✅ Require approvals: `1` (since you're solo, you can self-approve)
       - ✅ Dismiss stale pull request approvals when new commits are pushed
     - ✅ **Require status checks to pass before merging** (optional, if you add CI/CD later)
     - ✅ **Require conversation resolution before merging** (optional)
     - ✅ **Require signed commits** (optional, for extra security)
   
   - **Restrict who can push to matching branches**: Leave unchecked (you need to be able to merge)
   
   - **Rules applied to everyone including administrators**: ✅ Enable (applies to you too)
   
   - **Prevent force pushes**: ✅ Enable
   
   - **Prevent deletion of this branch**: ✅ Enable
   
   - **Do not allow bypassing the above settings**: ✅ Enable (recommended)

4. **Save the Rule**
   - Click **Create** or **Save changes**

## What This Means

After setting up branch protection:
- You cannot directly push to `main` (must use pull requests)
- You cannot force push to `main` (prevents accidental history rewrites)
- You cannot delete the `main` branch
- All changes to `main` must go through a pull request (even if you self-approve)

## Workflow After Protection

1. **For regular development**: Work on `develop` branch, push directly
2. **For production releases**: 
   - Create a pull request from `develop` → `main`
   - Review and approve the PR (you can self-approve)
   - Merge the PR
   - Vercel will automatically deploy the changes

## Quick Links

- Repository: https://github.com/AaronPG095/kollektiv-spinnen-timetable
- Branch Settings: https://github.com/AaronPG095/kollektiv-spinnen-timetable/settings/branches
