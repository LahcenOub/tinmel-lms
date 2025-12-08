import React, { useState } from 'react';
import { Quiz, Question, QuestionType, MatchingPair } from '../../types';
import { Plus, Trash2, Save, Wand2, RefreshCcw, Lock, Clock, Calendar, Image as ImageIcon } from 'lucide-react';
import { GeminiService } from '../../services/geminiService';
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
  const [genTopic, setGenTopic] = useState('');

  const addQuestion = (type: QuestionType) => {
    const newQ: Question = {
      id: `q-${Date.now()}`,
      type,
      text: '',
      points: 1,
      options: (type === QuestionType.MCQ || type === QuestionType.IMAGE_MCQ) ? ['', ''] : undefined,
      correctAnswer: type === QuestionType.BOOLEAN ? true : '',
      matchingPairs: type === QuestionType.MATCHING ? [{ left: '', right: '' }, { left: '', right: '' }] : undefined
    };
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, qId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateQuestion(qId, { imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAI = async () => {
    if (!genTopic) return;
    setIsGenerating(true);
    try {
      // Pass the current UI language to generating service
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto" dir={dir}>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">{t('newQuiz')}</h2>
      
      {/* Basic Info */}
      <div className="grid gap-4 mb-8 border-b pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('quizTitle')}</label>
              <input 
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-blue-500 focus:border-blue-500"
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
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
            <input 
                type="checkbox" 
                id="publish"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-5 w-5 text-blue-600"
            />
            <label htmlFor="publish" className="font-medium text-gray-700 cursor-pointer">{t('publishNow')}</label>
        </div>
      </div>

      {/* AI Generator */}
      <div className="bg-indigo-50 p-4 rounded-md mb-8 border border-indigo-100 flex gap-2 items-end">
         <div className="flex-1">
             <label className="block text-sm font-medium text-indigo-900">{t('aiGen')}</label>
             <input 
                className="mt-1 block w-full rounded-md border border-indigo-200 p-2"
                placeholder={t('aiPlaceholder')}
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
             />
         </div>
         <button 
            onClick={handleGenerateAI}
            disabled={isGenerating || !genTopic}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
         >
             {isGenerating ? <RefreshCcw className="animate-spin h-4 w-4"/> : <Wand2 className="h-4 w-4 rtl:flip"/>}
             {t('generate')}
         </button>
      </div>

      {/* Questions List */}
      <div className="space-y-6 mb-8">
        {questions.map((q, idx) => (
          <div key={q.id} className="border rounded-md p-4 bg-gray-50 relative group">
            <button 
                type="button"
                onClick={() => removeQuestion(q.id)}
                className="absolute top-2 end-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Trash2 className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-gray-500">Q{idx + 1}.</span>
                <span className="text-xs font-semibold bg-gray-200 px-2 py-1 rounded text-gray-700">
                    {t(q.type)}
                </span>
                <input 
                    type="number"
                    min="1"
                    value={q.points}
                    onChange={(e) => updateQuestion(q.id, { points: parseInt(e.target.value) })}
                    className="w-16 text-sm border rounded p-1"
                    title={t('points')}
                />
            </div>
            
            <input 
                className="w-full mb-3 p-2 border rounded font-medium"
                value={q.text}
                onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                placeholder={t('questionLabel')}
            />

             {/* Image Upload for Image MCQ */}
             {q.type === QuestionType.IMAGE_MCQ && (
              <div className="mb-4 ms-4">
                <div className="flex items-center gap-4">
                  {q.imageUrl ? (
                    <div className="relative">
                      <img src={q.imageUrl} alt="Question" className="h-32 w-auto object-cover rounded border" />
                      <button 
                        type="button"
                        onClick={() => updateQuestion(q.id, { imageUrl: undefined })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-sm"
                        title={t('delete')}
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:bg-gray-100 transition-colors">
                        <ImageIcon className="text-gray-400 w-8 h-8"/>
                        <span className="text-xs text-gray-500 mt-1">{t('upload')}</span>
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleImageUpload(e, q.id)} 
                            onClick={(e) => (e.currentTarget.value = '')} // Allow re-uploading same file
                        />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* MCQ */}
            {(q.type === QuestionType.MCQ || q.type === QuestionType.IMAGE_MCQ) && (
                <div className="space-y-2 ms-4">
                    {q.options?.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                            <input 
                                type="radio" 
                                name={`correct-${q.id}`} 
                                checked={q.correctAnswer === opt} 
                                onChange={() => updateQuestion(q.id, { correctAnswer: opt })}
                            />
                            <input 
                                className="flex-1 p-1 border rounded text-sm"
                                value={opt}
                                onChange={(e) => {
                                    const newOpts = [...(q.options || [])];
                                    newOpts[oIdx] = e.target.value;
                                    updateQuestion(q.id, { options: newOpts });
                                }}
                                placeholder={`${t('option')} ${oIdx + 1}`}
                            />
                        </div>
                    ))}
                    <button 
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => updateQuestion(q.id, { options: [...(q.options || []), ''] })}
                    >
                        + {t('addOption')}
                    </button>
                </div>
            )}

            {/* Boolean */}
            {q.type === QuestionType.BOOLEAN && (
                 <div className="flex gap-4 ms-4 mt-2">
                    <label className="flex items-center gap-2">
                        <input type="radio" checked={q.correctAnswer === true} onChange={() => updateQuestion(q.id, { correctAnswer: true })} />
                        {t('true')}
                    </label>
                    <label className="flex items-center gap-2">
                        <input type="radio" checked={q.correctAnswer === false} onChange={() => updateQuestion(q.id, { correctAnswer: false })} />
                        {t('false')}
                    </label>
                 </div>
            )}

            {/* Short Answer */}
            {(q.type === QuestionType.SHORT_ANSWER) && (
                <div className="ms-4 mt-2">
                    <label className="block text-xs text-gray-500">{t('expectedAnswer')} :</label>
                    <input 
                        className="w-full border rounded p-2"
                        value={q.correctAnswer as string || ''}
                        onChange={(e) => updateQuestion(q.id, { correctAnswer: e.target.value })}
                    />
                </div>
            )}
            
            {q.type === QuestionType.ESSAY && (
                <div className="ms-4 mt-2 text-sm text-gray-500 italic">
                    {t('aiEssayWarning')}
                </div>
            )}

            {/* Matching */}
            {q.type === QuestionType.MATCHING && (
                <div className="ms-4 mt-2 space-y-2">
                    {q.matchingPairs?.map((pair, pIdx) => (
                        <div key={pIdx} className="flex gap-2 items-center">
                            <input 
                                placeholder={t('matchingA')}
                                className="flex-1 border rounded p-1 text-sm"
                                value={pair.left}
                                onChange={(e) => {
                                    const newPairs = [...(q.matchingPairs || [])];
                                    newPairs[pIdx] = { ...pair, left: e.target.value };
                                    updateQuestion(q.id, { matchingPairs: newPairs });
                                }}
                            />
                            <span className="text-gray-400">↔</span>
                            <input 
                                placeholder={t('matchingB')}
                                className="flex-1 border rounded p-1 text-sm"
                                value={pair.right}
                                onChange={(e) => {
                                    const newPairs = [...(q.matchingPairs || [])];
                                    newPairs[pIdx] = { ...pair, right: e.target.value };
                                    updateQuestion(q.id, { matchingPairs: newPairs });
                                }}
                            />
                        </div>
                    ))}
                     <button 
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => updateQuestion(q.id, { matchingPairs: [...(q.matchingPairs || []), {left: '', right: ''}] })}
                    >
                        + {t('addPair')}
                    </button>
                </div>
            )}

          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {Object.values(QuestionType).map((type) => (
            <button 
                key={type}
                onClick={() => addQuestion(type)}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm text-gray-700 flex items-center gap-1 transition-colors"
            >
                <Plus className="h-3 w-3" /> {t(type)}
            </button>
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800">{t('cancel')}</button>
        <button onClick={handleSave} className="px-6 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 flex items-center gap-2">
            <Save className="h-4 w-4 rtl:flip" /> {t('save')}
        </button>
      </div>
    </div>
  );
};

export default QuizBuilder;