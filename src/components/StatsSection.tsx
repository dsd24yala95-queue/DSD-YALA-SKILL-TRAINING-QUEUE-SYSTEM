"use client";

import React from "react";
import { motion } from "framer-motion";

interface StatItem {
    icon: string;
    value: string;
    label: string;
    color: string;
}

const stats: StatItem[] = [
    { icon: "fa-users", value: "500+", label: "ผู้เข้ารับการฝึกอบรม", color: "from-blue-400 to-blue-600" },
    { icon: "fa-user-check", value: "200+", label: "ผู้ผ่านการทดสอบ", color: "from-purple-400 to-purple-600" },
    { icon: "fa-book-open", value: "50+", label: "หลักสูตรฝึกอบรม", color: "from-yellow-400 to-orange-500" },
    { icon: "fa-building-columns", value: "20+", label: "ปีแห่งการพัฒนา", color: "from-green-400 to-emerald-500" },
];

export default function StatsSection() {
    return (
        <section className="relative -mt-16 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="glass-light dark:glass rounded-3xl p-6 shadow-2xl border border-white/40 dark:border-white/10 backdrop-blur-2xl"
            >
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200/50 dark:divide-white/10">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
                            className="group flex flex-col items-center justify-center p-4 hover:bg-white/5 transition-colors rounded-xl"
                        >
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300 group-hover:rotate-6`}>
                                <i className={`fa-solid ${stat.icon} text-white text-lg`}></i>
                            </div>
                            <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-[#0B3C74] to-[#2563EB] dark:from-[#60A5FA] dark:to-[#93C5FD] bg-clip-text text-transparent mb-1 tracking-tight">
                                {stat.value}
                            </div>
                            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 font-semibold text-center">
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </section>
    );
}