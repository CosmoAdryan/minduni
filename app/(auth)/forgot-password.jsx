import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { ArrowLeft, KeyRound } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useUser } from '../../src/context/UserContext';

export default function ForgotPasswordPage() {
  const { resetPassword } = useUser();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    if (!email) { setError('Informe seu email'); return; }

    setLoading(true);
    try {
      const trimmed = email.trim();
      await resetPassword(trimmed);
      // Leva à tela de redefinição, onde o usuário digita o código recebido
      // por e-mail e a nova senha.
      router.push({ pathname: '/reset-password', params: { email: trimmed } });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-stone-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 py-12">
          {/* Voltar */}
          <TouchableOpacity
            className="flex-row items-center mb-8"
            onPress={() => router.back()}
            accessibilityLabel="Voltar para o login"
            accessibilityRole="button"
          >
            <ArrowLeft size={22} color="#2D6254" />
            <Text className="text-sage-500 ml-1 text-base">Voltar</Text>
          </TouchableOpacity>

          {/* Ícone */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-3xl bg-sage-500 items-center justify-center mb-4 shadow-lg">
              <KeyRound size={38} color="white" />
            </View>
            <Text className="text-2xl font-bold text-stone-900">Recuperar senha</Text>
            <Text className="text-stone-500 mt-2 text-center text-base px-4">
              Informe o email da sua conta e enviaremos um código para você criar uma nova senha.
            </Text>
          </View>

          {/* Card */}
          <View className="bg-white rounded-3xl p-6 shadow-md">
            <View className="mb-6">
              <Text className="text-sm font-medium text-stone-700 mb-1">Email</Text>
              <TextInput
                className="bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-stone-900"
                placeholder="seu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <Text className="text-red-600 text-sm">{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              className="bg-sage-500 rounded-xl py-4 items-center"
              onPress={handleSubmit}
              disabled={loading}
              accessibilityLabel="Enviar código de recuperação"
              accessibilityRole="button"
              accessibilityState={{ disabled: loading }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">
                  Enviar código de recuperação
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-4 items-center"
              onPress={() => router.push({ pathname: '/reset-password', params: { email: email.trim() } })}
              accessibilityRole="button"
            >
              <Text className="text-sage-500 text-sm font-medium">Já tenho um código</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
