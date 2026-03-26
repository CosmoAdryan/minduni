import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Eye, EyeOff, Brain } from 'lucide-react-native';
import { useUser } from '../../src/context/UserContext';

export default function LoginPage() {
  const { login, register } = useUser();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    if (!email || !password) { setError('Preencha todos os campos'); return; }
    if (isRegister && !name) { setError('Informe seu nome'); return; }
    if (password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres'); return; }

    setLoading(true);
    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-purple-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Logo */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-3xl bg-purple-600 items-center justify-center mb-4 shadow-lg">
              <Brain size={40} color="white" />
            </View>
            <Text className="text-3xl font-bold text-gray-800">MindUni</Text>
            <Text className="text-purple-600 mt-1 text-base">Sua jornada de bem-estar começa aqui</Text>
          </View>

          {/* Card */}
          <View className="bg-white rounded-3xl p-6 shadow-md">
            <Text className="text-xl font-bold text-gray-800 mb-6 text-center">
              {isRegister ? 'Criar conta' : 'Entrar'}
            </Text>

            {isRegister && (
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Nome</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                  placeholder="Seu nome"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
                placeholder="seu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-1">Senha</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl">
                <TextInput
                  className="flex-1 px-4 py-3 text-gray-800"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  className="px-3"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#9CA3AF" />
                  ) : (
                    <Eye size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <Text className="text-red-600 text-sm">{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              className="bg-purple-600 rounded-xl py-4 items-center"
              onPress={handleSubmit}
              disabled={loading}
              accessibilityLabel={isRegister ? 'Criar conta' : 'Entrar na sua conta'}
              accessibilityRole="button"
              accessibilityState={{ disabled: loading }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">
                  {isRegister ? 'Criar conta' : 'Entrar'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-4 items-center"
              onPress={() => { setIsRegister(!isRegister); setError(''); }}
            >
              <Text className="text-gray-500 text-sm">
                {isRegister ? 'Já tem conta? ' : 'Não tem conta? '}
                <Text className="text-purple-600 font-semibold">
                  {isRegister ? 'Entrar' : 'Criar conta'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-center text-gray-400 text-xs mt-6">
            🔒 Seus dados ficam apenas no seu dispositivo
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
