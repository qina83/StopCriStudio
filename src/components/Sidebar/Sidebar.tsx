/**
 * Sidebar Component
 * Left sidebar navigation for specification editor
 */

import React from 'react'

type NavigationItem = 'info' | 'paths' | 'schemas'

interface SidebarProps {
  activeItem: NavigationItem
  onNavigate: (item: NavigationItem) => void
  onAddPath?: () => void
  onAddSchema?: () => void
}

export function Sidebar({ activeItem, onNavigate, onAddPath, onAddSchema }: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-900 text-white border-r border-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Specification
        </h2>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* Info item */}
        <button
          onClick={() => onNavigate('info')}
          className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
            activeItem === 'info'
              ? 'bg-blue-600 text-white'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>ℹ️</span>
            <span className="font-medium">Info</span>
          </div>
        </button>

        {/* Paths accordion */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onNavigate('paths')}
              className={`flex-1 text-left px-4 py-3 rounded-lg transition-colors ${
                activeItem === 'paths'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span className="font-medium">Paths</span>
              </div>
            </button>
            {onAddPath && (
              <button
                onClick={onAddPath}
                className="mx-2 p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="Add path"
                aria-label="Add new path"
              >
                +
              </button>
            )}
          </div>
        </div>

        {/* Schemas accordion */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onNavigate('schemas')}
              className={`flex-1 text-left px-4 py-3 rounded-lg transition-colors ${
                activeItem === 'schemas'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>📦</span>
                <span className="font-medium">Schemas</span>
              </div>
            </button>
            {onAddSchema && (
              <button
                onClick={onAddSchema}
                className="mx-2 p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="Add schema"
                aria-label="Add new schema"
              >
                +
              </button>
            )}
          </div>
        </div>
      </nav>
    </aside>
  )
}
