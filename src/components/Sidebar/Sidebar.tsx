/**
 * Sidebar Component
 * Left sidebar navigation for specification editor with paths and operations
 */

import React, { useState, useEffect } from 'react'
import { OpenAPISpecification } from '../../types'
import { sortStringsCaseInsensitiveStable } from '../../utils/sortUtils'
import {
  Badge,
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
  InfoIcon,
  PathsIcon,
  SchemaIcon,
  SearchIcon,
  TextInput,
  getMethodBadgeClass,
} from '../ui'

type NavigationItem = 'info' | 'paths' | 'schemas'

const HTTP_METHOD_ORDER = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
const DEBOUNCE_DELAY = 300

interface SidebarProps {
  activeItem: NavigationItem
  onNavigate: (item: NavigationItem) => void
  specification?: OpenAPISpecification
  selectedPath?: string | null
  onPathSelect?: (pathName: string) => void
  selectedSchema?: string | null
  onSchemaSelect?: (schemaName: string) => void
}

export function Sidebar({ activeItem, onNavigate, specification, selectedPath, onPathSelect, selectedSchema, onSchemaSelect }: SidebarProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const [filterText, setFilterText] = useState<string>('')
  const [debouncedFilter, setDebouncedFilter] = useState<string>('')
  const sectionCountBadgeClass = 'ml-auto shrink-0 border-sidebar-border bg-white text-sidebar-bg shadow-none'
  const itemCountBadgeClass = 'shrink-0 border-sidebar-border bg-sidebar-bg px-2 text-sidebar-text'

  // Debounce filter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilter(filterText)
    }, DEBOUNCE_DELAY)

    return () => clearTimeout(timer)
  }, [filterText])

  useEffect(() => {
    if (selectedPath) {
      setExpandedPaths(new Set([selectedPath]))
    }
  }, [selectedPath])

  // Filter function: case-insensitive substring matching
  const matchesFilter = (text: string): boolean => {
    if (!debouncedFilter) return true
    return text.toLowerCase().includes(debouncedFilter.toLowerCase())
  }

  const paths = (specification?.content.paths as Record<string, any>) || {}
  const components = (specification?.content.components as Record<string, unknown>) || {}
  const schemas = (components.schemas as Record<string, any>) || {}

  // Get filtered paths (sorted alphabetically)
  const filteredPaths = Object.keys(paths)
    .filter((pathName) => matchesFilter(pathName))
  const sortedFilteredPaths = sortStringsCaseInsensitiveStable(filteredPaths)

  // Get filtered schemas (sorted alphabetically)
  const filteredSchemas = Object.keys(schemas)
    .filter((schemaName) => matchesFilter(schemaName))
  const sortedFilteredSchemas = sortStringsCaseInsensitiveStable(filteredSchemas)

  // Check if there are any matches
  const hasMatches = sortedFilteredPaths.length > 0 || sortedFilteredSchemas.length > 0

  const handlePathSelect = (pathName: string) => {
    // When a path is selected, expand only that path and close others
    setExpandedPaths(new Set([pathName]))
    onPathSelect?.(pathName)
  }

  const getPathMethods = (pathName: string): string[] => {
    const pathObj = paths[pathName] || {}
    const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options']
    const methods = Object.keys(pathObj)
      .filter((key) => httpMethods.includes(key))
      .map((key) => key.toUpperCase())
    
    // Sort methods according to HTTP_METHOD_ORDER
    return methods.sort((a, b) => HTTP_METHOD_ORDER.indexOf(a) - HTTP_METHOD_ORDER.indexOf(b))
  }

  return (
    <aside className="flex w-full max-w-[22rem] flex-col border-r border-sidebar-border bg-sidebar-bg text-sidebar-text lg:max-w-[24rem] xl:max-w-[27rem]">
      <div className="border-b border-sidebar-border px-4 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-sidebar-textMuted">Specification Map</h2>
        <p className="mt-2 text-sm text-sidebar-textMuted">Use filter, selection, and badges to move between resources faster.</p>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sidebar-textMuted" />
          <TextInput
            type="text"
            placeholder="Filter paths and schemas"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="border-sidebar-border bg-sidebar-surface pl-9 pr-10 text-sidebar-text placeholder:text-sidebar-textMuted focus:border-focus-ring focus:bg-sidebar-surface"
          />
          {filterText ? (
            <button
              onClick={() => setFilterText('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-textMuted transition-colors hover:text-sidebar-text"
              aria-label="Clear filter"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {debouncedFilter && !hasMatches && (
          <div className="rounded-lg border border-dashed border-sidebar-border bg-sidebar-surface px-4 py-3 text-center text-sm text-sidebar-textMuted">
            No matches found
          </div>
        )}

        <div>
          <button
            onClick={() => onNavigate('paths')}
            className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
              activeItem === 'paths'
                ? 'border-sky-400/40 bg-sky-500/15 text-sidebar-text shadow-panel'
                : 'border-sidebar-border bg-sidebar-surface text-sidebar-text hover:bg-sidebar-surface/90'
            }`}
          >
            <div className="flex items-center gap-3">
              <PathsIcon className="h-4 w-4" />
              <span className="font-medium">Paths</span>
              {Object.keys(paths).length > 0 && (
                <Badge variant="count" className={sectionCountBadgeClass}>
                  {sortedFilteredPaths.length}/{Object.keys(paths).length}
                </Badge>
              )}
            </div>
          </button>

          {sortedFilteredPaths.length > 0 && activeItem === 'paths' && (
            <div className="mt-3 space-y-2 rounded-xl border border-sidebar-border bg-sidebar-surface p-2">
              {sortedFilteredPaths.map((pathName) => {
                const methods = getPathMethods(pathName)
                const isExpanded = expandedPaths.has(pathName)

                return (
                  <div key={pathName}>
                    <button
                      onClick={() => handlePathSelect(pathName)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm font-mono transition-colors ${
                        selectedPath === pathName
                          ? 'bg-sky-500/15 text-white'
                          : 'text-sidebar-text hover:bg-white/5'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="mt-0.5 shrink-0">
                          {isExpanded ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{pathName}</span>
                        <Badge variant="count" className={itemCountBadgeClass}>{methods.length}</Badge>
                      </span>
                    </button>

                    {isExpanded && methods.length > 0 && (
                      <div className="ml-5 mt-2 flex flex-wrap gap-2 border-l border-sidebar-border pl-3">
                        {methods.map((method) => (
                          <span
                            key={`${pathName}-${method}`}
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] ${getMethodBadgeClass(method)}`}
                          >
                            {method}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => onNavigate('schemas')}
            className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
              activeItem === 'schemas'
                ? 'border-sky-400/40 bg-sky-500/15 text-sidebar-text shadow-panel'
                : 'border-sidebar-border bg-sidebar-surface text-sidebar-text hover:bg-sidebar-surface/90'
            }`}
          >
            <div className="flex items-center gap-3">
              <SchemaIcon className="h-4 w-4" />
              <span className="font-medium">Schemas</span>
              {Object.keys(schemas).length > 0 && (
                <Badge variant="count" className={sectionCountBadgeClass}>
                  {sortedFilteredSchemas.length}/{Object.keys(schemas).length}
                </Badge>
              )}
            </div>
          </button>

          {sortedFilteredSchemas.length > 0 && activeItem === 'schemas' && (
            <div className="mt-3 space-y-2 rounded-xl border border-sidebar-border bg-sidebar-surface p-2">
              {sortedFilteredSchemas.map((schemaName) => (
                <button
                  key={schemaName}
                  onClick={() => onSchemaSelect?.(schemaName)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-mono transition-colors ${
                    selectedSchema === schemaName
                      ? 'bg-sky-500/15 text-white'
                      : 'text-sidebar-text hover:bg-white/5'
                  }`}
                >
                  <span className="block truncate">{schemaName}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => onNavigate('info')}
          className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
            activeItem === 'info'
              ? 'border-sky-400/40 bg-sky-500/15 text-sidebar-text shadow-panel'
              : 'border-sidebar-border bg-sidebar-surface text-sidebar-text hover:bg-sidebar-surface/90'
          }`}
        >
          <div className="flex items-center gap-3">
            <InfoIcon className="h-4 w-4" />
            <span className="font-medium">API Information</span>
          </div>
        </button>
      </nav>
    </aside>
  )
}
