import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, C, Header, LoadingState, Screen } from '@/components/ui';
import { sendAIMessage } from '@/lib/backend';
import { useTrading } from '@/context/TradingContext';

type Message = { role: 'user' | 'assistant'; text: string };

const quickPrompts = ['Explain this market setup', 'How should I manage risk?', 'What should I look for before entry?'];

export default function AI() {
  const router = useRouter();
  const { selectedInstrument, selectedSession, selectedStyle, consensusThreshold } = useTrading();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function send(text = input) {
    const message = text.trim();
    if (!message || busy) return;
    setInput(''); setError(''); setMessages(prev => [...prev, { role: 'user', text: message }]); setBusy(true);
    try {
      const result = await sendAIMessage(message, { instrument: selectedInstrument.symbol, session: selectedSession, style: selectedStyle, consensusThreshold });
      setMessages(prev => [...prev, { role: 'assistant', text: result.reply || 'Please try again.' }]);
    } catch (e: any) { setError(e?.message ?? 'Unable to connect right now. Please try again.'); }
    finally { setBusy(false); }
  }

  return <Screen><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <Header title="AI Assistant" subtitle="SmartVibe guidance" />
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 18 }} keyboardShouldPersistTaps="handled">
      {messages.length === 0 ? <Card elevated>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="sparkles" size={21} color={C.cyan} /></View><View style={{ flex: 1 }}><Text style={{ fontWeight: '900', fontSize: 17, color: C.ink }}>How can I help?</Text><Text style={{ color: C.muted, marginTop: 3, lineHeight: 19 }}>Ask about markets, setups, risk or trading discipline.</Text></View></View>
        <View style={{ marginTop: 16, gap: 8 }}>{quickPrompts.map(prompt => <Pressable key={prompt} onPress={() => send(prompt)} style={{ padding: 13, borderRadius: 13, borderWidth: 1, borderColor: C.border, backgroundColor: C.card }}><Text style={{ color: C.ink, fontWeight: '700' }}>{prompt}</Text></Pressable>)}</View>
      </Card> : null}
      {messages.map((item, index) => <View key={`${item.role}-${index}`} style={{ alignItems: item.role === 'user' ? 'flex-end' : 'flex-start', marginVertical: 5 }}><View style={{ maxWidth: '90%', backgroundColor: item.role === 'user' ? C.blue : C.card, borderWidth: 1, borderColor: item.role === 'user' ? C.cyan : C.border, borderRadius: 16, padding: 13 }}><Text style={{ color: C.white, lineHeight: 21 }}>{item.text}</Text></View></View>)}
      {busy ? <LoadingState label="Thinking…" /> : null}
      {error ? <Card><Text style={{ color: C.red, lineHeight: 20 }}>{error}</Text></Card> : null}
    </ScrollView>
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end', paddingTop: 8 }}><TextInput value={input} onChangeText={setInput} placeholder="Ask SmartVibe…" placeholderTextColor={C.muted} multiline style={{ flex: 1, minHeight: 48, maxHeight: 110, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 11, backgroundColor: C.card, color: C.ink, fontSize: 15 }} /><Pressable onPress={() => send()} disabled={busy || !input.trim()} style={{ width: 72, minHeight: 48, borderRadius: 14, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', opacity: busy || !input.trim() ? 0.45 : 1 }}><Text style={{ color: C.white, fontWeight: '900' }}>Send</Text></Pressable></View>
    <Button title="Back" variant="secondary" onPress={() => router.back()} />
  </KeyboardAvoidingView></Screen>;
}
