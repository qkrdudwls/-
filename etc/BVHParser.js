"use strict";

class BVHLoader {
    constructor() {
        this.hierarchy = [];
        this.frames = [];
        this.frameTime = 0;
        this.jointNameMap = this.createJointNameMap();
        this.coordinateSystem = 'mixamo'; // 좌표계 식별
    }

    createJointNameMap() {
        const map = {
            "mixamorig:Hips": "HIPS",
            "mixamorig:Spine": "SPINE",
            "mixamorig:Spine1": "SPINE1",
            "mixamorig:Spine2": "SPINE2",
            "mixamorig:Neck": "NECK",
            "mixamorig:Head": "HEAD",
            "mixamorig:HeadTop_End": "HEAD_TOPEND",
            "mixamorig:LeftShoulder": "LEFT_SHOULDER",
            "mixamorig:LeftArm": "LEFT_ARM",
            "mixamorig:LeftForeArm": "LEFT_FOREARM",
            "mixamorig:LeftHand": "LEFT_HAND",
            "mixamorig:LeftHandThumb1": "LEFT_THUMB1",
            "mixamorig:LeftHandThumb2": "LEFT_THUMB2",
            "mixamorig:LeftHandThumb3": "LEFT_THUMB3",
            "mixamorig:LeftHandThumb4": "LEFT_THUMB4",
            "mixamorig:LeftHandIndex1": "LEFT_INDEX1",
            "mixamorig:LeftHandIndex2": "LEFT_INDEX2",
            "mixamorig:LeftHandIndex3": "LEFT_INDEX3",
            "mixamorig:LeftHandIndex4": "LEFT_INDEX4",
            "mixamorig:LeftHandMiddle1": "LEFT_MIDDLE1",
            "mixamorig:LeftHandMiddle2": "LEFT_MIDDLE2",
            "mixamorig:LeftHandMiddle3": "LEFT_MIDDLE3",
            "mixamorig:LeftHandMiddle4": "LEFT_MIDDLE4",
            "mixamorig:LeftHandRing1": "LEFT_RING1",
            "mixamorig:LeftHandRing2": "LEFT_RING2",
            "mixamorig:LeftHandRing3": "LEFT_RING3",
            "mixamorig:LeftHandRing4": "LEFT_RING4",
            "mixamorig:LeftHandPinky1": "LEFT_PINKY1",
            "mixamorig:LeftHandPinky2": "LEFT_PINKY2",
            "mixamorig:LeftHandPinky3": "LEFT_PINKY3",
            "mixamorig:LeftHandPinky4": "LEFT_PINKY4",
            "mixamorig:RightShoulder": "RIGHT_SHOULDER",
            "mixamorig:RightArm": "RIGHT_ARM",
            "mixamorig:RightForeArm": "RIGHT_FOREARM",
            "mixamorig:RightHand": "RIGHT_HAND",
            "mixamorig:RightHandThumb1": "RIGHT_THUMB1",
            "mixamorig:RightHandThumb2": "RIGHT_THUMB2",
            "mixamorig:RightHandThumb3": "RIGHT_THUMB3",
            "mixamorig:RightHandThumb4": "RIGHT_THUMB4",
            "mixamorig:RightHandIndex1": "RIGHT_INDEX1",
            "mixamorig:RightHandIndex2": "RIGHT_INDEX2",
            "mixamorig:RightHandIndex3": "RIGHT_INDEX3",
            "mixamorig:RightHandIndex4": "RIGHT_INDEX4",
            "mixamorig:RightHandMiddle1": "RIGHT_MIDDLE1",
            "mixamorig:RightHandMiddle2": "RIGHT_MIDDLE2",
            "mixamorig:RightHandMiddle3": "RIGHT_MIDDLE3",
            "mixamorig:RightHandMiddle4": "RIGHT_MIDDLE4",
            "mixamorig:RightHandRing1": "RIGHT_RING1",
            "mixamorig:RightHandRing2": "RIGHT_RING2",
            "mixamorig:RightHandRing3": "RIGHT_RING3",
            "mixamorig:RightHandRing4": "RIGHT_RING4",
            "mixamorig:RightHandPinky1": "RIGHT_PINKY1",
            "mixamorig:RightHandPinky2": "RIGHT_PINKY2",
            "mixamorig:RightHandPinky3": "RIGHT_PINKY3",
            "mixamorig:RightHandPinky4": "RIGHT_PINKY4",
            "mixamorig:LeftUpLeg": "LEFT_UPLEG",
            "mixamorig:LeftLeg": "LEFT_LEG",
            "mixamorig:LeftFoot": "LEFT_FOOT",
            "mixamorig:LeftToeBase": "LEFT_TOEBASE",
            "mixamorig:LeftToe_End": "LEFT_TOEEND",
            "mixamorig:RightUpLeg": "RIGHT_UPLEG",
            "mixamorig:RightLeg": "RIGHT_LEG",
            "mixamorig:RightFoot": "RIGHT_FOOT",
            "mixamorig:RightToeBase": "RIGHT_TOEBASE",
            "mixamorig:RightToe_End": "RIGHT_TOEEND",
            // Additional mappings - supporting other BVH formats
            "Hips": "HIPS",
            "Spine": "SPINE",
            "Spine1": "SPINE1",
            "Spine2": "SPINE2",
            "Neck": "NECK",
            "Head": "HEAD",
            "LeftShoulder": "LEFT_SHOULDER",
            "LeftArm": "LEFT_ARM",
            "LeftForeArm": "LEFT_FOREARM",
            "LeftHand": "LEFT_HAND",
            "RightShoulder": "RIGHT_SHOULDER",
            "RightArm": "RIGHT_ARM",
            "RightForeArm": "RIGHT_FOREARM",
            "RightHand": "RIGHT_HAND",
            "LeftUpLeg": "LEFT_UPLEG",
            "LeftLeg": "LEFT_LEG",
            "LeftFoot": "LEFT_FOOT",
            "RightUpLeg": "RIGHT_UPLEG",
            "RightLeg": "RIGHT_LEG",
            "RightFoot": "RIGHT_FOOT"
        };
        return map;
    }

