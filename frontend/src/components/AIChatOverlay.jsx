import { useState, useEffect, useRef } from "react";
import { FaTimes, FaMagic, FaTrash, FaPaperPlane, FaRobot } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import "../styles/rightSideMenu.css";
import "../styles/aiChatOverlay.css";

const AI_URL = import.meta.env.VITE_AI_API_URL;

const AIChatOverlay = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hasSentGreeting = useRef(false);

  const token = localStorage.getItem("eventick_token");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (!hasSentGreeting.current && messages.length === 0) {
        // Show a welcome message on first open
        setMessages([
          {
            role: "assistant",
            content: `Hey ${user?.firstName || "there"}! I'm Eventick AI ✦\n\nI can help you discover events, answer booking questions, and assist with anything Eventick-related. What's on your mind?`,
          },
        ]);
        hasSentGreeting.current = true;
      }
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setLoading(true);

    try {
      const res = await fetch(`${AI_URL}/response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I couldn't process that. Please try again." },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Make sure the AI service is running." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (clearing) return;
    setClearing(true);
    try {
      await fetch(`${AI_URL}/clear`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      hasSentGreeting.current = false;
      setMessages([
        {
          role: "assistant",
          content: `Chat cleared! Ready for a fresh start, ${user?.firstName || "there"} ✦`,
        },
      ]);
    } catch (err) {
      console.error("Failed to clear chat:", err);
    } finally {
      setClearing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="right-menu-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="right-menu-panel ai-chat-panel">

        {/* Header */}
        <div className="ai-chat-header">
          <div className="ai-chat-header-left">
            <div className="ai-chat-avatar" style={{ padding: 0, overflow: "hidden" }}>
              <img src="/favicon.png" alt="Eventick AI" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div className="ai-chat-title-block">
              <span className="ai-chat-title">Eventick AI</span>
              <span className="ai-chat-subtitle">✦ Your personal event assistant</span>
            </div>
          </div>
          <div className="ai-chat-header-actions">
            <button
              className="ai-chat-clear-btn"
              onClick={clearHistory}
              disabled={clearing}
              title="Clear chat history"
            >
              <FaTrash />
            </button>
            <button className="right-menu-close" onClick={onClose} title="Close">
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="ai-messages-area">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-message-row ${msg.role}`}>
              {msg.role === "assistant" && (
                <div className="ai-bot-avatar">
                  <img src="/favicon.png" alt="Eventick AI" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              <div className={`ai-bubble ${msg.role}`}>
                {msg.content.split("\n").map((line, j) => (
                  <span key={j}>
                    {line}
                    {j < msg.content.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {loading && (
            <div className="ai-message-row assistant">
              <div className="ai-bot-avatar">
                <FaRobot />
              </div>
              <div className="ai-bubble assistant ai-typing-bubble">
                <span className="ai-dot" />
                <span className="ai-dot" />
                <span className="ai-dot" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="ai-input-bar">
          <textarea
            ref={inputRef}
            className="ai-input-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Eventick AI anything..."
            rows={1}
            disabled={loading}
          />
          <button
            className="ai-send-btn"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            title="Send"
          >
            <FaPaperPlane />
          </button>
        </div>

      </div>
    </div>
  );
};

export default AIChatOverlay;
