import { useState, useRef, useEffect, useCallback } from "react";

var W = 520, H = 380;
var BUBBLE_THRESHOLD = 45;
var CONFIRM_WINDOW_SEC = 6;

function drawUltrasound(ctx, frame) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  var cx = W / 2, topY = 10, spread = Math.PI * 0.38, depth = H - 30;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.arc(cx, topY, depth, Math.PI / 2 - spread, Math.PI / 2 + spread);
  ctx.closePath();
  ctx.clip();
  var grad = ctx.createRadialGradient(cx, topY, 20, cx, topY, depth);
  grad.addColorStop(0, "#111");
  grad.addColorStop(0.3, "#1a1a2a");
  grad.addColorStop(0.6, "#0d0d1a");
  grad.addColorStop(1, "#000");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  var imgData = ctx.getImageData(0, 0, W, H);
  var d = imgData.data;
  for (var i = 0; i < d.length; i += 4) {
    if (d[i] > 0 || d[i + 1] > 0) {
      var n = (Math.random() * 40 - 20) | 0;
      var s = Math.sin(frame * 0.03 + i * 0.0001) * 8;
      d[i] = Math.max(0, Math.min(255, d[i] + n + s));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n + s));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n + s));
    }
  }
  ctx.putImageData(imgData, 0, 0);
  var layers = [
    { y: 100, t: 8, b: 80 },
    { y: 160, t: 12, b: 100 },
    { y: 220, t: 6, b: 70 },
    { y: 280, t: 10, b: 90 }
  ];
  layers.forEach(function(l) {
    ctx.beginPath();
    var startX = cx - depth * Math.sin(spread);
    var endX = cx + depth * Math.sin(spread);
    for (var x = startX; x < endX; x += 2) {
      var w = Math.sin(x * 0.03 + frame * 0.02) * 4 + Math.sin(x * 0.07) * 2;
      if (x === startX) ctx.moveTo(x, l.y + w);
      else ctx.lineTo(x, l.y + w);
    }
    ctx.strokeStyle = "rgba(" + (l.b + 40) + "," + (l.b + 20) + "," + l.b + ",0.6)";
    ctx.lineWidth = l.t;
    ctx.filter = "blur(2px)";
    ctx.stroke();
    ctx.filter = "none";
  });
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.arc(cx, topY, depth, Math.PI / 2 - spread, Math.PI / 2 + spread);
  ctx.closePath();
  ctx.strokeStyle = "rgba(0,180,255,0.3)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "rgba(0,180,255,0.5)";
  ctx.font = "10px monospace";
  for (var j = 1; j <= 4; j++) {
    var dd = (depth / 5) * j;
    ctx.fillText(j * 2 + "cm", W - 48, topY + dd);
  }
}

function drawRespiration(ctx, frame) {
  var phase = (frame % 240) / 240;
  var bv = Math.sin(phase * Math.PI * 2);
  var barX = W - 18, barY = 40, barH = 120;
  var midY = barY + barH / 2;
  var markerY = midY - bv * (barH / 2 - 6);
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(barX - 10, barY - 12, 26, barH + 24);
  ctx.font = "8px monospace";
  ctx.fillStyle = "#888";
  ctx.fillText("INS", barX - 8, barY - 3);
  ctx.fillText("EXP", barX - 8, barY + barH + 10);
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(barX, barY);
  ctx.lineTo(barX, barY + barH);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(barX, markerY, 4, 0, Math.PI * 2);
  ctx.fillStyle = bv > 0.3 ? "#00bbff" : bv < -0.3 ? "#ff8800" : "#888";
  ctx.fill();
}

