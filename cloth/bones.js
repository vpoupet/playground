import {Vector2} from "./geometry.js";

export class Bone {
    constructor(node1, node2, length) {
        this.node1 = node1;
        this.node2 = node2;
        this.length = length;
    }

    draw(context) {
        context.strokeStyle = '#000000';
        context.lineWidth = 5;
        context.beginPath();
        context.moveTo(...this.node1.asTuple());
        context.lineTo(...this.node2.asTuple());
        context.stroke();
        context.beginPath();
        context.arc(this.node2.x, this.node2.y, 2, 0, 2 * Math.PI, false);
        context.stroke();
    }

    adjust(reversed) {
        let direction = reversed ? this.node1.sub(this.node2) : this.node2.sub(this.node1);
        direction.normalize(this.length);
        if (reversed) {
            this.node1.moveTo(this.node2.add(direction));
        } else {
            this.node2.moveTo(this.node1.add(direction));
        }
    }
}

export class BoneLine {
    constructor(lengths) {
        this.bones = [];
        let node1 = new Vector2(0, 0);
        let node2;
        for (let length of lengths) {
            node2 = node1.add(new Vector2(length, 0));
            this.bones.push(new Bone(node1, node2, length));
            node1 = node2;
        }
        this.firstBone = this.bones[0];
        this.lastBone = this.bones[this.bones.length - 1];
    }

    draw(context) {
        for (const bone of this.bones) {
            bone.draw(context);
        }
    }

    solve(point1, point2, nbIterations) {
        for (let i = 0; i < nbIterations; i++) {
            this.lastBone.node2.moveTo(point2);
            for (const bone of this.bones.reverse()) {
                bone.adjust(true);
            }
            this.firstBone.node1.moveTo(point1);
            for (const bone of this.bones) {
                bone.adjust(false);
            }
        }
    }
}