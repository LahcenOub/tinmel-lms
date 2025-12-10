
import React, { useState, useEffect, useRef } from 'react';
import { User, WhiteboardSession, Stroke, Point } from '../../types';
import { StorageService } from '../../services/storageService';
import { useLanguage } from '../../contexts/LanguageContext';
import { ArrowLeft, Eraser, Trash2, Save, PenTool, Share2, AlertCircle } from 'lucide-react';

interface Props {
    user: User;
    sessionId?: string; // If Prof hosting
    accessKey?: string; // If Student joining
    onExit: () => void;
}

const COLORS = ['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
const SIZES = [2, 5, 10, 20];

const WhiteboardRoom: React.FC<Props> = ({ user, sessionId, accessKey, onExit }) => {
    const { t, dir } = useLanguage();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [session, setSession] = useState<WhiteboardSession | null>(null);
    const [error, setError] = useState('');
    
    // Tools State
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [size, setSize] = useState(5);
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [currentStroke, setCurrentStroke] = useState<Point[]>([]);

    // Init Session
    useEffect(() => {
        const init = () => {
            if (sessionId) {
                // Host mode
                const s = StorageService.getWhiteboardById(sessionId);
                if (s) setSession(s);
                else setError("Session introuvable");
            } else if (accessKey) {
                // Join mode
                const s = StorageService.getWhiteboardByKey(accessKey);
                if (s) setSession(s);
                else setError(t('codeIncorrect'));
            }
        };
        init();

        // Polling for updates (simulating WebSocket)
        const interval = setInterval(() => {
            if (sessionId) {
                const s = StorageService.getWhiteboardById(sessionId);
                if (s) setSession(prev => {
                    // Only update if stroke count changed to avoid flickering/loop
                    if (prev && s.strokes.length !== prev.strokes.length) return s;
                    return prev;
                });
            } else if (accessKey) {
                const s = StorageService.getWhiteboardByKey(accessKey);
                if (s) setSession(prev => {
                    if (prev && s.strokes.length !== prev.strokes.length) return s;
                    return prev;
                });
                else setError(t('sessionClosed')); // Host closed it
            }
        }, 1000); // 1s polling

        return () => clearInterval(interval);
    }, [sessionId, accessKey]);

    // Draw Session Strokes on Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !session) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas before redrawing everything
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        session.strokes.forEach(stroke => {
            if (stroke.points.length < 1) return;
            
            ctx.beginPath();
            ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;
            ctx.lineWidth = stroke.size;
            
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.stroke();
        });
    }, [session]); // Redraw when session updates

    // Handling Input
    const getPoint = (e: React.MouseEvent | React.TouchEvent): Point | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!session) return;
        // Only host can draw? Or everyone? Let's allow everyone for now.
        setIsDrawing(true);
        const p = getPoint(e);
        if (p) setCurrentStroke([p]);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !session) return;
        const p = getPoint(e);
        if (p) {
            setCurrentStroke(prev => [...prev, p]);
            
            // Draw LIVE feedback (before sync)
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (ctx && canvas) {
                ctx.beginPath();
                ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
                ctx.lineWidth = size;
                ctx.lineCap = 'round';
                
                // Draw from last point
                const last = currentStroke[currentStroke.length - 1];
                if (last) {
                    ctx.moveTo(last.x, last.y);
                    ctx.lineTo(p.x, p.y);
                    ctx.stroke();
                }
            }
        }
    };

    const stopDrawing = () => {
        if (!isDrawing || !session) return;
        setIsDrawing(false);
        
        if (currentStroke.length > 0) {
            const newStroke: Stroke = {
                points: currentStroke,
                color,
                size,
                tool
            };
            
            // Save to storage
            StorageService.addStrokeToWhiteboard(session.id, newStroke);
            
            // Local update immediately
            setSession(prev => prev ? { ...prev, strokes: [...prev.strokes, newStroke] } : null);
        }
        setCurrentStroke([]);
    };

    const clearBoard = () => {
        if (!session) return;
        if (confirm(t('confirmClear'))) {
            const cleared = { ...session, strokes: [] };
            StorageService.saveWhiteboard(cleared);
            setSession(cleared);
        }
    };

    const handleResize = () => {
       if (canvasRef.current) {
           const parent = canvasRef.current.parentElement;
           if (parent) {
               canvasRef.current.width = parent.clientWidth;
               canvasRef.current.height = parent.clientHeight;
               // Trigger re-render of strokes
               setSession(prev => prev ? {...prev} : null); 
           }
       }
    };

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        handleResize(); // Init size
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4"/>
                <h2 className="text-xl font-bold text-gray-800">{error}</h2>
                <button onClick={onExit} className="mt-4 text-blue-600 hover:underline">{t('back')}</button>
            </div>
        );
    }

    if (!session) return <div className="flex items-center justify-center h-full">{t('loading')}</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] bg-gray-100 rounded-xl overflow-hidden shadow-2xl animate-fade-in" dir="ltr">
            {/* Header Toolbar */}
            <div className="bg-white border-b p-4 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onExit} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><ArrowLeft className="w-5 h-5"/></button>
                    <div>
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                             <PenTool className="w-4 h-4"/> {session.title}
                        </h2>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                            {t('roomKey')}: <span className="font-mono bg-gray-100 px-1 rounded select-all">{session.accessKey}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    {/* Tools */}
                    <button onClick={() => setTool('pen')} className={`p-2 rounded ${tool === 'pen' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`} title="Stylo"><PenTool className="w-4 h-4"/></button>
                    <button onClick={() => setTool('eraser')} className={`p-2 rounded ${tool === 'eraser' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`} title="Gomme"><Eraser className="w-4 h-4"/></button>
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    
                    {/* Colors */}
                    {COLORS.map(c => (
                        <button 
                            key={c} 
                            onClick={() => { setColor(c); setTool('pen'); }}
                            className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c && tool === 'pen' ? 'scale-110 border-gray-400' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    
                    {/* Size */}
                    {SIZES.map(s => (
                        <button 
                            key={s} 
                            onClick={() => setSize(s)}
                            className={`w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 ${size === s ? 'bg-gray-300' : ''}`}
                        >
                            <div className="bg-gray-800 rounded-full" style={{ width: s, height: s }}></div>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                     <button onClick={clearBoard} className="p-2 text-red-500 hover:bg-red-50 rounded" title={t('clear')}><Trash2 className="w-5 h-5"/></button>
                     <div className="hidden md:block text-xs text-gray-400">Sync: {session.strokes.length} obj</div>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative cursor-crosshair bg-white touch-none">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="block w-full h-full"
                />
            </div>
        </div>
    );
};

export default WhiteboardRoom;