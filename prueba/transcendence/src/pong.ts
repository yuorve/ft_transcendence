import * as BABYLON from '@babylonjs/core'

const canvas = document.getElementById('renderCanvas')  as HTMLCanvasElement;  //lugar donde se renderiza

const engine = new BABYLON.Engine(canvas); //motor 3d BABYLON

var inputMap: { [key: string]: boolean } = {};  // Mapea teclas a valores booleanos
window.addEventListener("keydown", function(evt) {
  inputMap[evt.key] = true;  // Marca la tecla como presionada
});
window.addEventListener("keyup", function(evt) {
  inputMap[evt.key] = false;  // Marca la tecla como liberada
});

const CreateScene = function()    //funcion de la escena donde se crea todo
{
  const scene = new BABYLON.Scene(engine);

  //BACKGROUD
  const background = new BABYLON.Layer('background','space.jpg', scene, true);

	// LIGHTS

  scene.createDefaultLight();  //luz

	// CAMERA

  const camera = new BABYLON.ArcRotateCamera('camera', 0, 0, 10, new BABYLON.Vector3(0, 0, 0), scene); //camara
  camera.attachControl(true);
  camera.setPosition(new BABYLON.Vector3(0, 0, -15));
  camera.lowerBetaLimit = Math.PI / 4;  //limite movimiento arriba
  camera.upperBetaLimit = Math.PI / 1.5;  //limite movimiento abajo
  camera.upperAlphaLimit = -Math.PI / 4;  //limite movimiento derecha
  camera.lowerAlphaLimit = -Math.PI / 1.5;  //limite movimiento izquierda
  camera.lowerRadiusLimit = 2; //zoom maximo
  camera.upperRadiusLimit = 40; //zoom minimo
  
  // MESH VARS
  
  var ballSpeed = 0.2;
  var ballInitDir = new BABYLON.Vector3(0 , 0 ,0);
  //   ballSpeed * (Math.random() > 0.5 ? 1 : -1), // ? es if y : es else
  //   ballSpeed * (Math.random() < 0.5 ? 1 : -1),
  //   0
  // );

  var sphereRadius = 0.5;
  var paddleWidth  = 0.5;
  var paddleHeight = 4;
  var paddleDepth  = 1;
  var paddleDistance = 8;
  var maxUpDown = paddleDistance / 2;

  // BALL
    const sphere = BABYLON.MeshBuilder.CreateSphere('mysphere',
    {
      segments: 15,
      diameter: sphereRadius * 2
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

    // PADDLES
    const paddle1 = BABYLON.MeshBuilder.CreateBox('paddle1',
      {
        width: paddleWidth,
        height: paddleHeight,
        depth: paddleDepth
      }, scene);
      paddle1.position = new BABYLON.Vector3(-paddleDistance, 0 ,0);

    const paddle2 = BABYLON.MeshBuilder.CreateBox('paddle2',
      {
        width: paddleWidth,
        height: paddleHeight,
        depth: paddleDepth
      }, scene);
      paddle2.position = new BABYLON.Vector3(paddleDistance, 0 ,0);


    // TEXT
    // const fontData = await(await fetch('/Knewave_Regular.json')).json();
    // const text = BABYLON.MeshBuilder.CreateText('', 'THE PONG', fontData,
    //   {
    //     size: 2,
    //     depth: 0.5
    //   });
    //   if (text)
    //     text.position.y = 1;

    // Función para reiniciar la pelota cuando se anota
    function resetBall() {
      sphere.position.x = 0;
      sphere.position.y = 0;
      // Asignar una nueva dirección aleatoria (ángulo pequeño al restar en math random)
      var angle = (Math.random()) * Math.PI / 3;
      var direction = Math.random() > 0.5 ? 1 : -1;
      ballInitDir.x = ballSpeed * direction * Math.cos(angle);
      ballInitDir.y = ballSpeed * direction * Math.sin(angle);
    }

    // INIT BALL
    resetBall();

    // MOVEMENT
    scene.onBeforeRenderObservable.add(function () {
      sphere.position.x += ballInitDir.x;
      sphere.position.y += ballInitDir.y;
      sphere.rotation.x += ballInitDir.x;
      sphere.rotation.y += ballInitDir.y;
      //collisions with paddles
      if (sphere.position.y + sphereRadius <= paddle2.position.y + paddleHeight / 2 &&
          sphere.position.y - sphereRadius >= paddle2.position.y - paddleHeight / 2 &&
          sphere.position.x + sphereRadius >= paddle2.position.x - paddleWidth)
            ballInitDir.x *= -1;
      if (sphere.position.y - sphereRadius <= paddle1.position.y + paddleHeight / 2 &&
          sphere.position.y + sphereRadius >= paddle1.position.y - paddleHeight / 2 &&
          sphere.position.x - sphereRadius <= paddle1.position.x + paddleWidth)
            ballInitDir.x *= -1;

      // collisions up and down
      if (sphere.position.y >= maxUpDown + paddleHeight / 2)
        ballInitDir.y *= -1;
      if (sphere.position.y <= -maxUpDown - paddleHeight / 2)
        ballInitDir.y *= -1;

      // out of table
      if (sphere.position.x >= paddleDistance + paddleWidth / 2)
        resetBall();
      if (sphere.position.x <= -paddleDistance - paddleWidth / 2)
        resetBall();

      // paddle controls
      if (inputMap['w'] && paddle1.position.y < maxUpDown)
        paddle1.position.y += 0.3;
      if (inputMap['s'] && paddle1.position.y > -maxUpDown)
        paddle1.position.y -= 0.3;
      if (inputMap['ArrowUp'] && paddle2.position.y < maxUpDown)
        paddle2.position.y += 0.3;
      if (inputMap['ArrowDown'] && paddle2.position.y > -maxUpDown)
        paddle2.position.y -= 0.3;
  });

    return scene;
  }

  const scene = CreateScene();

engine.runRenderLoop(function()   //loop
{
  scene.render();
});

window.addEventListener('resize', function()  //evita que los objetos 3d se deformen
{
  engine.resize();
});