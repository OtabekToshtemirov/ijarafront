'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { 
    createRental, 
    clearAddStatus 
} from '@/lib/features/rentals/rentalsSlice';
import { fetchCustomers, createCustomer } from '@/lib/features/customers/customerSlice';
import { fetchProducts } from '@/lib/features/products/productSlice';
import { fetchCars, createCar } from '@/lib/features/cars/carsSlice';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, Minus, Loader2, UserPlus, Car, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Textarea } from "@/components/ui/textarea";
import axios from 'axios';
import { API_URL } from '@/lib/config';

export default function AddRentalPage() {
    const dispatch = useDispatch();
    const router = useRouter();
    
    // Get customers, cars and products from Redux store
    const customers = useSelector((state) => state.customers.customers) || [];
    const cars = useSelector((state) => state.cars.cars) || [];
    const customersStatus = useSelector((state) => state.customers.status);
    const carsStatus = useSelector((state) => state.cars.status);
    const { products, status: productsStatus, error: productsError } = useSelector((state) => state.products);
    const addStatus = useSelector((state) => state.rentals.addStatus);
    const addError = useSelector((state) => state.rentals.error);

    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [carModalOpen, setCarModalOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        address: ''
    });
    const [newCar, setNewCar] = useState({
        carNumber: '',
        driverName: '',
        driverPhone: ''
    });

    const [rentalForm, setRentalForm] = useState({
        customer: '',
        car: '',
        startDate: new Date().toISOString().split('T')[0],
        workStartDate: new Date().toISOString().split('T')[0],
        prepaidAmount: 0,
        status: 'active',
        borrowedProducts: [{
            product: '',
            quantity: 1,
            dailyRate: 0,
            startDate: new Date().toISOString().split('T')[0],
            rentDate: new Date().toISOString().split('T')[0]
        }],
        totalCost: 0,
        debt: 0,
        description: ''
    });

    const [validationErrors, setValidationErrors] = useState({});
    const [productSearch, setProductSearch] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [carSearch, setCarSearch] = useState('');

    // Filter customers based on search
    const filteredCustomers = customers?.filter(customer => 
        customer.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(customerSearch.toLowerCase())
    ) || [];

    // Filter cars based on search
    const filteredCars = cars?.filter(car =>
        car.carNumber?.toLowerCase().includes(carSearch.toLowerCase()) ||
        car.driverName?.toLowerCase().includes(carSearch.toLowerCase())
    ) || [];

    // Filter products based on search
    const filteredProducts = products?.filter(product => 
        product.quantity > 0 && // Faqat mavjud miqdordagi mahsulotlarni ko'rsatish
        (!productSearch || 
        product.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.code?.toLowerCase().includes(productSearch.toLowerCase()))
    ) || [];

    // Calculate total amount
    useEffect(() => {
        const total = rentalForm.borrowedProducts.reduce((sum, item) => {
            return sum + (item.quantity * item.dailyRate);
        }, 0);
        setRentalForm(prev => ({
            ...prev,
            totalCost: total
        }));
    }, [rentalForm.borrowedProducts]);

    // State o'zgarishini kuzatish
    useEffect(() => {
        console.log('RentalForm updated:', rentalForm.borrowedProducts);
    }, [rentalForm.borrowedProducts]);

    // Handle product selection
    const handleProductSelect = async (product) => {
        try {
            if (rentalForm.borrowedProducts.some(item => item.product === product._id)) {
                setRentalForm(prev => ({
                    ...prev,
                    borrowedProducts: prev.borrowedProducts.filter(item => item.product !== product._id)
                }));
                return;
            }

            const newProduct = {
                product: product._id,
                quantity: 1,
                dailyRate: product.dailyRate
            };

            // Agar combo mahsulot bo'lsa, qismlarini qo'shamiz
            if (product.type === 'combo' && Array.isArray(product.parts)) {
                newProduct.parts = product.parts.map(part => ({
                    product: part.product._id,
                    quantity: part.quantity || 0,
                    dailyRate: part.product.dailyRate || 0
                }));
            }

            setRentalForm(prev => ({
                ...prev,
                borrowedProducts: [...prev.borrowedProducts, newProduct]
            }));

        } catch (error) {
            console.error('Mahsulot qo\'shishda xatolik:', error);
            toast.error('Mahsulot qo\'shishda xatolik yuz berdi');
        }
    };

    // Handle quantity change
    const handleQuantityChange = (productId, quantity) => {
        setRentalForm(prev => ({
            ...prev,
            borrowedProducts: prev.borrowedProducts.map(item => {
                if (item.product === productId) {
                    // Yangi miqdor
                    const newQuantity = parseInt(quantity) || 1;
                    
                    // Asosiy mahsulot ma'lumotlarini yangilash
                    const updatedItem = { ...item, quantity: newQuantity };
                    
                    // Agar combo mahsulot bo'lsa va qismlari bo'lsa
                    if (item.parts && Array.isArray(item.parts)) {
                        // Har bir qism uchun original nisbatni saqlagan holda yangi miqdorni hisoblaymiz
                        updatedItem.parts = item.parts.map(part => {
                            // Original nisbatni topish
                            const originalRatio = part.originalQuantity || part.quantity;
                            

                            return {
                                ...part,
                                originalQuantity: originalRatio, // Original nisbatni saqlash
                                quantity:  newQuantity // Yangi miqdorni hisoblash
                            };
                        });
                    }
                    
                    return updatedItem;
                }
                return item;
            })
        }));
    };

    // Handle part quantity change
    const [forceUpdate, setForceUpdate] = useState(0);

    const handlePartQuantityChange = (productIndex, partIndex, action, value) => {
        console.log('Params:', { productIndex, partIndex, action, value });
        
        setRentalForm(prev => {
            // Deep clone qilish
            const newForm = JSON.parse(JSON.stringify(prev));
            const product = newForm.borrowedProducts[productIndex];
            
            if (!product?.parts?.[partIndex]) {
                console.log('Product or part not found');
                return prev;
            }

            let newQuantity;
            const currentQuantity = parseInt(product.parts[partIndex].quantity) || 0;
            
            switch(action) {
                case 'decrease':
                    newQuantity = Math.max(0, currentQuantity - 1);
                    break;
                case 'increase':
                    newQuantity = currentQuantity + 1; // Cheklovni olib tashladik
                    break;
                default:
                    newQuantity = Math.max(0, parseInt(value) || 0); // Faqat 0 dan katta bo'lishi kerak
            }

            console.log('Current quantity:', currentQuantity);
            console.log('New quantity:', newQuantity);
            
            // To'g'ridan-to'g'ri qiymatni o'zgartirish
            product.parts[partIndex].quantity = newQuantity;
            
            // Force update
            setForceUpdate(prev => prev + 1);

            return newForm;
        });
    };

    // Handle daily rate change
    const handleDailyRateChange = (productId, rate) => {
        setRentalForm(prev => ({
            ...prev,
            borrowedProducts: prev.borrowedProducts.map(item => 
                item.product === productId 
                    ? { ...item, dailyRate: parseFloat(rate) || 0 }
                    : item
            )
        }));
    };

    // Handle product removal
    const handleRemoveProduct = (productId) => {
        setRentalForm(prev => ({
            ...prev,
            borrowedProducts: prev.borrowedProducts.filter(item => item.product !== productId)
        }));
    };

    useEffect(() => {
        // Fetch customers, cars and products on component mount
        if (customersStatus === 'idle') {
            dispatch(fetchCustomers());
        }
        if (carsStatus === 'idle') {
            dispatch(fetchCars());
        }
        if (productsStatus === 'idle') {
            dispatch(fetchProducts());
        }
        return () => {
            dispatch(clearAddStatus());
        };
    }, [dispatch, customersStatus, carsStatus, productsStatus]);

    useEffect(() => {
        if (addStatus === 'succeeded') {
            toast.success('Ijara muvaffaqiyatli yaratildi');
            router.push('/ijara');
        } else if (addStatus === 'failed' && addError) {
            toast.error(addError);
        }
    }, [addStatus, addError, router]);

    useEffect(() => {
        console.log('Products:', products);
        console.log('Filtered Products:', filteredProducts);
    }, [products, filteredProducts]);

    useEffect(() => {
        if (!rentalForm.description) {
            const comboDescription = rentalForm.borrowedProducts
                .filter((product) => products.find((p) => p._id === product.product)?.type === 'combo')
                .map((product) => {
                    const productDetails = products.find((p) => p._id === product.product);
                    const partsDescription = productDetails.parts
                        .map(part => `${part.product.name|| 'Noma\'lum qism'} x ${part.quantity}`)
                        .join(', ');
                    return `${productDetails.name} x ${product.quantity} (${partsDescription})`;
                })
                .join('\n');
            
            if (comboDescription) {
                setRentalForm(prev => ({
                    ...prev,
                    description: comboDescription
                }));
            }
        }
    }, [rentalForm.borrowedProducts, products]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Validatsiya
        const errors = {};
        if (!rentalForm.customer) errors.customer = "Mijozni tanlash majburiy";
        if (!rentalForm.car) errors.car = "Mashinani tanlash majburiy";
        if (rentalForm.borrowedProducts.length === 0) errors.products = "Kamida bitta mahsulot tanlash kerak";
        
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setIsSubmitting(false);
            toast.error("Iltimos, barcha majburiy maydonlarni to'ldiring");
            return;
        }

        try {
            await dispatch(createRental(rentalForm));
            toast.success("Ijara muvaffaqiyatli yaratildi");
            router.push('/ijara');
        } catch (error) {
            toast.error(error.message || "Xatolik yuz berdi");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddCustomer = async (e) => {

        try {
            if (!newCustomer.name || !newCustomer.phone) {
                toast.error("Iltimos, barcha maydonlarni to'ldiring");
                return;
            }

            const result = await dispatch(createCustomer(newCustomer)).unwrap();
            if (result) {
                toast.success("Mijoz muvaffaqiyatli qo'shildi");
                // Set the newly created customer as the selected customer
                setRentalForm(prev => ({
                    ...prev,
                    customer: result._id
                }));
                // Clear form and close modal
                setNewCustomer({ name: '', phone: '', address: '' });
                setCustomerModalOpen(false);
                // Refresh the customers list
                dispatch(fetchCustomers());
            }
        } catch (error) {
            console.error('Error adding customer:', error);
            toast.error(error.message || "Xatolik yuz berdi");
        }
    };

    const handleAddCar = async (e) => {
        
        try {
            if (!newCar.carNumber || !newCar.driverName || !newCar.driverPhone) {
                toast.error("Iltimos, barcha maydonlarni to'ldiring");
                return;
            }

            const result = await dispatch(createCar(newCar)).unwrap();
            if (result) {
                toast.success("Mashina muvaffaqiyatli qo'shildi");
                // Set the newly created car as the selected car
                setRentalForm(prev => ({
                    ...prev,
                    car: result._id
                }));
                // Clear form and close modal
                setNewCar({ carNumber: '', driverName: '', driverPhone: '' });
                setCarModalOpen(false);
                // Refresh the cars list
                dispatch(fetchCars());
            }
        } catch (error) {
            console.error('Error adding car:', error);
            toast.error(error.message || "Xatolik yuz berdi");
        }
    };

    return (    
        <div className="container mx-auto py-10">
            {/* Customer Modal */}
            <Dialog open={customerModalOpen} onOpenChange={setCustomerModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Янги мижоз қўшиш</DialogTitle>
                        <DialogDescription>
                        Янги мижоз маълумотларини киритинг
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddCustomer}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="customerName" className="text-right">
                                Исм
                                </Label>
                                <Input
                                    id="customerName"
                                    value={newCustomer.name}
                                    onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="customerPhone" className="text-right">
                                    Телефон
                                </Label>
                                <Input
                                    id="customerPhone"
                                    value={newCustomer.phone}
                                    onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="customerAddress" className="text-right">
                                    Манзил
                                </Label>
                                <Input
                                    id="customerAddress"
                                    value={newCustomer.address}
                                    onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Сақлаш</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Car Modal */}
            <Dialog open={carModalOpen} onOpenChange={setCarModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Янги транспорт қўшиш</DialogTitle>
                        <DialogDescription>
                        Янги транспорт маълумотларини киритинг
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddCar}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="carNumber" className="text-right">
                                Транспорт рақами
                                </Label>
                                <Input
                                    id="carNumber"
                                    value={newCar.carNumber}
                                    onChange={(e) => setNewCar(prev => ({ ...prev, carNumber: e.target.value }))}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="driverName" className="text-right">
                                Ҳайдовчи
                                </Label>
                                <Input
                                    id="driverName"
                                    value={newCar.driverName}
                                    onChange={(e) => setNewCar(prev => ({ ...prev, driverName: e.target.value }))}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="driverPhone" className="text-right">
                                Ҳайдовчи телефон
                                </Label>
                                <Input
                                    id="driverPhone"
                                    value={newCar.driverPhone}
                                    onChange={(e) => setNewCar(prev => ({ ...prev, driverPhone: e.target.value }))}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Saqlash</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="mb-6">
                <Link href="/ijara" className="flex w-20 items-center text-sm text-muted-foreground hover:text-primary">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Орқага
                </Link>
            </div>

            <Card>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Mijoz formasi */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label>Янги мижоз</label>
                                </div>
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="customerName" className="text-right">
                                            Исм
                                        </Label>
                                        <Input
                                            id="customerName"
                                            value={newCustomer.name}
                                            onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="customerPhone" className="text-right">
                                            Телефон
                                        </Label>
                                        <Input
                                            id="customerPhone"
                                            value={newCustomer.phone}
                                            onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="customerAddress" className="text-right">
                                            Манзил
                                        </Label>
                                        <Input
                                            id="customerAddress"
                                            value={newCustomer.address}
                                            onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                                            className="col-span-3"
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    onClick={() => handleAddCustomer()}
                                    className="w-full"
                                >
                                    Сақлаш
                                </Button>

                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">
                                            Ёки мавжуд мижозни танланг
                                        </span>
                                    </div>
                                </div>

                                <Select
                                    value={rentalForm.customer}
                                    onValueChange={(value) => {
                                        setRentalForm(prev => ({
                                            ...prev,
                                            customer: value
                                        }));
                                    }}
                                >
                                    <SelectTrigger className={validationErrors.customer ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Мижозни танланг" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="px-3 pb-2">
                                            <Input
                                                type="text"
                                                placeholder="Мижозни қидириш..."
                                                value={customerSearch}
                                                onChange={(e) => setCustomerSearch(e.target.value)}
                                            />
                                        </div>
                                        {filteredCustomers.length > 0 ? (
                                            filteredCustomers.map((customer) => (
                                                <SelectItem key={customer._id} value={customer._id}>
                                                    {customer.name} - {customer.phone}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                                Мижоз топилмади
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Mashina formasi */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label>Янги транспорт</label>
                                </div>
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="carNumber" className="text-right">
                                            Рақами
                                        </Label>
                                        <Input
                                            id="carNumber"
                                            value={newCar.carNumber}
                                            onChange={(e) => setNewCar(prev => ({ ...prev, carNumber: e.target.value }))}
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="driverName" className="text-right">
                                            Ҳайдовчи
                                        </Label>
                                        <Input
                                            id="driverName"
                                            value={newCar.driverName}
                                            onChange={(e) => setNewCar(prev => ({ ...prev, driverName: e.target.value }))}
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="driverPhone" className="text-right">
                                            Телефон
                                        </Label>
                                        <Input
                                            id="driverPhone"
                                            value={newCar.driverPhone}
                                            onChange={(e) => setNewCar(prev => ({ ...prev, driverPhone: e.target.value }))}
                                            className="col-span-3"
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    onClick={() => handleAddCar()}
                                    className="w-full"
                                >
                                    Сақлаш
                                </Button>

                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">
                                            Ёки мавжуд транспортни танланг
                                        </span>
                                    </div>
                                </div>

                                <Select
                                    onValueChange={(value) => {
                                        setRentalForm(prev => ({
                                            ...prev,
                                            car: value
                                        }));
                                    }}
                                    value={rentalForm.car}
                                >
                                    <SelectTrigger className={validationErrors.car ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Транспортни танланг" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="px-3 pb-2">
                                            <Input
                                                type="text"
                                                placeholder="Транспортни қидириш..."
                                                value={carSearch}
                                                onChange={(e) => setCarSearch(e.target.value)}
                                            />
                                        </div>
                                        {filteredCars.length > 0 ? (
                                            filteredCars.map(car => (
                                                <SelectItem key={car._id} value={car._id}>
                                                    {`${car.carNumber} - ${car.driverName}`}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                                Транспорт топилмади
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-4 py-3">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="workStartDate" className="text-right">
                                    Иш бошлаш санаси
                                </label>
                                <Input
                                    id="workStartDate"
                                    type="date"
                                    value={rentalForm.workStartDate}
                                    className="col-span-3"
                                    onChange={(e) => {
                                        setRentalForm(prev => ({
                                            ...prev,
                                            workStartDate: e.target.value
                                        }));
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label>Олдиндан тўлов</label>
                            <Input
                                type="number"
                                name="prepaidAmount"
                                value={rentalForm.prepaidAmount}
                                onChange={(e) => {
                                    setRentalForm(prev => ({
                                        ...prev,
                                        prepaidAmount: e.target.value
                                    }));
                                }}
                                min="0"
                                placeholder="Олдиндан тўлов"
                            />
                        </div>
                        

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium">Мулклар</h3>
                                <Button type="button" variant="outline" size="sm" onClick={() => {
                                    setRentalForm(prev => ({
                                        ...prev,
                                        borrowedProducts: [
                                            ...prev.borrowedProducts,
                                            {
                                                product: '',
                                                quantity: 1,
                                                dailyRate: 0,
                                                startDate: new Date().toISOString().split('T')[0],
                                                rentDate: new Date().toISOString().split('T')[0]
                                            }
                                        ]
                                    }));
                                }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Мулклар қўшиш
                                </Button>
                            </div>

                            {/* Products Section */}
                            <div className="space-y-4 mt-4">
                               

                                {/* Selected Products */}
                                <div className="space-y-2">
                                    {rentalForm.borrowedProducts.map((product, index) => (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                                            <div className="space-y-2">
                                                <label>Мулклар</label>
                                                <Select
                                                    value={product.product}
                                                    onValueChange={(value) => {
                                                        const selectedProduct = products.find(p => p._id === value);
                                                        setRentalForm(prev => ({
                                                            ...prev,
                                                            borrowedProducts: prev.borrowedProducts.map((item, i) => 
                                                                i === index ? { 
                                                                    ...item, 
                                                                    product: value,
                                                                    dailyRate: selectedProduct?.dailyRate || selectedProduct?.price || 0,
                                                                    parts: selectedProduct?.type === 'combo' ? 
                                                                        selectedProduct.parts?.map(part => ({
                                                                            ...part,
                                                                            quantity: part.quantity
                                                                        })) : []
                                                                } : item
                                                            )
                                                        }));
                                                    }}
                                                >
                                                    <SelectTrigger className={validationErrors[`borrowedProducts.${index}.product`] ? 'border-red-500' : ''}>
                                                        <SelectValue placeholder="Мулкни танланг">
                                                            {product.product ? products.find(p => p._id === product.product)?.name : "Мулкни танланг"}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <div className="px-3 pb-2">
                                                            <Input
                                                                type="text"
                                                                placeholder="Мулкни қидириш..."
                                                                value={productSearch}
                                                                onChange={(e) => setProductSearch(e.target.value)}
                                                            />
                                                        </div>
                                                        {filteredProducts.length > 0 ? (
                                                            filteredProducts.map((product) => (
                                                                <SelectItem key={product._id} value={product._id}>
                                                                    {product.name} - {product.quantity-product.rented} dona
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                                                Mahsulot topilmadi
                                                            </div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                {validationErrors[`borrowedProducts.${index}.product`] && (
                                                    <p className="text-sm text-red-500">{validationErrors[`borrowedProducts.${index}.product`]}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <label>Miqdor</label>
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => {
                                                            setRentalForm(prev => ({
                                                                ...prev,
                                                                borrowedProducts: prev.borrowedProducts.map((item, i) => 
                                                                    i === index ? { 
                                                                        ...item, 
                                                                        quantity: Math.max(1, (item.quantity || 1) - 1),
                                                                        parts: item.parts?.map(part => ({
                                                                            ...part,
                                                                            quantity: part.quantity * Math.max(1, (item.quantity || 1) - 1)
                                                                        }))
                                                                    } : item
                                                                )
                                                            }));
                                                        }}
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <Input
                                                        type="number"
                                                        name="quantity"
                                                        value={product.quantity}
                                                        onChange={(e) => {
                                                            const newQuantity = parseInt(e.target.value) || 1;
                                                            setRentalForm(prev => ({
                                                                ...prev,
                                                                borrowedProducts: prev.borrowedProducts.map((item, i) => 
                                                                    i === index ? { 
                                                                        ...item, 
                                                                        quantity: newQuantity,
                                                                        parts: item.parts?.map(part => ({
                                                                            ...part,
                                                                            quantity: part.quantity * newQuantity
                                                                        }))
                                                                    } : item
                                                                )
                                                            }));
                                                        }}
                                                        min="1"
                                                        placeholder="Миқдор"
                                                        className="w-20 text-center"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => {
                                                            setRentalForm(prev => ({
                                                                ...prev,
                                                                borrowedProducts: prev.borrowedProducts.map((item, i) => 
                                                                    i === index ? { 
                                                                        ...item, 
                                                                        quantity: (item.quantity || 1) + 1,
                                                                        parts: item.parts?.map(part => ({
                                                                            ...part,
                                                                            quantity: part.quantity * ((item.quantity || 1) + 1)
                                                                        }))
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
                                                <label>Кунлик нарх</label>
                                                <Input
                                                    type="number"
                                                    name="dailyRate"
                                                    value={product.dailyRate}
                                                    onChange={(e) => {
                                                        setRentalForm(prev => ({
                                                            ...prev,
                                                            borrowedProducts: prev.borrowedProducts.map((item, i) => 
                                                                i === index ? { ...item, dailyRate: parseFloat(e.target.value) || 0 } : item
                                                            )
                                                        }));
                                                    }}
                                                    min="0"
                                                    placeholder="Кунлик нарх"
                                                />
                                                {validationErrors[`borrowedProducts.${index}.dailyRate`] && (
                                                    <p className="text-sm text-red-500">{validationErrors[`borrowedProducts.${index}.dailyRate`]}</p>
                                                )}
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setRentalForm(prev => ({
                                                            ...prev,
                                                            borrowedProducts: prev.borrowedProducts.filter((_, i) => i !== index)
                                                        }));
                                                    }}
                                                    disabled={rentalForm.borrowedProducts.length === 1}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            
                                            {/* Combo mahsulot qismlari */}
                                            {products.find(p => p._id === product.product)?.type === 'combo' && (
                                                <div className="col-span-4 ml-8 space-y-4 mt-2 border-l-2 border-blue-200 pl-4">
                                                    <p className="text-sm font-medium text-gray-500">Қисмлар:</p>
                                                    {products.find(p => p._id === product.product)?.parts?.map((part, partIndex) => {
                                                        const partProduct = products.find(p => p._id === part.product._id);
                                                        const maxQuantity = part.quantity * product.quantity;
                                                        return (
                                                            <div key={partIndex} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-2 bg-gray-50 rounded-lg">
                                                                <div>
                                                                    <span className="text-sm text-gray-600">{partProduct?.name || 'Noma\'lum qism'}</span>

                                                                </div>
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center space-x-2">
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="icon"
                                                                            onClick={() => handlePartQuantityChange(index, partIndex, 'decrease')}
                                                                        >
                                                                            <Minus className="h-4 w-4" />
                                                                        </Button>
                                                                        <Input
                                                                            key={`part-quantity-${index}-${partIndex}-${forceUpdate}`}
                                                                            type="number"
                                                                            value={rentalForm.borrowedProducts[index]?.parts?.[partIndex]?.quantity || 0}
                                                                            onChange={(e) => handlePartQuantityChange(index, partIndex, 'input', e.target.value)}
                                                                            min="0"
                                                                            className="w-20 text-center"
                                                                        />
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="icon"
                                                                            onClick={() => handlePartQuantityChange(index, partIndex, 'increase')}
                                                                        >
                                                                            <Plus className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                    <span className="text-xs text-gray-500">
                                                                        Максимум: {maxQuantity} дона
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-sm text-gray-600">
                                                                        Кунлик нарх: {part.dailyRate?.toLocaleString()} сўм
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {products.product && products.find(p => p._id === product.product)?.type === 'combo' && (
                                               <div className="ml-8 space-y-4 mt-2 border-l-2 border-blue-200 pl-4">
                                                <p className="text-sm font-medium text-gray-500">Қисмлар:</p>
                                                {products.find(p => p._id === product.product)?.parts?.map((part, partIndex) => {
                                                    const partProduct = products.find(p => p._id === part.product._id);
                                                    return (
                                                        <div key={partIndex} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-2 bg-gray-50 rounded-lg">
                                                            <div>
                                                                <span className="text-sm text-gray-600">{partProduct?.name}</span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center space-x-2">
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="icon"
                                                                        onClick={() => handlePartQuantityChange(index, partIndex, 'decrease')}
                                                                    >
                                                                        <Minus className="h-4 w-4" />
                                                                    </Button>
                                                                    <Input
                                                                        key={`part-quantity-${index}-${partIndex}-${forceUpdate}`}
                                                                        type="number"
                                                                        value={rentalForm.borrowedProducts[index].parts?.[partIndex]?.quantity || 0}
                                                                        onChange={(e) => handlePartQuantityChange(index, partIndex, 'input', e.target.value)}
                                                                        min="0"
                                                                        className="w-20 text-center"
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="icon"
                                                                        onClick={() => handlePartQuantityChange(index, partIndex, 'increase')}
                                                                    >
                                                                        <Plus className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                                <span className="text-xs text-gray-500">
                                                                    Максимум: {part.quantity * rentalForm.borrowedProducts[index].quantity} дона
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-sm text-gray-600">
                                                                    Кунлик нарх: {part.dailyRate?.toLocaleString()} сўм
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                           
                                        )}
                                </div>

                              
                                </div>
                            </div>

                            {/* Total Amount */}
                            <div className="mt-4 p-4 bg-secondary rounded-lg">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-medium">Умумий сумма:</h3>
                                    <p className="text-xl font-bold">{rentalForm.totalCost.toLocaleString()} сўм</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                

                                <Label htmlFor="description">Қўшимча изоҳ</Label>
                                <Textarea
                                    id="description"
                                    value={rentalForm.description || ''}
                                    onChange={(e) => {
                                        const newDescription = e.target.value;
                                        setRentalForm(prev => ({
                                            ...prev,
                                            description: newDescription
                                        }));
                                    }}
                                    placeholder="Ижара ҳақида қўшимча маълумотлар..."
                                    className="mt-1"
                                />
                            </div>

                            <div className="flex justify-end mt-4">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Сақланмоқда...
                                        </>
                                    ) : (
                                        'Сақлаш'
                                    )}
                                </Button>
                            </div>
                       
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
