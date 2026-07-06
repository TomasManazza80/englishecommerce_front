import axios from "axios";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Outlet, Link, useSearchParams } from "react-router-dom";
import { FiX, FiSearch, FiDollarSign, FiFilter, FiPlusCircle } from "react-icons/fi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const API_URL = import.meta.env.VITE_API_URL;

const optimizeImage = (url) => {
    if (!url) return url;
    if (url.includes('imagekit.io')) {
        return `${url}?tr=w-500,f-webp,q-80`;
    }
    if (url.includes('cloudinary.com')) {
        return url.replace('/upload/', '/upload/w_500,f_webp,q_auto/');
    }
    return url;
};

// =================================================================
// ESTILOS AI SPEAKING PRACTICE: MODERN SAAS
// =================================================================
const AiStyles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');

.ai-font { font-family: 'Inter', sans-serif; }

.ai-card {
    background-color: #ffffff;
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    border: 1px solid #f0dff3;
}

.ai-card:hover {
    box-shadow: 0 25px 50px -12px rgba(178, 115, 194, 0.25);
    transform: translateY(-8px);
}

.ai-gradient-btn {
    background: #b273c2;
    transition: all 0.3s ease;
}

.ai-gradient-btn:hover {
    background: #9d5fb0;
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(178, 115, 194, 0.3);
}

.ai-input {
    background-color: #ffffff;
    border: 1px solid #f0dff3;
    color: #1d1d1d;
    transition: all 0.3s ease;
}

.ai-input:focus {
    border-color: #b273c2;
    outline: none;
    box-shadow: 0 0 0 4px rgba(178, 115, 194, 0.1);
}

.ai-category {
    color: #6b7280;
    background-color: #ffffff;
    border: 1px solid #f0dff3;
    border-radius: 9999px;
    padding: 0.5rem 1.2rem;
    transition: all 0.3s ease;
}

.ai-category.active {
    color: #ffffff;
    background-color: #b273c2;
    border-color: #b273c2;
    box-shadow: 0 4px 10px rgba(178, 115, 194, 0.3);
}

.ai-category:hover:not(.active) {
    background-color: #f6edf8;
    color: #b273c2;
}

