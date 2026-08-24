import React from 'react';
import { TrashIcon, BanknotesIcon } from '@heroicons/react/24/solid';

const DebtCard = ({ debt, onPay, onDelete }) => {
    const porcentajePagado = Math.min((debt.montoPagado / debt.montoTotal) * 100, 100);
    const montoRestante = debt.montoTotal - debt.montoPagado;

    return (
        <div className="bg-white border border-[#e6e8ea] p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all font-sans text-[#191c1e]">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h4 className="font-bold text-xl text-[#191c1e] uppercase tracking-tight">
                        {debt.descripcion}
                    </h4>
                    <p className="text-xs font-semibold text-[#0058be] uppercase mt-1 tracking-wider">
                        Acreedor: {debt.acreedor}
                    </p>
                </div>
                <div className="p-3 bg-[#e8f1ff] rounded-xl border border-[#0058be]/20 text-[#0058be]">
                    <BanknotesIcon className="w-6 h-6" />
                </div>
            </div>

            {/* BARRA DE PROGRESO */}
            <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-[#424754] uppercase tracking-wider">Amortizado</span>
                    <span className="font-bold text-[#0058be]">{porcentajePagado.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#f2f4f6] rounded-full overflow-hidden border border-[#e6e8ea]">
                    <div
                        className="h-full bg-[#0058be] rounded-full transition-all duration-700"
                        style={{ width: `${porcentajePagado}%` }}
                    />
                </div>
            </div>

            {/* CIFRAS TÉCNICAS */}
            <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#e6e8ea] mb-6">
                <div>
                    <p className="text-[10px] text-[#727785] font-medium uppercase tracking-wider mb-0.5">Monto Total</p>
                    <p className="font-bold text-base text-[#191c1e]">
                        ${parseFloat(debt.montoTotal).toLocaleString('es-AR')}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-[#ba1a1a] font-medium uppercase tracking-wider mb-0.5">Pendiente</p>
                    <p className="font-bold text-lg text-[#ba1a1a]">
                        ${montoRestante.toLocaleString('es-AR')}
                    </p>
                </div>
            </div>

            {/* ACCIONES */}
            <div className="flex gap-3">
                <button
                    onClick={() => onPay(debt)}
                    className="flex-1 bg-[#0058be] hover:bg-[#004395] text-white font-semibold py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm"
                >
                    Registrar Pago
                </button>
                <button
                    onClick={() => onDelete(debt.DebtId)}
                    className="p-3 bg-[#f2f4f6] border border-[#c2c6d6] rounded-xl hover:bg-[#ffdad6] hover:border-[#ba1a1a]/30 transition-all text-[#727785] hover:text-[#ba1a1a]"
                    title="Eliminar Deuda"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default DebtCard;