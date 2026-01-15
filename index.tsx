import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { toPng } from 'html-to-image';
import { createClient } from '@supabase/supabase-js';
import { MAJOR_ARCANA_IMAGES, MINOR_ARCANA_IMAGES } from './card-images';

// Supabase client initialization
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Data Structures & Hardcoded Rules ---

const MAJOR_ARCANA_NAMES = [
    "Il Matto", "Il Bagatto", "La Papessa", "L'Imperatrice", "L'Imperatore",
    "Il Papa", "Gli Innamorati", "Il Carro", "La Giustizia", "L'Eremita",
    "La Ruota", "La Forza", "L'Appeso", "Arcano XIII",
    "La Temperanza", "Il Diavolo", "La Casa Dio", "La Stella", "La Luna",
    "Il Sole", "Il Giudizio", "Il Mondo"
];

const DEFAULT_PHRASES = [
    "L'inizio di un nuovo viaggio, un salto nel buio con fiducia.",
    "Hai tutti gli strumenti e le capacità per realizzare i tuoi obiettivi.",
    "Ascolta la tua voce interiore e coltiva la saggezza nel silenzio.",
    "È il momento di creare, nutrire e dare forma ai tuoi progetti.",
    "Struttura, stabilità e autorità sono necessarie ora.",
    "Cerca una guida spirituale o un consiglio saggio.",
    "Segui il tuo cuore davanti a una scelta importante.",
    "Avanza con determinazione e prendi le redini della tua vita.",
    "Cerca l'equilibrio e agisci con integrità e verità.",
    "La solitudine ti porterà le risposte che cerchi dentro di te.",
    "Tutto scorre e cambia; accetta il destino con serenità.",
    "La vera forza risiede nella compassione e nel dominio di sé.",
    "Osserva il mondo da un'altra prospettiva; l'attesa è fertile.",
    "Lascia andare ciò che è finito per permettere una rinascita.",
    "Trova l'armonia attraverso la pazienza e la moderazione.",
    "Liberati dalle catene delle tue passioni e dipendenze.",
    "Un crollo improvviso apre la via alla vera luce.",
    "Mantieni la speranza, sei guidato da una buona stella.",
    "Non temere le ombre; l'intuizione illumina l'inconscio.",
    "Il successo e la gioia risplendono sul tuo cammino.",
    "Risvegliati a una nuova consapevolezza e rispondi alla chiamata.",
    "Hai raggiunto la completezza; goditi il trionfo e la realizzazione."
];

type GazeDir = 'left' | 'right' | 'front';
const MAJOR_ARCANA_GAZES: GazeDir[] = [
    'right', 'left', 'left', 'right', 'left', 'right', 'front', 'left', 'front', 'left',
    'front', 'right', 'front', 'right', 'left', 'front', 'front', 'left', 'front', 'front',
    'front', 'left' 
];

interface DeckPosition { x: number; y: number; }
type PlacementRole = 'base' | 'sguardo' | 'spalle' | 'soluzione';

interface PotentialPlacement {
    pos: DeckPosition;
    role: PlacementRole;
}

interface MinorAssociation {
    tarotNumber: number;
    inverted: boolean;
    visible: boolean;
    enlarged: boolean;
    step: number; // 0: Small (First), 1: Large, 2: Small (Second/Ready to close)
}

class Card {
    id: number;
    tarotNumber: number;
    inverted: boolean;
    position: DeckPosition;
    name: string;
    role: PlacementRole;

    constructor(id: number, tarotNumber: number, inverted: boolean, pos: DeckPosition, role: PlacementRole = 'base') {
        this.id = id;
        this.tarotNumber = tarotNumber;
        this.inverted = inverted;
        this.position = pos;
        this.name = MAJOR_ARCANA_NAMES[tarotNumber] || "Sconosciuta";
        this.role = role;
    }

    getBaseGaze(): GazeDir {
        return MAJOR_ARCANA_GAZES[this.tarotNumber];
    }

