package com.harishsahitani17.spenddashboard

import com.facebook.react.*
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager

class UserStoragePackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(UserStorageModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}