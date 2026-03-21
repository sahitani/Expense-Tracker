package com.harishsahitani17.spenddashboard

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled

import expo.modules.ReactActivityDelegateWrapper
import expo.modules.splashscreen.SplashScreenManager

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    SplashScreenManager.registerOnActivity(this)
    super.onCreate(null)

    requestSmsPermission()   // 👈 THIS IS IMPORTANT
  }

  private fun requestSmsPermission() {
    if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECEIVE_SMS)
        != PackageManager.PERMISSION_GRANTED) {

        ActivityCompat.requestPermissions(
            this,
            arrayOf(
                Manifest.permission.RECEIVE_SMS,
                Manifest.permission.READ_SMS
            ),
            1
        )
    }
  }

  override fun getMainComponentName(): String = "main"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
      this,
      BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
      object : DefaultReactActivityDelegate(
        this,
        mainComponentName,
        fabricEnabled
      ) {}
    )
  }
}