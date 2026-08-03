"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface MapLocationPickerModalProps {
    isOpen: boolean;
    initialCoords?: string; // e.g. "6.541094, 101.280388"
    onClose: () => void;
    onSelectCoords: (coords: string) => void;
}

// Default to Yala Skill Development Institute (สพร.24 ยะลา)
const DEFAULT_LAT = 6.541094;
const DEFAULT_LNG = 101.280388;

export default function MapLocationPickerModal({
    isOpen,
    initialCoords,
    onClose,
    onSelectCoords,
}: MapLocationPickerModalProps) {
    const [lat, setLat] = useState<number>(DEFAULT_LAT);
    const [lng, setLng] = useState<number>(DEFAULT_LNG);
    const [searchQuery, setSearchQuery] = useState("");
    const [searching, setSearching] = useState(false);

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerInstanceRef = useRef<any>(null);

    // Parse initialCoords when modal opens
    useEffect(() => {
        if (isOpen && initialCoords) {
            const parts = initialCoords.split(",").map((s) => parseFloat(s.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                setLat(parts[0]);
                setLng(parts[1]);
            } else {
                setLat(DEFAULT_LAT);
                setLng(DEFAULT_LNG);
            }
        } else if (isOpen) {
            setLat(DEFAULT_LAT);
            setLng(DEFAULT_LNG);
        }
    }, [isOpen, initialCoords]);

    // Load Leaflet & Initialize Map
    useEffect(() => {
        if (!isOpen || !mapContainerRef.current) return;

        let isMounted = true;

        const loadLeaflet = async () => {
            // Check if Leaflet CSS exists
            if (!document.getElementById("leaflet-css")) {
                const link = document.createElement("link");
                link.id = "leaflet-css";
                link.rel = "stylesheet";
                link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                document.head.appendChild(link);
            }

            // Check if Leaflet JS exists
            if (!(window as any).L) {
                await new Promise<void>((resolve) => {
                    const script = document.createElement("script");
                    script.id = "leaflet-js";
                    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
                    script.onload = () => resolve();
                    document.body.appendChild(script);
                });
            }

            if (!isMounted || !(window as any).L || !mapContainerRef.current) return;

            const L = (window as any).L;

            // Destroy previous map instance if exists
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }

            // Fix default icon paths for CDN loaded Leaflet
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            // Create new Leaflet map
            const map = L.map(mapContainerRef.current).setView([lat, lng], 15);
            mapInstanceRef.current = map;

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map);

            // Create draggable marker
            const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
            markerInstanceRef.current = marker;

            // Click map to move marker
            map.on("click", (e: any) => {
                const newLat = parseFloat(e.latlng.lat.toFixed(6));
                const newLng = parseFloat(e.latlng.lng.toFixed(6));
                marker.setLatLng([newLat, newLng]);
                setLat(newLat);
                setLng(newLng);
            });

            // Drag marker listener
            marker.on("dragend", () => {
                const pos = marker.getLatLng();
                const newLat = parseFloat(pos.lat.toFixed(6));
                const newLng = parseFloat(pos.lng.toFixed(6));
                setLat(newLat);
                setLng(newLng);
            });

            // Force map resize check
            setTimeout(() => {
                map.invalidateSize();
            }, 200);
        };

        loadLeaflet();

        return () => {
            isMounted = false;
        };
    }, [isOpen]);

    // Pan map when lat/lng state changes programmatically
    const updateMapCenter = (newLat: number, newLng: number) => {
        setLat(newLat);
        setLng(newLng);

        if (mapInstanceRef.current && markerInstanceRef.current) {
            const L = (window as any).L;
            if (L) {
                mapInstanceRef.current.setView([newLat, newLng], 16);
                markerInstanceRef.current.setLatLng([newLat, newLng]);
            }
        }
    };

    // Preset: Yala Institute
    const handlePresetYala = () => {
        updateMapCenter(DEFAULT_LAT, DEFAULT_LNG);
        toast.success("ตั้งค่าเป็นพิกัด สพร.24 ยะลา");
    };

    // Preset: GPS Current Location
    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error("อุปกรณ์นี้ไม่รองรับการดึงพิกัด GPS");
            return;
        }

        toast.loading("กำลังดึงพิกัด GPS ของคุณ...", { id: "gps-loading" });
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newLat = parseFloat(pos.coords.latitude.toFixed(6));
                const newLng = parseFloat(pos.coords.longitude.toFixed(6));
                updateMapCenter(newLat, newLng);
                toast.success("ดึงพิกัด GPS ปัจจุบันสำเร็จ", { id: "gps-loading" });
            },
            (err) => {
                console.error(err);
                toast.error("ไม่สามารถดึงตำแหน่ง GPS ได้ กรุณาเปิด Location", { id: "gps-loading" });
            },
            { enableHighAccuracy: true }
        );
    };

    // Search location using OpenStreetMap Nominatim
    const handleSearchLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    searchQuery + " Thailand"
                )}`
            );
            const data = await res.json();

            if (data && data.length > 0) {
                const result = data[0];
                const searchLat = parseFloat(parseFloat(result.lat).toFixed(6));
                const searchLng = parseFloat(parseFloat(result.lon).toFixed(6));
                updateMapCenter(searchLat, searchLng);
                toast.success(`ค้นพบสถานที่: ${result.display_name.split(",")[0]}`);
            } else {
                toast.error("ไม่พบสถานที่ที่ค้นหา ลองค้นหาด้วยชื่ออื่น");
            }
        } catch {
            toast.error("เกิดข้อผิดพลาดในการค้นหาสถานที่");
        } finally {
            setSearching(false);
        }
    };

    const handleConfirm = () => {
        const coordsStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        onSelectCoords(coordsStr);
        onClose();
        toast.success(`เลือกพิกัด: ${coordsStr}`);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
                >
                    {/* Modal Header */}
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                                <i className="fa-solid fa-map-location-dot text-indigo-600"></i>
                                เลือกพิกัดบนแผนที่ (Interactive Map Picker)
                            </h2>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                คลิกบนแผนที่ หรือลากหมุดเพื่อระบุพิกัด ละติจูด, ลองจิจูด (Lat, Long)
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all"
                        >
                            <i className="fa-solid fa-xmark text-sm"></i>
                        </button>
                    </div>

                    {/* Controls & Search Bar */}
                    <div className="p-4 bg-white border-b border-slate-100 space-y-2.5">
                        <form onSubmit={handleSearchLocation} className="flex gap-2">
                            <div className="relative flex-1">
                                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                                <input
                                    type="text"
                                    placeholder="ค้นหาชื่อสถานที่ (เช่น สพร.24 ยะลา, ศาลากลางยะลา)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={searching}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shrink-0"
                            >
                                {searching ? <span className="loading loading-spinner loading-xs"></span> : "ค้นหา"}
                            </button>
                        </form>

                        {/* Quick Presets */}
                        <div className="flex flex-wrap gap-2 text-xs">
                            <button
                                type="button"
                                onClick={handlePresetYala}
                                className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition-all flex items-center gap-1.5"
                            >
                                <i className="fa-solid fa-building text-indigo-500"></i>
                                📍 สพร. 24 ยะลา
                            </button>
                            <button
                                type="button"
                                onClick={handleUseCurrentLocation}
                                className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition-all flex items-center gap-1.5"
                            >
                                <i className="fa-solid fa-location-crosshairs text-emerald-600"></i>
                                🎯 ตำแหน่ง GPS ปัจจุบัน
                            </button>
                        </div>
                    </div>

                    {/* Interactive Map Canvas */}
                    <div className="relative flex-1 min-h-[300px] sm:min-h-[380px] bg-slate-100">
                        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-10"></div>
                    </div>

                    {/* Selected Coordinates Display Box & Footer Actions */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-slate-700 w-full sm:w-auto text-center sm:text-left shadow-sm">
                            <span className="text-slate-400 font-sans mr-2">พิกัดที่เลือก:</span>
                            <span className="text-indigo-600">{lat.toFixed(6)}, {lng.toFixed(6)}</span>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={onClose}
                                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:from-[#4F46E5] hover:to-[#4338CA] text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <i className="fa-solid fa-location-dot"></i>
                                📌 ยืนยันเลือกพิกัดนี้
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
