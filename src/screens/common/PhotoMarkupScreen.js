import React, { useRef, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../theme';

/**
 * Full-screen photo markup / annotation screen.
 *
 * Route params:
 *   photoUri  — local or remote URI of the image to annotate
 *
 * Returns annotated image as base64 data URI via navigation params callback.
 * Usage: navigation.navigate('PhotoMarkup', { photoUri, onSave: (dataUri) => ... })
 */
export default function PhotoMarkupScreen({ route, navigation }) {
  const { photoUri, onSave } = route.params || {};
  const webRef = useRef(null);

  const handleSave = useCallback(() => {
    webRef.current?.injectJavaScript('window.exportImage(); true;');
  }, []);

  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'export' && data.dataUri) {
        if (onSave) onSave(data.dataUri);
        navigation.goBack();
      }
    } catch {
      // ignore parse errors
    }
  }, [onSave, navigation]);

  const sendCommand = (cmd) => {
    webRef.current?.injectJavaScript(`window.handleCommand('${cmd}'); true;`);
  };

  const html = buildMarkupHTML(photoUri);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Markup</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={handleSave} activeOpacity={0.7}>
          <Text style={styles.doneText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.canvasWrap}>
        <WebView
          ref={webRef}
          source={{ html }}
          style={styles.webview}
          onMessage={handleMessage}
          scrollEnabled={false}
          bounces={false}
          javaScriptEnabled
          originWhitelist={['*']}
          allowFileAccess
          allowFileAccessFromFileURLs
          mixedContentMode="always"
        />
      </View>

      <View style={styles.toolbar}>
        <ToolBtn icon="pencil-outline" label="Draw" onPress={() => sendCommand('draw')} />
        <ToolBtn icon="text-outline" label="Text" onPress={() => sendCommand('text')} />
        <ToolBtn icon="arrow-forward-outline" label="Arrow" onPress={() => sendCommand('arrow')} />
        <ToolBtn icon="arrow-undo-outline" label="Undo" onPress={() => sendCommand('undo')} />
      </View>

      <View style={styles.colorBar}>
        {['#EF4444', '#3B82F6', '#FACC15', '#FFFFFF', '#000000'].map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.colorDot, { backgroundColor: c }]}
            onPress={() => {
              webRef.current?.injectJavaScript(`window.setColor('${c}'); true;`);
            }}
            activeOpacity={0.7}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

function ToolBtn({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.toolBtn} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={22} color={colors.silver} />
      <Text style={styles.toolText}>{label}</Text>
    </TouchableOpacity>
  );
}

function buildMarkupHTML(photoUri) {
  return `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0C1220; overflow:hidden; touch-action:none; }
  canvas { display:block; width:100vw; height:100vh; }
</style></head><body>
<canvas id="c"></canvas>
<script>
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let img = new Image();
let imgLoaded = false;
let strokes = [];
let current = null;
let mode = 'draw';
let penColor = '#EF4444';
let penWidth = 3;
let imgX = 0, imgY = 0, imgW = 0, imgH = 0;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (imgLoaded) fitImage();
  redraw();
}

function fitImage() {
  const cw = canvas.width, ch = canvas.height;
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const scale = Math.min(cw / iw, ch / ih);
  imgW = iw * scale;
  imgH = ih * scale;
  imgX = (cw - imgW) / 2;
  imgY = (ch - imgH) / 2;
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0C1220';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (imgLoaded) ctx.drawImage(img, imgX, imgY, imgW, imgH);
  for (const s of strokes) drawStroke(s);
  if (current) drawStroke(current);
}

function drawStroke(s) {
  ctx.strokeStyle = s.color;
  ctx.fillStyle = s.color;
  ctx.lineWidth = s.width || penWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (s.type === 'draw' && s.points.length > 1) {
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
    ctx.stroke();
  } else if (s.type === 'arrow' && s.points.length === 2) {
    const [a, b] = s.points;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const headLen = 16;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - headLen * Math.cos(angle - 0.4), b.y - headLen * Math.sin(angle - 0.4));
    ctx.lineTo(b.x - headLen * Math.cos(angle + 0.4), b.y - headLen * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();
  } else if (s.type === 'text' && s.text) {
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(s.text, s.points[0].x, s.points[0].y);
  }
}

img.crossOrigin = 'anonymous';
img.onload = () => { imgLoaded = true; fitImage(); redraw(); };
img.src = '${photoUri}';

window.addEventListener('resize', resize);
resize();

let touching = false;
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const t = e.touches[0];
  const p = { x: t.clientX, y: t.clientY };
  touching = true;

  if (mode === 'text') {
    const text = prompt('Enter text:');
    if (text) {
      strokes.push({ type: 'text', color: penColor, width: penWidth, points: [p], text });
      redraw();
    }
    return;
  }
  current = { type: mode, color: penColor, width: penWidth, points: [p] };
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!touching || !current) return;
  const t = e.touches[0];
  const p = { x: t.clientX, y: t.clientY };
  if (mode === 'draw') {
    current.points.push(p);
  } else if (mode === 'arrow') {
    current.points = [current.points[0], p];
  }
  redraw();
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  if (current) {
    strokes.push(current);
    current = null;
  }
  touching = false;
  redraw();
});

window.handleCommand = (cmd) => {
  if (cmd === 'draw' || cmd === 'arrow' || cmd === 'text') mode = cmd;
  else if (cmd === 'undo') { strokes.pop(); redraw(); }
};

window.setColor = (c) => { penColor = c; };

window.exportImage = () => {
  const dataUri = canvas.toDataURL('image/png');
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'export', dataUri }));
};
</script></body></html>`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.slate,
  },
  headerBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm },
  headerTitle: { fontFamily: fonts.primary.semiBold, fontSize: 18, color: colors.white },
  cancelText: { fontFamily: fonts.primary.regular, fontSize: 16, color: colors.muted },
  doneText: { fontFamily: fonts.primary.semiBold, fontSize: 16, color: colors.scaffld },
  canvasWrap: { flex: 1 },
  webview: { flex: 1, backgroundColor: colors.midnight },
  toolbar: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.slate,
  },
  toolBtn: { alignItems: 'center', minHeight: 44, justifyContent: 'center', minWidth: 60 },
  toolText: { fontFamily: fonts.data.medium, fontSize: 10, color: colors.silver, marginTop: 2 },
  colorBar: {
    flexDirection: 'row', justifyContent: 'center', gap: spacing.md,
    paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.slate,
  },
  colorDot: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: colors.slate,
  },
});
