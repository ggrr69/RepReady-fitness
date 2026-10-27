/* Goodstride Club — procedural 3D instructor prototype.
   Built from original Three.js geometry; no third-party character model is redistributed. */
(() => {
  const G = window.Goodstride3D = { active: null };
  const green = 0x173f35, greenLight = 0x315c50, skin = 0xc88e6d, beard = 0x77746b, ivory = 0xfffdf8;
  function makeMesh(THREE, geo, color, parent, x=0,y=0,z=0) {
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({color, roughness:.82}));
    m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
  }
  function ball(T, p, c, x,y,z, sx,sy,sz) {
    const m=makeMesh(T,new T.SphereGeometry(1,20,14),c,p,x,y,z);m.scale.set(sx,sy,sz);return m;
  }
  function limb(T,parent,a,b,r1,r2,color) {
    const av=new T.Vector3(...a), bv=new T.Vector3(...b), d=bv.clone().sub(av);
    const m=makeMesh(T,new T.CylinderGeometry(r2,r1,d.length(),14),color,parent);
    m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;
  }
  function createCharacter(T, scene) {
    const root=new T.Group();scene.add(root);
    // Human-shaped lower body: pelvis, thighs, calves and shoes overlap at joints.
    ball(T,root,green,0,.91,0,.31,.23,.20);
    const legs=[];
    for(const side of [-1,1]){
      const hip=new T.Group();hip.position.set(side*.16,.82,0);root.add(hip);
      ball(T,hip,green,0,-.12,0,.145,.23,.15);
      limb(T,hip,[0,-.12,0],[side*.015,-.38,.005],.132,.105,green);
      const knee=new T.Group();knee.position.set(side*.015,-.38,.005);hip.add(knee);
      ball(T,knee,green,0,0,0,.12,.12,.13);
      limb(T,knee,[0,0,0],[side*.015,-.27,.01],.102,.078,green);
      ball(T,knee,green,side*.015,-.22,.01,.082,.12,.095);
      const foot=ball(T,root,ivory,side*.17,.13,.075,.205,.075,.27);
      legs.push({side,hip,knee,foot});
    }
    // Tapered shirt silhouette, with the waist tucked into the pelvis for a continuous shape.
    const torso=new T.Group();torso.position.set(0,1.35,0);root.add(torso);
    ball(T,torso,green,0,-.035,0,.305,.38,.19);
    ball(T,torso,green,0,.20,0,.355,.29,.205);
    // Shoulder line / collar
    limb(T,torso,[-.16,.40,.13],[0,.36,.16],.012,.012,greenLight);
    limb(T,torso,[0,.36,.16],[.16,.40,.13],.012,.012,greenLight);
    // Neck sits inside the shirt collar; head overlaps neck instead of floating above it.
    const neck=new T.Group();neck.position.set(0,.42,0);torso.add(neck);
    ball(T,neck,skin,0,.035,0,.105,.16,.105);
    const head=new T.Group();head.position.set(0,.20,0);neck.add(head);
    ball(T,head,skin,0,0,0,.24,.285,.22);
    ball(T,head,skin,-.243,-.005,0,.04,.064,.05);
    ball(T,head,skin,.243,-.005,0,.04,.064,.05);
    ball(T,head,skin,0,-.035,.226,.034,.047,.045);
    // Beard follows the lower jaw; glasses sit forward on the face.
    ball(T,head,beard,0,-.15,.105,.163,.11,.14);
    for(const x of [-.105,.105]) {
      const ring=makeMesh(T,new T.TorusGeometry(.071,.011,8,24),0x27352f,head,x,.035,.199);
      ring.scale.set(1,.78,1);
      ball(T,head,0x27352f,x-.004,.038,.202,.01,.01,.006);
    }
    limb(T,head,[-.028,.035,.22],[.028,.035,.22],.008,.008,0x27352f);
    // Shoulder pivot -> upper arm -> elbow pivot -> forearm/hand.
    // Overlapping rounded segments keep the silhouette connected through motion.
    const arms=[];
    for(const side of [-1,1]) {
      const shoulder=new T.Group();shoulder.position.set(side*.325,.27,0);torso.add(shoulder);
      ball(T,shoulder,skin,0,0,0,.095,.105,.095);
      limb(T,shoulder,[0,0,0],[side*.055,-.235,.005],.084,.072,skin);
      const elbow=new T.Group();elbow.position.set(side*.055,-.235,.005);shoulder.add(elbow);
      ball(T,elbow,skin,0,0,0,.073,.075,.072);
      limb(T,elbow,[0,0,0],[side*.045,-.225,.025],.066,.052,skin);
      ball(T,elbow,skin,side*.045,-.22,.025,.055,.064,.055);
      arms.push({side,shoulder,elbow});
    }
    return {root,torso,head,arms,legs};
  }
  function boot(stage) {
    if(!stage) return;
    if(G.active && G.active.stop) { try{G.active.stop();}catch{} }
    const canvas=stage.querySelector('canvas');
    if(!window.THREE || !canvas) {
      stage.classList.add('gs3d-fallback');
      const loading=stage.querySelector('.gs3d-loading'); if(loading) loading.textContent='Illustrated movement preview';
      return;
    }
    const T=window.THREE;
    let renderer;
    try { renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true}); }
    catch(err) {
      stage.classList.add('gs3d-fallback');
      const loading=stage.querySelector('.gs3d-loading'); if(loading) loading.textContent='Illustrated movement preview';
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    renderer.setSize(Math.max(260,stage.clientWidth||300),260,false);
    // The stage starts in fallback mode so users always see a character.
    // Hide the fallback only after WebGL successfully creates a renderer.
    stage.classList.remove('gs3d-fallback');
    stage.classList.add('gs3d-rendered');
    renderer.shadowMap.enabled=true;renderer.outputColorSpace=T.SRGBColorSpace;
    const scene=new T.Scene();scene.background=null;
    const camera=new T.PerspectiveCamera(32,1,.1,100);camera.position.set(0,1.45,5.9);camera.lookAt(0,1.22,0);
    scene.add(new T.HemisphereLight(0xfff4e5,0x6a786e,2.1));
    const key=new T.DirectionalLight(0xffffff,2.1);key.position.set(-3,5,5);scene.add(key);
    // Avoid a solid ground disc crossing the character's feet in the angled mobile view.
    const {root,torso,head,arms,legs}=createCharacter(T,scene);
    const movement=(stage.dataset.movement||'generic').toLowerCase();
    const clock=new T.Clock();
    function resize(){const w=Math.max(260,stage.clientWidth||300);renderer.setSize(w,260,false);camera.aspect=w/260;camera.updateProjectionMatrix();}
    const observer=window.ResizeObserver?new ResizeObserver(resize):null;if(observer)observer.observe(stage);
    let alive=true;
    function frame(){
      if(!alive)return;
      const t=clock.getElapsedTime(), phase=t*1.65;
      root.position.y=.008*Math.sin(t*1.3);
      root.rotation.set(0,0,0);torso.rotation.set(0,0,0);head.rotation.set(0,0,0);
      arms.forEach(({side,shoulder,elbow})=>{
        shoulder.rotation.set(0,0,0);elbow.rotation.set(0,0,0);
        if(/shoulder|arm circle/.test(movement)){
          // Clear shoulder-roll cycle: shrug up, glide forward, lower, then roll back.
          // The shoulder pivots translate as well as rotate, so the motion reads on a phone.
          const cycle=phase % (Math.PI*2);
          const lift=(1-Math.cos(cycle))*.5;
          const forward=Math.sin(cycle);
          shoulder.position.y=.27 + .105*lift;
          shoulder.position.z=.035 + .055*forward;
          shoulder.rotation.x=.24*forward;
          shoulder.rotation.z=side*(.025 + .085*Math.cos(cycle));
          shoulder.rotation.y=side*.18*forward;
          elbow.rotation.x=.06 + .09*lift;
          elbow.rotation.z=side*(.025 + .035*Math.sin(cycle-.4));
          torso.rotation.z=.008*Math.sin(cycle);
          head.rotation.z=.004*Math.sin(cycle);
        } else if(/push.up|pushup|wall push/.test(movement)){
          shoulder.rotation.z=side*(.08+.18*(.5+.5*Math.sin(t*1.7)));
          elbow.rotation.z=side*(.15+.18*(.5+.5*Math.sin(t*1.7)));
          torso.rotation.x=.035*Math.sin(t*1.7);
        } else if(/chair|sit.to.stand/.test(movement)){
          shoulder.rotation.z=side*(.04+.035*Math.sin(t*1.5));
          elbow.rotation.z=side*.06;
        }
      });
      if(/chair|sit.to.stand/.test(movement)){root.position.y=.015+.08*(.5+.5*Math.sin(t*1.5));torso.rotation.x=.055*Math.max(0,Math.sin(t*1.5));}
      renderer.render(scene,camera);G.raf=requestAnimationFrame(frame);
    }
    frame();G.active={renderer,observer,stop:()=>{alive=false;cancelAnimationFrame(G.raf);if(observer)observer.disconnect();renderer.dispose();}};
  }
  window.initGoodstride3D = () => {
    const stage=document.getElementById('gs3dStage');
    if(stage) boot(stage);
  };
  window.goodstrideInstructorPreview = function(name,cue){
    const n=String(name||'').toLowerCase();
    let type='generic', title='Movement preview', instructions='Move slowly and stay in a comfortable range.';
    if(/shoulder|arm circle/.test(n)){type='shoulder';title='Shoulder circles';instructions='Gently lift both shoulders, roll them forward and down, then bring them back. Reverse direction after several slow circles.';}
    else if(/chair sit|sit.to.stand/.test(n)){type='chair';title='Chair sit-to-stand';instructions='Lean forward slightly, stand tall through your feet, then lower with control.';}
    else if(/wall push|push.up|pushup/.test(n)){type='pushup';title='Wall push-up';instructions='Place hands on the wall at chest height. Bend elbows to approach the wall, then press away.';}
    return '<div class="gs-instructor-stage"><div class="gs-stage-kicker">GOODSTRIDE CLUB · MOVEMENT DEMONSTRATION</div><div id="gs3dStage" class="gs3d-stage gs3d-fallback gs-move-'+type+'" data-movement="'+type+'"><svg class="gs-fallback-avatar" viewBox="0 0 280 310" role="img" aria-label="Animated Goodstride instructor demonstrating '+title+'"><ellipse cx="140" cy="289" rx="55" ry="8" fill="#d8d0c3"/><g class="gs-fallback-legs"><path d="M111 184 L106 246 L97 275 L119 275 L136 218 L147 218 L163 275 L185 275 L168 184Z" fill="#173f35"/><path d="M96 271 L120 271 L125 281 L89 281Z M161 271 L185 271 L198 281 L163 281Z" fill="#fffdf8" stroke="#d4d1c8" stroke-width="2"/></g><g class="gs-fallback-torso"><path d="M103 118 Q140 97 177 118 L188 190 Q140 207 92 190Z" fill="#173f35"/><path d="M111 120 Q140 135 169 120" fill="none" stroke="#315c50" stroke-width="4" stroke-linecap="round"/></g><g class="gs-fallback-left-arm"><path d="M105 126 Q93 127 88 143 L77 165 L69 177" fill="none" stroke="#c88e6d" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="104" cy="128" rx="12" ry="13" fill="#c88e6d"/><g class="gs-fallback-left-shoulder"><circle cx="105" cy="126" r="15" fill="#c88e6d"/><path d="M96 122 Q105 116 114 122" fill="none" stroke="#b5785a" stroke-width="2.5" stroke-linecap="round"/></g></g><g class="gs-fallback-right-arm"><path d="M175 126 Q187 127 192 143 L203 165 L211 177" fill="none" stroke="#c88e6d" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="176" cy="128" rx="12" ry="13" fill="#c88e6d"/><g class="gs-fallback-right-shoulder"><circle cx="175" cy="126" r="15" fill="#c88e6d"/><path d="M166 122 Q175 116 184 122" fill="none" stroke="#b5785a" stroke-width="2.5" stroke-linecap="round"/></g></g><g class="gs-fallback-head"><path d="M108 53 Q108 24 140 24 Q172 24 172 55 L167 86 Q161 108 140 110 Q119 108 113 86Z" fill="#d5a080"/><path d="M109 55 Q104 24 140 20 Q175 24 171 55 L165 43 Q140 32 115 44Z" fill="#b9a18e"/><rect x="113" y="59" width="25" height="18" rx="6" fill="none" stroke="#27352f" stroke-width="3.5"/><rect x="142" y="59" width="25" height="18" rx="6" fill="none" stroke="#27352f" stroke-width="3.5"/><path d="M138 66 L142 66" stroke="#27352f" stroke-width="3.5"/><path d="M121 84 Q140 91 159 84 Q156 106 140 107 Q124 105 121 84Z" fill="#77746b"/><path d="M127 82 Q140 86 153 82" fill="none" stroke="#704e3e" stroke-width="2"/></g><g class="gs-shoulder-cues" fill="none" stroke="#d88d67" stroke-width="3" stroke-linecap="round"><path d="M77 122 C64 128 61 141 68 151"/><path d="M63 143 L68 151 L74 144"/><path d="M203 122 C216 128 219 141 212 151"/><path d="M206 144 L212 151 L217 143"/></g></svg><canvas aria-label="3D Goodstride instructor animation"></canvas><span class="gs3d-loading">Animated instructor preview</span></div><div class="gs-stage-caption"><strong>Your Goodstride instructor</strong><span>'+title+' · repeating movement cycle</span></div></div><p class="demo-cue">'+cue+'</p><p class="gs-instructor-instructions">'+instructions+'</p><p class="muted small">Animated character prototype. This is a visual guide, not medical advice; keep the motion gentle and pain-free.</p>';
  };
  document.addEventListener('click',e=>{if(e.target.closest('[data-demo-trigger]'))setTimeout(window.initGoodstride3D,0);});
  const originalShow=HTMLDialogElement.prototype.showModal;
  HTMLDialogElement.prototype.showModal=function(){originalShow.call(this);if(this.id==='movementDialog')setTimeout(window.initGoodstride3D,80);};
})();