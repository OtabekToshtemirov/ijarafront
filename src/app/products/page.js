'use client'

import { useState } from "react"
import { Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Label } from "@/components/ui/label"
import { toast } from "/src/hooks/use-toast"

const initialProducts = [
    {
        id: 1,
        name: "Item 1",
        type: "Dona",
        information: "beton qorish uskunasi",
        dailyPrice: 50000,
        status: "Ijarada",
        quantity: 2,
    },
    // Add more sample data as needed
]

export default function Component() {
    const [products, setProducts] = useState(initialProducts)
    const [searchQuery, setSearchQuery] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newProduct, setNewProduct] = useState({
        name: "",
        type: "",
        information: "",
        dailyPrice: 0,
        status: "Ijarada",
        quantity: 1,
    })

    const filteredProducts = products.filter((product) =>
        Object.values(product).some((value) =>
            value.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
    )

    const handleAddProduct = async () => {
        try {
            // Example API call - replace with your actual API endpoint
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

            setProducts([...products, { id: products.length + 1, ...addedProduct }])
            setNewProduct({
                name: "",
                type: "",
                information: "",
                dailyPrice: 0,
                status: "Ijarada",
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
                            <Plus className="w-4 h-4 mr-2" />
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
                                        setNewProduct({ ...newProduct, name: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Turi</Label>
                                <Input
                                    id="type"
                                    value={newProduct.type}
                                    onChange={(e) =>
                                        setNewProduct({ ...newProduct, type: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="information">Ma'lumot</Label>
                                <Input
                                    id="information"
                                    value={newProduct.information}
                                    onChange={(e) =>
                                        setNewProduct({ ...newProduct, information: e.target.value })
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
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
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
                            <TableHead>Turi</TableHead>
                            <TableHead>Ma'lumot</TableHead>
                            <TableHead>Kunlik narxi</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Soni</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>{product.type}</TableCell>
                                <TableCell>{product.information}</TableCell>
                                <TableCell>{product.dailyPrice}</TableCell>
                                <TableCell>{product.status}</TableCell>
                                <TableCell>{product.quantity}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
