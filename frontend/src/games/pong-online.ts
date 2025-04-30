import * as BABYLON from '@babylonjs/core'
import earcut from "earcut";
import { reactive } from 'vue';
import { createGame } from "../api";

(window as any).earcut = earcut;

export const puntuation = reactive({
    pl: 0,
    pr: 0,
});

export const jugadores = reactive({
    p1: "...",
    p2: "...",
});

let gameState = 'waiting'; // Posibles estados: 'waiting', 'playing', 'gameOver'
let username = localStorage.getItem("username") || "";
let maxscore = 5; //Máxima puntuación para detener el juego

export default function initPong(game: string, socket: WebSocket) {

    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;  //lugar donde se renderiza

    const engine = new BABYLON.Engine(canvas); //motor 3d BABYLON

    var inputMap: { [key: string]: boolean } = {};  // Mapea teclas a valores booleanos
    window.addEventListener("keydown", function (evt) {
        inputMap[evt.key] = true;  // Marca la tecla como presionada
    });
    window.addEventListener("keyup", function (evt) {
        inputMap[evt.key] = false;  // Marca la tecla como liberada
    });

    const CreateScene = function ()    //funcion de la escena donde se crea todo
    {
        const scene = new BABYLON.Scene(engine);

        let opponentId = "";
        let playerId = "";        
        let ball = { x: 0.0, y: 0.0, dx: 0.0, dy: 0.0 };
        let playerPaddle: BABYLON.Mesh;
        let opponentPaddle: BABYLON.Mesh;
        
        //socket.addEventListener('open', () => {
        //    console.log('Connected to server');            
        //});
    
        socket.addEventListener('message', event => {
            const data = JSON.parse(event.data);
            if (data.type === 'playerId') {
                playerId = data.id;                
                if (game === "new") {
                    console.log('Nueva partida');
                    console.log(username);
                    socket.send(JSON.stringify({ type: 'newGame', game: 'pong', player: username }));
                    //@ts-ignore
                    playerPaddle = scene.getMeshByName("paddle1");
                    //@ts-ignore
                    opponentPaddle = scene.getMeshByName("paddle2");
                    jugadores.p1 = username;
                } else {
                    console.log('Partida:', game);
                    console.log(username);
                    socket.send(JSON.stringify({ type: 'joinGame', game: 'pong', id: game, player: username }));
                    //@ts-ignore
                    playerPaddle = scene.getMeshByName("paddle2");
                    //@ts-ignore
                    opponentPaddle = scene.getMeshByName("paddle1");
                    jugadores.p2 = username;
                }
            } else if (data.type === 'gameId') {
                game = data.id;            
            } else if (data.type === 'newPlayer') {
                gameState = 'playing';
                opponentId = data.id;
                console.log(opponentPaddle.name);
                if (opponentPaddle.name === 'paddle1') {
                    jugadores.p1 = data.name;
                } else {
                    jugadores.p2 = data.name;
                }
                console.log("Nuevo jugador");
                console.log(data.name);
            } else if (data.type === 'opponentMove') {
                console.log("Movimiento del oponente");
                if(opponentPaddle){
                    opponentPaddle.position.y = data.x;
                }            
            } else if (data.type === 'state') {
                ball = data.ball;
            } else if(data.type === 'scoreUpdate'){
                if(data.playerId === playerId){
                    puntuation.pl = data.score
                }else{
                    puntuation.pr = data.score;
                }
        
            }
        });

        //socket.addEventListener('error', (error) => {
        //    console.error('WebSocket Error:', error);
        //});
        
        //socket.addEventListener('close', () => {
        //    console.log('Websocket closed');
        //});

        //BACKGROUD
        // @ts-ignore
        const background = new BABYLON.Layer('background', 'space.jpg', scene, true);

        // LIGHTS
        const light = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.5; // Máxima iluminación
        light.groundColor = new BABYLON.Color3(1, 1, 1); // Ilumina todo por igual
        // @ts-ignore
        const lightCenter = new BABYLON.PointLight("lightCenter", new BABYLON.Vector3(0, 0, 0), scene);

        // CAMERA
        const camera = new BABYLON.ArcRotateCamera('camera', 0, 0, 10, new BABYLON.Vector3(0, 0, 0), scene); //camara
        // camera.attachControl(true);	//comentado para que no se mueva
        camera.setPosition(new BABYLON.Vector3(0, 0, -15));
        camera.lowerBetaLimit = Math.PI / 4; //limite movimiento arriba
        camera.upperBetaLimit = Math.PI / 1.5; //limite movimiento abajo
        camera.upperAlphaLimit = -Math.PI / 4; //limite movimiento derecha
        camera.lowerAlphaLimit = -Math.PI / 1.5; //limite movimiento izquierda
        camera.lowerRadiusLimit = 2; //zoom maximo
        camera.upperRadiusLimit = 40; //zoom minimo

        // MESH VARS
        var ballSpeed = 0.10;
        var ballInitDir = new BABYLON.Vector3(0, 0, 0);
        var sphereRadius = 0.5;
        var paddleWidth = 0.5;
        var paddleHeight = 2;
        var paddleDepth = 1;
        var paddleDistance = 4;
        var paddleSpeed = 0.15;
        var maxUpDown = paddleDistance / 2;

        // GAME FRAME
        const frameUp = BABYLON.MeshBuilder.CreateBox('frameUp', {
            width: paddleDistance * 2 + paddleWidth * 2,
            height: paddleWidth,
            //  depth: paddleDepth
        }, scene);
        frameUp.position.y = maxUpDown + paddleHeight / 2 + sphereRadius + paddleWidth / 2;

        const frameDown = BABYLON.MeshBuilder.CreateBox('frameDown', {
            width: paddleDistance * 2 + paddleWidth * 2,
            height: paddleWidth,
            //  depth: paddleDepth
        }, scene);
        frameDown.position.y = -(maxUpDown + paddleHeight / 2 + sphereRadius + paddleWidth / 2);

        // BALL
        const sphere = BABYLON.MeshBuilder.CreateSphere('mysphere', {
            segments: 6,
            diameter: sphereRadius * 2
        }, scene);
        const sphereMaterial = new BABYLON.StandardMaterial('speheMat', scene);
        sphereMaterial.diffuseColor = new BABYLON.Color3(1, 0, 1); //color del objeto
        // scene.ambientColor = new BABYLON.Color3(0, 0, 1);
        sphereMaterial.ambientColor = new BABYLON.Color3();
        sphereMaterial.emissiveColor = new BABYLON.Color3(1, 0, 0); //color que emite
        sphereMaterial.wireframe = true;
        sphere.material = sphereMaterial;

        // PADDLES
        const paddle1 = BABYLON.MeshBuilder.CreateBox('paddle1', {
            width: paddleWidth,
            height: paddleHeight,
            depth: paddleDepth
        }, scene);

        paddle1.position = new BABYLON.Vector3(-paddleDistance, 0, 0);
        const paddle1Mat = new BABYLON.StandardMaterial('pad1Mat', scene);
        paddle1Mat.diffuseColor = new BABYLON.Color3(0, 1, 1);
        paddle1Mat.emissiveColor = new BABYLON.Color3(0, 0, 1);
        paddle1.material = paddle1Mat;

        const paddle2 = BABYLON.MeshBuilder.CreateBox('paddle2', {
            width: paddleWidth,
            height: paddleHeight,
            depth: paddleDepth
        }, scene);
        paddle2.position = new BABYLON.Vector3(paddleDistance, 0, 0);
        const paddle2Mat = new BABYLON.StandardMaterial('pad2Mat', scene);
        paddle2Mat.diffuseColor = new BABYLON.Color3(0, 1, 0);
        paddle2Mat.emissiveColor = new BABYLON.Color3(1, 0, 0);
        paddle2.material = paddle2Mat;

        // TEXT
        async function loadFontData() {
            const response = await fetch('/Knewave_Regular.json');
            const fontData = await response.json();
            const text = BABYLON.MeshBuilder.CreateText('', 'THE PONG', fontData, {
                size: 2,
                depth: 0.5
            });
            if (text)
                text.position = new BABYLON.Vector3(0, -1, 3);
            return fontData;
        }
        loadFontData();

        // RESET BALL
        function resetBall() {
            sphere.position.x = 0.0;
            sphere.position.y = 0.0;
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
            if (gameState === 'playing' && socket.readyState === WebSocket.OPEN) {
                //console.log(ball.x);
                //console.log(sphere.position.x);
                //console.log(ballInitDir.x);
                if (sphere.position.x === 0.0 && sphere.position.y === 0.0) {
                    socket.send(JSON.stringify({
                        type: 'ballUpdate',
                        gameId: game,
                        ball: {dx: ballInitDir.x, dy: ballInitDir.y}
                    }));
                }
                sphere.position.x = ball.x;
                sphere.position.y = ball.y;
                //sphere.position.x += ballInitDir.x;
				//sphere.position.y += ballInitDir.y;
				sphere.rotation.x += ballInitDir.x;
				sphere.rotation.y += ballInitDir.y;
        
                // collisions with paddles
				if (sphere.intersectsMesh(paddle2, true) && ballInitDir.x > 0) { //false for less precission, more efficiency 
					ballInitDir.x *= -1;
                    socket.send(JSON.stringify({
                        type: 'ballUpdate',
                        gameId: game,
                        ball: {dx: ballInitDir.x, dy: ballInitDir.y}
                    }));
				}
				if (sphere.intersectsMesh(paddle1, true) && ballInitDir.x < 0) {
					ballInitDir.x *= -1;
                    socket.send(JSON.stringify({
                        type: 'ballUpdate',
                        gameId: game,
                        ball: {dx: ballInitDir.x, dy: ballInitDir.y}
                    }));
				}

				// collisions up and down
                //const nextY = sphere.position.y + ballInitDir.y;
				//if (nextY >= maxUpDown + paddleHeight / 2) {
                if (sphere.intersectsMesh(frameUp, true) && ballInitDir.y > 0) {
					ballInitDir.y *= -1;
                    socket.send(JSON.stringify({
                        type: 'ballUpdate',
                        gameId: game,
                        ball: {dx: ballInitDir.x, dy: ballInitDir.y}
                    }));
                }
				//if (nextY <= -maxUpDown - paddleHeight / 2) {
                if (sphere.intersectsMesh(frameDown, true) && ballInitDir.y < 0) {
					ballInitDir.y *= -1;
                    socket.send(JSON.stringify({
                        type: 'ballUpdate',
                        gameId: game,
                        ball: {dx: ballInitDir.x, dy: ballInitDir.y}
                    }));
                }

                // out of table
                if (sphere.position.x >= paddleDistance + paddleWidth / 2) {
                    socket.send(JSON.stringify({ type: 'score', gameId: game }));
                    puntuation.pl++;
                    resetBall();
                    socket.send(JSON.stringify({
                        type: 'ballReset',
                        gameId: game,
                        ball: { x: 0.0, y: 0.0, dx: ballInitDir.x, dy: ballInitDir.y }
                    }));                    
                }
                if (sphere.position.x <= -paddleDistance - paddleWidth / 2)
                {
                    socket.send(JSON.stringify({ type: 'score', gameId: game }));
                    puntuation.pr++;                    
                    resetBall();
                    socket.send(JSON.stringify({
                        type: 'ballReset',
                        gameId: game,
                        ball: { x: 0.0, y: 0.0, dx: ballInitDir.x, dy: ballInitDir.y }
                    }));
                }
                
                // Enviar controles de las paletas al servidor
                if (inputMap['ArrowUp'] && playerPaddle.position.y < maxUpDown + sphereRadius / 2 && !playerPaddle.intersectsMesh(sphere, true)) {                    
                    playerPaddle.position.y += paddleSpeed;
                    socket.send(JSON.stringify({ type: 'opponentMove', gameId: game, x: playerPaddle.position.y }));
                }
                if (inputMap['ArrowDown'] && playerPaddle.position.y > -maxUpDown - sphereRadius / 2 && !playerPaddle.intersectsMesh(sphere, true)) {                    
                    playerPaddle.position.y -= paddleSpeed;
                    socket.send(JSON.stringify({ type: 'opponentMove', gameId: game, x: playerPaddle.position.y }));
                }
        
                // Enviar puntuación final al servidor
                if (puntuation.pl >= maxscore || puntuation.pr >= maxscore) {
                    socket.send(JSON.stringify({ type: 'gameOver', gameId: game }));
                    gameState = 'gameOver';
                    // Guardar partida
                    //createGame("pong",username,"Invitado",puntuation.pl,puntuation.pr);
                }
            }
        });
        return scene;
    }
    
    const scene = CreateScene();
    
    engine.runRenderLoop(function ()   //loop
    {
        scene.render();
    });

    window.addEventListener('resize', function ()  //evita que los objetos 3d se deformen
    {
        engine.resize();
    });
    return { scene, engine };
}
