import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { supabase } from "../../lib/supabase";

export default function Subscriptions() {

  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function loadSubscriptions() {

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("next_billing_date", { ascending: true });

    if (!error) {
      setSubscriptions(data || []);
    }

  }

  const monthlyTotal = subscriptions.reduce((sum, s) => sum + s.amount, 0);
  const yearlyTotal = monthlyTotal * 12;

  return (

    <ScrollView style={styles.container}>

      {/* OVERVIEW CARD */}

      <View style={styles.headerCard}>

        <Text style={styles.headerLabel}>
          SUBSCRIPTION OVERVIEW
        </Text>

        <Text style={styles.headerCount}>
          {subscriptions.length}
        </Text>

        <Text style={styles.headerSub}>
          Active subscriptions
        </Text>

        <View style={styles.row}>

          <View>
            <Text style={styles.smallLabel}>Monthly</Text>
            <Text style={styles.smallValue}>
              ₹{monthlyTotal.toFixed(2)}
            </Text>
          </View>

          <View>
            <Text style={styles.smallLabel}>Yearly</Text>
            <Text style={styles.smallValue}>
              ₹{yearlyTotal.toFixed(2)}
            </Text>
          </View>

        </View>

      </View>

      {/* SUBSCRIPTION LIST */}

      {subscriptions.map((sub) => {

        const nextBilling = new Date(sub.next_billing_date);

        const today = new Date();

        const daysUntil = Math.ceil(
          (nextBilling.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        const progress = 100 - Math.min(Math.max(daysUntil * 5, 0), 100);

        const barColor = daysUntil <= 5 ? "#f97316" : "#10b981";

        return (

          <View key={sub.id} style={styles.card}>

            <View style={styles.cardHeader}>

              <View>

                <Text style={styles.merchant}>
                  {sub.merchant}
                </Text>

                <Text style={styles.cycle}>
                  {sub.billing_cycle}
                </Text>

              </View>

              <Text style={styles.amount}>
                ₹{sub.amount.toFixed(2)}
              </Text>

            </View>

            <Text style={styles.days}>
              {daysUntil} days until billing
            </Text>

            <View style={styles.progressBar}>

              <View
                style={{
                  width: progress + "%",
                  height: "100%",
                  backgroundColor: barColor
                }}
              />

            </View>

            <Text style={styles.nextBilling}>
              Next billing: {nextBilling.toLocaleDateString("en-IN")}
            </Text>

          </View>

        );

      })}

    </ScrollView>

  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 16,
	paddingTop: 50
  },

  headerCard: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 18,
    marginBottom: 16
  },

  headerLabel: {
    color: "#94a3b8",
    fontSize: 12
  },

  headerCount: {
    color: "white",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 4
  },

  headerSub: {
    color: "#94a3b8",
    fontSize: 12
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16
  },

  smallLabel: {
    color: "#94a3b8",
    fontSize: 12
  },

  smallValue: {
    color: "white",
    fontWeight: "600"
  },

  card: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },

  merchant: {
    color: "white",
    fontWeight: "600"
  },

  cycle: {
    color: "#94a3b8",
    fontSize: 11
  },

  amount: {
    color: "white",
    fontWeight: "600"
  },

  days: {
    color: "#94a3b8",
    fontSize: 12,
    marginBottom: 6
  },

  progressBar: {
    height: 6,
    backgroundColor: "#1e293b",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8
  },

  nextBilling: {
    color: "#94a3b8",
    fontSize: 12
  }

});