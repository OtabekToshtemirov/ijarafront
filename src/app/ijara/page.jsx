    'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    returnProduct,
    fetchProducts
} from '@/lib/features/rentals/rentalsSlice';
import { toast } from 'sonner';
import { Loader2, Plus, Edit, Eye, Printer } from 'lucide-react';
import moment from 'moment';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from "@/components/ui/label";
import { useReactToPrint } from 'react-to-print';
import axios from 'axios';

export default function RentalsPage() {
    const dispatch = useDispatch();
    const rentals = useSelector((state) => state.rentals.rentals);
    const products = useSelector((state) => state.products.products);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [editingId, setEditingId] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedRental, setSelectedRental] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPrintRental, setSelectedPrintRental] = useState(null);
    const [error, setError] = useState(null);
    const componentRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                await Promise.all([
                    dispatch(fetchRentals()),
                    dispatch(fetchProducts())
                ]);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
                toast.error('Ma\'lumotlarni yuklashda xatolik');
            }
        };

        fetchData();
    }, [dispatch]);

    // Get filtered and searched rentals
    const filteredRentals = useMemo(() => {
        return rentals.filter(rental => {
            // First apply status filter
            if (filter !== 'all' && rental.status !== filter) {
                return false;
            }

            // Then apply search filter if there's a search query
            if (searchQuery) {
                const customer = rental.customer?.name?.toLowerCase() || '';
                const rentalNumber = rental.rentalNumber?.toLowerCase() || '';
                const searchLower = searchQuery.toLowerCase();
                const rentalCar = rental.car?.carNumber?.toLowerCase() || '';
                const rentalDriver = rental.car?.driverName?.toLowerCase() || '';
                const rentalDriverPhone = rental.car?.driverPhone?.toLowerCase() || '';
                const product = rental.product?.name?.toLowerCase() || '';
                
                return customer.includes(searchLower) || 
                       rentalNumber.includes(searchLower) ||
                       rentalCar.includes(searchLower) ||
                       rentalDriver.includes(searchLower) ||
                       rentalDriverPhone.includes(searchLower) ||
                       product.includes(searchLower);
            }

            return true;
        });
    }, [rentals, filter, searchQuery]);

    const handleFilterChange = (value) => {
        setFilter(value);
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
            toast.success("Ўзгаришлар сакланди");
            setEditingId(null);
            dispatch(fetchRentals());
        } catch (error) {
            toast.error(error.message || "Хатолик юз берди");
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
                toast.success("Маҳсулотлар муваффакиятли қайтарилди");
            }

            await dispatch(updateRental({ id: rental._id, data: updateData })).unwrap();
            toast.success(`Ижара ҳолати ${newStatus === 'active' ? 'Фаол' : 
                                       newStatus === 'completed' ? 'Якунланган' : 
                                       'Бекор қилинди'} га ўзгартирилди`);
            
            dispatch(fetchRentals());
        } catch (error) {
            toast.error(error.message || "Хатолик юз берди");
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
            toast.success("Маҳсулот миқдори муваффакиятли ўзгартирилди");
            
            setEditingProduct(null);
            dispatch(fetchRentals());
        } catch (error) {
            toast.error(error.message || "Хатолик юз берди");
        }
    };

    const handleViewRental = (rental) => {
        setSelectedRental(rental);
        setViewDialogOpen(true);
    };

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        onAfterPrint: () => setSelectedPrintRental(null),
    });

    const PrintComponent = ({ rental }) => {
        if (!rental) return null;
        
        return (
            <div style={{ width: '80mm', padding: '5mm', fontFamily: 'Arial' }}>
                <style type="text/css" media="print">{`
                    @page { 
                        size: 80mm auto;
                        margin: 0;
                    }
                    @media print {
                        body {
                            width: 80mm;
                        }
                        table { 
                            page-break-inside: avoid;
                        }
                    }
                `}</style>
                
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>ИЖАРА МАРКАЗИ № {rental.rentalNumber}</h2>
                    <div style={{ fontSize: '14px' }}>Сана:{new Date(rental.createdAt).toLocaleString('uz-UZ', { 
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    })}</div>
                </div>

                <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '5px', fontWeight: 'bold', borderBottom: '1px solid black' }}>Т/р</th>
                            <th style={{ textAlign: 'left', padding: '5px', fontWeight: 'bold', borderBottom: '1px solid black' }}>Мулк номи</th>
                            <th style={{ textAlign: 'left', padding: '5px', fontWeight: 'bold', borderBottom: '1px solid black' }}>Миқдори</th>
                            <th style={{ textAlign: 'left', padding: '5px', fontWeight: 'bold', borderBottom: '1px solid black' }}>Кунлик ижара нархи</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rental.borrowedProducts.map((product, index) => (
                            <tr key={index}>
                                <td style={{ padding: '5px', borderBottom: '1px solid #eee' }}>{index + 1}.</td>
                                <td style={{ padding: '5px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{product.product.name}</td>
                                <td style={{ padding: '5px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{product.quantity}</td>
                                <td style={{ padding: '5px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{product.product.dailyRate * product.quantity} сўм</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ marginTop: '15px', fontSize: '14px' }}>
                    <div style={{ marginBottom: '10px' }}>Ижарага олувчи: {rental.customer.name}</div>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '20px' }}>КУНЛИК ИЖАРА ҲАҚИ : <span style={{fontSize:'20px', color:'red'}}></span> {rental.totalCost} сўм</div>
                    <div style={{ textAlign: 'center', marginTop: '10px', fontWeight: 'bold',fontSize :'30px'}}>(90) 222 80 86</div>
                </div>
                {/* izoh ham qo'shish */}
                <div style={{ marginTop: '15px', fontSize: '14px' }}>
                    <h3 style={{ margin: '5px 0', fontSize: '12px' }}>ИЗОХ:</h3>
                    <div>{rental.description}</div>
                </div>
            </div>
        );
    };

    const handleProductSelect = (productId) => {
        const selectedProduct = products.find(p => p._id === productId);
        if (!selectedProduct) return;

        // Asosiy mahsulotni qo'shish
        const newBorrowedProduct = {
            product: selectedProduct._id,
            quantity: 1,
            days: 1,
            dailyRate: selectedProduct.dailyRate,
            rentDate: new Date().toISOString()
        };

        // Yangi mahsulotlar ro'yxati
        let newBorrowedProducts = [newBorrowedProduct];

        // Agar combo mahsulot bo'lsa, qismlarini ham qo'shamiz
        if (selectedProduct.type === 'combo' && selectedProduct.parts?.length > 0) {
            // Har bir qism uchun mahsulotni topamiz
            selectedProduct.parts.forEach(part => {
                const partProduct = products.find(p => p._id === part.product._id);
                if (partProduct) {
                    newBorrowedProducts.push({
                        product: partProduct._id,
                        quantity: part.quantity,
                        days: 1,
                        dailyRate: 0, // Qismlar uchun narx 0
                        rentDate: new Date().toISOString()
                    });
                }
            });
        }

        setNewRental(prev => ({
            ...prev,
            borrowedProducts: [...prev.borrowedProducts, ...newBorrowedProducts]
        }));

        setSelectedProduct('');
    };

    // Mahsulotni o'chirish
    const handleRemoveProduct = (index) => {
        setNewRental(prev => {
            const removedProduct = prev.borrowedProducts[index];
            let productsToRemove = [index];

            // Agar bu combo mahsulot bo'lsa, uning barcha qismlarini ham o'chiramiz
            if (removedProduct.isComboMain) {
                prev.borrowedProducts.forEach((product, idx) => {
                    if (product.isComboChild && product.parentProduct === removedProduct.product) {
                        productsToRemove.push(idx);
                    }
                });
            }
            // Agar bu qism bo'lsa, uni alohida o'chiramiz
            else if (removedProduct.isComboChild) {
                productsToRemove = [index];
            }

            const newBorrowedProducts = prev.borrowedProducts.filter((_, idx) => !productsToRemove.includes(idx));

            return {
                ...prev,
                borrowedProducts: newBorrowedProducts
            };
        });
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
                    <h2 className="text-2xl font-semibold tracking-tight">Ижара</h2>
                    <p className="text-sm text-muted-foreground">
                        Барча ижаралар рўйхати
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <Select value={filter} onValueChange={handleFilterChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Филтр" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Барчаси</SelectItem>
                            <SelectItem value="active">Фаол</SelectItem>
                            <SelectItem value="completed">Якунланган</SelectItem>
                            <SelectItem value="canceled">Бекор қилинган</SelectItem>
                        </SelectContent>
                    </Select>

                    <Link href="/ijara/add-rental">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Янги ижара
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Search Input */}
            <div className="mb-6">
                <Input
                    className="max-w-md"
                    placeholder="Мижоз, Транспорт ёки мулк бўйича қидириш"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Рақами</TableHead>
                            <TableHead>Мижоз</TableHead>
                            <TableHead>Транспорт</TableHead>
                            <TableHead>Кунлик нархи</TableHead>
                            <TableHead>Кун</TableHead>
                            <TableHead>Олинган мулклар</TableHead>
                            <TableHead>Амаллар</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRentals.map((rental) => (
                            <TableRow key={rental._id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>Ижара - {rental.rentalNumber || '-'}</span>
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
                                        <span>{rental.totalCost?.toLocaleString()} сўм</span>
                                      
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{rental.rentalDays} кун</span>
                                        <span className="text-sm text-muted-foreground">
                                            <Badge variant={rental.status === 'active' ? 'success' : 'danger'}>
                                                {rental.status === 'active' ? 'Фаол' : 'Якунланган'}
                                            </Badge>
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>Мулклар:</span>
                                        {rental.borrowedProducts.map((item, index) => (
                                            <div key={index} className="text-sm flex items-center justify-between">
                                                <div>
                                                    <span>{item.product?.name || 'Noma\'lum mahsulot'} {item.quantity} dona</span>
                                                    {item.product?.type === 'combo' && item.product.parts?.length > 0 && (
                                                        <div className="ml-4 text-xs text-muted-foreground">
                                                            {item.product.parts.map((part, idx) => (
                                                                <div key={idx}>
                                                                    {part.product?.name || 'Noma\'lum qism'} ({part.quantity} dona)
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
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
                                                    <SelectValue placeholder="Статус" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Фаол</SelectItem>
                                                    <SelectItem value="completed">Якунланган</SelectItem>
                                                    <SelectItem value="canceled">Бекор қилинган</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleCancel}
                                            >
                                                Бекор
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-center gap-2">
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
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setSelectedPrintRental(rental);
                                                    setTimeout(handlePrint, 100);
                                                }}
                                            >
                                                <Printer className="h-4 w-4" />
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
              <DialogTitle>Ижара маълумотлари</DialogTitle>
            </DialogHeader>
            {selectedRental && (
                <div className="grid gap-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Рақам</Label>
                            <p className="text-lg">{selectedRental.rentalNumber}</p>
                            <p className="text-sm text-muted-foreground">
                                {new Date(selectedRental.createdAt).toLocaleString('uz-UZ', { 
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                })}
                            </p>
                        </div>
                        <div>
                            <Label>Статус</Label>
                            <p className="text-lg">
                                {selectedRental.status === 'active' ? 'Фаол' :
                                 selectedRental.status === 'completed' ? 'Якунланган' :
                                 'Бекор қилинган'}
                            </p>
                        </div>
                    </div>

                    <div>
                        <Label>Мижоз</Label>
                        <p className="text-lg">{selectedRental.customer?.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedRental.customer?.phone}</p>
                    </div>

                    <div>
                        <Label>Машина</Label>
                        <p className="text-lg">{selectedRental.car?.carNumber || '-'}</p>
                        <p className="text-sm text-muted-foreground">{selectedRental.car?.driverName || '-'}</p>
                    </div>

                    <div>
                        <Label>Молиявий маълумотлар</Label>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                                <p className="text-lg font-medium">{selectedRental.totalCost?.toLocaleString()} сўм</p>
                                <p className="text-sm text-muted-foreground">Умумий сумма</p>
                            </div>
                            <div>
                                <p className="text-lg font-medium text-green-600">
                                    {selectedRental.paidAmount?.toLocaleString()} сўм
                                </p>
                                <p className="text-sm text-muted-foreground">Тўланган</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label>Олинган маҳсулотлар</Label>
                        {selectedRental.borrowedProducts.map((item, index) => (
                            <div key={index} className="flex items-center justify-between space-x-4 p-2 rounded border mt-2">
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span>{item.product?.name || 'Номаълум маҳсулот'}</span>
                                        <span>{item.quantity} дона</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>Кунлик нарх: {item.dailyRate?.toLocaleString()} сўм</span>
                                        <span>Олинган сана: {new Date(item.rentDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Бошланғич сана: {new Date(item.startDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div>
                        <Label>Қайтарилган маҳсулотлар</Label>
                        {selectedRental.returnedProducts.map((item, index) => (
                            <div key={index} className="flex items-center justify-between space-x-4 p-2 rounded border mt-2">
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span>{item.product?.name || 'Номаълум маҳсулот'}</span>
                                        <span>{item.quantity} дона</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>Кунлик нарх: {item.dailyRate?.toLocaleString()} сўм</span>
                                        <span>Қайтарилган сана: {new Date(item.returnDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Бошланғич сана: {new Date(item.startDate).toLocaleDateString()}</span>
                                        <span>Кунлар сони: {item.days}</span>
                                        <span>Жами: {item.totalCost?.toLocaleString()} сўм</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Чегирма: {item.discount?.toLocaleString()} сўм</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div>
                        <Label>Изоҳ</Label>
                        <p className="text-lg">{selectedRental.description || 'Изоҳ мавжуд эмас'}</p>
                    </div>

                    <div>
                        <Label>Бошланиш санаси</Label>
                        <p className="text-lg">{new Date(selectedRental.workStartDate).toLocaleDateString()}</p>
                    </div>

                    {selectedRental.endDate && (
                        <div>
                            <Label>Тугаш санаси</Label>
                            <p className="text-lg">{new Date(selectedRental.endDate).toLocaleDateString()}</p>
                        </div>
                    )}
                </div>
            )}
          </DialogContent>
        </Dialog>

            {/* Yashirin print komponenti */}
            <div style={{ display: "none" }}>
                <div ref={componentRef}>
                    {selectedPrintRental && <PrintComponent rental={selectedPrintRental} />}
                </div>
            </div>
        </div>
    );
}