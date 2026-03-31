/**
 * useSpecification Hook
 * Manages specification state with auto-save functionality
 */

import { useState, useEffect, useCallback } from 'react'
import { OpenAPISpecification } from '../types'
import { saveSpecification } from '../services/storageService'

const AUTOSAVE_DELAY = 1000 // 1 second

export function useSpecification(initialSpec: OpenAPISpecification) {
  const [specification, setSpecification] = useState<OpenAPISpecification>(initialSpec)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Auto-save when specification changes
  useEffect(() => {
    if (!isDirty) return

    const timer = setTimeout(() => {
      setIsSaving(true)
      try {
        saveSpecification(specification)
        setIsDirty(false)
      } finally {
        setIsSaving(false)
      }
    }, AUTOSAVE_DELAY)

    return () => clearTimeout(timer)
  }, [specification, isDirty])

  const updateSpecification = useCallback(
    (updater: (spec: OpenAPISpecification) => OpenAPISpecification) => {
      setSpecification((current) => {
        const updated = updater(current)
        setIsDirty(true)
        return updated
      })
    },
    []
  )

  const updateInfo = useCallback(
    (name?: string, specVersion?: string) => {
      updateSpecification((spec) => ({
        ...spec,
        name: name !== undefined ? name : spec.name,
        specVersion: specVersion !== undefined ? specVersion : spec.specVersion,
        content: {
          ...spec.content,
          info: {
            ...(spec.content.info as Record<string, unknown>),
            title: name !== undefined ? name : (spec.content.info as Record<string, unknown>)?.title,
            version: specVersion !== undefined ? specVersion : (spec.content.info as Record<string, unknown>)?.version,
          },
        },
        updatedAt: Date.now(),
      }))
    },
    [updateSpecification]
  )

  return {
    specification,
    updateSpecification,
    updateInfo,
    isDirty,
    isSaving,
  }
}
