import * as BABYLON from '@babylonjs/core'

const canvas = document.getElementById('renderCanvas'); //lugar donde se renderiza

const engine = new BABYLON.Engine(canvas); //motor 3d BABYLON

const CreateScene = async function()    //funcion de la escena donde se crea todo
{
  const scene = new BABYLON.Scene(engine);

  scene.createDefaultCameraOrLight(true, false, true); //camara
  // const box = new BABYLON.MeshBuilder.CreateBox('myBox',
  //   {
  //     size: 0.1,
  //     width: 2,
  //     height: 0.05,
  //     depth: 0.5,
  //     faceColors:
  //     [
  //       new BABYLON.Color4(1, 0, 0, 1),
  //       BABYLON.Color3.Green()
  //     ]
  //   }/*,secene*/);  //cubo
  // const sphere = new BABYLON.MeshBuilder.CreateSphere('mysphere',
  // {
  //   segments: 50,
  //   diameter: 0.3,
  //   diameterY: 0.4
  // }, scene);

  // const ground = new BABYLON.MeshBuilder.CreateGround('',  //plano
  // {
  //   height: 5,
  //   width: 5,
  //   subdivisions: 5,
  //   subdivisionsX: 10
  // })
  // ground.material = new BABYLON.StandardMaterial();
  // ground.material.wireframe = true;

  // const groundFromHM = new BABYLON.MeshBuilder.CreateGroundFromHeightMap('', '/heightmap.png',
  //   {
  //     height: 10,
  //     width: 10,
  //     subdivisions: 50,
  //     // maxHeight: 2
  //   });  //mapa de altitud
  //   groundFromHM.material = new BABYLON.StandardMaterial();
  //   groundFromHM.material.wireframe = true;
    
    const fontData = await(await fetch('/Knewave_Regular.json')).json();
    const text = BABYLON.MeshBuilder.CreateText('', 'THE PONG', fontData,
      {
        size: 2,
        depth: 0.5
      });
    return scene;
  }

const scene = await CreateScene();

engine.runRenderLoop(function()   //loop
{
  scene.render();
});

window.addEventListener('resize', function()  //evita que los objetos 3d se deformen
{
  engine.resize();
});