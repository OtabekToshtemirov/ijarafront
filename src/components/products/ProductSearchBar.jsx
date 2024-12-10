'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function ProductSearchBar({ 
    searchQuery, 
    onSearchChange 
}) {
    return (
        <div className="relative w-full md:w-96 mb-6">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
            <Input
                placeholder="Mahsulotlarni qidirish"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
            />
        </div>
    )
}