    parse(bvhData) {
        const lines = bvhData.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        let lineIndex = 0;

        if (lineIndex >= lines.length || lines[lineIndex] !== "HIERARCHY") {
            throw new Error("BVH file must start with HIERARCHY");
        }
        lineIndex++;

        const parseJoint = (parentName = null) => {
            if (lineIndex >= lines.length) return null;

            const jointLine = lines[lineIndex++];
            const isRoot = jointLine.startsWith("ROOT");
            const isJoint = jointLine.startsWith("JOINT");
            const isEndSite = jointLine.startsWith("End Site");

            let jointName;
            if (isRoot || isJoint) {
                jointName = jointLine.split(/\s+/)[1];
            } else if (isEndSite) {
                jointName = `${parentName}_End`;
            } else {
                throw new Error(`Unexpected line: ${jointLine}`);
            }

            if (lineIndex >= lines.length) return null;

            if (lines[lineIndex++] !== "{") {
                throw new Error("Expected {");
            }

            const joint = {
                name: jointName,
                parent: parentName,
                offset: [0, 0, 0],
                channels: [],
                channelIndexes: [],
                children: []
            };

            // Parse joint contents
            while (lineIndex < lines.length) {
                const line = lines[lineIndex];
                
                if (line === "}") {
                    lineIndex++;
                    break;
                } else if (line.startsWith("OFFSET")) {
                    const offsetValues = line.split(/\s+/).slice(1).map(parseFloat);
                    joint.offset = offsetValues;
                    lineIndex++;
                } else if (line.startsWith("CHANNELS")) {
                    const parts = line.split(/\s+/);
                    const numChannels = parseInt(parts[1]);
                    joint.channels = parts.slice(2, 2 + numChannels);
                    lineIndex++;
                } else if (line.startsWith("JOINT") || line.startsWith("End Site")) {
                    const childJoint = parseJoint(jointName);
                    if (childJoint) {
                        joint.children.push(childJoint);
                    }
                } else {
                    lineIndex++;
                }
            }

            this.hierarchy.push(joint);
            return joint;
        };

        const rootJoint = parseJoint();

        // Find MOTION section
        while (lineIndex < lines.length && lines[lineIndex] !== "MOTION") {
            lineIndex++;
        }

        if (lineIndex >= lines.length) {
            throw new Error("No MOTION section found");
        }
        lineIndex++;

        // Parse frames info
        const framesLine = lines[lineIndex++];
        if (!framesLine.startsWith("Frames:")) {
            throw new Error(`Expected Frames: but got ${framesLine}`);
        }
        const numFrames = parseInt(framesLine.split(/\s+/)[1]);

        const frameTimeLine = lines[lineIndex++];
        if (!frameTimeLine.startsWith("Frame Time:")) {
            throw new Error(`Expected Frame Time: but got ${frameTimeLine}`);
        }
        this.frameTime = parseFloat(frameTimeLine.split(/\s+/)[2]);

        // Parse frame data
        for (let i = 0; i < numFrames && lineIndex < lines.length; i++) {
            const frameLine = lines[lineIndex++];
            const values = frameLine.split(/\s+/).map(parseFloat);
            this.frames.push(values);
        }

        // Calculate channel indices
        let channelIndex = 0;
        for (const joint of this.hierarchy) {
            joint.channelIndexes = [];
            for (let i = 0; i < joint.channels.length; i++) {
                joint.channelIndexes.push(channelIndex++);
            }
        }

        return {
            hierarchy: this.hierarchy,
            frames: this.frames,
            frameTime: this.frameTime
        };
    }

