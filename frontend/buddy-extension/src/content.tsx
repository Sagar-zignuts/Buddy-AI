import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { extractProblemText } from "./utils/dom";
import { askForHints, login as apiLogin, sendOtp, verifyOtp, getMe, __injectGetToken, generateQuiz, BACKEND_URL, aiChat, getChatHistoryApi, clearChatApi } from "./utils/api";
import { getToken as storageGetToken, saveToken, clearToken } from "./utils/storage";
import "./index.css";

// Provide token getter to API module
__injectGetToken(storageGetToken);

// Expose a toggle function for background.js (avoid reinjecting the bundle)
declare global { interface Window { __buddyTogglePanel?: () => void } }

type View = "auth" | "main";

function AuthPanel({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"choose" | "otp">("choose");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [themeLight, setThemeLight] = useState<boolean>(false);
  const [manualThemeOverride, setManualThemeOverride] = useState<boolean | null>(null);

  async function handleSendOtp() {
    try {
      setLoading(true);
      setError("");
      await sendOtp(email.trim(), password.trim() || undefined, name.trim() || undefined);
      setStep("otp");
    } catch (e: any) {
      setError(e?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    try {
      setLoading(true);
      setError("");
      const res = await verifyOtp(email.trim(), otp.trim(), name.trim() || undefined);
      if (res.token) await saveToken(res.token);
      onAuthenticated();
    } catch (e: any) {
      setError(e?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    try {
      setLoading(true);
      setError("");
      const res = await apiLogin(email.trim(), password.trim());
      if (res.token) await saveToken(res.token);
      onAuthenticated();
    } catch (e: any) {
      setError(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Only auto-detect if manual override is not set
    if (manualThemeOverride === null) {
      // Invert logic: if website is light, extension should be dark (themeLight = false)
      // if website is dark, extension should be light (themeLight = true)
      const isWebsiteLight = detectLightTheme();
      setThemeLight(!isWebsiteLight);
    }
    
    // Re-check theme when page content changes (for dynamic sites) - only if no manual override
    const observer = new MutationObserver(() => {
      if (manualThemeOverride === null) {
        const isWebsiteLight = detectLightTheme();
        setThemeLight(!isWebsiteLight);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    return () => observer.disconnect();
  }, [manualThemeOverride]);
  
  // Update theme when manual override changes
  useEffect(() => {
    if (manualThemeOverride !== null) {
      setThemeLight(manualThemeOverride);
    }
  }, [manualThemeOverride]);

  const containerClass = `buddy-container${themeLight ? " light" : ""}`;
  return (
    <div className={containerClass}>
      <div className="buddy-header" id="buddy-drag-handle">
        <span>Buddy • Sign in</span>
        <div className="buddy-header-buttons">
          <button 
            className="buddy-theme-toggle" 
            onClick={(e) => {
              e.stopPropagation();
              if (manualThemeOverride === null) {
                // First manual toggle - set to opposite of current auto-detected theme
                setManualThemeOverride(!themeLight);
              } else {
                // Toggle between light and dark
                setManualThemeOverride(!manualThemeOverride);
              }
            }}
            title={themeLight ? "Switch to Dark Theme" : "Switch to Light Theme"}
          >
            {themeLight ? "🌙" : "☀️"}
          </button>
        </div>
      </div>
      <div className="buddy-row" style={{justifyContent:"space-between"}}>
        <button className="buddy-btn" onClick={() => {
          const w = window.open(`${BACKEND_URL}/api/auth/google?state=ext`, "buddy_google_oauth", "width=480,height=640");
          const listener = async (ev: MessageEvent) => {
            if (!ev?.data || ev.data.source !== 'buddy-auth') return;
            try {
              if (ev.data.token) { await saveToken(ev.data.token); onAuthenticated(); }
            } finally {
              window.removeEventListener('message', listener);
              try { w?.close(); } catch {}
            }
          };
        
          window.addEventListener('message', listener);
        }}>Continue with Google</button>
      </div>

      <div className="buddy-section">
        <div className="buddy-label">Email</div>
        <input className="buddy-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
      </div>

      {step === "choose" && (
        <>
          <div className="buddy-section">
            <div className="buddy-label">Password</div>
            <input className="buddy-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="buddy-section">
            <div className="buddy-label">Name (optional for login, used on first signup)</div>
            <input className="buddy-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="buddy-row">
            <button className="buddy-btn" disabled={loading || !email} onClick={handleLogin}>{loading ? "Loading…" : "Login"}</button>
            <button className="buddy-btn" disabled={loading || !email} onClick={handleSendOtp}>{loading ? "Sending…" : "Send OTP"}</button>
          </div>
        </>
      )}

      {step === "otp" && (
        <div className="buddy-section">
          <div className="buddy-label">Enter OTP from email</div>
          <input className="buddy-input" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" />
          <div className="buddy-row">
            <button className="buddy-btn" disabled={loading || !otp} onClick={handleVerifyOtp}>{loading ? "Verifying…" : "Verify & Continue"}</button>
            <button className="buddy-btn" disabled={loading} onClick={handleSendOtp}>Resend</button>
          </div>
        </div>
      )}

      {error && <div className="buddy-error">{error}</div>}
    </div>
  );
}

function detectLightTheme(): boolean {
  try {
    // Check multiple elements to get a better sense of the page background
    const elements = [
      document.documentElement,
      document.body,
      ...Array.from(document.querySelectorAll('main, article, section, div')).slice(0, 5)
    ];
    
    let totalLuminance = 0;
    let validSamples = 0;
    
    for (const el of elements) {
      try {
        const bg = getComputedStyle(el).backgroundColor;
        if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') continue;
        
        const m = bg.match(/rgba?\((\d+),(\d+),(\d+)/);
        if (!m) continue;
        
        const r = parseInt(m[1], 10), g = parseInt(m[2], 10), b = parseInt(m[3], 10);
        const luminance = 0.2126*(r/255) + 0.7152*(g/255) + 0.0722*(b/255);
        totalLuminance += luminance;
        validSamples++;
      } catch {}
    }
    
    // If we have samples, use average; otherwise default to checking body
    if (validSamples > 0) {
      const avgLuminance = totalLuminance / validSamples;
      return avgLuminance > 0.5; // Threshold for light theme
    }
    
    // Fallback: check body background
    const bg = getComputedStyle(document.body).backgroundColor || 
               getComputedStyle(document.documentElement).backgroundColor || 
               "rgb(255,255,255)";
    const m = bg.match(/rgba?\((\d+),(\d+),(\d+)/);
    if (!m) return false;
    const r = parseInt(m[1], 10), g = parseInt(m[2], 10), b = parseInt(m[3], 10);
    const luminance = 0.2126*(r/255) + 0.7152*(g/255) + 0.0722*(b/255);
    return luminance > 0.5;
  } catch { return false; }
}

function BuddyPanel() {
  const [problemText, setProblemText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [hint, setHint] = useState<string>("");
  const [customQuestion, setCustomQuestion] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"hints" | "quiz" | "flashcards" | "chat">("hints");
  const [themeLight, setThemeLight] = useState<boolean>(false);
  const [manualThemeOverride, setManualThemeOverride] = useState<boolean | null>(null);
  const [moveMode, setMoveMode] = useState<boolean>(false);
  // quiz state
  const [quizText, setQuizText] = useState("");
  const [quizType, setQuizType] = useState<"mcq" | "short">("mcq");
  const [quizCount, setQuizCount] = useState(5);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [mcqSelections, setMcqSelections] = useState<Record<number, number>>({});
  // flashcard state for short answers (used in quiz)
  const [cardIndex, setCardIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState(0);
  // dedicated flashcards state
  const [flashcardText, setFlashcardText] = useState("");
  const [flashcardCount, setFlashcardCount] = useState(5);
  const [flashcardResult, setFlashcardResult] = useState<any>(null);
  const [flashcardCardIndex, setFlashcardCardIndex] = useState(0);
  const [flashcardUserAnswer, setFlashcardUserAnswer] = useState("");
  const [flashcardIsFlipped, setFlashcardIsFlipped] = useState(false);
  const [flashcardScore, setFlashcardScore] = useState(0);
  // chat state
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail) setChatHistory(e.detail as any);
    };
    window.addEventListener('buddy-load-history', handler as any);
    return () => window.removeEventListener('buddy-load-history', handler as any);
  }, []);

  useEffect(() => {
    const text = extractProblemText();
    setProblemText(text);
    
    // Load chat history on mount (handles first load after auth)
    (async () => {
      try {
        const h = await getChatHistoryApi();
        setChatHistory(h.messages as any);
      } catch {}
    })();
    
    // Only auto-detect if manual override is not set
    if (manualThemeOverride === null) {
      // Invert logic: if website is light, extension should be dark (themeLight = false)
      // if website is dark, extension should be light (themeLight = true)
      const isWebsiteLight = detectLightTheme();
      setThemeLight(!isWebsiteLight);
    }
    
    // Re-check theme when page content changes (for dynamic sites) - only if no manual override
    const observer = new MutationObserver(() => {
      if (manualThemeOverride === null) {
        const isWebsiteLight = detectLightTheme();
        setThemeLight(!isWebsiteLight);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    return () => observer.disconnect();
  }, [manualThemeOverride]);
  
  // Update theme when manual override changes
  useEffect(() => {
    if (manualThemeOverride !== null) {
      setThemeLight(manualThemeOverride);
    }
  }, [manualThemeOverride]);
  
  // Update cursor and outline when move mode changes
  useEffect(() => {
    const host = document.getElementById("buddy-root-container");
    if (host) {
      host.style.cursor = moveMode ? "move" : "auto";
      host.style.outline = moveMode ? "2px dashed rgba(255,255,255,0.35)" : "";
    }
  }, [moveMode]);

  const canAsk = useMemo(() => problemText.trim().length > 0, [problemText]);

  async function requestHints(payloadOverride?: string) {
    try {
      setLoading(true);
      setError("");
      setHint("");
      const toSend = payloadOverride ?? problemText;
      const res = await askForHints(toSend);
      setHint(res);
    } catch (e: any) {
      setError(e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const containerClass = `buddy-container${themeLight ? " light" : ""}`;
  return (
    <div className={containerClass}>
      <button className="buddy-close-btn" onClick={() => {
        const host = document.getElementById("buddy-root-container");
        if (host && host.parentElement) host.parentElement.removeChild(host);
      }}>×</button>
      <div className="buddy-header" id="buddy-drag-handle">
        <span>Buddy</span>
        <div className="buddy-header-buttons">
          <button 
            className={`buddy-move-btn ${moveMode ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setMoveMode(!moveMode);
            }}
            title={moveMode ? "Click to disable move mode" : "Click to enable move mode (drag anywhere)"}
          >
            {moveMode ? "Done" : "Move"}
          </button>
          <button 
            className="buddy-theme-toggle" 
            onClick={(e) => {
              e.stopPropagation();
              if (manualThemeOverride === null) {
                // First manual toggle - set to opposite of current auto-detected theme
                setManualThemeOverride(!themeLight);
              } else {
                // Toggle between light and dark
                setManualThemeOverride(!manualThemeOverride);
              }
            }}
            title={themeLight ? "Switch to Dark Theme" : "Switch to Light Theme"}
          >
            {themeLight ? "🌙" : "☀️"}
          </button>
        </div>
      </div>
      <div className="buddy-row" style={{ gap: 8, marginTop: 6 }}>
        <button className="buddy-btn" onClick={() => setActiveTab("hints")} disabled={activeTab === "hints"}>Hints</button>
        <button className="buddy-btn" onClick={() => setActiveTab("quiz")} disabled={activeTab === "quiz"}>AI Quiz</button>
        <button className="buddy-btn" onClick={() => setActiveTab("flashcards")} disabled={activeTab === "flashcards"}>Flashcards</button>
        <button className="buddy-btn" onClick={() => setActiveTab("chat")} disabled={activeTab === "chat"}>AI Chat</button>
      </div>
      {activeTab === "hints" && (
      <>
      <div className="buddy-section">
        <div className="buddy-label">Detected Problem</div>
        <textarea
          value={problemText}
          onChange={(e) => setProblemText(e.target.value)}
          className="buddy-textarea"
          rows={6}
        />
      </div>
      <div className="buddy-row">
        <button disabled={!canAsk || loading} onClick={() => requestHints()} className="buddy-btn">
          {loading ? "Asking…" : "Get Hints"}
        </button>
      </div>

      <div className="buddy-section">
        <div className="buddy-label">Ask a custom question</div>
        <input
          value={customQuestion}
          onChange={(e) => setCustomQuestion(e.target.value)}
          className="buddy-input"
          placeholder="e.g. Explain time complexity"
        />
        <button
          disabled={customQuestion.trim().length === 0 || loading}
          onClick={() => requestHints(`${problemText}\n\nQuestion: ${customQuestion}`)}
          className="buddy-btn"
        >
          {loading ? "Asking…" : "Ask"}
        </button>
      </div>

      {error && <div className="buddy-error">{error}</div>}
      {hint && (
        <div className="buddy-section">
          <div className="buddy-label">Hints</div>
          <div className="buddy-hint" dangerouslySetInnerHTML={{ __html: hint.replace(/\n/g, "<br/>") }} />
        </div>
      )}

      
      </>
      )}

      {activeTab === "chat" && (
        <div className="buddy-section">
          <div className="buddy-row" style={{justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
            <div className="buddy-label" style={{margin: 0}}>Buddy Chat</div>
            {chatHistory.length > 0 && (
              <button 
                className="buddy-btn" 
                style={{padding: '4px 10px', fontSize: '12px'}}
                onClick={() => setShowClearConfirm(true)}
                disabled={loading}
              >
                Clear Chat
              </button>
            )}
          </div>
          <div className="buddy-row" style={{alignItems:'stretch'}}>
            <input className="buddy-input" style={{flex:1}} value={chatInput} onChange={(e)=>setChatInput(e.target.value)} placeholder="Type your message…" onKeyPress={(e) => {
              if (e.key === 'Enter' && !loading && chatInput.trim().length > 0) {
                (async () => {
                  try {
                    setLoading(true); setError("");
                    const userMsg = chatInput.trim();
                    setChatHistory(h=>[...h,{role:'user', content:userMsg}]);
                    setChatInput("");
                    const res = await aiChat(userMsg, chatHistory);
                    setChatHistory(h=>[...h,{role:'assistant', content: res.reply}]);
                  } catch(e:any){ setError(e?.message||'Chat failed'); }
                  finally { setLoading(false); }
                })();
              }
            }} />
            <button className="buddy-btn" disabled={loading || chatInput.trim().length===0} onClick={async ()=>{
              try {
                setLoading(true); setError("");
                const userMsg = chatInput.trim();
                setChatHistory(h=>[...h,{role:'user', content:userMsg}]);
                setChatInput("");
                const res = await aiChat(userMsg, chatHistory);
                setChatHistory(h=>[...h,{role:'assistant', content: res.reply}]);
              } catch(e:any){ setError(e?.message||'Chat failed'); }
              finally { setLoading(false); }
            }}>{loading?"Sending…":"Send"}</button>
          </div>
          <div className="buddy-hint" style={{maxHeight: 220, overflow: "auto", marginTop:10}}>
            {chatHistory.length === 0 && <div style={{opacity:0.8}}>Say hi! Buddy responds with empathy and actionable steps.</div>}
            {chatHistory.map((m, i) => (
              <div key={i} style={{margin: '6px 0'}}>
                <strong>{m.role === 'user' ? 'You' : 'Buddy'}:</strong> <span>{m.content}</span>
              </div>
            ))}
          </div>
          {error && <div className="buddy-error">{error}</div>}
          
          {/* Clear Chat Confirmation Popup */}
          {showClearConfirm && (
            <div className="buddy-modal-overlay" onClick={() => setShowClearConfirm(false)}>
              <div className="buddy-modal" onClick={(e) => e.stopPropagation()}>
                <div className="buddy-modal-header">
                  <div className="buddy-label" style={{fontSize: '14px', fontWeight: 600, margin: 0}}>Clear Chat?</div>
                </div>
                <div className="buddy-modal-body">
                  <p style={{margin: '8px 0', fontSize: '13px', opacity: 0.9}}>
                    Are you sure you want to clear all chat messages? This action cannot be undone.
                  </p>
                </div>
                <div className="buddy-modal-footer">
                  <button 
                    className="buddy-btn" 
                    style={{flex: 1, background: 'rgba(239,68,68,0.8)'}}
                    onClick={() => setShowClearConfirm(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    className="buddy-btn" 
                    style={{flex: 1, background: 'linear-gradient(135deg, #4CAF50 0%, #2E8B57 100%)'}}
                    onClick={async () => {
                      try {
                        setLoading(true);
                        setError("");
                        await clearChatApi();
                        setChatHistory([]);
                        setShowClearConfirm(false);
                      } catch(e:any) {
                        setError(e?.message || 'Failed to clear chat');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? "Clearing…" : "Clear"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "quiz" && (
        <div className="buddy-section">
          <div className="buddy-label">Enter topic or paste text</div>
          <textarea className="buddy-textarea" rows={6} value={quizText} onChange={(e)=>setQuizText(e.target.value)} />
          <div className="buddy-row" style={{ gap:8 }}>
            <select className="buddy-input" value={quizType} onChange={(e)=>setQuizType(e.target.value as any)} disabled={!!quizResult}>
              <option value="mcq">Multiple choice</option>
              <option value="short">Short answer</option>
            </select>
            <input className="buddy-input" type="number" min={1} max={20} value={quizCount} onChange={(e)=>setQuizCount(parseInt(e.target.value||"5",10))} disabled={!!quizResult} />
            <button className="buddy-btn" disabled={quizText.trim().length===0 || loading} onClick={async ()=>{
              try{ setLoading(true); setError(""); setQuizResult(null); setCardIndex(0); setScore(0); setIsFlipped(false); setMcqSelections({}); }
              finally{}
              try {
                const res = await generateQuiz(quizText, quizType, quizCount);
                setQuizResult(res);
              } catch(e:any){ setError(e?.message||"Quiz failed"); }
              finally { setLoading(false); }
            }}>{loading?"Generating…":"Generate"}</button>
            {!!quizResult && <button className="buddy-btn" onClick={()=>{ setQuizResult(null); setMcqSelections({}); setUserAnswer(""); setIsFlipped(false); setCardIndex(0); setScore(0); }}>Reset</button>}
          </div>
          {error && <div className="buddy-error">{error}</div>}
          {quizResult && quizType === "mcq" && (
            <div className="buddy-section">
              <div className="buddy-label">Quiz (MCQ)</div>
              {quizResult?.questions?.map((q:any, idx:number)=>{
                const selected = mcqSelections[idx];
                return (
                  <div key={idx} className="buddy-hint" style={{marginTop:8}}>
                    <div style={{marginBottom:6}}>{idx+1}. {q.question}</div>
                    <div style={{display:"grid", gap:6}}>
                      {q.options?.map((opt:string, oi:number)=> {
                        const isSelected = selected === oi;
                        const isCorrect = oi === q.answerIndex;
                        const showCorrect = selected !== undefined;
                        const bg = isSelected ? (isCorrect ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)") : (showCorrect && isCorrect ? "rgba(34,197,94,0.2)" : undefined);
                        return (
                          <button
                            key={oi}
                            className="buddy-btn"
                            style={{ background: bg || undefined }}
                            disabled={selected !== undefined}
                            onClick={() => setMcqSelections(s => ({ ...s, [idx]: oi }))}
                          >
                            {String.fromCharCode(65+oi)}. {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {quizResult && quizType === "short" && (
            <div className="buddy-section">
              <div className="buddy-label">Flashcards (Short Answer)</div>
              {(() => {
                const qs = quizResult?.questions||[];
                const current = qs[cardIndex] || {question:"", answer:""};
                return (
                  <div>
                    <div className="flashcard-wrapper">
                      <div className={`flashcard ${isFlipped?"is-flipped":""}`}>
                        <div className="flashcard-face front">
                          <strong>Q{cardIndex+1}:</strong> 
                          <div className="flashcard-content">{current.question}</div>
                        </div>
                        <div className="flashcard-face back">
                          <strong>Answer:</strong> 
                          <div className="flashcard-content">{current.answer}</div>
                        </div>
                      </div>
                    </div>
                    <div className="buddy-row" style={{marginTop:10}}>
                      <input className="buddy-input" value={userAnswer} onChange={(e)=>setUserAnswer(e.target.value)} placeholder="Your answer" />
                      <button className="buddy-btn" onClick={()=>{ setIsFlipped(true); if(userAnswer.trim().toLowerCase()===String(current.answer||"").trim().toLowerCase()) setScore(s=>s+1); }}>Submit & show</button>
                      <button className="buddy-btn" onClick={()=>{ setIsFlipped(false); setUserAnswer(""); setCardIndex(i=> Math.min(i+1, (qs.length-1))); }}>Next</button>
                    </div>
                    <div className="buddy-label" style={{marginTop:6}}>Score: {score} / {qs.length}</div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {activeTab === "flashcards" && (
        <div className="buddy-section">
          <div className="buddy-label">Enter topic or paste text to create flashcards</div>
          <textarea className="buddy-textarea" rows={6} value={flashcardText} onChange={(e)=>setFlashcardText(e.target.value)} placeholder="Enter the topic or content you want to study..." />
          <div className="buddy-row" style={{ gap:8 }}>
            <input className="buddy-input" type="number" min={1} max={20} value={flashcardCount} onChange={(e)=>setFlashcardCount(parseInt(e.target.value||"5",10))} disabled={!!flashcardResult} placeholder="Number of cards" />
            <button className="buddy-btn" disabled={flashcardText.trim().length===0 || loading} onClick={async ()=>{
              try{ 
                setLoading(true); 
                setError(""); 
                setFlashcardResult(null); 
                setFlashcardCardIndex(0); 
                setFlashcardScore(0); 
                setFlashcardIsFlipped(false); 
              } finally{}
              try {
                const res = await generateQuiz(flashcardText, "short", flashcardCount);
                setFlashcardResult(res);
              } catch(e:any){ setError(e?.message||"Flashcard generation failed"); }
              finally { setLoading(false); }
            }}>{loading?"Generating…":"Generate Flashcards"}</button>
            {!!flashcardResult && <button className="buddy-btn" onClick={()=>{ 
              setFlashcardResult(null); 
              setFlashcardUserAnswer(""); 
              setFlashcardIsFlipped(false); 
              setFlashcardCardIndex(0); 
              setFlashcardScore(0); 
            }}>Reset</button>}
          </div>
          {error && <div className="buddy-error">{error}</div>}
          {flashcardResult && (
            <div className="buddy-section">
              <div className="buddy-label">Flashcards</div>
              {(() => {
                const qs = flashcardResult?.questions||[];
                if (qs.length === 0) {
                  return <div className="buddy-hint">No flashcards generated. Try again with different content.</div>;
                }
                const current = qs[flashcardCardIndex] || {question:"", answer:""};
                return (
                  <div>
                    <div className="buddy-label" style={{marginBottom:8}}>Card {flashcardCardIndex + 1} of {qs.length}</div>
                    <div className="flashcard-wrapper">
                      <div className={`flashcard ${flashcardIsFlipped?"is-flipped":""}`}>
                        <div className="flashcard-face front">
                          <strong>Question:</strong> 
                          <div className="flashcard-content">{current.question}</div>
                        </div>
                        <div className="flashcard-face back">
                          <strong>Answer:</strong> 
                          <div className="flashcard-content">{current.answer}</div>
                        </div>
                      </div>
                    </div>
                    <div className="buddy-row" style={{marginTop:10}}>
                      <input 
                        className="buddy-input" 
                        value={flashcardUserAnswer} 
                        onChange={(e)=>setFlashcardUserAnswer(e.target.value)} 
                        placeholder="Type your answer..." 
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !flashcardIsFlipped) {
                            setFlashcardIsFlipped(true);
                            if(flashcardUserAnswer.trim().toLowerCase() === String(current.answer||"").trim().toLowerCase()) {
                              setFlashcardScore(s=>s+1);
                            }
                          }
                        }}
                      />
                      <button 
                        className="buddy-btn" 
                        onClick={()=>{ 
                          if (!flashcardIsFlipped) {
                            setFlashcardIsFlipped(true); 
                            if(flashcardUserAnswer.trim().toLowerCase() === String(current.answer||"").trim().toLowerCase()) {
                              setFlashcardScore(s=>s+1);
                            }
                          } else {
                            setFlashcardIsFlipped(false);
                          }
                        }}
                      >
                        {flashcardIsFlipped ? "Hide Answer" : "Check Answer"}
                      </button>
                      <button 
                        className="buddy-btn" 
                        onClick={()=>{ 
                          setFlashcardIsFlipped(false); 
                          setFlashcardUserAnswer(""); 
                          setFlashcardCardIndex(i=> Math.min(i+1, (qs.length-1))); 
                        }}
                        disabled={flashcardCardIndex >= qs.length - 1}
                      >
                        Next
                      </button>
                    </div>
                    <div className="buddy-row" style={{marginTop:8, justifyContent: 'space-between'}}>
                      <button 
                        className="buddy-btn" 
                        onClick={()=>{ 
                          setFlashcardIsFlipped(false); 
                          setFlashcardUserAnswer(""); 
                          setFlashcardCardIndex(i=> Math.max(0, i-1)); 
                        }}
                        disabled={flashcardCardIndex === 0}
                        style={{flex: 1}}
                      >
                        Previous
                      </button>
                      <button 
                        className="buddy-btn" 
                        onClick={()=>{ 
                          setFlashcardIsFlipped(false); 
                          setFlashcardUserAnswer(""); 
                          setFlashcardCardIndex(0); 
                          setFlashcardScore(0);
                        }}
                        style={{flex: 1}}
                      >
                        Restart
                      </button>
                    </div>
                    <div className="buddy-label" style={{marginTop:10, textAlign: 'center'}}>
                      Score: {flashcardScore} / {qs.length}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AppPanel() {
  const [view, setView] = useState<View>("auth");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await storageGetToken();
        if (!token) {
          setView("auth");
          return;
        }
        await getMe();
        // load chat history
        try {
          const h = await getChatHistoryApi();
          // @ts-ignore accessing child state via dispatch is avoided; we use custom event
          window.dispatchEvent(new CustomEvent('buddy-load-history', { detail: h.messages }));
        } catch {}
        setView("main");
      } catch {
        await clearToken();
        setView("auth");
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  if (checking) {
    return (
      <div className="buddy-container"><div className="buddy-header">Buddy</div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div className="buddy-label">Loading…</div>
          <div style={{width:16,height:16,border:'3px solid rgba(255,255,255,0.35)',borderTopColor:'#fff',borderRadius:'50%',animation:'buddy-spin 0.8s linear infinite'}} />
        </div>
      </div>
    );
  }

  if (view === "auth") return <AuthPanel onAuthenticated={() => setView("main")} />;
  return <BuddyPanel />;
}

function enableDragAndResize(host: HTMLDivElement, getMoveMode: () => boolean) {
  // Drag is enabled only in explicit move mode
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  const margin = 12; // distance from viewport edges

  const clampToViewport = (leftCandidate: number, topCandidate: number) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const elementWidth = host.offsetWidth;
    const elementHeight = host.offsetHeight;

    const maxLeft = Math.max(margin, viewportWidth - elementWidth - margin);
    const maxTop = Math.max(margin, viewportHeight - elementHeight - margin);

    const clampedLeft = Math.min(Math.max(leftCandidate, margin), maxLeft);
    const clampedTop = Math.min(Math.max(topCandidate, margin), maxTop);

    return { left: clampedLeft, top: clampedTop };
  };

  const keepInViewport = () => {
    const rect = host.getBoundingClientRect();
    const usingLeftPositioning = host.style.right === "";
    if (!usingLeftPositioning) {
      // Only adjust top when panel is still using right-based positioning
      const { top } = clampToViewport(rect.left, rect.top);
      host.style.top = `${top}px`;
      return;
    }

    const { left, top } = clampToViewport(rect.left, rect.top);
    host.style.left = `${left}px`;
    host.style.top = `${top}px`;
    host.style.right = "";
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const { left, top } = clampToViewport(startLeft + dx, startTop + dy);
    host.style.left = `${left}px`;
    host.style.top = `${top}px`;
  };

  const onMouseUp = () => {
    isDragging = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    keepInViewport();
  };

  const onMouseDown = (e: MouseEvent) => {
    const canDrag = getMoveMode(); // Only allow drag when in move mode
    if (!canDrag) return;
    // Don't drag if clicking on buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    
    isDragging = true;
    // Switch to left positioning if it was using right
    const rect = host.getBoundingClientRect();
    host.style.right = "";
    host.style.left = `${rect.left}px`;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  host.addEventListener("mousedown", onMouseDown);
  
  // Update cursor based on move mode
  const updateCursor = () => {
    host.style.cursor = getMoveMode() ? "move" : "auto";
    host.style.outline = getMoveMode() ? "2px dashed rgba(255,255,255,0.35)" : "";
  };
  
  // Check move mode periodically
  const interval = setInterval(updateCursor, 100);
  
  // Add resize handle (bottom-right corner)
  const resizer = document.createElement("div");
  resizer.style.position = "absolute";
  resizer.style.right = "0";
  resizer.style.bottom = "0";
  resizer.style.width = "14px";
  resizer.style.height = "14px";
  resizer.style.cursor = "nwse-resize";
  resizer.style.background = "linear-gradient(135deg, rgba(255,255,255,0.35), rgba(0,0,0,0.25))";
  resizer.style.borderTopLeftRadius = "6px";
  host.appendChild(resizer);

  let resizing = false;
  let startW = 0;
  let startH = 0;

  const onResizeMove = (e: MouseEvent) => {
    if (!resizing) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const newW = Math.max(280, startW + dx);
    const newH = Math.max(240, startH + dy);
    host.style.width = `${newW}px`;
    host.style.maxHeight = `${newH}px`;
    keepInViewport();
  };

  const onResizeUp = () => {
    resizing = false;
    document.removeEventListener("mousemove", onResizeMove);
    document.removeEventListener("mouseup", onResizeUp);
  };

  resizer.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    resizing = true;
    const rect = host.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startW = rect.width;
    startH = rect.height;
    document.addEventListener("mousemove", onResizeMove);
    document.addEventListener("mouseup", onResizeUp);
  });

  // Keep panel inside viewport on window resize
  const onWindowResize = () => {
    keepInViewport();
  };
  window.addEventListener("resize", onWindowResize);

  return () => {
    clearInterval(interval);
    host.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("resize", onWindowResize);
  };
}

function mount() {
  const containerId = "buddy-root-container";
  if (document.getElementById(containerId)) return;

  const host = document.createElement("div");
  host.id = containerId;
  host.style.position = "fixed";
  host.style.top = "80px";
  host.style.right = "16px";
  host.style.zIndex = "999999";
  host.style.width = "360px";
  host.style.maxHeight = "80vh";
  host.style.overflow = "auto";
  const rootContainer = document.createElement("div");
  host.appendChild(rootContainer);
  document.documentElement.appendChild(host);
  const root = createRoot(rootContainer);
  root.render(<AppPanel />);
  
  // Get move mode from the React component
  let moveModeRef = false;
  const getMoveMode = () => {
    const moveBtn = host.querySelector('.buddy-move-btn');
    if (moveBtn) {
      moveModeRef = moveBtn.classList.contains('active');
    }
    return moveModeRef;
  };
  
  enableDragAndResize(host, getMoveMode);
}

// Toggle function (mount if not present, otherwise remove)
window.__buddyTogglePanel = () => {
  const containerId = "buddy-root-container";
  const el = document.getElementById(containerId);
  if (el) {
    el.remove();
  } else {
    mount();
  }
};

