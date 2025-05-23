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
        
        if (animationType === 'frontFlip' || animationType === 'backFlip') {
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
            case 'greeting':
                return this.greetingAnimation(progress);
            case 'frontFlip':
                return this.frontFlipAnimation(progress);
            case 'backFlip':
                return this.backFlipAnimation(progress);
            default:
                return { 
                    rotations: this.baseRotations, 
                    translations: this.baseTranslations 
                };
        }
    }

    greetingAnimation(progress) {
        const rotations = { ...this.baseRotations };
        const translations = { ...this.baseTranslations };

        // 3단계로 나누어 자연스러운 인사 동작 구현
        let waveProgress = 0;
        
        if (progress < 0.3) {
            // Phase 1: 손 올리기 (0 ~ 0.3)
            const phaseT = progress / 0.3;
            const raise = this.easeOut(phaseT);
            
            // 어깨 - 자연스럽게 올리기
            rotations["LEFT_SHOULDER"] = [20 * raise, 0, -15 * raise];
            
            // 팔 - 앞으로 올리면서 약간 벌리기
            rotations["LEFT_ARM"] = [45 * raise, 45 * raise, -45 * raise];
            rotations["LEFT_FOREARM"] = [0, 0, 0];
            
            // 손 - 손바닥이 상대방을 향하도록
            rotations["LEFT_HAND"] = [0, 0, 0];
            
            // 손가락 - 완전히 펴기
            rotations["LEFT_THUMB1"] = [0, 0, -10 * raise];
            rotations["LEFT_THUMB2"] = [0, 0, 0];
            rotations["LEFT_THUMB3"] = [0, 0, 0];
            rotations["LEFT_THUMB4"] = [0, 0, 0];
            
            const fingers = ["INDEX", "MIDDLE", "RING", "PINKY"];
            fingers.forEach(finger => {
                rotations[`LEFT_${finger}1`] = [0, 0, 0];
                rotations[`LEFT_${finger}2`] = [0, 0, 0];
                rotations[`LEFT_${finger}3`] = [0, 0, 0];
                rotations[`LEFT_${finger}4`] = [0, 0, 0];
            });
            
        } else if (progress < 0.9) {
            // Phase 2: 손 흔들기 (0.3 ~ 0.9)
            const phaseT = (progress - 0.3) / 0.6;
            waveProgress = phaseT;
            
            // 어깨 - 고정된 위치
            rotations["LEFT_SHOULDER"] = [20, 0, -15];
            
            // 팔 - 기본 인사 위치
            rotations["LEFT_ARM"] = [45, 45, -45];
            
            // 손목을 이용한 흔들기 동작 (사인파 사용)
            const waveIntensity = 25;
            const waveFrequency = 6; // 6번 흔들기
            const waveAngle = Math.sin(waveProgress * Math.PI * waveFrequency) * waveIntensity;
            
            rotations["LEFT_FOREARM"] = [0, 0, 0];
            rotations["LEFT_HAND"] = [0, 0, waveAngle];
            
            // 손가락 - 완전히 펴진 상태 유지
            rotations["LEFT_THUMB1"] = [0, 0, -10];
            rotations["LEFT_THUMB2"] = [0, 0, 0];
            rotations["LEFT_THUMB3"] = [0, 0, 0];
            rotations["LEFT_THUMB4"] = [0, 0, 0];
            
            const fingers = ["INDEX", "MIDDLE", "RING", "PINKY"];
            fingers.forEach(finger => {
                rotations[`LEFT_${finger}1`] = [0, 0, 0];
                rotations[`LEFT_${finger}2`] = [0, 0, 0];
                rotations[`LEFT_${finger}3`] = [0, 0, 0];
                rotations[`LEFT_${finger}4`] = [0, 0, 0];
            });
            
        } else {
            // Phase 3: 손 내리기 (0.9 ~ 1.0)
            const phaseT = (progress - 0.9) / 0.1;
            const lower = this.easeIn(phaseT);
            
            // 어깨 - 원위치로
            rotations["LEFT_SHOULDER"] = [20 * (1 - lower), 0, -15 * (1 - lower)];
            
            // 팔 - 원위치로
            rotations["LEFT_ARM"] = [45 * (1 - lower), 45 * (1 - lower), -45 * (1 - lower)];
            rotations["LEFT_FOREARM"] = [0, 0, 0];
            
            // 손 - 원위치로
            rotations["LEFT_HAND"] = [0, 0, 0];
            
            // 손가락 - 자연스럽게 약간 구부러진 상태로
            const fingerRelax = 5 * lower;
            rotations["LEFT_THUMB1"] = [0, 0, -10 * (1 - lower)];
            rotations["LEFT_THUMB2"] = [fingerRelax, 0, 0];
            rotations["LEFT_THUMB3"] = [fingerRelax * 0.8, 0, 0];
            rotations["LEFT_THUMB4"] = [0, 0, 0];
            
            const fingers = ["INDEX", "MIDDLE", "RING", "PINKY"];
            fingers.forEach(finger => {
                rotations[`LEFT_${finger}1`] = [fingerRelax * 0.5, 0, 0];
                rotations[`LEFT_${finger}2`] = [fingerRelax * 0.8, 0, 0];
                rotations[`LEFT_${finger}3`] = [fingerRelax * 0.6, 0, 0];
                rotations[`LEFT_${finger}4`] = [0, 0, 0];
            });
        }

        // 오른손은 자연스럽게 옆에 두기
        rotations["RIGHT_SHOULDER"] = [0, 0, 5];
        rotations["RIGHT_ARM"] = [0, 0, 15];
        rotations["RIGHT_FOREARM"] = [0, 0, 0];
        rotations["RIGHT_HAND"] = [0, 0, 0];
        
        // 오른손 손가락 - 자연스럽게 약간 구부린 상태
        const rightFingerRelax = 8;
        rotations["RIGHT_THUMB1"] = [0, 0, rightFingerRelax];
        rotations["RIGHT_THUMB2"] = [rightFingerRelax * 0.8, 0, 0];
        rotations["RIGHT_THUMB3"] = [rightFingerRelax * 0.6, 0, 0];
        rotations["RIGHT_THUMB4"] = [0, 0, 0];
        
        const rightFingers = ["INDEX", "MIDDLE", "RING", "PINKY"];
        rightFingers.forEach(finger => {
            rotations[`RIGHT_${finger}1`] = [rightFingerRelax * 0.5, 0, 0];
            rotations[`RIGHT_${finger}2`] = [rightFingerRelax * 0.8, 0, 0];
            rotations[`RIGHT_${finger}3`] = [rightFingerRelax * 0.6, 0, 0];
            rotations[`RIGHT_${finger}4`] = [0, 0, 0];
        });

        // 몸 전체는 제자리에 서있는 자세
        rotations["SPINE"] = [0, 0, 0];
        rotations["SPINE1"] = [0, 0, 0];
        rotations["NECK"] = [0, 0, 0];
        rotations["HEAD"] = [0, 0, 0];
        
        // 다리는 자연스럽게 서있는 자세
        rotations["LEFT_UPLEG"] = [0, 0, 0];
        rotations["RIGHT_UPLEG"] = [0, 0, 0];
        rotations["LEFT_LEG"] = [0, 0, 0];
        rotations["RIGHT_LEG"] = [0, 0, 0];
        rotations["LEFT_FOOT"] = [0, 0, 0];
        rotations["RIGHT_FOOT"] = [0, 0, 0];

        return { rotations, translations };
    }

    frontFlipAnimation(progress) {
        const rotations = { ...this.baseRotations };
        const translations = { ...this.baseTranslations };

        // 물리적으로 정확한 점프 계산
        const earthJumpHeight = 1.2;
        const earthInitialVelocity = Math.sqrt(2 * 9.8 * earthJumpHeight);
        
        const currentJumpHeight = (earthInitialVelocity * earthInitialVelocity) / (2 * Math.max(this.gravity, 0.01));
        const totalFlightTime = (2 * earthInitialVelocity) / Math.max(this.gravity, 0.01);
        
        const currentTime = progress * totalFlightTime;
        
        let hipsY = Math.max(0, earthInitialVelocity * currentTime - 0.5 * this.gravity * currentTime * currentTime);
        
        const forwardMotion = 0.03 * Math.sin(progress * Math.PI);

        let globalRotationX = 0;
        
        if (hipsY > 0.01) {
            const airborneStart = earthInitialVelocity / Math.max(this.gravity, 0.01) - Math.sqrt((earthInitialVelocity * earthInitialVelocity) - (2 * this.gravity * 0.01)) / Math.max(this.gravity, 0.01);
            const airborneEnd = earthInitialVelocity / Math.max(this.gravity, 0.01) + Math.sqrt((earthInitialVelocity * earthInitialVelocity) - (2 * this.gravity * 0.01)) / Math.max(this.gravity, 0.01);
            
            if (currentTime >= airborneStart && currentTime <= airborneEnd) {
                const airborneProgress = (currentTime - airborneStart) / (airborneEnd - airborneStart);
                globalRotationX = Math.min(airborneProgress * 360, 360);
            } else if (currentTime > airborneEnd) {
                globalRotationX = 360;
            }
        }
        
        let tuckFactor = 0;
        
        const heightRatio = hipsY / currentJumpHeight;
        const rotationRatio = globalRotationX / 360;
        
        if (heightRatio < 0.15 && rotationRatio < 0.1) {
            // Phase 1: 준비 및 이륙
            const phaseT = Math.min(heightRatio / 0.15, rotationRatio / 0.1);
            const prep = this.easeOut(phaseT);
            
            // 다리
            rotations["LEFT_UPLEG"] = [30 * prep, 0, -3];
            rotations["RIGHT_UPLEG"] = [30 * prep, 0, 3];
            rotations["LEFT_LEG"] = [45 * prep, 0, 0];
            rotations["RIGHT_LEG"] = [45 * prep, 0, 0];
            
            // 어깨 - 약간 위로 올려서 준비 자세
            rotations["LEFT_SHOULDER"] = [10 * prep, 0, -5 * prep];
            rotations["RIGHT_SHOULDER"] = [10 * prep, 0, 5 * prep];
            
            // 팔 - 자연스러운 준비 동작
            rotations["LEFT_ARM"] = [-15 * prep, 15 * prep, -10];
            rotations["RIGHT_ARM"] = [-15 * prep, -15 * prep, 10];
            rotations["LEFT_FOREARM"] = [20 * prep, 0, 0];
            rotations["RIGHT_FOREARM"] = [20 * prep, 0, 0];
            
            // 손 - 약간 구부려서 준비
            rotations["LEFT_HAND"] = [10 * prep, 0, -5 * prep];
            rotations["RIGHT_HAND"] = [10 * prep, 0, 5 * prep];
            
        } else if (rotationRatio > 0.1 && rotationRatio < 0.85) {
            // Phase 2: 공중에서 턱 자세
            const phaseT = (rotationRatio - 0.1) / 0.75;
            tuckFactor = Math.sin(phaseT * Math.PI * 0.8);
            
            // 다리
            rotations["LEFT_UPLEG"] = [30 + (90 * tuckFactor), 0, -5];
            rotations["RIGHT_UPLEG"] = [30 + (90 * tuckFactor), 0, 5];
            rotations["LEFT_LEG"] = [45 + (115 * tuckFactor), 0, 0];
            rotations["RIGHT_LEG"] = [45 + (115 * tuckFactor), 0, 0];
            
            // 어깨 - 턱 자세에서 앞으로 감싸는 동작
            rotations["LEFT_SHOULDER"] = [10 + (40 * tuckFactor), -10 * tuckFactor, -5 - (10 * tuckFactor)];
            rotations["RIGHT_SHOULDER"] = [10 + (40 * tuckFactor), 10 * tuckFactor, 5 + (10 * tuckFactor)];
            
            // 팔 - 무릎을 감싸는 동작
            rotations["LEFT_ARM"] = [-15 + (115 * tuckFactor), 15 - (25 * tuckFactor), -10 + (50 * tuckFactor)];
            rotations["RIGHT_ARM"] = [-15 + (115 * tuckFactor), -15 + (25 * tuckFactor), 10 - (50 * tuckFactor)];
            rotations["LEFT_FOREARM"] = [20 + (70 * tuckFactor), -15 * tuckFactor, 0];
            rotations["RIGHT_FOREARM"] = [20 + (70 * tuckFactor), 15 * tuckFactor, 0];
            
            // 손 - 무릎을 잡는 자세
            rotations["LEFT_HAND"] = [10 + (30 * tuckFactor), -10 * tuckFactor, -5 - (15 * tuckFactor)];
            rotations["RIGHT_HAND"] = [10 + (30 * tuckFactor), 10 * tuckFactor, 5 + (15 * tuckFactor)];
            
            // 손가락 - 움켜쥐는 동작
            const fingerCurl = 25 * tuckFactor;
            // 엄지
            rotations["LEFT_THUMB1"] = [0, 0, fingerCurl];
            rotations["LEFT_THUMB2"] = [fingerCurl * 0.8, 0, 0];
            rotations["LEFT_THUMB3"] = [fingerCurl * 0.6, 0, 0];
            rotations["RIGHT_THUMB1"] = [0, 0, -fingerCurl];
            rotations["RIGHT_THUMB2"] = [fingerCurl * 0.8, 0, 0];
            rotations["RIGHT_THUMB3"] = [fingerCurl * 0.6, 0, 0];
            
            // 검지, 중지, 약지, 새끼
            const fingers = ["INDEX", "MIDDLE", "RING", "PINKY"];
            fingers.forEach(finger => {
                rotations[`LEFT_${finger}1`] = [fingerCurl * 0.7, 0, 0];
                rotations[`LEFT_${finger}2`] = [fingerCurl * 1.2, 0, 0];
                rotations[`LEFT_${finger}3`] = [fingerCurl * 0.9, 0, 0];
                rotations[`RIGHT_${finger}1`] = [fingerCurl * 0.7, 0, 0];
                rotations[`RIGHT_${finger}2`] = [fingerCurl * 1.2, 0, 0];
                rotations[`RIGHT_${finger}3`] = [fingerCurl * 0.9, 0, 0];
            });
            
            // 척추
            rotations["SPINE"] = [25 * tuckFactor, 0, 0];
            rotations["SPINE1"] = [20 * tuckFactor, 0, 0];
            rotations["NECK"] = [15 * tuckFactor, 0, 0];
            
        } else if (rotationRatio >= 0.85 || heightRatio < 0.2) {
            // Phase 3: 착지 준비
            const phaseT = Math.max((rotationRatio - 0.85) / 0.15, (0.2 - heightRatio) / 0.2);
            const landing = this.easeOut(Math.min(phaseT, 1.0));
            tuckFactor = Math.max(0, 1 - landing);
            
            // 다리
            rotations["LEFT_UPLEG"] = [120 * tuckFactor, 0, -5 * tuckFactor];
            rotations["RIGHT_UPLEG"] = [120 * tuckFactor, 0, 5 * tuckFactor];
            rotations["LEFT_LEG"] = [160 * tuckFactor, 0, 0];
            rotations["RIGHT_LEG"] = [160 * tuckFactor, 0, 0];
            
            // 어깨 - 균형 잡기 위해 옆으로 벌림
            rotations["LEFT_SHOULDER"] = [50 * tuckFactor + (-20 * landing), -10 * tuckFactor, -15 * tuckFactor + (25 * landing)];
            rotations["RIGHT_SHOULDER"] = [50 * tuckFactor + (-20 * landing), 10 * tuckFactor, 15 * tuckFactor + (-25 * landing)];
            
            // 팔 - 균형을 위해 벌리는 동작
            rotations["LEFT_ARM"] = [100 * tuckFactor + (-15 * landing), -10 * tuckFactor + (5 * landing), 40 * tuckFactor + (-30 * landing)];
            rotations["RIGHT_ARM"] = [100 * tuckFactor + (-15 * landing), 10 * tuckFactor + (-5 * landing), -40 * tuckFactor + (30 * landing)];
            rotations["LEFT_FOREARM"] = [90 * tuckFactor + (-30 * landing), -15 * tuckFactor, 0];
            rotations["RIGHT_FOREARM"] = [90 * tuckFactor + (-30 * landing), 15 * tuckFactor, 0];
            
            // 손 - 착지 준비로 자연스럽게
            rotations["LEFT_HAND"] = [40 * tuckFactor + (-35 * landing), -10 * tuckFactor + (5 * landing), -20 * tuckFactor + (15 * landing)];
            rotations["RIGHT_HAND"] = [40 * tuckFactor + (-35 * landing), 10 * tuckFactor + (-5 * landing), 20 * tuckFactor + (-15 * landing)];
            
            // 손가락 - 자연스럽게 펴짐
            const fingerRelax = 25 * tuckFactor * (1 - landing);
            // 엄지
            rotations["LEFT_THUMB1"] = [0, 0, fingerRelax];
            rotations["LEFT_THUMB2"] = [fingerRelax * 0.8, 0, 0];
            rotations["LEFT_THUMB3"] = [fingerRelax * 0.6, 0, 0];
            rotations["RIGHT_THUMB1"] = [0, 0, -fingerRelax];
            rotations["RIGHT_THUMB2"] = [fingerRelax * 0.8, 0, 0];
            rotations["RIGHT_THUMB3"] = [fingerRelax * 0.6, 0, 0];
            
            // 나머지 손가락들
            const fingers = ["INDEX", "MIDDLE", "RING", "PINKY"];
            fingers.forEach(finger => {
                rotations[`LEFT_${finger}1`] = [fingerRelax * 0.7, 0, 0];
                rotations[`LEFT_${finger}2`] = [fingerRelax * 1.2, 0, 0];
                rotations[`LEFT_${finger}3`] = [fingerRelax * 0.9, 0, 0];
                rotations[`RIGHT_${finger}1`] = [fingerRelax * 0.7, 0, 0];
                rotations[`RIGHT_${finger}2`] = [fingerRelax * 1.2, 0, 0];
                rotations[`RIGHT_${finger}3`] = [fingerRelax * 0.9, 0, 0];
            });
            
            // 척추
            rotations["SPINE"] = [25 * tuckFactor, 0, 0];
            rotations["SPINE1"] = [20 * tuckFactor, 0, 0];
            rotations["NECK"] = [15 * tuckFactor, 0, 0];
        }

        rotations["HIPS"][0] = globalRotationX;
        translations["HIPS"] = [forwardMotion, hipsY, 0];

        return { rotations, translations };
    }

    backFlipAnimation(progress) {
        const rotations = { ...this.baseRotations };
        const translations = { ...this.baseTranslations };

        const earthJumpHeight = 1.2;
        const earthInitialVelocity = Math.sqrt(2 * 9.8 * earthJumpHeight);

        const currentJumpHeight = (earthInitialVelocity * earthInitialVelocity) / (2 * Math.max(this.gravity, 0.01));
        const totalFlightTime = (2 * earthInitialVelocity) / Math.max(this.gravity, 0.01);

        const currentTime = progress * totalFlightTime;

        let hipsY = Math.max(0, earthInitialVelocity * currentTime - 0.5 * this.gravity * currentTime * currentTime);

        const backwardMotion = -0.03 * Math.sin(progress * Math.PI);

        let globalRotationX = 0;

        if (hipsY > 0.01) {
            const airborneStart = earthInitialVelocity / Math.max(this.gravity, 0.01) - Math.sqrt((earthInitialVelocity * earthInitialVelocity) - (2 * this.gravity * 0.01)) / Math.max(this.gravity, 0.01);
            const airborneEnd = earthInitialVelocity / Math.max(this.gravity, 0.01) + Math.sqrt((earthInitialVelocity * earthInitialVelocity) - (2 * this.gravity * 0.01)) / Math.max(this.gravity, 0.01);
            
            if (currentTime >= airborneStart && currentTime <= airborneEnd) {
                const airborneProgress = (currentTime - airborneStart) / (airborneEnd - airborneStart);
                globalRotationX = -Math.min(airborneProgress * 360, 360);
            } else if (currentTime > airborneEnd) {
                globalRotationX = -360;
            }
        }

        let tuckFactor = 0;

        const heightRatio = hipsY / currentJumpHeight;
        const rotationRatio = Math.abs(globalRotationX) / 360;
        
        if (heightRatio < 0.15 && rotationRatio < 0.1) {
            // Phase 1: 준비 및 이륙
            const phaseT = Math.min(heightRatio / 0.15, rotationRatio / 0.1);
            const prep = this.easeOut(phaseT);

            // 다리
            rotations["LEFT_UPLEG"] = [20 * prep, 0, -3];
            rotations["RIGHT_UPLEG"] = [20 * prep, 0, 3];
            rotations["LEFT_LEG"] = [30 * prep, 0, 0];
            rotations["RIGHT_LEG"] = [30 * prep, 0, 0];
            
            // 어깨 - 백플립 준비로 뒤로 젖히는 동작
            rotations["LEFT_SHOULDER"] = [-15 * prep, 0, -8 * prep];
            rotations["RIGHT_SHOULDER"] = [-15 * prep, 0, 8 * prep];
            
            // 팔 - 뒤로 젖히면서 추진력 생성
            rotations["LEFT_ARM"] = [30 * prep, 20 * prep, -15];
            rotations["RIGHT_ARM"] = [30 * prep, -20 * prep, 15];
            rotations["LEFT_FOREARM"] = [-10 * prep, 0, 0];
            rotations["RIGHT_FOREARM"] = [-10 * prep, 0, 0];
            
            // 손 - 젖히는 동작에 맞춰
            rotations["LEFT_HAND"] = [-15 * prep, 0, -10 * prep];
            rotations["RIGHT_HAND"] = [-15 * prep, 0, 10 * prep];
            
            // 척추
            rotations["SPINE"] = [-10 * prep, 0, 0];
            
        } else if (rotationRatio > 0.1 && rotationRatio < 0.85) {
            // Phase 2: 공중에서 턱 자세
            const phaseT = (rotationRatio - 0.1) / 0.75;
            tuckFactor = Math.sin(phaseT * Math.PI * 0.8);

            // 다리
            rotations["LEFT_UPLEG"] = [20 + (100 * tuckFactor), 0, -5];
            rotations["RIGHT_UPLEG"] = [20 + (100 * tuckFactor), 0, 5];
            rotations["LEFT_LEG"] = [30 + (130 * tuckFactor), 0, 0];
            rotations["RIGHT_LEG"] = [30 + (130 * tuckFactor), 0, 0];

            // 어깨 - 턱 자세에서 더 감싸는 동작
            rotations["LEFT_SHOULDER"] = [-15 + (65 * tuckFactor), -15 * tuckFactor, -8 - (12 * tuckFactor)];
            rotations["RIGHT_SHOULDER"] = [-15 + (65 * tuckFactor), 15 * tuckFactor, 8 + (12 * tuckFactor)];

            // 팔 - 무릎을 감싸는 동작 (백플립용)
            rotations["LEFT_ARM"] = [30 + (70 * tuckFactor), 20 - (35 * tuckFactor), -15 + (30 * tuckFactor)];
            rotations["RIGHT_ARM"] = [30 + (70 * tuckFactor), -20 + (35 * tuckFactor), 15 - (30 * tuckFactor)];
            rotations["LEFT_FOREARM"] = [-10 + (90 * tuckFactor), -10 * tuckFactor, 0];
            rotations["RIGHT_FOREARM"] = [-10 + (90 * tuckFactor), 10 * tuckFactor, 0];
            
            // 손 - 무릎 쪽으로 향하게
            rotations["LEFT_HAND"] = [-15 + (55 * tuckFactor), -15 * tuckFactor, -10 - (10 * tuckFactor)];
            rotations["RIGHT_HAND"] = [-15 + (55 * tuckFactor), 15 * tuckFactor, 10 + (10 * tuckFactor)];
            
            // 손가락 - 움켜쥐는 동작
            const fingerCurl = 25 * tuckFactor;
            // 엄지
            rotations["LEFT_THUMB1"] = [0, 0, fingerCurl];
            rotations["LEFT_THUMB2"] = [fingerCurl * 0.8, 0, 0];
            rotations["LEFT_THUMB3"] = [fingerCurl * 0.6, 0, 0];
            rotations["RIGHT_THUMB1"] = [0, 0, -fingerCurl];
            rotations["RIGHT_THUMB2"] = [fingerCurl * 0.8, 0, 0];
            rotations["RIGHT_THUMB3"] = [fingerCurl * 0.6, 0, 0];
            
            // 검지, 중지, 약지, 새끼
            const fingers = ["INDEX", "MIDDLE", "RING", "PINKY"];
            fingers.forEach(finger => {
                rotations[`LEFT_${finger}1`] = [fingerCurl * 0.7, 0, 0];
                rotations[`LEFT_${finger}2`] = [fingerCurl * 1.2, 0, 0];
                rotations[`LEFT_${finger}3`] = [fingerCurl * 0.9, 0, 0];
                rotations[`RIGHT_${finger}1`] = [fingerCurl * 0.7, 0, 0];
                rotations[`RIGHT_${finger}2`] = [fingerCurl * 1.2, 0, 0];
                rotations[`RIGHT_${finger}3`] = [fingerCurl * 0.9, 0, 0];
            });
            
            // 척추
            rotations["SPINE"] = [-10 + (35 * tuckFactor), 0, 0];
            rotations["SPINE1"] = [15 * tuckFactor, 0, 0];
            rotations["NECK"] = [10 * tuckFactor, 0, 0];
            
        } else if (rotationRatio >= 0.85 || heightRatio < 0.2) {
            // Phase 3: 착지 준비
            const phaseT = Math.max((rotationRatio - 0.85) / 0.15, (0.2 - heightRatio) / 0.2);
            const landing = this.easeOut(Math.min(phaseT, 1.0));
            tuckFactor = Math.max(0, 1 - landing);

            // 다리
            rotations["LEFT_UPLEG"] = [120 * tuckFactor + (15 * landing), 0, -5 * tuckFactor];
            rotations["RIGHT_UPLEG"] = [120 * tuckFactor + (15 * landing), 0, 5 * tuckFactor];
            rotations["LEFT_LEG"] = [160 * tuckFactor + (25 * landing), 0, 0];
            rotations["RIGHT_LEG"] = [160 * tuckFactor + (25 * landing), 0, 0];
            
            // 어깨 - 착지 시 균형잡기
            rotations["LEFT_SHOULDER"] = [50 * tuckFactor + (-25 * landing), -15 * tuckFactor + (10 * landing), -20 * tuckFactor + (30 * landing)];
            rotations["RIGHT_SHOULDER"] = [50 * tuckFactor + (-25 * landing), 15 * tuckFactor + (-10 * landing), 20 * tuckFactor + (-30 * landing)];
            
            // 팔 - 균형을 위한 벌림
            rotations["LEFT_ARM"] = [100 * tuckFactor + (10 * landing), -15 * tuckFactor + (10 * landing), 15 * tuckFactor + (-10 * landing)];
            rotations["RIGHT_ARM"] = [100 * tuckFactor + (10 * landing), 15 * tuckFactor + (-10 * landing), -15 * tuckFactor + (10 * landing)];
            rotations["LEFT_FOREARM"] = [80 * tuckFactor + (-40 * landing), -10 * tuckFactor + (5 * landing), 0];
            rotations["RIGHT_FOREARM"] = [80 * tuckFactor + (-40 * landing), 10 * tuckFactor + (-5 * landing), 0];
            
            // 손 - 착지 준비 자세
            rotations["LEFT_HAND"] = [40 * tuckFactor + (-25 * landing), -15 * tuckFactor + (10 * landing), -20 * tuckFactor + (15 * landing)];
            rotations["RIGHT_HAND"] = [40 * tuckFactor + (-25 * landing), 15 * tuckFactor + (-10 * landing), 20 * tuckFactor + (-15 * landing)];
            
            // 손가락 - 자연스럽게 펴짐
            const fingerRelax = 25 * tuckFactor * (1 - landing);
            // 엄지
            rotations["LEFT_THUMB1"] = [0, 0, fingerRelax];
            rotations["LEFT_THUMB2"] = [fingerRelax * 0.8, 0, 0];
            rotations["LEFT_THUMB3"] = [fingerRelax * 0.6, 0, 0];
            rotations["RIGHT_THUMB1"] = [0, 0, -fingerRelax];
            rotations["RIGHT_THUMB2"] = [fingerRelax * 0.8, 0, 0];
            rotations["RIGHT_THUMB3"] = [fingerRelax * 0.6, 0, 0];
            
            // 나머지 손가락들
            const fingers = ["INDEX", "MIDDLE", "RING", "PINKY"];
            fingers.forEach(finger => {
                rotations[`LEFT_${finger}1`] = [fingerRelax * 0.7, 0, 0];
                rotations[`LEFT_${finger}2`] = [fingerRelax * 1.2, 0, 0];
                rotations[`LEFT_${finger}3`] = [fingerRelax * 0.9, 0, 0];
                rotations[`RIGHT_${finger}1`] = [fingerRelax * 0.7, 0, 0];
                rotations[`RIGHT_${finger}2`] = [fingerRelax * 1.2, 0, 0];
                rotations[`RIGHT_${finger}3`] = [fingerRelax * 0.9, 0, 0];
            });
            
            // 척추
            rotations["SPINE"] = [25 * tuckFactor - (5 * landing), 0, 0];
            rotations["SPINE1"] = [15 * tuckFactor, 0, 0];
            rotations["NECK"] = [10 * tuckFactor, 0, 0];
        }

        rotations["HIPS"][0] = globalRotationX;
        translations["HIPS"] = [backwardMotion, hipsY, 0];

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
    FRONT_FLIP: 'frontFlip',
    BACK_FLIP: 'backFlip',
    GREETING: 'greeting'
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