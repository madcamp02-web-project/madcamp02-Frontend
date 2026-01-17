interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "google" | "kakao";
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = "primary",
    className = "",
    children,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center w-full px-6 py-3 rounded-lg font-semibold text-base transition-all duration-200 cursor-pointer border-none gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-cyan)] text-white shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:-translate-y-0.5",
        secondary: "bg-white/5 border border-white/10 text-white backdrop-blur-md hover:bg-white/10 hover:border-white/20",
        ghost: "bg-transparent text-gray-400 p-2 hover:text-white hover:bg-white/5",
        google: "bg-white text-black font-sans",
        kakao: "bg-[#FEE500] text-black font-sans",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
