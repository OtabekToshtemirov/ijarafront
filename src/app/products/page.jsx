'use client'

import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Eye, Edit2, Check, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { fetchProducts, updateProduct, deleteProduct } from '@/lib/features/products/productSlice'
import ProductAddForm from '@/components/products/ProductAddForm'
import ProductSearchBar from '@/components/products/ProductSearchBar'
import ProductDetailsSheet from '@/components/products/ProductDetailsSheet'
import { toast } from '@/hooks/use-toast'

export default function ProductsPage() {
    const dispatch = useDispatch()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [editedValues, setEditedValues] = useState({})
    const [editingParts, setEditingParts] = useState([])

    const products = useSelector((state) => state.products.products)
    const status = useSelector((state) => state.products.status)
    const error = useSelector((state) => state.products.error)

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchProducts())
        }
    }, [dispatch, status])

    const filteredProducts = Array.isArray(products)
        ? products.filter((product) =>
            Object.values(product).some((value) =>
                value.toString().toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
        : []

    const handleViewProduct = (product) => {
        setSelectedProduct(product)
        setIsDetailsOpen(true)
    }

    const handleCloseDetails = () => {
        setIsDetailsOpen(false)
        setSelectedProduct(null)
    }

    const handleEditProduct = (product) => {
        setEditingProduct(product)
        setEditedValues({
            name: product.name,
            dailyRate: product.dailyRate,
            quantity: product.quantity,
        })
        if (product.type === 'combo' && product.parts) {
            setEditingParts([...product.parts])
        } else {
            setEditingParts([])
        }
    }

    const handleCancelEdit = () => {
        setEditingProduct(null)
        setEditedValues({})
        setEditingParts([])
    }

    const handleSaveEdit = async () => {
        try {
            const updatedProduct = {
                ...editingProduct,
                ...editedValues,
            }
        
            if (editingProduct.type === 'combo') {
                updatedProduct.parts = editingParts
            }
        
            await dispatch(updateProduct(updatedProduct)).unwrap()
            setEditingProduct(null)
            setEditedValues({})
            setEditingParts([])
            toast({
                title: 'Muvaffaqiyat',
                description: 'Mahsulot muvaffaqiyatli tahrirlandi',
            })
        } catch (error) {
            toast({
                title: 'Xato',
                description: 'Mahsulotni tahrirlashda xatolik yuz berdi',
                variant: 'destructive',
            })
        }
    }

    const handlePartChange = (index, field, value) => {
        const newParts = [...editingParts]
        newParts[index] = { ...newParts[index], [field]: value }
        setEditingParts(newParts)
    }

    const handleAddPart = () => {
        setEditingParts([...editingParts, { productName: '', quantity: 1 }])
    }

    const handleRemovePart = (index) => {
        setEditingParts(editingParts.filter((_, i) => i !== index))
    }

    const handleInputChange = (e, field) => {
        setEditedValues({ ...editedValues, [field]: e.target.value })
    }

    const handleDelete = async (productId) => {
        if (window.confirm('Mahsulotni o\'chirishni tasdiqlaysizmi?')) {
            try {
                await dispatch(deleteProduct(productId)).unwrap()
                toast({
                    title: 'Muvaffaqiyat',
                    description: 'Mahsulot muvaffaqiyatli o\'chirildi',
                })
            } catch (error) {
                toast({
                    title: 'Xatolik',
                    description: error.message || 'Mahsulotni o\'chirishda xatolik yuz berdi',
                    variant: 'destructive',
                })
            }
        }
    }

    if (status === 'loading') {
        return <div>Yuklanmoqda...</div>
    }

    if (status === 'failed') {
        return <div>Xatolik: {error}</div>
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Mahsulotlar</h1>
                <ProductAddForm />
            </div>

            <ProductSearchBar 
                searchQuery={searchQuery} 
                onSearchChange={setSearchQuery} 
            />

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nomi</TableHead>
                            <TableHead>Turi</TableHead>
                            <TableHead>Kunlik Narxi</TableHead>
                            <TableHead>Soni</TableHead>
                            <TableHead>Kategoriya</TableHead>
                            <TableHead>Holati</TableHead>
                            <TableHead>Amallar</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.map((product, index) => (
                            <TableRow key={`${product._id}-${index}`}>
                                <TableCell>
                                    {editingProduct?._id === product._id ? (
                                        <div className="space-y-2">
                                            <Input
                                                value={editedValues.name}
                                                onChange={(e) => handleInputChange(e, 'name')}
                                            />
                                            {product.type === 'combo' && (
                                                <div className="mt-2 space-y-2">
                                                    {editingParts.map((part, index) => (
                                                        <div key={index} className="flex items-center gap-2">
                                                            <Input
                                                                placeholder="Mahsulot nomi"
                                                                value={part.productName}
                                                                onChange={(e) => handlePartChange(index, 'productName', e.target.value)}
                                                                className="flex-1"
                                                            />
                                                            <Input
                                                                type="number"
                                                                placeholder="Soni"
                                                                value={part.quantity}
                                                                onChange={(e) => handlePartChange(index, 'quantity', parseInt(e.target.value))}
                                                                className="w-24"
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleRemovePart(index)}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleAddPart}
                                                        className="w-full"
                                                    >
                                                        Qism qo'shish
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <div>{product.name}</div>
                                            {product.type === 'combo' && product.parts && (
                                                <div className="mt-1 space-x-1">
                                                    {product.parts.map((part, index) => (
                                                        <Badge key={index} variant="secondary">
                                                            {part.product.name} ({part.quantity})
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={product.type === 'single' ? 'default' : 'secondary'}>
                                        {product.type === 'single' ? 'Yakka Mahsulot' : 'Komplekt Mahsulot'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {editingProduct?._id === product._id ? (
                                        <Input
                                            type="number"
                                            value={editedValues.dailyRate}
                                            onChange={(e) => handleInputChange(e, 'dailyRate')}
                                        />
                                    ) : (
                                        `${product.dailyRate} so'm/kun`
                                    )}
                                </TableCell>
                                <TableCell>
                                    {editingProduct?._id === product._id ? (
                                        <Input
                                            type="number"
                                            value={editedValues.quantity}
                                            onChange={(e) => handleInputChange(e, 'quantity')}
                                        />
                                    ) : (
                                        product.quantity
                                    )}
                                </TableCell>
                                <TableCell>
                                    {product.category}
                                </TableCell>
                                <TableCell>
                                    <Badge 
                                        variant={product.quantity > 0 ? 'success' : 'destructive'}
                                    >
                                        {product.quantity>0 ? 'Mavjud' : 'Mavjud Emas'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {editingProduct?._id === product._id ? (
                                        <>
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                onClick={handleSaveEdit}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                onClick={handleCancelEdit}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                onClick={() => handleViewProduct(product)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                onClick={() => handleEditProduct(product)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                onClick={() => handleDelete(product._id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <ProductDetailsSheet 
                product={selectedProduct} 
                isOpen={isDetailsOpen}
                onOpenChange={(open) => {
                    setIsDetailsOpen(open);
                    if (!open) {
                        setSelectedProduct(null);
                    }
                }}
            />
        </div>
    )
}
