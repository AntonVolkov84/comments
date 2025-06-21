import { useRef, useEffect } from "react";
import { WebView } from "react-native-webview";

export default function Captcha({ action = "CREATE_POST", onVerify }) {
  const webviewRef = useRef(null);
  const siteKey = process.env.EXPO_PUBLIC_RECAPTCHA_KEY;

  useEffect(() => {
    if (webviewRef.current) {
      webviewRef.current.postMessage("run");
    }
  }, []);

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <script src="https://www.google.com/recaptcha/enterprise.js?render=${siteKey}"></script>
    <script>
      function runCaptcha() {
        grecaptcha.enterprise.ready(async () => {
          try {
            const token = await grecaptcha.enterprise.execute('${siteKey}', { action: '${action}' });
            window.ReactNativeWebView.postMessage(token);
          } catch (err) {
            window.ReactNativeWebView.postMessage("captcha-error:" + err.message);
          }
        });
      }
    </script>
  </head>
  <body onload="runCaptcha()">
  </body>
</html>
`;

  const test = (event) => {
    const token = event.nativeEvent.data;
  };
  return (
    <WebView
      ref={webviewRef}
      source={{ html }}
      originWhitelist={["*"]}
      onMessage={onVerify}
      javaScriptEnabled
      mixedContentMode="always"
      onLoadStart={() => console.log("Captcha started")}
      onError={(e) => console.error("WebView error:", e.nativeEvent)}
      onLoadEnd={() => console.log("WebView loaded")}
      style={{ height: 0, width: 0, opacity: 0 }}
    />
  );
}
