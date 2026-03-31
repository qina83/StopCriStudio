/**
 * SpecificationForm Component
 * 
 * Deprecated: Use SpecificationEditor instead for the full 3-panel editor layout
 * This component is kept for backward compatibility
 */

import React from 'react'
import { SpecificationEditor } from '../SpecificationEditor/SpecificationEditor'
import { createNewSpecification } from '../../services/storageService'

export function SpecificationForm() {
  const newSpec = createNewSpecification()
  return <SpecificationEditor specification={newSpec} />
}
