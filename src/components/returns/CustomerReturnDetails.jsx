'use client'

import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'

export default function CustomerReturnDetails({ customer, isOpen, onClose }) {
    const dispatch = useDispatch()
    const rentals = useSelector((state) => 
        state.rentals.rentals.filter(
            rental => rental.customer._id === customer._id && rental.status === 'active'
        )
    )

    const [returnQuantities, setReturnQuantities] = useState({})
    const [returnDates, setReturnDates] = useState({})

    // Balansni hisoblash
    const calculateBalance = () => {
        return rentals.reduce((total, rental) => {
            return total + rental.totalCost - rental.payedAmount
        }, 0)
    }

    // Kunlar sonini hisoblash
    const calculateDays = (startDate, endDate) => {
        const start = new Date(startDate)
        const end = new Date(endDate)
        const diffTime = Math.abs(end - start)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    // To'lov summasini hisoblash
    const calculatePayment = (product, startDate, endDate) => {
        const days = calculateDays(startDate, endDate)
        return days * product.product.dailyRate * product.quantity
    }

    // Qaytarish miqdorini o'zgartirish
    const handleQuantityChange = (rentalId, productId, value) => {
        setReturnQuantities(prev => ({
            ...prev,
            [`${rentalId}_${productId}`]: parseInt(value) || 0
        }))
    }

    // Qaytarish sanasini o'zgartirish
    const handleDateChange = (rentalId, productId, value) => {
        setReturnDates(prev => ({
            ...prev,
            [`${rentalId}_${productId}`]: value
        }))
    }

    // Tovarni qaytarish
    const handleReturn = async (rental, product) => {
        const returnQuantity = returnQuantities[`${rental._id}_${product.product._id}`] || 0
        const returnDate = returnDates[`${rental._id}_${product.product._id}`] || new Date().toISOString().split('T')[0]
        
        if (returnQuantity <= 0) {
            toast({
                title: "Xatolik",
                description: "Qaytarish miqdori 0 dan katta bo'lishi kerak",
                variant: "destructive"
            })
            return
        }

        if (returnQuantity > product.quantity) {
            toast({
                title: "Xatolik",
                description: "Qaytarish miqdori ijaraga olingan miqdordan ko'p bo'lishi mumkin emas",
                variant: "destructive"
            })
            return
        }

        try {
            const response = await fetch('http://localhost:5000/api/rentals/return', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rentalId: rental._id,
                    returnedProducts: [{
                        product: product.product._id,
                        quantity: returnQuantity,
                        returnDate: returnDate
                    }]
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message)
            }

            const updatedRental = await response.json()
            
            // Redux state'ni yangilash
            dispatch(updateRental(updatedRental))
            
            toast({
                title: "Muvaffaqiyatli",
                description: `Mahsulot qaytarildi. To'lov summasi: ${calculatePayment(product, product.startDate, returnDate)} so'm`,
            })

            // Formani tozalash
            setReturnQuantities(prev => {
                const newState = { ...prev }
                delete newState[`${rental._id}_${product.product._id}`]
                return newState
            })
            setReturnDates(prev => {
                const newState = { ...prev }
                delete newState[`${rental._id}_${product.product._id}`]
                return newState
            })
        } catch (error) {
            toast({
                title: "Xatolik",
                description: error.message,
                variant: "destructive"
            })
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Mijoz ma'lumotlari</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Mijoz ma'lumotlari */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="font-semibold">Mijoz:</p>
                            <p>{customer.name}</p>
                        </div>
                        <div>
                            <p className="font-semibold">Telefon:</p>
                            <p>{customer.phone}</p>
                        </div>
                        <div>
                            <p className="font-semibold">Qarzdorlik:</p>
                            <p>{calculateBalance()} so'm</p>
                        </div>
                    </div>

                    {/* Ijaraga olingan tovarlar */}
                    <div>
                        <h3 className="font-semibold mb-2">Ijaraga olingan tovarlar:</h3>
                        {rentals.map((rental) => (
                            <div key={rental._id} className="border rounded-lg p-4 mb-4">
                                <p className="font-medium mb-2">
                                    Ijara sanasi: {new Date(rental.startDate).toLocaleDateString()}
                                </p>
                                <div className="space-y-4">
                                    {rental.borrowedProducts.map((product) => {
                                        if (product.quantity <= 0) return null;
                                        
                                        const returnDate = returnDates[`${rental._id}_${product.product._id}`] || new Date().toISOString().split('T')[0]
                                        const days = calculateDays(product.startDate, returnDate)
                                        const payment = calculatePayment(product, product.startDate, returnDate)
                                        
                                        return (
                                            <div key={product._id} className="border p-4 rounded">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <div className="flex-1">
                                                        <p className="font-medium">{product.product.name}</p>
                                                        <p className="text-sm text-gray-500">
                                                            Miqdori: {product.quantity} dona | 
                                                            Kunlik narx: {product.product.dailyRate} so'm
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Olib ketilgan sana: {new Date(product.startDate).toLocaleDateString()} | 
                                                            Ijara davomiyligi: {days} kun
                                                        </p>
                                                        <p className="text-sm font-medium text-green-600">
                                                            To'lov summasi: {payment} so'm
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <Input
                                                        type="date"
                                                        defaultValue={new Date().toISOString().split('T')[0]}
                                                        onChange={(e) => handleDateChange(rental._id, product.product._id, e.target.value)}
                                                    />
                                                    <Input
                                                        type="number"
                                                        placeholder="Qaytarish miqdori"
                                                        min="1"
                                                        max={product.quantity}
                                                        value={returnQuantities[`${rental._id}_${product.product._id}`] || ''}
                                                        onChange={(e) => handleQuantityChange(rental._id, product.product._id, e.target.value)}
                                                    />
                                                    <Button 
                                                        variant="outline"
                                                        onClick={() => handleReturn(rental, product)}
                                                    >
                                                        Qaytarish
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
