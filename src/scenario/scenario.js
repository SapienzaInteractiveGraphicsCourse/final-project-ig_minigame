
"use strict"


/**
 * This js file contains all the functions that loads scenario elements: build grounds, scenario 
 * objects, buildings (future work) etc...
 * 
*/
function playGameMusicCallback(){

    if(soundEnabled)
        scene.assets['gameMusic'].play();
}


/**
 * This function configure the asset manager that is responsible for loading the models as well as scene objects.
 * We configure the assets manager as a scene object according to some code defined in the documentation.
 * When the assets manager has correctly loaded every object, then the scene is rendered.
 * @param {BABYLON.Scene} scene the object representing the scene. 
 */
var configureAssetsManager = function (scene) {

 
    //Dictionary for sounds
    scene.assets = {};



    /**
     * Code extracted from the documentation of the assets manager
     * https://doc.babylonjs.com/how_to/how_to_use_assetsmanager.
     */
    var assetsManager = new BABYLON.AssetsManager(scene);
    assetsManager.onProgress = function (remainingCount, totalCount, lastFinishedTask) {
        engine.loadingUIText = 'We are loading the scene. ' + remainingCount + ' out of ' + totalCount + ' items still need to be loaded.';
    };



    //Callback function that is triggered when the assets manager has ended all its tasks.
    assetsManager.onFinish = function (tasks) {
        /**
        * If the scene is the interactive level, the rendering loop is a little bit more complex
        * and there is an appropriate function.
        */
       
        if(Game.activeScene == FIRST_LEVEL_SCENE_VALUE){

            engine.runRenderLoop(function () {
                scene.toRender();           
            });
        }
        else if(Game.activeScene == MAIN_MENU_SCENE_VALUE){
            engine.runRenderLoop(function(){
                scene.render();
            });
        }

        else if(Game.activeScene == END_MENU_SCENE_VALUE){
            engine.runRenderLoop(function(){
                scene.render();
            });
        }
    };


    scene.assetsManager = assetsManager;

    //We load the sounds before the game starts.
    if(Game.activeScene == FIRST_LEVEL_SCENE_VALUE)
        loadSounds(scene);

    return assetsManager;
}





/**
 * This function loads all the needed sounds for the scene using the AssetsManager and the
 * BinaryFileTask method. Loading the sounds this way is beneficial since they all will
 * be loaded actually "before" the scene is rendered.
 * @param {BABYLON.Scene} scene the object representing the current scene. 
 */
var loadSounds = function (scene) {
    var binaryTask = scene.assetsManager.addBinaryFileTask("laserSound", "sounds/laser.wav");


    //To repeat the sound whenever it finishes.
    binaryTask.onSuccess = function (task) {
        scene.assets["laserSound"] = new BABYLON.Sound("laser", task.data, scene, null,
            { loop: true });



    }



    binaryTask = scene.assetsManager.addBinaryFileTask("cannonSound", "sounds/cannon.wav");


    //To repeat the sound whenever it finishes.
    binaryTask.onSuccess = function (task) {
        scene.assets["cannonSound"] = new BABYLON.Sound("cannon", task.data, scene, null,
            { loop: false });

    }

    binaryTask = scene.assetsManager.addBinaryFileTask("dieSound", "sounds/minecraft.wav");


    //To repeat the sound whenever it finishes.
    binaryTask.onSuccess = function (task) {
        scene.assets["dieSound"] = new BABYLON.Sound("die", task.data, scene, null,
            { loop: false });

    }

    binaryTask = scene.assetsManager.addBinaryFileTask("dieSound", "sounds/MP5.wav");


    //To repeat the sound whenever it finishes.
    binaryTask.onSuccess = function (task) {
        scene.assets["gunSound"] = new BABYLON.Sound("gun", task.data, scene, null,
            { loop: false });

    }




    //Load the sound of the explosion.
    binaryTask = scene.assetsManager.addBinaryFileTask("cannonSound", "sounds/explosion.wav");


    //To repeat the sound whenever it finishes.
    binaryTask.onSuccess = function (task) {
        scene.assets["explosionSound"] = new BABYLON.Sound("explosion", task.data, scene, null,
            { loop: false });

    }


    //Load the sound of the explosion.
    binaryTask = scene.assetsManager.addBinaryFileTask("gameMusic", "sounds/game-music.wav");


    //To load the in game music.
    binaryTask.onSuccess = function (task) {
        scene.assets["gameMusic"] = new BABYLON.Sound("gameMusic", task.data, scene, playGameMusicCallback,
            { loop: true,
            volume: 0.18 });

    }

}




