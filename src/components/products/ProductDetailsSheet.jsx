'use client'

import { useState, useEffect } from 'react'
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetDescription 
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table'
import { toast } from '/src/hooks/use-toast'
import { fetchRentalsByProductId } from '@/lib/features/rentals/rentalsSlice'
import { useDispatch } from 'react-redux'

export default function ProductDetailsSheet({ 
    product, 
    isOpen, 
    onOpenChange 
}) {
    const [productRentals, setProductRentals] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const dispatch = useDispatch()

    useEffect(() => {
        const fetchProductRentals = async () => {
            // Check if product and _id exist and sheet is open
            if (!product?._id || !isOpen) {
                setProductRentals([])
                return
            }

            setIsLoading(true)
            try {
                const response = await dispatch(fetchRentalsByProductId(product._id)).unwrap();
                setProductRentals(response || []);
            } catch (error) {
                toast({
                    title: 'Xato',
                    description: 'Mahsulot ijaralari yuklanmadi',
                    variant: 'destructive',
                });
                setProductRentals([])
            } finally {
                setIsLoading(false)
            }
        };

        fetchProductRentals();
    }, [product, isOpen, dispatch]);

    if (!product) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-[600px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{product.name} Tafsilotlari</SheetTitle>
                    <SheetDescription>
                        Mahsulot va uning kirayaga berilgan holatlari
                    </SheetDescription>
                </SheetHeader>
                
                <div className="mt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="font-semibold">Mahsulot Turi:</p>
                            <Badge variant={product.type === 'single' ? 'default' : 'secondary'}>
                                {product.type === 'single' ? 'Yakka' : 'Kombinatsiya'}
                            </Badge>
                        </div>
                        <div>
                            <p className="font-semibold">Kunlik Narxi:</p>
                            <p>{product.dailyRate} so'm/kun</p>
                        </div>
                        <div>
                            <p className="font-semibold">Soni:</p>
                            <p>{product.quantity}</p>
                        </div>
                        <div>
                            <p className="font-semibold">Holati:</p>
                            <Badge 
                                variant={product.availability ? 'outline' : 'destructive'}
                            >
                                {product.availability ? 'Mavjud' : 'Mavjud Emas'}
                            </Badge>
                        </div>
                        {product.type === 'combo' && (
                            <div className="col-span-2">
                                <p className="font-semibold">Qismlar:</p>
                                <div className="flex flex-wrap gap-2">
                                    {product.parts && product.parts.map((part, index) => (
                                        <Badge key={index} variant="secondary">
                                            {part.product} ({part.quantity}x)
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="col-span-2">
                            <p className="font-semibold">Marta ijaraga berilgan:</p>
                            <p>{product.rentalCount}</p>
                        </div>
                        
                    </div>

                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">Ijaraga Berilgan Holatlari</h3>
                        {isLoading ? (
                            <p className="text-muted-foreground">Yuklanmoqda...</p>
                        ) : productRentals.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mijoz</TableHead>
                                        <TableHead>Boshlanish Sanasi</TableHead>
                                        <TableHead>Tugash Sanasi</TableHead>
                                        <TableHead>Umumiy Narx</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {productRentals.map((rental) => (
                                        <TableRow key={rental._id}>
                                            <TableCell>{rental.customer?.name || 'Noma\'lum mijoz'}</TableCell>
                                            <TableCell>{new Date(rental.startDate).toLocaleDateString()}</TableCell>
                                            <TableCell>{new Date(rental.endDate).toLocaleDateString()}</TableCell>
                                            <TableCell>{rental.totalCost} so'm</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-muted-foreground">Bu mahsulot hozircha ijaraga berilmagan</p>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
