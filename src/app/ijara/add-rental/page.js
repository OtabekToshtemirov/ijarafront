'use client'

import { useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Mock data - replace with your actual data
const customers = [
    { id: 1, name: "John Doe" },
    { id: 2, name: "Jane Smith" },
]

const products = [
    { id: 1, name: "Bike", price: 50 },
    { id: 2, name: "Camera", price: 100 },
    { id: 3, name: "Tent", price: 75 },
    { id: 4, name: "Surfboard", price: 80 },
    { id: 5, name: "Kayak", price: 90 },
]

export default function Component() {
    const [selectedCustomer, setSelectedCustomer] = useState("")
    const [cartItems, setCartItems] = useState([])
    const [selectedProduct, setSelectedProduct] = useState("")
    const [quantity, setQuantity] = useState("1")

    const addToCart = () => {
        if (!selectedProduct || !quantity) return

        const product = products.find(p => p.id.toString() === selectedProduct)
        if (!product) return

        const newItem = {
            id: Math.random().toString(36).substr(2, 9),
            productId: product.id,
            quantity: parseInt(quantity),
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
            days: 7,
            total: product.price * parseInt(quantity) * 7
        }

        setCartItems([...cartItems, newItem])
        setSelectedProduct("")
        setQuantity("1")
    }

    const removeFromCart = (id) => {
        setCartItems(cartItems.filter(item => item.id !== id))
    }

    const updateDates = (id, startDate, endDate) => {
        if (!startDate || !endDate) return

        setCartItems(cartItems.map(item => {
            if (item.id === id) {
                const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                const product = products.find(p => p.id === item.productId)
                return {
                    ...item,
                    startDate,
                    endDate,
                    days,
                    total: (product?.price || 0) * item.quantity * days
                }
            }
            return item
        }))
    }

    const totalAmount = cartItems.reduce((sum, item) => sum + item.total, 0)

    return (
        <div className="container mx-auto p-6 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Yangi ijara</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Customer Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Mijozni tanlash</label>
                        <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                            <SelectTrigger>
                                <SelectValue placeholder="Mijozni tanlash" />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map(customer => (
                                    <SelectItem key={customer.id} value={customer.id.toString()}>
                                        {customer.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Add Product Form */}
                    <div className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium">Mahsulot</label>
                            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Mahsulot tanlash" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map(product => (
                                        <SelectItem key={product.id} value={product.id.toString()}>
                                            {product.name} - ${product.price}/day
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-32 space-y-2">
                            <label className="text-sm font-medium">Soni</label>
                            <Input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                            />
                        </div>
                        <Button onClick={addToCart}>
                            <Plus className="w-4 h-4 mr-2" />
                            Qo'shish
                        </Button>
                    </div>

                    {/* Cart Items */}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mahsulot</TableHead>
                                <TableHead>Miqdori</TableHead>
                                <TableHead>Boshlash sanasi</TableHead>
                                <TableHead>Yakuniy sana</TableHead>
                                <TableHead>Kunlar</TableHead>
                                <TableHead className="text-right">Umumiy</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cartItems.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>{products.find(p => p.id === item.productId)?.name}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {format(item.startDate, "PPP")}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={item.startDate}
                                                    onSelect={(date) => updateDates(item.id, date, item.endDate)}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </TableCell>
                                    <TableCell>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {format(item.endDate, "PPP")}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={item.endDate}
                                                    onSelect={(date) => updateDates(item.id, item.startDate, date)}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </TableCell>
                                    <TableCell>{item.days}</TableCell>
                                    <TableCell className="text-right">${item.total}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <div className="text-lg font-semibold">Umumiy ijara narxi:</div>
                    <div className="text-lg font-semibold">${totalAmount}</div>
                </CardFooter>
            </Card>
        </div>
    )
}
