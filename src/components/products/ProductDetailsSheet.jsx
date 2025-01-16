'use client';

import React from 'react';
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { fetchRentalsByProductId } from "@/lib/features/rentals/rentalsSlice";

const ProductDetailsSheet = ({ product, isOpen, onOpenChange }) => {
    if (!product) return null;

    console.log('Full Product Data:', product); // Debug uchun

    const dispatch = useDispatch();
    const rentals = useSelector((state) => state.rentals.rentals);
    const status = useSelector((state) => state.rentals.status);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleDateString();
        } catch (error) {
            return 'N/A';
        }
    };

    useEffect(() => {
        if (isOpen && product?._id) {
            dispatch(fetchRentalsByProductId(product._id));
        }
    }, [dispatch, isOpen, product?._id]);

    const getActiveRentals = () => {
        return rentals.filter(rental => {
            const hasProduct = rental.borrowedProducts.some(bp => bp.product?._id === product?._id);
            return rental.status === 'active' && hasProduct;
        });
    };

    const getReturnedQuantity = (rental) => {
        return rental.returnedProducts
            .filter(rp => rp.product?._id === product?._id)
            .reduce((sum, rp) => sum + rp.quantity, 0);
    };

    const getBorrowedQuantity = (rental) => {
        const borrowed = rental.borrowedProducts.find(bp => bp.product?._id === product?._id);
        return borrowed ? borrowed.quantity : 0;
    };

    const getRemainingQuantity = (rental) => {
        const borrowed = getBorrowedQuantity(rental);
        const returned = getReturnedQuantity(rental);
        return borrowed - returned;
    };

    // Combo Parts Section
    const renderComboParts = () => {
        // Agar mahsulot combo type bo'lmasa yoki qismlari bo'lmasa, hech narsa ko'rsatmaymiz
        if (product.type !== 'combo' || !Array.isArray(product.parts) || product.parts.length === 0) {
            return null;
        }

        return (
            <div className="border rounded-lg p-4 mt-4">
                <h3 className="text-lg font-semibold mb-4">Qismlar</h3>
                <div className="space-y-4">
                    {product.parts.map((part, index) => {
                        // Qism mahsulot ma'lumotlarini olish
                        const partProduct = part.product;
                        
                        if (!partProduct) {
                            return null;
                        }

                        return (
                            <div key={index} className="bg-gray-50 rounded-lg p-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Nomi</p>
                                        <p className="font-medium">{partProduct.name || 'Noma\'lum'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Soni</p>
                                        <p className="font-medium">{part.quantity || 0} dona</p>
                                    </div>
                                    {partProduct.dailyRate && (
                                        <>
                                            <div>
                                                <p className="text-sm text-gray-500">Kunlik narx</p>
                                                <p className="font-medium">{partProduct.dailyRate?.toLocaleString() || '0'} so'm</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Umumiy narx</p>
                                                <p className="font-medium">
                                                    {((partProduct.dailyRate || 0) * (part.quantity || 0)).toLocaleString()} so'm
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="text-xl font-bold">{product?.name}</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-120px)] pr-4">
                    <div className="space-y-6 mt-6">
                        {/* Asosiy ma'lumotlar */}
                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg">Asosiy ma'lumotlar</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Mahsulot kodi</p>
                                    <p className="font-medium">{product?.code || 'Mavjud emas'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Turi</p>
                                    <Badge variant={product?.type === 'combo' ? 'secondary' : 'default'}>
                                        {product?.type === 'combo' ? 'Combo' : 'Oddiy'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Kunlik narx</p>
                                    <p className="font-medium">{product?.dailyRate?.toLocaleString() || '0'} so'm</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Mavjud soni</p>
                                    <p className="font-medium">{product?.quantity || 0} dona</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Ijarada</p>
                                    <p className="font-medium">{product?.rented || 0} dona</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <Badge variant={product?.isAvailable ? 'success' : 'destructive'}>
                                        {product?.isAvailable ? 'Mavjud' : 'Mavjud emas'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Combo qismlari */}
                        {renderComboParts()}

                        {/* Tavsif */}
                        {product?.description && (
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">Tavsif</h3>
                                <p className="text-gray-600 whitespace-pre-wrap">{product.description}</p>
                            </div>
                        )}

                        {/* Faol ijaralar */}
                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg">Faol ijaralar</h3>
                            {status === 'loading' ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : getActiveRentals().length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">
                                    Faol ijaralar mavjud emas
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {getActiveRentals().map((rental) => (
                                        <div 
                                            key={rental._id} 
                                            className="border rounded-lg p-4"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-medium">{rental.rentalNumber}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {rental.customer?.name}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">
                                                        {getBorrowedQuantity(rental)} dona
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Qoldi: {getRemainingQuantity(rental)} dona
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Sana: {formatDate(rental.startDate)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Ijara tarixi */}
                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg">Ijara tarixi</h3>
                            {status === 'loading' ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : rentals.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">
                                    Ijara tarixi mavjud emas
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Sana</TableHead>
                                            <TableHead>Mijoz</TableHead>
                                            <TableHead>Ijara raqami</TableHead>
                                            <TableHead>Soni</TableHead>
                                            <TableHead>Holati</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rentals.map((rental) => (
                                            <TableRow key={rental._id}>
                                                <TableCell>
                                                    {formatDate(rental.startDate)}
                                                </TableCell>
                                                <TableCell>{rental.customer?.name}</TableCell>
                                                <TableCell>{rental.rentalNumber}</TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <p>{getBorrowedQuantity(rental)} dona</p>
                                                        {rental.status === 'active' && (
                                                            <p className="text-sm text-muted-foreground">
                                                                Qoldi: {getRemainingQuantity(rental)} dona
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={rental.status === 'active' ? "default" : "secondary"}>
                                                        {rental.status === 'active' ? 'Faol' : 'Yakunlangan'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};

export default ProductDetailsSheet;
