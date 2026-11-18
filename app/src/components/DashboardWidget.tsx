import React from 'react';
import { css, pseudo, cx } from '../dc';
import './DashboardWidget.css';

export interface DashboardWidgetProps {
  w?: any;
  size?: 'L' | 'M' | 'S' | string;
  variant?: 'card' | 'ledger' | string;
  dims?: any; // {w:number,h:number}
  badge?: boolean;
  alarm?: 'none' | 'warning' | 'danger' | string;
  compact?: any;
  tempGauge?: string;
  ventLayout?: string;
  onOpen?: () => void;
  onOpenPress?: () => void;
  onAction?: (k: string) => void;
  style?: React.CSSProperties | string;
}

// style-hover / style-active classes
const hRoot = pseudo('hover', 'background:var(--color-accent-100)');
const hBright = pseudo('hover', 'filter:brightness(.95)');
const aBright = pseudo('active', 'filter:brightness(.88)');
const hBtn = pseudo('hover', 'background:var(--color-accent-100);border-color:var(--color-accent-700)');
const aBtn = pseudo('active', 'background:var(--color-accent-200)');

function rand(seed){let s=seed;return()=>{s=(s*9301+49297)%233280;return s/233280;};}
const BAND=['','var(--color-accent-200)','var(--color-accent-500)','#f2bdb4'];
function Odo(p: any){
  const e: any=React.createElement, s=String(p.text), fs=p.size, H=1.18;
  const digits=[...s].filter(c=>/\d/.test(c)).length; let di=0;
  return e('span',{style:{display:'inline-flex',alignItems:'center',gap:2,fontFamily:'var(--font-heading)',fontSize:fs,fontWeight:600,lineHeight:1,fontVariantNumeric:'tabular-nums'}},
    [...s].map((c,i)=>{
      if(!/\d/.test(c)) return e('span',{key:i,style:{width:'.18em',textAlign:'center',color:'var(--color-neutral-700)'}},c);
      const last=++di===digits, n=+c;
      return e('span',{key:i,style:{position:'relative',display:'inline-block',width:'.68em',height:H+'em',overflow:'hidden',borderRadius:2,
          background:last?'var(--color-accent-100)':'#fff',boxShadow:'inset 0 0 0 1px var(--color-neutral-400)'}},
        e('span',{style:{position:'absolute',left:0,right:0,top:0,display:'flex',flexDirection:'column',transform:`translateY(-${n*H}em)`,transition:'transform .7s cubic-bezier(.3,.7,.2,1)'}},
          [0,1,2,3,4,5,6,7,8,9].map(d=>e('span',{key:d,style:{height:H+'em',lineHeight:H+'em',textAlign:'center',color:'var(--color-text)'}},d))),
        e('span',{style:{position:'absolute',inset:0,pointerEvents:'none',background:'linear-gradient(rgba(0,0,0,.12),rgba(0,0,0,0) 28%,rgba(0,0,0,0) 72%,rgba(0,0,0,.12))'}}));
    }));
}

const FAN_BLADE = 'M10.827 16.379a6.082 6.082 0 0 1-8.618-7.002l5.412 1.45a6.082 6.082 0 0 1 7.002-8.618l-1.45 5.412a6.082 6.082 0 0 1 8.618 7.002l-5.412-1.45a6.082 6.082 0 0 1-7.002 8.618l1.45-5.412Z';
const EQ_COOL = 'M12 2v20M4 6.5l16 11M20 6.5l-16 11M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5';
const EQ_HEAT = 'M12 22c4 0 7-2.8 7-6.8 0-3.4-2.3-5.6-3.6-7.6-.6 1.6-1.6 2.6-2.6 3C13 7 11.6 4.4 9.4 2c.2 3.4-1.6 5.6-3 7.4C5.3 11 5 12.6 5 15.2 5 19.2 8 22 12 22Z';
const EQ_FOG = 'M7 14c0 2.2-1.3 4-3 4s-3-1.8-3-4 3-6 3-6 3 3.8 3 6ZM23 14c0 2.2-1.3 4-3 4s-3-1.8-3-4 3-6 3-6 3 3.8 3 6ZM15 8c0 2.2-1.3 4-3 4S9 10.2 9 8s3-6 3-6 3 3.8 3 6ZM12 16v2M12 21v1M8 20l-1 1M16 20l1 1';

