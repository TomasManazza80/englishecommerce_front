

export default function PagoExitoso() {
    return (
        // CONTENEDOR PRINCIPAL - Fondo blanco, sombra sutil, fuente base
        <div className=" w-full max-w-2xl mx-auto bg-white p-8 md:p-12 border border-black/10 shadow-[0_15px_50px_-12px_rgba(0,0,0,0.1)] rounded-xl relative overflow-hidden font-medium text-gray-800">

            {/* DECORACIÓN TÉCNICA - Línea Verde de Éxito */}
            <div className=" mt-[120px] absolute top-0 left-0 w-full h-1.5 bg-[#00E676]"></div>

            {/* HEADER */}
            <header className="  mt-[100px] text-center mb-10">
                <div className="inline-block bg-black px-6 py-3 shadow-[4px_4px_0px_#00E676] mb-4">
                    <h1 className=" mt-[10px] font-black tracking-tighter text-white uppercase text-2xl md:text-3xl">
                        Pago Confirmado
                    </h1>
                </div>
                <p className="font-mono text-sm text-gray-500 uppercase tracking-widest">
                    Status: <span className="text-[#00E676] font-bold">SUCCESSFUL_TRANSACTION</span>
                </p>
            </header>

            {/* CUERPO DE PASOS */}
            <div className="flex flex-col gap-6">

                {/* PASO 1 */}
                <div className="bg-white/80 backdrop-blur-md border border-black p-6 rounded relative overflow-hidden group hover:border-[#00E676] transition-colors duration-300">
                    <span className="absolute top-2 right-4 text-6xl font-black text-black opacity-[20%] pointer-events-none">
                        01
                    </span>

                    <h2 className="font-black tracking-tighter text-black uppercase text-lg mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#00E676] inline-block shadow-[0_0_8px_#00E676]"></span>
                        Verifica tu WhatsApp
                    </h2>

                    <p className="text-sm md:text-base leading-relaxed mb-5">
                        Ahora que tu pago se realizó correctamente, debes mirar en tu WhatsApp el mensaje que te enviamos.
                    </p>

                    {/* ALERTA TÉCNICA EN JETBRAINS MONO - Mantiene el Naranja de la marca para acción/soporte */}
                    <div className="bg-gray-50 border-l-4 border-[#FF6600] p-4 font-mono text-xs md:text-sm">
                        <p className="text-gray-600 mb-2">
                            <strong className="text-black">[SOPORTE]:</strong> Si no recibiste nada, es posible que hayas escrito mal tu número. Comunícate al:
                        </p>
                        <p className="text-[#FF6600] font-bold text-lg md:text-xl">
                            3425937358
                        </p>
                    </div>
                </div>

                {/* PASO 2 */}
                <div className="bg-white/80 backdrop-blur-md border border-black p-6 rounded relative overflow-hidden group hover:border-[#00E676] transition-colors duration-300">
                    <span className="absolute top-2 right-4 text-6xl font-black text-black opacity-[20%] pointer-events-none">
                        02
                    </span>

                    <h2 className="font-black tracking-tighter text-black uppercase text-lg mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#00E676] inline-block shadow-[0_0_8px_#00E676]"></span>
                        Datos de Compra
                    </h2>

                    <p className="text-sm md:text-base leading-relaxed">
                        Si el mensaje es el correcto vas a poder ver todos los datos de tu compra. Solo deberás esperar a que te llegue o pasar por el local a retirarlo.
                    </p>
                </div>

            </div>

            {/* FOOTER / BOTÓN FINAL - Mantiene el Naranja principal */}
            <div className="mt-10 text-center">
                <button className="bg-[#FF6600] text-white font-black tracking-widest uppercase py-4 px-10 text-sm hover:bg-black hover:shadow-[0_10px_20px_rgba(255,102,0,0.3)] transition-all duration-300 rounded-sm">
                    Entendido
                </button>
            </div>

        </div>
    );
}