/**
 * This function create a ground that could be placed anywhere in the scene
 * @param {BABYLON.Scene} scene the object representing the scene.
 * @param {Object} groundOptions we use BABYLON.MeshBuilder.CreateGround function that takes as argument an object representing ground properties.
 *                              Those ground options are in the format {width: width, height: height, subdivisions:subdivisions, updatable:updatable}
 * @param {String} urlGroundTexture the url of the texture image (position in the file system).
 * @param {Boolean} enablePhysics specifies whether this ground object should implement its own "physic impostor" according to the
 *                              physics engine used in the game (default Cannon.js).
 */
var createGround = function (scene, groundOptions, urlGroundTexture = null, enablePhysics = false) {


    //Create the ground. Subdivisions are proportional to the number of triangles in the model.
    var ground = new BABYLON.MeshBuilder.CreateGround("groundScenario", {
        height: groundOptions.height, width: groundOptions.width, subdivisions: groundOptions.subdivisions,
        updatable: groundOptions.updatable
    }, scene);


    //Create a material on the ground to attach textures.                                                    
    var groundMaterial = new BABYLON.StandardMaterial("groundScenarioMaterial", scene);




    //TODO; Define an onload callback function if the texture loading is too slow.
    if (urlGroundTexture != null)
        groundMaterial.diffuseTexture = new BABYLON.Texture(urlGroundTexture, scene);
    groundMaterial.diffuseTexture.uScale = 3;
    groundMaterial.diffuseTexture.vScale = 3;


    groundMaterial.specularColor = new BABYLON.Color3.Black;



    ground.material = groundMaterial;

    //Define a physic impostor for the physic engine if physic is enabled for this ground object.
    if (enablePhysics)
        ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.HeightmapImpostor, { mass: 0 }, scene);

    return ground;
}






/**
 * Insert inside this function all the code responsible for the creation of the lights.
 */

/**
 * Add the lights to the scene. Lights could be either directional, pointlights, spotlights etc..
 * @param {BABYLON.Scene} scene the object representing the scene.
 * @param {Array} lightsArray array of objects representing the scene lights. Each element of the array is in
 *                             a object format {type:type, name:name, position:position, diffuseColor: diffuseColor}.
 */
var createLights = function (scene, lightsArray) {

    var numLights = lightsArray.length;
    scene.lights = [];
    for (var i = 0; i < numLights; ++i) {

        //Sanity check. Check whether the light has a well defined type.
        if (lightsArray[i].type) {

            //Below the code for creating a directional light from the properties defined in the lightsArray object.
            if (lightsArray[i].type == 'directional') {
                if (lightsArray[i].position) {
                    var position = lightsArray[i].position;
                }

                //If the position is nt provided, then we provide a default position.
                else {
                    var position = new BABYLON.Vector3(-1, -1, 0);
                }


                //Create the directional light.
                var light = new BABYLON.DirectionalLight(lightsArray[i].name, position, scene);

                //Check if a diffuse color is provided for the light.
                if (lightsArray[i].diffuseColor) {
                    var diffuseColor = lightsArray[i].diffuseColor;
                }

                //If no diffuse color is provided, we set white as diffuse color of the light.
                else {
                    var diffuseColor = new BABYLON.Color3.White;
                }

                light.diffuse = diffuseColor;
                scene.lights.push(light);

            }

            if(lightsArray[i].type == 'pointlight'){
                if (lightsArray[i].position) {
                    var position = lightsArray[i].position;
                }

                //If the position is nt provided, then we provide a default position.
                else {
                    var position = new BABYLON.Vector3(-1, -1, 0);
                }


                //Create the directional light.
                var light = new BABYLON.PointLight(lightsArray[i].name, position, scene);

                //Check if a diffuse color is provided for the light.
                if (lightsArray[i].diffuseColor) {
                    var diffuseColor = lightsArray[i].diffuseColor;
                }

                //If no diffuse color is provided, we set white as diffuse color of the light.
                else {
                    var diffuseColor = new BABYLON.Color3.White;
                }

                light.diffuse = diffuseColor;
                scene.lights.push(light);

            }


            if(lightsArray[i].type == 'spotlight'){
                if (lightsArray[i].position) {
                    var position = lightsArray[i].position;
                }

                //If the position is nt provided, then we provide a default position.
                else {
                    var position = new BABYLON.Vector3(-1, -1, 0);
                }


                if(lightsArray[i].direction){
                    var direction = lightsArray[i].direction;
                }
                else{
                    var direction = new BABYLON.Vector3(1,1,0);
                }

                //Create the directional light.
                var light = new BABYLON.SpotLight(lightsArray[i].name, position, direction,Math.PI/4,0.4,scene);

                //Check if a diffuse color is provided for the light.
                if (lightsArray[i].diffuseColor) {
                    var diffuseColor = lightsArray[i].diffuseColor;
                }

                //If no diffuse color is provided, we set white as diffuse color of the light.
                else {
                    var diffuseColor = new BABYLON.Color3.White;
                }

                light.diffuse = diffuseColor;
                scene.lights.push(light);

            }


        }
    }


    var l = new BABYLON.PointLight("o", new BABYLON.Vector3(200,1,-6),scene);
    l.diffuseColor = new BABYLON.Color3.Green;
  


    return;


}




