'use client';

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from 'next/navigation';
import { Search, Plus, Edit, Trash, X, Check } from 'lucide-react';
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
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    fetchCustomers,
    addCustomerAsync,
    updateCustomerAsync,
    deleteCustomerAsync
} from "@/lib/features/customers/customerSlice";
import { fetchRentalsByCustomerId } from "@/lib/features/rentals/rentalsSlice";
import { fetchPaymentsByCustomerId } from "@/lib/features/payments/paymentSlice";

export default function Component() {
    const dispatch = useDispatch();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [newCustomer, setNewCustomer] = useState({
        name: "",
        phone: "",
        address: "",
        balance: 0,
    });
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const customers = useSelector((state) => state.customers.customers);
    const rentals = useSelector((state) => state.rentals.rentals);
    const payments = useSelector((state) => state.payments.payments);
    const status = useSelector((state) => state.customers.status);
    const error = useSelector((state) => state.customers.error);

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchCustomers());
        }
    }, [dispatch, status]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const filteredCustomers = customers.filter((customer) =>
        Object.values(customer).some((value) =>
            value.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    const handleAddCustomer = () => {
        dispatch(addCustomerAsync(newCustomer));
        setIsDialogOpen(false);
        setNewCustomer({
            name: "",
            phone: "",
            address: "",
            balance: 0,
        });
    };

    const handleEditCustomer = (customer) => {
        setEditingCustomer({ ...customer });
    };

    const handleSaveEdit = () => {
        dispatch(updateCustomerAsync(editingCustomer));
        setEditingCustomer(null);
    };

    const handleCancelEdit = () => {
        setEditingCustomer(null);
    };

    const handleDeleteCustomer = (id) => {
        if (window.confirm("Are you sure you want to delete this customer?")) {
            dispatch(deleteCustomerAsync(id));
        }
    };

    const handleCustomerClick = (customer) => {
        router.push(`/customers/${customer._id}`);
    };

    if (status === 'loading') {
        return <div>Loading...</div>;
    }

    if (status === 'failed') {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Mijozlar</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Yangi mijoz
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Customer</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={newCustomer.name}
                                    onChange={(e) =>
                                        setNewCustomer({ ...newCustomer, name: e.target.value })
                                    }
                                />
                            </div>
                            <div  className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={newCustomer.address}
                                    onChange={(e) =>
                                        setNewCustomer({ ...newCustomer, address: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={newCustomer.phone}
                                    onChange={(e) =>
                                        setNewCustomer({ ...newCustomer, phone: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="balance">Balance</Label>
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
                            <Button onClick={handleAddCustomer}>Add Customer</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative w-full md:w-96 mb-6">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Mijoz qidirish"
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Balance</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCustomers.map((customer) => (
                            <TableRow
                                key={customer._id}
                            >
                                {editingCustomer && editingCustomer._id === customer._id ? (
                                    <>

                                        <TableCell>
                                            <Input
                                                value={editingCustomer.name}
                                                onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                                            />
                                        </TableCell>
                                        <TableCell  className="grid gap-2">
                                            <Input  value={editingCustomer.address} onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })} />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={editingCustomer.phone}
                                                onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input  type="number" value={editingCustomer.balance} onChange={(e) => setEditingCustomer({ ...editingCustomer, balance: parseFloat(e.target.value) })} />
                                        </TableCell>
                                        <TableCell>
                                            <Button onClick={handleSaveEdit} className="mr-2">
                                                <Check className="w-4 h-4" />
                                            </Button>
                                            <Button onClick={handleCancelEdit} variant="destructive">
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </>

                                ) : (
                                    <>

                                        <TableCell>
                                            <button onClick={() => handleCustomerClick(customer)} className="text-blue-500 hover:underline">
                                                {customer.name}
                                            </button>
                                        </TableCell>
                                        <TableCell>{customer.address}</TableCell>
                                        <TableCell>{customer.phone}</TableCell>
                                        <TableCell>{(customer.balance).toLocaleString()} so`m</TableCell>
                                        <TableCell>
                                            <Button onClick={() => handleEditCustomer(customer)} className="mr-2">
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button onClick={() => handleDeleteCustomer(customer._id)} variant="destructive">
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