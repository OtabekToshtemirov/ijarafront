'use client'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
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
import { addProduct, selectPartProducts } from '@/lib/features/products/productSlice'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

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
    const partProducts = useSelector(selectPartProducts)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newProduct, setNewProduct] = useState(initialProductState)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [totalComboPrice, setTotalComboPrice] = useState(0)

    useEffect(() => {
        if (newProduct.type === 'combo') {
            const total = newProduct.parts.reduce((sum, part) => {
                return sum + (part.dailyRate || 0) * (part.quantity || 0)
            }, 0)
            setTotalComboPrice(total)
            if (!newProduct.manualPrice) {
                handleInputChange('dailyRate', total)
            }
        }
    }, [newProduct.parts])

    const validateProduct = () => {
        const errors = []
        const requiredFields = {
            name: 'Mahsulot nomi',
            category: 'Mahsulot kategoriyasi'
        }

        Object.entries(requiredFields).forEach(([field, label]) => {
            if (!newProduct[field]?.trim()) {
                errors.push(`${label} kiritilishi kerak`)
            }
        })

        if (newProduct.quantity < 1) {
            errors.push('Mahsulot soni 1 dan katta bo\'lishi kerak')
        }

        if (newProduct.type === 'combo') {
            if (!newProduct.parts?.length) {
                errors.push('Kombinatsiya mahsuloti uchun kamida bitta qism kiritilishi kerak')
            }
            newProduct.parts.forEach((part, index) => {
                if (!part.productId) {
                    errors.push(`${index + 1}-qism tanlanmagan`)
                }
                if (!part.quantity || part.quantity < 1) {
                    errors.push(`${index + 1}-qism soni noto'g'ri`)
                }
                if (!part.dailyRate || part.dailyRate < 0) {
                    errors.push(`${index + 1}-qism narxi noto'g'ri`)
                }
            })
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
                dailyRate: Number(newProduct.dailyRate),
                parts: newProduct.type === 'combo' 
                    ? newProduct.parts.map(part => ({
                        product: part.productId,
                        quantity: Number(part.quantity),
                        dailyRate: Number(part.dailyRate)
                    }))
                    : []
            }
            
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
        if (field === 'dailyRate' || field === 'quantity') {
            value = value === '' ? '' : value === '0' ? 0 : Number(value)
        }
        
        if (field === 'type' && value === 'single') {
            value = { type: 'single', parts: [], dailyRate: 0 }
        }
        
        setNewProduct(prev => ({
            ...prev,
            ...(typeof value === 'object' ? value : { [field]: value })
        }))
    }

    const handleAddPart = () => {
        setNewProduct(prev => ({
            ...prev,
            parts: [...prev.parts, { productId: '', quantity: 1, dailyRate: 0 }]
        }))
    }

    const handlePartChange = (index, field, value) => {
        const updatedParts = [...newProduct.parts]
        const part = updatedParts[index]

        if (field === 'productId') {
            const selectedProduct = partProducts.find(p => p._id === value)
            part.productId = value
            part.dailyRate = selectedProduct?.dailyRate || 0
        } else {
            part[field] = field === 'quantity' || field === 'dailyRate' ? Number(value) : value
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
                                    <div key={index} className="space-y-4 border rounded-lg p-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Qism</Label>
                                                <Select
                                                    value={part.productId}
                                                    onValueChange={(value) => handlePartChange(index, 'productId', value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Qismni tanlang" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {partProducts.map((product) => (
                                                            <SelectItem 
                                                                key={product._id} 
                                                                value={product._id}
                                                            >
                                                                {product.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label>Soni</Label>
                                                <Input
                                                    type="number"
                                                    value={part.quantity}
                                                    onChange={(e) => handlePartChange(index, 'quantity', e.target.value)}
                                                    min="1"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Narxi</Label>
                                                <Input
                                                    type="number"
                                                    value={part.dailyRate}
                                                    onChange={(e) => handlePartChange(index, 'dailyRate', e.target.value)}
                                                    min="0"
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemovePart(index)}
                                                    className="ml-auto"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Jami: {(part.dailyRate || 0) * (part.quantity || 0)} so'm/kun
                                        </div>
                                    </div>
                                ))}
                                
                                <div className="pt-2 border-t">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span>Jami narx:</span>
                                        <span>{totalComboPrice} so'm/kun</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* kunlik narx */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dailyRate" className="text-right">
                                Kunlik narx
                            </Label>
                            <Input
                                id="dailyRate"
                                type="number"
                                value={newProduct.dailyRate || ''}
                                onChange={(e) => handleInputChange('dailyRate', e.target.value)}
                                className="col-span-3"
                                min="0"
                                required
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
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}