    // 좌표계 변환 함수들
    convertCoordinateSystem(position, rotation) {
        // Mixamo는 Y-up, Z-forward 좌표계 사용
        // 모델이 다른 좌표계를 사용한다면 변환 필요
        
        // 위치 변환 (Y와 Z 축 교환, 스케일 조정)
        const convertedPos = [
            position[0] / 100,  // X축 스케일 조정
            position[1] / 100,  // Y축 스케일 조정  
            -position[2] / 100  // Z축 반전 및 스케일 조정
        ];
        
        // 회전 변환 (축 순서 조정)
        const convertedRot = [
            -rotation[0], // X 회전 반전
            rotation[1],  // Y 회전 유지
            -rotation[2]  // Z 회전 반전
        ];
        
        return { position: convertedPos, rotation: convertedRot };
    }

    // Convert to radians
    degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    applyFrameToModel(frame, modelRoot) {
        if (this.printCount === undefined) this.printCount = 0;

        const applyToNode = (bvhJoint, frameData) => {
            const modelNodeName = this.jointNameMap[bvhJoint.name];
            if (!modelNodeName) {
                if (bvhJoint.name.endsWith("End") || bvhJoint.name.includes("_End")) return;
                console.warn(`No jointNameMap mapping for BVH joint: ${bvhJoint.name}`);
                return;
            }

            const findNode = (node, name) => {
                if (!node) return null;
                if (node.name === name) return node;
                
                const foundInChild = findNode(node.child, name);
                if (foundInChild) return foundInChild;

                const foundInSibling = findNode(node.sibling, name);
                if (foundInSibling) return foundInSibling;
                
                return null;
            };

            const modelNode = findNode(modelRoot, modelNodeName);
            if (!modelNode) {
                console.warn(`Model node not found for: ${modelNodeName}`);
                return;
            }

            const position = [0, 0, 0];
            const rotationValues = [0, 0, 0];
            let hasPosition = false;

            // 채널 데이터 추출
            for (let i = 0; i < bvhJoint.channels.length; i++) {
                const channelName = bvhJoint.channels[i];
                const value = frameData[bvhJoint.channelIndexes[i]];

                // 위치 데이터
                if (channelName === "Xposition") {
                    position[0] = value;
                    hasPosition = true;
                } else if (channelName === "Yposition") {
                    position[1] = value;
                    hasPosition = true;
                } else if (channelName === "Zposition") {
                    position[2] = value;
                    hasPosition = true;
                }
                
                // 회전 데이터 (degrees)
                else if (channelName === "Xrotation") {
                    rotationValues[0] = value;
                } else if (channelName === "Yrotation") {
                    rotationValues[1] = value;
                } else if (channelName === "Zrotation") {
                    rotationValues[2] = value;
                }
            }
            
            if (this.printCount < 20) {
                console.log(`Joint: ${bvhJoint.name}, Frame rotation (deg): X=${rotationValues[0]}, Y=${rotationValues[1]}, Z=${rotationValues[2]}`);
                this.printCount++;
            }
            // 좌표계 변환 적용
            const converted = this.convertCoordinateSystem(position, rotationValues);

            // 회전값을 라디안으로 변환
            modelNode.rotation = [
                this.degToRad(converted.rotation[0]),
                this.degToRad(converted.rotation[1]),
                this.degToRad(converted.rotation[2])
            ];

            // 루트 노드에만 위치 적용
            if (hasPosition && modelNode.name === "HIPS") {
                modelNode.translation = converted.position;
            }

            // 자식 노드들에 재귀적으로 적용
            for (const childJoint of bvhJoint.children) {
                applyToNode(childJoint, frameData);
            }
        };

        const rootJoint = this.hierarchy.find(joint => joint.parent === null);
        if (rootJoint) {
            applyToNode(rootJoint, frame);
        }
    }

    // 디버깅을 위한 프레임 정보 출력
    debugFrame(frameIndex) {
        if (frameIndex >= this.frames.length) return;
        
        const frame = this.frames[frameIndex];
        console.log(`Frame ${frameIndex}:`);
        
        let channelIndex = 0;
        for (const joint of this.hierarchy) {
            if (joint.channels.length > 0) {
                console.log(`  ${joint.name}:`);
                for (let i = 0; i < joint.channels.length; i++) {
                    const channel = joint.channels[i];
                    const value = frame[channelIndex++];
                    console.log(`    ${channel}: ${value}`);
                }
            }
        }
    }

