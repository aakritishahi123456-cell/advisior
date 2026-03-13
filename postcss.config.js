module.exports = {
  plugins: {
    // Ensures Tailwind works even when running from monorepo root (workspaces).
    tailwindcss: { config: './apps/web/tailwind.config.js' },
    autoprefixer: {},
  },
}

