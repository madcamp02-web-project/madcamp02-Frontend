interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    className?: string;
}

export function Input({ label, className = "", ...props }: InputProps) {
    return (
        <div className={`flex flex-col gap-1.5 mb-3 ${className}`}>
            {label && <label className="text-xs font-semibold text-gray-400 ml-1">{label}</label>}
            <input
                className="
          w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none
          focus:border-[var(--accent-purple)] focus:bg-white/10 transition-all font-sans
          placeholder:text-gray-600
        "
                {...props}
            />
        </div>
    );
}
