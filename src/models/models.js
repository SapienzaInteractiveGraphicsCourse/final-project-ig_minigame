"use strict"




/**
 * If you want to build a FPS like game, a first person shooter, you need to define a free camera.
 * To avoid collisions with object you define an ellipsoid like figure with the position of the camera on top of 
 * the ellipsoid. This is done to define an area that will determine the collisions. If the radius of the ellipsoid is 
 * 2 the the height of the camera is 4. 
 * Ellipsoid offset determine how close to the ground is the camera.
 */



var importModel = function (model_names, model_root_dir, babylon_file_name, scene, position, modelType) {


    //https://doc.babylonjs.com/api/classes/babylon.sceneloader
    //Import meshes into a scene.

    //Load dudes using assets manager.



    /**
     * With the assets manager, we define a task using addMeshTask. Once the task is completed, we
     * define a "completed task" callback function to be executed "meshTask.onSuccess".
     */


    if(!scene.assetsManager) return;

    var meshTask = scene.assetsManager.addMeshTask("MeshesTask", model_names, model_root_dir, babylon_file_name);
   
    var object_pos = position;
    meshTask.onSuccess = function (task) {
        //In task.loadedSkeletons there are the skeletons
       
        onModelImported(task.loadedMeshes, task.loadedParticleSystems, task.loadedSkeletons, modelType);
    }


    meshTask.onError = function (task) {
        alert("Error in loading the model ");

    }


    function onModelImported(newMeshes, particleSystems, skeletons, modelType) {


        //Handle separately the object model if it is a tank.
        if (modelType == 'tank') {

            onTankImported(newMeshes, particleSystems, skeletons, object_pos);

        }
        else if (modelType == 'Dude') {
            onTankImported(newMeshes, particleSystems, skeletons, object_pos);
        }



    }

}




/**
 * Create a clone function that is responsible to clone models.
 * Models might have children so we have to clone them as well.
 * 
 * 
 * if(skeletons.length == 1) We have a single skeleton for all children
 * 
 * 
 * //Most probably each child has its own skeleton.
 * 
 */



/**
 * 
 * @param {BABYLON.Mesh} original. The original mesh object representing the model to be cloned.
 * @param {*} skeletons. The original set of babylon skeleton objects that are used to animate the model. They need to be clone as well. 
 * @param {Integer} id. Integer representing the id of the cloned model. To be usd tby the function scene.getMeshByName to obtain reference of a mesh just by its name. 
 * 
 * 
 * WARNING:
 * It works with the majority of the cases. But it is not guaranteed to work with any possible
 * model since its ultimate behaviour strictly depends on the model and on the person who designed the
 * model (the modeler).
 */
function DoClone(original, skeletons, id) {
    var myClone;

    //Built in function. Clone a mesh object.
    myClone = original.clone("clone_".concat(id.toString()));


    //The model has no skeletons and thus cannot be animated.
    if (!skeletons) {
        return myClone;
    }
    else {

        //The model has no child.
        if (!original.getChildren()) {
            myClone.skeleton = skeletons[0].clone("clone_".concat(id.toString()).concat("_skeleton"));
            return myClone;
        }
        else {

            //We have a single skeleton controlling all the children.
            if (skeletons.length == 1) {
                var clonedSkeleton = skeletons[0].clone("clone_".concat(id.toString()).concat("_skeleton"));

                //Parent node. This line of code is not required but it helps me to refer quickly
                //to the parent node skeleton from anywhere in the code.
                myClone.skeleton = clonedSkeleton;


                //The skeleton is for each and every child. Need to assign the skeleton to each child.
                var numChildren = myClone.getChildren().length;
                for (var i = 0; i < numChildren; i++) {
                    myClone.getChildren()[i].skeleton = clonedSkeleton;
                }
                return myClone;
            }

            //We have a different skeleton for each child.
            else if (skeletons.length == original.getChildren().length) {

                var n = myClone.getChildren().length;
                for (var i = 0; i < n; ++i) {
                    myClone.getChildren()[i].skeleton = skeletons[i].clone("clone_".concat(id.toString()).concat("_skeleton_").concat(id.toString()));
                }
                return myClone;
            }
        }
    }

}

