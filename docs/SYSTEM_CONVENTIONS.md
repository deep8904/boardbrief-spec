# BoardBrief System Conventions

This document outlines the architectural conventions and rules for the BoardBrief project.

## Module Structure

```
src/
  components/
    layout/       # Navigation, shell, page layout components
    ui/           # Shared presentational components (buttons, cards, etc.)
    features/     # Feature-specific UI components (no direct DB calls)
  lib/
    supabase/     # Supabase client & auth helpers ONLY
    api/          # HTTP client wrappers (call edge functions)
    query/        # TanStack Query keys & hooks
    validation/   # Zod schemas (shared between client/server)
    utils/        # Pure helper functions
  styles/
    design-tokens.ts  # Extracted palette, spacing, shadows
  pages/          # Route pages (minimal logic, use hooks)
```

## Data Flow Rules

1. **Pages must NOT call Supabase directly**
   - Pages use TanStack Query hooks only
   - This keeps pages thin and testable

2. **TanStack Query hooks call lib/api wrappers**
   - Hooks live in `src/lib/query/hooks/`
   - They define query keys and fetch logic

3. **lib/api wrappers call Edge Functions (for complex operations)**
   - Simple CRUD can use Supabase client directly in hooks
   - Complex business logic goes through Edge Functions

4. **Zod schemas are the single source of truth**
   - All validation schemas live in `src/lib/validation/`
   - Import these schemas everywhere (client & server)
   - Never duplicate validation logic

## Styling Rules

1. **Use design tokens exclusively**
   - Colors, shadows, spacing defined in `src/styles/design-tokens.ts`
   - Extended in `tailwind.config.ts`
   - Never use arbitrary Tailwind values for colors

2. **Semantic color classes**
   - `bg-surface` not `bg-white`
   - `text-text` not `text-gray-900`
   - `border-border` not `border-gray-200`

3. **Component variants over inline styles**
   - Create shadcn component variants for repeated patterns
   - Use `cva()` for variant definitions

## Authentication Rules

1. **Protected routes use AuthGuard component**
2. **Profile upsert on first login**
3. **Session managed via `useSession` hook**
4. **Never store auth state in localStorage manually**

## File Naming Conventions

- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utilities: `camelCase.ts`
- Types: `types.ts` or inline
- Constants: `SCREAMING_SNAKE_CASE`

## Import Aliases

- `@/` points to `src/`
- Always use aliases, never relative imports from parent directories

## Testing

- Unit tests for pure functions in `src/tests/`
- Integration tests for hooks and components (future)
- E2E tests with Playwright (future)
