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
            toast.error("Исм ва телефон рақам киритилиши шарт");
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
            toast.error("Исм ва телефон рақам киритилиши шарт");
            return;
        }
        dispatch(updateCustomerAsync(editingCustomer));
        setEditingCustomer(null);
    };

    const handleCancelEdit = () => {
        setEditingCustomer(null);
    };

    const handleDeleteCustomer = (id) => {
        if (window.confirm("Мижозни ўчиришни хоҳлайсизми?")) {
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
                <div className="text-red-500">Хатолик юз берди: {error}</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Мижозлар</h1>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Янги мижоз
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Янги мижоз қўшиш</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Исм</Label>
                                <Input
                                    id="name"
                                    value={newCustomer.name}
                                    onChange={(e) =>
                                        setNewCustomer({ ...newCustomer, name: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Телефон</Label>
                                <Input
                                    id="phone"
                                    value={newCustomer.phone}
                                    onChange={(e) =>
                                        setNewCustomer({ ...newCustomer, phone: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Манзил</Label>
                                <Input
                                    id="address"
                                    value={newCustomer.address}
                                    onChange={(e) =>
                                        setNewCustomer({ ...newCustomer, address: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Статус</Label>
                                <Select
                                    value={newCustomer.status}
                                    onValueChange={(value) =>
                                        setNewCustomer({ ...newCustomer, status: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Статус танланг" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="oddiy">Оддий</SelectItem>
                                        <SelectItem value="VIP">VIP</SelectItem>
                                        <SelectItem value="bad">Ёмон</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="balance">Баланс</Label>
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
                            <Button onClick={handleAddCustomer}>Қўшиш</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Мижоз исми, телефон рақами ёки манзили бўйича қидириш"
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="w-[200px]">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Статус бўйича филтр" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Барча</SelectItem>
                            <SelectItem value="oddiy">Оддий</SelectItem>
                            <SelectItem value="VIP">VIP</SelectItem>
                            <SelectItem value="bad">Ёмон</SelectItem>
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
                    Қарздор мижозлар
                    </Label>
                </div>
            </div>


            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Исм</TableHead>
                            <TableHead>Телефон</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Молиявий холат</TableHead>
                            <TableHead>Манзил</TableHead>
                            <TableHead className="text-right">Амаллар</TableHead>
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
                                                    <SelectItem value="oddiy"> Оддий</SelectItem>
                                                    <SelectItem value="VIP">VIP</SelectItem>
                                                    <SelectItem value="bad">Ёмон</SelectItem>
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
                                                Баланс: {customer.balance?.toLocaleString()} сўм
                                                </Badge>
                                                <div className="text-xs text-muted-foreground">
                                    
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{customer.address}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            
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
        </div>
    );
}