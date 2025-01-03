    'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from "@/components/ui/input";
import {
    fetchRentals,
    fetchActiveRentals,
    fetchCompleteRentals,
    fetchCanceledRentals,
    fetchRentalsByCustomerId,
    fetchRentalsByProductId,
    fetchRentalsByCarId,
    updateRental,
    returnProduct
} from '@/lib/features/rentals/rentalsSlice';
import { toast } from 'sonner';
import { Loader2, Plus, Edit, Eye } from 'lucide-react';
import moment from 'moment';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from "@/components/ui/label";

export default function RentalsPage() {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [editingId, setEditingId] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedRental, setSelectedRental] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const rentals = useSelector((state) => state.rentals.rentals);

    // Filter rentals based on search query
    const filteredRentals = rentals.filter(rental => {
        const search = searchQuery.toLowerCase();
        if (!search) return true;
        
        // Search in customer details
        const customerMatch = (rental.customer?.name || '').toLowerCase().includes(search) ||
                            (rental.customer?.phone || '').toLowerCase().includes(search);
        
        // Search in car details
        const carMatch = (rental.car?.carNumber || '').toLowerCase().includes(search) ||
                        (rental.car?.driverName || '').toLowerCase().includes(search);
        
        // Search in products
        const productMatch = rental.borrowedProducts.some(item => 
            (item.product.name || '').toLowerCase().includes(search)
        );

        return customerMatch || carMatch || productMatch;
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                await dispatch(fetchRentals());
            } catch (error) {
                console.error('Error loading data:', error);
                toast.error('Ma\'lumotlarni yuklashda xatolik yuz berdi');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [dispatch]);

    const handleFilterChange = async (value) => {
        setFilter(value);
        setLoading(true);
        try {
            switch (value) {
                case 'active':
                    await dispatch(fetchActiveRentals());
                    break;
                case 'completed':
                    await dispatch(fetchCompleteRentals());
                    break;
                case 'canceled':
                    await dispatch(fetchCanceledRentals());
                    break;
                default:
                    await dispatch(fetchRentals());
            }
        } catch (error) {
            toast.error('Ijaralarni yuklashda xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (rental) => {
        setEditingId(rental._id);
        setEditFormData({
            customerName: rental.customer?.name,
            carInfo: `${rental.car?.carNumber} - ${rental.car?.driverName}`,
            workStartDate: moment(rental.workStartDate).format('YYYY-MM-DD'),
            totalCost: rental.totalCost || 0,
            payedAmount: rental.payedAmount || 0,
            debt: rental.debt || 0,
            status: rental.status,
            borrowedProducts: rental.borrowedProducts || [],
            returnedProducts: rental.returnedProducts || []
        });
    };

    const handleSave = async (id) => {
        try {
            const updateData = {
                workStartDate: editFormData.workStartDate,
                totalCost: parseFloat(editFormData.totalCost),
                payedAmount: parseFloat(editFormData.payedAmount),
                debt: parseFloat(editFormData.debt),
                status: editFormData.status,
                borrowedProducts: editFormData.borrowedProducts,
                returnedProducts: editFormData.returnedProducts
            };

            await dispatch(updateRental({ id, data: updateData })).unwrap();
            toast.success("O'zgarishlar saqlandi");
            setEditingId(null);
            dispatch(fetchRentals());
        } catch (error) {
            toast.error(error.message || "Xatolik yuz berdi");
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditFormData({});
    };

    const handleStatusChange = async (rental, newStatus) => {
        try {
            const updateData = {
                ...rental,
                status: newStatus,
                returnDate: newStatus === 'completed' || newStatus === 'canceled' ? new Date().toISOString() : null
            };

            // If canceling or completing, return all products
            if (newStatus === 'canceled' || newStatus === 'completed') {
                const returnData = {
                    rentalId: rental._id,
                    products: rental.borrowedProducts.map(item => ({
                        product: item.product._id,
                        quantity: item.quantity,
                        returnDate: new Date().toISOString()
                    }))
                };
                
                await dispatch(returnProduct(returnData)).unwrap();
                toast.success("Mahsulotlar muvaffaqiyatli qaytarildi");
            }

            await dispatch(updateRental({ id: rental._id, data: updateData })).unwrap();
            toast.success(`Ijara holati ${newStatus === 'active' ? 'Faol' : 
                                       newStatus === 'completed' ? 'Yakunlangan' : 
                                       'Bekor qilindi'} ga o'zgartirildi`);
            
            dispatch(fetchRentals());
        } catch (error) {
            toast.error(error.message || "Xatolik yuz berdi");
        }
    };

    const handleProductEdit = (rental, product) => {
        setEditingProduct({
            rentalId: rental._id,
            productId: product.product._id,
            quantity: product.quantity,
            originalQuantity: product.quantity
        });
    };

    const handleProductQuantityChange = async (rental, product, newQuantity) => {
        try {
            const difference = newQuantity - product.quantity; // Positive if increasing, negative if decreasing
            
            // Update the rental's borrowed products
            const updatedBorrowedProducts = rental.borrowedProducts.map(item => 
                item.product._id === product.product._id
                    ? { ...item, quantity: newQuantity }
                    : item
            );

            // If reducing quantity, treat it as a partial return
            if (difference < 0) {
                const returnData = {
                    rentalId: rental._id,
                    products: [{
                        product: product.product._id,
                        quantity: Math.abs(difference),
                        returnDate: new Date().toISOString()
                    }]
                };
                await dispatch(returnProduct(returnData)).unwrap();
            }

            // Update the rental
            const updateData = {
                ...rental,
                borrowedProducts: updatedBorrowedProducts
            };

            await dispatch(updateRental({ id: rental._id, data: updateData })).unwrap();
            toast.success("Mahsulot miqdori muvaffaqiyatli o'zgartirildi");
            
            setEditingProduct(null);
            dispatch(fetchRentals());
        } catch (error) {
            toast.error(error.message || "Xatolik yuz berdi");
        }
    };

    const handleViewRental = (rental) => {
        setSelectedRental(rental);
        setViewDialogOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">Ijara</h2>
                    <p className="text-sm text-muted-foreground">
                        Barcha ijaralar ro'yxati
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <Select value={filter} onValueChange={handleFilterChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtr" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Barchasi</SelectItem>
                            <SelectItem value="active">Faol</SelectItem>
                            <SelectItem value="completed">Yakunlangan</SelectItem>
                            <SelectItem value="canceled">Bekor qilindi</SelectItem>
                        </SelectContent>
                    </Select>

                    <Link href="/ijara/add-rental">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Yangi ijara
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Search Input */}
            <div className="mb-6">
                <Input
                    className="max-w-md"
                    placeholder="Mijoz, mashina yoki mahsulot bo'yicha qidirish"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Raqam</TableHead>
                            <TableHead>Mijoz</TableHead>
                            <TableHead>Mashina</TableHead>
                            <TableHead>Kunlik Narx</TableHead>
                            <TableHead> Faol Kunlar</TableHead>
                            <TableHead>Mulklar</TableHead>
                          
                            <TableHead >Amallar</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRentals.map((rental) => (
                            <TableRow key={rental._id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{rental.rentalNumber || '-'}</span>
                                        <span className="text-sm text-muted-foreground">
                                            {new Date(rental.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{rental.customer?.name}</span>
                                        <span className="text-sm text-muted-foreground">
                                            {rental.customer?.phone}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{rental.car?.carNumber || '-'}</span>
                                        <span className="text-sm text-muted-foreground">
                                            {rental.car?.driverName || '-'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{rental.totalCost?.toLocaleString()} so'm</span>
                                        {rental.payments?.length > 0 && (
                                            <span className="text-sm text-green-600">
                                                To'langan: {rental.totalPayments?.toLocaleString()} so'm
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{rental.rentalDays} kun</span>
                                        <span className="text-sm text-muted-foreground">
                                            {rental.status === 'active' ? 'Faol' : 'Yakunlangan'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>Mulklar:</span>
                                        {rental.borrowedProducts.map((item, index) => (
                                            <div key={index} className="text-sm flex items-center justify-between">
                                                <div>
                                                    <span>{item.product.name} </span>
                                                    <span className="text-muted-foreground">({item.quantity}) dona</span> 
                                                </div>
                                                <span className="text-muted-foreground ml-2">
                                                    {new Date(item.rentDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    {editingId === rental._id ? (
                                        <div className="space-x-2">
                                            <Select 
                                                value={editFormData.status}
                                                onValueChange={(value) => {
                                                    handleStatusChange(rental, value);
                                                    handleCancel();
                                                }}
                                            >
                                                <SelectTrigger className="w-[140px]">
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Faol</SelectItem>
                                                    <SelectItem value="completed">Yakunlangan</SelectItem>
                                                    <SelectItem value="canceled">Bekor qilingan</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleCancel}
                                            >
                                                Bekor
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleViewRental(rental)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(rental)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* View Rental Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Ijara ma'lumotlari</DialogTitle>
                    </DialogHeader>
                    {selectedRental && (
                        <div className="grid gap-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Raqam</Label>
                                    <p className="text-lg">{selectedRental.rentalNumber}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(selectedRental.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <p className="text-lg">
                                        {selectedRental.status === 'active' ? 'Faol' :
                                         selectedRental.status === 'completed' ? 'Yakunlangan' :
                                         'Bekor qilingan'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <Label>Mijoz</Label>
                                <p className="text-lg">{selectedRental.customer?.name}</p>
                                <p className="text-sm text-muted-foreground">{selectedRental.customer?.phone}</p>
                            </div>

                            <div>
                                <Label>Mashina</Label>
                                <p className="text-lg">{selectedRental.car?.carNumber || '-'}</p>
                                <p className="text-sm text-muted-foreground">{selectedRental.car?.driverName || '-'}</p>
                            </div>

                            <div>
                                <Label>Moliyaviy ma'lumotlar</Label>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div>
                                        <p className="text-lg font-medium">{selectedRental.totalCost?.toLocaleString()} so'm</p>
                                        <p className="text-sm text-muted-foreground">Umumiy summa</p>
                                    </div>
                                    {selectedRental.payments?.length > 0 && (
                                        <div>
                                            <p className="text-lg font-medium text-green-600">
                                                {selectedRental.totalPayments?.toLocaleString()} so'm
                                            </p>
                                            <p className="text-sm text-muted-foreground">To'langan</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label>Mulklar</Label>
                                <div className="space-y-2 mt-2">
                                    {selectedRental.borrowedProducts.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{item.product.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {item.quantity} dona × {item.dailyRate?.toLocaleString()} so'm
                                                </p>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(item.rentDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}