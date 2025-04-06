import { Scene, Vector3, HavokPlugin } from '@babylonjs/core';

// Declare the global HavokPhysics type
declare const HavokPhysics: () => Promise<any>;

/**
 * Setup Havok physics properly with correct WASM file location
 */
export async function setupPhysics(scene: Scene): Promise<boolean> {
    try {
        console.log("Setting up Havok physics...");
        
        // Wait for Havok to be ready
        if (typeof HavokPhysics === 'undefined') {
            console.error("Havok physics not loaded!");
            return false;
        }

        // Initialize Havok
        const havokInstance = await HavokPhysics();
        
        // Create Havok plugin
        const havokPlugin = new HavokPlugin(true, havokInstance);
        
        // Set gravity and enable physics
        const gravityVector = new Vector3(0, -9.81, 0);
        scene.enablePhysics(gravityVector, havokPlugin);
        
        console.log("Physics setup completed successfully");
        return true;
    } catch (error) {
        console.error("Failed to initialize physics:", error);
        return false;
    }
}