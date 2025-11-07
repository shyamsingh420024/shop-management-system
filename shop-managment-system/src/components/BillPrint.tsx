import React, { useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { Bill } from '../types/types';
import { calculatePenalty } from '../utils/penaltyUtils';

interface BillPrintProps {
  bill: Bill;
  onClose: () => void;
}

export function BillPrint({ bill, onClose }: BillPrintProps) {
  const { shops } = useShop();
  const shop = shops.find(s => s.id === bill.shopId);
  const penaltyInfo = calculatePenalty(bill);

  useEffect(() => {
    const handlePrint = () => {
      try {
        // Create a new window for printing
        const printContent = generatePrintHTML();
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        
        if (printWindow) {
          printWindow.document.write(printContent);
          printWindow.document.close();
          
          // Wait for content to load then print
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.focus();
              printWindow.print();
              
              // Close the print window after printing
              setTimeout(() => {
                printWindow.close();
              }, 1000);
            }, 500);
          };
        } else {
          // Fallback: Download as HTML file if popup blocked
          downloadBillAsHTML(printContent);
        }
      } catch (error) {
        console.error('Print error:', error);
        // Fallback: Download as HTML file
        downloadBillAsHTML(generatePrintHTML());
      }
    };

    const downloadBillAsHTML = (content: string) => {
      try {
        const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bill-${bill.billNumber}-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('Bill downloaded as HTML file. Please open it in your browser and print manually.');
      } catch (error) {
        console.error('Download error:', error);
        alert('Unable to print or download bill. Please try again.');
      }
    };

    // Start print process after a short delay
    const timer = setTimeout(handlePrint, 300);
    
    return () => clearTimeout(timer);
  }, [bill, shop, penaltyInfo]);

  const generatePrintHTML = () => {
    const totalWithPenalty = bill.remaining + (penaltyInfo.hasPenalty ? penaltyInfo.penaltyAmount : 0);
    const today = new Date();
    const dueDate = new Date(bill.dueDate);
    const isOverdue = today > dueDate && bill.remaining > 0;
    
    return `<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bill ${bill.billNumber} - ${shop?.name || 'Shop'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            line-height: 1.4;
            color: #1a1a1a;
            background: white;
            padding: 15px;
            font-size: 12px;
        }
        
        .bill-container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            border: 2px solid #2563eb;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .bill-header {
            background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
            color: white;
            padding: 15px;
            text-align: center;
            position: relative;
        }
        
        .company-name {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }
        
        .company-tagline {
            font-size: 11px;
            opacity: 0.95;
        }
        
        .bill-number-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255,255,255,0.2);
            padding: 5px 10px;
            border-radius: 15px;
            font-weight: bold;
            font-size: 10px;
            backdrop-filter: blur(10px);
        }
        
        .bill-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            padding: 15px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-bottom: 2px solid #e2e8f0;
        }
        
        .info-section {
            background: white;
            padding: 12px;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            border: 1px solid #e2e8f0;
        }
        
        .info-section h3 {
            color: #1e40af;
            font-size: 13px;
            margin-bottom: 8px;
            padding-bottom: 5px;
            border-bottom: 1px solid #bfdbfe;
            font-weight: bold;
            display: flex;
            align-items: center;
        }
        
        .info-section h3::before {
            content: '🏪';
            margin-right: 5px;
            font-size: 14px;
        }
        
        .info-section:last-child h3::before {
            content: '📋';
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            padding: 3px 0;
            border-bottom: 1px dotted #cbd5e1;
            font-size: 10px;
        }
        
        .info-label {
            font-weight: 600;
            color: #475569;
            flex: 1;
        }
        
        .info-value {
            color: #1f2937;
            font-weight: 500;
            flex: 1;
            text-align: right;
        }
        
        .highlight {
            background: linear-gradient(120deg, #fef3c7 0%, #fde68a 100%);
            padding: 2px 5px;
            border-radius: 4px;
            font-weight: bold;
            color: #92400e;
        }
        
        .items-section {
            padding: 15px;
            background: white;
        }
        
        .items-title {
            color: #1e40af;
            font-size: 16px;
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 2px solid #bfdbfe;
            font-weight: bold;
            text-align: center;
            position: relative;
        }
        
        .items-title::before {
            content: '📦';
            margin-right: 8px;
            font-size: 18px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .items-table th {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 8px 6px;
            text-align: left;
            font-weight: bold;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        
        .items-table th:first-child {
            text-align: center;
            width: 40px;
        }
        
        .items-table th:last-child {
            text-align: right;
            width: 80px;
        }
        
        .items-table td {
            padding: 6px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 10px;
        }
        
        .items-table td:first-child {
            text-align: center;
            font-weight: bold;
            background: #f1f5f9;
            color: #1e40af;
        }
        
        .items-table td:last-child {
            text-align: right;
            font-weight: bold;
            color: #059669;
        }
        
        .items-table tr:nth-child(even) {
            background: #f8fafc;
        }
        
        .total-section {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            padding: 12px;
            border-radius: 6px;
            margin-top: 12px;
            border: 1px solid #bfdbfe;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            padding: 3px 0;
            font-size: 11px;
        }
        
        .total-row.subtotal {
            font-size: 12px;
            font-weight: 600;
            color: #374151;
        }
        
        .total-row.final {
            border-top: 2px solid #1e40af;
            padding-top: 8px;
            margin-top: 8px;
            font-size: 14px;
            font-weight: bold;
            color: #1e40af;
            background: white;
            padding: 10px;
            border-radius: 5px;
            margin: 10px -3px 0 -3px;
        }
        
        .penalty-section {
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            border: 1px solid #fecaca;
            padding: 10px;
            border-radius: 6px;
            margin: 12px 0;
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
        }
        
        .penalty-title {
            color: #dc2626;
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 11px;
            display: flex;
            align-items: center;
        }
        
        .penalty-title::before {
            content: '⚠️';
            margin-right: 5px;
            font-size: 12px;
        }
        
        .status-paid { color: #059669; font-weight: bold; }
        .status-partial { color: #d97706; font-weight: bold; }
        .status-pending { color: #dc2626; font-weight: bold; }
        
        .footer {
            text-align: center;
            padding: 12px;
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            color: #64748b;
            font-size: 9px;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer p {
            margin-bottom: 3px;
        }
        
        .footer-highlight {
            color: #1e40af;
            font-weight: bold;
        }

        .disclaimer-section {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 1px solid #f59e0b;
            padding: 10px;
            border-radius: 6px;
            margin: 12px 0;
            box-shadow: 0 2px 8px rgba(245, 158, 11, 0.1);
        }
        
        .disclaimer-title {
            color: #92400e;
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 11px;
            display: flex;
            align-items: center;
        }
        
        .disclaimer-title::before {
            content: '📝';
            margin-right: 5px;
            font-size: 12px;
        }
        
        @media print {
            body {
                padding: 0;
                background: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                font-size: 11px;
            }
            
            .bill-container {
                border: 1px solid #2563eb;
                max-width: none;
                margin: 0;
                border-radius: 5px;
                box-shadow: none;
                page-break-inside: avoid;
            }
            
            .bill-header {
                background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%) !important;
                color: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                padding: 12px;
            }
            
            .company-name {
                font-size: 18px;
            }
            
            .bill-info {
                padding: 12px;
                gap: 12px;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .info-section {
                background: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                padding: 10px;
            }
            
            .items-section {
                padding: 12px;
            }
            
            .items-title {
                font-size: 14px;
                margin-bottom: 10px;
            }
            
            .items-table th {
                background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%) !important;
                color: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                padding: 6px 5px;
                font-size: 9px;
            }
            
            .items-table td {
                padding: 5px;
                font-size: 9px;
            }
            
            .total-section {
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                padding: 10px;
            }
            
            .penalty-section {
                background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%) !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                padding: 8px;
            }

            .disclaimer-section {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%) !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                padding: 8px;
            }
            
            .footer {
                padding: 10px;
                font-size: 8px;
                background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%) !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            @page {
                margin: 0.4in;
                size: A4;
            }
            
            .bill-container {
                page-break-inside: avoid;
                max-height: none;
                overflow: visible;
            }
            
            .items-table {
                page-break-inside: avoid;
            }
            
            /* Ensure content fits on one page */
            .items-section {
                max-height: none;
            }
            
            .total-section, .penalty-section, .disclaimer-section, .footer {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="bill-container">
        <div class="bill-header">
            <div class="bill-number-badge">Bill #${bill.billNumber}</div>
            <div class="company-name">${shop?.name || 'Shop Name'}</div>
            <div class="company-tagline">Professional Bill & Payment Services</div>
        </div>
        
        <div class="bill-info">
            <div class="info-section">
                <h3>Shop Details</h3>
                <div class="info-row">
                    <span class="info-label">Shop Name:</span>
                    <span class="info-value">${shop?.name || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Owner:</span>
                    <span class="info-value">${shop?.owner || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">${shop?.phone || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Address:</span>
                    <span class="info-value">${shop?.address || 'N/A'}</span>
                </div>
            </div>
            
            <div class="info-section">
                <h3>Bill Information</h3>
                <div class="info-row">
                    <span class="info-label">Bill Number:</span>
                    <span class="info-value highlight">${bill.billNumber}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Bill Date:</span>
                    <span class="info-value">${new Date(bill.billDate).toLocaleDateString('en-IN')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Due Date:</span>
                    <span class="info-value">${new Date(bill.dueDate).toLocaleDateString('en-IN')}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span class="info-value status-${bill.status}">
                        ${bill.status === 'paid' ? '✅ Paid' : bill.status === 'partial' ? '🔄 Partial' : '⏳ Pending'}
                    </span>
                </div>
            </div>
        </div>
        
        <div class="items-section">
            <h2 class="items-title">Bill Items</h2>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>S.No.</th>
                        <th>Description</th>
                        <th>Amount (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    ${bill.items.map((item, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${item.description}</td>
                            <td>₹${item.amount.toLocaleString('en-IN')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="total-section">
                <div class="total-row subtotal">
                    <span><strong>Subtotal:</strong></span>
                    <span><strong>₹${bill.total.toLocaleString('en-IN')}</strong></span>
                </div>
                <div class="total-row">
                    <span>Amount Paid:</span>
                    <span style="color: #059669;">₹${bill.paid.toLocaleString('en-IN')}</span>
                </div>
                <div class="total-row">
                    <span>Remaining:</span>
                    <span style="color: #dc2626;">₹${bill.remaining.toLocaleString('en-IN')}</span>
                </div>
                ${penaltyInfo.hasPenalty ? `
                    <div class="total-row" style="color: #dc2626;">
                        <span>⚠️ Late Fee (${penaltyInfo.overdueDays} days):</span>
                        <span><strong>₹${penaltyInfo.penaltyAmount.toLocaleString('en-IN')}</strong></span>
                    </div>
                    <div class="total-row final" style="color: #dc2626; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-color: #dc2626;">
                        <span>💰 Total Amount Due:</span>
                        <span><strong>₹${totalWithPenalty.toLocaleString('en-IN')}</strong></span>
                    </div>
                ` : `
                    <div class="total-row final">
                        <span>💰 Total Due:</span>
                        <span><strong>₹${bill.remaining.toLocaleString('en-IN')}</strong></span>
                    </div>
                `}
            </div>
            
            ${penaltyInfo.hasPenalty ? `
                <div class="penalty-section">
                    <div class="penalty-title">Late Payment Information</div>
                    <p style="font-size: 10px;"><strong>This bill is ${penaltyInfo.overdueDays} days past due.</strong></p>
                    <p style="font-size: 10px;">A late fee of <strong>₹${penaltyInfo.penaltyAmount.toLocaleString('en-IN')}</strong> has been applied.</p>
                </div>
            ` : ''}

            <div class="disclaimer-section">
                <div class="disclaimer-title">Important Notice</div>
                <p style="font-size: 10px;"><strong>हमारे पास इस बिल और पिछले बिल का कोई भी रिकॉर्ड नहीं है।</strong></p>
                <p style="font-size: 10px;">We do not maintain any records of this bill or previous bills.</p>
                <p style="font-size: 10px;">कृपया अपने रिकॉर्ड अपने पास सुरक्षित रखें। Please keep your own records safely.</p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong class="footer-highlight">🙏 आपके व्यापार के लिए धन्यवाद!</strong></p>
            <p>किसी भी प्रकार की जानकारी के लिए कृपया संपर्क करें।</p>
            <p><strong>धन्यवाद, आपका दिन शुभ हो! 🙏</strong></p>
            <p style="margin-top: 5px;">
                Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}
            </p>
        </div>
    </div>
    
    <script>
        // Auto print when page loads
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 1000);
        };
        
        // Handle print dialog close
        window.onafterprint = function() {
            setTimeout(function() {
                window.close();
            }, 500);
        };
    </script>
</body>
</html>`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Preparing Bill for Print...</h3>
            <p className="text-gray-600 text-sm">
              Your bill is being prepared for printing.
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800 text-sm">
              <strong>Bill:</strong> {bill.billNumber}<br/>
              <strong>Shop:</strong> {shop?.name}<br/>
              <strong>Amount:</strong> ₹{bill.total.toLocaleString('en-IN')}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}