    straighten() {
        this.inverted = false;
    }
}

interface ReadingState {
    id: string;
    shuffledSeq: Card[];
    dealtCards: Card[];
    deckGrid: Map<string, Card>;
    bounds: { minX: number; minY: number; maxX: number; maxY: number };
    nextCardIndex: number;
    isComplete: boolean;
    availableMinors: number[];
    minorAssociations: Record<number, MinorAssociation>;
    totalPlannedCards: number;
}

const posToString = (pos: DeckPosition) => `${pos.x},${pos.y}`;

function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function calculateTotalPlannedCards(state: ReadingState): number {
    let current = { ...state };
    current.deckGrid = new Map(state.deckGrid);
    
    while (current.nextCardIndex < current.shuffledSeq.length) {
        const placement = findNextCardPlacement(current);
        if (!placement) break;
        
        const nextCardTemplate = current.shuffledSeq[current.nextCardIndex];
        const simulatedCard = new Card(
            nextCardTemplate.id, 
            nextCardTemplate.tarotNumber, 
            nextCardTemplate.inverted, 
            placement.pos, 
            placement.role
        );
        
        if (placement.role === 'soluzione') simulatedCard.straighten();
        
        current.dealtCards = [...current.dealtCards, simulatedCard];
        current.deckGrid.set(posToString(placement.pos), simulatedCard);
        current.nextCardIndex += 1;
    }
    return current.dealtCards.length;
}

function initializeReading(): ReadingState {
    const majorsShuffled = shuffleArray(Array.from({ length: 22 }, (_, i) => i));
    const shuffledSeq = majorsShuffled.map((tarotNum, i) => {
        return new Card(i, tarotNum, Math.random() < 0.5, { x: 0, y: 0 });
    });
    
    const dealtCards: Card[] = [];
    const deckGrid = new Map<string, Card>();

    for (let i = 0; i < 3; i++) {
        const card = shuffledSeq[i];
        card.position = { x: i - 1, y: 0 };
        card.role = 'base';
        dealtCards.push(card);
        deckGrid.set(posToString(card.position), card);
    }

    const initialState: ReadingState = {
        id: crypto.randomUUID(),
        shuffledSeq,
        dealtCards,
        deckGrid,
        bounds: { minX: -1, minY: 0, maxX: 1, maxY: 0 },
        nextCardIndex: 3,
        isComplete: false,
        availableMinors: shuffleArray(Array.from({ length: 56 }, (_, i) => i)),
        minorAssociations: {},
        totalPlannedCards: 0
    };

    initialState.totalPlannedCards = calculateTotalPlannedCards(initialState);
    
    if (initialState.nextCardIndex >= initialState.shuffledSeq.length || !findNextCardPlacement(initialState)) {
        initialState.isComplete = true;
    }

    return initialState;
}

function findNextCardPlacement(currentState: ReadingState): PotentialPlacement | null {
    const allNeeds: PotentialPlacement[] = [];
    for (const card of currentState.dealtCards) {
        const baseGaze = card.getBaseGaze();
        if (card.inverted) {
            const posSoluzione = { x: card.position.x, y: card.position.y - 1 };
            if (!currentState.deckGrid.has(posToString(posSoluzione))) allNeeds.push({ pos: posSoluzione, role: 'soluzione' });
            if (baseGaze !== 'front') {
                const dxSguardo = (baseGaze === 'left' ? 1 : -1);
                const posSguardo = { x: card.position.x + dxSguardo, y: card.position.y };
                if (!currentState.deckGrid.has(posToString(posSguardo))) allNeeds.push({ pos: posSguardo, role: 'sguardo' });
                const dxSpalle = (baseGaze === 'left' ? -1 : 1);
                const posSpalle = { x: card.position.x + dxSpalle, y: card.position.y };
                if (!currentState.deckGrid.has(posToString(posSpalle))) allNeeds.push({ pos: posSpalle, role: 'spalle' });
            }
        } else {
            if (baseGaze !== 'front') {
                const dx = (baseGaze === 'left' ? -1 : 1);
                const targetPos = { x: card.position.x + dx, y: card.position.y };
                if (!currentState.deckGrid.has(posToString(targetPos))) allNeeds.push({ pos: targetPos, role: 'sguardo' });
            }
        }
    }
    if (allNeeds.length === 0) return null;
    allNeeds.sort((a, b) => (a.pos.x !== b.pos.x) ? a.pos.x - b.pos.x : b.pos.y - a.pos.y);
    return allNeeds[0];
}

