import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import SetupScreen from './src/screens/SetupScreen';
import CountdownScreen from './src/screens/CountdownScreen';
import GameScreen from './src/screens/GameScreen';
import ResultScreen from './src/screens/ResultScreen';
import SoloSetupScreen from './src/screens/SoloSetupScreen';
import SoloGameScreen from './src/screens/SoloGameScreen';
import SoloResultScreen from './src/screens/SoloResultScreen';
import VocabSetupScreen from './src/screens/VocabSetupScreen';
import VocabCountdown from './src/screens/VocabCountdown';
import VocabGameScreen from './src/screens/VocabGameScreen';
import VocabResultScreen from './src/screens/VocabResultScreen';
import VocabSoloSetupScreen from './src/screens/VocabSoloSetupScreen';
import VocabSoloGameScreen from './src/screens/VocabSoloGameScreen';
import VocabSoloResultScreen from './src/screens/VocabSoloResultScreen';
import ColorSetupScreen from './src/screens/ColorSetupScreen';
import ColorGameScreen from './src/screens/ColorGameScreen';
import ColorResultScreen from './src/screens/ColorResultScreen';
import ColorBattleSetupScreen from './src/screens/ColorBattleSetupScreen';
import ColorBattleGameScreen from './src/screens/ColorBattleGameScreen';
import ColorBattleResultScreen from './src/screens/ColorBattleResultScreen';
import MemorySetupScreen from './src/screens/MemorySetupScreen';
import MemoryGameScreen from './src/screens/MemoryGameScreen';
import MemoryResultScreen from './src/screens/MemoryResultScreen';
import MemoryBattleSetupScreen from './src/screens/MemoryBattleSetupScreen';
import MemoryBattleGameScreen from './src/screens/MemoryBattleGameScreen';
import MemoryBattleResultScreen from './src/screens/MemoryBattleResultScreen';
import FlagBattleSetupScreen from './src/screens/FlagBattleSetupScreen';
import FlagBattleGameScreen from './src/screens/FlagBattleGameScreen';
import FlagBattleResultScreen from './src/screens/FlagBattleResultScreen';
import FlagSoloSetupScreen from './src/screens/FlagSoloSetupScreen';
import FlagSoloGameScreen from './src/screens/FlagSoloGameScreen';
import FlagSoloResultScreen from './src/screens/FlagSoloResultScreen';
import FeedbackScreen from './src/screens/FeedbackScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { useProfileStore } from './src/store/profileStore';
import type { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    useProfileStore.getState().init();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" hidden />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{ headerShown: false, animation: 'fade' }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Setup" component={SetupScreen} />
          <Stack.Screen name="Countdown" component={CountdownScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="Game" component={GameScreen} options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="Result" component={ResultScreen} options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="SoloSetup" component={SoloSetupScreen} />
          <Stack.Screen name="SoloGame" component={SoloGameScreen} options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="SoloResult" component={SoloResultScreen} options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="VocabSetup" component={VocabSetupScreen} />
          <Stack.Screen name="VocabCountdown" component={VocabCountdown} options={{ animation: 'fade' }} />
          <Stack.Screen name="VocabGame" component={VocabGameScreen} options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="VocabResult" component={VocabResultScreen} options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="VocabSoloSetup" component={VocabSoloSetupScreen} />
          <Stack.Screen name="VocabSoloGame" component={VocabSoloGameScreen} options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="VocabSoloResult" component={VocabSoloResultScreen} options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="ColorSetup" component={ColorSetupScreen} />
          <Stack.Screen name="ColorGame" component={ColorGameScreen} options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="ColorResult" component={ColorResultScreen} options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="ColorBattleSetup" component={ColorBattleSetupScreen} />
          <Stack.Screen name="ColorBattleGame" component={ColorBattleGameScreen} options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="ColorBattleResult" component={ColorBattleResultScreen} options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="MemorySetup" component={MemorySetupScreen} />
          <Stack.Screen name="MemoryGame" component={MemoryGameScreen} options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="MemoryResult" component={MemoryResultScreen} options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="MemoryBattleSetup" component={MemoryBattleSetupScreen} />
          <Stack.Screen name="MemoryBattleGame" component={MemoryBattleGameScreen} options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="MemoryBattleResult" component={MemoryBattleResultScreen} options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="FlagBattleSetup" component={FlagBattleSetupScreen} />
          <Stack.Screen name="FlagBattleGame" component={FlagBattleGameScreen} options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="FlagBattleResult" component={FlagBattleResultScreen} options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="FlagSoloSetup" component={FlagSoloSetupScreen} />
          <Stack.Screen name="FlagSoloGame" component={FlagSoloGameScreen} options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="FlagSoloResult" component={FlagSoloResultScreen} options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="Feedback" component={FeedbackScreen} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
