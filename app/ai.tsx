import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, C, Header, LoadingState, Screen } from '@/components/ui';
import { sendAIMessage } from '@/lib/backend';
import { useTrading } from '@/context/TradingContext';

type Message = { role: 'user' | 'assistant'; text: string };

export default function AI() {
  const router = useRouter();
  const { selectedInstrument, selectedSession, selectedStyle, consensusThreshold } = useTrading();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function send() {
    const message = input.trim();
    if (!message || busy) return;
    setInput(''); setError(''); setMessages(prev => [...prev, { role: 'user', text: message }]); setBusy(true);
    try {
      const result = await sendAIMessage(message, { instrument: selectedInstrument.symbol, session: selectedSession, style: selectedStyle, consensusThreshold });
      setMessages(prev => [...prev, { role: 'assistant', text: result.reply || 'The AI provider returned no response.' }]);
    } catch (e: any) { setError(e?.message ?? 'AI provider is unavailable.'); }
    finally { setBusy(false); }
  }

  return <Screen><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <Header title="AI Assistant" subtitle={`Context: ${selectedInstrument.symbol} • ${selectedSession}`} />
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 18 }} keyboardShouldPersistTaps="handled">
      <Card><Text style={{ fontWeight: '900', fontSize: 17 }}>Trading assistant</Text><Text style={{ color: C.muted, marginTop: 6, lineHeight: 20 }}>Ask trading questions using the secured server-side AI provider.</Text></Card>
      {messages.length === 0 ? <Card><Text style={{ color: C.muted }}>No messages yet. Start with a specific question.</Text></Card> : null}
      {messages.map((item, index) => <View key={`${item.role}-${index}`} style={{ alignItems: item.role === 'user' ? 'flex-end' : 'flex-start', marginVertical: 5 }}><View style={{ maxWidth: '88%', backgroundColor: item.role === 'user' ? C.ink : C.white, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 13 }}><Text style={{ color: item.role === 'user' ? C.white : C.ink, lineHeight: 21 }}>{item.text}</Text></View></View>)}
      {busy ? <LoadingState label="AI is responding…" /> : null}
      {error ? <Card><Text style={{ color: C.red, lineHeight: 20 }}>{error}</Text><Text style={{ color: C.muted, marginTop: 5, fontSize: 12 }}>No fallback answer was generated.</Text></Card> : null}
    </ScrollView>
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end', paddingTop: 8 }}><TextInput value={input} onChangeText={setInput} placeholder="Ask a trading question…" multiline style={{ flex: 1, minHeight: 48, maxHeight: 110, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 11, backgroundColor: C.white, fontSize: 15 }} /><Pressable onPress={send} disabled={busy || !input.trim()} style={{ width: 72, minHeight: 48, borderRadius: 14, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center', opacity: busy || !input.trim() ? 0.45 : 1 }}><Text style={{ color: C.white, fontWeight: '900' }}>Send</Text></Pressable></View>
    <Button title="Back" variant="secondary" onPress={() => router.back()} />
  </KeyboardAvoidingView></Screen>;
}
