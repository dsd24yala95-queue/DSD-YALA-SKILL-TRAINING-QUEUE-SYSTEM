import re

with open("src/app/admin/queue/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Insert Type Filter Tabs before Filter Bar
type_tabs_html = """            {/* Type Filter Tabs */}
            <div className="flex items-center gap-2 mb-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 w-fit overflow-x-auto max-w-full">
                <button 
                    onClick={() => setFilterType('all')}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${filterType === 'all' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <i className="fa-solid fa-layer-group mr-2"></i> ทุกประเภท
                </button>
                <button 
                    onClick={() => setFilterType('training')}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${filterType === 'training' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <i className="fa-solid fa-chalkboard-user mr-2"></i> หลักสูตรการฝึกอบรม
                </button>
                <button 
                    onClick={() => setFilterType('test')}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${filterType === 'test' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <i className="fa-solid fa-clipboard-check mr-2"></i> สาขาการทดสอบมาตรฐาน
                </button>
            </div>

            {/* Filter Bar */}"""

content = content.replace("{/* Filter Bar */}", type_tabs_html)


# 2. Remove the old select for filterType
old_select = """                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-indigo-400 min-w-[160px]"
                >
                    <option value="all">ทุกประเภท</option>
                    <option value="test">ทดสอบมาตรฐาน</option>
                    <option value="training">ฝึกอบรม</option>
                </select>"""

content = content.replace(old_select, "")

with open("src/app/admin/queue/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Replacement done")
