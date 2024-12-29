'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    fetchCars,
    createCar,
    updateCar,
    deleteCar,
    selectAllCars,
    selectCarsStatus,
    selectAddCarStatus,
    clearAddStatus
} from '@/lib/features/cars/carsSlice';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';

// Moved CarForm outside the main component
const CarForm = ({ onSubmit, formData, onChange, isEdit, isLoading, onClose }) => {
    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await onSubmit(e);
        if (success) {
            toast.success(isEdit ? 'Mashina muvaffaqiyatli yangilandi' : 'Mashina muvaffaqiyatli qo\'shildi');
            onClose();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="carNumber">Mashina raqami</Label>
                <Input
                    id="carNumber"
                    name="carNumber"
                    value={formData.carNumber}
                    onChange={onChange}
                    required
                    autoComplete="off"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="driverName">Haydovchi ismi</Label>
                <Input
                    id="driverName"
                    name="driverName"
                    value={formData.driverName}
                    onChange={onChange}
                    required
                    autoComplete="off"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="driverPhone">Telefon raqami</Label>
                <Input
                    id="driverPhone"
                    name="driverPhone"
                    value={formData.driverPhone}
                    onChange={onChange}
                    required
                    autoComplete="off"
                />
            </div>
            <DialogFooter>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                >
                    Bekor qilish
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isEdit ? 'Yangilash' : 'Saqlash'}
                </Button>
            </DialogFooter>
        </form>
    );
};

export default function CarsPage() {
    const dispatch = useDispatch();
    const cars = useSelector(selectAllCars);
    const status = useSelector(selectCarsStatus);
    const addStatus = useSelector(selectAddCarStatus);

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCar, setSelectedCar] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        carNumber: '',
        driverName: '',
        driverPhone: ''
    });

    // Filter cars based on search query
    const filteredCars = cars.filter(car => {
        const query = searchQuery.toLowerCase();
        return (
            car.carNumber.toLowerCase().includes(query) ||
            car.driverName.toLowerCase().includes(query) ||
            car.driverPhone.toLowerCase().includes(query)
        );
    });

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchCars());
        }
    }, [status, dispatch]);

    useEffect(() => {
        if (addStatus === 'succeeded') {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setFormData({
                carNumber: '',
                driverName: '',
                driverPhone: ''
            });
            dispatch(clearAddStatus());
        }
    }, [addStatus, dispatch]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddCar = async (e) => {
        e.preventDefault();
        try {
            await dispatch(createCar(formData)).unwrap();
            return true;
        } catch (error) {
            toast.error('Xatolik yuz berdi');
            return false;
        }
    };

    const handleEditCar = async (e) => {
        e.preventDefault();
        try {
            await dispatch(updateCar({ id: selectedCar._id, data: formData })).unwrap();
            return true;
        } catch (error) {
            toast.error('Xatolik yuz berdi');
            return false;
        }
    };

    const handleDeleteCar = async () => {
        if (selectedCar) {
            try {
                await dispatch(deleteCar(selectedCar._id)).unwrap();
                setIsDeleteDialogOpen(false);
                toast.success('Mashina muvaffaqiyatli o\'chirildi');
            } catch (error) {
                toast.error('Xatolik yuz berdi');
            }
        }
    };

    const openEditDialog = (car) => {
        setSelectedCar(car);
        setFormData({
            carNumber: car.carNumber,
            driverName: car.driverName,
            driverPhone: car.driverPhone
        });
        setIsEditDialogOpen(true);
    };

    const openDeleteDialog = (car) => {
        setSelectedCar(car);
        setIsDeleteDialogOpen(true);
    };

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Mashinalar</h1>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Mashina qo'shish
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Yangi mashina qo'shish</DialogTitle>
                        </DialogHeader>
                        <CarForm 
                            onSubmit={handleAddCar}
                            formData={formData}
                            onChange={handleInputChange}
                            isEdit={false}
                            isLoading={addStatus === 'loading'}
                            onClose={() => setIsAddDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search input */}
            <div className="mb-4">
                <Input
                    placeholder="Mashina raqami, haydovchi yoki telefon raqami bo'yicha qidirish..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                />
            </div>

            {status === 'loading' ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : status === 'failed' ? (
                <div className="text-center text-red-500">
                    Xatolik yuz berdi. Qaytadan urinib ko'ring.
                </div>
            ) : (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mashina raqami</TableHead>
                                <TableHead>Haydovchi</TableHead>
                                <TableHead>Telefon</TableHead>
                                <TableHead>Ijaralar soni</TableHead>
                                <TableHead>Amallar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCars.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4">
                                        Mashinalar topilmadi
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCars.map((car) => (
                                    <TableRow key={car._id}>
                                        <TableCell>{car.carNumber}</TableCell>
                                        <TableCell>{car.driverName}</TableCell>
                                        <TableCell>{car.driverPhone}</TableCell>
                                        <TableCell>{car.rentalCount}</TableCell>
                                        <TableCell className="space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEditDialog(car)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openDeleteDialog(car)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mashinani tahrirlash</DialogTitle>
                    </DialogHeader>
                    <CarForm 
                        onSubmit={handleEditCar}
                        formData={formData}
                        onChange={handleInputChange}
                        isEdit={true}
                        isLoading={addStatus === 'loading'}
                        onClose={() => setIsEditDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mashinani o'chirish</DialogTitle>
                    </DialogHeader>
                    <p>Haqiqatan ham bu mashinani o'chirmoqchimisiz?</p>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        >
                            Bekor qilish
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteCar}
                        >
                            O'chirish
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
