import { useState, useRef, useEffect } from 'react';
import { MdSmartToy, MdClose, MdSend } from 'react-icons/md';
import { getBotReply } from '../../utils/ai';
import './Chatbot.css';

const INIT_MESSAGE = { from: 'bot', text: "👋 Hi! I'm LivoraBot 🤖\nAsk me about mess timings, fees, complaints, leave, wifi, laundry, or anything hostel-related!" };

export default function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([INIT_MESSAGE]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages(m => [...m, { from: 'user', text }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(m => [...m, { from: 'bot', text: getBotReply(text) }]);
    }, 900 + Math.random() * 500);
  };

  const handleKey = e => { if (e.key === 'Enter') send(); };

  const QUICK = ['Mess timing', 'Fee info', 'WiFi help', 'Leave rules'];

  return (
    <>
      {/* Chat window */}
      {open && (
        <div className="chat-window fade-in">
          <div className="chat-header">
            <div className="chat-bot-identity">
              <div className="chat-bot-avatar"><MdSmartToy size={18} /></div>
              <div>
                <div className="chat-bot-name">LivoraBot</div>
                <div className="chat-bot-status"><span className="dot dot-green" /> Online</div>
              </div>
            </div>
            <button className="modal-close" onClick={() => setOpen(false)}><MdClose /></button>
          </div>

          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.from === 'bot' ? 'chat-msg-bot' : 'chat-msg-user'}`}>
                {m.from === 'bot' && <div className="chat-bot-icon"><MdSmartToy size={14} /></div>}
                <div className="chat-bubble">{m.text}</div>
              </div>
            ))}
            {typing && (
              <div className="chat-msg chat-msg-bot">
                <div className="chat-bot-icon"><MdSmartToy size={14} /></div>
                <div className="chat-bubble chat-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick replies */}
          <div className="chat-quick">
            {QUICK.map(q => (
              <button key={q} className="chat-quick-btn" onClick={() => { setInput(q); }}>
                {q}
              </button>
            ))}
          </div>

          <div className="chat-input-row">
            <input
              className="input"
              placeholder="Ask anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button className="btn btn-primary btn-sm chat-send" onClick={send}>
              <MdSend size={16} />
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button className="chat-fab" onClick={() => setOpen(o => !o)} aria-label="Open chatbot">
        {open ? <MdClose size={22} /> : <MdSmartToy size={22} />}
        {!open && <span className="chat-fab-badge">AI</span>}
      </button>
    </>
  );
}
