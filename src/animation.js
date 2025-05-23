class AnimationSystem {
    constructor() {
        this.gravity = 9.8;
        this.currentAnimation = null;
        this.animationTime = 0;
        this.animationDuration = 0;
        this.isPlaying = false;
        this.loops = false;

        this.animationQueue = [];
        this.baseRotations = this.getBaseRotations();
        this.baseTranslations = this.getBaseTranslations();
        this.previousRotations = { ...this.baseRotations };
        this.previousTranslations = { ...this.baseTranslations };
        
        // 전체 몸의 중심점 (center of mass)
        this.centerOfMass = vec3(0, 0, 0);
        this.initialHipsHeight = 0.0;
    }

    getBaseRotations() {
        return {
            "HIPS": [0, 0, 0],
            "SPINE": [0, 0, 0],
            "SPINE1": [0, 0, 0],
            "SPINE2": [0, 0, 0],
            "NECK": [0, 0, 0],
            "HEAD": [0, 0, 0],
            "LEFT_SHOULDER": [0, 0, 0],
            "RIGHT_SHOULDER": [0, 0, 0],
            "LEFT_ARM": [0, 0, 0],
            "RIGHT_ARM": [0, 0, 0],
            "LEFT_FOREARM": [0, 0, 0],
            "RIGHT_FOREARM": [0, 0, 0],
            "LEFT_HAND": [0, 0, 0],
            "RIGHT_HAND": [0, 0, 0],
            "LEFT_THUMB1": [0, 0, 0],
            "LEFT_THUMB2": [0, 0, 0],
            "LEFT_THUMB3": [0, 0, 0],
            "LEFT_THUMB4": [0, 0, 0],
            "LEFT_INDEX1": [0, 0, 0],
            "LEFT_INDEX2": [0, 0, 0],
            "LEFT_INDEX3": [0, 0, 0],
            "LEFT_INDEX4": [0, 0, 0],
            "LEFT_MIDDLE1": [0, 0, 0],
            "LEFT_MIDDLE2": [0, 0, 0],
            "LEFT_MIDDLE3": [0, 0, 0],
            "LEFT_MIDDLE4": [0, 0, 0],
            "LEFT_RING1": [0, 0, 0],
            "LEFT_RING2": [0, 0, 0],
            "LEFT_RING3": [0, 0, 0],
            "LEFT_RING4": [0, 0, 0],
            "LEFT_PINKY1": [0, 0, 0],
            "LEFT_PINKY2": [0, 0, 0],
            "LEFT_PINKY3": [0, 0, 0],
            "LEFT_PINKY4": [0, 0, 0],
            "RIGHT_THUMB1": [0, 0, 0],
            "RIGHT_THUMB2": [0, 0, 0],
            "RIGHT_THUMB3": [0, 0, 0],
            "RIGHT_THUMB4": [0, 0, 0],
            "RIGHT_INDEX1": [0, 0, 0],
            "RIGHT_INDEX2": [0, 0, 0],
            "RIGHT_INDEX3": [0, 0, 0],
            "RIGHT_INDEX4": [0, 0, 0],
            "RIGHT_MIDDLE1": [0, 0, 0],
            "RIGHT_MIDDLE2": [0, 0, 0],
            "RIGHT_MIDDLE3": [0, 0, 0],
            "RIGHT_MIDDLE4": [0, 0, 0],
            "RIGHT_RING1": [0, 0, 0],
            "RIGHT_RING2": [0, 0, 0],
            "RIGHT_RING3": [0, 0, 0],
            "RIGHT_RING4": [0, 0, 0],
            "RIGHT_PINKY1": [0, 0, 0],
            "RIGHT_PINKY2": [0, 0, 0],
            "RIGHT_PINKY3": [0, 0, 0],
            "RIGHT_PINKY4": [0, 0, 0],
            "LEFT_UPLEG": [0, 0, 0],
            "RIGHT_UPLEG": [0, 0, 0],
            "LEFT_LEG": [0, 0, 0],
            "RIGHT_LEG": [0, 0, 0],
            "LEFT_FOOT": [0, 0, 0],
            "RIGHT_FOOT": [0, 0, 0],
            "LEFT_TOEBASE": [0, 0, 0],
            "RIGHT_TOEBASE": [0, 0, 0],
            "LEFT_TOEEND": [0, 0, 0],
            "RIGHT_TOEEND": [0, 0, 0]
        };
    }

    getBaseTranslations() {
        return {
            "HIPS": [0, 0, 0]
        };
    }

    easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    easeIn(t) {
        return t * t * t;
    }

    setGravity(gravity) {
        this.gravity = gravity;
    }

    getGravityMultiplier() {
        if (this.gravity === 0) return 0.1;
        return Math.sqrt(this.gravity / 9.8);
    }

    startAnimation(animationType, duration = 2000, loops = false) {
        this.currentAnimation = animationType;
        this.animationTime = 0;
        this.animationDuration = duration;
        this.isPlaying = true;
        this.loops = loops;
    }

    updateAnimation(deltaTime) {
        if (!this.isPlaying || !this.currentAnimation) return null;

        this.animationTime += deltaTime;
        const progress = Math.min(this.animationTime / this.animationDuration, 1.0);

        if (progress >= 1.0) {
            if (this.loops) {
                this.animationTime = 0;
            } else {
                this.isPlaying = false;
                this.currentAnimation = null;
                return { 
                    rotations: this.baseRotations, 
                    translations: this.baseTranslations 
                };
            }
        }

        const result = this.calculateAnimationFrame(progress);
        this.previousRotations = {...result.rotations};
        this.previousTranslations = {...result.translations};
        
        return result;
    }

    calculateAnimationFrame(progress) {
        switch (this.currentAnimation) {
            case 'frontFlip':
                return this.frontFlipAnimation(progress);
            default:
                return { 
                    rotations: this.baseRotations, 
                    translations: this.baseTranslations 
                };
        }
    }

    frontFlipAnimation(progress) {
        const gravityMult = this.getGravityMultiplier();
        const rotations = { ...this.baseRotations };
        const translations = { ...this.baseTranslations };

        // 물리적으로 정확한 점프 계산
        const jumpHeight = 1.2 / Math.max(gravityMult, 0.1);
        const totalTime = Math.sqrt(8 * jumpHeight / this.gravity); // 총 비행시간
        const currentTime = progress * totalTime;
        
        // 포물선 운동: y = v0*t - 0.5*g*t²
        const initialVelocity = Math.sqrt(2 * this.gravity * jumpHeight);
        let hipsY = Math.max(0, initialVelocity * currentTime - 0.5 * this.gravity * currentTime * currentTime);
        
        // 전진 움직임 최소화 (거의 제자리 점프)
        const forwardMotion = 0.02 * Math.sin(progress * Math.PI);

        // **핵심 수정**: 전체 몸이 하나의 강체처럼 회전하도록 통일된 회전값 사용
        let globalRotationX = 0; // Front flip은 X축 중심 회전
        
        if (progress < 0.1) {
            // Phase 1: 준비 자세 (웅크리기)
            const phaseT = progress / 0.1;
            const prep = this.easeInOut(phaseT);
            
            // 몸 전체를 약간 뒤로 기울이기 (도약 준비)
            globalRotationX = -10 * prep;
            
            // 다리 굽히기 (힘 모으기)
            rotations["LEFT_UPLEG"] = [60 * prep, 0, -3];
            rotations["RIGHT_UPLEG"] = [60 * prep, 0, 3];
            rotations["LEFT_LEG"] = [100 * prep, 0, 0];
            rotations["RIGHT_LEG"] = [100 * prep, 0, 0];
            
            // 팔을 뒤로 젖히기 (추진력 준비)
            rotations["LEFT_ARM"] = [-30 * prep, 0, -10];
            rotations["RIGHT_ARM"] = [-30 * prep, 0, 10];
            
        } else if (progress < 0.9) {
            // Phase 2: 회전 단계 (10-90%)
            const phaseT = (progress - 0.1) / 0.8;
            
            // **핵심**: 전체 몸이 함께 회전 (360도 완전 회전)
            globalRotationX = this.easeInOut(phaseT) * 360;
            
            // 몸을 둥글게 말기 (tuck position) - 회전 속도 증가
            const tuckFactor = Math.sin(phaseT * Math.PI) * 0.8;
            
            // 다리를 가슴 쪽으로 당기기
            rotations["LEFT_UPLEG"] = [120 * tuckFactor + 20, 0, -5];
            rotations["RIGHT_UPLEG"] = [120 * tuckFactor + 20, 0, 5];
            rotations["LEFT_LEG"] = [140 * tuckFactor, 0, 0];
            rotations["RIGHT_LEG"] = [140 * tuckFactor, 0, 0];
            
            // 팔로 다리 감싸기
            rotations["LEFT_ARM"] = [100 * tuckFactor, 0, 40 * tuckFactor];
            rotations["RIGHT_ARM"] = [100 * tuckFactor, 0, -40 * tuckFactor];
            rotations["LEFT_FOREARM"] = [130 * tuckFactor, 0, 0];
            rotations["RIGHT_FOREARM"] = [130 * tuckFactor, 0, 0];
            
            // 상체도 둥글게
            rotations["SPINE"] = [20 * tuckFactor, 0, 0];
            rotations["SPINE1"] = [15 * tuckFactor, 0, 0];
            rotations["NECK"] = [10 * tuckFactor, 0, 0];
            
        } else {
            // Phase 3: 착지 준비 (90-100%)
            const phaseT = (progress - 0.9) / 0.1;
            const landing = this.easeOut(phaseT);
            
            // 회전 완료 후 정상 자세로 복귀
            globalRotationX = 360 * (1 - landing * 0.3); // 약간의 잔여 회전
            
            // 착지를 위해 몸 펴기
            const extend = landing;
            rotations["LEFT_UPLEG"] = [15 * (1-extend), 0, -2 * (1-extend)];
            rotations["RIGHT_UPLEG"] = [15 * (1-extend), 0, 2 * (1-extend)];
            rotations["LEFT_LEG"] = [30 * (1-extend), 0, 0];
            rotations["RIGHT_LEG"] = [30 * (1-extend), 0, 0];
            
            // 팔 펼치기 (균형 잡기)
            rotations["LEFT_ARM"] = [5 * (1-extend), 0, -15 * (1-extend)];
            rotations["RIGHT_ARM"] = [5 * (1-extend), 0, 15 * (1-extend)];
            rotations["LEFT_FOREARM"] = [10 * (1-extend), 0, 0];
            rotations["RIGHT_FOREARM"] = [10 * (1-extend), 0, 0];
        }

        // **핵심 수정**: 모든 주요 관절에 동일한 전역 회전 적용 (강체처럼)
        rotations["HIPS"][0] += globalRotationX;
        rotations["SPINE"][0] += globalRotationX * 0.95;
        rotations["SPINE1"][0] += globalRotationX * 0.9;
        rotations["SPINE2"][0] += globalRotationX * 0.85;
        rotations["NECK"][0] += globalRotationX * 0.8;
        rotations["HEAD"][0] += globalRotationX * 0.75;
        
        // 사지도 몸과 함께 회전
        rotations["LEFT_UPLEG"][0] += globalRotationX * 0.7;
        rotations["RIGHT_UPLEG"][0] += globalRotationX * 0.7;
        rotations["LEFT_LEG"][0] += globalRotationX * 0.6;
        rotations["RIGHT_LEG"][0] += globalRotationX * 0.6;
        rotations["LEFT_ARM"][0] += globalRotationX * 0.8;
        rotations["RIGHT_ARM"][0] += globalRotationX * 0.8;

        translations["HIPS"] = [forwardMotion, hipsY, 0];

        return { rotations, translations };
    }

    applyAnimationToTree(node, rotations, translations) {
        if (!node) return;
        
        // HIPS에 translation 적용
        if (node.name === "HIPS" && translations && translations["HIPS"]) {
            const [x, y, z] = translations["HIPS"];
            // 기존 translation에 애니메이션 offset 추가
            node.translation = vec3(
                x, 
                y, 
                z
            );
        }
        
        // 모든 관절에 rotation 적용
        if (rotations && rotations[node.name]) {
            const [x, y, z] = rotations[node.name];
            node.rotation = vec3(x, y, z);
        }
        
        if (node.child) this.applyAnimationToTree(node.child, rotations, translations);
        if (node.sibling) this.applyAnimationToTree(node.sibling, rotations, translations);
    }
}

