import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let session = null;
function bodyColor(name) {
  const s = String(name || '').toLowerCase();
  const options = [
    [/rosso|red|czerw|burgundy|maroon/, '#d52a36'], [/blue|azur|navy|niebies/, '#286fc8'],
    [/green|verde|zielon/, '#2a9869'], [/yellow|giallo|żół|zol/, '#e5b82e'],
    [/orange|pomara/, '#e07828'], [/purple|violet|fiolet/, '#854dbe'],
    [/pink|róż|roz/, '#e16b97'], [/white|bianco|bia/, '#e6e8e9'],
    [/black|nero|czarn/, '#252a32'], [/silver|chrome|srebr/, '#abb3bb'],
    [/grey|gray|grigio|szar/, '#717984'], [/gold|oro|złot|zlot/, '#bc9848'],
  ];
  return options.find(([regex]) => regex.test(s))?.[1] || '#c52c32';
}
function addPart(group, shape, color, x, y, z, extras = {}) {
  const material = color instanceof THREE.Material ? color : new THREE.MeshStandardMaterial({
    color, roughness: 0.32, metalness: 0.48, ...extras,
  });
  const mesh = new THREE.Mesh(shape, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}
function createCar(color, name) {
  const car = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({color, metalness: 0.68, roughness: 0.23});
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#253849', metalness: 0.22, roughness: 0.1, transparent: true, opacity: 0.82,
  });
  const dark = new THREE.MeshStandardMaterial({color: '#10131a', roughness: 0.72});
  const chrome = new THREE.MeshStandardMaterial({color: '#cbd1dc', metalness: 0.83, roughness: 0.22});
  const lights = new THREE.MeshStandardMaterial({color: '#ffefca', emissive: '#fff0bc', emissiveIntensity: 0.42});
  const rearLights = new THREE.MeshStandardMaterial({color: '#cc182b', emissive: '#7c0010', emissiveIntensity: 0.3});
  const low = /formula|f1|race|gt3|gt4|track/i.test(name || '');
  const tall = /suv|defender|truck|jeep|g.?class|bronco/i.test(name || '');
  const y = tall ? 0.7 : low ? 0.42 : 0.5;

  addPart(car, new THREE.BoxGeometry(4.1, 0.48, 1.9), paint, 0, y, 0);
  addPart(car, new THREE.BoxGeometry(3.7, 0.13, 1.84), paint, 0, y + 0.27, 0);
  const cockpit = addPart(car, new THREE.BoxGeometry(tall ? 2.5 : 2.2, tall ? 0.86 : 0.58, 1.47), glass, -0.2, y + (tall ? 0.74 : 0.56), 0);
  cockpit.castShadow = false;
  addPart(car, new THREE.BoxGeometry(0.09, 0.08, 1.65), dark, 1.91, y - 0.08, 0);
  addPart(car, new THREE.BoxGeometry(0.09, 0.08, 1.65), dark, -1.91, y - 0.08, 0);
  for (const side of [-1, 1]) {
    for (const axle of [-1.32, 1.32]) {
      const tire = addPart(car, new THREE.CylinderGeometry(0.43, 0.43, 0.27, 24), dark, axle, 0.43, side * 0.96);
      tire.rotation.x = Math.PI / 2;
      const rim = addPart(car, new THREE.CylinderGeometry(0.24, 0.24, 0.284, 16), chrome, axle, 0.43, side * 0.96);
      rim.rotation.x = Math.PI / 2;
    }
  }
  for (const side of [-0.63, 0.63]) {
    addPart(car, new THREE.BoxGeometry(0.045, 0.14, 0.36), lights, 2.055, y + 0.09, side);
    addPart(car, new THREE.BoxGeometry(0.045, 0.13, 0.38), rearLights, -2.055, y + 0.09, side);
  }
  if (low) {
    addPart(car, new THREE.BoxGeometry(0.17, 0.06, 2.1), paint, -1.64, y + 0.55, 0);
    for (const side of [-0.65, 0.65]) addPart(car, new THREE.BoxGeometry(0.12, 0.44, 0.1), dark, -1.58, y + 0.32, side);
  }
  return car;
}