function drawCrosshair(ctx, power, active) {
  var cx = W / 2 + 15, cy = 190;
  var color = active ? "rgba(0,255,100,0.8)" : "rgba(0,200,255,0.6)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 50, cy);
  ctx.lineTo(cx - 6, cy);
  ctx.moveTo(cx + 6, cy);
  ctx.lineTo(cx + 50, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - 50);
  ctx.lineTo(cx, cy - 6);
  ctx.moveTo(cx, cy + 6);
  ctx.lineTo(cx, cy + 50);
  ctx.stroke();
  if (active && power >= BUBBLE_THRESHOLD) {
    var intensity = (power - BUBBLE_THRESHOLD) / (100 - BUBBLE_THRESHOLD);
    var cloudR = 18 + intensity * 6;
    var count = Math.floor(30 + intensity * 100);
    for (var i = 0; i < count; i++) {
      var ang = Math.random() * Math.PI * 2;
      var dist = Math.pow(Math.random(), 0.7) * cloudR;
      var bx = cx + Math.cos(ang) * dist;
      var by = cy + Math.sin(ang) * dist * 0.7;
      var br = Math.random() * 2.5 + 0.8;
      var ba = 0.3 + intensity * 0.5 + Math.random() * 0.2;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255," + Math.min(ba, 1) + ")";
      ctx.fill();
    }
    for (var k = 0; k < count * 0.3; k++) {
      var ang2 = Math.random() * Math.PI * 2;
      var dist2 = Math.random() * cloudR * 0.8;
      var bx2 = cx + Math.cos(ang2) * dist2;
      var by2 = cy + Math.sin(ang2) * dist2 * 0.7;
      ctx.beginPath();
      ctx.arc(bx2, by2, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255," + (0.6 + intensity * 0.4) + ")";
      ctx.fill();
    }
  }
}

function drawBannerOverlay(ctx, timeLeft, pct) {
  var bannerH = 36;
  var y = H - 28 - bannerH - 4;
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillRect(10, y, W - 20, bannerH);
  ctx.strokeStyle = "#00ff66";
  ctx.lineWidth = 1;
  ctx.strokeRect(10, y, W - 20, bannerH);
  var barColor = timeLeft <= 2 ? "#f44" : timeLeft <= 4 ? "#fa0" : "#0bf";
  ctx.fillStyle = barColor;
  ctx.fillRect(14, y + bannerH - 6, (W - 28) * pct, 3);
  ctx.fillStyle = "#ff0";
  ctx.font = "bold 11px monospace";
  ctx.fillText("CONFIRM SUSTAINED BUBBLE CLOUD", 20, y + 15);
  ctx.fillStyle = "#aaa";
  ctx.font = "10px monospace";
  ctx.fillText(timeLeft + "s", W - 46, y + 15);
  ctx.fillStyle = "#00cc55";
  ctx.fillRect(W - 100, y + 4, 70, bannerH - 8);
  ctx.fillStyle = "#000";
  ctx.font = "bold 10px monospace";
  ctx.fillText("CONFIRM", W - 94, y + 22);
}

function drawBorderGlow(ctx, timeLeft, pct) {
  var cx = W / 2, topY = 10, spread = Math.PI * 0.38, depth = H - 30;
  var startA = Math.PI / 2 - spread;
  var endA = startA + pct * spread * 2;
  var color = timeLeft <= 2 ? "#f44" : timeLeft <= 4 ? "#fa0" : "#00ff66";
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.arc(cx, topY, depth, startA, endA);
  ctx.lineTo(cx, topY);
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(W / 2 - 120, H - 65, 240, 22);
  ctx.fillStyle = "#ff0";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.fillText("TAP IMAGE TO CONFIRM  (" + timeLeft + "s)", W / 2, H - 49);
  ctx.textAlign = "left";
}

function drawFloatingConfirm(ctx, timeLeft, pct) {
  var cx = W / 2 + 15, cy = 190;
  var boxW = 110, boxH = 90;
  var r = 22;
  var btnX = cx;
  var btnY = cy + boxH / 2 + r + 10;
  var color = timeLeft <= 2 ? "#f44" : timeLeft <= 4 ? "#fa0" : "#00ff66";

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH);
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(btnX, btnY, r + 4, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(btnX, btnY, r, 0, Math.PI * 2);
  ctx.fillStyle = "#00cc55";
  ctx.fill();
  ctx.strokeStyle = "#00ff66";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#000";
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  ctx.fillText("CONFIRM", btnX, btnY + 3);
  ctx.textAlign = "left";

  ctx.fillStyle = color;
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillText(timeLeft + "s", btnX, btnY + r + 14);
  ctx.textAlign = "left";
}

