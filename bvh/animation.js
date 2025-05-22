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
        this.previousRotations = { ...this.baseRotations };
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
            "RIGHT_THUMBE4": [0, 0, 0],
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

    // 부드러운 보간을 위한 이징 함수들
    easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    easeIn(t) {
        return t * t * t;
    }

    // 우주복의 부피감을 고려한 제약 함수
    applySpacesuitConstraints(rotations) {
        const constrainedRotations = { ...rotations };
        
        // 우주복으로 인한 관절 가동범위 제한
        const constraints = {
            "LEFT_ARM": [-120, 80, -60, 60, -90, 90],  // [minX, maxX, minY, maxY, minZ, maxZ]
            "RIGHT_ARM": [-120, 80, -60, 60, -90, 90],
            "LEFT_FOREARM": [0, 140, -30, 30, -45, 45],
            "RIGHT_FOREARM": [0, 140, -30, 30, -45, 45],
            "LEFT_UPLEG": [-90, 90, -45, 45, -30, 30],
            "RIGHT_UPLEG": [-90, 90, -45, 45, -30, 30],
            "SPINE": [-45, 45, -30, 30, -25, 25],
            "SPINE1": [-30, 30, -20, 20, -15, 15],
            "NECK": [-60, 60, -45, 45, -30, 30]
        };

        for (const [joint, constraint] of Object.entries(constraints)) {
            if (constrainedRotations[joint]) {
                constrainedRotations[joint] = [
                    Math.max(constraint[0], Math.min(constraint[1], constrainedRotations[joint][0])),
                    Math.max(constraint[2], Math.min(constraint[3], constrainedRotations[joint][1])),
                    Math.max(constraint[4], Math.min(constraint[5], constrainedRotations[joint][2]))
                ];
            }
        }

        return constrainedRotations;
    }

    setGravity(gravity) {
        this.gravity = gravity;
    }

    getGravityMultiplier() {
        if (this.gravity === 0) return 0.1; // 무중력에서 더 느린 움직임
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
        if (!this.isPlaying || !this.currentAnimation) return;

        this.animationTime += deltaTime;
        const progress = Math.min(this.animationTime / this.animationDuration, 1.0);

        if (progress >= 1.0) {
            if (this.loops) {
                this.animationTime = 0;
            } else {
                this.isPlaying = false;
                this.currentAnimation = null;
                return this.baseRotations;
            }
        }

        const rotations = this.calculateAnimationFrame(progress);
        return this.applySpacesuitConstraints(rotations);
    }

    calculateAnimationFrame(progress) {
        switch (this.currentAnimation) {
            case 'frontFlip':
                return this.frontFlipAnimation(progress);
            case 'backFlip':
                return this.backFlipAnimation(progress);
            case 'jump':
                return this.jumpAnimation(progress);
            case 'walk':
                return this.walkAnimation(progress);
            case 'moonWalk':
                return this.moonWalkAnimation(progress);
            case 'zeroGFloat':
                return this.zeroGFloatAnimation(progress);
            case 'sample':
                return this.sampleAnimation(progress);
            case 'examine':
                return this.examineAnimation(progress);
            default:
                return this.baseRotations;
        }
    }

    frontFlipAnimation(progress) {
        const gravityMult = this.getGravityMultiplier();
        const rotations = { ...this.baseRotations };

        // 4단계로 세분화된 애니메이션
        let phase = 0;
        let phaseProgress = 0;

        if (progress < 0.15) {
            phase = 0; // 준비 단계
            phaseProgress = progress / 0.15;
        } else if (progress < 0.3) {
            phase = 1; // 점프 시작
            phaseProgress = (progress - 0.15) / 0.15;
        } else if (progress < 0.75) {
            phase = 2; // 공중 회전
            phaseProgress = (progress - 0.3) / 0.45;
        } else {
            phase = 3; // 착지
            phaseProgress = (progress - 0.75) / 0.25;
        }

        switch (phase) {
            case 0: // 준비 - 웅크리기
                const prepIntensity = this.easeInOut(phaseProgress);
                const crouchAngle = prepIntensity * 25;
                
                rotations["SPINE"] = [-crouchAngle * 1.2, 0, 0];
                rotations["SPINE1"] = [-crouchAngle * 0.8, 0, 0];
                rotations["SPINE2"] = [-crouchAngle * 0.6, 0, 0];
                rotations["LEFT_UPLEG"] = [crouchAngle * 2, 0, -5];
                rotations["RIGHT_UPLEG"] = [crouchAngle * 2, 0, 5];
                rotations["LEFT_LEG"] = [crouchAngle * 2.5, 0, 0];
                rotations["RIGHT_LEG"] = [crouchAngle * 2.5, 0, 0];
                
                // 팔의 준비 동작
                rotations["LEFT_ARM"] = [-20 - crouchAngle, 0, -25];
                rotations["RIGHT_ARM"] = [-20 - crouchAngle, 0, 25];
                rotations["LEFT_FOREARM"] = [crouchAngle * 2, 0, 0];
                rotations["RIGHT_FOREARM"] = [crouchAngle * 2, 0, 0];
                
                // 머리와 목의 자연스러운 움직임
                rotations["NECK"] = [crouchAngle * 0.5, 0, 0];
                rotations["HEAD"] = [crouchAngle * 0.3, 0, 0];
                break;

            case 1: // 점프 시작
                const launchIntensity = this.easeOut(phaseProgress);
                const explosiveForce = launchIntensity * 40;
                
                // 폭발적인 신체 확장
                rotations["SPINE"] = [explosiveForce * 0.5, Math.sin(phaseProgress * Math.PI) * 5, 0];
                rotations["SPINE1"] = [explosiveForce * 0.3, 0, 0];
                rotations["LEFT_UPLEG"] = [-explosiveForce * 0.8, 0, -8];
                rotations["RIGHT_UPLEG"] = [-explosiveForce * 0.8, 0, 8];
                rotations["LEFT_LEG"] = [-explosiveForce * 0.6, 0, 0];
                rotations["RIGHT_LEG"] = [-explosiveForce * 0.6, 0, 0];
                
                // 팔의 추진 동작
                rotations["LEFT_ARM"] = [-80 + explosiveForce, 0, -40];
                rotations["RIGHT_ARM"] = [-80 + explosiveForce, 0, 40];
                rotations["LEFT_FOREARM"] = [20, 0, 0];
                rotations["RIGHT_FOREARM"] = [20, 0, 0];
                break;

            case 2: // 공중 회전
                const spinIntensity = this.easeInOut(phaseProgress);
                const flipRotation = spinIntensity * 360 * gravityMult;
                const bodyWave = Math.sin(phaseProgress * Math.PI * 3) * 10;
                
                // 주요 회전
                rotations["HIPS"] = [flipRotation, bodyWave * 0.3, 0];
                rotations["SPINE"] = [flipRotation * 0.4 + bodyWave, Math.sin(phaseProgress * Math.PI * 2) * 8, 0];
                rotations["SPINE1"] = [flipRotation * 0.3, bodyWave * 0.5, 0];
                rotations["SPINE2"] = [flipRotation * 0.2, -bodyWave * 0.3, 0];
                
                // 다리의 공중 자세
                const legTuck = Math.sin(phaseProgress * Math.PI) * 80;
                rotations["LEFT_UPLEG"] = [60 + legTuck, Math.sin(phaseProgress * Math.PI * 2) * 15, -10];
                rotations["RIGHT_UPLEG"] = [60 + legTuck, -Math.sin(phaseProgress * Math.PI * 2) * 15, 10];
                rotations["LEFT_LEG"] = [100 + Math.sin(phaseProgress * Math.PI) * 30, 0, 0];
                rotations["RIGHT_LEG"] = [100 + Math.sin(phaseProgress * Math.PI) * 30, 0, 0];
                
                // 팔의 균형 동작
                const armBalance = Math.sin(phaseProgress * Math.PI * 2) * 25;
                rotations["LEFT_ARM"] = [-60 + armBalance, Math.sin(phaseProgress * Math.PI * 3) * 20, -50];
                rotations["RIGHT_ARM"] = [-60 - armBalance, -Math.sin(phaseProgress * Math.PI * 3) * 20, 50];
                rotations["LEFT_FOREARM"] = [80 + Math.sin(phaseProgress * Math.PI * 4) * 15, 0, 0];
                rotations["RIGHT_FOREARM"] = [80 - Math.sin(phaseProgress * Math.PI * 4) * 15, 0, 0];
                
                // 머리의 자연스러운 추종
                rotations["NECK"] = [-flipRotation * 0.1 + bodyWave * 0.5, Math.sin(phaseProgress * Math.PI) * 8, 0];
                rotations["HEAD"] = [bodyWave * 0.3, -Math.sin(phaseProgress * Math.PI) * 5, 0];
                break;

            case 3: // 착지
                const landIntensity = this.easeOut(1 - phaseProgress);
                const impact = landIntensity * 35 * gravityMult;
                const damping = Math.sin(phaseProgress * Math.PI) * 0.6;
                
                // 충격 흡수 자세
                rotations["SPINE"] = [impact * 0.8, Math.sin(phaseProgress * Math.PI * 2) * 3, 0];
                rotations["SPINE1"] = [impact * 0.6, 0, 0];
                rotations["LEFT_UPLEG"] = [impact * 1.5, 0, -5];
                rotations["RIGHT_UPLEG"] = [impact * 1.5, 0, 5];
                rotations["LEFT_LEG"] = [impact * 1.8, 0, 0];
                rotations["RIGHT_LEG"] = [impact * 1.8, 0, 0];
                
                // 균형 회복을 위한 팔 동작
                rotations["LEFT_ARM"] = [impact * 0.4 - 20, Math.sin(phaseProgress * Math.PI) * 15, -20];
                rotations["RIGHT_ARM"] = [impact * 0.4 - 20, -Math.sin(phaseProgress * Math.PI) * 15, 20];
                rotations["LEFT_FOREARM"] = [30 * damping, 0, 0];
                rotations["RIGHT_FOREARM"] = [30 * damping, 0, 0];
                
                // 발목의 충격 흡수
                rotations["LEFT_FOOT"] = [-impact * 0.3, 0, 0];
                rotations["RIGHT_FOOT"] = [-impact * 0.3, 0, 0];
                break;
        }

        return rotations;
    }

    backFlipAnimation(progress) {
        const gravityMult = this.getGravityMultiplier();
        const rotations = { ...this.baseRotations };
        
        let phase = 0;
        let phaseProgress = 0;
        
        if (progress < 0.15) {
            phase = 0;
            phaseProgress = progress / 0.15;
        } else if (progress < 0.3) {
            phase = 1;
            phaseProgress = (progress - 0.15) / 0.15;
        } else if (progress < 0.75) {
            phase = 2;
            phaseProgress = (progress - 0.3) / 0.45;
        } else {
            phase = 3;
            phaseProgress = (progress - 0.75) / 0.25;
        }

        switch (phase) {
            case 0: // 준비 - 뒤로 기울이며 웅크리기
                const prepIntensity = this.easeInOut(phaseProgress);
                const backwardLean = prepIntensity * 30;
                
                rotations["SPINE"] = [backwardLean, 0, 0];
                rotations["SPINE1"] = [backwardLean * 0.8, Math.sin(phaseProgress * Math.PI) * 3, 0];
                rotations["SPINE2"] = [backwardLean * 0.6, 0, 0];
                rotations["LEFT_UPLEG"] = [-backwardLean * 0.5, 0, -8];
                rotations["RIGHT_UPLEG"] = [-backwardLean * 0.5, 0, 8];
                rotations["LEFT_LEG"] = [backwardLean * 1.5, 0, 0];
                rotations["RIGHT_LEG"] = [backwardLean * 1.5, 0, 0];
                
                // 팔을 뒤로 젖히는 준비 동작
                rotations["LEFT_ARM"] = [40 + backwardLean, 0, -45];
                rotations["RIGHT_ARM"] = [40 + backwardLean, 0, 45];
                rotations["LEFT_FOREARM"] = [20, 0, 0];
                rotations["RIGHT_FOREARM"] = [20, 0, 0];
                
                rotations["NECK"] = [-backwardLean * 0.3, 0, 0];
                rotations["HEAD"] = [-backwardLean * 0.5, 0, 0];
                break;

            case 1: // 후방 점프 시작
                const launchIntensity = this.easeOut(phaseProgress);
                const backwardForce = launchIntensity * 45;
                
                rotations["SPINE"] = [-backwardForce * 0.3, Math.sin(phaseProgress * Math.PI) * 8, 0];
                rotations["SPINE1"] = [-backwardForce * 0.2, 0, 0];
                rotations["LEFT_UPLEG"] = [backwardForce, 0, -10];
                rotations["RIGHT_UPLEG"] = [backwardForce, 0, 10];
                rotations["LEFT_LEG"] = [-backwardForce * 0.8, 0, 0];
                rotations["RIGHT_LEG"] = [-backwardForce * 0.8, 0, 0];
                
                // 추진력을 위한 팔 동작
                rotations["LEFT_ARM"] = [70 + backwardForce * 0.5, Math.sin(phaseProgress * Math.PI) * 20, -60];
                rotations["RIGHT_ARM"] = [70 + backwardForce * 0.5, -Math.sin(phaseProgress * Math.PI) * 20, 60];
                rotations["LEFT_FOREARM"] = [40, 0, 0];
                rotations["RIGHT_FOREARM"] = [40, 0, 0];
                break;

            case 2: // 후방 회전
                const spinIntensity = this.easeInOut(phaseProgress);
                const backFlipRotation = -spinIntensity * 360 * gravityMult;
                const bodyUndulation = Math.sin(phaseProgress * Math.PI * 2.5) * 12;
                
                rotations["HIPS"] = [backFlipRotation, bodyUndulation * 0.4, 0];
                rotations["SPINE"] = [backFlipRotation * 0.4 - bodyUndulation, Math.sin(phaseProgress * Math.PI * 3) * 10, 0];
                rotations["SPINE1"] = [backFlipRotation * 0.3, -bodyUndulation * 0.5, 0];
                rotations["SPINE2"] = [backFlipRotation * 0.2, bodyUndulation * 0.3, 0];

                // 다리를 몸쪽으로 당기는 동작
                const legTuck = Math.sin(phaseProgress * Math.PI) * 90;
                rotations["LEFT_UPLEG"] = [-80 - legTuck, Math.sin(phaseProgress * Math.PI * 3) * 12, -15];
                rotations["RIGHT_UPLEG"] = [-80 - legTuck, -Math.sin(phaseProgress * Math.PI * 3) * 12, 15];
                rotations["LEFT_LEG"] = [110 + Math.sin(phaseProgress * Math.PI) * 25, 0, 0];
                rotations["RIGHT_LEG"] = [110 + Math.sin(phaseProgress * Math.PI) * 25, 0, 0];

                // 팔의 균형과 추진 동작
                const armGesture = Math.sin(phaseProgress * Math.PI * 2) * 30;
                rotations["LEFT_ARM"] = [70 + armGesture, Math.sin(phaseProgress * Math.PI * 4) * 25, -70];
                rotations["RIGHT_ARM"] = [70 - armGesture, -Math.sin(phaseProgress * Math.PI * 4) * 25, 70];
                rotations["LEFT_FOREARM"] = [90 + Math.sin(phaseProgress * Math.PI * 3) * 20, 0, 0];
                rotations["RIGHT_FOREARM"] = [90 - Math.sin(phaseProgress * Math.PI * 3) * 20, 0, 0];

                // 머리의 자연스러운 회전 추종
                rotations["NECK"] = [-backFlipRotation * 0.15 + bodyUndulation * 0.6, Math.sin(phaseProgress * Math.PI * 2) * 6, 0];
                rotations["HEAD"] = [bodyUndulation * 0.4, -Math.sin(phaseProgress * Math.PI * 2) * 4, 0];
                break;

            case 3: // 착지
                const landIntensity = this.easeOut(1 - phaseProgress);
                const backwardImpact = landIntensity * 40 * gravityMult;
                const stabilization = Math.sin(phaseProgress * Math.PI) * 0.7;
                
                rotations["SPINE"] = [-backwardImpact * 0.5, Math.sin(phaseProgress * Math.PI * 3) * 4, 0];
                rotations["SPINE1"] = [-backwardImpact * 0.3, 0, 0];
                rotations["LEFT_UPLEG"] = [backwardImpact * 1.2, 0, -8];
                rotations["RIGHT_UPLEG"] = [backwardImpact * 1.2, 0, 8];
                rotations["LEFT_LEG"] = [backwardImpact * 1.6, 0, 0];
                rotations["RIGHT_LEG"] = [backwardImpact * 1.6, 0, 0];
                
                // 균형 회복을 위한 팔 동작
                rotations["LEFT_ARM"] = [-backwardImpact * 0.3, Math.sin(phaseProgress * Math.PI * 2) * 12, -30];
                rotations["RIGHT_ARM"] = [-backwardImpact * 0.3, -Math.sin(phaseProgress * Math.PI * 2) * 12, 30];
                rotations["LEFT_FOREARM"] = [40 * stabilization, 0, 0];
                rotations["RIGHT_FOREARM"] = [40 * stabilization, 0, 0];
                
                rotations["LEFT_FOOT"] = [-backwardImpact * 0.4, 0, 0];
                rotations["RIGHT_FOOT"] = [-backwardImpact * 0.4, 0, 0];
                break;
        }

        return rotations;
    }

    jumpAnimation(progress) {
        const gravityMult = this.getGravityMultiplier();
        const rotations = { ...this.baseRotations };
        
        let phase = 0;
        let phaseProgress = 0;
        
        if (progress < 0.25) {
            phase = 0; // 준비
            phaseProgress = progress / 0.25;
        } else if (progress < 0.4) {
            phase = 1; // 점프
            phaseProgress = (progress - 0.25) / 0.15;
        } else if (progress < 0.75) {
            phase = 2; // 공중
            phaseProgress = (progress - 0.4) / 0.35;
        } else {
            phase = 3; // 착지
            phaseProgress = (progress - 0.75) / 0.25;
        }

        switch (phase) {
            case 0: // 깊은 웅크림
                const crouchIntensity = this.easeInOut(phaseProgress);
                const deepCrouch = crouchIntensity * 55;
                
                rotations["SPINE"] = [deepCrouch * 0.8, Math.sin(phaseProgress * Math.PI * 2) * 3, 0];
                rotations["SPINE1"] = [deepCrouch * 0.6, 0, 0];
                rotations["SPINE2"] = [deepCrouch * 0.4, 0, 0];
                rotations["LEFT_UPLEG"] = [deepCrouch * 1.6, 0, -10];
                rotations["RIGHT_UPLEG"] = [deepCrouch * 1.6, 0, 10];
                rotations["LEFT_LEG"] = [deepCrouch * 2.2, 0, 0];
                rotations["RIGHT_LEG"] = [deepCrouch * 2.2, 0, 0];
                
                // 팔을 뒤로 젖히는 준비 동작
                rotations["LEFT_ARM"] = [-deepCrouch * 0.6, Math.sin(phaseProgress * Math.PI) * 8, -25];
                rotations["RIGHT_ARM"] = [-deepCrouch * 0.6, -Math.sin(phaseProgress * Math.PI) * 8, 25];
                rotations["LEFT_FOREARM"] = [deepCrouch * 0.8, 0, 0];
                rotations["RIGHT_FOREARM"] = [deepCrouch * 0.8, 0, 0];
                
                rotations["NECK"] = [deepCrouch * 0.4, 0, 0];
                rotations["HEAD"] = [deepCrouch * 0.2, 0, 0];
                
                // 발가락으로 지면을 누르는 동작
                rotations["LEFT_TOEBASE"] = [-deepCrouch * 0.3, 0, 0];
                rotations["RIGHT_TOEBASE"] = [-deepCrouch * 0.3, 0, 0];
                break;

            case 1: // 폭발적 점프
                const explosionIntensity = this.easeOut(phaseProgress);
                const launch = explosionIntensity * 60;
                
                rotations["SPINE"] = [-launch * 0.4, Math.sin(phaseProgress * Math.PI) * 6, 0];
                rotations["SPINE1"] = [-launch * 0.3, 0, 0];
                rotations["LEFT_UPLEG"] = [-launch * 0.7, 0, -5];
                rotations["RIGHT_UPLEG"] = [-launch * 0.7, 0, 5];
                rotations["LEFT_LEG"] = [-launch * 0.5, 0, 0];
                rotations["RIGHT_LEG"] = [-launch * 0.5, 0, 0];
                
                // 위로 뻗는 팔 동작
                rotations["LEFT_ARM"] = [-90 + launch * 0.8, Math.sin(phaseProgress * Math.PI) * 15, -50];
                rotations["RIGHT_ARM"] = [-90 + launch * 0.8, -Math.sin(phaseProgress * Math.PI) * 15, 50];
                rotations["LEFT_FOREARM"] = [20, 0, 0];
                rotations["RIGHT_FOREARM"] = [20, 0, 0];
                
                // 발끝으로 마지막 추진
                rotations["LEFT_FOOT"] = [-launch * 0.6, 0, 0];
                rotations["RIGHT_FOOT"] = [-launch * 0.6, 0, 0];
                rotations["LEFT_TOEBASE"] = [-launch * 0.8, 0, 0];
                rotations["RIGHT_TOEBASE"] = [-launch * 0.8, 0, 0];
                break;

            case 2: // 공중 자세
                const airTime = this.easeInOut(phaseProgress);
                const jumpHeight = Math.sin(airTime * Math.PI) * 40 * (2 - gravityMult);
                const floatGesture = Math.sin(airTime * Math.PI * 1.5) * 15;
                
                rotations["SPINE"] = [-jumpHeight * 0.3 + floatGesture * 0.5, Math.sin(airTime * Math.PI * 2) * 5, 0];
                rotations["SPINE1"] = [-jumpHeight * 0.2, floatGesture * 0.3, 0];
                rotations["SPINE2"] = [-jumpHeight * 0.1, -floatGesture * 0.2, 0];
                
                // 공중에서의 다리 자세
                rotations["LEFT_UPLEG"] = [-jumpHeight * 0.4 + floatGesture, Math.sin(airTime * Math.PI * 3) * 8, -8];
                rotations["RIGHT_UPLEG"] = [-jumpHeight * 0.4 + floatGesture, -Math.sin(airTime * Math.PI * 3) * 8, 8];
                rotations["LEFT_LEG"] = [-jumpHeight * 0.3 + Math.abs(floatGesture), 0, 0];
                rotations["RIGHT_LEG"] = [-jumpHeight * 0.3 + Math.abs(floatGesture), 0, 0];
                
                // 균형을 위한 팔 동작
                rotations["LEFT_ARM"] = [-70 + floatGesture * 2, Math.sin(airTime * Math.PI * 2.5) * 20, -60];
                rotations["RIGHT_ARM"] = [-70 - floatGesture * 2, -Math.sin(airTime * Math.PI * 2.5) * 20, 60];
                rotations["LEFT_FOREARM"] = [45 + Math.sin(airTime * Math.PI * 3) * 15, 0, 0];
                rotations["RIGHT_FOREARM"] = [45 - Math.sin(airTime * Math.PI * 3) * 15, 0, 0];
                
                // 머리의 자연스러운 움직임
                rotations["NECK"] = [floatGesture * 0.4, Math.sin(airTime * Math.PI * 2) * 6, 0];
                rotations["HEAD"] = [-floatGesture * 0.2, -Math.sin(airTime * Math.PI * 2) * 3, 0];
                
                // 무중력에서의 특별한 동작
                if (this.gravity < 1) {
                    const zeroGFloat = Math.sin(airTime * Math.PI * 2) * 8;
                    rotations["LEFT_ARM"] = [-45 + zeroGFloat, Math.sin(airTime * Math.PI * 3) * 25, -70];
                    rotations["RIGHT_ARM"] = [-45 - zeroGFloat, -Math.sin(airTime * Math.PI * 3) * 25, 70];
                    rotations["LEFT_HAND"] = [zeroGFloat, zeroGFloat * 0.5, 0];
                    rotations["RIGHT_HAND"] = [-zeroGFloat, -zeroGFloat * 0.5, 0];
                }
                break;

            case 3: // 착지 및 충격 흡수
                const landIntensity = this.easeOut(1 - phaseProgress);
                const impact = landIntensity * 45 * gravityMult;
                const recovery = Math.sin(phaseProgress * Math.PI) * 0.8;
                
                // 깊은 착지 자세
                rotations["SPINE"] = [impact * 0.9, Math.sin(phaseProgress * Math.PI * 4) * 3, 0];
                rotations["SPINE1"] = [impact * 0.7, 0, 0];
                rotations["SPINE2"] = [impact * 0.5, 0, 0];
                rotations["LEFT_UPLEG"] = [impact * 1.8, 0, -12];
                rotations["RIGHT_UPLEG"] = [impact * 1.8, 0, 12];
                rotations["LEFT_LEG"] = [impact * 2.4, 0, 0];
                rotations["RIGHT_LEG"] = [impact * 2.4, 0, 0];
                
                // 안정화를 위한 팔 동작
                rotations["LEFT_ARM"] = [impact * 0.4 - 15, Math.sin(phaseProgress * Math.PI * 2) * 10, -30];
                rotations["RIGHT_ARM"] = [impact * 0.4 - 15, -Math.sin(phaseProgress * Math.PI * 2) * 10, 30];
                rotations["LEFT_FOREARM"] = [50 * recovery, 0, 0];
                rotations["RIGHT_FOREARM"] = [50 * recovery, 0, 0];
                
                // 발목과 무릎의 충격 흡수
                rotations["LEFT_FOOT"] = [-impact * 0.4, 0, 0];
                rotations["RIGHT_FOOT"] = [-impact * 0.4, 0, 0];
                rotations["LEFT_TOEBASE"] = [impact * 0.2, 0, 0];
                rotations["RIGHT_TOEBASE"] = [impact * 0.2, 0, 0];
                
                // 머리의 안정화
                rotations["NECK"] = [impact * 0.3, Math.sin(phaseProgress * Math.PI) * 4, 0];
                rotations["HEAD"] = [impact * 0.2, 0, 0];
                break;
        }

        return rotations;
    }

    walkAnimation(progress) {
        const gravityMult = this.getGravityMultiplier();
        const rotations = { ...this.baseRotations };

        // 우주복을 입은 상태에서의 걸음걸이 특성 반영
        const spacesuitFactor = 0.7; // 우주복으로 인한 움직임 제한
        const stepCycle = (progress * 2) % 2;
        const isLeftStep = stepCycle < 1;
        const stepProgress = stepCycle % 1;
        const smoothStep = this.easeInOut(stepProgress);

        // 중력에 따른 보폭과 속도 조정
        const stepHeight = 35 * (2 - gravityMult) * spacesuitFactor;
        const armSwing = 45 * Math.min(gravityMult, 1.2) * spacesuitFactor;
        const bodyLean = 12 * Math.min(gravityMult, 1) * spacesuitFactor;
        const hipSway = 8 * spacesuitFactor;

        // 걸음의 리듬감을 위한 다양한 주기
        const primaryRhythm = Math.sin(stepProgress * Math.PI);
        const secondaryRhythm = Math.sin(stepProgress * Math.PI * 2);
        const tertiaryRhythm = Math.sin(stepProgress * Math.PI * 0.5);

        // 상체의 자연스러운 움직임
        const bodyRock = Math.sin(stepProgress * Math.PI * 2) * 4;
        const shoulderTwist = Math.sin(stepProgress * Math.PI) * 6;
        const spineUndulation = Math.sin(stepProgress * Math.PI * 1.5) * 3;
        
        if (isLeftStep) {
            // 왼발 스텝
            const legLift = primaryRhythm * stepHeight;
            const kneeFlexion = Math.sin(stepProgress * Math.PI * 1.2) * stepHeight * 1.8;
            
            rotations["LEFT_UPLEG"] = [-legLift * 0.7 + spineUndulation, Math.sin(stepProgress * Math.PI * 1.5) * 5, -5];
            rotations["LEFT_LEG"] = [kneeFlexion, 0, 0];
            rotations["LEFT_FOOT"] = [-legLift * 0.4 + Math.sin(stepProgress * Math.PI * 2) * 8, 0, 0];
            rotations["LEFT_TOEBASE"] = [Math.max(0, legLift * 0.3), 0, 0];

            // 지지하는 오른발
            rotations["RIGHT_UPLEG"] = [legLift * 0.4 + spineUndulation * 0.5, 0, 8];
            rotations["RIGHT_LEG"] = [Math.max(0, legLift * 0.15), 0, 0];
            rotations["RIGHT_FOOT"] = [legLift * 0.1, 0, 0];

            // 반대편 팔 스윙
            rotations["LEFT_ARM"] = [armSwing * 0.6 * smoothStep, secondaryRhythm * 8, -15 - shoulderTwist];
            rotations["RIGHT_ARM"] = [-armSwing * 0.8 * smoothStep, -secondaryRhythm * 6, 15 + shoulderTwist];
            rotations["LEFT_FOREARM"] = [Math.max(0, armSwing * 0.3), 0, 0];
            rotations["RIGHT_FOREARM"] = [Math.max(0, armSwing * 0.4), 0, 0];

            // 몸통의 자연스러운 비틀림
            rotations["SPINE"] = [bodyRock + spineUndulation, bodyRock * 0.6, bodyLean * 0.4];
            rotations["SPINE1"] = [spineUndulation * 0.7, bodyRock * 0.4, bodyLean * 0.3];
            rotations["SPINE2"] = [spineUndulation * 0.5, bodyRock * 0.2, bodyLean * 0.2];
            rotations["HIPS"] = [bodyRock * 0.3, bodyRock * 0.4 + shoulderTwist * 0.3, -bodyLean * 0.3];
            
            // 어깨의 자연스러운 움직임
            rotations["LEFT_SHOULDER"] = [shoulderTwist * 0.4, armSwing * 0.1, -shoulderTwist * 0.5];
            rotations["RIGHT_SHOULDER"] = [-shoulderTwist * 0.4, -armSwing * 0.1, shoulderTwist * 0.5];
            
        } else {
            // 오른발 스텝
            const legLift = primaryRhythm * stepHeight;
            const kneeFlexion = Math.sin(stepProgress * Math.PI * 1.2) * stepHeight * 1.8;
            
            rotations["RIGHT_UPLEG"] = [-legLift * 0.7 + spineUndulation, -Math.sin(stepProgress * Math.PI * 1.5) * 5, 5];
            rotations["RIGHT_LEG"] = [kneeFlexion, 0, 0];
            rotations["RIGHT_FOOT"] = [-legLift * 0.4 + Math.sin(stepProgress * Math.PI * 2) * 8, 0, 0];
            rotations["RIGHT_TOEBASE"] = [Math.max(0, legLift * 0.3), 0, 0];

            // 지지하는 왼발
            rotations["LEFT_UPLEG"] = [legLift * 0.4 + spineUndulation * 0.5, 0, -8];
            rotations["LEFT_LEG"] = [Math.max(0, legLift * 0.15), 0, 0];
            rotations["LEFT_FOOT"] = [legLift * 0.1, 0, 0];

            // 반대편 팔 스윙
            rotations["RIGHT_ARM"] = [armSwing * 0.6 * smoothStep, -secondaryRhythm * 8, 15 + shoulderTwist];
            rotations["LEFT_ARM"] = [-armSwing * 0.8 * smoothStep, secondaryRhythm * 6, -15 - shoulderTwist];
            rotations["RIGHT_FOREARM"] = [Math.max(0, armSwing * 0.3), 0, 0];
            rotations["LEFT_FOREARM"] = [Math.max(0, armSwing * 0.4), 0, 0];

            // 몸통의 자연스러운 비틀림 (반대 방향)
            rotations["SPINE"] = [bodyRock + spineUndulation, -bodyRock * 0.6, -bodyLean * 0.4];
            rotations["SPINE1"] = [spineUndulation * 0.7, -bodyRock * 0.4, -bodyLean * 0.3];
            rotations["SPINE2"] = [spineUndulation * 0.5, -bodyRock * 0.2, -bodyLean * 0.2];
            rotations["HIPS"] = [bodyRock * 0.3, -bodyRock * 0.4 - shoulderTwist * 0.3, bodyLean * 0.3];
            
            // 어깨의 자연스러운 움직임
            rotations["RIGHT_SHOULDER"] = [shoulderTwist * 0.4, -armSwing * 0.1, shoulderTwist * 0.5];
            rotations["LEFT_SHOULDER"] = [-shoulderTwist * 0.4, armSwing * 0.1, -shoulderTwist * 0.5];
        }

        // 머리와 목의 안정화 (보행 시 자연스러운 균형 유지)
        rotations["NECK"] = [-bodyRock * 0.4 + spineUndulation * 0.2, bodyRock * 0.3, -shoulderTwist * 0.2];
        rotations["HEAD"] = [bodyRock * 0.2, -bodyRock * 0.15, shoulderTwist * 0.1];

        // 무중력에서의 특별한 보행 (떠다니는 듯한 움직임)
        if (this.gravity < 1) {
            const floatFactor = (1 - this.gravity) * 0.6;
            for (let joint in rotations) {
                if (rotations[joint]) {
                    rotations[joint] = rotations[joint].map(angle => angle * (1 - floatFactor * 0.4));
                }
            }
            
            // 무중력에서의 추가적인 팔 움직임
            const floatGesture = Math.sin(progress * Math.PI * 3) * 15 * floatFactor;
            rotations["LEFT_ARM"][0] += floatGesture;
            rotations["RIGHT_ARM"][0] -= floatGesture;
            rotations["LEFT_ARM"][2] -= floatGesture * 0.8;
            rotations["RIGHT_ARM"][2] += floatGesture * 0.8;
        }
        
        return rotations;
    }

    // 새로운 우주 탐사 전용 애니메이션들
    moonWalkAnimation(progress) {
        const gravityMult = this.getGravityMultiplier();
        const rotations = { ...this.baseRotations };
        
        // 달 걸음의 특징: 긴 체공시간, 큰 보폭, 바운싱 효과
        const stepCycle = (progress * 1.5) % 2; // 더 느린 걸음
        const isLeftStep = stepCycle < 1;
        const stepProgress = stepCycle % 1;
        const bounceProgress = this.easeInOut(stepProgress);
        
        const moonBounce = Math.sin(stepProgress * Math.PI) * 60; // 높은 바운스
        const floatTime = Math.sin(stepProgress * Math.PI * 0.8) * 40; // 긴 체공
        const armFloat = Math.sin(stepProgress * Math.PI * 1.2) * 25;
        
        if (isLeftStep) {
            rotations["LEFT_UPLEG"] = [-moonBounce * 0.5, Math.sin(stepProgress * Math.PI * 2) * 8, -10];
            rotations["LEFT_LEG"] = [moonBounce * 1.2, 0, 0];
            rotations["LEFT_FOOT"] = [-moonBounce * 0.3, 0, 0];
            
            rotations["RIGHT_UPLEG"] = [moonBounce * 0.3, 0, 10];
            rotations["RIGHT_LEG"] = [Math.max(0, moonBounce * 0.2), 0, 0];
            
            // 달 표면에서의 균형을 위한 팔 동작
            rotations["LEFT_ARM"] = [armFloat, Math.sin(stepProgress * Math.PI * 3) * 15, -30 - armFloat];
            rotations["RIGHT_ARM"] = [-armFloat * 1.5, -Math.sin(stepProgress * Math.PI * 3) * 10, 40 + armFloat];
            
        } else {
            rotations["RIGHT_UPLEG"] = [-moonBounce * 0.5, -Math.sin(stepProgress * Math.PI * 2) * 8, 10];
            rotations["RIGHT_LEG"] = [moonBounce * 1.2, 0, 0];
            rotations["RIGHT_FOOT"] = [-moonBounce * 0.3, 0, 0];
            
            rotations["LEFT_UPLEG"] = [moonBounce * 0.3, 0, -10];
            rotations["LEFT_LEG"] = [Math.max(0, moonBounce * 0.2), 0, 0];
            
            rotations["RIGHT_ARM"] = [armFloat, -Math.sin(stepProgress * Math.PI * 3) * 15, 30 + armFloat];
            rotations["LEFT_ARM"] = [-armFloat * 1.5, Math.sin(stepProgress * Math.PI * 3) * 10, -40 - armFloat];
        }
        
        // 몸통의 낮은 중력 적응
        const bodyFloat = Math.sin(stepProgress * Math.PI) * 8;
        rotations["SPINE"] = [bodyFloat, Math.sin(stepProgress * Math.PI * 2) * 4, 0];
        rotations["SPINE1"] = [bodyFloat * 0.7, 0, 0];
        rotations["HIPS"] = [bodyFloat * 0.5, Math.sin(stepProgress * Math.PI * 1.5) * 3, 0];
        
        // 머리의 자연스러운 움직임
        rotations["NECK"] = [-bodyFloat * 0.3, Math.sin(stepProgress * Math.PI * 2) * 3, 0];
        rotations["HEAD"] = [bodyFloat * 0.2, 0, 0];
        
        return rotations;
    }

    zeroGFloatAnimation(progress) {
        const rotations = { ...this.baseRotations };
        
        // 무중력에서의 자연스러운 떠다니는 움직임
        const floatCycle = progress * Math.PI * 2;
        const slowWave = Math.sin(progress * Math.PI * 0.8);
        const mediumWave = Math.sin(progress * Math.PI * 1.5);
        const fastWave = Math.sin(progress * Math.PI * 3);
        
        // 몸통의 물결치는 움직임
        rotations["SPINE"] = [slowWave * 8, mediumWave * 5, fastWave * 3];
        rotations["SPINE1"] = [slowWave * 6, mediumWave * 3, -fastWave * 2];
        rotations["SPINE2"] = [slowWave * 4, mediumWave * 2, fastWave * 1.5];
        rotations["HIPS"] = [slowWave * 3, mediumWave * 4, -fastWave * 2];
        
        // 팔의 우아한 떠다니는 움직임
        rotations["LEFT_ARM"] = [-30 + slowWave * 20, mediumWave * 25, -60 + fastWave * 15];
        rotations["RIGHT_ARM"] = [-30 - slowWave * 20, -mediumWave * 25, 60 - fastWave * 15];
        rotations["LEFT_FOREARM"] = [45 + mediumWave * 20, fastWave * 8, 0];
        rotations["RIGHT_FOREARM"] = [45 - mediumWave * 20, -fastWave * 8, 0];
        
        // 손목과 손가락의 세밀한 움직임
        rotations["LEFT_HAND"] = [fastWave * 12, mediumWave * 8, slowWave * 5];
        rotations["RIGHT_HAND"] = [-fastWave * 12, -mediumWave * 8, -slowWave * 5];
        
        // 다리의 자유로운 움직임
        rotations["LEFT_UPLEG"] = [slowWave * 15, mediumWave * 12, -10 + fastWave * 8];
        rotations["RIGHT_UPLEG"] = [-slowWave * 15, -mediumWave * 12, 10 - fastWave * 8];
        rotations["LEFT_LEG"] = [30 + mediumWave * 25, fastWave * 6, 0];
        rotations["RIGHT_LEG"] = [30 - mediumWave * 25, -fastWave * 6, 0];
        rotations["LEFT_FOOT"] = [slowWave * 10, mediumWave * 8, 0];
        rotations["RIGHT_FOOT"] = [-slowWave * 10, -mediumWave * 8, 0];
        
        // 머리의 자연스러운 움직임
        rotations["NECK"] = [mediumWave * 6, slowWave * 8, fastWave * 4];
        rotations["HEAD"] = [-mediumWave * 4, -slowWave * 5, -fastWave * 2];
        
        return rotations;
    }

    sampleAnimation(progress) {
        const rotations = { ...this.baseRotations };
        
        // 샘플 채취 동작 (4단계)
        let phase = 0;
        let phaseProgress = 0;
        
        if (progress < 0.3) {
            phase = 0; // 접근
            phaseProgress = progress / 0.3;
        } else if (progress < 0.6) {
            phase = 1; // 웅크리기
            phaseProgress = (progress - 0.3) / 0.3;
        } else if (progress < 0.8) {
            phase = 2; // 샘플링
            phaseProgress = (progress - 0.6) / 0.2;
        } else {
            phase = 3; // 일어서기
            phaseProgress = (progress - 0.8) / 0.2;
        }
        
        const intensity = this.easeInOut(phaseProgress);
        
        switch (phase) {
            case 0: // 샘플 지점으로 접근
                const approachLean = intensity * 20;
                rotations["SPINE"] = [approachLean, 0, 0];
                rotations["SPINE1"] = [approachLean * 0.7, 0, 0];
                rotations["LEFT_ARM"] = [-approachLean, Math.sin(phaseProgress * Math.PI) * 10, -20];
                rotations["RIGHT_ARM"] = [-approachLean, -Math.sin(phaseProgress * Math.PI) * 8, 25];
                rotations["NECK"] = [approachLean * 0.5, Math.sin(phaseProgress * Math.PI * 2) * 3, 0];
                break;
                
            case 1: // 웅크려서 샘플에 접근
                const crouchIntensity = intensity * 60;
                rotations["SPINE"] = [crouchIntensity * 0.8, 0, 0];
                rotations["SPINE1"] = [crouchIntensity * 0.6, 0, 0];
                rotations["LEFT_UPLEG"] = [crouchIntensity * 1.5, 0, -10];
                rotations["RIGHT_UPLEG"] = [crouchIntensity * 1.5, 0, 10];
                rotations["LEFT_LEG"] = [crouchIntensity * 2, 0, 0];
                rotations["RIGHT_LEG"] = [crouchIntensity * 2, 0, 0];
                
                // 한 손으로 균형, 다른 손으로 샘플링 준비
                rotations["LEFT_ARM"] = [-crouchIntensity * 0.3, 0, -30];
                rotations["RIGHT_ARM"] = [-crouchIntensity * 0.8, Math.sin(phaseProgress * Math.PI) * 15, 40];
                rotations["RIGHT_FOREARM"] = [crouchIntensity * 0.8, 0, 0];
                
                rotations["NECK"] = [crouchIntensity * 0.6, 0, 0];
                rotations["HEAD"] = [crouchIntensity * 0.4, Math.sin(phaseProgress * Math.PI * 3) * 5, 0];
                break;
                
            case 2: // 정밀한 샘플 채취 동작
                const sampleMotion = Math.sin(phaseProgress * Math.PI * 6) * 5;
                const precision = intensity * 45;
                
                rotations["SPINE"] = [precision * 0.8, sampleMotion * 0.5, 0];
                rotations["LEFT_UPLEG"] = [precision * 1.5, 0, -10];
                rotations["RIGHT_UPLEG"] = [precision * 1.5, 0, 10];
                rotations["LEFT_LEG"] = [precision * 2, 0, 0];
                rotations["RIGHT_LEG"] = [precision * 2, 0, 0];
                
                // 정밀 작업을 위한 팔 동작
                rotations["LEFT_ARM"] = [-precision * 0.3, sampleMotion, -30];
                rotations["RIGHT_ARM"] = [-precision * 0.9, sampleMotion * 2, 50];
                rotations["RIGHT_FOREARM"] = [precision * 0.9 + sampleMotion * 3, sampleMotion * 2, 0];
                rotations["RIGHT_HAND"] = [sampleMotion * 4, sampleMotion * 2, sampleMotion];
                
                // 집중하는 머리 자세
                rotations["NECK"] = [precision * 0.7, sampleMotion * 0.3, 0];
                rotations["HEAD"] = [precision * 0.5 + sampleMotion, sampleMotion * 0.5, 0];
                break;
                
            case 3: // 샘플 확인 후 일어서기
                const riseIntensity = (1 - intensity) * 45;
                rotations["SPINE"] = [riseIntensity * 0.6, 0, 0];
                rotations["SPINE1"] = [riseIntensity * 0.4, 0, 0];
                rotations["LEFT_UPLEG"] = [riseIntensity * 1.2, 0, -8];
                rotations["RIGHT_UPLEG"] = [riseIntensity * 1.2, 0, 8];
                rotations["LEFT_LEG"] = [riseIntensity * 1.5, 0, 0];
                rotations["RIGHT_LEG"] = [riseIntensity * 1.5, 0, 0];
                
                // 샘플을 들어올리는 동작
                rotations["LEFT_ARM"] = [-riseIntensity * 0.2, 0, -25];
                rotations["RIGHT_ARM"] = [-40 + riseIntensity * 0.5, Math.sin(phaseProgress * Math.PI) * 8, 30];
                rotations["RIGHT_FOREARM"] = [60 + Math.sin(phaseProgress * Math.PI) * 10, 0, 0];
                
                rotations["NECK"] = [riseIntensity * 0.3, 0, 0];
                rotations["HEAD"] = [riseIntensity * 0.2, Math.sin(phaseProgress * Math.PI) * 3, 0];
                break;
        }
        
        return rotations;
    }

    examineAnimation(progress) {
        const rotations = { ...this.baseRotations };
        
        // 관찰 및 조사 동작 (호기심 많은 우주비행사의 탐사 자세)
        const examineWave = Math.sin(progress * Math.PI * 2);
        const detailFocus = Math.sin(progress * Math.PI * 4);
        const curiosityGesture = Math.sin(progress * Math.PI * 1.5);
        
        // 기본 관찰 자세 - 약간 앞으로 숙인 자세
        const baseExamine = 25;
        rotations["SPINE"] = [baseExamine + examineWave * 8, curiosityGesture * 5, 0];
        rotations["SPINE1"] = [baseExamine * 0.7 + examineWave * 5, curiosityGesture * 3, 0];
        rotations["SPINE2"] = [baseExamine * 0.5 + examineWave * 3, -curiosityGesture * 2, 0];
        
        // 다리는 안정적인 탐사 자세
        rotations["LEFT_UPLEG"] = [baseExamine * 0.8, 0, -8];
        rotations["RIGHT_UPLEG"] = [baseExamine * 0.8, 0, 8];
        rotations["LEFT_LEG"] = [baseExamine * 0.6, 0, 0];
        rotations["RIGHT_LEG"] = [baseExamine * 0.6, 0, 0];
        
        // 양손으로 대상을 자세히 관찰하는 동작
        rotations["LEFT_ARM"] = [-40 + examineWave * 15, detailFocus * 12, -35 + curiosityGesture * 10];
        rotations["RIGHT_ARM"] = [-45 + examineWave * 12, -detailFocus * 10, 40 + curiosityGesture * 8];
        rotations["LEFT_FOREARM"] = [50 + detailFocus * 20, examineWave * 5, 0];
        rotations["RIGHT_FOREARM"] = [55 + detailFocus * 18, -examineWave * 4, 0];
        
        // 손목의 세밀한 움직임 (정밀 관찰)
        rotations["LEFT_HAND"] = [detailFocus * 8, examineWave * 6, curiosityGesture * 4];
        rotations["RIGHT_HAND"] = [-detailFocus * 6, -examineWave * 5, -curiosityGesture * 3];
        
        // 집중하며 관찰하는 머리와 목의 움직임
        rotations["NECK"] = [baseExamine * 0.8 + detailFocus * 6, examineWave * 8, curiosityGesture * 3];
        rotations["HEAD"] = [baseExamine * 0.5 + detailFocus * 4, -examineWave * 5, -curiosityGesture * 2];
        
        // 어깨의 자연스러운 움직임
        rotations["LEFT_SHOULDER"] = [examineWave * 3, detailFocus * 4, -curiosityGesture * 2];
        rotations["RIGHT_SHOULDER"] = [-examineWave * 2, -detailFocus * 3, curiosityGesture * 2];
        
        return rotations;
    }

    // 부드러운 애니메이션 전환을 위한 보간 함수
    interpolateRotations(from, to, factor) {
        const result = {};
        
        for (const joint in from) {
            if (to[joint]) {
                result[joint] = [
                    from[joint][0] + (to[joint][0] - from[joint][0]) * factor,
                    from[joint][1] + (to[joint][1] - from[joint][1]) * factor,
                    from[joint][2] + (to[joint][2] - from[joint][2]) * factor
                ];
            } else {
                result[joint] = [...from[joint]];
            }
        }
        
        return result;
    }

    applyAnimationToTree(node, rotations) {
        if (!node || !rotations) return;
        
        if (rotations[node.name]) {
            const [x, y, z] = rotations[node.name];
            node.rotation = vec3(
                x * Math.PI / 180, // degrees to radians
                y * Math.PI / 180,
                z * Math.PI / 180
            );
        }
        
        if (node.child) this.applyAnimationToTree(node.child, rotations);
        if (node.sibling) this.applyAnimationToTree(node.sibling, rotations);
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
    const rotations = animationSystem.updateAnimation(deltaTime);
    if (rotations) {
        animationSystem.applyAnimationToTree(rootNode, rotations);
    }
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
    JUMP: 'jump',
    WALK: 'walk',
    MOON_WALK: 'moonWalk',      // 달 걷기
    ZERO_G_FLOAT: 'zeroGFloat', // 무중력 떠다니기
    SAMPLE: 'sample',           // 샘플 채취
    EXAMINE: 'examine'          // 관찰 및 조사
};

