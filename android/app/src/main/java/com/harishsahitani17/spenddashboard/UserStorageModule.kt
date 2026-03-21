package com.harishsahitani17.spenddashboard

import android.content.Context
import android.util.Log
import com.facebook.react.bridge.*

class UserStorageModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "UserStorage"
    }

    @ReactMethod
    fun saveUserId(userId: String) {
        val prefs = reactApplicationContext.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        prefs.edit().putString("user_id", userId).apply()

        Log.d("SMS_DEBUG", "🔥 User ID saved: $userId")
    }

    @ReactMethod
    fun saveAccessToken(token: String) {
        val prefs = reactApplicationContext.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        prefs.edit().putString("access_token", token).apply()

        Log.d("SMS_DEBUG", "🔥 Access token saved")
    }
}