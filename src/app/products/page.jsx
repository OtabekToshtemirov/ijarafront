'use client'

import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Eye, Edit2, Check, X, Trash2, Search, Filter } from 'lucide-react'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { fetchProducts, updateProduct, deleteProduct } from '@/lib/features/products/productSlice'
import ProductAddForm from '@/components/products/ProductAddForm'
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
    const [filters, setFilters] = useState({
        type: 'all',
        category: 'all',
        status: 'all',
        minPrice: '',
        maxPrice: ''
    })

    const products = useSelector((state) => state.products.products)
    const status = useSelector((state) => state.products.status)
    const error = useSelector((state) => state.products.error)

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchProducts())
        }
    }, [dispatch, status])

    useEffect(() => {
        if (!isDetailsOpen) {
            setSelectedProduct(null)
        }
    }, [isDetailsOpen])

    // Helper function to get product status
    const getProductStatus = (quantity) => {
        if (quantity === 0) return 'mavjud_emas'
        if (quantity <= 10) return 'oz_qoldi'
        return 'mavjud'
    }

    const filteredProducts = Array.isArray(products)
        ? products.filter((product) => {
            // Search filter
            const matchesSearch = Object.values(product).some((value) =>
                value.toString().toLowerCase().includes(searchQuery.toLowerCase())
            )

            // Type filter
            const matchesType = filters.type === 'all' || product.type === filters.type

            // Category filter
            const matchesCategory = filters.category === 'all' || product.category === filters.category

            // Status filter based on quantity
            const productStatus = getProductStatus(product.quantity)
            const matchesStatus = filters.status === 'all' || productStatus === filters.status

            // Price filter
            const matchesPrice = (!filters.minPrice || product.dailyRate >= Number(filters.minPrice)) &&
                (!filters.maxPrice || product.dailyRate <= Number(filters.maxPrice))

            return matchesSearch && matchesType && matchesCategory && matchesStatus && matchesPrice
        })
        : []

    // Get unique values for filters
    const types = ['all', ...new Set(products.map(p => p.type))]
    const categories = ['all', ...new Set(products.map(p => p.category))]
    const statuses = [
        { value: 'all', label: 'Барчаси' },
        { value: 'mavjud', label: 'Мавжуд' },
        { value: 'oz_qoldi', label: 'Оз қолди' },
        { value: 'mavjud_emas', label: 'Мавжуд эмас' }
    ]

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }))
    }

    const handleViewProduct = (product) => {
        setSelectedProduct(product)
        setIsDetailsOpen(true)
    }

    const handleCloseDetails = () => {
        setIsDetailsOpen(false)
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
                title: 'Муваффақият',
                description: 'Маҳсулот муваффақиятли таҳрирланди',
            })
        } catch (error) {
            toast({
                title: 'Хато',
                description: 'Маҳсулотни таҳрирлашда хатолик юз берди',
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
        if (window.confirm('Маҳсулотни ўчиришни тасдиқлайсизми?')) {
            try {
                await dispatch(deleteProduct(productId)).unwrap()
                toast({
                    title: 'Муваффақият',
                    description: 'Маҳсулот муваффақиятли ўчирилди',
                })
            } catch (error) {
                toast({
                    title: 'Хатолик',
                    description: error.message || 'Маҳсулотни ўчиришда хатолик юз берди',
                    variant: 'destructive',
                })
            }
        }
    }

    if (status === 'loading') {
        return <div className="flex items-center justify-center h-screen">Юкланмоқда...</div>
    }

    if (status === 'failed') {
        return <div className="text-red-500">Хатолик: {error}</div>
    }

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold">Маҳсулотлар</h1>
                <ProductAddForm />
            </div>

            {/* Search and Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Қидирув ва Филтрлар</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Қидирув</label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Маҳсулот қидириш..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Тури</label>
                            <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Турини танланг" />
                                </SelectTrigger>
                                <SelectContent>
                                    {types.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type === 'all' ? 'Барчаси' : type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Категория</label>
                            <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Категорияни танланг" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category === 'all' ? 'Барчаси' : category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Ҳолати</label>
                            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Ҳолатини танланг" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                            {status.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Products Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Номи</TableHead>
                                <TableHead>Тури</TableHead>
                                <TableHead>Кунлик Нархи</TableHead>
                                <TableHead>Сони</TableHead>
                                <TableHead>Категория</TableHead>
                                <TableHead>Ҳолати</TableHead>
                                <TableHead>Амaллар</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.map((product) => (
                                <TableRow key={product._id}>
                                    <TableCell className="font-medium">
                                        {editingProduct?._id === product._id ? (
                                            <Input
                                                value={editedValues.name}
                                                onChange={(e) => handleInputChange(e, 'name')}
                                            />
                                        ) : (
                                            product.name
                                        )}
                                    </TableCell>
                                    <TableCell>{product.type == 'single' ? 'Якка' : 'Комплект'}</TableCell>
                                    <TableCell>
                                        {editingProduct?._id === product._id ? (
                                            <Input
                                                type="number"
                                                value={editedValues.dailyRate}
                                                onChange={(e) => handleInputChange(e, 'dailyRate')}
                                            />
                                        ) : (
                                            `${product.dailyRate} сўм`
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
                                    <TableCell>{product.category}</TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant={
                                                product.quantity === 0 ? 'destructive' : 
                                                product.quantity <= 10 ? 'warning' : 
                                                'success'
                                            }
                                        >
                                            {getProductStatus(product.quantity) === 'mavjud_emas' ? 'Мавжуд эмас' : 
                                             getProductStatus(product.quantity) === 'oz_qoldi' ? 'Оз қолди' : 
                                             'Мавжуд'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleViewProduct(product)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
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
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditProduct(product)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(product._id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Product Details Sheet */}
            <ProductDetailsSheet
                product={selectedProduct}
                isOpen={isDetailsOpen}
                onClose={handleCloseDetails}
            />
        </div>
    )
}
