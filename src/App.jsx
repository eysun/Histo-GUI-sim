import { useState, useRef, useEffect, useCallback } from "react";

var W = 520, H = 380, BT = 45, CSC = 6, HVG = 70, AUTO_SHUTOFF_SEC = 30;

function drawUS(ctx, f) {
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  var cx = W / 2, topY = 10, sp = Math.PI * 0.38, dep = H - 30;
  ctx.save(); ctx.beginPath(); ctx.moveTo(cx, topY);
  ctx.arc(cx, topY, dep, Math.PI / 2 - sp, Math.PI / 2 + sp); ctx.closePath(); ctx.clip();
  var g = ctx.createRadialGradient(cx, topY, 20, cx, topY, dep);
  g.addColorStop(0, "#111"); g.addColorStop(0.3, "#1a1a2a"); g.addColorStop(0.6, "#0d0d1a"); g.addColorStop(1, "#000");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  var id = ctx.getImageData(0, 0, W, H), d = id.data;
  for (var i = 0; i < d.length; i += 4) {
    if (d[i] > 0 || d[i + 1] > 0) {
      var n = (Math.random() * 40 - 20) | 0, s = Math.sin(f * 0.03 + i * 0.0001) * 8;
      d[i] = Math.max(0, Math.min(255, d[i] + n + s));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n + s));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n + s));
    }
  }
  ctx.putImageData(id, 0, 0);
  [{ y: 100, t: 8, b: 80 }, { y: 160, t: 12, b: 100 }, { y: 220, t: 6, b: 70 }, { y: 280, t: 10, b: 90 }].forEach(function (l) {
    ctx.beginPath(); var sx = cx - dep * Math.sin(sp);
    for (var x = sx; x < cx + dep * Math.sin(sp); x += 2) {
      var w = Math.sin(x * 0.03 + f * 0.02) * 4 + Math.sin(x * 0.07) * 2;
      x === sx ? ctx.moveTo(x, l.y + w) : ctx.lineTo(x, l.y + w);
    }
    ctx.strokeStyle = "rgba(" + (l.b + 40) + "," + (l.b + 20) + "," + l.b + ",0.6)";
    ctx.lineWidth = l.t; ctx.filter = "blur(2px)"; ctx.stroke(); ctx.filter = "none";
  });
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(cx, topY);
  ctx.arc(cx, topY, dep, Math.PI / 2 - sp, Math.PI / 2 + sp); ctx.closePath();
  ctx.strokeStyle = "rgba(0,180,255,0.3)"; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = "rgba(0,180,255,0.5)"; ctx.font = "10px monospace";
  for (var j = 1; j <= 4; j++) ctx.fillText(j * 2 + "cm", W - 48, topY + (dep / 5) * j);
}

function drawResp(ctx, f) {
  var ph = (f % 240) / 240, bv = Math.sin(ph * Math.PI * 2);
  var bX = W - 18, bY = 40, bH = 120, mY = bY + bH / 2 - bv * (bH / 2 - 6);
  ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(bX - 10, bY - 12, 26, bH + 24);
  ctx.font = "8px monospace"; ctx.fillStyle = "#888";
  ctx.fillText("INS", bX - 8, bY - 3); ctx.fillText("EXP", bX - 8, bY + bH + 10);
  ctx.strokeStyle = "#333"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(bX, bY); ctx.lineTo(bX, bY + bH); ctx.stroke();
  ctx.beginPath(); ctx.arc(bX, mY, 4, 0, Math.PI * 2);
  ctx.fillStyle = bv > 0.3 ? "#00bbff" : bv < -0.3 ? "#ff8800" : "#888"; ctx.fill();
}

