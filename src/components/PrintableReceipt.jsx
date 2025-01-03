'use client';

import React from 'react';

const PrintableReceipt = React.forwardRef(({ rental }, ref) => {
    if (!rental) return null;
    
    return (
        <div ref={ref} style={{ width: '80mm', padding: '5mm', fontFamily: 'Arial' }}>
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
            
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '14px' }}>Ijara Ma'lumotlari</h2>
            </div>
            
            <div style={{ fontSize: '12px', marginBottom: '10px' }}>
                <div>№ {rental.rentalNumber}</div>
                <div>Sana: {new Date(rental.createdAt).toLocaleDateString()}</div>
            </div>

            <div style={{ fontSize: '12px', marginBottom: '10px' }}>
                <h3 style={{ margin: '5px 0', fontSize: '12px' }}>MIJOZ MA'LUMOTLARI:</h3>
                <div>Ism: {rental.customer.name}</div>
                <div>Tel: {rental.customer.phone}</div>
                <div>Manzil: {rental.customer.address}</div>
            </div>

            <div style={{ fontSize: '12px', marginBottom: '10px' }}>
                <h3 style={{ margin: '5px 0', fontSize: '12px' }}>IJARA MA'LUMOTLARI:</h3>
                <div>Boshlanish: {new Date(rental.workStartDate).toLocaleDateString()}</div>
                <div>Oldindan to'lov: {(rental.totalCost - rental.debt).toLocaleString()} so'm</div>
                <div>Umumiy kunlik narx: {rental.totalCost.toLocaleString()} so'm</div>
            </div>

            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid black' }}>
                        <th style={{ textAlign: 'left', padding: '2px' }}>Mahsulot</th>
                        <th style={{ textAlign: 'center', padding: '2px' }}>Soni</th>
                        <th style={{ textAlign: 'right', padding: '2px' }}>Narx</th>
                    </tr>
                </thead>
                <tbody>
                    {rental.borrowedProducts.map((product, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '2px' }}>{product.product.name}</td>
                            <td style={{ textAlign: 'center', padding: '2px' }}>{product.quantity}</td>
                            <td style={{ textAlign: 'right', padding: '2px' }}>{product.dailyRate.toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {rental.description && (
                <div style={{ fontSize: '12px', marginTop: '10px' }}>
                    <h3 style={{ margin: '5px 0', fontSize: '12px' }}>Izoh:</h3>
                    <div>{rental.description}</div>
                </div>
            )}
        </div>
    );
});

PrintableReceipt.displayName = 'PrintableReceipt';

export default PrintableReceipt;
