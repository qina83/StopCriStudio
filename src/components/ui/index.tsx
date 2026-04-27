import React, { useEffect, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

type ClassValue = string | false | null | undefined

export function cn(...values: ClassValue[]) {
  return values.filter(Boolean).join(' ')
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon'
type ButtonSize = 'sm' | 'md' | 'lg'

const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-action-primary text-text-inverse hover:bg-action-primaryHover border border-transparent shadow-panel',
  secondary: 'bg-surface-raised text-text-primary hover:bg-action-secondaryHover border border-border-default shadow-panel',
  ghost: 'bg-transparent text-text-secondary hover:bg-surface-subtle hover:text-text-primary border border-transparent',
  danger: 'bg-action-danger text-text-inverse hover:bg-action-dangerHover border border-transparent shadow-panel',
  icon: 'bg-surface-base text-text-secondary hover:bg-surface-subtle hover:text-text-primary border border-border-default',
}

const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
}

const methodClasses: Record<string, string> = {
  GET: 'border-blue-200 bg-blue-100 text-blue-800',
  POST: 'border-green-200 bg-green-100 text-green-800',
  PUT: 'border-amber-200 bg-amber-100 text-amber-800',
  DELETE: 'border-red-200 bg-red-100 text-red-800',
  PATCH: 'border-violet-200 bg-violet-100 text-violet-800',
  HEAD: 'border-slate-300 bg-slate-200 text-slate-800',
  OPTIONS: 'border-indigo-200 bg-indigo-100 text-indigo-800',
}

const statusClasses: Record<string, string> = {
  success: 'border-emerald-200 bg-state-successBg text-state-success',
  warning: 'border-amber-200 bg-state-warningBg text-state-warning',
  error: 'border-red-200 bg-state-errorBg text-state-error',
  info: 'border-sky-200 bg-state-infoBg text-state-info',
  neutral: 'border-border-default bg-surface-subtle text-text-secondary',
}

const typeClasses: Record<string, string> = {
  string: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  number: 'border-sky-200 bg-sky-50 text-sky-700',
  integer: 'border-sky-200 bg-sky-50 text-sky-700',
  boolean: 'border-amber-200 bg-amber-50 text-amber-700',
  object: 'border-violet-200 bg-violet-50 text-violet-700',
  array: 'border-orange-200 bg-orange-50 text-orange-700',
  schema: 'border-indigo-200 bg-indigo-50 text-indigo-700',
}

export function getMethodBadgeClass(method: string) {
  return methodClasses[method.toUpperCase()] ?? 'border-border-default bg-surface-subtle text-text-secondary'
}

export interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

export function AppButton({
  variant = 'secondary',
  size = 'md',
  loading = false,
  leadingIcon,
  trailingIcon,
  className,
  children,
  disabled,
  ...props
}: AppButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
        buttonVariantClasses[variant],
        buttonSizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : leadingIcon}
      <span className={cn(loading && 'opacity-90')}>{children}</span>
      {!loading && trailingIcon}
    </button>
  )
}

export interface AppIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  tone?: 'default' | 'danger'
}

export function AppIconButton({ label, tone = 'default', className, children, ...props }: AppIconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg disabled:cursor-not-allowed disabled:opacity-50',
        tone === 'danger'
          ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
          : 'border-border-default bg-surface-base text-text-secondary hover:bg-surface-subtle hover:text-text-primary',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant: 'method' | 'type' | 'status' | 'count'
  tone?: string
}

export function Badge({ variant, tone = 'neutral', className, children, ...props }: BadgeProps) {
  const colorClass =
    variant === 'method'
      ? getMethodBadgeClass(tone)
      : variant === 'type'
        ? (typeClasses[tone] ?? typeClasses.schema)
        : variant === 'count'
          ? 'border-border-default bg-surface-subtle text-text-secondary'
          : (statusClasses[tone] ?? statusClasses.neutral)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em]',
        variant !== 'status' && 'font-mono',
        colorClass,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

interface SectionHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  eyebrow?: string
  className?: string
}

export function SectionHeader({ title, description, action, eyebrow, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">{eyebrow}</p> : null}
        <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
        {description ? <p className="mt-2 max-w-3xl text-sm text-text-secondary">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  )
}

interface PanelShellProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  actions?: ReactNode
  contentClassName?: string
}

