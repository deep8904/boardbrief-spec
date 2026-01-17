import { useEffect, useState } from 'react';

export const Confetti = () => {
    const [pieces, setPieces] = useState<Array<{ id: number; style: any }>>([]);

    useEffect(() => {
        const colors = ['#a8edea', '#fed6e3', '#d4fc79', '#96e6a1', '#84fab0'];
        const newPieces = Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            style: {
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            }
        }));
        setPieces(newPieces);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {pieces.map((p) => (
                <div
                    key={p.id}
                    className="absolute top-0 w-3 h-3 rounded-full animate-confetti-fall"
                    style={p.style}
                />
            ))}
            <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti-fall {
          animation: confetti-fall 4s linear infinite;
        }
      `}</style>
        </div>
    );
};
