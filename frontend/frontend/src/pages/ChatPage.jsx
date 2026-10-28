import { useEffect, useRef, useState } from "react";
import ChatInput from "../components/ChatInput";
import ChatMessage from "../components/ChatMessage";
import Footer from "../components/Footer";
import Header from "../components/Header";
import LoadingIndicator from "../components/LoadingIndicator";

const API_URL = import.meta.env.VITE_API_URL ?? "/api/chat";
const SEARCH_URL = API_URL.replace(/\/chat$/, "/search");

const initialMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I can help you find trains. Tell me your journey details to get started.",
};

function getSessionId() {
  const saved = window.localStorage.getItem("automation-chat-session");
  if (saved) return saved;

  const sessionId = crypto.randomUUID();
  window.localStorage.setItem("automation-chat-session", sessionId);
  return sessionId;
}

function formatTime(date) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function ChatPage() {
  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState(getSessionId);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  async function sendMessage(event) {
    event?.preventDefault();
    const message = input.trim();
    if (!message || isLoading) return;

    setInput("");
    setError("");
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
        time: formatTime(new Date()),
      },
    ]);
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "The server could not process that message.");
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            data.reply ||
            (data.searching
              ? "I am searching for trains now..."
              : "I received your message."),
          results: data.results,
          time: formatTime(new Date()),
        },
      ]);

      if (data.searching && data.journey) {
        await new Promise((resolve) => setTimeout(resolve, 700));
        const searchResponse = await fetch(SEARCH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data.journey, sessionId }),
        });
        const searchData = await searchResponse.json().catch(() => ({}));

        if (!searchResponse.ok) {
          throw new Error(
            searchData.error || "The train search could not be completed."
          );
        }

        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: searchData.reply || "Here are the available trains.",
            results: searchData.results,
            time: formatTime(new Date()),
          },
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              searchData.followUp ||
              "Would you like to search for another journey?",
            time: formatTime(new Date()),
          },
        ]);
      }
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to connect to the server. Please try again."
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function resetChat() {
    const nextSessionId = crypto.randomUUID();
    window.localStorage.setItem("automation-chat-session", nextSessionId);
    setSessionId(nextSessionId);
    setMessages([initialMessage]);
    setInput("");
    setError("");
  }

  return (
    <main className="min-h-screen bg-[#121212] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <Header resetChat={resetChat} />

        <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto py-8">
            <div className="mb-8 text-center">
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Where would you like to go?
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                Share your journey details naturally. I&apos;ll find the
                available trains for you.
              </p>
            </div>

            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && <LoadingIndicator />}
            {error && (
              <div className="rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="pb-5">
            <ChatInput
              input={input}
              inputRef={inputRef}
              isLoading={isLoading}
              onChange={(event) => setInput(event.target.value)}
              onSubmit={sendMessage}
            />
          </div>
        </section>
        <Footer />
      </div>
    </main>
  );
}

export default ChatPage;