// 편의 함수들
function playMoonWalk(duration = 4000, loops = true) {
    playAnimation(ANIMATION_TYPES.MOON_WALK, duration, loops);
}

function playZeroGFloat(duration = 6000, loops = true) {
    playAnimation(ANIMATION_TYPES.ZERO_G_FLOAT, duration, loops);
}

function playSampleCollection(duration = 3000, loops = false) {
    playAnimation(ANIMATION_TYPES.SAMPLE, duration, loops);
}

function playExamination(duration = 4000, loops = true) {
    playAnimation(ANIMATION_TYPES.EXAMINE, duration, loops);
}

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

// 애니메이션 시퀀스 관리
class AnimationSequence {
    constructor() {
        this.sequence = [];
        this.currentIndex = 0;
        this.isPlaying = false;
    }
    
    addAnimation(type, duration, loops = false, delay = 0) {
        this.sequence.push({ type, duration, loops, delay });
        return this;
    }
    
    play() {
        if (this.sequence.length === 0) return;
        this.currentIndex = 0;
        this.isPlaying = true;
        this.playNext();
    }
    
    playNext() {
        if (this.currentIndex >= this.sequence.length) {
            this.isPlaying = false;
            return;
        }
        
        const current = this.sequence[this.currentIndex];
        
        setTimeout(() => {
            playAnimation(current.type, current.duration, current.loops);
            
            if (!current.loops) {
                setTimeout(() => {
                    this.currentIndex++;
                    this.playNext();
                }, current.duration);
            }
        }, current.delay);
    }
    