function dealNextCard(currentState: ReadingState): ReadingState {
    if (currentState.isComplete || currentState.nextCardIndex >= currentState.shuffledSeq.length) return { ...currentState, isComplete: true };
    const placement = findNextCardPlacement(currentState);
    if (placement) {
        const nextCard = currentState.shuffledSeq[currentState.nextCardIndex];
        nextCard.position = placement.pos;
        nextCard.role = placement.role;
        if (placement.role === 'soluzione') nextCard.straighten();
        const newDealtCards = [...currentState.dealtCards, nextCard];
        const newDeckGrid = new Map(currentState.deckGrid);
        newDeckGrid.set(posToString(placement.pos), nextCard);
        const newBounds = {
            minX: Math.min(currentState.bounds.minX, placement.pos.x),
            minY: Math.min(currentState.bounds.minY, placement.pos.y),
            maxX: Math.max(currentState.bounds.maxX, placement.pos.x),
            maxY: Math.max(currentState.bounds.maxY, placement.pos.y),
        };
        
        const nextState: ReadingState = { 
            ...currentState, 
            dealtCards: newDealtCards, 
            deckGrid: newDeckGrid, 
            bounds: newBounds, 
            nextCardIndex: currentState.nextCardIndex + 1, 
            isComplete: false 
        };

        if (nextState.nextCardIndex >= nextState.shuffledSeq.length || !findNextCardPlacement(nextState)) {
            nextState.isComplete = true;
        }

        return nextState;
    }
    return { ...currentState, isComplete: true };
}

const PADDING = 2000;
const BASE_CARD_WIDTH = 158;
const BASE_CARD_HEIGHT = 274;
const BASE_GAP = 7;

type ViewState = 'home' | 'reading' | 'daily' | 'admin';

