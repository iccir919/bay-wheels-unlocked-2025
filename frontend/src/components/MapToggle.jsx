import React from "react";

export default function MapToggle({ value, onChange }) {
    const options = ["stations", "routes", "both"];

    return (
        <div className="flex space-x-2 mb-4">
            {options.map((opt) => (
                <button
                    key={opt}
                    className={`px-3 py-1 rounded font-semibold ${
                        value === opt
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => onChange(opt)}
                >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
            ))}
        </div>
    )
}