function formatDate(dateInput: any): string {
  if (!dateInput) return new Date().toISOString().split('T')[0];
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toISOString().split('T')[0];
  } catch {
    return String(dateInput);
  }
}

function formatPrintDate(dateInput: any): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return new Date().toLocaleDateString('id-ID');
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function transformPurchaseOrder(po: any) {
  const orderDate = formatDate(po.order_date);
  const items = (po.items || []).map((item: any) => {
    const qty = Number(item.quantity || 0);
    const unitPrice = Number(item.unit_price || item.price || 0);
    const lineAmount = Number(item.subtotal || (qty * unitPrice));
    const itemCode = item.item?.code || item.item_code || 'BRG';
    const itemName = item.item?.name || item.item_name || item.description || 'Barang Logistik';
    const unit = (item.item?.unit || item.unit || 'Unit').toUpperCase();

    return {
      code: itemCode,
      name: itemName,
      unit: unit,
      quantity: qty,
      qty: qty,
      price: unitPrice,
      amount: lineAmount,
      delDate: orderDate,
    };
  });

  const subtotal = Number(po.subtotal || items.reduce((acc: number, it: any) => acc + it.amount, 0));
  const tax = Number(po.tax || 0);
  const total = Number(po.total || (subtotal + tax));
  const vendorName = po.vendor?.name || (typeof po.vendor === 'string' ? po.vendor : 'Vendor Terdaftar');
  const vendorPhone = po.vendor?.phone || '-';
  const companyName = po.company?.name || 'Head Office';
  const companyAddress = po.company?.address ? ` (${po.company.address})` : '';

  return {
    // Standard Architecture Contract (isolated-integration-service-architecture.md Section 12)
    document_number: po.po_number,
    supplier_name: vendorName,
    date: orderDate,
    items: items,

    // AMS Full Compatibility Keys (TransactionTemplatePdfService & DokumenController)
    kode: po.po_number,
    nomor_dokumen: po.po_number,
    judul: po.description || `Purchase Order ${po.po_number} - ${vendorName}`,
    nominal: total,
    tanggal: orderDate,
    print_date: formatPrintDate(po.order_date),
    tipe: 'PO',
    ref_no: po.purchase_request?.pr_number || (typeof po.purchase_request === 'string' ? po.purchase_request : '-'),
    vendor: vendorName,
    phone: vendorPhone,
    deliver_to: `${companyName}${companyAddress}`,
    notes: po.description || 'Pengadaan material & inventaris via External Inventory System',
    deskripsi: po.description || `Purchase Order resmi ${po.po_number} diterbitkan untuk rekanan ${vendorName}.`,
    totals: {
      subtotal: subtotal,
      discount: 0,
      dppLainnya: Math.round(subtotal * 0.917),
      ppn: tax,
      transport: 0,
      total: total,
    },
    approvers: ['NNR', 'P.A.M.'],
    app_date: orderDate,
    source: 'eis',
    status: po.status || 'issued',
    raw_id: po.id,
  };
}