var createFreeCamera = function (scene, initialPosition) {
    var camera = new BABYLON.FreeCamera("freeCamera", initialPosition, scene);
    camera.attachControl(canvas);
    camera.checkCollisions = true;
    camera.applyGravity = true;
    camera.ellipsoid = new BABYLON.Vector3(.1, .1, .1);
    camera.keysUp.push('w'.charCodeAt(0));
    camera.keysUp.push('W'.charCodeAt(0));
    camera.keysDown.push('s'.charCodeAt(0));
    camera.keysDown.push('S'.charCodeAt(0));
    camera.keysRight.push('d'.charCodeAt(0));
    camera.keysRight.push('D'.charCodeAt(0));
    camera.keysLeft.push('a'.charCodeAt(0));
    camera.keysLeft.push('A'.charCodeAt(0));

    //Free camera needs a position and a target (the object you are looking at).
    return camera;

}





/**
 * A free camera with no gravity and collision checks used only for debugging purposes.
 * No gravity or collision engine is enabled for this camera.
 * 
 * @param {BABYLON.Scene} scene the scene object. 
 * @param {BABYLON.Vector3} initialPosition a three dimensional vector representing the initial position of the debuggin camera.
 */
var createDebugCamera = function (scene, initialPosition, name = "debugCamera") {
    var camera = new BABYLON.FreeCamera(name, initialPosition, scene);
    camera.keysUp.push('w'.charCodeAt(0));
    camera.keysUp.push('W'.charCodeAt(0));
    camera.keysDown.push('s'.charCodeAt(0));
    camera.keysDown.push('S'.charCodeAt(0));
    camera.keysRight.push('d'.charCodeAt(0));
    camera.keysRight.push('D'.charCodeAt(0));
    camera.keysLeft.push('a'.charCodeAt(0));
    camera.keysLeft.push('A'.charCodeAt(0));
    camera.attachControl(canvas);

    return camera;

}



/**
 * This function istantiate a followCamera given a target and set certain parameters 
 * for the follow camera.
 * @param {BABYLON.Scene} scene the action describing the scene.
 * @param {BABYLON.Mesh} target a BABYLON.Mesh object representing the Mesh that is the sphere target. 
 * @param {Object} cameraProperties an object spercifiying the follow camera properties for the object.
 * @param {String} name the name of the target Mesh
 */
var createFollowCamera = function (scene, target, followCameraProperties, name = 'FollowCamera') {


    /** Check whether follow camera properties are well defined. In case they are not defined, return immediately
     * and log an error message in the console.
    */

    if (!followCameraProperties) {
        console.log("Error in creating the follow camera with name ".concat(name).concat('. Camera properties not defined'));
        alert("Error: you must provide some camera properties in the definition of the camera");
        return null;
    }
    var followCamera = new BABYLON.FollowCamera(target.name.concat(name), target.position, scene, target);



    //The follow camera defined specifically for the heroT


    //50
    followCamera.radius = followCameraProperties.radius;


    //10
    followCamera.heightOffset = followCameraProperties.heightOffset;

    //0
    followCamera.rotationOffset = followCameraProperties.rotationOffset;


    //0.5
    followCamera.cameraAcceleration = followCameraProperties.cameraAcceleration;


    //50
    followCamera.maxCameraSpeed = followCameraProperties.maxCameraSpeed;


    //To constraint the movement of the camera. It must not be able to freely move into the scene.
    followCamera.upperHeightOffsetLimit = followCameraProperties.heightOffset -4.0;
    followCamera.lowerHeightOffsetLimit = followCameraProperties.heightOffset -13.0;


    followCamera.upperLimitRadius = followCameraProperties.radius + 10;
    followCamera.lowerLimitRadius = followCameraProperties.radius -10;


    followCamera.noRotationConstraint = false;
    


    followCamera.attachControl(canvas);
   
	



    return followCamera;
}







