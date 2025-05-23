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

    startAnimation(animationType, duration = null, loops = false) {
        this.currentAnimation = animationType;
        this.animationTime = 0;
        this.isPlaying = true;
        this.loops = loops;
        
        if (animationType === 'frontFlip') {
            const earthInitialVelocity = Math.sqrt(2 * 9.8 * 1.2); // 지구 기준
            const totalFlightTime = (2 * earthInitialVelocity) / Math.max(this.gravity, 0.01);
            this.animationDuration = totalFlightTime * 1000;
        } else {
            this.animationDuration = duration || 2000;
        }
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
                    rotations: { ...this.baseRotations }, 
                    translations: { ...this.baseTranslations }
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
        const rotations = { ...this.baseRotations };
        const translations = { ...this.baseTranslations };

        // 물리적으로 정확한 점프 계산
        // 지구 기준 점프 높이: 1.2m, 초기 속도: 4.85m/s
        const earthJumpHeight = 1.2;
        const earthInitialVelocity = Math.sqrt(2 * 9.8 * earthJumpHeight); // ≈ 4.85 m/s
        
        // 현재 중력에서의 점프 높이와 체공 시간
        const currentJumpHeight = (earthInitialVelocity * earthInitialVelocity) / (2 * Math.max(this.gravity, 0.01));
        const totalFlightTime = (2 * earthInitialVelocity) / Math.max(this.gravity, 0.01);
        
        // 현재 시간 (초 단위)
        const currentTime = progress * totalFlightTime;
        
        // 포물선 운동으로 높이 계산
        let hipsY = Math.max(0, earthInitialVelocity * currentTime - 0.5 * this.gravity * currentTime * currentTime);
        
        // 미세한 전진 움직임
        const forwardMotion = 0.03 * Math.sin(progress * Math.PI);

        // 회전은 지면을 떠날 때 시작해서 착지 직전에 완료
        let globalRotationX = 0;
        
        // 지면에서 떠난 순간부터 착지 직전까지만 회전
        if (hipsY > 0.01) {
            // 체공 구간에서만 회전 진행
            const airborneStart = earthInitialVelocity / Math.max(this.gravity, 0.01) - Math.sqrt((earthInitialVelocity * earthInitialVelocity) - (2 * this.gravity * 0.01)) / Math.max(this.gravity, 0.01);
            const airborneEnd = earthInitialVelocity / Math.max(this.gravity, 0.01) + Math.sqrt((earthInitialVelocity * earthInitialVelocity) - (2 * this.gravity * 0.01)) / Math.max(this.gravity, 0.01);
            
            if (currentTime >= airborneStart && currentTime <= airborneEnd) {
                const airborneProgress = (currentTime - airborneStart) / (airborneEnd - airborneStart);
                globalRotationX = Math.min(airborneProgress * 360, 360);
            } else if (currentTime > airborneEnd) {
                globalRotationX = 360;
            }
        }
        
        // 자세 변화는 높이와 회전에 따라 동적으로 조절
        let tuckFactor = 0;
        
        // 높이 기반 자세 조절
        const heightRatio = hipsY / currentJumpHeight;
        const rotationRatio = globalRotationX / 360;
        
        if (heightRatio < 0.15 && rotationRatio < 0.1) {
            // Phase 1: 준비 및 이륙 (지면 근처, 회전 시작 전)
            const phaseT = Math.min(heightRatio / 0.15, rotationRatio / 0.1);
            const prep = this.easeOut(phaseT);
            
            rotations["LEFT_UPLEG"] = [30 * prep, 0, -3];
            rotations["RIGHT_UPLEG"] = [30 * prep, 0, 3];
            rotations["LEFT_LEG"] = [45 * prep, 0, 0];
            rotations["RIGHT_LEG"] = [45 * prep, 0, 0];
            
            rotations["LEFT_ARM"] = [-15 * prep, 0, -10];
            rotations["RIGHT_ARM"] = [-15 * prep, 0, 10];
            
        } else if (rotationRatio > 0.1 && rotationRatio < 0.85) {
            // Phase 2: 공중에서 턱 자세 (회전 중)
            const phaseT = (rotationRatio - 0.1) / 0.75;
            tuckFactor = Math.sin(phaseT * Math.PI * 0.8); // 부드러운 턱 곡선
            
            rotations["LEFT_UPLEG"] = [30 + (90 * tuckFactor), 0, -5];
            rotations["RIGHT_UPLEG"] = [30 + (90 * tuckFactor), 0, 5];
            rotations["LEFT_LEG"] = [45 + (115 * tuckFactor), 0, 0];
            rotations["RIGHT_LEG"] = [45 + (115 * tuckFactor), 0, 0];
            
            rotations["LEFT_ARM"] = [-15 + (115 * tuckFactor), 0, -10 + (50 * tuckFactor)];
            rotations["RIGHT_ARM"] = [-15 + (115 * tuckFactor), 0, 10 - (50 * tuckFactor)];
            rotations["LEFT_FOREARM"] = [90 * tuckFactor, 0, 0];
            rotations["RIGHT_FOREARM"] = [90 * tuckFactor, 0, 0];
            
            rotations["SPINE"] = [25 * tuckFactor, 0, 0];
            rotations["SPINE1"] = [20 * tuckFactor, 0, 0];
            rotations["NECK"] = [15 * tuckFactor, 0, 0];
            
        } else if (rotationRatio >= 0.85 || heightRatio < 0.2) {
            // Phase 3: 착지 준비 (회전 완료 또는 착지 임박)
            const phaseT = Math.max((rotationRatio - 0.85) / 0.15, (0.2 - heightRatio) / 0.2);
            const landing = this.easeOut(Math.min(phaseT, 1.0));
            tuckFactor = Math.max(0, 1 - landing);
            
            // 착지할 때 기본 자세로 부드럽게 전환
            rotations["LEFT_UPLEG"] = [120 * tuckFactor, 0, -5 * tuckFactor];
            rotations["RIGHT_UPLEG"] = [120 * tuckFactor, 0, 5 * tuckFactor];
            rotations["LEFT_LEG"] = [160 * tuckFactor, 0, 0];
            rotations["RIGHT_LEG"] = [160 * tuckFactor, 0, 0];
            
            rotations["LEFT_ARM"] = [100 * tuckFactor, 0, 40 * tuckFactor];
            rotations["RIGHT_ARM"] = [100 * tuckFactor, 0, -40 * tuckFactor];
            rotations["LEFT_FOREARM"] = [90 * tuckFactor, 0, 0];
            rotations["RIGHT_FOREARM"] = [90 * tuckFactor, 0, 0];
            
            rotations["SPINE"] = [25 * tuckFactor, 0, 0];
            rotations["SPINE1"] = [20 * tuckFactor, 0, 0];
            rotations["NECK"] = [15 * tuckFactor, 0, 0];
        }

        // 전역 회전은 HIPS(root)에만 적용
        // 계층 구조에서 HIPS가 회전하면 모든 자식 노드들이 함께 회전
        rotations["HIPS"][0] = globalRotationX;

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