.no-scrollbar::-webkit-scrollbar {
    display: none;
}
.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
`;

const Products = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [category, setCategory] = useState("");
    const [brand, setBrand] = useState("");
    const [sortOption, setSortOption] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [likedProducts, setLikedProducts] = useState([]);
    const [searchParams] = useSearchParams();
    
    const gridRef = useRef(null);

    // Cargar likes desde localStorage
    useEffect(() => {
        const savedLikes = JSON.parse(localStorage.getItem('ai_liked_products')) || [];
        setLikedProducts(savedLikes);
    }, []);

    const handleToggleLike = async (e, productId) => {
        e.preventDefault();
        e.stopPropagation();

        const isLiked = likedProducts.includes(productId);
        let updatedLikes;

        if (isLiked) {
            updatedLikes = likedProducts.filter(id => id !== productId);
        } else {
            updatedLikes = [...likedProducts, productId];
        }

        setLikedProducts(updatedLikes);
        localStorage.setItem('ai_liked_products', JSON.stringify(updatedLikes));

        try {
            await axios.patch(`${API_URL}/products/${productId}/like`, { isIncrement: !isLiked });
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    };

    useEffect(() => {
        const categoryParam = searchParams.get('category');
        if (categoryParam) {
            setCategory(categoryParam);
            setShowFilters(true);
        }
    }, [searchParams]);
    
    const availableCategories = [...new Set(products.map(p => p.categoria))].filter(Boolean).sort();
    const availableBrands = [...new Set(products.map(p => p.marca))].filter(Boolean).sort();

    const MAX_PREVIEW_RESULTS = 10;
    const previewProducts = search.length > 0 ? filteredProducts.slice(0, MAX_PREVIEW_RESULTS) : [];

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchProducts = useCallback(async (currentPage, searchQuery) => {
        try {
            if (currentPage === 1) setIsLoading(true);
            else setIsLoadingMore(true);

            const limit = 20;
            const url = `${API_URL}/products?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(searchQuery || '')}`;
            const { data } = await axios.get(url);

            const fetchedProducts = data.products || data;

            if (currentPage === 1) {
                setProducts(fetchedProducts);
            } else {
                setProducts(prev => [...prev, ...fetchedProducts]);
            }

            if (data.totalPages !== undefined) {
                setTotalPages(data.totalPages);
                setHasMore(currentPage < data.totalPages);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts(page, debouncedSearch);
    }, [page, debouncedSearch, fetchProducts]);

    useEffect(() => {
        let filtered = products;

        if (category) filtered = filtered.filter(item => item.categoria.toLowerCase() === category.toLowerCase());
        if (brand) filtered = filtered.filter(item => item.marca && item.marca.toLowerCase() === brand.toLowerCase());
        if (minPrice) filtered = filtered.filter(item => {
            const stockVariant = item.variantes?.find(v => Number(v.stock) > 0) || (item.variantes?.length > 0 ? item.variantes[0] : null);
            const price = stockVariant?.precioAlPublico || item.precioVenta || 0;
            return parseFloat(price) >= parseFloat(minPrice);
        });
        if (maxPrice) filtered = filtered.filter(item => {
            const stockVariant = item.variantes?.find(v => Number(v.stock) > 0) || (item.variantes?.length > 0 ? item.variantes[0] : null);
            const price = stockVariant?.precioAlPublico || item.precioVenta || 0;
            return parseFloat(price) <= parseFloat(maxPrice);
        });

        if (sortOption === "price-asc") {
            filtered = [...filtered].sort((a, b) => {
                const priceA = a.variantes?.find(v => Number(v.stock) > 0)?.precioAlPublico || a.precioVenta || 0;
                const priceB = b.variantes?.find(v => Number(v.stock) > 0)?.precioAlPublico || b.precioVenta || 0;
                return parseFloat(priceA) - parseFloat(priceB);
            });
        }
        if (sortOption === "price-desc") {
            filtered = [...filtered].sort((a, b) => {
                const priceA = a.variantes?.find(v => Number(v.stock) > 0)?.precioAlPublico || a.precioVenta || 0;
                const priceB = b.variantes?.find(v => Number(v.stock) > 0)?.precioAlPublico || b.precioVenta || 0;
                return parseFloat(priceB) - parseFloat(priceA);
            });
        }

        setFilteredProducts(filtered);
    }, [search, category, brand, products, sortOption, minPrice, maxPrice, debouncedSearch]);

    // GSAP Animation for grid elements
    useGSAP(() => {
        if (!isLoading && filteredProducts.length > 0) {
            gsap.fromTo(
                ".gsap-card",
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: "back.out(1.7)",
                    willChange: "transform, opacity",
                    scrollTrigger: {
                        trigger: gridRef.current,
                        start: "top 85%",
                        toggleActions: "play none none none"
                    }
                }
            );
        }
    }, { scope: gridRef, dependencies: [isLoading, filteredProducts] });

    const formatPrice = (price) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price).replace('ARS', '$');

    const resetFilters = () => {
        setSearch(""); setCategory(""); setBrand(""); setSortOption(""); setMinPrice(""); setMaxPrice("");
    };

    return (
        <div className="min-h-screen bg-[#f8f3f6] text-[#1d1d1d] ai-font pb-24 overflow-x-hidden pt-[80px]">
            <style dangerouslySetInnerHTML={{ __html: AiStyles }} />
            <Outlet />

            <div>
                {/* HEADER SECTION */}
                <div className="pt-16 md:pt-24 pb-12 text-center px-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                        <div className="inline-block bg-[#f6edf8] text-[#b273c2] px-4 py-1.5 rounded-full text-xs font-bold tracking-widest mb-4 shadow-sm border border-[#f0dff3] uppercase">
                            Explore Library
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-[#1d1d1d] tracking-tight leading-tight">
                            PRACTICE <span className="text-[#b273c2]">SCENARIOS</span>
                        </h1>
                        <p className="mt-4 text-gray-500 font-medium max-w-xl mx-auto">
                            Choose from dozens of real-world situations and improve your English fluency with our AI tutor.
                        </p>
                    </motion.div>
                </div>

                <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-24">
                    {/* BARRA DE CONTROL Y BÚSQUEDA */}
                    <div className="bg-white p-6 md:p-10 mb-10 md:mb-16 rounded-[30px] shadow-lg border border-[#f0dff3] relative z-[100]">
                        <div className="flex flex-col gap-6 md:gap-8">
                            <div className="flex flex-col lg:flex-row gap-4 md:gap-6 items-stretch lg:items-center">
                                <div className="flex gap-4 w-full lg:w-auto flex-grow relative z-[100]">
                                    <div className="relative flex-grow group z-[100]">
                                        <FiSearch className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-[#b273c2] text-sm md:text-lg z-20" />
                                        <input
                                            type="text"
                                            placeholder="Search scenarios or topics..."
                                            className="ai-input w-full pl-10 md:pl-14 pr-4 md:pr-6 py-3 md:py-4 rounded-[15px] text-[13px] md:text-[15px] font-medium relative z-10"
                                            onChange={(e) => setSearch(e.target.value)}
                                            value={search}
                                        />

                                        {/* RESULTADOS DESPLEGABLES */}
                                        <AnimatePresence>
                                            {search.trim() !== "" && previewProducts.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#f0dff3] shadow-2xl max-h-72 md:max-h-96 overflow-y-auto z-[110] rounded-[20px] p-2"
                                                >
                                                    {previewProducts.map((prod) => {
                                                        const totalStock = prod.variantes?.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0) || 0;
                                                        const isAvailable = totalStock > 0;
                                                        return (
                                                            <Link to={`/product/${prod.id}`} key={prod.id} className="relative flex items-center gap-3 md:gap-5 p-3 hover:bg-[#f6edf8] rounded-[15px] transition-colors border-b border-transparent group min-w-0 pr-12 md:pr-16">
                                                                <div className="w-12 h-12 md:w-16 md:h-16 flex-shrink-0 overflow-hidden rounded-2xl bg-gray-50 border border-[#f0dff3]">
                                                                    <img src={optimizeImage(prod.imagenes?.[0] || prod.image)} alt={prod.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                </div>
                                                                <div className="text-left flex-1 min-w-0">
                                                                    <h4 className="text-[12px] md:text-[14px] font-bold text-[#1d1d1d] truncate mb-0.5">{prod.nombre}</h4>
                                                                    <p className="text-[10px] md:text-[11px] text-gray-500 font-medium uppercase mb-1 truncate">{prod.marca || 'AI Topic'}</p>
                                                                    {prod.variantes && prod.variantes.some(v => Number(v.precioAlPublico) > 0) && (
                                                                        <div className="text-[12px] md:text-[13px] text-[#b273c2] font-black">
                                                                            ${Math.min(...prod.variantes.map(v => Number(v.precioAlPublico) || 0).filter(p => p > 0)).toLocaleString('es-AR')}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {isAvailable ? (
                                                                    <div className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-[#b273c2] text-white rounded-full flex justify-center items-center shadow-md hover:bg-[#9d5fb0] transition-all flex-shrink-0 z-10">
                                                                        <FontAwesomeIcon icon={faMicrophone} className="text-[10px] md:text-xs" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-gray-100 text-gray-400 rounded-full flex justify-center items-center disabled z-10 opacity-60">
                                                                        <FontAwesomeIcon icon={faMicrophone} className="text-[10px] md:text-xs" />
                                                                    </div>
                                                                )}
                                                            </Link>
                                                        )
                                                    })}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <button
                                        className="lg:hidden px-4 md:px-5 bg-white border border-[#f0dff3] text-[#b273c2] rounded-[15px] flex items-center justify-center hover:bg-[#f6edf8] transition-colors"
                                        onClick={() => setShowFilters(!showFilters)}
                                    >
                                        <FiFilter />
                                    </button>
                                </div>

                                <select
                                    className={`${showFilters ? 'block' : 'hidden'} lg:block ai-input px-4 md:px-6 py-3 md:py-4 rounded-[15px] font-bold text-[11px] md:text-[12px] w-full lg:w-auto min-w-[200px] cursor-pointer relative z-10 uppercase`}
                                    onChange={(e) => setSortOption(e.target.value)}
                                    value={sortOption}
                                >
                                    <option value="">Sort By</option>
                                    <option value="price-asc">Difficulty: Easy to Hard</option>
                                    <option value="price-desc">Difficulty: Hard to Easy</option>
                                </select>
                            </div>

                            {/* FILTROS ADICIONALES */}
                            <div className={`${showFilters ? 'flex' : 'hidden'} lg:flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-6 pt-4 md:pt-6 border-t border-[#f0dff3]`}>
                                <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-start">
                                    <span className="font-bold text-[11px] text-gray-500 uppercase hidden md:inline">PRICE</span>
                                    <div className="relative flex items-center flex-1 md:flex-none">
                                        <FiDollarSign className="absolute left-3 md:left-4 text-[#b273c2] text-xs md:text-sm" />
                                        <input type="number" placeholder="Min" className="ai-input pl-7 md:pl-9 pr-2 md:pr-4 py-2 md:py-3 w-full md:w-32 rounded-[12px] text-[13px]" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                                    </div>
                                    <div className="h-[2px] w-2 md:w-4 bg-[#f0dff3]"></div>
                                    <div className="relative flex items-center flex-1 md:flex-none">
                                        <FiDollarSign className="absolute left-3 md:left-4 text-[#b273c2] text-xs md:text-sm" />
                                        <input type="number" placeholder="Max" className="ai-input pl-7 md:pl-9 pr-2 md:pr-4 py-2 md:py-3 w-full md:w-32 rounded-[12px] text-[13px]" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                                    </div>
                                </div>

                                {(search || category || brand || sortOption || minPrice || maxPrice) && (
                                    <button onClick={resetFilters} className="text-[#b273c2] hover:text-[#1d1d1d] transition-colors font-bold text-[11px] md:text-[12px] flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2 md:py-3 bg-[#f6edf8] rounded-[12px]">
                                        <FiX /> CLEAR FILTERS
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={`${showFilters ? 'block' : 'hidden'} lg:block mb-12 md:mb-16 px-2 md:px-0`}>
                        {/* CATEGORÍAS */}
                        <div className="mb-8">
                            <h2 className="font-bold text-[12px] text-gray-500 mb-4 uppercase tracking-wider">Topics</h2>
                            <div className="flex flex-nowrap md:flex-wrap gap-3 overflow-x-auto pb-4 md:pb-0 no-scrollbar">
                                {availableCategories.length > 0 ? availableCategories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategory(category === cat ? "" : cat)}
                                        className={`ai-category font-bold text-[11px] md:text-[12px] whitespace-nowrap ${category === cat ? 'active' : ''}`}
                                    >
                                        {cat}
                                    </button>
                                )) : <p className="text-gray-400 text-[12px] font-medium">No topics available</p>}
                            </div>
                        </div>

                        {/* MARCAS / LÍNEAS */}
                        <div>
                            <h2 className="font-bold text-[12px] text-gray-500 mb-4 uppercase tracking-wider">Skill Level</h2>
                            <div className="flex flex-nowrap md:flex-wrap gap-3 overflow-x-auto pb-4 md:pb-0 no-scrollbar">
                                {availableBrands.length > 0 ? availableBrands.map((b) => (
                                    <button
                                        key={b}
                                        onClick={() => setBrand(brand === b ? "" : b)}
                                        className={`ai-category font-bold text-[11px] md:text-[12px] whitespace-nowrap ${brand === b ? 'active' : ''}`}
                                    >
                                        {b}
                                    </button>
                                )) : <p className="text-gray-400 text-[12px] font-medium">No levels detected</p>}
                            </div>
                        </div>
                    </div>

                    {/* GRID DE PRODUCTOS */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-[400px] bg-white border border-[#f0dff3] rounded-[35px] animate-pulse shadow-sm" />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-10 md:gap-20">
                            <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                                <AnimatePresence>
                                    {filteredProducts.length === 0 ? (
                                        <div className="col-span-full py-20 md:py-32 text-center bg-white rounded-[35px] border border-[#f0dff3] shadow-sm">
                                            <div className="text-6xl mb-4">📭</div>
                                            <p className="font-medium text-gray-500 text-lg">No scenarios found for this selection.</p>
                                        </div>
                                    ) : (
                                        filteredProducts.map((product) => {
                                            const stockVariant = product.variantes?.find(v => Number(v.stock) > 0) || (product.variantes?.length > 0 ? product.variantes[0] : null);
                                            const price = stockVariant?.precioAlPublico || product.precioVenta || 0;
                                            const totalStock = product.variantes?.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0) || 0;
                                            const isAvailable = totalStock > 0;

                                            return (
                                                <Link to={`/product/${product.id}`} key={product.id} className="block group h-full gsap-card">
                                                    <div className="h-full flex flex-col relative overflow-hidden rounded-[35px] bg-white/60 backdrop-blur-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:bg-white/80">
                                                        {/* ÁREA SUPERIOR: IMAGEN */}
                                                        <div className="relative w-full aspect-video bg-transparent overflow-hidden border-b border-white/30">
                                                            <img
                                                                src={optimizeImage(product.imagenes?.[0] || product.image)}
                                                                alt={product.nombre}
                                                                loading="lazy"
                                                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                            />

                                                            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                                                                <div className="flex items-center flex-wrap gap-2">
                                                                    {!isAvailable ? (
                                                                        <span className="bg-[#f8f3f6] text-[#b273c2] text-[10px] md:text-xs font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">Locked</span>
                                                                    ) : (
                                                                        <>
                                                                            <span className="bg-white/90 backdrop-blur-sm text-[#1d1d1d] text-[10px] md:text-xs font-bold px-3 py-1 rounded-full shadow-sm">PRO</span>
                                                                            <span className="bg-[#b273c2]/90 backdrop-blur-sm text-white text-[10px] md:text-xs font-bold px-3 py-1 rounded-full shadow-sm hidden xs:block">Popular</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                {(() => {
                                                                    const isLiked = likedProducts.includes(product.id);
                                                                    return (
                                                                        <button
                                                                            onClick={(e) => handleToggleLike(e, product.id)}
                                                                            className={`bg-white/90 backdrop-blur-sm p-2.5 rounded-full transition-colors shadow-sm ${isLiked ? 'text-[#b273c2]' : 'text-gray-400 hover:text-[#b273c2]'}`}
                                                                        >
                                                                            <svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                                                                        </button>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>

                                                        {/* INFO CARD */}
                                                        <div className="flex flex-col p-6 flex-1 justify-between bg-transparent">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 flex items-center justify-center text-xl shadow-sm">
                                                                        ✨
                                                                    </div>
                                                                    <span className="bg-[#f6edf8] text-[#b273c2] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                                        {product.categoria || 'Topic'}
                                                                    </span>
                                                                </div>
                                                                <h3 className="text-xl text-[#1d1d1d] font-black tracking-tight leading-tight mb-2">{product.nombre}</h3>
                                                                <p className="text-sm text-gray-500 font-medium line-clamp-2">{product.marca || 'Practice your conversation skills with our AI.'}</p>
                                                            </div>

                                                            <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/30">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Access</span>
                                                                    <span className="text-xl font-black text-[#1d1d1d]">{formatPrice(price)}</span>
                                                                </div>
                                                                
                                                                {isAvailable ? (
                                                                    <div
                                                                        className="w-12 h-12 bg-[#b273c2] text-white rounded-full flex justify-center items-center shadow-lg hover:bg-[#9d5fb0] transition-all z-30 group-hover:scale-110 group-hover:rotate-12 cursor-pointer"
                                                                        aria-label="Practice Now"
                                                                    >
                                                                        <FontAwesomeIcon icon={faMicrophone} className="text-lg" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex justify-center items-center opacity-60">
                                                                        <FontAwesomeIcon icon={faMicrophone} className="text-lg" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* BOTON CARGAR MAS */}
                            {hasMore && (
                                <div className="flex justify-center pt-4">
                                    <button
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={isLoadingMore}
                                        className="ai-gradient-btn text-white px-8 py-4 font-bold text-[13px] shadow-xl hover:shadow-2xl disabled:opacity-50 flex items-center gap-3 rounded-[20px] w-full sm:w-auto justify-center"
                                    >
                                        {isLoadingMore ? "LOADING..." : (
                                            <>
                                                <FiPlusCircle className="text-lg" />
                                                LOAD MORE SCENARIOS
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Products;