import React, { useMemo } from 'react';

interface HeaderBackgroundProps {
    color?: string; // e.g. '79, 70, 229' for indigo, '37, 99, 235' for blue
}

export const HeaderBackground: React.FC<HeaderBackgroundProps> = ({ color = '37, 99, 235' }) => {
    const elements = useMemo(() => {
        const items = [];
        const chars = [
            'ا', 'ب', 'ح', 'د', 'ر', 'س', 'ص', 'ط', 'ع', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي',
            'أ', 'إ', 'آ', 'ة', 'ث', 'ج', 'خ', 'ذ', 'ز', 'ش', 'ض', 'ظ', 'غ', 'ف',
            'ⴰ', 'ⴱ', 'ⴳ', 'ⴷ', 'ⴹ', 'ⴻ', 'ⴼ', 'ⴽ', 'ⵀ', 'ⵃ', 'ⵄ', 'ⵅ', 'ⵇ', 'ⵉ', 'ⵊ', 'ⵍ', 'ⵎ', 'ⵏ', 'ⵓ', 'ⵔ', 'ⵕ', 'ⵖ', 'ⵙ', 'ⵚ', 'ⵛ', 'ⵜ', 'ⵟ', 'ⵡ', 'ⵢ', 'ⵣ', 'ⵥ',
            'Tinmel', 'Education', 'Savoir', 'المعرفة', 'A', 'B', 'C', '1', '2', '3', '∑', '∫', 'π'
        ];

        // Ensure consistent counts based on window space, but kept simple for header
        for (let i = 0; i < 35; i++) {
            items.push({
                id: Math.random().toString(36).substring(2, 9),
                char: chars[Math.floor(Math.random() * chars.length)],
                top: Math.random() * 100,
                left: Math.random() * 100,
                size: Math.random() * 2 + 1, // 1rem to 3rem
                duration: Math.random() * 30 + 20,
                delay: Math.random() * 20,
                initialRotate: Math.random() * 360,
                opacity: Math.random() * 0.15 + 0.05, // 5% to 20% opacity
                font: Math.random() > 0.5 ? 'Amiri' : 'sans-serif' 
            });
        }
        return items;
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
            <style>{`
                @keyframes swimHeader {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    33% { transform: translate(25px, -15px) rotate(4deg); }
                    66% { transform: translate(-15px, 15px) rotate(-4deg); }
                    100% { transform: translate(0, 0) rotate(0deg); }
                }
            `}</style>
            {elements.map((el) => (
                <div key={el.id} style={{
                    position: 'absolute',
                    top: `${el.top}%`,
                    left: `${el.left}%`,
                    fontSize: `${el.size}rem`,
                    fontFamily: el.font === 'Amiri' ? '"Amiri", serif' : 'sans-serif',
                    color: `rgba(${color}, ${el.opacity})`,
                    zIndex: 0,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    filter: 'blur(0.5px)',
                    animation: `swimHeader ${el.duration}s ease-in-out infinite -${el.delay}s`
                }}>
                    <div style={{ transform: `rotate(${el.initialRotate}deg)` }}>
                        {el.char}
                    </div>
                </div>
            ))}
        </div>
    );
};
