
import React, { useState, useEffect, useRef } from 'react';
import { User, WhiteboardSession, Stroke, Point, WhiteboardMessage } from '../../types';
import { StorageService } from '../../services/storageService';
import { useLanguage } from '../../contexts/LanguageContext';
import { ArrowLeft, Eraser, Trash2, PenTool, AlertCircle, Send, MessageCircle, X, Users } from 'lucide-react';

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
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [session, setSession] = useState<WhiteboardSession | null>(null);
    const [error, setError] = useState('');
    
    // Tools State
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [size, setSize] = useState(5);
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [currentStroke, setCurrentStroke] = useState<Point[]>([]);

    // Chat State
    const [chatInput, setChatInput] = useState('');
    const [showChat, setShowChat] = useState(true); 

    // Identify if current user is Host
    const isHost = session ? user.id === session.hostId : false;

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
            let currentS: WhiteboardSession | undefined;
            if (sessionId) {
                currentS = StorageService.getWhiteboardById(sessionId);
            } else if (accessKey) {
                currentS = StorageService.getWhiteboardByKey(accessKey);
                if (!currentS) setError(t('sessionClosed'));
            }

            if (currentS) {
                setSession(prev => {
                    // Update if strokes or messages changed
                    if (!prev) return currentS;
                    const strokeChanged = currentS!.strokes.length !== prev.strokes.length;
                    const msgChanged = (currentS!.messages || []).length !== (prev.messages || []).length;
                    
                    if (strokeChanged || msgChanged) return currentS;
                    return prev;
                });
            }
        }, 1000); // 1s polling

        return () => clearInterval(interval);
    }, [sessionId, accessKey]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [session?.messages, showChat]);

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
    }, [session, canvasRef.current?.width, canvasRef.current?.height]); 

    // Handling Input with Scale Correction (Fixes the "Zoomed Line" bug)
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

        // Calculate scale factors to handle browser zoom or CSS resizing
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!session || !isHost) return; // Restrict drawing to Host
        setIsDrawing(true);
        const p = getPoint(e);
        if (p) setCurrentStroke([p]);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !session || !isHost) return;
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
                ctx.lineJoin = 'round';
                
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
        if (!isDrawing || !session || !isHost) return;
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
        if (!session || !isHost) return;
        if (confirm(t('confirmClear'))) {
            const cleared = { ...session, strokes: [] };
            StorageService.saveWhiteboard(cleared);
            setSession(cleared);
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !session) return;

        const msg: WhiteboardMessage = {
            id: `wb-msg-${Date.now()}`,
            senderId: user.id,
            senderName: user.name,
            content: chatInput.trim(),
            timestamp: new Date().toISOString()
        };

        StorageService.addMessageToWhiteboard(session.id, msg);
        
        // Local Optimistic Update
        const updatedMsgs = [...(session.messages || []), msg];
        setSession({ ...session, messages: updatedMsgs });
        setChatInput('');
    };

    const handleResize = () => {
       if (canvasRef.current) {
           const parent = canvasRef.current.parentElement;
           if (parent) {
               // Set canvas bitmap size to match the parent container
               canvasRef.current.width = parent.clientWidth;
               canvasRef.current.height = parent.clientHeight;
               
               // Force redraw
               if (session) setSession({ ...session });
           }
       }
    };

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        setTimeout(handleResize, 100); 
        return () => window.removeEventListener('resize', handleResize);
    }, [showChat]); 

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
        <div className="flex h-[calc(100vh-80px)] bg-gray-100 rounded-xl overflow-hidden shadow-2xl animate-fade-in border border-gray-200" dir="ltr">
            
            {/* Main Content (Toolbar + Canvas) */}
            <div className="flex-1 flex flex-col relative h-full">
                {/* Header Toolbar */}
                <div className="bg-white border-b p-3 flex justify-between items-center shadow-sm z-10 h-16 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={onExit} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><ArrowLeft className="w-5 h-5"/></button>
                        <div>
                            <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm md:text-base">
                                <PenTool className="w-4 h-4"/> {session.title}
                            </h2>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                {isHost && <span className="bg-green-100 text-green-700 px-1 rounded text-[10px] font-bold">HOST</span>}
                                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded select-all border flex items-center gap-1">
                                    <span className="text-gray-400">CODE:</span> {session.accessKey}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {isHost ? (
                        <div className="flex items-center gap-1 md:gap-2 bg-gray-100 p-1 rounded-lg">
                            {/* Tools */}
                            <button onClick={() => setTool('pen')} className={`p-1.5 md:p-2 rounded ${tool === 'pen' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`} title="Stylo"><PenTool className="w-4 h-4"/></button>
                            <button onClick={() => setTool('eraser')} className={`p-1.5 md:p-2 rounded ${tool === 'eraser' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`} title="Gomme"><Eraser className="w-4 h-4"/></button>
                            <div className="w-px h-6 bg-gray-300 mx-1 hidden md:block"></div>
                            
                            {/* Colors */}
                            <div className="hidden md:flex gap-1">
                                {COLORS.map(c => (
                                    <button 
                                        key={c} 
                                        onClick={() => { setColor(c); setTool('pen'); }}
                                        className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c && tool === 'pen' ? 'scale-110 border-gray-400' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                            
                            <div className="w-px h-6 bg-gray-300 mx-1 hidden md:block"></div>
                            
                            {/* Size */}
                            <div className="hidden md:flex gap-1">
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

                            <button onClick={clearBoard} className="p-1.5 md:p-2 text-red-500 hover:bg-red-50 rounded" title={t('clear')}><Trash2 className="w-5 h-5"/></button>
                        </div>
                    ) : (
                        <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded text-xs font-bold animate-pulse flex items-center gap-2">
                            <Users className="w-3 h-3"/> Mode Spectateur
                        </div>
                    )}

                    <button 
                        onClick={() => setShowChat(!showChat)} 
                        className={`md:hidden p-2 rounded-full ${showChat ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                    >
                        <MessageCircle className="w-5 h-5"/>
                    </button>
                </div>

                {/* Canvas Area */}
                <div className={`flex-1 relative bg-white touch-none ${isHost ? 'cursor-crosshair' : 'cursor-default'} overflow-hidden`}>
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

            {/* Live Chat Section */}
            <div className={`${showChat ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 border-l bg-white absolute md:relative z-20 h-full right-0 shadow-xl md:shadow-none`}>
                <div className="p-3 border-b flex justify-between items-center bg-gray-50 h-16 shrink-0">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2"><MessageCircle className="w-4 h-4"/> Messages</h3>
                    <button onClick={() => setShowChat(false)} className="md:hidden text-gray-500"><X className="w-5 h-5"/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                    {(session.messages || []).length === 0 && (
                        <div className="text-center text-gray-400 text-sm mt-10">
                            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-20"/>
                            <p>Aucun message.</p>
                        </div>
                    )}
                    {(session.messages || []).map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.senderId === user.id ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] p-2 rounded-lg text-sm shadow-sm ${msg.senderId === user.id ? 'bg-blue-600 text-white rounded-br-none' : (msg.senderId === session.hostId ? 'bg-yellow-100 border border-yellow-200 text-yellow-900 rounded-bl-none' : 'bg-white border text-gray-800 rounded-bl-none')}`}>
                                <div className={`text-[10px] font-bold mb-0.5 ${msg.senderId === user.id ? 'text-blue-200' : 'text-gray-500'}`}>
                                    {msg.senderId === session.hostId && <span className="mr-1">👑</span>}
                                    {msg.senderName}
                                </div>
                                {msg.content}
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    ))}
                    <div ref={chatEndRef}></div>
                </div>

                <form onSubmit={handleSendMessage} className="p-3 border-t bg-white flex gap-2 shrink-0">
                    <input 
                        className="flex-1 border rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Message..."
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                    />
                    <button type="submit" className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition">
                        <Send className="w-4 h-4 rtl:flip"/>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default WhiteboardRoom;
