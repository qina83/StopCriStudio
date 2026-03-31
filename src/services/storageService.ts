/**
 * Storage Service
 * Handles local storage operations for OpenAPI specifications
 */

import { OpenAPISpecification, SpecificationMetadata } from '../types'

const STORAGE_KEY = 'stopCriStudio_specifications'

/**
 * Create a new minimal OpenAPI specification
 */
export function createNewSpecification(name: string = 'Untitled API'): OpenAPISpecification {
  const id = generateId()
  const now = Date.now()

  return {
    id,
    name,
    specVersion: '1.0.0',
    openAPIVersion: '3.0.0',
    createdAt: now,
    updatedAt: now,
    content: {
      openapi: '3.0.0',
      info: {
        title: name,
        version: '1.0.0',
      },
      paths: {},
      components: {
        schemas: {},
      },
    },
  }
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `spec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get all specifications from local storage
 */
export function getAllSpecifications(): SpecificationMetadata[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Failed to load specifications from storage:', error)
    return []
  }
}

/**
 * Get a specific specification by ID
 */
export function getSpecification(id: string): OpenAPISpecification | null {
  try {
    const specString = localStorage.getItem(`${STORAGE_KEY}_${id}`)
    return specString ? JSON.parse(specString) : null
  } catch (error) {
    console.error(`Failed to load specification ${id}:`, error)
    return null
  }
}

/**
 * Save a specification to local storage
 */
export function saveSpecification(spec: OpenAPISpecification): void {
  try {
    // Update the specification in detailed storage
    localStorage.setItem(`${STORAGE_KEY}_${spec.id}`, JSON.stringify(spec))

    // Update the metadata in the list storage
    const allSpecs = getAllSpecifications()
    const index = allSpecs.findIndex((s) => s.id === spec.id)
    const metadata: SpecificationMetadata = {
      id: spec.id,
      name: spec.name,
      specVersion: spec.specVersion,
      createdAt: spec.createdAt,
      updatedAt: spec.updatedAt,
      description: spec.description,
    }

    if (index >= 0) {
      allSpecs[index] = metadata
    } else {
      allSpecs.push(metadata)
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSpecs))
  } catch (error) {
    console.error('Failed to save specification:', error)
  }
}

/**
 * Delete a specification from local storage
 */
export function deleteSpecification(id: string): void {
  try {
    localStorage.removeItem(`${STORAGE_KEY}_${id}`)

    const allSpecs = getAllSpecifications().filter((s) => s.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSpecs))
  } catch (error) {
    console.error('Failed to delete specification:', error)
  }
}
