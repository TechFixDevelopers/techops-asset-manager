'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'

interface DataTableToolbarProps {
  onSearch?: (query: string) => void
  searchPlaceholder?: string
  children?: React.ReactNode
}

export function DataTableToolbar({
  onSearch,
  searchPlaceholder = 'Buscar...',
  children,
}: DataTableToolbarProps) {
  const [searchValue, setSearchValue] = useState('')

  useEffect(() => {
    if (!onSearch) return

    const timer = setTimeout(() => {
      onSearch(searchValue)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchValue, onSearch])

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-1 items-center gap-2">
        {onSearch && (
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-8"
            />
          </div>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2">{children}</div>
      )}
    </div>
  )
}