const animationSystem = new AnimationSystem();

function setGravity(gravity) {
    animationSystem.setGravity(gravity);
}

function playAnimation(type, duration = 2000, loops = false) {
    animationSystem.startAnimation(type, duration, loops);
}

function updateAnimations(deltaTime, rootNode) {
    const result = animationSystem.updateAnimation(deltaTime);
    if (result) {
        animationSystem.applyAnimationToTree(rootNode, result.rotations, result.translations);
    }
    return result;
}

const GRAVITY_PRESETS = {
    EARTH: 9.8,
    MOON: 1.6,
    MARS: 3.7,
    JUPITER: 24.8,
    TITAN: 1.4,
    EUROPA: 1.3,
    CERES: 0.27,
    ZERO_G: 0.0,
    MICRO_G: 0.01
};

const ANIMATION_TYPES = {
    FRONT_FLIP: 'frontFlip'
};

function setSpaceEnvironment(environment) {
    switch(environment.toLowerCase()) {
        case 'earth':
            setGravity(GRAVITY_PRESETS.EARTH);
            break;
        case 'moon':
            setGravity(GRAVITY_PRESETS.MOON);
            break;
        case 'mars':
            setGravity(GRAVITY_PRESETS.MARS);
            break;
        case 'jupiter':
            setGravity(GRAVITY_PRESETS.JUPITER);
            break;
        case 'space':
        case 'zerog':
            setGravity(GRAVITY_PRESETS.ZERO_G);
            break;
        case 'asteroid':
            setGravity(GRAVITY_PRESETS.CERES);
            break;
        default:
            setGravity(GRAVITY_PRESETS.EARTH);
    }
}

window.animationSystem = animationSystem;