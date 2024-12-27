'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { 
    createRental, 
    clearAddStatus 
} from '@/lib/features/rentals/rentalsSlice';
import { fetchCustomers } from '@/lib/features/customers/customerSlice';
import { fetchProducts } from '@/lib/features/products/productSlice';
import { fetchCars } from '@/lib/features/cars/carsSlice';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';

export default function AddRentalPage() {
    const dispatch = useDispatch();
    const router = useRouter();
    
    const customers = useSelector(state => state.customers.customers);
    const products = useSelector(state => state.products.products);
    const cars = useSelector((state) => state.cars.cars) || [];
    const carsStatus = useSelector((state) => state.cars.status);
    const carsError = useSelector((state) => state.cars.error);
    const addStatus = useSelector((state) => state.rentals.addStatus);
    const addError = useSelector((state) => state.rentals.error);

    const [rentalForm, setRentalForm] = useState({
        customer: '',
        car: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        status: 'active',
        borrowedProducts: [{ 
            product: '', 
            quantity: 1,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0]
        }]
    });

    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        dispatch(fetchCustomers());
        dispatch(fetchProducts());

        return () => {
            dispatch(clearAddStatus());
        };
    }, [dispatch]);

    useEffect(() => {
        if (carsStatus === 'idle') {
            dispatch(fetchCars());
        }
    }, [carsStatus, dispatch]);

    useEffect(() => {
        if (addStatus === 'succeeded') {
            toast.success('Ijara muvaffaqiyatli yaratildi');
            router.push('/ijara');
        } else if (addStatus === 'failed' && addError) {
            toast.error(addError);
        }
    }, [addStatus, addError, router]);

    if (carsStatus === 'loading') {
        return (
            <div className="container mx-auto py-10">
                <div className="flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-lg font-medium">Yuklanmoqda...</h2>
                        <p className="text-sm text-muted-foreground">Ma'lumotlar yuklanmoqda, iltimos kuting</p>
                    </div>
                </div>
            </div>
        );
    }

    if (carsStatus === 'failed') {
        return (
            <div className="container mx-auto py-10">
                <div className="flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-lg font-medium text-red-500">Xatolik yuz berdi</h2>
                        <p className="text-sm text-muted-foreground">{carsError}</p>
                    </div>
                </div>
            </div>
        );
    }

    const validateForm = () => {
        const errors = {};
        
        if (!rentalForm.customer) {
            errors.customer = 'Mijozni tanlash majburiy';
        }

        if (!rentalForm.car) {
            errors.car = 'Mashinani tanlash majburiy';
        }

        if (!rentalForm.startDate) {
            errors.startDate = 'Boshlanish sanasini tanlash majburiy';
        }

        if (!rentalForm.endDate) {
            errors.endDate = 'Tugash sanasini tanlash majburiy';
        }

        if (rentalForm.startDate && rentalForm.endDate) {
            const start = new Date(rentalForm.startDate);
            const end = new Date(rentalForm.endDate);
            if (end < start) {
                errors.endDate = 'Tugash sanasi boshlanish sanasidan katta bo\'lishi kerak';
            }
        }

        if (!rentalForm.borrowedProducts || rentalForm.borrowedProducts.length === 0) {
            errors.borrowedProducts = 'Kamida bitta mahsulot tanlash majburiy';
        }

        rentalForm.borrowedProducts.forEach((product, index) => {
            if (!product.product) {
                errors[`borrowedProducts.${index}.product`] = 'Mahsulotni tanlash majburiy';
            }
            if (product.quantity < 1) {
                errors[`borrowedProducts.${index}.quantity`] = 'Miqdor 1 dan kam bo\'lmasligi kerak';
            }
        });

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setRentalForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setRentalForm(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear validation error when field is filled
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleProductChange = (index, field, value) => {
        setRentalForm(prev => {
            const newProducts = [...prev.borrowedProducts];
            newProducts[index] = {
                ...newProducts[index],
                [field]: value
            };
            return {
                ...prev,
                borrowedProducts: newProducts
            };
        });

        // Clear validation error when field is filled
        const errorKey = `borrowedProducts.${index}.${field}`;
        if (validationErrors[errorKey]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[errorKey];
                return newErrors;
            });
        }
    };

    const addProduct = () => {
        setRentalForm(prev => ({
            ...prev,
            borrowedProducts: [
                ...prev.borrowedProducts,
                {
                    product: '',
                    quantity: 1,
                    startDate: prev.startDate,
                    endDate: prev.endDate
                }
            ]
        }));
    };

    const removeProduct = (index) => {
        if (rentalForm.borrowedProducts.length === 1) {
            toast.error('Kamida bitta mahsulot bo\'lishi kerak');
            return;
        }
        
        setRentalForm(prev => ({
            ...prev,
            borrowedProducts: prev.borrowedProducts.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error('Formani to\'ldiring');
            return;
        }

        // Format dates properly
        const formattedData = {
            ...rentalForm,
            startDate: new Date(rentalForm.startDate).toISOString(),
            endDate: new Date(rentalForm.endDate).toISOString(),
            borrowedProducts: rentalForm.borrowedProducts.map(product => ({
                ...product,
                startDate: new Date(product.startDate || rentalForm.startDate).toISOString(),
                endDate: new Date(product.endDate || rentalForm.endDate).toISOString()
            }))
        };

        try {
            await dispatch(createRental(formattedData)).unwrap();
        } catch (error) {
            toast.error(error.message || 'Ijarani yaratishda xatolik yuz berdi');
        }
    };

    return (
        <div className="container mx-auto py-10">
            <div className="mb-6">
                <Link href="/ijara" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Orqaga
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Yangi ijara</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label>Mijoz</label>
                                <Select
                                    onValueChange={(value) => handleSelectChange('customer', value)}
                                    value={rentalForm.customer}
                                >
                                    <SelectTrigger className={validationErrors.customer ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Mijozni tanlang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers.map(customer => (
                                            <SelectItem key={customer._id} value={customer._id}>
                                                {customer.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {validationErrors.customer && (
                                    <p className="text-sm text-red-500">{validationErrors.customer}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label>Mashina</label>
                                <Select
                                    onValueChange={(value) => handleSelectChange('car', value)}
                                    value={rentalForm.car}
                                    disabled={!cars || cars.length === 0}
                                >
                                    <SelectTrigger className={validationErrors.car ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Mashinani tanlang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.isArray(cars) && cars.map(car => (
                                            <SelectItem key={car._id} value={car._id}>
                                                {`${car.carNumber} - ${car.driverName}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {validationErrors.car && (
                                    <p className="text-sm text-red-500 mt-1">{validationErrors.car}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label>Boshlanish sanasi</label>
                                <Input
                                    type="date"
                                    name="startDate"
                                    value={rentalForm.startDate}
                                    onChange={handleInputChange}
                                    className={validationErrors.startDate ? 'border-red-500' : ''}
                                />
                                {validationErrors.startDate && (
                                    <p className="text-sm text-red-500">{validationErrors.startDate}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label>Tugash sanasi</label>
                                <Input
                                    type="date"
                                    name="endDate"
                                    value={rentalForm.endDate}
                                    onChange={handleInputChange}
                                    className={validationErrors.endDate ? 'border-red-500' : ''}
                                />
                                {validationErrors.endDate && (
                                    <p className="text-sm text-red-500">{validationErrors.endDate}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium">Mahsulotlar</h3>
                                <Button type="button" onClick={addProduct} variant="outline" size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Mahsulot qo'shish
                                </Button>
                            </div>

                            {rentalForm.borrowedProducts.map((product, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border p-4 rounded-lg">
                                    <div className="space-y-2">
                                        <label>Mahsulot</label>
                                        <Select
                                            onValueChange={(value) => handleProductChange(index, 'product', value)}
                                            value={product.product}
                                        >
                                            <SelectTrigger className={validationErrors[`borrowedProducts.${index}.product`] ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Mahsulotni tanlang" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map(p => (
                                                    <SelectItem key={p._id} value={p._id}>
                                                        {p.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {validationErrors[`borrowedProducts.${index}.product`] && (
                                            <p className="text-sm text-red-500">{validationErrors[`borrowedProducts.${index}.product`]}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label>Miqdori</label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={product.quantity}
                                            onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value))}
                                            className={validationErrors[`borrowedProducts.${index}.quantity`] ? 'border-red-500' : ''}
                                        />
                                        {validationErrors[`borrowedProducts.${index}.quantity`] && (
                                            <p className="text-sm text-red-500">{validationErrors[`borrowedProducts.${index}.quantity`]}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label>Boshlanish sanasi</label>
                                        <Input
                                            type="date"
                                            value={product.startDate}
                                            onChange={(e) => handleProductChange(index, 'startDate', e.target.value)}
                                            className={validationErrors[`borrowedProducts.${index}.startDate`] ? 'border-red-500' : ''}
                                        />
                                        {validationErrors[`borrowedProducts.${index}.startDate`] && (
                                            <p className="text-sm text-red-500">{validationErrors[`borrowedProducts.${index}.startDate`]}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label>Tugash sanasi</label>
                                        <Input
                                            type="date"
                                            value={product.endDate}
                                            onChange={(e) => handleProductChange(index, 'endDate', e.target.value)}
                                            className={validationErrors[`borrowedProducts.${index}.endDate`] ? 'border-red-500' : ''}
                                        />
                                        {validationErrors[`borrowedProducts.${index}.endDate`] && (
                                            <p className="text-sm text-red-500">{validationErrors[`borrowedProducts.${index}.endDate`]}</p>
                                        )}
                                    </div>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => removeProduct(index)}
                                        className="h-10 w-10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-4">
                            <Link href="/ijara">
                                <Button type="button" variant="outline">
                                    Bekor qilish
                                </Button>
                            </Link>
                            <Button type="submit" disabled={addStatus === 'loading'}>
                                {addStatus === 'loading' ? 'Saqlanmoqda...' : 'Saqlash'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
