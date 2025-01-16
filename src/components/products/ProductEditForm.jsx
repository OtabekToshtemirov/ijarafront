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
import { Plus, X, Loader2, Pencil } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { updateProduct, selectPartProducts } from '@/lib/features/products/productSlice'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function ProductEditForm({ product }) {
    const dispatch = useDispatch()
    const partProducts = useSelector(selectPartProducts)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editProduct, setEditProduct] = useState({
        ...product,
        parts: product.parts?.map(part => ({
            productId: part.product?._id || part.product,
            quantity: part.quantity,
            dailyRate: 0
        })) || [],
        dailyRate: product.dailyRate || 0
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [totalComboPrice, setTotalComboPrice] = useState(0)

    useEffect(() => {
        if (editProduct.type === 'combo') {
            const total = editProduct.parts.reduce((sum, part) => {
                const selectedProduct = partProducts.find(p => p._id === part.productId);
                const partDailyRate = selectedProduct?.dailyRate || 0;
                return sum + (partDailyRate * (part.quantity || 0));
            }, 0);
            
            setTotalComboPrice(total);
        }
    }, [editProduct.parts, partProducts]);

    const validateProduct = () => {
        const errors = []
        const requiredFields = {
            name: 'Мулк номи',
            category: 'Мулк категорияси'
        }

        Object.entries(requiredFields).forEach(([field, label]) => {
            if (!editProduct[field]?.trim()) {
                errors.push(`${label} киритилиши керак`)
            }
        })

        if (editProduct.quantity < 1) {
            errors.push('Мулк сони 1 дан катта бўлиши керак')
        }

        if (editProduct.type === 'combo' && !editProduct.parts?.length) {
            errors.push('Комбинация мулк учун камида битта қисм киритилиши керак')
        }

        return errors
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const validationErrors = validateProduct()
        
        if (validationErrors.length > 0) {
            validationErrors.forEach(error => {
                toast({
                    title: 'Хатолик',
                    description: error,
                    variant: 'destructive',
                })
            })
            return
        }

        setIsSubmitting(true)
        try {
            console.log('editProduct before formData:', editProduct);
            
            const dailyRate = Number(editProduct.dailyRate)
            console.log('dailyRate after Number():', dailyRate);
            
            if (isNaN(dailyRate)) {
                toast({
                    title: 'Хатолик',
                    description: 'Нархни тўғри киритинг',
                    variant: 'destructive',
                })
                setIsSubmitting(false)
                return
            }

            const formData = {
                ...editProduct,
                _id: product._id,
                dailyRate: dailyRate,
                quantity: Number(editProduct.quantity) || 1,
                parts: editProduct.type === 'combo' 
                    ? editProduct.parts.map(part => ({
                        product: part.productId,
                        quantity: Number(part.quantity) || 1
                    }))
                    : []
            }
            
            console.log('Sending formData:', formData);
            
            await dispatch(updateProduct(formData)).unwrap()
            
            toast({
                title: 'Муваффақият',
                description: 'Мулк муваффақиятли янгиланди',
            })
            
            setIsDialogOpen(false)
        } catch (error) {
            console.error('Мулк янгилашда хатолик:', error)
            toast({
                title: 'Хатолик',
                description: error.message || 'Мулк янгилашда хатолик юз берди',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleInputChange = (field, value) => {
        console.log('handleInputChange field:', field);
        console.log('handleInputChange value before:', value, typeof value);
        
        if (field === 'dailyRate' || field === 'quantity') {
            value = value === '' ? 0 : Number(value)
            console.log('handleInputChange value after:', value, typeof value);
        }
        
        setEditProduct(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleAddPart = () => {
        setEditProduct(prev => ({
            ...prev,
            parts: [...prev.parts, { productId: '', quantity: 1, dailyRate: 0 }]
        }))
    }

    const handlePartChange = (index, field, value) => {
        const updatedParts = [...editProduct.parts]
        const part = updatedParts[index]

        if (field === 'productId') {
            part.productId = value
        } else {
            part[field] = field === 'quantity' ? Number(value) : value
        }

        setEditProduct(prev => ({
            ...prev,
            parts: updatedParts
        }))
    }

    const handleRemovePart = (index) => {
        setEditProduct(prev => ({
            ...prev,
            parts: prev.parts.filter((_, i) => i !== index)
        }))
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Pencil className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Мулкни таҳрирлаш</DialogTitle>
                    <DialogDescription>
                        Мулк маълумотларини таҳрирлаш учун қуйидаги майдонларни тўлдиринг
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Номи
                        </Label>
                        <Input
                            id="name"
                            value={editProduct.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="col-span-3"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">
                            Тури
                        </Label>
                        <Select
                            value={editProduct.type}
                            onValueChange={(value) => handleInputChange('type', value)}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="single">Якка</SelectItem>
                                <SelectItem value="combo">Комбинация</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">
                            Категория
                        </Label>
                        <Select
                            value={editProduct.category}
                            onValueChange={(value) => handleInputChange('category', value)}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Категорияни танланг" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="apalovka">Апаловка</SelectItem>
                                <SelectItem value="lesa">Леса</SelectItem>
                                <SelectItem value="meshalka">Мешалка</SelectItem>
                                <SelectItem value="bayog">Баёг</SelectItem>
                                <SelectItem value="qism">Қисм</SelectItem>
                                <SelectItem value="boshqa">Бошқа</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="quantity" className="text-right">
                            Сони
                        </Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={editProduct.quantity}
                            onChange={(e) => handleInputChange('quantity', e.target.value)}
                            className="col-span-3"
                            required
                        />
                    </div>

                    {editProduct.type === 'combo' ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label>Қисмлар</Label>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddPart}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Қисм қўшиш
                                </Button>
                            </div>

                            {editProduct.parts.map((part, index) => (
                                <div key={index} className="space-y-2 p-4 border rounded-lg relative">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-2 top-2"
                                        onClick={() => handleRemovePart(index)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>

                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Маҳсулот</Label>
                                        <Select
                                            value={part.productId}
                                            onValueChange={(value) => handlePartChange(index, 'productId', value)}
                                        >
                                            <SelectTrigger className="col-span-3">
                                                <SelectValue placeholder="Маҳсулотни танланг">
                                                    {partProducts.find(p => p._id === part.productId)?.name || "Маҳсулотни танланг"}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {partProducts.map((product) => (
                                                    <SelectItem key={product._id} value={product._id}>
                                                        {product.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Сони</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={part.quantity}
                                            onChange={(e) => handlePartChange(index, 'quantity', e.target.value)}
                                            className="col-span-3"
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="dailyRate" className="text-right">
                                    Нархи
                                </Label>
                                <div className="col-span-3 space-y-2">
                                    <Input
                                        id="dailyRate"
                                        type="number"
                                        min="0"
                                        value={editProduct.dailyRate}
                                        onChange={(e) => handleInputChange('dailyRate', e.target.value)}
                                        required
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Қисмлар жами нархи: {totalComboPrice}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dailyRate" className="text-right">
                                Нархи
                            </Label>
                            <Input
                                id="dailyRate"
                                type="number"
                                min="0"
                                value={editProduct.dailyRate}
                                onChange={(e) => handleInputChange('dailyRate', e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                            Тавсиф
                        </Label>
                        <Input
                            id="description"
                            value={editProduct.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                </form>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Бекор қилиш
                    </Button>
                    <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Сақланмоқда...
                            </>
                        ) : (
                            'Сақлаш'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
