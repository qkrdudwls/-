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

        this.accumulatePosition = vec3(0, 0, 0);
        this.walkingDirection = vec3(0, 0, 1);
        this.walkSpeed = 1.0;
        this.runSpeed = 2.0;
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
        
        // 각 애니메이션 타입별 적절한 지속시간 설정
        if (animationType === 'frontFlip' || animationType === 'backFlip') {
            const earthInitialVelocity = Math.sqrt(2 * 9.8 * 1.2); 
            const totalFlightTime = (2 * earthInitialVelocity) / Math.max(this.gravity, 0.01);
            this.animationDuration = totalFlightTime * 1000;
        } else if (animationType === 'jump') {
            const earthJumpHeight = 0.8; 
            const earthInitialVelocity = Math.sqrt(2 * 9.8 * earthJumpHeight);
            const totalFlightTime = (2 * earthInitialVelocity) / Math.max(this.gravity, 0.01);
            this.animationDuration = totalFlightTime * 1000;
        } else if (animationType === 'walk') {
            this.animationDuration = duration || 3000;
        } else if (animationType === 'run') {
            this.animationDuration = duration || 2000;
        } else if (animationType === 'spaceWalk') {
            const earthStepDuration = 0.8; 
            const gravityFactor = Math.max(this.gravity, 0.01) / 9.8;
            const spaceStepDuration = earthStepDuration / Math.sqrt(gravityFactor);
            const stepsPerAnimation = 4;
            this.animationDuration = spaceStepDuration * stepsPerAnimation * 1000;
        } else {
            this.animationDuration = duration || 2000;
        }

        if (animationType === 'walk' || animationType === 'run' || animationType === 'spaceWalk' || animationType === 'spaceRun') {
            if (!this.accumulatePosition) {
                this.accumulatePosition = [0, 0, 0];
            }
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
                
                // 이동 애니메이션이 끝날 때는 누적 위치를 영구적으로 업데이트
                if (['walk', 'run', 'spaceWalk'].includes(this.currentAnimation)) {
                    // 최종 위치 계산
                    const finalResult = this.calculateAnimationFrame(1.0);
                    if (finalResult.translations && finalResult.translations["HIPS"]) {
                        // 현재 애니메이션에서의 상대적 이동량만 누적에 추가
                        const stepDistance = this.currentAnimation.includes('space') ? 
                            (this.currentAnimation === 'spaceWalk' ? this.walkSpeed * 0.025 : this.runSpeed * 0.04) :
                            (this.currentAnimation === 'walk' ? this.walkSpeed * 0.02 : this.runSpeed * 0.03);
                        
                        const stepFrequency = this.currentAnimation.includes('space') ?
                            (this.currentAnimation === 'spaceWalk' ? 1.5 : 2.2) :
                            (this.currentAnimation === 'walk' ? 2 : 3);
                        
                        const totalDistance = stepDistance * stepFrequency;
                        const deltaX = totalDistance * this.walkingDirection[0];
                        const deltaZ = totalDistance * this.walkingDirection[2];
                        
                        // 누적 위치에 이동량 추가 (영구적으로 적용)
                        this.accumulatePosition[0] += deltaX;
                        this.accumulatePosition[2] += deltaZ;
                    }
                    
                    this.currentAnimation = null;
                    
                    // 기본 자세로 돌아가되 누적된 위치는 영구 유지
                    return { 
                        rotations: { ...this.baseRotations }, 
                        translations: {
                            ...this.baseTranslations,
                            "HIPS": [
                                this.accumulatePosition[0], 
                                this.currentAnimation && this.currentAnimation.includes('space') ? 0.05 : 0, 
                                this.accumulatePosition[2]
                            ]
                        }
                    };
                } else {
                    this.currentAnimation = null;
                    return { 
                        rotations: { ...this.baseRotations }, 
                        translations: { 
                            ...this.baseTranslations,
                            "HIPS": [this.accumulatePosition[0], 0, this.accumulatePosition[2]]
                        }
                    };
                }
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
            case 'walk':
                return this.walkAnimation(progress);
            case 'run':
                return this.runAnimation(progress);
            case 'jump':
                return this.jumpAnimation(progress);
            case 'spaceWalk':
                return this.spaceWalkAnimation(progress);
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

    setWalkingDirection(x, y, z) {
        const length = Math.sqrt(x*x + y*y + z*z);
        if (length > 0) this.walkingDirection = vec3(x / length, y / length, z / length);
    }

    setMovementSpeed(walkSpeed, runSpeed) {
        this.walkSpeed = walkSpeed;
        this.runSpeed = runSpeed;
    }

    getCurrentPosition() {
        return vec3(this.accumulatePosition[0], this.accumulatePosition[1], this.accumulatePosition[2]);
    }

    resetPosition() {
        this.accumulatePosition = vec3(0, 0, 0);
    }

    // walkAnimation 함수 - 자연스러운 걷기 동작
    walkAnimation(progress) {
        const rotations = { ...this.baseRotations };
        const translations = { ...this.baseTranslations };

        // 부드러운 시작/끝을 위한 이징
        let easedProgress = progress;
        if (progress < 0.1) {
            // 처음 10%는 부드럽게 시작
            easedProgress = this.easeOut(progress / 0.1) * 0.1;
        } else if (progress > 0.9) {
            // 마지막 10%는 부드럽게 끝
            const endPhase = (progress - 0.9) / 0.1;
            easedProgress = 0.9 + this.easeIn(endPhase) * 0.1;
        }

        // 중력에 따른 걸음 속도 조정 (낮은 중력일수록 느리게)
        const gravityFactor = this.getGravityMultiplier();
        const stepFrequency = 2 * gravityFactor; // 기본 2걸음 per cycle
        const stepProgress = (easedProgress * stepFrequency) % 1.0;
        
        // 걸음 주기 (0~0.5: 왼발 앞, 0.5~1.0: 오른발 앞)
        const isLeftStep = stepProgress < 0.5;
        const phaseProgress = isLeftStep ? stepProgress * 2 : (stepProgress - 0.5) * 2;
        
        // 시작/끝 단계에서 동작 강도 조절
        let intensityMultiplier = 1.0;
        if (progress < 0.1) {
            intensityMultiplier = progress / 0.1;
        } else if (progress > 0.9) {
            intensityMultiplier = (1.0 - progress) / 0.1;
        }
        
        // 걸음의 높낮이 (사인파로 자연스러운 보행)
        const bobHeight = 0.02 * Math.sin(easedProgress * Math.PI * stepFrequency * 2) * intensityMultiplier;
        const swayX = 0.01 * Math.sin(easedProgress * Math.PI * stepFrequency) * intensityMultiplier;
        
        // 다리 동작
        const legLift = 25 * intensityMultiplier; // 다리 들어올리는 각도
        const legSwing = 20 * intensityMultiplier; // 다리 앞뒤 스윙
        
        if (isLeftStep) {
            // 왼발이 앞으로
            const leftLift = Math.sin(phaseProgress * Math.PI) * legLift;
            const leftSwing = (phaseProgress - 0.5) * legSwing;
            const rightSwing = -(phaseProgress - 0.5) * legSwing * 0.8;
            
            rotations["LEFT_UPLEG"] = [leftSwing, 0, leftLift * 0.1];
            rotations["LEFT_LEG"] = [Math.max(0, leftLift), 0, 0];
            rotations["LEFT_FOOT"] = [-leftLift * 0.3, 0, 0];
            
            rotations["RIGHT_UPLEG"] = [rightSwing, 0, 0];
            rotations["RIGHT_LEG"] = [0, 0, 0];
            rotations["RIGHT_FOOT"] = [0, 0, 0];
        } else {
            // 오른발이 앞으로
            const rightLift = Math.sin(phaseProgress * Math.PI) * legLift;
            const rightSwing = (phaseProgress - 0.5) * legSwing;
            const leftSwing = -(phaseProgress - 0.5) * legSwing * 0.8;
            
            rotations["RIGHT_UPLEG"] = [rightSwing, 0, -rightLift * 0.1];
            rotations["RIGHT_LEG"] = [Math.max(0, rightLift), 0, 0];
            rotations["RIGHT_FOOT"] = [-rightLift * 0.3, 0, 0];
            
            rotations["LEFT_UPLEG"] = [leftSwing, 0, 0];
            rotations["LEFT_LEG"] = [0, 0, 0];
            rotations["LEFT_FOOT"] = [0, 0, 0];
        }
        
        // 팔 동작 (다리와 반대로)
        const armSwing = 15 * intensityMultiplier;
        const armLift = 10 * intensityMultiplier;
        
        if (isLeftStep) {
            // 왼발 앞 -> 오른팔 앞
            const rightArmSwing = Math.sin(phaseProgress * Math.PI) * armSwing;
            const leftArmSwing = -Math.sin(phaseProgress * Math.PI) * armSwing * 0.8;
            
            rotations["RIGHT_SHOULDER"] = [0, 0, 5 * intensityMultiplier];
            rotations["RIGHT_ARM"] = [rightArmSwing, 0, 10 * intensityMultiplier];
            rotations["RIGHT_FOREARM"] = [Math.max(0, rightArmSwing * 0.5), 0, 0];
            
            rotations["LEFT_SHOULDER"] = [0, 0, -5 * intensityMultiplier];
            rotations["LEFT_ARM"] = [leftArmSwing, 0, -10 * intensityMultiplier];
            rotations["LEFT_FOREARM"] = [Math.max(0, -leftArmSwing * 0.5), 0, 0];
        } else {
            // 오른발 앞 -> 왼팔 앞
            const leftArmSwing = Math.sin(phaseProgress * Math.PI) * armSwing;
            const rightArmSwing = -Math.sin(phaseProgress * Math.PI) * armSwing * 0.8;
            
            rotations["LEFT_SHOULDER"] = [0, 0, -5 * intensityMultiplier];
            rotations["LEFT_ARM"] = [leftArmSwing, 0, -10 * intensityMultiplier];
            rotations["LEFT_FOREARM"] = [Math.max(0, leftArmSwing * 0.5), 0, 0];
            
            rotations["RIGHT_SHOULDER"] = [0, 0, 5 * intensityMultiplier];
            rotations["RIGHT_ARM"] = [rightArmSwing, 0, 10 * intensityMultiplier];
            rotations["RIGHT_FOREARM"] = [Math.max(0, -rightArmSwing * 0.5), 0, 0];
        }
        
        // 자연스러운 손 위치
        const fingerRelax = 8;
        ["LEFT", "RIGHT"].forEach(side => {
            rotations[`${side}_HAND`] = [0, 0, 0];
            rotations[`${side}_THUMB1`] = [0, 0, side === "LEFT" ? fingerRelax : -fingerRelax];
            rotations[`${side}_THUMB2`] = [fingerRelax * 0.6, 0, 0];
            
            ["INDEX", "MIDDLE", "RING", "PINKY"].forEach(finger => {
                rotations[`${side}_${finger}1`] = [fingerRelax * 0.4, 0, 0];
                rotations[`${side}_${finger}2`] = [fingerRelax * 0.6, 0, 0];
                rotations[`${side}_${finger}3`] = [fingerRelax * 0.4, 0, 0];
            });
        });
        
        // 상체의 자연스러운 움직임
        rotations["SPINE"] = [0, swayX * 5, 0];
        rotations["SPINE1"] = [0, swayX * 3, 0];
        rotations["NECK"] = [0, -swayX * 2, 0];
        rotations["HEAD"] = [0, 0, 0];
        
        // 앞으로 이동 (걸음에 따른 이동) - 누적 위치 포함
        const stepDistance = this.walkSpeed * 0.02; // 한 스텝당 이동 거리
        const totalDistance = easedProgress * stepDistance * stepFrequency;
        
        // 현재 프레임에서의 이동량 계산
        const currentX = totalDistance * this.walkingDirection[0];
        const currentZ = totalDistance * this.walkingDirection[2];
        
        // 누적 위치에 현재 이동량 추가
        translations["HIPS"] = [
            this.accumulatePosition[0] + currentX, 
            bobHeight, 
            this.accumulatePosition[2] + currentZ
        ];
        
        return { rotations, translations };
    }

    // runAnimation 함수 수정
    runAnimation(progress) {
        const rotations = { ...this.baseRotations };
        const translations = { ...this.baseTranslations };

        // 부드러운 시작/끝을 위한 이징
        let easedProgress = progress;
        if (progress < 0.1) {
            // 처음 10%는 부드럽게 시작
            easedProgress = this.easeOut(progress / 0.1) * 0.1;
        } else if (progress > 0.9) {
            // 마지막 10%는 부드럽게 끝
            const endPhase = (progress - 0.9) / 0.1;
            easedProgress = 0.9 + this.easeIn(endPhase) * 0.1;
        }

        const gravityFactor = this.getGravityMultiplier();
        const stepFrequency = 3 * gravityFactor; // 뛰기는 더 빠른 주기
        const stepProgress = (easedProgress * stepFrequency) % 1.0;
        
        const isLeftStep = stepProgress < 0.5;
        const phaseProgress = isLeftStep ? stepProgress * 2 : (stepProgress - 0.5) * 2;
        
        // 시작/끝 단계에서 동작 강도 조절
        let intensityMultiplier = 1.0;
        if (progress < 0.1) {
            intensityMultiplier = progress / 0.1;
        } else if (progress > 0.9) {
            intensityMultiplier = (1.0 - progress) / 0.1;
        }
        
        // 뛰기의 점프 효과 (더 높은 상하 움직임)
        const jumpHeight = 0.08 * Math.sin(easedProgress * Math.PI * stepFrequency * 2) * gravityFactor * intensityMultiplier;
        const bobHeight = Math.max(0, jumpHeight);
        const swayX = 0.015 * Math.sin(easedProgress * Math.PI * stepFrequency) * intensityMultiplier;
        
        // 더 역동적인 다리 동작
        const legLift = 45 * intensityMultiplier; // 더 높이 들어올림
        const legSwing = 35 * intensityMultiplier; // 더 큰 스윙
        
        if (isLeftStep) {
            const leftLift = Math.sin(phaseProgress * Math.PI) * legLift;
            const leftSwing = (phaseProgress - 0.5) * legSwing;
            const rightSwing = -(phaseProgress - 0.5) * legSwing * 0.7;
            
            rotations["LEFT_UPLEG"] = [leftSwing, 0, leftLift * 0.2];
            rotations["LEFT_LEG"] = [Math.max(0, leftLift * 1.2), 0, 0];
            rotations["LEFT_FOOT"] = [-leftLift * 0.4, 0, 0];
            
            rotations["RIGHT_UPLEG"] = [rightSwing, 0, -5 * intensityMultiplier];
            rotations["RIGHT_LEG"] = [5 * intensityMultiplier, 0, 0];
            rotations["RIGHT_FOOT"] = [0, 0, 0];
        } else {
            const rightLift = Math.sin(phaseProgress * Math.PI) * legLift;
            const rightSwing = (phaseProgress - 0.5) * legSwing;
            const leftSwing = -(phaseProgress - 0.5) * legSwing * 0.7;
            
            rotations["RIGHT_UPLEG"] = [rightSwing, 0, -rightLift * 0.2];
            rotations["RIGHT_LEG"] = [Math.max(0, rightLift * 1.2), 0, 0];
            rotations["RIGHT_FOOT"] = [-rightLift * 0.4, 0, 0];
            
            rotations["LEFT_UPLEG"] = [leftSwing, 0, 5 * intensityMultiplier];
            rotations["LEFT_LEG"] = [5 * intensityMultiplier, 0, 0];
            rotations["LEFT_FOOT"] = [0, 0, 0];
        }
        
        // 더 역동적인 팔 동작
        const armSwing = 25 * intensityMultiplier;
        const armLift = 15 * intensityMultiplier;
        
        if (isLeftStep) {
            const rightArmSwing = Math.sin(phaseProgress * Math.PI) * armSwing;
            const leftArmSwing = -Math.sin(phaseProgress * Math.PI) * armSwing * 0.7;
            
            rotations["RIGHT_SHOULDER"] = [rightArmSwing * 0.3, 0, 8 * intensityMultiplier];
            rotations["RIGHT_ARM"] = [rightArmSwing, rightArmSwing * 0.2, 15 * intensityMultiplier];
            rotations["RIGHT_FOREARM"] = [Math.max(0, rightArmSwing * 0.8), 0, 0];
            
            rotations["LEFT_SHOULDER"] = [leftArmSwing * 0.3, 0, -8 * intensityMultiplier];
            rotations["LEFT_ARM"] = [leftArmSwing, leftArmSwing * 0.2, -15 * intensityMultiplier];
            rotations["LEFT_FOREARM"] = [Math.max(0, -leftArmSwing * 0.8), 0, 0];
        } else {
            const leftArmSwing = Math.sin(phaseProgress * Math.PI) * armSwing;
            const rightArmSwing = -Math.sin(phaseProgress * Math.PI) * armSwing * 0.7;
            
            rotations["LEFT_SHOULDER"] = [leftArmSwing * 0.3, 0, -8 * intensityMultiplier];
            rotations["LEFT_ARM"] = [leftArmSwing, -leftArmSwing * 0.2, -15 * intensityMultiplier];
            rotations["LEFT_FOREARM"] = [Math.max(0, leftArmSwing * 0.8), 0, 0];
            
            rotations["RIGHT_SHOULDER"] = [rightArmSwing * 0.3, 0, 8 * intensityMultiplier];
            rotations["RIGHT_ARM"] = [rightArmSwing, -rightArmSwing * 0.2, 15 * intensityMultiplier];
            rotations["RIGHT_FOREARM"] = [Math.max(0, -rightArmSwing * 0.8), 0, 0];
        }
        
        // 주먹 쥔 자세 (뛸 때)
        const fingerCurl = 15;
        ["LEFT", "RIGHT"].forEach(side => {
            rotations[`${side}_HAND`] = [0, 0, 0];
            rotations[`${side}_THUMB1`] = [0, 0, side === "LEFT" ? fingerCurl : -fingerCurl];
            rotations[`${side}_THUMB2`] = [fingerCurl * 0.8, 0, 0];
            
            ["INDEX", "MIDDLE", "RING", "PINKY"].forEach(finger => {
                rotations[`${side}_${finger}1`] = [fingerCurl * 0.6, 0, 0];
                rotations[`${side}_${finger}2`] = [fingerCurl * 1.0, 0, 0];
                rotations[`${side}_${finger}3`] = [fingerCurl * 0.8, 0, 0];
            });
        });
        
        // 앞으로 기울어진 뛰기 자세
        rotations["SPINE"] = [10 * intensityMultiplier, swayX * 8, 0];
        rotations["SPINE1"] = [5 * intensityMultiplier, swayX * 5, 0];
        rotations["NECK"] = [-5 * intensityMultiplier, -swayX * 3, 0];
        rotations["HEAD"] = [0, 0, 0];
        
        // 더 빠른 이동 - 누적 위치 포함
        const stepDistance = this.runSpeed * 0.03;
        const totalDistance = easedProgress * stepDistance * stepFrequency;
        
        const currentX = totalDistance * this.walkingDirection[0];
        const currentZ = totalDistance * this.walkingDirection[2];
        
        // 누적 위치에 현재 이동량 추가
        translations["HIPS"] = [
            this.accumulatePosition[0] + currentX, 
            bobHeight, 
            this.accumulatePosition[2] + currentZ
        ];
        
        return { rotations, translations };
    }

    // jumpAnimation 함수 - 수직 점프 동작
    jumpAnimation(progress) {
        const rotations = { ...this.baseRotations };
        const translations = { ...this.baseTranslations };

        // 물리적으로 정확한 점프 계산
        const earthJumpHeight = 0.8; // 0.8m 점프
        const earthInitialVelocity = Math.sqrt(2 * 9.8 * earthJumpHeight);
        
        const currentJumpHeight = (earthInitialVelocity * earthInitialVelocity) / (2 * Math.max(this.gravity, 0.01));
        const totalFlightTime = (2 * earthInitialVelocity) / Math.max(this.gravity, 0.01);
        
        const currentTime = progress * totalFlightTime;
        let hipsY = Math.max(0, earthInitialVelocity * currentTime - 0.5 * this.gravity * currentTime * currentTime);
        
        const heightRatio = hipsY / currentJumpHeight;
        
        // 중력에 관계없이 일정한 시간 비율로 Phase 구분
        const prepDuration = 0.3; // 지구 기준 준비 시간 (초)
        const prepPhaseRatio = Math.min(prepDuration / totalFlightTime, 0.3); // 최대 30%까지만
        
        if (progress < prepPhaseRatio) {
            // Phase 1: 점프 준비 (쪼그려 앉기) - 고정된 시간 비율
            const prep = this.easeOut(progress / prepPhaseRatio);
            
            // 다리 - 힘을 모으기 위해 구부림
            rotations["LEFT_UPLEG"] = [45 * prep, 0, -5];
            rotations["RIGHT_UPLEG"] = [45 * prep, 0, 5];
            rotations["LEFT_LEG"] = [85 * prep, 0, 0];
            rotations["RIGHT_LEG"] = [85 * prep, 0, 0];
            rotations["LEFT_FOOT"] = [-20 * prep, 0, 0];
            rotations["RIGHT_FOOT"] = [-20 * prep, 0, 0];
            
            // 팔 - 뒤로 젖혀서 추진력 준비
            rotations["LEFT_SHOULDER"] = [-20 * prep, 0, -10];
            rotations["RIGHT_SHOULDER"] = [-20 * prep, 0, 10];
            rotations["LEFT_ARM"] = [15 * prep, 15 * prep, -20];
            rotations["RIGHT_ARM"] = [15 * prep, -15 * prep, 20];
            rotations["LEFT_FOREARM"] = [10 * prep, 0, 0];
            rotations["RIGHT_FOREARM"] = [10 * prep, 0, 0];
            
            // 상체 - 약간 앞으로 숙임
            rotations["SPINE"] = [15 * prep, 0, 0];
            rotations["SPINE1"] = [10 * prep, 0, 0];
            
            translations["HIPS"] = [
                this.accumulatePosition[0], 
                -0.1 * prep, 
                this.accumulatePosition[2]
            ]; // 살짝 아래로
            
        } else if (hipsY > 0.01) {
            // Phase 2: 공중에서 (이륙 후 ~ 착지 전)
            const airProgress = Math.min(heightRatio, 1.0);
            
            // 다리 - 자연스럽게 약간 구부림
            rotations["LEFT_UPLEG"] = [15, 0, -3];
            rotations["RIGHT_UPLEG"] = [15, 0, 3];
            rotations["LEFT_LEG"] = [25, 0, 0];
            rotations["RIGHT_LEG"] = [25, 0, 0];
            rotations["LEFT_FOOT"] = [-10, 0, 0];
            rotations["RIGHT_FOOT"] = [-10, 0, 0];
            
            // 팔 - 위로 올려서 균형 및 우아함
            const armHeight = 80 * this.easeInOut(airProgress);
            rotations["LEFT_SHOULDER"] = [30, 0, -15];
            rotations["RIGHT_SHOULDER"] = [30, 0, 15];
            rotations["LEFT_ARM"] = [-armHeight, 20, -30];
            rotations["RIGHT_ARM"] = [-armHeight, -20, 30];
            rotations["LEFT_FOREARM"] = [-20, 0, 0];
            rotations["RIGHT_FOREARM"] = [-20, 0, 0];
            
            // 손 - 우아하게 펼침
            rotations["LEFT_HAND"] = [-10, 0, -10];
            rotations["RIGHT_HAND"] = [-10, 0, 10];
            
            // 손가락 - 자연스럽게 펼침
            ["LEFT", "RIGHT"].forEach(side => {
                rotations[`${side}_THUMB1`] = [0, 0, side === "LEFT" ? -15 : 15];
                rotations[`${side}_THUMB2`] = [0, 0, 0];
                
                ["INDEX", "MIDDLE", "RING", "PINKY"].forEach(finger => {
                    rotations[`${side}_${finger}1`] = [0, 0, 0];
                    rotations[`${side}_${finger}2`] = [0, 0, 0];
                    rotations[`${side}_${finger}3`] = [0, 0, 0];
                });
            });
            
            // 상체 - 똑바로 세움
            rotations["SPINE"] = [0, 0, 0];
            rotations["SPINE1"] = [0, 0, 0];
            rotations["NECK"] = [0, 0, 0];
            
            translations["HIPS"] = [
                this.accumulatePosition[0], 
                hipsY, 
                this.accumulatePosition[2]
            ];
            
        } else {
            // Phase 3: 착지 및 안정화
            const landProgress = Math.min((progress - prepPhaseRatio) / (1 - prepPhaseRatio), 1.0);
            const impact = this.easeOut(landProgress);
            
            // 다리 - 착지 충격 흡수
            rotations["LEFT_UPLEG"] = [30 * (1 - impact), 0, -3 * (1 - impact)];
            rotations["RIGHT_UPLEG"] = [30 * (1 - impact), 0, 3 * (1 - impact)];
            rotations["LEFT_LEG"] = [45 * (1 - impact), 0, 0];
            rotations["RIGHT_LEG"] = [45 * (1 - impact), 0, 0];
            rotations["LEFT_FOOT"] = [-15 * (1 - impact), 0, 0];
            rotations["RIGHT_FOOT"] = [-15 * (1 - impact), 0, 0];
            
            // 팔 - 균형 잡기 위해 옆으로
            rotations["LEFT_SHOULDER"] = [30 * (1 - impact) - 10 * impact, 0, -15 - 15 * impact];
            rotations["RIGHT_SHOULDER"] = [30 * (1 - impact) - 10 * impact, 0, 15 + 15 * impact];
            rotations["LEFT_ARM"] = [-80 * (1 - impact) + 10 * impact, 20 * (1 - impact), -30 * (1 - impact) - 20 * impact];
            rotations["RIGHT_ARM"] = [-80 * (1 - impact) + 10 * impact, -20 * (1 - impact), 30 * (1 - impact) + 20 * impact];
            rotations["LEFT_FOREARM"] = [-20 * (1 - impact) + 30 * impact, 0, 0];
            rotations["RIGHT_FOREARM"] = [-20 * (1 - impact) + 30 * impact, 0, 0];
            
            // 손 - 착지 시 자연스러운 위치
            rotations["LEFT_HAND"] = [-10 * (1 - impact), 0, -10 * (1 - impact)];
            rotations["RIGHT_HAND"] = [-10 * (1 - impact), 0, 10 * (1 - impact)];
            
            // 손가락 - 약간 긴장된 상태
            const fingerTension = 5 * impact;
            ["LEFT", "RIGHT"].forEach(side => {
                rotations[`${side}_THUMB1`] = [0, 0, (side === "LEFT" ? -15 : 15) * (1 - impact) + fingerTension];
                rotations[`${side}_THUMB2`] = [fingerTension * 0.8, 0, 0];
                
                ["INDEX", "MIDDLE", "RING", "PINKY"].forEach(finger => {
                    rotations[`${side}_${finger}1`] = [fingerTension * 0.5, 0, 0];
                    rotations[`${side}_${finger}2`] = [fingerTension * 0.8, 0, 0];
                    rotations[`${side}_${finger}3`] = [fingerTension * 0.6, 0, 0];
                });
            });
            
            // 상체 - 착지 충격으로 약간 앞으로
            rotations["SPINE"] = [10 * (1 - impact), 0, 0];
            rotations["SPINE1"] = [5 * (1 - impact), 0, 0];
            rotations["NECK"] = [-5 * (1 - impact), 0, 0];
            
            translations["HIPS"] = [
                this.accumulatePosition[0], 
                Math.max(0, hipsY), 
                this.accumulatePosition[2]
            ];
        }
        
        return { rotations, translations };
    }

    // 우주 공간에서의 걷기 애니메이션 (점프하며 이동)
    spaceWalkAnimation(progress) {
        const rotations = { ...this.baseRotations };
        const translations = { ...this.baseTranslations };

        // 중력에 따른 실제 점프 높이와 체공 시간 계산
        const baseJumpHeight = 0.15; // 기본 점프 높이 (지구 기준)
        const actualJumpHeight = baseJumpHeight * (9.8 / Math.max(this.gravity, 0.01)); // 중력에 반비례
        const earthInitialVelocity = Math.sqrt(2 * this.gravity * actualJumpHeight);
        
        // 현재 중력에서의 체공 시간
        const totalFlightTime = (2 * earthInitialVelocity) / Math.max(this.gravity, 0.01);

        // 자연스러운 시작/끝을 위한 개선된 이징
        let easedProgress = progress;
        const easeInDuration = 0.15;
        const easeOutDuration = 0.15;
        
        if (progress < easeInDuration) {
            easedProgress = this.easeOut(progress / easeInDuration) * easeInDuration;
        } else if (progress > (1 - easeOutDuration)) {
            const endPhase = (progress - (1 - easeOutDuration)) / easeOutDuration;
            easedProgress = (1 - easeOutDuration) + this.easeIn(endPhase) * easeOutDuration;
        }

        // 우주에서의 느린 보행 주기 - 중력에 따라 조정
        const baseStepFrequency = 1.25; // 기본 걸음 주파수 (걸음/초)
        const gravityFactor = Math.max(this.gravity, 0.01) / 9.8;
        const stepFrequency = baseStepFrequency * Math.sqrt(gravityFactor);
        
        // 전체 애니메이션에서의 걸음 수 계산
        const animationTimeSeconds = this.animationDuration / 1000;
        const totalStepsInAnimation = stepFrequency * animationTimeSeconds;
        const currentStepCount = easedProgress * totalStepsInAnimation;
        const currentStepPhase = (currentStepCount % 1.0);
        
        // 걸음 단계 정의
        const isLeftStep = Math.floor(currentStepCount) % 2 === 0;
        const stepPhase = currentStepPhase;
        
        // 동작 강도 조절 - 더 부드러운 시작/끝
        let intensityMultiplier = 1.0;
        if (progress < easeInDuration) {
            intensityMultiplier = this.easeOut(progress / easeInDuration);
        } else if (progress > (1 - easeOutDuration)) {
            const endPhase = (progress - (1 - easeOutDuration)) / easeOutDuration;
            intensityMultiplier = 1.0 - this.easeIn(endPhase);
        }
        
        // 중력 기반 물리적 수직 움직임 계산
        const currentTime = (currentStepPhase * totalFlightTime);
        let physicalHeight = Math.max(0, earthInitialVelocity * currentTime - 0.5 * this.gravity * currentTime * currentTime);
        
        // 기본 부유 높이는 중력에 따라 조정
        const baseFloat = 0.03 + (0.02 * (9.8 / Math.max(this.gravity, 0.01))); // 중력이 낮을수록 더 높게 부유
        const jumpContribution = (physicalHeight / actualJumpHeight) * (0.02 + 0.03 * (9.8 / Math.max(this.gravity, 0.01)));
        const bobHeight = baseFloat + jumpContribution * intensityMultiplier;
        
        // 미세한 좌우 균형 움직임 - 중력에 따라 조정
        const balanceIntensity = Math.sqrt(9.8 / Math.max(this.gravity, 0.01));
        const balanceX = 0.012 * Math.sin(currentStepCount * Math.PI * 0.7) * intensityMultiplier * balanceIntensity;
        const balanceZ = 0.008 * Math.cos(currentStepCount * Math.PI * 0.9) * intensityMultiplier * balanceIntensity;
        
        // 자연스러운 다리 움직임 - 중력에 따라 조정
        const legLiftHeight = 20 * intensityMultiplier * balanceIntensity;
        const legSwingRange = 15 * intensityMultiplier * balanceIntensity;
        const hipSway = 3 * intensityMultiplier * balanceIntensity;
        
        // 착지 감지 및 자연스러운 다리 자세 조정
        const isNearLanding = physicalHeight < (actualJumpHeight * 0.2) && currentStepPhase > 0.6;
        const landingFactor = isNearLanding ? (1 - (physicalHeight / (actualJumpHeight * 0.2))) : 0;
        
        // 걸음 패턴 계산
        const liftCurve = Math.sin(stepPhase * Math.PI);
        const swingCurve = Math.sin(stepPhase * Math.PI * 2) * 0.5;
        
        if (isLeftStep) {
            // 왼발이 움직이는 단계
            const leftLegLift = liftCurve * legLiftHeight * 0.25 + hipSway;
            const leftKneeFlexion = Math.max(0, liftCurve * legLiftHeight * 0.6 - (landingFactor * 10));
            const leftAnkleFlexion = -liftCurve * legLiftHeight * 0.3 + (landingFactor * 5);
            
            rotations["LEFT_UPLEG"] = [
                swingCurve * legSwingRange * 0.8 - (landingFactor * 8),
                0, 
                leftLegLift - (landingFactor * 3)
            ];
            rotations["LEFT_LEG"] = [leftKneeFlexion, 0, 0];
            rotations["LEFT_FOOT"] = [
                leftAnkleFlexion,
                0, 
                liftCurve * 2 - (landingFactor * 1)
            ];
            
            // 오른발 - 지지하는 발
            rotations["RIGHT_UPLEG"] = [
                -swingCurve * legSwingRange * 0.3 + (landingFactor * 3),
                0, 
                -hipSway * 0.4
            ];
            rotations["RIGHT_LEG"] = [3 * intensityMultiplier + (landingFactor * 5), 0, 0];
            rotations["RIGHT_FOOT"] = [2 * intensityMultiplier + (landingFactor * 3), 0, 0];
            
        } else {
            // 오른발이 움직이는 단계
            const rightLegLift = -liftCurve * legLiftHeight * 0.25 - hipSway;
            const rightKneeFlexion = Math.max(0, liftCurve * legLiftHeight * 0.6 - (landingFactor * 10));
            const rightAnkleFlexion = -liftCurve * legLiftHeight * 0.3 + (landingFactor * 5);
            
            rotations["RIGHT_UPLEG"] = [
                swingCurve * legSwingRange * 0.8 - (landingFactor * 8),
                0, 
                rightLegLift + (landingFactor * 3)
            ];
            rotations["RIGHT_LEG"] = [rightKneeFlexion, 0, 0];
            rotations["RIGHT_FOOT"] = [
                rightAnkleFlexion,
                0, 
                -liftCurve * 2 + (landingFactor * 1)
            ];
            
            // 왼발 - 지지하는 발
            rotations["LEFT_UPLEG"] = [
                -swingCurve * legSwingRange * 0.3 + (landingFactor * 3),
                0, 
                hipSway * 0.4
            ];
            rotations["LEFT_LEG"] = [3 * intensityMultiplier + (landingFactor * 5), 0, 0];
            rotations["LEFT_FOOT"] = [2 * intensityMultiplier + (landingFactor * 3), 0, 0];
        }
        
        // 자연스러운 팔 움직임 - 다리와 반대로 움직임, 중력에 따라 조정
        const armSwingRange = 12 * intensityMultiplier * balanceIntensity;
        const armBalance = 6 * intensityMultiplier * balanceIntensity;
        const shoulderFloat = 3 * intensityMultiplier * balanceIntensity;
        
        const armPhase = Math.sin((stepPhase + (isLeftStep ? 0.5 : 0)) * Math.PI);
        
        if (isLeftStep) {
            // 오른팔 (활발한 움직임)
            rotations["RIGHT_SHOULDER"] = [
                armPhase * armSwingRange * 0.3,
                armPhase * armSwingRange * 0.15,
                shoulderFloat
            ];
            rotations["RIGHT_ARM"] = [
                armPhase * armSwingRange * 0.8,
                armPhase * armSwingRange * 0.25,
                10 * intensityMultiplier
            ];
            rotations["RIGHT_FOREARM"] = [
                Math.max(0, armPhase * armSwingRange * 0.4),
                0,
                shoulderFloat
            ];
            
            // 왼팔 (균형 움직임)
            rotations["LEFT_SHOULDER"] = [
                -armPhase * armBalance * 0.25,
                -armPhase * armBalance * 0.15,
                -shoulderFloat * 0.5
            ];
            rotations["LEFT_ARM"] = [
                -armPhase * armBalance * 0.8,
                -armPhase * armBalance * 0.2,
                -8 * intensityMultiplier
            ];
            rotations["LEFT_FOREARM"] = [
                Math.max(0, armPhase * armBalance * 0.3),
                0,
                -shoulderFloat * 0.3
            ];
            
        } else {
            // 왼팔 (활발한 움직임)
            rotations["LEFT_SHOULDER"] = [
                armPhase * armSwingRange * 0.3,
                -armPhase * armSwingRange * 0.15,
                -shoulderFloat
            ];
            rotations["LEFT_ARM"] = [
                armPhase * armSwingRange * 0.8,
                -armPhase * armSwingRange * 0.25,
                -10 * intensityMultiplier
            ];
            rotations["LEFT_FOREARM"] = [
                Math.max(0, armPhase * armSwingRange * 0.4),
                0,
                -shoulderFloat
            ];
            
            // 오른팔 (균형 움직임)
            rotations["RIGHT_SHOULDER"] = [
                -armPhase * armBalance * 0.25,
                armPhase * armBalance * 0.15,
                shoulderFloat * 0.5
            ];
            rotations["RIGHT_ARM"] = [
                -armPhase * armBalance * 0.8,
                armPhase * armBalance * 0.2,
                8 * intensityMultiplier
            ];
            rotations["RIGHT_FOREARM"] = [
                Math.max(0, armPhase * armBalance * 0.3),
                0,
                shoulderFloat * 0.3
            ];
        }
        
        // 자연스러운 손 자세 - 편안하게 반쯤 구부린 상태
        const fingerRelax = 6;
        const thumbSpread = 3;
        ["LEFT", "RIGHT"].forEach(side => {
            rotations[`${side}_HAND`] = [0, 0, 0];
            rotations[`${side}_THUMB1`] = [thumbSpread, 0, side === "LEFT" ? fingerRelax : -fingerRelax];
            rotations[`${side}_THUMB2`] = [fingerRelax * 0.5, 0, 0];
            
            ["INDEX", "MIDDLE", "RING", "PINKY"].forEach((finger, idx) => {
                const spread = thumbSpread * 0.2 * (idx + 1);
                rotations[`${side}_${finger}1`] = [fingerRelax * 0.3, 0, side === "LEFT" ? -spread : spread];
                rotations[`${side}_${finger}2`] = [fingerRelax * 0.5, 0, 0];
                rotations[`${side}_${finger}3`] = [fingerRelax * 0.3, 0, 0];
            });
        });
        
        // 상체의 자연스러운 균형 움직임 - 중력에 따라 조정
        const spineBalance = Math.sin(currentStepCount * Math.PI * 0.5) * 1.5 * intensityMultiplier * balanceIntensity;
        const headCounter = Math.cos(currentStepCount * Math.PI * 0.3) * 1 * intensityMultiplier * balanceIntensity;
        
        rotations["SPINE"] = [spineBalance, balanceX * 2, balanceZ * 1.5];
        rotations["SPINE1"] = [spineBalance * 0.6, balanceX * 1.5, -balanceZ * 0.8];
        rotations["NECK"] = [-spineBalance * 0.3, -balanceX * 0.8, headCounter];
        rotations["HEAD"] = [headCounter * 0.2, headCounter * 0.3, -headCounter * 0.15];
        
        // 중력에 따른 이동 속도 조정
        const stepDistance = this.walkSpeed * 0.012 * Math.sqrt(gravityFactor);
        const totalDistance = currentStepCount * stepDistance;
        
        const currentX = totalDistance * this.walkingDirection[0];
        const currentZ = totalDistance * this.walkingDirection[2];
        
        translations["HIPS"] = [
            this.accumulatePosition[0] + currentX + balanceX,
            bobHeight,
            this.accumulatePosition[2] + currentZ + balanceZ
        ];
        
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
    MERCURY: 3.70,
    VENUS: 8.87,
    EARTH: 9.81,
    MOON: 1.6,
    MARS: 3.71,
    JUPITER: 24.79,
    SATURN: 10.44,
    URANUS: 8.69,
    NEPTUNE: 11.15
};

const ANIMATION_TYPES = {
    GREETING: 'greeting',
    WALK: 'walk',
    RUN: 'run',
    JUMP: 'jump',
    SPACE_WALK: 'spaceWalk',
    FRONT_FLIP: 'frontFlip',
    BACK_FLIP: 'backFlip'
};

function setSpaceEnvironment(environment) {
    switch(environment.toLowerCase()) {
        case 'mercury':
            setGravity(GRAVITY_PRESETS.MERCURY);
            break;
        case 'venus':
            setGravity(GRAVITY_PRESETS.VENUS);
            break;
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
        case 'saturn':
            setGravity(GRAVITY_PRESETS.SATURN);
            break;
        case 'uranus':
            setGravity(GRAVITY_PRESETS.URANUS);
            break;
        case 'neptune':
            setGravity(GRAVITY_PRESETS.NEPTUNE);
            break;
        default:
            setGravity(GRAVITY_PRESETS.EARTH);
    }
}

window.animationSystem = animationSystem;