/**
 * Define the rule that will spawn all the boxes in the scenario.
 * Three arrays in the scene object are defined "scene.lootBoxes", "scene.boolLootBoxes",
 * "scene.lootBoxesPosition". The first one will contain objects representing the loot boxes,
 * the second one determines whether the loot boxes are "active" or not, the third one 
 * contains a set of possible positions for the loot box spawn.
 * Once the set of positions are defined, we spawn each loot box in the the given position.
 * Each of the loot boxes has an index. The index represents the id of the loot box (it is contained in
 * its name property) as well as the position in the "scene.lootBoxesPosition" in which is contained
 * the vector that represents the position in which the loot box must spawn every time.
 * @param {BABYLON.Scene} scene the object representing the scene.
 * @todo Complete this function.
*/
var createLootBoxes = function (scene) {


    //Just a sanity check. It can't work. We are still creating the scene.
    if (!scene) return;

    var numLootBoxes;


    //Collect the number of loot boxes. It depends on the game difficulty (easy, hard).
    if (difficulty == 'easy')
        numLootBoxes = NUM_LOOTBOXES_EASY;
    else
        numLootBoxes = NUM_LOOTBOXES_HARD;

    if (!scene.boolLootBoxes) {
        scene.boolLootBoxes = [];

        for (var i = 0; i < numLootBoxes; ++i) {
            scene.boolLootBoxes.push(false);
        }

    }

    if (!scene.lootBoxesPosition) {
        scene.lootBoxesPosition = [];


        //Need to define 9 box positions
        if (difficulty == 'easy') {
            scene.lootBoxesPosition.push(new BABYLON.Vector3(0.0, 5.5, 0.0));
            scene.lootBoxesPosition.push(new BABYLON.Vector3(500, 5.5, 0.0));
            scene.lootBoxesPosition.push(new BABYLON.Vector3(-500, 5.5, 0.0));
            scene.lootBoxesPosition.push(new BABYLON.Vector3(700, 5.5, 700));
            scene.lootBoxesPosition.push(new BABYLON.Vector3(-700, 5.5, 700));
            scene.lootBoxesPosition.push(new BABYLON.Vector3(700, 5.5, -700));
            scene.lootBoxesPosition.push(new BABYLON.Vector3(-700, 5.5, -700));
            scene.lootBoxesPosition.push(new BABYLON.Vector3(0.0, 5.5, 700));
            scene.lootBoxesPosition.push(new BABYLON.Vector3(0.0, 5.5, -700));

        }


        //Need to define 6 box positions.
        else if (difficulty == 'hard') {
            scene.lootBoxesPosition.push(new BABYLON.Vector3(0.0, 5.5, 0.0));
            scene.lootBoxesPosition.push(new BABYLON.Vector3(700, 5.5, 700));
            scene.lootBoxesPosition.push(new BABYLON.Vector3(-700, 5.5, 700));
            scene.lootBoxesPosition.push(new BABYLON.Vector3(700, 5.5, -700));
            scene.lootBoxesPosition.push(new BABYLON.Vector3(-700, 5.5, -700));
            scene.lootBoxesPosition.push(new BABYLON.Vector3(0.0, 5.5, 700));
        }
    }


    if (!scene.lootBoxes) {
        scene.lootBoxes = [];
    }


    /**
     * For each and every position contained in scene.lootBoxesPosition, create a loot box,
     * assign an index to it and a texture which recall its primary effect on the hero tank. 
    */
    for (var i = 0; i < numLootBoxes; ++i) {
        scene.boolLootBoxes[i] = true;
        var type;
        switch (i) {
            case 0: {
                type = 'point';
                scene.lootBoxes[i] = {
                    position: scene.lootBoxesPosition[i],
                    index: i,
                    lootBox: new BABYLON.Mesh.CreateBox('lootBox'.concat((i).toString()), LOOT_BOX_SIZE, scene),
                    type: type
                };

                //New vector designed to avoid any memory conflicts!
                scene.lootBoxes[i].lootBox.position = new BABYLON.Vector3(scene.lootBoxesPosition[i].x,
                    scene.lootBoxesPosition[i].y, scene.lootBoxesPosition[i].z);

                //Attach the textures to the box. Skybox like textures apparently can only be rendered using reflection textures.
                var urlTexture = 'texture/cubeTextures/coin/coin';
                var box = scene.lootBoxes[i];
                var index = box.index;
                var scale = 5;
                texturizeLootBox(scene, box, urlTexture, index, scale,0.7);

                animateLootBoxes(scene,box);


                break;
            }
            case 1: {
                type = 'health';
                scene.lootBoxes[i] = {
                    position: scene.lootBoxesPosition[i],
                    index: i,
                    lootBox: new BABYLON.Mesh.CreateBox('lootBox'.concat((i).toString()), LOOT_BOX_SIZE, scene),
                    type: type
                };


                //New vector designed to avoid any memory conflicts!
                scene.lootBoxes[i].lootBox.position = new BABYLON.Vector3(scene.lootBoxesPosition[i].x,
                    scene.lootBoxesPosition[i].y, scene.lootBoxesPosition[i].z);


                //Attach the textures to the box.
                var urlTexture = 'texture/cubeTextures/hearth/health';
                var box = scene.lootBoxes[i];
                var index = box.index;
                var scale = 5;
                texturizeLootBox(scene, box, urlTexture, index, scale, 0.7);

                animateLootBoxes(scene,box);


                break;


            }
            case 2: {
                type = 'machineGunBullet';
                scene.lootBoxes[i] = {
                    position: scene.lootBoxesPosition[i],
                    index: i,
                    lootBox: new BABYLON.Mesh.CreateBox('lootBox'.concat((i).toString()), LOOT_BOX_SIZE, scene),
                    type: type
                };



                //New vector designed to avoid any memory conflicts!
                scene.lootBoxes[i].lootBox.position = new BABYLON.Vector3(scene.lootBoxesPosition[i].x,
                    scene.lootBoxesPosition[i].y, scene.lootBoxesPosition[i].z);

                //Attach the textures to the box.

                //Attach the textures to the box. Skybox like textures apparently can only be rendered using reflection textures.
                var urlTexture = 'texture/cubeTextures/machinegun/machinegun';
                var box = scene.lootBoxes[i];
                var index = box.index;
                var scale = 5;
                texturizeLootBox(scene, box, urlTexture, index, scale, 0.7);


                animateLootBoxes(scene,box);


                break;

            }
            case 3: {
                type = 'cannonBullet';
                scene.lootBoxes[i] = {
                    position: scene.lootBoxesPosition[i],
                    index: i,
                    lootBox: new BABYLON.Mesh.CreateBox('lootBox'.concat((i).toString()), LOOT_BOX_SIZE, scene),
                    type: type
                };



                //New vector designed to avoid any memory conflicts!
                scene.lootBoxes[i].lootBox.position = new BABYLON.Vector3(scene.lootBoxesPosition[i].x,
                    scene.lootBoxesPosition[i].y, scene.lootBoxesPosition[i].z);

                //Attach the textures to the box.


                //Attach the textures to the box. Skybox like textures apparently can only be rendered using reflection textures.

                var urlTexture = 'texture/cubeTextures/cannonball/cannonball';
                var box = scene.lootBoxes[i];
                var index = box.index;
                var scale = 5;
                texturizeLootBox(scene, box, urlTexture, index, scale, 0.7);


                animateLootBoxes(scene,box);


                break;

            }
            case 4: {
                type = 'point';
                scene.lootBoxes[i] = {
                    position: scene.lootBoxesPosition[i],
                    index: i,
                    lootBox: new BABYLON.Mesh.CreateBox('lootBox'.concat((i).toString()), LOOT_BOX_SIZE, scene),
                    type: type
                };



                //New vector designed to avoid any memory conflicts!
                scene.lootBoxes[i].lootBox.position = new BABYLON.Vector3(scene.lootBoxesPosition[i].x,
                    scene.lootBoxesPosition[i].y, scene.lootBoxesPosition[i].z);

                //Attach the textures to the box.
                //Attach the textures to the box. Skybox like textures apparently can only be rendered using reflection textures.

                var urlTexture = 'texture/cubeTextures/coin/coin';
                var box = scene.lootBoxes[i];
                var index = box.index;
                var scale = 5;
                texturizeLootBox(scene, box, urlTexture, index, scale, 0.7);


                animateLootBoxes(scene,box);


                break;

            }
            case 5: {
                type = 'health';
                scene.lootBoxes[i] = {
                    position: scene.lootBoxesPosition[i],
                    index: i,
                    lootBox: new BABYLON.Mesh.CreateBox('lootBox'.concat((i).toString()), LOOT_BOX_SIZE, scene),
                    type: type
                };



                //New vector designed to avoid any memory conflicts!
                scene.lootBoxes[i].lootBox.position = new BABYLON.Vector3(scene.lootBoxesPosition[i].x,
                    scene.lootBoxesPosition[i].y, scene.lootBoxesPosition[i].z);


                //Attach the textures to the box. Skybox like textures apparently can only be rendered using reflection textures.

                var urlTexture = 'texture/cubeTextures/hearth/health';
                var box = scene.lootBoxes[i];
                var index = box.index;
                var scale = 5;
                texturizeLootBox(scene, box, urlTexture, index, scale, 0.7);


                animateLootBoxes(scene,box);



                break;

            }

        }
    }


    //If the difficulty is easy we have three more loot boxes to spawn.
    if (difficulty == 'easy') {
        for (var i = 6; i < numLootBoxes; ++i) {

            switch (i) {
                case 6: {
                    type = 'point';
                    scene.lootBoxes[i] = {
                        position: scene.lootBoxesPosition[i],
                        index: i,
                        lootBox: new BABYLON.Mesh.CreateBox('lootBox'.concat((i).toString()), LOOT_BOX_SIZE, scene),
                        type: type
                    };



                    //New vector designed to avoid any memory conflicts!
                    scene.lootBoxes[i].lootBox.position = new BABYLON.Vector3(scene.lootBoxesPosition[i].x,
                        scene.lootBoxesPosition[i].y, scene.lootBoxesPosition[i].z);

                    //Attach the textures to the box.

                    //Attach the textures to the box. Skybox like textures apparently can only be rendered using reflection textures.
                    var urlTexture = 'texture/cubeTextures/coin/coin';
                    var box = scene.lootBoxes[i];
                    var index = box.index;
                    var scale = 5;
                    texturizeLootBox(scene, box, urlTexture, index, scale, 0.7);

                    animateLootBoxes(scene,box);


                    break;
                }

                case 7: {
                    type = 'machineGunBullet';
                    scene.lootBoxes[i] = {
                        position: scene.lootBoxesPosition[i],
                        index: i,
                        lootBox: new BABYLON.Mesh.CreateBox('lootBox'.concat((i).toString()), LOOT_BOX_SIZE, scene),
                        type: type
                    };



                    //New vector designed to avoid any memory conflicts!
                    scene.lootBoxes[i].lootBox.position = new BABYLON.Vector3(scene.lootBoxesPosition[i].x,
                        scene.lootBoxesPosition[i].y, scene.lootBoxesPosition[i].z);

                    //Attach the textures to the box.

                    //Attach the textures to the box. Skybox like textures apparently can only be rendered using reflection textures.

                    var urlTexture = 'texture/cubeTextures/machinegun/machinegun';
                    var box = scene.lootBoxes[i];
                    var index = box.index;
                    var scale = 5;
                    texturizeLootBox(scene, box, urlTexture, index, scale, 0.7);

                    animateLootBoxes(scene,box);


                    break;
                }


                case 8: {
                    type = 'cannonBullet';
                    scene.lootBoxes[i] = {
                        position: scene.lootBoxesPosition[i],
                        index: i,
                        lootBox: new BABYLON.Mesh.CreateBox('lootBox'.concat((i).toString()), LOOT_BOX_SIZE, scene),
                        type: type
                    };



                    //New vector designed to avoid any memory conflicts!
                    scene.lootBoxes[i].lootBox.position = new BABYLON.Vector3(scene.lootBoxesPosition[i].x,
                        scene.lootBoxesPosition[i].y, scene.lootBoxesPosition[i].z);

                    //Attach the textures to the box.


                    //Attach the textures to the box. Skybox like textures apparently can only be rendered using reflection textures.


                    var urlTexture = 'texture/cubeTextures/cannonball/cannonball';
                    var box = scene.lootBoxes[i];
                    var index = box.index;
                    var scale = 5;
                    texturizeLootBox(scene, box, urlTexture, index, scale,  0.7);

                    animateLootBoxes(scene,box);



                    break;

                }

            }
        }
    }

    //This render the skybox. Leave this code here for rendering purposes.
    var newLootBox =  {
        position:new BABYLON.Vector3(0,0,0),
        index: 10,
        lootBox: new BABYLON.Mesh.CreateBox('skybox', 5000, scene),
        type: 'none'
    };

    urlTexture = 'texture/cubeTextures/space/space';
    var index = box.index;
    var scale = 5;
    texturizeLootBox(scene, newLootBox, urlTexture, index, scale);
    newLootBox.lootBox.material.backFaceCulling = false;

    return;
}