    stop() {
        this.isPlaying = false;
        this.currentIndex = 0;
    }
    
    clear() {
        this.sequence = [];
        this.currentIndex = 0;
        this.isPlaying = false;
    }
}

// 사용 예시를 위한 사전 정의된 시퀀스들
function createExplorationSequence() {
    return new AnimationSequence()
        .addAnimation(ANIMATION_TYPES.WALK, 2000)
        .addAnimation(ANIMATION_TYPES.EXAMINE, 3000, false, 500)
        .addAnimation(ANIMATION_TYPES.SAMPLE, 2500, false, 200)
        .addAnimation(ANIMATION_TYPES.WALK, 2000, false, 300);
}

function createMoonExplorationSequence() {
    setSpaceEnvironment('moon');
    return new AnimationSequence()
        .addAnimation(ANIMATION_TYPES.MOON_WALK, 3000)
        .addAnimation(ANIMATION_TYPES.JUMP, 2000, false, 500)
        .addAnimation(ANIMATION_TYPES.EXAMINE, 4000, false, 300)
        .addAnimation(ANIMATION_TYPES.SAMPLE, 3000, false, 200);
}

function createZeroGSequence() {
    setSpaceEnvironment('zerog');
    return new AnimationSequence()
        .addAnimation(ANIMATION_TYPES.ZERO_G_FLOAT, 4000)
        .addAnimation(ANIMATION_TYPES.EXAMINE, 3000, false, 1000)
        .addAnimation(ANIMATION_TYPES.ZERO_G_FLOAT, 3000, false, 500);
}