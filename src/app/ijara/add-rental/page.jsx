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
        product.quantity > 0 && // Only show products with available quantity
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

    // Handle product selection
    const handleProductSelect = (product) => {
        if (!rentalForm.borrowedProducts.find(p => p.product === product._id)) {
            setRentalForm(prev => ({
                ...prev,
                borrowedProducts: [
                    ...prev.borrowedProducts,
                    {
                        product: product._id,
                        quantity: 1,
                        dailyRate: product.dailyRate || product.price || 0,
                        startDate: rentalForm.startDate,
                        rentDate: new Date().toISOString().split('T')[0]
                    }
                ]
            }));
        }
    };

    // Handle quantity change
    const handleQuantityChange = (productId, quantity) => {
        setRentalForm(prev => ({
            ...prev,
            borrowedProducts: prev.borrowedProducts.map(item => 
                item.product === productId 
                    ? { ...item, quantity: parseInt(quantity) || 1 }
                    : item
            )
        }));
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

    const validateForm = () => {
        const errors = {};
        
        if (!rentalForm.customer) {
            errors.customer = 'Iltimos, mijozni tanlang';
        }

        if (!rentalForm.workStartDate) {
            errors.workStartDate = 'Iltimos, ish boshlash sanasini kiriting';
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
        });

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const totalCost = rentalForm.borrowedProducts.reduce((sum, product) => {
            return sum + (Number(product.quantity) * Number(product.dailyRate || 0));
        }, 0);

        const formData = {
            customer: rentalForm.customer,
            ...(rentalForm.car && { car: rentalForm.car }),
            borrowedProducts: rentalForm.borrowedProducts.map(product => ({
                product: product.product,
                quantity: Number(product.quantity),
                dailyRate: Number(product.dailyRate || 0),
                startDate: product.startDate
            })),
            workStartDate: rentalForm.workStartDate,
            totalCost: totalCost,
            debt: totalCost,
            prepaidAmount: Number(rentalForm.prepaidAmount || 0),
            description: rentalForm.description
        };

        try {
            const response = await dispatch(createRental(formData)).unwrap();
            generatePDF(response, customers.find(customer => customer._id === rentalForm.customer));
            toast.success('Ijara muvaffaqiyatli yaratildi');
            router.push('/ijara');
        } catch (error) {
            toast.error(error.message || 'Xatolik yuz berdi');
        }
    };

    const handleAddCustomer = async (e) => {
        e.preventDefault();
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
        e.preventDefault();
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

    const generatePDF = (rental, customer) => {
        // 80mm = 226.772 points in PDF
        const width = 226.772;
        const height = 400; // Uzunlikni kontentga qarab avtomatik sozlanadi
        
        const doc = new jsPDF({
            unit: 'pt',
            format: [width, height],
            orientation: 'portrait'
        });

        // Sahifa kengligi
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        
        // Shrift o'lchamlarini kichikroq qilish
        doc.setFontSize(12);
        doc.text("IJARA SHARTNOMASI", pageWidth / 2, margin, { align: "center" });
        
        let yPos = margin + 20;
        
        // Asosiy ma'lumotlar
        doc.setFontSize(8);
        doc.text(`№ ${rental.rentalNumber}`, margin, yPos);
        doc.text(`Sana: ${new Date().toLocaleDateString()}`, margin, yPos + 10);
        
        yPos += 30;
        
        // Mijoz ma'lumotlari
        doc.text("MIJOZ MA'LUMOTLARI:", margin, yPos);
        yPos += 12;
        doc.text(`Ism: ${customer.name}`, margin, yPos);
        yPos += 10;
        doc.text(`Tel: ${customer.phone}`, margin, yPos);
        yPos += 10;
        doc.text(`Manzil: ${customer.address}`, margin, yPos);
        
        yPos += 20;
        
        // Ijara ma'lumotlari
        doc.text("IJARA MA'LUMOTLARI:", margin, yPos);
        yPos += 12;
        doc.text(`Boshlanish: ${new Date(rentalForm.workStartDate).toLocaleDateString()}`, margin, yPos);
        yPos += 10;
        doc.text(`Oldindan to'lov: ${rentalForm.prepaidAmount?.toLocaleString()} so'm`, margin, yPos);
        yPos += 10;
        doc.text(`Umumiy narx: ${rentalForm.totalCost?.toLocaleString()} so'm`, margin, yPos);
        
        yPos += 20;
        
        // Mahsulotlar jadvali
        const tableData = rentalForm.borrowedProducts.map(product => [
            products.find(p => p._id === product.product).name,
            product.quantity.toString(),
            `${product.dailyRate?.toLocaleString()}`,
            `${(product.quantity * product.dailyRate)?.toLocaleString()}`
        ]);
        
        doc.autoTable({
            startY: yPos,
            head: [['Mahsulot', 'Soni', 'Narx', 'Jami']],
            body: tableData,
            theme: 'plain',
            styles: { 
                fontSize: 8,
                cellPadding: 3,
                overflow: 'linebreak',
                cellWidth: 'wrap'
            },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { cellWidth: 30 },
                2: { cellWidth: 40 },
                3: { cellWidth: 40 }
            },
            margin: { left: margin, right: margin },
            tableWidth: contentWidth
        });
        
        // Izoh qo'shish
        if (rentalForm.description) {
            yPos = doc.previousAutoTable.finalY + 10;
            doc.text("Izoh:", margin, yPos);
            doc.text(rentalForm.description, margin, yPos + 10, {
                maxWidth: contentWidth,
                lineHeightFactor: 1.2
            });
        }

        // Chop etish
        doc.autoPrint();
        doc.output('dataurlnewwindow');
    };

    return (
        <div className="container mx-auto py-10">
            {/* Customer Modal */}
            <Dialog open={customerModalOpen} onOpenChange={setCustomerModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yangi mijoz qo'shish</DialogTitle>
                        <DialogDescription>
                            Yangi mijoz ma'lumotlarini kiriting
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddCustomer}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="customerName" className="text-right">
                                    Ism
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
                                    Telefon
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
                                    Manzil
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
                            <Button type="submit">Saqlash</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Car Modal */}
            <Dialog open={carModalOpen} onOpenChange={setCarModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yangi mashina qo'shish</DialogTitle>
                        <DialogDescription>
                            Yangi mashina ma'lumotlarini kiriting
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddCar}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="carNumber" className="text-right">
                                    Mashina raqami
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
                                    Haydovchi
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
                                    Telefon
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
                                <div className="flex justify-between items-center">
                                    <label>Mijoz</label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="flex items-center text-sm text-muted-foreground hover:text-primary"
                                        onClick={() => setCustomerModalOpen(true)}
                                    >
                                        <UserPlus className="h-4 w-4 mr-1" />
                                        Yangi mijoz
                                    </Button>
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
                                        <SelectValue placeholder="Mijozni tanlang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="px-3 pb-2">
                                            <Input
                                                type="text"
                                                placeholder="Mijozni qidirish..."
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
                                                Mijoz topilmadi
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                                {validationErrors.customer && (
                                    <p className="text-sm text-red-500">{validationErrors.customer}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label>Mashina</label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="flex items-center text-sm text-muted-foreground hover:text-primary"
                                        onClick={() => setCarModalOpen(true)}
                                    >
                                        <Car className="h-4 w-4 mr-1" />
                                        Yangi mashina
                                    </Button>
                                </div>
                                <Select
                                    onValueChange={(value) => {
                                        setRentalForm(prev => ({
                                            ...prev,
                                            car: value
                                        }));
                                    }}
                                    value={rentalForm.car}
                                    disabled={!cars || cars.length === 0}
                                >
                                    <SelectTrigger className={validationErrors.car ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Mashinani tanlang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className="px-3 pb-2">
                                            <Input
                                                type="text"
                                                placeholder="Mashinani qidirish..."
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
                                                Mashina topilmadi
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                                {validationErrors.car && (
                                    <p className="text-sm text-red-500">{validationErrors.car}</p>
                                )}
                            </div>

                            <div className="grid gap-4 py-3">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <label htmlFor="workStartDate" className="text-right">
                                        Ish boshlanish sanasi
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
                                <label>Oldindan to'lov</label>
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
                                    placeholder="Oldindan to'lov summasi"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium">Mulklar</h3>
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
                                    Mulklar qo'shish
                                </Button>
                            </div>

                            {/* Products Section */}
                            <div className="space-y-4 mt-4">
                               

                                {/* Selected Products */}
                                <div className="space-y-2">
                                    {rentalForm.borrowedProducts.map((product, index) => (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                                            <div className="space-y-2">
                                                <label>Mulklar</label>
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
                                                                    dailyRate: selectedProduct?.dailyRate || selectedProduct?.price || 0
                                                                } : item
                                                            )
                                                        }));
                                                    }}
                                                >
                                                    <SelectTrigger className={validationErrors[`borrowedProducts.${index}.product`] ? 'border-red-500' : ''}>
                                                        <SelectValue placeholder="Mulkni tanlang">
                                                            {product.product ? products.find(p => p._id === product.product)?.name : "Mahsulotni tanlang"}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <div className="px-3 pb-2">
                                                            <Input
                                                                type="text"
                                                                placeholder="Mulkni qidirish..."
                                                                value={productSearch}
                                                                onChange={(e) => setProductSearch(e.target.value)}
                                                            />
                                                        </div>
                                                        {filteredProducts.length > 0 ? (
                                                            filteredProducts.map((product) => (
                                                                <SelectItem key={product._id} value={product._id}>
                                                                    {product.name} - {product.quantity} dona
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
                                                                        quantity: Math.max(1, (item.quantity || 1) - 1) 
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
                                                            setRentalForm(prev => ({
                                                                ...prev,
                                                                borrowedProducts: prev.borrowedProducts.map((item, i) => 
                                                                    i === index ? { ...item, quantity: parseInt(e.target.value) || 1 } : item
                                                                )
                                                            }));
                                                        }}
                                                        min="1"
                                                        placeholder="Miqdor"
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
                                                                        quantity: (item.quantity || 1) + 1 
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
                                                    placeholder="Kunlik narx"
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
                                        </div>
                                    ))}
                                </div>

                              
                                </div>
                            </div>

                            {/* Total Amount */}
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-medium">Umumiy summa:</h3>
                                    <p className="text-xl font-bold">{rentalForm.totalCost.toLocaleString()} so'm</p>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mt-4">
                                <Label htmlFor="description">Izoh</Label>
                                <Textarea
                                    id="description"
                                    value={rentalForm.description || ''}
                                    onChange={(e) => setRentalForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Ijaraga izoh qo'shish..."
                                    className="mt-1"
                                />
                            </div>

                            <div className="flex justify-end mt-4">
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
