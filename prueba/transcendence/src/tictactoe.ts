//add library

public static CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
  const scene = new BABYLON.Scene(engine);
  const manager = new BABYLON.GUI.GUI3DManager(scene);

//BACKGROUD
// const background = new BABYLON.Layer('background','space.jpg', scene, true);

// LIGHTS
  const light = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
  // light.intensity = 0.5; // Máxima iluminación
  // light.groundColor = new BABYLON.Color3(1, 1, 1); // Ilumina todo por igual


// CAMERA
  const camera = new BABYLON.ArcRotateCamera('camera', 0, 0, 10, new BABYLON.Vector3(0, 0, 0), scene); //camara
  camera.attachControl(true);
  camera.setPosition(new BABYLON.Vector3(0, 0, -15));
  camera.lowerBetaLimit = Math.PI / 4; //limite movimiento arriba
  camera.upperBetaLimit = Math.PI / 1.5; //limite movimiento abajo
  camera.upperAlphaLimit = -Math.PI / 4; //limite movimiento derecha
  camera.lowerAlphaLimit = -Math.PI / 1.5; //limite movimiento izquierda
  camera.lowerRadiusLimit = 2; //zoom maximo
  camera.upperRadiusLimit = 40; //zoom minimo

  // VARIABLES
  var frameSize = 12;
  var framethick = 0.4;
  var framePos = 2;
  var butSize = 3;
  var butPos = 4;


  // FRAME
  const horUpframe = BABYLON.MeshBuilder.CreateBox('horUpframe',
  {
      width: frameSize,
      height: framethick,
      depth: framethick
  }, scene);
  horUpframe.position.y = framePos;

  const horDownframe = BABYLON.MeshBuilder.CreateBox('horDownframe',
  {
      width: frameSize,
      height: framethick,
      depth: framethick
  }, scene);
  horDownframe.position.y = -framePos;

  const verLeftframe = BABYLON.MeshBuilder.CreateBox('verLeftframe',
  {
      height: frameSize,
      width: framethick,
      depth: framethick
  }, scene);
  verLeftframe.position.x = -framePos;

  const verRightframe = BABYLON.MeshBuilder.CreateBox('verRightframe',
  {
      height: frameSize,
      width: framethick,
      depth: framethick
  }, scene);
  verRightframe.position.x = framePos;

  // BUTTONS
  const buttonUL = new BABYLON.GUI.HolographicButton("buttonUL");
  manager.addControl(buttonUL);
  buttonUL.text = "buttonUL";
  buttonUL.scaling = new BABYLON.Vector3(butSize, butSize, 1);
  buttonUL.position = new BABYLON.Vector3(-butPos, butPos, 0);

  const buttonUC = new BABYLON.GUI.HolographicButton("buttonUC");
  manager.addControl(buttonUC);
  buttonUC.text = "buttonUC";
  buttonUC.scaling = new BABYLON.Vector3(butSize, butSize, 1);
  buttonUC.position = new BABYLON.Vector3(0, butPos, 0);

  const buttonUR = new BABYLON.GUI.HolographicButton("buttonUR");
  manager.addControl(buttonUR);
  buttonUR.text = "buttonUR";
  buttonUR.scaling = new BABYLON.Vector3(butSize, butSize, 1);
  buttonUR.position = new BABYLON.Vector3(butPos, butPos, 0);

  const buttonCL = new BABYLON.GUI.HolographicButton("buttonCL");
  manager.addControl(buttonCL);
  buttonCL.text = "buttonCL";
  buttonCL.scaling = new BABYLON.Vector3(butSize, butSize, 1);
  buttonCL.position = new BABYLON.Vector3(-butPos, 0, 0);

  const buttonCC = new BABYLON.GUI.HolographicButton("buttonCC");
  manager.addControl(buttonCC);
  buttonCC.text = "buttonCC";
  buttonCC.scaling = new BABYLON.Vector3(butSize, butSize, 1);

  const buttonCR = new BABYLON.GUI.HolographicButton("buttonCR");
  manager.addControl(buttonCR);
  buttonCR.text = "buttonCR";
  buttonCR.scaling = new BABYLON.Vector3(butSize, butSize, 1);
  buttonCR.position = new BABYLON.Vector3(butPos, 0, 0);

  const buttonDL = new BABYLON.GUI.HolographicButton("buttonDL");
  manager.addControl(buttonDL);
  buttonDL.text = "buttonDL";
  buttonDL.scaling = new BABYLON.Vector3(butSize, butSize, 1);
  buttonDL.position = new BABYLON.Vector3(-butPos, -butPos, 0);

  const buttonDC = new BABYLON.GUI.HolographicButton("buttonDC");
  manager.addControl(buttonDC);
  buttonDC.text = "buttonDC";
  buttonDC.scaling = new BABYLON.Vector3(butSize, butSize, 1);
  buttonDC.position = new BABYLON.Vector3(0, -butPos, 0);

  const buttonDR = new BABYLON.GUI.HolographicButton("buttonDR");
  manager.addControl(buttonDR);
  buttonDR.text = "buttonDR";
  buttonDR.scaling = new BABYLON.Vector3(butSize, butSize, 1);
  buttonDR.position = new BABYLON.Vector3(butPos, -butPos, 0);

  const circle = BABYLON.MeshBuilder.CreateTorus('circle',
  {
      diameter: butSize / 1.5,
      thickness: butSize / 5,
      tessellation: 30
  }, scene);
  circle.rotation.x = Math.PI / 2;
  const circleMat = new BABYLON.StandardMaterial('circleMat', scene);
  circleMat.diffuseColor = new BABYLON.Color3(3, 0, 0);
  // circleMat.wireframe = true;
  circle.material = circleMat;
  circle.isVisible = false;

  buttonUL.onPointerUpObservable.add(() => {
      const circlePush = circle.clone("circleClone");
      circlePush.position = new BABYLON.Vector3(-butPos, butPos ,0);
      circlePush.isVisible = true;
      buttonUL.dispose();
  });
  buttonUC.onPointerUpObservable.add(() => {
      const circlePush = circle.clone("circleClone");
      circlePush.position = new BABYLON.Vector3(0, butPos ,0);
      circlePush.isVisible = true;
      buttonUC.dispose();
  });

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);

  return scene;
}