function disposeGroup(group) {
  group.traverse(obj => {
    if (!obj.isMesh) return;
    obj.geometry?.dispose();
    (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => {
      if (!m) return;
      for (const key of ['map', 'normalMap', 'metalnessMap', 'roughnessMap', 'emissiveMap']) m[key]?.dispose();
      m.dispose();
    });
  });
}
function escapeText(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function closeViewer() {
  if (!session) return;
  session.closed = true;
  cancelAnimationFrame(session.frame);
  session.resizeObserver.disconnect();
  session.controls.dispose();
  disposeGroup(session.model);
  session.renderer.dispose();
  session.renderer.forceContextLoss();
  session.element?.remove();
  session = null;
}

const MESH_DB='diecast_garage_catalog_v1',MESH_STORE='meshes3d';
function meshDatabase(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(MESH_DB,3);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('releases'))db.createObjectStore('releases',{keyPath:'release_id'});if(!db.objectStoreNames.contains('wiki_packs'))db.createObjectStore('wiki_packs',{keyPath:'pack_id'});if(!db.objectStoreNames.contains(MESH_STORE))db.createObjectStore(MESH_STORE,{keyPath:'release_id'})};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('Nie udało się otworzyć magazynu 3D'));
  });
}
async function readSavedMesh(id){
  const db=await meshDatabase();
  try{return await new Promise((resolve,reject)=>{
    const req=db.transaction(MESH_STORE,'readonly').objectStore(MESH_STORE).get(id);
    req.onsuccess=()=>resolve(req.result||null);
    req.onerror=()=>reject(req.error);
  })}finally{db.close()}
}
async function storeMesh(id,file){
  const db=await meshDatabase();
  try{await new Promise((resolve,reject)=>{
    const tx=db.transaction(MESH_STORE,'readwrite');
    tx.objectStore(MESH_STORE).put({release_id:id,file:new Blob([file],{type:'model/gltf-binary'}),filename:file.name||'model.glb',saved_at:new Date().toISOString()});
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Brak miejsca na zapis 3D'));
  })}finally{db.close()}
}
async function deleteSavedMesh(id){
  const db=await meshDatabase();
  try{await new Promise((resolve,reject)=>{
    const tx=db.transaction(MESH_STORE,'readwrite');
    tx.objectStore(MESH_STORE).delete(id);
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  })}finally{db.close()}
}

