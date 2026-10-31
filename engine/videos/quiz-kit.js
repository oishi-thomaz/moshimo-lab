import * as THREE from 'three';
import { clamp, easeBack, mat } from '../lib.js';
import { setTop, textSprite } from '../story.js';

// タイトル当てクイズ（映画・ドラマ紹介アカウント）の共通部品。エンジン本体は触らず、動画ファイルから使う
// 構成：0〜49秒 設定を3Dで見せる → 49〜56秒 クイズ（3・2・1）→ 56〜64秒 答えのカード（声だけで答えを読む）

// 撮影用の基本セット（背景・空の光・太陽・床・赤いスポット）
export function quizStage({ bg = '#1a2130', floor = '#20283a', fogNear = 22, fogFar = 70 } = {}) {
  const scene = new THREE.Scene();
  const BG = new THREE.Color(bg);
  scene.background = BG.clone();
  scene.fog = new THREE.Fog(BG.getHex(), fogNear, fogFar);
  const hemi = new THREE.HemisphereLight(0xdfe8ff, 0x2a2418, 1.25); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff0dc, 1.5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 70 }); scene.add(key); scene.add(key.target);
  const spot = new THREE.SpotLight(0xff3b2e, 0, 16, 0.42, 0.5, 1.2); spot.castShadow = true; scene.add(spot); scene.add(spot.target);
  let fl = null;
  if (floor) { fl = new THREE.Mesh(new THREE.PlaneGeometry(400, 120), mat(floor)); fl.rotation.x = -Math.PI / 2; fl.position.x = 90; fl.receiveShadow = true; scene.add(fl); }
  const base = { hemi: 1.25, key: 1.5 };
  function reset() { scene.background.copy(BG); scene.fog.color.copy(BG); hemi.intensity = base.hemi; key.intensity = base.key; spot.intensity = 0; }
  function aim(cx, cz = 0) { key.position.set(cx + 6, 12, cz + 8); key.target.position.set(cx, 0, cz); }
  function darken(k, to = '#06070a') { scene.background.copy(BG).lerp(new THREE.Color(to), k); scene.fog.color.copy(scene.background); }
  return { scene, BG, hemi, key, spot, floor: fl, base, reset, aim, darken };
}

// 文字の札（3D空間に置く。ポンと出す用の pop(k) つき）
export function tag(text, opt = {}) {
  const w = opt.w || Math.max(260, 70 + text.length * 86), h = opt.h || 150;
  const sp = textSprite(text, { size: opt.size || 80, w, h, sx: opt.sx || w / 270, bg: opt.bg || 'rgba(10,12,18,.86)', color: opt.color || '#ffffff', depthTest: false });
  sp.renderOrder = 8;
  const v = sp.scale.clone();
  sp.userData.pop = (k) => { const s = easeBack(clamp(k)); sp.visible = k > 0; sp.scale.set(v.x * s, v.y * s, 1); };
  sp.visible = false;
  return sp;
}

// 49〜56秒のクイズ：3秒後から 3・2・1・？（setTop は字幕のすぐ下に出る）
export function countdown(t, start = 3.0) {
  const c = t - start;
  if (c >= 0 && c < 3) setTop('答えはこのあと', String(3 - Math.floor(c)), 1, '#e6b450');
  else if (c >= 3) setTop('答えはこのあと', '？', clamp((c - 3) / 0.2), '#e6b450');
}

// ロゴとまとめカード（答え）をこのアカウント用に差し替える。runStory のあとに呼ぶ
export function applyQuizCards({ answer, info, answerSize = 128 }) {
  const nm = document.querySelector('#logo .nm'); if (nm) nm.textContent = 'タイトル当てクイズ';
  const mk = document.querySelector('#logo .mk'); if (mk) mk.style.display = 'none';
  const end = document.getElementById('end');
  end.querySelector('.t').innerHTML = `<span style="display:block;font-size:44px;letter-spacing:14px;color:#cfd6df;margin-bottom:26px">答え</span><span style="color:#e6b450;font-size:${answerSize}px;line-height:1.15">${answer}</span>`;
  end.querySelector('.s').innerHTML = `<span style="display:inline-block;padding:10px 34px;border:3px solid rgba(255,255,255,.5);border-radius:999px;font-size:40px;font-weight:900;color:#fff">${info}</span>`;
  const ask = end.querySelector('.ask'); ask.innerHTML = '何秒でわかった？<br>どこでわかった？<small>コメントで教えて。観た人は感想も聞かせて</small>'; ask.style.color = '#e6b450';
  end.querySelector('.nx').innerHTML = 'まだ観てない人は<small>保存して今夜観て</small>';
  end.querySelector('.lg').innerHTML = '<div style="font-family:\'M PLUS Rounded 1c\',sans-serif;font-size:46px;font-weight:800;letter-spacing:6px">タイトル当てクイズ</div><div style="font-size:24px;letter-spacing:6px;color:#8a94a3;margin-top:10px">フォローして次の問題を待ってて</div>';
  end.querySelector('.src').innerHTML = '作品の映像・画像は使っていません';
}
