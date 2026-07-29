# 代码质量与提交规范

这个项目按多人协作方式配置基础质量门禁，目标是让每个人本地和提交时使用同一套规则。

## 本地命令

```bash
pnpm lint
pnpm typecheck
pnpm format:check
pnpm quality
```

常用修复命令：

```bash
pnpm lint:fix
pnpm format
```

## 提交前检查

安装依赖后会自动执行：

```bash
pnpm prepare
```

它会把当前仓库的 Git hook 目录指向 `.githooks`：

```bash
git config core.hooksPath .githooks
```

提交时会自动运行：

```bash
node scripts/pre-commit.mjs
```

检查内容：

- 全量 `pnpm typecheck`
- 暂存的 JS/TS/Vue 文件执行 ESLint
- 暂存的代码、样式、JSON、Markdown 文件执行 Prettier check

提交钩子只做检查，不自动改代码。失败后先运行 `pnpm lint:fix` 或 `pnpm format`，再重新 `git add` 和提交。

## 代码风格

统一配置：

- `.editorconfig`：编辑器基础规则
- `.prettierrc.json`：格式化规则
- `.prettierignore`：格式化忽略范围
- `eslint.config.mjs`：代码质量和 Vue/Nuxt 规则

原则：

- 代码格式交给 Prettier
- 代码质量交给 ESLint
- 类型正确性交给 Nuxt typecheck
- 提交前只检查暂存文件格式，避免无关文件影响提交
- CI 或合并前可以运行 `pnpm quality` 做全量验证
