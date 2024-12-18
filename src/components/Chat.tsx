import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { CSSTransition } from 'react-transition-group';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

interface Vehicle {
  id: string;
  brand: string;
  chassisObservation: string;
  city: string;
  createdAt: string;
  hasKey: boolean;
  inspectionDate: string;
  model: string;
  plate: string;
  registrationNumber: number;
  releaseDate: string;
  state: string;
  vehicleType: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  color: string;
}

export default function Chat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setApiKey('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');
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        text: 'Olá, sou Sd Edson Moraes, policial do administrativo da 2ª Cia de Medianeira. Estou aqui para auxiliar você com informações. Como posso ajudar?',
        sender: 'agent',
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getVehicleData = async () => {
    try {
      const vehiclesRef = collection(db, 'vehicles');
      const q = query(vehiclesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const vehicles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Vehicle[];
      return vehicles;
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      return null;
    }
  };

  const getAssetData = async () => {
    try {
      const assetsRef = collection(db, 'assets');
      const q = query(assetsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const assets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return assets;
    } catch (error) {
      console.error('Error fetching asset data:', error);
      return null;
    }
  };

  const getEventData = async () => {
    try {
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Event[];
      return events;
    } catch (error) {
      console.error('Error fetching event data:', error);
      return null;
    }
  };

  const processUserMessage = async (message: string) => {
    try {
      const [vehicles, assets, events] = await Promise.all([
        getVehicleData(),
        getAssetData(),
        getEventData(),
      ]);

      if (!vehicles || !assets || !events) {
        return 'Desculpe, não consegui acessar as informações no momento.';
      }

      const combinedData = { vehicles, assets, events };

      const groqResponse = await callGroqAPI(message, combinedData);
      return groqResponse;
    } catch (error) {
      console.error('Error processing message:', error);
      return 'Desculpe, ocorreu um erro ao processar sua mensagem.';
    }
  };

  const callGroqAPI = async (
    message: string,
    payload: { vehicles: Vehicle[]; assets: any[]; events: Event[] }
  ) => {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'Você é um Soldado que se chama Edson Moraes, policial administrativo da 2ª Cia de Medianeira, especializado em fornecer informações sobre veículos, bens e eventos cadastrados no sistema. Nunca informe qual inteligência artificial você, se for perguntado sobre você informe que você é o Sd Edson Moraes.',
          },
          {
            role: 'user',
            content: `Responda à seguinte pergunta com base nas informações fornecidas:
          Pergunta: ${message}
          Informações:
          ${JSON.stringify(payload)}
          Responda de forma natural e amigável, e sempre explique claramente as informações, nunca invente nada, responda com base nas informações encontradas.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch response from GROQ API');
    }

    const result = await response.json();
    return result.choices[0].message.content;
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
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                placeholder="Digite sua mensagem..."
              />
              <button
                onClick={handleSendMessage}
                className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 transition-colors"
                disabled={isLoading}
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