function drawCross(ctx, pw, act, thresh) {
  var cx = W / 2 + 15, cy = 190, co = act ? "rgba(0,255,100,0.8)" : "rgba(0,200,255,0.6)";
  ctx.strokeStyle = co; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 50, cy); ctx.lineTo(cx - 6, cy); ctx.moveTo(cx + 6, cy); ctx.lineTo(cx + 50, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - 50); ctx.lineTo(cx, cy - 6); ctx.moveTo(cx, cy + 6); ctx.lineTo(cx, cy + 50); ctx.stroke();
  if (act && pw >= thresh) {
    var it = (pw - thresh) / (100 - thresh), cR = 18 + it * 6, cn = Math.floor(30 + it * 100);
    for (var i = 0; i < cn; i++) {
      var a = Math.random() * Math.PI * 2, ds = Math.pow(Math.random(), 0.7) * cR;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * ds, cy + Math.sin(a) * ds * 0.7, Math.random() * 2.5 + 0.8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255," + Math.min(0.3 + it * 0.5 + Math.random() * 0.2, 1) + ")"; ctx.fill();
    }
    for (var k = 0; k < cn * 0.3; k++) {
      var a2 = Math.random() * Math.PI * 2, d2 = Math.random() * cR * 0.8;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a2) * d2, cy + Math.sin(a2) * d2 * 0.7, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255," + (0.6 + it * 0.4) + ")"; ctx.fill();
    }
  }
}

function drawHVWarning(ctx, pwr) {
  var bH = 42, y = 30;
  ctx.fillStyle = "rgba(40,0,0,0.88)"; ctx.fillRect(10, y, W - 20, bH);
  ctx.strokeStyle = "#ff4444"; ctx.lineWidth = 2; ctx.strokeRect(10, y, W - 20, bH);
  ctx.fillStyle = "#ff4444"; ctx.font = "bold 12px monospace";
  ctx.fillText("\u26A0 HIGH VOLTAGE: " + pwr + "% \u2014 No cavitation", 20, y + 17);
  ctx.fillStyle = "#ffaa00"; ctx.font = "10px monospace";
  ctx.fillText("Click CONTINUE to proceed or OFF to abort", 20, y + 34);
  ctx.fillStyle = "#ff8800"; ctx.fillRect(W - 115, y + 7, 84, bH - 14);
  ctx.fillStyle = "#000"; ctx.font = "bold 10px monospace"; ctx.fillText("CONTINUE", W - 108, y + 27);
}

function drawBanner(ctx, tl, pct) {
  var bH = 36, y = H - 28 - bH - 4;
  ctx.fillStyle = "rgba(0,0,0,0.75)"; ctx.fillRect(10, y, W - 20, bH);
  ctx.strokeStyle = "#00ff66"; ctx.lineWidth = 1; ctx.strokeRect(10, y, W - 20, bH);
  ctx.fillStyle = tl <= 2 ? "#f44" : tl <= 4 ? "#fa0" : "#0bf";
  ctx.fillRect(14, y + bH - 6, (W - 28) * pct, 3);
  ctx.fillStyle = "#ff0"; ctx.font = "bold 11px monospace";
  ctx.fillText("CONFIRM SUSTAINED BUBBLE CLOUD", 20, y + 15);
  ctx.fillStyle = "#aaa"; ctx.font = "10px monospace"; ctx.fillText(tl + "s", W - 46, y + 15);
  ctx.fillStyle = "#00cc55"; ctx.fillRect(W - 100, y + 4, 70, bH - 8);
  ctx.fillStyle = "#000"; ctx.font = "bold 10px monospace"; ctx.fillText("CONFIRM", W - 94, y + 22);
}

function drawGlow(ctx, tl, pct) {
  var cx = W / 2, topY = 10, sp = Math.PI * 0.38, dep = H - 30;
  var sA = Math.PI / 2 - sp, eA = sA + pct * sp * 2;
  var co = tl <= 2 ? "#f44" : tl <= 4 ? "#fa0" : "#00ff66";
  ctx.save(); ctx.beginPath(); ctx.moveTo(cx, topY);
  ctx.arc(cx, topY, dep, sA, eA); ctx.lineTo(cx, topY); ctx.closePath();
  ctx.strokeStyle = co; ctx.lineWidth = 4; ctx.shadowColor = co; ctx.shadowBlur = 12; ctx.stroke(); ctx.restore();
  ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(W / 2 - 120, H - 65, 240, 22);
  ctx.fillStyle = "#ff0"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
  ctx.fillText("TAP IMAGE TO CONFIRM  (" + tl + "s)", W / 2, H - 49); ctx.textAlign = "left";
}