/**
 * This function takes as input the scene, the object representing the loot box, the url of the 
 * cube texture, the index of the loot box, a scale factor and applies a cube texture as reflection 
 * texture to the loot box.
 * @param {BABYLON.Scene} scene an object representing the scene.
 * @param {Object} box  a javascript object representing the loot box. It contains the following fields
 *                      {position:  {BABYLON.Vector3} a vector representing the position of the loot box in the scene.,
 *                       type: {String} a string representing the type of the loot box,
 *                       lootBox: {BABYLON.Mesh.Box} a Mesh object representing the loot box in the babylon scene,
 *                       index: {Number} an integer represting the index of the loot box in the scenario.}
 * @param {String} urlTexture a string representing the position of the cube texture in the file system.
 * @param {Number} index a number representing the index of the loot box in the scene.
 * @param {Float} scale  a floating point value representing the scale factor to be applied to both the "u" and the "v" axes of the texture.
 */
var texturizeLootBox = function (scene, box, urlTexture, index, scale = 1.0, alpha = 1.0) {
    var material = new BABYLON.StandardMaterial('lootBoxMaterial'.concat((index).toString()), scene);
    material.reflectionTexture = new BABYLON.CubeTexture(urlTexture, scene);
    material.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    material.disableLighting = true;
    material.alpha = alpha;

    material.reflectionTexture.uScale = scale;
    material.reflectionTexture.vScale = scale;


    box.lootBox.material = material;
    return;

}





