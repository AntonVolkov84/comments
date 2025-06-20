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
      </head>
      <body>
        <script>
          document.addEventListener("message", function(event) {
            grecaptcha.enterprise.ready(async () => {
              const token = await grecaptcha.enterprise.execute('${siteKey}', {action: '${action}'});
              window.ReactNativeWebView.postMessage(token);
            });
          });
        </script>
      </body>
    </html>
  `;

  return (
    <WebView
      ref={webviewRef}
      source={{ html }}
      onMessage={(event) => onVerify(event.nativeEvent.data)}
      style={{ height: 0, width: 0 }}
    />
  );
}
