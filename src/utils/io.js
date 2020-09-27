

"use strict"

//An object that handles the WASD movement for the 3rd person camera for the tank.
var WASD_handler = null;

//An object that handler the player tank actions.
var TankAction_handler = null;



var pointerLockChangeCallback = function(){
    
    var scene = Game.scenes[Game.activeScene];
    
    //Retrieve the element located by the pointer
    var element = document.pointerLockElement || null;
    if(element){

        //Asynchronous, potentially buggy reference to the scene object.
        scene.arleadyLocked = true;
    }
    else{
        scene.arleadyLocked = false;
    }

}



/** This function allows realistic usage of the pointer camera. OnPointerDown specifies the 
 * cursor behaviour realistically in an FPS fashion.
 **/



function modifySettings(scene){


    /**
     * Every single line of code which is inside this function will be executed when the 
     * canvas has requested the "pointer lock" (whenever you click with the left mouse button 
     * on the canvas).
     * We want the dude to be able to fire only when the left mouse button is pointed on the canvas.
     */
    scene.onPointerDown = function(){
        

        //Requesting the pointer location since the scene is not arleady locked (efficiency reasons).
        if(!scene.arleadyLocked){
            canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock ||
                                        null;
            canvas.requestPointerLock();
         
        }

    
    }
    
        
    //Add listerners for mouse event change. Try to deal with the majority of the browser available online.
            
    if ('onpointerlockchange'in document) 
    document.addEventListener('pointerlockchange', pointerLockChangeCallback);

    if('onmspointerlockchange' in document)
    document.addEventListener('mspointerlockchange',pointerLockChangeCallback);

    if ('onmozpointerlockchange' in document)
    document.addEventListener('mozpointerlockchange',pointerLockChangeCallback);

    if ('onwebkitpointerlockchange' in document)
    document.addEventListener('webkitpointerlockchange',pointerLockChangeCallback);

}







/**
 * This function enables the action for the 3rd person tank object. It just
 * create the tank action handler object that will be used inside the listeners functions.
 */
var enableTankAction = function(){
    TankAction_handler = {
        'isLeftMousePressed':false,
        'isRPressed':false
    };

}




/**
 * This function enables the left mouse button events. Two different events will be triggered
 * when the left mouse button is down or up making the player able to shoot with the various tank 
 * weapons.
 * @param {BABYLON.Scene} scene the object representing the scene.
 */
var enableClickEventListeners = function(scene){

    if('onclick' in document){
        document.addEventListener('click', function(event){
            
           
            //Left button mouse is pressed.
            if(TankAction_handler){
            //We must ensure that the mouse is arleady locked to the canvas:the scene is arleady locked.
                if(scene.arleadyLocked){
                    TankAction_handler.isLeftMousePressed = true;
                }
            }        
        });
    }

    if('onMouseDown' in document ){
        document.addEventListener('MouseDown',function(event){

            if(event.button == 0){
                if(TankAction_handler){
                    //We must ensure that the mouse is arleady locked to the canvas:the scene is arleady locked.
                    if(scene.arleadyLocked){
                        TankAction_handler.isLeftMousePressed = false;
                    }
                }
            }
        });
    }
    

}






/**
 *
 * This function enables all the key event listeners that will handle various actions in the game.
 * @param {BABYLON.Scene} scene the object representing the scene.
 */
