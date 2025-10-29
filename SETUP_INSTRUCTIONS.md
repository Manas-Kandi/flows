# Setup Instructions

## ⚠️ Important: Module Resolution

You're seeing import errors for `@flows/cad-kernel` because the workspace package hasn't been linked yet. This is **normal** and **expected**.

### Fix All Import Errors

Run this single command from the project root:

```bash
pnpm install
```

This will:
1. ✅ Link the `@flows/cad-kernel` workspace package
2. ✅ Install all dependencies
3. ✅ Resolve all TypeScript import errors
4. ✅ Set up the monorepo correctly

---

## 🚀 Complete Setup Process

### Step 1: Install & Link
```bash
# From project root
pnpm install
```

### Step 2: Build CAD Kernel
```bash
# Build the cad-kernel package
pnpm --filter @flows/cad-kernel build
```

### Step 3: Start Development
```bash
# Start the web app
pnpm --filter @flows/web dev
```

Your app will be running at `http://localhost:5173`

---

## 📦 What Was Created

### New Package: @flows/cad-kernel

A new workspace package located at `packages/cad-kernel/` with:

- ✅ Core CAD geometry types
- ✅ Sketch plane system
- ✅ Feature dependency graph
- ✅ Profile extraction
- ✅ Extrude feature implementation

### Updated Package: @flows/web

Added dependency in `apps/web/package.json`:

```json
{
  "dependencies": {
    "@flows/cad-kernel": "workspace:^",
    ...
  }
}
```

---

## 🔧 Troubleshooting

### Still seeing import errors after `pnpm install`?

1. **Clear cache**:
   ```bash
   pnpm store prune
   pnpm install
   ```

2. **Rebuild TypeScript**:
   ```bash
   pnpm --filter @flows/cad-kernel build
   pnpm --filter @flows/web type-check
   ```

3. **Restart IDE**: Close and reopen VS Code/your editor

### Build errors?

Make sure you're using:
- Node.js 18 or higher
- pnpm 8 or higher

Check versions:
```bash
node --version
pnpm --version
```

---

## ✅ Verification

After setup, you should see:

1. ✅ No TypeScript errors
2. ✅ `node_modules/@flows/cad-kernel` symlink exists
3. ✅ `pnpm list @flows/cad-kernel` shows the package
4. ✅ Dev server starts without errors

---

## 📁 Workspace Structure

```
flows/
├── packages/
│   ├── cad-kernel/          # ← New package
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── constraint-solver/   # ← Existing package
│
├── apps/
│   └── web/                 # ← Updated with new dependency
│       └── package.json     # ← Added @flows/cad-kernel
│
├── package.json             # ← Root workspace config
└── pnpm-workspace.yaml      # ← Workspace packages
```

---

## 🎯 Next Steps

Once setup is complete:

1. **Explore the viewport**: Open the app and see the 3D viewport
2. **Read the docs**: Check `QUICK_START.md` for usage examples
3. **Try creating a feature**: Follow examples in `IMPLEMENTATION_SUMMARY.md`

---

## 💬 Need Help?

- Check `QUICK_START.md` for basic usage
- Check `IMPLEMENTATION_SUMMARY.md` for architecture details
- Check `docs/2D_3D_INTEGRATION_ARCHITECTURE.md` for full spec

---

## 🎉 You're All Set!

After running `pnpm install`, all import errors will disappear and you'll have a fully functional 2D-3D CAD integration system ready to use!
