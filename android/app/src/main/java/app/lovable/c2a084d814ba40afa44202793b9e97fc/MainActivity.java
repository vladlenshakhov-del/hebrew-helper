package app.lovable.c2a084d814ba40afa44202793b9e97fc;

import android.os.Bundle;
import android.view.View;
import android.view.ViewParent;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // BridgeWebChromeClient handles AUDIO_CAPTURE requests and asks for the
        // Android runtime permissions before granting microphone access to WebView.
        WebView webView = getBridge().getWebView();
        webView.setWebChromeClient(new BridgeWebChromeClient(getBridge()));

        // Disable Android WebView edge overscroll at the native layer.
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);

        // Keep every gesture inside the WebView so no parent container can
        // treat a vertical drag as a refresh gesture.
        webView.setOnTouchListener((view, event) -> {
            ViewParent parent = view.getParent();
            if (parent != null) {
                parent.requestDisallowInterceptTouchEvent(true);
            }
            return false;
        });

        // When Android kills the WebView renderer (low memory while scrolling a
        // long list), Capacitor would otherwise crash and restart the whole app,
        // which looks like a full refresh. Handle it and rebuild the screen in
        // place; the web app restores its scroll position and filters itself.
        getBridge().addWebViewListener(new WebViewListener() {
            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                runOnUiThread(MainActivity.this::recreate);
                return true;
            }
        });
    }
}
