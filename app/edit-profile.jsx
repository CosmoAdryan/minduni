import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Camera, Eye, EyeOff, Lock, Check, Eraser, Trash2, AlertTriangle,
} from 'lucide-react-native';
import { useUser } from '../src/context/UserContext';

const SAGE = '#3D7A67';

function SectionTitle({ children }) {
  return <Text className="font-bold text-stone-900 text-base mb-3">{children}</Text>;
}

export default function EditProfilePage() {
  const {
    currentUser, updateName, updateAvatar, changePassword, clearData, deleteAccount,
  } = useUser();
  const router = useRouter();

  // Foto
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Nome
  const [name, setName] = useState(currentUser?.name ?? '');
  const [nameLoading, setNameLoading] = useState(false);

  // Senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');

  // Zona de risco
  const [clearing, setClearing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'MQ';

  const nameChanged = name.trim() !== (currentUser?.name ?? '').trim();

  async function handleChangeAvatar() {
    setAvatarLoading(true);
    try {
      await updateAvatar();
    } catch (e) {
      Alert.alert('Não foi possível alterar a foto', e.message);
    } finally {
      setAvatarLoading(false);
    }
  }

  async function handleSaveName() {
    if (!nameChanged) return;
    setNameLoading(true);
    try {
      await updateName(name);
      Alert.alert('Pronto', 'Seu nome foi atualizado.');
    } catch (e) {
      Alert.alert('Não foi possível salvar', e.message);
    } finally {
      setNameLoading(false);
    }
  }

  async function handleChangePassword() {
    setPwdError('');
    if (!currentPassword) { setPwdError('Informe sua senha atual.'); return; }
    if (newPassword.length < 6) { setPwdError('A nova senha deve ter pelo menos 6 caracteres.'); return; }
    if (newPassword !== confirmPassword) { setPwdError('As senhas não coincidem.'); return; }

    setPwdLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Senha alterada', 'Sua senha foi atualizada com sucesso.');
    } catch (e) {
      setPwdError(e.message);
    } finally {
      setPwdLoading(false);
    }
  }

  function confirmClearData() {
    Alert.alert(
      'Limpar meus dados',
      'Isso apaga seus registros de humor, anotações do diário, conversas com o Sage, práticas e progresso. Sua conta continua ativa. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar dados',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            try {
              await clearData();
              Alert.alert('Dados limpos', 'Seus dados de uso foram removidos.');
            } catch (e) {
              Alert.alert('Erro', e.message);
            } finally {
              setClearing(false);
            }
          },
        },
      ],
    );
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Excluir minha conta',
      'Sua conta e todos os seus dados serão apagados definitivamente. Esta ação não pode ser desfeita. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir conta',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccount();
              router.replace('/(auth)/login');
            } catch (e) {
              setDeleting(false);
              Alert.alert('Erro', e.message);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#FAFAF8' }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-stone-100">
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          style={{ padding: 4, marginRight: 8 }}
        >
          <ArrowLeft size={22} color="#2D6254" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-stone-900">Editar perfil</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View className="items-center mb-8">
            <TouchableOpacity
              onPress={handleChangeAvatar}
              disabled={avatarLoading}
              accessibilityRole="button"
              accessibilityLabel="Alterar foto de perfil"
              activeOpacity={0.8}
            >
              <View className="w-28 h-28 rounded-full bg-sage-500 items-center justify-center shadow-md overflow-hidden">
                {avatarLoading ? (
                  <ActivityIndicator color="white" />
                ) : currentUser?.avatarUrl ? (
                  <Image
                    source={{ uri: currentUser.avatarUrl }}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <Text className="text-white text-4xl font-bold">{initials}</Text>
                )}
              </View>
              {/* Selo de câmera */}
              <View
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full items-center justify-center border-2 border-white"
                style={{ backgroundColor: SAGE }}
              >
                <Camera size={16} color="white" />
              </View>
            </TouchableOpacity>
            <Text className="text-stone-500 text-sm mt-3">{currentUser?.email}</Text>
            <TouchableOpacity onPress={handleChangeAvatar} disabled={avatarLoading} className="mt-1">
              <Text style={{ color: SAGE }} className="font-semibold text-sm">Alterar foto</Text>
            </TouchableOpacity>
          </View>

          {/* Nome */}
          <SectionTitle>Nome de usuário</SectionTitle>
          <View className="bg-white rounded-2xl p-4 shadow-sm mb-8">
            <TextInput
              className="bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-stone-900"
              placeholder="Seu nome"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              maxLength={60}
            />
            <TouchableOpacity
              className="rounded-xl py-3 items-center mt-3 flex-row justify-center"
              style={{ backgroundColor: nameChanged ? SAGE : '#D6D3CE' }}
              onPress={handleSaveName}
              disabled={!nameChanged || nameLoading}
              accessibilityRole="button"
              accessibilityLabel="Salvar nome"
            >
              {nameLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Check size={18} color="white" style={{ marginRight: 6 }} />
                  <Text className="text-white font-bold">Salvar nome</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Senha */}
          <SectionTitle>Alterar senha</SectionTitle>
          <View className="bg-white rounded-2xl p-4 shadow-sm mb-8">
            <View className="flex-row items-center bg-stone-100 border border-stone-200 rounded-xl mb-3">
              <View className="pl-3"><Lock size={18} color="#A29D95" /></View>
              <TextInput
                className="flex-1 px-3 py-3 text-stone-900"
                placeholder="Senha atual"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                className="px-3"
                onPress={() => setShowPassword(!showPassword)}
                accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={20} color="#A29D95" /> : <Eye size={20} color="#A29D95" />}
              </TouchableOpacity>
            </View>
            <TextInput
              className="bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-stone-900 mb-3"
              placeholder="Nova senha (mín. 6 caracteres)"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TextInput
              className="bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-stone-900"
              placeholder="Confirmar nova senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />

            {pwdError ? (
              <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-3">
                <Text className="text-red-600 text-sm">{pwdError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              className="rounded-xl py-3 items-center mt-3 flex-row justify-center"
              style={{ backgroundColor: SAGE }}
              onPress={handleChangePassword}
              disabled={pwdLoading}
              accessibilityRole="button"
              accessibilityLabel="Alterar senha"
            >
              {pwdLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold">Alterar senha</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Zona de risco */}
          <SectionTitle>Privacidade e dados</SectionTitle>
          <Text className="text-stone-500 text-xs mb-3">
            De acordo com a Política de Privacidade, você pode limpar seus dados de uso ou excluir
            sua conta a qualquer momento.
          </Text>

          {/* Limpar dados */}
          <TouchableOpacity
            className="bg-white border border-amber-200 py-4 px-4 rounded-2xl flex-row items-center mb-3"
            onPress={confirmClearData}
            disabled={clearing}
            accessibilityRole="button"
            accessibilityLabel="Limpar meus dados"
          >
            {clearing ? (
              <ActivityIndicator color="#D4973E" style={{ marginRight: 12 }} />
            ) : (
              <Eraser size={20} color="#D4973E" style={{ marginRight: 12 }} />
            )}
            <View className="flex-1">
              <Text className="font-semibold" style={{ color: '#B45309' }}>Limpar meus dados</Text>
              <Text className="text-stone-500 text-xs mt-0.5">
                Apaga humor, diário, conversas, práticas e progresso. Mantém a conta.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Excluir conta */}
          <TouchableOpacity
            className="bg-red-50 border border-red-200 py-4 px-4 rounded-2xl flex-row items-center"
            onPress={confirmDeleteAccount}
            disabled={deleting}
            accessibilityRole="button"
            accessibilityLabel="Excluir minha conta"
          >
            {deleting ? (
              <ActivityIndicator color="#EF4444" style={{ marginRight: 12 }} />
            ) : (
              <Trash2 size={20} color="#EF4444" style={{ marginRight: 12 }} />
            )}
            <View className="flex-1">
              <Text className="font-semibold text-red-500">Excluir minha conta</Text>
              <Text className="text-stone-500 text-xs mt-0.5">
                Remove sua conta e todos os dados definitivamente.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Aviso */}
          <View className="flex-row items-start mt-5 px-1">
            <AlertTriangle size={14} color="#A29D95" style={{ marginRight: 6, marginTop: 2 }} />
            <Text className="text-stone-400 text-xs flex-1">
              Ações desta seção não podem ser desfeitas.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
