'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Pencil, Trash2, Eye } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import CarDetailsSheet from '@/components/cars/CarDetailsSheet';
import { 
    fetchCars,
    createCar,
    updateCar,
    deleteCar,
    clearAddStatus
} from '@/lib/features/cars/carsSlice';

// Moved CarForm outside the main component
const CarForm = ({ onSubmit, formData, onChange, isEdit, isLoading, onClose }) => {
    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await onSubmit(e);
        if (success) {
            toast.success(isEdit ? 'Транспорт муваффақиятли янгиланди' : 'Транспорт муваффақиятли қўшилди');
            onClose();
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-4">
                <div>
                    <Label htmlFor="carNumber">Транспорт рақами</Label>
                    <Input
                        id="carNumber"
                        name="carNumber"
                        value={formData.carNumber}
                        onChange={onChange}
                        required
                    />
                </div>
                <div>
                    <Label htmlFor="driverName">Ҳайдовчи исми</Label>
                    <Input
                        id="driverName"
                        name="driverName"
                        value={formData.driverName}
                        onChange={onChange}
                        required
                    />
                </div>
                <div>
                    <Label htmlFor="driverPhone">Телефон рақами</Label>
                    <Input
                        id="driverPhone"
                        name="driverPhone"
                        value={formData.driverPhone}
                        onChange={onChange}
                        required
                    />
                </div>
                <div>
                    <Label htmlFor="status">Ҳолати</Label>
                    <Select
                        id="status"
                        name="status"
                        value={formData.status}
                        onValueChange={(value) => onChange({ target: { name: 'status', value } })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Ҳолатни танланг" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Фаол</SelectItem>
                            <SelectItem value="inactive">Фаол эмас</SelectItem>
                            <SelectItem value="repair">Таъмирда</SelectItem>
                            <SelectItem value="banned">Тақиқда</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="description">Изоҳ</Label>
                    <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={onChange}
                        placeholder="Транспорт ҳақида қўшимча маълумот..."
                        className="h-20"
                    />
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Бекор қилиш
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? 'Янгилаш' : 'Сақлаш'}
                    </Button>
                </DialogFooter>
            </div>
        </form>
    );
};

export default function CarsPage() {
    const dispatch = useDispatch();
    const { cars, status, addStatus } = useSelector((state) => state.cars);
    
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedCar, setSelectedCar] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        carNumber: '',
        driverName: '',
        driverPhone: '',
        status: '',
        description: ''
    });

    // Filter cars based on search query
    const filteredCars = cars?.filter(car => {
        const query = searchQuery.toLowerCase();
        return (
            car.carNumber.toLowerCase().includes(query) ||
            car.driverName.toLowerCase().includes(query) ||
            car.driverPhone.toLowerCase().includes(query)
        );
    }) || [];

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchCars());
        }
    }, [status, dispatch]);

    useEffect(() => {
        if (addStatus === 'succeeded') {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            toast.success('Муваффақиятли сақланди');
            setFormData({
                carNumber: '',
                driverName: '',
                driverPhone: '',
                status: '',
                description: ''
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
            toast.error('Хатолик юз берди');
            return false;
        }
    };

    const handleEditCar = async (e) => {
        e.preventDefault();
        try {
            await dispatch(updateCar({ id: selectedCar._id, data: formData })).unwrap();
            return true;
        } catch (error) {
            toast.error('Хатолик юз берди');
            return false;
        }
    };

    const handleDeleteCar = async () => {
        if (selectedCar) {
            try {
                await dispatch(deleteCar(selectedCar._id)).unwrap();
                setIsDeleteDialogOpen(false);
                toast.success('Транспорт муваффақиятли ўчирилди');
            } catch (error) {
                toast.error('Хатолик юз берди');
            }
        }
    };

    const openEditDialog = (car) => {
        setSelectedCar(car);
        setFormData({
            carNumber: car.carNumber,
            driverName: car.driverName,
            driverPhone: car.driverPhone,
            status: car.status,
            description: car.description
        });
        setIsEditDialogOpen(true);
    };

    const openDeleteDialog = (car) => {
        setSelectedCar(car);
        setIsDeleteDialogOpen(true);
    };

    const openDetailsSheet = (car) => {
        setSelectedCar(car);
        setIsDetailsOpen(true);
    };

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">
                        Транспортлар
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Транспортларни бошқариш
                    </p>
                </div>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Қўшиш
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Янги транспорт қўшиш</DialogTitle>
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

            <div className="mb-4">
                <Input
                    placeholder="Қидириш..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Транспорт рақами</TableHead>
                            <TableHead>Ҳайдовчи</TableHead>
                            <TableHead>Телефон рақами</TableHead>
                            <TableHead>Ижаралар сони</TableHead>
                            <TableHead className="text-right">Амаллар</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCars.map((car) => (
                            <TableRow key={car._id}>
                                <TableCell>{car.carNumber}</TableCell>
                                <TableCell>{car.driverName}</TableCell>
                                <TableCell>{car.driverPhone}</TableCell>
                                <TableCell>{car.rentalCount}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openDetailsSheet(car)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
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
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Транспортни таҳрирлаш</DialogTitle>
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

            {/* Delete Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Транспортни ўчириш</DialogTitle>
                    </DialogHeader>
                    <p>Ҳақиқатан ҳам ушбу транспортни ўчирмоқчимисиз?</p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        >
                            Бекор қилиш
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteCar}
                            disabled={status === 'loading'}
                        >
                            {status === 'loading' && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Ўчириш
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Details Sheet */}
            <CarDetailsSheet
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                car={selectedCar}
            />
        </div>
    );
}
