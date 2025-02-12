import * as BABYLON from '@babylonjs/core'

const canvas = document.getElementById('renderCanvas')  as HTMLCanvasElement;  //lugar donde se renderiza

const engine = new BABYLON.Engine(canvas); //motor 3d BABYLON

const CreateScene = async function()    //funcion de la escena donde se crea todo
{
  const scene = new BABYLON.Scene(engine);

  // CAMERAS AND LIGHTS

  scene.createDefaultLight();  //luz
  // scene.createDefaultCameraOrLight(true, false, true); //camara y luz basicos
  // scene.createDefaultCamera();
  // const camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 5, -10), scene);  //camara
  // camera.attachControl(true); //habilita movimiento de la camara
  // camera.inputs.addMouseWheel();  //habilita zoom con la rueda del raton
  // camera.setTarget(BABYLON.Vector3.Zero()); //a donde mira la camara. Se puede poner un objeto en concreto?)

  const camera = new BABYLON.ArcRotateCamera('camera', 0, 0, 10, new BABYLON.Vector3(0, 0, 0), scene); //camara
  camera.attachControl(true);
  camera.setPosition(new BABYLON.Vector3(0, 0, -2));
  camera.lowerBetaLimit = Math.PI / 4;  //limite movimiento arriba
  camera.upperBetaLimit = Math.PI / 1.5;  //limite movimiento abajo
  camera.upperAlphaLimit = -Math.PI / 4;  //limite movimiento derecha
  camera.lowerAlphaLimit = -Math.PI / 1.5;  //limite movimiento izquierda
  camera.lowerRadiusLimit = 2; //zoom maximo
  camera.upperRadiusLimit = 40; //zoom minimo

  // MESH

  // const box = new BABYLON.MeshBuilder.CreateBox('myBox',
  //   {
  //     size: 1,
  //     // width: 2,
  //     // height: 0.05,
  //     // depth: 0.5,
  //     // faceColors:
  //     // [
  //     //   new BABYLON.Color4(1, 0, 0, 1),
  //     //   BABYLON.Color3.Green()
  //     // ]
  //     faceUV:
  //     [
  //       new BABYLON.Vector4(0, 0, 1/6, 1),
  //       new BABYLON.Vector4(1/6, 0, 2/6, 1),
  //       new BABYLON.Vector4(2/6, 0, 3/6, 1),
  //       new BABYLON.Vector4(3/6, 0, 4/6, 1),
  //       new BABYLON.Vector4(4/6, 0, 5/6, 1),
  //       new BABYLON.Vector4(5/6, 0, 1, 1)
  //     ],
  //     wrap: true  //rota las imagenes del faceUV
  //   }/*,secene*/);  //cubo
  //   const boxCatMat = new BABYLON.StandardMaterial();
  //   box.material = boxCatMat;
  //   boxCatMat.emissiveTexture = new BABYLON.Texture('cats.png');
    // box.position.x = 1;
    // box.position = new BABYLON.Vector3(-1, 0.5, 0);
    // box.rotation = new BABYLON.Vector3(Math.PI / 4, Math.PI / 4, 0);
    // box.rotation.x = Math.PI / 4;
    // box.rotation.y = Math.PI / 4;
    // box.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
    // box.scaling.y = 2;

  const sphere = BABYLON.MeshBuilder.CreateSphere('mysphere',
  {
    segments: 15,
    diameter: 0.3,
    // diameterY: 0.4
  }, scene);

  const sphereMaterial = new BABYLON.StandardMaterial();
  sphere.material = sphereMaterial;

  // sphereMaterial.diffuseTexture = new BABYLON.Texture('/HM.jpg');  //carga una textura al objeto
  // sphereMaterial.emissiveTexture = new BABYLON.Texture('/HM.jpg');  //carga una textura al objeto ocn luz propia
  sphereMaterial.diffuseColor = new BABYLON.Color3(1, 0, 1);  //color del objeto
  // sphereMaterial.specularColor = new BABYLON.Color3(1, 1, 0);   //clolor de la luz reflejada
  scene.ambientColor = new BABYLON.Color3(0, 0, 1);
  sphereMaterial.ambientColor = new BABYLON.Color3();
  sphereMaterial.emissiveColor = new BABYLON.Color3(1, 0, 0); //color que emite
  // sphereMaterial.alpha = 0.5;  //opacidad
  sphereMaterial.wireframe = true;

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
      if (text)
        text.position.y = 1;
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