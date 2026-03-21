import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, Modal, TextInput } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { supabase } from "../../lib/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const CATEGORY_OPTIONS = [
  "Food",
  "Groceries",
  "Health",
  "Utilities & Bills",
  "Transport",
  "Rent",
  "Entertainment",
  "Shopping",
  "Investments",
  "Income",
  "Other"
];

export default function Dashboard() {

  const [transactions, setTransactions] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);

  const [manualAmount, setManualAmount] = useState("");
  const [manualMerchant, setManualMerchant] = useState("");
  const [manualCategory, setManualCategory] = useState("Other");
  const [manualType, setManualType] = useState("debit");

  useEffect(() => {
    initialize();

    const interval = setInterval(() => {
      initialize();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  async function initialize() {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) return;

    await loadTransactions(user.id);
    await loadSubscriptions(user.id);
  }

  async function loadTransactions(userId) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (!error) {
      setTransactions(data || []);
    }
  }

  async function loadSubscriptions(userId) {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId);

    setSubscriptions(data || []);
  }

  const totalSpent = transactions
    .filter(t => t.type === "debit")
    .reduce((s, t) => s + (t.amount || 0), 0);

  const totalCredit = transactions
    .filter(t => t.type === "credit")
    .reduce((s, t) => s + (t.amount || 0), 0);

  const balanceLeft = totalCredit - totalSpent;

  const dailyBurn = totalSpent / 30;

  const largestTransaction =
    transactions.length > 0
      ? Math.max(...transactions.map(t => t.amount || 0))
      : 0;

  async function addManualTransaction() {

    if (!manualAmount || !manualMerchant) {
      Alert.alert("Amount and Merchant required");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      Alert.alert("User not logged in");
      return;
    }

    const { error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        amount: parseFloat(manualAmount),
        description: manualMerchant,
        category: manualCategory,
        type: manualType,
        raw_sms: "manual-entry",
        date: new Date().toISOString().split("T")[0],
      });

    if (error) {
      console.log(error);
      Alert.alert("Insert failed");
      return;
    }

    setShowAddModal(false);
    setManualAmount("");
    setManualMerchant("");
    setManualCategory("Other");
    setManualType("debit");

    // ✅ FIXED
    initialize();
  }

  return (
    <View style={{ flex: 1 }}>

      <ScrollView style={styles.container}>

        <LinearGradient
          colors={["#4f46e5", "#9333ea", "#ec4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.balanceCard}
        >

          <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>

          <Text style={styles.balanceAmount}>
            Rs. {balanceLeft.toFixed(2)}
          </Text>

          <View style={styles.row}>

            <View>
              <Text style={styles.smallLabel}>Expenses</Text>
              <Text style={styles.smallValue}>
                Rs. {totalSpent.toFixed(1)}
              </Text>
            </View>

            <View>
              <Text style={styles.smallLabel}>Income</Text>
              <Text style={styles.smallValue}>
                Rs. {totalCredit.toFixed(1)}
              </Text>
            </View>

          </View>

        </LinearGradient>

        <View style={styles.burnCard}>
          <Text style={styles.burnLabel}>Daily Burn</Text>
          <Text style={styles.burnValue}>
            Rs. {dailyBurn.toFixed(1)}
          </Text>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>Active Subscriptions</Text>
          <Text style={styles.insightValue}>{subscriptions.length}</Text>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>Transactions</Text>
          <Text style={styles.insightValue}>{transactions.length}</Text>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>Largest Transaction</Text>
          <Text style={styles.insightValue}>
            Rs. {largestTransaction.toFixed(2)}
          </Text>
        </View>

      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      <Modal visible={showAddModal} transparent animationType="slide">

        <View style={styles.modalOverlay}>

          <View style={styles.modalCard}>

            <Text style={styles.modalTitle}>Add Transaction</Text>

            <TextInput
              placeholder="Amount"
              placeholderTextColor="#94a3b8"
              value={manualAmount}
              onChangeText={setManualAmount}
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              placeholder="Merchant"
              placeholderTextColor="#94a3b8"
              value={manualMerchant}
              onChangeText={setManualMerchant}
              style={styles.input}
            />

            <View style={styles.selectorRow}>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  manualType === "debit" && styles.typeActive
                ]}
                onPress={() => setManualType("debit")}
              >
                <Text style={styles.typeText}>Debit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  manualType === "credit" && styles.typeActive
                ]}
                onPress={() => setManualType("credit")}
              >
                <Text style={styles.typeText}>Credit</Text>
              </TouchableOpacity>

            </View>

            <Text style={{ color: "white", marginTop: 12 }}>Category</Text>

            <Picker
              selectedValue={manualCategory}
              onValueChange={(itemValue) => setManualCategory(itemValue)}
              style={styles.picker}
            >
              {CATEGORY_OPTIONS.map(cat => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>

            <View style={styles.actionRow}>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={addManualTransaction}
              >
                <Text style={styles.actionText}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.actionText}>Cancel</Text>
              </TouchableOpacity>

            </View>

          </View>

        </View>

      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 16,
    paddingTop: 50
  },
  balanceCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  balanceLabel: {
    color: "#94a3b8",
    fontSize: 12,
  },
  balanceAmount: {
    color: "white",
    fontSize: 30,
    fontWeight: "700",
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  smallLabel: {
    color: "#94a3b8",
    fontSize: 12,
  },
  smallValue: {
    color: "white",
    fontWeight: "600",
  },
  burnCard: {
    backgroundColor: "#f97316",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  burnLabel: {
    color: "white",
    fontSize: 12,
  },
  burnValue: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
  insightCard: {
    backgroundColor: "#0f172a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  insightTitle: {
    color: "#94a3b8",
    fontSize: 12,
  },
  insightValue: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#0f172a",
    width: "85%",
    padding: 20,
    borderRadius: 14,
  },
  modalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#020617",
    color: "white",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  selectorRow: {
    flexDirection: "row",
    marginTop: 12
  },
  typeButton: {
    flex: 1,
    backgroundColor: "#1e293b",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 6
  },
  typeActive: {
    backgroundColor: "#3b82f6"
  },
  typeText: {
    color: "white",
    fontWeight: "600"
  },
  picker: {
    backgroundColor: "white",
    borderRadius: 6,
    marginTop: 6
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 16
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#22c55e",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 6
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#ef4444",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 6
  },
  actionText: {
    color: "white",
    fontWeight: "600"
  }
});