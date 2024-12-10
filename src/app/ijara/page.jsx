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
import {
    fetchRentals,
    fetchActiveRentals,
    fetchCompleteRentals,
    fetchCanceledRentals,
    fetchRentalsByCustomerId,
    fetchRentalsByProductId,
    fetchRentalsByCarId,
    updateRental
} from '@/lib/features/rentals/rentalsSlice';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import moment from 'moment';

export default function RentalsPage() {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [editingId, setEditingId] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    const rentals = useSelector((state) => state.rentals.rentals);

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
                            <SelectItem value="canceled">Bekor qilingan</SelectItem>
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

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mijoz</TableHead>
                            <TableHead>Mashina</TableHead>
                            <TableHead>Mahsulotlar</TableHead>
                            <TableHead>Sanalar</TableHead>
                            <TableHead>Narxlar</TableHead>
                            <TableHead>Holat</TableHead>
                            <TableHead className="text-right">Amallar</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rentals.map((rental) => (
                            <TableRow key={rental._id}>
                                <TableCell>
                                    {editingId === rental._id ? (
                                        <input
                                            type="text"
                                            value={editFormData.customerName}
                                            onChange={(e) => setEditFormData({...editFormData, customerName: e.target.value})}
                                            className="w-full p-1 border rounded"
                                        />
                                    ) : (
                                        rental.customer?.name
                                    )}
                                </TableCell>
                                <TableCell>
                                    {editingId === rental._id ? (
                                        <input
                                            type="text"
                                            value={editFormData.carInfo}
                                            onChange={(e) => setEditFormData({...editFormData, carInfo: e.target.value})}
                                            className="w-full p-1 border rounded"
                                        />
                                    ) : (
                                        `${rental.car?.carNumber} - ${rental.car?.driverName}`
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <div className="font-medium mb-1">Olingan:</div>
                                        <ul className="list-disc list-inside">
                                            {rental.borrowedProducts.map((prod, index) => (
                                                <li key={index}>
                                                    {prod.product.name} - {prod.quantity} dona
                                                </li>
                                            ))}
                                        </ul>
                                        {rental.returnedProducts?.length > 0 && (
                                            <div className="mt-2">
                                                <div className="font-medium mb-1">Qaytarilgan:</div>
                                                <ul className="list-disc list-inside">
                                                    {rental.returnedProducts.map((prod, index) => (
                                                        <li key={index}>
                                                            {prod.product.name} - {prod.quantity} dona
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {editingId === rental._id ? (
                                        <div className="space-y-1">
                                            <label className="text-sm">Ish boshlash sanasi:</label>
                                            <input
                                                type="date"
                                                value={editFormData.workStartDate}
                                                onChange={(e) => setEditFormData({...editFormData, workStartDate: e.target.value})}
                                                className="w-full p-1 border rounded"
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <p>Ish: {moment(rental.workStartDate).format('DD.MM.YYYY')}</p>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {editingId === rental._id ? (
                                        <div className="space-y-2">
                                            <div>
                                                <label className="text-sm">Umumiy narx:</label>
                                                <input
                                                    type="number"
                                                    value={editFormData.totalCost}
                                                    onChange={(e) => setEditFormData({
                                                        ...editFormData,
                                                        totalCost: e.target.value,
                                                        debt: e.target.value - editFormData.payedAmount
                                                    })}
                                                    className="w-full p-1 border rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm">To'langan summa:</label>
                                                <input
                                                    type="number"
                                                    value={editFormData.payedAmount}
                                                    onChange={(e) => setEditFormData({
                                                        ...editFormData,
                                                        payedAmount: e.target.value,
                                                        debt: editFormData.totalCost - e.target.value
                                                    })}
                                                    className="w-full p-1 border rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm">Qarz:</label>
                                                <input
                                                    type="number"
                                                    value={editFormData.debt}
                                                    readOnly
                                                    className="w-full p-1 border rounded bg-gray-100"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <p>Umumiy: {rental.totalCost?.toLocaleString()} so'm</p>
                                            <p>To'langan: {rental.payedAmount?.toLocaleString()} so'm</p>
                                            <p>Qarz: {rental.debt?.toLocaleString()} so'm</p>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {editingId === rental._id ? (
                                        <Select 
                                            value={editFormData.status} 
                                            onValueChange={(value) => setEditFormData({...editFormData, status: value})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Faol</SelectItem>
                                                <SelectItem value="completed">Yakunlangan</SelectItem>
                                                <SelectItem value="canceled">Bekor qilingan</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            rental.status === 'active' ? 'bg-green-100 text-green-800' :
                                            rental.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {rental.status === 'active' ? 'Faol' :
                                            rental.status === 'completed' ? 'Yakunlangan' :
                                            'Bekor qilingan'}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {editingId === rental._id ? (
                                        <div className="space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSave(rental._id)}
                                            >
                                                Saqlash
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleCancel}
                                            >
                                                Bekor
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(rental)}
                                        >
                                            Tahrirlash
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}