export default class DashboardWidget extends React.Component<DashboardWidgetProps, any> {
  static defaultProps = { size: 'M', variant: 'card', alarm: 'none', badge: false };
  state: any={trim:0,cOn:true,cLeft:10};
  box=React.createRef<HTMLDivElement>();
  rowsRef=React.createRef<HTMLDivElement>();
  otick: any; tick: any; ro: any; maxTrim: any; _pst: any; _osz: any;
  key(p){const d=p.dims||{};return [p.size,p.variant,p.ventLayout,Math.round(d.w||0),Math.round(d.h||0),p.w&&p.w.id].join('|');}
  componentDidMount(){
    if(this.props.w&&this.props.w.pair) this.otick=setInterval(()=>this.setState(s=>{const o=s.odo||[0,0];return {odo:[o[0]+2+Math.floor(Math.random()*5),o[1]+(Math.random()<.6?1+Math.floor(Math.random()*2):0)]};}),2200);
    this.fit(); if(this.props.w&&this.props.w.vent) this.startTick();
    if(window.ResizeObserver){this.ro=new ResizeObserver(()=>this.fit());this.box.current&&this.ro.observe(this.box.current);}
    document.fonts&&document.fonts.ready.then(()=>this.fit());}
  componentWillUnmount(){clearInterval(this.otick);this.ro&&this.ro.disconnect();clearInterval(this.tick);}
  startTick(){ if(this.tick) return; this.tick=setInterval(()=>{const v=this.props.w&&this.props.w.vent;if(!v)return;
    this.setState(s=>(s.cLeft??10)>1?{cLeft:(s.cLeft??10)-1}:{cOn:!s.cOn,cLeft:10});},1000); }
  spCalc(P,L): any{
    const sp: any=(()=>{const fr=x=>Math.max(0,Math.min(1,(x-P.min)/(P.max-P.min))), off=Math.abs(P.v-P.target)>P.band;
      const pt=(f,r)=>{const a=Math.PI*(1-f);return [100+r*Math.cos(a),100-r*Math.sin(a)];};
      const arc=(f1,f2)=>{if(f2<=f1)return '';const p=pt(f1,84),q=pt(f2,84);return `M${p[0].toFixed(1)} ${p[1].toFixed(1)} A84 84 0 0 1 ${q[0].toFixed(1)} ${q[1].toFixed(1)}`;};
      const t1=pt(fr(P.target),70),t2=pt(fr(P.target),100),n=pt(fr(P.v),70), dh=(this.props.dims||{}).h||400, w=dh<320?72:L?120:96; void w;
      return {val:P.v,target:P.target,band:P.band,low:P.low,high:P.high,
        track:arc(0,1),lowZ:arc(0,fr(P.low)),highZ:arc(fr(P.high),1),okZ:arc(fr(P.target-P.band),fr(P.target+P.band)),
        tx1:t1[0].toFixed(1),ty1:t1[1].toFixed(1),tx2:t2[0].toFixed(1),ty2:t2[1].toFixed(1),
        nx:n[0].toFixed(1),ny:n[1].toFixed(1),nbx:pt(fr(P.v),30)[0].toFixed(1),nby:pt(fr(P.v),30)[1].toFixed(1),nc:off?'#b3261e':'var(--color-text)',
        box:{position:'relative',height:'100%',maxHeight:180,maxWidth:'calc(100% - 130px)',aspectRatio:'200 / 124',minWidth:0,flex:'0 1 auto'},
        valS:{position:'absolute',left:0,right:0,bottom:0,textAlign:'center',fontFamily:'var(--font-heading)',fontSize:dh<320?16:L?26:20,fontWeight:600,lineHeight:1,fontVariantNumeric:'tabular-nums',color:off?'#b3261e':'var(--color-text)',width:'fit-content',margin:'0 auto',padding:'0 4px'}};})();

    sp.box={position:'relative',height:'100%',maxHeight:L?140:110,maxWidth:'60%',aspectRatio:'200 / 124',flex:'0 1 auto',minWidth:0,minHeight:0,alignSelf:'stretch',padding:'2px 0 4px',boxSizing:'border-box'};
    return sp;
  }
  pressVals(P,L,dm): any{
    const off=Math.abs(P.v-P.target)>P.band, st=dm.w<340; void st;
    return {showPress:true,sp:this.spCalc(P,L),pr:{val:P.v,target:P.target,band:P.band,
      wrap:{flex:'1 1 0',minHeight:0,overflow:'visible',display:'flex',flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},
      valS:{fontFamily:'var(--font-heading)',fontSize:L?64:44,fontWeight:700,lineHeight:.9,fontVariantNumeric:'tabular-nums',color:off?'#b3261e':'var(--color-text)'},
      unitS:{fontFamily:'var(--font-heading)',fontSize:L?32:22,fontWeight:700,textTransform:'uppercase'},
      tgtS:{fontFamily:'var(--font-heading)',fontSize:L?30:20,lineHeight:1.1,color:'var(--color-text)',whiteSpace:'nowrap'}}};
  }
  ventVals(v,L,M): any{
    void M;
    if(!v) return {showVent:false};
    const dh0=(this.props.dims||{}).h||400, s=this.state, N=18, yt=x=>85*(1-x/100), cx=v.cur/N*100, wh=dh0<320?28:L?56:34, tier=14;
    const clip={position:'absolute',left:0,right:0,top:tier,bottom:0,clipPath:'polygon(0 85%, 100% 0, 100% 100%, 0 100%)'};
    const mk=(lvl,t,right?)=>{const x=lvl/N*100;return {t,
      tick:{position:'absolute',left:`calc(${x}% - ${right?2:1}px)`,top:tier-2,bottom:0,width:2,background:'var(--color-text)',zIndex:2},
      lab:{position:'absolute',left:x+'%',top:0,transform:right?'translateX(-100%)':'translateX(-50%)',fontSize:10,lineHeight:'12px',fontWeight:600,whiteSpace:'nowrap',color:'var(--color-text)'}};};
    const cl=Math.min(10,s.cLeft??10), on=s.cOn, dur=10, mm=Math.floor(cl/60), ss=String(cl%60).padStart(2,'0');
    const dw0=(this.props.dims||{}).w||300, lay0=this.props.ventLayout||'row', lay=lay0==='stack'&&dh0<dw0?'row':lay0; void lay;
    const sz=L?26:20, nar=dw0<300;
    const fans=v.fans.map(([type,k,a,tot])=>{const active=on&&a>0;
      return {k,n:a+' / '+tot,tf:type==='stir'?'translate(12 13.5) scale(.78) translate(-12 -12)':'translate(12 12) scale(.7) translate(-12 -12)',
        svg:{width:sz,height:sz,flex:'none',color:active?'var(--color-accent-700)':'var(--color-neutral-400)'},
        hSide:{display:type==='side'?'inline':'none'},hTun:{display:type==='tunnel'?'inline':'none'},hStir:{display:type==='stir'?'inline':'none'},
        spin:{transformBox:'fill-box',transformOrigin:'center',animation:active?`vfan ${(1.6-a/tot).toFixed(2)}s linear infinite`:'none'}};});
    const P=v.sp, sp: any=null;
    const bt='1px solid var(--color-divider)', grid3={display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))'}, colC={display:'flex',flexDirection:'column',alignItems:'center'}; void grid3;
    const vl: any={
        panel:{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap',padding:'6px 16px',background:'var(--color-neutral-200)',flex:'1 1 0',minHeight:0,maxHeight:84,boxSizing:'border-box'},
        pLab:{fontSize:11,fontWeight:600,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--color-neutral-700)',whiteSpace:'nowrap',minWidth:72},
        panelNw:{display:'flex',alignItems:'center',gap:16,padding:'6px 16px',background:'var(--color-neutral-200)',flex:'1.5 1 0',minHeight:0,maxHeight:126,boxSizing:'border-box',overflow:'hidden'},
        inlRow:{display:'flex',alignItems:'center',justifyContent:'space-around',gap:16,flex:'1 1 auto',flexWrap:'wrap',minWidth:0},
        main:{display:'flex',flexDirection:nar?'column':'row',gap:12,flex:'1 1 0',minHeight:0},
        leftCol:{display:'flex',flexDirection:'column',gap:8,flex:'1.5 1 0',minWidth:0,minHeight:0,justifyContent:'space-between'},
        fanHead:{display:'flex',alignItems:'center',gap:16,padding:'6px 16px',background:'var(--color-neutral-200)',flex:'1 1 0',minHeight:0,maxHeight:84,minWidth:0,boxSizing:'border-box',overflow:'hidden'},
        fanRow:{display:'flex',alignItems:'center',justifyContent:'space-around',gap:16,flex:'1 1 auto',flexWrap:'wrap',minWidth:0},
        fanItem:{...colC,gap:3,minWidth:0},fanTxt:{...colC,lineHeight:1.15},
        cyc:{gridColumn:'1 / -1',order:-1,display:'flex',flexDirection:'column',gap:4},
        sp:{...colC,justifyContent:'center',gap:4,flex:'1 1 0',minWidth:0,minHeight:0,overflow:'hidden',...(nar?{borderTop:bt,paddingTop:8}:{borderLeft:bt,paddingLeft:12})},
        spLab:{...colC,gap:1,flex:'none',textAlign:'center'}};
    if(sp) sp.box={position:'relative',width:'100%',maxWidth:L?200:150,aspectRatio:'200 / 124',flex:'0 1 auto',minHeight:0};
    const eq: any[]=(v.equip||[]).map(([t,k,on])=>({k,st:on?'On':'Off',
      box:{display:'flex',alignItems:'center',gap:6,padding:'5px 9px',flex:'1 1 0',minWidth:0,justifyContent:'center',border:'1px solid '+(on?'var(--color-accent-500)':'var(--color-neutral-300)'),background:on?'var(--color-accent-100)':'transparent',color:on?'var(--color-accent-900)':'var(--color-neutral-500)'},
      stS:{fontSize:10,fontWeight:600,letterSpacing:'.06em',textTransform:'uppercase',color:on?'var(--color-accent-800)':'var(--color-neutral-500)'},
      iCool:{display:t==='cool'?'inline':'none'},iHeat:{display:t==='heat'?'inline':'none'},iFog:{display:t==='fog'?'inline':'none'}}));
    eq.forEach((e,i)=>{e.mini={flex:'none',color:v.equip[i][2]?'var(--color-accent-700)':'var(--color-neutral-400)'};e.boxF={...e.box,flex:'none',flexDirection:'column',justifyContent:'center',gap:4,padding:'6px 4px',height:'100%',boxSizing:'border-box'};e.boxV={...e.box,flex:'none',flexDirection:'column',gap:2,padding:'5px 8px',minWidth:58}});
    const oy=tier+wh*yt(cx)/100;
    const SS=this.props.size==='S'||!!this.props.compact;
    const iClosed=!!v.inletsClosed, src: any[]=[...(v.inlets||[]).slice(0,2).map(([k,items],gi)=>[k,gi?'r':'l',items]),['Tunnel','t',v.tunInlets||[[0],[0]]]];
    const inl=src.map(([k,type,items])=>{const tot=items.length,open=iClosed?0:items.filter(([x])=>x>0).length,bad=!iClosed&&items.some(([,b])=>b),act=open>0;
      return {k,n:open+' / '+tot,
        svg:{width:sz,height:sz,flex:'none',transform:type==='r'?'scaleX(-1)':'none',color:bad?'#b3261e':act?'var(--color-accent-700)':'var(--color-neutral-400)'},
        hSide:{display:type==='t'?'none':'inline'},hTun:{display:type==='t'?'inline':'none'},air:{opacity:act?1:0,transition:'opacity .3s'},
        nS:{fontSize:13,fontWeight:600,fontVariantNumeric:'tabular-nums',whiteSpace:'nowrap',color:bad?'#b3261e':iClosed?'var(--color-neutral-500)':'var(--color-text)'}};});
    const inS: any={state:iClosed?'Inlets closed':'Inlets open',labS:{fontSize:11,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',whiteSpace:'nowrap',flex:'none',color:iClosed?'var(--color-neutral-500)':'var(--color-accent-700)'}};
    const vp: any=P?this.spCalc(P,L):{};
    const cp=()=>({display:'flex',flexDirection:'column',alignItems:'stretch',gap:4,padding:'6px 8px',background:'var(--color-neutral-200)',flex:'1 1 0',minWidth:0,minHeight:0,boxSizing:'border-box',overflow:'hidden'});
    if(P){if(Math.abs(P.v-P.target)>P.band) vl.panelNw={...vl.panelNw,background:'#fbe1de',boxShadow:'inset 0 0 0 1px #f2bdb4'};
    vp.box={height:'100%',maxHeight:80,aspectRatio:'200 / 110',flex:'none',minHeight:0,padding:'4px 0',boxSizing:'border-box'};const off=Math.abs(P.v-P.target)>P.band;vp.valS={fontFamily:'var(--font-heading)',fontSize:L?32:26,fontWeight:700,lineHeight:1,fontVariantNumeric:'tabular-nums',color:off?'#b3261e':'var(--color-text)'};}
    if(SS){vl.lower={display:'flex',flexDirection:'row',gap:6,flex:'1 1 0',minHeight:0};
      const red=P&&Math.abs(P.v-P.target)>P.band;
      vl.fanHead=cp();vl.panel=cp();vl.panelNw={...cp(),...(red?{background:'#fbe1de',boxShadow:'inset 0 0 0 1px #f2bdb4'}:{})};
      vl.pLab={...vl.pLab,minWidth:0,fontSize:10};
      vl.fanList={display:'flex',alignItems:'center',justifyContent:'space-between',gap:4,flex:'1 1 0',minHeight:0,width:'100%'};
      vl.fanItem={display:'flex',flexDirection:'column',alignItems:'center',gap:2,minWidth:0};
      vl.fanK={display:'none'};
      vl.inlRow={display:'flex',flexDirection:'column',alignItems:'flex-start',justifyContent:'center',gap:2,flex:'1 1 0',minWidth:0};
      vl.prIn={display:'flex',alignItems:'center',justifyContent:'space-between',gap:6,flex:'1 1 0',minWidth:0,minHeight:0};
      vl.prT={fontSize:9,whiteSpace:'nowrap',color:'var(--color-neutral-700)'};
      if(P){vp.box={height:30,width:54,flex:'none'};vp.valS={...vp.valS,fontSize:20};}
      inS.labS={...inS.labS,fontSize:10};
      vl.inlRow={...vl.inlRow,gap:3};
      vl.panelNw.flex='1.25 1 0';
    } else {vl.lower={display:'flex',flexDirection:'column',gap:8,flex:'1 1 0',minHeight:0};
      vl.fanList={display:'flex',alignItems:'center',justifyContent:'space-around',gap:12,minWidth:0,width:'100%',flex:1};
      vl.fanItem={display:'flex',alignItems:'center',gap:5,minWidth:0};
      vl.fanK={fontSize:11,color:'var(--color-neutral-700)'};
      vl.prIn={display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flex:'1 1 0',minWidth:0,alignSelf:'stretch',minHeight:0};
      vl.prT={fontSize:13,whiteSpace:'nowrap'};}
    const dk=(v.driver||'None'),dc=dk==='Heating'?'#b3261e':dk==='Cooling'?'var(--color-accent-700)':'var(--color-neutral-800)',dsz=SS?22:L?30:26;
    const drv={on:dk!=='None',t:dk,heat:dk==='Heating',cool:dk==='Cooling',txt:['CO2','NH3','RH'].includes(dk),
      lab:dk==='CO2'?'CO':dk==='NH3'?'NH':'RH',sub:dk==='CO2'?'2':dk==='NH3'?'3':'',
      box:{width:dsz,height:dsz,flex:'none',boxSizing:'border-box',display:'flex',alignItems:'center',justifyContent:'center',border:'1.5px solid '+dc,color:dc,background:dk==='Heating'?'#fbe1de':dk==='Cooling'?'var(--color-accent-100)':'var(--color-neutral-200)'},
      ic:{width:dsz*.62,height:dsz*.62,display:'block'},
      tS:{fontFamily:'var(--font-heading)',fontWeight:700,fontSize:SS?10:12,lineHeight:1,letterSpacing:'-.01em',whiteSpace:'nowrap'}};
    return {showVent:true,drv,inS,hasVp:!!P,vp,hasCfm:!!v.cfm,fans,vl,inl,hasInl:inl.length>0,hasEq:eq.length>0&&!SS,showEqMini:SS&&eq.length>0,hasEqHead:false,
      outTick:{position:'absolute',left:`calc(${cx}% - 1px)`,top:oy-6,bottom:0,width:2,background:'var(--color-text)',zIndex:3},
      outTag:{position:'absolute',left:cx+'%',top:oy-6,transform:'translate(-50%,-100%)',padding:'1px 5px',fontFamily:'var(--font-heading)',fontSize:L?15:13,fontWeight:600,lineHeight:1.2,background:'var(--color-text)',color:'var(--color-bg)',whiteSpace:'nowrap',zIndex:4,fontVariantNumeric:'tabular-nums'},eq,hasSP:!!P,sp:sp||{},
      vBox:{position:'relative',height:tier+wh},
      wBase:{...clip,background:'var(--color-accent-200)'},
      wOpt:{...clip,clipPath:`polygon(${v.min/N*100}% ${yt(v.min/N*100)}%, ${v.max/N*100}% ${yt(v.max/N*100)}%, ${v.max/N*100}% 100%, ${v.min/N*100}% 100%)`,background:'var(--color-accent-500)',opacity:.45},
      wFill:{...clip,clipPath:`polygon(0 85%, ${cx}% ${yt(cx)}%, ${cx}% 100%, 0 100%)`,background:'linear-gradient(90deg,var(--color-accent-100),var(--color-accent-700))'},
      wGrid:{...clip,background:'linear-gradient(90deg,transparent calc(33.333% - 1.5px),var(--color-bg) 0 calc(33.333% + 1.5px),transparent 0 calc(66.666% - 1.5px),var(--color-bg) 0 calc(66.666% + 1.5px),transparent 0),linear-gradient(90deg,transparent calc(100% - 1px),var(--color-bg) 0) 0 0/calc(100% / 18) 100%'},
      vMarks:[mk(v.min,'Min '+v.minL),mk(v.max,'Max '+v.maxL,v.max===N)],
      vGroups:([['Basic',0],['Power',6],['Tunnel',12]] as any[]).map(([t,a])=>{const act=v.cur>a&&v.cur<=a+6;return {t,style:{borderTop:'3px solid var(--color-accent-800)',paddingTop:4,fontSize:13,lineHeight:'15px',fontWeight:act?700:500,color:'var(--color-accent-900)',whiteSpace:'nowrap'}};}),
      lvlHandle:{position:'absolute',left:`calc(${((v.cur-.5)/N*100).toFixed(2)}% - 1px)`,top:-10,transform:'translateX(-50%)',width:12,height:22,boxSizing:'border-box',border:'1.5px solid var(--color-text)',borderRadius:2,background:'var(--color-bg)',boxShadow:'0 1px 3px rgba(0,0,0,.25)',zIndex:3,display:'flex',alignItems:'center',justifyContent:'center',transition:'left .4s ease'},
      segBox:{position:'relative',display:'flex',gap:4,height:dh0<320?28:L?48:36,marginTop:4},
      segs:Array.from({length:N},(_,i)=>({flex:'1 1 0',minWidth:0,position:'relative',zIndex:1,alignSelf:'flex-end',height:(30+70*(i+1)/N).toFixed(1)+'%',background:i===v.cur-1?'var(--color-accent-700)':'var(--color-neutral-300)'})),
      segRange:(()=>{const re=13;return {position:'absolute',left:`calc(${v.min/N*100}% - 3px)`,width:`calc(${(re-v.min)/N*100}% + 2px)`,top:-4,bottom:-13,background:'var(--color-accent-200)',pointerEvents:'none'};})(),
      cfmS:{fontFamily:'var(--font-heading)',fontSize:L?(dh0<320?20:26):18,fontWeight:500,color:'var(--color-neutral-800)',lineHeight:1.05,fontVariantNumeric:'tabular-nums'},
      cyc:{state:on?'Fans on':'Fans off',time:mm+':'+ss,cd:cl+'s',
        cdS:{fontFamily:'var(--font-heading)',fontSize:SS?13:15,fontWeight:600,lineHeight:1,minWidth:SS?20:24,fontVariantNumeric:'tabular-nums',color:on?'var(--color-accent-900)':'var(--color-neutral-700)'},
        barT:{width:SS?16:28,height:3,background:'var(--color-neutral-300)',position:'relative',overflow:'hidden'},
        barF:{position:'absolute',left:0,top:0,bottom:0,width:(cl/10*100)+'%',background:on?'var(--color-accent-700)':'var(--color-neutral-500)',transition:'width 1s linear'},
        labS:{fontSize:11,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',whiteSpace:'nowrap',color:on?'var(--color-accent-700)':'var(--color-neutral-500)',transition:'color .2s'},
        tagS:{fontSize:10,fontWeight:600,letterSpacing:'.06em',textTransform:'uppercase',padding:'2px 6px',background:on?'var(--color-accent)':'var(--color-neutral-200)',color:on?'#fff':'var(--color-neutral-600)'},
        timeS:{fontFamily:'var(--font-heading)',fontSize:L?22:18,fontWeight:600,lineHeight:1,fontVariantNumeric:'tabular-nums',color:on?'var(--color-accent-800)':'var(--color-neutral-500)'},
        bar:{position:'absolute',left:0,top:0,bottom:0,width:(s.cLeft/dur*100)+'%',background:on?'var(--color-accent)':'var(--color-neutral-400)'}}};
  }
  componentDidUpdate(pp){ if(this.key(pp)!==this.key(this.props)&&this.state.trim!==0){this.setState({trim:0});return;} this.fit(); }
  fit(){const el=this.box.current;if(!el)return;const r=this.rowsRef.current;
    const over=el.scrollHeight>el.clientHeight+1||(r&&r.scrollHeight>r.clientHeight+1);
    if(over&&this.state.trim<this.maxTrim) this.setState(s=>({trim:s.trim+1}));}
  thermoVals(g,L,dm): any{
    const span=g.max-g.min, pc=v=>Math.max(0,Math.min(100,(v-g.min)/span*100)), bulb=L?20:16, tubeW=L?11:9, nums=dm.w>=280&&this.props.size!=='S';
    const sorted=[...g.sets].sort((a,b)=>a[0]-b[0]);
    const lab=(v,k,main,side)=>({text:nums?k+' '+v:k,lab:{position:'absolute',bottom:`calc(${pc(v)}% + ${bulb-4}px)`,[side==='l'?'right':'left']:4,transform:'translateY(50%)',fontSize:L?11:10,lineHeight:1,whiteSpace:'nowrap',fontWeight:main?700:500,color:main?'var(--color-accent-900)':'var(--color-neutral-700)',fontVariantNumeric:'tabular-nums'} as any});
    const L_: any[]=[],R_: any[]=[];
    sorted.forEach(([v,k,main],i)=>(i%2?L_:R_).push(lab(v,k,main,i%2?'l':'r')));
    R_.push({text:'Now '+g.val,lab:{...lab(g.val,'',1,'r').lab,display:'none'}});
    return {thermo:true,hasSets:false,noSets:false,thLeft:L_,thRight:R_.filter(x=>x.lab.display!=='none'),
      thBox:{flex:'none',width:dm.w<360?(nums?96:78):nums?(L?124:106):(L?100:84),height:'100%',display:'flex',alignItems:'stretch',gap:0,borderLeft:'1px solid var(--color-divider)',paddingLeft:6,boxSizing:'border-box'},
      thTube:{position:'relative',flex:1,width:tubeW,boxSizing:'border-box',border:'1.5px solid var(--color-text)',borderBottom:'none',borderRadius:`${tubeW}px ${tubeW}px 0 0`,background:'var(--color-bg)',overflow:'visible',marginBottom:-4,zIndex:1},
      thBands:g.bands.map(b=>({style:{height:((b[1]-b[0])/span*100)+'%',background:BAND[b[2]],borderTop:'1px solid var(--color-bg)'}})),
      thFill:{position:'absolute',left:'50%',transform:'translateX(-50%)',bottom:-2,width:tubeW/2-1,height:`calc(${pc(g.val)}% + 2px)`,background:'var(--color-accent-800)',borderRadius:`${tubeW}px ${tubeW}px 0 0`},
      thSets:sorted.map(([v,k,main],i)=>{void k;return {tick:{position:'absolute',bottom:pc(v)+'%',[i%2?'right':'left']:'50%',width:tubeW/2+(main?7:5),height:main?2:1,background:main?'var(--color-accent-900)':'var(--color-neutral-700)',zIndex:2}};}),
      thBulb:{width:bulb,height:bulb,borderRadius:'50%',boxSizing:'border-box',border:'1.5px solid var(--color-text)',background:'var(--color-accent-800)',boxShadow:'inset 0 0 0 3px var(--color-bg)',flex:'none'}};
  }
  setsVals(g,on,L,dm): any{
    if(!on) return {hasSets:false,noSets:true,thermo:false};
    if((this.props.tempGauge??'Thermometer')==='Thermometer') return this.thermoVals(g,L,dm);
    const span=g.max-g.min, pc=v=>(v-g.min)/span*100, tierH=L?15:13, trackTop=tierH*2+4, trackH=L?16:12, nums=L||dm.w>=320;
    const sorted=[...g.sets].sort((a,b)=>a[0]-b[0]);
    const sets=sorted.map(([v,k,main],i)=>{const tier=i%2, top=tier*tierH, x=pc(v);
      return {k,n:String(v),showNum:nums,
        tick:{position:'absolute',left:`calc(${x}% - ${main?1:0.5}px)`,top:top+tierH-2,height:trackTop+trackH-(top+tierH-2),width:main?2:1,background:main?'var(--color-accent-900)':'var(--color-neutral-700)',zIndex:2},
        lab:{position:'absolute',left:x+'%',top,transform:'translateX(-50%)',fontSize:L?11:10,lineHeight:(tierH-2)+'px',whiteSpace:'nowrap',fontWeight:main?700:500,color:main?'var(--color-accent-900)':'var(--color-neutral-700)'},
        num:{position:'absolute',left:x+'%',top:trackTop+trackH+3,transform:'translateX(-50%)',fontSize:10,lineHeight:'12px',color:'var(--color-neutral-700)',fontVariantNumeric:'tabular-nums'}};});
    const nx=pc(g.val);
    return {hasSets:true,noSets:false,sets,
      setsBox:{position:'relative',height:trackTop+trackH+(nums?16:2),flex:'none'},
      setsTrack:{position:'absolute',left:0,right:0,top:trackTop,height:trackH,display:'flex'},
      nowMark:{position:'absolute',left:`calc(${nx}% - 6px)`,top:trackTop-3,width:12,height:trackH+6,boxSizing:'border-box',border:'3px solid var(--color-text)',background:'var(--color-bg)',zIndex:3}};
  }
  renderVals(): any{
    const p: any=this.props, w=p.w||{title:'',value:'',unit:'',note:'',rows:[]}, size=p.size||'M', led=p.variant==='ledger', dm=p.dims||{w:300,h:240};
    const SS=size==='S', L=size==='L', M=size==='M'||SS, S=false;
    const dl=(!!w.dials||!!w.lines)&&!S, ln=!!w.lines&&!S;
    const t=this.state.trim, nRows=S||dl||(!S&&(w.bars||[]).some(b=>b[3]))?0:(w.rows||[]).length, extra=t-nRows;
    const hasSets=!!(w.gauge&&w.gauge.sets);
    const siloV=!S&&(w.bars||[]).some(b=>b[3]), siloM=false, tight=dm.h<200;
    const thermoOn=hasSets&&(this.props.tempGauge??'Thermometer')==='Thermometer';
    const showGauge=!thermoOn&&!w.vent&&!dl&&!!w.gauge&&!S&&!(led&&M&&!hasSets)&&extra<5;
    const showNote=extra<6;
    const showToday=led&&!!w.today&&!S&&!(dl&&M)&&extra<1;
    const showSpark=!!w.spark&&L&&extra<2;
    const gLabOK=extra<3;
    const showBars=!!w.bars&&(!S||dm.h>=120)&&(extra<4||siloV);
    const isSilo=w.id==='silo';
    const showAlert=false;
    const aK=w.id==='birds'?'mort':w.id==='light'?'svc':null;
    const svc=aK==='svc'&&!!this.state.svc;
    const act={on:!!aK,t:aK==='mort'?'Mortality update':svc?'Normal lighting':'Service lights',plus:{display:aK==='mort'?'inline':'none'},wrench:{display:aK==='svc'&&!svc?'inline':'none'},undo:{display:svc?'inline':'none'},
      click:e=>{e.stopPropagation();if(aK==='svc'){this.setState(s=>({svc:!s.svc}));return;}const h=this.props.onAction;h&&h(aK as string);},
      s:{marginTop:'auto',flex:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:6,width:'100%',boxSizing:'border-box',height:SS?36:44,padding:'0 12px',
        border:'1px solid var(--color-accent-500)',borderRadius:0,background:'transparent',color:'var(--color-accent-800)',cursor:'pointer',
        fontFamily:'var(--font-heading)',fontSize:SS?14:16,fontWeight:600,letterSpacing:'.04em',textTransform:'uppercase'}};
    this.maxTrim=nRows+6;
    const cols=(L&&dm.w>=460)||(SS&&w.id==='birds')?2:1;
    const cap=Math.max(0,nRows-t);
    const rows=(w.rows||[]).slice(0,cap).map(r=>({k:r[0],v:r[1],
      style:{display:'flex',justifyContent:'space-between',gap:8,fontSize:L?13:12,borderTop:'1px solid var(--color-divider)',padding:'4px 0',minWidth:0},
      vStyle:{whiteSpace:'nowrap',fontVariantNumeric:'tabular-nums',fontWeight:r[2]?600:led?600:400,color:r[2]?'#b3261e':'var(--color-text)'}}));
    const st=w.status;
    const g=w.gauge; let bands=[],marker={},gLabels=[];
    if(g){const span=g.max-g.min;
      bands=g.bands.map(b=>({style:{width:((b[1]-b[0])/span*100)+'%',height:'100%',background:BAND[b[2]],borderRight:'1px solid var(--color-bg)'}}));
      marker={position:'absolute',left:`calc(${(g.val-g.min)/span*100}% - 1.5px)`,top:-5,bottom:-5,width:3,background:'var(--color-text)'};
      gLabels=hasSets?[]:(g.labels||[]).map(([v,t])=>({text:t,style:{position:'absolute',left:((v-g.min)/span*100)+'%',transform:v===g.min?'none':'translateX(-50%)',whiteSpace:'nowrap'}}));}
    const bars=(w.bars||[]).map(([label,pct,al,type,tons,days])=>{const err=pct<0;
      const sv=!S&&!!type, typeOK=extra<1&&!tight;
      return {label,showLabel:!S,showPct:L||sv,pctText:err?'—':tons!=null?tons+' t':pct+'%',
        hasType:sv&&typeOK,type:type||'',typeStyle:{fontSize:9,letterSpacing:'.04em',textTransform:'uppercase',padding:'0 4px',border:'1px solid var(--color-neutral-400)',color:'var(--color-neutral-800)',whiteSpace:'nowrap'},
        daysText:days!=null?days+' days':err?'No reading':type?'':'',trackH:{position:'relative',height:10,border:'1px solid '+(al||err?'#b3261e':'var(--color-neutral-400)')},
        fillH:err?{position:'absolute',inset:0,background:'repeating-linear-gradient(45deg,transparent 0 3px,#e8a39b 3px 4px)'}:{position:'absolute',left:0,top:0,bottom:0,width:pct+'%',background:al?'#b3261e':'var(--color-accent-300)'},
        daysStyle:{fontSize:10,textAlign:'right',fontWeight:days!=null&&days<=7||err?600:400,color:days!=null&&days<=7||err?'#b3261e':'var(--color-neutral-700)',whiteSpace:'nowrap'},
        pctStyle:sv?{fontFamily:'var(--font-heading)',fontSize:L?(tight?18:24):(tight?15:19),lineHeight:1,whiteSpace:'nowrap',textAlign:'center',fontVariantNumeric:'tabular-nums',fontWeight:600,flex:'none',color:al||err?'#b3261e':'var(--color-text)'}:{fontSize:10,textAlign:'center',fontVariantNumeric:'tabular-nums',fontWeight:al?600:400,color:al||err?'#b3261e':'var(--color-text)'},
        track:{flex:1,position:'relative',border:(sv?'1.5px':'1px')+' solid '+(al||err?'#b3261e':sv?'var(--color-neutral-700)':'var(--color-neutral-400)'),minHeight:sv?(tight?28:56):8,overflow:'hidden',...(sv?{borderRadius:'14px 14px 3px 3px',width:'70%',maxWidth:46,alignSelf:'center'}:{})},
        fill:err?{position:'absolute',inset:0,background:'repeating-linear-gradient(45deg,transparent 0 3px,#e8a39b 3px 4px)'}:{position:'absolute',left:0,right:0,bottom:0,height:pct+'%',background:al?'#b3261e':'var(--color-accent-300)'}};});
    const r=rand((w.id||'x').length*31+7);
    const spark=Array.from({length:24},(_,i)=>`${(i/23*400).toFixed(1)},${Math.max(6,Math.min(94,50-Math.sin(i/23*Math.PI*2)*20-(r()-.5)*22)).toFixed(1)}`).join(' ');
    const P=f=>{const a=Math.PI*(1-Math.max(0,Math.min(1,f)));return [100+84*Math.cos(a),100-84*Math.sin(a)];};
    const arc=(f1,f2)=>{if(f2<=f1)return '';const a=P(f1),b=P(f2);return `M${a[0].toFixed(1)} ${a[1].toFixed(1)} A84 84 0 0 1 ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;};
    const row=dm.w>=dm.h*1.15;
    const dials=(w.dials||[]).map(x=>{const fr=v=>(v-x.min)/(x.max-x.min),hf=fr(x.high),ha=Math.PI*(1-hf);
      return {label:x.label,txt:x.txt,track:arc(0,1),zone:arc(fr(x.zone[0]),fr(x.zone[1])),val:arc(0,fr(x.v)),
        color:x.v>=x.high||x.st==='alert'?'#b3261e':'var(--color-text)',danger:arc(fr(x.high),1),
        ...(()=>{const f=Math.max(0,Math.min(1,fr(x.v))),a=Math.PI*(1-f);return {nx1:(100+56*Math.cos(a)).toFixed(1),ny1:(100-56*Math.sin(a)).toFixed(1),nx2:(100+96*Math.cos(a)).toFixed(1),ny2:(100-96*Math.sin(a)).toFixed(1)};})(),
        hx1:(100+70*Math.cos(ha)).toFixed(1),hy1:(100-70*Math.sin(ha)).toFixed(1),hx2:(100+98*Math.cos(ha)).toFixed(1),hy2:(100-98*Math.sin(ha)).toFixed(1)};});
    const sNote=led&&w.today?w.today.map(t=>t[0]+' '+t[1]).slice(0,2).join(' · '):w.note;
    return {
      hasPair:!!w.pair,showPairSub:!SS&&extra<1,showRatio:!SS&&!!w.ratio&&extra<2,
      pairValS:{fontFamily:'var(--font-heading)',fontSize:L?44:S?22:30,fontWeight:600,lineHeight:1,fontVariantNumeric:'tabular-nums',whiteSpace:'nowrap'},
      ...(()=>{const st=!!w.pair&&(dm.w<400||dm.h>dm.w*.85);this._pst=st;
        const colW=st?dm.w-28:(dm.w-42)/2, rowH=st?(dm.h-70)/2:dm.h-70;
        this._osz=Math.max(16,Math.round(Math.min(L?40:S?20:28,(colW-(st?110:28))/3.2,rowH*(st?.5:.32))));
        return {pairGrid:{flex:'1 1 auto',minHeight:0,display:'grid',gridTemplateColumns:st?'minmax(0,1fr)':'repeat(2,minmax(0,1fr))',gridTemplateRows:st?'repeat(2,minmax(0,1fr))':'auto',gap:st?0:14}};})(),
      pair:(w.pair||[]).map((q,i)=>({...q,delta:SS?String(q.delta).replace(/\s*vs yesterday/,''):q.delta,odo:React.createElement(Odo,{size:this._osz||28,text:(parseInt(String(q.value).replace(/,/g,''))+((this.state.odo||[0,0])[i]||0)).toLocaleString('en-US')}),colStyle:this._pst?{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,minWidth:0,minHeight:0,...(i?{borderTop:'1px solid var(--color-divider)'}:{})}:{display:'flex',flexDirection:'column',gap:3,minWidth:0,...(i?{borderLeft:'1px solid var(--color-divider)',paddingLeft:14}:{})},
        metaStyle:this._pst?{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:2,minWidth:0,textAlign:'right'}:{display:'flex',flexDirection:'column',gap:3,minWidth:0},
        dStyle:{fontSize:S?10:11,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',color:'var(--color-neutral-700)'}})),
      openPress:e=>{e.stopPropagation();const h=p.onOpenPress||p.onOpen;h&&h();},box:this.box,showNote,w,size,badge:!!p.badge,onOpen:p.onOpen,isL:L&&!dl,isM:M&&!dl,isS:S,
      showDials:dl&&!ln,showLines:ln,
      lines:(w.lines||[]).map(([k,on,pct])=>({k,p:on?pct+'%':'Off',
        pStyle:{fontSize:L?14:12,width:34,flex:'none',textAlign:'right',fontVariantNumeric:'tabular-nums',fontWeight:on?600:400,color:on?'var(--color-text)':'var(--color-neutral-600)'},
        lamps:Array.from({length:L?14:SS?8:10},()=>({style:{flex:1,height:L?14:SS?8:10,boxSizing:'border-box',
          border:'1px solid '+(on?'var(--color-accent-500)':'var(--color-neutral-400)'),
          background:on?`color-mix(in srgb,var(--color-accent) ${Math.round(15+pct*.85)}%,var(--color-bg))`:'transparent',
          boxShadow:on?`0 0 ${Math.round(pct/12)}px color-mix(in srgb,var(--color-accent) ${pct}%,transparent)`:'none'}}))})),big:dials[0]||{},smalls:dials.slice(1),
      dialWrap:{flex:'1 1 0',minHeight:L?130:SS?56:90,display:'flex',flexDirection:row?'row':'column',gap:10},
      smallCol:{flex:'1 1 0',minWidth:0,minHeight:0,display:'flex',flexDirection:row?'column':'row',gap:8},sNote,
      showTag:false,showDot:false,...(()=>{const a=p.alarm||'none',fill=a==='danger'?'#b3261e':a==='warning'?'#f2c230':'transparent',bd=a==='danger'?'#b3261e':a==='warning'?'#c99a00':'var(--color-neutral-500)';
        return {isDanger:a==='danger',alarmLabel:a==='danger'?'Alarm':a==='warning'?'Warning':'No alarm',alarmDot:{width:SS?11:13,height:SS?11:13,borderRadius:'50%',boxSizing:'border-box',flex:'none',border:'1.5px solid '+bd,background:fill,boxShadow:a==='danger'?'0 0 0 3px #f6dedd':a==='warning'?'0 0 0 3px #fbefc6':'none',transition:'background .2s, box-shadow .2s'}};})(),
      tagClass:st==='alert'?'tag':st==='watch'?'tag tag-outline':'tag tag-neutral',
      tagStyle:st==='alert'?{background:'#b3261e',color:'#fff',whiteSpace:'nowrap'}:{whiteSpace:'nowrap'},
      dotStyle:{width:9,height:9,borderRadius:'50%',flex:'none',background:st==='alert'?'#b3261e':st==='watch'?'var(--color-accent)':'var(--color-neutral-300)'},
      ...this.setsVals(g,hasSets,L,dm),
      showThermo:thermoOn&&!S,
      ...(S?{showVent:false}:this.ventVals(w.vent,L,M)),
      ...(w.press?this.pressVals(w.press,L,dm):{showPress:false}),
      showGauge,showGaugeLabels:L&&gLabOK&&!!(g&&g.labels),gaugeTrack:{position:'relative',height:L?14:10,display:'flex'},bands,marker,gLabels,
      showBars:showBars&&!siloM,bars,showSiloRows:siloM,siloRows:bars.slice(0,Math.max(1,bars.length-Math.max(0,extra))).map(b=>({...b,typeStyle:{...b.typeStyle,textAlign:'center',overflow:'hidden'}})),barsBox:w.id==='inlets'?{display:'grid',gridTemplateColumns:'repeat(6,minmax(0,1fr))',gridTemplateRows:'repeat(2,minmax(0,1fr))',columnGap:SS?3:4,rowGap:SS?4:8,...(L?{flex:1,minHeight:140,maxHeight:240}:SS?{flex:'1 1 0',minHeight:40}:{height:112,flex:'none'})}:siloV?{flex:'1 1 auto',minHeight:Math.max(60,Math.min(L?130:110,dm.h-80)),display:'flex',gap:6,alignItems:'stretch'}:L?{flex:1,minHeight:110,maxHeight:200,display:'flex',gap:4,alignItems:'stretch'}:{height:S?16:56,display:'flex',gap:S?2:4,alignItems:'stretch',flex:'none'},
      showSpark,spark,act,svcOn:svc,
      rootS:{position:'relative',boxSizing:'border-box',width:'100%',height:'100%',display:'flex',flexDirection:'column',padding:14,cursor:'pointer',overflow:'hidden',minWidth:0,background:'var(--color-bg)',color:'var(--color-text)',transition:'background .3s, color .3s',
        ...(svc?{'--color-bg':'#1d1f20','--color-text':'#eef0f1','--color-divider':'#3a3e41','--color-neutral-200':'#2a2d2f','--color-neutral-300':'#3a3e41','--color-neutral-400':'#555a5e','--color-neutral-500':'#7d8286','--color-neutral-600':'#9aa0a4','--color-neutral-700':'#b5babd','--color-neutral-800':'#d0d3d5','--color-accent-100':'#26323e','--color-accent-200':'#2e4256','--color-accent-700':'#a3c0dc','--color-accent-800':'#bfd4e8','--color-accent-900':'#dce8f3',background:'#1d1f20',color:'#eef0f1'}:{})},
      hasRows:rows.length>0&&!siloV,rows,rowsRef:this.rowsRef,rowsGrid:{flex:'1 1 auto',minHeight:0,overflow:'hidden',alignContent:'start',display:'grid',gridTemplateColumns:`repeat(${cols},minmax(0,1fr))`,columnGap:18},
      showToday,today:(w.today||[]).map(t=>({k:t[0],v:t[1]})),
      hasVentHead:false,vhValS:{fontFamily:'var(--font-heading)',fontSize:L?(dm.h<320?40:56):SS?28:36,fontWeight:600,lineHeight:.95,fontVariantNumeric:'tabular-nums'},vhOutS:{fontFamily:'var(--font-heading)',fontSize:L?(dm.h<320?28:36):SS?20:26,fontWeight:600,lineHeight:1,fontVariantNumeric:'tabular-nums'},
      showValue:!isSilo&&!w.pair&&!(w.vent&&!S)&&!w.press,showNoteM:showNote&&!isSilo&&!w.vent&&!w.pair&&!w.press,bigValS:{fontFamily:'var(--font-heading)',fontSize:w.vent&&dm.h<320?40:60,fontWeight:600,lineHeight:.95,fontVariantNumeric:'tabular-nums'},mValS:{fontFamily:'var(--font-heading)',fontSize:SS?28:38,fontWeight:600,lineHeight:1,fontVariantNumeric:'tabular-nums'},showAlert,alertStyle:{marginTop:'auto',flex:'none',padding:'7px 10px',fontSize:12,lineHeight:1.35,background:st==='alert'?'#fdecea':'var(--color-accent-100)',color:st==='alert'?'#8c1d18':'var(--color-accent-900)'}
    };
  }

  renderVentHead(v: any) {
    // Shared markup for the (currently disabled, hasVentHead:false) vent header used in L and M blocks.
    return v.hasVentHead ? (
      <div style={css('display:flex;align-items:flex-end;gap:18px')}>
        <div style={css('display:flex;flex-direction:column;gap:2px')}><span style={v.vhValS}>{v.w.value}</span><span style={css('font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--color-accent-800)')}>{v.w.unit}</span></div>
        <div style={css('display:flex;flex-direction:column;gap:2px;border-left:1px solid var(--color-divider);padding-left:14px')}><span style={v.vhOutS}>{v.w.vOut}</span><span style={css('font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--color-neutral-700)')}>Output</span></div>
        {v.hasEqHead ? <div style={css('margin-left:auto;display:flex;gap:6px;align-self:center;min-width:0')}>
          {(v.eq || []).map((e: any, i: number) => <div key={i} style={e.boxV}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={css('flex:none')}>
              <path d={EQ_COOL} style={e.iCool}></path>
              <path d={EQ_HEAT} style={e.iHeat}></path>
              <path d={EQ_FOG} style={e.iFog}></path>
            </svg><span style={css('font-size:10px;font-weight:600;white-space:nowrap')}>{e.k}</span></div>)}
        </div> : null}
      </div>
    ) : null;
  }

  render() {
    const v = this.renderVals();
    const w = v.w;
    const host = typeof this.props.style === 'string' ? css(this.props.style) : this.props.style;
    return (
<div style={host || { width: '100%', height: '100%' }}>
<div className={cx('blueprint', hRoot)} onClick={v.onOpen} style={v.rootS}>
  <i className="corner tl"></i><i className="corner tr"></i><i className="corner bl"></i><i className="corner br"></i>
  {v.isDanger ? <div className="blueprint" style={css('position:absolute;inset:-1px;border:1.5px solid #b3261e;pointer-events:none;z-index:5')}><i className="corner tl" style={css('color:#b3261e')}></i><i className="corner tr" style={css('color:#b3261e')}></i><i className="corner bl" style={css('color:#b3261e')}></i><i className="corner br" style={css('color:#b3261e')}></i></div> : null}
  <div style={css('display:flex;align-items:center;gap:6px;min-width:0;flex:none;margin-bottom:8px')}>
    <span style={css('font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent-700);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-right:auto')}>{w.title}</span>{v.svcOn ? <span style={css('flex:none;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:2px 6px;background:#f2c230;color:#1d1f20')}>Service</span> : null}
    {v.showEqMini ? <div style={css('display:flex;gap:6px;align-items:center;flex:none')}>{v.eq.map((e: any, i: number) => <svg key={i} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={e.mini}><title>{(e.k ?? '') + ' ' + (e.st ?? '')}</title><path d={EQ_COOL} style={e.iCool}></path><path d={EQ_HEAT} style={e.iHeat}></path><path d={EQ_FOG} style={e.iFog}></path></svg>)}</div> : null}
    {v.showTag ? <span className={v.tagClass} style={v.tagStyle}>{w.statusText}</span> : null}
    <span title={v.alarmLabel} style={v.alarmDot}></span>
    {v.badge ? <span style={css('font:600 9px ui-monospace,Menlo,monospace;padding:2px 5px;border:1px solid var(--color-neutral-400);color:var(--color-neutral-700)')}>{v.size}</span> : null}
  </div>
  <div style={css('flex:1;min-height:0;display:flex;gap:12px')}>
  <div ref={v.box} style={css('flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;gap:8px;overflow:hidden')}>
  {v.isL ? (
    <div style={css('display:flex;flex-direction:column;gap:4px')}>
      {this.renderVentHead(v)}
      {v.showValue ? <div style={css('display:flex;align-items:baseline;gap:6px')}><span style={v.bigValS}>{w.value}</span><span style={css('font-size:16px;color:var(--color-neutral-700)')}>{w.unit}</span></div> : null}
      {v.showNoteM ? <span style={css('font-size:13px;color:var(--color-neutral-700)')}>{w.note}</span> : null}
    </div>
  ) : null}
  {v.isM ? (
    <div style={css('display:flex;flex-direction:column;gap:2px;min-width:0')}>
      {this.renderVentHead(v)}
      {v.showValue ? <div style={css('display:flex;align-items:baseline;gap:5px')}><span style={v.mValS}>{w.value}</span><span style={css('font-size:13px;color:var(--color-neutral-700)')}>{w.unit}</span></div> : null}
      {v.showNoteM ? <span style={css('font-size:12px;color:var(--color-neutral-700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{w.note}</span> : null}
    </div>
  ) : null}
  {v.isS ? (
    <div style={css('display:flex;flex-direction:column;gap:2px;min-width:0')}>
      {v.showValue ? <div style={css('display:flex;align-items:baseline;gap:4px')}><span style={css('font-family:var(--font-heading);font-size:28px;font-weight:600;line-height:1;font-variant-numeric:tabular-nums')}>{w.value}</span><span style={css('font-size:12px;color:var(--color-neutral-700)')}>{w.unit}</span></div> : null}
      {v.showValue ? <span style={css('font-size:11px;color:var(--color-neutral-700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{v.sNote}</span> : null}
    </div>
  ) : null}
  {v.hasPair ? (<>
    <div style={v.pairGrid}>
      {v.pair.map((q: any, i: number) => (
        <div key={i} style={q.colStyle}>
          <div style={css('display:flex;flex-direction:column;gap:3px;min-width:0')}>
            <span style={css('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-700)')}>{q.k}</span>
            <div style={css('display:flex;align-items:baseline;gap:4px;min-width:0')}>{q.odo}<span style={css('font-size:12px;color:var(--color-neutral-700)')}>{q.unit}</span></div>
          </div>
          <div style={q.metaStyle}>
            <span style={q.dStyle}>{q.delta}</span>
            {v.showPairSub ? <span style={css('font-size:11px;color:var(--color-neutral-700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%')}>{q.sub}</span> : null}
          </div>
        </div>
      ))}
    </div>
    {v.showRatio ? <div style={css('display:flex;justify-content:space-between;align-items:baseline;font-size:12px;border-top:1px solid var(--color-divider);padding-top:6px;flex:none')}><span style={css('color:var(--color-neutral-700)')}>Water / feed ratio</span><b style={css('font-size:14px')}>{w.ratio}</b></div> : null}
  </>) : null}
  {v.showDials ? (
    <div style={v.dialWrap}>
      <div style={css('flex:1.5 1 0;min-width:0;min-height:0;display:flex;flex-direction:column;align-items:center;gap:2px')}>
        <div style={css('flex:1;min-height:0;width:100%;display:flex;justify-content:center;position:relative')}><svg viewBox="0 0 200 110" style={css('width:100%;height:100%;display:block;overflow:visible')}>
            <path d={v.big.track} fill="none" stroke="var(--color-accent-200)" strokeWidth="16"></path>
            <path d={v.big.danger} fill="none" stroke="#f2bdb4" strokeWidth="16"></path>
            <path d={v.big.zone} fill="none" stroke="var(--color-accent-500)" strokeWidth="16"></path>
            <line x1={v.big.nx1} y1={v.big.ny1} x2={v.big.nx2} y2={v.big.ny2} stroke={v.big.color} strokeWidth="5" strokeLinecap="round"></line>
          </svg>
          <span style={css('position:absolute;left:0;right:0;bottom:0;text-align:center;font-family:var(--font-heading);font-weight:600;font-size:30px;line-height:1;font-variant-numeric:tabular-nums')}>{v.big.txt}</span></div>
        <span style={css('font-size:12px;color:var(--color-neutral-700);white-space:nowrap')}>{v.big.label}</span>
      </div>
      <div style={v.smallCol}>
        {v.smalls.map((d: any, i: number) => (
          <div key={i} style={css('flex:1 1 0;min-width:0;min-height:0;display:flex;flex-direction:column;align-items:center;gap:2px')}>
            <div style={css('flex:1;min-height:0;width:100%;display:flex;justify-content:center;position:relative')}><svg viewBox="0 0 200 110" style={css('width:100%;height:100%;display:block;overflow:visible')}>
            <path d={d.track} fill="none" stroke="var(--color-accent-200)" strokeWidth="16"></path>
            <path d={d.danger} fill="none" stroke="#f2bdb4" strokeWidth="16"></path>
            <path d={d.zone} fill="none" stroke="var(--color-accent-500)" strokeWidth="16"></path>
            <line x1={d.nx1} y1={d.ny1} x2={d.nx2} y2={d.ny2} stroke={d.color} strokeWidth="5" strokeLinecap="round"></line>
          </svg>
          <span style={css('position:absolute;left:0;right:0;bottom:0;text-align:center;font-family:var(--font-heading);font-weight:600;font-size:18px;line-height:1;font-variant-numeric:tabular-nums')}>{d.txt}</span></div>
            <span style={css('font-size:11px;color:var(--color-neutral-700);white-space:nowrap')}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  ) : null}
  {v.showLines ? (
    <div style={css('flex:1 1 0;min-height:70px;display:flex;flex-direction:column;justify-content:space-evenly;gap:6px')}>
      {v.lines.map((l: any, i: number) => (
        <div key={i} style={css('display:flex;align-items:center;gap:8px;min-width:0')}>
          <span style={css('font-size:11px;font-weight:600;width:20px;flex:none;color:var(--color-neutral-700)')}>{l.k}</span>
          <div style={css('flex:1;min-width:0;display:flex;gap:3px')}>{l.lamps.map((m: any, j: number) => <div key={j} style={m.style}></div>)}</div>
          <span style={l.pStyle}>{l.p}</span>
        </div>
      ))}
      <span style={css('font-size:11px;color:var(--color-neutral-700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{w.note}</span>
    </div>
  ) : null}
  {v.showVent ? (<>
    <div style={css('display:flex;align-items:stretch;gap:12px;flex:none;min-width:0')}>
      <div style={css('display:flex;flex-direction:column;justify-content:center;gap:2px;flex:none')}>
      <div style={css('display:flex;align-items:center;gap:8px;min-width:0')}><span style={v.vhValS}>{w.value}</span>
        {v.drv.on ? <span title={v.drv.t} style={v.drv.box}>
          {v.drv.heat ? <svg viewBox="0 0 24 24" style={v.drv.ic} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg> : null}
          {v.drv.cool ? <svg viewBox="0 0 24 24" style={v.drv.ic} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20M12 2v20m-5-17 5 3 5-3M7 19l5-3 5 3M4.9 7.1 7.5 12l-2.6 4.9M19.1 7.1 16.5 12l2.6 4.9"></path></svg> : null}
          {v.drv.txt ? <span style={v.drv.tS}>{v.drv.lab}<span style={css('font-size:.7em;vertical-align:-.25em')}>{v.drv.sub}</span></span> : null}
        </span> : null}</div>
      {v.hasCfm ? <div style={css('display:flex;align-items:baseline;gap:2px;min-width:0;white-space:nowrap')}><span style={v.cfmS}>{w.vent.cfm}</span><span style={css('font-family:var(--font-heading);font-size:14px;color:var(--color-neutral-700)')}>cfm</span></div> : null}
      </div>
    <div style={css('display:flex;flex-direction:column;gap:6px;flex:1 1 0;min-width:0;justify-content:flex-end;padding-bottom:4px')}>
      <div style={v.segBox}>
        <div style={v.segRange}></div>
        {v.segs.map((sg: any, i: number) => <div key={i} style={sg}></div>)}
      </div>
      <div style={css('position:relative;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px')}>
        <div style={v.lvlHandle}><div style={css('width:1px;height:8px;background:var(--color-neutral-500)')}></div></div>
        {v.vGroups.map((g: any, i: number) => <div key={i} style={g.style}>{g.t}</div>)}
      </div>
    </div>
    </div>
    <div style={v.vl.lower}>
    <div className={cx(hBright, aBright)} style={v.vl.fanHead}>
      <div style={css('display:flex;align-items:baseline;gap:6px;flex:none;min-width:0')}>
        <span style={v.cyc.labS}>{v.cyc.state}</span>
        <span style={v.cyc.cdS}>{v.cyc.cd}</span>
      </div>
      <div style={v.vl.fanList}>
        {v.fans.map((f: any, i: number) => (
          <div key={i} style={v.vl.fanItem}>
            <svg viewBox="0 0 24 24" style={f.svg} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="1" width="22" height="22" style={f.hSide}></rect>
              <circle cx="12" cy="12" r="11" strokeWidth="2" style={f.hTun}></circle>
              <path d="M7 1h10M12 1v3" style={f.hStir}></path>
              <g transform={f.tf}><g style={f.spin}><path d={FAN_BLADE}></path><circle cx="12" cy="12" r="1"></circle></g></g>
            </svg>
            <div style={css('display:flex;flex-direction:column;line-height:1.15;min-width:0;align-items:center')}><span style={v.vl.fanK}>{f.k}</span><span style={css('font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap')}>{f.n}</span></div>
          </div>
        ))}
      </div>
    </div>
      {v.hasInl ? (
        <div className={cx(hBright, aBright)} style={v.vl.panel}>
          <span style={v.inS.labS}>{v.inS.state}</span>
          <div style={v.vl.fanList}>
            {v.inl.map((g: any, i: number) => (
              <div key={i} style={v.vl.fanItem}>
                <svg viewBox="0 0 24 24" style={g.svg} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <g style={g.hSide}><path d="M8 3H4v18h4"></path><path d="M9 12h11M16 8l4 4-4 4" style={g.air}></path></g>
                  <g style={g.hTun}><rect x="3" y="4" width="18" height="16"></rect><path d="M3 9.5h18M3 14.5h18"></path><path d="M12 22v-2" style={g.air}></path></g>
                </svg>
                <div style={css('display:flex;flex-direction:column;line-height:1.15;min-width:0;align-items:center')}><span style={v.vl.fanK}>{g.k}</span><span style={g.nS}>{g.n}</span></div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {v.hasVp ? (
        <div onClick={v.openPress} className={cx(hBright, aBright)} style={v.vl.panelNw}>
          <span style={v.vl.pLab}>Pressure</span>
          <div style={v.vl.prIn}>
            <div style={css('display:flex;flex-direction:column;gap:2px;min-width:0')}>
              <div style={css('display:flex;align-items:baseline;gap:2px')}><span style={v.vp.valS}>{v.vp.val}</span><span style={css('font-family:var(--font-heading);font-size:14px;font-weight:600;text-transform:uppercase')}>Pa</span></div>
              <span style={v.vl.prT}>Target {v.vp.target} <span style={css('color:var(--color-neutral-700)')}>±{v.vp.band}</span></span>
            </div>
            <div style={v.vp.box}>
              <svg viewBox="0 0 200 110" style={css('width:100%;height:100%;display:block;overflow:visible')}>
                <path d={v.vp.track} fill="none" stroke="var(--color-accent-100)" strokeWidth="18"></path>
                <path d={v.vp.lowZ} fill="none" stroke="#f2bdb4" strokeWidth="18"></path>
                <path d={v.vp.highZ} fill="none" stroke="#f2bdb4" strokeWidth="18"></path>
                <path d={v.vp.okZ} fill="none" stroke="var(--color-accent-500)" strokeWidth="18"></path>
                <line x1={v.vp.tx1} y1={v.vp.ty1} x2={v.vp.tx2} y2={v.vp.ty2} stroke="var(--color-text)" strokeWidth="5"></line>
                <line x1={v.vp.nbx} y1={v.vp.nby} x2={v.vp.nx} y2={v.vp.ny} stroke={v.vp.nc} strokeWidth="6" strokeLinecap="round"></line>
              </svg>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  </>) : null}
  {v.showPress ? (
    <div style={v.pr.wrap}>
      <div style={css('display:flex;flex-direction:column;gap:6px;min-width:0')}>
        <div style={css('display:flex;align-items:baseline;gap:2px')}><span style={v.pr.valS}>{v.pr.val}</span><span style={v.pr.unitS}>Pa</span></div>
        <div style={v.pr.tgtS}>Target: {v.pr.target} <span style={css('color:var(--color-neutral-700)')}>±{v.pr.band}</span><span style={css('font-size:.6em;text-transform:uppercase;color:var(--color-neutral-700)')}>Pa</span></div>
      </div>
      <div style={v.sp.box}>
        <svg viewBox="0 0 200 116" style={css('width:100%;height:100%;display:block;overflow:visible')}>
          <path d={v.sp.track} fill="none" stroke="var(--color-accent-100)" strokeWidth="16"></path>
          <path d={v.sp.lowZ} fill="none" stroke="#f2bdb4" strokeWidth="16"></path>
          <path d={v.sp.highZ} fill="none" stroke="#f2bdb4" strokeWidth="16"></path>
          <path d={v.sp.okZ} fill="none" stroke="var(--color-accent-500)" strokeWidth="16"></path>
          <line x1={v.sp.tx1} y1={v.sp.ty1} x2={v.sp.tx2} y2={v.sp.ty2} stroke="var(--color-text)" strokeWidth="4"></line>
          <line x1={v.sp.nbx} y1={v.sp.nby} x2={v.sp.nx} y2={v.sp.ny} stroke={v.sp.nc} strokeWidth="4" strokeLinecap="round"></line>
        </svg>
        <span style={v.sp.valS}>{v.sp.val}</span>
      </div>
    </div>
  ) : null}
  {v.showGauge ? (
    <div style={css('display:flex;flex-direction:column;gap:4px')}>
      {v.hasSets ? (
        <div style={v.setsBox}>
          <div style={v.setsTrack}>{v.bands.map((b: any, i: number) => <div key={i} style={b.style}></div>)}</div>
          {v.sets.map((s: any, i: number) => <React.Fragment key={i}><div style={s.tick}></div><span style={s.lab}>{s.k}</span>{s.showNum ? <span style={s.num}>{s.n}</span> : null}</React.Fragment>)}
          <div style={v.nowMark}></div>
        </div>
      ) : null}
      {v.noSets ? <div style={v.gaugeTrack}>{v.bands.map((b: any, i: number) => <div key={i} style={b.style}></div>)}<div style={v.marker}></div></div> : null}
      {v.showGaugeLabels ? <div style={css('position:relative;height:14px;font-size:10px;color:var(--color-neutral-700)')}>{v.gLabels.map((g: any, i: number) => <span key={i} style={g.style}>{g.text}</span>)}</div> : null}
    </div>
  ) : null}
  {v.showSiloRows ? (
    <div ref={v.rowsRef} style={css('display:flex;flex-direction:column;gap:5px;flex:1 1 auto;min-height:0;overflow:hidden')}>
      {v.siloRows.map((b: any, i: number) => (
        <div key={i} style={css('display:grid;grid-template-columns:20px 54px minmax(0,1fr) 36px 50px;gap:6px;align-items:center;font-size:11px')}>
          <span style={css('color:var(--color-neutral-700)')}>{b.label}</span>
          <span style={b.typeStyle}>{b.type}</span>
          <div style={b.trackH}><div style={b.fillH}></div></div>
          <span style={css('text-align:right;font-variant-numeric:tabular-nums')}>{b.pctText}</span>
          <span style={b.daysStyle}>{b.daysText}</span>
        </div>
      ))}
    </div>
  ) : null}
  {v.showBars ? (
    <div style={v.barsBox}>
      {v.bars.map((b: any, i: number) => (
        <div key={i} style={css('flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;height:100%')}>
          {b.showPct ? <span style={b.pctStyle}>{b.pctText}</span> : null}
          <div style={b.track}><div style={b.fill}></div></div>
          {b.showLabel ? <div style={css('display:flex;flex-direction:column;align-items:center;gap:1px;min-width:0')}><span style={css('font-size:9px;color:var(--color-neutral-700);white-space:nowrap')}>{b.label}</span>{b.hasType ? <span style={b.typeStyle}>{b.type}</span> : null}<span style={b.daysStyle}>{b.daysText}</span></div> : null}
        </div>
      ))}
    </div>
  ) : null}
  {v.showSpark ? (
    <div style={css('flex:1;min-height:40px;display:flex;flex-direction:column;gap:2px')}>
      <svg viewBox="0 0 400 100" preserveAspectRatio="none" style={css('width:100%;flex:1;min-height:30px')}><line x1="0" y1="50" x2="400" y2="50" stroke="var(--color-neutral-400)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke"></line><polyline points={v.spark} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" vectorEffect="non-scaling-stroke"></polyline></svg>
      <span style={css('font-size:10px;color:var(--color-neutral-700)')}>Last 24 h · dashed = target</span>
    </div>
  ) : null}
  {v.hasRows ? (
    <div ref={v.rowsRef} style={v.rowsGrid}>
      {v.rows.map((r: any, i: number) => <div key={i} style={r.style}><span style={css('color:var(--color-neutral-700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{r.k}</span><span style={r.vStyle}>{r.v}</span></div>)}
    </div>
  ) : null}
  {v.showToday ? (
    <div style={css('display:flex;flex-direction:column;gap:4px;margin-top:auto;border-top:1px solid var(--color-divider);padding-top:6px')}>
      <span style={css('font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-accent-700)')}>Today</span>
      <div style={css('display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px')}>
        {v.today.map((t: any, i: number) => <div key={i} style={css('display:flex;flex-direction:column;min-width:0')}><span style={css('font-size:10px;color:var(--color-neutral-700)')}>{t.k}</span><span style={css('font-family:var(--font-heading);font-size:18px;font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{t.v}</span></div>)}
      </div>
    </div>
  ) : null}
  {v.showAlert ? <div style={v.alertStyle}>{w.alert}</div> : null}
  {v.act.on ? (
    <button onClick={v.act.click} className={cx(hBtn, aBtn)} style={v.act.s}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={css('flex:none')}>
        <path d="M12 5v14M5 12h14" style={v.act.plus}></path>
        <path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" style={v.act.undo}></path><g style={v.act.wrench}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></g>
      </svg>
      <span>{v.act.t}</span>
    </button>
  ) : null}
  </div>
  {v.showThermo ? (
    <div style={v.thBox}>
      <div style={css('position:relative;flex:1;min-width:0')}>{v.thLeft.map((s: any, i: number) => <span key={i} style={s.lab}>{s.text}</span>)}</div>
      <div style={css('display:flex;flex-direction:column;align-items:center;flex:none;width:24px')}>
        <div style={v.thTube}>
          <div style={css('position:absolute;inset:0;display:flex;flex-direction:column-reverse')}>{v.thBands.map((b: any, i: number) => <div key={i} style={b.style}></div>)}</div>
          <div style={v.thFill}></div>
          {v.thSets.map((s: any, i: number) => <div key={i} style={s.tick}></div>)}
        </div>
        <div style={v.thBulb}></div>
      </div>
      <div style={css('position:relative;flex:1;min-width:0')}>{v.thRight.map((s: any, i: number) => <span key={i} style={s.lab}>{s.text}</span>)}</div>
    </div>
  ) : null}
  </div>
</div>
</div>
    );
  }
}
