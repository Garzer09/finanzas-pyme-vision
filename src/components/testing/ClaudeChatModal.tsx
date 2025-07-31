import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Send, Bot, User, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ClaudeChatModalProps {
  edaResults: any;
  onEdaUpdate?: (updatedEda: any) => void;
}

export const ClaudeChatModal = ({ edaResults, onEdaUpdate }: ClaudeChatModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    addMessage('user', userMessage);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('claude-eda-analyzer', {
        body: {
          sessionId: 'chat-session',
          fileData: {
            edaResults: edaResults,
            userQuestion: userMessage
          },
          isChat: true,
          documentTypes: edaResults?.document_types || []
        }
      });

      if (error) throw error;

      addMessage('assistant', data.response || 'No pude procesar tu consulta. Por favor intenta de nuevo.');
      
      // Si Claude devuelve EDA actualizado, lo propagamos
      if (data.updatedEda) {
        onEdaUpdate?.(data.updatedEda);
      }

    } catch (error) {
      console.error('Error sending message to Claude:', error);
      addMessage('assistant', 'Disculpa, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getInitialMessage = () => {
    const sheetsCount = edaResults?.sheets_analysis?.length || 0;
    const fieldsCount = edaResults?.eda_summary?.total_fields || 0;
    const qualityScore = edaResults?.eda_summary?.data_quality_score || 0;

    return `¡Hola! Soy Claude y he analizado tus datos financieros. 

Detecté **${sheetsCount} hojas** con **${fieldsCount} campos** y una calidad general del **${qualityScore.toFixed(1)}%**.

¿Tienes alguna pregunta sobre la interpretación de los datos? Puedo ayudarte con:
• Explicar campos que no estén bien identificados
• Aclarar el mapeo de conceptos financieros
• Sugerir mejoras en la estructura de datos
• Resolver dudas sobre la calidad detectada

¿En qué te puedo ayudar?`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Chatear con Claude
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Chat con Claude - Análisis EDA
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {/* Mensaje inicial de Claude */}
              {messages.length === 0 && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Bot className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <Badge variant="secondary" className="mb-2">Claude</Badge>
                        <div className="text-sm whitespace-pre-line">
                          {getInitialMessage()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mensajes del chat */}
              {messages.map((message) => (
                <Card key={message.id} className={
                  message.role === 'user' 
                    ? 'border-blue-200 bg-blue-50 ml-8' 
                    : 'border-primary/20 bg-primary/5 mr-8'
                }>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {message.role === 'user' ? (
                        <User className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                      ) : (
                        <Bot className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <Badge variant={message.role === 'user' ? 'default' : 'secondary'} className="mb-2">
                          {message.role === 'user' ? 'Tú' : 'Claude'}
                        </Badge>
                        <div className="text-sm whitespace-pre-line">
                          {message.content}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Indicador de escritura */}
              {isLoading && (
                <Card className="border-primary/20 bg-primary/5 mr-8">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Bot className="h-6 w-6 text-primary" />
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Claude está escribiendo...</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>

          {/* Input para nuevos mensajes */}
          <div className="border-t pt-4 mt-4">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu pregunta sobre los datos analizados..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};