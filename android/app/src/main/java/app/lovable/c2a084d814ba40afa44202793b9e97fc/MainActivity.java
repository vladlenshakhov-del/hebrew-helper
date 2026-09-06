package app.lovable.c2a084d814ba40afa44202793b9e97fc;

import android.os.Bundle;
import android.view.View;
import android.view.ViewParent;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // BridgeWebChromeClient handles AUDIO_CAPTURE requests and asks for the
        // Android runtime permissions before granting microphone access to WebView.
        WebView webView = getBridge().getWebView();
        webView.setWebChromeClient(new BridgeWebChromeClient(getBridge()));

        // Disable Android WebView edge overscroll at the native layer. Capacitor
        // has no supported overScrollMode config option, so this must be explicit.
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);

        // Keep every gesture inside the WebView. This prevents Android parent
        // containers from interpreting a downward drag as a refresh gesture.
        webView.setOnTouchListener((view, event) -> {
            ViewParent parent = view.getParent();
            if (parent != null) {
                parent.requestDisallowInterceptTouchEvent(true);
            }
            return false;
        });
    }
}
