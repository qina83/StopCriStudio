import { create } from 'zustand'

export interface OpenAPISpec {
  openapi: string
  info: {
    title: string
    version: string
    description?: string
    termsOfService?: string
    contact?: {
      name?: string
      url?: string
      email?: string
    }
    license?: {
      name: string
      url?: string
    }
  }
  servers?: Array<{
    url: string
    description?: string
  }>
  paths: Record<string, unknown>
  components?: {
    schemas?: Record<string, unknown>
    securitySchemes?: Record<string, unknown>
  }
}

interface DraftData {
  spec: OpenAPISpec
  timestamp: number
}

interface SpecStore {
  spec: OpenAPISpec | null
  hasUnsavedChanges: boolean
  lastSavedTime: number | null
  validationErrors: string[]
  drafted: boolean
  setSpec: (spec: OpenAPISpec) => void
  updateSpec: (updates: Partial<OpenAPISpec>) => void
  resetSpec: () => void
  markSpecAsModified: () => void
  setValidationErrors: (errors: string[]) => void
  saveDraft: (spec: OpenAPISpec) => void
  loadDraft: () => DraftData | null
  clearDraft: () => void
  hasDraft: () => boolean
}

const defaultSpec: OpenAPISpec = {
  openapi: '3.0.0',
  info: {
    title: 'My API',
    version: '1.0.0',
    description: 'API documentation',
  },
  paths: {},
}

const DRAFT_STORAGE_KEY = 'openapi-spec-draft'
const DRAFT_TIMESTAMP_KEY = 'openapi-spec-draft-timestamp'

export const useSpecStore = create<SpecStore>((set) => ({
  spec: null,
  hasUnsavedChanges: false,
  lastSavedTime: null,
  validationErrors: [],
  drafted: false,

  setSpec: (spec: OpenAPISpec) =>
    set({
      spec,
      hasUnsavedChanges: true,
      drafted: true,
    }),

  updateSpec: (updates: Partial<OpenAPISpec>) =>
    set((state) => ({
      spec: state.spec ? { ...state.spec, ...updates } : defaultSpec,
      hasUnsavedChanges: true,
    })),

  resetSpec: () => set({ spec: null, hasUnsavedChanges: false, validationErrors: [] }),

  markSpecAsModified: () =>
    set({
      hasUnsavedChanges: true,
    }),

  setValidationErrors: (errors: string[]) =>
    set({
      validationErrors: errors,
    }),

  saveDraft: (spec: OpenAPISpec) => {
    const draft: DraftData = {
      spec,
      timestamp: Date.now(),
    }
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft.spec))
    localStorage.setItem(DRAFT_TIMESTAMP_KEY, String(draft.timestamp))
    set({
      hasUnsavedChanges: false,
      lastSavedTime: draft.timestamp,
    })
  },

  loadDraft: () => {
    try {
      const specStr = localStorage.getItem(DRAFT_STORAGE_KEY)
      const timestampStr = localStorage.getItem(DRAFT_TIMESTAMP_KEY)
      if (specStr && timestampStr) {
        return {
          spec: JSON.parse(specStr) as OpenAPISpec,
          timestamp: parseInt(timestampStr, 10),
        }
      }
    } catch (err) {
      console.error('Failed to load draft:', err)
    }
    return null
  },

  clearDraft: () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY)
    localStorage.removeItem(DRAFT_TIMESTAMP_KEY)
  },

  hasDraft: () => {
    return localStorage.getItem(DRAFT_STORAGE_KEY) !== null
  },
}))
