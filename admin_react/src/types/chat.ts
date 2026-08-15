export interface ChatMessage {
  id: number;
  sender: 'student' | 'admin';
  text: string;
  type: 'text' | 'image';
  imageUrl?: string | null;
  quoteText?: string | null;
  quoteSender?: string | null;
  deleted?: boolean;
  time?: string;
  created_at?: string;
}

export interface ChatConversation {
  id: number;
  student_id?: number | null;
  student_name: string;
  student_uni?: string | null;
  phone: string;
  last_msg: string;
  status: string;
  time?: string;
  updated_at?: string;
  messages: ChatMessage[];
}

export interface AdminReplyPayload {
  chat_id: number;
  content: string;
  message_type?: 'text' | 'image';
  image_url?: string;
  quote_text?: string;
  quote_sender?: string;
}