    checkHierarchyCompatibility(modelHierarchy) {
        // Extract all joint names from BVH hierarchy
        const bvhJointNames = new Set();
        for (const joint of this.hierarchy) {
            const mappedName = this.jointNameMap[joint.name];
            if (mappedName) {
                bvhJointNames.add(mappedName);
            }
        }

        // Extract all joint names from model hierarchy
        const modelJointNames = new Set(Object.keys(modelHierarchy));
        
        // Find joints missing in each hierarchy
        const missingInBVH = [...modelJointNames].filter(name => !bvhJointNames.has(name));
        const missingInModel = [...bvhJointNames].filter(name => !modelJointNames.has(name));
        
        return {
            compatible: missingInBVH.length === 0 || missingInModel.length === 0,
            missingInBVH,
            missingInModel
        };
    }
}

class BVHAnimationController {
    constructor(bvhLoader) {
        this.bvhLoader = bvhLoader;
        this.currentFrame = 0;
        this.isPlaying = false;
        this.lastFrameTime = 0;
        this.frameTime = bvhLoader.frameTime * 1000; // Convert to milliseconds
        this.totalFrames = bvhLoader.frames.length;
        this.playbackSpeed = 1.0; // 재생 속도 조절
    }

    play() {
        this.isPlaying = true;
        this.lastFrameTime = performance.now();
    }

    pause() {
        this.isPlaying = false;
    }

    reset() {
        this.currentFrame = 0;
    }

    setFrame(frameIndex) {
        this.currentFrame = Math.max(0, Math.min(frameIndex, this.totalFrames - 1));
    }

    setPlaybackSpeed(speed) {
        this.playbackSpeed = Math.max(0.1, Math.min(speed, 3.0));
    }

    update(modelRoot, currentTime) {
        if (!this.isPlaying || this.totalFrames === 0) return;

        const deltaTime = currentTime - this.lastFrameTime;
        const adjustedFrameTime = this.frameTime / this.playbackSpeed;
        
        if (deltaTime >= adjustedFrameTime) {
            this.lastFrameTime = currentTime;
            this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
            
            const frameData = this.bvhLoader.frames[this.currentFrame];
            this.bvhLoader.applyFrameToModel(frameData, modelRoot);
            
            // 디버깅을 위해 특정 프레임 정보 출력 (선택적)
            if (this.currentFrame === 0) {
                // this.bvhLoader.debugFrame(0);
            }
        }
    }

    // 현재 프레임 정보 반환
    getCurrentFrameInfo() {
        return {
            current: this.currentFrame,
            total: this.totalFrames,
            time: this.currentFrame * this.bvhLoader.frameTime,
            totalTime: this.totalFrames * this.bvhLoader.frameTime
        };
    }
}

// Asynchronously load a BVH file
async function fetchBVHFile(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load BVH file: ${response.status} ${response.statusText}`);
        }
        return await response.text();
    } catch (error) {
        console.error("Error loading BVH file:", error);
        throw error;
    }
}

// Load a BVH file and return an animation controller
async function loadBVHAnimation(url, modelRoot, modelHierarchy) {
    try {
        const bvhText = await fetchBVHFile(url);
        
        const loader = new BVHLoader();
        const bvhData = loader.parse(bvhText);
        
        console.log("BVH Data loaded:", {
            totalFrames: bvhData.frames.length,
            frameTime: bvhData.frameTime,
            totalJoints: bvhData.hierarchy.length
        });
        
        if (modelHierarchy) {
            const compatibilityCheck = loader.checkHierarchyCompatibility(modelHierarchy);
            console.log("BVH ↔ Model compatibility check:", compatibilityCheck);

            if (!compatibilityCheck.compatible) {
                console.warn("BVH and model hierarchies are not fully compatible:");
                console.warn("Missing in BVH:", compatibilityCheck.missingInBVH);
                console.warn("Missing in Model:", compatibilityCheck.missingInModel);
            }
        }
        
        const controller = new BVHAnimationController(loader);
        
        // 첫 번째 프레임 적용 (초기 포즈)
        if (bvhData.frames.length > 0) {
            loader.applyFrameToModel(bvhData.frames[0], modelRoot);
        }
        
        controller.play();
        
        return controller;
    } catch (error) {
        console.error("Failed to load BVH animation:", error);
        return null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BVHLoader,
        BVHAnimationController,
        fetchBVHFile,
        loadBVHAnimation
    };
}