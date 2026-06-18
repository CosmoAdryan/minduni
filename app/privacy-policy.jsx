import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

function Section({ title, children }) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#1C1917', marginBottom: 8 }}>{title}</Text>
      {children}
    </View>
  );
}

function P({ children }) {
  return (
    <Text style={{ fontSize: 14, color: '#5A544C', lineHeight: 22, marginBottom: 8 }}>{children}</Text>
  );
}

function Bullet({ children }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 6, paddingRight: 8 }}>
      <Text style={{ color: '#3D7A67', marginRight: 8, fontSize: 14 }}>•</Text>
      <Text style={{ fontSize: 14, color: '#5A544C', lineHeight: 21, flex: 1 }}>{children}</Text>
    </View>
  );
}

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#FAFAF8' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0EDE7' }}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          style={{ padding: 4, marginRight: 8 }}
        >
          <ArrowLeft size={22} color="#2D6254" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1C1917' }}>Política de Privacidade</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 13, color: '#A29D95', marginBottom: 20 }}>
          Última atualização: junho de 2026 · Versão 1.0
        </Text>

        <Section title="1. Quem somos">
          <P>
            O MindUni é um aplicativo de apoio ao bem-estar emocional de estudantes universitários,
            desenvolvido como projeto acadêmico. Esta política explica como tratamos seus dados, em
            conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
          </P>
          <P>
            O MindUni é um apoio complementar e não realiza atendimento clínico nem substitui
            profissionais de saúde. Em situações de crise, ligue para o CVV: 188 (gratuito, sigiloso, 24h).
          </P>
        </Section>

        <Section title="2. Dados que coletamos">
          <Bullet>Dados de conta: nome e e-mail informados no cadastro.</Bullet>
          <Bullet>Registros de humor e anotações do diário emocional.</Bullet>
          <Bullet>Conteúdo das suas conversas com o assistente Sage.</Bullet>
          <Bullet>Progresso de uso: XP, sequências, práticas e desafios concluídos.</Bullet>
        </Section>

        <Section title="3. Dados sensíveis de saúde">
          <P>
            Registros de humor, anotações do diário e conversas com o Sage podem revelar informações
            sobre sua saúde emocional. A LGPD classifica esses como dados pessoais sensíveis (art. 11),
            tratados apenas mediante o seu consentimento específico e destacado, dado no início do uso
            do aplicativo.
          </P>
        </Section>

        <Section title="4. Para que usamos seus dados">
          <Bullet>Permitir o funcionamento do app e personalizar o apoio oferecido.</Bullet>
          <Bullet>Acompanhar a evolução do seu bem-estar ao longo do tempo.</Bullet>
          <Bullet>Gerar as respostas do Sage durante as conversas.</Bullet>
          <P>Não utilizamos seus dados para publicidade e não os vendemos a terceiros.</P>
        </Section>

        <Section title="5. Base legal">
          <P>
            O tratamento se baseia no seu consentimento (art. 7º, I e art. 11, I da LGPD). Você pode
            revogar esse consentimento a qualquer momento, conforme a seção 9.
          </P>
        </Section>

        <Section title="6. Compartilhamento e operadores">
          <P>Para funcionar, o app utiliza serviços de terceiros que atuam como operadores:</P>
          <Bullet>
            Supabase — provê a infraestrutura de banco de dados e autenticação onde seus dados ficam
            armazenados.
          </Bullet>
          <Bullet>
            Google (API Gemini) — processa o texto das suas conversas com o Sage para gerar as
            respostas. O conteúdo enviado é o necessário para a resposta da conversa.
          </Bullet>
          <P>
            Esses serviços tratam os dados apenas para as finalidades acima e conforme suas próprias
            políticas de segurança.
          </P>
        </Section>

        <Section title="7. Segurança">
          <P>
            Seus dados são armazenados de forma protegida na infraestrutura do Supabase, com acesso
            restrito por autenticação e regras de segurança que limitam cada usuário aos seus próprios
            dados.
          </P>
        </Section>

        <Section title="8. Retenção">
          <P>
            Mantemos seus dados enquanto sua conta estiver ativa. Ao solicitar a exclusão, seus dados
            são removidos, ressalvadas obrigações legais de guarda.
          </P>
        </Section>

        <Section title="9. Seus direitos">
          <P>A qualquer momento, você pode:</P>
          <Bullet>Acessar e corrigir seus dados.</Bullet>
          <Bullet>Solicitar a exclusão dos seus dados e da sua conta.</Bullet>
          <Bullet>Revogar o consentimento, deixando de usar o aplicativo.</Bullet>
        </Section>

        <Section title="10. Contato">
          <P>
            Para exercer seus direitos ou tirar dúvidas sobre privacidade, entre em contato pelo e-mail
            do responsável pelo aplicativo: [preencher com o e-mail de contato].
          </P>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
