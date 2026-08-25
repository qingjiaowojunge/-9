package com.mineweb.minecraft

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

/**
 * 纯 WebView 包装：把本地 assets 里的《我的世界 · Web版》变成一个独立 App。
 * 全部资源打包在 assets 内，可离线运行，不依赖任何外部 CDN。
 */
class MainActivity : AppCompatActivity() {

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 沉浸式全屏 + 常亮
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        setContentView(R.layout.activity_main)

        val webView: WebView = findViewById(R.id.webView)
        webView.setBackgroundColor(android.graphics.Color.BLACK)

        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowFileAccess = true
        settings.setSupportZoom(false)
        settings.loadWithOverviewMode = true
        settings.useWideViewPort = true
        webView.isClickable = true
        webView.isFocusable = true
        webView.isFocusableInTouchMode = true

        webView.webViewClient = WebViewClient() // 始终在应用内加载
        webView.webChromeClient = WebChromeClient()
        webView.isVerticalScrollBarEnabled = false

        // 加载打包进 APK 的本地游戏页面
        webView.loadUrl("file:///android_asset/index.html")
    }

    // 返回键：优先返回应用内
    override fun onBackPressed() {
        val webView: WebView = findViewById(R.id.webView)
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }
}