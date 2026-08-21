import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Search, FileText, X, ArrowRight, Download, Eye } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const STATUS_STYLES = { draft:"bg-slate-100 text-slate-600", sent:"bg-blue-100 text-blue-700", accepted:"bg-emerald-100 text-emerald-700", rejected:"bg-red-100 text-red-700" };
const STATUS_LIST = ["draft","sent","accepted","rejected"];

function Modal({ title, onClose, size="max-w-3xl", children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${size} max-h-[92vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const fmt = v => `$${Number(v||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,",")}`;

export default function Quotations() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [form, setForm] = useState({ client_id:"", date:new Date().toISOString().slice(0,10), valid_until:"", status:"draft", notes:"", discount:0, items:[] });
  const [loading, setLoading] = useState(false);

  const load = () => axios.get("/api/quotations").then(r=>setQuotes(r.data));
  useEffect(()=>{
    load();
    axios.get("/api/clients").then(r=>setClients(r.data));
    axios.get("/api/products").then(r=>setProducts(r.data));
  },[]);

  const filtered = quotes.filter(q =>
    q.quotation_number.toLowerCase().includes(search.toLowerCase()) ||
    q.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm({ client_id:"", date:new Date().toISOString().slice(0,10), valid_until:"", status:"draft", notes:"", discount:0, items:[{ product_id:"", description:"", quantity:1, unit_price:0, tax_rate:10, total:0 }] });
    setEditId(null); setModal("form");
  };

  const openEdit = async id => {
    const { data } = await axios.get(`/api/quotations/${id}`);
    setForm({ client_id:data.client_id, date:data.date, valid_until:data.valid_until||"", status:data.status, notes:data.notes||"", discount:data.discount||0, items:data.items.map(it=>({...it})) });
    setEditId(id); setModal("form");
  };

  const openView = async id => {
    const { data } = await axios.get(`/api/quotations/${id}`);
    setViewData(data); setModal("view");
  };

  const addItem = () => setForm(f=>({...f, items:[...f.items,{product_id:"",description:"",quantity:1,unit_price:0,tax_rate:10,total:0}]}));
  const removeItem = i => setForm(f=>({...f, items:f.items.filter((_,idx)=>idx!==i)}));
  const updateItem = (i, field, val) => {
    setForm(f=>{
      const items=[...f.items]; items[i]={...items[i],[field]:val};
      if(field==="product_id" && val){
        const p=products.find(x=>x.id===parseInt(val));
        if(p){ items[i].description=p.name; items[i].unit_price=p.unit_price; items[i].tax_rate=p.tax_rate; }
      }
      items[i].total=items[i].quantity*items[i].unit_price*(1+items[i].tax_rate/100);
      return {...f,items};
    });
  };

  const calcTotals = () => {
    const subtotal = form.items.reduce((s,it)=>s+it.quantity*it.unit_price,0);
    const tax = form.items.reduce((s,it)=>s+it.quantity*it.unit_price*(it.tax_rate/100),0);
    const total = subtotal + tax - (form.discount||0);
    return { subtotal, tax, total };
  };

  const handleSave = async e => {
    e.preventDefault(); setLoading(true);
    try {
      if (editId) { await axios.put(`/api/quotations/${editId}`,form); toast.success("Quotation updated"); }
      else { await axios.post("/api/quotations",form); toast.success("Quotation created"); }
      setModal(null); load();
    } catch(err){ toast.error("Error saving"); }
    finally{ setLoading(false); }
  };

  const handleConvert = async id => {
    if(!confirm("Convert to Invoice?")) return;
    const { data } = await axios.post(`/api/quotations/${id}/convert`);
    toast.success(`Invoice ${data.invoice_number} created!`); load();
  };

  const handleDelete = async id => {
    if(!confirm("Delete quotation?")) return;
    await axios.delete(`/api/quotations/${id}`); toast.success("Deleted"); load();
  };

  const exportPDF = (q) => {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.text("QUOTATION", 14, 20);
    doc.setFontSize(11); doc.text(`${q.quotation_number}`, 14, 30);
    doc.text(`Date: ${q.date}`, 14, 38);
    doc.text(`Valid Until: ${q.valid_until||"—"}`, 14, 46);
    doc.text(`Client: ${q.client_name}`, 14, 54);
    autoTable(doc, {
      startY: 65,
      head:[["Description","Qty","Unit Price","Tax","Total"]],
      body:(q.items||[]).map(it=>[it.description,it.quantity,fmt(it.unit_price),`${it.tax_rate}%`,fmt(it.total)]),
      foot:[["","","","Subtotal",fmt(q.subtotal)],["","","","Tax",fmt(q.tax_amount)],["","","","Total",fmt(q.total)]],
    });
    doc.save(`${q.quotation_number}.pdf`);
  };

  const { subtotal, tax, total } = calcTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800">Quotations</h1><p className="text-slate-500 text-sm">{quotes.length} total quotations</p></div>
        <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4"/> New Quotation</button>
      </div>

      <div className="card p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input className="input pl-9" placeholder="Search quotations..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-th">Number</th><th className="table-th">Client</th><th className="table-th">Date</th>
                <th className="table-th">Valid Until</th><th className="table-th">Total</th><th className="table-th">Status</th><th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(q=>(
                <tr key={q.id} className="hover:bg-slate-50">
                  <td className="table-td font-semibold text-primary-600">{q.quotation_number}</td>
                  <td className="table-td">{q.client_name}</td>
                  <td className="table-td text-slate-500">{q.date}</td>
                  <td className="table-td text-slate-500">{q.valid_until||"—"}</td>
                  <td className="table-td font-semibold">{fmt(q.total)}</td>
                  <td className="table-td"><span className={`badge ${STATUS_STYLES[q.status]}`}>{q.status}</span></td>
                  <td className="table-td text-right">
                    <div className="flex gap-1 justify-end">
                      <button onClick={()=>openView(q.id)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="View"><Eye className="w-3.5 h-3.5"/></button>
                      <button onClick={()=>exportPDF(q)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="PDF"><Download className="w-3.5 h-3.5"/></button>
                      <button onClick={()=>openEdit(q.id)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Edit"><Pencil className="w-3.5 h-3.5"/></button>
                      {q.status!=="accepted" && <button onClick={()=>handleConvert(q.id)} className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600" title="Convert to Invoice"><ArrowRight className="w-3.5 h-3.5"/></button>}
                      {["admin","manager"].includes(user?.role) && <button onClick={()=>handleDelete(q.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400" title="Delete"><Trash2 className="w-3.5 h-3.5"/></button>}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan="7" className="py-16 text-center text-slate-400"><FileText className="w-12 h-12 mx-auto mb-2 opacity-30"/><p>No quotations</p></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal==="form" && (
        <Modal title={editId?"Edit Quotation":"New Quotation"} onClose={()=>setModal(null)}>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Client *</label>
                <select className="input" value={form.client_id} onChange={e=>setForm({...form,client_id:e.target.value})} required>
                  <option value="">— Select Client —</option>
                  {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="label">Date *</label><input className="input" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required/></div>
              <div><label className="label">Valid Until</label><input className="input" type="date" value={form.valid_until} onChange={e=>setForm({...form,valid_until:e.target.value})}/></div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                  {STATUS_LIST.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="label">Discount ($)</label><input className="input" type="number" step="0.01" value={form.discount} onChange={e=>setForm({...form,discount:parseFloat(e.target.value)||0})}/></div>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-700">Line Items</h3>
                <button type="button" onClick={addItem} className="btn-secondary py-1 text-xs"><Plus className="w-3.5 h-3.5"/> Add Row</button>
              </div>
              <div className="space-y-2">
                {form.items.map((it,i)=>(
                  <div key={i} className="grid grid-cols-12 gap-2 items-start bg-slate-50 rounded-lg p-2">
                    <div className="col-span-4">
                      <select className="input text-xs py-1.5" value={it.product_id} onChange={e=>updateItem(i,"product_id",e.target.value)}>
                        <option value="">Custom</option>
                        {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-4"><input className="input text-xs py-1.5" placeholder="Description" value={it.description} onChange={e=>updateItem(i,"description",e.target.value)} required/></div>
                    <div className="col-span-1"><input className="input text-xs py-1.5" type="number" min="0.01" step="0.01" placeholder="Qty" value={it.quantity} onChange={e=>updateItem(i,"quantity",parseFloat(e.target.value)||1)}/></div>
                    <div className="col-span-2"><input className="input text-xs py-1.5" type="number" step="0.01" placeholder="Price" value={it.unit_price} onChange={e=>updateItem(i,"unit_price",parseFloat(e.target.value)||0)}/></div>
                    <div className="col-span-1 flex items-start pt-1"><button type="button" onClick={()=>removeItem(i)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4"/></button></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-60 space-y-1 text-sm">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-between text-slate-600"><span>Tax</span><span>{fmt(tax)}</span></div>
                {form.discount>0 && <div className="flex justify-between text-red-500"><span>Discount</span><span>-{fmt(form.discount)}</span></div>}
                <div className="flex justify-between font-bold text-slate-800 text-base border-t pt-1"><span>Total</span><span>{fmt(total)}</span></div>
              </div>
            </div>

            <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={()=>setModal(null)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary">{loading?"Saving...":"Save Quotation"}</button>
            </div>
          </form>
        </Modal>
      )}

      {modal==="view" && viewData && (
        <Modal title={viewData.quotation_number} onClose={()=>setModal(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Client:</span> <strong>{viewData.client_name}</strong></div>
              <div><span className="text-slate-500">Status:</span> <span className={`badge ${STATUS_STYLES[viewData.status]}`}>{viewData.status}</span></div>
              <div><span className="text-slate-500">Date:</span> {viewData.date}</div>
              <div><span className="text-slate-500">Valid Until:</span> {viewData.valid_until||"—"}</div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50"><tr><th className="table-th">Description</th><th className="table-th">Qty</th><th className="table-th">Price</th><th className="table-th">Tax</th><th className="table-th text-right">Total</th></tr></thead>
              <tbody>{(viewData.items||[]).map((it,i)=><tr key={i} className="border-b"><td className="table-td">{it.description}</td><td className="table-td">{it.quantity}</td><td className="table-td">{fmt(it.unit_price)}</td><td className="table-td">{it.tax_rate}%</td><td className="table-td text-right">{fmt(it.total)}</td></tr>)}</tbody>
            </table>
            <div className="flex justify-end"><div className="w-52 space-y-1 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{fmt(viewData.subtotal)}</span></div><div className="flex justify-between"><span>Tax</span><span>{fmt(viewData.tax_amount)}</span></div><div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>{fmt(viewData.total)}</span></div></div></div>
            {viewData.notes && <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">{viewData.notes}</p>}
            <div className="flex gap-3 justify-end">
              <button onClick={()=>exportPDF(viewData)} className="btn-secondary"><Download className="w-4 h-4"/>Export PDF</button>
              {viewData.status!=="accepted" && <button onClick={()=>{setModal(null);handleConvert(viewData.id);}} className="btn-success"><ArrowRight className="w-4 h-4"/>Convert to Invoice</button>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