/**
 * This function will create the animations for the loot boxes in the scene.
 * @param {BABYLON.Scene} scene the object representing the scene.
 * @param {Object} box a javascript object representing the loot box. It contains the following fields
 *                      {position:  {BABYLON.Vector3} a vector representing the position of the loot box in the scene.,
 *                       type: {String} a string representing the type of the loot box,
 *                       lootBox: {BABYLON.Mesh.Box} a Mesh object representing the loot box in the babylon scene,
 *                       index: {Number} an integer represting the index of the loot box in the scenario.}.
 */
var animateLootBoxes = function(scene,box){
    var upSideDownAnimation = new BABYLON.Animation("upsideDownAnimation","position",10,
                                BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    var position = box.position;

    var upsideDownKeys = [];
    upsideDownKeys.push({frame:0, value: new BABYLON.Vector3(position.x,6.2,position.z)});
    upsideDownKeys.push({frame:50, value: new BABYLON.Vector3(position.x,10.0,position.z)});
    upsideDownKeys.push({frame:100, value: new BABYLON.Vector3(position.x,6.2,position.z)});


    upSideDownAnimation.setKeys(upsideDownKeys);



    var rotationAnimation = new BABYLON.Animation("rotationAnimation","rotation.y",
                            10, BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);


    var rotationKeys = [];
    rotationKeys.push({frame:0, value:0});
    rotationKeys.push({frame:50, value:Math.PI});
    rotationKeys.push({frame:100, value:2*Math.PI});

    rotationAnimation.setKeys(rotationKeys);

    var lootBox = box.lootBox;

    lootBox.animations = [];

    lootBox.animations.push(upSideDownAnimation);
    lootBox.animations.push(rotationAnimation);


    box.animationObject = scene.beginAnimation(lootBox,0,100,true);

    return;
    
}





