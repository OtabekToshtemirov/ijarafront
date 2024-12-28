'use client';

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { fetchRentals, returnProduct } from "@/lib/features/rentals/rentalsSlice";
import { toast } from "sonner";

export default function Component() {
    const dispatch = useDispatch();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [returnQuantities, setReturnQuantities] = useState({});
    const [discountDays, setDiscountDays] = useState({});

    const rentals = useSelector((state) => state.rentals.rentals);
    const status = useSelector((state) => state.rentals.status);

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchRentals());
        }
    }, [dispatch, status]);

    // Get active rentals with unreturned products
    const activeRentals = rentals.filter(rental => {
        if (rental.status !== 'active') return false;
        
        // Check if there are any unreturned products
        return rental.borrowedProducts.some(prod => {
            const returnedQuantity = rental.returnedProducts
                .filter(rp => rp.product?._id === prod.product?._id)
                .reduce((sum, rp) => sum + rp.quantity, 0);
            return prod.quantity - returnedQuantity > 0;
        });
    });

    // Group rentals by customer
    const customerRentals = activeRentals.reduce((acc, rental) => {
        const customerId = rental.customer?._id;
        if (!customerId) return acc;

        if (!acc[customerId]) {
            acc[customerId] = {
                customer: rental.customer,
                rentals: [],
                totalRentals: 0,
                unreturnedProducts: 0
            };
        }

        const unreturnedCount = rental.borrowedProducts.reduce((count, prod) => {
            const returnedQuantity = rental.returnedProducts
                .filter(rp => rp.product?._id === prod.product?._id)
                .reduce((sum, rp) => sum + rp.quantity, 0);
            return count + (prod.quantity - returnedQuantity);
        }, 0);

        acc[customerId].rentals.push(rental);
        acc[customerId].totalRentals += 1;
        acc[customerId].unreturnedProducts += unreturnedCount;

        return acc;
    }, {});

    const filteredCustomers = Object.values(customerRentals).filter(item => {
        const searchLower = searchQuery.toLowerCase();
        return item.customer?.name.toLowerCase().includes(searchLower) ||
               item.customer?.phone.toLowerCase().includes(searchLower);
    });

    const calculateRentalDays = (startDate, discountDays = 0) => {
        const start = new Date(startDate);
        const now = new Date();
        const totalDays = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
        return Math.max(0, totalDays - discountDays);
    };

    const calculateProductCost = (product, days) => {
        return (product.savedDailyRate || 0) * days;
    };

    const handleReturnQuantityChange = (rentalId, productId, quantity, maxQuantity) => {
        if (quantity > maxQuantity) quantity = maxQuantity;
        if (quantity < 0) quantity = 0;

        setReturnQuantities(prev => ({
            ...prev,
            [`${rentalId}-${productId}`]: quantity
        }));
    };

    const handleDiscountDaysChange = (rentalId, days) => {
        if (days < 0) days = 0;
        setDiscountDays(prev => ({
            ...prev,
            [rentalId]: days
        }));
    };

    const handleReturn = async (rental, product) => {
        const key = `${rental._id}-${product.product._id}`;
        const quantity = returnQuantities[key] || 0;

        if (quantity <= 0) {
            toast.error("Qaytarish miqdorini kiriting");
            return;
        }

        const returnData = {
            rentalId: rental._id,
            productId: product.product._id,
            quantity: quantity,
            returnDate: new Date().toISOString()
        };

        try {
            await dispatch(returnProduct(returnData)).unwrap();
            toast.success("Mahsulot muvaffaqiyatli qaytarildi");
            
            // Clear the return quantity
            setReturnQuantities(prev => {
                const newState = { ...prev };
                delete newState[key];
                return newState;
            });
        } catch (error) {
            toast.error(error.message || "Mahsulotni qaytarishda xatolik yuz berdi");
        }
    };

    const calculateCustomerBalance = (customerRentals) => {
        return customerRentals.reduce((balance, rental) => {
            // Add rental costs
            balance += rental.totalCost || 0;
            // Subtract payments
            balance -= rental.payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
            return balance;
        }, 0);
    };

    if (status === 'loading') {
        return <div>Loading...</div>;
    }

    if (status === 'failed') {
        return <div>Error loading rentals</div>;
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Maxsulotlarni qaytarish</h1>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Mijoz ismi yoki telefon raqami bo'yicha qidirish"
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {!selectedCustomer ? (
                // Customer List View
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mijoz</TableHead>
                                <TableHead>Telefon</TableHead>
                                <TableHead>Faol ijaralar</TableHead>
                                <TableHead>Qaytarilmagan tovarlar</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCustomers.map((item) => (
                                <TableRow key={item.customer._id}>
                                    <TableCell>{item.customer.name}</TableCell>
                                    <TableCell>{item.customer.phone}</TableCell>
                                    <TableCell>{item.totalRentals}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {item.unreturnedProducts} dona
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button 
                                            variant="outline"
                                            onClick={() => setSelectedCustomer(item)}
                                        >
                                            Qaytarish
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4">
                                        Qaytarilmagan mahsulotlari bor mijozlar topilmadi
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                // Customer Detail View
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="space-y-2">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-bold">{selectedCustomer.customer.name}</h2>
                                <Badge variant={selectedCustomer.customer.status}>
                                    {selectedCustomer.customer.status}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground">{selectedCustomer.customer.phone}</p>
                            <div className="flex items-center gap-4">
                                <Badge variant={calculateCustomerBalance(selectedCustomer.rentals) > 0 ? "destructive" : "success"}>
                                    Balans: {calculateCustomerBalance(selectedCustomer.rentals).toLocaleString()} so'm
                                </Badge>
                                <Badge variant="outline">
                                    Faol ijaralar: {selectedCustomer.totalRentals}
                                </Badge>
                                <Badge variant="outline">
                                    Qaytarilmagan: {selectedCustomer.unreturnedProducts} dona
                                </Badge>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setSelectedCustomer(null)}
                        >
                            Orqaga
                        </Button>
                    </div>

                    {selectedCustomer.rentals.map((rental) => (
                        <Card key={rental._id} className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        Ijara #{rental.rentalNumber}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Boshlangan sana: {new Date(rental.startDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Label>Chegirma kunlar:</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={discountDays[rental._id] || 0}
                                            onChange={(e) => handleDiscountDaysChange(rental._id, parseInt(e.target.value) || 0)}
                                            className="w-20"
                                        />
                                    </div>
                                    <Badge>
                                        {calculateRentalDays(rental.startDate, discountDays[rental._id] || 0)} kun
                                    </Badge>
                                </div>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mahsulot</TableHead>
                                        <TableHead>Ish boshlash sanasi</TableHead>
                                        <TableHead>Kunlik narx</TableHead>
                                        <TableHead>Olingan</TableHead>
                                        <TableHead>Qaytarilgan</TableHead>
                                        <TableHead>Qaytarish</TableHead>
                                        <TableHead>Qoldiq</TableHead>
                                        <TableHead>Summa</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rental.borrowedProducts.map((prod) => {
                                        const returnedQuantity = rental.returnedProducts
                                            .filter(rp => rp.product?._id === prod.product?._id)
                                            .reduce((sum, rp) => sum + rp.quantity, 0);
                                        const remainingQuantity = prod.quantity - returnedQuantity;
                                        const days = calculateRentalDays(
                                            prod.startDate || rental.startDate,
                                            discountDays[rental._id] || 0
                                        );
                                        const key = `${rental._id}-${prod.product._id}`;
                                        
                                        if (remainingQuantity <= 0) return null;

                                        const returnQuantity = returnQuantities[key] || 0;
                                        const cost = calculateProductCost(prod.product, days) * returnQuantity;

                                        return (
                                            <TableRow key={prod.product._id}>
                                                <TableCell>{prod.product.name}</TableCell>
                                                <TableCell>
                                                    {new Date(prod.startDate || rental.startDate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    {prod.product.dailyRate?.toLocaleString()} so'm
                                                </TableCell>
                                                <TableCell>{prod.quantity}</TableCell>
                                                <TableCell>{returnedQuantity}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        max={remainingQuantity}
                                                        value={returnQuantities[key] || ""}
                                                        onChange={(e) => handleReturnQuantityChange(
                                                            rental._id,
                                                            prod.product._id,
                                                            parseInt(e.target.value) || 0,
                                                            remainingQuantity
                                                        )}
                                                        className="w-20"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={remainingQuantity > 0 ? "secondary" : "success"}>
                                                        {remainingQuantity} dona
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">
                                                            {cost.toLocaleString()} so'm
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            ({days} kun × {returnQuantity} dona)
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleReturn(rental, prod)}
                                                        disabled={!returnQuantities[key]}
                                                    >
                                                        Qaytarish
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
