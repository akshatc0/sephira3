interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MessageListProps {
  messages: Message[];
  loading?: boolean;
}

export default function MessageList({ messages, loading }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-white/10">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/80">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-white mb-2" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Start a Conversation</h3>
        <p className="max-w-sm mb-8 text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.62)', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
          Ask questions about global sentiment trends, compare countries, or visualize data over time.
        </p>
        
        <div className="grid gap-3 w-full max-w-sm">
          {[
            "Show sentiment trends for France",
            "Compare Germany and Italy",
            "Visualize US sentiment in 2023"
          ].map((suggestion, i) => (
            <div 
              key={i}
              className="px-4 py-3 border border-white/20 rounded-xl text-sm text-left hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer select-none"
              style={{ color: 'rgba(255, 255, 255, 0.62)', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            >
              "{suggestion}"
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${
            message.role === "user" ? "justify-end" : "justify-start"
          } animate-slide-up`}
        >
          <div
            className={`max-w-[85%] sm:max-w-[75%] p-5 shadow-sm ${
              message.role === "user"
                ? "bg-white text-black rounded-tr-sm"
                : "border border-white/10 text-white rounded-tl-sm"
            }`}
            style={message.role === "assistant" ? {
              background: 'linear-gradient(to bottom, #121834, #090D20)',
              borderRadius: '20px',
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
            } : {
              borderRadius: '20px',
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
            }}
          >
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed tracking-wide" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
              {message.content}
            </p>
          </div>
        </div>
      ))}
      
      {loading && (
        <div className="flex justify-start animate-fade-in">
          <div className="border border-white/10 px-5 py-4 rounded-tl-sm flex items-center gap-2" style={{ 
            background: 'linear-gradient(to bottom, #121834, #090D20)',
            borderRadius: '20px',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
          }}>
            <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      )}
    </div>
  );
}
