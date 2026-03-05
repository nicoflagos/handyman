import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function normalizeBase(base: string) {
  let result = base.trim();
  if (!result.startsWith('/')) result = `/${result}`;
  if (!result.endsWith('/')) result = `${result}/`;
  return result;
}

function computeBase() {
  // Preferred: explicit override.
  if (process.env.VITE_BASE) return normalizeBase(process.env.VITE_BASE);

  // Fallback: GitHub Actions pages build (owner/repo -> /repo/).
  const isGitHubActions =
    process.env.GITHUB_ACTIONS === 'true' || process.env.GITHUB_ACTIONS === '1' || !!process.env.GITHUB_WORKFLOW;
  const repo = process.env.GITHUB_REPOSITORY; // e.g. "owner/handyman"
  if (isGitHubActions && repo && repo.includes('/')) {
    const repoName = repo.split('/')[1];
    if (repoName) return `/${repoName}/`;
  }

  // Default: root deployments (Render).
  return '/';
}

export default defineConfig({
  plugins: [react()],
  // For GitHub Pages, this must be /<repo>/ so assets load correctly.
  // For Render/root, this stays '/'.
  base: computeBase(),
});
