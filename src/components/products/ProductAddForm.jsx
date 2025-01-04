'use client'

import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogTrigger, 
    DialogFooter
} from '@/components/ui/dialog'
import { Plus, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { addProduct } from '@/lib/features/products/productSlice'

const initialProductState = {
    name: '',
    type: 'single',
    dailyRate: 0,
    quantity: 1,
    parts: [],
    availability: true,
    description: '',
    category: ''
}

export default function ProductAddForm() {
    const dispatch = useDispatch()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newProduct, setNewProduct] = useState(initialProductState)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const validateProduct = () => {
        const errors = []
        const requiredFields = {
            name: 'Mahsulot nomi',
            category: 'Mahsulot kategoriyasi'
        }

        // Majburiy maydonlarni tekshirish
        Object.entries(requiredFields).forEach(([field, label]) => {
            if (!newProduct[field]?.trim()) {
                errors.push(`${label} kiritilishi kerak`)
            }
        })

        // Raqamli maydonlarni tekshirish
        if (newProduct.quantity < 1) {
            errors.push('Mahsulot soni 1 dan katta bo\'lishi kerak')
        }

        // Kombinatsiya mahsuloti uchun qismlarni tekshirish
        if (newProduct.type === 'combo' && (!newProduct.parts?.length)) {
            errors.push('Kombinatsiya mahsuloti uchun kamida bitta qism kiritilishi kerak')
        }

        return errors
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const validationErrors = validateProduct()
        
        if (validationErrors.length > 0) {
            validationErrors.forEach(error => {
                toast({
                    title: 'Xatolik',
                    description: error,
                    variant: 'destructive',
                })
            })
            return
        }

        setIsSubmitting(true)
        try {
            const formData = {
                ...newProduct,
                dailyRate: Number(newProduct.dailyRate),
                quantity: Number(newProduct.quantity),
                parts: newProduct.type === 'combo' 
                    ? newProduct.parts.map(part => ({
                        ...part,
                        quantity: Number(part.quantity)
                    }))
                    : []
            }
            
            console.log('Sending product data:', formData)
            await dispatch(addProduct(formData)).unwrap()
            
            toast({
                title: 'Muvaffaqiyat',
                description: 'Mahsulot muvaffaqiyatli qo\'shildi',
            })
            
            setNewProduct(initialProductState)
            setIsDialogOpen(false)
        } catch (error) {
            console.error('Mahsulot qo\'shishda xatolik:', error)
            toast({
                title: 'Xatolik',
                description: error.message || 'Mahsulot qo\'shishda xatolik yuz berdi',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleInputChange = (field, value) => {
        // Raqamli maydonlar uchun
        if (field === 'dailyRate' || field === 'quantity') {
            value = value === '' ? '' : value === '0' ? 0 : Number(value)
        }
        
        setNewProduct(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleAddPart = () => {
        setNewProduct(prev => ({
            ...prev,
            parts: [...prev.parts, { name: '', quantity: 1 }]
        }))
    }

    const handlePartChange = (index, field, value) => {
        const updatedParts = [...newProduct.parts]
        updatedParts[index] = {
            ...updatedParts[index],
            [field]: value
        }
        handleInputChange('parts', updatedParts)
    }

    const handleRemovePart = (index) => {
        handleInputChange('parts', newProduct.parts.filter((_, i) => i !== index))
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Yangi mahsulot
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Yangi Mahsulot Qo'shish</DialogTitle>
                    <DialogDescription>
                        Yangi mahsulot qo'shish uchun quyidagi maydonlarni to'ldiring
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 py-4">
                        {/* Asosiy ma'lumotlar */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Nomi
                            </Label>
                            <Input
                                id="name"
                                value={newProduct.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">
                                Turi
                            </Label>
                            <select
                                id="type"
                                value={newProduct.type}
                                onChange={(e) => handleInputChange('type', e.target.value)}
                                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            >
                                <option value="single">Oddiy</option>
                                <option value="combo">Kombinatsiya</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">
                                Kategoriya
                            </Label>
                            <Input
                                id="category"
                                value={newProduct.category}
                                onChange={(e) => handleInputChange('category', e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dailyRate" className="text-right">
                                Kunlik narx
                            </Label>
                            <Input
                                id="dailyRate"
                                type="number"
                                value={newProduct.dailyRate === 0 ? '0' : newProduct.dailyRate || ''}
                                onChange={(e) => handleInputChange('dailyRate', e.target.value)}
                                className="col-span-3"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="quantity" className="text-right">
                                Soni
                            </Label>
                            <Input
                                id="quantity"
                                type="number"
                                value={newProduct.quantity || ''}
                                onChange={(e) => handleInputChange('quantity', e.target.value)}
                                className="col-span-3"
                                min="1"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                                Tavsif
                            </Label>
                            <Input
                                id="description"
                                value={newProduct.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                className="col-span-3"
                            
                            />
                        </div>

                        {/* Kombinatsiya mahsuloti uchun qismlar */}
                        {newProduct.type === 'combo' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Qismlar</Label>
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={handleAddPart}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Qism qo'shish
                                    </Button>
                                </div>
                                
                                {newProduct.parts.map((part, index) => (
                                    <div key={index} className="flex items-end gap-2">
                                        <div className="flex-1">
                                            <Label>Nomi</Label>
                                            <Input
                                                value={part.name}
                                                onChange={(e) => handlePartChange(index, 'name', e.target.value)}
                                                placeholder="Qism nomi"
                                                required
                                            />
                                        </div>
                                        <div className="w-24">
                                            <Label>Soni</Label>
                                            <Input
                                                type="number"
                                                value={part.quantity}
                                                onChange={(e) => handlePartChange(index, 'quantity', parseInt(e.target.value))}
                                                min="1"
                                                required
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemovePart(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}