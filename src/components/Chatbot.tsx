import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const Chatbot = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hi! I'm here to help you with any issues. What can I assist you with today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueForm, setIssueForm] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium'
  });

  const predefinedResponses: { [key: string]: string } = {
    'order': "I can help you with order-related issues. If you need to report a specific problem with your order, I'll create a support ticket for you.",
    'delivery': "For delivery issues, please let me know what happened and I'll make sure our team addresses it promptly.",
    'payment': "If you're having payment issues, I can help you report this to our support team for quick resolution.",
    'product': "Having trouble with a product? I can help you file a report so our team can assist you.",
    'account': "For account-related issues, I'll make sure our support team gets your information to help resolve any problems.",
    'general': "I'm here to help with any general questions or concerns you might have about our service."
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Simple keyword detection for bot responses
    const lowerInput = inputMessage.toLowerCase();
    let botResponse = "I understand your concern. Would you like me to create a support ticket for this issue so our team can help you?";

    for (const [keyword, response] of Object.entries(predefinedResponses)) {
      if (lowerInput.includes(keyword)) {
        botResponse = response;
        break;
      }
    }

    // Add bot response
    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);

      // Suggest creating a ticket
      if (lowerInput.includes('issue') || lowerInput.includes('problem') || lowerInput.includes('help')) {
        setTimeout(() => {
          const ticketSuggestion: ChatMessage = {
            id: (Date.now() + 2).toString(),
            text: "Would you like me to create a support ticket for you? Click the button below to get started.",
            isBot: true,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, ticketSuggestion]);
        }, 1000);
      }
    }, 1000);

    setInputMessage('');
  };

  const handleCreateIssue = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to create a support ticket.",
        variant: "destructive",
      });
      return;
    }

    if (!issueForm.title || !issueForm.description) {
      toast({
        title: "Required fields",
        description: "Please fill in the title and description.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('issues')
        .insert({
          user_id: user.id,
          title: issueForm.title,
          description: issueForm.description,
          category: issueForm.category,
          priority: issueForm.priority
        });

      if (error) throw error;

      toast({
        title: "Support ticket created",
        description: "Your issue has been reported. Our team will get back to you soon.",
      });

      // Add success message to chat
      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        text: "Great! I've created a support ticket for you. Our team will review it and get back to you soon. Is there anything else I can help you with?",
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMessage]);

      setIssueForm({ title: '', description: '', category: 'general', priority: 'medium' });
      setShowIssueForm(false);
    } catch (error) {
      console.error('Error creating issue:', error);
      toast({
        title: "Error",
        description: "Failed to create support ticket. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50"
        size="lg"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-background border rounded-lg shadow-xl z-50 flex flex-col">
          {/* Chat Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-semibold">Customer Support</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {!showIssueForm ? (
            <>
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.isBot
                          ? 'bg-muted text-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t">
                <Button
                  onClick={() => setShowIssueForm(true)}
                  className="w-full mb-3"
                  variant="outline"
                >
                  Create Support Ticket
                </Button>

                {/* Chat Input */}
                <div className="flex space-x-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} size="sm">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Issue Form */
            <div className="flex-1 overflow-y-auto p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Create Support Ticket</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="issue-title">Issue Title</Label>
                    <Input
                      id="issue-title"
                      value={issueForm.title}
                      onChange={(e) => setIssueForm({...issueForm, title: e.target.value})}
                      placeholder="Brief description of your issue"
                    />
                  </div>

                  <div>
                    <Label htmlFor="issue-description">Description</Label>
                    <Textarea
                      id="issue-description"
                      value={issueForm.description}
                      onChange={(e) => setIssueForm({...issueForm, description: e.target.value})}
                      placeholder="Please provide detailed information about your issue"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="issue-category">Category</Label>
                    <Select
                      value={issueForm.category}
                      onValueChange={(value) => setIssueForm({...issueForm, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="order">Order Issue</SelectItem>
                        <SelectItem value="delivery">Delivery Issue</SelectItem>
                        <SelectItem value="payment">Payment Issue</SelectItem>
                        <SelectItem value="product">Product Issue</SelectItem>
                        <SelectItem value="account">Account Issue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="issue-priority">Priority</Label>
                    <Select
                      value={issueForm.priority}
                      onValueChange={(value) => setIssueForm({...issueForm, priority: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={handleCreateIssue} className="flex-1">
                      Submit Ticket
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowIssueForm(false)}
                      className="flex-1"
                    >
                      Back to Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Chatbot;