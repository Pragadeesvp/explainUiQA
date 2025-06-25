import { ReactNode, useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Mic,
  MoreVertical,
  Settings2,
  Shield,
  Upload,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { AvatarGroup } from '../common/avatar-group';
import { ChatMessage, SpeechRecognition } from '@/types/voice-assistant.types';
import { search, SearchHit } from '@/services/search.service';

export function ChatSheet({ trigger }: { trigger: ReactNode }) {
  const [emailInput, setEmailInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isSending, setIsSending] = useState(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef<string>('');

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = event => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
        setEmailInput(prev => prev + (transcript ? ' ' + transcript : ''));
        lastTranscriptRef.current = transcript;
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (isListening && lastTranscriptRef.current === transcript) stopListening();
        }, 3000);
      };
      recognition.onerror = event => {
        setIsListening(false);
      };
      recognition.onend = () => {
        if (isListening) recognition.start();
      };
      setRecognition(recognition);
    }
    return () => {
      if (recognition) recognition.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
    // eslint-disable-next-line
  }, []);

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };
  const toggleListening = () => {
    if (!recognition) return;
    if (isListening) stopListening();
    else {
      recognition.start();
      setIsListening(true);
    }
  };
  const handleSend = async () => {
    if (isListening) stopListening();
    const finalMessage = emailInput.trim();
    if (finalMessage) {
      setEmailInput('');
      setTranscript('');
      setIsSending(true);
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: finalMessage,
        type: 'user',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      try {
        const data = await search({ query: finalMessage, company: 'default' });
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: `Found ${data.total_hits} results. ${data.hits.length > 0 ? 'Here are the top results:' : 'No results found.'}`,
          type: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        if (data.hits.length > 0) {
          data.hits.forEach((hit: SearchHit, index: number) => {
            const hitMessage: ChatMessage = {
              id: (Date.now() + index + 2).toString(),
              text: (
                <div>
                  <div><b>{hit.document_name.split('/').pop()}</b> <span>{Math.round(hit.score * 100)}% match</span></div>
                  <div>{hit.chunk_content}</div>
                </div>
              ),
              type: 'assistant',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, hitMessage]);
          });
        }
      } catch (error) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            text: 'Sorry, there was an error processing your request.',
            type: 'assistant',
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsSending(false);
      }
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        className="p-0 gap-0 sm:w-[450px] sm:max-w-none inset-5 start-auto h-auto rounded-lg p-0 sm:max-w-none [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5"
        overlay={false}
      >
        <SheetHeader>
          <div className="flex items-center justify-between p-3 border-b border-border" style={{ overflow: 'hidden' }}>
            <SheetTitle>AI Assistant</SheetTitle>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', minWidth: 0 }}>
              {isListening && (
                <span style={{ color: '#00d1ff', fontWeight: 500, maxWidth: 100, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right', display: 'block' }}>Listening...</span>
              )}
            </div>
          </div>
        </SheetHeader>
        <SheetBody className="scrollable-y-auto grow flex flex-col items-stretch justify-end">
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ textAlign: msg.type === 'user' ? 'right' : 'left', margin: '8px 0' }}>
                <div style={{ display: 'inline-block', background: msg.type === 'user' ? '#00d1ff' : '#f3f4f6', color: msg.type === 'user' ? '#000' : '#333', borderRadius: 12, padding: '8px 16px' }}>
                  {msg.text}
                </div>
                <div style={{ fontSize: 10, color: '#888' }}>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            ))}
          </div>
        </SheetBody>
        <SheetFooter className="block p-0 sm:space-x-0">
          <div className="flex justify-center py-3 border-b border-border">
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 ${isListening ? 'bg-gray-300 text-black border-gray-300 hover:bg-gray-400' : 'bg-[#00d1ff] text-black hover:bg-[#00d1ff]/90 border-[#00d1ff]'}`}
              onClick={isListening ? stopListening : toggleListening}
            >
              <Mic className="h-4 w-4" />
              {isListening ? 'Stop' : 'Speak'}
            </Button>
          </div>
          <div className="p-5 flex items-center gap-2 relative">
            <img
              src={toAbsoluteUrl('/media/avatars/300-2.png')}
              className="w-8 h-8 rounded-full absolute left-7 top-1/2 -translate-y-1/2"
              alt=""
            />
            <Input
              type="text"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Write a message..."
              className="w-full ps-12 pe-24 py-4 h-auto"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={isSending}
            />
            <div className="absolute end-7 top-1/2 -translate-y-1/2 flex gap-2">
              <Button size="sm" variant="mono" onClick={handleSend} disabled={isSending || !emailInput.trim()}>
                {isSending ? '...' : 'Send'}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
