/**
 * BoardBrief Design System
 * Extracted from reference screenshots (Haven/Samfund SaaS aesthetic)
 * Premium, modern, soft - no harsh borders or dark mode
 */

export const colors = {
  // Core backgrounds
  bg: "hsl(210 20% 98%)",                    // Very light off-white
  surface: "hsl(0 0% 100%)",                 // Pure white cards
  surface2: "hsl(210 14% 97%)",              // Secondary surface

  // Text
  text: "hsl(220 25% 12%)",                  // Deep navy/near-black
  mutedText: "hsl(220 10% 50%)",             // Muted gray text

  // Borders - extremely subtle
  border: "hsl(220 14% 92%)",                // Very light border
  borderHover: "hsl(220 14% 85%)",           // Slightly visible on hover

  // Primary - bright clean blue (CTA button)
  primary: "hsl(200 100% 45%)",              // Bright blue
  primaryHover: "hsl(200 100% 40%)",         // Darker on hover
  primaryForeground: "hsl(0 0% 100%)",       // White text on primary

  // Accent - warm orange (credit card style)
  accent: "hsl(24 95% 55%)",                 // Warm orange
  accentForeground: "hsl(0 0% 100%)",        // White text on accent

  // Pastels (dashboard tiles)
  pastelMint: "hsl(90 65% 88%)",             // Lime/mint green
  pastelMintDark: "hsl(90 45% 35%)",         // Darker mint for text
  pastelSky: "hsl(190 80% 90%)",             // Sky blue
  pastelSkyDark: "hsl(190 60% 35%)",         // Darker sky for text
  pastelLavender: "hsl(45 85% 90%)",         // Soft yellow/cream
  pastelLavenderDark: "hsl(45 70% 35%)",     // Darker for text
  pastelPeach: "hsl(15 85% 92%)",            // Soft peach
  pastelPeachDark: "hsl(15 60% 40%)",        // Darker peach

  // Semantic
  success: "hsl(142 71% 45%)",
  successBg: "hsl(142 76% 95%)",
  warning: "hsl(38 92% 50%)",
  warningBg: "hsl(48 96% 95%)",
  danger: "hsl(0 84% 60%)",
  dangerBg: "hsl(0 86% 97%)",
} as const;

export const radius = {
  sm: "12px",
  md: "16px",
  lg: "20px",
  xl: "24px",
  "2xl": "28px",
  full: "9999px",
} as const;

export const shadows = {
  sm: "0 1px 3px 0 hsl(220 25% 12% / 0.04), 0 1px 2px -1px hsl(220 25% 12% / 0.02)",
  md: "0 4px 8px -2px hsl(220 25% 12% / 0.06), 0 2px 4px -2px hsl(220 25% 12% / 0.03)",
  lg: "0 12px 24px -4px hsl(220 25% 12% / 0.08), 0 4px 8px -2px hsl(220 25% 12% / 0.04)",
  xl: "0 20px 40px -8px hsl(220 25% 12% / 0.1), 0 8px 16px -4px hsl(220 25% 12% / 0.05)",
  card: "0 2px 8px -2px hsl(220 25% 12% / 0.05), 0 0 0 1px hsl(220 14% 92% / 0.6)",
  cardHover: "0 8px 24px -4px hsl(220 25% 12% / 0.08), 0 0 0 1px hsl(220 14% 85% / 0.8)",
  nav: "0 4px 16px -4px hsl(220 25% 12% / 0.1)",
} as const;

export const gradients = {
  hero: "linear-gradient(135deg, hsl(210 20% 98%) 0%, hsl(200 30% 96%) 100%)",
  card: "linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(210 14% 99%) 100%)",
  pastelMint: "linear-gradient(135deg, hsl(90 65% 90%) 0%, hsl(90 65% 85%) 100%)",
  pastelSky: "linear-gradient(135deg, hsl(190 80% 92%) 0%, hsl(190 80% 87%) 100%)",
  pastelLavender: "linear-gradient(135deg, hsl(45 85% 92%) 0%, hsl(45 85% 88%) 100%)",
  pastelPeach: "linear-gradient(135deg, hsl(15 85% 94%) 0%, hsl(15 85% 90%) 100%)",
} as const;

export const typography = {
  // Font family
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  
  // Hero headline
  hero: {
    fontSize: "clamp(2.5rem, 5vw, 4rem)",
    fontWeight: "800",
    lineHeight: "1.1",
    letterSpacing: "-0.03em",
  },
  
  // Section headings
  h1: {
    fontSize: "2.25rem",
    fontWeight: "700",
    lineHeight: "1.2",
    letterSpacing: "-0.02em",
  },
  
  h2: {
    fontSize: "1.5rem",
    fontWeight: "600",
    lineHeight: "1.3",
    letterSpacing: "-0.01em",
  },
  
  h3: {
    fontSize: "1.125rem",
    fontWeight: "600",
    lineHeight: "1.4",
  },
  
  // Body
  body: {
    fontSize: "1rem",
    fontWeight: "400",
    lineHeight: "1.6",
  },
  
  // Small/muted
  small: {
    fontSize: "0.875rem",
    fontWeight: "400",
    lineHeight: "1.5",
  },
  
  // Stat number (large)
  stat: {
    fontSize: "2.5rem",
    fontWeight: "700",
    lineHeight: "1",
    letterSpacing: "-0.02em",
  },
} as const;

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  "2xl": "32px",
  "3xl": "48px",
  "4xl": "64px",
} as const;
