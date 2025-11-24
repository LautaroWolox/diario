import React, { useState, useEffect, useRef } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

// --- MOTOR DE IA "PSICÓLOGO" (Versión Extendida) ---
const analyzeWithAI = (text) => {
  if (!text || text.length < 5) return null;

  const lower = text.toLowerCase();
  let sentiment = "Neutral / Observador 😐";
  let summary = "Registro del día.";
  
  // Categorías de análisis
  let emotionalPatterns = [];
  let socialDynamics = [];
  let hiddenConflicts = [];

  // 1. DETECCIÓN EMOCIONAL PROFUNDA
  if (lower.match(/(triste|mal|llorar|solo|ansiedad|miedo|feo|abrumado|cansado|dolor|angustia|no supe que decir)/)) {
    sentiment = "Desafiante / Reflexivo 🌧️";
    summary = "Estás procesando emociones densas o situaciones de estrés.";
    emotionalPatterns.push("🧠 **Carga Mental:** El uso de palabras como 'abrumado' o 'no supe qué decir' indica una saturación cognitiva. Quizás estás sobre-pensando las situaciones.");
    emotionalPatterns.push("🛡️ **Mecanismos de Defensa:** Posiblemente te estés guardando cosas para evitar conflictos externos, pero eso genera conflicto interno.");
  } else if (lower.match(/(feliz|contento|bien|genial|amor|logré|bueno|excelente|bonito|paz|gracias|risas)/)) {
    sentiment = "Positivo / Gratitud ☀️";
    summary = "El día tiene un tinte de realización y bienestar.";
    emotionalPatterns.push("✨ **Validación:** Reconocer los buenos momentos refuerza tu autoestima.");
  }

  // 2. DINÁMICAS SOCIALES (Vínculos)
  if (lower.match(/(amigo|alan|marcos|carpincho|gente|grupo|vino|casa de|madre|padre|novia|novio)/)) {
    socialDynamics.push("🕸️ **Red de Vínculos:** Tu estado de ánimo hoy dependió mucho de tu interacción con otros.");
    if (lower.match(/(dijo|llamo|mensaje|aviso|esperar)/)) {
        socialDynamics.push("📢 **Comunicación Externa:** Parece que hubo mucho flujo de información o decisiones que vinieron de afuera hacia ti.");
    }
  }

  // 3. CONFLICTOS OCULTOS Y LÍMITES
  if (lower.match(/(no supe que decir|me quede callado|raro|molesto|dijo que no|peleamos|discutir|grito|tarde|cambio)/)) {
    hiddenConflicts.push("🚧 **Límites Difusos:** Hubo situaciones donde quizás sentiste que invadían tu tiempo o decisión (ej. cambios de planes, esperas).");
    hiddenConflicts.push("🤐 **Silencios:** Lo que callaste en el momento ('no supe qué decir') es probablemente lo que más necesitas procesar ahora.");
  }

  // 4. CANSANCIO / RUTINA
  if (lower.match(/(noche|dormir|tarde|cansado|acostarme|sueño|cama|levantar)/)) {
    hiddenConflicts.push("🔋 **Batería Baja:** El cansancio físico puede estar distorsionando tu percepción de los problemas. Todo parece más grave con sueño.");
  }

  // Si faltan datos
  if (emotionalPatterns.length === 0 && socialDynamics.length === 0 && hiddenConflicts.length === 0) {
    emotionalPatterns.push("📝 **Superficialidad:** Has descrito los hechos, pero no cómo te sentiste con ellos. Intenta profundizar.");
  }

  const advice = "💡 Consejo: Si sentiste que no pudiste expresarte en el momento, escribe ahora una carta (sin enviarla) a esa persona diciendo todo lo que pensaste.";

  return { sentiment, summary, emotionalPatterns, socialDynamics, hiddenConflicts, advice };
};

const MOODS = [
  { label: "Muy Bien", icon: "🤩", id: "very_good" },
  { label: "Bien", icon: "🙂", id: "good" },
  { label: "Neutral", icon: "😐", id: "neutral" },
  { label: "Mal", icon: "😔", id: "bad" },
  { label: "Muy Mal", icon: "😢", id: "very_bad" },
];

