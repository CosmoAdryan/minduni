import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CheckSquare, Square, MessageCircle } from 'lucide-react-native';

// Caixa de aceite (opt-in). Compartilhada pelos dois aceites abaixo.
function ConsentCheckbox({ checked, onToggle, label, children }) {
  return (
    <TouchableOpacity
      style={{ flexDirection: 'row', alignItems: 'flex-start', padding: 4 }}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
    >
      <View style={{ marginRight: 10, marginTop: 1 }}>
        {checked
          ? <CheckSquare size={24} color="#3D7A67" />
          : <Square size={24} color="#CEC9BF" />}
      </View>
      <Text style={{ fontSize: 13, color: '#3A3731', flex: 1, lineHeight: 19 }}>{children}</Text>
    </TouchableOpacity>
  );
}

// Texto do consentimento LGPD + caixas de aceite. Compartilhado entre o último
// slide do onboarding e a tela de reconsentimento, para que os dois exibam
// sempre o mesmo texto (o da CONSENT_VERSION atual).
//
// São dois aceites separados (LGPD art. 11, I — consentimento específico e
// destacado para dado sensível):
// - geral (obrigatório): tratamento dos dados pelo MindUni;
// - Sage (opcional): envio das conversas ao Google (Gemini). Sem ele, o app
//   funciona normalmente e só o chat fica desativado.
export default function ConsentContent({
  consented, onToggle, aiConsented, onToggleAi, onOpenPolicy,
}) {
  return (
    <View>
      <Text style={{ fontSize: 14, color: '#5A544C', lineHeight: 22, marginBottom: 14 }}>
        Para acompanhar seu bem-estar, o MindUni guarda alguns dados seus:
      </Text>

      {[
        'Seus registros de humor e anotações do diário',
        'Suas conversas com o Sage, se você ativá-lo',
        'Seu progresso (XP, sequências e práticas concluídas)',
      ].map((item) => (
        <View key={item} style={{ flexDirection: 'row', marginBottom: 8, paddingRight: 8 }}>
          <Text style={{ color: '#3D7A67', marginRight: 8, fontSize: 14 }}>•</Text>
          <Text style={{ fontSize: 14, color: '#5A544C', lineHeight: 20, flex: 1 }}>{item}</Text>
        </View>
      ))}

      <Text style={{ fontSize: 14, color: '#5A544C', lineHeight: 22, marginTop: 8 }}>
        Esses são <Text style={{ fontWeight: '700' }}>dados sensíveis de saúde</Text>. Eles
        ficam armazenados de forma segura, não são usados para publicidade e nunca são
        vendidos. Você pode acessar ou apagar seus dados quando quiser, no seu perfil.
      </Text>

      <TouchableOpacity
        onPress={onOpenPolicy}
        accessibilityRole="link"
        accessibilityLabel="Abrir a Política de Privacidade completa"
        style={{ marginTop: 12 }}
      >
        <Text style={{ fontSize: 14, color: '#2D6254', fontWeight: '600' }}>
          Leia a Política de Privacidade completa
        </Text>
      </TouchableOpacity>

      <View style={{ marginTop: 20 }}>
        <ConsentCheckbox
          checked={consented}
          onToggle={onToggle}
          label="Concordo com o tratamento dos meus dados conforme a LGPD (obrigatório)"
        >
          Li e concordo com o tratamento dos meus dados de saúde emocional pelo MindUni,
          conforme a Lei Geral de Proteção de Dados (LGPD).{' '}
          <Text style={{ color: '#756F66' }}>(obrigatório)</Text>
        </ConsentCheckbox>
      </View>

      {/* Aceite separado e opcional do Sage — envio a terceiro (Google) */}
      <View
        style={{
          marginTop: 16, padding: 12, borderRadius: 14,
          backgroundColor: '#EEF5F1', borderWidth: 1, borderColor: '#D4E9DE',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <MessageCircle size={16} color="#2D6254" style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1C1917' }}>
            Conversas com o Sage (opcional)
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: '#5A544C', lineHeight: 20, marginBottom: 10 }}>
          Para gerar as respostas do Sage, o conteúdo das conversas (e, se você pedir um
          resumo da semana, seus registros de humor) é enviado ao{' '}
          <Text style={{ fontWeight: '700' }}>Google (Gemini)</Text>. Seu nome e e-mail não
          são enviados. Sem este aceite, o resto do app funciona normalmente e você pode
          ativar o Sage depois. Ao desativar, suas conversas são apagadas.
        </Text>
        <ConsentCheckbox
          checked={aiConsented}
          onToggle={onToggleAi}
          label="Autorizo o envio das minhas conversas com o Sage ao Google Gemini (opcional)"
        >
          Autorizo o envio das minhas conversas com o Sage ao Google (Gemini).
        </ConsentCheckbox>
      </View>
    </View>
  );
}
