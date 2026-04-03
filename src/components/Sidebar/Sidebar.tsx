/**
 * Sidebar Component
 * Left sidebar navigation for specification editor with paths and operations
 */

import React, { useState, useEffect } from 'react'
import { OpenAPISpecification } from '../../types'

type NavigationItem = 'info' | 'paths' | 'schemas'

const HTTP_METHOD_ORDER = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
const DEBOUNCE_DELAY = 300

interface SidebarProps {
  activeItem: NavigationItem
  onNavigate: (item: NavigationItem) => void
  specification?: OpenAPISpecification
  selectedPath?: string | null
  onPathSelect?: (pathName: string) => void
}

export function Sidebar({ activeItem, onNavigate, specification, selectedPath, onPathSelect }: SidebarProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const [filterText, setFilterText] = useState<string>('')
  const [debouncedFilter, setDebouncedFilter] = useState<string>('')

  // Debounce filter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilter(filterText)
    }, DEBOUNCE_DELAY)

    return () => clearTimeout(timer)
  }, [filterText])

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
    .sort((a, b) => a.localeCompare(b))

  // Get filtered schemas (sorted alphabetically)
  const filteredSchemas = Object.keys(schemas)
    .filter((schemaName) => matchesFilter(schemaName))
    .sort((a, b) => a.localeCompare(b))

  // Check if there are any matches
  const hasMatches = filteredPaths.length > 0 || filteredSchemas.length > 0

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

  const getMethodColor = (method: string): string => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-500',
      POST: 'bg-green-500',
      PUT: 'bg-yellow-500',
      DELETE: 'bg-red-500',
      PATCH: 'bg-purple-500',
      HEAD: 'bg-gray-500',
      OPTIONS: 'bg-indigo-500',
    }
    return colors[method] || 'bg-slate-500'
  }

  return (
    <aside className="w-[32rem] bg-slate-900 text-white border-r border-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Specification</h2>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* Filter input */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Filter paths & schemas..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full px-3 py-2 pl-3 pr-8 bg-slate-800 text-white rounded-lg border border-slate-700 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
            />
            {filterText && (
              <button
                onClick={() => setFilterText('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                aria-label="Clear filter"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Show no matches message when filter is active and no results */}
        {debouncedFilter && !hasMatches && (
          <div className="px-4 py-3 text-center text-slate-400 text-sm">
            No matches found
          </div>
        )}

        {/* Paths item with accordion */}
        <div>
          <button
            onClick={() => onNavigate('paths')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeItem === 'paths' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span className="font-medium">Paths</span>
              {Object.keys(paths).length > 0 && (
                <span className="ml-auto text-xs bg-slate-700 px-2 py-0.5 rounded">{filteredPaths.length}/{Object.keys(paths).length}</span>
              )}
            </div>
          </button>

          {/* Paths list */}
          {filteredPaths.length > 0 && activeItem === 'paths' && (
            <div className="mt-2 ml-4 space-y-1">
              {filteredPaths.map((pathName) => {
                const methods = getPathMethods(pathName)
                const isExpanded = expandedPaths.has(pathName)

                return (
                  <div key={pathName}>
                    <button
                      onClick={() => handlePathSelect(pathName)}
                      className={`w-full text-left px-3 py-2 rounded transition-colors text-sm font-mono flex items-center justify-between ${
                        selectedPath === pathName
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{isExpanded ? '▼' : '▶'} {pathName}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        selectedPath === pathName ? 'bg-blue-700' : 'bg-slate-700'
                      }`}>{methods.length}</span>
                    </button>

                    {/* Operations under path */}
                    {isExpanded && methods.length > 0 && (
                      <div className="ml-4 space-y-1 border-l border-slate-700 pl-2 mt-1">
                        {methods.map((method) => (
                          <div
                            key={`${pathName}-${method}`}
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              getMethodColor(method)
                            } text-white opacity-90 hover:opacity-100 transition-opacity`}
                          >
                            {method}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Schemas item with accordion */}
        <div>
          <button
            onClick={() => onNavigate('schemas')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeItem === 'schemas' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>📦</span>
              <span className="font-medium">Schemas</span>
              {Object.keys(schemas).length > 0 && (
                <span className="ml-auto text-xs bg-slate-700 px-2 py-0.5 rounded">{filteredSchemas.length}/{Object.keys(schemas).length}</span>
              )}
            </div>
          </button>

          {/* Schemas list */}
          {filteredSchemas.length > 0 && activeItem === 'schemas' && (
            <div className="mt-2 ml-4 space-y-1">
              {filteredSchemas.map((schemaName) => (
                <div
                  key={schemaName}
                  className="px-3 py-2 rounded transition-colors text-sm font-mono text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  {schemaName}
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>
    </aside>
  )
}
