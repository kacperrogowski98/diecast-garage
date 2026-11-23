import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let session = null;
// Only imported GLB assets are displayed as models. Never synthesize a generic
// vehicle as a stand-in for a specific casting or Hot Wheels release.
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
  disposeGroup(session.scene);
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

export function openViewer(model, root, cloud = null) {
  closeViewer();
  const gallery = Array.isArray(model.garageCars) ? model.garageCars : null;
  const packPreview = Boolean(gallery && model.packPreview);
  const releaseId = gallery ? '' : String(model.release_id||model.custom_id||'');
  const name = gallery ? (model.packName || 'Twoja kolekcja') : (model.canonical_name || model.model_name_as_source || 'Samochód');
  if(gallery){
    // Real individual assets are tracked by release_id. A multipack list is NOT
    // a set of verified vehicle meshes, so show an honest visual inventory.
    const entries=gallery.slice(0,60).map(item=>{
      const title=escapeText(item.canonical_name||item.model_name_as_source||'Model');
      const image=String(item.image_url||'');
      const safeImage=/^https:\/\//i.test(image)?image.replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])):'';
      return '<div class="dg3d-list-item">'+(safeImage?'<img loading="lazy" src="'+safeImage+'" alt="" onerror="this.remove()">':'')+'<span>'+title+'</span></div>';
    }).join('');
    root.innerHTML='<div class="modalback" id="dg3dBackdrop"><div class="modal dg3d-modal" role="dialog" aria-modal="true"><div class="modalhead"><h3>'+escapeText(name)+'</h3><button class="btn" id="dg3dClose" aria-label="Zamknij">✕</button></div><div class="dg3d-empty"><strong>Modele 3D nie są jeszcze dostępne dla całej kolekcji</strong><p>Nie pokazujemy już sztucznych samochodów. Podgląd właściwego modelu 3D jest dostępny po przypisaniu pliku GLB do konkretnego wydania.</p></div><div class="dg3d-list">'+entries+'</div><p class="notice">Wyświetlono '+Math.min(60,gallery.length)+' z '+gallery.length+' pozycji. To lista kolekcji, nie podgląd 3D.</p></div></div>';
    const close=()=>{root.innerHTML=''};
    root.querySelector('#dg3dClose').addEventListener('click',close);
    root.querySelector('#dg3dBackdrop').addEventListener('click',e=>{if(e.target.id==='dg3dBackdrop')close()});
    return;
  }
  root.innerHTML = `<div class="modalback" id="dg3dBackdrop">
    <div class="modal dg3d-modal" role="dialog" aria-modal="true" aria-label="Podgląd 3D">
      <div class="modalhead"><h3>Garaż 3D · ${escapeText(name)}</h3><button class="btn" id="dg3dClose" aria-label="Zamknij">✕</button></div>
      <div id="dg3dStage" class="dg3d-stage" role="img" aria-label="Obracany podgląd trójwymiarowy samochodu"></div>
      <div class="dg3d-controls">
        <button class="btn" id="dg3dReset">↻ Reset widoku</button>
        <label class="btn dg3d-upload" style="${gallery ? 'display:none' : ''}">↑ Wczytaj i zapisz GLB<input type="file" id="dg3dFile" accept=".glb,model/gltf-binary" hidden></label>
        ${!gallery&&releaseId ? '<button class="btn" id="dg3dDownload">↓ Pobierz zapisany GLB</button><button class="btn" id="dg3dDelete">Usuń zapisany model 3D</button>' : ''}
        ${!gallery&&releaseId&&cloud ? '<button class="btn" id="dg3dCloudUpload">☁ Wyślij GLB</button><button class="btn" id="dg3dCloudDownload">☁ Pobierz GLB</button>' : ''}
      </div>
      <p class="notice" id="dg3dNotice">${gallery ? (packPreview ? 'Poglądowa wizualizacja samochodów wymienionych w multipacku. Nie potwierdza kolorów ani zgodności z dokładnym wydaniem; modele 3D nie są skanami oryginalnych Hot Wheels.' : 'Trzy strefy: Supercars, Racing, Pozostałe. Modele są uproszczonymi wizualizacjami 3D, nie wiernymi replikami Hot Wheels. Pokazujemy maksymalnie 12 egzemplarzy naraz.') : 'Model 3D tego wydania nie jest jeszcze dostępny. Wczytaj prawdziwy plik GLB, żeby zobaczyć go w 3D. Nie wyświetlamy już uproszczonych samochodów zastępczych.'}</p>
      ${gallery && !packPreview ? '<div class="dg3d-controls"><button class="btn" id="dg3dPrev">← Poprzednie auta</button><span id="dg3dPageLabel" class="meta"></span><button class="btn" id="dg3dNext">Następne auta →</button></div><div id="dg3dCars" class="meta"></div>' : ''}
    </div></div>`;
  const stage = root.querySelector('#dg3dStage');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#10141b');
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  const startPosition = packPreview ? [12, 9, 14] : gallery ? [18, 12, 19] : [6.4, 4.5, 6.6];
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
  let active = null; // Never use a generic procedural car as a replacement.
  scene.add(modelGroup);
  const resizeObserver = new ResizeObserver(() => {
    if (!stage.isConnected) return;
    const width = Math.max(200, stage.clientWidth);
    renderer.setSize(width, Math.max(260, Math.round(width * 0.64)), false);
    camera.aspect = width / renderer.domElement.clientHeight;
    camera.updateProjectionMatrix();
  });
  resizeObserver.observe(stage);
  const state = {closed:false, frame:0, renderer, controls, resizeObserver, scene, model:modelGroup, element:stage};
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
        if(active){modelGroup.remove(active);disposeGroup(active)}
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
    root.querySelector('#dg3dDownload')?.addEventListener('click',async()=>{
      try {
        const saved=await readSavedMesh(releaseId);
        if(!saved?.file){notice.textContent='Nie masz jeszcze zapisanego pliku GLB dla tego wydania.';return}
        const url=URL.createObjectURL(saved.file);
        const link=document.createElement('a');
        link.href=url;
        link.download=String(saved.filename||'diecast-model.glb').replace(/[^a-z0-9._-]+/gi,'_');
        document.body.appendChild(link);link.click();link.remove();
        setTimeout(()=>URL.revokeObjectURL(url),1000);
        notice.textContent='Pobrano własny model GLB. Możesz wczytać go na innym urządzeniu.';
      } catch(error){notice.textContent='Nie udało się pobrać pliku GLB: '+String(error.message||error)}
    });
    if(cloud&&releaseId) {
      const uploadButton=root.querySelector('#dg3dCloudUpload');
      const downloadButton=root.querySelector('#dg3dCloudDownload');
      uploadButton?.addEventListener('click',async()=>{
        uploadButton.disabled=true;
        try{
          const stored=await readSavedMesh(releaseId);
          if(!stored?.file){notice.textContent='Najpierw wczytaj i zapisz własny model GLB na tym urządzeniu.';return}
          notice.textContent='Wysyłam model 3D do prywatnej chmury…';
          await cloud.upload(releaseId,stored.file);
          if(!state.closed)notice.textContent='Model GLB zapisany w prywatnej chmurze. Możesz pobrać go na drugim urządzeniu.';
        }catch(error){if(!state.closed)notice.textContent='Wysyłanie GLB: '+String(error.message||error)}
        finally{if(!state.closed)uploadButton.disabled=false}
      });
      downloadButton?.addEventListener('click',async()=>{
        if(!confirm('Pobrać model 3D z chmury? Zastąpi lokalny model GLB przypisany do tego wydania.'))return;
        downloadButton.disabled=true;
        try{
          notice.textContent='Pobieram prywatny model 3D…';
          const blob=await cloud.download(releaseId);
          if(blob.size>25*1024*1024)throw new Error('Model jest większy niż 25 MB');
          const file=new File([blob],'cloud-model.glb',{type:'model/gltf-binary'});
          await storeMesh(releaseId,file);
          if(!state.closed)loadBlob(file,false);
        }catch(error){if(!state.closed)notice.textContent='Pobieranie GLB: '+String(error.message||error)}
        finally{if(!state.closed)downloadButton.disabled=false}
      });
    }
    const deleteButton=root.querySelector('#dg3dDelete');
    deleteButton?.addEventListener('click',async()=>{
      try{await deleteSavedMesh(releaseId);if(!state.closed){uploadSequence++;if(active){modelGroup.remove(active);disposeGroup(active);active=null}notice.textContent='Usunięto zapisany GLB. Model 3D jest niedostępny do czasu wczytania nowego pliku.'}}
      catch(error){if(!state.closed)notice.textContent='Nie udało się usunąć modelu: '+String(error.message||error)}
    });
    if(releaseId)readSavedMesh(releaseId).then(record=>{
      if(!state.closed&&record?.file)loadBlob(record.file,false);
    }).catch(error=>console.warn('Saved 3D model:',error));
  }
}
