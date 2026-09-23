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

export function transformPurchaseRequest(pr: any) {
  const requestDate = formatDate(pr.request_date);
  const items = (pr.items || []).map((item: any) => ({
    kode: item.item?.code || item.item_code || 'BRG',
    code: item.item?.code || item.item_code || 'BRG',
    nama: item.item?.name || item.item_name || item.description || 'Barang Inventaris',
    name: item.item?.name || item.item_name || item.description || 'Barang Inventaris',
    satuan: item.item?.unit || item.unit || 'Unit',
    unit: item.item?.unit || item.unit || 'Unit',
    qty: Number(item.quantity || 0),
    quantity: Number(item.quantity || 0),
    keterangan: item.description || `Kebutuhan ${pr.department || 'Operasional'}`,
    description: item.description || `Kebutuhan ${pr.department || 'Operasional'}`,
  }));

  let nominal = Number(pr.total_estimated || 0);
  if (!nominal && pr.items) {
    nominal = pr.items.reduce((sum: number, it: any) => {
      const q = Number(it.quantity || 0);
      const p = Number(it.estimated_price || it.unit_price || 0);
      return sum + (q * p);
    }, 0);
  }

  const requester = pr.requester_name || 'Staff';
  const dept = pr.department || 'Divisi Terkait';
  const companyName = pr.company?.name || 'Head Office';

  return {
    // Standard Architecture Contract
    document_number: pr.pr_number,
    department: dept,
    requester_name: requester,
    date: requestDate,
    items: items,

    // AMS Full Compatibility Keys
    kode: pr.pr_number,
    nomor_dokumen: pr.pr_number,
    judul: pr.description || `Purchase Request ${pr.pr_number} - ${dept}`,
    nominal: nominal,
    tanggal: requestDate,
    print_date: formatPrintDate(pr.request_date),
    tipe: 'PR',
    no_ref: pr.pr_number,
    gudang: dept,
    entity: companyName,
    del_date: requestDate,
    deskripsi: pr.description || `Permintaan pembelian (Purchase Request) diajukan oleh ${requester} dari departemen ${dept}.`,
    approver1: 'AGM',
    approver2: 'M.M',
    app_date: requestDate,
    source: 'eis',
    status: pr.status || 'approved',
    raw_id: pr.id,
  };
}
