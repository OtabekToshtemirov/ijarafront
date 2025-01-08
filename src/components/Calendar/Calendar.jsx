'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { uz } from 'date-fns/locale'
import { cn } from "@/lib/utils"
import { Calendar as CalendarUI } from "@/components/ui/calendar"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

const colorOptions = [
    { label: 'Кўк', value: 'bg-blue-500' },
    { label: 'Яшил', value: 'bg-green-500' },
    { label: 'Сариқ', value: 'bg-yellow-500' },
    { label: 'Қизил', value: 'bg-red-500' },
    { label: 'Пушти', value: 'bg-pink-500' },
]

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function InteractiveCalendar() {
    const [date, setDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [notes, setNotes] = useState({})
    const [currentNote, setCurrentNote] = useState('')
    const [selectedColor, setSelectedColor] = useState('bg-blue-500')
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const fetchNotes = async () => {
        try {
            const response = await fetch(`${API_URL}/calendar-notes`);
            if (!response.ok) throw new Error('Failed to fetch notes');
            
            const data = await response.json();
            const notesMap = {};
            data.forEach(note => {
                notesMap[note.date] = {
                    note: note.note,
                    color: note.color
                };
            });
            setNotes(notesMap);
        } catch (error) {
            console.error('Error fetching notes:', error);
            toast({
                title: "Хато",
                description: "Изоҳларни юклашда хатолик юз берди",
                variant: "destructive",
            });
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    const handleDayClick = (day) => {
        setSelectedDate(day);
        const dateKey = format(day, 'yyyy-MM-dd');
        setCurrentNote(notes[dateKey]?.note || '');
        setSelectedColor(notes[dateKey]?.color || 'bg-blue-500');
        setIsDialogOpen(true);
    };

    const handleSaveNote = async () => {
        if (!selectedDate) return;

        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/calendar-notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: dateKey,
                    note: currentNote,
                    color: selectedColor
                }),
            });

            if (!response.ok) throw new Error('Failed to save note');

            const savedNote = await response.json();
            setNotes(prev => ({
                ...prev,
                [dateKey]: {
                    note: savedNote.note,
                    color: savedNote.color
                }
            }));

            toast({
                title: "Муваффақият",
                description: "Изоҳ сақланди",
            });
        } catch (error) {
            console.error('Error saving note:', error);
            toast({
                title: "Хато",
                description: "Изоҳни сақлашда хатолик юз берди",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
            setIsDialogOpen(false);
        }
    };

    const getDayClass = (day) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const noteData = notes[dateKey];
        return cn(
            'hover:bg-gray-100 transition-colors rounded-full w-7 h-7 p-0 font-normal aria-selected:opacity-100 text-sm',
            noteData?.color,
            noteData?.note && 'text-white'
        );
    };

    return (
        <Card className="w-full bg-card">
            <div className="p-2">
                <CalendarUI
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={uz}
                    className="rounded-md"
                    showOutsideDays={false}
                    modifiersClassNames={{
                        selected: "bg-primary text-primary-foreground",
                        today: "bg-accent text-accent-foreground"
                    }}
                    modifiers={{
                        selected: date,
                        today: new Date()
                    }}
                    components={{
                        Day: ({ date: dayDate, displayMonth, ...props }) => {
                            const dateKey = format(dayDate, 'yyyy-MM-dd');
                            const noteData = notes[dateKey];
                            
                            if (displayMonth.getMonth() !== dayDate.getMonth()) {
                                return null;
                            }
                            
                            return (
                                <div
                                    {...props}
                                    className={getDayClass(dayDate)}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDayClick(dayDate);
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleDayClick(dayDate);
                                        }
                                    }}
                                >
                                    {format(dayDate, 'd')}
                                    {noteData?.note && (
                                        <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                                    )}
                                </div>
                            );
                        },
                        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                        IconRight: () => <ChevronRight className="h-4 w-4" />,
                    }}
                />

                {notes[format(date, 'yyyy-MM-dd')] && (
                    <div className="mt-2 p-2 rounded-lg border text-sm">
                        <p className={cn(
                            "p-2 rounded",
                            notes[format(date, 'yyyy-MM-dd')].color,
                            "text-white"
                        )}>
                            {notes[format(date, 'yyyy-MM-dd')].note}
                        </p>
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-center">
                            {selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: uz }) : ''} учун изоҳ
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="note">Изоҳ</Label>
                            <Input
                                id="note"
                                value={currentNote}
                                onChange={(e) => setCurrentNote(e.target.value)}
                                placeholder="Изоҳни киритинг..."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Ранг</Label>
                            <Select value={selectedColor} onValueChange={setSelectedColor}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {colorOptions.map((color) => (
                                        <SelectItem 
                                            key={color.value} 
                                            value={color.value}
                                            className="flex items-center gap-2"
                                        >
                                            <span className={cn("w-4 h-4 rounded-full", color.value)} />
                                            {color.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                            Бекор қилиш
                        </Button>
                        <Button onClick={handleSaveNote} disabled={isLoading}>
                            {isLoading ? 'Сақланмоқда...' : 'Сақлаш'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
