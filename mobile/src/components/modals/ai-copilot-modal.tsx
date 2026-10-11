import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Spacing } from '@/constants/theme';
import {
  X,
  Sparkles,
  Send,
  Bot,
  User,
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { useAskCopilot } from '@/features/campus';
import { getErrorMessage } from '@/lib/api/api-error';

interface AiCopilotModalProps {
  visible: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'AI' | 'USER';
  text: string;
  meta?: {
    type?: 'ATTENDANCE' | 'SCHEDULE' | 'EXAM';
    stat?: string;
  };
}

export function AiCopilotModal({ visible, onClose }: AiCopilotModalProps) {
  const firstName = useAuthStore((state) => state.user?.name.split(' ')[0]);
  const ask = useAskCopilot();
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'm1',
      sender: 'AI',
      text: `Namaste${firstName ? ` ${firstName}` : ''}! I answer from your own records — attendance, fees, today's classes, upcoming exams and your bus pass.`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const isTyping = ask.isPending;
  const nextId = useRef(1);

  const SUGGESTED_QUERIES = [
    'What is my overall attendance?',
    'What classes do I have left today?',
    'When is my next exam?',
    'Which bus do I take?',
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `usr-${nextId.current++}`,
      sender: 'USER',
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    ask.mutate(text.trim(), {
      onSuccess: (reply) => setMessages((prev) => [...prev, { id: `ai-${nextId.current++}`, sender: 'AI', text: reply.answer }]),
      onError: (err) => setMessages((prev) => [...prev, { id: `ai-${nextId.current++}`, sender: 'AI', text: getErrorMessage(err) }]),
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerBrand}>
              <View style={styles.aiBadge}>
                <Sparkles size={16} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.title}>JBIT Campus Copilot</Text>
                <Text style={styles.subtitle}>Answers from your campus records</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Messages list */}
          <ScrollView style={styles.messagesList} contentContainerStyle={styles.messagesContent}>
            {messages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.messageBubble,
                  m.sender === 'USER' ? styles.userBubble : styles.aiBubble,
                ]}
              >
                <View style={styles.msgHeader}>
                  {m.sender === 'AI' ? (
                    <Bot size={14} color="#0284C7" />
                  ) : (
                    <User size={14} color="#FFFFFF" />
                  )}
                  <Text
                    style={[
                      styles.senderLabel,
                      m.sender === 'USER' ? styles.userLabel : styles.aiLabel,
                    ]}
                  >
                    {m.sender === 'AI' ? 'Campus Copilot' : 'You'}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.msgText,
                    m.sender === 'USER' ? styles.userMsgText : styles.aiMsgText,
                  ]}
                >
                  {m.text}
                </Text>

                {m.meta?.stat && (
                  <View style={styles.statChip}>
                    <Text style={styles.statChipText}>Status: {m.meta.stat}</Text>
                  </View>
                )}
              </View>
            ))}

            {isTyping && (
              <View style={[styles.messageBubble, styles.aiBubble]}>
                <View style={styles.typingRow}>
                  <ActivityIndicator size="small" color="#0284C7" />
                  <Text style={styles.typingText}>Copilot is fetching academic records...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Quick Prompts */}
          <View style={styles.promptsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptsList}>
              {SUGGESTED_QUERIES.map((q, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.promptChip}
                  onPress={() => handleSend(q)}
                >
                  <Text style={styles.promptChipText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Input Bar */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask anything about attendance, exams, fees..."
              placeholderTextColor="#94A3B8"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend(inputText)}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.disabledSend]}
              onPress={() => handleSend(inputText)}
              disabled={!inputText.trim() || isTyping}
            >
              <Send size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#0B6AA8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  subtitle: {
    fontSize: 12,
    color: '#636366',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  messagesList: {
    flex: 1,
    marginVertical: Spacing.sm,
  },
  messagesContent: {
    paddingVertical: 10,
    gap: 12,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 14,
    maxWidth: '88%',
  },
  aiBubble: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignSelf: 'flex-start',
  },
  userBubble: {
    backgroundColor: '#0B3B60',
    alignSelf: 'flex-end',
  },
  msgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  senderLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  aiLabel: {
    color: '#0B6AA8',
  },
  userLabel: {
    color: '#93C5FD',
  },
  msgText: {
    fontSize: 13,
    lineHeight: 18,
  },
  aiMsgText: {
    color: '#1E293B',
  },
  userMsgText: {
    color: '#FFFFFF',
  },
  statChip: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 12,
    color: '#636366',
    fontStyle: 'italic',
  },
  promptsContainer: {
    paddingVertical: 8,
  },
  promptsList: {
    gap: 8,
  },
  promptChip: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  promptChipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1C1C1E',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#0B3B60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledSend: {
    backgroundColor: '#737378',
  },
});