function Slider({ value, onChange, onToggle, active, disabled }) {
  var pct = value / 100;
  var trackColor = active
    ? "linear-gradient(to right, #00cc55 0%, #00ff66 " + (pct * 100) + "%, #333 " + (pct * 100) + "%, #333 100%)"
    : "linear-gradient(to right, #555 0%, #555 " + (pct * 100) + "%, #333 " + (pct * 100) + "%, #333 100%)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", width: "100%", opacity: disabled ? 0.4 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
        <button onClick={onToggle} style={{
          width: 48, height: 48, borderRadius: "50%",
          border: "2px solid " + (active ? "#00ff66" : "#555"),
          background: active ? "#00cc55" : "#2a2a2a",
          cursor: "pointer",
          color: active ? "#000" : "#999",
          fontFamily: "monospace", fontSize: 10, fontWeight: "bold",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
        }}>{active ? "ON" : "OFF"}</button>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <input type="range" min={0} max={100} step={1} value={value}
            onChange={function(e) { onChange(Number(e.target.value)); }}
            disabled={disabled}
            style={{
              width: "100%", height: 8, appearance: "none", WebkitAppearance: "none",
              background: trackColor, borderRadius: 4, outline: "none",
              cursor: disabled ? "not-allowed" : "pointer"
            }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "monospace", fontSize: 9, color: "#555" }}>
            <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
          </div>
        </div>
        <div style={{
          color: active ? "#00ff66" : "#666",
          fontFamily: "monospace", fontSize: 20, fontWeight: "bold",
          width: 50, textAlign: "right", flexShrink: 0
        }}>{value.toFixed(0)}%</div>
      </div>
    </div>
  );
}

function useAutoThreshold() {
  var stateRef = useRef("idle");
  var [state, setState] = useState("idle");
  var [searchPower, setSearchPower] = useState(0);
  var [log, setLog] = useState([]);
  var [foundThreshold, setFoundThreshold] = useState(null);
  var searchRef = useRef(null);

  var startSearch = useCallback(function() {
    stateRef.current = "ramping";
    setState("ramping");
    setLog([]);
    setFoundThreshold(null);
    var current = 0, step = 0, rampStep = 5, logs = [];

    function rampTick() {
      current += rampStep;
      step++;
      var hasBubble = current >= BUBBLE_THRESHOLD;
      logs.push({ step: step, v: current, bubble: hasBubble, phase: "ramp", msg: "Ramp " + current + "% -> " + (hasBubble ? "CAVITATION DETECTED" : "no cavitation") });
      setLog(logs.slice());
      setSearchPower(current);

      if (hasBubble) {
        var lo = current - rampStep, hi = current;
        stateRef.current = "refining";
        setState("refining");

        function refineTick() {
          if (hi - lo < 1.5) {
            setSearchPower(hi);
            logs.push({ step: step + 1, v: hi, bubble: true, phase: "done", msg: "ALARA threshold: " + hi + "% (minimum cavitation)" });
            setLog(logs.slice());
            setFoundThreshold(hi);
            stateRef.current = "confirming";
            setState("confirming");
            return;
          }
          step++;
          var mid = Math.round((lo + hi) / 2);
          var midB = mid >= BUBBLE_THRESHOLD;
          logs.push({ step: step, v: mid, bubble: midB, phase: "refine", msg: "Refine " + mid + "% -> " + (midB ? "CAVITATION" : "no cavitation") });
          setLog(logs.slice());
          setSearchPower(mid);
          if (midB) hi = mid; else lo = mid;
          searchRef.current = setTimeout(refineTick, 600);
        }
        searchRef.current = setTimeout(refineTick, 600);
      } else if (current >= 100) {
        logs.push({ step: step + 1, v: 100, bubble: false, phase: "done", msg: "No cavitation at max" });
        setLog(logs.slice());
        stateRef.current = "found";
        setState("found");
      } else {
        searchRef.current = setTimeout(rampTick, 500);
      }
    }
    searchRef.current = setTimeout(rampTick, 400);
  }, []);

  var confirmThreshold = useCallback(function() {
    stateRef.current = "found";
    setState("found");
  }, []);

  var resetFromTimeout = useCallback(function() {
    stateRef.current = "idle";
    setState("idle");
    setSearchPower(0);
    setFoundThreshold(null);
  }, []);

  var reset = useCallback(function() {
    if (searchRef.current) clearTimeout(searchRef.current);
    stateRef.current = "idle";
    setState("idle");
    setSearchPower(0);
    setLog([]);
    setFoundThreshold(null);
  }, []);

  useEffect(function() {
    return function() { if (searchRef.current) clearTimeout(searchRef.current); };
  }, []);

  return { state: state, searchPower: searchPower, log: log, foundThreshold: foundThreshold, startSearch: startSearch, reset: reset, confirmThreshold: confirmThreshold, resetFromTimeout: resetFromTimeout };
}

