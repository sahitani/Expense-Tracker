import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  NativeModules
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { useRouter } from "expo-router";

const UserStorage = NativeModules.UserStorage;

export default function Index() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔥 Auto redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const sessionRes = await supabase.auth.getSession();
      const session = sessionRes.data.session;

      if (session) {
        router.replace("/(tabs)/dashboard");
      }
    };

    checkSession();
  }, []);

  async function login() {
    if (!email || !password) {
      Alert.alert("Error", "Email and password required");
      return;
    }

    setLoading(true);

    const response = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (response.error) {
      Alert.alert("Login failed", response.error.message);
      setLoading(false);
      return;
    }

    try {
      const sessionRes = await supabase.auth.getSession();
      const session = sessionRes.data.session;

      if (!session) {
        Alert.alert("Error", "No session found");
        setLoading(false);
        return;
      }

      const userId = session.user.id;
      const accessToken = session.access_token;

      // Save locally
      await AsyncStorage.setItem("user_id", userId);
      await AsyncStorage.setItem("access_token", accessToken);

      // Save to native
      if (UserStorage) {
        UserStorage.saveUserId(userId);
        UserStorage.saveAccessToken(accessToken);
      }

      Alert.alert("Success", "Login successful");

      // ✅ THIS WAS MISSING
      router.replace("/(tabs)/dashboard");

    } catch (e) {
      console.log("ERROR:", e);
    }

    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expense Tracker</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#94a3b8"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#94a3b8"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={login}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Please wait..." : "Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    justifyContent: "center",
    padding: 30
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 40,
    textAlign: "center"
  },
  input: {
    backgroundColor: "#0f172a",
    color: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 14
  },
  button: {
    backgroundColor: "#22c55e",
    padding: 14,
    borderRadius: 8,
    alignItems: "center"
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16
  }
});