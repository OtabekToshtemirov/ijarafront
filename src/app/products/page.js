'use client'

import {useState, useEffect} from "react"
import {useSelector, useDispatch} from "react-redux"
import {Search, Plus} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Badge} from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {Label} from "@/components/ui/label"
import {toast} from "/src/hooks/use-toast"
import {fetchProducts} from "@/lib/features/products/productSlice"


export default function Component() {
    const [searchQuery, setSearchQuery] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newProduct, setNewProduct] = useState({
        name: "",
        type: "",
        information: "",
        dailyPrice: 0,
        quantity: 1,
    })
    const dispatch = useDispatch();

    const products = useSelector((state) => state.products.products);
    const status = useSelector((state) => state.products.status);
    const error = useSelector((state) => state.products.error);

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchProducts());
        }
    }, [dispatch, status]);

    if (status === 'loading') {
        return <div>Loading...</div>;
    }

    if (status === 'failed') {
        return <div>Error: {error}</div>;
    }

    const filteredProducts = Array.isArray(products)
        ? products.filter((product) =>
            Object.values(product).some((value) =>
                value.toString().toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
        : [];

    const handleAddProduct = async () => {
        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newProduct),
            })

            if (!response.ok) {
                throw new Error('Failed to add product')
            }

            const addedProduct = await response.json()

            setProducts([...products, {id: products.length + 1, ...addedProduct}])
            setNewProduct({
                name: "",
                type: "",
                information: "",
                dailyPrice: 0,
                quantity: 1,
            })
            setIsDialogOpen(false)
            toast({
                title: "Success",
                description: "Product added successfully",
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to add product",
                variant: "destructive",
            })
        }
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Mahsulotlar</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2"/>
                            Yangi mahsulot
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Product</DialogTitle>
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
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Turi</Label>
                                <Input
                                    id="type"
                                    value={newProduct.type}
                                    onChange={(e) =>
                                        setNewProduct({...newProduct, type: e.target.value})
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="information">Ma'lumot</Label>
                                <Input
                                    id="information"
                                    value={newProduct.information}
                                    onChange={(e) =>
                                        setNewProduct({...newProduct, information: e.target.value})
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="dailyPrice">Kunlik narxi</Label>
                                <Input
                                    id="dailyPrice"
                                    type="number"
                                    value={newProduct.dailyPrice}
                                    onChange={(e) =>
                                        setNewProduct({
                                            ...newProduct,
                                            dailyPrice: parseInt(e.target.value),
                                        })
                                    }
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
                                            quantity: parseInt(e.target.value),
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleAddProduct}>Add Product</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative w-full md:w-96 mb-6">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
                <Input
                    placeholder="Search for a products"
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nomi</TableHead>
                            <TableHead>Kunlik narxi</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Soni</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.map((product) => (
                            <TableRow key={product._id}>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>{product.dailyRate}</TableCell>
                                <TableCell>{product.availability ? <Badge className={"text-green-500"} variant={"success"}>Mavjud</Badge> : <Badge className={"text-red-500"} variant={"danger"}>Mavjud emas</Badge>}</TableCell>
                                <TableCell>{product.quantity}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}