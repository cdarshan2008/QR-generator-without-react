import React, {useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import QRCode from 'qrcode';
import './styles.css';

const presets = {
  Classic:{fg:'#111827',bg:'#ffffff',level:'M',margin:4,size:320},
  Midnight:{fg:'#ffffff',bg:'#0b1020',level:'H',margin:5,size:320},
  Ocean:{fg:'#075985',bg:'#ecfeff',level:'Q',margin:4,size:320},
  Sunset:{fg:'#9a3412',bg:'#fff7ed',level:'Q',margin:4,size:320},
  Forest:{fg:'#166534',bg:'#f0fdf4',level:'H',margin:5,size:320}
};
const empty={url:'',text:'',email:'',subject:'',body:'',phone:'',ssid:'',password:'',security:'WPA',hidden:false};

function App(){
 const [type,setType]=useState('URL'); const [data,setData]=useState(empty);
 const [settings,setSettings]=useState({size:320,fg:'#111827',bg:'#ffffff',level:'M',margin:4});
 const [preset,setPreset]=useState('Classic'); const [error,setError]=useState(''); const [qr,setQr]=useState('');
 const [recent,setRecent]=useState(()=>JSON.parse(localStorage.getItem('qr-recent')||'[]')); const canvas=useRef(null);
 const value=useMemo(()=>buildValue(type,data),[type,data]);
 const warning=useMemo(()=>{
   if(settings.fg.toLowerCase()===settings.bg.toLowerCase()) return 'Foreground and background colors are identical.';
   if(contrast(settings.fg,settings.bg)<2.5) return 'Low contrast may make this QR code difficult to scan.';
   if(settings.size<180) return 'Small QR codes can be harder to scan on phones.';
   if(settings.margin<2) return 'Very small margins reduce scan reliability.';
   return '';
 },[settings]);
 useEffect(()=>{let cancelled=false; setError(''); if(!value){setQr('');return;} try{QRCode.toDataURL(value,{width:settings.size,margin:settings.margin,errorCorrectionLevel:settings.level,color:{dark:settings.fg,light:settings.bg}}).then(u=>{if(!cancelled)setQr(u)}).catch(e=>!cancelled&&setError(e.message));}catch(e){setError(e.message)} return()=>{cancelled=true}},[value,settings]);
 useEffect(()=>{if(qr&&canvas.current){const img=new Image();img.onload=()=>{const c=canvas.current;c.width=settings.size;c.height=settings.size;c.getContext('2d').drawImage(img,0,0)};img.src=qr}},[qr,settings.size]);
 function update(k,v){setData(d=>({...d,[k]:v}))}
 function applyPreset(name){setPreset(name);setSettings(p=>({...p,...presets[name]}))}
 function saveRecent(){if(!value||error)return; const item={id:Date.now(),type,value,settings,data,label:labelFor(type,data)}; const next=[item,...recent.filter(x=>x.value!==value)].slice(0,8);setRecent(next);localStorage.setItem('qr-recent',JSON.stringify(next))}
 function loadRecent(item){setType(item.type);setData(item.data);setSettings(item.settings);setPreset('Custom')}
 function download(){if(!qr)return;const a=document.createElement('a');a.href=qr;a.download=`qr-${type.toLowerCase()}.png`;a.click();saveRecent()}
 function copy(){if(!value)return;navigator.clipboard?.writeText(value);saveRecent()}
 return <div className="app">
  <header className="topbar"><div className="brand"><div className="brandmark">⌗</div><div><strong>QR Code Studio</strong><span>Generate. Customize. Share.</span></div></div><div className="header-pill">100% browser-based</div></header>
  <main className="layout">
   <section className="panel builder">
    <div className="section-head"><div><p className="eyebrow">CREATE</p><h1>Design your QR code</h1></div><button className="ghost" onClick={()=>{setData(empty);setType('URL');setSettings(presets.Classic);setPreset('Classic')}}>Reset</button></div>
    <div className="type-grid">{['URL','Text','Email','Phone','Wi-Fi'].map(t=><button key={t} className={'type '+(type===t?'active':'')} onClick={()=>{setType(t);setError('')}}><span>{icon(t)}</span>{t}</button>)}</div>
    <div className="fields">{fields(type,data,update)}</div>
    <div className="divider"/>
    <div className="section-title"><span>Appearance</span><small>Live preview</small></div>
    <div className="preset-row">{Object.keys(presets).map(n=><button key={n} className={'preset '+(preset===n?'selected':'')} onClick={()=>applyPreset(n)}>{n}</button>)}</div>
    <div className="control-grid">
      <label>Size <output>{settings.size}px</output><input type="range" min="180" max="640" step="10" value={settings.size} onChange={e=>{setPreset('Custom');setSettings(s=>({...s,size:+e.target.value}))}}/></label>
      <label>Margin <output>{settings.margin}</output><input type="range" min="0" max="12" value={settings.margin} onChange={e=>{setPreset('Custom');setSettings(s=>({...s,margin:+e.target.value}))}}/></label>
      <label>Foreground <output>{settings.fg}</output><input type="color" value={settings.fg} onChange={e=>{setPreset('Custom');setSettings(s=>({...s,fg:e.target.value}))}}/></label>
      <label>Background <output>{settings.bg}</output><input type="color" value={settings.bg} onChange={e=>{setPreset('Custom');setSettings(s=>({...s,bg:e.target.value}))}}/></label>
    </div>
    <label className="level">Error correction<select value={settings.level} onChange={e=>{setPreset('Custom');setSettings(s=>({...s,level:e.target.value}))}}><option value="L">L — 7%</option><option value="M">M — 15%</option><option value="Q">Q — 25%</option><option value="H">H — 30%</option></select></label>
    {warning&&<div className="warning">⚠ {warning}</div>}{error&&<div className="error">{error}</div>}
   </section>
   <aside className="panel preview-panel">
    <div className="section-head"><div><p className="eyebrow">PREVIEW</p><h2>Your QR code</h2></div><span className="live-dot">● Live</span></div>
    <div className="qr-stage">{qr?<img src={qr} alt="Generated QR code"/>:<div className="empty-qr"><div>⌗</div><span>Enter information to preview</span></div>}</div>
    <div className="value-preview">{value||'Your encoded content will appear here.'}</div>
    <div className="actions"><button className="primary" disabled={!qr||!!warning} onClick={download}>↓ Download PNG</button><button className="secondary" disabled={!value} onClick={copy}>Copy data</button><button className="secondary" disabled={!value} onClick={saveRecent}>Save</button></div>
    <div className="reliability"><span>✓</span><div><strong>Scan reliability</strong><p>{warning?'Review the warning above before sharing.':'Your current settings are optimized for reliable scanning.'}</p></div></div>
   </aside>
  </main>
  <section className="panel recent"><div className="section-head"><div><p className="eyebrow">HISTORY</p><h2>Recent QR codes</h2></div><span className="count">{recent.length}/8</span></div>{recent.length===0?<div className="empty-history">Saved QR codes will stay here after you refresh the page.</div>:<div className="recent-list">{recent.map(item=><button className="recent-item" key={item.id} onClick={()=>loadRecent(item)}><img src={item.value?itemPreview(item):''}/><span><strong>{item.label}</strong><small>{item.type} · {new Date(item.id).toLocaleString()}</small></span><b>›</b></button>)}</div>}</section>
  <footer>QR Code Studio · React + QRCode.js · Local storage only · No backend required</footer>
 </div>
}
function fields(type,d,u){if(type==='URL')return <Field label="Website URL" placeholder="https://example.com" value={d.url} onChange={v=>u('url',v)}/>;if(type==='Text')return <label>Plain text<textarea placeholder="Type anything you want to encode…" value={d.text} onChange={e=>u('text',e.target.value)}/></label>;if(type==='Email')return <><Field label="Email address" placeholder="hello@example.com" value={d.email} onChange={v=>u('email',v)}/><div className="two"><Field label="Subject" placeholder="Hello!" value={d.subject} onChange={v=>u('subject',v)}/><Field label="Message" placeholder="Your message" value={d.body} onChange={v=>u('body',v)}/></div></>;if(type==='Phone')return <Field label="Phone number" placeholder="+91 98765 43210" value={d.phone} onChange={v=>u('phone',v)}/>;return <><Field label="Network name (SSID)" placeholder="My Wi-Fi" value={d.ssid} onChange={v=>u('ssid',v)}/><div className="two"><Field label="Password" placeholder="Password" value={d.password} onChange={v=>u('password',v)}/><label>Security<select value={d.security} onChange={e=>u('security',e.target.value)}><option>WPA</option><option>WEP</option><option>nopass</option></select></label></div><label className="check"><input type="checkbox" checked={d.hidden} onChange={e=>u('hidden',e.target.checked)}/> Hidden network</label></>}
function Field({label,placeholder,value,onChange}){return <label>{label}<input value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/></label>}
function buildValue(t,d){if(t==='URL')return validUrl(d.url)?d.url.trim():'';if(t==='Text')return d.text.trim();if(t==='Email')return d.email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)?`mailto:${d.email}?subject=${encodeURIComponent(d.subject)}&body=${encodeURIComponent(d.body)}`:'';if(t==='Phone')return d.phone.trim()?`tel:${d.phone.trim()}`:'';if(t==='Wi-Fi')return d.ssid.trim()?`WIFI:T:${d.security};S:${esc(d.ssid)};P:${esc(d.password)};H:${d.hidden?'true':'false'};;`:''}
function validUrl(x){if(!x.trim())return false;try{const u=new URL(x);return ['http:','https:'].includes(u.protocol)}catch{return false}}
function esc(x){return x.replace(/([\\;,:])/g,'\\$1')}
function labelFor(t,d){return t==='URL'?d.url||'Website':t==='Text'?d.text.slice(0,30)||'Text':t==='Email'?d.email||'Email':t==='Phone'?d.phone||'Phone':d.ssid||'Wi-Fi'}
function itemPreview(item){return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44"><rect width="44" height="44" fill="${item.settings.bg}"/><path d="M4 4h12v12H4zM28 4h12v12H28zM4 28h12v12H4zM22 22h4v4h-4zM30 24h4v4h-4zM22 32h12v4H22z" fill="${item.settings.fg}"/></svg>`)}
function icon(t){return {URL:'↗',Text:'T',Email:'@',Phone:'☎','Wi-Fi':'⌁'}[t]}
function luminance(hex){const c=hex.slice(1).match(/.{2}/g).map(x=>parseInt(x,16)/255).map(x=>x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2]}
function contrast(a,b){const l1=luminance(a),l2=luminance(b);return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05)}
createRoot(document.getElementById('root')).render(<App/>);
