import React from 'react';
import { View, Text } from 'react-native';

export function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isUser) {
    return (
      <View className="items-end mb-3">
        <View className="bg-purple-600 rounded-2xl rounded-tr-sm px-4 py-3 max-w-xs">
          <Text className="text-white text-sm">{message.content}</Text>
        </View>
        <Text className="text-xs text-gray-400 mt-1">{time}</Text>
      </View>
    );
  }

  return (
    <View className="items-start mb-3">
      <View className="flex-row items-end">
        <View className="w-8 h-8 rounded-full bg-purple-100 items-center justify-center mr-2 mb-1">
          <Text style={{ fontSize: 16 }}>🌿</Text>
        </View>
        <View>
          <View className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs shadow-sm">
            <Text className="text-gray-800 text-sm">{message.content}</Text>
          </View>
          <Text className="text-xs text-gray-400 mt-1 ml-1">{time}</Text>
        </View>
      </View>
    </View>
  );
}

export function TypingIndicator() {
  return (
    <View className="items-start mb-3">
      <View className="flex-row items-end">
        <View className="w-8 h-8 rounded-full bg-purple-100 items-center justify-center mr-2 mb-1">
          <Text style={{ fontSize: 16 }}>🌿</Text>
        </View>
        <View className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <Text className="text-gray-500 text-sm">Sage está digitando...</Text>
        </View>
      </View>
    </View>
  );
}
