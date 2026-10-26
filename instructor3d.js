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
    // Feet, shorts, torso and neck
    ball(T,root,green, -.18,.55,0,.16,.28,.17); ball(T,root,green,.18,.55,0,.16,.28,.17);
    ball(T,root,ivory,-.19,.15,.07,.22,.09,.31); ball(T,root,ivory,.19,.15,.07,.22,.09,.31);
    ball(T,root,green,0,1.03,0,.39,.38,.23);
    ball(T,root,green,0,1.39,0,.37,.48,.23);
    ball(T,root,skin,0,1.85,0,.105,.16,.105);
    // Head: bald head, ears, nose, glasses, eyes, salt-and-pepper beard
    ball(T,root,skin,0,2.13,0,.27,.32,.245);
    ball(T,root,skin,-.275,2.13,0,.045,.075,.055);ball(T,root,skin,.275,2.13,0,.045,.075,.055);
    ball(T,root,skin,0,2.11,.237,.045,.06,.055);
    ball(T,root,beard,0,1.96,.11,.19,.12,.17);
    // Glasses frames and bridge, on the front (+z)
    for(const x of [-.115,.115]) {
      const ring=makeMesh(T,new T.TorusGeometry(.082,.014,8,24),0x27352f,root,x,2.17,.222);
      ring.scale.set(1,.76,1);
      ball(T,root,0x27352f,x-.005,2.175,.226,.012,.012,.008);
    }
    limb(T,root,[-.03,2.17,.235],[.03,2.17,.235],.009,.009,0x27352f);
    // Arms pivot at shoulder so the movement remains connected.
    const arms=[];
    for(const side of [-1,1]) {
      const pivot=new T.Group();pivot.position.set(side*.35,1.62,0);root.add(pivot);
      limb(T,pivot,[0,0,0],[side*.07,-.27,0],.105,.085,skin);
      const elbow=[side*.07,-.27,0];
      limb(T,pivot,elbow,[side*.12,-.51,.025],.08,.065,skin);
      ball(T,pivot,skin,side*.12,-.53,.03,.075,.08,.07);
      arms.push({side,pivot});
    }
    // Shirt seam and a simple friendly smile
    limb(T,root,[-.14,1.42,.222],[0,1.38,.238],.008,.008,greenLight);
    limb(T,root,[0,1.38,.238],[.14,1.42,.222],.008,.008,greenLight);
    return {root,arms};
  }
  function boot(stage) {
    if(!stage || !window.THREE) return;
    if(G.active && G.active.renderer) { try{G.active.renderer.dispose();}catch{} }
    const T=window.THREE, canvas=stage.querySelector('canvas');
    if(!canvas) return;
    const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    renderer.setSize(Math.max(260,stage.clientWidth||300),260,false);
    renderer.shadowMap.enabled=true;renderer.outputColorSpace=T.SRGBColorSpace;
    const scene=new T.Scene();scene.background=null;
    const camera=new T.PerspectiveCamera(32,1,.1,100);camera.position.set(0,1.55,7.2);camera.lookAt(0,1.25,0);
    scene.add(new T.HemisphereLight(0xfff4e5,0x6a786e,2.1));
    const key=new T.DirectionalLight(0xffffff,2.1);key.position.set(-3,5,5);scene.add(key);
    const floor=new T.Mesh(new T.CircleGeometry(1.15,48),new T.MeshStandardMaterial({color:0xd8d0c3,roughness:1}));
    floor.rotation.x=-Math.PI/2;floor.position.y=.045;floor.scale.set(1.1,.48,1);scene.add(floor);
    const {root,arms}=createCharacter(T,scene);
    const movement=(stage.dataset.movement||'generic').toLowerCase();
    const clock=new T.Clock();
    function resize(){const w=Math.max(260,stage.clientWidth||300);renderer.setSize(w,260,false);camera.aspect=w/260;camera.updateProjectionMatrix();}
    const observer=window.ResizeObserver?new ResizeObserver(resize):null;if(observer)observer.observe(stage);
    let alive=true;
    function frame(){
      if(!alive)return;
      const t=clock.getElapsedTime(), s=Math.sin(t*2.6);
      root.position.y=.025*Math.sin(t*1.3);
      arms.forEach(({side,pivot})=>{
        pivot.rotation.set(0,0,0);
        if(/shoulder|arm circle/.test(movement)) { pivot.rotation.z=side*(.1+.25*Math.sin(t*2.2)); pivot.rotation.x=.08*Math.cos(t*2.2); }
        else if(/push.up|pushup|wall push/.test(movement)) { pivot.rotation.z=side*(.1+.22*(.5+.5*Math.sin(t*2))); }
        else if(/chair|sit.to.stand/.test(movement)) { pivot.rotation.z=side*(.04+.06*Math.sin(t*2)); }
      });
      if(/chair|sit.to.stand/.test(movement)){root.position.y=.02+.13*(.5+.5*Math.sin(t*1.6));root.rotation.x=.07*Math.max(0,Math.sin(t*1.6));}
      else if(/push.up|pushup|wall push/.test(movement)){root.rotation.x=.035*Math.sin(t*2);}
      renderer.render(scene,camera);G.raf=requestAnimationFrame(frame);
    }
    frame();G.active={renderer,observer,stop:()=>{alive=false;cancelAnimationFrame(G.raf);if(observer)observer.disconnect();renderer.dispose();}};
  }
  window.initGoodstride3D = () => {
    const stage=document.getElementById('gs3dStage');
    if(stage) boot(stage);
  };
  window.goodstrideInstructorPreview = function(name,cue){
    const safe=String(name||'Movement').replace(/[&<>"]/g,'');
    const n=String(name||'').toLowerCase();
    let type='generic', title='Movement preview', instructions='Move slowly and stay in a comfortable range.';
    if(/shoulder|arm circle/.test(n)){type='shoulder';title='Shoulder circles';instructions='Lift shoulders gently, roll them forward, then reverse direction. Keep your neck relaxed.';}
    else if(/chair sit|sit.to.stand/.test(n)){type='chair';title='Chair sit-to-stand';instructions='Lean forward slightly, stand tall through your feet, then lower with control.';}
    else if(/wall push|push.up|pushup/.test(n)){type='pushup';title='Wall push-up';instructions='Place hands on the wall at chest height. Bend elbows to approach the wall, then press away.';}
    return '<div class="gs-instructor-stage"><div class="gs-stage-kicker">GOODSTRIDE CLUB · 3D MOVEMENT PREVIEW</div><div id="gs3dStage" class="gs3d-stage" data-movement="'+type+'"><canvas aria-label="3D Goodstride instructor animation"></canvas><span class="gs3d-loading">Loading instructor…</span></div><div class="gs-stage-caption"><strong>Your Goodstride instructor</strong><span>'+title+'</span></div></div><p class="demo-cue">'+cue+'</p><p class="gs-instructor-instructions">'+instructions+'</p><p class="muted small">Early procedural 3D prototype. Animation is illustrative and should be professionally reviewed before use as exercise instruction.</p>';
  };
  document.addEventListener('click',e=>{if(e.target.closest('[data-demo-trigger]'))setTimeout(window.initGoodstride3D,0);});
  const originalShow=HTMLDialogElement.prototype.showModal;
  HTMLDialogElement.prototype.showModal=function(){originalShow.call(this);if(this.id==='movementDialog')setTimeout(window.initGoodstride3D,80);};
})();