export default function App() {
  var canvasRef = useRef(null);
  var frameRef = useRef(0);
  var [power, setPower] = useState(0);
  var [active, setActive] = useState(false);
  var [pulseCount, setPulseCount] = useState(0);
  var [autoMode, setAutoMode] = useState(false);
  var [showLog, setShowLog] = useState(false);
  var [confirmResult, setConfirmResult] = useState(null);
  var [manualThreshold, setManualThreshold] = useState(null);
  var [variant, setVariant] = useState("A");
  var [confirmTimeLeft, setConfirmTimeLeft] = useState(CONFIRM_WINDOW_SEC);
  var confirmTimerRef = useRef(null);

  var auto = useAutoThreshold();
  var searchState = auto.state;
  var searchPower = auto.searchPower;
  var log = auto.log;
  var foundThreshold = auto.foundThreshold;
  var startSearch = auto.startSearch;
  var reset = auto.reset;
  var confirmThreshold = auto.confirmThreshold;
  var resetFromTimeout = auto.resetFromTimeout;

  var displayPower = autoMode && searchState !== "idle" ? searchPower : power;
  var isSearching = autoMode && (searchState === "ramping" || searchState === "refining");
  var isConfirming = searchState === "confirming";
  var displayThreshold = autoMode ? foundThreshold : manualThreshold;

  var floatingBtnY = 190 + 45 + 22 + 10;

  useEffect(function() {
    if (!isConfirming) return;
    setConfirmTimeLeft(CONFIRM_WINDOW_SEC);
    confirmTimerRef.current = setInterval(function() {
      setConfirmTimeLeft(function(t) {
        if (t <= 1) {
          clearInterval(confirmTimerRef.current);
          resetFromTimeout();
          setActive(false);
          setConfirmResult("timeout");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return function() { clearInterval(confirmTimerRef.current); };
  }, [isConfirming, resetFromTimeout]);

  var handleConfirm = useCallback(function() {
    if (!isConfirming) return;
    if (confirmTimerRef.current) clearInterval(confirmTimerRef.current);
    confirmThreshold();
    setConfirmResult("confirmed");
    setActive(false);
  }, [isConfirming, confirmThreshold]);

  var handleCanvasClick = useCallback(function(e) {
    if (!isConfirming) return;
    var rect = e.target.getBoundingClientRect();
    var x = (e.clientX - rect.left) * (W / rect.width);
    var y = (e.clientY - rect.top) * (H / rect.height);

    if (variant === "B") {
      handleConfirm();
    } else if (variant === "A") {
      if (x >= W - 100 && x <= W - 30 && y >= H - 68 && y <= H - 36) handleConfirm();
    } else if (variant === "C") {
      var btnX = W / 2 + 15;
      if (Math.hypot(x - btnX, y - floatingBtnY) < 26) handleConfirm();
    }
  }, [isConfirming, variant, handleConfirm, floatingBtnY]);

  var handleToggle = useCallback(function() {
    if (autoMode) {
      if (!active) {
        setActive(true);
        setConfirmResult(null);
        startSearch();
      } else {
        setActive(false);
        reset();
        setConfirmResult(null);
        if (confirmTimerRef.current) clearInterval(confirmTimerRef.current);
      }
    } else {
      setActive(function(a) {
        if (a) {
          setPulseCount(0);
          setManualThreshold(Math.round(power));
        }
        return !a;
      });
    }
  }, [autoMode, active, startSearch, reset, power]);

  var handleModeSwitch = useCallback(function(isAuto) {
    setAutoMode(isAuto);
    setActive(false);
    setPulseCount(0);
    reset();
    setConfirmResult(null);
    setManualThreshold(null);
  }, [reset]);

  useEffect(function() {
    var canvas = canvasRef.current;
    var ctx = canvas.getContext("2d");
    var raf;
    function draw() {
      frameRef.current++;
      drawUltrasound(ctx, frameRef.current);
      drawCrosshair(ctx, displayPower, active);
      drawRespiration(ctx, frameRef.current);

      if (isConfirming) {
        var pct = confirmTimeLeft / CONFIRM_WINDOW_SEC;
        if (variant === "A") drawBannerOverlay(ctx, confirmTimeLeft, pct);
        else if (variant === "B") drawBorderGlow(ctx, confirmTimeLeft, pct);
        else if (variant === "C") drawFloatingConfirm(ctx, confirmTimeLeft, pct);
      }

      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, W, 28);
      ctx.font = "bold 12px monospace";
      ctx.fillStyle = "#0bf";
      ctx.fillText("HISTOTRIPSY SIM  v2.1", 10, 18);
      ctx.fillStyle = isConfirming ? "#ff0" : active ? "#0f6" : "#f44";
      var statusTxt = isConfirming ? "\u25C9 CONFIRM" : isSearching ? "\u25C9 SEARCHING" : active ? "\u25CF ACTIVE" : "\u25CB STANDBY";
      ctx.fillText(statusTxt, W - 130, 18);

      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, H - 28, W, 28);
      ctx.fillStyle = "#0bf";
      ctx.font = "11px monospace";
      ctx.fillText("PWR: " + displayPower.toFixed(0) + "%  |  PULSES: " + pulseCount + "  |  MODE: " + (autoMode ? "AUTO" : "MANUAL"), 10, H - 10);

      raf = requestAnimationFrame(draw);
    }
    draw();
    return function() { cancelAnimationFrame(raf); };
  }, [displayPower, active, pulseCount, autoMode, isSearching, isConfirming, variant, confirmTimeLeft]);

  useEffect(function() {
    if (!active || isSearching || isConfirming) return;
    var iv = setInterval(function() { setPulseCount(function(c) { return c + Math.ceil(displayPower / 20); }); }, 200);
    return function() { clearInterval(iv); };
  }, [active, displayPower, isSearching, isConfirming]);

  function modeBtn(label, isAuto) {
    return (
      <button onClick={function() { handleModeSwitch(isAuto); }} style={{
        flex: 1, padding: "8px 0", fontFamily: "monospace", fontSize: 12, fontWeight: "bold",
        border: "1px solid #444", borderRadius: 6, cursor: "pointer",
        background: autoMode === isAuto ? (isAuto ? "#003322" : "#002244") : "#1a1a1a",
        color: autoMode === isAuto ? (isAuto ? "#00ff66" : "#0bf") : "#666",
        borderColor: autoMode === isAuto ? (isAuto ? "#00ff66" : "#0bf") : "#444",
      }}>{label}</button>
    );
  }

  function varBtn(label, v) {
    return (
      <button onClick={function() { setVariant(v); }} style={{
        flex: 1, padding: "6px 0", fontFamily: "monospace", fontSize: 10, fontWeight: "bold",
        border: "1px solid " + (variant === v ? "#ff0" : "#333"), borderRadius: 4, cursor: "pointer",
        background: variant === v ? "#2a2a00" : "#111",
        color: variant === v ? "#ff0" : "#666",
      }}>{label}</button>
    );
  }

  return (
    <div style={{ background: "#111", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, gap: 12 }}>
      <div style={{ display: "flex", gap: 6, width: 360 }}>
        {varBtn("A: Banner", "A")}
        {varBtn("B: Border Glow", "B")}
        {varBtn("C: Floating Btn", "C")}
      </div>

      <canvas ref={canvasRef} width={W} height={H}
        onClick={handleCanvasClick}
        style={{ borderRadius: 8, border: "2px solid #333", maxWidth: "100%", cursor: isConfirming ? "pointer" : "default" }} />

      <div style={{ display: "flex", gap: 8, width: 280 }}>
        {modeBtn("MANUAL", false)}
        {modeBtn("AUTO THRESHOLD", true)}
      </div>

      <div style={{ background: "#1a1a1a", padding: "16px 20px", borderRadius: 12, border: "1px solid #333", width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ color: "#888", fontFamily: "monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: 2, textAlign: "center" }}>
          {autoMode ? "Start / Stop" : "Power Control"}
        </div>
        <Slider
          value={autoMode ? displayPower : power}
          onChange={autoMode ? function() {} : setPower}
          onToggle={handleToggle}
          active={active}
          disabled={false}
        />

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: "#666", background: "#111", borderRadius: 6, padding: "4px 10px" }}>
            Thresh: <span style={{ color: displayThreshold ? "#0f6" : "#555" }}>{displayThreshold ? displayThreshold + "%" : "\u2014"}</span>
          </div>
        </div>

        {autoMode && confirmResult === "confirmed" && searchState === "found" && (
          <div style={{ background: "#0a2a0a", border: "1px solid #00ff66", borderRadius: 8, padding: 12, fontFamily: "monospace", fontSize: 12, color: "#00ff66", textAlign: "center" }}>
            Threshold confirmed at {foundThreshold}% — sustained bubble cloud verified
          </div>
        )}
        {autoMode && confirmResult === "timeout" && (
          <div style={{ background: "#2a0a0a", border: "1px solid #f44", borderRadius: 8, padding: 12, fontFamily: "monospace", fontSize: 12, color: "#f44", textAlign: "center" }}>
            Confirmation timed out — threshold not verified. Press ON to retry.
          </div>
        )}

        {autoMode && log.length > 0 && (
          <div>
            <button onClick={function() { setShowLog(function(s) { return !s; }); }} style={{
              display: "block", margin: "0 auto", padding: "6px 16px", fontFamily: "monospace", fontSize: 11,
              fontWeight: "bold", border: "1px solid #444", borderRadius: 6, cursor: "pointer",
              background: showLog ? "#1a2a1a" : "#1a1a1a", color: showLog ? "#0f6" : "#888",
              borderColor: showLog ? "#0f6" : "#444",
            }}>{showLog ? "HIDE CONSOLE" : "CONSOLE"}</button>
            {showLog && (
              <div style={{ maxHeight: 130, overflowY: "auto", background: "#111", borderRadius: 8, padding: 10, border: "1px solid #333", marginTop: 8 }}>
                <div style={{ color: "#888", fontFamily: "monospace", fontSize: 10, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>ALARA Search Log</div>
                {log.map(function(entry, i) {
                  var icon = entry.phase === "ramp" ? "\u2191" : entry.phase === "refine" ? "\u27F7" : "\u2713";
                  var clr = entry.phase === "done" ? "#ff0" : entry.bubble ? "#0f6" : "#f88";
                  return (
                    <div key={i} style={{ fontFamily: "monospace", fontSize: 11, color: clr, padding: "2px 0" }}>
                      [{entry.step}] {icon} {entry.msg}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
