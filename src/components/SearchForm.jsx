import React from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'



export function SearchForm({ searchTerm, setSearchTerm }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div className="relative w-full md:w-96">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Ijara qidirish"
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search rentals"
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => alert('Filter feature is under development.')}
        >
          Filter
        </Button>
      </div>
    </div>
  )
}

