"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const services = [
    {
        icon: "fa-graduation-cap",
        title: "ฝึกอบรม",
        desc: "ค้นหาหลักสูตรและสมัครเข้าร่วมการฝึกอบรมพัฒนาฝีมือ",
        color: "from-blue-400 to-blue-600",
        href: "/booking",
        actionText: "ดูหลักสูตรทั้งหมด"
    },
    {
        icon: "fa-certificate",
        title: "ทดสอบมาตรฐาน",
        desc: "ตรวจสอบและจองคิวการทดสอบมาตรฐานฝีมือแรงงาน",
        color: "from-purple-400 to-purple-600",
        href: "/booking",
        actionText: "ดูประเภทการทดสอบ"
    },
    {
        icon: "fa-newspaper",
        title: "ข่าวสาร",
        desc: "ติดตามข่าวสารและประกาศสำคัญจาก สพร.24 ยะลา",
        color: "from-green-400 to-emerald-500",
        href: "/news",
        actionText: "อ่านข่าวทั้งหมด"
    },
    {
        icon: "fa-phone-volume",
        title: "ติดต่อเรา",
        desc: "ช่องทางการติดต่อและสอบถามข้อมูลเพิ่มเติม",
        color: "from-orange-400 to-red-500",
        href: "/contact",
        actionText: "ดูข้อมูลการติดต่อ"
    },
];

export default function ServicesSection() {
    return (
        <section className="py-16 bg-base-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2563EB]/10 text-[#2563EB] text-sm font-medium mb-4">
                        <i className="fa-solid fa-sparkles"></i>
                        บริการของเรา
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gradient mb-4">
                        บริการครบครัน ตอบโจทย์ทุกความต้องการ
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                        เรามุ่งมั่นพัฒนาคุณภาพแรงงานไทย สู่มาตรฐานสากล
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {services.map((service, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Link
                                href={service.href}
                                className="block group h-full"
                            >
                                <div className="relative p-6 rounded-3xl bg-base-100 border border-base-300 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.15)] hover:-translate-y-2 h-full overflow-hidden">
                                    {/* Subtle Noise Texture */}
                                    <div className="absolute inset-0 opacity-[0.03] bg-noise mix-blend-overlay"></div>
                                    
                                    {/* Hover gradient background border effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/0 to-[#6366F1]/0 group-hover:from-[#2563EB]/5 group-hover:to-[#6366F1]/5 transition-all duration-500 rounded-3xl z-0"></div>
                                    
                                    {/* Inner Glow on hover */}
                                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${service.color} mix-blend-soft-light`} style={{ opacity: 0.05 }}></div>

                                    <div className="relative z-10">
                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                                            <i className={`fa-solid ${service.icon} text-white text-2xl`}></i>
                                        </div>
                                        <h3 className="text-xl font-bold text-base-content mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#2563EB] group-hover:to-[#6366F1] transition-all duration-300">
                                            {service.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                                            {service.desc}
                                        </p>
                                        <div className="flex items-center gap-2 mt-auto text-sm font-semibold text-[#2563EB] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                            <span>{service.actionText || "ดูรายละเอียด"}</span>
                                            <i className="fa-solid fa-arrow-right text-xs"></i>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}