export default function Diary({ user, onLogout }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // ESTADO NUEVO: 'entries' es un array (lista) de textos
  const [dayData, setDayData] = useState({ entries: [], mood: "neutral", aiResult: null });
  
  // Texto que estás escribiendo AHORA (antes de guardar)
  const [currentInput, setCurrentInput] = useState("");
  
  const [allNotes, setAllNotes] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  const STORAGE_KEY = "diary_db_v3_chat"; // Nueva versión de base de datos para estructura de lista

  // 1. CARGA INICIAL
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setAllNotes(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 2. GUARDADO DE FONDO (PERSISTENCIA)
  useEffect(() => {
    if (Object.keys(allNotes).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allNotes));
    }
  }, [allNotes]);

  // 3. SELECCIÓN DE DÍA
  useEffect(() => {
    const key = selectedDate.toDateString();
    const data = allNotes[key] || { entries: [], mood: "neutral", aiResult: null };
    
    // Migración silenciosa de formato viejo a nuevo si fuera necesario
    if (data.text && !data.entries) {
        setDayData({ entries: [data.text], mood: data.mood || "neutral", aiResult: data.aiResult });
    } else {
        setDayData(data);
    }
    
    setCurrentInput(""); // Limpiar input al cambiar de día
    if (isRecording) stopRecording();
  }, [selectedDate]); // Solo depende de la fecha (Rompe bucle infinito)

  // --- FUNCIÓN GUARDAR (ESTILO CHAT) ---
  const saveEntry = () => {
    if (!currentInput.trim()) return; // No guardar vacíos

    const key = selectedDate.toDateString();
    
    // 1. Agregamos lo nuevo a la lista existente
    const newEntries = [...(dayData.entries || []), currentInput];
    
    // 2. Actualizamos el estado local del día
    const newDayData = { ...dayData, entries: newEntries };
    setDayData(newDayData);
    
    // 3. Actualizamos la base de datos global y localStorage INMEDIATAMENTE
    const newAllNotes = { ...allNotes, [key]: newDayData };
    setAllNotes(newAllNotes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAllNotes));

    // 4. LIMPIEZA
    setCurrentInput(""); // ¡Aquí se borra el campo!
  };

  const updateMood = (moodId) => {
    const newData = { ...dayData, mood: moodId };
    setDayData(newData);
    setAllNotes(prev => ({ ...prev, [selectedDate.toDateString()]: newData }));
  };

  // --- GRABACIÓN ---
  const toggleRecording = () => isRecording ? stopRecording() : startRecording();

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Navegador no soporta voz.");

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);

    recognition.onresult = (event) => {
      let newTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          newTranscript += event.results[i][0].transcript + " ";
        }
      }
      setCurrentInput(prev => (prev + " " + newTranscript).trim());
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsRecording(false);
  };

  // --- AI (Analiza TODO el día, no solo lo último) ---
  const handleAIAnalysis = () => {
    // Unimos todas las entradas para que la IA tenga el contexto completo
    const fullText = (dayData.entries || []).join(" ") + " " + currentInput;
    
    const result = analyzeWithAI(fullText);
    if (result) {
        const newData = { ...dayData, aiResult: result };
        setDayData(newData);
        setAllNotes(prev => ({ ...prev, [selectedDate.toDateString()]: newData }));
    } else {
        alert("Necesito más información para analizarte (agrega más entradas).");
    }
  };

  const deleteDay = () => {
    if (window.confirm("¿Borrar TODO el registro de hoy?")) {
        const key = selectedDate.toDateString();
        const { [key]: deleted, ...rest } = allNotes;
        setAllNotes(rest);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
        setDayData({ entries: [], mood: "neutral", aiResult: null });
        setCurrentInput("");
    }
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
        const key = date.toDateString();
        // Marcamos si hay entradas guardadas
        if (allNotes[key] && allNotes[key].entries && allNotes[key].entries.length > 0) {
            return <div className="has-note-indicator"></div>;
        }
    }
    return null;
  };

  return (
    <div className="diary-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>Mi Diario</h2>
        <p>Selecciona una fecha</p>
        <Calendar 
          onChange={setSelectedDate} 
          value={selectedDate}
          locale="es-ES"
          tileContent={tileContent}
          next2Label={null} prev2Label={null}
        />
        <div className="logout-container">
            <button className="btn-logout" onClick={onLogout}>← Cerrar Sesión</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <h1 className="date-header">
            {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </h1>

        <div className="mood-section">
            <div className="mood-title">¿Cómo te sientes hoy?</div>
            <div className="mood-selector">
                {MOODS.map((m) => (
                    <div 
                        key={m.id} 
                        className={`mood-btn ${dayData.mood === m.id ? 'selected' : ''}`}
                        onClick={() => updateMood(m.id)}
                    >
                        <span>{m.icon}</span>
                        <label>{m.label}</label>
                    </div>
                ))}
            </div>
        </div>

        {/* --- LISTA DE ENTRADAS GUARDADAS (AQUÍ APARECE EL REGISTRO) --- */}
        <div className="entries-list" style={{marginBottom:'20px'}}>
            {dayData.entries && dayData.entries.length > 0 ? (
                dayData.entries.map((entry, idx) => (
                    <div key={idx} style={{
                        background: '#FFF8E1', 
                        padding: '15px', 
                        borderRadius: '12px', 
                        marginBottom: '10px',
                        borderLeft: '4px solid #FFB74D',
                        fontSize: '0.95rem',
                        lineHeight: '1.5'
                    }}>
                        {entry}
                    </div>
                ))
            ) : (
                <div style={{color:'#aaa', fontStyle:'italic', textAlign:'center', margin:'20px 0'}}>
                    No hay registros guardados hoy aún.
                </div>
            )}
        </div>

        {/* --- CAMPO DE ESCRITURA (NUEVO REGISTRO) --- */}
        <textarea
            className="diary-input"
            placeholder="Escribe algo nuevo aquí..."
            value={currentInput} // Esto se limpia al guardar
            onChange={(e) => setCurrentInput(e.target.value)}
            style={{minHeight: '100px', borderColor: '#E6A868'}}
        />

        <div className="action-bar">
            <button 
                className="btn-secondary" 
                onClick={toggleRecording}
                style={isRecording ? { backgroundColor: '#ffebee', color: '#d32f2f', borderColor: '#d32f2f' } : {}}
            >
                {isRecording ? "🛑 Detener" : "🎤 Grabar"}
            </button>
            
            <button className="btn-primary" onClick={saveEntry} style={{backgroundColor: '#66BB6A'}}>
                💾 Guardar Entrada
            </button>

            <button className="btn-primary" onClick={handleAIAnalysis} style={{backgroundColor: '#E6A868'}}>
                🤖 Análisis Completo
            </button>
            
            <button className="btn-delete" onClick={deleteDay}>Limpiar Día</button>
        </div>

        {/* --- RESULTADO IA EXTENDIDO --- */}
        {dayData.aiResult && (
            <div className="ai-analysis-card" style={{marginTop:'30px', background:'#F3F4F6', borderLeft:'6px solid #5C6BC0'}}>
                <div className="ai-header" style={{color:'#3949AB', fontSize:'1.2rem', marginBottom:'15px'}}>
                    <span>🧠 Psico-Análisis del Día</span>
                </div>
                
                <div className="ai-content">
                    <p style={{fontSize:'1.1rem', fontWeight:'bold', color:'#333'}}>
                        {dayData.aiResult.sentiment}
                    </p>
                    <p style={{fontStyle:'italic', marginBottom:'20px', color:'#555'}}>
                        "{dayData.aiResult.summary}"
                    </p>

                    {/* Sección: Patrones Emocionales */}
                    {dayData.aiResult.emotionalPatterns.length > 0 && (
                        <div style={{marginBottom:'15px'}}>
                            <strong style={{color:'#D81B60'}}>❤️ Patrones Emocionales:</strong>
                            <ul style={{marginTop:'5px', paddingLeft:'20px'}}>
                                {dayData.aiResult.emotionalPatterns.map((p, i) => (
                                    <li key={i} style={{marginBottom:'5px'}} dangerouslySetInnerHTML={{__html: p.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}} />
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Sección: Dinámicas Sociales */}
                    {dayData.aiResult.socialDynamics.length > 0 && (
                        <div style={{marginBottom:'15px'}}>
                            <strong style={{color:'#1E88E5'}}>👥 Vínculos y Entorno:</strong>
                            <ul style={{marginTop:'5px', paddingLeft:'20px'}}>
                                {dayData.aiResult.socialDynamics.map((p, i) => (
                                    <li key={i} style={{marginBottom:'5px'}} dangerouslySetInnerHTML={{__html: p.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}} />
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Sección: Conflictos */}
                    {dayData.aiResult.hiddenConflicts.length > 0 && (
                        <div style={{marginBottom:'15px'}}>
                            <strong style={{color:'#FB8C00'}}>⚠️ Conflictos Ocultos:</strong>
                            <ul style={{marginTop:'5px', paddingLeft:'20px'}}>
                                {dayData.aiResult.hiddenConflicts.map((p, i) => (
                                    <li key={i} style={{marginBottom:'5px'}} dangerouslySetInnerHTML={{__html: p.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}} />
                                ))}
                            </ul>
                        </div>
                    )}

                    <div style={{marginTop:'20px', padding:'15px', background:'white', borderRadius:'8px', border:'1px solid #ddd'}}>
                        <strong style={{color:'#2E7D32', fontSize:'1.1rem'}}>🌱 Sugerencia Terapéutica:</strong>
                        <p style={{marginTop:'5px', fontSize:'1rem'}}>{dayData.aiResult.advice}</p>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}