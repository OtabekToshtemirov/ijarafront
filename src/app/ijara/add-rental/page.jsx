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
import { ArrowLeft, Plus, Trash2, Minus, Loader2 } from 'lucide-react';
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
        prepaidAmount: 0,
        status: 'active',
        borrowedProducts: [{
            product: '',
            quantity: 1,
            dailyRate: 0,
            amount: 0,
            startDate: new Date().toISOString().split('T')[0]
        }],
        totalCost: 0,
        debt: 0
    });

    const [validationErrors, setValidationErrors] = useState({});

    const [productSearch, setProductSearch] = useState('');

    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.code?.toLowerCase().includes(productSearch.toLowerCase())
    );

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
            errors.customer = 'Iltimos, mijozni tanlang';
        }

        if (!rentalForm.startDate) {
            errors.startDate = 'Iltimos, boshlanish sanasini kiriting';
        }

        if (!rentalForm.borrowedProducts || rentalForm.borrowedProducts.length === 0) {
            errors.borrowedProducts = 'Kamida bitta mahsulot tanlash kerak';
        }

        rentalForm.borrowedProducts.forEach((product, index) => {
            if (!product.product) {
                errors[`borrowedProducts.${index}.product`] = 'Mahsulotni tanlang';
            }
            if (!product.quantity || product.quantity < 1) {
                errors[`borrowedProducts.${index}.quantity`] = 'Miqdor 1 dan kam bo\'lmasligi kerak';
            }
            if (!product.dailyRate || product.dailyRate < 0) {
                errors[`borrowedProducts.${index}.dailyRate`] = 'Kunlik narx 0 dan kam bo\'lmasligi kerak';
            }

            const selectedProduct = products.find(p => p._id === product.product);
            if (selectedProduct && product.quantity > selectedProduct.quantity) {
                errors[`borrowedProducts.${index}.quantity`] = 
                    `Omborda ${selectedProduct.name} mahsulotidan ${selectedProduct.quantity} ta mavjud`;
            }
        });

        if (rentalForm.prepaidAmount && rentalForm.prepaidAmount < 0) {
            errors.prepaidAmount = 'Oldindan to\'lov 0 dan kam bo\'lmasligi kerak';
        }

        setValidationErrors(errors);
        
        if (Object.keys(errors).length > 0) {
            const errorMessages = Object.values(errors);
            toast.error(
                <div>
                    <p>Quyidagi xatoliklarni to'g'rilang:</p>
                    <ul>
                        {errorMessages.map((error, index) => (
                            <li key={index}>• {error}</li>
                        ))}
                    </ul>
                </div>
            );
            return false;
        }
        
        return true;
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

        const errorKey = `borrowedProducts.${index}.${field}`;
        if (validationErrors[errorKey]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[errorKey];
                return newErrors;
            });
        }
    };

    const addProduct = (product, quantity, dailyRate) => {
        const amount = Number(quantity) * Number(dailyRate);
        setRentalForm(prev => ({
            ...prev,
            borrowedProducts: [
                ...prev.borrowedProducts,
                {
                    product,
                    quantity: Number(quantity),
                    dailyRate: Number(dailyRate),
                    amount
                }
            ]
        }));
    };

    const handleAddProduct = (product) => {
        if (!product) return;

        const existingProduct = rentalForm.borrowedProducts.find(
            (p) => p.product === product._id
        );

        if (existingProduct) {
            toast({
                title: "Xatolik!",
                description: "Bu mahsulot allaqachon qo'shilgan!",
                variant: "destructive",
            });
            return;
        }

        const amount = product.dailyRate || 0;
        
        setRentalForm(prev => ({
            ...prev,
            borrowedProducts: [
                ...prev.borrowedProducts,
                {
                    product: product._id,
                    quantity: 1,
                    dailyRate: amount,
                    amount: amount,
                    startDate: new Date().toISOString().split('T')[0]
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

        if (!rentalForm.customer) {
            toast.error("Iltimos mijozni tanlang!");
            return;
        }

        if (rentalForm.borrowedProducts.length === 0) {
            toast.error("Iltimos kamida bitta mahsulot qo'shing!");
            return;
        }

        // Calculate total cost
        const totalCost = rentalForm.borrowedProducts.reduce((sum, product) => {
            return sum + (product.quantity * product.amount);
        }, 0);

        // Format the data for the API
        const formData = {
            ...rentalForm,
            totalCost,
            startDate: new Date().toISOString(),
            borrowedProducts: rentalForm.borrowedProducts.map(product => ({
                product: product.product,
                quantity: Number(product.quantity),
                amount: Number(product.amount),
                dailyRate: Number(product.amount),
                startDate: new Date().toISOString()
            }))
        };

        try {
            const response = await dispatch(createRental(formData)).unwrap();
            
            if (response._id) {
                toast.success("Ijara muvaffaqiyatli qo'shildi!");
                router.push('/ijara');
            }
        } catch (error) {
            toast.error(error.message || "Xatolik yuz berdi!");
        }
    };

    const handleAmountChange = (index, value) => {
        const newAmount = parseInt(value) || 0;
        
        setRentalForm(prev => ({
            ...prev,
            borrowedProducts: prev.borrowedProducts.map((item, i) => 
                i === index ? { ...item, amount: newAmount, dailyRate: newAmount } : item
            )
        }));
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
                                    <p className="text-sm text-red-500">{validationErrors.car}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label>Ish boshlash sanasi</label>
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
                                <label>Oldindan to'lov</label>
                                <Input
                                    type="number"
                                    name="prepaidAmount"
                                    value={rentalForm.prepaidAmount}
                                    onChange={handleInputChange}
                                    min="0"
                                    placeholder="Oldindan to'lov summasi"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium">Mahsulotlar</h3>
                                <Button type="button" variant="outline" size="sm" onClick={() => {
                                    setRentalForm(prev => ({
                                        ...prev,
                                        borrowedProducts: [
                                            ...prev.borrowedProducts,
                                            {
                                                product: '',
                                                quantity: 1,
                                                dailyRate: 0,
                                                amount: 0
                                            }
                                        ]
                                    }));
                                }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Mahsulot qo'shish
                                </Button>
                            </div>

                            {rentalForm.borrowedProducts.map((product, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                                    <div className="space-y-2">
                                        <label>Mahsulot</label>
                                        <Select
                                            value={product.product}
                                            onValueChange={(value) => {
                                                const selectedProduct = products.find(p => p._id === value);
                                                if (selectedProduct) {
                                                    setRentalForm(prev => ({
                                                        ...prev,
                                                        borrowedProducts: prev.borrowedProducts.map((item, i) => 
                                                            i === index ? {
                                                                ...item,
                                                                product: value,
                                                                productName: selectedProduct.name,
                                                                dailyRate: selectedProduct.dailyRate,
                                                                amount: item.quantity * selectedProduct.dailyRate
                                                            } : item
                                                        )
                                                    }));
                                                }
                                            }}
                                        >
                                            <SelectTrigger className={validationErrors[`borrowedProducts.${index}.product`] ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Mahsulotni tanlang" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <div className="p-2">
                                                    <Input
                                                        type="text"
                                                        placeholder="Mahsulot qidirish..."
                                                        value={productSearch}
                                                        onChange={(e) => setProductSearch(e.target.value)}
                                                        className="mb-2"
                                                    />
                                                </div>
                                                <div className="max-h-[200px] overflow-y-auto">
                                                    {filteredProducts.map((p) => (
                                                        <SelectItem 
                                                            key={p._id} 
                                                            value={p._id}
                                                            disabled={!p.isAvailable || p.quantity < 1}
                                                        >
                                                            <div className="flex justify-between items-center w-full">
                                                                <span>{p.name}</span>
                                                                <span className="text-sm text-muted-foreground">
                                                                    {p.quantity} dona
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                    {filteredProducts.length === 0 && (
                                                        <div className="p-2 text-center text-muted-foreground">
                                                            Mahsulot topilmadi
                                                        </div>
                                                    )}
                                                </div>
                                            </SelectContent>
                                        </Select>
                                        {validationErrors[`borrowedProducts.${index}.product`] && (
                                            <p className="text-sm text-red-500">{validationErrors[`borrowedProducts.${index}.product`]}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label>Miqdori</label>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => {
                                                    const quantity = Math.max(1, product.quantity - 1);
                                                    setRentalForm(prev => ({
                                                        ...prev,
                                                        borrowedProducts: prev.borrowedProducts.map((item, i) => 
                                                            i === index ? {
                                                                ...item,
                                                                quantity,
                                                                amount: quantity * item.dailyRate
                                                            } : item
                                                        )
                                                    }));
                                                }}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <Input
                                                type="number"
                                                value={product.quantity}
                                                onChange={(e) => {
                                                    const quantity = Math.max(1, parseInt(e.target.value) || 0);
                                                    setRentalForm(prev => ({
                                                        ...prev,
                                                        borrowedProducts: prev.borrowedProducts.map((item, i) => 
                                                            i === index ? {
                                                                ...item,
                                                                quantity,
                                                                amount: quantity * item.dailyRate
                                                            } : item
                                                        )
                                                    }));
                                                }}
                                                min="1"
                                                className={validationErrors[`borrowedProducts.${index}.quantity`] ? 'border-red-500' : ''}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => {
                                                    const selectedProduct = products.find(p => p._id === product.product);
                                                    const maxQuantity = selectedProduct ? selectedProduct.quantity : 999;
                                                    const quantity = Math.min(maxQuantity, product.quantity + 1);
                                                    setRentalForm(prev => ({
                                                        ...prev,
                                                        borrowedProducts: prev.borrowedProducts.map((item, i) => 
                                                            i === index ? {
                                                                ...item,
                                                                quantity,
                                                                amount: quantity * item.dailyRate
                                                            } : item
                                                        )
                                                    }));
                                                }}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        {validationErrors[`borrowedProducts.${index}.quantity`] && (
                                            <p className="text-sm text-red-500">{validationErrors[`borrowedProducts.${index}.quantity`]}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label>Kunlik narx</label>
                                        <Input
                                            type="number"
                                            value={product.dailyRate}
                                            onChange={(e) => {
                                                const dailyRate = Number(e.target.value);
                                                setRentalForm(prev => ({
                                                    ...prev,
                                                    borrowedProducts: prev.borrowedProducts.map((item, i) => 
                                                        i === index ? {
                                                            ...item,
                                                            dailyRate,
                                                            amount: item.quantity * dailyRate
                                                        } : item
                                                    )
                                                }));
                                            }}
                                            min="0"
                                            className={validationErrors[`borrowedProducts.${index}.dailyRate`] ? 'border-red-500' : ''}
                                        />
                                        {validationErrors[`borrowedProducts.${index}.dailyRate`] && (
                                            <p className="text-sm text-red-500">{validationErrors[`borrowedProducts.${index}.dailyRate`]}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between space-x-4">
                                        <div className="space-y-2 flex-1">
                                            <label>Summa</label>
                                            <Input
                                                type="number"
                                                value={product.amount}
                                                onChange={(e) => handleAmountChange(index, e.target.value)}
                                                className="w-24"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="self-end"
                                            onClick={() => {
                                                setRentalForm(prev => ({
                                                    ...prev,
                                                    borrowedProducts: prev.borrowedProducts.filter((_, i) => i !== index)
                                                }));
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {rentalForm.borrowedProducts.length > 0 && (
                                <div className="flex justify-end pt-2 border-t">
                                    <span className="font-medium">
                                        Jami: {rentalForm.borrowedProducts.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString()} so'm
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={addStatus === 'loading'}>
                                {addStatus === 'loading' ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saqlanmoqda...
                                    </>
                                ) : (
                                    'Saqlash'
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
