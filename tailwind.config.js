/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Avenir Next', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        app: {
          bg: 'var(--color-app-bg)',
          bgAccent: 'var(--color-app-bg-accent)',
        },
        surface: {
          base: 'var(--color-surface-base)',
          subtle: 'var(--color-surface-subtle)',
          raised: 'var(--color-surface-raised)',
          inverse: 'var(--color-surface-inverse)',
        },
        border: {
          default: 'var(--color-border-default)',
          strong: 'var(--color-border-strong)',
          inverse: 'var(--color-border-inverse)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
        },
        action: {
          primary: 'var(--color-action-primary)',
          primaryHover: 'var(--color-action-primary-hover)',
          secondary: 'var(--color-action-secondary)',
          secondaryHover: 'var(--color-action-secondary-hover)',
          danger: 'var(--color-action-danger)',
          dangerHover: 'var(--color-action-danger-hover)',
        },
        state: {
          success: 'var(--color-state-success)',
          successBg: 'var(--color-state-success-bg)',
          warning: 'var(--color-state-warning)',
          warningBg: 'var(--color-state-warning-bg)',
          error: 'var(--color-state-error)',
          errorBg: 'var(--color-state-error-bg)',
          info: 'var(--color-state-info)',
          infoBg: 'var(--color-state-info-bg)',
        },
        focus: {
          ring: 'var(--color-focus-ring)',
        },
        sidebar: {
          bg: 'var(--color-sidebar-bg)',
          surface: 'var(--color-sidebar-surface)',
          border: 'var(--color-sidebar-border)',
          text: 'var(--color-sidebar-text)',
          textMuted: 'var(--color-sidebar-text-muted)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
        raised: 'var(--shadow-raised)',
        modal: 'var(--shadow-modal)',
      },
    },
  },
  plugins: [],
}
