import React from 'react';
import { TrashIcon, BanknotesIcon, CalendarIcon } from '@heroicons/react/24/solid';

const DebtCard = ({ debt, onPay, onDelete }) => {
    // Cálculo de progreso técnico
    const porcentajePagado = Math.min((debt.montoPagado / debt.montoTotal) * 100, 100);
    const montoRestante = debt.montoTotal - debt.montoPagado;

    return (
        <div className="bg-[#0A0A0A] border border-white/5 p-10 rounded-2xl shadow-2xl group hover:border-orange-500/30 transition-all">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h4 className="font-['Montserrat'] font-[900] text-2xl text-white uppercase tracking-tighter">
                        {debt.descripcion}
                    </h4>
                    <p className="font-['JetBrains_Mono'] text-[10px] text-orange-500 mt-2 tracking-[0.3em]">
                        ACREEDOR: {debt.acreedor.toUpperCase()}
                    </p>
                </div>
                <div className="p-4 bg-orange-500/5 rounded-xl border border-orange-500/10">
                    <BanknotesIcon className="w-6 h-6 text-orange-500" />
                </div>
            </div>

            {/* BARRA DE PROGRESO FEDECELL 2.0 */}
            <div className="space-y-4 mb-10">
                <div className="flex justify-between items-end">
                    <span className="font-['JetBrains_Mono'] text-[10px] text-zinc-500 uppercase">Estado_de_Amortización</span>
                    <span className="font-['JetBrains_Mono'] text-sm font-black text-orange-500">{porcentajePagado.toFixed(1)}%</span>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
                    <div
                        className="h-full bg-orange-600 rounded-full shadow-[0_0_15px_rgba(255,140,0,0.4)] transition-all duration-1000"
                        style={{ width: `${porcentajePagado}%` }}
                    />
                </div>
            </div>

            {/* CIFRAS TÉCNICAS */}
            <div className="grid grid-cols-2 gap-8 py-6 border-y border-white/5">
                <div>
                    <p className="font-['JetBrains_Mono'] text-[9px] text-zinc-600 uppercase mb-1">Monto_Total</p>
                    <p className="font-['Montserrat'] font-[900] text-lg text-white">
                        ${parseFloat(debt.montoTotal).toLocaleString('es-AR')}
                    </p>
                </div>
                <div className="text-right">
                    <p className="font-['JetBrains_Mono'] text-[9px] text-orange-500 uppercase mb-1">Pendiente_Restante</p>
                    <p className="font-['Montserrat'] font-[900] text-xl text-orange-500">
                        ${montoRestante.toLocaleString('es-AR')}
                    </p>
                </div>
            </div>

            {/* ACCIONES */}
            <div className="mt-8 flex gap-4">
                <button
                    onClick={() => onPay(debt)}
                    className="flex-1 bg-orange-600 hover:bg-orange-500 text-black font-['Montserrat'] font-[900] py-4 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-orange-900/20"
                >
                    Registrar_Pago
                </button>
                <button
                    onClick={() => onDelete(debt.DebtId)}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-red-500/10 hover:border-red-500/50 transition-all text-zinc-600 hover:text-red-500"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default DebtCard;