function drawFloat(ctx, tl, pct) {
  var cx = W / 2 + 15, cy = 190, bW = 110, bH = 90, r = 22, btnX = cx, btnY = cy + bH / 2 + r + 10;
  var co = tl <= 2 ? "#f44" : tl <= 4 ? "#fa0" : "#00ff66";
  ctx.strokeStyle = co; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
  ctx.strokeRect(cx - bW / 2, cy - bH / 2, bW, bH); ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(btnX, btnY, r + 4, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
  ctx.strokeStyle = co; ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.arc(btnX, btnY, r, 0, Math.PI * 2);
  ctx.fillStyle = "#00cc55"; ctx.fill(); ctx.strokeStyle = "#00ff66"; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = "#000"; ctx.font = "bold 8px monospace"; ctx.textAlign = "center";
  ctx.fillText("CONFIRM", btnX, btnY + 3); ctx.textAlign = "left";
  ctx.fillStyle = co; ctx.font = "9px monospace"; ctx.textAlign = "center";
  ctx.fillText(tl + "s", btnX, btnY + r + 14); ctx.textAlign = "left";
}

// Knob component with scroll support
function Knob({ value, onChange, onToggle, active }) {
  var knobRef = useRef(null);
  var angle = (value / 100) * 270 - 135;

  useEffect(function () {
    var el = knobRef.current;
    if (!el) return;
    function handleWheel(e) {
      e.preventDefault();
      var delta = e.deltaY > 0 ? -2 : 2;
      onChange(Math.max(0, Math.min(100, value + delta)));
    }
    el.addEventListener("wheel", handleWheel, { passive: false });
    return function () { el.removeEventListener("wheel", handleWheel); };
  }, [value, onChange]);

  var tickMarks = [];
  for (var i = 0; i <= 10; i++) {
    var ta = ((i / 10) * 270 - 135) * (Math.PI / 180);
    var r1 = 52, r2 = 60;
    tickMarks.push(
      <line key={i} x1={64 + Math.cos(ta) * r1} y1={64 + Math.sin(ta) * r1}
        x2={64 + Math.cos(ta) * r2} y2={64 + Math.sin(ta) * r2}
        stroke={i <= value / 10 && active ? "#00ff66" : "#444"}
        strokeWidth={i % 5 === 0 ? 2.5 : 1.5} strokeLinecap="round" />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg ref={knobRef} width={128} height={128}
        style={{ cursor: "pointer", touchAction: "none" }}
        onClick={function (e) {
          onToggle();
        }}>
        {tickMarks}
        <circle cx={64} cy={64} r={44} fill="#1a1a1a" stroke="#333" strokeWidth={3} />
        <circle cx={64} cy={64} r={40} fill="url(#knobGrad)" />
        <defs>
          <radialGradient id="knobGrad" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#555" />
            <stop offset="100%" stopColor="#222" />
          </radialGradient>
        </defs>
        <line x1={64} y1={64}
          x2={64 + Math.cos(angle * Math.PI / 180) * 30}
          y2={64 + Math.sin(angle * Math.PI / 180) * 30}
          stroke={active ? "#00ff66" : "#888"} strokeWidth={3} strokeLinecap="round" />
        <circle cx={64} cy={64} r={14} fill={active ? "#00cc55" : "#555"} opacity={0.9} />
        <text x={64} y={68} textAnchor="middle" fill={active ? "#000" : "#999"} fontSize={10} fontWeight="bold">
          {active ? "ON" : "OFF"}
        </text>
      </svg>
      <div style={{ color: active ? "#00ff66" : "#666", fontFamily: "monospace", fontSize: 22, fontWeight: "bold", marginTop: 4 }}>
        {value.toFixed(0)}%
      </div>
      <div style={{ color: "#555", fontFamily: "monospace", fontSize: 9, marginTop: 4 }}>
        Scroll to adjust · Click knob to toggle
      </div>
    </div>
  );
}

function useAutoThreshold(bubbleThresh, hvGate) {
  var [state, setState] = useState("idle"), [sp, setSP] = useState(0), [log, setLog] = useState([]), [ft, setFT] = useState(null);
  var sRef = useRef(null), gateRef = useRef(null);
  var btRef = useRef(bubbleThresh), hvRef = useRef(hvGate);
  btRef.current = bubbleThresh; hvRef.current = hvGate;

  var startSearch = useCallback(function () {
    setState("ramping"); setLog([]); setFT(null); setSP(0);
    var cur = 0, step = 0, rs = 5, logs = [];
    function tick() {
      cur += rs; step++;
      var hb = cur >= btRef.current;
      logs.push({ step: step, v: cur, bubble: hb, phase: "ramp", msg: "Ramp " + cur + "% \u2192 " + (hb ? "CAVITATION DETECTED" : "no cavitation") });
      setLog(logs.slice()); setSP(cur);
      if (hb) {
        var lo = cur - rs, hi = cur; setState("refining");
        function refine() {
          if (hi - lo < 1.5) {
            setSP(hi); logs.push({ step: step + 1, v: hi, bubble: true, phase: "done", msg: "ALARA threshold: " + hi + "% (minimum cavitation)" });
            setLog(logs.slice()); setFT(hi); setState("confirming"); return;
          }
          step++; var mid = Math.round((lo + hi) / 2), mb = mid >= btRef.current;
          logs.push({ step: step, v: mid, bubble: mb, phase: "refine", msg: "Refine " + mid + "% \u2192 " + (mb ? "CAVITATION" : "no cavitation") });
          setLog(logs.slice()); setSP(mid); if (mb) hi = mid; else lo = mid;
          sRef.current = setTimeout(refine, 600);
        }
        sRef.current = setTimeout(refine, 600);
      } else if (cur >= 100) {
        logs.push({ step: step + 1, v: 100, bubble: false, phase: "done", msg: "No cavitation at max" }); setLog(logs.slice()); setState("found");
      } else if (cur >= hvRef.current && !hb) {
        logs.push({ step: step, v: cur, bubble: false, phase: "gate", msg: "\u26A0 HV GATE: " + cur + "% \u2014 no cavitation. Awaiting operator." });
        setLog(logs.slice()); setState("hvgate");
        gateRef.current = function () {
          logs.push({ step: step + 1, v: cur, bubble: false, phase: "ramp", msg: "Operator approved \u2014 continuing beyond " + cur + "%" });
          setLog(logs.slice()); setState("ramping"); sRef.current = setTimeout(tick, 500);
        };
      } else { sRef.current = setTimeout(tick, 500); }
    }
    sRef.current = setTimeout(tick, 400);
  }, []);

  var continueFromGate = useCallback(function () { if (gateRef.current) { gateRef.current(); gateRef.current = null; } }, []);
  var confirmThreshold = useCallback(function () { setState("found"); }, []);
  var resetFromTimeout = useCallback(function () { setState("idle"); setSP(0); setFT(null); }, []);
  var reset = useCallback(function () {
    if (sRef.current) clearTimeout(sRef.current); gateRef.current = null;
    setState("idle"); setSP(0); setLog([]); setFT(null);
  }, []);
  useEffect(function () { return function () { if (sRef.current) clearTimeout(sRef.current); }; }, []);
  return { state: state, searchPower: sp, log: log, foundThreshold: ft, startSearch: startSearch, reset: reset, confirmThreshold: confirmThreshold, resetFromTimeout: resetFromTimeout, continueFromGate: continueFromGate };
}

export default function App() {
  var canvasRef = useRef(null), frameRef = useRef(0);
  var [power, setPower] = useState(0), [active, setActive] = useState(false), [pulseCount, setPulseCount] = useState(0);
  var [autoMode, setAutoMode] = useState(false), [showLog, setShowLog] = useState(false);
  var [confirmResult, setConfirmResult] = useState(null), [manualThreshold, setManualThreshold] = useState(null);
  var [variant, setVariant] = useState("A"), [confirmTimeLeft, setConfirmTimeLeft] = useState(CSC);
  var [manualOnTime, setManualOnTime] = useState(0);
  var [overrideNotice, setOverrideNotice] = useState(false);
  var [showConfig, setShowConfig] = useState(false);
  var [cfgThreshold, setCfgThreshold] = useState(BT);
  var [cfgHVGate, setCfgHVGate] = useState(HVG);
  var confirmTimerRef = useRef(null);
  var shutoffTimerRef = useRef(null);
  var a = useAutoThreshold(cfgThreshold, cfgHVGate);

  var displayPower = autoMode && a.state !== "idle" ? a.searchPower : power;
  var isSearching = autoMode && (a.state === "ramping" || a.state === "refining");
  var isConfirming = a.state === "confirming";
  var isHVGate = a.state === "hvgate";
  var displayThreshold = autoMode ? a.foundThreshold : manualThreshold;
  var floatingBtnY = 190 + 45 + 22 + 10;

  // Manual override: any knob change during auto mode switches to manual
  var handleKnobChange = useCallback(function (newVal) {
    if (autoMode && active) {
      // OVERRIDE: switch to manual, keep system on at current search power
      a.reset();
      if (confirmTimerRef.current) clearInterval(confirmTimerRef.current);
      setAutoMode(false);
      setConfirmResult(null);
      setPower(newVal);
      setOverrideNotice(true);
      setTimeout(function () { setOverrideNotice(false); }, 3000);
      // active stays true, now in manual mode
    } else {
      setPower(newVal);
    }
  }, [autoMode, active]);

  // Auto-shutoff timer for manual mode
  useEffect(function () {
    if (active && !autoMode) {
      setManualOnTime(0);
      shutoffTimerRef.current = setInterval(function () {
        setManualOnTime(function (t) {
          if (t + 1 >= AUTO_SHUTOFF_SEC) {
            clearInterval(shutoffTimerRef.current);
            setActive(false);
            setPulseCount(0);
            setManualThreshold(Math.round(power));
            return 0;
          }
          return t + 1;
        });
      }, 1000);
      return function () { clearInterval(shutoffTimerRef.current); };
    } else {
      setManualOnTime(0);
      if (shutoffTimerRef.current) clearInterval(shutoffTimerRef.current);
    }
  }, [active, autoMode]);

  // Confirmation timer
  useEffect(function () {
    if (!isConfirming) return;
    setConfirmTimeLeft(CSC);
    confirmTimerRef.current = setInterval(function () {
      setConfirmTimeLeft(function (t) {
        if (t <= 1) { clearInterval(confirmTimerRef.current); a.resetFromTimeout(); setActive(false); setConfirmResult("timeout"); return 0; }
        return t - 1;
      });
    }, 1000);
    return function () { clearInterval(confirmTimerRef.current); };
  }, [isConfirming]);

  var handleConfirm = useCallback(function () {
    if (!isConfirming) return;
    if (confirmTimerRef.current) clearInterval(confirmTimerRef.current);
    a.confirmThreshold(); setConfirmResult("confirmed"); setActive(false);
  }, [isConfirming]);

  var handleCanvasClick = useCallback(function (e) {
    var rect = e.target.getBoundingClientRect();
    var x = (e.clientX - rect.left) * (W / rect.width), y = (e.clientY - rect.top) * (H / rect.height);
    if (isHVGate) { if (x >= W - 115 && x <= W - 31 && y >= 37 && y <= 65) a.continueFromGate(); return; }
    if (!isConfirming) return;
    if (variant === "B") handleConfirm();
    else if (variant === "A") { if (x >= W - 100 && x <= W - 30 && y >= H - 68 && y <= H - 36) handleConfirm(); }
    else { if (Math.hypot(x - (W / 2 + 15), y - floatingBtnY) < 26) handleConfirm(); }
  }, [isConfirming, isHVGate, variant, handleConfirm, floatingBtnY]);

  var handleToggle = useCallback(function () {
    if (autoMode) {
      if (!active) { setActive(true); setConfirmResult(null); a.startSearch(); }
      else { setActive(false); a.reset(); setConfirmResult(null); if (confirmTimerRef.current) clearInterval(confirmTimerRef.current); }
    } else {
      setActive(function (v) {
        if (v) { setPulseCount(0); setManualThreshold(Math.round(power)); }
        return !v;
      });
    }
  }, [autoMode, active, power]);

  var handleModeSwitch = useCallback(function (isAuto) {
    setAutoMode(isAuto); setActive(false); setPulseCount(0);
    a.reset(); setConfirmResult(null); setManualThreshold(null); setOverrideNotice(false);
  }, []);

  // Render loop
  useEffect(function () {
    var canvas = canvasRef.current, ctx = canvas.getContext("2d"), raf;
    function draw() {
      frameRef.current++;
      drawUS(ctx, frameRef.current); drawCross(ctx, displayPower, active, cfgThreshold); drawResp(ctx, frameRef.current);
      if (isHVGate) drawHVWarning(ctx, a.searchPower);
      if (isConfirming) {
        var pct = confirmTimeLeft / CSC;
        if (variant === "A") drawBanner(ctx, confirmTimeLeft, pct);
        else if (variant === "B") drawGlow(ctx, confirmTimeLeft, pct);
        else drawFloat(ctx, confirmTimeLeft, pct);
      }
      // HUD top
      ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(0, 0, W, 28);
      ctx.font = "bold 12px monospace"; ctx.fillStyle = "#0bf";
      ctx.fillText("HISTOTRIPSY SIM  v3", 10, 18);
      ctx.fillStyle = isHVGate ? "#f44" : isConfirming ? "#ff0" : active ? "#0f6" : "#f44";
      ctx.fillText(isHVGate ? "\u26A0 HV GATE" : isConfirming ? "\u25C9 CONFIRM" : isSearching ? "\u25C9 SEARCHING" : active ? "\u25CF ACTIVE" : "\u25CB STANDBY", W - 130, 18);
      // HUD bottom
      ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(0, H - 28, W, 28);
      ctx.fillStyle = "#0bf"; ctx.font = "11px monospace";
      ctx.fillText("PWR: " + displayPower.toFixed(0) + "%  |  PULSES: " + pulseCount + "  |  MODE: " + (autoMode ? "AUTO" : "MANUAL"), 10, H - 10);
      raf = requestAnimationFrame(draw);
    }
    draw(); return function () { cancelAnimationFrame(raf); };
  }, [displayPower, active, pulseCount, autoMode, isSearching, isConfirming, isHVGate, variant, confirmTimeLeft, a.searchPower, cfgThreshold]);

  // Pulse counter
  useEffect(function () {
    if (!active || isSearching || isConfirming || isHVGate) return;
    var iv = setInterval(function () { setPulseCount(function (c) { return c + Math.ceil(displayPower / 20); }); }, 200);
    return function () { clearInterval(iv); };
  }, [active, displayPower, isSearching, isConfirming, isHVGate]);

  var manualTimeRemaining = AUTO_SHUTOFF_SEC - manualOnTime;

  return (
    <div style={{ background: "#111", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, gap: 12 }}>
      {/* Variant selector */}
      <div style={{ display: "flex", gap: 6, width: 360 }}>
        {[["A: Banner", "A"], ["B: Border Glow", "B"], ["C: Floating Btn", "C"]].map(function (v) {
          return <button key={v[1]} onClick={function () { setVariant(v[1]); }} style={{ flex: 1, padding: "6px 0", fontFamily: "monospace", fontSize: 10, fontWeight: "bold", border: "1px solid " + (variant === v[1] ? "#ff0" : "#333"), borderRadius: 4, cursor: "pointer", background: variant === v[1] ? "#2a2a00" : "#111", color: variant === v[1] ? "#ff0" : "#666" }}>{v[0]}</button>;
        })}
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} width={W} height={H} onClick={handleCanvasClick}
        style={{ borderRadius: 8, border: "2px solid #333", maxWidth: "100%", cursor: (isConfirming || isHVGate) ? "pointer" : "default" }} />

      {/* Mode selector */}
      <div style={{ display: "flex", gap: 8, width: 280 }}>
        {[["MANUAL", false], ["AUTO THRESHOLD", true]].map(function (m) {
          return <button key={m[0]} onClick={function () { handleModeSwitch(m[1]); }} style={{ flex: 1, padding: "8px 0", fontFamily: "monospace", fontSize: 12, fontWeight: "bold", border: "1px solid #444", borderRadius: 6, cursor: "pointer", background: autoMode === m[1] ? (m[1] ? "#003322" : "#002244") : "#1a1a1a", color: autoMode === m[1] ? (m[1] ? "#00ff66" : "#0bf") : "#666", borderColor: autoMode === m[1] ? (m[1] ? "#00ff66" : "#0bf") : "#444" }}>{m[0]}</button>;
        })}
      </div>

      {/* Control panel */}
      <div style={{ background: "#1a1a1a", padding: "16px 20px", borderRadius: 12, border: "1px solid #333", width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
        <div style={{ color: "#888", fontFamily: "monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: 2, textAlign: "center" }}>
          {autoMode ? "Start / Stop" : "Power Control"}
        </div>

        {/* Knob */}
        <Knob value={autoMode && a.state !== "idle" ? a.searchPower : power} onChange={handleKnobChange} onToggle={handleToggle} active={active} />

        {/* Parameter chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: "#666", background: "#111", borderRadius: 6, padding: "4px 10px" }}>
            Thresh: <span style={{ color: displayThreshold ? "#0f6" : "#555" }}>{displayThreshold ? displayThreshold + "%" : "\u2014"}</span>
          </div>
          {active && !autoMode && (
            <div style={{ fontFamily: "monospace", fontSize: 11, color: "#666", background: "#111", borderRadius: 6, padding: "4px 10px" }}>
              Auto-off: <span style={{ color: manualTimeRemaining <= 10 ? "#f44" : manualTimeRemaining <= 20 ? "#fa0" : "#0bf" }}>{manualTimeRemaining}s</span>
            </div>
          )}
        </div>

        {/* Config toggle */}
        <button onClick={function () { setShowConfig(function (s) { return !s; }); }} style={{
          alignSelf: "center", padding: "4px 14px", fontFamily: "monospace", fontSize: 10,
          fontWeight: "bold", border: "1px solid #444", borderRadius: 4, cursor: "pointer",
          background: showConfig ? "#1a1a2a" : "#111", color: showConfig ? "#0bf" : "#666",
          borderColor: showConfig ? "#0bf" : "#444"
        }}>{showConfig ? "HIDE CONFIG" : "\u2699 CONFIG"}</button>

        {/* Config panel */}
        {showConfig && (
          <div style={{ background: "#111", border: "1px solid #444", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
            <div style={{ color: "#888", fontFamily: "monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, textAlign: "center" }}>Simulator Configuration</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#888", width: 120 }}>Cavitation Thresh:</span>
              <input type="range" min={5} max={100} step={5} value={cfgThreshold}
                onChange={function (e) { setCfgThreshold(Number(e.target.value)); }}
                disabled={active}
                style={{ flex: 1, height: 6, appearance: "none", WebkitAppearance: "none", background: "linear-gradient(to right, #0f6 0%, #0f6 " + cfgThreshold + "%, #333 " + cfgThreshold + "%, #333 100%)", borderRadius: 3, outline: "none", cursor: active ? "not-allowed" : "pointer" }} />
              <span style={{ fontFamily: "monospace", fontSize: 12, color: "#0f6", width: 40, textAlign: "right" }}>{cfgThreshold}%</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#888", width: 120 }}>HV Gate:</span>
              <input type="range" min={10} max={100} step={5} value={cfgHVGate}
                onChange={function (e) { setCfgHVGate(Number(e.target.value)); }}
                disabled={active}
                style={{ flex: 1, height: 6, appearance: "none", WebkitAppearance: "none", background: "linear-gradient(to right, #f80 0%, #f80 " + cfgHVGate + "%, #333 " + cfgHVGate + "%, #333 100%)", borderRadius: 3, outline: "none", cursor: active ? "not-allowed" : "pointer" }} />
              <span style={{ fontFamily: "monospace", fontSize: 12, color: "#f80", width: 40, textAlign: "right" }}>{cfgHVGate}%</span>
            </div>
            {cfgThreshold > cfgHVGate && (
              <div style={{ fontFamily: "monospace", fontSize: 10, color: "#ff0", textAlign: "center" }}>
                {"\u26A0"} Threshold ({cfgThreshold}%) is above HV Gate ({cfgHVGate}%) — HV warning will trigger before cavitation.
              </div>
            )}
            {active && (
              <div style={{ fontFamily: "monospace", fontSize: 10, color: "#f44", textAlign: "center" }}>
                Turn voltage OFF to change configuration.
              </div>
            )}
          </div>
        )}

        {/* Override notice */}
        {overrideNotice && (
          <div style={{ background: "#1a1a00", border: "1px solid #ff0", borderRadius: 8, padding: 10, fontFamily: "monospace", fontSize: 11, color: "#ff0", textAlign: "center" }}>
            Manual override — switched to manual mode. Knob input detected.
          </div>
        )}

        {/* HV gate warning */}
        {autoMode && isHVGate && (
          <div style={{ background: "#2a0a0a", border: "2px solid #f44", borderRadius: 8, padding: 12, fontFamily: "monospace", fontSize: 12, color: "#f44", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 6 }}>{"\u26A0"} HIGH VOLTAGE WARNING</div>
            <div>Power at {a.searchPower}% with no cavitation detected.</div>
            <div style={{ color: "#aaa", marginTop: 4 }}>Click CONTINUE on image or press OFF to abort.</div>
          </div>
        )}

        {/* Results */}
        {autoMode && confirmResult === "confirmed" && a.state === "found" && (
          <div style={{ background: "#0a2a0a", border: "1px solid #00ff66", borderRadius: 8, padding: 12, fontFamily: "monospace", fontSize: 12, color: "#00ff66", textAlign: "center" }}>
            Threshold confirmed at {a.foundThreshold}% — sustained bubble cloud verified
          </div>
        )}
        {autoMode && confirmResult === "timeout" && (
          <div style={{ background: "#2a0a0a", border: "1px solid #f44", borderRadius: 8, padding: 12, fontFamily: "monospace", fontSize: 12, color: "#f44", textAlign: "center" }}>
            Confirmation timed out — threshold not verified. Press ON to retry.
          </div>
        )}

        {/* Console */}
        {autoMode && a.log.length > 0 && (
          <div style={{ width: "100%" }}>
            <button onClick={function () { setShowLog(function (s) { return !s; }); }} style={{ display: "block", margin: "0 auto", padding: "6px 16px", fontFamily: "monospace", fontSize: 11, fontWeight: "bold", border: "1px solid #444", borderRadius: 6, cursor: "pointer", background: showLog ? "#1a2a1a" : "#1a1a1a", color: showLog ? "#0f6" : "#888", borderColor: showLog ? "#0f6" : "#444" }}>{showLog ? "HIDE CONSOLE" : "CONSOLE"}</button>
            {showLog && (
              <div style={{ maxHeight: 130, overflowY: "auto", background: "#111", borderRadius: 8, padding: 10, border: "1px solid #333", marginTop: 8 }}>
                <div style={{ color: "#888", fontFamily: "monospace", fontSize: 10, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>ALARA Search Log</div>
                {a.log.map(function (e, i) {
                  var icon = e.phase === "ramp" ? "\u2191" : e.phase === "refine" ? "\u27F7" : e.phase === "gate" ? "\u26A0" : "\u2713";
                  var clr = e.phase === "gate" ? "#f44" : e.phase === "done" ? "#ff0" : e.bubble ? "#0f6" : "#f88";
                  return <div key={i} style={{ fontFamily: "monospace", fontSize: 11, color: clr, padding: "2px 0" }}>[{e.step}] {icon} {e.msg}</div>;
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
