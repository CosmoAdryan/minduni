import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUser } from '../../src/context/UserContext';

export default function ResetPasswordPage() {
  const { verifyRecoveryOtp, updatePassword, resetPassword, logout } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [email, setEmail] = useState(params.email ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function handleSubmit() {
    setError('');
    setInfo('');
    if (!email.trim()) { setError('Informe o email da sua conta'); return; }
    if (!code.trim()) { setError('Informe o código recebido por email'); return; }
    if (!password || !confirm) { setError('Preencha a nova senha'); return; }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres'); return; }
    if (password !== confirm) { setError('As senhas não coincidem'); return; }

    setLoading(true);
    try {
      // 1) Valida o código e abre a sessão de recuperação.
      await verifyRecoveryOtp(email.trim(), code.trim());
      // 2) Define a nova senha.
      await updatePassword(password);
      // 3) Encerra a sessão de recuperação e volta ao login.
      await logout();
      Alert.alert(
        'Senha alterada',
        'Sua senha foi redefinida com sucesso. Faça login com a nova senha.',
      );
      router.replace('/login');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setInfo('');
    if (!email.trim()) { setError('Informe o email da sua conta'); return; }

    setResending(true);
    try {
      await resetPassword(email.trim());
      setInfo('Enviamos um novo código. Verifique seu email (e a caixa de spam).');
    } catch (e) {
      setError(e.message);
    } finally {
      setResending(false);
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
        <View className="flex-1 justify-center px-6 py-12">
          {/* Voltar */}
          <TouchableOpacity
            className="flex-row items-center mb-6"
            onPress={() => router.back()}
            accessibilityLabel="Voltar"
            accessibilityRole="button"
          >
            <ArrowLeft size={22} color="#2D6254" />
            <Text className="text-sage-500 ml-1 text-base">Voltar</Text>
          </TouchableOpacity>

          {/* Ícone */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-3xl bg-sage-500 items-center justify-center mb-4 shadow-lg">
              <ShieldCheck size={38} color="white" />
            </View>
            <Text className="text-2xl font-bold text-stone-900">Nova senha</Text>
            <Text className="text-stone-500 mt-2 text-center text-base px-4">
              Digite o código que enviamos por email e crie uma nova senha.
            </Text>
          </View>

          {/* Card */}
          <View className="bg-white rounded-3xl p-6 shadow-md">
            <View className="mb-4">
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

            <View className="mb-4">
              <Text className="text-sm font-medium text-stone-700 mb-1">Código de verificação</Text>
              <TextInput
                className="bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-stone-900 tracking-[4px] text-center text-lg"
                placeholder="00000000"
                value={code}
                onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 8))}
                keyboardType="number-pad"
                maxLength={8}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-stone-700 mb-1">Nova senha</Text>
              <View className="flex-row items-center bg-stone-100 border border-stone-200 rounded-xl">
                <TextInput
                  className="flex-1 px-4 py-3 text-stone-900"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  className="px-3"
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#A29D95" />
                  ) : (
                    <Eye size={20} color="#A29D95" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-stone-700 mb-1">Confirmar senha</Text>
              <TextInput
                className="bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-stone-900"
                placeholder="Repita a nova senha"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>

            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <Text className="text-red-600 text-sm">{error}</Text>
              </View>
            ) : null}

            {info ? (
              <View className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
                <Text className="text-green-700 text-sm">{info}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              className="bg-sage-500 rounded-xl py-4 items-center"
              onPress={handleSubmit}
              disabled={loading}
              accessibilityLabel="Salvar nova senha"
              accessibilityRole="button"
              accessibilityState={{ disabled: loading }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">Salvar nova senha</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-4 items-center"
              onPress={handleResend}
              disabled={resending}
              accessibilityRole="button"
            >
              {resending ? (
                <ActivityIndicator color="#2D6254" />
              ) : (
                <Text className="text-sage-500 text-sm font-medium">Reenviar código</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
