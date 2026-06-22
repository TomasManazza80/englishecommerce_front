import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Copy, Download, UploadCloud, Check, FileText, Hash, Truck } from 'lucide-react';

const conversorExcelAJson = () => {
  const [remitoData, setRemitoData] = useState(null);
  const [fileName, setFileName] = useState("");
  const [copied, setCopied] = useState(false);
  
  // Estados para el encabezado del Remito
  const [remitoId, setRemitoId] = useState(`REM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [proveedorGeneral, setProveedorGeneral] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  const fileInputRef = useRef(null);

  const cleanNum = (val) => {
    if (val === undefined || val === null || val === "") return 0;
    if (typeof val === 'number') return val;
    const cleaned = val.toString().replace(/[^0-9.-]+/g, "");
    return cleaned ? Number(cleaned) : 0;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

      const productsMap = {};
      let granTotal = 0;

      rawData.forEach((row) => {
        const nombre = row.nombre?.toString().trim();
        if (!nombre) return;

        const costo = cleanNum(row["variantes.costoDeCompra"] || row.precioCompra);
        const stock = cleanNum(row["variantes.stock"]);
        const pVenta = cleanNum(row["variantes.precioAlPublico"] || row.precioVenta);
        
        // Sumamos al total del remito: Costo * Cantidad
        granTotal += (costo * stock);

        if (!productsMap[nombre]) {
          productsMap[nombre] = {
            nombre: nombre,
            marca: row.marca || "Genérica",
            categoria: row.categoria || "Varios",
            descripcion: row.descripcion || "",
            imagenes: row.imagenes ? row.imagenes.split(',').map(img => img.trim()) : [],
            variantes: [],
            cantidad: 0,
            costoCompra: costo,
            alertaStock: cleanNum(row.alerta) || 5,
            proveedorOrigen: row.proveedor || proveedorGeneral
          };
        }

        productsMap[nombre].variantes.push({
          color: row.color || "Único",
          almacenamiento: row.almacenamiento || "N/A",
          stock: stock,
          costoDeCompra: costo,
          precioAlPublico: pVenta,
          precioMayorista: cleanNum(row["variantes.precioMayorista"] || row.precioMayorista),
          precioRevendedor: cleanNum(row["variantes.precioRevendedor"] || row.precioRevendedor)
        });

        productsMap[nombre].cantidad += stock;
      });

      setRemitoData({
        RemitoId: remitoId,
        proveedor: proveedorGeneral || "Proveedor No Definido",
        fechaRecepcion: fecha,
        total: granTotal,
        productos: Object.values(productsMap)
      });
    };
    reader.readAsBinaryString(file);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(remitoData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 font-['Poppins']">
      <div className="max-w-5xl mx-auto">
        
        <header className="mb-12 text-center">
          <h1 className="text-6xl font-['Montserrat'] font-[900] tracking-tighter uppercase leading-none">
            SISTEMA <span className="text-orange-500">REMITOS</span>
          </h1>
          <p className="text-zinc-500 font-['JetBrains_Mono'] text-[10px] mt-4 tracking-[0.4em] uppercase">
            FEDECELL Inventory Management
          </p>
        </header>

        {/* FORMULARIO DE REMITO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl">
            <label className="flex items-center gap-2 text-[10px] font-bold text-orange-500 uppercase mb-2 tracking-widest">
              <Hash size={12} /> ID Remito
            </label>
            <input 
              type="text" 
              value={remitoId} 
              onChange={(e) => setRemitoId(e.target.value)}
              className="w-full bg-transparent border-none text-white focus:ring-0 font-bold p-0"
            />
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl">
            <label className="flex items-center gap-2 text-[10px] font-bold text-orange-500 uppercase mb-2 tracking-widest">
              <Truck size={12} /> Proveedor
            </label>
            <input 
              type="text" 
              placeholder="Ej: Distribuidora Tech"
              value={proveedorGeneral} 
              onChange={(e) => setProveedorGeneral(e.target.value)}
              className="w-full bg-transparent border-none text-white focus:ring-0 font-bold p-0 placeholder:text-zinc-700"
            />
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl">
            <label className="flex items-center gap-2 text-[10px] font-bold text-orange-500 uppercase mb-2 tracking-widest">
               Fecha Recepción
            </label>
            <input 
              type="date" 
              value={fecha} 
              onChange={(e) => setFecha(e.target.value)}
              className="w-full bg-transparent border-none text-white focus:ring-0 font-bold p-0 [color-scheme:dark]"
            />
          </div>
        </div>

        {/* DROPZONE */}
        <div 
          onClick={() => fileInputRef.current.click()}
          className="group relative border border-zinc-800 rounded-3xl p-14 text-center cursor-pointer transition-all hover:border-orange-500 bg-zinc-900/20 backdrop-blur-xl mb-8"
        >
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
          <div className="flex flex-col items-center gap-4">
            <UploadCloud size={40} className="text-orange-500 group-hover:scale-110 transition-transform" />
            <p className="text-lg font-bold uppercase tracking-tighter">
              {fileName ? fileName : "Cargar Excel de Mercadería"}
            </p>
          </div>
        </div>

        {remitoData && (
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button onClick={copyToClipboard} className="bg-white text-black font-black py-5 rounded-2xl uppercase text-[11px] tracking-widest hover:bg-orange-500 hover:text-white transition-all">
                {copied ? <Check size={18} className="mx-auto" /> : "Copiar Remito JSON"}
              </button>
              <button onClick={() => {
                const blob = new Blob([JSON.stringify(remitoData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${remitoId}.json`;
                a.click();
              }} className="bg-orange-600 text-white font-black py-5 rounded-2xl uppercase text-[11px] tracking-widest hover:shadow-[0_0_30px_rgba(234,88,12,0.3)] transition-all">
                Descargar Archivo
              </button>
            </div>

            <div className="border border-zinc-800 rounded-3xl bg-[#080808] overflow-hidden">
              <div className="px-8 py-4 bg-zinc-900/40 border-b border-zinc-800 flex justify-between items-center">
                <span className="text-[10px] font-['JetBrains_Mono'] text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={12} /> Data_Structure_Output
                </span>
                <span className="text-orange-500 font-bold text-xs">
                  Total Remito: ${remitoData.total.toLocaleString()}
                </span>
              </div>
              <div className="p-8">
                <pre className="text-[12px] font-['JetBrains_Mono'] text-orange-200/60 overflow-auto max-h-[400px] leading-relaxed scrollbar-hide">
                  {JSON.stringify(remitoData, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default conversorExcelAJson;