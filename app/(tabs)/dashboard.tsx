import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { supabase } from "../../lib/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Modal, TextInput } from "react-native";


export default function Dashboard() {

  const [transactions, setTransactions] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
const [manualAmount, setManualAmount] = useState("");
const [manualMerchant, setManualMerchant] = useState("");
const [manualCategory, setManualCategory] = useState("Other");

  useEffect(() => {
    loadTransactions();
    loadSubscriptions();
  }, []);

  async function loadTransactions() {
    const { data } = await supabase
      .from("transactions")
      .select("*");

    setTransactions(data || []);
  }

  async function loadSubscriptions() {
    const { data } = await supabase
      .from("subscriptions")
      .select("*");

    setSubscriptions(data || []);
  }

  const totalSpent = transactions
    .filter((t) => t.type === "debit")
    .reduce((s, t) => s + t.amount, 0);

  const totalCredit = transactions
    .filter((t) => t.type === "credit")
    .reduce((s, t) => s + t.amount, 0);

  const balanceLeft = totalCredit - totalSpent;

  const dailyBurn = totalSpent / 30;

  const largestTransaction =
    transactions.length > 0
      ? Math.max(...transactions.map((t) => t.amount))
      : 0;
async function addManualTransaction() {

  if (!manualAmount || !manualMerchant) {
    alert("Amount and Merchant required");
    return;
  }

  const { data: userData } = await supabase.auth.getUser();

  const user = userData?.user;

  if (!user) {
    alert("User not logged in");
    return;
  }

  const { error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      amount: parseFloat(manualAmount),
      description: manualMerchant,
      category: manualCategory,
      type: "debit",
      raw_sms: "manual-entry",
      date: new Date().toISOString().split("T")[0],
    });

  if (error) {
    console.log(error);
    alert("Insert failed");
    return;
  }

  setShowAddModal(false);
  setManualAmount("");
  setManualMerchant("");

  loadTransactions();
}


  return (
  
  <View style={{ flex: 1 }}>
 
    <ScrollView style={styles.container}>

      {/* BALANCE CARD */}

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

      {/* DAILY BURN */}

      <View style={styles.burnCard}>
        <Text style={styles.burnLabel}>Daily Burn</Text>

        <Text style={styles.burnValue}>
          Rs. {dailyBurn.toFixed(1)}
        </Text>
      </View>

      {/* INSIGHTS */}

      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>Active Subscriptions</Text>
        <Text style={styles.insightValue}>
          {subscriptions.length}
        </Text>
      </View>

      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>Transactions</Text>
        <Text style={styles.insightValue}>
          {transactions.length}
        </Text>
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
<Modal
  visible={showAddModal}
  transparent={true}
  animationType="slide"
>

<View style={styles.modalOverlay}>

<View style={styles.modalCard}>

<Text style={styles.modalTitle}>Add Transaction</Text>

<TextInput
  placeholder="Amount"
  placeholderTextColor="#94a3b8"
  style={styles.input}
  value={manualAmount}
  onChangeText={setManualAmount}
/>

<TextInput
  placeholder="Merchant"
  placeholderTextColor="#94a3b8"
  style={styles.input}
  value={manualMerchant}
  onChangeText={setManualMerchant}
/>

<View style={{ flexDirection: "row", marginTop: 10 }}>

<TouchableOpacity
  style={styles.saveBtn}
  onPress={addManualTransaction}
>
  <Text style={{ color: "white" }}>Save</Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.cancelBtn}
  onPress={() => setShowAddModal(false)}
>
  <Text style={{ color: "white" }}>Cancel</Text>
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
  elevation: 5,
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

saveBtn: {
  flex: 1,
  backgroundColor: "#22c55e",
  padding: 10,
  borderRadius: 8,
  alignItems: "center",
  marginRight: 5,
},

cancelBtn: {
  flex: 1,
  backgroundColor: "#ef4444",
  padding: 10,
  borderRadius: 8,
  alignItems: "center",
  marginLeft: 5,
},
  
});