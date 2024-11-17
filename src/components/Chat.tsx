import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { CSSTransition } from 'react-transition-group';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format } from 'date-fns';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

export default function Chat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        text: 'Olá, sou Stive, policial do administrativo da 2ª Cia de Medianeira. Estou aqui para auxiliar você com informações. Como posso ajudar?',
        sender: 'agent',
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getVehicleStats = async () => {
    try {
      const vehiclesRef = collection(db, 'vehicles');
      const q = query(vehiclesRef, orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      const vehicles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const stats = {
        total: vehicles.length,
        released: vehicles.filter(v => v.releaseDate).length,
        notReleased: vehicles.filter(v => !v.releaseDate).length,
        byCity: {} as Record<string, number>,
        byType: {} as Record<string, number>
      };

      vehicles.forEach(vehicle => {
        stats.byCity[vehicle.city] = (stats.byCity[vehicle.city] || 0) + 1;
        stats.byType[vehicle.vehicleType] = (stats.byType[vehicle.vehicleType] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching vehicle stats:', error);
      return null;
    }
  };

  const processUserMessage = async (message: string) => {
    const stats = await getVehicleStats();
    if (!stats) return 'Desculpe, não consegui acessar as informações no momento.';

    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('total') || lowerMessage.includes('quantidade')) {
      return `Atualmente temos um total de ${stats.total} veículos cadastrados no sistema.`;
    }

    if (lowerMessage.includes('liberados')) {
      return `Dos ${stats.total} veículos cadastrados, ${stats.released} já foram liberados e ${stats.notReleased} ainda aguardam liberação.`;
    }

    if (lowerMessage.includes('cidade') || lowerMessage.includes('cidades')) {
      const cityStats = Object.entries(stats.byCity)
        .map(([city, count]) => `${city}: ${count} veículos`)
        .join('\n');
      return `Distribuição por cidade:\n${cityStats}`;
    }

    if (lowerMessage.includes('tipo') || lowerMessage.includes('tipos')) {
      const typeStats = Object.entries(stats.byType)
        .map(([type, count]) => `${type}: ${count} veículos`)
        .join('\n');
      return `Distribuição por tipo de veículo:\n${typeStats}`;
    }

    return 'Posso fornecer informações sobre o total de veículos, quantidade de liberados/não liberados, distribuição por cidade ou por tipo de veículo. Como posso ajudar?';
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user' as const,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await processUserMessage(inputMessage);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'agent',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
        sender: 'agent',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      <CSSTransition
        in={isOpen}
        timeout={300}
        classNames="chat"
        unmountOnExit
        nodeRef={nodeRef}
      >
        <div
          ref={nodeRef}
          className="fixed bottom-20 right-4 w-96 h-[600px] bg-white rounded-lg shadow-xl flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <div>
                <h3 className="font-semibold">Stive</h3>
                <p className="text-sm text-gray-500">Policial Administrativo</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 whitespace-pre-line ${
                    message.sender === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 animate-pulse">
                  Digitando...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Digite sua mensagem..."
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </CSSTransition>
    </>
  );
}