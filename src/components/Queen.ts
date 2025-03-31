import {
    Scene,
    MeshBuilder,
    StandardMaterial,
    Color3,
    Vector3,
    TransformNode
} from '@babylonjs/core';

export class Queen extends TransformNode {
    private scene: Scene;
    private material: StandardMaterial;
    private mesh: TransformNode;

    constructor(scene: Scene) {
        super('queen', scene);
        this.scene = scene;
        this.createMesh();
    }

    private createMesh(): void {
        // Create a group for the queen pieces
        this.mesh = new TransformNode('queen_group', this.scene);
        this.mesh.parent = this;

        // Create the base
        const base = MeshBuilder.CreateCylinder('queen_base', {
            height: 0.2,
            diameter: 0.6,
            tessellation: 16
        }, this.scene);
        base.parent = this.mesh;

        // Create the body
        const body = MeshBuilder.CreateCylinder('queen_body', {
            height: 1.2,
            diameterTop: 0.2,
            diameterBottom: 0.4,
            tessellation: 16
        }, this.scene);
        body.position.y = 0.7;
        body.parent = this.mesh;

        // Create the crown
        const crown = MeshBuilder.CreateCylinder('queen_crown', {
            height: 0.3,
            diameterTop: 0.4,
            diameterBottom: 0.2,
            tessellation: 16
        }, this.scene);
        crown.position.y = 1.45;
        crown.parent = this.mesh;

        // Create the top
        const top = MeshBuilder.CreateSphere('queen_top', {
            diameter: 0.3,
            segments: 16
        }, this.scene);
        top.position.y = 1.75;
        top.parent = this.mesh;

        // Create and apply material
        this.material = new StandardMaterial('queen_material', this.scene);
        this.material.diffuseColor = new Color3(1, 1, 1);
        this.material.specularColor = new Color3(0.3, 0.3, 0.3);

        // Apply material to all meshes
        [base, body, crown, top].forEach(mesh => {
            mesh.material = this.material;
        });

        // Scale the entire group to make it fit nicely on the grid
        this.mesh.scaling = new Vector3(0.3, 0.3, 0.3);
    }

    public setPosition(position: Vector3): void {
        // Position the queen slightly above the grid cell
        this.position = position.clone();
        this.position.y += 0.1; // Slight offset to avoid z-fighting
    }

    public dispose(): void {
        this.material.dispose();
        this.mesh.getChildMeshes().forEach(mesh => mesh.dispose());
        this.mesh.dispose();
        super.dispose();
    }
} 