package app.lovable.c2a084d814ba40afa44202793b9e97fc;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // BridgeWebChromeClient handles AUDIO_CAPTURE requests and asks for the
        // Android runtime permissions before granting microphone access to WebView.
        getBridge().getWebView().setWebChromeClient(new BridgeWebChromeClient(getBridge()));
    }
}
