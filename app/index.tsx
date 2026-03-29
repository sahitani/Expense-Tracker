import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  NativeModules,
  Platform
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
  const [mode, setMode] = useState("login");

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

  async function persistUserToNative(userId, token) {
    if (Platform.OS !== "android") return;
    if (!UserStorage) return;
    await new Promise((resolve, reject) => {
      try {
        UserStorage.saveUserId(userId);
        UserStorage.saveAccessToken(token);
        setTimeout(resolve, 100);
      } catch (e) {
        reject(e);
      }
    });
  }

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

      // Save to native (awaited before navigating)
      await persistUserToNative(userId, accessToken);

      router.replace("/(tabs)/dashboard");

    } catch (e) {
      console.log("ERROR:", e);
    }

    setLoading(false);
  }

  async function register() {
    if (!email || !password) {
      Alert.alert("Error", "Email and password required");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    setLoading(false);

    if (error) {
      Alert.alert("Registration failed", error.message);
      return;
    }

    Alert.alert("Account created", "Please login.");
    setMode("login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expense Tracker</Text>

      {/* TOGGLE */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, mode === "login" && styles.active]}
          onPress={() => setMode("login")}
        >
          <Text style={styles.tabText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, mode === "register" && styles.active]}
          onPress={() => setMode("register")}
        >
          <Text style={styles.tabText}>Register</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#94a3b8"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
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
        onPress={mode === "login" ? login : register}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
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
  tabs: {
    flexDirection: "row",
    marginBottom: 20
  },
  tab: {
    flex: 1,
    padding: 12,
    backgroundColor: "#1e293b",
    alignItems: "center",
    marginRight: 6,
    borderRadius: 8
  },
  active: {
    backgroundColor: "#3b82f6"
  },
  tabText: {
    color: "white"
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