export function openViewer(model, root) {
  closeViewer();
  const gallery = Array.isArray(model.garageCars) ? model.garageCars : null;
  const releaseId = gallery ? '' : String(model.release_id||model.custom_id||'');
  const name = gallery ? 'Twoja kolekcja' : (model.canonical_name || model.model_name_as_source || 'Samochód');
  root.innerHTML = `<div class="modalback" id="dg3dBackdrop">
    <div class="modal dg3d-modal" role="dialog" aria-modal="true" aria-label="Podgląd 3D">
      <div class="modalhead"><h3>Garaż 3D · ${escapeText(name)}</h3><button class="btn" id="dg3dClose" aria-label="Zamknij">✕</button></div>
      <div id="dg3dStage" class="dg3d-stage" role="img" aria-label="Obracany podgląd trójwymiarowy samochodu"></div>
      <div class="dg3d-controls">
        <button class="btn" id="dg3dReset">↻ Reset widoku</button>
        <label class="btn dg3d-upload" style="${gallery ? 'display:none' : ''}">↑ Wczytaj i zapisz GLB<input type="file" id="dg3dFile" accept=".glb,model/gltf-binary" hidden></label>
        ${!gallery&&releaseId ? '<button class="btn" id="dg3dDelete">Usuń zapisany model 3D</button>' : ''}
      </div>
      <p class="notice" id="dg3dNotice">${gallery ? 'Trzy strefy: Supercars, Racing, Pozostałe. Modele są uproszczonymi wizualizacjami 3D, nie wiernymi replikami Hot Wheels. Pokazujemy maksymalnie 12 egzemplarzy naraz.' : 'To interaktywna poglądowa sylwetka 3D, a nie wierny model tego konkretnego Hot Wheels. Przeciągnij palcem/myszką, aby obracać, i użyj gestu szczypania lub kółka, aby przybliżać. Własne pliki .glb zapisują się wyłącznie na tym urządzeniu (bez synchronizacji chmurowej).'}</p>
      ${gallery ? '<div class="dg3d-controls"><button class="btn" id="dg3dPrev">← Poprzednie auta</button><span id="dg3dPageLabel" class="meta"></span><button class="btn" id="dg3dNext">Następne auta →</button></div><div id="dg3dCars" class="meta"></div>' : ''}
    </div></div>`;
  const stage = root.querySelector('#dg3dStage');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#10141b');
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  const startPosition = gallery ? [18, 12, 19] : [6.4, 4.5, 6.6];
  camera.position.set(...startPosition);
  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight('#d8e6ff', '#384450', 2.6));
  const sun = new THREE.DirectionalLight('#fff4e7', 3.2);
  sun.position.set(5, 9, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024,1024);
  scene.add(sun);
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(gallery ? 20 : 7, 64),
    new THREE.MeshStandardMaterial({color: '#262b36', roughness: 0.9, metalness: 0.08})
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);
  const grid = new THREE.GridHelper(gallery ? 35 : 11, 28, '#3f4856', '#2b303c');
  grid.position.y = -0.013;
  scene.add(grid);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = gallery ? 8 : 3.2;
  controls.maxDistance = gallery ? 45 : 16;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.target.set(0,gallery ? 0 : 0.65,0);
  controls.update();
  const modelGroup = new THREE.Group();
  let active = gallery ? null : createCar(bodyColor(model.body_color || model.color_variant), name);
  if (active) modelGroup.add(active);
  scene.add(modelGroup);
  if (gallery) {
    let galleryPage = 0;
    const zones = [
      {name:'SUPERCARS', filter:m=>m.vehicle_class==='supercar_hypercar', color:'#d43542'},
      {name:'RACING', filter:m=>m.vehicle_class==='racing', color:'#3878c7'},
      {name:'POZOSTAŁE', filter:m=>!['supercar_hypercar','racing'].includes(m.vehicle_class),color:'#479b7b'},
    ];
    function label(text,color) {
      const canvas = document.createElement('canvas');canvas.width=512;canvas.height=100;
      const context=canvas.getContext('2d');
      context.fillStyle=color;context.fillRect(0,0,512,100);
      context.fillStyle='#ffffff';context.font='bold 38px sans-serif';context.textAlign='center';
      context.fillText(text,256,62);
      const texture=new THREE.CanvasTexture(canvas);
      return new THREE.Mesh(new THREE.PlaneGeometry(3.8,0.78),new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide}));
    }
    function showPage(page) {
      for (const child of [...modelGroup.children]) {modelGroup.remove(child);disposeGroup(child)}
      const buckets=zones.map(zone=>gallery.filter(zone.filter));
      const pages=Math.max(1,...buckets.map(items=>Math.ceil(items.length/4)));
      galleryPage=Math.min(Math.max(0,page),pages-1);
      const names=[];
      for (let z=0;z<3;z++) {
        const zone=zones[z],zoneX=(z-1)*8;
        const platform=addPart(modelGroup,new THREE.BoxGeometry(6.9,0.15,10.8),zone.color,zoneX,0.04,0,{metalness:0.25,roughness:0.6});
        platform.receiveShadow=true;
        const title=label(zone.name,zone.color);title.position.set(zoneX,1.0,-5.4);modelGroup.add(title);
        const cars=buckets[z].slice(galleryPage*4,(galleryPage+1)*4);
        cars.forEach((item,i)=>{
          const car=createCar(bodyColor(item.body_color||item.color_variant),item.canonical_name||item.model_name_as_source);
          const scale=0.56;car.scale.setScalar(scale);car.position.set(zoneX,0.22,(i-1.5)*2.7);
          modelGroup.add(car);
          names.push(item.canonical_name||item.model_name_as_source||'Model');
        });
      }
      root.querySelector('#dg3dPageLabel').textContent=(galleryPage+1)+' / '+pages+' · '+gallery.length+' egz.';
      root.querySelector('#dg3dCars').textContent='Widoczne modele: '+(names.join(' • ')||'Brak samochodów. Dodaj model do garażu.');
      root.querySelector('#dg3dPrev').disabled=galleryPage===0;
      root.querySelector('#dg3dNext').disabled=galleryPage>=pages-1;
    }
    root.querySelector('#dg3dPrev').addEventListener('click',()=>showPage(galleryPage-1));
    root.querySelector('#dg3dNext').addEventListener('click',()=>showPage(galleryPage+1));
    showPage(0);
  }
  const resizeObserver = new ResizeObserver(() => {
    if (!stage.isConnected) return;
    const width = Math.max(200, stage.clientWidth);
    renderer.setSize(width, Math.max(260, Math.round(width * 0.64)), false);
    camera.aspect = width / renderer.domElement.clientHeight;
    camera.updateProjectionMatrix();
  });
  resizeObserver.observe(stage);
  const state = {closed:false, frame:0, renderer, controls, resizeObserver, model:modelGroup, element:stage};
  session = state;
  function frame() {
    if (state.closed || !stage.isConnected) return;
    state.frame = requestAnimationFrame(frame);
    controls.update();
    renderer.render(scene,camera);
  }
  frame();
  const close = () => { closeViewer(); root.innerHTML = ''; };
  root.querySelector('#dg3dClose').addEventListener('click', close);
  root.querySelector('#dg3dBackdrop').addEventListener('click', e => {if(e.target.id==='dg3dBackdrop')close()});
  root.querySelector('#dg3dReset').addEventListener('click', () => {
    camera.position.set(...startPosition); controls.target.set(0,gallery ? 0 : 0.65,0);controls.update();
  });
  if (!gallery) {
    const notice=root.querySelector('#dg3dNotice');
    let uploadSequence=0;
    async function loadBlob(file,saveToDevice=false) {
      const sequence=++uploadSequence;
      const url=URL.createObjectURL(file);
      const loader=new GLTFLoader();
      notice.textContent='Wczytywanie modelu GLB…';
      loader.load(url,async gltf=>{
        URL.revokeObjectURL(url);
        if(state.closed||sequence!==uploadSequence){disposeGroup(gltf.scene);return}
        const mesh=gltf.scene;
        const bounds=new THREE.Box3().setFromObject(mesh);
        const size=bounds.getSize(new THREE.Vector3());
        if(!Number.isFinite(size.x)||Math.max(size.x,size.y,size.z)<=0){disposeGroup(mesh);notice.textContent='Model GLB nie zawiera widocznej geometrii.';return}
        mesh.scale.multiplyScalar(4/Math.max(size.x,size.y,size.z));
        const center=new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3());
        mesh.position.sub(center);mesh.position.y+=0.55;
        modelGroup.remove(active);disposeGroup(active);
        active=mesh;modelGroup.add(active);
        notice.textContent='Wyświetlany jest własny model GLB (zapis lokalny na tym urządzeniu).';
        if(saveToDevice&&releaseId) {
          try{await storeMesh(releaseId,file);if(!state.closed)notice.textContent='Zapisano własny model 3D do tego wydania na tym urządzeniu.'}
          catch(error){if(!state.closed)notice.textContent='Model działa w podglądzie, ale nie udało się go zachować: '+String(error.message||error)}
        }
      },undefined,error=>{URL.revokeObjectURL(url);if(!state.closed&&sequence===uploadSequence)notice.textContent='Błąd pliku GLB: '+String(error?.message||'nieznany błąd')});
    }
    root.querySelector('#dg3dFile').addEventListener('change',event=>{
      const file=event.target.files?.[0];if(!file)return;
      if(!/\.glb$/i.test(file.name)||file.size>25*1024*1024){notice.textContent='Wybierz plik .glb do 25 MB.';return}
      loadBlob(file,true);
    });
    const deleteButton=root.querySelector('#dg3dDelete');
    deleteButton?.addEventListener('click',async()=>{
      try{await deleteSavedMesh(releaseId);if(!state.closed){uploadSequence++;modelGroup.remove(active);disposeGroup(active);active=createCar(bodyColor(model.body_color||model.color_variant),name);modelGroup.add(active);notice.textContent='Usunięto zapisany model GLB. Przywrócono poglądową sylwetkę.'}}
      catch(error){if(!state.closed)notice.textContent='Nie udało się usunąć modelu: '+String(error.message||error)}
    });
    if(releaseId)readSavedMesh(releaseId).then(record=>{
      if(!state.closed&&record?.file)loadBlob(record.file,false);
    }).catch(error=>console.warn('Saved 3D model:',error));
  }
}