var enableKeyEventListeners= function(){

    WASD_handler = {
        'isWPressed': false,
        'isAPressed': false,
        'isDPressed': false,
        'isSPressed': false,
        'isWForbidden': false,
        'isWForbidden':false
    };
    
    
    
    if ('onkeyup' in document){
        document.addEventListener('keyup', function(event){

            if(event.key == 'w' || event.key == 'W'){
                
                if (WASD_handler)
                    WASD_handler.isWPressed = false;
            }

            if(event.key == 'a' || event.key == 'A'){
                
                if (WASD_handler)
                    WASD_handler.isAPressed = false;
            }

            if(event.key == 's' || event.key == 'S'){
                
                if (WASD_handler)
                    WASD_handler.isSPressed = false;
            }

            if(event.key == 'd' || event.key == 'D'){
                
                if (WASD_handler)
                    WASD_handler.isDPressed = false;

            }
            if(event.key == 'b' || event.key == 'B'){
                
                if (TankAction_handler)
                    TankAction_handler.isBPressed = false;

            }

            if(event.key == 'r' || event.key == 'R'){      
                if (TankAction_handler)
                    TankAction_handler.isRPressed = false;
            }

        

        });
    }

    
    if('onkeydown' in document){
        document.addEventListener('keydown',function(event){
            var scene = Game.scenes[Game.activeScene];
            if(event.key == 'w' || event.key == 'W'){
                
                if (WASD_handler){
                  
                    WASD_handler.isWPressed = true;
                }

            }
            if(event.key == 'a' || event.key == 'A'){

                if (WASD_handler)
                    WASD_handler.isAPressed = true;
            }
            if(event.key == 's' || event.key == 'S'){
               
                if (WASD_handler)
                    WASD_handler.isSPressed = true;
            }
            if(event.key == 'd' || event.key == 'D'){

                if (WASD_handler)
                    WASD_handler.isDPressed = true;
            }

            if(event.key == 'b' || event.key == 'B'){
                
                if (TankAction_handler)
                    TankAction_handler.isBPressed = true;

            }

            if(event.key == 'r' || event.key == 'R'){
                
                if (TankAction_handler)
                    TankAction_handler.isRPressed = true;
            }
            
          
            if(event.key == 'y' || event.key == 'Y'){
            
                if(scene.followCameraDude != undefined){
                 
                    scene.activeCamera = scene.followCameraDude;
                }
            }

            if(event.key == 'u' || event.key == 'U'){
                
                if(scene.freeCameraDude != undefined){
                 
                    scene.activeCamera = scene.freeCameraDude;
                }
            }    

            
            if(event.key == 'l' || event.key == 'L'){
                
                if(scene.debugCamera != undefined){
                 
                    scene.activeCamera = scene.debugCamera;
                    if(!isSceneFreezed)
                        isSceneFreezed = true;
                }
            }   
            
            
            if(event.key == 't' || event.key == 'T'){
                
                if(scene.heroTankFollowCamera != undefined){
                 
                    scene.activeCamera = scene.heroTankFollowCamera;
                    if(isSceneFreezed)
                        isSceneFreezed = false;
                }
            }  


            if(event.key == '1'){
                
                if(scene.heroTankFollowCamera != undefined && scene.heroTank != undefined &&
                     scene.activeCamera == scene.heroTankFollowCamera){
                    
                    //Change the current weapon of the tank into cannon.
                    var tank = scene.heroTank;
                    tank.currentWeapon = Tank.CANNON;
                    
                }
            }  
            


            if(event.key == '2'){
                
                if(scene.heroTankFollowCamera != undefined  && scene.heroTank != undefined
                    && scene.activeCamera == scene.heroTankFollowCamera){
                 
                    //Change the current weapon of the tank into the machine gun .
                    var tank = scene.heroTank;
                    tank.currentWeapon = Tank.MACHINE_GUN;
                }
            }  



            if(event.key == 'f' || event.key == 'F'){
                
                if(scene.heroTank){
                    //Change the current weapon of the tank into the machine gun .
                    console.log(scene.heroTank.root.getAbsolutePosition());
                    console.log(scene.heroTankFollowCamera.position);
                    
                }
            }  



            if(event.key == 'm' || event.key == 'M'){
                
                
                //Check that the current scene is the game not the main menu.
                //We will set this '1' number as a constant.

                //Free the pointer lock before rendering the main menu.
                if(scene.arleadyLocked)
                    document.exitPointerLock();



                //Stop playing the game music
                if(soundEnabled){
                    if(scene.assets){
                        if(scene.assets['gameMusic']){
                            scene.assets['gameMusic'].stop();
                        }
                    }
                }


                if(Game.activeScene == 1){



                    //Dispose the scene hero tank otherwise other functions will try to access it and will trigger some errors.
                    scene.heroTank = null;


                    //Stop the render loop of the engine.
                    engine.stopRenderLoop();


                    //Retrieving the scene from the global Game array.
                    var scene = Game.scenes[Game.activeScene];
                   
                    //Switch back to the menu, and (for now) dispose the scene.
                    Game.activeScene =MAIN_MENU_SCENE_VALUE;
                    

                    //Delete the scene to free some memory.
                    scene.dispose();
                    
                    //Back to the main menu.
                    startMenu();
                }
              
            }  
          
        });
    }
    


}