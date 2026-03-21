package com.harishsahitani17.spenddashboard

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import java.net.HttpURLConnection
import java.net.URL
import java.io.OutputStream

class SmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {

        if (Telephony.Sms.Intents.SMS_RECEIVED_ACTION == intent.action) {

            for (smsMessage in Telephony.Sms.Intents.getMessagesFromIntent(intent)) {

                val messageBody = smsMessage.messageBody
                val lower = messageBody.lowercase()

                if (
                    lower.contains("debited") ||
                    lower.contains("credited") ||
                    lower.contains("upi") ||
                    lower.contains("txn")
                ) {

                    Log.d("SMS_DEBUG", "Captured SMS: $messageBody")

                    val prefs = context.applicationContext
                        .getSharedPreferences("app_prefs", Context.MODE_PRIVATE)

                    val userId = prefs.getString("user_id", null)
                    val token = prefs.getString("access_token", null)

                    Log.d("SMS_DEBUG", "User ID: $userId")
                    Log.d("SMS_DEBUG", "Token: $token")

                    if (userId == null || token == null) {
                        Log.e("SMS_DEBUG", "Missing userId or token")
                        return
                    }

                    Thread {
                        try {
                            val url = URL("https://pniwgtspagxcxugztrwt.supabase.co/functions/v1/sms-ingest")

                            val conn = url.openConnection() as HttpURLConnection
                            conn.requestMethod = "POST"
                            conn.setRequestProperty("Accept", "application/json")
                            conn.setRequestProperty("Content-Type", "application/json")

                            // ✅ THIS IS THE FIX
                            conn.setRequestProperty("Authorization", "Bearer $token")

                            conn.doOutput = true

                            val json = org.json.JSONObject()
                            json.put("sms", messageBody)
                            json.put("user_id", userId)

                            Log.d("SMS_DEBUG", "Sending JSON: $json")

                            val os: OutputStream = conn.outputStream
                            os.write(json.toString().toByteArray())
                            os.close()

                            val responseCode = conn.responseCode
                            Log.d("SMS_DEBUG", "Response: $responseCode")

                        } catch (e: Exception) {
                            Log.e("SMS_DEBUG", "Error: ${e.message}")
                        }
                    }.start()
                }
            }
        }
    }
}