import * as BABYLON from '@babylonjs/core'
import { GUI3DManager } from "@babylonjs/gui";
import { HolographicButton } from "@babylonjs/gui";
import { createGame } from "../api";
import { reactive, ref } from 'vue';
import { useWebSocket } from '../services/websocket';

export const puntuation = reactive({
    pl: 0,
    pr: 0,
    playerTurn: 1,
    playerFigure: 1,
    gameOver: 0,
    online: 0,
});

export const matriz = ref<number[][]>([
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
]);

export default function initTicTacToe() {
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;  //lugar donde se renderiza

    const engine = new BABYLON.Engine(canvas); //motor 3d BABYLON

    const CreateScene = function () {
        const scene = new BABYLON.Scene(engine);
        const manager = new GUI3DManager(scene);

        //BACKGROUD
        // @ts-ignore
        const background = new BABYLON.Layer('background', 'space.jpg', scene, true);

        // LIGHTS
        //@ts-ignore
        const light = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
        // light.intensity = 0.7; // Máxima iluminación
        // light.groundColor = new BABYLON.Color3(1, 1, 1); // Ilumina todo por igual

        // CAMERA
        const camera = new BABYLON.ArcRotateCamera('camera', 0, 0, 10, new BABYLON.Vector3(0, 0, 0), scene); //camara
        // camera.attachControl(true);
        camera.setPosition(new BABYLON.Vector3(0, 0, -15));
        camera.lowerBetaLimit = camera.beta; //limite movimiento arriba
        camera.upperBetaLimit = camera.beta; //limite movimiento abajo
        camera.upperAlphaLimit = camera.alpha; //limite movimiento derecha
        camera.lowerAlphaLimit = camera.alpha; //limite movimiento izquierda
        camera.lowerRadiusLimit = 10; //zoom maximo
        camera.upperRadiusLimit = 40; //zoom minimo

        // VARIABLES
        var frameSize = 12;
        var framethick = 0.4;
        var framePos = 2;
        var butSize = 3;
        var butPos = 4;
        var figure = puntuation.playerFigure;

        // Initialization
        const rows = matriz.value.length;
        const cols = matriz.value[0]?.length;
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                matriz.value[i][j] = 0;
            }
        }

        //SOCKET
        const token = localStorage.getItem("token") || "";
        const { websocketState: { socket } } = useWebSocket(token || '');
        
        if (socket) {            
            socket.addEventListener('message', event => {
                const data = JSON.parse(event.data);
                console.log(data);
                if (data.type === 'opponentMove') {
                    console.log("Movimiento del otro Jugador");
                    console.log(data.x);
                    figure = (figure === 1) ? 2 : 1;
                    createFigure(buttons[data.x.i][data.x.j].position.x, buttons[data.x.i][data.x.j].position.y, 0);
                    matriz.value[data.x.i][data.x.j] = figure;                    
                    buttons[data.x.i][data.x.j].dispose();
                    puntuation.playerTurn = 1;
                    if (checkVic()) {
                        buttons.forEach((row) => {
                            row.forEach((button) => {
                                button.dispose();
                            });
                        });
                        if (figure == 1) {
                            puntuation.pl++;
                            createX(0, 0, -3, butSize);
                        } else {
                            puntuation.pr++;
                            createCircle(0, 0, -3, butSize);
                        }
                    }                    
                    figure = (figure === 1) ? 2 : 1;
                }
            });
        }

        // FRAME
        var frames: BABYLON.Mesh[] = [];

        for (let i = 0; i < 4; i++) {
            let framAux = BABYLON.MeshBuilder.CreateBox(`frame${i}`,
                {
                    width: frameSize,
                    height: framethick,
                    depth: framethick
                }, scene);
            frames[i] = framAux;
        }
        frames[0].position.y = framePos;
        frames[1].position.y = -framePos;
        frames[2].position.x = -framePos;
        frames[2].rotation.z = Math.PI / 2;
        frames[3].position.x = framePos;
        frames[3].rotation.z = Math.PI / 2;

        // FIGURES
        const circle = BABYLON.MeshBuilder.CreateTorus('circle',
            {
                diameter: butSize / 1.5,
                thickness: butSize / 5,
                tessellation: 30
            }, scene);
        circle.rotation.x = Math.PI / 2;
        const circleMat = new BABYLON.StandardMaterial('circleMat', scene);
        circleMat.diffuseColor = new BABYLON.Color3(3, 0, 0);
        circle.material = circleMat;
        circle.isVisible = false;

        const cilinder = BABYLON.MeshBuilder.CreateCapsule('cilinder',
            {
                height: butSize,
                radius: butSize / 10
            }, scene);
        cilinder.rotation.z = Math.PI / 4;
        const cilinderMat = new BABYLON.StandardMaterial('xMat', scene);
        cilinderMat.diffuseColor = new BABYLON.Color3(0, 0, 1);
        cilinder.material = cilinderMat;
        cilinder.isVisible = false;

        function createCircle(positionX: number, positionY: number, positionZ: number, scale: number) {
            const circlePush = circle.clone("circleClone");
            circlePush.position = new BABYLON.Vector3(positionX, positionY, positionZ);
            circlePush.scaling = new BABYLON.Vector3(scale, scale, scale);
            circlePush.isVisible = true;
        }

        function createX(positionX: number, positionY: number, positionZ: number, scale: number) {
            const xPush = cilinder.clone('cilinderClone');
            const xPush2 = cilinder.clone('cilinderClone2');
            xPush.rotation.z = Math.PI / 4;
            xPush2.rotation.z = -Math.PI / 4;
            xPush.position = new BABYLON.Vector3(positionX, positionY, positionZ);
            xPush2.position = new BABYLON.Vector3(positionX, positionY, positionZ);
            xPush.scaling = new BABYLON.Vector3(scale, scale, scale);
            xPush2.scaling = new BABYLON.Vector3(scale, scale, scale);
            xPush.isVisible = true;
            xPush2.isVisible = true;
        }

        function createFigure(positionX: number, positionY: number, positionZ: number) {
            if (figure == 1) {
                createX(positionX, positionY, positionZ, 1);
                //figure = 2;
            } else {
                createCircle(positionX, positionY, positionZ, 1);
                //figure = 1;
            }
        }

        // CHECK VICTORY

        function checkVic() {
            for (var auxY = 0; auxY < 3; auxY++) {
                for (var auxX = 0; auxX < 3; auxX++) {
                    if (matriz.value[auxY][auxX] != figure)
                        break;
                    else if (auxX == 2)
                        return true;
                }
            }
            for (var auxX = 0; auxX < 3; auxX++) {
                for (var auxY = 0; auxY < 3; auxY++) {
                    if (matriz.value[auxY][auxX] != figure)
                        break;
                    else if (auxY == 2)
                        return true;
                }
            }
            for (var auxX = 0, auxY = 0; auxX < 3; auxX++, auxY++) {
                if (matriz.value[auxY][auxX] != figure)
                    break;
                else if (auxY == 2)
                    return true;
            }
            for (var auxX = 0, auxY = 2; auxX < 3; auxX++, auxY--) {
                if (matriz.value[auxY][auxX] != figure)
                    break;
                else if (auxX == 2)
                    return true;
            }
        }

        // BUTTONS
        var buttons: HolographicButton[][] = [];
        for (let y = 0; y < 3; y++) {
            buttons[y] = [];
            for (let x = 0; x < 3; x++) {
                let button = new HolographicButton(`button${y},${x}`);
                buttons[y][x] = button;
            }
        }
        function createButton(y: number, x: number, posY: number, posX: number) {
            buttons[y][x].text = `button ${y},${x}`;
            buttons[y][x].position = new BABYLON.Vector3(posY, posX, 0);
            buttons[y][x].scaling = new BABYLON.Vector3(butSize, butSize, 1);
            manager.addControl(buttons[y][x]);
        }
        createButton(0, 0, -butPos, butPos);
        createButton(0, 1, 0, butPos);
        createButton(0, 2, butPos, butPos);
        createButton(1, 0, -butPos, 0);
        createButton(1, 1, 0, 0);
        createButton(1, 2, butPos, 0);
        createButton(2, 0, -butPos, -butPos);
        createButton(2, 1, 0, -butPos);
        createButton(2, 2, butPos, -butPos);

        //PUSH BUTTONS
        for (let i = 0; i < 3; i++) {
            for (let x = 0; x < 3; x++) {
                buttons[i][x].onPointerUpObservable.add(() => {
                    // CHECKING TURN
                    if (puntuation.playerTurn == 1 || puntuation.online === 0) {
                        console.log("Crea figura");
                        createFigure(buttons[i][x].position.x, buttons[i][x].position.y, 0);
                        matriz.value[i][x] = figure;
                        buttons[i][x].dispose();
                        puntuation.playerTurn = 0;
                    } 
                    if (checkVic() == true && figure == 1) {
                        console.log("Ganador 1");
                        buttons.forEach((row) => {
                            row.forEach((button) => {
                                button.dispose();
                            });
                        });
                        puntuation.pl++;
                        createX(0, 0, -3, butSize);
                        puntuation.gameOver = 1;
                    }
                    else if (checkVic() == true && figure == 2) {
                        console.log("Ganador 2");
                        buttons.forEach((row) => {
                            row.forEach((button) => {
                                button.dispose();
                            });
                        });
                        puntuation.pr++;
                        createCircle(0, 0, -3, butSize);
                        puntuation.gameOver = 1;
                    }
                    if (puntuation.online === 0) {
                        figure = (figure === 1) ? 2 : 1;
                    }
                });
            }
        }

        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

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
