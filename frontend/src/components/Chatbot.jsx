import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL;

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi 👋 Welcome to Grabbie! How can I help you?" }
  ]);
  const [input, setInput] = useState("");

  const bottomRef = useRef();

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (customText = null) => {
    const text = customText || input;
    if (!text.trim()) return;

    const token = localStorage.getItem("token");

    setMessages(prev => [...prev, { role: "user", text }]);
    setInput("");

    try {
      // Typing animation
      setMessages(prev => [...prev, { role: "bot", text: "Typing..." }]);

      const res = await axios.post(
        `${API}/api/chatbot`,
        { message: text },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTimeout(() => {
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: "bot", text: res.data.reply }
        ]);
      }, 700);

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* Button */}
      <div
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-orange-500 text-white p-4 rounded-full cursor-pointer shadow-lg"
      >
        💬
      </div>

      {/* Chatbox */}
      {open && (
        <div className="fixed bottom-20 right-6 w-80 bg-white shadow-xl rounded-xl flex flex-col">

          <div className="bg-orange-500 text-white p-3 rounded-t-xl">
            Grabbie Assistant
          </div>

          {/* Messages */}
          <div className="p-3 h-64 overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`mb-2 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                <span className="bg-gray-100 px-3 py-2 rounded text-sm inline-block">
                  {msg.text}
                </span>
              </div>
            ))}
            <div ref={bottomRef}></div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-2 px-3 pb-2">
            {["track order", "cancel order", "payment", "offers"].map((btn, i) => (
              <button
                key={i}
                onClick={() => sendMessage(btn)}
                className="bg-gray-200 px-3 py-1 rounded text-xs hover:bg-gray-300"
              >
                {btn}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex border-t">
            <input
              className="flex-1 p-2 outline-none text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something..."
            />
            <button
              onClick={() => sendMessage()}
              className="px-4 bg-orange-500 text-white"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;