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

interface SpecStore {
  spec: OpenAPISpec | null
  setSpec: (spec: OpenAPISpec) => void
  updateSpec: (updates: Partial<OpenAPISpec>) => void
  resetSpec: () => void
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

export const useSpecStore = create<SpecStore>((set) => ({
  spec: null,

  setSpec: (spec: OpenAPISpec) => set({ spec }),

  updateSpec: (updates: Partial<OpenAPISpec>) =>
    set((state) => ({
      spec: state.spec ? { ...state.spec, ...updates } : defaultSpec,
    })),

  resetSpec: () => set({ spec: null }),
}))