const AdminPanel = ({ 
    initialPhrases, 
    onSave, 
    onCancel 
}: { 
    initialPhrases: string[], 
    onSave: (p: string[]) => void, 
    onCancel: () => void 
}) => {
    const [localPhrases, setLocalPhrases] = useState<string[]>(initialPhrases);

    useEffect(() => {
        setLocalPhrases(initialPhrases);
    }, [initialPhrases]);

    const handleChange = (index: number, val: string) => {
        const copy = [...localPhrases];
        copy[index] = val;
        setLocalPhrases(copy);
    };

    return (
        <div className="admin-view">
            <h1>Gestione Frasi - Arcani Maggiori</h1>
            <div className="admin-panel">
                {MAJOR_ARCANA_NAMES.map((name, i) => (
                    <div key={i} className="admin-row">
                        <label className="admin-label">{i}. {name}</label>
                        <input 
                            type="text" 
                            className="admin-input" 
                            value={localPhrases[i] || ''} 
                            onChange={(e) => handleChange(i, e.target.value)}
                        />
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button className="action-btn" onClick={onCancel}>Annulla</button>
                <button className="action-btn" onClick={() => onSave(localPhrases)}>Salva Modifiche</button>
            </div>
        </div>
    );
};

const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
};

const App = () => {
    const [view, setView] = useState<ViewState>('home');
    const [reading, setReading] = useState<ReadingState | null>(null);
    const [flippedCardIds, setFlippedCardIds] = useState<Set<number>>(new Set());
    const [visibleCardIds, setVisibleCardIds] = useState<Set<number>>(new Set());
    const [isInteracting, setIsInteracting] = useState(false);
    const [question, setQuestion] = useState("");
    const [consultantName, setConsultantName] = useState("");
    const [readingDate, setReadingDate] = useState(getTodayDate());
    const [showInfo, setShowInfo] = useState(false);
    const [archiveStatus, setArchiveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    const [phrases, setPhrases] = useState<string[]>(() => {
        const saved = localStorage.getItem('itarot_phrases');
        return saved ? JSON.parse(saved) : DEFAULT_PHRASES;
    });

    const [dailyCardIndex, setDailyCardIndex] = useState<number | null>(null);
    
    const [zoomLevel, setZoomLevel] = useState<number>(() => {
        if (typeof window === 'undefined') return 1;
        const saved = localStorage.getItem('tarot_zoom');
        if (saved) return parseFloat(saved);
        return window.innerWidth <= 500 ? 0.6 : 1.0;
    });

    const handleZoomChange = (delta: number) => {
        setZoomLevel(prev => {
            const newVal = Math.min(Math.max(prev + delta, 0.2), 1.2);
            const rounded = Math.round(newVal * 10) / 10;
            localStorage.setItem('tarot_zoom', rounded.toString());
            return rounded;
        });
    };
    
    const viewportRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const isClickBlocked = useRef(false);

    useEffect(() => {
        if (view === 'reading' && reading && viewportRef.current) {
            const { bounds } = reading;
            
            const currentWidth = BASE_CARD_WIDTH * zoomLevel;
            const currentHeight = BASE_CARD_HEIGHT * zoomLevel;
            const currentGap = BASE_GAP * zoomLevel;

            const gridWidth = bounds.maxX - bounds.minX + 1;
            const gridHeight = bounds.maxY - bounds.minY + 1;
            
            const totalWidth = gridWidth * currentWidth + (gridWidth - 1) * currentGap;
            const totalHeight = gridHeight * currentHeight + (gridHeight - 1) * currentGap;
            
            const contentWidth = totalWidth + PADDING * 2;
            const contentHeight = totalHeight + PADDING * 2;
            
            const viewport = viewportRef.current;
            
            const scrollLeft = (contentWidth - viewport.clientWidth) / 2;
            const scrollTop = (contentHeight - viewport.clientHeight) / 2;

            viewport.scrollTo({
                left: scrollLeft,
                top: scrollTop,
                behavior: 'smooth'
            });
        }
    }, [reading?.dealtCards, zoomLevel, view]);

    const handleStartReading = useCallback(() => {
        if (isInteracting) return;
        setIsInteracting(true);
        setFlippedCardIds(new Set());
        setVisibleCardIds(new Set());
        setShowInfo(false);
        setArchiveStatus('idle');
        
        const initialState = initializeReading();
        setReading(initialState);
        setView('reading');
        
        initialState.dealtCards.forEach((card, index) => {
            const appearDelay = index * 800;
            const flipDelay = appearDelay + 400;

            setTimeout(() => {
                setVisibleCardIds(prev => new Set(prev).add(card.id));
            }, appearDelay);

            setTimeout(() => {
                setFlippedCardIds(prev => new Set(prev).add(card.id));
            }, flipDelay);
        });
        
        setTimeout(() => setIsInteracting(false), 2500);
    }, [isInteracting]);

    const handleDrawNextCard = useCallback(() => {
        if (isInteracting || !reading || reading.isComplete) return;
        setIsInteracting(true);
        const newState = dealNextCard(reading);
        setReading(newState);
        const lastCard = newState.dealtCards[newState.dealtCards.length - 1];
        
        setVisibleCardIds(prev => new Set(prev).add(lastCard.id));

        setTimeout(() => {
            setFlippedCardIds(prev => new Set(prev).add(lastCard.id));
            setIsInteracting(false);
        }, 700);
    }, [isInteracting, reading]);

    const handleReset = () => {
        setReading(null);
        setFlippedCardIds(new Set());
        setVisibleCardIds(new Set());
        setQuestion("");
        setConsultantName("");
        setReadingDate(getTodayDate());
        setShowInfo(false);
        setArchiveStatus('idle');
        setView('home');
    };

    const handleArchive = async () => {
        if (!reading || archiveStatus === 'saving') return;
        setArchiveStatus('saving');
        const node = document.getElementById('spread-area');
        if (!node) {
            setArchiveStatus('error');
            return;
        }

        try {
            const dataUrl = await toPng(node, { 
                cacheBust: true,
                backgroundColor: '#382e25',
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left'
                }
            });
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            
            const timestamp = Date.now();
            const filePath = `consultations/${reading.id}/${timestamp}.png`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from("consultation-screenshots")
                .upload(filePath, blob, { contentType: "image/png", upsert: true });

            if (uploadError) throw uploadError;

            // Update Database Record
            const { error: updateError } = await supabase
                .from("consultations")
                .update({ spread_screenshot_path: filePath })
                .eq("id", reading.id);

            if (updateError) throw updateError;

            setArchiveStatus('saved');
            setTimeout(() => setArchiveStatus('idle'), 3000);
        } catch (err) {
            console.error("Archive error:", err);
            setArchiveStatus('error');
            setTimeout(() => setArchiveStatus('idle'), 3000);
        }
    };

    const handleDailyCardClick = () => {
        const today = new Date().toISOString().slice(0, 10);
        const key = `itarot_major_card_of_the_day_${today}`;
        const stored = localStorage.getItem(key);
        
        let index;
        if (stored) {
            index = parseInt(stored, 10);
        } else {
            index = Math.floor(Math.random() * 22);
            localStorage.setItem(key, index.toString());
        }
        setDailyCardIndex(index);
        setView('daily');
    };

    const handleAdminClick = () => {
        setView('admin');
    };

    const handleSavePhrases = (newPhrases: string[]) => {
        setPhrases(newPhrases);
        localStorage.setItem('itarot_phrases', JSON.stringify(newPhrases));
        setView('home');
    };

    const handleMajorClick = (cardId: number) => {
        if (isClickBlocked.current) return;
        if (!reading || !flippedCardIds.has(cardId)) return;
        const assoc = reading.minorAssociations[cardId];
        
        if (assoc) {
            setReading({
                ...reading,
                minorAssociations: {
                    ...reading.minorAssociations,
                    [cardId]: { ...assoc, visible: true, enlarged: false, step: 0 }
                }
            });
        } else if (reading.availableMinors.length > 0) {
            const nextMinor = reading.availableMinors[0];
            const remaining = reading.availableMinors.slice(1);
            setReading({
                ...reading,
                availableMinors: remaining,
                minorAssociations: {
                    ...reading.minorAssociations,
                    [cardId]: {
                        tarotNumber: nextMinor,
                        inverted: Math.random() < 0.5,
                        visible: true,
                        enlarged: false,
                        step: 0
                    }
                }
            });
        }
    };

    const handleMinorClick = (cardId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (isClickBlocked.current) return;
        if (!reading) return;
        const assoc = reading.minorAssociations[cardId];
        
        if (assoc) {
            let nextStep = assoc.step;
            let nextEnlarged = assoc.enlarged;
            let nextVisible = assoc.visible;

            if (assoc.step === 0) {
                nextEnlarged = true;
                nextStep = 1;
            } else if (assoc.step === 1) {
                nextEnlarged = false;
                nextStep = 2;
            } else if (assoc.step === 2) {
                nextVisible = false;
                nextEnlarged = false;
                nextStep = 0;
            } else {
                nextVisible = false;
                nextEnlarged = false;
                nextStep = 0;
            }

            setReading({
                ...reading,
                minorAssociations: {
                    ...reading.minorAssociations,
                    [cardId]: { ...assoc, enlarged: nextEnlarged, visible: nextVisible, step: nextStep }
                }
            });
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!viewportRef.current) return;
        isDragging.current = true;
        isClickBlocked.current = false;
        lastPos.current = { x: e.clientX, y: e.clientY };
        viewportRef.current.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current || !viewportRef.current) return;
        e.preventDefault();
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
             isClickBlocked.current = true;
        }
        viewportRef.current.scrollLeft -= dx;
        viewportRef.current.scrollTop -= dy;
        lastPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        if (viewportRef.current) {
            viewportRef.current.style.cursor = 'grab';
        }
    };

    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return "";
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    const renderReading = () => {
        if (!reading) return null;
        const { dealtCards, bounds, minorAssociations, totalPlannedCards } = reading;
        
        const currentWidth = BASE_CARD_WIDTH * zoomLevel;
        const currentHeight = BASE_CARD_HEIGHT * zoomLevel;
        const currentGap = BASE_GAP * zoomLevel;

        const gridWidth = bounds.maxX - bounds.minX + 1;
        const gridHeight = bounds.maxY - bounds.minY + 1;
        
        const totalWidth = gridWidth * currentWidth + (gridWidth - 1) * currentGap;
        const totalHeight = gridHeight * currentHeight + (gridHeight - 1) * currentGap;
        
        const contentWidth = totalWidth + PADDING * 2;
        const contentHeight = totalHeight + PADDING * 2;

        return (
            <>
                <div className="header-reading">
                     {(question || consultantName) && (
                        <div className="question-display">
                            <span className="reading-date">{formatDateDisplay(readingDate)}</span>
                            {consultantName && <strong style={{color: 'var(--primary)', marginRight: '10px'}}>{consultantName}:</strong>}
                            {question}
                        </div>
                    )}
                </div>

                <div className="bottom-left-controls">
                     <div className="zoom-controls">
                        <button className="zoom-btn" onClick={() => handleZoomChange(-0.1)}>−</button>
                        <button className="zoom-btn" onClick={() => handleZoomChange(0.1)}>+</button>
                    </div>
                </div>

                <div className="info-toggle-container">
                    <div className={`info-tooltip ${showInfo ? 'show' : ''}`}>
                        Carte totali in questa stesura: {totalPlannedCards}
                    </div>
                    <button 
                        className="info-icon-btn" 
                        onClick={() => setShowInfo(!showInfo)}
                        title="Informazioni sulla stesura"
                    >
                        i
                    </button>
                    <button 
                        className="archive-btn" 
                        onClick={handleArchive}
                        disabled={archiveStatus === 'saving'}
                        title="Archivia Stesura"
                    >
                        {archiveStatus === 'saving' ? '...' : 'A'}
                    </button>
                    {archiveStatus === 'saved' && <div className="archive-feedback">Salvato</div>}
                    {archiveStatus === 'error' && <div className="archive-feedback" style={{color: '#ff4444'}}>Errore</div>}
                    
                    {!reading.isComplete && (
                        <button 
                            className="draw-icon-btn" 
                            onClick={handleDrawNextCard} 
                            disabled={isInteracting}
                            title="Estrai Carta Successiva"
                        >
                            <svg viewBox="0 0 20 30" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="2" width="16" height="26" rx="2"/>
                                <circle cx="10" cy="15" r="3" strokeWidth="1" opacity="0.6"/>
                                <path d="M6 10L14 10M6 20L14 20" strokeWidth="1" opacity="0.4"/>
                            </svg>
                        </button>
                    )}
                </div>

                <div className="corner-controls">
                     {reading.isComplete && (
                         <button className="action-btn completion-btn-final" onClick={handleReset}>FINE</button>
                    )}
                </div>

                <div 
                    className="spread-viewport" 
                    ref={viewportRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onClick={() => { if(showInfo) setShowInfo(false); }}
                >
                   <div style={{
                        width: `${contentWidth}px`,
                        height: `${contentHeight}px`,
                        position: 'relative'
                   }} id="spread-area">
                        <div style={{
                            position: 'absolute',
                            width: `${totalWidth}px`,
                            height: `${totalHeight}px`,
                            left: `${PADDING}px`,
                            top: `${PADDING}px`,
                        }}>
                            {dealtCards.map((card, i) => {
                                const col = card.position.x - bounds.minX;
                                const row = card.position.y - bounds.minY;
                                
                                const left = col * (currentWidth + currentGap);
                                const top = row * (currentHeight + currentGap);
                                
                                const isFlipped = flippedCardIds.has(card.id);
                                const isVisible = visibleCardIds.has(card.id);
                                const assoc = minorAssociations[card.id];

                                const label = i === 0 ? "PASSATO" : i === 1 ? "PRESENTE" : i === 2 ? "FUTURO" : null;

                                return (
                                    <div
                                        key={card.id}
                                        className={`card ${isFlipped ? 'is-dealt' : ''} ${card.inverted ? 'is-inverted' : ''} ${isVisible ? 'is-visible' : ''}`}
                                        style={{
                                            width: `${currentWidth}px`,
                                            height: `${currentHeight}px`,
                                            left: `${left}px`,
                                            top: `${top}px`,
                                            zIndex: i + 10
                                        }}
                                        onClick={() => handleMajorClick(card.id)}
                                    >
                                        <div className="card-inner">
                                            <div className="card-back"></div>
                                            <div className="card-front">
                                                <img src={MAJOR_ARCANA_IMAGES[card.tarotNumber]} alt={card.name} />
                                            </div>
                                        </div>

                                        {label && <div className="card-label">{label}</div>}
                                        
                                        {assoc && assoc.visible && (
                                            <div 
                                                className={`minor-card ${assoc.inverted ? 'is-inverted' : ''} ${assoc.enlarged ? 'enlarged' : ''}`}
                                                onClick={(e) => handleMinorClick(card.id, e)}
                                            >
                                                <div className="card-inner">
                                                    <div className="card-back"></div>
                                                    <div className="card-front">
                                                        <img src={MINOR_ARCANA_IMAGES[assoc.tarotNumber]} className="unfiltered" alt="Minor Arcana" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                   </div>
                </div>
            </>
        );
    };

    const renderHome = () => (
        <div className="app-container">
            <h1>Tarocchi di Marsiglia</h1>
            
            <div className="input-group">
                <input 
                    type="text" 
                    className="name-input"
                    placeholder="Nome Consultante"
                    value={consultantName}
                    onChange={(e) => setConsultantName(e.target.value)}
                />
                <input 
                    type="date" 
                    className="date-input"
                    value={readingDate}
                    onChange={(e) => setReadingDate(e.target.value)}
                />
                <input 
                    type="text" 
                    className="question-input"
                    placeholder="Scrivi qui la tua domanda..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                />
            </div>

            <button className="start-button" onClick={handleStartReading}>
                Inizia Lettura
            </button>
            <button className="daily-button" onClick={handleDailyCardClick}>
                Carta del Giorno
            </button>
            <button className="admin-toggle-btn" onClick={handleAdminClick}>
                Admin
            </button>
        </div>
    );

    const renderDaily = () => {
        if (dailyCardIndex === null) return null;
        return (
            <div className="daily-view">
                <h1>Carta del Giorno</h1>
                <div className="daily-card-container">
                    <img 
                        src={MAJOR_ARCANA_IMAGES[dailyCardIndex]} 
                        className="daily-card-img" 
                        alt={MAJOR_ARCANA_NAMES[dailyCardIndex]} 
                    />
                    <div className="daily-phrase">
                        {phrases[dailyCardIndex]}
                    </div>
                </div>
                <button onClick={() => setView('home')}>Torna alla Home</button>
            </div>
        );
    };

    return (
        <>
            {view === 'home' && renderHome()}
            {view === 'reading' && renderReading()}
            {view === 'daily' && renderDaily()}
            {view === 'admin' && (
                <AdminPanel 
                    initialPhrases={phrases} 
                    onSave={handleSavePhrases} 
                    onCancel={() => setView('home')} 
                />
            )}
        </>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
