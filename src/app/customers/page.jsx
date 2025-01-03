'use client';

import React from "react";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from 'next/navigation';
import { Search, Plus, Edit, Trash, X, Check, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import  Link  from "next/link";
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
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    fetchCustomers,
    addCustomerAsync,
    updateCustomerAsync,
    deleteCustomerAsync
} from "@/lib/features/customers/customerSlice";
import { fetchRentalsByCustomerId, returnProduct } from "@/lib/features/rentals/rentalsSlice";
import { fetchPaymentsByCustomerId } from "@/lib/features/payments/paymentSlice";
import { toast } from "sonner";

export default function Component() {
    const dispatch = useDispatch();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showNegativeBalance, setShowNegativeBalance] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        name: "",
        phone: "",
        address: "",
        status: "oddiy",
        balance: 0,
    });
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [returnDialogOpen, setReturnDialogOpen] = useState(false);
    const [selectedRental, setSelectedRental] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [returnQuantity, setReturnQuantity] = useState(1);
    const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);

    // Get customers from Redux store with proper initialization
    const customers = useSelector((state) => state.customers.customers) || [];
    const rentals = useSelector((state) => state.rentals.rentals);
    const payments = useSelector((state) => state.payments.payments);
    const status = useSelector((state) => state.customers.status);
    const error = useSelector((state) => state.customers.error);

    useEffect(() => {
        // Always fetch customers on component mount
        dispatch(fetchCustomers());
    }, [dispatch]);

    useEffect(() => {
        if (selectedCustomer) {
            dispatch(fetchRentalsByCustomerId(selectedCustomer._id));
            dispatch(fetchPaymentsByCustomerId(selectedCustomer._id));
        }
    }, [dispatch, selectedCustomer]);

    const filteredCustomers = customers?.filter((customer) => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery ||
            (customer.name && customer.name.toLowerCase().includes(searchLower)) ||
            (customer.phone && customer.phone.toLowerCase().includes(searchLower)) ||
            (customer.address && customer.address.toLowerCase().includes(searchLower));

        const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
        const matchesBalance = !showNegativeBalance || customer.balance < 0;

        return matchesSearch && matchesStatus && matchesBalance;
    }) || [];

    const handleAddCustomer = () => {
        if (!newCustomer.name || !newCustomer.phone) {
            toast.error("Ism va telefon raqam kiritilishi shart");
            return;
        }
        dispatch(addCustomerAsync(newCustomer));
        setIsAddDialogOpen(false);
        setNewCustomer({
            name: "",
            phone: "",
            address: "",
            status: "oddiy",
            balance: 0,
        });
    };

    const handleEditCustomer = (customer) => {
        setEditingCustomer({ ...customer });
    };

    const handleSaveEdit = () => {
        if (!editingCustomer.name || !editingCustomer.phone) {
            toast.error("Ism va telefon raqam kiritilishi shart");
            return;
        }
        dispatch(updateCustomerAsync(editingCustomer));
        setEditingCustomer(null);
    };

    const handleCancelEdit = () => {
        setEditingCustomer(null);
    };

    const handleDeleteCustomer = (id) => {
        if (window.confirm("Mijozni o'chirishni xohlaysizmi?")) {
            dispatch(deleteCustomerAsync(id));
        }
    };

    const handleViewCustomer = (customer) => {
        setSelectedCustomer(customer);
        setIsViewDialogOpen(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'VIP':
                return 'bg-yellow-500';
            case 'oddiy':
                return 'bg-green-500';
            case 'bad':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getActiveRentals = () => {
        return rentals.filter(rental => rental.customer?._id === selectedCustomer?._id && rental.status === 'active');
    };

    const getUnreturnedProducts = () => {
        const unreturnedProducts = [];
        getActiveRentals()
            .forEach(rental => {
                if (rental.status === 'active') {
                    rental.borrowedProducts.forEach(prod => {
                        const returnedQuantity = rental.returnedProducts
                            .filter(rp => rp.product?._id === prod.product?._id)
                            .reduce((sum, rp) => sum + rp.quantity, 0);
                        const remainingQuantity = prod.quantity - returnedQuantity;
                        if (remainingQuantity > 0) {
                            unreturnedProducts.push({
                                ...prod,
                                remainingQuantity,
                                rentalNumber: rental.rentalNumber,
                                startDate: rental.startDate
                            });
                        }
                    });
                }
            });
        return unreturnedProducts;
    };

    const getTotalPayments = () => {
        return payments.reduce((sum, payment) => sum + payment.amount, 0);
    };

    const handleReturn = async () => {
        if (!selectedRental || !selectedProduct) return;

        const returnData = {
            rentalId: selectedRental._id,
            productId: selectedProduct.product._id,
            quantity: returnQuantity,
            returnDate: returnDate
        };

        try {
            await dispatch(returnProduct(returnData)).unwrap();
            toast.success("Mahsulot muvaffaqiyatli qaytarildi");
            setReturnDialogOpen(false);
            setSelectedRental(null);
            setSelectedProduct(null);
            setReturnQuantity(1);
        } catch (error) {
            toast.error(error.message || "Mahsulotni qaytarishda xatolik yuz berdi");
        }
    };

    const openReturnDialog = (rental, product) => {
        const returnedQuantity = rental.returnedProducts
            .filter(rp => rp.product?._id === product.product?._id)
            .reduce((sum, rp) => sum + rp.quantity, 0);
        const remainingQuantity = product.quantity - returnedQuantity;

        setSelectedRental(rental);
        setSelectedProduct(product);
        setReturnQuantity(1);
        setReturnDialogOpen(true);
    };

    // Show loading state
    if (status === 'loading') {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    // Show error state
    if (status === 'failed') {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-red-500">Xatolik yuz berdi: {error}</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Mijozlar</h1>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Yangi mijoz
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Yangi mijoz qo'shish</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Ism</Label>
                                <Input
                                    id="name"
                                    value={newCustomer.name}
                                    onChange={(e) =>
                                        setNewCustomer({ ...newCustomer, name: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Telefon</Label>
                                <Input
                                    id="phone"
                                    value={newCustomer.phone}
                                    onChange={(e) =>
                                        setNewCustomer({ ...newCustomer, phone: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Manzil</Label>
                                <Input
                                    id="address"
                                    value={newCustomer.address}
                                    onChange={(e) =>
                                        setNewCustomer({ ...newCustomer, address: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={newCustomer.status}
                                    onValueChange={(value) =>
                                        setNewCustomer({ ...newCustomer, status: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status tanlang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="oddiy">Oddiy</SelectItem>
                                        <SelectItem value="VIP">VIP</SelectItem>
                                        <SelectItem value="bad">Yomon</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="balance">Balans</Label>
                                <Input
                                    id="balance"
                                    type="number"
                                    value={newCustomer.balance}
                                    onChange={(e) =>
                                        setNewCustomer({
                                            ...newCustomer,
                                            balance: parseFloat(e.target.value),
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleAddCustomer}>Qo'shish</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Mijoz ismi, telefon raqami yoki manzili bo'yicha qidirish"
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="w-[200px]">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Status bo'yicha filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Barchasi</SelectItem>
                            <SelectItem value="oddiy">Oddiy</SelectItem>
                            <SelectItem value="VIP">VIP</SelectItem>
                            <SelectItem value="bad">Yomon</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox
                        id="negativeBalance"
                        checked={showNegativeBalance}
                        onCheckedChange={setShowNegativeBalance}
                    />
                    <Label htmlFor="negativeBalance">
                        Qarzdor mijozlar
                    </Label>
                </div>
            </div>


            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ism</TableHead>
                            <TableHead>Telefon</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Moliyaviy holat</TableHead>
                            <TableHead>Manzil</TableHead>
                            <TableHead className="text-right">Amallar</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCustomers.map((customer) => (
                            <TableRow key={customer._id}>
                                {editingCustomer && editingCustomer._id === customer._id ? (
                                    <>
                                        <TableCell>
                                            <Input
                                                value={editingCustomer.name}
                                                onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={editingCustomer.phone}
                                                onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={editingCustomer.status}
                                                onValueChange={(value) => setEditingCustomer({ ...editingCustomer, status: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="oddiy">Oddiy</SelectItem>
                                                    <SelectItem value="VIP">VIP</SelectItem>
                                                    <SelectItem value="bad">Yomon</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={editingCustomer.balance}
                                                onChange={(e) => setEditingCustomer({ ...editingCustomer, balance: parseFloat(e.target.value) })}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={editingCustomer.address}
                                                onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button onClick={handleSaveEdit} size="sm">
                                                <Check className="w-4 h-4" />
                                            </Button>
                                            <Button onClick={handleCancelEdit} variant="destructive" size="sm">
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </>
                                ) : (
                                    <>
                                        <TableCell>
                                            <Link
                                                href={`/customers/${customer._id}`}
                                                className="text-blue-500 text-bold hover:underline cursor-pointer"
                                            >
                                                {customer.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{customer.phone}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusColor(customer.status)}>
                                                {customer.status === 'oddiy' ? 'Oddiy' :
                                                    customer.status === 'VIP' ? 'VIP' : 'Yomon'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <Badge variant={customer.balance >= 0 ? "success" : "destructive"}>
                                                    Balans: {customer.balance?.toLocaleString()} so'm
                                                </Badge>
                                                <div className="text-xs text-muted-foreground">
                                                    To'lovlar: {customer.totalPayments?.toLocaleString()} so'm
                                                    <br />
                                                    Qaytarishlar: {customer.totalReturnAmount?.toLocaleString()} so'm
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{customer.address}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button onClick={() => handleViewCustomer(customer)} size="sm" variant="outline">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button onClick={() => handleEditCustomer(customer)} size="sm">
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button onClick={() => handleDeleteCustomer(customer._id)} variant="destructive" size="sm">
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>


            {/* View Customer Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Mijoz ma'lumotlari</DialogTitle>
                    </DialogHeader>
                    {selectedCustomer && (
                        <div className="grid gap-6">
                            {/* Customer Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Shaxsiy ma'lumotlar</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Ism</Label>
                                        <p className="text-lg">{selectedCustomer.name}</p>
                                    </div>
                                    <div>
                                        <Label>Telefon</Label>
                                        <p className="text-lg">{selectedCustomer.phone}</p>
                                    </div>
                                    <div>
                                        <Label>Manzil</Label>
                                        <p className="text-lg">{selectedCustomer.address}</p>
                                    </div>
                                    <div>
                                        <Label>Status</Label>
                                        <Badge className={getStatusColor(selectedCustomer.status)}>
                                            {selectedCustomer.status === 'oddiy' ? 'Oddiy' :
                                                selectedCustomer.status === 'VIP' ? 'VIP' : 'Yomon'}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Financial Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Moliyaviy ma'lumotlar</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-6">
                                        <div className="flex items-center justify-center">
                                            <div className="text-center">
                                                <Badge
                                                    className="text-lg px-6 py-2"
                                                    variant={selectedCustomer.balance >= 0 ? "success" : "destructive"}
                                                >
                                                    Balans: {selectedCustomer.balance?.toLocaleString()} so'm
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-green-600">To'lovlar</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-2xl font-bold text-green-600">
                                                        {getTotalPayments().toLocaleString()} so'm
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-red-600">Qaytarishlar</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-2xl font-bold text-red-600">
                                                        {selectedCustomer.totalReturnAmount?.toLocaleString()} so'm
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Active Rentals */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Faol ijaralar</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {rentals
                                            .filter(rental => rental.customer?._id === selectedCustomer?._id)
                                            .filter(rental => rental.status === 'active')
                                            .map((rental) => (
                                                <div
                                                    key={rental._id}
                                                    className="border rounded-lg p-4"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <p className="font-medium">{rental.rentalNumber}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {new Date(rental.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-medium">
                                                                {rental.totalCost?.toLocaleString()} so'm
                                                            </p>

                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium mb-2">
                                                            Olingan mahsulotlar:
                                                        </p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {rental.borrowedProducts.map((prod, idx) => {
                                                                const returnedQuantity = rental.returnedProducts
                                                                    .filter(rp => rp.product?._id === prod.product?._id)
                                                                    .reduce((sum, rp) => sum + rp.quantity, 0);
                                                                const remainingQuantity = prod.quantity - returnedQuantity;

                                                                return (
                                                                    <div key={idx} className="flex justify-between border-b py-1">
                                                                        <span className="text-sm">
                                                                            {prod.product?.name}
                                                                        </span>
                                                                        <div className="text-sm text-right">
                                                                            <span>{prod.quantity} dona</span>
                                                                            {rental.status === 'active' && remainingQuantity > 0 && (
                                                                                <span className="text-muted-foreground ml-1">
                                                                                    (Qoldi: {remainingQuantity})
                                                                                </span>
                                                                            )}
                                                                            {rental.status !== 'active' && (
                                                                                <span className="text-green-500 ml-1">
                                                                                    (Qaytarilgan)
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* All Rentals History */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Barcha ijaralar tarixi</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {rentals
                                            .filter(rental => rental.customer?._id === selectedCustomer?._id)
                                            .map((rental) => (
                                                <div
                                                    key={rental._id}
                                                    className="border rounded-lg p-4"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-medium">{rental.rentalNumber}</p>
                                                                <Badge variant={rental.status === 'active' ? 'default' : 'secondary'}>
                                                                    {rental.status === 'active' ? 'Faol' : 'Yakunlangan'}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                {new Date(rental.startDate).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-medium">
                                                                {rental.totalCost?.toLocaleString()} so'm
                                                            </p>
                                                            {rental.debt > 0 && (
                                                                <p className="text-sm text-red-500">
                                                                    Qarz: {rental.debt?.toLocaleString()} so'm
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium mb-2">
                                                            Olingan mahsulotlar:
                                                        </p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {rental.borrowedProducts.map((prod, idx) => {
                                                                const returnedQuantity = rental.returnedProducts
                                                                    .filter(rp => rp.product?._id === prod.product?._id)
                                                                    .reduce((sum, rp) => sum + rp.quantity, 0);
                                                                const remainingQuantity = prod.quantity - returnedQuantity;

                                                                return (
                                                                    <div key={idx} className="flex justify-between border-b py-1">
                                                                        <span className="text-sm">
                                                                            {prod.product?.name}
                                                                        </span>
                                                                        <div className="text-sm text-right flex items-center gap-2">
                                                                            <span>{prod.quantity} dona</span>
                                                                            {rental.status === 'active' && remainingQuantity > 0 && (
                                                                                <>
                                                                                    <span className="text-muted-foreground">
                                                                                        (Qoldi: {remainingQuantity})
                                                                                    </span>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        onClick={() => openReturnDialog(rental, prod)}
                                                                                    >
                                                                                        Qaytarish
                                                                                    </Button>
                                                                                </>
                                                                            )}
                                                                            {rental.status !== 'active' && (
                                                                                <span className="text-green-500">
                                                                                    (Qaytarilgan)
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                    {rental.car && (
                                                        <div className="mt-2 text-sm text-muted-foreground">
                                                            Mashina: {rental.car.carNumber}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Unreturned Products */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Qaytarilmagan mahsulotlar</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {getUnreturnedProducts().map((prod, idx) => (
                                            <div key={idx} className="flex justify-between items-center border-b py-2">
                                                <div>
                                                    <p className="font-medium">{prod.product?.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {prod.rentalNumber} - {new Date(prod.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <Badge variant="outline">
                                                    {prod.remainingQuantity} dona
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payment History */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>To'lovlar tarixi</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {payments.map((payment) => (
                                            <div key={payment._id} className="flex justify-between items-center border-b py-2">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(payment.paymentDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <p className="font-medium">
                                                    {payment.amount?.toLocaleString()} so'm
                                                </p>
                                                <p className="font-medium">
                                                    {payment.paymentType?.toLocaleString() === 'cash' ? 'Naqd' : 'Plastik'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Return Product Dialog */}
            <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mahsulotni qaytarish</DialogTitle>
                    </DialogHeader>
                    {selectedRental && selectedProduct && (
                        <div className="space-y-4">
                            <div>
                                <Label>Ijara raqami</Label>
                                <p className="text-lg font-medium">{selectedRental.rentalNumber}</p>
                            </div>
                            <div>
                                <Label>Mahsulot</Label>
                                <p className="text-lg font-medium">{selectedProduct.product?.name}</p>
                            </div>
                            <div>
                                <Label>Qaytarish miqdori</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    max={selectedProduct.quantity}
                                    value={returnQuantity}
                                    onChange={(e) => setReturnQuantity(parseInt(e.target.value))}
                                />
                            </div>
                            <div>
                                <Label>Qaytarish sanasi</Label>
                                <Input
                                    type="date"
                                    value={returnDate}
                                    onChange={(e) => setReturnDate(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleReturn}>
                                    Qaytarish
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}