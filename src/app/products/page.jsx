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
import ProductEditForm from '@/components/products/ProductEditForm'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, Label } from '@/components/ui/dialog'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

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
    const categories = ['Барчаси', ...new Set(products.map(p => p.category))]; 
    const statuses = [
        { value: 'all', label: 'Барчаси' },
        { value: 'mavjud', label: 'Мавжуд' },
        { value: 'mavjud_emas', label: 'Мавжуд эмас' }
    ]

    // Kategoriya bo'yicha umumiy sonni hisoblash
    const getCategoryTotal = (category) => {
        if (category === 'Барчаси') {
            return products.reduce((total, product) => total + (product.quantity || 0), 0);
        }
        return products
            .filter(product => product.category === category)
            .reduce((total, product) => total + (product.quantity || 0), 0);
    };

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
                description: 'Ашё муваффақиятли таҳрирланди',
            })
        } catch (error) {
            toast({
                title: 'Хато',
                description: 'Ашёни таҳрирлашда хатолик юз берди',
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
        if (window.confirm('Мулкни ўчиришни тасдиқлайсизми?')) {
            try {
                await dispatch(deleteProduct(productId)).unwrap()
                toast({
                    title: 'Муваффақият',
                    description: 'Мулк муваффақиятли ўчирилди',
                })
            } catch (error) {
                toast({
                    title: 'Хатолик',
                    description: error.message || 'Мулкни ўчиришда хатолик юз берди',
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
                <h1 className="text-4xl font-bold">Мулклар</h1>
                <ProductAddForm />
            </div>

        {/* Қидирув ва Филтрлар */}
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
                                placeholder="Мулк қидириш..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Тури</label>
                        <Select 
                            value={filters.type} 
                            onValueChange={(value) => handleFilterChange('type', value === 'all' ? '' : value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Турини танланг" />
                            </SelectTrigger>
                            <SelectContent>
                                {types.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {type === 'all' ? 'Барчаси' : 
                                         type === 'single' ? 'Якка' :
                                         type === 'combo' ? 'Комплект' : type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Категория</label>
                        <Select 
                            value={filters.category} 
                            onValueChange={(value) => handleFilterChange('category', value === 'Барчаси' ? '' : value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Категорияни танланг" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                        {category === 'all' ? 'Барчаси' : 
                                         category === 'qism' ? 'Қисм' :
                                         category === 'apalovka' ? 'Аполовка' :
                                         category === 'lesa' ? 'Леса' :
                                         category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Ҳолати</label>
                        <Select 
                            value={filters.status} 
                            onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
                        >
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

        {/* Категориялар статистикаси */}
            <div className="w-full max-w-5xl mx-auto mb-8">
                <Carousel opts={{ align: "start", slidesToScroll: 4 }}>
                    <CarouselContent className="-ml-2 md:-ml-4">
                        {categories.map((category) => (
                            <CarouselItem key={category} className="pl-2 md:pl-4 basis-1/2 md:basis-1/4">
                                <Card className="p-3">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-medium text-sm">{category}</h3>
                                            <p className="text-xl font-bold">{getCategoryTotal(category)}</p>
                                        </div>
                                        <div className="text-muted-foreground text-sm">
                                            дона
                                        </div>
                                    </div>
                                </Card>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden md:flex -left-12" />
                    <CarouselNext className="hidden md:flex -right-12" />
                </Carousel>
            </div>

            {/* Products Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Номи</TableHead>
                                <TableHead>Тури</TableHead>
                                <TableHead>Кунлик Нархи</TableHead>
                                <TableHead>Жами</TableHead>
                                <TableHead>Ижарада</TableHead>
                                <TableHead>Омбор</TableHead>
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
                                            product.quantity.toString()
                                        )}
                                    </TableCell>
                                    <TableCell>{product.rented.toString()}</TableCell>
                                    <TableCell>{(product.quantity - product.rented).toString()}</TableCell>
                                    <TableCell> {product.category === 'all' ? 'Барчаси' : 
                                                                 product.category === 'qism' ? 'Қисм' :
                                                                 product.category === 'apalovka' ? 'Аполовка' :
                                                                 product.category === 'lesa' ? 'Леса' :
                                                                 product.category}</TableCell>
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
                                            <ProductDetailsSheet product={product} />
                                            <ProductEditForm product={product} />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(product._id)}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
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
                onOpenChange={setIsDetailsOpen} 
            />
        </div>
    )
}
