import { Colors, Typography } from '@/constants/theme';

// Shared with every pushed detail screen (order/catalogue/announcement
// detail) across the tab stacks — a plain object so each stack's _layout.tsx
// gets the same back-arrow header instead of redefining it per file.
export const detailHeaderOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: Colors.surface },
  headerShadowVisible: false,
  // iOS centers the title by default; Android's native header left-aligns
  // it next to the back button. Force center on both so it's consistent.
  headerTitleAlign: 'center' as const,
  // Quiet ink, not the brand gold — gold is reserved for real calls to
  // action, not chrome like the back button.
  headerTintColor: Colors.textPrimary,
  headerTitleStyle: { color: Colors.textPrimary, fontWeight: Typography.weightSemibold },
  headerBackTitle: 'Back',
} as const;
