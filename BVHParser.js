class BVHParser {
    constructor() {
        this.hierarchy = null;
        this.motion = [];
    }

    parse(text) {
        const lines = text.split(/\r?\n/);
        let index = 0;

        if (lines[index].trim() !== "HIERARCHY") {
        throw new Error("Invalid BVH format: Missing HIERARCHY section.");
        }
        index++;

        this.hierarchy = this.parseHierarchy(lines, index);

        while (!lines[index].startsWith("MOTION")) index++;
        index++;
        this.motion = this.parseMotion(lines, index);
        
        return { hierarchy: this.hierarchy, motion: this.motion };
    }

    parseHierarchy(lines, index) {
        let stack = [];
        let root = null;

        while (index < lines.length) {
        const line = lines[index].trim();
        index++;

        if (line.startsWith("ROOT") || line.startsWith("JOINT")) {
            const parts = line.split(" ");
            const node = { name: parts[1], offset: null, channels: [], children: [] };

            stack.push(node);
            if (!root) root = node;
        } else if (line.startsWith("OFFSET")) {
            const parts = line.split(" ");
            stack[stack.length - 1].offset = [parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])];
        } else if (line.startsWith("CHANNELS")) {
            const parts = line.split(" ");
            stack[stack.length - 1].channels = parts.slice(2);
        } else if (line.startsWith("End Site")) {
            const node = { name: "End Site", offset: null, children: [] };
            stack[stack.length - 1].children.push(node);
        } else if (line === "}") {
            const node = stack.pop();
            if (stack.length > 0) stack[stack.length - 1].children.push(node);
        }
        }
        return root;
    }

    parseMotion(lines, index) {
        let motionData = [];
        
        const frameCount = parseInt(lines[index].split(":")[1].trim());
        index++;
        const frameTime = parseFloat(lines[index].split(":")[1].trim());
        index++;

        for (let i = 0; i < frameCount; i++) {
            const values = lines[index].trim().split(" ").map(parseFloat);
            motionData.push(values);
            index++;
        }

        return { frameCount, frameTime, frames: motionData };
    }
}

export default BVHParser;