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
    DialogTrigger, 
    DialogFooter
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { addProduct } from '@/lib/features/products/productSlice'

export default function ProductAddForm() {
    const dispatch = useDispatch()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newProduct, setNewProduct] = useState({
        name: '',
        type: 'single',
        dailyRate: 0,
        quantity: 1,
        parts: [],
        availability: true,
        description: '',
        category: ''
    })

    const validateProduct = () => {
        const errors = []

        if (!newProduct.name.trim()) {
            errors.push('Mahsulot nomi kiritilishi kerak')
        }

        if (!newProduct.description.trim()) {
            errors.push('Mahsulot tavsifi kiritilishi kerak')
        }

        if (!newProduct.category.trim()) {
            errors.push('Mahsulot kategoriyasi kiritilishi kerak')
        }

        if (newProduct.dailyRate <= 0) {
            errors.push('Kunlik narx 0 dan katta bo\'lishi kerak')
        }

        if (newProduct.quantity <= 0) {
            errors.push('Mahsulot soni 0 dan katta bo\'lishi kerak')
        }

        if (newProduct.type === 'combo' && (!newProduct.parts || newProduct.parts.length === 0)) {
            errors.push('Kombinatsiya mahsuloti uchun qismlar kiritilishi kerak')
        }

        return errors
    }

    const handleAddProduct = async () => {
        const validationErrors = validateProduct()
        
        if (validationErrors.length > 0) {
            validationErrors.forEach(error => 
                toast({
                    title: 'Xatolik',
                    description: error,
                    variant: 'destructive',
                })
            )
            return
        }

        try {
            const resultAction = await dispatch(addProduct({
                ...newProduct,
                parts: newProduct.type === 'combo' ? newProduct.parts : []
            }))
            
            if (addProduct.fulfilled.match(resultAction)) {
                toast({
                    title: 'Muvaffaqiyat',
                    description: 'Mahsulot muvaffaqiyatli qo\'shildi',
                })
                setIsDialogOpen(false)
                setNewProduct({
                    name: '',
                    type: 'single',
                    dailyRate: 0,
                    quantity: 1,
                    parts: [],
                    availability: true,
                    description: '',
                    category: ''
                })
            } else {
                throw new Error('Mahsulot qo\'shishda xatolik')
            }
        } catch (error) {
            toast({
                title: 'Xato',
                description: error.message,
                variant: 'destructive',
            })
        }
    }

    const handleAddPart = () => {
        setNewProduct(prev => ({
            ...prev,
            parts: [...prev.parts, { product: '', quantity: 1 }]
        }))
    }

    const handlePartChange = (index, field, value) => {
        const updatedParts = [...newProduct.parts]
        updatedParts[index] = {
            ...updatedParts[index],
            [field]: value
        }
        setNewProduct(prev => ({
            ...prev,
            parts: updatedParts
        }))
    }

    const handleRemovePart = (index) => {
        setNewProduct(prev => ({
            ...prev,
            parts: prev.parts.filter((_, i) => i !== index)
        }))
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2"/>
                    Yangi mahsulot
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Yangi Mahsulot Qo'shish</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nomi</Label>
                        <Input
                            id="name"
                            value={newProduct.name}
                            onChange={(e) =>
                                setNewProduct({...newProduct, name: e.target.value})
                            }
                            placeholder="Mahsulot nomini kiriting"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Tavsifi</Label>
                        <Input
                            id="description"
                            value={newProduct.description}
                            onChange={(e) =>
                                setNewProduct({...newProduct, description: e.target.value})
                            }
                            placeholder="Mahsulot tavsifini kiriting"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category">Kategoriya</Label>
                        <Input
                            id="category"
                            value={newProduct.category}
                            onChange={(e) =>
                                setNewProduct({...newProduct, category: e.target.value})
                            }
                            placeholder="Mahsulot kategoriyasini kiriting"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="type">Turi</Label>
                        <select
                            id="type"
                            value={newProduct.type}
                            onChange={(e) =>
                                setNewProduct({
                                    ...newProduct, 
                                    type: e.target.value,
                                    parts: e.target.value === 'combo' ? [] : []
                                })
                            }
                            className="w-full p-2 border rounded"
                        >
                            <option value="single">Yakka</option>
                            <option value="combo">Kombinatsiya</option>
                        </select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="dailyRate">Kunlik Narx</Label>
                        <Input
                            id="dailyRate"
                            type="number"
                            value={newProduct.dailyRate}
                            onChange={(e) =>
                                setNewProduct({
                                    ...newProduct,
                                    dailyRate: parseFloat(e.target.value)
                                })
                            }
                            placeholder="Kunlik narxni kiriting"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="quantity">Soni</Label>
                        <Input
                            id="quantity"
                            type="number"
                            value={newProduct.quantity}
                            onChange={(e) =>
                                setNewProduct({
                                    ...newProduct,
                                    quantity: parseInt(e.target.value)
                                })
                            }
                            placeholder="Mahsulot sonini kiriting"
                        />
                    </div>
                    {newProduct.type === 'combo' && (
                        <div className="grid gap-2">
                            <Label>Qismlar</Label>
                            {newProduct.parts.map((part, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                        value={part.product}
                                        onChange={(e) => handlePartChange(index, 'product', e.target.value)}
                                        placeholder="Qism nomi"
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        value={part.quantity}
                                        onChange={(e) => handlePartChange(index, 'quantity', parseInt(e.target.value))}
                                        placeholder="Soni"
                                        className="w-24"
                                    />
                                    <Button 
                                        variant="destructive" 
                                        size="icon"
                                        onClick={() => handleRemovePart(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleAddPart}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Qism qo'shish
                            </Button>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={handleAddProduct}>
                        Qo'shish
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
