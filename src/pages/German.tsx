import React, { useState, useMemo, useEffect } from 'react'
import {
  Languages, Plus, Volume2, Sparkles, CheckCircle2, RotateCcw,
  BookOpen, Brain, Star, Search, ChevronRight, HelpCircle, Check, X,
  Layers, VolumeX, ArrowRight
} from 'lucide-react'
import { Header } from '../components/layout/Sidebar'
import { Card, Button, Input, Textarea, Select, Badge, Modal, EmptyState, ProgressBar } from '../components/ui'
import { toast } from 'sonner'
import { generateGermanExercise } from '../lib/ai'
import type { GermanVocabulary } from '../types/database.types'

const INITIAL_VOCAB: GermanVocabulary[] = []

export function German() {
  const [vocabList, setVocabList] = useState<GermanVocabulary[]>(() => {
    const saved = localStorage.getItem('lifeos_german_vocab')
    return saved ? JSON.parse(saved) : INITIAL_VOCAB
  })

  const [activeTab, setActiveTab] = useState<'cards' | 'flashcards' | 'ai_exercise'>('cards')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Flashcard mode state
  const [flashcardIndex, setFlashcardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  // AI Exercise state
  const [aiLevel, setAiLevel] = useState('A2')
  const [aiTopic, setAiTopic] = useState('Daily Routine & Tech')
  const [aiExercise, setAiExercise] = useState<any | null>(null)
  const [aiExerciseLoading, setAiExerciseLoading] = useState(false)
  const [userExerciseAnswer, setUserExerciseAnswer] = useState('')
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false)

  // Form states
  const [fWord, setFWord] = useState('')
  const [fArticle, setFArticle] = useState<'der' | 'die' | 'das' | 'null'>('der')
  const [fEn, setFEn] = useState('')
  const [fHi, setFHi] = useState('')
  const [fExample, setFExample] = useState('')
  const [fLevel, setFLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1'>('A1')
  const [fCategory, setFCategory] = useState('General')

  useEffect(() => {
    localStorage.setItem('lifeos_german_vocab', JSON.stringify(vocabList))
  }, [vocabList])

  const filteredVocab = useMemo(() => {
    return vocabList.filter(item => {
      const matchLevel = selectedLevel === 'all' || item.level === selectedLevel
      const matchSearch = item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.translation_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.translation_hi && item.translation_hi.includes(searchQuery))
      return matchLevel && matchSearch
    })
  }, [vocabList, selectedLevel, searchQuery])

  // Native Speech Synthesis for German pronunciation
  const speakWord = (word: string, article?: string | null) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const textToSpeak = article && article !== 'null' ? `${article} ${word}` : word
      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      utterance.lang = 'de-DE'
      utterance.rate = 0.85
      window.speechSynthesis.speak(utterance)
    } else {
      toast.error('Speech synthesis not supported in this browser')
    }
  }

  const getArticleStyles = (article: GermanVocabulary['article']) => {
    switch (article) {
      case 'der':
        return {
          badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          border: 'border-l-blue-500',
          text: 'text-blue-400',
          label: 'der (Maskulin)'
        }
      case 'die':
        return {
          badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          border: 'border-l-rose-500',
          text: 'text-rose-400',
          label: 'die (Feminin)'
        }
      case 'das':
        return {
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          border: 'border-l-emerald-500',
          text: 'text-emerald-400',
          label: 'das (Neutral)'
        }
      default:
        return {
          badge: 'bg-surface-800 text-surface-400 border-surface-700',
          border: 'border-l-surface-700',
          text: 'text-surface-400',
          label: 'ohne Artikel'
        }
    }
  }

  const handleAddWord = () => {
    if (!fWord.trim() || !fEn.trim()) {
      toast.error('Word and English translation are required')
      return
    }

    const newWord: GermanVocabulary = {
      id: `g-${Date.now()}`,
      user_id: 'demo-user',
      word: fWord.trim(),
      article: fArticle === 'null' ? null : fArticle,
      translation_en: fEn.trim(),
      translation_hi: fHi.trim() || null,
      example_sentence: fExample.trim() || null,
      level: fLevel,
      category: fCategory.trim() || 'General',
      ease_factor: 2.5,
      interval_days: 1,
      next_review_at: new Date().toISOString(),
      review_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setVocabList([newWord, ...vocabList])
    setIsAddModalOpen(false)
    setFWord('')
    setFEn('')
    setFHi('')
    setFExample('')
    toast.success(`Wort hinzugefügt: ${newWord.word}`)
  }

  const handleGenerateExercise = async () => {
    setAiExerciseLoading(true)
    setShowAnswerFeedback(false)
    setUserExerciseAnswer('')

    try {
      const response = await generateGermanExercise(aiLevel, aiTopic)
      if (response.success && response.content) {
        try {
          const parsed = JSON.parse(response.content)
          setAiExercise(parsed)
        } catch {
          setAiExercise({
            instruction: 'Übersetzen Sie den Satz ins Deutsche:',
            content: 'The decision was very difficult for our engineering team.',
            answer: 'Die Entscheidung war für unser Ingenieurteam sehr schwierig.',
            explanation_en: 'Entscheidung is feminine (die) and schwierig means difficult.',
            hints: ['decision = die Entscheidung', 'difficult = schwierig']
          })
        }
      } else {
        // Fallback default high quality exercise
        setAiExercise({
          instruction: 'Füllen Sie den richtigen Artikel ein (der, die, oder das):',
          content: '___ Ergebnis der Prüfung war ausgezeichnet.',
          answer: 'das',
          explanation_en: 'Ergebnis is a neuter noun (das Ergebnis).',
          hints: ['Nouns ending in -nis are often neuter (das Ergebnis, das Geheimnis).']
        })
      }
    } catch {
      setAiExercise({
        instruction: 'Füllen Sie den richtigen Artikel ein (der, die, oder das):',
        content: '___ Ergebnis der Prüfung war ausgezeichnet.',
        answer: 'das',
        explanation_en: 'Ergebnis is a neuter noun (das Ergebnis).',
        hints: ['Nouns ending in -nis are often neuter (das Ergebnis).']
      })
    } finally {
      setAiExerciseLoading(false)
    }
  }

  // Spaced repetition review rating
  const handleReviewRating = (quality: 'again' | 'hard' | 'good' | 'easy') => {
    if (!filteredVocab[flashcardIndex]) return
    const card = filteredVocab[flashcardIndex]

    let newInterval = card.interval_days
    let newEase = card.ease_factor

    if (quality === 'again') {
      newInterval = 1
      newEase = Math.max(1.3, newEase - 0.2)
    } else if (quality === 'hard') {
      newInterval = Math.max(1, Math.round(newInterval * 1.2))
      newEase = Math.max(1.3, newEase - 0.15)
    } else if (quality === 'good') {
      newInterval = Math.round(newInterval * newEase)
    } else if (quality === 'easy') {
      newInterval = Math.round(newInterval * newEase * 1.3)
      newEase += 0.15
    }

    const updated = vocabList.map(v => {
      if (v.id !== card.id) return v
      return {
        ...v,
        interval_days: newInterval,
        ease_factor: Number(newEase.toFixed(2)),
        review_count: v.review_count + 1,
        next_review_at: new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000).toISOString()
      }
    })

    setVocabList(updated)
    setIsFlipped(false)
    if (flashcardIndex < filteredVocab.length - 1) {
      setFlashcardIndex(prev => prev + 1)
    } else {
      toast.success('🎉 Herzlichen Glückwunsch! Session completed!')
      setFlashcardIndex(0)
    }
  }

  const currentFlashcard = filteredVocab[flashcardIndex] || filteredVocab[0]

  return (
    <div className="min-h-full flex flex-col bg-surface-950">
      <Header
        title="German Lab — Deutsch Lernen"
        subtitle="Master A1–B2 German vocabulary with der/die/das article colors, Hindi & English translations, and native audio"
        actions={
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Wort hinzufügen</span>
          </Button>
        }
      />

      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-surface-800 pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'cards'
                  ? 'bg-accent-600 text-white shadow-sm'
                  : 'bg-surface-900 text-surface-400 hover:text-surface-200'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Wortschatz (Vocabulary)
            </button>
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'flashcards'
                  ? 'bg-accent-600 text-white shadow-sm'
                  : 'bg-surface-900 text-surface-400 hover:text-surface-200'
              }`}
            >
              <Brain className="h-3.5 w-3.5" />
              Spaced Flashcards ({filteredVocab.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('ai_exercise')
                if (!aiExercise) handleGenerateExercise()
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'ai_exercise'
                  ? 'bg-accent-600 text-white shadow-sm'
                  : 'bg-surface-900 text-surface-400 hover:text-surface-200'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              AI Grammar Coach
            </button>
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-60">
              <Input
                type="text"
                placeholder="Search word, Hindi or English..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4 text-surface-400" />}
              />
            </div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="bg-surface-900 border border-surface-800 rounded-lg text-xs text-surface-300 px-3 py-2 outline-none focus:border-accent-500"
            >
              <option value="all">All Levels</option>
              <option value="A1">A1 (Beginner)</option>
              <option value="A2">A2 (Elementary)</option>
              <option value="B1">B1 (Intermediate)</option>
              <option value="B2">B2 (Vantage)</option>
              <option value="C1">C1 (Advanced)</option>
            </select>
          </div>
        </div>

        {/* TAB 1: Vocabulary Grid */}
        {activeTab === 'cards' && (
          <div className="space-y-4">
            {/* Article Color Legend */}
            <div className="flex flex-wrap items-center gap-4 p-3 bg-surface-900/60 rounded-xl border border-surface-800 text-xs">
              <span className="font-semibold text-surface-400 uppercase tracking-wider text-2xs">Gender Colors:</span>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-surface-300 font-medium font-mono">der (Maskulin)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500" />
                <span className="text-surface-300 font-medium font-mono">die (Feminin)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-surface-300 font-medium font-mono">das (Neutral)</span>
              </div>
            </div>

            {filteredVocab.length === 0 ? (
              <EmptyState
                icon={<Languages className="h-10 w-10 text-surface-600" />}
                title="No words found"
                description="Add new German vocabulary with der/die/das articles and translations."
                action={
                  <Button variant="secondary" size="sm" onClick={() => setIsAddModalOpen(true)}>
                    Add Word
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVocab.map((item) => {
                  const artStyle = getArticleStyles(item.article)
                  return (
                    <Card
                      key={item.id}
                      className={`p-4 bg-surface-900/40 border-surface-800 border-l-4 ${artStyle.border} hover:border-surface-700 transition-all`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-baseline gap-2">
                            {item.article && (
                              <span className={`text-xs font-mono font-bold uppercase ${artStyle.text}`}>
                                {item.article}
                              </span>
                            )}
                            <h3 className="text-lg font-bold font-display text-surface-100">
                              {item.word}
                            </h3>
                          </div>
                          <p className="text-xs text-surface-300 font-medium mt-0.5">
                            {item.translation_en}
                          </p>
                          {item.translation_hi && (
                            <p className="text-xs text-amber-400/90 font-sans mt-0.5">
                              {item.translation_hi}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => speakWord(item.word, item.article)}
                            className="btn-ghost p-1.5 rounded-lg text-surface-400 hover:text-white"
                            title="Aussprache anhören (Listen)"
                          >
                            <Volume2 className="h-4 w-4" />
                          </button>
                          <span className="px-2 py-0.5 rounded text-2xs font-mono font-semibold bg-surface-800 text-surface-300 border border-surface-700">
                            {item.level}
                          </span>
                        </div>
                      </div>

                      {item.example_sentence && (
                        <div className="mt-3 pt-3 border-t border-surface-800/60 bg-surface-950/40 p-2.5 rounded-lg">
                          <p className="text-xs italic text-surface-300 font-serif">
                            "{item.example_sentence}"
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-3xs font-mono text-surface-500 mt-3 pt-2">
                        <span>Category: {item.category || 'General'}</span>
                        <span>Interval: {item.interval_days}d ({item.review_count} reviews)</span>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Spaced Flashcard Mode */}
        {activeTab === 'flashcards' && (
          <div className="max-w-2xl mx-auto py-6 space-y-6">
            {filteredVocab.length === 0 ? (
              <EmptyState
                icon={<Languages className="h-10 w-10 text-surface-600" />}
                title="No cards to review"
                description="All German vocabulary cards have been revised or none match filters."
              />
            ) : (
              <>
                <div className="flex justify-between items-center text-xs text-surface-400 font-mono">
                  <span>Card {flashcardIndex + 1} of {filteredVocab.length}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xs uppercase tracking-wider text-accent-400 font-semibold">
                      Level: {currentFlashcard?.level}
                    </span>
                  </div>
                </div>

                <ProgressBar
                  value={flashcardIndex + 1}
                  max={filteredVocab.length}
                  size="xs"
                  color="violet"
                />

                {/* Flip Card Container */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className={`min-h-[280px] p-8 rounded-2xl border cursor-pointer select-none transition-all duration-300 flex flex-col items-center justify-center text-center relative ${
                    isFlipped
                      ? 'bg-surface-900 border-accent-500/60 shadow-2xl ring-1 ring-accent-500/30'
                      : 'bg-surface-900/60 border-surface-800 hover:border-surface-700'
                  }`}
                >
                  <span className="absolute top-4 right-4 text-2xs text-surface-500 font-mono">
                    Click anywhere to flip
                  </span>

                  {!isFlipped ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-3">
                        {currentFlashcard?.article && (
                          <span className={`text-2xl font-bold font-mono ${getArticleStyles(currentFlashcard.article).text}`}>
                            {currentFlashcard.article}
                          </span>
                        )}
                        <h2 className="text-4xl font-extrabold font-display text-surface-50">
                          {currentFlashcard?.word}
                        </h2>
                      </div>
                      <p className="text-xs text-surface-400 font-mono">
                        {currentFlashcard?.category} • Level {currentFlashcard?.level}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          speakWord(currentFlashcard.word, currentFlashcard.article)
                        }}
                        className="btn-secondary btn-sm gap-2 mt-2"
                      >
                        <Volume2 className="h-4 w-4" />
                        Listen Pronunciation
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      <div>
                        <span className="text-xs text-surface-400 uppercase tracking-widest font-mono">English Meaning</span>
                        <h3 className="text-2xl font-bold text-surface-100 mt-1">
                          {currentFlashcard?.translation_en}
                        </h3>
                      </div>

                      {currentFlashcard?.translation_hi && (
                        <div>
                          <span className="text-xs text-amber-400/80 uppercase tracking-widest font-mono">Hindi (हिंदी)</span>
                          <p className="text-lg font-medium text-amber-300">
                            {currentFlashcard?.translation_hi}
                          </p>
                        </div>
                      )}

                      {currentFlashcard?.example_sentence && (
                        <div className="bg-surface-950/70 p-3 rounded-xl border border-surface-800 max-w-md">
                          <p className="text-xs italic text-surface-300 font-serif">
                            "{currentFlashcard.example_sentence}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Rating Buttons */}
                {isFlipped && (
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    <button
                      onClick={() => handleReviewRating('again')}
                      className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex flex-col items-center gap-1 transition-colors"
                    >
                      <span>Again</span>
                      <span className="text-3xs text-rose-400/70">1 day</span>
                    </button>
                    <button
                      onClick={() => handleReviewRating('hard')}
                      className="p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex flex-col items-center gap-1 transition-colors"
                    >
                      <span>Hard</span>
                      <span className="text-3xs text-amber-400/70">2 days</span>
                    </button>
                    <button
                      onClick={() => handleReviewRating('good')}
                      className="p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold flex flex-col items-center gap-1 transition-colors"
                    >
                      <span>Good</span>
                      <span className="text-3xs text-blue-400/70">4 days</span>
                    </button>
                    <button
                      onClick={() => handleReviewRating('easy')}
                      className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex flex-col items-center gap-1 transition-colors"
                    >
                      <span>Easy</span>
                      <span className="text-3xs text-emerald-400/70">7 days</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 3: AI Grammar & Exercise Coach */}
        {activeTab === 'ai_exercise' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="p-6 bg-surface-900/60 border-surface-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  <h3 className="text-base font-bold text-surface-50">German AI Exercise Generator</h3>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleGenerateExercise}
                  loading={aiExerciseLoading}
                  className="gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  New Exercise
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Target Level"
                  value={aiLevel}
                  onChange={(e) => setAiLevel(e.target.value)}
                  options={[
                    { value: 'A1', label: 'A1 (Anfänger)' },
                    { value: 'A2', label: 'A2 (Grundlegend)' },
                    { value: 'B1', label: 'B1 (Fortgeschritten)' },
                    { value: 'B2', label: 'B2 (Beruf & Alltag)' },
                  ]}
                />
                <Input
                  label="Topic / Context"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. Travel, Tech, Work"
                />
              </div>

              {aiExercise && (
                <div className="mt-6 pt-5 border-t border-surface-800 space-y-4">
                  <div className="p-4 rounded-xl bg-surface-950 border border-surface-800 space-y-3">
                    <p className="text-xs font-semibold text-accent-400 uppercase tracking-wider">
                      {aiExercise.instruction}
                    </p>
                    <p className="text-base font-medium text-surface-100 font-sans leading-relaxed">
                      {aiExercise.content}
                    </p>

                    {aiExercise.hints && aiExercise.hints.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {aiExercise.hints.map((h: string, i: number) => (
                          <span key={i} className="text-2xs text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            💡 {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* User Answer Field */}
                  <div className="space-y-2">
                    <Input
                      label="Your German Answer"
                      placeholder="Type your response here..."
                      value={userExerciseAnswer}
                      onChange={(e) => setUserExerciseAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setShowAnswerFeedback(true)
                      }}
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowAnswerFeedback(true)}
                        disabled={!userExerciseAnswer.trim()}
                      >
                        Check Answer
                      </Button>
                    </div>
                  </div>

                  {/* Feedback reveal */}
                  {showAnswerFeedback && (
                    <div className="p-4 rounded-xl bg-surface-950 border border-surface-800 space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                          Musterlösung (Correct Solution)
                        </span>
                        <button
                          onClick={() => speakWord(aiExercise.answer)}
                          className="btn-ghost p-1 text-surface-400 hover:text-white"
                          title="Listen solution"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm font-bold text-surface-100 font-mono">
                        {aiExercise.answer}
                      </p>
                      {aiExercise.explanation_en && (
                        <p className="text-xs text-surface-300 leading-relaxed bg-surface-900/60 p-3 rounded-lg border border-surface-800">
                          {aiExercise.explanation_en}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Modal: Add New Word */}
      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Neues deutsches Wort hinzufügen (Add German Word)"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Artikel"
              value={fArticle}
              onChange={(e) => setFArticle(e.target.value as any)}
              options={[
                { value: 'der', label: 'der (Maskulin)' },
                { value: 'die', label: 'die (Feminin)' },
                { value: 'das', label: 'das (Neutral)' },
                { value: 'null', label: 'Ohne Artikel (Verb/Adj)' },
              ]}
            />
            <div className="col-span-2">
              <Input
                label="Deutsches Wort *"
                placeholder="z.B. Lösung"
                value={fWord}
                onChange={(e) => setFWord(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="English Translation *"
              placeholder="e.g. solution"
              value={fEn}
              onChange={(e) => setFEn(e.target.value)}
            />
            <Input
              label="Hindi Translation (हिंदी)"
              placeholder="z.B. समाधान / हल"
              value={fHi}
              onChange={(e) => setFHi(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="CEFR Level"
              value={fLevel}
              onChange={(e) => setFLevel(e.target.value as any)}
              options={[
                { value: 'A1', label: 'A1' },
                { value: 'A2', label: 'A2' },
                { value: 'B1', label: 'B1' },
                { value: 'B2', label: 'B2' },
                { value: 'C1', label: 'C1' },
              ]}
            />
            <Input
              label="Category"
              placeholder="z.B. Work, Coding, Daily Life"
              value={fCategory}
              onChange={(e) => setFCategory(e.target.value)}
            />
          </div>

          <Textarea
            label="Beispielsatz (Example Sentence)"
            placeholder="z.B. Wir haben eine elegante Lösung für den Fehler gefunden."
            value={fExample}
            onChange={(e) => setFExample(e.target.value)}
            rows={2}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Abbrechen (Cancel)
            </Button>
            <Button variant="primary" onClick={handleAddWord}>
              Speichern (Save Word)
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
