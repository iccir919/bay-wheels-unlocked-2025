export default function KpiCard({ label, value, icon }) {
    return (
        <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-slate-400 text-sm flex items-center gap-2 mb1">
                <span className="text-lg">{icon}</span>
                {label}
            </div>
            <div className="text-2xl font-semibold text-slate-900">
                {value}
            </div>
        </div>
    )
}