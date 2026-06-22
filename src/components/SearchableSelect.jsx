import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiChevronDown, FiX } from 'react-icons/fi';

const SearchableSelect = ({
    options = [],
    value = '',
    onChange,
    placeholder = "Seleccionar...",
    label = "",
    styles = {}
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);

    // Filter options based on search term
    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={containerRef}>
            {label && <label className={styles.label}>{label}</label>}

            <div
                className={`${styles.input} flex items-center justify-between cursor-pointer group hover:border-[#ff8c00]/50`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={value ? 'text-white' : 'text-zinc-600'}>
                    {value || placeholder}
                </span>
                <FiChevronDown className={`text-zinc-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-[100] top-full left-0 w-full mt-1 bg-[#0a0a0a] border border-zinc-800 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 border-b border-zinc-900 bg-white/[0.02] flex items-center gap-2">
                        <FiSearch className="text-zinc-600" size={14} />
                        <input
                            autoFocus
                            type="text"
                            className="bg-transparent border-none outline-none text-white text-sm w-full font-['Inter']"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                        {searchTerm && (
                            <FiX
                                className="text-zinc-600 hover:text-white cursor-pointer"
                                size={14}
                                onClick={(e) => { e.stopPropagation(); setSearchTerm(''); }}
                            />
                        )}
                    </div>

                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt, i) => (
                                <div
                                    key={i}
                                    className={`px-4 py-3 text-sm cursor-pointer transition-colors hover:bg-[#ff8c00] hover:text-black font-['Inter'] ${value === opt ? 'bg-[#ff8c00]/10 text-[#ff8c00]' : 'text-zinc-300'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChange(opt);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                >
                                    {opt.toUpperCase()}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-6 text-center text-zinc-700 text-[10px] uppercase tracking-widest italic">
                                Sin resultados
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
