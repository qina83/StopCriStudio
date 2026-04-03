/**
 * useSpecification Hook
 * Manages specification state with auto-save functionality
 */

import { useState, useEffect, useCallback } from 'react'
import { OpenAPISpecification, PathOperation, HTTPMethod, PathParameter } from '../types'
import { saveSpecification } from '../services/storageService'

const AUTOSAVE_DELAY = 1000 // 1 second

export function useSpecification(initialSpec: OpenAPISpecification) {
  const [specification, setSpecification] = useState<OpenAPISpecification>(initialSpec)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [storageError, setStorageError] = useState<string | null>(null)

  // Auto-save when specification changes
  useEffect(() => {
    if (!isDirty) return

    const timer = setTimeout(() => {
      setIsSaving(true)
      try {
        saveSpecification(specification)
        setIsDirty(false)
        setStorageError(null)
      } catch (error) {
        console.error('Auto-save failed:', error)
        setStorageError('Storage quota exceeded. Some changes may not be saved.')
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

  /** Immediately persists to localStorage – used for query parameter changes (WP-019) */
  const updateSpecificationAndSave = useCallback(
    (updater: (spec: OpenAPISpecification) => OpenAPISpecification) => {
      setSpecification((current) => {
        const updated = updater(current)
        try {
          saveSpecification(updated)
          setStorageError(null)
        } catch (error) {
          console.error('Immediate save failed:', error)
          setStorageError('Storage quota exceeded. Some changes may not be saved.')
        }
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

  const addPath = useCallback(
    (pathName: string) => {
      updateSpecification((spec) => {
        const paths = (spec.content.paths as Record<string, unknown>) || {}
        
        // Don't add if path already exists
        if (paths[pathName]) {
          return spec
        }

        return {
          ...spec,
          content: {
            ...spec.content,
            paths: {
              ...paths,
              [pathName]: {},
            },
          },
          updatedAt: Date.now(),
        }
      })
    },
    [updateSpecification]
  )

  const addOperation = useCallback(
    (pathName: string, method: HTTPMethod, operation: Partial<PathOperation> = {}) => {
      updateSpecification((spec) => {
        const paths = (spec.content.paths as Record<string, any>) || {}
        const pathObj = paths[pathName] || {}

        return {
          ...spec,
          content: {
            ...spec.content,
            paths: {
              ...paths,
              [pathName]: {
                ...pathObj,
                [method.toLowerCase()]: {
                  description: operation.description || '',
                  summary: operation.summary || `${method} operation`,
                  tags: operation.tags || [],
                  responses: operation.responses || {
                    '200': {
                      description: 'Successful response',
                    },
                  },
                } as PathOperation,
              },
            },
          },
          updatedAt: Date.now(),
        }
      })
    },
    [updateSpecification]
  )

  const getPathOperations = useCallback(
    (pathName: string): Record<string, PathOperation> => {
      const paths = (specification.content.paths as Record<string, any>) || {}
      const pathObj = paths[pathName] || {}
      
      // Filter out non-HTTP method keys
      const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options']
      return Object.entries(pathObj)
        .filter(([key]) => httpMethods.includes(key))
        .reduce((acc, [key, value]) => {
          acc[key.toUpperCase()] = value as PathOperation
          return acc
        }, {} as Record<string, PathOperation>)
    },
    [specification]
  )

  const getPaths = useCallback((): string[] => {
    const paths = (specification.content.paths as Record<string, unknown>) || {}
    return Object.keys(paths)
  }, [specification])

  const deleteOperation = useCallback(
    (pathName: string, method: HTTPMethod) => {
      updateSpecification((spec) => {
        const paths = (spec.content.paths as Record<string, any>) || {}
        const pathObj = paths[pathName] || {}

        // Create a new path object without the operation
        const updatedPathObj = { ...pathObj }
        delete updatedPathObj[method.toLowerCase()]

        return {
          ...spec,
          content: {
            ...spec.content,
            paths: {
              ...paths,
              [pathName]: updatedPathObj,
            },
          },
          updatedAt: Date.now(),
        }
      })
    },
    [updateSpecification]
  )

  const deletePath = useCallback(
    (pathName: string) => {
      updateSpecification((spec) => {
        const paths = (spec.content.paths as Record<string, any>) || {}
        const updatedPaths = { ...paths }
        delete updatedPaths[pathName]

        return {
          ...spec,
          content: {
            ...spec.content,
            paths: updatedPaths,
          },
          updatedAt: Date.now(),
        }
      })
    },
    [updateSpecification]
  )

  // WP-006: Path parameter management methods
  const getPathParameters = useCallback(
    (pathName: string): PathParameter[] => {
      const paths = (specification.content.paths as Record<string, any>) || {}
      const pathObj = paths[pathName] || {}
      return pathObj.parameters || []
    },
    [specification]
  )

  const updatePathParameters = useCallback(
    (pathName: string, parameters: PathParameter[]) => {
      updateSpecification((spec) => {
        const paths = (spec.content.paths as Record<string, any>) || {}
        const pathObj = paths[pathName] || {}

        return {
          ...spec,
          content: {
            ...spec.content,
            paths: {
              ...paths,
              [pathName]: {
                ...pathObj,
                parameters,
              },
            },
          },
          updatedAt: Date.now(),
        }
      })
    },
    [updateSpecification]
  )

  const updatePathParameter = useCallback(
    (pathName: string, parameterName: string, updates: Partial<PathParameter>) => {
      updateSpecification((spec) => {
        const paths = (spec.content.paths as Record<string, any>) || {}
        const pathObj = paths[pathName] || {}
        const parameters = pathObj.parameters || []

        const updatedParameters = parameters.map((param: PathParameter) =>
          param.name === parameterName ? { ...param, ...updates } : param
        )

        return {
          ...spec,
          content: {
            ...spec.content,
            paths: {
              ...paths,
              [pathName]: {
                ...pathObj,
                parameters: updatedParameters,
              },
            },
          },
          updatedAt: Date.now(),
        }
      })
    },
    [updateSpecification]
  )

  return {
    specification,
    updateSpecification,
    updateSpecificationAndSave,
    updateInfo,
    addPath,
    addOperation,
    deleteOperation,
    deletePath,
    getPathOperations,
    getPaths,
    getPathParameters,
    updatePathParameters,
    updatePathParameter,
    isDirty,
    isSaving,
    storageError,
  }
}
