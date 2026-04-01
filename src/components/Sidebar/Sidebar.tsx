/**
 * Sidebar Component
 * Left sidebar navigation for specification editor with paths and operations
 */

import React, { useState } from 'react'
import { OpenAPISpecification } from '../../types'

type NavigationItem = 'info' | 'paths' | 'schemas'

interface SidebarProps {
  activeItem: NavigationItem
  onNavigate: (item: NavigationItem) => void
  specification?: OpenAPISpecification
  selectedPath?: string | null
  onPathSelect?: (pathName: string) => void
}

export function Sidebar({ activeItem, onNavigate, specification, selectedPath, onPathSelect }: SidebarProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())

  const paths = (specification?.content.paths as Record<string, any>) || {}

  const handlePathSelect = (pathName: string) => {
    // When a path is selected, expand only that path and close others
    setExpandedPaths(new Set([pathName]))
    onPathSelect?.(pathName)
  }

  const getPathMethods = (pathName: string): string[] => {
    const pathObj = paths[pathName] || {}
    const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options']
    return Object.keys(pathObj)
      .filter((key) => httpMethods.includes(key))
      .map((key) => key.toUpperCase())
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
    <aside className="w-64 bg-slate-900 text-white border-r border-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Specification</h2>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* Info item */}
        <button
          onClick={() => onNavigate('info')}
          className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
            activeItem === 'info' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>ℹ️</span>
            <span className="font-medium">Info</span>
          </div>
        </button>

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
                <span className="ml-auto text-xs bg-slate-700 px-2 py-0.5 rounded">{Object.keys(paths).length}</span>
              )}
            </div>
          </button>

          {/* Paths list */}
          {Object.keys(paths).length > 0 && activeItem === 'paths' && (
            <div className="mt-2 ml-4 space-y-1">
              {Object.keys(paths).map((pathName) => {
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

        {/* Schemas item */}
        <button
          onClick={() => onNavigate('schemas')}
          className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
            activeItem === 'schemas' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>📦</span>
            <span className="font-medium">Schemas</span>
          </div>
        </button>
      </nav>
    </aside>
  )
}