export function PanelShell({ title, description, actions, className, contentClassName, children, ...props }: PanelShellProps) {
  return (
    <section className={cn('flex h-full flex-1 overflow-y-auto bg-surface-base', className)} {...props}>
      <div className={cn('mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-6 sm:px-6 lg:px-8', contentClassName)}>
        {(title || description || actions) ? <SectionHeader title={title ?? ''} description={description} action={actions} /> : null}
        {children}
      </div>
    </section>
  )
}

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center rounded-xl border border-dashed border-border-strong bg-surface-subtle px-6 py-10 text-center shadow-panel', className)}>
      {icon ? <div className="mb-4 text-text-secondary">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 max-w-lg text-sm text-text-secondary">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

interface FieldShellProps {
  label?: string
  helpText?: string
  error?: string | null
  required?: boolean
  htmlFor?: string
  children: ReactNode
}

export function FieldShell({ label, helpText, error, required, htmlFor, children }: FieldShellProps) {
  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={htmlFor} className="block text-sm font-semibold text-text-primary">
          {label}
          {required ? <span className="ml-1 text-state-error">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs font-medium text-state-error">{error}</p>
      ) : helpText ? (
        <p className="text-xs text-text-muted">{helpText}</p>
      ) : null}
    </div>
  )
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('ui-input', className)} {...props} />
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('ui-textarea', className)} {...props} />
}

export function SelectInput({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('ui-select', className)} {...props} />
}

type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

const modalSizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
}

interface ModalShellProps {
  open: boolean
  title: string
  description?: string
  size?: ModalSize
  onClose: () => void
  closeOnBackdrop?: boolean
  footer?: ReactNode
  children: ReactNode
  showCloseButton?: boolean
  tone?: 'default' | 'danger' | 'warning' | 'info'
}

const modalToneClasses: Record<NonNullable<ModalShellProps['tone']>, string> = {
  default: 'from-action-primary to-sky-600',
  danger: 'from-action-danger to-red-700',
  warning: 'from-amber-500 to-amber-600',
  info: 'from-sky-600 to-indigo-600',
}

export function ModalShell({
  open,
  title,
  description,
  size = 'md',
  onClose,
  closeOnBackdrop = true,
  footer,
  children,
  showCloseButton = true,
  tone = 'default',
}: ModalShellProps) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={cn('w-full overflow-hidden rounded-xl border border-border-default bg-surface-base shadow-modal', modalSizeClasses[size])}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={cn('flex items-start justify-between gap-4 bg-gradient-to-r px-6 py-5 text-text-inverse', modalToneClasses[tone])}>
          <div>
            <h3 className="text-2xl font-bold">{title}</h3>
            {description ? <p className="mt-2 text-sm text-white/85">{description}</p> : null}
          </div>
          {showCloseButton ? (
            <AppIconButton label="Close" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={onClose}>
              <CloseIcon className="h-4 w-4" />
            </AppIconButton>
          ) : null}
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-6 py-6">{children}</div>
        {footer ? <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border-default bg-surface-subtle px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  )
}

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  tone?: 'danger' | 'warning' | 'default'
}

export function ConfirmDialog({ open, title, description, confirmLabel, onConfirm, onCancel, tone = 'danger' }: ConfirmDialogProps) {
  return (
    <ModalShell
      open={open}
      title={title}
      onClose={onCancel}
      size="sm"
      tone={tone}
      footer={(
        <>
          <AppButton variant="ghost" onClick={onCancel}>Cancel</AppButton>
          <AppButton variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</AppButton>
        </>
      )}
    >
      <div className="text-sm leading-6 text-text-secondary">{description}</div>
    </ModalShell>
  )
}

interface IconProps {
  className?: string
}

export function SpinnerIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" className="opacity-20" stroke="currentColor" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function SparkleIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" /><path d="M19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16z" /></svg>
}
export function FolderIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8.5A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5V7z" /></svg>
}
export function ImportIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v11" /><path d="m8 10 4 4 4-4" /><path d="M4 17v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1" /></svg>
}
export function WarningIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
}
export function PathsIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8 7.5h4a4 4 0 0 1 4 4v4" /></svg>
}
export function SchemaIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7 12 3l8 4-8 4-8-4Z" /><path d="M4 12l8 4 8-4" /><path d="M4 17l8 4 8-4" /></svg>
}
export function InfoIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 10v6" /><path d="M12 7h.01" /></svg>
}
export function BackIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m15 18-6-6 6-6" /></svg>
}
export function ExportIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 14V3" /><path d="m16 7-4-4-4 4" /><path d="M4 14v4a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-4" /></svg>
}
export function EditIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
}
export function TrashIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
}
export function CloseIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
}
export function SearchIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
}
export function CheckIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m5 13 4 4L19 7" /></svg>
}
export function ChevronDownIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 9 6 6 6-6" /></svg>
}
export function ChevronRightIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m9 6 6 6-6 6" /></svg>
}
export function PlusIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
}