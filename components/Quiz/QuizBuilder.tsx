
import React, { useState } from 'react';
import { Quiz, Question, QuestionType, MatchingPair } from '../../types';
import { Plus, Trash2, Save, Wand2, RefreshCcw, Lock, Clock, Calendar, Image as ImageIcon, CheckSquare, Type, Split, AlignLeft, List, MousePointerClick, MessageSquare, PenTool, Loader2, Mic, MonitorPlay, Link as LinkIcon } from 'lucide-react';
import { GeminiService } from '../../services/geminiService';
import { ApiService } from '../../services/apiService';
import { useLanguage } from '../../contexts/LanguageContext';

interface QuizBuilderProps {
  profId: string;
  onSave: (quiz: Quiz) => void;
  onCancel: () => void;
  availableClasses: string[];
}

const QuizBuilder: React.FC<QuizBuilderProps> = ({ profId, onSave, onCancel, availableClasses }) => {
  const { t, language, dir } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [accessCode, setAccessCode] = useState('');
  const [timeLimit, setTimeLimit] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});
  const [genTopic, setGenTopic] = useState('');

  const addQuestion = (type: QuestionType) => {
    const newQ: Question = {
      id: `q-${Date.now()}`,
      type,
      text: '',
      points: 1,
      options: (type === QuestionType.MCQ || type === QuestionType.IMAGE_MCQ || type === QuestionType.AUDIO || type === QuestionType.VIDEO) ? ['', ''] : undefined,
      correctAnswer: type === QuestionType.BOOLEAN ? true : '',
      matchingPairs: type === QuestionType.MATCHING ? [{ left: '', right: '' }, { left: '', right: '' }] : undefined
    };
    setQuestions([...questions, newQ]);
    // Scroll to bottom after adding
    setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, qId: string, field: 'imageUrl' | 'audioUrl' | 'videoUrl') => {
    const file = e.target.files?.[0];
    if (file) {
        setUploadingState(prev => ({ ...prev, [qId]: true }));
        try {
            const url = await ApiService.uploadFile(file);
            updateQuestion(qId, { [field]: url });
        } catch (error) {
            alert("Erreur lors de l'upload.");
        } finally {
            setUploadingState(prev => ({ ...prev, [qId]: false }));
        }
    }
  };

  const getYoutubeEmbed = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleGenerateAI = async () => {
    if (!genTopic) return;
    setIsGenerating(true);
    try {
      const generatedQuestions = await GeminiService.generateQuizQuestions(genTopic, 5, language);
      setQuestions([...questions, ...generatedQuestions]);
    } catch (e) {
      alert("Erreur lors de la génération. Vérifiez la clé API.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!title) return alert("Le titre est obligatoire");
    if (questions.length === 0) return alert("Ajoutez au moins une question.");
    
    const quiz: Quiz = {
      id: `quiz-${Date.now()}`,
      title,
      description,
      professorId: profId,
      questions,
      createdAt: new Date().toISOString(),
      assignedClasses: assignedClasses,
      status: isPublished ? 'PUBLISHED' : 'DRAFT',
      accessCode: accessCode.trim() || undefined,
      timeLimit: timeLimit ? parseInt(timeLimit) : undefined,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
    };
    onSave(quiz);
  };

  const toggleClass = (cls: string) => {
      setAssignedClasses(prev => 
        prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
      );
  };

  const getTypeIcon = (type: QuestionType) => {
      switch(type) {
          case QuestionType.MCQ: return <List className="w-5 h-5"/>;
          case QuestionType.IMAGE_MCQ: return <ImageIcon className="w-5 h-5"/>;
          case QuestionType.AUDIO: return <Mic className="w-5 h-5"/>;
          case QuestionType.VIDEO: return <MonitorPlay className="w-5 h-5"/>;
          case QuestionType.BOOLEAN: return <CheckSquare className="w-5 h-5"/>;
          case QuestionType.SHORT_ANSWER: return <Type className="w-5 h-5"/>;
          case QuestionType.ESSAY: return <AlignLeft className="w-5 h-5"/>;
          case QuestionType.MATCHING: return <Split className="w-5 h-5"/>;
          case QuestionType.FILL_IN_THE_BLANK: return <PenTool className="w-5 h-5"/>;
          default: return <Plus className="w-5 h-5"/>;
      }
  };

  const questionTypes = [
    { type: QuestionType.MCQ, label: "QCM Texte", desc: "Questions à choix multiples classiques", icon: List, color: "bg-blue-50 text-blue-600 border-blue-200" },
    { type: QuestionType.IMAGE_MCQ, label: "QCM Image", desc: "Questions basées sur un visuel", icon: ImageIcon, color: "bg-purple-50 text-purple-600 border-purple-200" },
    { type: QuestionType.AUDIO, label: "Compr. Orale", desc: "Question avec fichier audio", icon: Mic, color: "bg-red-50 text-red-600 border-red-200" },
    { type: QuestionType.VIDEO, label: "Analyse Vidéo", desc: "Question avec fichier vidéo ou YouTube", icon: MonitorPlay, color: "bg-rose-50 text-rose-600 border-rose-200" },
    { type: QuestionType.BOOLEAN, label: "Vrai / Faux", desc: "Réponse binaire simple", icon: CheckSquare, color: "bg-green-50 text-green-600 border-green-200" },
    { type: QuestionType.SHORT_ANSWER, label: "Réponse Courte", desc: "Un mot ou une phrase exacte", icon: Type, color: "bg-orange-50 text-orange-600 border-orange-200" },
    { type: QuestionType.MATCHING, label: "Appariement", desc: "Relier des éléments entre eux", icon: Split, color: "bg-pink-50 text-pink-600 border-pink-200" },
    { type: QuestionType.FILL_IN_THE_BLANK, label: "Texte à trous", desc: "Compléter les phrases", icon: PenTool, color: "bg-teal-50 text-teal-600 border-teal-200" },
    { type: QuestionType.ESSAY, label: "Rédaction (IA)", desc: "Analyse sémantique par IA", icon: MessageSquare, color: "bg-indigo-50 text-indigo-600 border-indigo-200" }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto" dir={dir}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t('newQuiz')}</h2>
        <div className="text-sm text-gray-500">{questions.length} questions</div>
      </div>
      
      {/* Basic Info */}
      <div className="grid gap-4 mb-8 border-b pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('quizTitle')}</label>
              <input 
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-blue-500 focus:border-blue-500"
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Ex: Évaluation Mathématiques Chap 1"
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">{t('assignedClasses')}</label>
                <div className="mt-1 p-2 border rounded-md max-h-32 overflow-y-auto grid grid-cols-2 gap-2 bg-white">
                    {availableClasses.length === 0 && <span className="text-xs text-gray-400">{t('noClassesFound')}</span>}
                    {availableClasses.map(cls => (
                        <label 
                            key={cls} 
                            className={`flex items-center gap-2 text-sm cursor-pointer p-1.5 rounded transition-colors ${assignedClasses.includes(cls) ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
                        >
                            <input 
                                type="checkbox" 
                                checked={assignedClasses.includes(cls)}
                                onChange={() => toggleClass(cls)}
                                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            {cls}
                        </label>
                    ))}
                </div>
            </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('quizDesc')}</label>
          <textarea 
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-blue-500 focus:border-blue-500"
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Instructions pour les élèves..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded-md">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Lock className="w-3 h-3"/> {t('accessCode')}
                </label>
                <input 
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder={t('accessCodePlaceholder')}
                />
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Clock className="w-3 h-3"/> {t('timer')}
                </label>
                <input 
                    type="number"
                    min="1"
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value)}
                />
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
                 <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Calendar className="w-3 h-3"/> {t('startDate')}
                 </label>
                 <input 
                    type="datetime-local"
                    className="mt-1 block w-full rounded-md border border-gray-300 p-1 text-xs"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                 />
            </div>
             <div className="bg-gray-50 p-3 rounded-md">
                 <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Calendar className="w-3 h-3"/> {t('dueDate')}
                 </label>
                 <input 
                    type="datetime-local"
                    className="mt-1 block w-full rounded-md border border-gray-300 p-1 text-xs"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                 />
            </div>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">{t('publishNow')}</span>
            </label>
        </div>
      </div>

      {/* AI Generator */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl mb-8 border border-indigo-100 flex gap-4 items-center">
         <div className="p-3 bg-white rounded-full shadow-sm">
             <Wand2 className="h-6 w-6 text-indigo-600 rtl:flip"/>
         </div>
         <div className="flex-1">
             <h3 className="text-sm font-bold text-indigo-900 mb-1">{t('aiGen')}</h3>
             <input 
                className="block w-full rounded-md border border-indigo-200 p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder={t('aiPlaceholder')}
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateAI()}
             />
         </div>
         <button 
            onClick={handleGenerateAI}
            disabled={isGenerating || !genTopic}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm transition-transform active:scale-95"
         >
             {isGenerating ? <RefreshCcw className="animate-spin h-4 w-4"/> : <span className="text-lg">✨</span>}
             {t('generate')}
         </button>
      </div>

      {/* Questions List */}
      <div className="space-y-6 mb-8">
        {questions.map((q, idx) => (
          <div key={q.id} className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm relative group hover:border-blue-300 transition-colors">
            <div className="absolute top-4 end-4 flex gap-2">
                <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-600 uppercase tracking-wider flex items-center gap-1">
                    {getTypeIcon(q.type)} {t(q.type)}
                </span>
                <button 
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                >
                    <Trash2 className="h-5 w-5" />
                </button>
            </div>

            <div className="flex items-center gap-3 mb-4 pr-24">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm shrink-0">
                    {idx + 1}
                </span>
                <input 
                    className="w-full p-2 border-b border-gray-300 focus:border-blue-500 outline-none font-medium text-lg bg-transparent placeholder-gray-400"
                    value={q.text}
                    onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                    placeholder={t('questionLabel')}
                />
                <div className="flex flex-col items-center shrink-0">
                    <input 
                        type="number"
                        min="1"
                        value={q.points}
                        onChange={(e) => updateQuestion(q.id, { points: parseInt(e.target.value) })}
                        className="w-12 text-center text-sm border rounded p-1 font-bold"
                    />
                    <span className="text-[10px] text-gray-500 uppercase">{t('points')}</span>
                </div>
            </div>

             {/* Upload for Image or Audio or Video */}
             {(q.type === QuestionType.IMAGE_MCQ || q.type === QuestionType.AUDIO || q.type === QuestionType.VIDEO) && (
              <div className="mb-4 ms-11">
                <div className="flex items-center gap-4 flex-wrap">
                  {(q.type === QuestionType.IMAGE_MCQ ? q.imageUrl : (q.type === QuestionType.AUDIO ? q.audioUrl : q.videoUrl)) ? (
                    <div className="relative group/media w-full">
                      {q.type === QuestionType.IMAGE_MCQ ? (
                          <img src={q.imageUrl} alt="Question" className="h-40 w-auto object-cover rounded-lg border shadow-sm" />
                      ) : q.type === QuestionType.AUDIO ? (
                          <audio controls src={q.audioUrl} className="w-full max-w-md"/>
                      ) : (
                          <div className="w-full max-w-md aspect-video bg-black rounded overflow-hidden">
                              {getYoutubeEmbed(q.videoUrl || '') ? (
                                  <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${getYoutubeEmbed(q.videoUrl || '')}`} frameBorder="0" allowFullScreen></iframe>
                              ) : (
                                  <video controls src={q.videoUrl} className="w-full h-full"/>
                              )}
                          </div>
                      )}
                      <button 
                        type="button"
                        onClick={() => updateQuestion(q.id, q.type === QuestionType.IMAGE_MCQ ? { imageUrl: undefined } : q.type === QuestionType.AUDIO ? { audioUrl: undefined } : { videoUrl: undefined })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-transform hover:scale-110 z-10"
                        title={t('delete')}
                      >
                        <Trash2 className="w-3 h-3"/>
                      </button>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col gap-2">
                        {q.type === QuestionType.VIDEO && (
                            <div className="flex gap-2 items-center mb-2 w-full max-w-lg">
                                <div className="relative flex-1">
                                    <LinkIcon className="absolute left-2 top-2.5 w-4 h-4 text-gray-400"/>
                                    <input 
                                        className="w-full pl-8 p-2 border rounded text-sm"
                                        placeholder="Collez un lien YouTube ou MP4 ici..."
                                        value={q.videoUrl || ''}
                                        onChange={(e) => updateQuestion(q.id, { videoUrl: e.target.value })}
                                    />
                                </div>
                                <span className="text-xs text-gray-500 font-bold uppercase">OU</span>
                            </div>
                        )}
                        <label className="flex flex-col items-center justify-center w-full max-w-sm h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-colors relative bg-gray-50/50">
                            {uploadingState[q.id] ? (
                                <Loader2 className="animate-spin text-blue-500 w-8 h-8"/>
                            ) : (
                                <>
                                    {q.type === QuestionType.IMAGE_MCQ ? <ImageIcon className="text-gray-400 w-8 h-8 mb-2"/> : q.type === QuestionType.AUDIO ? <Mic className="text-gray-400 w-8 h-8 mb-2"/> : <MonitorPlay className="text-gray-400 w-8 h-8 mb-2"/>}
                                    <span className="text-sm text-gray-500 font-medium">
                                        {t('upload')} {q.type === QuestionType.AUDIO ? 'Audio' : q.type === QuestionType.VIDEO ? 'Vidéo' : 'Image'}
                                    </span>
                                </>
                            )}
                            <input 
                                type="file" 
                                accept={q.type === QuestionType.IMAGE_MCQ ? "image/*" : q.type === QuestionType.AUDIO ? "audio/*" : "video/*"} 
                                className="hidden" 
                                onChange={(e) => handleFileUpload(e, q.id, q.type === QuestionType.IMAGE_MCQ ? 'imageUrl' : q.type === QuestionType.AUDIO ? 'audioUrl' : 'videoUrl')} 
                                disabled={uploadingState[q.id]}
                                onClick={(e) => (e.currentTarget.value = '')} 
                            />
                        </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MCQ & Image MCQ & Audio MCQ & Video MCQ Options */}
            {(q.type === QuestionType.MCQ || q.type === QuestionType.IMAGE_MCQ || q.type === QuestionType.AUDIO || q.type === QuestionType.VIDEO) && (
                <div className="space-y-2 ms-11">
                    {q.options?.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-3 group/option">
                            <input 
                                type="radio" 
                                name={`correct-${q.id}`} 
                                checked={q.correctAnswer === opt && opt !== ''} 
                                onChange={() => updateQuestion(q.id, { correctAnswer: opt })}
                                className="w-4 h-4 text-blue-600 cursor-pointer"
                                title="Marquer comme réponse correcte"
                            />
                            <div className="flex-1 relative">
                                <input 
                                    className={`w-full p-2 border rounded text-sm transition-colors ${q.correctAnswer === opt && opt !== '' ? 'border-green-500 bg-green-50' : 'focus:border-blue-400'}`}
                                    value={opt}
                                    onChange={(e) => {
                                        const newOpts = [...(q.options || [])];
                                        newOpts[oIdx] = e.target.value;
                                        // Update correct answer if changed
                                        const updates: Partial<Question> = { options: newOpts };
                                        if (q.correctAnswer === opt) updates.correctAnswer = e.target.value;
                                        updateQuestion(q.id, updates);
                                    }}
                                    placeholder={`${t('option')} ${oIdx + 1}`}
                                />
                                {q.options && q.options.length > 2 && (
                                    <button 
                                        onClick={() => {
                                            const newOpts = q.options?.filter((_, i) => i !== oIdx);
                                            updateQuestion(q.id, { options: newOpts });
                                        }}
                                        className="absolute right-2 top-2 text-gray-300 hover:text-red-500 opacity-0 group-hover/option:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    <button 
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mt-2"
                        onClick={() => updateQuestion(q.id, { options: [...(q.options || []), ''] })}
                    >
                        <Plus className="w-4 h-4"/> {t('addOption')}
                    </button>
                </div>
            )}

            {/* Boolean */}
            {q.type === QuestionType.BOOLEAN && (
                 <div className="flex gap-4 ms-11 mt-4">
                    <button 
                        onClick={() => updateQuestion(q.id, { correctAnswer: true })}
                        className={`flex-1 py-3 px-4 rounded-lg border-2 font-bold transition-all ${q.correctAnswer === true ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                        {t('true')}
                    </button>
                    <button 
                        onClick={() => updateQuestion(q.id, { correctAnswer: false })}
                        className={`flex-1 py-3 px-4 rounded-lg border-2 font-bold transition-all ${q.correctAnswer === false ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                        {t('false')}
                    </button>
                 </div>
            )}

            {/* Short Answer */}
            {(q.type === QuestionType.SHORT_ANSWER) && (
                <div className="ms-11 mt-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('expectedAnswer')} :</label>
                    <input 
                        className="w-full border-2 border-green-100 rounded-lg p-3 text-green-800 focus:border-green-300 focus:outline-none bg-green-50/50"
                        value={q.correctAnswer as string || ''}
                        onChange={(e) => updateQuestion(q.id, { correctAnswer: e.target.value })}
                        placeholder="Réponse exacte attendue..."
                    />
                </div>
            )}
            
            {q.type === QuestionType.ESSAY && (
                <div className="ms-11 mt-2 p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-sm text-yellow-800 flex items-start gap-2">
                    <Wand2 className="w-5 h-5 shrink-0"/>
                    <div>
                        <p className="font-bold mb-1">Correction IA activée</p>
                        {t('aiEssayWarning')}
                    </div>
                </div>
            )}
            
            {/* Fill in the blank */}
            {q.type === QuestionType.FILL_IN_THE_BLANK && (
                <div className="ms-11 mt-2 p-4 bg-teal-50 rounded-lg border border-teal-100 text-sm text-teal-800 flex items-start gap-2">
                     <div className="flex-1">
                         <p className="font-bold mb-1 flex items-center gap-2"><PenTool className="w-4 h-4"/> Mode d'emploi</p>
                         <p>Écrivez votre phrase et mettez les réponses entre crochets.</p>
                         <p className="mt-1 font-mono bg-white p-1 rounded border border-teal-200 inline-block">La capitale de la [France] est [Paris].</p>
                     </div>
                </div>
            )}

            {/* Matching */}
            {q.type === QuestionType.MATCHING && (
                <div className="ms-11 mt-2 space-y-3">
                    {q.matchingPairs?.map((pair, pIdx) => (
                        <div key={pIdx} className="flex gap-3 items-center group/pair">
                            <div className="flex-1 flex items-center gap-2">
                                <span className="text-gray-400 font-mono text-xs">A</span>
                                <input 
                                    placeholder={t('matchingA')}
                                    className="w-full border rounded p-2 text-sm focus:ring-1 focus:ring-blue-500"
                                    value={pair.left}
                                    onChange={(e) => {
                                        const newPairs = [...(q.matchingPairs || [])];
                                        newPairs[pIdx] = { ...pair, left: e.target.value };
                                        updateQuestion(q.id, { matchingPairs: newPairs });
                                    }}
                                />
                            </div>
                            <Split className="text-gray-300 w-4 h-4 shrink-0"/>
                            <div className="flex-1 flex items-center gap-2">
                                <span className="text-gray-400 font-mono text-xs">B</span>
                                <input 
                                    placeholder={t('matchingB')}
                                    className="w-full border rounded p-2 text-sm focus:ring-1 focus:ring-blue-500"
                                    value={pair.right}
                                    onChange={(e) => {
                                        const newPairs = [...(q.matchingPairs || [])];
                                        newPairs[pIdx] = { ...pair, right: e.target.value };
                                        updateQuestion(q.id, { matchingPairs: newPairs });
                                    }}
                                />
                            </div>
                            <button 
                                onClick={() => {
                                    const newPairs = q.matchingPairs?.filter((_, i) => i !== pIdx);
                                    updateQuestion(q.id, { matchingPairs: newPairs });
                                }}
                                className="text-gray-300 hover:text-red-500 opacity-0 group-hover/pair:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4"/>
                            </button>
                        </div>
                    ))}
                     <button 
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mt-2"
                        onClick={() => updateQuestion(q.id, { matchingPairs: [...(q.matchingPairs || []), {left: '', right: ''}] })}
                    >
                        <Plus className="w-4 h-4"/> {t('addPair')}
                    </button>
                </div>
            )}

          </div>
        ))}
      </div>

      {/* Question Type Selector */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4"/> Ajouter une question
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {questionTypes.map((item) => (
                  <button 
                      key={item.type}
                      onClick={() => addQuestion(item.type)}
                      className={`flex flex-col items-start p-3 rounded-lg border hover:shadow-md transition-all text-left group ${item.color} bg-white hover:bg-gray-50`}
                  >
                      <div className={`p-2 rounded-md mb-2 group-hover:scale-110 transition-transform ${item.color.replace('bg-white', '')}`}>
                          <item.icon className="w-5 h-5"/>
                      </div>
                      <span className="font-bold text-gray-800 text-sm">{item.label}</span>
                      <span className="text-xs text-gray-500 mt-1">{item.desc}</span>
                  </button>
              ))}
          </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t mt-8">
        <button onClick={onCancel} className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
            {t('cancel')}
        </button>
        <button onClick={handleSave} className="px-8 py-2.5 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 hover:shadow-xl transition-all flex items-center gap-2 font-bold transform active:scale-95">
            <Save className="h-5 w-5 rtl:flip" /> {t('save')}
        </button>
      </div>
    </div>
  );
};

export default QuizBuilder;
