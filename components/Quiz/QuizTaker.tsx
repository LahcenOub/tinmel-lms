
import React, { useState, useEffect, useRef } from 'react';
import { Quiz, Question, QuestionType, QuizResult } from '../../types';
import { GeminiService } from '../../services/geminiService';
import { StorageService } from '../../services/storageService';
import { CheckCircle, Clock, Timer, ArrowRight, ArrowLeft, Mic, MicOff } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface QuizTakerProps {
  quiz: Quiz;
  studentId: string;
  studentName: string;
  onComplete: () => void;
}

const QuizTaker: React.FC<QuizTakerProps> = ({ quiz, studentId, studentName, onComplete }) => {
  const { t, dir } = useLanguage();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(quiz.timeLimit ? quiz.timeLimit * 60 : null);
  
  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
        handleSubmit(); 
        return;
    }

    const intervalId = setInterval(() => {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft]);

  const handleAnswer = (qId: string, val: any) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };
  
  // Voice Recognition Logic
  const toggleVoiceInput = (qId: string) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Votre navigateur ne supporte pas la reconnaissance vocale.");
        return;
    }

    if (isListening) {
        setIsListening(false);
        // Stop is handled by the object itself if we kept a ref, but here we rely on simple toggle for UI
        // In a real implementation we would need a ref to the recognition instance to call .stop()
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = dir === 'rtl' ? 'ar-SA' : 'fr-FR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const currentText = answers[qId] || '';
        handleAnswer(qId, currentText + (currentText ? ' ' : '') + transcript);
    };

    recognition.start();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; 
    setIsSubmitting(true);
    let calculatedScore = 0;
    let maxScore = 0;

    for (const q of quiz.questions) {
      maxScore += q.points;
      const userAns = answers[q.id];

      if (q.type === QuestionType.MCQ || q.type === QuestionType.IMAGE_MCQ || q.type === QuestionType.BOOLEAN) {
        if (userAns === q.correctAnswer) {
          calculatedScore += q.points;
        }
      } else if (q.type === QuestionType.SHORT_ANSWER) {
         if (typeof userAns === 'string' && typeof q.correctAnswer === 'string' && userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
             calculatedScore += q.points;
         }
      } else if (q.type === QuestionType.MATCHING) {
         if (Array.isArray(userAns)) {
            let allCorrect = true;
            const correctPairs = q.matchingPairs || [];
            if (userAns.length !== correctPairs.length) allCorrect = false;
            else {
                userAns.forEach((ua: any) => {
                    const match = correctPairs.find(cp => cp.left === ua.left);
                    if (!match || match.right !== ua.right) allCorrect = false;
                });
            }
            if (allCorrect) calculatedScore += q.points;
         }
      } else if (q.type === QuestionType.FILL_IN_THE_BLANK) {
          const matches = q.text.match(/\[(.*?)\]/g) || [];
          const correctValues = matches.map(m => m.replace(/[\[\]]/g, '').trim().toLowerCase());
          const userValues = (Array.isArray(userAns) ? userAns : []).map((v: string) => v.trim().toLowerCase());
          
          let correctCount = 0;
          correctValues.forEach((val, idx) => {
              if (userValues[idx] === val) correctCount++;
          });
          
          if (correctValues.length > 0) {
              calculatedScore += (correctCount / correctValues.length) * q.points;
          }
      } else if (q.type === QuestionType.ESSAY) {
          try {
              const grading = await GeminiService.gradeEssay(q.text, userAns || '');
              const normalizedScore = (grading.score / 10) * q.points;
              calculatedScore += normalizedScore;
          } catch (e) {
              console.warn("AI grading failed, score 0 for this question");
          }
      }
    }

    const endTime = Date.now();
    const timeSpentSeconds = Math.floor((endTime - startTimeRef.current) / 1000);

    const result: QuizResult = {
        id: `res-${Date.now()}`,
        quizId: quiz.id,
        studentId,
        studentName,
        answers,
        score: Math.round(calculatedScore * 10) / 10,
        maxScore,
        submittedAt: new Date().toISOString(),
        startedAt: new Date(startTimeRef.current).toISOString(),
        timeSpent: timeSpentSeconds
    };

    StorageService.saveResult(result);
    setIsSubmitting(false);
    onComplete();
  };

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const q = quiz.questions[currentStep];
  const isLast = currentStep === quiz.questions.length - 1;

  // RTL aware icons
  const NextIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const PrevIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-lg relative" dir={dir}>
      {timeLeft !== null && (
          <div className={`fixed top-4 start-4 z-50 px-4 py-2 rounded-full font-mono font-bold shadow-md flex items-center gap-2 ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-100 text-blue-800'}`}>
              <Timer className="w-5 h-5"/>
              {formatTime(timeLeft)}
          </div>
      )}

      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-xl font-bold">{quiz.title}</h1>
        <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-4 h-4"/>
            <span>{t('questionsCount')} {currentStep + 1} / {quiz.questions.length}</span>
        </div>
      </div>

      <div className="mb-8">
        {q.type !== QuestionType.FILL_IN_THE_BLANK && <h3 className="text-lg font-medium mb-4">{q.text}</h3>}

        {q.type === QuestionType.IMAGE_MCQ && q.imageUrl && (
            <div className="mb-6">
                <img src={q.imageUrl} alt="Question Reference" className="max-h-64 rounded shadow-md object-contain border" />
            </div>
        )}
        
        {(q.type === QuestionType.MCQ || q.type === QuestionType.IMAGE_MCQ) && (
            <div className="space-y-3">
                {q.options?.map(opt => (
                    <label key={opt} className="flex items-center p-3 border rounded hover:bg-gray-50 cursor-pointer">
                        <input 
                            type="radio" 
                            name={q.id} 
                            className="me-3 h-4 w-4 text-blue-600"
                            checked={answers[q.id] === opt}
                            onChange={() => handleAnswer(q.id, opt)}
                        />
                        {opt}
                    </label>
                ))}
            </div>
        )}

        {q.type === QuestionType.BOOLEAN && (
            <div className="flex gap-4">
                 <button 
                    onClick={() => handleAnswer(q.id, true)}
                    className={`px-6 py-3 rounded border ${answers[q.id] === true ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-50'}`}
                 > {t('true')} </button>
                 <button 
                    onClick={() => handleAnswer(q.id, false)}
                    className={`px-6 py-3 rounded border ${answers[q.id] === false ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-50'}`}
                 > {t('false')} </button>
            </div>
        )}

        {q.type === QuestionType.SHORT_ANSWER && (
            <input 
                className="w-full border rounded p-3"
                placeholder={t('questionLabel')}
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswer(q.id, e.target.value)}
            />
        )}
        
        {q.type === QuestionType.FILL_IN_THE_BLANK && (
            <div className="leading-loose text-lg font-medium">
                {(() => {
                    let blankIndex = 0;
                    return q.text.split(/(\[.*?\])/).map((part, idx) => {
                        if (part.startsWith('[') && part.endsWith(']')) {
                            const currentBlankIndex = blankIndex++;
                            const val = (answers[q.id] as string[])?.[currentBlankIndex] || '';
                            return (
                                <input
                                    key={idx}
                                    className="border-b-2 border-blue-500 mx-1 px-1 text-center w-32 focus:outline-none bg-blue-50 text-blue-800"
                                    value={val}
                                    onChange={(e) => {
                                        const newAns = [...(answers[q.id] || [])];
                                        newAns[currentBlankIndex] = e.target.value;
                                        handleAnswer(q.id, newAns);
                                    }}
                                    placeholder="..."
                                    autoComplete="off"
                                />
                            );
                        }
                        return <span key={idx}>{part}</span>;
                    });
                })()}
            </div>
        )}

        {q.type === QuestionType.ESSAY && (
             <div className="relative">
                 <textarea 
                    className="w-full border rounded p-3 h-32"
                    placeholder={t('questionLabel')}
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                />
                <button 
                    onClick={() => toggleVoiceInput(q.id)}
                    className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    title={isListening ? t('stopRecording') : t('startRecording')}
                >
                    {isListening ? <MicOff className="w-5 h-5"/> : <Mic className="w-5 h-5"/>}
                </button>
            </div>
        )}

        {q.type === QuestionType.MATCHING && (
            <div className="space-y-4">
                {q.matchingPairs?.map(pair => (
                    <div key={pair.left} className="flex items-center gap-4">
                        <div className="w-1/2 p-2 bg-gray-100 rounded">{pair.left}</div>
                        <select 
                            className="w-1/2 p-2 border rounded"
                            onChange={(e) => {
                                const currentPairs = answers[q.id] || [];
                                const filtered = currentPairs.filter((p: any) => p.left !== pair.left);
                                handleAnswer(q.id, [...filtered, { left: pair.left, right: e.target.value }]);
                            }}
                        >
                            <option value="">...</option>
                            {q.matchingPairs?.map(p => (
                                <option key={p.right} value={p.right}>{p.right}</option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
        )}
      </div>

      <div className="flex justify-between">
          <button 
            disabled={currentStep === 0}
            onClick={() => setCurrentStep(curr => curr - 1)}
            className="px-4 py-2 text-gray-600 disabled:opacity-50 flex items-center gap-2"
          >
              <PrevIcon className="w-4 h-4" /> {t('previous')}
          </button>
          
          {!isLast ? (
              <button 
                onClick={() => setCurrentStep(curr => curr + 1)}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              >
                  {t('next')} <NextIcon className="w-4 h-4" />
              </button>
          ) : (
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
              >
                  {isSubmitting ? t('submitting') : <>{t('finish')} <CheckCircle className="w-4 h-4"/></>}
              </button>
          )}
      </div>
    </div>
  );
};

export default QuizTaker;